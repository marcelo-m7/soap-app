import { afterAll, beforeAll, expect, test } from 'bun:test';
import { chromium, type Browser, type Page } from 'playwright';

const soapPort = 31988;
const appPort = 31989;
const soapUrl = `http://localhost:${soapPort}/wsdl`;
let backend: ReturnType<typeof Bun.spawn>;
let frontend: ReturnType<typeof Bun.spawn>;
let browser: Browser;
let page: Page;

beforeAll(async () => {
  backend = Bun.spawn([process.execPath, 'src/index.ts'], {
    cwd: new URL('../../soap-server/', import.meta.url).pathname,
    env: { ...process.env, SOAP_PORT: String(soapPort), SOAP_ALLOWED_ORIGIN: `http://localhost:${appPort}` },
    stdout: 'ignore',
    stderr: 'ignore',
  });
  frontend = Bun.spawn([process.execPath, 'src/index.ts'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, APP_PORT: String(appPort), BUN_PUBLIC_SOAP_URL: soapUrl },
    stdout: 'ignore',
    stderr: 'ignore',
  });

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const responses = await Promise.all([
        fetch(`${soapUrl}?wsdl`),
        fetch(`http://localhost:${appPort}/`),
      ]);
      if (responses.every((response) => response.ok)) break;
    } catch {}
    if (attempt === 59) throw new Error('SOAP and frontend servers did not start');
    await Bun.sleep(100);
  }

  const systemChromium = '/usr/bin/chromium';
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (await Bun.file(systemChromium).exists() ? systemChromium : undefined),
    args: ['--no-sandbox'],
  });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`http://localhost:${appPort}/`);
  await page.getByLabel('Valor a').waitFor();
});

afterAll(async () => {
  await browser?.close();
  frontend?.kill();
  backend?.kill();
});

async function calculate(operation: string, a: string, b: string) {
  await page.getByRole('combobox', { name: 'Operação' }).click();
  await page.getByRole('option', { name: operation }).click();
  await page.getByLabel('Valor a').fill(a);
  await page.getByLabel('Valor b').fill(b);
  await page.getByRole('button', { name: 'Calcular' }).click();
}

test('all SOAP operations display results and both HTTP/XML exchanges', async () => {
  expect(await page.getByRole('link', { name: /WSDL/ }).getAttribute('href')).toBe(`${soapUrl}?wsdl`);
  for (const [operation, a, b, result] of [
    ['Somar', '1.5', '2.25', '3.75'],
    ['Subtrair', '5', '3', '2'],
    ['Multiplicar', '2', '3', '6'],
    ['Dividir', '1', '2', '0.5'],
  ] as const) {
    await calculate(operation, a, b);
    await page.getByText(result, { exact: true }).waitFor();
    const request = await page.getByRole('region', { name: 'Requisição SOAP' }).innerText();
    const response = await page.getByRole('region', { name: 'Resposta SOAP' }).innerText();
    expect(request).toContain(`POST ${soapUrl}`);
    expect(request).toContain('SOAPAction:');
    expect(request).toContain('<soap:Envelope');
    expect(response).toContain('200 OK');
    expect(response).toContain(`<tns:result>${result}</tns:result>`);
  }
});

test('divide by zero displays HTTP 500 and SOAP Fault', async () => {
  await calculate('Dividir', '1', '0');
  await page.getByRole('alert').getByText('divisao por zero').waitFor();
  const response = await page.getByRole('region', { name: 'Resposta SOAP' }).innerText();
  expect(response).toContain('500 Internal Server Error');
  expect(response).toContain('<soap:Fault>');
});

test('malformed XML is shown with a parsing error', async () => {
  await page.route(soapUrl, (route) => route.fulfill({ status: 200, contentType: 'text/xml', body: '<soap:Envelope><invalid>' }));
  await calculate('Somar', '1', '2');
  await page.getByRole('alert').getByText('Resposta XML inválida').waitFor();
  expect(await page.getByRole('region', { name: 'Resposta SOAP' }).innerText()).toContain('<soap:Envelope><invalid>');
  await page.unroute(soapUrl);
});

test('unavailable server still leaves request visible', async () => {
  await page.route(soapUrl, (route) => route.abort());
  await calculate('Somar', '1', '2');
  await page.getByText('Sem resposta').waitFor();
  expect(await page.getByRole('region', { name: 'Requisição SOAP' }).innerText()).toContain('<tns:Add>');
  await page.unroute(soapUrl);
});

test('invalid input is rejected before SOAP request', async () => {
  const requests: string[] = [];
  const recordRequest = (request: { url(): string }) => {
    if (request.url() === soapUrl) requests.push(request.url());
  };
  page.on('request', recordRequest);
  await page.getByLabel('Valor a').fill('1e309');
  await page.getByLabel('Valor b').fill('2');
  await page.getByRole('button', { name: 'Calcular' }).click();
  expect(await page.getByLabel('Valor a').evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
  expect(requests).toHaveLength(0);
  page.off('request', recordRequest);
});

test('mobile layout has no horizontal overflow', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
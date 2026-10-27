import { afterAll, beforeAll, expect, test } from 'bun:test';

const port = 31987;
const endpoint = `http://localhost:${port}/wsdl`;
let server: ReturnType<typeof Bun.spawn>;

beforeAll(async () => {
  server = Bun.spawn([process.execPath, 'src/index.ts'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, SOAP_PORT: String(port) },
    stdout: 'ignore',
    stderr: 'pipe',
  });
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(`${endpoint}?wsdl`);
      if (response.ok) return;
    } catch {}
    await Bun.sleep(50);
  }
  throw new Error('SOAP server did not start');
});

afterAll(() => server?.kill());

function envelope(operation: string, a: string, b: string) {
  return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://example.org"><soap:Body><tns:${operation}><a>${a}</a><b>${b}</b></tns:${operation}></soap:Body></soap:Envelope>`;
}

function call(operation: string, a: string, b: string) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', SOAPAction: operation, Origin: 'http://localhost:3001' },
    body: envelope(operation, a, b),
  });
}

test('WSDL publishes four decimal operations at the listening address', async () => {
  const response = await fetch(`${endpoint}?wsdl`, { headers: { Origin: 'http://localhost:3001' } });
  const wsdl = await response.text();
  expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3001');
  expect(wsdl).toContain(`location="${endpoint}"`);
  for (const operation of ['Add', 'Subtract', 'Multiply', 'Divide']) {
    expect(wsdl).toContain(`name="${operation}Request"`);
    expect(wsdl).toContain(`name="${operation}Response"`);
    expect(wsdl).toContain(`soapAction="${operation}"`);
  }
  expect(wsdl).toContain('type="xsd:double"');
});

for (const [operation, a, b, result] of [
  ['Add', '1.5', '2.25', '3.75'],
  ['Subtract', '5', '3', '2'],
  ['Multiply', '2', '3', '6'],
  ['Divide', '1', '2', '0.5'],
] as const) {
  test(`${operation} returns ${result}`, async () => {
    const response = await call(operation, a, b);
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3001');
    expect(await response.text()).toContain(`<tns:result>${result}</tns:result>`);
  });
}

for (const [operation, a, b, message] of [
  ['Add', 'oops', '2', 'numeros finitos'],
  ['Add', '', '2', 'numeros finitos'],
  ['Add', 'NaN', '2', 'numeros finitos'],
  ['Add', 'Infinity', '2', 'numeros finitos'],
  ['Divide', '1', '0', 'divisao por zero'],
] as const) {
  test(`${operation} rejects ${a || 'empty'} and ${b}`, async () => {
    const response = await call(operation, a, b);
    const xml = await response.text();
    expect(response.status).toBe(500);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3001');
    expect(xml).toContain('<soap:Fault>');
    expect(xml).toContain(message);
  });
}

test('missing operand returns a SOAP Fault', async () => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', SOAPAction: 'Add' },
    body: '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://example.org"><soap:Body><tns:Add><a>1</a></tns:Add></soap:Body></soap:Envelope>',
  });
  expect(response.status).toBe(500);
  expect(await response.text()).toContain('<soap:Fault>');
});

test('CORS allows the frontend preflight but not other origins', async () => {
  const allowed = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:3001', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,soapaction' },
  });
  expect(allowed.status).toBe(204);
  expect(allowed.headers.get('access-control-allow-headers')).toContain('SOAPAction');
  const denied = await fetch(endpoint, { method: 'OPTIONS', headers: { Origin: 'http://untrusted.invalid' } });
  expect(denied.headers.get('access-control-allow-origin')).toBeNull();
});
export type SoapOperation = 'Add' | 'Subtract' | 'Multiply' | 'Divide';

type HttpRequest = { method: string; url: string; headers: Record<string, string>; xml: string };
type HttpResponse = { status: number; statusText: string; headers: Record<string, string>; xml: string };

export type SoapExchange = {
  request: HttpRequest;
  response?: HttpResponse;
  result?: number;
  error?: string;
};

const envelopeNamespace = 'http://schemas.xmlsoap.org/soap/envelope/';

export async function getSoapUrl(): Promise<string> {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Configuração SOAP indisponível');
  const config: unknown = await response.json();
  if (!config || typeof config !== 'object' || !('soapUrl' in config) || typeof config.soapUrl !== 'string') {
    throw new Error('URL SOAP inválida');
  }
  return config.soapUrl;
}

export function createSoapEnvelope(operation: SoapOperation, a: number, b: number) {
  return `<soap:Envelope xmlns:soap="${envelopeNamespace}" xmlns:tns="http://example.org"><soap:Body><tns:${operation}><a>${a}</a><b>${b}</b></tns:${operation}></soap:Body></soap:Envelope>`;
}

export function parseSoapResponse(xml: string, operation: SoapOperation): number {
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  if (document.getElementsByTagName('parsererror').length) {
    throw new Error('Resposta XML inválida');
  }
  const body = document.getElementsByTagNameNS(envelopeNamespace, 'Body')[0];
  if (!body) throw new Error('Resposta SOAP sem Body');

  const fault = body.getElementsByTagNameNS(envelopeNamespace, 'Fault')[0];
  if (fault) {
    const message = fault.getElementsByTagName('faultstring')[0]?.textContent;
    throw new Error(message || 'SOAP Fault sem descrição');
  }

  const reply = Array.from(body.children).find(
    (element) => element.localName === `${operation}Response` && element.namespaceURI === 'http://example.org',
  );
  const resultText = reply?.getElementsByTagNameNS('*', 'result')[0]?.textContent;
  if (resultText === undefined || resultText === null || resultText.trim() === '') {
    throw new Error('Resposta SOAP sem resultado');
  }
  const result = Number(resultText);
  if (!Number.isFinite(result)) throw new Error('Resultado SOAP inválido');
  return result;
}

export async function callSoap(operation: SoapOperation, a: number, b: number): Promise<SoapExchange> {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Informe dois números válidos');
  }

  const soapUrl = await getSoapUrl();
  const request: HttpRequest = {
    method: 'POST',
    url: soapUrl,
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: operation },
    xml: createSoapEnvelope(operation, a, b),
  };
  const exchange: SoapExchange = { request };

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.xml,
    });
    exchange.response = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      xml: await response.text(),
    };
    exchange.result = parseSoapResponse(exchange.response.xml, operation);
    if (!response.ok) throw new Error(`HTTP ${response.status}: resposta SOAP inesperada`);
  } catch (error) {
    exchange.error = error instanceof Error ? error.message : String(error);
  }

  return exchange;
}

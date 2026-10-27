import http from 'node:http';
import fs from 'node:fs';
import soap from 'soap';

type Arguments = { a?: unknown; b?: unknown };

const fault = (message: string) => ({
  Fault: { faultcode: 'Client', faultstring: message, statusCode: 500 },
});

async function calculate(args: Arguments, operation: (a: number, b: number) => number) {
  const values = [args?.a, args?.b];
  if (values.some((value) => value === undefined || value === null || String(value).trim() === '')) {
    throw fault('a e b devem ser numeros finitos');
  }

  const a = Number(args.a);
  const b = Number(args.b);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw fault('a e b devem ser numeros finitos');
  }

  const result = operation(a, b);
  if (!Number.isFinite(result)) {
    throw fault('resultado fora do intervalo numerico');
  }
  return { result };
}

// 1. Definir a lógica do serviço (implementação das funções do WSDL)
const myService = {
  CalculatorService: {
    CalculatorPort: {
      Add: (args: Arguments) => calculate(args, (a, b) => a + b),
      Subtract: (args: Arguments) => calculate(args, (a, b) => a - b),
      Multiply: (args: Arguments) => calculate(args, (a, b) => a * b),
      Divide: (args: Arguments) => calculate(args, (a, b) => {
        if (b === 0) {
          throw fault('divisao por zero');
        }
        return a / b;
      }),
    },
  },
};

// 2. Ler o arquivo WSDL
const port = Number(process.env.SOAP_PORT || 3000);
const wsdl = fs.readFileSync('src/service.wsdl', 'utf8')
  .replace('http://localhost:3000/wsdl', `http://localhost:${port}/wsdl`);

// 3. Criar o servidor HTTP nativo (compatibilidade Node no Bun)
const server = http.createServer(function (request, response) {
  response.end('404: Not Found: ' + request.url);
});

// 4. Iniciar o servidor SOAP acoplado ao HTTP
server.listen(port, () => {
  const soapServer = soap.listen(server, '/wsdl', myService, wsdl, function () {
    console.log(`🚀 Servidor SOAP rodando em http://localhost:${port}/wsdl?wsdl`);
  });
  soapServer.authorizeConnection = (request, response) => {
    if (!response) return true;
    const allowedOrigin = process.env.SOAP_ALLOWED_ORIGIN || 'http://localhost:3001';
    if (request.headers.origin === allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, SOAPAction');
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      return false;
    }
    return true;
  };
});

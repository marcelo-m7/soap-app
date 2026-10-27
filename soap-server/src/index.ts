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

  return { result: operation(a, b) };
}

// 1. Definir a lógica do serviço (implementação das funções do WSDL)
const myService = {
  CalculatorService: {
    CalculatorPort: {
      Add: (args: Arguments) => calculate(args, (a, b) => a + b),
      Subtract: (args: Arguments) => calculate(args, (a, b) => a - b),
    },
  },
};

// 2. Ler o arquivo WSDL
const wsdl = fs.readFileSync('src/service.wsdl', 'utf8');

// 3. Criar o servidor HTTP nativo (compatibilidade Node no Bun)
const server = http.createServer(function (request, response) {
  response.end('404: Not Found: ' + request.url);
});

// 4. Iniciar o servidor SOAP acoplado ao HTTP
const port = 3000;
server.listen(port, () => {
  soap.listen(server, '/wsdl', myService, wsdl, function () {
    console.log(`🚀 Servidor SOAP rodando em http://localhost:${port}/wsdl?wsdl`);
  });
});

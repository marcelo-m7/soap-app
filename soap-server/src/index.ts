import http from 'node:http';
import fs from 'node:fs';
import soap from 'soap';

// 1. Definir a lógica do serviço (implementação das funções do WSDL)
const myService = {
  CalculatorService: {
    CalculatorPort: {
      Sum: function (args: { a: number; b: number }) {
        const resultado = Number(args.a) + Number(args.b);
        return {
          result: resultado,
        };
      },
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

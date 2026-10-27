import { serve } from "bun";
import index from "./index.html";

// Define a estrutura do XML que o servidor espera
const createSoapEnvelope = (a: number, b: number) => `
  <soapenv:Envelope xmlns:soapenv="http://xmlsoap.org" xmlns:wsdl="http://example.org">
     <soapenv:Header/>
     <soapenv:Body>
        <wsdl:Sum>
           <a>${a}</a>
           <b>${b}</b>
        </wsdl:Sum>
     </soapenv:Body>
  </soapenv:Envelope>
`;

export const fetchSum = async (a: number, b: number): Promise<number> => {
  const soapEnvelope = createSoapEnvelope(a, b);

  const response = await fetch('http://localhost:3000/wsdl', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': 'Sum', // Deve bater com o SOAPAction do seu WSDL
    },
    body: soapEnvelope,
  });

  if (!response.ok) {
    throw new Error('Erro ao chamar o servidor SOAP');
  }

  const xmlText = await response.text();
  
  // Converte a string XML da resposta em um documento DOM para facilitar a leitura
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Busca a tag do resultado dentro do XML retornado
  const resultTag = xmlDoc.getElementsByTagName('result')[0];
  
  if (!resultTag || !resultTag.textContent) {
    throw new Error('Resposta XML inválida ou tag "result" não encontrada');
  }

  return parseInt(resultTag.textContent, 10);
};

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    
    "/soap/sum/:a": (req) => {
    var a = req.params.a;
    var b= req.params.b; 
    total = fetchSum(a,b);
    return Response.json({total})
},    
    "/api/hello": {
      GET() {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      PUT() {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

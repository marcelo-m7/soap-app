# SOAP calculator server

Install dependencies with `bun install`, then start from this directory with `bun src/index.ts`.
The SOAP endpoint is `http://localhost:3000/wsdl`; its WSDL is available at
`http://localhost:3000/wsdl?wsdl`. Set `SOAP_PORT` to change the listening port
and the advertised WSDL address.

The SOAP 1.1 RPC/literal service exposes `Add`, `Subtract`, `Multiply` and
`Divide`. Each request accepts `a` and `b` as `xsd:double` and returns a
`result` of type `xsd:double`. The `SOAPAction` header matches the operation
name. Missing, empty or non-finite operands, division by zero and non-finite
results produce an HTTP 500 SOAP Fault.

The browser origin defaults to `http://localhost:3001`; override it with
`SOAP_ALLOWED_ORIGIN` for another frontend. Cross-origin GET (WSDL), POST
(SOAP) and OPTIONS preflight are supported, including `Content-Type` and
`SOAPAction` headers. Other origins receive no CORS authorization.

Run `bun check` and `bun test` to validate the service and its HTTP/SOAP
contract. The tests start a separate server on port 31987.

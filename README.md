# Calculadora SOAP

Projeto de calculadora com serviço SOAP 1.1 em Bun e cliente web em React. O cliente envia requisições XML diretamente ao serviço e mostra o resultado, os dados HTTP e o XML de cada requisição e resposta.

**Autor:** Marcelo Santos ([marcelo-m7](https://github.com/marcelo-m7))

## Estrutura

- [`soap-server/`](soap-server/): serviço SOAP, contrato WSDL, validação e CORS.
- [`soap-app/`](soap-app/): interface para executar operações e inspecionar o tráfego HTTP/SOAP.

## Como executar

Para executar sem Docker, é necessário ter [Bun](https://bun.com/) instalado. Em dois terminais, a partir da raiz do projeto:

**Terminal 1 - serviço SOAP**

```bash
cd soap-server
bun install
bun src/index.ts
```

**Terminal 2 - aplicação web**

```bash
cd soap-app
bun install
bun dev
```

Abra **http://localhost:3001/**. O serviço escuta em `http://localhost:3000/wsdl` e publica seu contrato em **http://localhost:3000/wsdl?wsdl**.

### Com Docker

Com Docker e Docker Compose instalados, execute na raiz do projeto:

```bash
docker compose up --build
```

Abra **http://localhost:3001/**. Para encerrar, execute `docker compose down`. As portas 3000 e 3001 precisam estar livres; pare os servidores Bun locais antes de subir o Compose. O [Dockerfile](Dockerfile) possui alvos separados para o serviço e a aplicação, definidos em [compose.yaml](compose.yaml). A URL SOAP configurada na aplicação usa `localhost` porque é acessada pelo **navegador** no host, não por uma chamada entre contêineres.

## Operações e validação

| Operação SOAP | Parâmetros | Resultado |
| --- | --- | --- |
| `Add` | `a`, `b` | Soma |
| `Subtract` | `a`, `b` | Diferença |
| `Multiply` | `a`, `b` | Produto |
| `Divide` | `a`, `b` | Quociente |

Os parâmetros e o resultado são descritos no WSDL como `xsd:double`. Os dois valores devem ser números finitos; parâmetros ausentes, vazios ou inválidos geram um **SOAP Fault**. Divisão por zero também gera um SOAP Fault, com status HTTP 500. O cabeçalho `SOAPAction` corresponde ao nome da operação.

A interface exibe método, URL, status, cabeçalhos disponíveis e XML bruto em ambas as direções, inclusive quando ocorre um fault. Por limitações do navegador, nem todos os cabeçalhos de transporte ficam acessíveis ao JavaScript; para inspecionar a troca HTTP completa, use a aba **Rede/Network** das ferramentas de desenvolvimento.

## Configuração

| Variável | Processo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `SOAP_PORT` | Serviço | `3000` | Porta SOAP e endereço publicado no WSDL |
| `SOAP_ALLOWED_ORIGIN` | Serviço | `http://localhost:3001` | Origem autorizada pelo CORS |
| `APP_PORT` | Aplicação | `3001` | Porta da interface |
| `BUN_PUBLIC_SOAP_URL` | Aplicação | `http://localhost:3000/wsdl` | Endpoint chamado diretamente pelo navegador |

Ao mudar a porta da aplicação, configure `SOAP_ALLOWED_ORIGIN` com a nova origem. A rota `/api/config` da aplicação fornece a URL do serviço ao navegador; ela **não** faz proxy das chamadas SOAP.

## Testes

Execute em cada pacote:

```bash
cd soap-server
bun check
bun test
```

```bash
cd soap-app
bun check
bun test
bun run build.ts
```

Os testes do serviço verificam o WSDL, as quatro operações, entradas inválidas, divisão por zero e CORS. Os testes da aplicação usam Chromium com instâncias isoladas nas portas 31988/31989 para verificar o fluxo no navegador. Se necessário, defina `CHROMIUM_PATH` ou instale o navegador do Playwright com `bunx playwright install chromium`.

Consulte os guias de [`soap-server`](soap-server/README.md) e [`soap-app`](soap-app/README.md) para detalhes de cada pacote. O projeto está sob a licença indicada em [LICENSE](LICENSE).
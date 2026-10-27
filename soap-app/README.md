# SOAP calculator client

Install dependencies with `bun install` in both `soap-server` and `soap-app`.
Start the backend from `soap-server` with `bun src/index.ts`; start this app
from `soap-app` with `bun dev`. Open `http://localhost:3001/`. The frontend
sends SOAP 1.1 XML directly to `http://localhost:3000/wsdl`; `/api/config`
only supplies the service URL and does not proxy SOAP traffic.

The form calls `Add`, `Subtract`, `Multiply` and `Divide`. It shows the
result or SOAP Fault, HTTP method/URL/status, available headers and raw XML
for both sides of each request. Browsers only expose response headers allowed
by Fetch/CORS and do not provide every transport header; use Network tools
for a complete wire-level view.

Set `BUN_PUBLIC_SOAP_URL` when starting this app to choose another backend
endpoint. Set `APP_PORT` to change the frontend port, and set
`SOAP_ALLOWED_ORIGIN` on the backend to the matching browser origin.
The backend defaults to port 3000 and the frontend to 3001.

Run `bun check`, `bun test` and `bun run build.ts` here to check the client.
The browser tests start isolated servers on ports 31988/31989 and use system
Chromium at `/usr/bin/chromium`, a `CHROMIUM_PATH` override, or Playwright's
installed Chromium. Run `bunx playwright install chromium` if no browser is
available.

import { useEffect, useState } from "react";
import { APITester } from "./APITester";
import { getSoapUrl } from "./service";
import "./index.css";

export function App() {
  const [soapUrl, setSoapUrl] = useState("");

  useEffect(() => {
    getSoapUrl().then(setSoapUrl).catch(() => setSoapUrl(""));
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 md:px-10 md:py-14">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">SOAP / Calculadora</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">Operações</h1>
        </div>
        {soapUrl && <a className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" href={`${soapUrl}?wsdl`} target="_blank" rel="noreferrer">WSDL ↗</a>}
      </header>
      <APITester />
    </main>
  );
}

export default App;

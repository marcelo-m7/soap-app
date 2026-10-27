import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Braces, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { callSoap, type SoapExchange, type SoapOperation } from "./service";

const operations: { value: SoapOperation; label: string; symbol: string }[] = [
  { value: "Add", label: "Somar", symbol: "+" },
  { value: "Subtract", label: "Subtrair", symbol: "−" },
  { value: "Multiply", label: "Multiplicar", symbol: "×" },
  { value: "Divide", label: "Dividir", symbol: "÷" },
];

export function APITester() {
  const [operation, setOperation] = useState<SoapOperation>("Add");
  const [exchange, setExchange] = useState<SoapExchange | null>(null);
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const first = String(formData.get("a") ?? "").trim();
    const second = String(formData.get("b") ?? "").trim();
    const a = Number(first);
    const b = Number(second);

    if (!first || !second || !Number.isFinite(a) || !Number.isFinite(b)) {
      setInputError("Informe dois números válidos.");
      return;
    }

    setInputError("");
    setLoading(true);
    try {
      setExchange(await callSoap(operation, a, b));
    } catch (error) {
      setInputError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      <form onSubmit={submit} className="grid gap-4 border-b border-border pb-8 md:grid-cols-[minmax(160px,1.3fr)_minmax(100px,1fr)_minmax(100px,1fr)_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="operation">Operação</Label>
          <Select value={operation} onValueChange={(value) => setOperation(value as SoapOperation)}>
            <SelectTrigger id="operation" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operations.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="inline-flex items-center gap-3"><span className="w-4 text-center font-mono">{item.symbol}</span>{item.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="operand-a">Valor a</Label>
          <Input id="operand-a" name="a" type="number" step="any" required defaultValue="12" className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operand-b">Valor b</Label>
          <Input id="operand-b" name="b" type="number" step="any" required defaultValue="4" className="font-mono" />
        </div>
        <Button type="submit" disabled={loading} className="w-full md:w-auto">
          <Send aria-hidden="true" className="size-4" />{loading ? "Enviando" : "Calcular"}
        </Button>
      </form>
      {inputError && <p role="alert" className="text-sm text-destructive">{inputError}</p>}

      <div aria-live="polite" className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-border pb-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado</p>
          {exchange?.error ? (
            <p role="alert" className="mt-1 text-sm font-medium text-destructive">{exchange.error}</p>
          ) : exchange?.result !== undefined ? (
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">{exchange.result}</p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Aguardando operação</p>
          )}
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`size-2 rounded-full ${exchange?.error ? "bg-destructive" : exchange ? "bg-emerald-500" : "bg-muted-foreground"}`} />
          {loading ? "Em andamento" : exchange?.response ? `HTTP ${exchange.response.status}` : exchange?.error ? "Sem resposta" : "Pronto"}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="min-w-0 space-y-4" aria-label="Requisição SOAP">
          <div className="flex items-center gap-2 text-sm font-semibold"><ArrowRight aria-hidden="true" className="size-4 text-emerald-600" /> Requisição</div>
          <HttpDetails method={exchange?.request.method} url={exchange?.request.url} headers={exchange?.request.headers} />
          <XmlPanel xml={exchange?.request.xml} />
        </section>
        <section className="min-w-0 space-y-4" aria-label="Resposta SOAP">
          <div className="flex items-center gap-2 text-sm font-semibold"><ArrowRight aria-hidden="true" className="size-4 rotate-180 text-orange-600" /> Resposta</div>
          <HttpDetails status={exchange?.response ? `${exchange.response.status} ${exchange.response.statusText}` : undefined} headers={exchange?.response?.headers} />
          <XmlPanel xml={exchange?.response?.xml} />
        </section>
      </div>
    </div>
  );
}

function HttpDetails({ method, url, status, headers }: { method?: string; url?: string; status?: string; headers?: Record<string, string> }) {
  return (
    <div className="min-h-28 space-y-2 border-t border-border pt-3 font-mono text-xs">
      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">HTTP</p>
      <p className="break-all">{status || (method && url ? `${method} ${url}` : "Aguardando dados")}</p>
      {headers && Object.entries(headers).map(([name, value]) => (
        <p key={name} className="break-all text-muted-foreground"><span className="text-foreground">{name}:</span> {value}</p>
      ))}
    </div>
  );
}

function XmlPanel({ xml }: { xml?: string }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Braces aria-hidden="true" className="size-4" /> SOAP / XML</p>
      <pre className="soap-xml min-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-5 text-foreground">{xml || "Aguardando XML"}</pre>
    </div>
  );
}

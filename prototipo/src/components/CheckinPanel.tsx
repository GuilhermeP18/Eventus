import { useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Ticket } from "@/lib/store";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; reason?: string; ticket?: Ticket };

export function CheckinPanel() {
  const { events, tickets, checkIn } = useStore();
  const [eventId, setEventId] = useState("all");
  const [result, setResult] = useState<Result | null>(null);
  const [code, setCode] = useState(""); const [q, setQ] = useState("");
  const last = useRef({ code: "", at: 0 });

  const validate = (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    if (c === last.current.code && Date.now() - last.current.at < 3000) return;
    last.current = { code: c, at: Date.now() };
    const t = tickets.find((x) => x.code === c);
    if (t && eventId !== "all" && t.eventId !== eventId) { setResult({ ok: false, reason: "Ingresso de outro evento", ticket: t }); return; }
    setResult(checkIn(c)); setCode("");
  };
  const list = tickets.filter((t) => (eventId === "all" || t.eventId === eventId) && q.length >= 2 &&
    (t.name.toLowerCase().includes(q.toLowerCase()) || t.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "#")));

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Portaria</h1>
      <Select value={eventId} onValueChange={setEventId}><SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos os eventos</SelectItem>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent></Select>

      {result && (
        <div role="status" className={cn("flex items-center gap-4 rounded-xl p-5", result.ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
          {result.ok ? <CheckCircle2 className="h-12 w-12 shrink-0" /> : <XCircle className="h-12 w-12 shrink-0" />}
          <div className="min-w-0"><div className="font-display text-xl font-bold">{result.ok ? "Ingresso válido" : result.reason}</div>
            {result.ticket && <div className="text-sm opacity-90">{result.ticket.name} · {result.ticket.seatLabel ?? result.ticket.type}</div>}</div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 shadow-card">
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); validate(code); }}>
          <Input autoFocus placeholder="Digite o código do ingresso (TKT-...)" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit">Validar</Button>
        </form>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-card">
        <h2 className="mb-2 font-bold">Check-in manual</h2>
        <Input placeholder="Buscar por nome ou CPF" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-3 space-y-2">
          {list.map((t) => (
            <div key={t.code} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0"><div className="break-words font-medium">{t.name}</div><div className="text-xs text-muted-foreground">{t.cpf} · {t.seatLabel ?? t.type}</div></div>
              {t.status === "checked_in" ? <span className="text-sm font-semibold text-success">Entrou</span> : <Button size="sm" onClick={() => { last.current.code = ""; validate(t.code); }}>Check-in</Button>}
            </div>))}
          {q.length >= 2 && !list.length && <p className="text-sm text-muted-foreground">Nenhum participante encontrado.</p>}
        </div>
      </div>
    </div>
  );
}

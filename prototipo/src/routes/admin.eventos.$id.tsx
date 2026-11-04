import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/eventos/$id")({
  head: () => ({
    meta: [
      { title: "Gestão do evento — Eventus" },
      { name: "description", content: "Vendas em tempo real, extrato financeiro e lista de participantes do evento." },
      { property: "og:title", content: "Gestão do evento — Eventus" },
      { property: "og:description", content: "Dashboard de vendas e participantes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Manage,
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border bg-card p-5 shadow-card"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 font-display text-2xl font-bold">{value}</div>{sub && <div className="text-xs text-muted-foreground">{sub}</div>}</div>;
}

function Manage() {
  const { id } = Route.useParams();
  const ev = useStore((s) => s.events.find((e) => e.id === id));
  const all = useStore((s) => s.tickets);
  const [q, setQ] = useState("");
  if (!ev) return <div className="p-12 text-center">Evento não encontrado.</div>;
  const tickets = all.filter((t) => t.eventId === id);
  const isSeated = ev.seatMode === "seated";
  const byLot = isSeated
    ? ev.sectors.map((s) => { const sold = tickets.filter((t) => t.seatId?.startsWith(s.id + ":")).length; return { name: s.name, sold, cap: s.rows * s.cols, revenue: sold * s.price }; })
    : ev.lots.map((l) => ({ name: l.name, sold: l.sold, cap: l.qty, revenue: l.sold * l.price }));
  const sold = byLot.reduce((a, b) => a + b.sold, 0);
  const capacity = byLot.reduce((a, b) => a + b.cap, 0);
  const gross = byLot.reduce((a, b) => a + b.revenue, 0);
  const fee = (gross * ev.platformFeePct) / 100;
  const filtered = tickets.filter((t) => !q || [t.name, t.email, t.cpf, t.code, t.seatLabel ?? ""].join(" ").toLowerCase().includes(q.toLowerCase()));

  const exportCsv = () => {
    const head = ["Nome", "E-mail", "CPF", "Tipo/Setor", "Assento", "Código", "Data da compra", "Status"];
    const rows = filtered.map((t) => [t.name, t.email, t.cpf, t.type, t.seatLabel ?? "", t.code, new Date(t.purchasedAt).toLocaleString("pt-BR"), t.status === "checked_in" ? "Check-in realizado" : "Confirmado"]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = `participantes-${ev.id}.csv`; a.click();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><Badge>{ev.category}</Badge><span className="flex items-center gap-1 text-xs text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />Ao vivo</span></div>
          <h1 className="mt-1 text-3xl font-bold">{ev.title}</h1></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/eventos/$id/ingresso" params={{ id }}><ExternalLink className="mr-1 h-4 w-4" />Página pública</Link></Button>
          <Button asChild><Link to="/admin/checkin">Abrir portaria</Link></Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="Receita bruta" value={brl(gross)} />
        <Stat label="Ingressos vendidos" value={String(sold)} sub={`de ${capacity}`} />
        <Stat label={isSeated ? "Ocupação dos assentos" : "Ocupação"} value={`${capacity ? Math.round((sold / capacity) * 100) : 0}%`} />
        <Stat label="Check-ins" value={String(tickets.filter((t) => t.status === "checked_in").length)} sub={`de ${tickets.length} participantes`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">Vendas por {isSeated ? "setor" : "lote"}</h2>
          <div className="space-y-4">{byLot.map((l) => (
            <div key={l.name}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium">{l.name}</span><span className="text-muted-foreground">{l.sold}/{l.cap} · {brl(l.revenue)}</span></div><Progress value={l.cap ? (l.sold / l.cap) * 100 : 0} /></div>))}</div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">Extrato financeiro</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Valor bruto</span><span>{brl(gross)}</span></div>
            <div className="flex justify-between text-destructive"><span>Taxa da plataforma ({ev.platformFeePct}%)</span><span>-{brl(fee)}</span></div>
            <div className="flex justify-between border-t pt-3 font-display text-xl font-bold"><span>Líquido a receber</span><span className="text-success">{brl(gross - fee)}</span></div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Participantes ({filtered.length})</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="w-full pl-9 sm:w-64" placeholder="Nome, e-mail, assento ou código" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />CSV</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Nome completo</TableHead><TableHead>E-mail</TableHead><TableHead>CPF</TableHead><TableHead>Tipo / Setor</TableHead><TableHead>Assento</TableHead><TableHead>Código</TableHead><TableHead>Compra</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.code}>
                  <TableCell className="font-medium">{t.name}</TableCell><TableCell>{t.email}</TableCell><TableCell>{t.cpf}</TableCell><TableCell>{t.type}</TableCell>
                  <TableCell>{t.seatLabel ? t.seatLabel.split(" · ")[1] : "—"}</TableCell><TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{new Date(t.purchasedAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{t.status === "checked_in" ? <Badge className="bg-success text-success-foreground">Check-in realizado</Badge> : <Badge variant="secondary">Confirmado</Badge>}</TableCell>
                </TableRow>))}
              {!filtered.length && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum participante.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

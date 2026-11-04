import { Link } from "@tanstack/react-router";
import { Plus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl, useStore } from "@/lib/store";

// Aba "Meus eventos": um cartão por evento com vendidos e receita.
export function MyEventsPanel() {
  const { events, tickets } = useStore();
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Meus eventos</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/meus-ingressos" search={{ aba: "portaria" }}><ScanLine className="mr-1 h-4 w-4" />Portaria</Link></Button>
          <Button asChild className="shadow-cta"><Link to="/admin/novo-evento"><Plus className="mr-1 h-4 w-4" />Novo evento</Link></Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {events.map((ev) => { const ts = tickets.filter((t) => t.eventId === ev.id);
          const lotSold = ev.lots.reduce((a, l) => a + l.sold, 0);
          const sold = ev.seatMode === "free" ? Math.max(lotSold, ts.length) : ts.length;
          const revenue = ev.seatMode === "free" ? ev.lots.reduce((a, l) => a + l.sold * l.price, 0) : ts.reduce((a, t) => a + t.price, 0);
          return (
            <Link key={ev.id} to="/admin/eventos/$id" params={{ id: ev.id }} className="flex gap-4 rounded-xl border bg-card p-4 shadow-card hover:border-primary">
              <img src={ev.image} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-lg object-cover sm:w-32" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{ev.category}</Badge><span className="text-xs text-muted-foreground">{new Date(ev.start).toLocaleDateString("pt-BR")}</span></div>
                <div className="mt-1 break-words font-bold">{ev.title}</div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm"><span><b>{sold}</b> vendidos</span><span><b>{brl(revenue)}</b> receita</span></div>
              </div>
            </Link>); })}
      </div>
    </div>
  );
}

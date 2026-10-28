import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, brl, minPrice, useStore, type EventItem } from "@/lib/store";

type Period = "all" | "today" | "weekend" | "month" | "custom";

function inPeriod(ev: EventItem, p: Period, from: string, to: string) {
  const d = new Date(ev.start); const now = new Date();
  const sod = (x: Date) => { const y = new Date(x); y.setHours(0, 0, 0, 0); return y; };
  if (p === "all") return true;
  if (p === "today") return sod(d).getTime() === sod(now).getTime();
  if (p === "weekend") {
    const sat = sod(now); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
    if (now.getDay() === 0) sat.setDate(sat.getDate() - 1);
    const mon = new Date(sat); mon.setDate(mon.getDate() + 2);
    return d >= sat && d < mon;
  }
  if (p === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + "T23:59")) return false;
  return true;
}

export function EventCard({ ev }: { ev: EventItem }) {
  const d = new Date(ev.start);
  return (
    <Link to="/eventos/$id/ingresso" params={{ id: ev.id }} className="group overflow-hidden rounded-xl border bg-card shadow-card transition hover:-translate-y-1">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img src={ev.image} alt={ev.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 rounded-lg bg-card px-3 py-1.5 text-center shadow-card">
          <div className="text-[10px] font-bold uppercase text-primary">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</div>
          <div className="font-display text-xl font-bold leading-none">{d.getDate()}</div>
        </div>
        <Badge className="absolute right-3 top-3" variant="secondary">{ev.category}</Badge>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-lg font-bold">{ev.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{ev.venue} · {ev.city}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{d.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</p>
        <div className="flex items-end justify-between pt-2">
          <div><div className="text-xs text-muted-foreground">A partir de</div><div className="font-display text-lg font-bold text-primary">{brl(minPrice(ev))}</div></div>
          <span className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Comprar</span>
        </div>
      </div>
    </Link>
  );
}

export function EventsHub() {
  const events = useStore((s) => s.events);
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all"); const [city, setCity] = useState("all");
  const [period, setPeriod] = useState<Period>("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const cities = useMemo(() => [...new Set(events.map((e) => e.city))], [events]);
  const list = events.filter((e) =>
    (!q || (e.title + e.venue + e.description).toLowerCase().includes(q.toLowerCase())) &&
    (cat === "all" || e.category === cat) && (city === "all" || e.city === city) && inPeriod(e, period, from, to));

  const periods: [Period, string][] = [["all", "Todos"], ["today", "Hoje"], ["weekend", "Este fim de semana"], ["month", "Este mês"], ["custom", "Escolher datas"]];
  return (
    <div id="eventos" className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-11 pl-9" placeholder="Buscar eventos, artistas, locais..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={cat} onValueChange={setCat}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas categorias</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={city} onValueChange={setCity}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas cidades</SelectItem>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {periods.map(([k, l]) => <Button key={k} size="sm" variant={period === k ? "default" : "outline"} onClick={() => setPeriod(k)}>{l}</Button>)}
          {period === "custom" && (<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"><Input type="date" className="h-9 w-full sm:w-40" value={from} onChange={(e) => setFrom(e.target.value)} /><span className="text-sm text-muted-foreground">até</span><Input type="date" className="h-9 w-full sm:w-40" value={to} onChange={(e) => setTo(e.target.value)} /></div>)}
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{list.length} evento(s) encontrado(s)</p>
      <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((e) => <EventCard key={e.id} ev={e} />)}</div>
      {!list.length && <div className="mt-10 rounded-xl border border-dashed p-12 text-center text-muted-foreground">Nenhum evento com esses filtros.</div>}
    </div>
  );
}

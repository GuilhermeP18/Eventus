import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Minus, Plus, Timer, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BUYER_FEE_PCT, RESERVATION_SECONDS, activeLots, brl, couponDiscount, rowLetter, sanitizeHtml, useStore, type CartItem, type EventItem, type Sector } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eventos/$id/ingresso")({
  head: () => ({
    meta: [
      { title: "Escolha seu ingresso — Eventus" },
      { name: "description", content: "Escolha poltronas ou lotes, aplique cupons e finalize sua compra com reserva garantida por 10 minutos." },
      { property: "og:title", content: "Escolha seu ingresso — Eventus" },
      { property: "og:description", content: "Selecione assentos e finalize sua compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function SeatMap({ ev, sector, selected, toggle, taken }: { ev: EventItem; sector: Sector; selected: string[]; toggle: (id: string) => void; taken: Set<string> }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{sector.name}</h3><span className="text-sm font-semibold text-primary">{brl(sector.price)}</span></div>
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max space-y-1.5">
          {Array.from({ length: sector.rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span className="w-5 text-xs font-bold text-muted-foreground">{rowLetter(r)}</span>
              {Array.from({ length: sector.cols }).map((_, c) => {
                const id = `${sector.id}:${rowLetter(r)}-${c + 1}`;
                const isTaken = taken.has(id); const isSel = selected.includes(id);
                const aisle = c === Math.floor(sector.cols / 2) - 1;
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <button disabled={isTaken} onClick={() => toggle(id)} aria-label={`Fileira ${rowLetter(r)} poltrona ${c + 1}`} aria-pressed={isSel}
                        className={cn("h-7 w-7 rounded-t-lg rounded-b-sm text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-ring",
                          isTaken ? "cursor-not-allowed bg-seat-taken text-muted-foreground" : isSel ? "scale-110 bg-seat-selected text-primary-foreground" : "bg-seat-free text-primary-foreground hover:scale-110",
                          aisle && "mr-4")}>{c + 1}</button>
                    </TooltipTrigger>
                    <TooltipContent>{sector.name} · Fileira {rowLetter(r)} - Poltrona {c + 1}<br />{isTaken ? "Ocupada" : brl(sector.price)}</TooltipContent>
                  </Tooltip>
                );
              })}
              <span className="w-5 text-right text-xs font-bold text-muted-foreground">{rowLetter(r)}</span>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">{ev.title}</span>
    </div>
  );
}

function Checkout() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const ev = useStore((s) => s.events.find((e) => e.id === id));
  const tickets = useStore((s) => s.tickets);
  const purchase = useStore((s) => s.purchase);
  const myEmail = useStore((s) => s.myEmail);
  const [seats, setSeats] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [left, setLeft] = useState(RESERVATION_SECONDS);
  const [couponInput, setCouponInput] = useState(""); const [coupon, setCoupon] = useState<string>();
  const [buyer, setBuyer] = useState({ name: "", email: myEmail, cpf: "" });

  const hasSelection = seats.length > 0 || Object.values(qty).some((n) => n > 0);
  useEffect(() => { if (!hasSelection) { setLeft(RESERVATION_SECONDS); return; }
    const t = setInterval(() => setLeft((s) => s - 1), 1000); return () => clearInterval(t); }, [hasSelection]);
  useEffect(() => { if (left <= 0) { setSeats([]); setQty({}); toast.error("Tempo de reserva esgotado. Suas poltronas foram liberadas."); } }, [left]);

  const taken = useMemo(() => new Set([...(ev?.blockedSeats ?? []), ...tickets.filter((t) => t.eventId === id && t.seatId).map((t) => t.seatId!)]), [ev, tickets, id]);
  if (!ev) return <div className="p-12 text-center">Evento não encontrado. <Link to="/eventos" className="text-primary underline">Voltar</Link></div>;

  const lots = activeLots(ev);
  const items: CartItem[] = ev.seatMode === "seated"
    ? seats.map((sid) => { const [secId, pos] = sid.split(":"); const s = ev.sectors.find((x) => x.id === secId)!; const [row, n] = (pos ?? "").split("-");
        return { type: s.name, price: s.price, seatId: sid, seatLabel: `${s.name} · Fileira ${row} - Poltrona ${n}` }; })
    : lots.flatMap((l) => Array.from({ length: qty[l.id] ?? 0 }, () => ({ type: l.name, price: l.price, lotId: l.id })));
  const subtotal = items.reduce((a, b) => a + b.price, 0);
  const c = ev.coupons.find((x) => x.code === coupon);
  const discount = couponDiscount(c, subtotal);
  const fee = ((subtotal - discount) * BUYER_FEE_PCT) / 100;
  const total = subtotal - discount + fee;

  const applyCoupon = () => {
    const found = ev.coupons.find((x) => x.code === couponInput.trim().toUpperCase());
    if (!found) return void toast.error("Cupom inválido");
    if (found.used >= found.maxUses) return void toast.error("Cupom esgotado");
    setCoupon(found.code); toast.success("Cupom aplicado!");
  };
  const finish = () => {
    if (!items.length) return void toast.error("Selecione ao menos um ingresso");
    if (buyer.name.trim().length < 3 || !/^\S+@\S+\.\S+$/.test(buyer.email) || buyer.cpf.replace(/\D/g, "").length !== 11) return void toast.error("Preencha nome, e-mail e CPF válidos");
    purchase({ eventId: ev.id, buyer, items, couponCode: coupon });
    useStore.getState().setMyEmail(buyer.email);
    toast.success("Compra confirmada! Seus ingressos estão disponíveis.");
    navigate({ to: "/meus-ingressos" });
  };
  const mm = String(Math.floor(left / 60)).padStart(2, "0"); const ss = String(left % 60).padStart(2, "0");

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative h-56 overflow-hidden md:h-72">
        <img src={ev.image} alt={ev.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-6 text-ink-foreground">
          <Badge className="mb-2 w-fit">{ev.category}</Badge>
          <h1 className="text-3xl font-extrabold md:text-4xl">{ev.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm opacity-90">
            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{new Date(ev.start).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}</span>
            <span className="flex items-center gap-1">{ev.online ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}{ev.online ? "Evento online" : `${ev.venue} · ${ev.city}`}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {ev.seatMode === "seated" ? (
            <>
              <div className="mx-auto w-3/4 rounded-b-[50%] bg-ink py-2 text-center text-xs font-bold uppercase tracking-[0.3em] text-ink-foreground">Palco / Tela</div>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-seat-free" />Disponível</span>
                <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-seat-selected" />Selecionada</span>
                <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-seat-taken" />Ocupada</span>
              </div>
              {ev.sectors.map((s) => <SeatMap key={s.id} ev={ev} sector={s} selected={seats} taken={taken}
                toggle={(sid) => setSeats((p) => p.includes(sid) ? p.filter((x) => x !== sid) : p.length >= 8 ? (toast.error("Máximo de 8 poltronas"), p) : [...p, sid])} />)}
            </>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Ingressos</h2>
              {lots.length === 0 && <p className="text-muted-foreground">Ingressos esgotados.</p>}
              {lots.map((l) => { const n = qty[l.id] ?? 0; const max = Math.min(l.limitPerCpf, l.qty - l.sold);
                return (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
                    <div className="min-w-0"><div className="font-semibold">{l.name}</div><div className="text-sm text-muted-foreground">{brl(l.price)} · limite {l.limitPerCpf} por CPF · {l.qty - l.sold} restantes</div></div>
                    <div className="flex items-center gap-3">
                      <Button size="icon" variant="outline" disabled={n === 0} onClick={() => setQty({ ...qty, [l.id]: n - 1 })}><Minus className="h-4 w-4" /></Button>
                      <span className="w-6 text-center font-bold">{n}</span>
                      <Button size="icon" disabled={n >= max} onClick={() => setQty({ ...qty, [l.id]: n + 1 })}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>);
              })}
              {ev.autoTurn && <p className="text-xs text-muted-foreground">Virada automática de lote ativa: o próximo lote abre quando o atual esgotar ou expirar.</p>}
            </div>
          )}
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-2 text-lg font-bold">Sobre o evento</h2>
            <div className="prose max-w-none text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ev.description) }} />
            {!ev.online && ev.address && <iframe title="Mapa" className="mt-4 h-56 w-full rounded-lg border" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(ev.address)}&output=embed`} />}
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 shadow-card lg:sticky lg:top-20">
          <div className={cn("flex items-center justify-between rounded-lg p-3 text-sm font-semibold", hasSelection ? (left < 120 ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground") : "bg-muted text-muted-foreground")}>
            <span className="flex items-center gap-2"><Timer className="h-4 w-4" />{hasSelection ? "Reserva garantida por" : "Selecione para reservar"}</span>
            <span className="font-display text-lg tabular-nums">{mm}:{ss}</span>
          </div>
          <h2 className="text-lg font-bold">Resumo do pedido</h2>
          <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {items.length === 0 && <p className="text-muted-foreground">Nenhum ingresso selecionado.</p>}
            {items.map((it, i) => <div key={i} className="flex justify-between gap-2"><span>{it.seatLabel ?? it.type}</span><span className="font-medium">{brl(it.price)}</span></div>)}
          </div>
          <div className="flex gap-2"><Input placeholder="Cupom de desconto" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} /><Button variant="outline" onClick={applyCoupon}>Aplicar</Button></div>
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Desconto ({coupon})</span><span>-{brl(discount)}</span></div>}
            <div className="flex justify-between"><span>Taxa de serviço ({BUYER_FEE_PCT}%)</span><span>{brl(fee)}</span></div>
            <div className="flex justify-between pt-2 font-display text-xl font-bold"><span>Total</span><span>{brl(total)}</span></div>
          </div>
          <Separator />
          <div className="space-y-2">
            <div><Label htmlFor="b-name">Nome completo</Label><Input id="b-name" maxLength={100} value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} /></div>
            <div><Label htmlFor="b-email">E-mail</Label><Input id="b-email" type="email" maxLength={255} value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} /></div>
            <div><Label htmlFor="b-cpf">CPF</Label><Input id="b-cpf" placeholder="000.000.000-00" maxLength={14} value={buyer.cpf} onChange={(e) => setBuyer({ ...buyer, cpf: e.target.value })} /></div>
          </div>
          <Button size="lg" className="w-full shadow-cta" onClick={finish}>Finalizar compra · {brl(total)}</Button>
        </aside>
      </div>
    </TooltipProvider>
  );
}

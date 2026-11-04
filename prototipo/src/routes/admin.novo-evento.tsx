import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bold, Italic, List, Plus, Trash2, Underline, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, rowLetter, uid, useStore, type Coupon, type Lot, type Sector } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import imgShow from "@/assets/ev-show.jpg";

// Rota /admin/novo-evento: exige usuário logado e roda só no cliente.
export const Route = createFileRoute("/admin/novo-evento")({
  ssr: false,
  // Sem sessão, redireciona para o login guardando o destino em redirect.
  beforeLoad: () => {
    if (!getCurrentUser()) throw redirect({ to: "/login", search: { redirect: "/admin/novo-evento" } });
  },
  head: () => ({
    meta: [
      { title: "Criar novo evento — Eventus" },
      { name: "description", content: "Cadastre seu evento, configure lotes ou mapa de poltronas, cupons e rastreamento." },
      { property: "og:title", content: "Criar novo evento — Eventus" },
      { property: "og:description", content: "Cadastre e venda ingressos para seu evento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewEvent,
});

// Cartão com título que agrupa cada etapa do formulário.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4 shadow-card sm:p-6"><h2 className="mb-4 text-lg font-bold">{title}</h2><div className="space-y-4">{children}</div></section>;
}

// Formulário de criação de evento; publica na store e abre a gestão do evento.
function NewEvent() {
  const navigate = useNavigate();
  const addEvent = useStore((s) => s.addEvent);
  const editor = useRef<HTMLDivElement>(null);
  const [f, setF] = useState({ title: "", category: "Show", image: "", start: "", end: "", online: false, streamUrl: "", venue: "", city: "", address: "", pixelId: "", gaId: "" });
  const [seatMode, setSeatMode] = useState<"free" | "seated">("free");
  const [autoTurn, setAutoTurn] = useState(true);
  const [lots, setLots] = useState<Lot[]>([{ id: uid(), name: "Pista — 1º Lote", price: 80, qty: 100, sold: 0, limitPerCpf: 4 }]);
  const [sectors, setSectors] = useState<Sector[]>([{ id: uid(), name: "Plateia A", price: 150, rows: 6, cols: 12 }]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });
  const exec = (cmd: string) => { document.execCommand(cmd); editor.current?.focus(); };

  const onImage = (file?: File) => { if (!file) return; if (file.size > 3_000_000) return void toast.error("Imagem até 3MB");
    const r = new FileReader(); r.onload = () => set("image", r.result as string); r.readAsDataURL(file); };

  const save = () => {
    if (!f.title.trim() || !f.start) return void toast.error("Preencha título e data de início");
    if (!f.online && !f.city.trim()) return void toast.error("Informe a cidade ou marque como online");
    const id = f.title.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").slice(0, 40) + "-" + uid().toLowerCase();
    addEvent({ id, title: f.title.trim(), category: f.category, description: editor.current?.innerHTML ?? "", image: f.image || imgShow,
      start: new Date(f.start).toISOString(), end: f.end ? new Date(f.end).toISOString() : new Date(f.start).toISOString(),
      online: f.online, streamUrl: f.streamUrl, venue: f.online ? "Online" : f.venue, city: f.online ? "Online" : f.city, address: f.address,
      seatMode, autoTurn, lots: seatMode === "free" ? lots.map((l) => ({ ...l, endsAt: l.endsAt ? new Date(l.endsAt).toISOString() : undefined })) : [],
      sectors: seatMode === "seated" ? sectors : [], blockedSeats: [], coupons: coupons.map((c) => ({ ...c, code: c.code.toUpperCase() })),
      pixelId: f.pixelId, gaId: f.gaId, platformFeePct: 8 });
    toast.success("Evento publicado!");
    navigate({ to: "/admin/eventos/$id", params: { id } });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Novo evento</h1>
      <Section title="1. Informações básicas">
        <div><Label>Título do evento</Label><Input maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Festival de Verão 2026" /></div>
        <div><Label>Categoria</Label><Select value={f.category} onValueChange={(v) => set("category", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Descrição</Label>
          <div className="rounded-md border">
            <div className="flex gap-1 border-b p-1">
              {[["bold", Bold], ["italic", Italic], ["underline", Underline], ["insertUnorderedList", List]].map(([cmd, Icon]) => {
                const I = Icon as typeof Bold; return <Button key={cmd as string} type="button" size="icon" variant="ghost" onMouseDown={(e) => { e.preventDefault(); exec(cmd as string); }}><I className="h-4 w-4" /></Button>; })}
            </div>
            <div ref={editor} contentEditable suppressContentEditableWarning className="min-h-32 p-3 text-sm outline-none [&_ul]:list-disc [&_ul]:pl-5" />
          </div>
        </div>
        <div><Label>Imagem de capa</Label>
          <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary">
            {f.image ? <img src={f.image} alt="Capa" className="max-h-48 w-full rounded object-cover" /> : <><Upload className="h-6 w-6" />Clique para enviar (16:9, até 3MB)</>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
          </label>
        </div>
      </Section>

      <Section title="2. Data, hora e local">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Início</Label><Input type="datetime-local" value={f.start} onChange={(e) => set("start", e.target.value)} /></div>
          <div><Label>Término</Label><Input type="datetime-local" value={f.end} onChange={(e) => set("end", e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3"><Switch checked={f.online} onCheckedChange={(v) => set("online", v)} /><Label>Evento online</Label></div>
        {f.online ? <div><Label>Link da transmissão</Label><Input type="url" value={f.streamUrl} onChange={(e) => set("streamUrl", e.target.value)} placeholder="https://" /></div> : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Nome do local</Label><Input value={f.venue} onChange={(e) => set("venue", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
            </div>
            <div><Label>Endereço</Label><Input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, cidade" /></div>
            {f.address.length > 5 && <iframe title="Mapa" className="h-56 w-full rounded-lg border" src={`https://maps.google.com/maps?q=${encodeURIComponent(f.address)}&output=embed`} />}
          </>
        )}
      </Section>

      <Section title="3. Ingressos & poltronas">
        <Tabs value={seatMode} onValueChange={(v) => setSeatMode(v as "free" | "seated")}>
          <TabsList className="h-auto w-full sm:w-auto"><TabsTrigger value="free" className="flex-1 whitespace-normal">Livre / Geral</TabsTrigger><TabsTrigger value="seated" className="flex-1 whitespace-normal">Mapa de poltronas marcadas</TabsTrigger></TabsList>
        </Tabs>
        {seatMode === "free" ? (
          <>
            {lots.map((l, i) => (
              <div key={l.id} className="grid items-end gap-2 rounded-lg border p-3 md:grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto]">
                <div><Label className="text-xs">Nome</Label><Input value={l.name} onChange={(e) => setLots(lots.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></div>
                <div><Label className="text-xs">Preço (R$)</Label><Input type="number" min={0} value={l.price} onChange={(e) => setLots(lots.map((x, j) => j === i ? { ...x, price: +e.target.value } : x))} /></div>
                <div><Label className="text-xs">Quantidade</Label><Input type="number" min={1} value={l.qty} onChange={(e) => setLots(lots.map((x, j) => j === i ? { ...x, qty: +e.target.value } : x))} /></div>
                <div><Label className="text-xs">Limite/CPF</Label><Input type="number" min={1} value={l.limitPerCpf} onChange={(e) => setLots(lots.map((x, j) => j === i ? { ...x, limitPerCpf: +e.target.value } : x))} /></div>
                <div><Label className="text-xs">Vende até</Label><Input type="datetime-local" value={l.endsAt ?? ""} onChange={(e) => setLots(lots.map((x, j) => j === i ? { ...x, endsAt: e.target.value } : x))} /></div>
                <Button size="icon" variant="ghost" onClick={() => setLots(lots.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>))}
            <Button variant="outline" onClick={() => setLots([...lots, { id: uid(), name: `Pista — ${lots.length + 1}º Lote`, price: 100, qty: 100, sold: 0, limitPerCpf: 4 }])}><Plus className="mr-1 h-4 w-4" />Adicionar lote</Button>
            <div className="flex items-start gap-3 rounded-lg bg-muted p-3"><Switch checked={autoTurn} onCheckedChange={setAutoTurn} /><div><Label>Virada automática de lote</Label><p className="text-xs text-muted-foreground">Abre o próximo lote (mesmo nome antes do “—”) quando o atual esgotar ou passar da data limite.</p></div></div>
          </>
        ) : (
          <>
            {sectors.map((s, i) => (
              <div key={s.id} className="space-y-3 rounded-lg border p-3">
                <div className="grid items-end gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <div><Label className="text-xs">Setor</Label><Input value={s.name} onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Preço (R$)</Label><Input type="number" min={0} value={s.price} onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, price: +e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Fileiras</Label><Input type="number" min={1} max={26} value={s.rows} onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, rows: Math.min(26, +e.target.value) } : x))} /></div>
                  <div><Label className="text-xs">Poltronas/fileira</Label><Input type="number" min={1} max={40} value={s.cols} onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, cols: Math.min(40, +e.target.value) } : x))} /></div>
                  <Button size="icon" variant="ghost" onClick={() => setSectors(sectors.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="overflow-x-auto"><div className="w-max space-y-1">{Array.from({ length: s.rows }).map((_, r) => (
                  <div key={r} className="flex items-center gap-1"><span className="w-4 text-[10px] font-bold text-muted-foreground">{rowLetter(r)}</span>{Array.from({ length: s.cols }).map((_, c) => <span key={c} className="h-3 w-3 rounded-sm bg-seat-free" />)}</div>))}</div></div>
                <p className="text-xs text-muted-foreground">{s.rows * s.cols} poltronas</p>
              </div>))}
            <Button variant="outline" onClick={() => setSectors([...sectors, { id: uid(), name: "Novo setor", price: 100, rows: 4, cols: 10 }])}><Plus className="mr-1 h-4 w-4" />Adicionar setor</Button>
          </>
        )}
      </Section>

      <Section title="4. Marketing & promoções">
        {coupons.map((c, i) => (
          <div key={i} className="grid items-end gap-2 rounded-lg border p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <div><Label className="text-xs">Código</Label><Input value={c.code} onChange={(e) => setCoupons(coupons.map((x, j) => j === i ? { ...x, code: e.target.value.toUpperCase() } : x))} /></div>
            <div><Label className="text-xs">Tipo</Label><Select value={c.type} onValueChange={(v) => setCoupons(coupons.map((x, j) => j === i ? { ...x, type: v as Coupon["type"] } : x))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">% desconto</SelectItem><SelectItem value="fixed">Valor fixo (R$)</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Valor</Label><Input type="number" min={0} value={c.value} onChange={(e) => setCoupons(coupons.map((x, j) => j === i ? { ...x, value: +e.target.value } : x))} /></div>
            <div><Label className="text-xs">Limite de usos</Label><Input type="number" min={1} value={c.maxUses} onChange={(e) => setCoupons(coupons.map((x, j) => j === i ? { ...x, maxUses: +e.target.value } : x))} /></div>
            <Button size="icon" variant="ghost" onClick={() => setCoupons(coupons.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>))}
        <Button variant="outline" onClick={() => setCoupons([...coupons, { code: "PROMO10", type: "percent", value: 10, maxUses: 100, used: 0 }])}><Plus className="mr-1 h-4 w-4" />Adicionar cupom</Button>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Meta Pixel ID</Label><Input value={f.pixelId} onChange={(e) => set("pixelId", e.target.value)} placeholder="123456789012345" /></div>
          <div><Label>Google Analytics ID</Label><Input value={f.gaId} onChange={(e) => set("gaId", e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
        </div>
      </Section>
      <div className="flex justify-end"><Button size="lg" className="w-full shadow-cta sm:w-auto" onClick={save}>Publicar evento</Button></div>
    </div>
  );
}

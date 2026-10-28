import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Download, MapPin, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckinPanel } from "@/components/CheckinPanel";
import { MyEventsPanel } from "@/components/MyEventsPanel";
import { useStore, type EventItem, type Ticket } from "@/lib/store";

export const Route = createFileRoute("/meus-ingressos")({
  validateSearch: (search: Record<string, unknown>): { aba?: "portaria" | "meus-eventos" } => {
    const aba = search["aba"];
    return aba === "portaria" || aba === "meus-eventos" ? { aba } : {};
  },
  head: () => ({
    meta: [
      { title: "Meus Ingressos — Eventus" },
      { name: "description", content: "Acesse seus ingressos digitais, baixe em PDF e compartilhe." },
      { property: "og:title", content: "Meus Ingressos — Eventus" },
      { property: "og:description", content: "Seus ingressos digitais e informações dos eventos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyTickets,
});

function Voucher({ t, ev }: { t: Ticket; ev: EventItem }) {
  const shareText = `Meu ingresso para ${ev.title} — ${new Date(ev.start).toLocaleString("pt-BR")} · Código ${t.code}`;
  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("Eventus — Ingresso Digital", 15, 20);
    doc.setFontSize(14); doc.text(ev.title, 15, 35);
    doc.setFontSize(11);
    [`Data: ${new Date(ev.start).toLocaleString("pt-BR")}`, `Local: ${ev.online ? "Online" : `${ev.venue}, ${ev.address}`}`, `Participante: ${t.name}`, `CPF: ${t.cpf}`, `Ingresso: ${t.seatLabel ?? t.type}`, `Código: ${t.code}`]
      .forEach((l, i) => doc.text(l, 15, 48 + i * 8));
    doc.save(`ingresso-${t.code}.pdf`);
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: ev.title, text: shareText }); } catch { /* cancelado */ } }
    else { await navigator.clipboard.writeText(shareText); toast.success("Copiado para a área de transferência"); }
  };
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border">
        <img src={ev.image} alt="" className="h-28 w-full object-cover" />
        <div className="space-y-1 p-4">
          <h3 className="text-lg font-bold">{ev.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{new Date(ev.start).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{ev.online ? "Online" : `${ev.venue} · ${ev.city}`}</p>
        </div>
        <div className="border-t border-dashed p-4 text-center">
          <p className="mt-2 font-mono text-sm font-bold">{t.code}</p>
          <p className="mt-2 text-sm font-semibold">{t.seatLabel ?? t.type}</p>
          <p className="text-sm text-muted-foreground">{t.name}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button onClick={downloadPdf}><Download className="mr-1 h-4 w-4" />PDF</Button>
        <Button variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</a></Button>
        <Button variant="outline" onClick={share}><Share2 className="mr-1 h-4 w-4" />Compartilhar</Button>
      </div>
    </div>
  );
}

function MyTickets() {
  const { aba } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { tickets, events, myEmail, setMyEmail } = useStore();
  const [open, setOpen] = useState<Ticket | null>(null);
  const mine = tickets.filter((t) => t.email.toLowerCase() === myEmail.toLowerCase());
  const evOf = (id: string) => events.find((e) => e.id === id)!;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Meus Ingressos</h1>
      <Tabs className="mt-5" value={aba ?? "ingressos"} onValueChange={(value) => navigate({ search: value === "portaria" || value === "meus-eventos" ? { aba: value } : {}, replace: true })}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ingressos">Ingressos</TabsTrigger>
          <TabsTrigger value="meus-eventos">Meus eventos</TabsTrigger>
          <TabsTrigger value="portaria">Portaria</TabsTrigger>
        </TabsList>
        <TabsContent value="ingressos" className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-muted-foreground">{mine.length} ingresso(s)</p>
        <div className="w-full sm:w-72"><label className="text-xs text-muted-foreground">E-mail da compra</label><Input value={myEmail} onChange={(e) => setMyEmail(e.target.value)} /></div>
      </div>
      <div className="mt-6 space-y-3">
        {mine.map((t) => { const ev = evOf(t.eventId); if (!ev) return null; return (
          <button key={t.code} onClick={() => setOpen(t)} className="flex w-full items-center gap-4 rounded-xl border bg-card p-3 text-left shadow-card transition hover:border-primary">
            <img src={ev.image} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg object-cover sm:w-28" />
            <div className="min-w-0 flex-1">
              <div className="font-bold">{ev.title}</div>
              <div className="text-sm text-muted-foreground">{new Date(ev.start).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}</div>
              <div className="text-sm">{t.seatLabel ?? t.type}</div>
            </div>
            <Badge className="shrink-0" variant={t.status === "checked_in" ? "secondary" : "default"}>{t.status === "checked_in" ? "Utilizado" : "Válido"}</Badge>
          </button>); })}
        {!mine.length && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">Nenhum ingresso ainda. <Link to="/" className="text-primary underline">Explorar eventos</Link></div>}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Ingresso digital</DialogTitle></DialogHeader>
          {open && <Voucher t={open} ev={evOf(open.eventId)} />}
        </DialogContent>
      </Dialog>
        </TabsContent>
        <TabsContent value="meus-eventos"><MyEventsPanel /></TabsContent>
        <TabsContent value="portaria"><CheckinPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

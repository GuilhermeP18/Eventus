import { create } from "zustand";
import { persist } from "zustand/middleware";
import imgShow from "@/assets/ev-show.jpg";
import imgTeatro from "@/assets/ev-teatro.jpg";
import imgWorkshop from "@/assets/ev-workshop.jpg";
import imgEsporte from "@/assets/ev-esporte.jpg";

// Categorias usadas nos filtros e na criação de eventos.
export const CATEGORIES = ["Show", "Teatro", "Cinema", "Workshop", "Esporte", "Festa", "Stand-up"] as const;
export const BUYER_FEE_PCT = 10; // taxa de conveniência cobrada do comprador
// Tempo de reserva no checkout, em segundos (10 minutos).
export const RESERVATION_SECONDS = 600;

// Tipos do domínio: lote, setor, cupom, evento e ingresso.
export type Lot = { id: string; name: string; price: number; qty: number; sold: number; limitPerCpf: number; endsAt?: string | undefined };
export type Sector = { id: string; name: string; price: number; rows: number; cols: number };
export type Coupon = { code: string; type: "percent" | "fixed"; value: number; maxUses: number; used: number };
export type EventItem = {
  id: string; title: string; category: string; description: string; image: string;
  start: string; end: string; online: boolean; streamUrl?: string | undefined;
  venue: string; city: string; address: string;
  seatMode: "free" | "seated"; lots: Lot[]; autoTurn: boolean; sectors: Sector[];
  blockedSeats: string[]; coupons: Coupon[]; pixelId?: string | undefined; gaId?: string | undefined; platformFeePct: number;
};
export type Ticket = {
  code: string; eventId: string; orderId: string; name: string; email: string; cpf: string;
  type: string; lotId?: string | undefined; seatId?: string | undefined; seatLabel?: string | undefined; price: number;
  purchasedAt: string; status: "confirmed" | "checked_in"; checkedInAt?: string | undefined;
};

// Utilitários: gerador de ids, letra da fileira e formatação em reais.
export const uid = (p = "") => p + Math.random().toString(36).slice(2, 8).toUpperCase();
export const rowLetter = (i: number) => String.fromCharCode(65 + i);
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Data relativa a hoje, usada nos eventos de exemplo.
const day = (offset: number, h: number) => {
  const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, 0, 0, 0); return d.toISOString();
};

// Eventos de exemplo que populam a vitrine.
const seedEvents: EventItem[] = [
  {
    id: "noite-neon", title: "Noite Neon — Festival Indie", category: "Show",
    description: "<p>Uma noite com as bandas mais quentes da cena indie nacional. <b>Abertura dos portões às 19h.</b></p>",
    image: imgShow, start: day(2, 20), end: day(3, 2), online: false,
    venue: "Arena Vibra", city: "São Paulo", address: "Av. das Nações Unidas, 17955, São Paulo",
    seatMode: "free", autoTurn: true, sectors: [], blockedSeats: [],
    lots: [
      { id: "l1", name: "Pista — 1º Lote", price: 90, qty: 50, sold: 50, limitPerCpf: 4 },
      { id: "l2", name: "Pista — 2º Lote", price: 120, qty: 300, sold: 42, limitPerCpf: 4 },
      { id: "l3", name: "VIP Open Bar", price: 280, qty: 100, sold: 18, limitPerCpf: 2 },
    ],
    coupons: [{ code: "NEON10", type: "percent", value: 10, maxUses: 100, used: 3 }], platformFeePct: 8,
  },
  {
    id: "hamlet", title: "Hamlet — Companhia Atlântica", category: "Teatro",
    description: "<p>A tragédia clássica de Shakespeare em montagem contemporânea. Duração: 2h10.</p>",
    image: imgTeatro, start: day(5, 21), end: day(5, 23), online: false,
    venue: "Theatro Municipal", city: "Rio de Janeiro", address: "Praça Floriano, s/n, Rio de Janeiro",
    seatMode: "seated", autoTurn: false, lots: [],
    sectors: [
      { id: "s1", name: "Plateia A", price: 180, rows: 6, cols: 14 },
      { id: "s2", name: "Balcão Nobre", price: 120, rows: 4, cols: 12 },
    ],
    blockedSeats: ["s1:A-5", "s1:A-6", "s1:B-7", "s1:C-3", "s1:C-4", "s1:D-10", "s2:A-1", "s2:B-6", "s2:B-7"],
    coupons: [{ code: "TEATRO20", type: "fixed", value: 20, maxUses: 50, used: 0 }], platformFeePct: 8,
  },
  {
    id: "react-pro", title: "Workshop React & TypeScript Pro", category: "Workshop",
    description: "<p>Imersão prática de 8h com projetos reais. <i>Traga seu notebook.</i></p>",
    image: imgWorkshop, start: day(12, 9), end: day(12, 18), online: true, streamUrl: "https://meet.example.com/react-pro",
    venue: "Online", city: "Online", address: "",
    seatMode: "free", autoTurn: false, sectors: [], blockedSeats: [],
    lots: [{ id: "l1", name: "Ingresso Individual", price: 249, qty: 80, sold: 31, limitPerCpf: 1 }],
    coupons: [], platformFeePct: 8,
  },
  {
    id: "classico", title: "Clássico Estadual — Final", category: "Esporte",
    description: "<p>A grande final do campeonato. Ingressos limitados!</p>",
    image: imgEsporte, start: day(0, 21), end: day(0, 23), online: false,
    venue: "Estádio Mineirão", city: "Belo Horizonte", address: "Av. Antônio Abrahão Caram, 1001, Belo Horizonte",
    seatMode: "seated", autoTurn: false, lots: [],
    sectors: [{ id: "s1", name: "Arquibancada Leste", price: 95, rows: 8, cols: 16 }],
    blockedSeats: ["s1:A-1", "s1:A-2", "s1:B-8", "s1:B-9", "s1:E-12", "s1:F-3"],
    coupons: [], platformFeePct: 8,
  },
];

// Ingressos de exemplo ligados ao e-mail padrão da store.
const seedTickets: Ticket[] = [
  { code: "TKT-8F2KQ1", eventId: "hamlet", orderId: "ORD-1", name: "Ana Souza", email: "voce@exemplo.com", cpf: "123.456.789-00", type: "Plateia A", seatId: "s1:C-12", seatLabel: "Plateia A · Fileira C - Poltrona 12", price: 180, purchasedAt: day(-3, 14), status: "confirmed" },
  { code: "TKT-3JD9X7", eventId: "noite-neon", orderId: "ORD-2", name: "Ana Souza", email: "voce@exemplo.com", cpf: "123.456.789-00", type: "Pista — 2º Lote", lotId: "l2", price: 120, purchasedAt: day(-1, 10), status: "confirmed" },
  { code: "TKT-77PLM2", eventId: "hamlet", orderId: "ORD-3", name: "Bruno Lima", email: "bruno@email.com", cpf: "987.654.321-00", type: "Balcão Nobre", seatId: "s2:A-4", seatLabel: "Balcão Nobre · Fileira A - Poltrona 4", price: 120, purchasedAt: day(-2, 9), status: "checked_in", checkedInAt: day(-1, 20) },
  { code: "TKT-Q1W2E3", eventId: "hamlet", orderId: "ORD-4", name: "Carla Mendes", email: "carla@email.com", cpf: "111.222.333-44", type: "Plateia A", seatId: "s1:B-3", seatLabel: "Plateia A · Fileira B - Poltrona 3", price: 180, purchasedAt: day(-4, 18), status: "confirmed" },
];

// Item do carrinho e dados do perfil editados no painel.
export type CartItem = { type: string; price: number; lotId?: string | undefined; seatId?: string | undefined; seatLabel?: string | undefined };
export type Profile = {
  address: string; birthDate: string; name?: string; email?: string; phone?: string;
  cep?: string; street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string;
};
// Estado global e ações da store.
type State = {
  events: EventItem[]; tickets: Ticket[]; myEmail: string; profile: Profile;
  addEvent: (e: EventItem) => void;
  purchase: (p: { eventId: string; buyer: { name: string; email: string; cpf: string }; items: CartItem[]; couponCode?: string | undefined }) => string;
  checkIn: (code: string) => { ok: boolean; reason?: string; ticket?: Ticket };
  setMyEmail: (e: string) => void;
  setProfile: (p: Partial<Profile>) => void;
};

// Store zustand persistida no navegador; a reidratação roda no cliente para não divergir do SSR.
export const useStore = create<State>()(
  persist(
    (set, get) => ({
      events: seedEvents, tickets: seedTickets, myEmail: "voce@exemplo.com",
      profile: { address: "", birthDate: "" },
      addEvent: (e) => set({ events: [e, ...get().events] }),
      setMyEmail: (myEmail) => set({ myEmail }),
      setProfile: (p) => set({ profile: { ...(get().profile ?? { address: "", birthDate: "" }), ...p } }),
      // Registra a compra, emite os ingressos e atualiza lotes vendidos e uso de cupom.
      purchase: ({ eventId, buyer, items, couponCode }) => {
        const orderId = uid("ORD-");
        const now = new Date().toISOString();
        const newTickets: Ticket[] = items.map((it) => ({ ...it, code: uid("TKT-"), eventId, orderId, ...buyer, purchasedAt: now, status: "confirmed" }));
        set({
          tickets: [...newTickets, ...get().tickets],
          events: get().events.map((ev) => ev.id !== eventId ? ev : {
            ...ev,
            lots: ev.lots.map((l) => ({ ...l, sold: l.sold + items.filter((i) => i.lotId === l.id).length })),
            coupons: ev.coupons.map((c) => c.code === couponCode ? { ...c, used: c.used + 1 } : c),
          }),
        });
        return orderId;
      },
      // Valida o código na portaria e marca o ingresso como utilizado.
      checkIn: (raw) => {
        const code = raw.trim().split("|")[0]!.toUpperCase();
        const t = get().tickets.find((x) => x.code === code);
        if (!t) return { ok: false, reason: "Ingresso inválido" };
        if (t.status === "checked_in") return { ok: false, reason: "Ingresso já utilizado", ticket: t };
        const updated = { ...t, status: "checked_in" as const, checkedInAt: new Date().toISOString() };
        set({ tickets: get().tickets.map((x) => (x.code === code ? updated : x)) });
        return { ok: true, ticket: updated };
      },
    }),
    { name: "ingressa-store-v1", skipHydration: true },
  ),
);

/** Lotes à venda agora, considerando a virada automática. */
export function activeLots(ev: EventItem, now = new Date()): Lot[] {
  const open = ev.lots.filter((l) => l.sold < l.qty && (!l.endsAt || new Date(l.endsAt) > now));
  if (!ev.autoTurn) return open;
  // Virada: apenas o primeiro lote aberto de cada "família" (mesmo prefixo antes de " — ")
  const seen = new Set<string>();
  return open.filter((l) => { const fam = l.name.split(" — ")[0] ?? l.name; if (seen.has(fam)) return false; seen.add(fam); return true; });
}

// Menor preço disponível, mostrado como "a partir de" no card.
export function minPrice(ev: EventItem) {
  const prices = ev.seatMode === "seated" ? ev.sectors.map((s) => s.price) : activeLots(ev).map((l) => l.price);
  return prices.length ? Math.min(...prices) : 0;
}

// Desconto do cupom, limitado ao subtotal.
export function couponDiscount(c: Coupon | undefined, subtotal: number) {
  if (!c) return 0;
  return Math.min(subtotal, c.type === "percent" ? (subtotal * c.value) / 100 : c.value);
}

// Remove scripts e handlers perigosos da descrição do evento.
export function sanitizeHtml(html: string) {
  return html.replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "").replace(/\son\w+="[^"]*"/gi, "").replace(/javascript:/gi, "");
}

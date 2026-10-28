import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Check, Loader2, LockKeyhole, Mail, MapPin, Save, ShieldCheck, Ticket, Undo2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// Rota /painel: exige usuário logado e roda só no cliente, onde fica o localStorage.
export const Route = createFileRoute("/painel")({
  ssr: false,
  // Sem sessão, redireciona para o login guardando o destino em redirect.
  beforeLoad: () => {
    if (!getCurrentUser()) throw redirect({ to: "/login", search: { redirect: "/painel" } });
  },
  head: () => ({
    meta: [
      { title: "Painel pessoal — Eventus" },
      { name: "description", content: "Gerencie seus dados pessoais, contato e configurações de conta na Eventus." },
      { property: "og:title", content: "Painel pessoal — Eventus" },
      { property: "og:description", content: "Seu perfil, dados de contato e configurações pessoais na Eventus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PersonalPanel,
});

// Painel pessoal com as abas de dados pessoais e de segurança da conta.
function PersonalPanel() {
  const { tickets, myEmail, profile, setProfile } = useStore();
  const mine = tickets.filter((ticket) => ticket.email.toLowerCase() === myEmail.toLowerCase());
  const name = profile?.name ?? mine[0]?.name ?? "";
  const email = profile?.email ?? myEmail;
  const phone = profile?.phone ?? "";
  const birthDate = profile?.birthDate ?? "";
  const cep = profile?.cep ?? "";
  const street = profile?.street ?? "";
  const number = profile?.number ?? "";
  const complement = profile?.complement ?? "";
  const district = profile?.district ?? "";
  const city = profile?.city ?? "";
  const state = profile?.state ?? "";
  const [draft, setDraft] = useState({ name, email, phone, birthDate, cep, street, number, complement, district, city, state });
  const [saved, setSaved] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  useEffect(() => {
    setDraft({ name, email, phone, birthDate, cep, street, number, complement, district, city, state });
  }, [name, email, phone, birthDate, cep, street, number, complement, district, city, state]);
  const dirty = (["name", "email", "phone", "birthDate", "cep", "street", "number", "complement", "district", "city", "state"] as const)
    .some((field) => draft[field] !== { name, email, phone, birthDate, cep, street, number, complement, district, city, state }[field]);
  const update = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };
  const lookupCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setDraft((current) => ({ ...current, street: data.logradouro ?? "", district: data.bairro ?? "", city: data.localidade ?? "", state: data.uf ?? "" }));
      setSaved(false);
    } catch {
      toast.error("Não foi possível buscar o CEP");
    } finally {
      setCepLoading(false);
    }
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfile({
      ...draft,
      name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(),
      cep: draft.cep.trim(), street: draft.street.trim(), number: draft.number.trim(),
      complement: draft.complement.trim(), district: draft.district.trim(), city: draft.city.trim(), state: draft.state.trim(),
      address: [draft.street, draft.number, draft.district, draft.city, draft.state].filter(Boolean).join(", "),
    });
    setSaved(true);
    toast.success("Dados pessoais salvos neste navegador");
  };
  const cancel = () => {
    setDraft({ name, email, phone, birthDate, cep, street, number, complement, district, city, state });
    setSaved(false);
  };
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Minha conta</p>
          <h1 className="text-3xl font-bold">Painel pessoal</h1>
        </div>
        <Button asChild variant="outline"><Link to="/meus-ingressos"><Ticket className="h-4 w-4" />Meus ingressos</Link></Button>
      </div>
      <div className="grid gap-8 pt-8 md:grid-cols-[240px_minmax(0,1fr)] md:gap-12">
        <aside className="min-w-0 border-b pb-6 md:border-b-0 md:border-r md:pr-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground" aria-hidden="true">{initials || <UserRound className="h-7 w-7" />}</div>
          <h2 className="mt-4 break-words text-lg font-bold">{name || "Minha conta"}</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">{email}</p>
          <div className="mt-6 flex items-center gap-3 border-y py-4">
            <Ticket className="h-5 w-5 text-primary" />
            <div><p className="text-xl font-bold">{mine.length}</p><p className="text-xs text-muted-foreground">Ingressos comprados</p></div>
          </div>
          <Button asChild variant="ghost" className="mt-3 w-full justify-start"><Link to="/"><CalendarDays className="h-4 w-4" />Explorar eventos</Link></Button>
        </aside>
        <Tabs defaultValue="personal" className="min-w-0">
          <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="personal" className="gap-2"><UserRound className="h-4 w-4" />Dados pessoais</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><ShieldCheck className="h-4 w-4" />Segurança</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <form onSubmit={save}>
              <h2 className="text-xl font-bold">Editar perfil</h2>
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-name">Nome completo</Label><Input id="profile-name" autoComplete="name" required value={draft.name} onChange={(e) => update("name", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="profile-email">E-mail</Label><Input id="profile-email" type="email" autoComplete="email" required value={draft.email} onChange={(e) => update("email", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="profile-phone">Telefone</Label><Input id="profile-phone" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={draft.phone} onChange={(e) => update("phone", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="birth">Data de nascimento</Label><Input id="birth" type="date" autoComplete="bday" value={draft.birthDate} onChange={(e) => update("birthDate", e.target.value)} /></div>
              </div>
              <div className="mt-8 border-t pt-6">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><h3 className="font-semibold">Endereço</h3></div>
                <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <Input id="cep" autoComplete="postal-code" inputMode="numeric" placeholder="00000-000" value={draft.cep}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"); update("cep", v); if (v.replace(/\D/g, "").length === 8) void lookupCep(v); }} />
                      {cepLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Digite o CEP para preencher o endereço automaticamente.</p>
                  </div>
                  <div className="space-y-2"><Label htmlFor="street">Rua</Label><Input id="street" autoComplete="address-line1" value={draft.street} onChange={(e) => update("street", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="number">Número</Label><Input id="number" autoComplete="address-line2" value={draft.number} onChange={(e) => update("number", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="complement">Complemento</Label><Input id="complement" placeholder="Apto, bloco, sala..." value={draft.complement} onChange={(e) => update("complement", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="district">Bairro</Label><Input id="district" autoComplete="address-level3" value={draft.district} onChange={(e) => update("district", e.target.value)} /></div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_80px]">
                    <div className="space-y-2"><Label htmlFor="city">Cidade</Label><Input id="city" autoComplete="address-level2" value={draft.city} onChange={(e) => update("city", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="state">UF</Label><Input id="state" maxLength={2} value={draft.state} onChange={(e) => update("state", e.target.value.toUpperCase())} /></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                <p className="text-xs text-muted-foreground" role="status">{dirty ? "Alterações não salvas" : saved ? "Dados salvos neste navegador" : "Dados armazenados apenas neste navegador"}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={!dirty} onClick={cancel}><Undo2 className="h-4 w-4" />Cancelar</Button>
                  <Button type="submit" disabled={!dirty}>{saved && !dirty ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}Salvar alterações</Button>
                </div>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="security">
            <h2 className="text-xl font-bold">Segurança da conta</h2>
            <section className="mt-6 border-y py-6">
              <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-muted-foreground" /><h3 className="font-semibold">Senha</h3></div>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">A troca de senha ficará disponível quando o login da conta for ativado. Nenhuma senha é armazenada neste navegador.</p>
              <Button className="mt-4" variant="outline" disabled><LockKeyhole className="h-4 w-4" />Alterar senha</Button>
            </section>
            <div className="flex items-start gap-3 py-6"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0"><h3 className="font-semibold">E-mail do perfil</h3><p className="mt-1 break-words text-sm text-muted-foreground">{email}</p></div></div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

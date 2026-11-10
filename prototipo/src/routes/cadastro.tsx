import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ageFromBirthDate,
  formatCpf,
  isEmailValid,
  onlyDigits,
  parseRedirectSearch,
  register,
  type RegisterField,
} from "@/lib/auth";

export const Route = createFileRoute("/cadastro")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => parseRedirectSearch(search),
  head: () => ({
    meta: [
      { title: "Criar conta — Eventus" },
      { name: "description", content: "Crie sua conta Eventus para comprar ingressos e gerenciar eventos." },
    ],
  }),
  component: SignupPage,
});

function Rule({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  const tone = ok === null ? "text-muted-foreground" : ok ? "text-success" : "text-destructive";
  return (
    <p className={`mt-1 flex items-center gap-1.5 text-xs ${tone}`} role={ok === false ? "alert" : undefined}>
      {ok === null ? null : ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {children}
    </p>
  );
}

function SignupPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    birthDate: "",
    responsibleEmail: "",
    password: "",
  });
  const [serverErrors, setServerErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors({});
    setServerMessage(null);
  };

  const emailFilled = form.email.trim() !== "";
  const emailOk = emailFilled ? isEmailValid(form.email) : null;
  const cpfDigits = onlyDigits(form.cpf);
  const cpfComplete = cpfDigits.length === 11;
  const age = form.birthDate ? ageFromBirthDate(form.birthDate) : null;
  const ageOk = form.birthDate ? age !== null && age >= 0 : null;
  const responsibleRequired = age !== null && age < 18;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const result = await register(form);
      if (!result.ok) {
        setServerErrors(result.errors);
        setServerMessage(result.message ?? null);
        return;
      }
      await navigate({
        to: "/login",
        search: redirect ? { registered: true, redirect } : { registered: true },
      });
    } catch (error) {
      setServerMessage(error instanceof Error ? error.message : "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg px-4 py-10 md:py-16">
      <div className="w-full rounded-xl border bg-card p-6 shadow-card">
        <p className="mb-2 text-sm font-semibold text-primary">Minha conta</p>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta serve para participar e organizar eventos. A senha é protegida no servidor.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="signup-name">Nome completo</Label>
            <Input id="signup-name" autoComplete="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
            {serverErrors.name && <Rule ok={false}>{serverErrors.name}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">E-mail</Label>
            <Input id="signup-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
            {emailOk === false && <Rule ok={false}>Informe um e-mail válido</Rule>}
            {serverErrors.email && <Rule ok={false}>{serverErrors.email}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-cpf">CPF</Label>
            <Input id="signup-cpf" inputMode="numeric" placeholder="000.000.000-00" required value={form.cpf} onChange={(e) => set("cpf", formatCpf(e.target.value))} />
            {cpfDigits !== "" && !cpfComplete && <Rule ok={false}>O CPF precisa ter 11 dígitos</Rule>}
            {serverErrors.cpf && <Rule ok={false}>{serverErrors.cpf}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-phone">Telefone</Label>
            <Input id="signup-phone" type="tel" autoComplete="tel" placeholder="(47) 99999-9999" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            {serverErrors.phone && <Rule ok={false}>{serverErrors.phone}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-birth">Data de nascimento</Label>
            <Input id="signup-birth" type="date" autoComplete="bday" required value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            {ageOk === null && <Rule ok={null}>Obrigatória. Menores de 18 anos precisam de um responsável já cadastrado.</Rule>}
            {ageOk === true && <Rule ok>Idade confirmada: {age} anos</Rule>}
            {ageOk === false && <Rule ok={false}>Informe uma data de nascimento válida</Rule>}
            {serverErrors.birthDate && <Rule ok={false}>{serverErrors.birthDate}</Rule>}
          </div>
          {responsibleRequired && (
            <div className="space-y-2 rounded-md border bg-muted/40 p-4">
              <Label htmlFor="signup-responsible">E-mail do responsável adulto já cadastrado</Label>
              <Input
                id="signup-responsible"
                type="email"
                autoComplete="email"
                required
                value={form.responsibleEmail}
                onChange={(e) => set("responsibleEmail", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O responsável precisa ter 18 anos ou mais e já possuir uma conta Eventus. Menores podem participar, mas não organizar eventos.
              </p>
              {serverErrors.responsibleEmail && <Rule ok={false}>{serverErrors.responsibleEmail}</Rule>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha</Label>
            <Input id="signup-password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
            <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
            {serverErrors.password && <Rule ok={false}>{serverErrors.password}</Rule>}
          </div>
          {serverMessage && <p className="text-sm text-destructive" role="alert">{serverMessage}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar conta
          </Button>
        </form>
        <p className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" search={redirect ? { redirect } : {}} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

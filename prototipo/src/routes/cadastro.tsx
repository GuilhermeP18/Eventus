import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MIN_AGE,
  ROLE_LABELS,
  ageFromBirthDate,
  cpfTaken,
  emailTaken,
  formatCpf,
  isEmailValid,
  onlyDigits,
  parseRedirectSearch,
  register,
  type RegisterField,
  type Role,
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
  const [form, setForm] = useState({ name: "", email: "", cpf: "", cep: "", birthDate: "", password: "" });
  const [role, setRole] = useState<Role>("cliente");
  const [serverErrors, setServerErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors({});
  };

  const emailFilled = form.email.trim() !== "";
  const emailOk = emailFilled ? isEmailValid(form.email) : null;
  const emailDuplicate = emailOk ? emailTaken(form.email) : false;
  const cpfDigits = onlyDigits(form.cpf);
  const cpfComplete = cpfDigits.length === 11;
  const cpfDuplicate = cpfComplete ? cpfTaken(form.cpf) : false;
  const cepDigits = onlyDigits(form.cep);
  const age = form.birthDate ? ageFromBirthDate(form.birthDate) : null;
  const ageOk = form.birthDate ? age !== null && age >= MIN_AGE : null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    const result = await register({ ...form, role });
    setLoading(false);
    if (!result.ok) {
      setServerErrors(result.errors);
      return;
    }
    await navigate({
      to: "/verificar-email",
      search: redirect ? { email: result.email, redirect } : { email: result.email },
    });
  };

  return (
    <div className="mx-auto flex max-w-lg px-4 py-10 md:py-16">
      <div className="w-full rounded-xl border bg-card p-6 shadow-card">
        <p className="mb-2 text-sm font-semibold text-primary">Minha conta</p>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastro simulado: os dados ficam apenas neste navegador e a senha é guardada como hash.
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
            {emailDuplicate && <Rule ok={false}>Já existe uma conta com este e-mail</Rule>}
            {emailOk && !emailDuplicate && <Rule ok>E-mail disponível</Rule>}
            {serverErrors.email && !emailDuplicate && emailOk !== false && <Rule ok={false}>{serverErrors.email}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-cpf">CPF</Label>
            <Input id="signup-cpf" inputMode="numeric" placeholder="000.000.000-00" required value={form.cpf} onChange={(e) => set("cpf", formatCpf(e.target.value))} />
            {cpfDigits !== "" && !cpfComplete && <Rule ok={false}>O CPF precisa ter 11 dígitos</Rule>}
            {cpfDuplicate && <Rule ok={false}>Já existe uma conta com este CPF</Rule>}
            {cpfComplete && !cpfDuplicate && <Rule ok>CPF disponível</Rule>}
            {serverErrors.cpf && !cpfDuplicate && (cpfComplete || cpfDigits === "") && <Rule ok={false}>{serverErrors.cpf}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-cep">CEP</Label>
            <Input id="signup-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" required value={form.cep} onChange={(e) => set("cep", onlyDigits(e.target.value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"))} />
            {cepDigits !== "" && cepDigits.length < 8 && <Rule ok={false}>O CEP precisa ter 8 dígitos</Rule>}
            {serverErrors.cep && cepDigits === "" && <Rule ok={false}>{serverErrors.cep}</Rule>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-birth">Data de nascimento</Label>
            <Input id="signup-birth" type="date" autoComplete="bday" required value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            {ageOk === null && <Rule ok={null}>Obrigatória. Menores de {MIN_AGE} anos não podem se cadastrar sem autorização legal.</Rule>}
            {ageOk === true && <Rule ok>Idade confirmada: {age} anos</Rule>}
            {ageOk === false && (
              <Rule ok={false}>
                {age !== null && age >= 0
                  ? `Menores de ${MIN_AGE} anos não podem se cadastrar sem autorização legal`
                  : "Informe uma data de nascimento válida"}
              </Rule>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-role">Perfil</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger id="signup-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map((key) => (
                  <SelectItem key={key} value={key}>{ROLE_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha</Label>
            <Input id="signup-password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
            {serverErrors.password && <Rule ok={false}>{serverErrors.password}</Rule>}
          </div>
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

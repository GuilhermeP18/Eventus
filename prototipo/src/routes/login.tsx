import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LOCK_MINUTES,
  MAX_ATTEMPTS,
  destinationFor,
  getLockRemainingMs,
  login,
  parseRedirectSearch,
} from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => parseRedirectSearch(search),
  head: () => ({
    meta: [
      { title: "Entrar — Eventus" },
      { name: "description", content: "Entre na sua conta Eventus para comprar ingressos e gerenciar eventos." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [lockMs, setLockMs] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLockMs(getLockRemainingMs(email));
  }, [email]);

  useEffect(() => {
    if (lockMs <= 0) return;
    const timer = window.setInterval(() => {
      setLockMs(getLockRemainingMs(email));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockMs > 0, email]);

  const locked = lockMs > 0;
  const lockLabel = `${Math.floor(lockMs / 60000)}:${String(Math.floor((lockMs % 60000) / 1000)).padStart(2, "0")}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setNeedsVerification(false);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.history.push(redirect ?? destinationFor(result.user.role));
      return;
    }
    setError(result.message);
    setNeedsVerification(result.reason === "unverified");
    setLockMs(getLockRemainingMs(email));
    setPassword("");
  };

  return (
    <div className="mx-auto flex max-w-md px-4 py-10 md:py-16">
      <div className="w-full rounded-xl border bg-card p-6 shadow-card">
        <p className="mb-2 text-sm font-semibold text-primary">Minha conta</p>
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Autenticação simulada neste navegador. Depois de entrar, você vai para o destino pedido ou para a tela do seu perfil.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {locked && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 p-3 text-sm text-destructive" role="alert">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Login bloqueado para este e-mail por {LOCK_MINUTES} minutos após {MAX_ATTEMPTS} tentativas incorretas. Tente novamente em {lockLabel}.</p>
            </div>
          )}
          {error && !locked && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          {needsVerification && (
            <Link
              to="/verificar-email"
              search={redirect ? { email: email.trim().toLowerCase(), redirect } : { email: email.trim().toLowerCase() }}
              className="flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
            >
              Ir para a verificação de e-mail
            </Link>
          )}
          <Button type="submit" className="w-full" disabled={loading || locked || !email.trim() || !password}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar
          </Button>
        </form>
        <div className="mt-6 border-t pt-5 text-center">
          <p className="text-sm text-muted-foreground">Ainda não tem conta?</p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/cadastro" search={redirect ? { redirect } : {}}>Criar conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

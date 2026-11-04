import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { destinationFor, getVerificationCode, isEmailVerified, parseRedirectSearch, verifyEmail } from "@/lib/auth";

export const Route = createFileRoute("/verificar-email")({
  validateSearch: (search: Record<string, unknown>): { email?: string; redirect?: string } => {
    const email = typeof search["email"] === "string" ? search["email"] : undefined;
    return { ...parseRedirectSearch(search), ...(email ? { email } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Verificar e-mail — Eventus" },
      { name: "description", content: "Confirme seu e-mail para ativar a conta Eventus." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email, redirect } = Route.useSearch();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [shownCode, setShownCode] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    setShownCode(getVerificationCode(email));
    setAlreadyVerified(isEmailVerified(email));
  }, [email]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    const result = verifyEmail(email, code);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.history.push(redirect ?? destinationFor(result.user.role));
  };

  return (
    <div className="mx-auto flex max-w-md px-4 py-10 md:py-16">
      <div className="w-full rounded-xl border bg-card p-6 shadow-card">
        <p className="mb-2 text-sm font-semibold text-primary">Minha conta</p>
        <h1 className="text-2xl font-bold">Verificar e-mail</h1>
        {!email ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum e-mail para verificar. <Link to="/cadastro" search={{}} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Criar conta</Link>
          </p>
        ) : (
          <>
            <p className="mt-2 break-words text-sm text-muted-foreground">
              Confirme o e-mail <span className="font-medium text-foreground">{email}</span> para poder entrar. Nenhum e-mail é enviado de verdade.
            </p>
            {shownCode && (
              <div className="mt-5 rounded-md border bg-muted p-4 text-center">
                <p className="text-xs text-muted-foreground">Código de verificação (simulado, gerado neste navegador)</p>
                <p className="mt-1 font-display text-2xl font-bold tracking-widest" aria-live="polite">{shownCode}</p>
              </div>
            )}
            {alreadyVerified && (
              <p className="mt-5 text-sm text-success">Este e-mail já foi verificado. <Link to="/login" search={redirect ? { redirect } : {}} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Entrar</Link></p>
            )}
            {!alreadyVerified && (
              <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Código de 6 dígitos</Label>
                  <Input id="verify-code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" required value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }} />
                  {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={code.length !== 6}>
                  <MailCheck className="h-4 w-4" />
                  Confirmar e-mail
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

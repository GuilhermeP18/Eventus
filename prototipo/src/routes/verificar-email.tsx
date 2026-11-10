import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseRedirectSearch } from "@/lib/auth";

export const Route = createFileRoute("/verificar-email")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => parseRedirectSearch(search),
  head: () => ({
    meta: [{ title: "Verificação de e-mail adiada — Eventus" }],
  }),
  component: EmailVerificationDeferredPage,
});

function EmailVerificationDeferredPage() {
  const { redirect } = Route.useSearch();
  return (
    <div className="mx-auto flex max-w-md px-4 py-10 md:py-16">
      <div className="w-full rounded-xl border bg-card p-6 shadow-card">
        <p className="mb-2 text-sm font-semibold text-primary">Minha conta</p>
        <h1 className="text-2xl font-bold">Verificação de e-mail adiada</h1>
        <div className="mt-5 flex items-start gap-3 rounded-md border bg-muted p-4 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>O envio de links por e-mail ainda não está configurado. No momento, o cadastro não exige essa confirmação.</p>
        </div>
        <Button asChild className="mt-6 w-full">
          <Link to="/login" search={redirect ? { redirect } : {}}>Ir para entrar</Link>
        </Button>
      </div>
    </div>
  );
}

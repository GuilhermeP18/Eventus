import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Menu, Ticket, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCurrentUser, logout, type SessionUser } from "@/lib/auth";
import { useStore } from "@/lib/store";

const links = [
  { to: "/", label: "Eventos" },
  { to: "/meus-ingressos", label: "Meus Ingressos" },
  { to: "/painel", label: "Painel" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const setMyEmail = useStore((state) => state.setMyEmail);
  const setProfile = useStore((state) => state.setProfile);

  useEffect(() => {
    let active = true;
    const refreshUser = async () => {
      try {
        const current = await getCurrentUser();
        if (!active) return;
        setUser(current);
        if (current) {
          setMyEmail(current.email);
          setProfile({ name: current.name, email: current.email, phone: current.phone, birthDate: current.birthDate });
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Não foi possível consultar a sessão.");
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    const handleAuthChange = () => void refreshUser();
    window.addEventListener("eventus:auth-change", handleAuthChange);
    void refreshUser();
    return () => {
      active = false;
      window.removeEventListener("eventus:auth-change", handleAuthChange);
    };
  }, [setMyEmail, setProfile]);

  const signOut = async () => {
    try {
      await logout();
      setUser(null);
      setOpen(false);
      window.dispatchEvent(new Event("eventus:auth-change"));
      await navigate({ to: "/" });
      toast.success("Você saiu da sua conta.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível encerrar a sessão.");
    }
  };

  const renderAuthActions = () => (
    <>
      {!authLoading && (!user || user.canCreateEvents) && (
        <Button asChild className="shadow-cta">
          <Link to="/admin/novo-evento">Criar evento</Link>
        </Button>
      )}
      {!authLoading && user ? (
        <div className="flex items-center gap-2">
          <span className="hidden max-w-36 truncate text-sm text-muted-foreground lg:block">{user.name}</span>
          <Button variant="outline" onClick={signOut} aria-label="Sair da conta">
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sair</span>
          </Button>
        </div>
      ) : !authLoading ? (
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/login"><LogIn className="h-4 w-4" />Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/cadastro"><UserRound className="h-4 w-4" />Criar conta</Link>
          </Button>
        </div>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Ticket className="h-4 w-4" /></span>
          Eventus
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/painel" || link.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          {renderAuthActions()}
        </nav>
        <button
          className="grid h-11 w-11 place-items-center md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-2 border-t px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">
              {link.label}
            </Link>
          ))}
          {renderAuthActions()}
        </nav>
      )}
    </header>
  );
}

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Links principais, usados no menu do desktop e no menu do celular.
const links = [
  { to: "/", label: "Eventos" },
  { to: "/meus-ingressos", label: "Meus Ingressos" },
  { to: "/painel", label: "Painel" },
] as const;

// Barra superior: links em linha no desktop e menu hambúrguer no celular.
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Ticket className="h-4 w-4" /></span>
          Eventus
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/painel" || l.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}>{l.label}</Link>
          ))}
          <Button asChild className="ml-2 shadow-cta"><Link to="/admin/novo-evento">Criar evento</Link></Button>
        </nav>
        <button className="grid h-11 w-11 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">{l.label}</Link>
          ))}
          <Button asChild onClick={() => setOpen(false)}><Link to="/admin/novo-evento">Criar evento</Link></Button>
        </nav>
      )}
    </header>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EventsHub } from "@/components/EventsHub";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eventus — Shows, teatro, esportes e workshops" },
      { name: "description", content: "Encontre eventos perto de você, escolha sua poltrona e receba seu ingresso digital." },
      { property: "og:title", content: "Eventus — Seu próximo evento começa aqui" },
      { property: "og:description", content: "Ingressos para shows, teatro, esportes e workshops com assento marcado e ingresso digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="bg-hero text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Ingressos em segundos</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold md:text-6xl">Seu próximo evento começa aqui.</h1>
          <p className="mt-4 max-w-xl text-lg opacity-80">Escolha a poltrona, pague com segurança e apresente seu ingresso no celular.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="shadow-cta" onClick={() => document.getElementById("eventos")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Explorar eventos</Button>
            <Button size="lg" variant="secondary" asChild><Link to="/admin/novo-evento">Vender ingressos</Link></Button>
          </div>
        </div>
      </section>
      <EventsHub />
    </>
  );
}

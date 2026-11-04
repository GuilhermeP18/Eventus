import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/meus-ingressos", search: { aba: "meus-eventos" }, replace: true });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/checkin")({
  beforeLoad: () => {
    throw redirect({ to: "/meus-ingressos", search: { aba: "portaria" }, replace: true });
  },
});

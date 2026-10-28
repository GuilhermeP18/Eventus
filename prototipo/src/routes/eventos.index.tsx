import { createFileRoute, redirect } from "@tanstack/react-router";

// The standalone vitrine screen was retired: /eventos now opens the home screen.
export const Route = createFileRoute("/eventos/")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});

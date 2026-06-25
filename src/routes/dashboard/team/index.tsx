import { createFileRoute } from "@tanstack/react-router";

import { TeamPage } from "@/features/admin/components/team-page";
import { seo } from "@/lib/seo";

// Admin is already guaranteed by the `/dashboard` shell guard.
export const Route = createFileRoute("/dashboard/team/")({
  head: () => ({ meta: seo({ title: "Equipo — ReserveGames" }) }),
  component: TeamPage,
});

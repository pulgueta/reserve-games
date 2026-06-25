import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/features/venues/components/home-page";
import { activeVenuesQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(activeVenuesQueryOptions()),
  head: () => ({
    meta: seo({
      title: "ReserveGames — Reserva canchas y mesas por hora",
      description:
        "Encuentra dónde jugar esta noche. Reserva canchas de fútbol, pádel, tenis y mesas de ping pong o billar en toda Colombia.",
    }),
  }),
  component: HomePage,
});

import { createFileRoute } from "@tanstack/react-router";

import { LoadingComponent } from "@/components/layout/loading-component";
import { validateVenuesSearch } from "@/features/search/lib/venues-search";
import { VenuesPage } from "@/features/venues/components/venues-page";
import { activeVenuesQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/venues/")({
  validateSearch: validateVenuesSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(activeVenuesQueryOptions(deps)),
  head: () => ({
    meta: seo({
      title: "Espacios — ReserveGames",
      description: "Explora canchas y mesas disponibles para reservar.",
    }),
  }),
  component: VenuesPage,
  pendingComponent: LoadingComponent,
});

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { LoadingComponent } from "@/components/layout/loading-component";
import { SearchFilters } from "@/features/search/components/search-filters";
import { validateVenuesSearch } from "@/features/search/lib/venues-search";
import { VenueGrid } from "@/features/venues/components/venue-grid";
import { activeVenuesQueryOptions } from "@/features/venues/hooks/use-venues";
import { formatDate, formatHourLabel } from "@/lib/format";
import { seo } from "@/lib/seo";
import { sportLabel } from "@/lib/sports";

export const Route = createFileRoute("/venues/")({
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

function VenuesPage() {
  const search = Route.useSearch();
  const { data: venues } = useSuspenseQuery(activeVenuesQueryOptions(search));

  const count = venues.length;
  const slotContext =
    search.date || search.time
      ? [
          search.date ? formatDate(new Date(`${search.date}T00:00`)) : null,
          search.time ? formatHourLabel(search.time) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
          {search.sport ? sportLabel(search.sport) : "Todos los espacios"}
          {search.city ? ` en ${search.city}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          {count} {count === 1 ? "espacio disponible" : "espacios disponibles"}
          {slotContext ? ` · ${slotContext}` : ""}
        </p>
      </header>

      <div className="mb-8">
        <SearchFilters search={search} />
      </div>

      <VenueGrid
        venues={venues}
        emptyTitle="No encontramos espacios"
        emptyDescription="Ajusta los filtros o prueba con otra ciudad o deporte."
      />
    </div>
  );
}

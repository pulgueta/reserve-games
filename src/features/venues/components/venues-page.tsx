import { CrosshairIcon } from "@phosphor-icons/react";
import { getRouteApi } from "@tanstack/react-router";
import type { FC } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/features/search/components/search-filters";
import { VenueGrid } from "@/features/venues/components/venue-grid";
import {
  useActiveVenues,
  useNearestVenues,
} from "@/features/venues/hooks/use-venues";
import { useGeolocation } from "@/hooks/use-geolocation";
import { formatDate, formatHourLabel } from "@/lib/format";
import { sportLabel } from "@/lib/sports";

const routeApi = getRouteApi("/_marketing/venues/");

/** Search-results page. Reads the route's validated search and the live venues
 * list (loader-prefetched, so it's a cache hit). A "Cerca de mí" mode swaps in
 * the geospatial `nearest` query, ordering venues by distance from the user. */
export const VenuesPage: FC = () => {
  const search = routeApi.useSearch();
  const geo = useGeolocation();
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { data: venues } = useActiveVenues(search);
  const nearest = useNearestVenues(
    coords ? { ...coords, sport: search.sport } : null,
  );

  const nearMe = Boolean(coords && nearest.data);
  const list = nearMe && nearest.data ? nearest.data : venues;
  const count = list.length;

  const requestNearby = async () => {
    const result = await geo.request();
    if (result) {
      setCoords({ latitude: result.lat, longitude: result.lng });
    }
  };

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
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
            {nearMe
              ? "Cerca de ti"
              : (search.sport
                  ? sportLabel(search.sport)
                  : "Todos los espacios") +
                (search.city ? ` en ${search.city}` : "")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {count}{" "}
            {count === 1 ? "espacio disponible" : "espacios disponibles"}
            {slotContext ? ` · ${slotContext}` : ""}
          </p>
        </div>
        <Button
          variant={nearMe ? "default" : "outline"}
          size="sm"
          onClick={requestNearby}
          disabled={geo.status === "prompting"}
        >
          <CrosshairIcon className="size-4" />
          {nearMe ? "Ordenado por cercanía" : "Cerca de mí"}
        </Button>
      </header>

      <div className="mb-8">
        <SearchFilters search={search} />
      </div>

      <VenueGrid
        venues={list}
        emptyTitle="No encontramos espacios"
        emptyDescription="Ajusta los filtros o prueba con otra ciudad o deporte."
      />
    </div>
  );
};

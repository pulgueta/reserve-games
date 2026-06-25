import { ClockIcon, MapPinIcon, StarIcon } from "@phosphor-icons/react";
import { getRouteApi, Link, notFound } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import type { FC } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CapabilityList } from "@/features/venues/components/capability-list";
import { EquipoRentalList } from "@/features/venues/components/equipo-rental-list";
import { FichaCancha } from "@/features/venues/components/ficha-cancha";
import { ReviewsSection } from "@/features/venues/components/reviews-section";
import { VenueGallery } from "@/features/venues/components/venue-gallery";
import { VenueLocationSection } from "@/features/venues/components/venue-location-section";
import { useVenueDetail } from "@/features/venues/hooks/use-venues";
import { formatCOP, formatHourLabel, formatRating } from "@/lib/format";
import { sportEmoji, sportLabel } from "@/lib/sports";

const routeApi = getRouteApi("/_marketing/venues/$venueId/");

/** Full venue detail page. Data comes from the loader-prefetched factory via the
 * live suspense hook, so this is always a cache hit (no spinner). The loader
 * already threw `notFound()` for a missing venue; the re-throw here only narrows
 * the type — it is unreachable at runtime. */
export const VenueDetailPage: FC = () => {
  const { venueId } = routeApi.useParams();
  const { data } = useVenueDetail(venueId);

  if (!data) {
    throw notFound();
  }

  const { venue, equipment, reviews } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <VenueGallery
        images={venue.images}
        name={venue.name}
        fallbackEmoji={sportEmoji(venue.sport)}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <span aria-hidden>{sportEmoji(venue.sport)}</span>
                {sportLabel(venue.sport)}
              </Badge>
              {venue.reviewCount > 0 ? (
                <span className="flex items-center gap-1 text-sm">
                  <StarIcon weight="fill" className="size-4 text-primary" />
                  {formatRating(venue.rating)}
                  <span className="text-muted-foreground">
                    ({venue.reviewCount})
                  </span>
                </span>
              ) : null}
            </div>
            <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
              {venue.name}
            </h1>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPinIcon className="size-4 shrink-0" />
              {venue.address.fullAddress}
              {venue.neighborhood ? `, ${venue.neighborhood}` : ""} ·{" "}
              {venue.city}
            </p>
            {venue.description ? (
              <p className="max-w-prose text-pretty text-muted-foreground">
                {venue.description}
              </p>
            ) : null}
          </header>

          <Separator />
          <FichaCancha sport={venue.sport} config={venue.sportConfig} />
          <CapabilityList capabilities={venue.capabilities} />
          <EquipoRentalList equipment={equipment} />

          {venue.rules.length > 0 ? (
            <section>
              <h2 className="mb-4 font-semibold text-lg tracking-tight">
                Reglas y políticas
              </h2>
              <ul className="flex flex-col gap-2">
                {venue.rules.map((rule) => (
                  <li
                    key={rule}
                    className="flex gap-2.5 text-muted-foreground text-sm"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {rule}
                  </li>
                ))}
              </ul>
              {venue.cancellationPolicy ? (
                <p className="mt-3 text-muted-foreground text-sm">
                  {venue.cancellationPolicy}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="flex items-center gap-2 text-sm">
            <ClockIcon className="size-4 text-muted-foreground" />
            Horario: {formatHourLabel(venue.openAt)} a{" "}
            {formatHourLabel(venue.closeAt)}
          </section>

          <VenueLocationSection
            lat={venue.lat}
            lng={venue.lng}
            name={venue.name}
            address={`${venue.address.fullAddress}, ${venue.city}`}
          />

          <Separator />
          <ReviewsSection
            rating={venue.rating}
            reviewCount={venue.reviewCount}
            reviews={reviews}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <div>
              <span className="font-semibold text-2xl">
                {formatCOP(venue.pricePerHour)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {venue.chargeByTime ? "hora de juego" : "hora"}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Reserva tu {sportLabel(venue.sport).toLowerCase()} y paga en
              línea.
            </p>

            <Authenticated>
              <Button
                size="lg"
                className="w-full"
                nativeButton={false}
                render={
                  <Link
                    to="/venues/$venueId/book"
                    params={{ venueId: venue.uuid }}
                  />
                }
              >
                Reservar
              </Button>
            </Authenticated>
            <Unauthenticated>
              <Button
                size="lg"
                className="w-full"
                nativeButton={false}
                render={<Link to="/login" />}
              >
                Entrar para reservar
              </Button>
            </Unauthenticated>
          </div>
        </aside>
      </div>
    </div>
  );
};

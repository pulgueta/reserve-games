import type { Venue } from "@convex/schema";
import { MapPinIcon, StarIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/format";
import { sportEmoji, sportLabel } from "@/lib/sports";

interface VenueCardProps {
  venue: Venue;
}

export const VenueCard: FC<VenueCardProps> = ({ venue }) => {
  const cover = venue.images?.[0];

  return (
    <Link
      to="/venues/$venueId"
      params={{ venueId: venue.uuid }}
      className="group block focus-visible:outline-none"
    >
      <Card className="gap-0 overflow-hidden p-0 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-3 group-focus-visible:ring-ring/40">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={venue.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-secondary text-5xl">
              {sportEmoji(venue.sport)}
            </div>
          )}

          <Badge
            variant="secondary"
            className="absolute top-3 left-3 gap-1 bg-background/85 text-foreground backdrop-blur"
          >
            <span aria-hidden>{sportEmoji(venue.sport)}</span>
            {sportLabel(venue.sport)}
          </Badge>

          {venue.reviewCount > 0 && (
            <Badge className="absolute top-3 right-3 gap-1 bg-background/85 text-foreground backdrop-blur">
              <StarIcon weight="fill" className="text-primary" />
              {venue.rating.toLocaleString("es-CO", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="truncate font-semibold tracking-tight">
            {venue.name}
          </h3>
          <p className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPinIcon className="size-4 shrink-0" />
            <span className="truncate">
              {venue.neighborhood ? `${venue.neighborhood}, ` : ""}
              {venue.city}
            </span>
          </p>
          <p className="mt-1 font-semibold">
            <span className="text-lg">{formatCOP(venue.pricePerHour)}</span>
            <span className="font-normal text-muted-foreground text-sm">
              {" "}
              / hora
            </span>
          </p>
        </div>
      </Card>
    </Link>
  );
};

import type { Venue } from "@convex/schema";
import { MapPinIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";

export const VenueCard: FC<{ venue: Venue }> = ({ venue }) => {
  return (
    <Link
      to="/venues/$venueId"
      params={{ venueId: venue._id }}
      className="flex flex-col gap-2 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold tracking-tight">{venue.name}</h3>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs capitalize">
          {venue.sport}
        </span>
      </div>
      <p className="flex items-center gap-1 text-muted-foreground text-sm">
        <MapPinIcon className="size-4 shrink-0" />
        {venue.city}, {venue.state}
      </p>
      <p className="mt-auto pt-2 font-medium text-sm">
        ${venue.pricePerHour}
        <span className="text-muted-foreground"> / hour</span>
      </p>
    </Link>
  );
};

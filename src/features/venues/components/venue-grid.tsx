import type { Venue } from "@convex/schema";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { VenueCard } from "./venue-card";

interface VenueGridProps {
  venues: Venue[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export const VenueGrid: FC<VenueGridProps> = ({
  venues,
  emptyTitle = "No encontramos espacios",
  emptyDescription = "Prueba con otro deporte o ciudad.",
}) => {
  if (venues.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MagnifyingGlassIcon />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {venues.map((venue) => (
        <VenueCard key={venue._id} venue={venue} />
      ))}
    </div>
  );
};

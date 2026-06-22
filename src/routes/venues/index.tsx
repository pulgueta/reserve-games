import { createFileRoute } from "@tanstack/react-router";

import { LoadingComponent } from "@/components/layout/loading-component";
import { VenueCard } from "@/components/venues/venue-card";
import { activeVenuesQueryOptions, useActiveVenues } from "@/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/venues/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(activeVenuesQueryOptions());
  },
  head: () => ({
    meta: seo({
      title: "Venues — Reserve Games",
      description: "Browse sport fields available to book.",
    }),
  }),
  component: VenuesPage,
  pendingComponent: LoadingComponent,
});

function VenuesPage() {
  const { data: venues } = useActiveVenues();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-bold text-2xl tracking-tight">Venues</h1>

      {venues.length === 0 ? (
        <p className="text-muted-foreground">
          No venues yet. Be the first to list one.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard key={venue._id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}

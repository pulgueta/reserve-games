import { createFileRoute, notFound } from "@tanstack/react-router";

import { LoadingComponent } from "@/components/layout/loading-component";
import { VenueDetailPage } from "@/features/venues/components/venue-detail-page";
import { venueDetailQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/venues/$venueId/")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      venueDetailQueryOptions(params.venueId),
    );
    if (!data) {
      throw notFound();
    }
    return data;
  },
  head: ({ loaderData }) => ({
    meta: seo({
      title: `${loaderData?.venue.name} — ReserveGames`,
      description: loaderData?.venue?.description,
    }),
  }),
  component: VenueDetailPage,
  pendingComponent: LoadingComponent,
});

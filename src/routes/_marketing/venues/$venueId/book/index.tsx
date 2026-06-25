import { createFileRoute, notFound } from "@tanstack/react-router";

import { LoadingComponent } from "@/components/layout/loading-component";
import { BookPage } from "@/features/bookings/components/book-page";
import { venueDetailQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/venues/$venueId/book/")({
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
      title: loaderData?.venue
        ? `Reservar ${loaderData.venue.name} — ReserveGames`
        : "Reservar — ReserveGames",
    }),
  }),
  component: BookPage,
  pendingComponent: LoadingComponent,
});

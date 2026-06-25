import { createFileRoute } from "@tanstack/react-router";

import { VenueEditorPage } from "@/features/venues/components/venue-editor-page";
import { venueEditorQueryOptions } from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/dashboard/venue/")({
  loader: async ({ context }) => {
    if (context.orgId) {
      await context.queryClient.ensureQueryData(
        venueEditorQueryOptions(context.orgId),
      );
    }
  },
  head: () => ({ meta: seo({ title: "Tu espacio — ReserveGames" }) }),
  component: VenueEditorPage,
});

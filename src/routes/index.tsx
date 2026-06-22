import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: seo({
      title: "Reserve Games — Book sport fields by the hour",
      description:
        "Find a field near you, reserve your slot, and play. Own a venue? List it and manage bookings in one place.",
    }),
  }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
        Book sport fields by the hour
      </h1>
      <p className="max-w-xl text-pretty text-muted-foreground">
        Find a field near you, reserve your slot, and play. Own a venue? List it
        and manage your bookings in one place.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button nativeButton={false} render={<Link to="/venues" />}>
          Browse venues
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/profile" />}
        >
          Manage your venues
        </Button>
      </div>
    </div>
  );
}

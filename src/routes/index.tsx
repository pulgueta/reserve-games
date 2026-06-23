import { ArrowRightIcon, WarningIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryChips } from "@/features/search/components/category-chips";
import { HeroSearch } from "@/features/search/components/hero-search";
import { VenueGrid } from "@/features/venues/components/venue-grid";
import {
  activeVenuesQueryOptions,
  useActiveVenues,
} from "@/features/venues/hooks/use-venues";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(activeVenuesQueryOptions()),
  head: () => ({
    meta: seo({
      title: "ReserveGames — Reserva canchas y mesas por hora",
      description:
        "Encuentra dónde jugar esta noche. Reserva canchas de fútbol, pádel, tenis y mesas de ping pong o billar en toda Colombia.",
    }),
  }),
  component: Home,
});

// Brand-forward dark hero: deep emerald gradient, no external image to fail.
const heroBackground =
  "radial-gradient(120% 130% at 18% 0%, color-mix(in oklch, var(--primary) 58%, black), color-mix(in oklch, var(--primary) 22%, black) 55%, oklch(0.17 0.02 165) 100%)";

function Home() {
  const { data: venues } = useActiveVenues();

  const popular = [...venues]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 8);

  return (
    <div className="flex flex-col">
      <section
        className="relative overflow-hidden text-white"
        style={{ background: heroBackground }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-white/90 text-xs ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-white" />
            +1.200 espacios en Colombia
          </span>

          <h1 className="mt-5 max-w-2xl text-balance font-semibold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            Encuentra dónde jugar esta noche
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-white/75 sm:text-lg">
            Reserva canchas y mesas por hora, paga en línea y llega listo a
            jugar. Fútbol, pádel, tenis, ping pong, billar y más.
          </p>

          <div className="mt-8 max-w-3xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <CategoryChips />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="space-y-8">
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-semibold text-2xl tracking-tight">
                  Populares ahora
                </h2>
                <p className="text-muted-foreground text-sm">
                  Los espacios mejor calificados cerca de ti.
                </p>
              </div>
              <Link
                to="/venues"
                search={{}}
                className="inline-flex shrink-0 items-center gap-1 font-medium text-primary text-sm hover:underline"
              >
                Ver todo
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>

            <VenueGrid
              venues={popular}
              emptyTitle="Aún no hay espacios"
              emptyDescription="Vuelve pronto: estamos sumando canchas y mesas."
            />
          </div>

          <div className="space-y-6 rounded-lg border border-border bg-card p-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg">Warning Variants Test</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-muted-foreground text-sm">Button</p>
                  <Button variant="warning">Warning Button</Button>
                </div>

                <div>
                  <p className="mb-2 text-muted-foreground text-sm">Badge</p>
                  <Badge variant="warning">Warning Badge</Badge>
                </div>

                <div>
                  <p className="mb-2 text-muted-foreground text-sm">Alert</p>
                  <Alert variant="warning">
                    <WarningIcon />
                    <AlertTitle>Warning Alert</AlertTitle>
                    <AlertDescription>
                      This is a test of the warning variant alert component.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

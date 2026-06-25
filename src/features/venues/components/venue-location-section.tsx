import { MapPinIcon } from "@phosphor-icons/react";
import type { FC } from "react";
import { lazy, Suspense } from "react";

import { Button } from "@/components/ui/button";

// maplibre-gl is heavy; keep it out of the synchronous bundle and stream the
// map in below the fold.
const MapView = lazy(() =>
  import("@/components/ui/map").then((m) => ({ default: m.Map })),
);

interface VenueLocationSectionProps {
  lat?: number;
  lng?: number;
  name: string;
  address: string;
}

export const VenueLocationSection: FC<VenueLocationSectionProps> = ({
  lat,
  lng,
  name,
  address,
}) => {
  if (lat == null || lng == null) return null;

  const directionsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <section
      aria-label={`Ubicación de ${name}`}
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <header className="px-5 pt-5">
        <h2 className="font-semibold text-foreground tracking-tight">
          Ubicación
        </h2>
        <p className="mt-1 flex items-start gap-1.5 text-muted-foreground text-sm">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{address}</span>
        </p>
      </header>

      <div className="mt-4">
        <Suspense
          fallback={<div className="h-[220px] w-full animate-pulse bg-muted" />}
        >
          <MapView
            center={[lng, lat]}
            zoom={15}
            className="h-[220px] rounded-none"
          />
        </Suspense>
      </div>

      <footer className="p-5">
        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={
            // biome-ignore lint/a11y/useAnchorContent: label comes from the Button children merged by Base UI render
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Cómo llegar a ${name}`}
            />
          }
        >
          <MapPinIcon weight="fill" />
          Cómo llegar
        </Button>
      </footer>
    </section>
  );
};

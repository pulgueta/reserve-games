import { MapPinIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import {
  Map as MapCanvas,
  MapControls,
  type MapViewport,
} from "@/components/ui/map";

interface VenueLocationPickerProps {
  /** Controlled viewport. Its `center` ([lng, lat]) is the chosen point. */
  viewport: Partial<MapViewport>;
  /** Fires as the partner pans/zooms; the parent stores the new center. */
  onViewportChange: (viewport: MapViewport) => void;
}

/**
 * Center-pin location picker: the partner pans/zooms the map so the fixed pin
 * sits on the venue entrance. Controlled — the parent owns the viewport and
 * reads its center on save. Lazy-loaded so maplibre-gl stays out of the form's
 * initial bundle.
 */
export const VenueLocationPicker: FC<VenueLocationPickerProps> = ({
  viewport,
  onViewportChange,
}) => {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl border">
      <MapCanvas viewport={viewport} onViewportChange={onViewportChange}>
        <MapControls />
      </MapCanvas>

      {/* Fixed center pin; its tip marks the chosen point. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <MapPinIcon
          className="size-9 -translate-y-1/2 text-primary drop-shadow-md"
          weight="fill"
        />
      </div>
    </div>
  );
};

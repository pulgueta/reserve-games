import type { FC } from "react";

import { CAPABILITY_META, enabledAmenities } from "@/lib/capabilities";

interface CapabilityListProps {
  capabilities?: Record<string, boolean>;
}

/** Amenity grid ("Servicios") built from the venue's enabled capabilities. */
export const CapabilityList: FC<CapabilityListProps> = ({ capabilities }) => {
  const amenities = enabledAmenities(capabilities);

  if (amenities.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-semibold text-lg tracking-tight">Servicios</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((key) => {
          const { label, icon: Icon } = CAPABILITY_META[key];
          return (
            <li key={key} className="flex items-center gap-2.5 text-sm">
              <Icon className="size-5 text-primary" />
              {label}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

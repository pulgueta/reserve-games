import type { VenueUnit } from "@convex/schema";
import type { FC } from "react";

import { chipClass } from "@/features/bookings/lib/chip";

interface UnitSelectorProps {
  units: VenueUnit[];
  selectedId: VenueUnit["_id"] | null;
  noun: string;
  onSelect: (id: VenueUnit["_id"]) => void;
}

export const UnitSelector: FC<UnitSelectorProps> = ({
  units,
  selectedId,
  noun,
  onSelect,
}) => (
  <section>
    <h2 className="mb-3 font-semibold tracking-tight">Elige tu {noun}</h2>
    <div className="flex flex-wrap gap-2">
      {units.map((unit) => (
        <button
          key={unit._id}
          type="button"
          onClick={() => onSelect(unit._id)}
          className={chipClass(selectedId === unit._id)}
        >
          {unit.label}
        </button>
      ))}
    </div>
  </section>
);

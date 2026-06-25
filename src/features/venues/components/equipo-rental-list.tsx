import type { RentalEquipment } from "@convex/schema";
import { BarbellIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import { formatCOP } from "@/lib/format";

interface EquipoRentalListProps {
  equipment: RentalEquipment[];
}

export const EquipoRentalList: FC<EquipoRentalListProps> = ({ equipment }) => {
  if (equipment.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 font-semibold text-lg tracking-tight">
        Equipo en alquiler
      </h2>
      <p className="mb-4 text-muted-foreground text-sm">
        Agrégalo al reservar. Se cobra por hora de uso.
      </p>
      <ul className="divide-y rounded-2xl border">
        {equipment.map((item) => (
          <li
            key={item._id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-center gap-2.5 text-sm">
              <BarbellIcon className="size-4 text-muted-foreground" />
              {item.name}
            </span>
            <span className="font-medium text-sm">
              +{formatCOP(item.pricePerHour)}
              <span className="font-normal text-muted-foreground"> /hora</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

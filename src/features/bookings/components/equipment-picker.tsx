import type { RentalEquipment } from "@convex/schema";
import { CheckIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EquipmentPickerProps {
  equipment: RentalEquipment[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export const EquipmentPicker: FC<EquipmentPickerProps> = ({
  equipment,
  selected,
  onToggle,
}) => (
  <section>
    <h2 className="mb-3 font-semibold tracking-tight">Agrega equipo</h2>
    <div className="flex flex-col gap-2">
      {equipment.map((item) => {
        const checked = selected.has(item._id);
        return (
          <button
            key={item._id}
            type="button"
            onClick={() => onToggle(item._id)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
              checked
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted",
            )}
          >
            <span className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md border",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input",
                )}
              >
                {checked ? <CheckIcon className="size-3.5" /> : null}
              </span>
              {item.name}
            </span>
            <span className="font-medium text-sm">
              +{formatCOP(item.pricePerHour)}
              <span className="font-normal text-muted-foreground"> /hora</span>
            </span>
          </button>
        );
      })}
    </div>
  </section>
);

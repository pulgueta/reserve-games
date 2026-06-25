import type { FC } from "react";

import { chipClass } from "@/features/bookings/lib/chip";

interface DurationPickerProps {
  options: number[];
  effectiveDuration: number;
  onSelect: (hours: number) => void;
}

export const DurationPicker: FC<DurationPickerProps> = ({
  options,
  effectiveDuration,
  onSelect,
}) => (
  <section>
    <h2 className="mb-3 font-semibold tracking-tight">¿Cuántas horas?</h2>
    <div className="flex flex-wrap gap-2">
      {options.map((hours) => (
        <button
          key={hours}
          type="button"
          onClick={() => onSelect(hours)}
          className={chipClass(effectiveDuration === hours)}
        >
          {hours} {hours === 1 ? "hora" : "horas"}
        </button>
      ))}
    </div>
  </section>
);

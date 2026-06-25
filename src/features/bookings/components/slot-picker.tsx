import type { FC } from "react";

import { Input } from "@/components/ui/input";
import type { Slot } from "@/features/bookings/lib/availability";
import { todayISO } from "@/features/bookings/lib/availability";
import { chipClass } from "@/features/bookings/lib/chip";
import { formatHourLabel } from "@/lib/format";

interface SlotPickerProps {
  date: string;
  slots: Slot[];
  selectedStart: number | null;
  onDateChange: (value: string) => void;
  onPickStart: (hour: number) => void;
}

export const SlotPicker: FC<SlotPickerProps> = ({
  date,
  slots,
  selectedStart,
  onDateChange,
  onPickStart,
}) => (
  <section>
    <h2 className="mb-3 font-semibold tracking-tight">Fecha y horario</h2>
    <Input
      type="date"
      value={date}
      min={todayISO()}
      onChange={(e) => onDateChange(e.target.value)}
      className="mb-4 w-full sm:w-56"
      aria-label="Fecha"
    />
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot.hour}
          type="button"
          disabled={slot.disabled}
          onClick={() => onPickStart(slot.hour)}
          className={chipClass(selectedStart === slot.hour)}
        >
          {formatHourLabel(`${slot.hour}:00`)}
        </button>
      ))}
    </div>
    {slots.every((s) => s.disabled) ? (
      <p className="mt-3 text-muted-foreground text-sm">
        No hay horarios disponibles este día. Prueba otra fecha.
      </p>
    ) : null}
  </section>
);

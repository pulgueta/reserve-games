import type { RentalEquipment, Venue, VenueUnit } from "@convex/schema";
import { CheckIcon } from "@phosphor-icons/react";
import { revalidateLogic } from "@tanstack/react-form";
import type { FC } from "react";
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { z } from "zod";

import { useAppForm } from "@/components/form/use-form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import {
  useBookingActions,
  useDayBookings,
} from "@/features/bookings/hooks/use-bookings";
import {
  buildSlots,
  dayStartMs,
  maxDurationFrom,
  occupiedHours,
  parseHour,
} from "@/features/bookings/lib/availability";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { formatCOP, formatHourLabel } from "@/lib/format";
import { sportUnitNoun } from "@/lib/sports";
import { cn } from "@/lib/utils";

const HOUR_MS = 60 * 60 * 1000;

const contactSchema = z.object({
  customerName: z
    .string()
    .min(3, "Ingresa tu nombre")
    .max(120, "El nombre es muy largo"),
  contactPhone: z
    .string()
    .min(7, "Ingresa un teléfono válido")
    .max(20, "Ingresa un teléfono válido"),
  notes: z.string().max(500, "Máximo 500 caracteres"),
});

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ConfirmedBooking {
  date: number;
  durationHours: number;
  total: number;
  unitLabel?: string;
}

interface BookingFlowProps {
  venue: Venue;
  units: VenueUnit[];
  equipment: RentalEquipment[];
  defaultName?: string;
  onConfirmed: (booking: ConfirmedBooking) => void;
}

const chip =
  "rounded-xl border px-3 py-2 font-medium text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const chipActive = "border-transparent bg-primary text-primary-foreground";
const chipIdle = "border-border bg-card hover:bg-muted";

export const BookingFlow: FC<BookingFlowProps> = ({
  venue,
  units,
  equipment,
  defaultName,
  onConfirmed,
}) => {
  const haptic = useWebHaptics();
  const {
    createBooking: { mutateAsync: createBooking },
  } = useBookingActions();

  const [unitId, setUnitId] = useState<VenueUnit["_id"] | null>(
    units[0]?._id ?? null,
  );
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  const dayStart = dayStartMs(date);
  const { data: dayBookings } = useDayBookings(venue._id, dayStart);
  const bookings = dayBookings ?? [];
  const closeHour = parseHour(venue.closeAt);

  const slots = buildSlots({
    openAt: venue.openAt,
    closeAt: venue.closeAt,
    dateStr: date,
    nowMs: Date.now(),
    bookings,
    unitId,
  });
  const occupied = occupiedHours(bookings, unitId);
  const maxDuration =
    start === null ? 0 : maxDurationFrom(start, closeHour, occupied);
  const effectiveDuration = Math.min(duration, Math.max(1, maxDuration));

  const addOns = equipment.filter((e) => selectedAddOns.has(e._id));
  const subtotal = venue.pricePerHour * effectiveDuration;
  const addOnsTotal = addOns.reduce(
    (sum, e) => sum + e.pricePerHour * effectiveDuration,
    0,
  );
  const total = subtotal + addOnsTotal;

  const toggleAddOn = (id: string) =>
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pickStart = (hour: number) => {
    setStart(hour);
    setDuration((d) =>
      Math.min(d, Math.max(1, maxDurationFrom(hour, closeHour, occupied))),
    );
  };

  const onDateChange = (value: string) => {
    setDate(value);
    setStart(null);
  };

  const form = useAppForm({
    onSubmitInvalid: () => haptic.trigger("error"),
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onSubmit: contactSchema },
    defaultValues: {
      customerName: defaultName ?? "",
      contactPhone: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      if (start === null) {
        haptic.trigger("error");
        toast.error("Elige un horario disponible");
        return;
      }
      try {
        await createBooking({
          venueId: venue._id,
          unitId: unitId ?? undefined,
          date: dayStart + start * HOUR_MS,
          durationHours: effectiveDuration,
          customerName: value.customerName,
          contactPhone: value.contactPhone,
          notes: value.notes.trim() || undefined,
          addOns: addOns.map((e) => ({ equipmentId: e._id, qty: 1 })),
        });
        haptic.trigger("success");
        toast.success("¡Reserva confirmada!");
        onConfirmed({
          date: dayStart + start * HOUR_MS,
          durationHours: effectiveDuration,
          total,
          unitLabel: units.find((u) => u._id === unitId)?.label,
        });
      } catch (error) {
        haptic.trigger("error");
        toast.error(getConvexErrorMessage(error));
      }
    },
  });

  const noun = sportUnitNoun(venue.sport);
  const durationOptions = Array.from(
    { length: Math.max(1, Math.min(4, maxDuration || 4)) },
    (_, i) => i + 1,
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
    >
      <div className="flex flex-col gap-8">
        {units.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold tracking-tight">
              Elige tu {noun}
            </h2>
            <div className="flex flex-wrap gap-2">
              {units.map((unit) => (
                <button
                  key={unit._id}
                  type="button"
                  onClick={() => {
                    setUnitId(unit._id);
                    setStart(null);
                  }}
                  className={cn(
                    chip,
                    unitId === unit._id ? chipActive : chipIdle,
                  )}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </section>
        )}

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
                onClick={() => pickStart(slot.hour)}
                className={cn(
                  chip,
                  start === slot.hour ? chipActive : chipIdle,
                )}
              >
                {formatHourLabel(`${slot.hour}:00`)}
              </button>
            ))}
          </div>
          {slots.every((s) => s.disabled) && (
            <p className="mt-3 text-muted-foreground text-sm">
              No hay horarios disponibles este día. Prueba otra fecha.
            </p>
          )}
        </section>

        {start !== null && (
          <section>
            <h2 className="mb-3 font-semibold tracking-tight">
              ¿Cuántas horas?
            </h2>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDuration(hours)}
                  className={cn(
                    chip,
                    effectiveDuration === hours ? chipActive : chipIdle,
                  )}
                >
                  {hours} {hours === 1 ? "hora" : "horas"}
                </button>
              ))}
            </div>
          </section>
        )}

        {equipment.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold tracking-tight">Agrega equipo</h2>
            <div className="flex flex-col gap-2">
              {equipment.map((item) => {
                const checked = selectedAddOns.has(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleAddOn(item._id)}
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
                        {checked && <CheckIcon className="size-3.5" />}
                      </span>
                      {item.name}
                    </span>
                    <span className="font-medium text-sm">
                      +{formatCOP(item.pricePerHour)}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        /hora
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-semibold tracking-tight">Tus datos</h2>
          <div className="flex flex-col gap-4">
            <form.AppField name="customerName">
              {(field) => (
                <field.TextField
                  label="Nombre completo"
                  placeholder="Tu nombre"
                />
              )}
            </form.AppField>
            <form.AppField name="contactPhone">
              {(field) => (
                <field.TextField
                  label="Teléfono de contacto"
                  placeholder="3001234567"
                  inputMode="tel"
                />
              )}
            </form.AppField>
            <form.AppField name="notes">
              {(field) => (
                <field.TextAreaField
                  label="Notas (opcional)"
                  placeholder="¿Algo que debamos saber?"
                  rows={3}
                />
              )}
            </form.AppField>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold tracking-tight">Resumen</h2>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">
                {venue.name}
                {start !== null
                  ? ` · ${formatHourLabel(`${start}:00`)} · ${effectiveDuration}h`
                  : ""}
              </dt>
              <dd className="font-medium">{formatCOP(subtotal)}</dd>
            </div>
            {addOns.map((item) => (
              <div key={item._id} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{item.name}</dt>
                <dd className="font-medium">
                  {formatCOP(item.pricePerHour * effectiveDuration)}
                </dd>
              </div>
            ))}
          </dl>

          <Separator />

          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold text-xl">{formatCOP(total)}</span>
          </div>

          <form.AppForm>
            <form.SubmitButton label="Continuar al pago" />
          </form.AppForm>

          <p className="text-center text-muted-foreground text-xs">
            No se te cobrará hasta confirmar el pago.
          </p>
        </div>
      </aside>
    </form>
  );
};

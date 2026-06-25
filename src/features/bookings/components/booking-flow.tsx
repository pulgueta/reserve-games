import type { Id } from "@convex/_generated/dataModel";
import type { RentalEquipment, Venue, VenueUnit } from "@convex/schema";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { revalidateLogic } from "@tanstack/react-form";
import type { FC } from "react";
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { z } from "zod";

import { useAppForm } from "@/components/form/use-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { DurationPicker } from "@/features/bookings/components/duration-picker";
import { EquipmentPicker } from "@/features/bookings/components/equipment-picker";
import { SlotPicker } from "@/features/bookings/components/slot-picker";
import { UnitSelector } from "@/features/bookings/components/unit-selector";
import { useBookingState } from "@/features/bookings/hooks/use-booking-state";
import { useBookingActions } from "@/features/bookings/hooks/use-bookings";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { formatCOP, formatDate, formatHourLabel } from "@/lib/format";
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

export interface ConfirmedBooking {
  bookingId: Id<"bookings">;
  venueName: string;
  sport: string;
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

const TOTAL_STEPS = 4;

/** Multi-step booking: choose unit + slot, duration + add-ons, your details,
 * then review and continue to payment. Selection/availability/pricing live in
 * {@link useBookingState} (live `useDayBookings`, so the slot grid updates in
 * real time); the backend re-validates the slot on submit. */
export const BookingFlow: FC<BookingFlowProps> = ({
  venue,
  units,
  equipment,
  defaultName,
  onConfirmed,
}) => {
  const haptic = useWebHaptics();
  const {
    createBooking: { mutateAsync: createBooking, isPending },
  } = useBookingActions();
  const state = useBookingState(venue, units, equipment);
  const noun = sportUnitNoun(venue.sport);
  const [step, setStep] = useState(1);

  const form = useAppForm({
    onSubmitInvalid: () => haptic.trigger("error"),
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    defaultValues: {
      customerName: defaultName ?? "",
      contactPhone: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      if (state.start === null) {
        haptic.trigger("error");
        toast.error("Elige un horario disponible");
        setStep(1);
        return;
      }
      try {
        const date = state.dayStart + state.start * HOUR_MS;
        const bookingId = await createBooking({
          venueId: venue._id,
          unitId: state.unitId ?? undefined,
          date,
          durationHours: state.effectiveDuration,
          customerName: value.customerName,
          contactPhone: value.contactPhone,
          notes: value.notes.trim() || undefined,
          addOns: state.addOns.map((item) => ({
            equipmentId: item._id,
            qty: 1,
          })),
        });
        haptic.trigger("success");
        toast.success("¡Reserva creada! Elige cómo pagar.");
        onConfirmed({
          bookingId,
          venueName: venue.name,
          sport: venue.sport,
          date,
          durationHours: state.effectiveDuration,
          total: state.total,
          unitLabel: units.find((unit) => unit._id === state.unitId)?.label,
        });
      } catch (error) {
        haptic.trigger("error");
        toast.error(getConvexErrorMessage(error));
      }
    },
  });

  const goBack = () => {
    haptic.trigger("selection");
    setStep((current) => Math.max(1, current - 1));
  };

  const advance = () => {
    haptic.trigger("selection");
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Paso {step} de {TOTAL_STEPS}
        </span>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index < step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Not a <form>: the footer button submits programmatically via
          form.handleSubmit(), so a native submit handler is unnecessary. */}
      <div className="flex flex-col gap-6">
        {step === 1 ? (
          <div className="flex flex-col gap-6">
            {units.length > 0 ? (
              <UnitSelector
                units={units}
                selectedId={state.unitId}
                noun={noun}
                onSelect={state.selectUnit}
              />
            ) : null}
            <SlotPicker
              date={state.date}
              slots={state.slots}
              selectedStart={state.start}
              onDateChange={state.onDateChange}
              onPickStart={state.pickStart}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-6">
            <DurationPicker
              options={state.durationOptions}
              effectiveDuration={state.effectiveDuration}
              onSelect={state.setDuration}
            />
            {equipment.length > 0 ? (
              <EquipmentPicker
                equipment={equipment}
                selected={state.selectedAddOns}
                onToggle={state.toggleAddOn}
              />
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold tracking-tight">Tus datos</h2>
            <form.AppField
              name="customerName"
              validators={{ onChange: contactSchema.shape.customerName }}
            >
              {(field) => (
                <field.TextField
                  label="Nombre completo"
                  placeholder="Tu nombre"
                />
              )}
            </form.AppField>
            <form.AppField
              name="contactPhone"
              validators={{ onChange: contactSchema.shape.contactPhone }}
            >
              {(field) => <field.PhoneField label="Teléfono de contacto" />}
            </form.AppField>
            <form.AppField
              name="notes"
              validators={{ onChange: contactSchema.shape.notes }}
            >
              {(field) => (
                <field.TextAreaField
                  label="Notas (opcional)"
                  placeholder="¿Algo que debamos saber?"
                  rows={3}
                />
              )}
            </form.AppField>
          </section>
        ) : null}

        {step === 4 ? <OrderReview venue={venue} state={state} /> : null}

        <BookingFooter
          step={step}
          total={state.total}
          slotChosen={state.start !== null}
          isPending={isPending}
          form={form}
          onBack={goBack}
          onAdvance={advance}
        />
      </div>
    </div>
  );
};

interface OrderReviewProps {
  venue: Venue;
  state: ReturnType<typeof useBookingState>;
}

const OrderReview: FC<OrderReviewProps> = ({ venue, state }) => (
  <section className="flex flex-col gap-4">
    <h2 className="font-semibold tracking-tight">Resumen</h2>

    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Espacio</span>
        <span className="text-right font-medium">{venue.name}</span>
      </div>
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Fecha</span>
        <span className="text-right font-medium capitalize">
          {formatDate(state.dayStart)}
        </span>
      </div>
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Hora</span>
        <span className="text-right font-medium">
          {state.start !== null
            ? `${formatHourLabel(`${state.start}:00`)} · ${state.effectiveDuration}h`
            : "—"}
        </span>
      </div>

      <Separator />

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">
            {state.effectiveDuration}h × {formatCOP(venue.pricePerHour)}
          </dt>
          <dd className="font-medium">{formatCOP(state.subtotal)}</dd>
        </div>
        {state.addOns.map((item) => (
          <div key={item._id} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{item.name}</dt>
            <dd className="font-medium">
              {formatCOP(item.pricePerHour * state.effectiveDuration)}
            </dd>
          </div>
        ))}
      </dl>

      <Separator />

      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-semibold text-xl tabular-nums">
          {formatCOP(state.total)}
        </span>
      </div>
    </div>

    <p className="rounded-xl bg-muted/60 p-3 text-center text-muted-foreground text-xs">
      Cancelación gratuita hasta 12 horas antes. No se te cobrará hasta
      confirmar el pago.
    </p>
  </section>
);

interface BookingFooterProps {
  step: number;
  total: number;
  slotChosen: boolean;
  isPending: boolean;
  form: ReturnType<typeof useAppForm>;
  onBack: () => void;
  onAdvance: () => void;
}

const BookingFooter: FC<BookingFooterProps> = ({
  step,
  total,
  slotChosen,
  isPending,
  form,
  onBack,
  onAdvance,
}) => (
  <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-background/90 py-3 backdrop-blur supports-backdrop-filter:bg-background/70">
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">Total</span>
      <span className="font-semibold text-lg tabular-nums">
        {formatCOP(total)}
      </span>
    </div>

    <div className="flex items-center gap-2">
      {step > 1 ? (
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Atrás
        </Button>
      ) : null}

      <form.Subscribe
        selector={(formState) =>
          contactSchema.safeParse(formState.values).success
        }
      >
        {(contactValid) => {
          // Step 1 needs a slot; step 3 needs valid contact details; the final
          // step submits the form (creates the booking).
          const canAdvance =
            step === 1 ? slotChosen : step === 3 ? contactValid : true;
          const isLast = step === TOTAL_STEPS;

          // Always type="button": a button that flips to type="submit" as its
          // own click re-renders it triggers an implicit form submit (which
          // skipped the review step). Submit the form programmatically instead.
          return (
            <Button
              type="button"
              onClick={() => (isLast ? form.handleSubmit() : onAdvance())}
              disabled={!canAdvance || isPending}
            >
              {isPending ? <Spinner className="size-4" /> : null}
              {isLast ? "Continuar al pago" : "Continuar"}
            </Button>
          );
        }}
      </form.Subscribe>
    </div>
  </footer>
);

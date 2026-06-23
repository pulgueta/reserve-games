import type { Venue } from "@convex/schema";
import { revalidateLogic } from "@tanstack/react-form";
import type { FC } from "react";
import { useWebHaptics } from "web-haptics/react";

import { useAppForm } from "@/components/form/use-form";
import { toast } from "@/components/ui/toast";
import { useBookingActions } from "@/features/bookings/hooks/use-bookings";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { createBookingSchema, DURATION_OPTIONS } from "@/lib/schemas";

interface CreateBookingFormProps {
  venue: Venue;
  onSuccess?: () => void;
}

export const CreateBookingForm: FC<CreateBookingFormProps> = ({ venue, onSuccess }) => {
  const haptic = useWebHaptics();
  const {
    createBooking: { mutateAsync: createBooking },
  } = useBookingActions();

  const form = useAppForm({
    onSubmitInvalid: () => {
      haptic.trigger("error");
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onSubmit: createBookingSchema },
    defaultValues: {
      customerName: "",
      contactPhone: "",
      date: "",
      durationHours: "1",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createBooking({
          venueId: venue._id,
          customerName: value.customerName,
          contactPhone: value.contactPhone,
          date: new Date(value.date).getTime(),
          durationHours: Number(value.durationHours),
          notes: value.notes.trim() || undefined,
        });

        haptic.trigger("success");
        toast.success("Booking confirmed!");
        form.reset();
        onSuccess?.();
      } catch (error) {
        haptic.trigger("error");
        toast.error(getConvexErrorMessage(error));
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.AppField name="customerName">
        {(field) => (
          <field.TextField label="Your name" placeholder="Jane Doe" />
        )}
      </form.AppField>

      <form.AppField name="contactPhone">
        {(field) => (
          <field.TextField label="Contact phone" placeholder="3001234567" />
        )}
      </form.AppField>

      <form.AppField name="date">
        {(field) => (
          <field.TextField label="Date & time" type="datetime-local" />
        )}
      </form.AppField>

      <form.AppField name="durationHours">
        {(field) => (
          <field.SelectField label="Duration" options={DURATION_OPTIONS} />
        )}
      </form.AppField>

      <form.AppField name="notes">
        {(field) => (
          <field.TextAreaField
            label="Notes (optional)"
            placeholder="Anything we should know?"
            rows={3}
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton label={`Book · $${venue.pricePerHour}/hr`} />
      </form.AppForm>
    </form>
  );
};

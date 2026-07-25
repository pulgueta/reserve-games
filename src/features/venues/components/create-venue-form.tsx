import type { Sport } from "@convex/schema";
import { revalidateLogic } from "@tanstack/react-form";
import type { FC } from "react";
import { useWebHaptics } from "web-haptics/react";

import { useAppForm } from "@/components/form/use-form";
import { toast } from "@/components/ui/toast";
import { useVenueActions } from "@/features/venues/hooks/use-venues";
import { getConvexErrorMessage } from "@/lib/convex-errors";
import { createVenueSchema, SPORT_OPTIONS } from "@/lib/schemas";

export const CreateVenueForm: FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const haptic = useWebHaptics();
  const {
    createVenue: { mutateAsync: createVenue },
  } = useVenueActions();

  const form = useAppForm({
    onSubmitInvalid: () => {
      haptic.trigger("error");
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onSubmit: createVenueSchema },
    defaultValues: {
      name: "",
      description: "",
      sport: "football" as Sport,
      pricePerHour: "",
      fullAddress: "",
      details: "",
      city: "",
      state: "",
      openAt: "08:00",
      closeAt: "22:00",
    },
    onSubmit: async ({ value }) => {
      try {
        await createVenue({
          name: value.name,
          description: value.description.trim() || undefined,
          sport: value.sport,
          pricePerHour: Number(value.pricePerHour),
          address: {
            fullAddress: value.fullAddress,
            details: value.details.trim() || undefined,
          },
          city: value.city,
          state: value.state,
          isActive: true,
          openAt: value.openAt,
          closeAt: value.closeAt,
        });

        haptic.trigger("success");
        toast.success("Venue created!");
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
      <form.AppField name="name">
        {(field) => (
          <field.TextField label="Venue name" placeholder="Downtown Court 1" />
        )}
      </form.AppField>

      <form.AppField name="sport">
        {(field) => <field.SelectField label="Sport" options={SPORT_OPTIONS} />}
      </form.AppField>

      <form.AppField name="pricePerHour">
        {(field) => (
          <field.TextField
            label="Price per hour"
            type="number"
            inputMode="numeric"
            placeholder="50000"
          />
        )}
      </form.AppField>

      <div className="grid grid-cols-2 gap-4">
        <form.AppField name="city">
          {(field) => <field.TextField label="City" />}
        </form.AppField>
        <form.AppField name="state">
          {(field) => <field.TextField label="State" />}
        </form.AppField>
      </div>

      <form.AppField name="fullAddress">
        {(field) => <field.TextField label="Address" />}
      </form.AppField>

      <form.AppField name="details">
        {(field) => <field.TextField label="Address details (optional)" />}
      </form.AppField>

      <div className="grid grid-cols-2 gap-4">
        <form.AppField name="openAt">
          {(field) => <field.TextField label="Opens at" type="time" />}
        </form.AppField>
        <form.AppField name="closeAt">
          {(field) => <field.TextField label="Closes at" type="time" />}
        </form.AppField>
      </div>

      <form.AppField name="description">
        {(field) => (
          <field.TextAreaField
            label="Description (optional)"
            rows={3}
            placeholder="Tell players about the venue"
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubmitButton label="Create venue" />
      </form.AppForm>
    </form>
  );
};

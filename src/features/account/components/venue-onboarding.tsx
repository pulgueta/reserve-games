import { ArrowLeftIcon } from "@phosphor-icons/react";
import { revalidateLogic } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useWebHaptics } from "web-haptics/react";
import { z } from "zod";

import { useAppForm } from "@/components/form/use-form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { useBecomePartner } from "@/features/account/hooks/use-account";
import { savePendingVenue } from "@/features/account/lib/pending-venue";
import { useFormStepper } from "@/hooks/use-stepper";
import { CITY_OPTIONS, stateForCity } from "@/lib/locations";
import type { Sport } from "@/lib/sports";
import { SPORT_OPTIONS, SPORTS } from "@/lib/sports";

const onboardingSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "Máximo 120 caracteres"),
  contactPhone: z
    .string()
    .min(7, "Ingresa un teléfono válido")
    .max(20, "Teléfono inválido"),
  sport: z.enum(SPORTS),
  city: z.string().min(1, "Elige una ciudad"),
  fullAddress: z.string().min(1, "La dirección es obligatoria"),
});

// One schema per step — the stepper validates only the current step's fields
// before advancing.
const STEP_SCHEMAS = [
  onboardingSchema.pick({ name: true, contactPhone: true }),
  onboardingSchema.pick({ sport: true, city: true, fullAddress: true }),
];

/**
 * Two-step "become a partner" flow. Captures the basic venue data up front
 * (name + phone, then sport + city + address); on submit it creates the Clerk
 * org and stashes the rest to apply to the venue stub once the webhook mirrors
 * it. Price/hours/etc. are completed later in the dashboard.
 */
export const VenueOnboarding: FC = () => {
  const haptic = useWebHaptics();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { becomePartner } = useBecomePartner();
  const {
    step,
    currentStep,
    isFirstStep,
    currentValidator,
    handleNextStepOrSubmit,
    handleCancelOrBack,
  } = useFormStepper(STEP_SCHEMAS);

  const form = useAppForm({
    onSubmitInvalid: () => haptic.trigger("error"),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: currentValidator as typeof onboardingSchema },
    defaultValues: {
      name: "",
      contactPhone: "",
      sport: SPORTS[0] as Sport,
      city: "",
      fullAddress: "",
    },
    onSubmit: async ({ value }) => {
      savePendingVenue({
        contactPhone: value.contactPhone,
        sport: value.sport,
        city: value.city,
        state: stateForCity(value.city) ?? "",
        fullAddress: value.fullAddress,
      });
      try {
        await becomePartner(value.name);
        // The active org is now set; refresh the frozen clerkAuth snapshot so
        // the /dashboard guard resolves role "admin", then hand off.
        await queryClient.invalidateQueries({ queryKey: ["clerkAuth"] });
        haptic.trigger("success");
        toast.success("¡Espacio creado! Estamos guardando la información…");
        await navigate({ to: "/dashboard" });
      } catch (error) {
        haptic.trigger("error");
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo crear el espacio.",
        );
      }
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-bold text-3xl tracking-tight">Crea tu espacio</h1>

        <p className="text-muted-foreground">
          Cuéntanos lo básico para empezar. El precio, los horarios y las fotos
          los completas después en tu panel.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Progress value={(currentStep / step.count) * 100} className="w-full" />
        <span className="text-muted-foreground text-xs">
          Paso {currentStep} de {step.count}
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNextStepOrSubmit(form);
        }}
        className="flex flex-col gap-4"
      >
        {currentStep === 1 ? (
          <>
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="Nombre del espacio"
                  placeholder="Cancha Sintética La 10"
                />
              )}
            </form.AppField>
            <form.AppField name="contactPhone">
              {(field) => (
                <field.PhoneField
                  label="Teléfono de contacto"
                  placeholder="3001234567"
                  inputMode="tel"
                />
              )}
            </form.AppField>
          </>
        ) : (
          <>
            <form.AppField name="sport">
              {(field) => (
                <field.SelectField label="Deporte" options={SPORT_OPTIONS} />
              )}
            </form.AppField>
            <form.AppField name="city">
              {(field) => (
                <field.SelectField
                  label="Ciudad"
                  placeholder="Elige una ciudad"
                  options={CITY_OPTIONS}
                />
              )}
            </form.AppField>
            <form.AppField name="fullAddress">
              {(field) => (
                <field.TextField
                  label="Dirección"
                  placeholder="Calle 10 #20-30"
                />
              )}
            </form.AppField>
          </>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstStep}
            onClick={() => handleCancelOrBack()}
          >
            <ArrowLeftIcon className="size-4" />
            Atrás
          </Button>
          <form.AppForm>
            <form.SubmitButton
              label={step.isCompleted ? "Crear espacio" : "Continuar"}
            />
          </form.AppForm>
        </div>
      </form>
    </div>
  );
};

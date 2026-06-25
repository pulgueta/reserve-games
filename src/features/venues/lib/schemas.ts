import { z } from "zod";

import { SPORTS } from "@/lib/sports";

export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export const TIME_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "hours", label: "Horas" },
  { value: "minutes", label: "Minutos" },
];

/**
 * Admin venue editor (create + edit). String-typed fields mirror native input
 * values; numbers/coords/days are combined and coerced at submit time.
 */
export const venueFormSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "El nombre debe tener menos de 120 caracteres"),
  description: z.string().max(1000, "Máximo 1000 caracteres"),
  sport: z.enum(SPORTS),
  pricePerHour: z
    .string()
    .min(1, "El precio es obligatorio")
    .refine((v) => Number(v) >= 1, "El precio debe ser mayor que 0"),
  timeUnit: z.enum(["hours", "minutes"]),
  maxCapacity: z.string(),
  contactPhone: z.string().max(20),
  city: z.string().min(1, "La ciudad es obligatoria"),
  fullAddress: z.string().min(1, "La dirección es obligatoria"),
  details: z.string(),
  openAt: z.string().min(1, "La hora de apertura es obligatoria"),
  closeAt: z.string().min(1, "La hora de cierre es obligatoria"),
});

export type VenueFormSchema = z.output<typeof venueFormSchema>;

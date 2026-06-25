import { z } from "zod";

export const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1 hora" },
  { value: "2", label: "2 horas" },
  { value: "3", label: "3 horas" },
  { value: "4", label: "4 horas" },
];

export const createBookingSchema = z.object({
  customerName: z
    .string()
    .min(3, "Ingresa tu nombre")
    .max(120, "El nombre es muy largo"),
  contactPhone: z
    .string()
    .min(7, "Ingresa un teléfono válido")
    .max(20, "Ingresa un teléfono válido"),
  date: z.string().min(1, "Elige una fecha y hora"),
  durationHours: z.string().min(1, "Elige una duración"),
  notes: z.string().max(500, "Máximo 500 caracteres"),
});

export type CreateBookingSchema = z.output<typeof createBookingSchema>;

import { z } from "zod";

/** Sport options for selects. Kept client-side to avoid importing Convex server code. */
export const SPORT_OPTIONS: { value: string; label: string }[] = [
  { value: "football", label: "Football" },
  { value: "futsal", label: "Futsal" },
  { value: "tennis", label: "Tennis" },
  { value: "padel", label: "Padel" },
  { value: "basketball", label: "Basketball" },
  { value: "volleyball", label: "Volleyball" },
];

const SPORT_VALUES = [
  "football",
  "futsal",
  "tennis",
  "padel",
  "basketball",
  "volleyball",
] as const;

export const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1 hour" },
  { value: "2", label: "2 hours" },
  { value: "3", label: "3 hours" },
  { value: "4", label: "4 hours" },
];

/**
 * Form schemas use string-typed fields (matching native input values) and
 * convert/validate at submit time, so `defaultValues` line up with the schema
 * and TanStack Form needs no type escapes.
 */
export const createVenueSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must be less than 120 characters"),
  description: z
    .string()
    .max(1000, "Keep the description under 1000 characters"),
  sport: z.enum(SPORT_VALUES),
  pricePerHour: z
    .string()
    .min(1, "Price is required")
    .refine((v) => Number(v) >= 1, "Price must be greater than 0"),
  fullAddress: z.string().min(1, "Address is required"),
  details: z.string(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  openAt: z.string().min(1, "Opening time is required"),
  closeAt: z.string().min(1, "Closing time is required"),
});

export type CreateVenueSchema = z.output<typeof createVenueSchema>;

export const createBookingSchema = z.object({
  customerName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must be less than 120 characters"),
  contactPhone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  date: z.string().min(1, "Pick a date and time"),
  durationHours: z.string().min(1, "Choose a duration"),
  notes: z.string().max(500, "Keep notes under 500 characters"),
});

export type CreateBookingSchema = z.output<typeof createBookingSchema>;

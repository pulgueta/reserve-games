import type { Sport } from "@/lib/sports";
import { SPORTS } from "@/lib/sports";

/** URL search params for the `/venues` listing — all optional, shareable. */
export interface VenuesSearch {
  sport?: Sport;
  city?: string;
  state?: string;
  q?: string;
  /** Desired date (ISO yyyy-mm-dd), forwarded from the hero to the booking flow. */
  date?: string;
  /** Desired time (HH:mm), forwarded from the hero to the booking flow. */
  time?: string;
}

/** Parses/sanitizes raw URL search into a typed `VenuesSearch`. */
export function validateVenuesSearch(
  input: Record<string, unknown>,
): VenuesSearch {
  const str = (v: unknown) =>
    typeof v === "string" && v.length > 0 ? v : undefined;
  const sport =
    typeof input.sport === "string" &&
    (SPORTS as readonly string[]).includes(input.sport)
      ? (input.sport as Sport)
      : undefined;

  return {
    sport,
    city: str(input.city),
    state: str(input.state),
    q: str(input.q),
    date: str(input.date),
    time: str(input.time),
  };
}

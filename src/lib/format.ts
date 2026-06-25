/**
 * es-CO formatting helpers built on native `Intl`. The whole product is
 * Colombian Spanish, so locale and currency are hard-coded — never reach for a
 * date/number library here.
 */

const LOCALE = "es-CO";

const cop = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const mediumDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" });
const longDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: "full" });
const time = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
});
const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const km = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const rating = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function toDate(value: Date | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** "$90.000" — Colombian pesos, no decimals. */
export function formatCOP(amount: number): string {
  return cop.format(amount);
}

/** "22 jun 2026" */
export function formatDate(value: Date | number): string {
  return mediumDate.format(toDate(value));
}

/** "lunes, 22 de junio de 2026" */
export function formatLongDate(value: Date | number): string {
  return longDate.format(toDate(value));
}

/** "7:00 p. m." */
export function formatTime(value: Date | number): string {
  return time.format(toDate(value));
}

/** "22 jun 2026, 7:00 p. m." */
export function formatDateTime(value: Date | number): string {
  return dateTime.format(toDate(value));
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/** "hace 3 días" / "en 2 horas", relative to now. */
export function formatRelativeTime(
  value: Date | number,
  now = Date.now(),
): string {
  let duration = (toDate(value).getTime() - now) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relative.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return relative.format(Math.round(duration), "years");
}

/** "4,8" — one-decimal rating, es-CO. Avoids per-render `Intl` construction. */
export function formatRating(value: number): string {
  return rating.format(value);
}

/** "850 m" / "2,3 km" from a distance in meters. */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${km.format(meters / 1000)} km`;
}

/** "7:00 p. m." from a "HH:mm" 24h string (e.g. venue opening hours). */
export function formatHourLabel(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return time.format(date);
}

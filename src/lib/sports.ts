/**
 * Client-side sport metadata (labels + emoji) for selects, category chips and
 * badges. Kept decoupled from Convex server code; the canonical enum lives in
 * `convex/schema.ts` (`SPORTS`) and the two must stay in sync.
 */

export const SPORT_VALUES = [
  "football",
  "padel",
  "tennis",
  "basketball",
  "pingpong",
  "billiards",
  "gym",
] as const;

export type Sport = (typeof SPORT_VALUES)[number];

export interface SportMeta {
  value: Sport;
  /** es-CO display label. */
  label: string;
  emoji: string;
  /** Noun for the bookable unit, e.g. "cancha" / "mesa". */
  unitNoun: string;
}

export const SPORT_META: Record<Sport, SportMeta> = {
  football: {
    value: "football",
    label: "Fútbol",
    emoji: "⚽",
    unitNoun: "cancha",
  },
  padel: { value: "padel", label: "Pádel", emoji: "🎾", unitNoun: "cancha" },
  tennis: { value: "tennis", label: "Tenis", emoji: "🎾", unitNoun: "cancha" },
  basketball: {
    value: "basketball",
    label: "Baloncesto",
    emoji: "🏀",
    unitNoun: "cancha",
  },
  pingpong: {
    value: "pingpong",
    label: "Ping Pong",
    emoji: "🏓",
    unitNoun: "mesa",
  },
  billiards: {
    value: "billiards",
    label: "Billar",
    emoji: "🎱",
    unitNoun: "mesa",
  },
  gym: { value: "gym", label: "Gym", emoji: "🏋️", unitNoun: "espacio" },
};

export const SPORT_LIST: SportMeta[] = SPORT_VALUES.map((v) => SPORT_META[v]);

/** `{ value, label }` options for `SelectField`. */
export const SPORT_OPTIONS = SPORT_LIST.map(({ value, label }) => ({
  value,
  label,
}));

export function sportLabel(sport: string): string {
  return SPORT_META[sport as Sport]?.label ?? sport;
}

export function sportEmoji(sport: string): string {
  return SPORT_META[sport as Sport]?.emoji ?? "🏟️";
}

export function sportUnitNoun(sport: string): string {
  return SPORT_META[sport as Sport]?.unitNoun ?? "espacio";
}

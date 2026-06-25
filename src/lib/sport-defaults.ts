import type { Sport } from "@/lib/sports";

/**
 * Per-sport editor defaults extracted from the design spec (futbol/padel/
 * pingpong/billar screens + the "Ajustes compartidos vs únicos" matrix). They
 * pre-populate the venue editor's chip sets and the onboarding seed so a socio
 * starts from sensible options for their sport, then customizes freely.
 */

/** The owner-toggled capability flags, mirroring `capabilities` in the schema. */
export interface CapabilityFlags {
  equipmentRental: boolean;
  nightLighting: boolean;
  lockerRooms: boolean;
  cafeteria: boolean;
  parking: boolean;
  bar: boolean;
  multipleUnits: boolean;
  paidServices: boolean;
  lockers: boolean;
}

export interface SportDefaults {
  /** "cancha" / "mesa" / "espacio". */
  unitNoun: string;
  unitNounPlural: string;
  /** "Ficha de la cancha" / "Ficha de la mesa". */
  fichaLabel: string;
  /** "Elige tu cancha" / "Elige tu mesa" (booking unit picker heading). */
  bookUnitLabel: string;
  /** Editor label for the format chip set ("Formato de juego" / "Modalidad"). */
  formatEditorLabel: string;
  /** Format chip options (single-select in the editor). */
  formats: string[];
  /** Editor label for the surface input, or null when the sport has no surface. */
  surfaceEditorLabel: string | null;
  surfaces: string[] | null;
  /** Editor label for the unit-type input, or null when not applicable. */
  unitTypeEditorLabel: string | null;
  unitTypes: string[] | null;
  /** Editor label for the indoor/outdoor "Escenario" chip set. */
  escenarioEditorLabel: string;
  escenarios: string[];
  /** Example placeholder for the free-form dimensions field, or null. */
  dimensionsExample: string | null;
  /** Default rentable equipment to seed when "equipmentRental" is enabled. */
  equipment: Array<{ name: string; priceCOP: number }>;
  /** Capability switches pre-checked for the sport (owner overrides any). */
  capabilities: CapabilityFlags;
  /** Suggested base price per hour, COP. */
  defaultPricePerHour: number;
  /** Charge by elapsed time (billar) vs fixed hourly slots. */
  chargeByTime: boolean;
  /** Suggested "Reglas del espacio" bullets. */
  sampleRules: string[];
}

export const SPORT_DEFAULTS: Record<Sport, SportDefaults> = {
  football: {
    unitNoun: "cancha",
    unitNounPlural: "canchas",
    fichaLabel: "Ficha de la cancha",
    bookUnitLabel: "Elige tu cancha",
    formatEditorLabel: "Formato de juego",
    formats: ["Fútbol 5", "Fútbol 7", "Fútbol 8", "Fútbol 11"],
    surfaceEditorLabel: "Superficie",
    surfaces: [
      "Sintética",
      "Sintética FIFA Quality",
      "Césped natural",
      "Caucho",
      "Concreto",
    ],
    unitTypeEditorLabel: null,
    unitTypes: null,
    escenarioEditorLabel: "Escenario",
    escenarios: ["Cancha cubierta", "Cancha descubierta", "Cancha techada"],
    dimensionsExample: "40 × 20 m",
    equipment: [
      { name: "Balón profesional", priceCOP: 5000 },
      { name: "Petos · juego x10", priceCOP: 8000 },
      { name: "Conos de entreno", priceCOP: 4000 },
      { name: "Arquería portátil", priceCOP: 10000 },
    ],
    capabilities: {
      equipmentRental: true,
      nightLighting: true,
      lockerRooms: true,
      cafeteria: false,
      parking: true,
      bar: false,
      multipleUnits: true,
      paidServices: true,
      lockers: false,
    },
    defaultPricePerHour: 90000,
    chargeByTime: false,
    sampleRules: [
      "Guayos de microtaco o tenis. Sin tacos de aluminio.",
      "Máximo 22 jugadores en cancha.",
      "Tolerancia de 15 min; luego se libera la cancha.",
    ],
  },
  padel: {
    unitNoun: "cancha",
    unitNounPlural: "canchas",
    fichaLabel: "Ficha de la cancha",
    bookUnitLabel: "Elige tu cancha",
    formatEditorLabel: "Formato",
    formats: ["Singles", "Dobles"],
    surfaceEditorLabel: "Cerramiento",
    surfaces: ["Cristal", "Muro", "Hierba artificial"],
    unitTypeEditorLabel: "Tipo de cancha",
    unitTypes: ["Panorámica", "De muro", "Individual"],
    escenarioEditorLabel: "Escenario",
    escenarios: ["Indoor climatizado", "Outdoor", "Techada"],
    dimensionsExample: "20 × 10 m",
    equipment: [
      { name: "Palas · par", priceCOP: 12000 },
      { name: "Pelotas · bote x3", priceCOP: 9000 },
      { name: "Grip de repuesto", priceCOP: 3000 },
      { name: "Toalla deportiva", priceCOP: 2000 },
    ],
    capabilities: {
      equipmentRental: true,
      nightLighting: true,
      lockerRooms: true,
      cafeteria: true,
      parking: true,
      bar: false,
      multipleUnits: true,
      paidServices: true,
      lockers: false,
    },
    defaultPricePerHour: 70000,
    chargeByTime: false,
    sampleRules: [
      "Calzado de suela no marcante.",
      "Reserva por cancha completa (4 jugadores).",
      "Devuelve las palas al finalizar.",
    ],
  },
  tennis: {
    unitNoun: "cancha",
    unitNounPlural: "canchas",
    fichaLabel: "Ficha de la cancha",
    bookUnitLabel: "Elige tu cancha",
    formatEditorLabel: "Formato",
    formats: ["Singles", "Dobles"],
    surfaceEditorLabel: "Superficie",
    surfaces: ["Arcilla", "Cemento", "Hierba", "Sintética"],
    unitTypeEditorLabel: null,
    unitTypes: null,
    escenarioEditorLabel: "Escenario",
    escenarios: ["Outdoor", "Indoor", "Techada"],
    dimensionsExample: "23.77 × 10.97 m",
    equipment: [
      { name: "Raquetas · par", priceCOP: 8000 },
      { name: "Pelotas · tarro x3", priceCOP: 5000 },
      { name: "Rodillera deportiva", priceCOP: 3000 },
    ],
    capabilities: {
      equipmentRental: true,
      nightLighting: true,
      lockerRooms: true,
      cafeteria: false,
      parking: true,
      bar: false,
      multipleUnits: true,
      paidServices: true,
      lockers: false,
    },
    defaultPricePerHour: 45000,
    chargeByTime: false,
    sampleRules: [
      "Calzado de tenis adecuado a la superficie.",
      "Respeta el turno de la cancha contigua.",
      "Recoge las pelotas al finalizar.",
    ],
  },
  basketball: {
    unitNoun: "cancha",
    unitNounPlural: "canchas",
    fichaLabel: "Ficha de la cancha",
    bookUnitLabel: "Elige tu cancha",
    formatEditorLabel: "Formato",
    formats: ["3×3", "5×5"],
    surfaceEditorLabel: "Superficie",
    surfaces: ["Parqué", "Cemento", "Sintética"],
    unitTypeEditorLabel: null,
    unitTypes: null,
    escenarioEditorLabel: "Escenario",
    escenarios: ["Indoor", "Outdoor", "Techada"],
    dimensionsExample: "28 × 15 m",
    equipment: [
      { name: "Balón profesional", priceCOP: 5000 },
      { name: "Petos · juego x10", priceCOP: 6000 },
    ],
    capabilities: {
      equipmentRental: true,
      nightLighting: true,
      lockerRooms: true,
      cafeteria: false,
      parking: false,
      bar: false,
      multipleUnits: false,
      paidServices: false,
      lockers: false,
    },
    defaultPricePerHour: 50000,
    chargeByTime: false,
    sampleRules: [
      "Calzado deportivo de suela limpia.",
      "Cuida los balones y el tablero.",
      "Respeta el horario reservado.",
    ],
  },
  pingpong: {
    unitNoun: "mesa",
    unitNounPlural: "mesas",
    fichaLabel: "Ficha de la mesa",
    bookUnitLabel: "Elige tu mesa",
    formatEditorLabel: "Formato",
    formats: ["Individual", "Dobles"],
    surfaceEditorLabel: null,
    surfaces: null,
    unitTypeEditorLabel: "Tipo de mesa",
    unitTypes: ["ITTF profesional", "Recreativa", "Exterior"],
    escenarioEditorLabel: "Ubicación",
    escenarios: ["Indoor", "Outdoor"],
    dimensionsExample: null,
    equipment: [
      { name: "Raquetas · par", priceCOP: 4000 },
      { name: "Pelotas · set x6", priceCOP: 3000 },
      { name: "Robot lanzapelotas", priceCOP: 15000 },
    ],
    capabilities: {
      equipmentRental: true,
      nightLighting: false,
      lockerRooms: false,
      cafeteria: false,
      parking: false,
      bar: false,
      multipleUnits: true,
      paidServices: true,
      lockers: true,
    },
    defaultPricePerHour: 18000,
    chargeByTime: false,
    sampleRules: [
      "Calzado deportivo de suela limpia.",
      "Cuida las raquetas; reposición $20.000.",
      "Máximo 4 jugadores por mesa.",
    ],
  },
  billiards: {
    unitNoun: "mesa",
    unitNounPlural: "mesas",
    fichaLabel: "Ficha de la mesa",
    bookUnitLabel: "Elige tu mesa",
    formatEditorLabel: "Modalidad",
    formats: ["Pool americano", "Troneras", "3 bandas", "Snooker"],
    surfaceEditorLabel: "Paño",
    surfaces: ["Simonis 860", "Simonis 300 Rapide", "Hainsworth"],
    unitTypeEditorLabel: "Tamaño de mesa",
    unitTypes: [
      "Mesa de 7 pies",
      "Mesa de 8 pies",
      "Mesa de 9 pies",
      "Mesa de 10 pies",
    ],
    escenarioEditorLabel: "Escenario",
    escenarios: ["Indoor"],
    dimensionsExample: null,
    equipment: [
      { name: "Taco premium · par", priceCOP: 6000 },
      { name: "Set de bolas profesional", priceCOP: 5000 },
      { name: "Tiza y puente", priceCOP: 2000 },
    ],
    capabilities: {
      equipmentRental: true,
      nightLighting: false,
      lockerRooms: false,
      cafeteria: false,
      parking: true,
      bar: true,
      multipleUnits: true,
      paidServices: false,
      lockers: false,
    },
    defaultPricePerHour: 22000,
    chargeByTime: true,
    sampleRules: [
      "No apoyar bebidas sobre el paño.",
      "Prohibido sentarse en las mesas.",
      "Reposición de paño por daños.",
    ],
  },
  gym: {
    unitNoun: "espacio",
    unitNounPlural: "espacios",
    fichaLabel: "Ficha del espacio",
    bookUnitLabel: "Elige tu espacio",
    formatEditorLabel: "Modalidad",
    formats: ["Entrenamiento libre", "Clase grupal", "Entrenamiento personal"],
    surfaceEditorLabel: null,
    surfaces: null,
    unitTypeEditorLabel: "Tipo de espacio",
    unitTypes: [
      "Sala de pesas",
      "Sala funcional",
      "Sala de cardio",
      "Sala de yoga",
    ],
    escenarioEditorLabel: "Escenario",
    escenarios: ["Indoor"],
    dimensionsExample: null,
    equipment: [
      { name: "Toalla deportiva", priceCOP: 2000 },
      { name: "Guantes de entrenamiento", priceCOP: 5000 },
      { name: "Banda de resistencia", priceCOP: 3000 },
    ],
    capabilities: {
      equipmentRental: false,
      nightLighting: false,
      lockerRooms: true,
      cafeteria: false,
      parking: false,
      bar: false,
      multipleUnits: false,
      paidServices: true,
      lockers: true,
    },
    defaultPricePerHour: 15000,
    chargeByTime: false,
    sampleRules: [
      "Usa toalla sobre los equipos.",
      "Devuelve el material a su lugar.",
      "Respeta el aforo del espacio.",
    ],
  },
};

/** The capability toggles shown in the editor's "¿Qué ofreces?" panel. */
export const CAPABILITY_META: Array<{
  key: keyof CapabilityFlags;
  label: string;
  description: string;
}> = [
  {
    key: "equipmentRental",
    label: "Alquiler de equipo",
    description: "Raquetas, balones, tacos…",
  },
  {
    key: "nightLighting",
    label: "Iluminación nocturna",
    description: "Con recargo por hora",
  },
  {
    key: "paidServices",
    label: "Servicios con costo",
    description: "Árbitro, profesor, recogebolas",
  },
  {
    key: "cafeteria",
    label: "Cafetería",
    description: "Venta de alimentos y snacks",
  },
  { key: "bar", label: "Bar", description: "Bebidas y licores" },
  {
    key: "lockerRooms",
    label: "Vestidores y duchas",
    description: "Para los jugadores",
  },
  { key: "lockers", label: "Casilleros", description: "Guardado seguro" },
  {
    key: "parking",
    label: "Parqueadero",
    description: "Propio o por convenio",
  },
  {
    key: "multipleUnits",
    label: "Múltiples unidades",
    description: "Reserva por cancha o mesa",
  },
];

export function sportDefaults(sport: Sport): SportDefaults {
  return SPORT_DEFAULTS[sport];
}

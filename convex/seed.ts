import { fakerES as faker } from "@faker-js/faker";
import { z } from "zod";

import { zInternalMutation } from ".";
import type { Capabilities, Sport } from "./schema";

/**
 * Demo seed for the customer app (no admin UI yet). Wipes and repopulates
 * venues + their units, equipment and reviews across every sport and a few
 * Colombian cities. Run with `npx convex run seed:run`.
 *
 * ponytail: deterministic via `faker.seed`; images are picsum placeholders so
 * cards always render — swap for real photos when available.
 */

type Capability = keyof Capabilities;

interface SportPreset {
  unitNoun: "cancha" | "mesa" | "espacio";
  unitCount: number;
  capabilities: Capability[];
  chargeByTime?: boolean;
  priceRange: [number, number];
  config: () => Record<string, string>;
  equipment: { name: string; pricePerHour: number }[];
  rules: string[];
  names: string[];
}

const cities: { city: string; state: string; neighborhoods: string[] }[] = [
  { city: "Bogotá", state: "Cundinamarca", neighborhoods: ["Chapinero", "Usaquén", "Cedritos", "Salitre"] },
  { city: "Medellín", state: "Antioquia", neighborhoods: ["El Poblado", "Laureles", "Envigado", "Belén"] },
  { city: "Cali", state: "Valle del Cauca", neighborhoods: ["Granada", "San Fernando", "Ciudad Jardín"] },
  { city: "Barranquilla", state: "Atlántico", neighborhoods: ["El Prado", "Alto Prado", "Riomar"] },
];

const PRESETS: Record<Sport, SportPreset> = {
  football: {
    unitNoun: "cancha",
    unitCount: 3,
    capabilities: ["equipmentRental", "nightLighting", "lockerRooms", "parking", "cafeteria", "multipleUnits"],
    priceRange: [70_000, 130_000],
    config: () => ({
      format: faker.helpers.arrayElement(["Fútbol 5", "Fútbol 7", "Fútbol 11"]),
      surface: "Sintética FIFA Quality",
      dimensions: faker.helpers.arrayElement(["25 × 15 m", "40 × 20 m", "90 × 45 m"]),
      capacity: faker.helpers.arrayElement(["10 jugadores", "14 jugadores", "22 jugadores"]),
    }),
    equipment: [
      { name: "Balón profesional", pricePerHour: 5_000 },
      { name: "Petos de juego (x10)", pricePerHour: 8_000 },
      { name: "Chaleco de árbitro", pricePerHour: 10_000 },
    ],
    rules: [
      "Solo zapatillas de microfútbol o guayos sintéticos.",
      "Llega 10 minutos antes de tu reserva.",
      "Cancelación gratuita hasta 12 horas antes.",
    ],
    names: ["Complejo El Campín", "Arena Gol Norte", "La Bombonera Fútbol 5", "Estadio Los Andes"],
  },
  padel: {
    unitNoun: "cancha",
    unitCount: 3,
    capabilities: ["equipmentRental", "nightLighting", "lockerRooms", "cafeteria", "parking", "multipleUnits"],
    priceRange: [60_000, 100_000],
    config: () => ({
      format: faker.helpers.arrayElement(["Singles", "Dobles"]),
      unitType: faker.helpers.arrayElement(["Panorámica", "Muro de cristal"]),
      surface: "Indoor",
      dimensions: "20 × 10 m",
    }),
    equipment: [
      { name: "Palas (x2)", pricePerHour: 9_000 },
      { name: "Pelotas (x3)", pricePerHour: 6_000 },
      { name: "Grip de repuesto", pricePerHour: 3_000 },
      { name: "Toalla deportiva", pricePerHour: 5_000 },
    ],
    rules: [
      "Uso obligatorio de calzado deportivo.",
      "Máximo 4 jugadores por cancha.",
      "Respeta el turno siguiente: la reserva termina a la hora exacta.",
    ],
    names: ["Arena Pádel El Poblado", "Club Pádel Granada", "Set Point Pádel", "Match Pádel Center"],
  },
  tennis: {
    unitNoun: "cancha",
    unitCount: 2,
    capabilities: ["equipmentRental", "nightLighting", "lockerRooms", "parking", "multipleUnits"],
    priceRange: [50_000, 90_000],
    config: () => ({
      format: faker.helpers.arrayElement(["Singles", "Dobles"]),
      surface: faker.helpers.arrayElement(["Polvo de ladrillo", "Cancha dura", "Césped sintético"]),
      dimensions: "23.77 × 10.97 m",
    }),
    equipment: [
      { name: "Raquetas (x2)", pricePerHour: 8_000 },
      { name: "Tubo de pelotas (x3)", pricePerHour: 6_000 },
    ],
    rules: ["Solo calzado de tenis sin marca.", "Cuida la superficie: no arrastres sillas."],
    names: ["Club de Tenis La Sabana", "Tennis Park Usaquén", "Cancha Roland Cali"],
  },
  basketball: {
    unitNoun: "cancha",
    unitCount: 2,
    capabilities: ["nightLighting", "lockerRooms", "parking", "multipleUnits"],
    priceRange: [40_000, 80_000],
    config: () => ({
      format: "5 vs 5",
      surface: faker.helpers.arrayElement(["Duela de madera", "Concreto pulido", "Sintético outdoor"]),
      capacity: "10 jugadores",
    }),
    equipment: [{ name: "Balón de baloncesto", pricePerHour: 5_000 }],
    rules: ["Prohibido colgarse del aro.", "Respeta el aforo máximo de la cancha."],
    names: ["Polideportivo Central", "Cancha Los Aros", "Arena Hoops Medellín"],
  },
  pingpong: {
    unitNoun: "mesa",
    unitCount: 6,
    capabilities: ["equipmentRental", "cafeteria", "parking", "multipleUnits"],
    priceRange: [12_000, 28_000],
    config: () => ({
      unitType: faker.helpers.arrayElement(["Profesional ITTF", "Recreativa"]),
      format: faker.helpers.arrayElement(["Individual", "Dobles"]),
      surface: "Mesa azul reglamentaria",
    }),
    equipment: [
      { name: "Raquetas (x2)", pricePerHour: 4_000 },
      { name: "Pelotas (x6)", pricePerHour: 3_000 },
      { name: "Robot lanzapelotas", pricePerHour: 15_000 },
    ],
    rules: ["Una persona por raqueta alquilada.", "Recoge las pelotas al terminar."],
    names: ["Club de Mesa Laureles", "Ping Pong House", "Spin Center Bogotá"],
  },
  billiards: {
    unitNoun: "mesa",
    unitCount: 4,
    capabilities: ["equipmentRental", "bar", "cafeteria", "parking", "multipleUnits"],
    chargeByTime: true,
    priceRange: [15_000, 30_000],
    config: () => ({
      unitType: faker.helpers.arrayElement(["Pool americano", "Troneras", "3 bandas"]),
      surface: "Paño profesional",
    }),
    equipment: [
      { name: "Taco premium", pricePerHour: 6_000 },
      { name: "Set de bolas profesional", pricePerHour: 8_000 },
      { name: "Tiza y puente", pricePerHour: 3_000 },
    ],
    rules: ["Prohibido apoyar bebidas sobre la mesa.", "Reposición de paño en caso de daño."],
    names: ["Billar Club Central", "Pool & Bar La Tronera", "Carambola Billares"],
  },
  gym: {
    unitNoun: "espacio",
    unitCount: 1,
    capabilities: ["lockerRooms", "parking", "cafeteria"],
    priceRange: [20_000, 45_000],
    config: () => ({
      capacity: faker.helpers.arrayElement(["20 personas", "30 personas", "40 personas"]),
      surface: "Zona funcional + peso libre",
    }),
    equipment: [],
    rules: ["Trae tu toalla.", "Desinfecta las máquinas después de usarlas."],
    names: ["Gimnasio Energy Fit", "Box CrossTraining", "Studio Wellness"],
  },
};

const REVIEW_COMMENTS = [
  "Excelente espacio, muy bien mantenido. Volveré.",
  "Buena ubicación y atención. La reserva fue súper fácil.",
  "El lugar está impecable, aunque el parqueadero es pequeño.",
  "Muy recomendado para jugar con amigos. Iluminación de primera.",
  "Cumple con lo prometido. Precio justo por la calidad.",
  "Reservé de última hora y todo perfecto. 100% recomendado.",
];

function pickCapabilities(enabled: Capability[]): Capabilities {
  const all: Capability[] = [
    "equipmentRental",
    "nightLighting",
    "lockerRooms",
    "cafeteria",
    "parking",
    "bar",
    "multipleUnits",
  ];
  return Object.fromEntries(
    all.map((cap) => [cap, enabled.includes(cap)]),
  ) as Capabilities;
}

export const run = zInternalMutation({
  args: z.object({}),
  handler: async (ctx) => {
    faker.seed(42);

    // Wipe demo content (leave Clerk-synced users alone).
    for (const table of ["reviews", "rentalEquipment", "venueUnits", "bookings", "venues"] as const) {
      const rows = await ctx.db.query(table).collect();
      await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
    }

    let created = 0;

    for (const sport of Object.keys(PRESETS) as Sport[]) {
      const preset = PRESETS[sport];
      const venuesForSport = 2;

      for (let i = 0; i < venuesForSport; i++) {
        const place = faker.helpers.arrayElement(cities);
        const name = preset.names[(i + created) % preset.names.length];
        const capabilities = pickCapabilities(preset.capabilities);
        const hasUnits = capabilities.multipleUnits && preset.unitCount > 1;

        const reviewCount = faker.number.int({ min: 0, max: 6 });
        const ratings = Array.from({ length: reviewCount }, () =>
          faker.number.int({ min: 4, max: 5 }),
        );
        const rating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        const venueId = await ctx.db.insert("venues", {
          name,
          description: faker.lorem.sentences(2),
          sport,
          pricePerHour: faker.number.int({
            min: preset.priceRange[0] / 1000,
            max: preset.priceRange[1] / 1000,
          }) * 1000,
          chargeByTime: preset.chargeByTime ?? false,
          address: {
            fullAddress: `${faker.location.streetAddress()}`,
            details: faker.helpers.arrayElement(["Local 2", "Piso 3", "Interior", ""]),
          },
          city: place.city,
          state: place.state,
          neighborhood: faker.helpers.arrayElement(place.neighborhoods),
          ownerId: "seed_owner",
          isActive: true,
          openAt: "08:00",
          closeAt: "22:00",
          images: [
            `https://picsum.photos/seed/${sport}-${created}-a/800/600`,
            `https://picsum.photos/seed/${sport}-${created}-b/800/600`,
          ],
          rating,
          reviewCount,
          capabilities,
          sportConfig: preset.config(),
          rules: preset.rules,
          cancellationPolicy: "Cancelación gratuita hasta 12 horas antes del inicio.",
        });

        if (hasUnits) {
          for (let u = 1; u <= preset.unitCount; u++) {
            await ctx.db.insert("venueUnits", {
              venueId,
              label: `${preset.unitNoun === "mesa" ? "Mesa" : "Cancha"} ${u}`,
              isActive: true,
            });
          }
        }

        if (capabilities.equipmentRental) {
          for (const item of preset.equipment) {
            await ctx.db.insert("rentalEquipment", { venueId, ...item, isActive: true });
          }
        }

        for (let r = 0; r < reviewCount; r++) {
          await ctx.db.insert("reviews", {
            venueId,
            userId: `seed_user_${r}`,
            rating: ratings[r],
            comment: faker.helpers.arrayElement(REVIEW_COMMENTS),
            authorName: faker.person.fullName(),
          });
        }

        created++;
      }
    }

    return { venues: created };
  },
});

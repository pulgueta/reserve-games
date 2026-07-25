/**
 * Colombian cities the platform currently covers (mirrors the seed data).
 * `state` (departamento) travels with the city so venue queries can hit the
 * `by_city_and_state` index.
 */
export interface CityOption {
  value: string;
  label: string;
  state: string;
}

export const CITY_OPTIONS: CityOption[] = [
  { value: "Bogotá", label: "Bogotá", state: "Cundinamarca" },
  { value: "Medellín", label: "Medellín", state: "Antioquia" },
  { value: "Cali", label: "Cali", state: "Valle del Cauca" },
  { value: "Barranquilla", label: "Barranquilla", state: "Atlántico" },
];

export function stateForCity(city: string): string | undefined {
  return CITY_OPTIONS.find((c) => c.value === city)?.state;
}

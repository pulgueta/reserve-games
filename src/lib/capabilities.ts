import type { Icon } from "@phosphor-icons/react";
import {
  CarIcon,
  CoffeeIcon,
  LightningIcon,
  MartiniIcon,
  ShowerIcon,
} from "@phosphor-icons/react";

/**
 * Customer-facing amenity capabilities (the owner-toggled switches that surface
 * a module on the venue detail). `equipmentRental` and `multipleUnits` are
 * rendered by their own modules, so they're intentionally not here.
 */
export interface CapabilityMeta {
  label: string;
  icon: Icon;
}

export const CAPABILITY_META: Record<string, CapabilityMeta> = {
  nightLighting: { label: "Iluminación nocturna", icon: LightningIcon },
  lockerRooms: { label: "Vestidores y duchas", icon: ShowerIcon },
  cafeteria: { label: "Cafetería", icon: CoffeeIcon },
  parking: { label: "Parqueadero", icon: CarIcon },
  bar: { label: "Bar", icon: MartiniIcon },
};

/** The enabled amenity keys for a venue's `capabilities` object. */
export function enabledAmenities(
  capabilities: Record<string, boolean> | undefined,
): string[] {
  if (!capabilities) return [];
  return Object.keys(CAPABILITY_META).filter((key) => capabilities[key]);
}

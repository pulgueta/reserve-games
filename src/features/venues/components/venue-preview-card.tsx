import { MapPinIcon } from "@phosphor-icons/react";
import type { FC } from "react";

import { formatCOP } from "@/lib/format";
import { CAPABILITY_META, type CapabilityFlags } from "@/lib/sport-defaults";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { cn } from "@/lib/utils";

export interface VenuePreviewValues {
  name: string;
  sport: string;
  description?: string;
  pricePerHour: string | number;
  city?: string;
  fullAddress?: string;
  sportConfig: {
    format?: string;
    surface?: string;
    unitType?: string;
    escenario?: string;
    dimensions?: string;
    capacity?: string;
  };
  capabilities: Partial<CapabilityFlags>;
  equipment: Array<{ name: string; pricePerHour: number | string }>;
}

interface VenuePreviewCardProps {
  values: VenuePreviewValues;
  /** Dim while the debounced value trails the form (a keystroke is pending). */
  isStale?: boolean;
}

/**
 * Live preview of how a venue will read to customers — the public detail's
 * cover, "Ficha técnica", amenities and add-ons, fed a debounced copy of the
 * editor's form values so it updates a beat after the owner stops typing.
 */
export const VenuePreviewCard: FC<VenuePreviewCardProps> = ({
  values,
  isStale,
}) => {
  const price = Number(values.pricePerHour) || 0;

  const ficha = [
    { label: "Formato", value: values.sportConfig.format },
    { label: "Superficie", value: values.sportConfig.surface },
    { label: "Tipo", value: values.sportConfig.unitType },
    { label: "Escenario", value: values.sportConfig.escenario },
    { label: "Dimensiones", value: values.sportConfig.dimensions },
    { label: "Capacidad", value: values.sportConfig.capacity },
  ].filter((row): row is { label: string; value: string } =>
    Boolean(row.value),
  );

  const enabledCaps = CAPABILITY_META.filter(
    (cap) => values.capabilities[cap.key],
  );
  const equipment = values.equipment.filter((item) => item.name.trim());
  const location = [values.fullAddress, values.city].filter(Boolean).join(", ");

  return (
    <div
      aria-busy={isStale}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm transition-opacity",
        isStale && "opacity-60",
      )}
    >
      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-6xl">
        {sportEmoji(values.sport)}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
            {sportEmoji(values.sport)} {sportLabel(values.sport)}
          </span>
          <h3 className="font-semibold text-lg tracking-tight">
            {values.name.trim() || "Nombre del espacio"}
          </h3>
          {location ? (
            <p className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPinIcon className="size-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-xl tabular-nums">
            {formatCOP(price)}
          </span>
          <span className="text-muted-foreground text-sm">/ hora</span>
        </div>

        {ficha.length > 0 ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
            {ficha.map((row) => (
              <div key={row.label} className="flex flex-col">
                <dt className="text-muted-foreground text-xs">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {enabledCaps.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {enabledCaps.map((cap) => (
              <span
                key={cap.key}
                className="rounded-full border bg-background px-2 py-0.5 text-muted-foreground text-xs"
              >
                {cap.label}
              </span>
            ))}
          </div>
        ) : null}

        {equipment.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="font-medium text-sm">Equipo en alquiler</p>
            <ul className="flex flex-col gap-1 text-sm">
              {equipment.map((item) => (
                <li key={item.name} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium tabular-nums">
                    +{formatCOP(Number(item.pricePerHour) || 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {values.description?.trim() ? (
          <p className="text-muted-foreground text-sm">{values.description}</p>
        ) : null}
      </div>
    </div>
  );
};

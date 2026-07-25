import type { FC } from "react";

import { sportUnitNoun } from "@/lib/sports";

interface SportConfig {
  format?: string;
  surface?: string;
  dimensions?: string;
  capacity?: string;
  unitType?: string;
}

interface FichaCanchaProps {
  sport: string;
  config?: SportConfig;
}

/**
 * Sport-aware spec sheet ("Ficha del espacio"). Renders only the attributes the
 * venue actually has; `unitType`'s label adapts to the sport's unit noun
 * (cancha/mesa).
 */
export const FichaCancha: FC<FichaCanchaProps> = ({ sport, config }) => {
  if (!config) return null;

  const noun = sportUnitNoun(sport);
  const specs: { label: string; value?: string }[] = [
    { label: "Formato", value: config.format },
    { label: `Tipo de ${noun}`, value: config.unitType },
    { label: "Superficie", value: config.surface },
    { label: "Dimensiones", value: config.dimensions },
    { label: "Capacidad", value: config.capacity },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

  if (specs.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-semibold text-lg tracking-tight">
        Ficha del espacio
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {specs.map((spec) => (
          <div key={spec.label} className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
              {spec.label}
            </dt>
            <dd className="font-medium text-sm">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

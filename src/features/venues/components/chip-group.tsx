import type { FC } from "react";

import { cn } from "@/lib/utils";

interface ChipGroupProps {
  label: string;
  options: string[];
  /** The selected option, or null when none is chosen. */
  value: string | null;
  onChange: (value: string) => void;
  description?: string;
  /** Allow clicking the active chip again to clear the selection. */
  clearable?: boolean;
}

/**
 * Single-select pill group, matching the venue editor's "días de operación"
 * chips. Used for sport-specific format / surface / unit-type / escenario
 * options seeded from {@link SPORT_DEFAULTS}.
 */
export const ChipGroup: FC<ChipGroupProps> = ({
  label,
  options,
  value,
  onChange,
  description,
  clearable = false,
}) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="font-medium text-sm">{label}</legend>
    {description ? (
      <p className="-mt-1 text-muted-foreground text-xs">{description}</p>
    ) : null}
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(clearable && active ? "" : option)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-medium text-sm transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  </fieldset>
);

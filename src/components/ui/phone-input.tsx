import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CaretUpDownIcon, GlobeSimpleIcon } from "@phosphor-icons/react";
import type { ComponentProps, FC } from "react";
import type { Country, FlagProps, Value } from "react-phone-number-input";
import PhoneInputBase, {
  getCountryCallingCode,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CountryEntry = { label: string; value: Country | undefined };

const FlagComponent = ({ country, countryName }: FlagProps) => {
  const Flag = country ? flags[country] : null;
  return (
    <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden [&>svg]:size-full [&>svg]:rounded-[3px]">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <GlobeSimpleIcon
          className="size-4 text-muted-foreground"
          weight="bold"
        />
      )}
    </span>
  );
};

const CountrySelectComponent = ({
  disabled,
  value,
  options,
  onChange,
}: {
  disabled?: boolean;
  value: Country;
  options: CountryEntry[];
  onChange: (country: Country) => void;
}) => (
  <Select
    value={value || ""}
    onValueChange={(v) => v && onChange(v as Country)}
    disabled={disabled}
  >
    <SelectPrimitive.Trigger
      data-slot="input-group-control"
      className="flex h-full items-center gap-1 pr-2 pl-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FlagComponent country={value} countryName={value} />
      {value && (
        <span className="text-muted-foreground text-xs tabular-nums">
          +{getCountryCallingCode(value)}
        </span>
      )}
      <CaretUpDownIcon className="size-3 shrink-0 text-muted-foreground" />
    </SelectPrimitive.Trigger>
    <SelectContent
      align="start"
      alignItemWithTrigger={false}
      // ponytail: w-72! overrides base-ui's --anchor-width (the small trigger width)
      className="w-72!"
    >
      {options
        .filter((o): o is { label: string; value: Country } => !!o.value)
        .map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <FlagComponent country={o.value} countryName={o.label} />
            <span>{o.label}</span>
            <span className="ml-auto text-muted-foreground text-xs tabular-nums">
              +{getCountryCallingCode(o.value)}
            </span>
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
);

const PhoneNumberInput = ({ className, ...props }: ComponentProps<"input">) => (
  <InputGroupInput
    className={cn("rounded-s-none border-input/50 border-l", className)}
    {...props}
  />
);

export interface PhoneInputProps
  extends Omit<ComponentProps<"input">, "onChange" | "value" | "ref"> {
  value?: Value;
  onChange?: (value: Value) => void;
  defaultCountry?: Country;
}

export const PhoneInput: FC<PhoneInputProps> = ({
  className,
  value,
  onChange,
  defaultCountry = "CO",
  "aria-invalid": ariaInvalid,
  ...props
}) => (
  <PhoneInputBase
    className={cn(
      "group/input-group relative flex h-9 w-full min-w-0 items-center rounded-4xl border border-input bg-input/30 outline-none transition-colors",
      "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
      ariaInvalid &&
        "border-destructive ring-[3px] ring-destructive/20 dark:ring-destructive/40",
      className,
    )}
    // ponytail: cast avoids react-phone-number-input deep generics; props match at runtime
    flagComponent={FlagComponent as never}
    countrySelectComponent={CountrySelectComponent as never}
    inputComponent={PhoneNumberInput as never}
    smartCaret={false}
    defaultCountry={defaultCountry}
    value={value}
    onChange={(v) => onChange?.(v || ("" as Value))}
    aria-invalid={ariaInvalid || undefined}
    autoComplete=""
    {...props}
  />
);

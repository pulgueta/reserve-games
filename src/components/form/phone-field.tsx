import { useStore } from "@tanstack/react-form";
import type { FC } from "react";
import type { Value } from "react-phone-number-input";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { PhoneInputProps } from "@/components/ui/phone-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useFieldContext } from "./form-context";

interface PhoneFieldProps extends PhoneInputProps {
  label: string;
  description?: string;
}

export const PhoneField: FC<PhoneFieldProps> = ({ label, description }) => {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <PhoneInput
        id={field.name}
        name={field.name}
        value={field.state.value as Value}
        onChange={(v) => field.handleChange(v)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        autoComplete="tel"
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
};

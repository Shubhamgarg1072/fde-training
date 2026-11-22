import type { ComponentProps } from 'react';
import { FormField } from './FormField.tsx';

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

export function TextField({ label, error, hint, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint}>
      {(control) => <input {...control} {...inputProps} />}
    </FormField>
  );
}

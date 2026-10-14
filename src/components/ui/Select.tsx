import type { ReactNode, SelectHTMLAttributes } from 'react';
import { describedBy, Field } from './Field';
import { cn, inputClass } from './styles';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string;
  label: string;
  options: SelectOption[];
  helper?: ReactNode;
  error?: string;
  fieldClassName?: string;
}

export function Select({
  id,
  label,
  options,
  helper,
  error,
  className,
  fieldClassName,
  ...props
}: SelectProps) {
  return (
    <Field id={id} label={label} helper={helper} error={error} className={fieldClassName}>
      <select
        id={id}
        className={cn(inputClass, 'pr-8', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(error), Boolean(helper))}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

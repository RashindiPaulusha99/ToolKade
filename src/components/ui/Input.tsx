import type { InputHTMLAttributes, ReactNode } from 'react';
import { describedBy, Field } from './Field';
import { cn, inputClass } from './styles';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string;
  /** Optional text shown inside the left edge, e.g. "Rs.". */
  prefix?: string;
  fieldClassName?: string;
}

export function Input({ id, label, helper, error, prefix, className, fieldClassName, ...props }: InputProps) {
  const control = (
    <input
      id={id}
      className={cn(inputClass, prefix && 'pl-11', error && 'border-danger', className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, Boolean(error), Boolean(helper))}
      {...props}
    />
  );

  return (
    <Field id={id} label={label} helper={helper} error={error} className={fieldClassName}>
      {prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
            {prefix}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
    </Field>
  );
}

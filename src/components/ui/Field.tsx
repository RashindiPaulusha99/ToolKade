import type { ReactNode } from 'react';
import { errorClass, helperClass, labelClass } from './styles';

export interface FieldProps {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + helper/error text. Every input in a tool goes through this, so labels are never skipped. */
export function Field({ id, label, helper, error, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={errorClass} role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className={helperClass}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/** aria-describedby value matching what Field renders. */
export function describedBy(id: string, hasError: boolean, hasHelper: boolean): string | undefined {
  if (hasError) return `${id}-error`;
  if (hasHelper) return `${id}-helper`;
  return undefined;
}

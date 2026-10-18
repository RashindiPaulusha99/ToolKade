import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './styles';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string;
  label: ReactNode;
  helper?: ReactNode;
}

/** Checkbox with a 44px tap target; the whole label row is clickable. */
export function Checkbox({ id, label, helper, className, ...props }: CheckboxProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          id={id}
          type="checkbox"
          className="size-5 shrink-0 cursor-pointer rounded accent-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          aria-describedby={helper ? `${id}-helper` : undefined}
          {...props}
        />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </label>
      {helper && (
        <p id={`${id}-helper`} className={cn('ml-8 text-sm text-slate-500 dark:text-slate-400')}>
          {helper}
        </p>
      )}
    </div>
  );
}

import type { ReactNode, TextareaHTMLAttributes } from 'react';
import { describedBy, Field } from './Field';
import { cn, inputClass } from './styles';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string;
  fieldClassName?: string;
}

export function Textarea({ id, label, helper, error, className, fieldClassName, ...props }: TextareaProps) {
  return (
    <Field id={id} label={label} helper={helper} error={error} className={fieldClassName}>
      <textarea
        id={id}
        className={cn(inputClass, 'min-h-48 resize-y md:min-h-72', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(error), Boolean(helper))}
        {...props}
      />
    </Field>
  );
}

import type { ButtonHTMLAttributes } from 'react';
import { buttonVariants, cn, type ButtonVariant } from './styles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants[variant], className)} {...props} />;
}

import type { HTMLAttributes } from 'react';
import { cardClass, cn, resultPanelClass } from './styles';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "result" renders the tinted result panel used for a tool's main output. */
  variant?: 'default' | 'result';
}

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return <div className={cn(variant === 'result' ? resultPanelClass : cardClass, className)} {...props} />;
}

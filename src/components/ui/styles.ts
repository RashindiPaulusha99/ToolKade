/**
 * Shared class strings for the design system. Both the Astro components and the React
 * components in this folder use these, so an element looks the same everywhere.
 */

export const cardClass =
  'rounded-card border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

/** Hover/focus treatment for cards that are links. */
export const cardLinkClass =
  'block transition-colors duration-150 hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transition-none dark:hover:border-brand-400';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

const buttonBase = `inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2.5 font-medium transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const buttonVariants = {
  // brand-600 rather than brand-500: white text on brand-500 is just under WCAG AA (4.49:1).
  primary: `${buttonBase} bg-brand-600 text-white hover:bg-brand-700`,
  secondary: `${buttonBase} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800`,
  ghost: `${buttonBase} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`,
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export const inputClass =
  'w-full rounded-control border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';

export const helperClass = 'mt-1.5 text-sm text-slate-500 dark:text-slate-400';

export const errorClass = 'mt-1.5 text-sm text-danger';

export const resultPanelClass =
  'rounded-card border border-brand-100 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-700/20';

export const resultFigureClass = 'text-3xl font-bold text-brand-700 dark:text-brand-200';

export const badgeClass =
  'inline-flex items-center rounded-full bg-accent-400/15 px-2.5 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-300';

export const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

export const h1Class = 'text-3xl font-bold tracking-tight md:text-4xl';
export const h2Class = 'text-2xl font-semibold';
export const h3Class = 'text-lg font-semibold';
export const bodyClass = 'text-base leading-7 text-slate-700 dark:text-slate-300';
export const smallClass = 'text-sm text-slate-500 dark:text-slate-400';

/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

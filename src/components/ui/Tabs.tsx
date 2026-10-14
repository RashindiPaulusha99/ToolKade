import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './styles';

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

export interface TabsProps<T extends string> {
  label: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  children?: ReactNode;
  className?: string;
}

/** Accessible tabs (ARIA tabs pattern, arrow-key navigation). The caller renders the active panel as children. */
export function Tabs<T extends string>({ label, items, value, onChange, children, className }: TabsProps<T>) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: -activeIndex,
      End: items.length - 1 - activeIndex,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (activeIndex + keys[event.key] + items.length) % items.length;
    onChange(items[next].value);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex rounded-control bg-slate-100 p-1 dark:bg-slate-800"
      >
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={item.value}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={onKeyDown}
              className={cn(
                'min-h-11 rounded-control px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transition-none',
                selected
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-200'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {children !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${activeIndex}`}
          className="mt-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { cn } from './styles';

export type ToastTone = 'info' | 'success' | 'error';

interface ToastState {
  message: string;
  tone: ToastTone;
  key: number;
}

/** Lightweight toast for a single tool island: `const { toast, show } = useToast();` then render `{toast}`. */
export function useToast(duration = 3000) {
  const [state, setState] = useState<ToastState | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    setState({ message, tone, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!state) return;
    const timer = setTimeout(() => setState(null), duration);
    return () => clearTimeout(timer);
  }, [state, duration]);

  const toast = (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      {state && (
        <div
          key={state.key}
          className={cn(
            'pointer-events-auto rounded-control px-4 py-3 text-sm font-medium shadow-lg',
            state.tone === 'error' && 'bg-danger text-white',
            state.tone === 'success' && 'bg-brand-700 text-white',
            state.tone === 'info' && 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
          )}
        >
          {state.message}
        </div>
      )}
    </div>
  );

  return { toast, show };
}

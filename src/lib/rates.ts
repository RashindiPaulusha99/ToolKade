/**
 * Shape of every file in src/data/rates/. `data` is null until the figures have been
 * verified against the official source — never fill it with guesses.
 */
export interface RatesFile<T = unknown> {
  name: string;
  source: string;
  effectiveFrom: string;
  lastVerified: string;
  notes?: string;
  /** What still needs verifying against the official source while `data` is null. */
  todo?: string[];
  data: T | null;
}

export function isRatesPending<T>(rates: RatesFile<T>): rates is RatesFile<T> & { data: null } {
  return rates.data === null;
}

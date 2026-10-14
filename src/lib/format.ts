const lkrFormatter = new Intl.NumberFormat('en-LK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount as Sri Lankan rupees: `Rs. 1,234,567.00`. */
export function formatLKR(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rs. —';
  const formatted = lkrFormatter.format(Math.abs(amount));
  return amount < 0 ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits }).format(value);
}

export function formatPercent(ratio: number, maximumFractionDigits = 1): string {
  if (!Number.isFinite(ratio)) return '—';
  return new Intl.NumberFormat('en-LK', { style: 'percent', maximumFractionDigits }).format(ratio);
}

/** Formats an ISO date (or Date) as `14 Oct 2026`. Uses UTC so the output does not depend on the build machine. */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** ISO `YYYY-MM-DD` for `<time datetime>` and JSON-LD. */
export function toIsoDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

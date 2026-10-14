import { describe, expect, it } from 'vitest';
import { formatBytes, formatDate, formatLKR, formatNumber, formatPercent, toIsoDate } from './format';

describe('formatLKR', () => {
  it('formats rupees with two decimals and thousands separators', () => {
    expect(formatLKR(1234567)).toBe('Rs. 1,234,567.00');
    expect(formatLKR(0)).toBe('Rs. 0.00');
    expect(formatLKR(99.995)).toBe('Rs. 100.00');
  });

  it('puts the minus sign before the currency', () => {
    expect(formatLKR(-2500.5)).toBe('-Rs. 2,500.50');
  });

  it('handles very large and non-finite values', () => {
    expect(formatLKR(1e12)).toBe('Rs. 1,000,000,000,000.00');
    expect(formatLKR(Number.NaN)).toBe('Rs. —');
    expect(formatLKR(Number.POSITIVE_INFINITY)).toBe('Rs. —');
  });
});

describe('number helpers', () => {
  it('formats numbers and percentages', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.57');
    expect(formatNumber(1234.5678, 0)).toBe('1,235');
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatNumber(Number.NaN)).toBe('—');
  });

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(-1)).toBe('—');
  });
});

describe('dates', () => {
  it('formats ISO dates in UTC', () => {
    expect(formatDate('2026-10-14')).toBe('14 Oct 2026');
    expect(toIsoDate('2026-10-14')).toBe('2026-10-14');
    expect(toIsoDate(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
  });
});

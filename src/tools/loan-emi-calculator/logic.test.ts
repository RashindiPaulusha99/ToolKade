import { describe, expect, it } from 'vitest';
import {
  calculateLoan,
  flatTerms,
  formatSummary,
  MAX_AMOUNT,
  rateForInstalment,
  reducingInstalment,
  roundMoney,
  type LoanInput,
  type LoanResult,
} from './logic';

function ok(input: LoanInput): LoanResult {
  const outcome = calculateLoan(input);
  if (!outcome.ok) throw new Error(JSON.stringify(outcome.errors));
  return outcome.result;
}

const reducing = (amount: number, annualRate: number, months: number): LoanInput => ({
  amount,
  annualRate,
  months,
  method: 'reducing',
});
const flat = (amount: number, annualRate: number, months: number): LoanInput => ({
  amount,
  annualRate,
  months,
  method: 'flat',
});

/** Every schedule must pay off exactly the amount borrowed. */
function expectConsistent(input: LoanInput, r: LoanResult) {
  expect(r.schedule).toHaveLength(input.months);
  expect(r.schedule.at(-1)?.balance).toBe(0);
  expect(roundMoney(r.schedule.reduce((s, row) => s + row.principal, 0))).toBe(roundMoney(input.amount));
  expect(roundMoney(r.schedule.reduce((s, row) => s + row.payment, 0))).toBe(r.totalPayable);
  for (const row of r.schedule) expect(row.payment).toBe(roundMoney(row.principal + row.interest));
  expect(roundMoney(r.yearly.reduce((s, y) => s + y.principal + y.interest, 0))).toBe(r.totalPayable);
}

describe('reducing balance (standard EMI formula)', () => {
  // Textbook values: EMI = P·r·(1+r)^n / ((1+r)^n − 1), r = annual rate / 12.
  it.each([
    [1_000_000, 12, 12, 88_848.79],
    [100_000, 10, 12, 8_791.59],
    [5_000_000, 14, 60, 116_341.25],
  ])('Rs. %d at %d%% for %d months → Rs. %d a month', (amount, rate, months, emi) => {
    const input = reducing(amount, rate, months);
    const r = ok(input);
    expect(r.instalment).toBe(emi);
    expectConsistent(input, r);
  });

  it('charges interest on the falling balance', () => {
    const r = ok(reducing(1_000_000, 12, 12));
    expect(r.schedule[0].interest).toBe(10_000); // 1% of 1,000,000
    expect(r.schedule[1].interest).toBeLessThan(r.schedule[0].interest);
    expect(r.totalInterest).toBeCloseTo(88_848.79 * 12 - 1_000_000, 0);
  });

  it('handles a 0% loan', () => {
    const input = reducing(120_000, 0, 12);
    const r = ok(input);
    expect(r.instalment).toBe(10_000);
    expect(r.totalInterest).toBe(0);
    expectConsistent(input, r);
  });

  it('absorbs rounding in the last instalment', () => {
    const input = reducing(100_000, 7, 7);
    const r = ok(input);
    expectConsistent(input, r);
    expect(Math.abs(r.schedule.at(-1)!.payment - r.instalment)).toBeLessThan(0.1);
  });
});

describe('flat rate', () => {
  it('charges interest on the full amount for the whole term (worked example)', () => {
    // Rs. 1,000,000 at 12% flat for 3 years: interest 1,000,000 × 12% × 3 = 360,000.
    const input = flat(1_000_000, 12, 36);
    const r = ok(input);
    expect(r.totalInterest).toBe(360_000);
    expect(r.totalPayable).toBe(1_360_000);
    expect(r.instalment).toBe(37_777.78);
    expect(r.schedule[0].interest).toBe(10_000);
    expect(r.schedule[20].interest).toBe(10_000); // same every month
    expectConsistent(input, r);
  });

  it('is more expensive than the same reducing-balance rate', () => {
    const f = ok(flat(1_000_000, 12, 36));
    const red = ok(reducing(1_000_000, 12, 36));
    expect(f.totalInterest).toBeGreaterThan(red.totalInterest);
  });

  it('reports the equivalent reducing-balance rate', () => {
    const r = ok(flat(1_000_000, 12, 36));
    expect(r.equivalentReducingRate).not.toBeNull();
    // That rate must reproduce the same instalment on a reducing balance.
    expect(reducingInstalment(1_000_000, r.equivalentReducingRate!, 36)).toBeCloseTo(
      flatTerms(1_000_000, 12, 36).instalment,
      4,
    );
    expect(r.equivalentReducingRate!).toBeGreaterThan(21);
    expect(r.equivalentReducingRate!).toBeLessThan(22);
    expect(r.equivalentFlatRate).toBeNull();
  });
});

describe('rate conversions', () => {
  it('converts reducing to an equivalent flat rate', () => {
    const r = ok(reducing(1_000_000, 12, 12));
    expect(r.equivalentFlatRate!).toBeCloseTo((r.totalInterest / 1_000_000) * 100, 6);
    expect(r.equivalentReducingRate).toBeNull();
  });

  it('round-trips rate → instalment → rate', () => {
    for (const rate of [0.5, 8, 15.75, 30, 60]) {
      const emi = reducingInstalment(2_000_000, rate, 48);
      expect(rateForInstalment(2_000_000, emi, 48)).toBeCloseTo(rate, 6);
    }
    expect(rateForInstalment(1_000, 50, 20)).toBe(0); // repays no more than borrowed
  });
});

describe('yearly summary', () => {
  it('groups the schedule into years, including a part year', () => {
    const r = ok(reducing(500_000, 15, 30));
    expect(r.yearly.map((y) => y.year)).toEqual([1, 2, 3]);
    expect(r.yearly[0].interest).toBeGreaterThan(r.yearly[1].interest);
  });
});

describe('validation and edge cases', () => {
  it.each([
    [{ amount: 0 }, 'amount'],
    [{ amount: -1 }, 'amount'],
    [{ amount: Number.NaN }, 'amount'],
    [{ amount: 1e10 + 1 }, 'amount'],
    [{ annualRate: -1 }, 'annualRate'],
    [{ annualRate: 101 }, 'annualRate'],
    [{ months: 0 }, 'months'],
    [{ months: 12.5 }, 'months'],
    [{ months: 601 }, 'months'],
  ])('rejects %o', (patch, field) => {
    const outcome = calculateLoan({ ...reducing(1_000_000, 12, 12), ...patch });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.errors).toHaveProperty(field);
  });

  it('handles a one-month loan and a 50-year loan', () => {
    const one = reducing(10_000, 12, 1);
    expect(ok(one).instalment).toBe(10_100);
    expectConsistent(one, ok(one));
    const long = reducing(50_000_000, 9, 600);
    expectConsistent(long, ok(long));
  });

  it('handles very large amounts', () => {
    const input = flat(MAX_AMOUNT, 25, 120);
    expectConsistent(input, ok(input));
  });
});

describe('formatSummary', () => {
  it('builds a copyable summary', () => {
    const input = flat(1_000_000, 12, 36);
    const text = formatSummary(input, ok(input));
    expect(text).toContain('Monthly instalment: Rs. 37,777.78');
    expect(text).toContain('Total interest: Rs. 360,000.00');
    expect(text).toContain('flat rate');
    expect(text).toContain('Equivalent reducing-balance rate');
  });
});

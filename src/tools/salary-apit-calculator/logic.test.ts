import { describe, expect, it } from 'vitest';
import ratesFile from '@/data/rates/apit.json';
import type { RatesFile } from '@/lib/rates';
import {
  calculateApit,
  calculateSalary,
  compareSalaries,
  formatSummary,
  marginalRateFor,
  roundMoney,
  type SalaryInput,
  type SalaryRates,
  type SalaryResult,
} from './logic';
import { salaryRatesSchema } from './schema';

const file = ratesFile as RatesFile<SalaryRates>;
if (!file.data) throw new Error('apit.json has no data');
const rates: SalaryRates = file.data;

const monthly = (salary: number, allowances = 0, allowancesInEpf = false): SalaryInput => ({
  salary,
  allowances,
  period: 'monthly',
  allowancesInEpf,
});

function ok(input: SalaryInput): SalaryResult {
  const outcome = calculateSalary(input, rates);
  if (!outcome.ok) throw new Error(JSON.stringify(outcome.errors));
  return outcome.result;
}

describe('rates file', () => {
  it('matches the schema and has verification dates', () => {
    expect(() => salaryRatesSchema.parse(file.data)).not.toThrow();
    expect(file.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(file.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(file.source).toMatch(/^https:\/\/www\.ird\.gov\.lk\//);
  });
});

/*
 * Official worked examples: IRD Tax Table No. 01 (Y/A 2025/2026), "Summarized Tax Table – Regular
 * Profits from Employment", gives monthly APIT on regular profits P as:
 *   P ≤ 150,000           relief
 *   150,000 – 233,333     6% of P − 9,000
 *   233,333 – 275,000     18% of P − 37,000
 *   275,000 – 316,667     24% of P − 53,500
 *   316,667 – 358,333     30% of P − 72,500
 *   above 358,333         36% of P − 94,000
 * https://www.ird.gov.lk/en/publications/APIT_Tax_Tables/2025-2026/Table%20-%201/02.%20APIT_2526_Table_01_Text.pdf
 * These tests prove the band-by-band calculation from apit.json reproduces the official table.
 */
const irdTable01 = (p: number): number => {
  if (p <= 150_000) return 0;
  if (p <= 233_333) return 0.06 * p - 9_000;
  if (p <= 275_000) return 0.18 * p - 37_000;
  if (p <= 316_667) return 0.24 * p - 53_500;
  if (p <= 358_333) return 0.3 * p - 72_500;
  return 0.36 * p - 94_000;
};

describe('APIT matches IRD Tax Table No. 01 (official)', () => {
  it.each([
    [100_000, 0],
    [150_000, 0],
    [200_000, 3_000],
    [250_000, 8_000],
    [300_000, 18_500],
    [350_000, 32_500],
    [500_000, 86_000],
    [1_000_000, 266_000],
  ])('monthly profits Rs. %d → APIT Rs. %d', (p, expected) => {
    expect(calculateApit(p, rates.apit, 12).tax).toBe(expected);
    expect(roundMoney(irdTable01(p))).toBe(expected);
  });

  it('agrees with the official formula across every band, to the cent', () => {
    for (let p = 0; p <= 600_000; p += 1_250) {
      // The table's band edges are rounded to the rupee (233,333 etc.), so compare away from the
      // exact edges; at the edges both formulas give the same tax anyway (checked below).
      expect(calculateApit(p, rates.apit, 12).tax, `P = ${p}`).toBeCloseTo(irdTable01(p), 2);
    }
  });

  it('is continuous at the band edges', () => {
    for (const edge of [150_000, 233_333.33, 275_000, 316_666.67, 358_333.33]) {
      const below = calculateApit(edge - 0.01, rates.apit, 12).tax;
      const above = calculateApit(edge + 0.01, rates.apit, 12).tax;
      expect(above - below).toBeLessThan(0.02);
    }
  });
});

describe('calculateApit', () => {
  it('returns a bracket breakdown that adds up', () => {
    const { tax, brackets } = calculateApit(300_000, rates.apit, 12);
    expect(brackets).toHaveLength(rates.apit.bands.length + 1);
    expect(brackets[0]).toMatchObject({ from: 0, to: 150_000, rate: 0, taxable: 150_000, tax: 0 });
    expect(brackets[1]).toMatchObject({ from: 150_000, to: 233_333.33, rate: 0.06, tax: 5_000 });
    expect(brackets[2]).toMatchObject({ rate: 0.18, tax: 7_500 });
    expect(brackets[3]).toMatchObject({ from: 275_000, rate: 0.24, taxable: 25_000, tax: 6_000 });
    expect(brackets[4].taxable).toBe(0);
    expect(brackets.at(-1)?.to).toBeNull();
    expect(roundMoney(brackets.reduce((sum, b) => sum + b.tax, 0))).toBe(tax);
    expect(brackets.reduce((sum, b) => sum + b.taxable, 0)).toBeCloseTo(300_000, 1);
  });

  it('uses annual bands for annual income, equal to 12 × the monthly tax', () => {
    expect(calculateApit(3_600_000, rates.apit, 1).tax).toBe(18_500 * 12);
    expect(calculateApit(1_800_000, rates.apit, 1).tax).toBe(0);
  });

  it('handles zero and very large incomes', () => {
    expect(calculateApit(0, rates.apit, 12).tax).toBe(0);
    const big = calculateApit(1e9, rates.apit, 12).tax;
    expect(big).toBe(roundMoney(0.36 * 1e9 - 94_000));
  });

  it('reports the marginal rate', () => {
    expect(marginalRateFor(100_000, rates.apit, 12)).toBe(0);
    expect(marginalRateFor(200_000, rates.apit, 12)).toBe(0.06);
    expect(marginalRateFor(300_000, rates.apit, 12)).toBe(0.24);
    expect(marginalRateFor(1e7, rates.apit, 12)).toBe(0.36);
  });
});

describe('calculateSalary', () => {
  it('works out take-home pay with EPF on salary only (worked example)', () => {
    // Salary 250,000 + allowances 50,000 = gross 300,000. APIT on 300,000 = 18,500 (Table 01).
    // Employee EPF 8% of 250,000 = 20,000. Take-home = 300,000 − 20,000 − 18,500 = 261,500.
    const r = ok(monthly(250_000, 50_000));
    expect(r.monthly).toEqual({
      gross: 300_000,
      epfBase: 250_000,
      epfEmployee: 20_000,
      apit: 18_500,
      totalDeductions: 38_500,
      takeHome: 261_500,
      epfEmployer: 30_000,
      etf: 7_500,
      employerCost: 337_500,
    });
    expect(r.annual.takeHome).toBe(261_500 * 12);
    expect(r.annual.apit).toBe(18_500 * 12);
    expect(r.effectiveTaxRate).toBeCloseTo(18_500 / 300_000);
    expect(r.marginalRate).toBe(0.24);
  });

  it('includes allowances in EPF/ETF when asked', () => {
    const r = ok(monthly(250_000, 50_000, true));
    expect(r.monthly.epfBase).toBe(300_000);
    expect(r.monthly.epfEmployee).toBe(24_000);
    expect(r.monthly.etf).toBe(9_000);
    expect(r.monthly.apit).toBe(18_500); // EPF does not reduce APIT
  });

  it('pays no APIT at or below the monthly relief', () => {
    const r = ok(monthly(150_000));
    expect(r.monthly.apit).toBe(0);
    expect(r.monthly.takeHome).toBe(138_000);
    expect(r.effectiveTaxRate).toBe(0);
  });

  it('accepts annual figures and shows the same monthly result', () => {
    const r = ok({ salary: 3_000_000, allowances: 600_000, period: 'annual', allowancesInEpf: false });
    expect(r.monthly.gross).toBe(300_000);
    expect(r.monthly.apit).toBe(18_500);
    expect(r.annual.apit).toBe(222_000);
    expect(r.brackets[0].to).toBe(1_800_000); // annual brackets for annual input
  });

  it('accepts allowances with no salary', () => {
    expect(ok(monthly(0, 200_000)).monthly.epfEmployee).toBe(0);
  });

  it.each([
    [monthly(-1), 'salary'],
    [monthly(Number.NaN), 'salary'],
    [monthly(0, 0), 'salary'],
    [monthly(100_000, -5), 'allowances'],
    [monthly(100_000, Number.NaN), 'allowances'],
  ])('rejects invalid input %#', (input, field) => {
    const outcome = calculateSalary(input, rates);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.errors).toHaveProperty(field);
  });

  it('keeps cents exact for awkward amounts', () => {
    const r = ok(monthly(123_456.78, 9_876.54));
    expect(r.monthly.takeHome).toBe(roundMoney(r.monthly.gross - r.monthly.epfEmployee - r.monthly.apit));
  });
});

describe('compareSalaries', () => {
  it('shows how much of a raise you keep', () => {
    const out = compareSalaries(
      { salary: 250_000, allowances: 50_000 },
      { salary: 300_000, allowances: 50_000 },
      { period: 'monthly', allowancesInEpf: false },
      rates,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    // B: gross 350,000 → APIT 32,500, EPF 24,000, take-home 293,500.
    expect(out.result.b.takeHome).toBe(293_500);
    expect(out.result.difference.gross).toBe(50_000);
    expect(out.result.difference.apit).toBe(14_000);
    expect(out.result.difference.takeHome).toBe(32_000);
    expect(out.result.keptShare).toBeCloseTo(0.64);
  });

  it('returns errors for each side', () => {
    const out = compareSalaries(
      { salary: -1, allowances: 0 },
      { salary: 100, allowances: 0 },
      { period: 'monthly', allowancesInEpf: false },
      rates,
    );
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.errors.a).toHaveProperty('salary');
      expect(out.errors.b).toEqual({});
    }
  });

  it('has no kept share when gross pay is equal', () => {
    const same = { salary: 200_000, allowances: 0 };
    const out = compareSalaries(same, same, { period: 'monthly', allowancesInEpf: false }, rates);
    expect(out.ok && out.result.keptShare).toBeNull();
  });
});

describe('formatSummary', () => {
  it('builds a copyable summary', () => {
    const input = monthly(250_000, 50_000);
    const text = formatSummary(input, ok(input), rates);
    expect(text).toContain('per month');
    expect(text).toContain('APIT: -Rs. 18,500.00');
    expect(text).toContain('Take-home pay: Rs. 261,500.00');
    expect(text).toContain('Employee EPF (8%)');
  });
});

describe('schema', () => {
  it('rejects decreasing rates and a missing open band', () => {
    const bad = structuredClone(rates);
    bad.apit.bands[1].rate = 0.01;
    expect(salaryRatesSchema.safeParse(bad).success).toBe(false);
    const noOpen = structuredClone(rates);
    noOpen.apit.bands.at(-1)!.width = 100;
    expect(salaryRatesSchema.safeParse(noOpen).success).toBe(false);
  });
});

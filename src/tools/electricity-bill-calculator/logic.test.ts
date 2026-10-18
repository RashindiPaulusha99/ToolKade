import { describe, expect, it } from 'vitest';
import ratesFile from '@/data/rates/electricity-tariff.json';
import type { RatesFile } from '@/lib/rates';
import {
  calculateBill,
  estimateUnits,
  formatSummary,
  validateBillInput,
  type ElectricityRates,
} from './logic';
import { electricityRatesSchema } from './schema';

const file = ratesFile as RatesFile<ElectricityRates>;
if (!file.data) throw new Error('electricity-tariff.json has no data');
const rates = file.data;
const { domestic, religious } = rates.tariffs;
const bill = (units: number, tariff = domestic, days = 30) =>
  calculateBill(units, tariff, days, rates.billingDays);

describe('rates file', () => {
  it('matches the schema and is dated', () => {
    expect(() => electricityRatesSchema.parse(file.data)).not.toThrow();
    expect(file.effectiveFrom).toBe('2026-05-11');
    expect(file.source).toMatch(/^https:\/\/www\.pucsl\.gov\.lk\//);
  });
});

/*
 * Worked examples from PUCSL Annex 2, approved tariff effective 11 May 2026 (30-day cycle):
 *   Domestic 0–60 kWh:   0–30 @ 5.00 (fixed 80), 31–60 @ 9.00 (fixed 210)
 *   Domestic 61–180 kWh: 0–60 @ 14.00, 61–90 @ 20.00 (fixed 400), 91–120 @ 28.00 (fixed 1,000),
 *                        121–180 @ 44.00 (fixed 1,500)
 *   Domestic >180 kWh:   0–180 @ 32.50, above 180 @ 100.00 (fixed 2,500)
 */
describe('domestic tariff (official worked examples)', () => {
  it.each([
    [0, 0, 80, 80],
    [25, 125, 80, 205],
    [30, 150, 80, 230],
    [31, 159, 210, 369],
    [60, 420, 210, 630],
    [61, 860, 400, 1_260], // 60 × 14 + 1 × 20
    [75, 1_140, 400, 1_540], // 60 × 14 + 15 × 20
    [100, 1_720, 1_000, 2_720], // 840 + 600 + 10 × 28
    [150, 3_600, 1_500, 5_100], // 840 + 600 + 840 + 30 × 44
    [180, 4_920, 1_500, 6_420],
    [181, 5_950, 2_500, 8_450], // 180 × 32.5 + 1 × 100
    [200, 7_850, 2_500, 10_350],
    [500, 37_850, 2_500, 40_350],
  ])('%d units → energy Rs. %d + fixed Rs. %d = Rs. %d', (units, energy, fixed, total) => {
    const r = bill(units);
    expect(r.energyCharge).toBe(energy);
    expect(r.fixedCharge).toBe(fixed);
    expect(r.total).toBe(total);
  });

  it('shows a block-by-block breakdown that adds up', () => {
    const r = bill(100);
    expect(r.lines.map((l) => [l.from, l.to, l.units, l.rate, l.charge])).toEqual([
      [0, 60, 60, 14, 840],
      [60, 90, 30, 20, 600],
      [90, 120, 10, 28, 280],
      [120, 180, 0, 44, 0],
    ]);
    expect(r.averagePerUnit).toBeCloseTo(27.2);
  });
});

describe('religious & charitable tariff', () => {
  it.each([
    [20, 165], // 20 × 4.50 + 75
    [100, 835], // 30 × 4.50 + 60 × 4.50 + 10 × 8 + 350
    [200, 4_824], // 180 × 11.80 + 20 × 35 + 2,000
  ])('%d units → Rs. %d', (units, total) => {
    expect(bill(units, religious).total).toBe(total);
  });
});

describe('LECO prepaid', () => {
  it('charges two blocks with no fixed charge', () => {
    expect(bill(100, rates.tariffs['domestic-prepaid']).total).toBe(2_460); // 90 × 17 + 10 × 93
    expect(bill(50, rates.tariffs['religious-prepaid']).total).toBe(400); // 50 × 8
    expect(bill(0, rates.tariffs['domestic-prepaid']).fixedCharge).toBe(0);
  });
});

describe('billing period', () => {
  it('prorates block and band limits for a 31-day cycle (PUCSL)', () => {
    // Limits × 31/30: band ≤ 62 units; blocks 0–31 @ 5, 31–62 @ 9.
    const r = bill(62, domestic, 31);
    expect(r.lines.map((l) => l.units)).toEqual([31, 31]);
    expect(r.total).toBe(31 * 5 + 31 * 9 + 210);
  });

  it('uses the higher band sooner in a short cycle', () => {
    expect(bill(60, domestic, 28).fixedCharge).toBe(400); // 60 > 60 × 28/30 = 56
  });
});

describe('every tariff', () => {
  it.each(Object.keys(rates.tariffs))('%s: bills never go down as units go up', (id) => {
    const tariff = rates.tariffs[id];
    let previous = -1;
    for (let units = 0; units <= 1_000; units++) {
      const total = calculateBill(units, tariff, 30, 30).total;
      expect(total, `${units} units`).toBeGreaterThanOrEqual(previous);
      previous = total;
    }
  });
});

describe('estimateUnits (reverse mode)', () => {
  it('finds the units for an exact bill', () => {
    expect(estimateUnits(2_720, domestic, 30, 30)).toMatchObject({ units: 100, bill: 2_720 });
    expect(estimateUnits(630, domestic, 30, 30).units).toBe(60);
  });

  it('rounds down to whole units between two bills', () => {
    const e = estimateUnits(5_000, domestic, 30, 30);
    expect(e.bill).toBeLessThanOrEqual(5_000);
    expect(e.nextBill).toBeGreaterThan(5_000);
    expect(bill(e.units).total).toBe(e.bill);
  });

  it('handles amounts that fall in the jump above 180 units', () => {
    const e = estimateUnits(7_000, domestic, 30, 30);
    expect(e.units).toBe(180);
    expect(e.nextBill).toBe(8_450);
  });

  it('flags amounts below the minimum bill', () => {
    expect(estimateUnits(50, domestic, 30, 30)).toMatchObject({ units: 0, belowMinimum: true });
  });

  it('handles very large bills', () => {
    const e = estimateUnits(50_000_000, domestic, 30, 30);
    expect(e.units).toBeGreaterThan(400_000);
    expect(e.bill).toBeLessThanOrEqual(50_000_000);
  });
});

describe('validation', () => {
  it.each([
    [-1, 30, 'units'],
    [Number.NaN, 30, 'units'],
    [2_000_000, 30, 'units'],
    [100, 0, 'days'],
    [100, 91, 'days'],
    [100, 30.5, 'days'],
  ])('rejects units %d over %d days', (units, days, field) => {
    expect(validateBillInput(units, days)).toHaveProperty(field);
  });

  it('accepts valid input, including fractional units', () => {
    expect(validateBillInput(120.5, 30)).toEqual({});
    expect(bill(30.5).total).toBe(roundTo2(30 * 5 + 0.5 * 9 + 210));
  });
});

describe('formatSummary', () => {
  it('builds a copyable summary', () => {
    const text = formatSummary(domestic, bill(100));
    expect(text).toContain('Domestic');
    expect(text).toContain('Fixed charge: Rs. 1,000.00');
    expect(text).toContain('Total: Rs. 2,720.00');
  });
});

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

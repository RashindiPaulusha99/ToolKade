import { describe, expect, it } from 'vitest';
import ratesFile from '@/data/rates/vehicle-duty.json';
import type { RatesFile } from '@/lib/rates';
import {
  calculateDuty,
  capacityUnitFor,
  cifInLkr,
  exciseFor,
  formatSummary,
  matches,
  roundMoney,
  vehicleAge,
  type DutyResult,
  type VehicleDutyRates,
  type VehicleInput,
} from './logic';
import { vehicleDutyRatesSchema } from './schema';

/*
 * FIXTURE RATES: deliberately round, made-up numbers that exercise every feature of the
 * calculation engine. They are NOT Sri Lankan rates and must never be copied into the data file.
 */
const fixture: VehicleDutyRates = {
  maxAgeYears: 3,
  components: [
    { id: 'cid', label: 'Customs duty', kind: 'percent', rate: 0.2, base: { cifMultiplier: 1, include: [] } },
    {
      id: 'surcharge',
      label: 'Surcharge',
      kind: 'percent',
      rate: 0.5,
      base: { cifMultiplier: 0, include: ['cid'] },
    },
    { id: 'excise', label: 'Excise duty', kind: 'excise' },
    { id: 'luxury', label: 'Luxury tax', kind: 'luxury' },
    {
      id: 'vat',
      label: 'VAT',
      kind: 'percent',
      rate: 0.18,
      base: { cifMultiplier: 1.1, include: ['cid', 'surcharge', 'excise'] },
    },
    { id: 'vel', label: 'Entitlement levy', kind: 'fixed', amount: 10000 },
    {
      id: 'ev-only',
      label: 'EV-only levy',
      kind: 'fixed',
      amount: 500,
      appliesTo: { fuelTypes: ['electric'] },
    },
  ],
  exciseTables: [
    {
      vehicleTypes: ['car', 'suv'],
      fuelTypes: ['petrol'],
      unit: 'cc',
      bands: [
        {
          maxCapacity: 1000,
          ages: [
            { maxAgeYears: 1, rate: { perUnit: 1000 } },
            { maxAgeYears: null, rate: { perUnit: 1500 } },
          ],
        },
        { maxCapacity: 2000, ages: [{ maxAgeYears: null, rate: { perUnit: 2000, adValorem: 0.5 } }] },
        { maxCapacity: null, ages: [{ maxAgeYears: null, rate: { perUnit: 5000, minimum: 20_000_000 } }] },
      ],
    },
    {
      vehicleTypes: ['car', 'suv'],
      fuelTypes: ['electric'],
      unit: 'kW',
      bands: [{ maxCapacity: null, ages: [{ maxAgeYears: null, rate: { perUnit: 10000 } }] }],
    },
  ],
  luxuryTax: [
    { appliesTo: { fuelTypes: ['petrol'] }, thresholdLkr: 5_000_000, rate: 0.5, base: 'cif-excess' },
    { appliesTo: { fuelTypes: ['electric'] }, thresholdLkr: 6_000_000, rate: 0.6, base: 'cif' },
  ],
};

const YEAR = 2026;

const petrolCar: VehicleInput = {
  vehicleType: 'car',
  fuelType: 'petrol',
  capacity: 990,
  yearOfManufacture: 2025,
  cifAmount: 10_000,
  currency: 'USD',
  exchangeRate: 300,
};

function ok(input: VehicleInput, rates = fixture): DutyResult {
  const outcome = calculateDuty(input, rates, YEAR);
  if (!outcome.ok) throw new Error(`Expected a result, got ${JSON.stringify(outcome)}`);
  return outcome.result;
}

const amount = (result: DutyResult, id: string) => result.lines.find((l) => l.id === id)?.amount;

describe('calculateDuty (fixture rates)', () => {
  it('works through every component in order (worked example)', () => {
    const r = ok(petrolCar);
    // CIF = 10,000 USD × 300 = 3,000,000
    expect(r.cifLkr).toBe(3_000_000);
    expect(amount(r, 'cid')).toBe(600_000); // 20% of CIF
    expect(amount(r, 'surcharge')).toBe(300_000); // 50% of customs duty
    expect(amount(r, 'excise')).toBe(990_000); // 1,000 × 990 cc (age 1)
    expect(amount(r, 'luxury')).toBe(0); // CIF below 5,000,000 threshold
    // VAT base = 3,000,000 × 1.1 + 600,000 + 300,000 + 990,000 = 5,190,000 → 18% = 934,200
    expect(amount(r, 'vat')).toBe(934_200);
    expect(amount(r, 'vel')).toBe(10_000);
    expect(r.lines.map((l) => l.id)).toEqual(['cid', 'surcharge', 'excise', 'luxury', 'vat', 'vel']);
    // The working shown to the user.
    expect(r.lines.find((l) => l.id === 'cid')?.detail).toBe('20% of CIF');
    expect(r.lines.find((l) => l.id === 'surcharge')?.detail).toBe('50% of Customs duty');
    expect(r.lines.find((l) => l.id === 'vat')?.detail).toBe(
      '18% of (CIF × 1.1 + Customs duty + Surcharge + Excise duty)',
    );
    expect(r.totalTax).toBe(2_834_200);
    expect(r.landedCost).toBe(5_834_200);
    expect(r.effectiveRate).toBeCloseTo(2_834_200 / 3_000_000);
    expect(r.warnings).toEqual([]);
  });

  it('picks the age band from the year of manufacture', () => {
    const r = ok({ ...petrolCar, yearOfManufacture: 2024 }); // age 2 → open-ended band
    expect(amount(r, 'excise')).toBe(1_485_000); // 1,500 × 990
  });

  it('uses the higher of per-unit and ad valorem excise', () => {
    const r = ok({ ...petrolCar, capacity: 1500, cifAmount: 8_000_000, currency: 'LKR' });
    // per unit 2,000 × 1,500 = 3,000,000; ad valorem 50% × 8,000,000 = 4,000,000
    expect(amount(r, 'excise')).toBe(4_000_000);
    // luxury: 50% of (8,000,000 − 5,000,000)
    expect(amount(r, 'luxury')).toBe(1_500_000);
  });

  it('applies a minimum excise amount', () => {
    const r = ok({ ...petrolCar, capacity: 3000 }); // 5,000 × 3,000 = 15,000,000 < 20,000,000 minimum
    expect(amount(r, 'excise')).toBe(20_000_000);
  });

  it('charges EVs per kW, applies a whole-CIF luxury rule and EV-only components', () => {
    const ev = {
      ...petrolCar,
      fuelType: 'electric' as const,
      capacity: 100,
      cifAmount: 7_000_000,
      currency: 'LKR' as const,
    };
    const r = ok(ev);
    expect(r.capacityUnit).toBe('kW');
    expect(amount(r, 'excise')).toBe(1_000_000);
    expect(amount(r, 'luxury')).toBe(4_200_000); // 60% of the whole CIF, as it is above 6,000,000
    expect(amount(r, 'ev-only')).toBe(500);
    expect(amount(ok(petrolCar), 'ev-only')).toBeUndefined();
  });

  it('warns when the vehicle is older than the import limit', () => {
    const r = ok({ ...petrolCar, yearOfManufacture: 2020 });
    expect(r.ageYears).toBe(6);
    expect(r.warnings).toHaveLength(1);
  });

  it('returns a message when no excise table covers the vehicle', () => {
    const outcome = calculateDuty({ ...petrolCar, vehicleType: 'van' }, fixture, YEAR);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toMatch(/excise/i);
  });

  it('handles very large values without losing cents', () => {
    const r = ok({ ...petrolCar, capacity: 1500, cifAmount: 1e10, currency: 'LKR' });
    expect(Number.isFinite(r.totalTax)).toBe(true);
    expect(r.totalTax).toBe(roundMoney(r.totalTax));
  });
});

describe('validation', () => {
  it.each([
    [{ capacity: 0 }, 'capacity'],
    [{ capacity: -5 }, 'capacity'],
    [{ capacity: Number.NaN }, 'capacity'],
    [{ cifAmount: 0 }, 'cifAmount'],
    [{ cifAmount: -100 }, 'cifAmount'],
    [{ exchangeRate: 0 }, 'exchangeRate'],
    [{ yearOfManufacture: 1900 }, 'yearOfManufacture'],
    [{ yearOfManufacture: YEAR + 2 }, 'yearOfManufacture'],
    [{ yearOfManufacture: 2024.5 }, 'yearOfManufacture'],
  ])('rejects %o', (patch, field) => {
    const outcome = calculateDuty({ ...petrolCar, ...patch }, fixture, YEAR);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.errors).toHaveProperty(field);
  });

  it('ignores the exchange rate for LKR values', () => {
    const r = ok({ ...petrolCar, currency: 'LKR', cifAmount: 3_000_000, exchangeRate: 0 });
    expect(r.cifLkr).toBe(3_000_000);
  });
});

describe('helpers', () => {
  it('converts CIF to LKR and rounds to cents', () => {
    expect(cifInLkr({ cifAmount: 1_234_567, currency: 'JPY', exchangeRate: 2.0153 })).toBe(2_488_022.88); // 2,488,022.8751
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('computes age by calendar year, never negative', () => {
    expect(vehicleAge(2023, 2026)).toBe(3);
    expect(vehicleAge(2027, 2026)).toBe(0);
  });

  it('matches rules on type, fuel and inclusive capacity bounds', () => {
    const v = { vehicleType: 'car' as const, fuelType: 'petrol' as const, capacity: 1000 };
    expect(matches(undefined, v)).toBe(true);
    expect(matches({ maxCapacity: 1000 }, v)).toBe(true);
    expect(matches({ minCapacity: 1001 }, v)).toBe(false);
    expect(matches({ fuelTypes: ['electric'] }, v)).toBe(false);
    expect(matches({ vehicleTypes: ['car', 'van'] }, v)).toBe(true);
  });

  it('chooses the capacity unit from the excise table, defaulting EVs to kW', () => {
    expect(capacityUnitFor(fixture, 'car', 'electric')).toBe('kW');
    expect(capacityUnitFor(fixture, 'car', 'petrol')).toBe('cc');
    expect(capacityUnitFor(null, 'van', 'electric')).toBe('kW');
    expect(capacityUnitFor(null, 'van', 'diesel')).toBe('cc');
  });

  it('returns undefined when a band has no matching age', () => {
    const table = {
      ...fixture.exciseTables[0],
      bands: [{ maxCapacity: null, ages: [{ maxAgeYears: 1, rate: { perUnit: 1 } }] }],
    };
    expect(exciseFor(table, 1000, 5, 1)).toBeUndefined();
  });

  it('builds a copyable summary', () => {
    const summary = formatSummary(petrolCar, ok(petrolCar));
    expect(summary).toContain('Car, Petrol, 990 cc, made in 2025');
    expect(summary).toContain('Total taxes: Rs. 2,834,200.00');
    expect(summary).toContain('Estimated landed cost: Rs. 5,834,200.00');
  });
});

describe('rates schema', () => {
  it('accepts the fixture', () => {
    expect(() => vehicleDutyRatesSchema.parse(fixture)).not.toThrow();
  });

  it('rejects a component that includes a later component', () => {
    const bad = { ...fixture, components: [...fixture.components].reverse() };
    expect(vehicleDutyRatesSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects capacity bands that are out of order', () => {
    const bad = structuredClone(fixture);
    bad.exciseTables[0].bands.reverse();
    expect(vehicleDutyRatesSchema.safeParse(bad).success).toBe(false);
  });
});

describe('vehicle-duty.json', () => {
  const file = ratesFile as RatesFile<VehicleDutyRates>;

  it('has the required metadata', () => {
    expect(file.name).toBeTruthy();
    expect(file.source).toMatch(/^https:\/\//);
  });

  if (file.data === null) {
    it('lists what must be verified while rates are pending', () => {
      expect(file.todo?.length).toBeGreaterThan(0);
    });
    it.todo('matches a worked example from Sri Lanka Customs once verified rates are added');
  } else {
    it('matches the rates schema', () => {
      expect(() => vehicleDutyRatesSchema.parse(file.data)).not.toThrow();
    });
    it('has real verification dates', () => {
      expect(file.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(file.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  }
});

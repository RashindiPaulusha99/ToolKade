import { formatLKR, formatNumber, formatPercent } from '@/lib/format';

/*
 * Vehicle import duty: pure, data-driven calculation.
 *
 * Every rate, base and threshold comes from src/data/rates/vehicle-duty.json (see the
 * VehicleDutyRates type below). Nothing here hardcodes an official figure: the gazette
 * structure changes too often, and sources disagree, so the order of components and what
 * each one is charged on are data too.
 */

export type VehicleType = 'car' | 'suv' | 'van';
export type FuelType = 'petrol' | 'diesel' | 'petrol-hybrid' | 'diesel-hybrid' | 'electric';
export type CapacityUnit = 'cc' | 'kW';
export type Currency = 'JPY' | 'USD' | 'LKR';

/** Restricts a rule to some vehicles. Omitted fields match everything. Capacity bounds are inclusive. */
export interface AppliesTo {
  vehicleTypes?: VehicleType[];
  fuelTypes?: FuelType[];
  minCapacity?: number;
  maxCapacity?: number;
}

/**
 * Excise for one capacity band and age band. The charge is the HIGHEST of the parts that are set:
 * perUnit × capacity (LKR per cc or kW), adValorem × CIF (LKR), and minimum.
 */
export interface ExciseRate {
  perUnit?: number;
  adValorem?: number;
  minimum?: number;
}

export interface ExciseAgeBand {
  /** Inclusive upper age in whole years; null = no upper limit. */
  maxAgeYears: number | null;
  rate: ExciseRate;
}

export interface ExciseBand {
  /** Inclusive upper capacity for this band; null = no upper limit. Bands are listed in ascending order. */
  maxCapacity: number | null;
  ages: ExciseAgeBand[];
}

export interface ExciseTable {
  vehicleTypes: VehicleType[];
  fuelTypes: FuelType[];
  unit: CapacityUnit;
  bands: ExciseBand[];
}

export interface LuxuryTaxRule {
  appliesTo: AppliesTo;
  /** CIF value in LKR above which the tax applies. */
  thresholdLkr: number;
  /** Fraction, e.g. 0.6 for 60%. */
  rate: number;
  /** "cif-excess": rate × (CIF − threshold). "cif": rate × whole CIF once above the threshold. */
  base: 'cif-excess' | 'cif';
}

interface ComponentBase {
  /** Stable id, referenced by later components' `base.include`. */
  id: string;
  label: string;
  appliesTo?: AppliesTo;
}

/** rate × (CIF × cifMultiplier + sum of earlier components listed in `include`). */
export interface PercentComponent extends ComponentBase {
  kind: 'percent';
  rate: number;
  base: { cifMultiplier: number; include: string[] };
}

export interface ExciseComponent extends ComponentBase {
  kind: 'excise';
}

export interface LuxuryComponent extends ComponentBase {
  kind: 'luxury';
}

export interface FixedComponent extends ComponentBase {
  kind: 'fixed';
  amount: number;
}

export type TaxComponent = PercentComponent | ExciseComponent | LuxuryComponent | FixedComponent;

export interface VehicleDutyRates {
  /** Oldest vehicle (in years) that may be imported, if there is a limit. Used for a warning only. */
  maxAgeYears?: number;
  /** Calculated in this order. A component's base may only include components listed before it. */
  components: TaxComponent[];
  exciseTables: ExciseTable[];
  luxuryTax: LuxuryTaxRule[];
}

export interface VehicleInput {
  vehicleType: VehicleType;
  fuelType: FuelType;
  /** Engine capacity in cc, or motor power in kW, matching capacityUnitFor(). */
  capacity: number;
  yearOfManufacture: number;
  cifAmount: number;
  currency: Currency;
  /** LKR per 1 unit of `currency`. Ignored for LKR. */
  exchangeRate: number;
}

export interface DutyLine {
  id: string;
  label: string;
  amount: number;
  /** Human-readable working, e.g. "20% of Rs. 5,000,000.00". */
  detail: string;
}

export interface DutyResult {
  cifLkr: number;
  ageYears: number;
  capacityUnit: CapacityUnit;
  lines: DutyLine[];
  totalTax: number;
  landedCost: number;
  /** Total tax as a fraction of CIF. */
  effectiveRate: number;
  warnings: string[];
}

export type FieldErrors = Partial<
  Record<'capacity' | 'yearOfManufacture' | 'cifAmount' | 'exchangeRate', string>
>;

export type DutyOutcome =
  { ok: true; result: DutyResult } | { ok: false; errors: FieldErrors; message?: string };

export const vehicleTypes: Array<{ value: VehicleType; label: string }> = [
  { value: 'car', label: 'Car' },
  { value: 'suv', label: 'SUV / crossover' },
  { value: 'van', label: 'Van' },
];

export const fuelTypes: Array<{ value: FuelType; label: string }> = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol-hybrid', label: 'Petrol hybrid' },
  { value: 'diesel-hybrid', label: 'Diesel hybrid' },
  { value: 'electric', label: 'Electric (EV)' },
];

export const currencies: Currency[] = ['JPY', 'USD', 'LKR'];

/** Rounds to cents, avoiding binary floating-point drift (e.g. 1.005 → 1.01). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function matches(
  rule: AppliesTo | undefined,
  input: Pick<VehicleInput, 'vehicleType' | 'fuelType' | 'capacity'>,
): boolean {
  if (!rule) return true;
  if (rule.vehicleTypes && !rule.vehicleTypes.includes(input.vehicleType)) return false;
  if (rule.fuelTypes && !rule.fuelTypes.includes(input.fuelType)) return false;
  if (rule.minCapacity !== undefined && input.capacity < rule.minCapacity) return false;
  if (rule.maxCapacity !== undefined && input.capacity > rule.maxCapacity) return false;
  return true;
}

export function findExciseTable(
  rates: VehicleDutyRates,
  vehicleType: VehicleType,
  fuelType: FuelType,
): ExciseTable | undefined {
  return rates.exciseTables.find(
    (t) => t.vehicleTypes.includes(vehicleType) && t.fuelTypes.includes(fuelType),
  );
}

/** Unit the capacity input should use. The excise table decides; without rates, EVs use kW and the rest cc. */
export function capacityUnitFor(
  rates: VehicleDutyRates | null,
  vehicleType: VehicleType,
  fuelType: FuelType,
): CapacityUnit {
  const table = rates ? findExciseTable(rates, vehicleType, fuelType) : undefined;
  return table?.unit ?? (fuelType === 'electric' ? 'kW' : 'cc');
}

/** Age in whole years at the time of import (calendar-year difference; the gazette may count months). */
export function vehicleAge(yearOfManufacture: number, importYear: number): number {
  return Math.max(0, importYear - yearOfManufacture);
}

export function cifInLkr(input: Pick<VehicleInput, 'cifAmount' | 'currency' | 'exchangeRate'>): number {
  return roundMoney(input.currency === 'LKR' ? input.cifAmount : input.cifAmount * input.exchangeRate);
}

export function validateInput(input: VehicleInput, currentYear: number): FieldErrors {
  const errors: FieldErrors = {};
  if (!Number.isFinite(input.capacity) || input.capacity <= 0) {
    errors.capacity = 'Enter a capacity greater than zero.';
  }
  if (
    !Number.isInteger(input.yearOfManufacture) ||
    input.yearOfManufacture < 1950 ||
    input.yearOfManufacture > currentYear + 1
  ) {
    errors.yearOfManufacture = `Enter a year between 1950 and ${currentYear + 1}.`;
  }
  if (!Number.isFinite(input.cifAmount) || input.cifAmount <= 0) {
    errors.cifAmount = 'Enter the CIF value of the vehicle.';
  }
  if (input.currency !== 'LKR' && (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0)) {
    errors.exchangeRate = `Enter the LKR rate for 1 ${input.currency}.`;
  }
  return errors;
}

export function exciseFor(
  table: ExciseTable,
  capacity: number,
  ageYears: number,
  cifLkr: number,
): { amount: number; detail: string } | undefined {
  const band = table.bands.find((b) => b.maxCapacity === null || capacity <= b.maxCapacity);
  const ageBand = band?.ages.find((a) => a.maxAgeYears === null || ageYears <= a.maxAgeYears);
  if (!ageBand) return undefined;

  const { perUnit, adValorem, minimum } = ageBand.rate;
  const options: Array<{ amount: number; detail: string }> = [];
  if (perUnit !== undefined) {
    options.push({
      amount: perUnit * capacity,
      detail: `${formatLKR(perUnit)} per ${table.unit} × ${formatNumber(capacity)} ${table.unit}`,
    });
  }
  if (adValorem !== undefined) {
    options.push({ amount: adValorem * cifLkr, detail: `${formatPercent(adValorem, 2)} of CIF` });
  }
  if (minimum !== undefined) {
    options.push({ amount: minimum, detail: `minimum ${formatLKR(minimum)}` });
  }
  if (options.length === 0) return undefined;

  const best = options.reduce((a, b) => (b.amount > a.amount ? b : a));
  return {
    amount: roundMoney(best.amount),
    detail: options.length > 1 ? `${best.detail} (the higher of ${options.length} methods)` : best.detail,
  };
}

export function luxuryTaxFor(
  rates: VehicleDutyRates,
  input: Pick<VehicleInput, 'vehicleType' | 'fuelType' | 'capacity'>,
  cifLkr: number,
): { amount: number; detail: string } {
  const rule = rates.luxuryTax.find((r) => matches(r.appliesTo, input));
  if (!rule) return { amount: 0, detail: 'Not applicable to this vehicle' };
  if (cifLkr <= rule.thresholdLkr) {
    return { amount: 0, detail: `CIF is not above the ${formatLKR(rule.thresholdLkr)} threshold` };
  }
  const base = rule.base === 'cif-excess' ? cifLkr - rule.thresholdLkr : cifLkr;
  return {
    amount: roundMoney(rule.rate * base),
    detail:
      rule.base === 'cif-excess'
        ? `${formatPercent(rule.rate, 2)} of CIF above ${formatLKR(rule.thresholdLkr)}`
        : `${formatPercent(rule.rate, 2)} of CIF (above the ${formatLKR(rule.thresholdLkr)} threshold)`,
  };
}

/**
 * Calculates every component in the order listed in the rates file.
 * `currentYear` is passed in (not read from the clock) so the function stays pure and testable.
 */
export function calculateDuty(
  input: VehicleInput,
  rates: VehicleDutyRates,
  currentYear: number,
): DutyOutcome {
  const errors = validateInput(input, currentYear);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const cifLkr = cifInLkr(input);
  const ageYears = vehicleAge(input.yearOfManufacture, currentYear);
  const warnings: string[] = [];
  if (rates.maxAgeYears !== undefined && ageYears > rates.maxAgeYears) {
    warnings.push(
      `This vehicle is about ${ageYears} years old. Current rules allow imports of vehicles up to ${rates.maxAgeYears} years old, so it may not be eligible.`,
    );
  }

  const table = findExciseTable(rates, input.vehicleType, input.fuelType);
  const amounts = new Map<string, number>();
  const lines: DutyLine[] = [];

  for (const component of rates.components) {
    if (!matches(component.appliesTo, input)) continue;

    let line: { amount: number; detail: string };
    switch (component.kind) {
      case 'percent': {
        const included = component.base.include.map((id) => amounts.get(id) ?? 0);
        const base = cifLkr * component.base.cifMultiplier + included.reduce((sum, n) => sum + n, 0);
        const { cifMultiplier } = component.base;
        const cifPart =
          cifMultiplier === 0
            ? []
            : [cifMultiplier === 1 ? 'CIF' : `CIF × ${formatNumber(cifMultiplier, 4)}`];
        const parts = [
          ...cifPart,
          ...component.base.include
            .filter((id) => amounts.has(id))
            .map((id) => lines.find((l) => l.id === id)?.label ?? id),
        ];
        line = {
          amount: roundMoney(component.rate * base),
          detail: `${formatPercent(component.rate, 2)} of ${parts.length === 1 ? parts[0] : `(${parts.join(' + ')})`}`,
        };
        break;
      }
      case 'excise': {
        if (!table) {
          return {
            ok: false,
            errors: {},
            message: 'We do not have excise rates for this vehicle and fuel type yet.',
          };
        }
        const excise = exciseFor(table, input.capacity, ageYears, cifLkr);
        if (!excise) {
          return {
            ok: false,
            errors: {},
            message: 'We do not have an excise rate for this engine size and age yet.',
          };
        }
        line = excise;
        break;
      }
      case 'luxury':
        line = luxuryTaxFor(rates, input, cifLkr);
        break;
      case 'fixed':
        line = { amount: roundMoney(component.amount), detail: 'Fixed amount per vehicle' };
        break;
    }

    amounts.set(component.id, line.amount);
    lines.push({ id: component.id, label: component.label, ...line });
  }

  const totalTax = roundMoney(lines.reduce((sum, l) => sum + l.amount, 0));
  return {
    ok: true,
    result: {
      cifLkr,
      ageYears,
      capacityUnit: table?.unit ?? capacityUnitFor(rates, input.vehicleType, input.fuelType),
      lines,
      totalTax,
      landedCost: roundMoney(cifLkr + totalTax),
      effectiveRate: cifLkr > 0 ? totalTax / cifLkr : 0,
      warnings,
    },
  };
}

/** Plain-text summary for the Copy button. */
export function formatSummary(input: VehicleInput, result: DutyResult): string {
  const vehicle = vehicleTypes.find((v) => v.value === input.vehicleType)?.label ?? input.vehicleType;
  const fuel = fuelTypes.find((f) => f.value === input.fuelType)?.label ?? input.fuelType;
  const rows = [
    'Vehicle import duty estimate (ToolKade)',
    `${vehicle}, ${fuel}, ${formatNumber(input.capacity)} ${result.capacityUnit}, made in ${input.yearOfManufacture}`,
    `CIF value: ${formatLKR(result.cifLkr)}`,
    '',
    ...result.lines.map((l) => `${l.label}: ${formatLKR(l.amount)}`),
    '',
    `Total taxes: ${formatLKR(result.totalTax)}`,
    `Estimated landed cost: ${formatLKR(result.landedCost)}`,
    '',
    'Estimate only. Confirm with Sri Lanka Customs before you import.',
  ];
  return rows.join('\n');
}

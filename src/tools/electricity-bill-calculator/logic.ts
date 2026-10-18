import { formatLKR, formatNumber } from '@/lib/format';

/*
 * Electricity bill from a PUCSL block tariff. Pure; all rates come from
 * src/data/rates/electricity-tariff.json.
 *
 * - A tariff has consumption bands (e.g. up to 60 units, up to 180 units, above 180). The whole bill
 *   uses the first band whose limit the consumption does not exceed.
 * - Within a band, units are charged block by block at each block's rate.
 * - The fixed charge is that of the highest block the consumption reaches.
 * - Block and band limits are set for a 30-day cycle and prorated for other billing periods (PUCSL).
 */

export interface TariffBlock {
  /** Upper unit limit of the block for a standard cycle; null = no limit. */
  upTo: number | null;
  /** LKR per kWh. */
  rate: number;
  /** Monthly fixed charge when this is the highest block reached; null = not set for this block. */
  fixedCharge: number | null;
}

export interface TariffBand {
  /** Highest monthly consumption this band applies to; null = no limit. */
  maxUnits: number | null;
  blocks: TariffBlock[];
}

export interface Tariff {
  label: string;
  bands: TariffBand[];
}

export interface ElectricityRates {
  /** Billing cycle the limits are set for (30 days). */
  billingDays: number;
  tariffs: Record<string, Tariff>;
}

export interface BlockLine {
  from: number;
  to: number | null;
  units: number;
  rate: number;
  charge: number;
}

export interface BillResult {
  units: number;
  days: number;
  lines: BlockLine[];
  energyCharge: number;
  fixedCharge: number;
  total: number;
  /** Total ÷ units (null at 0 units). */
  averagePerUnit: number | null;
}

export type BillErrors = Partial<Record<'units' | 'days' | 'amount', string>>;

export const MAX_UNITS = 1_000_000;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function validateBillInput(units: number, days: number): BillErrors {
  const errors: BillErrors = {};
  if (!Number.isFinite(units) || units < 0) errors.units = 'Enter the units used (0 or more).';
  else if (units > MAX_UNITS) errors.units = `Enter up to ${formatNumber(MAX_UNITS)} units.`;
  if (!Number.isInteger(days) || days < 1 || days > 90)
    errors.days = 'Enter a billing period of 1 to 90 days.';
  return errors;
}

/** Bill for `units` kWh over `days` days. Assumes valid input (see validateBillInput). */
export function calculateBill(units: number, tariff: Tariff, days: number, standardDays: number): BillResult {
  // Multiply before dividing so a 30-unit limit over 31 days is exactly 31 (not 31.000000000000004),
  // which matters at band edges.
  const prorate = (limit: number) => (limit * days) / standardDays;
  const band =
    tariff.bands.find((b) => b.maxUnits === null || units <= prorate(b.maxUnits)) ??
    tariff.bands[tariff.bands.length - 1];

  const lines: BlockLine[] = [];
  let lower = 0;
  let fixedCharge = band.blocks[0]?.fixedCharge ?? 0;
  for (const block of band.blocks) {
    const upper = block.upTo === null ? null : prorate(block.upTo);
    const inBlock = Math.max(0, (upper === null ? units : Math.min(units, upper)) - lower);
    lines.push({
      from: lower,
      to: upper,
      units: inBlock,
      rate: block.rate,
      charge: roundMoney(inBlock * block.rate),
    });
    if (inBlock > 0 && block.fixedCharge !== null) fixedCharge = block.fixedCharge;
    if (upper === null) break;
    lower = upper;
  }

  const energyCharge = roundMoney(lines.reduce((sum, line) => sum + line.charge, 0));
  const total = roundMoney(energyCharge + fixedCharge);
  return {
    units,
    days,
    lines,
    energyCharge,
    fixedCharge,
    total,
    averagePerUnit: units > 0 ? total / units : null,
  };
}

export interface UnitsEstimate {
  /** Most whole units whose bill does not exceed the amount. */
  units: number;
  /** Bill for `units`. */
  bill: number;
  /** Bill for one more unit (the amount falls between `bill` and this). */
  nextBill: number;
  /** True if the amount is below the bill for 0 units (the minimum fixed charge). */
  belowMinimum: boolean;
}

/**
 * Reverse mode: estimates whole units from a bill amount. Bills never decrease as units rise
 * (tested), so binary search finds the largest unit count whose bill fits the amount.
 */
export function estimateUnits(
  amount: number,
  tariff: Tariff,
  days: number,
  standardDays: number,
): UnitsEstimate {
  const bill = (u: number) => calculateBill(u, tariff, days, standardDays).total;
  if (amount < bill(0)) return { units: 0, bill: bill(0), nextBill: bill(1), belowMinimum: true };
  let low = 0;
  let high = MAX_UNITS;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (bill(mid) <= amount) low = mid;
    else high = mid - 1;
  }
  return { units: low, bill: bill(low), nextBill: bill(low + 1), belowMinimum: false };
}

/** Plain-text summary for the Copy button. */
export function formatSummary(tariff: Tariff, result: BillResult): string {
  return [
    `Electricity bill estimate (ToolKade): ${tariff.label}`,
    `${formatNumber(result.units)} units over ${result.days} days`,
    ...result.lines
      .filter((l) => l.units > 0)
      .map((l) => `${formatNumber(l.units)} units × ${formatLKR(l.rate)} = ${formatLKR(l.charge)}`),
    `Fixed charge: ${formatLKR(result.fixedCharge)}`,
    `Total: ${formatLKR(result.total)}`,
    '',
    'Estimate only. Your bill may include other charges or adjustments.',
  ].join('\n');
}

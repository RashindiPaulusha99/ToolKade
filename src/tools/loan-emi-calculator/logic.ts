import { formatLKR, formatNumber } from '@/lib/format';

/*
 * Loan and leasing instalments. Pure maths, no official rates involved.
 *
 * Reducing balance: interest is charged each month on the balance still owed (standard EMI formula).
 * Flat rate: interest is charged on the original amount for the whole term, which is how many
 * Sri Lankan leasing quotes are expressed. The flat-rate schedule spreads interest evenly across
 * the months; some lenders allocate it differently (e.g. the "rule of 78"), which changes the
 * interest/principal split but not the instalment or the total.
 */

export type Method = 'reducing' | 'flat';

export interface LoanInput {
  /** Amount borrowed or financed, in LKR. */
  amount: number;
  /** Annual interest rate in percent, e.g. 14 for 14%. */
  annualRate: number;
  /** Term in whole months. */
  months: number;
  method: Method;
}

export interface ScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface YearSummary {
  year: number;
  principal: number;
  interest: number;
}

export interface LoanResult {
  /** Regular monthly instalment (the last one may differ by a few cents). */
  instalment: number;
  totalInterest: number;
  totalPayable: number;
  schedule: ScheduleRow[];
  yearly: YearSummary[];
  /** For flat-rate loans: the reducing-balance rate with the same instalment (percent a year). */
  equivalentReducingRate: number | null;
  /** For reducing-balance loans: the flat rate with the same total interest (percent a year). */
  equivalentFlatRate: number | null;
}

export type LoanErrors = Partial<Record<'amount' | 'annualRate' | 'months', string>>;
export type LoanOutcome = { ok: true; result: LoanResult } | { ok: false; errors: LoanErrors };

export const MAX_MONTHS = 600;
/** Rs. 10 billion: far above any personal loan, and keeps cent-level sums exact in floating point. */
export const MAX_AMOUNT = 10_000_000_000;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Standard reducing-balance instalment (EMI), unrounded. */
export function reducingInstalment(amount: number, annualRate: number, months: number): number {
  const r = annualRate / 1200;
  if (r === 0) return amount / months;
  const growth = (1 + r) ** months;
  return (amount * r * growth) / (growth - 1);
}

/** Flat-rate total interest and instalment, unrounded. */
export function flatTerms(amount: number, annualRate: number, months: number) {
  const totalInterest = (amount * annualRate * months) / 1200;
  return { totalInterest, instalment: (amount + totalInterest) / months };
}

/**
 * Annual reducing-balance rate (percent) whose instalment equals `instalment`. The EMI rises
 * monotonically with the rate, so bisection converges reliably.
 */
export function rateForInstalment(amount: number, instalment: number, months: number): number {
  if (instalment * months <= amount) return 0;
  let low = 0;
  let high = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (reducingInstalment(amount, mid, months) < instalment) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function validateLoan(input: LoanInput): LoanErrors {
  const errors: LoanErrors = {};
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    errors.amount = 'Enter an amount greater than zero.';
  else if (input.amount > MAX_AMOUNT) errors.amount = `Enter an amount up to ${formatLKR(MAX_AMOUNT)}.`;
  if (!Number.isFinite(input.annualRate) || input.annualRate < 0 || input.annualRate > 100) {
    errors.annualRate = 'Enter an interest rate between 0% and 100%.';
  }
  if (!Number.isInteger(input.months) || input.months < 1 || input.months > MAX_MONTHS) {
    errors.months = `Enter a term between 1 month and ${MAX_MONTHS / 12} years.`;
  }
  return errors;
}

function buildSchedule(input: LoanInput, instalment: number): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const monthlyRate = input.annualRate / 1200;
  const flatInterest = roundMoney(
    flatTerms(input.amount, input.annualRate, input.months).totalInterest / input.months,
  );
  let balance = input.amount;
  let flatInterestLeft = roundMoney(flatTerms(input.amount, input.annualRate, input.months).totalInterest);

  for (let month = 1; month <= input.months; month++) {
    const last = month === input.months;
    let interest: number;
    if (input.method === 'reducing') {
      interest = roundMoney(balance * monthlyRate);
    } else {
      interest = last ? flatInterestLeft : flatInterest;
      flatInterestLeft = roundMoney(flatInterestLeft - interest);
    }
    // The last instalment clears whatever is left, absorbing rounding differences.
    const principal = last ? roundMoney(balance) : roundMoney(instalment - interest);
    balance = roundMoney(balance - principal);
    rows.push({ month, payment: roundMoney(principal + interest), principal, interest, balance });
  }
  return rows;
}

export function calculateLoan(input: LoanInput): LoanOutcome {
  const errors = validateLoan(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const exact =
    input.method === 'reducing'
      ? reducingInstalment(input.amount, input.annualRate, input.months)
      : flatTerms(input.amount, input.annualRate, input.months).instalment;
  const instalment = roundMoney(exact);
  const schedule = buildSchedule(input, instalment);

  const totalInterest = roundMoney(schedule.reduce((sum, row) => sum + row.interest, 0));
  const totalPayable = roundMoney(input.amount + totalInterest);

  const yearly: YearSummary[] = [];
  for (const row of schedule) {
    const year = Math.ceil(row.month / 12);
    const entry = yearly[year - 1] ?? (yearly[year - 1] = { year, principal: 0, interest: 0 });
    entry.principal = roundMoney(entry.principal + row.principal);
    entry.interest = roundMoney(entry.interest + row.interest);
  }

  const years = input.months / 12;
  return {
    ok: true,
    result: {
      instalment,
      totalInterest,
      totalPayable,
      schedule,
      yearly,
      equivalentReducingRate:
        input.method === 'flat' ? rateForInstalment(input.amount, exact, input.months) : null,
      equivalentFlatRate: input.method === 'reducing' ? (totalInterest / input.amount / years) * 100 : null,
    },
  };
}

/** Plain-text summary for the Copy button. */
export function formatSummary(input: LoanInput, result: LoanResult): string {
  const method = input.method === 'reducing' ? 'reducing balance' : 'flat rate';
  const equivalent =
    result.equivalentReducingRate !== null
      ? `Equivalent reducing-balance rate: about ${formatNumber(result.equivalentReducingRate, 2)}% a year`
      : `Equivalent flat rate: about ${formatNumber(result.equivalentFlatRate ?? 0, 2)}% a year`;
  return [
    'Loan / leasing estimate (ToolKade)',
    `Amount: ${formatLKR(input.amount)} at ${formatNumber(input.annualRate, 2)}% a year (${method}) for ${input.months} months`,
    `Monthly instalment: ${formatLKR(result.instalment)}`,
    `Total interest: ${formatLKR(result.totalInterest)}`,
    `Total payable: ${formatLKR(result.totalPayable)}`,
    equivalent,
    '',
    'Estimate only. Your lender’s figures may differ.',
  ].join('\n');
}

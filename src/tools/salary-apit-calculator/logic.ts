import { formatLKR, formatPercent } from '@/lib/format';

/*
 * Salary, APIT and EPF/ETF: pure calculation. Every rate comes from src/data/rates/apit.json.
 *
 * APIT (Advance Personal Income Tax) on regular monthly pay follows IRD Tax Table No. 01:
 * the annual personal relief and tax bands divided by 12, applied to gross regular profits
 * from employment (salary + allowances) with no deduction for the employee's EPF.
 */

export interface TaxBand {
  /** Annual width of the band in LKR; null = everything above. */
  width: number | null;
  /** Fraction, e.g. 0.06 for 6%. */
  rate: number;
}

export interface SalaryRates {
  apit: {
    /** Annual tax-free personal relief in LKR. */
    personalReliefAnnual: number;
    /** Annual bands above the relief, in order. The last band has width null. */
    bands: TaxBand[];
  };
  epf: { employeeRate: number; employerRate: number };
  etf: { employerRate: number };
}

export type Period = 'monthly' | 'annual';

export interface SalaryInput {
  /** Salary for the chosen period (basic or consolidated salary that EPF is paid on). */
  salary: number;
  /** Other taxable allowances for the chosen period. */
  allowances: number;
  period: Period;
  /** Whether the allowances also count towards EPF and ETF ("total earnings" on the payslip). */
  allowancesInEpf: boolean;
}

export interface BracketLine {
  /** Lower edge for the period, in LKR. */
  from: number;
  /** Upper edge for the period; null = no upper limit. */
  to: number | null;
  /** 0 for the personal relief band. */
  rate: number;
  /** Part of the income that falls in this band. */
  taxable: number;
  tax: number;
}

export interface PayFigures {
  gross: number;
  epfBase: number;
  epfEmployee: number;
  apit: number;
  totalDeductions: number;
  takeHome: number;
  epfEmployer: number;
  etf: number;
  /** Gross pay + employer EPF + ETF. */
  employerCost: number;
}

export interface SalaryResult {
  monthly: PayFigures;
  annual: PayFigures;
  /** Bracket breakdown for the input period. */
  brackets: BracketLine[];
  /** APIT as a fraction of gross pay. */
  effectiveTaxRate: number;
  /** Rate applied to the next rupee earned. */
  marginalRate: number;
}

export type SalaryErrors = Partial<Record<'salary' | 'allowances', string>>;

export type SalaryOutcome = { ok: true; result: SalaryResult } | { ok: false; errors: SalaryErrors };

/** Rounds to cents, avoiding binary floating-point drift. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Tax on `income` for one period, where the year is split into `periodsPerYear` equal periods
 * (12 for monthly APIT, 1 for an annual figure). Returns the total and the per-band breakdown.
 */
export function calculateApit(
  income: number,
  apit: SalaryRates['apit'],
  periodsPerYear: number,
): { tax: number; brackets: BracketLine[] } {
  const relief = apit.personalReliefAnnual / periodsPerYear;
  const brackets: BracketLine[] = [
    { from: 0, to: relief, rate: 0, taxable: Math.min(income, relief), tax: 0 },
  ];

  let lower = relief;
  let tax = 0;
  for (const band of apit.bands) {
    const upper = band.width === null ? null : lower + band.width / periodsPerYear;
    const taxable = Math.max(0, (upper === null ? income : Math.min(income, upper)) - lower);
    const bandTax = taxable * band.rate;
    tax += bandTax;
    brackets.push({ from: lower, to: upper, rate: band.rate, taxable, tax: bandTax });
    if (upper === null) break;
    lower = upper;
  }

  return {
    tax: roundMoney(tax),
    brackets: brackets.map((b) => ({
      ...b,
      from: roundMoney(b.from),
      to: b.to === null ? null : roundMoney(b.to),
      taxable: roundMoney(b.taxable),
      tax: roundMoney(b.tax),
    })),
  };
}

/** Rate that applies to the next rupee of income for the period. */
export function marginalRateFor(income: number, apit: SalaryRates['apit'], periodsPerYear: number): number {
  let lower = apit.personalReliefAnnual / periodsPerYear;
  if (income < lower) return 0;
  for (const band of apit.bands) {
    if (band.width === null) return band.rate;
    const upper = lower + band.width / periodsPerYear;
    if (income < upper) return band.rate;
    lower = upper;
  }
  return apit.bands.at(-1)?.rate ?? 0;
}

function figuresFor(
  salary: number,
  allowances: number,
  allowancesInEpf: boolean,
  rates: SalaryRates,
  periodsPerYear: number,
): PayFigures {
  const gross = roundMoney(salary + allowances);
  const epfBase = roundMoney(allowancesInEpf ? gross : salary);
  const epfEmployee = roundMoney(epfBase * rates.epf.employeeRate);
  const apit = calculateApit(gross, rates.apit, periodsPerYear).tax;
  const totalDeductions = roundMoney(epfEmployee + apit);
  const epfEmployer = roundMoney(epfBase * rates.epf.employerRate);
  const etf = roundMoney(epfBase * rates.etf.employerRate);
  return {
    gross,
    epfBase,
    epfEmployee,
    apit,
    totalDeductions,
    takeHome: roundMoney(gross - totalDeductions),
    epfEmployer,
    etf,
    employerCost: roundMoney(gross + epfEmployer + etf),
  };
}

export function validateSalary(input: SalaryInput): SalaryErrors {
  const errors: SalaryErrors = {};
  if (!Number.isFinite(input.salary) || input.salary < 0) errors.salary = 'Enter a salary of zero or more.';
  if (!Number.isFinite(input.allowances) || input.allowances < 0) {
    errors.allowances = 'Enter allowances of zero or more (leave blank if none).';
  }
  if (!errors.salary && !errors.allowances && input.salary + input.allowances <= 0) {
    errors.salary = 'Enter your salary.';
  }
  return errors;
}

/**
 * Monthly and annual pay assuming the same pay every month of the year of assessment
 * (IRD Table No. 01). Annual figures use the annual bands, which equal 12 × the monthly result.
 */
export function calculateSalary(input: SalaryInput, rates: SalaryRates): SalaryOutcome {
  const errors = validateSalary(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const perMonth = input.period === 'monthly' ? 1 : 1 / 12;
  const monthlySalary = input.salary * perMonth;
  const monthlyAllowances = input.allowances * perMonth;
  const annualSalary = input.period === 'annual' ? input.salary : input.salary * 12;
  const annualAllowances = input.period === 'annual' ? input.allowances : input.allowances * 12;

  const monthly = figuresFor(monthlySalary, monthlyAllowances, input.allowancesInEpf, rates, 12);
  const annual = figuresFor(annualSalary, annualAllowances, input.allowancesInEpf, rates, 1);
  const periodsPerYear = input.period === 'monthly' ? 12 : 1;
  const periodGross = input.period === 'monthly' ? monthly.gross : annual.gross;

  return {
    ok: true,
    result: {
      monthly,
      annual,
      brackets: calculateApit(periodGross, rates.apit, periodsPerYear).brackets,
      effectiveTaxRate: annual.gross > 0 ? annual.apit / annual.gross : 0,
      marginalRate: marginalRateFor(periodGross, rates.apit, periodsPerYear),
    },
  };
}

export interface SalaryComparison {
  a: PayFigures;
  b: PayFigures;
  /** b − a for each figure. */
  difference: PayFigures;
  /** Share of the extra gross pay kept as take-home pay (null when gross pay is equal). */
  keptShare: number | null;
}

/** Compares two salaries for the same period and EPF setting. */
export function compareSalaries(
  a: Pick<SalaryInput, 'salary' | 'allowances'>,
  b: Pick<SalaryInput, 'salary' | 'allowances'>,
  shared: Pick<SalaryInput, 'period' | 'allowancesInEpf'>,
  rates: SalaryRates,
): { ok: true; result: SalaryComparison } | { ok: false; errors: { a: SalaryErrors; b: SalaryErrors } } {
  const outA = calculateSalary({ ...a, ...shared }, rates);
  const outB = calculateSalary({ ...b, ...shared }, rates);
  if (!outA.ok || !outB.ok) {
    return { ok: false, errors: { a: outA.ok ? {} : outA.errors, b: outB.ok ? {} : outB.errors } };
  }
  const pick = (r: SalaryResult) => (shared.period === 'monthly' ? r.monthly : r.annual);
  const fa = pick(outA.result);
  const fb = pick(outB.result);
  const difference = Object.fromEntries(
    (Object.keys(fa) as Array<keyof PayFigures>).map((key) => [key, roundMoney(fb[key] - fa[key])]),
  ) as unknown as PayFigures;
  return {
    ok: true,
    result: {
      a: fa,
      b: fb,
      difference,
      keptShare: difference.gross !== 0 ? difference.takeHome / difference.gross : null,
    },
  };
}

/** Plain-text summary for the Copy button. */
export function formatSummary(input: SalaryInput, result: SalaryResult, rates: SalaryRates): string {
  const f = input.period === 'monthly' ? result.monthly : result.annual;
  const per = input.period === 'monthly' ? 'month' : 'year';
  return [
    `Salary and APIT estimate (ToolKade), per ${per}`,
    `Gross pay: ${formatLKR(f.gross)}`,
    `Employee EPF (${formatPercent(rates.epf.employeeRate)}): -${formatLKR(f.epfEmployee)}`,
    `APIT: -${formatLKR(f.apit)}`,
    `Take-home pay: ${formatLKR(f.takeHome)}`,
    '',
    `Employer EPF (${formatPercent(rates.epf.employerRate)}): ${formatLKR(f.epfEmployer)}`,
    `ETF (${formatPercent(rates.etf.employerRate)}): ${formatLKR(f.etf)}`,
    `Total cost to employer: ${formatLKR(f.employerCost)}`,
    '',
    'Estimate only. Your payslip may differ.',
  ].join('\n');
}

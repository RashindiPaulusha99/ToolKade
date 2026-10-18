import { Info, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { resultFigureClass } from '@/components/ui/styles';
import { formatLKR, formatNumber } from '@/lib/format';
import { calculateLoan, formatSummary, type LoanInput, type Method } from './logic';
import { YearlyChart } from './YearlyChart';

type TermUnit = 'years' | 'months';

interface FormState {
  amount: string;
  rate: string;
  term: string;
  unit: TermUnit;
  method: Method;
}

const initialState: FormState = { amount: '', rate: '', term: '', unit: 'years', method: 'reducing' };

const params: Record<keyof FormState, string> = {
  amount: 'amt',
  rate: 'rate',
  term: 'term',
  unit: 'unit',
  method: 'm',
};

function parseNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value.replace(/,/g, ''));
}

function readUrl(): Partial<FormState> {
  const search = new URLSearchParams(window.location.search);
  const state: Partial<FormState> = {};
  for (const key of ['amount', 'rate', 'term'] as const) {
    const value = search.get(params[key]);
    if (value && /^[\d.,]+$/.test(value)) state[key] = value;
  }
  if (search.get(params.unit) === 'months') state.unit = 'months';
  if (search.get(params.method) === 'flat') state.method = 'flat';
  return state;
}

function writeUrl(state: FormState) {
  const url = new URL(window.location.href);
  for (const key of Object.keys(params) as Array<keyof FormState>) {
    const value = state[key];
    if (value && value !== initialState[key]) url.searchParams.set(params[key], value);
    else url.searchParams.delete(params[key]);
  }
  window.history.replaceState(null, '', url);
}

export default function LoanEmiTool() {
  const [state, setState] = useState<FormState>(initialState);
  // Becomes true after the shared-link values have been read, so the first render does not wipe the URL.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Shared-link values can only be read after hydration (the server has no URL), so this runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, ...readUrl() }));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeUrl(state);
  }, [state, loaded]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const term = parseNumber(state.term);
  const input: LoanInput = {
    amount: parseNumber(state.amount),
    annualRate: parseNumber(state.rate),
    months: state.unit === 'years' ? Math.round(term * 12) : term,
    method: state.method,
  };
  const complete = state.amount.trim() !== '' && state.rate.trim() !== '' && state.term.trim() !== '';
  const outcome = complete ? calculateLoan(input) : null;
  const errors = outcome && !outcome.ok ? outcome.errors : {};
  const errorFor = (key: keyof typeof errors, raw: string) => (raw.trim() ? errors[key] : undefined);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <Card>
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300" id="method-label">
              How is the interest rate quoted?
            </p>
            <Tabs
              label="Interest method"
              items={[
                { value: 'reducing', label: 'Reducing balance' },
                { value: 'flat', label: 'Flat rate' },
              ]}
              value={state.method}
              onChange={(method) => set('method', method)}
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {state.method === 'reducing'
                ? 'Interest is charged on the balance you still owe. Most bank loans work this way.'
                : 'Interest is charged on the full amount for the whole term. Common in vehicle leasing quotes.'}
            </p>
          </div>

          <Input
            id="amount"
            label="Loan or lease amount"
            prefix="Rs."
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 5,000,000"
            value={state.amount}
            onChange={(e) => set('amount', e.target.value)}
            error={errorFor('amount', state.amount)}
          />

          <Input
            id="rate"
            label="Interest rate (% a year)"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 14"
            value={state.rate}
            onChange={(e) => set('rate', e.target.value)}
            error={errorFor('annualRate', state.rate)}
          />

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <Input
              id="term"
              label={`Term (${state.unit})`}
              inputMode="decimal"
              autoComplete="off"
              placeholder={state.unit === 'years' ? 'e.g. 5' : 'e.g. 60'}
              value={state.term}
              onChange={(e) => set('term', e.target.value)}
              error={errorFor('months', state.term)}
            />
            <Tabs
              label="Term unit"
              items={[
                { value: 'years', label: 'Years' },
                { value: 'months', label: 'Months' },
              ]}
              value={state.unit}
              onChange={(unit) => set('unit', unit)}
              className={errorFor('months', state.term) ? 'mb-7' : undefined}
            />
          </div>

          <Button variant="ghost" onClick={() => setState(initialState)}>
            <RotateCcw className="size-5" aria-hidden="true" />
            Reset
          </Button>
        </form>
      </Card>

      <div className="mt-6 lg:sticky lg:top-24 lg:mt-0" aria-live="polite">
        <Card variant="result">
          {!outcome ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Your monthly instalment</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                Enter the amount, interest rate and term to see your instalment and repayment schedule.
              </p>
            </div>
          ) : !outcome.ok ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">Check the details you entered.</p>
          ) : (
            <div>
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">Monthly instalment</h2>
              <p className={resultFigureClass}>{formatLKR(outcome.result.instalment)}</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-600 dark:text-slate-400">Total interest</dt>
                  <dd className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatLKR(outcome.result.totalInterest)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600 dark:text-slate-400">Total payable</dt>
                  <dd className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatLKR(outcome.result.totalPayable)}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 flex gap-2 rounded-control bg-white/70 p-3 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <Info
                  className="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-300"
                  aria-hidden="true"
                />
                {outcome.result.equivalentReducingRate !== null ? (
                  <span>
                    A {formatNumber(input.annualRate, 2)}% flat rate costs the same as about{' '}
                    <strong>{formatNumber(outcome.result.equivalentReducingRate, 2)}%</strong> on a reducing
                    balance. Compare loans using the reducing-balance rate.
                  </span>
                ) : (
                  <span>
                    This is the same total interest as a flat rate of about{' '}
                    <strong>{formatNumber(outcome.result.equivalentFlatRate ?? 0, 2)}%</strong> a year, useful
                    when comparing with leasing quotes.
                  </span>
                )}
              </p>

              <YearlyChart yearly={outcome.result.yearly} />

              <CopyButton
                className="mt-5"
                label="Copy summary"
                text={() => formatSummary(input, outcome.result)}
              />
            </div>
          )}
        </Card>
      </div>

      {outcome?.ok && (
        <details className="group mt-6 lg:col-span-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-card border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            Repayment schedule ({outcome.result.schedule.length} months)
            <span className="text-sm font-normal text-brand-700 group-open:hidden dark:text-brand-300">
              Show
            </span>
            <span className="hidden text-sm font-normal text-brand-700 group-open:inline dark:text-brand-300">
              Hide
            </span>
          </summary>
          <div className="mt-2 max-h-[32rem] overflow-auto rounded-card border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[32rem] text-right text-sm whitespace-nowrap tabular-nums">
              <caption className="sr-only">Month-by-month repayment schedule</caption>
              <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium">
                    Month
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Principal
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Interest
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {outcome.result.schedule.map((row) => (
                  <tr key={row.month} className="border-t border-slate-100 dark:border-slate-800">
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      {row.month}
                    </th>
                    <td className="px-4 py-2">{formatLKR(row.payment)}</td>
                    <td className="px-4 py-2">{formatLKR(row.principal)}</td>
                    <td className="px-4 py-2">{formatLKR(row.interest)}</td>
                    <td className="px-4 py-2">{formatLKR(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { cn, resultFigureClass } from '@/components/ui/styles';
import { formatLKR, formatPercent } from '@/lib/format';
import {
  calculateSalary,
  compareSalaries,
  formatSummary,
  type PayFigures,
  type Period,
  type SalaryErrors,
  type SalaryRates,
} from './logic';

interface Props {
  /** null while the official rates are being verified. */
  rates: SalaryRates | null;
}

type Mode = 'single' | 'compare';

interface FormState {
  mode: Mode;
  period: Period;
  salary: string;
  allowances: string;
  epfAllowances: boolean;
  salaryB: string;
  allowancesB: string;
}

const initialState: FormState = {
  mode: 'single',
  period: 'monthly',
  salary: '',
  allowances: '',
  epfAllowances: false,
  salaryB: '',
  allowancesB: '',
};

// Short query-string keys so a result can be shared as a link.
const textParams = { salary: 's', allowances: 'a', salaryB: 's2', allowancesB: 'a2' } as const;

function parseAmount(value: string): number {
  return value.trim() === '' ? 0 : Number(value.replace(/,/g, ''));
}

function readUrl(): Partial<FormState> {
  const search = new URLSearchParams(window.location.search);
  const state: Partial<FormState> = {};
  if (search.get('mode') === 'compare') state.mode = 'compare';
  if (search.get('p') === 'annual') state.period = 'annual';
  if (search.get('epf') === 'all') state.epfAllowances = true;
  for (const [key, param] of Object.entries(textParams) as Array<[keyof typeof textParams, string]>) {
    const value = search.get(param);
    if (value && /^[\d.,]+$/.test(value)) state[key] = value;
  }
  return state;
}

function writeUrl(state: FormState) {
  const url = new URL(window.location.href);
  const set = (key: string, value: string | null) =>
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  set('mode', state.mode === 'compare' ? 'compare' : null);
  set('p', state.period === 'annual' ? 'annual' : null);
  set('epf', state.epfAllowances ? 'all' : null);
  for (const [key, param] of Object.entries(textParams) as Array<[keyof typeof textParams, string]>) {
    set(param, state.mode === 'single' && key.endsWith('B') ? null : state[key] || null);
  }
  window.history.replaceState(null, '', url);
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 border-b border-brand-100 py-2 last:border-0 dark:border-brand-800',
        strong && 'font-semibold text-slate-900 dark:text-white',
        muted && 'text-slate-600 dark:text-slate-400',
      )}
    >
      <dt>{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

export default function SalaryApitTool({ rates }: Props) {
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

  const per = state.period === 'monthly' ? 'month' : 'year';
  const periodLabel = state.period === 'monthly' ? 'Monthly' : 'Annual';
  const hasA = state.salary.trim() !== '' || state.allowances.trim() !== '';
  const hasB = state.salaryB.trim() !== '' || state.allowancesB.trim() !== '';

  const single =
    rates && hasA
      ? calculateSalary(
          {
            salary: parseAmount(state.salary),
            allowances: parseAmount(state.allowances),
            period: state.period,
            allowancesInEpf: state.epfAllowances,
          },
          rates,
        )
      : null;

  const comparison =
    rates && state.mode === 'compare' && hasA && hasB
      ? compareSalaries(
          { salary: parseAmount(state.salary), allowances: parseAmount(state.allowances) },
          { salary: parseAmount(state.salaryB), allowances: parseAmount(state.allowancesB) },
          { period: state.period, allowancesInEpf: state.epfAllowances },
          rates,
        )
      : null;

  // Salary A is always calculated on its own too, so its errors come from `single` in both modes.
  const errorsA: SalaryErrors = single && !single.ok ? single.errors : {};
  const errorsB: SalaryErrors = comparison && !comparison.ok ? comparison.errors.b : {};

  const salaryFields = (suffix: '' | 'B', errors: SalaryErrors, heading?: string) => {
    const salaryKey = suffix ? 'salaryB' : 'salary';
    const allowancesKey = suffix ? 'allowancesB' : 'allowances';
    return (
      <fieldset className="space-y-5">
        {heading && <legend className="mb-3 font-semibold text-slate-900 dark:text-white">{heading}</legend>}
        <Input
          id={`salary${suffix}`}
          label={`${periodLabel} salary`}
          prefix="Rs."
          inputMode="decimal"
          autoComplete="off"
          placeholder={state.period === 'monthly' ? 'e.g. 250,000' : 'e.g. 3,000,000'}
          value={state[salaryKey]}
          onChange={(e) => set(salaryKey, e.target.value)}
          error={state[salaryKey].trim() ? errors.salary : undefined}
        />
        <Input
          id={`allowances${suffix}`}
          label={`${periodLabel} taxable allowances (optional)`}
          prefix="Rs."
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={state[allowancesKey]}
          onChange={(e) => set(allowancesKey, e.target.value)}
          error={state[allowancesKey].trim() ? errors.allowances : undefined}
        />
      </fieldset>
    );
  };

  const breakdown = (f: PayFigures, r: SalaryRates) => (
    <>
      <dl className="mt-4 text-sm">
        <Row label="Gross pay" value={formatLKR(f.gross)} />
        <Row
          label={`Your EPF (${formatPercent(r.epf.employeeRate)})`}
          value={`−${formatLKR(f.epfEmployee)}`}
        />
        <Row label="APIT (income tax)" value={`−${formatLKR(f.apit)}`} />
        <Row label="Take-home pay" value={formatLKR(f.takeHome)} strong />
      </dl>
      <h3 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">Paid by your employer</h3>
      <dl className="mt-1 text-sm">
        <Row
          label={`Employer EPF (${formatPercent(r.epf.employerRate)})`}
          value={formatLKR(f.epfEmployer)}
          muted
        />
        <Row label={`ETF (${formatPercent(r.etf.employerRate)})`} value={formatLKR(f.etf)} muted />
        <Row label="Total cost to employer" value={formatLKR(f.employerCost)} strong />
      </dl>
    </>
  );

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <Card>
        <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Tabs
              label="Calculator mode"
              items={[
                { value: 'single', label: 'Calculate' },
                { value: 'compare', label: 'Compare two salaries' },
              ]}
              value={state.mode}
              onChange={(mode) => set('mode', mode)}
            />
            <Tabs
              label="Pay period"
              items={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual' },
              ]}
              value={state.period}
              onChange={(period) => set('period', period)}
            />
          </div>

          {state.mode === 'single' ? (
            salaryFields('', errorsA)
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {salaryFields('', errorsA, 'Salary A (current)')}
              {salaryFields('B', errorsB, 'Salary B (new)')}
            </div>
          )}

          <Checkbox
            id="epf-allowances"
            label="Allowances count towards EPF and ETF"
            helper="Tick this if your payslip calculates EPF on your allowances as well as your salary."
            checked={state.epfAllowances}
            onChange={(e) => set('epfAllowances', e.target.checked)}
          />

          <Button
            variant="ghost"
            onClick={() => setState({ ...initialState, mode: state.mode, period: state.period })}
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            Reset
          </Button>
        </form>
      </Card>

      <div className="mt-6 lg:sticky lg:top-24 lg:mt-0" aria-live="polite">
        <Card variant="result">
          {!rates ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Rates are being updated</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                Your estimate will appear here once the verified rates are added. Please check back soon.
              </p>
            </div>
          ) : state.mode === 'compare' ? (
            !comparison ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Compare two salaries</h2>
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                  Enter your current salary and a new one (a raise or a job offer) to see how much more you
                  would take home each {per}.
                </p>
              </div>
            ) : !comparison.ok ? (
              <p className="text-sm text-slate-700 dark:text-slate-300">Check the salaries you entered.</p>
            ) : (
              <div>
                <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Change in take-home pay per {per}
                </h2>
                <p className={resultFigureClass}>
                  {comparison.result.difference.takeHome >= 0 ? '+' : '−'}
                  {formatLKR(Math.abs(comparison.result.difference.takeHome))}
                </p>
                {comparison.result.keptShare !== null && comparison.result.difference.gross > 0 && (
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    You keep {formatPercent(comparison.result.keptShare)} of the extra{' '}
                    {formatLKR(comparison.result.difference.gross)} gross pay.
                  </p>
                )}
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[20rem] text-left text-sm">
                    <caption className="sr-only">Salary A and Salary B compared, per {per}</caption>
                    <thead>
                      <tr className="border-b border-brand-100 text-slate-600 dark:border-brand-800 dark:text-slate-400">
                        <th scope="col" className="py-2 pr-3 font-medium">
                          Per {per}
                        </th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">
                          A
                        </th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">
                          B
                        </th>
                        <th scope="col" className="py-2 text-right font-medium">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {(
                        [
                          ['Gross pay', 'gross'],
                          ['Your EPF', 'epfEmployee'],
                          ['APIT', 'apit'],
                          ['Take-home pay', 'takeHome'],
                          ['Cost to employer', 'employerCost'],
                        ] as Array<[string, keyof PayFigures]>
                      ).map(([label, key]) => (
                        <tr
                          key={key}
                          className={cn(
                            'border-b border-brand-100 last:border-0 dark:border-brand-800',
                            key === 'takeHome' && 'font-semibold text-slate-900 dark:text-white',
                          )}
                        >
                          <th scope="row" className="py-2 pr-3 font-normal">
                            {label}
                          </th>
                          <td className="py-2 pr-3 text-right">{formatLKR(comparison.result.a[key])}</td>
                          <td className="py-2 pr-3 text-right">{formatLKR(comparison.result.b[key])}</td>
                          <td className="py-2 text-right">{formatLKR(comparison.result.difference[key])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : !single ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Your take-home pay</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                Enter your salary to see your APIT, EPF and take-home pay.
              </p>
            </div>
          ) : !single.ok ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">Check the amounts you entered.</p>
          ) : (
            (() => {
              const result = single.result;
              const f = state.period === 'monthly' ? result.monthly : result.annual;
              return (
                <div>
                  <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Take-home pay per {per}
                  </h2>
                  <p className={resultFigureClass}>{formatLKR(f.takeHome)}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {state.period === 'monthly'
                      ? `${formatLKR(result.annual.takeHome)} a year`
                      : `${formatLKR(result.monthly.takeHome)} a month`}{' '}
                    · effective tax rate {formatPercent(result.effectiveTaxRate)} (top band{' '}
                    {formatPercent(result.marginalRate)})
                  </p>

                  {breakdown(f, rates)}

                  <h3 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">
                    APIT by tax band (per {per})
                  </h3>
                  <div className="mt-1 overflow-x-auto">
                    <table className="w-full min-w-[20rem] text-left text-sm">
                      <caption className="sr-only">APIT calculated band by band, per {per}</caption>
                      <thead>
                        <tr className="border-b border-brand-100 text-slate-600 dark:border-brand-800 dark:text-slate-400">
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Band
                          </th>
                          <th scope="col" className="py-2 pr-3 text-right font-medium">
                            Rate
                          </th>
                          <th scope="col" className="py-2 pr-3 text-right font-medium">
                            Your pay in band
                          </th>
                          <th scope="col" className="py-2 text-right font-medium">
                            Tax
                          </th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {result.brackets.map((b) => (
                          <tr
                            key={b.from}
                            className={cn(
                              'border-b border-brand-100 last:border-0 dark:border-brand-800',
                              b.taxable === 0 && 'text-slate-500 dark:text-slate-500',
                            )}
                          >
                            <th scope="row" className="py-2 pr-3 font-normal">
                              {b.to === null
                                ? `Over ${formatLKR(b.from)}`
                                : b.rate === 0
                                  ? `Up to ${formatLKR(b.to)} (relief)`
                                  : `${formatLKR(b.from)} – ${formatLKR(b.to)}`}
                            </th>
                            <td className="py-2 pr-3 text-right">{formatPercent(b.rate)}</td>
                            <td className="py-2 pr-3 text-right">{formatLKR(b.taxable)}</td>
                            <td className="py-2 text-right">{formatLKR(b.tax)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <CopyButton
                    className="mt-5"
                    label="Copy summary"
                    text={() =>
                      formatSummary(
                        {
                          salary: parseAmount(state.salary),
                          allowances: parseAmount(state.allowances),
                          period: state.period,
                          allowancesInEpf: state.epfAllowances,
                        },
                        result,
                        rates,
                      )
                    }
                  />
                </div>
              );
            })()
          )}
        </Card>
      </div>
    </div>
  );
}

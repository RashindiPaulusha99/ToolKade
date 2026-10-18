import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { cn, resultFigureClass } from '@/components/ui/styles';
import { formatLKR, formatNumber } from '@/lib/format';
import {
  calculateBill,
  estimateUnits,
  formatSummary,
  validateBillInput,
  type ElectricityRates,
} from './logic';

interface Props {
  /** null while the official tariff is being verified. */
  rates: ElectricityRates | null;
}

type Mode = 'bill' | 'units';
type Provider = 'ceb' | 'leco';
type Category = 'domestic' | 'religious';

interface FormState {
  mode: Mode;
  provider: Provider;
  category: Category;
  prepaid: boolean;
  units: string;
  amount: string;
  days: string;
}

const initialState: FormState = {
  mode: 'bill',
  provider: 'ceb',
  category: 'domestic',
  prepaid: false,
  units: '',
  amount: '',
  days: '30',
};

function parseNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value.replace(/,/g, ''));
}

function readUrl(): Partial<FormState> {
  const s = new URLSearchParams(window.location.search);
  const state: Partial<FormState> = {};
  if (s.get('mode') === 'units') state.mode = 'units';
  if (s.get('p') === 'leco') state.provider = 'leco';
  if (s.get('c') === 'religious') state.category = 'religious';
  if (s.get('prepaid') === '1') state.prepaid = true;
  for (const [key, param] of [
    ['units', 'u'],
    ['amount', 'amt'],
    ['days', 'd'],
  ] as const) {
    const value = s.get(param);
    if (value && /^[\d.,]+$/.test(value)) state[key] = value;
  }
  return state;
}

function writeUrl(state: FormState) {
  const url = new URL(window.location.href);
  const set = (key: string, value: string | null) =>
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  set('mode', state.mode === 'units' ? 'units' : null);
  set('p', state.provider === 'leco' ? 'leco' : null);
  set('c', state.category === 'religious' ? 'religious' : null);
  set('prepaid', state.provider === 'leco' && state.prepaid ? '1' : null);
  set('u', state.mode === 'bill' ? state.units || null : null);
  set('amt', state.mode === 'units' ? state.amount || null : null);
  set('d', state.days !== '30' ? state.days || null : null);
  window.history.replaceState(null, '', url);
}

export default function ElectricityBillTool({ rates }: Props) {
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

  const prepaid = state.provider === 'leco' && state.prepaid;
  const tariffId = `${state.category}${prepaid ? '-prepaid' : ''}`;
  const tariff = rates?.tariffs[tariffId];
  const days = parseNumber(state.days);
  const units = parseNumber(state.units);
  const amount = parseNumber(state.amount);

  const billErrors = validateBillInput(state.mode === 'bill' ? units : 0, days);
  const amountError =
    state.mode === 'units' && state.amount.trim() && (!Number.isFinite(amount) || amount < 0)
      ? 'Enter the bill amount in rupees.'
      : undefined;
  const ready =
    rates &&
    tariff &&
    Object.keys(billErrors).length === 0 &&
    (state.mode === 'bill' ? state.units.trim() !== '' : state.amount.trim() !== '' && !amountError);

  const result =
    ready && state.mode === 'bill' ? calculateBill(units, tariff, days, rates.billingDays) : null;
  const estimate =
    ready && state.mode === 'units' ? estimateUnits(amount, tariff, days, rates.billingDays) : null;

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <Card>
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
          <Tabs
            label="Calculator mode"
            items={[
              { value: 'bill', label: 'Units → bill' },
              { value: 'units', label: 'Bill → units' },
            ]}
            value={state.mode}
            onChange={(mode) => set('mode', mode)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              id="provider"
              label="Provider"
              options={[
                { value: 'ceb', label: 'CEB' },
                { value: 'leco', label: 'LECO' },
              ]}
              value={state.provider}
              onChange={(e) => set('provider', e.target.value as Provider)}
            />
            <Select
              id="category"
              label="Tariff category"
              options={[
                { value: 'domestic', label: 'Domestic (home)' },
                { value: 'religious', label: 'Religious & charitable' },
              ]}
              value={state.category}
              onChange={(e) => set('category', e.target.value as Category)}
            />
          </div>

          {state.provider === 'leco' && (
            <Checkbox
              id="prepaid"
              label="Prepaid meter"
              helper="LECO's optional prepaid scheme has its own rates and no fixed charge."
              checked={state.prepaid}
              onChange={(e) => set('prepaid', e.target.checked)}
            />
          )}

          <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
            {state.mode === 'bill' ? (
              <Input
                id="units"
                label="Units used (kWh)"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 120"
                value={state.units}
                onChange={(e) => set('units', e.target.value)}
                error={state.units.trim() ? billErrors.units : undefined}
                helper="Current meter reading minus the previous reading."
              />
            ) : (
              <Input
                id="amount"
                label="Bill amount"
                prefix="Rs."
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 5,000"
                value={state.amount}
                onChange={(e) => set('amount', e.target.value)}
                error={amountError}
              />
            )}
            <Input
              id="days"
              label="Billing days"
              inputMode="numeric"
              autoComplete="off"
              value={state.days}
              onChange={(e) => set('days', e.target.value)}
              error={state.days.trim() ? billErrors.days : 'Enter the number of days.'}
            />
          </div>

          <Button variant="ghost" onClick={() => setState({ ...initialState, mode: state.mode })}>
            <RotateCcw className="size-5" aria-hidden="true" />
            Reset
          </Button>
        </form>
      </Card>

      <div className="mt-6 lg:sticky lg:top-24 lg:mt-0" aria-live="polite">
        <Card variant="result">
          {!rates || !tariff ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Rates are being updated</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                Your estimate will appear here once the verified tariff is added. Please check back soon.
              </p>
            </div>
          ) : result ? (
            <div>
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Estimated bill for {formatNumber(result.units)} units
              </h2>
              <p className={resultFigureClass}>{formatLKR(result.total)}</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {tariff.label} · {result.days} days
                {result.averagePerUnit !== null && ` · average ${formatLKR(result.averagePerUnit)} a unit`}
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-sm whitespace-nowrap tabular-nums">
                  <caption className="sr-only">Charge for each block of units</caption>
                  <thead>
                    <tr className="border-b border-brand-100 text-slate-600 dark:border-brand-800 dark:text-slate-400">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Block
                      </th>
                      <th scope="col" className="py-2 pr-3 text-right font-medium">
                        Units × rate
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Charge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lines.map((line) => (
                      <tr
                        key={line.from}
                        className={cn(
                          'border-b border-brand-100 dark:border-brand-800',
                          line.units === 0 && 'text-slate-500',
                        )}
                      >
                        <th scope="row" className="py-2 pr-3 font-normal">
                          {line.to === null
                            ? `Above ${formatNumber(line.from)}`
                            : // Whole-unit limits read like the tariff (61–90); prorated limits keep decimals.
                              `${formatNumber(line.from > 0 && Number.isInteger(line.from) ? line.from + 1 : line.from)}–${formatNumber(line.to)}`}
                        </th>
                        <td className="py-2 pr-3 text-right">
                          {formatNumber(line.units)} × {formatLKR(line.rate)}
                        </td>
                        <td className="py-2 text-right">{formatLKR(line.charge)}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-brand-100 dark:border-brand-800">
                      <th scope="row" className="py-2 pr-3 font-normal">
                        Fixed charge
                      </th>
                      <td />
                      <td className="py-2 text-right">{formatLKR(result.fixedCharge)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-slate-900 dark:text-white">
                      <th scope="row" className="py-2 pr-3">
                        Total
                      </th>
                      <td />
                      <td className="py-2 text-right">{formatLKR(result.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <CopyButton className="mt-5" label="Copy summary" text={() => formatSummary(tariff, result)} />
            </div>
          ) : estimate ? (
            <div>
              {estimate.belowMinimum ? (
                <p className="flex gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                  That is less than the minimum bill of {formatLKR(estimate.bill)} (the fixed charge with no
                  units).
                </p>
              ) : (
                <>
                  <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">Units used</h2>
                  <p className={resultFigureClass}>About {formatNumber(estimate.units, 0)} units</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {formatNumber(estimate.units, 0)} units cost {formatLKR(estimate.bill)} and{' '}
                    {formatNumber(estimate.units + 1, 0)} units cost {formatLKR(estimate.nextBill)} (
                    {tariff.label}, {days} days).
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{state.mode === 'bill' ? 'Your bill' : 'Your units'}</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                {state.mode === 'bill'
                  ? 'Enter the units you used to see your bill.'
                  : 'Enter a bill amount to estimate the units used.'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

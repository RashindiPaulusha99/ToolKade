import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { resultFigureClass } from '@/components/ui/styles';
import { formatLKR, formatPercent } from '@/lib/format';
import {
  calculateDuty,
  capacityUnitFor,
  cifInLkr,
  currencies,
  formatSummary,
  fuelTypes,
  vehicleTypes,
  type Currency,
  type FieldErrors,
  type FuelType,
  type VehicleDutyRates,
  type VehicleInput,
  type VehicleType,
} from './logic';

interface Props {
  /** null while the official rates are being verified. */
  rates: VehicleDutyRates | null;
}

interface FormState {
  vehicleType: VehicleType;
  fuelType: FuelType;
  capacity: string;
  year: string;
  cif: string;
  currency: Currency;
  fx: string;
}

const initialState: FormState = {
  vehicleType: 'car',
  fuelType: 'petrol',
  capacity: '',
  year: '',
  cif: '',
  currency: 'JPY',
  fx: '',
};

// Short query-string keys so a result can be shared as a link.
const params: Record<keyof FormState, string> = {
  vehicleType: 'type',
  fuelType: 'fuel',
  capacity: 'cap',
  year: 'year',
  cif: 'cif',
  currency: 'cur',
  fx: 'fx',
};

function parseNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value.replace(/,/g, ''));
}

function readUrl(): Partial<FormState> {
  const search = new URLSearchParams(window.location.search);
  const state: Partial<FormState> = {};
  const type = search.get(params.vehicleType);
  if (vehicleTypes.some((v) => v.value === type)) state.vehicleType = type as VehicleType;
  const fuel = search.get(params.fuelType);
  if (fuelTypes.some((f) => f.value === fuel)) state.fuelType = fuel as FuelType;
  const currency = search.get(params.currency);
  if (currencies.includes(currency as Currency)) state.currency = currency as Currency;
  for (const key of ['capacity', 'year', 'cif', 'fx'] as const) {
    const value = search.get(params[key]);
    if (value && /^[\d.,]+$/.test(value)) state[key] = value;
  }
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

export default function VehicleImportDutyTool({ rates }: Props) {
  const [state, setState] = useState<FormState>(initialState);
  // Becomes true after the shared-link values have been read, so the first render does not wipe the URL.
  const [loaded, setLoaded] = useState(false);
  const currentYear = new Date().getFullYear();

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

  const unit = capacityUnitFor(rates, state.vehicleType, state.fuelType);
  const input: VehicleInput = {
    vehicleType: state.vehicleType,
    fuelType: state.fuelType,
    capacity: parseNumber(state.capacity),
    yearOfManufacture: parseNumber(state.year),
    cifAmount: parseNumber(state.cif),
    currency: state.currency,
    exchangeRate: parseNumber(state.fx),
  };

  const required: Array<keyof FormState> = [
    'capacity',
    'year',
    'cif',
    ...(state.currency === 'LKR' ? [] : ['fx' as const]),
  ];
  const complete = required.every((key) => state[key].trim() !== '');

  const outcome = useMemo(
    () => (rates && complete ? calculateDuty(input, rates, currentYear) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `input` is derived from `state`
    [rates, complete, state, currentYear],
  );

  // Show a field's error only once the user has typed something into it.
  const fieldErrors: FieldErrors = outcome && !outcome.ok ? outcome.errors : {};
  const errorFor = (key: keyof FieldErrors, raw: string) => (raw.trim() ? fieldErrors[key] : undefined);

  const previewCif = cifInLkr(input);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <Card>
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              id="vehicle-type"
              label="Vehicle type"
              options={vehicleTypes}
              value={state.vehicleType}
              onChange={(e) => set('vehicleType', e.target.value as VehicleType)}
            />
            <Select
              id="fuel-type"
              label="Fuel type"
              options={fuelTypes}
              value={state.fuelType}
              onChange={(e) => set('fuelType', e.target.value as FuelType)}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="capacity"
              label={unit === 'kW' ? 'Motor power (kW)' : 'Engine capacity (cc)'}
              inputMode="decimal"
              autoComplete="off"
              placeholder={unit === 'kW' ? 'e.g. 80' : 'e.g. 1490'}
              value={state.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              error={errorFor('capacity', state.capacity)}
            />
            <Input
              id="year"
              label="Year of manufacture"
              inputMode="numeric"
              autoComplete="off"
              placeholder={`e.g. ${currentYear - 1}`}
              value={state.year}
              onChange={(e) => set('year', e.target.value)}
              error={errorFor('yearOfManufacture', state.year)}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
            <Select
              id="currency"
              label="Currency"
              options={currencies.map((c) => ({ value: c, label: c }))}
              value={state.currency}
              onChange={(e) => set('currency', e.target.value as Currency)}
            />
            <Input
              id="cif"
              label="CIF value"
              inputMode="decimal"
              autoComplete="off"
              placeholder={
                state.currency === 'JPY'
                  ? 'e.g. 2,500,000'
                  : state.currency === 'USD'
                    ? 'e.g. 18,000'
                    : 'e.g. 5,400,000'
              }
              value={state.cif}
              onChange={(e) => set('cif', e.target.value)}
              error={errorFor('cifAmount', state.cif)}
              helper="Vehicle price + insurance + freight to Sri Lanka."
            />
          </div>

          {state.currency !== 'LKR' && (
            <Input
              id="fx"
              label={`Exchange rate (LKR for 1 ${state.currency})`}
              inputMode="decimal"
              autoComplete="off"
              value={state.fx}
              onChange={(e) => set('fx', e.target.value)}
              error={errorFor('exchangeRate', state.fx)}
              helper={
                <>
                  Use today&apos;s selling rate from the{' '}
                  <a
                    href="https://www.cbsl.gov.lk/en/rates-and-indicators/exchange-rates"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 underline dark:text-brand-300"
                  >
                    Central Bank of Sri Lanka
                  </a>
                  .
                </>
              }
            />
          )}

          <Button variant="ghost" onClick={() => setState(initialState)}>
            <RotateCcw className="size-5" aria-hidden="true" />
            Reset
          </Button>
        </form>
      </Card>

      <div className="mt-6 lg:sticky lg:top-24 lg:mt-0" aria-live="polite">
        <Card variant="result">
          {!rates ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Rates are being updated</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                Your estimate will appear here once the verified rates are added. Please check back soon.
              </p>
              {Number.isFinite(previewCif) && previewCif > 0 && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Your CIF value in rupees: <strong>{formatLKR(previewCif)}</strong>
                </p>
              )}
            </div>
          ) : !outcome ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Your estimate</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                Fill in the engine size, year of manufacture and CIF value to see the duty breakdown.
              </p>
            </div>
          ) : !outcome.ok ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Check your details</h2>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                {outcome.message ?? 'Some of the details above need fixing before we can estimate the duty.'}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total duties and taxes
              </h2>
              <p className={resultFigureClass}>{formatLKR(outcome.result.totalTax)}</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-600 dark:text-slate-400">Estimated landed cost</dt>
                  <dd className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatLKR(outcome.result.landedCost)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600 dark:text-slate-400">Taxes as % of CIF</dt>
                  <dd className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatPercent(outcome.result.effectiveRate)}
                  </dd>
                </div>
              </dl>

              {outcome.result.warnings.map((warning) => (
                <p
                  key={warning}
                  className="mt-4 flex gap-2 rounded-control bg-warning/10 p-3 text-sm text-slate-800 dark:text-slate-200"
                >
                  <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                  {warning}
                </p>
              ))}

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <caption className="sr-only">Breakdown of import duties and taxes</caption>
                  <thead>
                    <tr className="border-b border-brand-100 text-slate-600 dark:border-brand-800 dark:text-slate-400">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Component
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-brand-100 dark:border-brand-800">
                      <th scope="row" className="py-2 pr-3 font-normal">
                        CIF value
                      </th>
                      <td className="py-2 text-right tabular-nums">{formatLKR(outcome.result.cifLkr)}</td>
                    </tr>
                    {outcome.result.lines.map((line) => (
                      <tr key={line.id} className="border-b border-brand-100 dark:border-brand-800">
                        <th scope="row" className="py-2 pr-3 font-normal">
                          <span className="block font-medium text-slate-900 dark:text-white">
                            {line.label}
                          </span>
                          <span className="block text-xs text-slate-600 dark:text-slate-400">
                            {line.detail}
                          </span>
                        </th>
                        <td className="py-2 text-right align-top tabular-nums">{formatLKR(line.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-slate-900 dark:text-white">
                      <th scope="row" className="py-2 pr-3">
                        Landed cost
                      </th>
                      <td className="py-2 text-right tabular-nums">{formatLKR(outcome.result.landedCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <CopyButton
                className="mt-5"
                label="Copy summary"
                text={() => formatSummary(input, outcome.result)}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { formatLKR } from '@/lib/format';
import type { YearSummary } from './logic';

/*
 * Stacked columns: principal (series 1) and interest (series 2) paid in each year.
 * Specs from the dataviz guide: columns ≤ 24px, 4px rounded data-end and square baseline,
 * 2px surface gap between stacked segments, hairline recessive grid, legend for 2 series,
 * tooltip on hover/focus; the amortisation table is the table view.
 */

const WIDTH = 640;
const HEIGHT = 260;
// Text sizes are in viewBox units: the SVG scales with its container (~10px on phones, ~15px on desktop).
const FONT = 20;
const PAD = { top: 14, right: 8, bottom: 36, left: 96 };
const GAP = 2;
const RADIUS = 4;

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function niceStep(max: number, targetTicks = 4): number {
  const raw = max / targetTicks;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw);
  return step ?? 10 * power;
}

/** Column path with rounded top corners and a square bottom. */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function YearlyChart({ yearly }: { yearly: YearSummary[] }) {
  const [active, setActive] = useState<number | null>(null);
  if (yearly.length === 0) return null;

  const totals = yearly.map((y) => y.principal + y.interest);
  const step = niceStep(Math.max(...totals));
  const yMax = Math.ceil(Math.max(...totals) / step) * step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / yearly.length;
  const barW = Math.min(24, band * 0.6);
  const y = (value: number) => PAD.top + plotH - (value / yMax) * plotH;
  const labelEvery = Math.ceil(yearly.length / 12);
  const activeYear = active === null ? null : yearly[active];

  return (
    <figure className="mt-6">
      <figcaption className="text-sm font-semibold text-slate-900 dark:text-white">
        What you pay each year
      </figcaption>
      <ul
        className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300"
        aria-label="Legend"
      >
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-chart-1 dark:bg-brand-400" aria-hidden="true" />
          Principal
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-chart-2" aria-hidden="true" />
          Interest
        </li>
      </ul>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Principal and interest paid in each of ${yearly.length} years. Full figures are in the repayment schedule below.`}
          onMouseLeave={() => setActive(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(t)}
                y2={y(t)}
                strokeWidth={1}
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <text
                x={PAD.left - 8}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={FONT}
                className="fill-slate-500 tabular-nums dark:fill-slate-400"
              >
                {t === 0 ? '0' : `Rs. ${compact.format(t)}`}
              </text>
            </g>
          ))}

          {yearly.map((year, i) => {
            const x = PAD.left + band * i + (band - barW) / 2;
            const principalTop = y(year.principal);
            const totalTop = y(year.principal + year.interest);
            const principalH = Math.max(0, y(0) - principalTop);
            // Interest sits on top, separated from principal by a 2px surface gap.
            const interestH = Math.max(0, principalTop - totalTop - GAP);
            const interestOnTop = interestH > 0;
            return (
              <g key={year.year}>
                {active === i && (
                  <rect
                    x={PAD.left + band * i}
                    y={PAD.top}
                    width={band}
                    height={plotH}
                    className="fill-slate-100 dark:fill-slate-800/60"
                  />
                )}
                {principalH > 0 && (
                  <path
                    d={
                      interestOnTop
                        ? `M${x},${principalTop}h${barW}v${principalH}h${-barW}Z`
                        : topRoundedRect(x, principalTop, barW, principalH, RADIUS)
                    }
                    className="fill-chart-1 dark:fill-brand-400"
                  />
                )}
                {interestOnTop && (
                  <path d={topRoundedRect(x, totalTop, barW, interestH, RADIUS)} className="fill-chart-2" />
                )}
                {(i % labelEvery === 0 || i === yearly.length - 1) && (
                  <text
                    x={PAD.left + band * i + band / 2}
                    y={HEIGHT - 10}
                    textAnchor="middle"
                    fontSize={FONT}
                    className="fill-slate-500 dark:fill-slate-400"
                  >
                    Y{year.year}
                  </text>
                )}
                {/* Hit target: the whole column band, larger than the mark. */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`Year ${year.year}: principal ${formatLKR(year.principal)}, interest ${formatLKR(year.interest)}`}
                  className="cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-500"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(i)}
                />
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(0)}
            y2={y(0)}
            strokeWidth={1}
            className="stroke-slate-300 dark:stroke-slate-700"
          />
        </svg>

        {activeYear && active !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-10 w-max max-w-[14rem] -translate-x-1/2 rounded-control border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
            // Dynamic position (allowed by AGENTS.md: inline style only for dynamic values).
            style={{
              left: `${Math.min(85, Math.max(15, ((PAD.left + band * (active + 0.5)) / WIDTH) * 100))}%`,
            }}
          >
            <p className="font-semibold text-slate-900 dark:text-white">Year {activeYear.year}</p>
            <p className="mt-1 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="size-2.5 rounded-sm bg-chart-1 dark:bg-brand-400" aria-hidden="true" />
              Principal {formatLKR(activeYear.principal)}
            </p>
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="size-2.5 rounded-sm bg-chart-2" aria-hidden="true" />
              Interest {formatLKR(activeYear.interest)}
            </p>
          </div>
        )}
      </div>
    </figure>
  );
}

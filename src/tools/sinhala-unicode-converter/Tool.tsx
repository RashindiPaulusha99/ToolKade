import { ArrowLeftRight, Info, TriangleAlert, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/components/ui/styles';
import { containsSinhalaUnicode, convert, type Direction } from './logic';

const directions: Array<{ value: Direction; label: string }> = [
  { value: 'unicode-to-fm', label: 'Unicode → FM Abhaya' },
  { value: 'fm-to-unicode', label: 'FM Abhaya → Unicode' },
];

const FM_FONT_NAMES = ['FM Abhaya', 'FMAbhaya', 'FM-Abhaya'];

/** True if one of the FM Abhaya font names is installed (it renders this text at a different width). */
function detectFmAbhaya(): boolean {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return false;
  const sample = 'wdhqfndajka ,xld';
  ctx.font = '32px monospace';
  const fallback = ctx.measureText(sample).width;
  return FM_FONT_NAMES.some((name) => {
    ctx.font = `32px "${name}", monospace`;
    return ctx.measureText(sample).width !== fallback;
  });
}

export default function SinhalaUnicodeConverterTool() {
  const [direction, setDirection] = useState<Direction>('unicode-to-fm');
  const [input, setInput] = useState('');
  const [hasFmFont, setHasFmFont] = useState<boolean | null>(null);
  // Keeps typing responsive when a very long document is pasted.
  const deferredInput = useDeferredValue(input);
  const result = convert(deferredInput, direction);

  useEffect(() => {
    // Font availability is only known in the browser, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasFmFont(detectFmAbhaya());
  }, []);

  const toFm = direction === 'unicode-to-fm';
  const fmClass = 'font-fm-abhaya';
  const sinhalaClass = 'leading-8';
  const looksWrong =
    input.trim() !== '' && (toFm ? !containsSinhalaUnicode(input) : containsSinhalaUnicode(input));

  function swap() {
    setInput(result.text);
    setDirection(toFm ? 'fm-to-unicode' : 'unicode-to-fm');
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Tabs label="Conversion direction" items={directions} value={direction} onChange={setDirection} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={swap} disabled={!result.text}>
            <ArrowLeftRight className="size-5" aria-hidden="true" />
            Swap
          </Button>
          <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
            <X className="size-5" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      {looksWrong && (
        <p className="mt-4 flex gap-2 rounded-control bg-warning/10 p-3 text-sm text-slate-800 dark:text-slate-200">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <span>
            {toFm
              ? 'This does not look like Sinhala Unicode text.'
              : 'This text already contains Sinhala Unicode characters.'}{' '}
            <button
              type="button"
              className="font-medium text-brand-700 underline dark:text-brand-300"
              onClick={() => setDirection(toFm ? 'fm-to-unicode' : 'unicode-to-fm')}
            >
              Switch to {toFm ? 'FM Abhaya → Unicode' : 'Unicode → FM Abhaya'}
            </button>
          </span>
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Textarea
          id="converter-input"
          label={toFm ? 'Sinhala Unicode text' : 'FM Abhaya text'}
          lang={toFm ? 'si' : undefined}
          spellCheck={false}
          placeholder={toFm ? 'මෙහි සිංහල යුනිකෝඩ් අකුරු ලියන්න...' : 'Paste FM Abhaya text here...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={toFm ? sinhalaClass : cn(hasFmFont && fmClass)}
        />
        <div aria-live="polite">
          <Textarea
            id="converter-output"
            label={toFm ? 'FM Abhaya text' : 'Sinhala Unicode text'}
            lang={toFm ? undefined : 'si'}
            readOnly
            spellCheck={false}
            value={result.text}
            className={cn('bg-slate-50 dark:bg-slate-950', toFm ? hasFmFont && fmClass : sinhalaClass)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {toFm && hasFmFont === false && (
            <p className="flex gap-2">
              <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                FM Abhaya is not installed on this device, so the result shows as Latin letters. It will look
                right once you paste it into a document and set the font to FM Abhaya.
              </span>
            </p>
          )}
          {result.unsupported.length > 0 && (
            <p className="flex gap-2 text-slate-800 dark:text-slate-200">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
              <span>
                FM Abhaya cannot show these characters as themselves; they will appear as Sinhala letters:{' '}
                <span className="font-mono">{result.unsupported.slice(0, 20).join(' ')}</span>
              </span>
            </p>
          )}
        </div>
        <CopyButton text={result.text} disabled={!result.text} className="shrink-0" />
      </div>
    </Card>
  );
}

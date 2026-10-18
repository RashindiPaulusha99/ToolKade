import { Download, Loader2, ShieldCheck, Trash2, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FileDrop } from '@/components/ui/FileDrop';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn, iconButtonVariants, labelClass } from '@/components/ui/styles';
import { formatBytes, formatPercent } from '@/lib/format';
import {
  ACCEPT_ATTRIBUTE,
  checkFiles,
  defaultSettings,
  isAcceptedType,
  outputFormats,
  outputName,
  outputType,
  parseMaxWidth,
  savings,
  totals,
  uniqueNames,
  type CompressSettings,
  type InputMime,
  type OutputFormat,
} from './logic';

interface Result {
  blob: Blob;
  url: string;
  name: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  /** True when re-encoding made the file bigger, so the original is offered instead. */
  keptOriginal: boolean;
}

interface Item {
  id: number;
  file: File;
  /** Bumped whenever settings change; results from an older generation are discarded. */
  gen: number;
  status: 'queued' | 'working' | 'done' | 'error';
  result?: Result;
  error?: string;
}

let nextItemId = 1;

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ImageCompressorTool() {
  const [items, setItemsState] = useState<Item[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const [settings, setSettingsState] = useState<CompressSettings>(defaultSettings);
  const settingsRef = useRef(settings);
  const [maxWidthText, setMaxWidthText] = useState('');
  const [rejected, setRejected] = useState<Array<{ name: string; reason: string }>>([]);
  const [zipping, setZipping] = useState(false);
  const busy = useRef(false);
  const requeueTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const setItems = (update: (list: Item[]) => Item[]) => {
    itemsRef.current = update(itemsRef.current);
    setItemsState(itemsRef.current);
  };

  // Release every object URL when the tool unmounts.
  useEffect(
    () => () => {
      for (const item of itemsRef.current) if (item.result) URL.revokeObjectURL(item.result.url);
    },
    [],
  );

  /** Processes queued images one at a time (keeps memory use low on phones). */
  async function pump() {
    if (busy.current) return;
    busy.current = true;
    try {
      // The encoder is loaded only once the first image needs it.
      const { encodeImage } = await import('./encode');
      for (;;) {
        const next = itemsRef.current.find((i) => i.status === 'queued');
        if (!next) break;
        const { gen, id, file } = next;
        const current = settingsRef.current;
        const type = outputType(file.type as InputMime, current.format);
        setItems((list) => list.map((i) => (i.id === id ? { ...i, status: 'working' } : i)));
        try {
          const output = await encodeImage({
            file,
            type,
            quality: current.quality,
            maxWidth: current.maxWidth,
          });
          const stillCurrent = itemsRef.current.some((i) => i.id === id && i.gen === gen);
          if (!stillCurrent) continue;
          // Some browsers cannot encode every format (e.g. WebP) and fall back to PNG; name by the real type.
          const actualType = isAcceptedType(output.blob.type) ? output.blob.type : type;
          const keepOriginal =
            output.blob.size >= file.size && actualType === file.type && output.width === output.sourceWidth;
          const blob = keepOriginal ? file : output.blob;
          const result: Result = {
            blob,
            url: URL.createObjectURL(blob),
            name: keepOriginal ? file.name : outputName(file.name, actualType),
            width: output.width,
            height: output.height,
            sourceWidth: output.sourceWidth,
            sourceHeight: output.sourceHeight,
            keptOriginal: keepOriginal,
          };
          setItems((list) =>
            list.map((i) => {
              if (i.id !== id) return i;
              if (i.result) URL.revokeObjectURL(i.result.url);
              return { ...i, status: 'done', result, error: undefined };
            }),
          );
        } catch (error) {
          if (!itemsRef.current.some((i) => i.id === id && i.gen === gen)) continue;
          const message = error instanceof Error ? error.message : 'Could not process this image.';
          setItems((list) => list.map((i) => (i.id === id ? { ...i, status: 'error', error: message } : i)));
        }
      }
    } finally {
      busy.current = false;
    }
  }

  function addFiles(files: File[]) {
    const { accepted, rejected: refused } = checkFiles(files, itemsRef.current.length);
    setRejected(refused);
    if (accepted.length === 0) return;
    setItems((list) => [
      ...list,
      ...accepted.map((file) => ({ id: nextItemId++, file, gen: 0, status: 'queued' as const })),
    ]);
    void pump();
  }

  function updateSettings(patch: Partial<CompressSettings>) {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettingsState(next);
    // Re-compress everything with the new settings, after a short pause so dragging the slider is smooth.
    clearTimeout(requeueTimer.current);
    requeueTimer.current = setTimeout(() => {
      setItems((list) => list.map((i) => ({ ...i, gen: i.gen + 1, status: 'queued' })));
      void pump();
    }, 350);
  }

  function remove(id: number) {
    setItems((list) => {
      const item = list.find((i) => i.id === id);
      if (item?.result) URL.revokeObjectURL(item.result.url);
      return list.filter((i) => i.id !== id);
    });
  }

  function clearAll() {
    setItems((list) => {
      for (const item of list) if (item.result) URL.revokeObjectURL(item.result.url);
      return [];
    });
    setRejected([]);
  }

  async function downloadZip() {
    const done = itemsRef.current.filter((i) => i.status === 'done' && i.result);
    if (done.length === 0) return;
    setZipping(true);
    try {
      const { zipSync } = await import('fflate');
      const names = uniqueNames(done.map((i) => i.result!.name));
      const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
      for (const [index, item] of done.entries()) {
        // Images are already compressed, so store them without re-compressing (level 0) for speed.
        entries[names[index]] = [new Uint8Array(await item.result!.blob.arrayBuffer()), { level: 0 }];
      }
      const zipped = zipSync(entries);
      downloadBlob(
        new Blob([zipped as Uint8Array<ArrayBuffer>], { type: 'application/zip' }),
        'compressed-images.zip',
      );
    } finally {
      setZipping(false);
    }
  }

  const finished = items.filter((i) => i.status === 'done' && i.result);
  const summary = totals(
    finished.map((i) => ({ originalBytes: i.file.size, newBytes: i.result!.blob.size })),
  );
  const working = items.some((i) => i.status === 'queued' || i.status === 'working');
  const maxWidthState = parseMaxWidth(maxWidthText);
  const pngOnly = settings.format === 'image/png';

  return (
    <div className="space-y-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <FileDrop
          accept={ACCEPT_ATTRIBUTE}
          multiple
          label="Choose images or drop them here"
          hint="JPG, PNG or WebP · up to 50 images, 30 MB each"
          onFiles={addFiles}
        />

        <Card className="mt-6 space-y-5 lg:mt-0">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="quality" className={labelClass}>
                Quality
              </label>
              <span className="text-sm font-semibold text-slate-900 tabular-nums dark:text-white">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              id="quality"
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round(settings.quality * 100)}
              onChange={(e) => updateSettings({ quality: Number(e.target.value) / 100 })}
              disabled={pngOnly}
              aria-describedby="quality-help"
              className="h-11 w-full cursor-pointer accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p id="quality-help" className="text-sm text-slate-500 dark:text-slate-400">
              {pngOnly
                ? 'PNG is lossless, so quality does not apply. Resize to make PNGs smaller.'
                : 'Lower quality makes smaller files. 70–80% usually looks the same as the original.'}
            </p>
          </div>

          <Input
            id="max-width"
            label="Maximum width (optional)"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 1920"
            value={maxWidthText}
            onChange={(e) => {
              setMaxWidthText(e.target.value);
              const parsed = parseMaxWidth(e.target.value);
              if (parsed !== 'invalid' && parsed !== settingsRef.current.maxWidth)
                updateSettings({ maxWidth: parsed });
            }}
            error={
              maxWidthState === 'invalid' ? 'Enter a whole number of pixels from 16 to 12,000.' : undefined
            }
            helper="Larger images are scaled down to this width. Smaller ones are not enlarged."
          />

          <Select
            id="format"
            label="Output format"
            options={outputFormats}
            value={settings.format}
            onChange={(e) => updateSettings({ format: e.target.value as OutputFormat })}
          />
        </Card>
      </div>

      {rejected.length > 0 && (
        <div className="flex gap-2 rounded-card border border-warning/40 bg-warning/10 p-4 text-sm text-slate-800 dark:text-slate-200">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <ul className="space-y-1">
            {rejected.map((r) => (
              <li key={r.name}>
                <span className="font-medium">{r.name}</span>: {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <Card>
          <div
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            aria-live="polite"
          >
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {working
                ? `Compressing… ${finished.length} of ${items.length} done`
                : finished.length > 0
                  ? `${finished.length} image${finished.length === 1 ? '' : 's'}: ${formatBytes(summary.original)} → ${formatBytes(summary.compressed)} (${summary.saved >= 0 ? `${formatPercent(summary.saved, 0)} smaller` : `${formatPercent(-summary.saved, 0)} larger`})`
                  : 'No images could be compressed.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadZip} disabled={working || finished.length === 0 || zipping}>
                {zipping ? (
                  <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Download className="size-5" aria-hidden="true" />
                )}
                Download all (ZIP)
              </Button>
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="size-5" aria-hidden="true" />
                Clear all
              </Button>
            </div>
          </div>

          <ul className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => {
              const r = item.result;
              const saved = r ? savings(item.file.size, r.blob.size) : 0;
              return (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-slate-100 dark:bg-slate-800">
                    {r ? (
                      <img src={r.url} alt="" width={56} height={56} className="size-14 object-cover" />
                    ) : item.status === 'error' ? (
                      <TriangleAlert className="size-6 text-warning" aria-hidden="true" />
                    ) : (
                      <Loader2
                        className="size-6 animate-spin text-slate-400 motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-slate-900 dark:text-white"
                      title={item.file.name}
                    >
                      {item.file.name}
                    </p>
                    <p className="text-sm text-slate-600 tabular-nums dark:text-slate-400">
                      {item.status === 'error'
                        ? item.error
                        : r
                          ? `${formatBytes(item.file.size)} → ${formatBytes(r.blob.size)} · ${r.width}×${r.height}${r.width !== r.sourceWidth ? ` (was ${r.sourceWidth}×${r.sourceHeight})` : ''}`
                          : `${formatBytes(item.file.size)} · compressing…`}
                    </p>
                    {r?.keptOriginal && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Already well optimised, so the original file is kept unchanged (including its photo
                        data).
                      </p>
                    )}
                  </div>
                  {r && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
                        saved > 0
                          ? 'bg-success/10 text-brand-700 dark:text-brand-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {saved > 0 ? `−${formatPercent(saved, 0)}` : '0%'}
                    </span>
                  )}
                  {r && (
                    <a
                      href={r.url}
                      download={r.name}
                      className={iconButtonVariants.secondary}
                      aria-label={`Download ${r.name}`}
                    >
                      <Download className="size-5" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className={iconButtonVariants.ghost}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-300"
          aria-hidden="true"
        />
        Your images are processed on your device and never uploaded. Compressing also removes hidden photo
        data such as camera details and GPS location.
      </p>
    </div>
  );
}

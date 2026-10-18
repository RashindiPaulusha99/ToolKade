/*
 * Image compressor: pure helpers (no DOM). The browser encoding lives in encode.ts / encode.worker.ts.
 */

export type InputMime = 'image/jpeg' | 'image/png' | 'image/webp';
export type OutputFormat = 'original' | 'image/jpeg' | 'image/webp' | 'image/png';

export const ACCEPTED_TYPES: InputMime[] = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',');
export const MAX_FILES = 50;
export const MAX_FILE_BYTES = 30 * 1024 * 1024;
/** Largest edge we will decode, to keep memory use safe on phones. */
export const MAX_DIMENSION = 12_000;

export const outputFormats: Array<{ value: OutputFormat; label: string }> = [
  { value: 'original', label: 'Same as original' },
  { value: 'image/jpeg', label: 'JPG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/png', label: 'PNG (lossless)' },
];

const EXTENSIONS: Record<InputMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface CompressSettings {
  /** 0.1–1. Ignored for PNG, which is lossless. */
  quality: number;
  /** Resize so the width is at most this many pixels; null = keep the size. */
  maxWidth: number | null;
  format: OutputFormat;
}

export const defaultSettings: CompressSettings = { quality: 0.8, maxWidth: null, format: 'original' };

export function isAcceptedType(type: string): type is InputMime {
  return (ACCEPTED_TYPES as string[]).includes(type);
}

export interface FileCheck {
  name: string;
  type: string;
  size: number;
}

/** Splits picked files into ones we can compress and readable reasons for the rest. */
export function checkFiles<T extends FileCheck>(
  files: T[],
  alreadyQueued: number,
): { accepted: T[]; rejected: Array<{ name: string; reason: string }> } {
  const accepted: T[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];
  for (const file of files) {
    if (!isAcceptedType(file.type)) {
      rejected.push({ name: file.name, reason: 'Only JPG, PNG and WebP images are supported.' });
    } else if (file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'Files over 30 MB are not supported.' });
    } else if (alreadyQueued + accepted.length >= MAX_FILES) {
      rejected.push({ name: file.name, reason: `You can compress up to ${MAX_FILES} images at a time.` });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}

/** Output mime type for an input file. */
export function outputType(inputType: InputMime, format: OutputFormat): InputMime {
  return format === 'original' ? inputType : format;
}

/** Target size: never upscale, keep the aspect ratio, round to whole pixels (minimum 1). */
export function targetSize(
  width: number,
  height: number,
  maxWidth: number | null,
): { width: number; height: number } {
  if (!maxWidth || width <= maxWidth) return { width, height };
  const scale = maxWidth / width;
  return { width: Math.round(maxWidth), height: Math.max(1, Math.round(height * scale)) };
}

/** Fraction saved (0.42 = 42% smaller). Negative when the result is bigger. */
export function savings(originalBytes: number, newBytes: number): number {
  if (originalBytes <= 0) return 0;
  return (originalBytes - newBytes) / originalBytes;
}

/** "holiday photo.JPG" + image/webp → "holiday photo-compressed.webp". */
export function outputName(originalName: string, type: InputMime): string {
  const dot = originalName.lastIndexOf('.');
  const base = (dot > 0 ? originalName.slice(0, dot) : originalName).trim() || 'image';
  const safe = base.replace(/[\\/:*?"<>|]+/g, '-');
  return `${safe}-compressed.${EXTENSIONS[type]}`;
}

/** Makes names unique for a ZIP: "a.jpg", "a.jpg" → "a.jpg", "a (2).jpg". */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 1) return name;
    const dot = name.lastIndexOf('.');
    const candidate = dot > 0 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
    seen.set(candidate.toLowerCase(), 1);
    return candidate;
  });
}

/** Totals for the summary line. */
export function totals(items: Array<{ originalBytes: number; newBytes: number }>) {
  const original = items.reduce((sum, i) => sum + i.originalBytes, 0);
  const compressed = items.reduce((sum, i) => sum + i.newBytes, 0);
  return { original, compressed, saved: savings(original, compressed) };
}

export function parseMaxWidth(value: string): number | null | 'invalid' {
  if (value.trim() === '') return null;
  const n = Number(value.replace(/,/g, ''));
  if (!Number.isInteger(n) || n < 16 || n > MAX_DIMENSION) return 'invalid';
  return n;
}

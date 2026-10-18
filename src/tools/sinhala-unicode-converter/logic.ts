import fmAbhaya from './fm-abhaya.json';
import {
  consonants,
  kombuvaSigns,
  ligatures,
  modifiers,
  punctuation,
  rakaransaya,
  repaya,
  vowels,
  vowelSigns,
  yansaya,
} from './unicode-to-fm';

/*
 * Sinhala Unicode ↔ FM Abhaya conversion. Pure functions; mapping data lives in fm-abhaya.json
 * (FM → Unicode, MIT, see THIRD_PARTY_NOTICES.md) and unicode-to-fm.ts (Unicode → FM).
 */

export type Direction = 'unicode-to-fm' | 'fm-to-unicode';

const HAL = '්';
const ZWJ = '‍';
const ZWNJ = '‌';

interface FmMapping {
  rules: Record<string, string>;
  singles: Record<string, string>;
  combos: Record<string, string>;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Alternation that tries longer keys first (as the Pandukabhaya converter does). */
function alternation(keys: string[]): RegExp {
  return new RegExp(
    [...keys]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join('|'),
    'g',
  );
}

const mapping = (fmAbhaya as { mappings: FmMapping }).mappings;
const letters: Record<string, string> = { ...mapping.singles, ...mapping.combos };
let rulesPattern: RegExp | undefined;
let lettersPattern: RegExp | undefined;

/**
 * Vowel signs (U+0DCF–U+0DDF, U+0DF2–U+0DF3) decoded before a yansaya/rakaransaya. The mapping has
 * no combo for some kombuva + conjunct forms (e.g. "fK%" → ණ ෙ ්‍ර), but a vowel sign can never come
 * before ්‍ය/්‍ර in Unicode, so ToolKade moves it after them.
 */
const SIGN_BEFORE_CONJUNCT = /([ා-ෟෲෳ]+)(්‍[යර])/g;

/** FM Abhaya text (as typed in the legacy font) → Sinhala Unicode. */
export function fmToUnicode(text: string): string {
  rulesPattern ??= alternation(Object.keys(mapping.rules));
  lettersPattern ??= alternation(Object.keys(letters));
  return text
    .replace(rulesPattern, (m) => mapping.rules[m])
    .replace(lettersPattern, (m) => letters[m])
    .replace(SIGN_BEFORE_CONJUNCT, '$2$1')
    .normalize('NFC');
}

/** Characters that FM Abhaya draws as Sinhala glyphs, so they cannot be carried over as themselves. */
const fmGlyphKeys = new Set(Object.keys(mapping.singles).filter((k) => mapping.singles[k] !== k));

export interface UnicodeToFmResult {
  text: string;
  /** Characters copied through unchanged that FM Abhaya will display as Sinhala glyphs (e.g. English letters). */
  unsupported: string[];
}

/** Sinhala Unicode → FM Abhaya. */
export function unicodeToFm(input: string): UnicodeToFmResult {
  const chars = [...input.normalize('NFC')];
  const unsupported = new Set<string>();
  let out = '';
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];
    const consonant = consonants[ch];

    if (consonant !== undefined) {
      // Repaya: ර් (+ ZWJ) before another consonant is written as a mark, except ර්‍ය (ර with yansaya).
      if (ch === 'ර' && chars[i + 1] === HAL) {
        let j = i + 2;
        const joined = chars[j] === ZWJ;
        if (joined) j++;
        if (consonants[chars[j]] !== undefined && !(joined && chars[j] === 'ය')) {
          out += repaya;
          i = j;
          continue;
        }
      }

      // Yansaya (්‍ය) and rakaransaya (්‍ර) marks.
      let j = i + 1;
      let marks = '';
      while (chars[j] === HAL && chars[j + 1] === ZWJ && (chars[j + 2] === 'ය' || chars[j + 2] === 'ර')) {
        marks += chars[j + 2] === 'ය' ? yansaya : rakaransaya;
        j += 3;
      }

      const sign = chars[j];
      const kombuva = kombuvaSigns[sign];
      const ligature = ligatures[ch]?.[sign];

      if (kombuva) {
        const halLigature = ligatures[ch]?.[HAL];
        // e.g. වේ → "fõ", but only where the FM mapping knows the f + hal-glyph combination.
        out +=
          sign === 'ේ' && !marks && halLigature && letters[`f${halLigature}`] !== undefined
            ? `f${halLigature}`
            : `${kombuva.before}${consonant}${marks}${kombuva.after}`;
        j++;
      } else if (sign === HAL) {
        out += !marks && ligature ? ligature : `${consonant}${marks}${vowelSigns[HAL]}`;
        j++;
        if (chars[j] === ZWJ) j++; // touching conjuncts (e.g. ක්‍ෂ) are written as hal + consonant
      } else if (vowelSigns[sign] !== undefined) {
        const iSign = sign === 'ි' || sign === 'ී';
        out +=
          ligature && (!marks || iSign) ? `${ligature}${marks}` : `${consonant}${marks}${vowelSigns[sign]}`;
        j++;
      } else {
        out += `${consonant}${marks}`;
      }
      i = j;
      continue;
    }

    const mapped = vowels[ch] ?? modifiers[ch] ?? vowelSigns[ch] ?? punctuation[ch];
    if (mapped !== undefined) {
      out += mapped;
    } else if (kombuvaSigns[ch]) {
      out += kombuvaSigns[ch].before + kombuvaSigns[ch].after;
    } else if (ch !== ZWJ && ch !== ZWNJ) {
      if (fmGlyphKeys.has(ch)) unsupported.add(ch);
      out += ch;
    }
    i++;
  }

  return { text: out, unsupported: [...unsupported] };
}

/** Converts in the given direction. */
export function convert(text: string, direction: Direction): UnicodeToFmResult {
  return direction === 'unicode-to-fm' ? unicodeToFm(text) : { text: fmToUnicode(text), unsupported: [] };
}

/** True if the text contains Sinhala Unicode characters (used to suggest the right direction). */
export function containsSinhalaUnicode(text: string): boolean {
  return /[඀-෿]/.test(text);
}

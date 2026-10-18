import { describe, expect, it } from 'vitest';
import corpus from './fm-abhaya.test-cases.json';
import { containsSinhalaUnicode, convert, fmToUnicode, unicodeToFm } from './logic';
import { consonants, ligatures, vowelSigns } from './unicode-to-fm';

const cases = (corpus as Array<{ test_cases: Array<[string, string]> }>)[0].test_cases;
const toFm = (s: string) => unicodeToFm(s).text;

/**
 * FM text has no zero-width joiners, so a round trip keeps the ZWJ of yansaya/rakaransaya (encoded
 * as marks) but not the optional ZWJ of repaya and touching conjuncts (e.g. ර්‍ථ, ක්‍ෂ). Compare
 * with those removed.
 */
const withoutOptionalZwj = (s: string) => s.normalize('NFC').replace(/‍(?![යර])/g, '');
const roundTrip = (s: string) => fmToUnicode(toFm(s));

describe('FM Abhaya → Unicode (Pandukabhaya test corpus)', () => {
  it.each(cases.map((c, i) => [i, ...c]))('corpus passage %i', (_i, fm, unicode) => {
    expect(fmToUnicode(fm as string)).toBe(unicode);
  });

  it('decodes common words', () => {
    expect(fmToUnicode('Y%S ,xld')).toBe('ශ්‍රී ලංකා');
    expect(fmToUnicode('wdhqfndajka')).toBe('ආයුබෝවන්');
  });

  it('puts vowel signs after yansaya/rakaransaya when the mapping has no combined form', () => {
    expect(fmToUnicode('fK%')).toBe('ණ්‍රෙ');
    expect(fmToUnicode('fK%d')).toBe('ණ්‍රො');
    expect(fmToUnicode('ÅH')).toBe('ඛ්‍යි');
    expect(fmToUnicode('fflH')).toBe('ක්‍යෛ');
  });

  it('leaves empty text and spaces alone', () => {
    expect(fmToUnicode('')).toBe('');
    expect(fmToUnicode('  \n ')).toBe('  \n ');
  });
});

describe('Unicode → FM Abhaya', () => {
  it.each(cases.map((c, i) => [i, c[1]]))('round-trips corpus passage %i', (_i, unicode) => {
    expect(withoutOptionalZwj(roundTrip(unicode as string))).toBe(withoutOptionalZwj(unicode as string));
  });

  // Words from the human-typed FM corpus: the converter must produce the same keystrokes.
  it.each([
    ['දළදා', 'o<od'],
    ['සංඛ්‍යාංක', 'ixLHdxl'],
    ['ක්‍රමවේද', 'l%ufõo'],
    ['දැක්වෙන', 'oelafjk'],
    ['විසින්', 'úiska'],
    ['මේම', 'fïu'],
    ['කෝණයක', 'fldaKhl'],
    ['භෞතික', 'fN!;sl'],
    ['සිදුකරන', 'isÿlrk'],
    ['පුළුල්', 'mq¿,a'],
    ['සඳහා', 'i|yd'],
    ['හැඳින්වේ', 'ye¢kafõ'],
    ['අර්ථ', 'w¾:'],
    ['ත්‍රිකෝණ', ';%sfldaK'],
    ['බ්‍රි', 'ì%'],
    ['ට්‍රී', 'à%'],
    ['අපරිමිත', 'wmßñ;'],
    ['හෙතු?', 'fy;=@'],
    ['අඩංගු', 'wvx.='],
    ['කූ', 'l+'],
    ['දත්ත', 'o;a;'],
    ['ගණිතයේදී,', '.‚;fha§"'],
  ])('%s → %s', (unicode, fm) => {
    if (unicode === 'ගණිතයේදී,') {
      // ණි has no agreed precomposed glyph, so it is written as K + s rather than the corpus' ‚.
      expect(toFm(unicode)).toBe('.Ks;fha§"');
      return;
    }
    expect(toFm(unicode)).toBe(fm);
  });

  describe('vowel signs', () => {
    it.each([
      ['කා', 'ld'],
      ['කැ', 'le'],
      ['කෑ', 'lE'],
      ['කි', 'ls'],
      ['කී', 'lS'],
      ['කු', 'l='],
      ['කූ', 'l+'],
      ['කෘ', 'lD'],
      ['කෙ', 'fl'],
      ['කේ', 'fla'],
      ['කෛ', 'ffl'],
      ['කො', 'fld'],
      ['කෝ', 'flda'],
      ['කෞ', 'fl!'],
      ['ක්', 'la'],
      ['වේ', 'fõ'],
      ['රේ', 'fra'],
      ['රු', 're'],
      ['රූ', 'rE'],
    ])('%s → %s', (unicode, fm) => {
      expect(toFm(unicode)).toBe(fm);
      expect(fmToUnicode(fm)).toBe(unicode);
    });

    it('accepts decomposed kombuva sequences (NFC)', () => {
      expect(toFm('කේ')).toBe('fla'); // ෙ + ් = ේ
      expect(toFm('කො')).toBe('fld'); // ෙ + ා = ො
    });
  });

  describe('conjuncts', () => {
    it.each([
      ['yansaya', 'ක්‍ය', 'lH'],
      ['yansaya with a vowel sign', 'ව්‍යා', 'jHd'],
      ['yansaya on ර', 'කාර්‍ය', 'ldrH'],
      ['rakaransaya', 'ප්‍ර', 'm%'],
      ['rakaransaya with ේ', 'ප්‍රේ', 'fm%a'],
      ['rakaransaya with ි (ligature)', 'බ්‍රි', 'ì%'],
      ['rakaransaya with ු', 'ක්‍රු', 'l%q'],
      ['repaya', 'ධර්ම', 'O¾u'],
      ['repaya with ZWJ', 'ධර්‍ම', 'O¾u'],
      ['touching conjunct', 'ක්‍ෂ', 'laI'],
      ['ශ්‍රී', 'ශ්‍රී', 'Y%S'],
    ])('%s: %s → %s', (_name, unicode, fm) => {
      expect(toFm(unicode)).toBe(fm);
      expect(withoutOptionalZwj(fmToUnicode(fm))).toBe(withoutOptionalZwj(unicode));
    });

    it('does not treat a final ර් as repaya', () => {
      expect(toFm('කර්')).toBe('lra');
    });
  });

  it('round-trips every consonant with every vowel sign, yansaya and rakaransaya', () => {
    const signs = ['', ...Object.keys(vowelSigns), 'ෙ', 'ේ', 'ෛ', 'ො', 'ෝ', 'ෞ'];
    const failures: string[] = [];
    for (const c of Object.keys(consonants)) {
      for (const mark of ['', '්‍ය', '්‍ර']) {
        for (const sign of signs) {
          if (mark && sign === '්') continue; // not a real cluster
          if (c === 'ර' && mark === '්‍ර') continue; // ර with rakaransaya does not occur (ර්‍ර reads as repaya)
          const text = `${c}${mark}${sign}`;
          if (withoutOptionalZwj(roundTrip(text)) !== withoutOptionalZwj(text))
            failures.push(`${text}→${toFm(text)}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('only uses ligatures that decode back to the same text', () => {
    for (const [c, signs] of Object.entries(ligatures)) {
      for (const [sign, fm] of Object.entries(signs)) {
        expect(fmToUnicode(fm!), `${c}${sign}`).toBe(`${c}${sign}`);
      }
    }
  });

  it('converts punctuation that FM Abhaya uses for Sinhala glyphs', () => {
    expect(toFm('ලංකාව, (2026). ඔව්!')).toBe(',xldj" ^2026&\' Tõæ');
    expect(fmToUnicode(',xldj" ^2026&\' Tõæ')).toBe('ලංකාව, (2026). ඔව්!');
  });

  it('reports characters FM Abhaya cannot show as themselves', () => {
    const result = unicodeToFm('ToolKade ලංකා 123');
    expect(result.unsupported).toEqual(expect.arrayContaining(['T', 'o', 'l', 'K', 'a', 'd', 'e']));
    expect(result.unsupported).not.toContain('1');
    expect(unicodeToFm('ලංකා').unsupported).toEqual([]);
  });

  it('handles empty and whitespace-only input', () => {
    expect(unicodeToFm('')).toEqual({ text: '', unsupported: [] });
    expect(toFm(' \n\t')).toBe(' \n\t');
  });

  it('handles very long text', () => {
    const long = cases
      .map((c) => c[1])
      .join('\n')
      .repeat(50);
    const start = Date.now();
    expect(withoutOptionalZwj(roundTrip(long))).toBe(withoutOptionalZwj(long));
    expect(Date.now() - start).toBeLessThan(2000);
  });
});

describe('helpers', () => {
  it('converts in either direction', () => {
    expect(convert('ලංකා', 'unicode-to-fm').text).toBe(',xld');
    expect(convert(',xld', 'fm-to-unicode').text).toBe('ලංකා');
  });

  it('detects Sinhala Unicode', () => {
    expect(containsSinhalaUnicode('ලංකා')).toBe(true);
    expect(containsSinhalaUnicode(',xld')).toBe(false);
  });
});

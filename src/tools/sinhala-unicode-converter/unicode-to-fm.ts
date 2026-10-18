/*
 * Unicode → FM Abhaya conventions (ToolKade's own table; see THIRD_PARTY_NOTICES.md).
 *
 * Every code here is one that the Pandukabhaya FM → Unicode mapping (fm-abhaya.json) decodes back
 * to the same Unicode, so conversions round-trip (enforced by logic.test.ts). Precomposed glyphs
 * are used only where two independent sources agree on them, or where real FM Abhaya text
 * confirms the convention (the `=` / `+` vowel-sign shapes for ක, ග and ත). Where sources
 * conflicted (e.g. ලු/ලූ, ඤු, ඪි/ඪී, ථි, ඩී, ණි/ණී, ක්‍ෂ, ද්‍ව), the plain key sequence is used.
 */

/** Consonants: Unicode code point → FM key. */
export const consonants: Record<string, string> = {
  ක: 'l',
  ඛ: 'L',
  ග: '.',
  ඝ: '>',
  ඞ: 'X',
  ඟ: '`.',
  ච: 'p',
  ඡ: 'P',
  ජ: 'c',
  ඣ: '®',
  ඤ: '[',
  ඥ: '{',
  ඦ: '`P',
  ට: 'g',
  ඨ: 'G',
  ඩ: 'v',
  ඪ: 'V',
  ණ: 'K',
  ඬ: '~',
  ත: ';',
  ථ: ':',
  ද: 'o',
  ධ: 'O',
  න: 'k',
  ඳ: '|',
  ප: 'm',
  ඵ: 'M',
  බ: 'n',
  භ: 'N',
  ම: 'u',
  ඹ: 'U',
  ය: 'h',
  ර: 'r',
  ල: ',',
  ව: 'j',
  ශ: 'Y',
  ෂ: 'I',
  ස: 'i',
  හ: 'y',
  ළ: '<',
  ෆ: '*',
};

/** Independent vowels. */
export const vowels: Record<string, string> = {
  අ: 'w',
  ආ: 'wd',
  ඇ: 'we',
  ඈ: 'wE',
  ඉ: 'b',
  ඊ: 'B',
  උ: 'W',
  ඌ: 'W!',
  ඍ: 'R',
  ඎ: 'RD',
  ඏ: 'Ì',
  ඐ: 'Ï',
  එ: 't',
  ඒ: 'ta',
  ඓ: 'ft',
  ඔ: 'T',
  ඕ: '´',
  ඖ: 'T!',
};

/** Signs that follow a syllable. */
export const modifiers: Record<string, string> = {
  'ං': 'x',
  'ඃ': '#',
};

/** Vowel signs written after the consonant (and its yansaya/rakaransaya). */
export const vowelSigns: Record<string, string> = {
  'ා': 'd',
  'ැ': 'e',
  'ෑ': 'E',
  'ි': 's',
  'ී': 'S',
  'ු': 'q',
  'ූ': 'Q',
  'ෘ': 'D',
  'ෲ': 'DD',
  'ෟ': '!',
  '්': 'a',
};

/** Kombuva-based signs: FM writes the kombuva (f/ff) before the consonant and the rest after it. */
export const kombuvaSigns: Record<string, { before: string; after: string }> = {
  'ෙ': { before: 'f', after: '' },
  'ේ': { before: 'f', after: 'a' },
  'ෛ': { before: 'ff', after: '' },
  'ො': { before: 'f', after: 'd' },
  'ෝ': { before: 'f', after: 'da' },
  'ෞ': { before: 'f', after: '!' },
};

/** Precomposed consonant + vowel-sign glyphs, keyed by consonant then sign. */
export const ligatures: Record<string, Partial<Record<string, string>>> = {
  ක: { 'ු': 'l=', 'ූ': 'l+' },
  ග: { 'ු': '.=', 'ූ': '.+' },
  ත: { 'ු': ';=', 'ූ': ';+' },
  ර: { 'ු': 're', 'ූ': 'rE', 'ැ': '/', 'ෑ': '?', 'ි': 'ß', 'ී': 'Í' },
  ද: { 'ි': 'È', 'ී': '§', 'ු': 'ÿ' },
  ඳ: { 'ි': '¢', 'ී': '£', 'ු': '÷', 'ූ': 'ª' },
  ළ: { 'ු': '¿' },
  ඨ: { 'ි': 'À', 'ී': 'Á' },
  ඛ: { 'ි': 'Å', 'ී': 'Ç', '්': 'Ä' },
  ච: { 'ි': 'Ñ', 'ී': 'Ö', '්': 'É' },
  ඡ: { 'ි': 'ý', 'ී': 'Â', '්': 'þ' },
  ජ: { 'ි': 'ð', 'ී': 'Ô', '්': 'Ê' },
  ඵ: { 'ි': 'Ý', 'ී': 'Ú' },
  ථ: { 'ී': 'Ò' },
  ට: { 'ි': 'á', 'ී': 'à', '්': 'Ü' },
  ඩ: { 'ි': 'ä', '්': 'â' },
  ඬ: { 'ි': 'ç', 'ී': 'é', '්': 'å' },
  ධ: { 'ි': 'ê', 'ී': 'ë', '්': 'è' },
  බ: { 'ි': 'ì', 'ී': 'î', '්': 'í' },
  ම: { 'ි': 'ñ', 'ී': 'ó', '්': 'ï' },
  ඹ: { 'ි': 'ô', 'ී': 'ö', '්': 'ò' },
  ව: { 'ි': 'ú', 'ී': 'ù', '්': 'õ' },
  ඞ: { '්': 'Ù' },
};

/** Repaya (ර් written above the next consonant). */
export const repaya = '¾';
/** Yansaya (්‍ය) and rakaransaya (්‍ර) marks, written after the consonant. */
export const yansaya = 'H';
export const rakaransaya = '%';

/** FM Abhaya draws Sinhala glyphs on many ASCII punctuation keys, so real punctuation moves elsewhere. */
export const punctuation: Record<string, string> = {
  ',': '"',
  '.': "'",
  '(': '^',
  ')': '&',
  ':': '(',
  '?': '@',
  '/': '$',
  '%': ']',
  '=': '}',
  ';': '¦',
  '!': 'æ',
  '*': ')',
  '+': '¬',
  '×': '«',
  '÷': '­',
  '–': '¤',
  '’': 'Z',
  '‘': 'z',
  '"': '˜',
  '{': '™',
  '}': 'š',
  '•': '¡',
};

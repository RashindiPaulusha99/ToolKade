import type { ToolContent } from '@/tools/types';

export const content: ToolContent = {
  intro:
    'Convert Sinhala Unicode text to the FM Abhaya font and FM Abhaya text back to Unicode, instantly and in your browser. Handy for designers, typesetters and anyone moving Sinhala text between documents, design software and the web.',
  howTo: [
    'Choose the direction: "Unicode → FM Abhaya" to prepare text for documents set in FM Abhaya, or "FM Abhaya → Unicode" to turn old FM text into Unicode for the web, email or a phone.',
    'Type or paste your text into the first box. The converted text appears in the second box as you type.',
    'Click "Copy" to copy the result, then paste it into your document or design. For FM Abhaya output, set the font of the pasted text to FM Abhaya.',
    'Use "Swap" to send the result back the other way, or "Clear" to start again.',
  ],
  howItWorks: [
    'Sinhala Unicode stores each letter, vowel sign and conjunct as a proper Sinhala character, so it displays correctly on phones, websites and in search engines. FM Abhaya is an older "legacy" font: it draws Sinhala shapes on top of ordinary keyboard characters, so the text "l" shows as ක only while the FM Abhaya font is selected.',
    'The two systems also store text in a different order. In FM Abhaya the kombuva (ෙ) is typed before the letter it belongs to, and vowel signs, yansaya (්‍ය), rakaransaya (්‍ර) and repaya each have their own key or glyph. The converter breaks text into syllables and rebuilds each one in the other system, including special combined glyphs such as වි, දු and ළු.',
    "FM Abhaya to Unicode conversion uses the open-source Pandukabhaya mapping (MIT licence), which is based on the mapping by the Language Technology Research Laboratory at the University of Colombo School of Computing. Unicode to FM Abhaya uses ToolKade's own table of glyph codes, tested so that every converted syllable turns back into exactly the same Unicode text.",
    'Everything runs in your browser. The text you convert is never uploaded.',
  ],
  faqs: [
    {
      q: 'Why does my FM Abhaya text look like English letters?',
      a: 'FM Abhaya text is stored as ordinary keyboard characters. It only looks like Sinhala when the text is set in the FM Abhaya font. Paste the converted text into your document and change its font to FM Abhaya. If you do not have the font installed, the text will show as Latin letters.',
    },
    {
      q: 'Should I use Unicode or FM Abhaya?',
      a: 'Use Unicode for anything people read on screens: websites, social media, email, messages and documents you share. Search engines and phones understand Unicode. Use FM Abhaya only when a print or design workflow, or a template you have to match, requires that font.',
    },
    {
      q: 'Can I convert English text with this tool?',
      a: 'No. FM Abhaya uses the English letter keys for Sinhala shapes, so English words cannot appear as English in FM Abhaya. The converter warns you if your text contains characters that will show as Sinhala glyphs. Keep English text in a different font.',
    },
    {
      q: 'Does it handle yansaya, rakaransaya and repaya?',
      a: 'Yes. Conjuncts such as ක්‍ය (yansaya), ප්‍ර (rakaransaya) and ර්ම (repaya, as in ධර්ම) are converted in both directions, along with kombuva forms like කේ, කෝ and කෞ.',
    },
    {
      q: 'Is my text uploaded anywhere?',
      a: 'No. The conversion runs entirely in your browser, so your text stays on your device. You can even use the tool offline once the page has loaded.',
    },
  ],
};

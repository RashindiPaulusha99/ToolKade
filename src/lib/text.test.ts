import { describe, expect, it } from 'vitest';
import { wrapText } from './og';
import { countWords, readingTime } from './readingTime';
import { isValidSlug, slugify } from './slug';

describe('slugify', () => {
  it('creates kebab-case ASCII slugs', () => {
    expect(slugify('Salary & APIT Calculator')).toBe('salary-and-apit-calculator');
    expect(slugify('  Café   Tools!! ')).toBe('cafe-tools');
    expect(slugify('')).toBe('');
  });

  it('validates slugs', () => {
    expect(isValidSlug('word-counter')).toBe(true);
    expect(isValidSlug('Word-Counter')).toBe(false);
    expect(isValidSlug('word--counter')).toBe(false);
    expect(isValidSlug('-word')).toBe(false);
  });
});

describe('countWords', () => {
  it('counts English words and ignores punctuation', () => {
    expect(countWords('Hello, world! This is ToolKade.')).toBe(5);
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('counts Sinhala and Tamil words', () => {
    expect(countWords('මම ගෙදර යනවා')).toBe(3);
    expect(countWords('நான் வீட்டுக்குப் போகிறேன்')).toBe(3);
  });
});

describe('readingTime', () => {
  it('is at least one minute and ignores frontmatter and imports', () => {
    expect(readingTime('---\ntitle: x\n---\nimport A from "a";\nShort post.')).toBe(1);
    expect(readingTime(Array.from({ length: 1000 }, () => 'word').join(' '))).toBe(5);
  });
});

describe('wrapText (OG images)', () => {
  it('wraps by character count', () => {
    expect(wrapText('Vehicle Import Duty Calculator', 20, 3)).toEqual(['Vehicle Import Duty', 'Calculator']);
  });

  it('truncates with an ellipsis past the line limit', () => {
    const lines = wrapText('one two three four five six seven eight', 9, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });

  it('keeps a single long word on its own line', () => {
    expect(wrapText('Supercalifragilistic', 5, 3)).toEqual(['Supercalifragilistic']);
  });
});

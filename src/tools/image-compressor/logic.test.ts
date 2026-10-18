import { describe, expect, it } from 'vitest';
import {
  checkFiles,
  isAcceptedType,
  MAX_FILE_BYTES,
  MAX_FILES,
  outputName,
  outputType,
  parseMaxWidth,
  savings,
  targetSize,
  totals,
  uniqueNames,
} from './logic';

const file = (name: string, type = 'image/jpeg', size = 1000) => ({ name, type, size });

describe('checkFiles', () => {
  it('accepts JPG, PNG and WebP', () => {
    const { accepted, rejected } = checkFiles(
      [file('a.jpg'), file('b.png', 'image/png'), file('c.webp', 'image/webp')],
      0,
    );
    expect(accepted).toHaveLength(3);
    expect(rejected).toEqual([]);
  });

  it('rejects other types, oversized files and too many files, with reasons', () => {
    const many = Array.from({ length: MAX_FILES + 2 }, (_, i) => file(`p${i}.jpg`));
    const { accepted, rejected } = checkFiles(
      [file('x.gif', 'image/gif'), file('big.jpg', 'image/jpeg', MAX_FILE_BYTES + 1), ...many],
      0,
    );
    expect(accepted).toHaveLength(MAX_FILES);
    expect(rejected.map((r) => r.name).slice(0, 2)).toEqual(['x.gif', 'big.jpg']);
    expect(rejected).toHaveLength(4);
    expect(rejected[0].reason).toMatch(/JPG, PNG and WebP/);
  });

  it('counts files already in the queue', () => {
    expect(checkFiles([file('a.jpg'), file('b.jpg')], MAX_FILES - 1).accepted).toHaveLength(1);
  });

  it('handles an empty selection', () => {
    expect(checkFiles([], 0)).toEqual({ accepted: [], rejected: [] });
  });

  it('recognises accepted types', () => {
    expect(isAcceptedType('image/png')).toBe(true);
    expect(isAcceptedType('image/heic')).toBe(false);
    expect(isAcceptedType('')).toBe(false);
  });
});

describe('outputType', () => {
  it('keeps the original type or converts', () => {
    expect(outputType('image/png', 'original')).toBe('image/png');
    expect(outputType('image/png', 'image/webp')).toBe('image/webp');
    expect(outputType('image/jpeg', 'image/png')).toBe('image/png');
  });
});

describe('targetSize', () => {
  it('scales down to the max width, keeping the aspect ratio', () => {
    expect(targetSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(targetSize(1000, 333, 500)).toEqual({ width: 500, height: 167 });
  });

  it('never upscales', () => {
    expect(targetSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(targetSize(800, 600, null)).toEqual({ width: 800, height: 600 });
  });

  it('keeps at least one pixel of height for extreme panoramas', () => {
    expect(targetSize(10_000, 10, 100)).toEqual({ width: 100, height: 1 });
  });
});

describe('savings and totals', () => {
  it('works out the fraction saved', () => {
    expect(savings(1000, 400)).toBeCloseTo(0.6);
    expect(savings(1000, 1200)).toBeCloseTo(-0.2);
    expect(savings(0, 100)).toBe(0);
  });

  it('totals a batch', () => {
    expect(
      totals([
        { originalBytes: 1000, newBytes: 500 },
        { originalBytes: 3000, newBytes: 1500 },
      ]),
    ).toEqual({ original: 4000, compressed: 2000, saved: 0.5 });
    expect(totals([])).toEqual({ original: 0, compressed: 0, saved: 0 });
  });
});

describe('outputName', () => {
  it('adds a suffix and the right extension', () => {
    expect(outputName('holiday photo.JPG', 'image/webp')).toBe('holiday photo-compressed.webp');
    expect(outputName('scan.png', 'image/jpeg')).toBe('scan-compressed.jpg');
    expect(outputName('archive.tar.png', 'image/png')).toBe('archive.tar-compressed.png');
  });

  it('handles names without an extension, hidden files and unsafe characters', () => {
    expect(outputName('photo', 'image/jpeg')).toBe('photo-compressed.jpg');
    expect(outputName('.png', 'image/png')).toBe('.png-compressed.png');
    expect(outputName('a/b:c?.jpg', 'image/jpeg')).toBe('a-b-c--compressed.jpg');
    expect(outputName('   .jpg', 'image/jpeg')).toBe('image-compressed.jpg');
  });
});

describe('uniqueNames', () => {
  it('numbers duplicates case-insensitively', () => {
    expect(uniqueNames(['a.jpg', 'A.jpg', 'a.jpg', 'b.png'])).toEqual([
      'a.jpg',
      'A (2).jpg',
      'a (3).jpg',
      'b.png',
    ]);
    expect(uniqueNames(['x', 'x'])).toEqual(['x', 'x (2)']);
    expect(uniqueNames([])).toEqual([]);
  });
});

describe('parseMaxWidth', () => {
  it('parses an optional width', () => {
    expect(parseMaxWidth('')).toBeNull();
    expect(parseMaxWidth('1,920')).toBe(1920);
    expect(parseMaxWidth('10')).toBe('invalid');
    expect(parseMaxWidth('12.5')).toBe('invalid');
    expect(parseMaxWidth('99999')).toBe('invalid');
    expect(parseMaxWidth('abc')).toBe('invalid');
  });
});

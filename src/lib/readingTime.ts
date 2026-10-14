const WORDS_PER_MINUTE = 200;

const segmenter = new Intl.Segmenter('en', { granularity: 'word' });

/** Counts words using Intl.Segmenter, so Sinhala and Tamil text is counted correctly. */
export function countWords(text: string): number {
  let count = 0;
  for (const segment of segmenter.segment(text)) {
    if (segment.isWordLike) count++;
  }
  return count;
}

/** Strips MDX/Markdown syntax that should not count towards reading time. */
function stripMarkup(source: string): string {
  return source
    .replace(/^---[\s\S]*?---/, '') // frontmatter
    .replace(/^\s*(import|export)\s.*$/gm, '') // MDX imports/exports
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/<[^>]+>/g, ' ') // JSX / HTML tags
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1'); // links and images
}

/** Reading time in whole minutes (minimum 1). */
export function readingTime(source: string, wordsPerMinute = WORDS_PER_MINUTE): number {
  const words = countWords(stripMarkup(source));
  return Math.max(1, Math.round(words / wordsPerMinute));
}

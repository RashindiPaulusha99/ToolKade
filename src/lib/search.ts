/** The slim, serialisable shape of a tool that the client-side search needs. */
export interface SearchItem {
  slug: string;
  name: string;
  url: string;
  category: string;
  keywords: string[];
  published: boolean;
}

function normalise(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

/**
 * Scores each item against every query term. All terms must match somewhere;
 * matches in the name rank above category and keyword matches. Published tools rank first on ties.
 */
export function searchTools<T extends SearchItem>(query: string, items: T[], limit = 8): T[] {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: Array<{ item: T; score: number; index: number }> = [];
  items.forEach((item, index) => {
    const name = normalise(item.name);
    const category = normalise(item.category);
    const keywords = normalise(item.keywords.join(' '));
    let score = 0;
    for (const term of terms) {
      if (name.startsWith(term)) score += 5;
      else if (name.includes(term)) score += 3;
      else if (category.includes(term)) score += 2;
      else if (keywords.includes(term)) score += 1;
      else return; // every term must match
    }
    if (item.published) score += 0.5;
    scored.push({ item, score, index });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((s) => s.item);
}

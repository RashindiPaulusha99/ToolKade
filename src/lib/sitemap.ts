// Used by astro.config.mjs at build time (Node), so: relative imports only, no astro:content.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { categories, type CategoryId } from '../data/categories';
import { tools } from '../data/tools';
import { categoryHasPublishedTools, getPublishedTools, getTool, isPublished } from './tools';

const BLOG_DIR = join(process.cwd(), 'src', 'content', 'blog');

const EXCLUDED_PREFIXES = ['/404', '/og/'];

function pathOf(url: string): string {
  return new URL(url).pathname;
}

function isCategoryId(value: string): value is CategoryId {
  return categories.some((c) => c.id === value);
}

/** Decides which built pages go in the sitemap. Drafts and coming-soon tools have no page, so they never appear. */
export function isIndexableUrl(url: string): boolean {
  const path = pathOf(url);
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;

  // Category pages with no published tools are thin, so they are noindexed and left out.
  const categoryMatch = /^\/tools\/([^/]+)\/$/.exec(path);
  if (categoryMatch && isCategoryId(categoryMatch[1])) return categoryHasPublishedTools(categoryMatch[1]);

  // The blog index is noindexed while it has no published posts.
  if (path === '/blog/') return hasPublishedPosts();

  return true;
}

function readFrontmatter(file: string): string {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))?.[1] ?? '';
}

function hasPublishedPosts(): boolean {
  if (!existsSync(BLOG_DIR)) return false;
  return readdirSync(BLOG_DIR)
    .filter((name) => /^[^_].*\.mdx?$/.test(name))
    .some((name) => !/^draft:\s*true\b/m.test(readFrontmatter(join(BLOG_DIR, name))));
}

function latest(dates: string[]): string | undefined {
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : undefined;
}

function blogUpdatedDate(slug: string): string | undefined {
  for (const ext of ['.mdx', '.md']) {
    const file = join(BLOG_DIR, `${slug}${ext}`);
    if (!existsSync(file)) continue;
    const frontmatter = readFrontmatter(file);
    const updated = /^updatedDate:\s*["']?([\d-]+)/m.exec(frontmatter)?.[1];
    const published = /^publishDate:\s*["']?([\d-]+)/m.exec(frontmatter)?.[1];
    return updated ?? published;
  }
  return undefined;
}

/** `lastmod` for a sitemap URL, taken from the registry or blog frontmatter. */
export function getSitemapLastmod(url: string): string | undefined {
  const path = pathOf(url);

  const toolOrCategory = /^\/tools\/([^/]+)\/$/.exec(path)?.[1];
  if (toolOrCategory) {
    if (isCategoryId(toolOrCategory)) {
      return latest(
        tools.filter((t) => t.category === toolOrCategory && isPublished(t)).map((t) => t.updatedAt),
      );
    }
    return getTool(toolOrCategory)?.updatedAt;
  }

  const blogSlug = /^\/blog\/([^/]+)\/$/.exec(path)?.[1];
  if (blogSlug && blogSlug !== 'page') return blogUpdatedDate(blogSlug);

  if (path === '/' || path === '/tools/') return latest(getPublishedTools().map((t) => t.updatedAt));

  return undefined;
}

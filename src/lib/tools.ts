// Relative imports (not "@/"): this module is also loaded by astro.config.mjs via lib/sitemap.ts.
import { categories, type Category, type CategoryId } from '../data/categories';
import { tools, type ToolMeta } from '../data/tools';

/** Tools that have a generated page (live or beta). Coming-soon tools have no page. */
export function isPublished(tool: ToolMeta): boolean {
  return tool.status === 'live' || tool.status === 'beta';
}

export function toolUrl(slug: string): string {
  return `/tools/${slug}/`;
}

export function categoryUrl(id: CategoryId): string {
  return `/tools/${id}/`;
}

export function getTool(slug: string): ToolMeta | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getPublishedTools(): ToolMeta[] {
  return tools.filter(isPublished);
}

export function getToolsByCategory(id: CategoryId): ToolMeta[] {
  return tools.filter((t) => t.category === id);
}

/** Related tools in the order listed in the registry entry, skipping unknown slugs. */
export function getRelatedTools(tool: ToolMeta): ToolMeta[] {
  return tool.related.map(getTool).filter((t): t is ToolMeta => t !== undefined);
}

/** Categories with their tools, in registry order. Empty categories are kept so menus stay stable. */
export function getCategoriesWithTools(): Array<{ category: Category; tools: ToolMeta[] }> {
  return categories.map((category) => ({ category, tools: getToolsByCategory(category.id) }));
}

/** A category page is worth indexing only once it lists at least one published tool. */
export function categoryHasPublishedTools(id: CategoryId): boolean {
  return getToolsByCategory(id).some(isPublished);
}

/** "Popular" tools: published tools first, then coming-soon, in registry order. */
export function getPopularTools(limit = 8): ToolMeta[] {
  return [...getPublishedTools(), ...tools.filter((t) => !isPublished(t))].slice(0, limit);
}

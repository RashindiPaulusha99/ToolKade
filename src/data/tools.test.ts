import { icons } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { buildTitle, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, MIN_DESCRIPTION_LENGTH } from '@/lib/seo';
import { isValidSlug } from '@/lib/slug';
import { categories } from './categories';
import { tools } from './tools';

// Guards the registry rules in AGENTS.md so mistakes fail CI instead of shipping.
describe('tool registry', () => {
  const slugs = tools.map((t) => t.slug);
  const categoryIds = categories.map((c) => c.id);

  it('has unique, valid slugs', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(isValidSlug(slug), slug).toBe(true);
  });

  it('never collides tool slugs with category slugs', () => {
    for (const slug of slugs) expect(categoryIds).not.toContain(slug);
  });

  it.each(tools)('$slug: belongs to a known category and uses a real icon', (tool) => {
    expect(categoryIds).toContain(tool.category);
    expect(icons[tool.icon as keyof typeof icons], `icon "${tool.icon}"`).toBeDefined();
  });

  it.each(tools)('$slug: SEO title and description fit the limits', (tool) => {
    expect(buildTitle(tool.title).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(tool.description.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
    expect(tool.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it.each(tools)('$slug: has 3–4 related tools that exist and are not itself', (tool) => {
    expect(tool.related.length).toBeGreaterThanOrEqual(3);
    expect(tool.related.length).toBeLessThanOrEqual(4);
    for (const related of tool.related) {
      expect(slugs, `related "${related}"`).toContain(related);
      expect(related).not.toBe(tool.slug);
    }
  });

  it.each(tools)('$slug: has valid ISO dates and keywords', (tool) => {
    expect(tool.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tool.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tool.updatedAt >= tool.publishedAt).toBe(true);
    expect(tool.keywords.length).toBeGreaterThan(0);
    if (tool.blogSlug) expect(isValidSlug(tool.blogSlug)).toBe(true);
  });
});

describe('categories', () => {
  it.each(categories)('$id: SEO fields fit the limits and the icon exists', (category) => {
    expect(isValidSlug(category.id)).toBe(true);
    expect(buildTitle(category.title).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(category.description.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
    expect(category.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(icons[category.icon as keyof typeof icons]).toBeDefined();
  });
});

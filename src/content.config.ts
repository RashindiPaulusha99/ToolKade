// Astro 7 requires collections to be defined here (the old src/content/config.ts location is rejected).
// Post files still live in src/content/blog/.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories } from './data/categories';
import { tools } from './data/tools';

const toolSlugs = tools.map((t) => t.slug) as [string, ...string[]];
const categoryIds = categories.map((c) => c.id) as [string, ...string[]];

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(70, 'Keep titles ≤ 60 characters where possible (hard limit 70).'),
        description: z
          .string()
          .min(120, 'Meta descriptions must be 120–155 characters.')
          .max(155, 'Meta descriptions must be 120–155 characters.'),
        tool: z.enum(toolSlugs, { message: 'tool must match a slug in src/data/tools.ts' }),
        category: z.enum(categoryIds),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        author: z.string().default('ToolKade Team'),
        heroImage: image().optional(),
        heroAlt: z.string().optional(),
        tags: z.array(z.string()).default([]),
        faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
        draft: z.boolean().default(false),
      })
      .refine((data) => !data.heroImage || Boolean(data.heroAlt), {
        message: 'heroAlt is required when heroImage is set.',
        path: ['heroAlt'],
      }),
});

export const collections = { blog };

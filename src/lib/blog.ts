import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export const POSTS_PER_PAGE = 12;

/** Drafts are visible in `astro dev` for review and excluded from production builds. */
function isVisible(post: BlogPost): boolean {
  return import.meta.env.DEV || !post.data.draft;
}

/** Visible posts, newest first. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', isVisible);
  return posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  return (await getPublishedPosts()).find((post) => post.id === slug);
}

export function postUrl(slug: string): string {
  return `/blog/${slug}/`;
}

export function postOgImage(slug: string): string {
  return `/og/blog/${slug}.png`;
}

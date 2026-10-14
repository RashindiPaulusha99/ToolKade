import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '@/data/site';
import { getPublishedPosts, postUrl } from '@/lib/blog';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${site.name} Blog`,
    description: 'Guides to Sri Lankan tax, duty and bills, and how-tos for everyday online tools.',
    site: context.site ?? site.url,
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: postUrl(post.id),
      categories: post.data.tags,
    })),
    customData: '<language>en</language>',
  });
}

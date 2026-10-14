import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getCategory } from '@/data/categories';
import { tools } from '@/data/tools';
import { getPublishedPosts } from '@/lib/blog';
import { buildOgSvg, type OgImageInput } from '@/lib/og';
import { isPublished } from '@/lib/tools';

// Generates /og/default.png, /og/tools/<slug>.png and /og/blog/<slug>.png at build time.
export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  const paths: Array<{ params: { path: string }; props: OgImageInput }> = [
    { params: { path: 'default' }, props: { title: 'Free online tools and Sri Lanka calculators' } },
    ...tools.filter(isPublished).map((tool) => ({
      params: { path: `tools/${tool.slug}` },
      props: { title: tool.name, eyebrow: getCategory(tool.category).name },
    })),
    ...posts.map((post) => ({
      params: { path: `blog/${post.id}` },
      props: { title: post.data.title, eyebrow: 'ToolKade Blog' },
    })),
  ];
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await sharp(Buffer.from(buildOgSvg(props as OgImageInput)))
    .png({ compressionLevel: 9 })
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};

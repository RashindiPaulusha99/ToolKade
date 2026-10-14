import { site } from '@/data/site';

export const TITLE_SUFFIX = ` | ${site.name}`;
export const MAX_TITLE_LENGTH = 60;
export const MIN_DESCRIPTION_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 155;

/** Appends " | ToolKade" unless the title already contains the site name. */
export function buildTitle(title: string): string {
  return title.includes(site.name) ? title : `${title}${TITLE_SUFFIX}`;
}

/** Absolute URL on the production site. Paths keep their trailing slash. */
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

/** Canonical URL: absolute, no query string or hash, trailing slash on page paths. */
export function canonicalUrl(pathname: string): string {
  const url = new URL(pathname, site.url);
  url.search = '';
  url.hash = '';
  const hasExtension = /\.[a-z0-9]+$/i.test(url.pathname);
  if (!hasExtension && !url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

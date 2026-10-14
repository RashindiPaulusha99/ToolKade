import { describe, expect, it } from 'vitest';
import { breadcrumbSchema, faqSchema, serializeJsonLd, webApplicationSchema } from '@/components/seo/schema';
import { tools } from '@/data/tools';
import { absoluteUrl, buildTitle, canonicalUrl } from './seo';
import { getSitemapLastmod, isIndexableUrl } from './sitemap';

describe('titles and URLs', () => {
  it('adds the site suffix once', () => {
    expect(buildTitle('Word Counter')).toBe('Word Counter | ToolKade');
    expect(buildTitle('About ToolKade')).toBe('About ToolKade');
  });

  it('builds canonical URLs with a trailing slash and no query string', () => {
    expect(canonicalUrl('/tools/word-counter')).toBe('https://toolkade.lk/tools/word-counter/');
    expect(canonicalUrl('/tools/word-counter/?amount=5#x')).toBe('https://toolkade.lk/tools/word-counter/');
    expect(canonicalUrl('/')).toBe('https://toolkade.lk/');
    expect(canonicalUrl('/rss.xml')).toBe('https://toolkade.lk/rss.xml');
  });

  it('builds absolute URLs', () => {
    expect(absoluteUrl('/og/default.png')).toBe('https://toolkade.lk/og/default.png');
  });
});

describe('JSON-LD', () => {
  it('escapes characters that could close the script tag', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script> & co' });
    expect(json).not.toContain('</script>');
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script> & co' });
  });

  it('builds FAQPage from the same data shown on the page', () => {
    const faqs = [{ q: 'Is it free?', a: 'Yes.' }];
    expect(faqSchema(faqs)).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Is it free?', acceptedAnswer: { text: 'Yes.' } }],
    });
    expect(faqSchema([])).toBeNull();
  });

  it('numbers breadcrumb positions from 1 with absolute URLs', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Tools', href: '/tools/' },
    ]);
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://toolkade.lk/' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://toolkade.lk/tools/' },
    ]);
  });

  it('marks tools as free web applications', () => {
    const schema = webApplicationSchema(tools[0]);
    expect(schema).toMatchObject({
      '@type': 'WebApplication',
      operatingSystem: 'Any',
      offers: { price: '0' },
      url: `https://toolkade.lk/tools/${tools[0].slug}/`,
    });
  });
});

describe('sitemap rules', () => {
  it('excludes 404 and OG images', () => {
    expect(isIndexableUrl('https://toolkade.lk/404/')).toBe(false);
    expect(isIndexableUrl('https://toolkade.lk/og/default.png')).toBe(false);
    expect(isIndexableUrl('https://toolkade.lk/about/')).toBe(true);
  });

  it('includes category pages only once they have a published tool', () => {
    const empty = tools.every((t) => t.category !== 'pdf' || t.status === 'coming-soon');
    expect(isIndexableUrl('https://toolkade.lk/tools/pdf/')).toBe(!empty);
  });

  it('uses the registry updatedAt for tool pages', () => {
    expect(getSitemapLastmod(`https://toolkade.lk/tools/${tools[0].slug}/`)).toBe(tools[0].updatedAt);
    expect(getSitemapLastmod('https://toolkade.lk/about/')).toBeUndefined();
  });
});

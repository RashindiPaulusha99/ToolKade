import type { ToolMeta } from '@/data/tools';
import { site } from '@/data/site';
import { absoluteUrl } from '@/lib/seo';
import { toolUrl } from '@/lib/tools';
import type { Faq } from '@/tools/types';

export type JsonLdObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/tools/". */
  href: string;
}

const organizationRef = { '@type': 'Organization', name: site.name, url: site.url };

export function websiteSchema(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/tools/')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationSchema(): JsonLdObject {
  const sameAs = Object.values(site.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    logo: absoluteUrl(site.logo),
    email: site.email,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

function applicationCategory(tool: ToolMeta): string {
  switch (tool.category) {
    case 'developer':
      return 'DeveloperApplication';
    case 'image':
      return 'MultimediaApplication';
    case 'business':
      return 'BusinessApplication';
    case 'sri-lanka':
      return tool.slug.endsWith('-calculator') ? 'FinanceApplication' : 'UtilitiesApplication';
    default:
      return 'UtilitiesApplication';
  }
}

export function webApplicationSchema(tool: ToolMeta): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: absoluteUrl(toolUrl(tool.slug)),
    applicationCategory: applicationCategory(tool),
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'LKR' },
    datePublished: tool.publishedAt,
    dateModified: tool.updatedAt,
    publisher: organizationRef,
  };
}

export function faqSchema(faqs: Faq[]): JsonLdObject | null {
  if (faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: { '@type': 'WebSite', name: site.name, url: site.url },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}

export function blogPostingSchema(input: {
  title: string;
  description: string;
  path: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    image: absoluteUrl(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { '@type': 'Organization', name: input.author, url: site.url },
    publisher: { ...organizationRef, logo: { '@type': 'ImageObject', url: absoluteUrl(site.logo) } },
    inLanguage: 'en',
  };
}

/** Serialises JSON safely for a <script> tag (no "</script>" breakout). Used for JSON-LD and embedded data. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

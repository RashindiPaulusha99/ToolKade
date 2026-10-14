export const SITE_URL = 'https://toolkade.lk';

export const site = {
  name: 'ToolKade',
  url: SITE_URL,
  tagline: 'Free, fast tools. Everything runs in your browser.',
  description:
    'Free online tools for Sri Lanka and beyond: salary, tax, vehicle duty and electricity calculators, plus image, PDF, developer and text tools that run in your browser.',
  locale: 'en_LK',
  lang: 'en',
  author: 'ToolKade Team',
  email: 'hello@toolkade.lk',
  defaultOgImage: '/og/default.png',
  logo: '/favicon.svg',
  social: {
    // Add profile URLs as they are created; they are emitted as Organization.sameAs.
    facebook: '',
    x: '',
    linkedin: '',
  },
  /** Effective date shown on the legal pages. Update when their content changes. */
  legalUpdated: '2026-10-14',
} as const;

export type Site = typeof site;

import type { CategoryId } from './categories';

export type ToolStatus = 'live' | 'beta' | 'coming-soon';

export interface ToolMeta {
  slug: string; // "vehicle-import-duty-calculator"
  name: string; // "Vehicle Import Duty Calculator"
  shortName?: string; // shorter label for menus
  category: CategoryId;
  title: string; // SEO title without the " | ToolKade" suffix; full title Ã¢â€°Â¤ 60 chars
  description: string; // meta description, 120Ã¢â‚¬â€œ155 chars
  keywords: string[]; // target search terms (planning only, not a meta tag)
  icon: string; // lucide icon name (PascalCase)
  blogSlug?: string; // companion blog post
  related: string[]; // 3Ã¢â‚¬â€œ4 related tool slugs
  status: ToolStatus;
  ratesFile?: string; // e.g. "vehicle-duty.json"
  publishedAt: string; // ISO date
  updatedAt: string; // ISO date
}

/**
 * THE tool registry. Order matters: it is the display order in menus, category pages
 * and the "popular tools" lists. Never hardcode tool lists anywhere else.
 */
export const tools: ToolMeta[] = [
  {
    slug: 'vehicle-import-duty-calculator',
    name: 'Vehicle Import Duty Calculator',
    shortName: 'Vehicle Import Duty',
    category: 'sri-lanka',
    title: 'Vehicle Import Duty Calculator Sri Lanka 2026',
    description:
      'Estimate customs duty, excise, luxury tax and VAT on an imported car, SUV, hybrid or EV in Sri Lanka, with a full breakdown of the landed cost in LKR.',
    keywords: [
      'vehicle import duty calculator sri lanka',
      'car import tax sri lanka',
      'vehicle tax calculator sri lanka',
    ],
    icon: 'Car',
    blogSlug: 'how-vehicle-import-duty-is-calculated-in-sri-lanka',
    related: ['loan-emi-calculator', 'salary-apit-calculator', 'electricity-bill-calculator'],
    status: 'live',
    ratesFile: 'vehicle-duty.json',
    publishedAt: '2026-10-14',
    updatedAt: '2026-10-14',
  },
  {
    slug: 'salary-apit-calculator',
    name: 'Salary & APIT Calculator',
    shortName: 'Salary & APIT',
    category: 'sri-lanka',
    title: 'Salary & APIT Tax Calculator Sri Lanka 2026',
    description:
      'Work out your take-home pay in Sri Lanka after APIT tax and 8% EPF, and see employer EPF and ETF costs, with a bracket-by-bracket tax breakdown.',
    keywords: [
      'apit calculator',
      'salary calculator sri lanka',
      'paye tax calculator sri lanka',
      'epf etf calculator',
    ],
    icon: 'Wallet',
    blogSlug: 'how-apit-tax-is-calculated-in-sri-lanka',
    related: ['loan-emi-calculator', 'electricity-bill-calculator', 'vehicle-import-duty-calculator'],
    status: 'live',
    ratesFile: 'apit.json',
    publishedAt: '2026-10-18',
    updatedAt: '2026-10-18',
  },
  {
    slug: 'sinhala-unicode-converter',
    name: 'Sinhala Unicode to FM Abhaya Converter',
    shortName: 'Sinhala Unicode Converter',
    category: 'sri-lanka',
    title: 'Sinhala Unicode to FM Abhaya Converter',
    description:
      'Convert Sinhala Unicode text to FM Abhaya and FM Abhaya back to Unicode as you type. Free and instant, with conjuncts like yansaya and rakaransaya.',
    keywords: ['unicode to fm abhaya', 'fm abhaya to unicode', 'sinhala unicode converter'],
    icon: 'Languages',
    blogSlug: 'fm-abhaya-vs-sinhala-unicode',
    related: ['word-counter', 'json-formatter', 'salary-apit-calculator'],
    status: 'live',
    publishedAt: '2026-10-18',
    updatedAt: '2026-10-18',
  },
  {
    slug: 'loan-emi-calculator',
    name: 'Loan & Leasing EMI Calculator',
    shortName: 'Loan & Leasing EMI',
    category: 'sri-lanka',
    title: 'Loan & Leasing EMI Calculator Sri Lanka',
    description:
      'Calculate your monthly loan or leasing instalment in Sri Lanka, compare flat and reducing balance rates and see the total interest with a full schedule.',
    keywords: ['leasing calculator sri lanka', 'loan calculator sri lanka', 'emi calculator'],
    icon: 'Calculator',
    blogSlug: 'flat-rate-vs-reducing-balance-leasing',
    related: ['vehicle-import-duty-calculator', 'salary-apit-calculator', 'electricity-bill-calculator'],
    status: 'live',
    publishedAt: '2026-10-18',
    updatedAt: '2026-10-18',
  },
  {
    slug: 'electricity-bill-calculator',
    name: 'Electricity Bill Calculator (CEB & LECO)',
    shortName: 'Electricity Bill',
    category: 'sri-lanka',
    title: 'CEB Electricity Bill Calculator Sri Lanka 2026',
    description:
      'Calculate your CEB or LECO electricity bill from the units used, with a block-by-block breakdown of the domestic tariff, the fixed charge and the total.',
    keywords: ['electricity bill calculator sri lanka', 'ceb bill calculator', 'leco bill calculator'],
    icon: 'Zap',
    blogSlug: 'how-ceb-electricity-bill-is-calculated',
    related: ['salary-apit-calculator', 'loan-emi-calculator', 'vehicle-import-duty-calculator'],
    status: 'live',
    ratesFile: 'electricity-tariff.json',
    publishedAt: '2026-10-18',
    updatedAt: '2026-10-18',
  },
  {
    slug: 'image-compressor',
    name: 'Image Compressor',
    category: 'image',
    title: 'Image Compressor: Compress JPG, PNG & WebP Free',
    description:
      'Compress JPG, PNG and WebP images in your browser. Set the quality and maximum width, compare file sizes and download them all as a ZIP. No uploads.',
    keywords: ['compress image online', 'image compressor', 'reduce image size'],
    icon: 'ImageDown',
    blogSlug: 'how-to-compress-images-without-losing-quality',
    related: ['json-formatter', 'word-counter', 'sinhala-unicode-converter'],
    status: 'live',
    publishedAt: '2026-10-18',
    updatedAt: '2026-10-18',
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    category: 'developer',
    title: 'JSON Formatter & Validator Online',
    description:
      'Format, validate and minify JSON online. Find the exact line and column of errors, sort keys and explore data in a tree view. Runs locally in your browser.',
    keywords: ['json formatter', 'json validator', 'json beautifier', 'json minify'],
    icon: 'Braces',
    blogSlug: 'how-to-fix-invalid-json-errors',
    related: ['word-counter', 'image-compressor', 'sinhala-unicode-converter'],
    status: 'coming-soon',
    publishedAt: '2026-10-14',
    updatedAt: '2026-10-14',
  },
  {
    slug: 'word-counter',
    name: 'Word & Character Counter',
    shortName: 'Word Counter',
    category: 'text',
    title: 'Word Counter: Count Words & Characters Online',
    description:
      'Count words, characters, sentences and paragraphs as you type, with reading time and keyword frequency. Works with English, Sinhala and Tamil text.',
    keywords: ['word counter', 'character counter', 'sinhala word counter'],
    icon: 'Pilcrow',
    blogSlug: 'how-many-words-is-a-page',
    related: ['sinhala-unicode-converter', 'json-formatter', 'image-compressor'],
    status: 'coming-soon',
    publishedAt: '2026-10-14',
    updatedAt: '2026-10-14',
  },
];

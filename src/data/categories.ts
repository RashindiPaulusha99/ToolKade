export type CategoryId = 'sri-lanka' | 'image' | 'pdf' | 'developer' | 'text' | 'business';

export interface Category {
  id: CategoryId;
  /** Full label, used in headings and the mega menu. */
  name: string;
  /** Short label for compact menus and badges. */
  shortName: string;
  /** SEO title, ≤ 60 chars before " | ToolKade". */
  title: string;
  /** Meta description, 120–155 chars. */
  description: string;
  /** Visible intro paragraph on the category page. */
  intro: string;
  /** lucide icon name (PascalCase). */
  icon: string;
}

export const categories: Category[] = [
  {
    id: 'sri-lanka',
    name: 'Sri Lanka Calculators',
    shortName: 'Sri Lanka',
    title: 'Sri Lanka Calculators: Tax, Salary, Duty & Bills',
    description:
      'Free Sri Lanka calculators for APIT salary tax, EPF/ETF, vehicle import duty, CEB electricity bills, leasing EMIs and Sinhala Unicode conversion.',
    intro:
      'Calculators built around Sri Lankan rules and rates: take-home pay after APIT and EPF, vehicle import duty, CEB and LECO electricity bills, leasing instalments and Sinhala Unicode. Each one shows where its rates come from and when they were last checked.',
    icon: 'Landmark',
  },
  {
    id: 'image',
    name: 'Image Tools',
    shortName: 'Image',
    title: 'Free Online Image Tools: Compress, Resize & More',
    description:
      'Compress, resize and convert JPG, PNG and WebP images for free. Every image tool runs in your browser, so your photos are never uploaded anywhere.',
    intro:
      'Shrink, resize and convert photos without uploading them. These image tools run entirely in your browser, which makes them fast and private.',
    icon: 'Image',
  },
  {
    id: 'pdf',
    name: 'PDF Tools',
    shortName: 'PDF',
    title: 'Free Online PDF Tools: Merge, Split & Compress',
    description:
      'Merge, split and compress PDF files for free, right in your browser. No sign-up, no watermarks and your documents never leave your device.',
    intro:
      'Work with PDF files without installing software or uploading documents. Everything is processed on your own device.',
    icon: 'FileText',
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    shortName: 'Developer',
    title: 'Free Developer Tools: JSON, Regex, JWT & Base64',
    description:
      'Fast developer utilities: JSON formatter and validator, regex tester, JWT decoder, Base64 encoder and cron builder. Runs locally in your browser.',
    intro:
      'Everyday utilities for developers. Paste your data, get a result instantly, and nothing is sent to a server, so it is safe for tokens and config files.',
    icon: 'Code',
  },
  {
    id: 'text',
    name: 'Text Tools',
    shortName: 'Text',
    title: 'Free Online Text Tools: Word Counter & More',
    description:
      'Count words and characters, convert text case and generate placeholder text. Works with English, Sinhala and Tamil text, free and instant.',
    intro: 'Simple tools for writers, students and editors. They work with English, Sinhala and Tamil text.',
    icon: 'Type',
  },
  {
    id: 'business',
    name: 'Business Tools',
    shortName: 'Business',
    title: 'Free Business Tools: Invoices, Receipts & Rent',
    description:
      'Free business tools for Sri Lankan freelancers and small businesses: create invoices and receipts in LKR and work out rent and service charges.',
    intro:
      'Practical tools for freelancers, small businesses and landlords, with support for Sri Lankan rupees.',
    icon: 'Briefcase',
  },
];

export function getCategory(id: CategoryId): Category {
  const category = categories.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

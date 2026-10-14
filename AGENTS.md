# AGENTS.md — ToolKade

Instructions for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository. Read this file fully before you make any change.

---

## 1. Project Overview

ToolKade ("kade" = shop) is a static, SEO-first website of free online tools. It focuses on Sri Lankan users (tax, duty and tariff calculators, Sinhala Unicode) plus general image, PDF, developer and text utilities. Every tool has a companion blog post. The number of tools will keep growing, so **everything is driven by the tool registry** (`src/data/tools.ts`).

- Production URL: `https://toolkade.lk`
- Audience: Sri Lankan users first (mostly on mobile, often on slow connections), then a global audience
- Revenue: Google AdSense first, then a premium tier later

Core principles:
1. **Static and fast.** Astro static output. Ship JavaScript only where a tool needs interactivity.
2. **Browser-only processing.** Never upload user files or data to a server.
3. **SEO on every page.** No page ships without its title, description, canonical URL, JSON-LD and internal links.
4. **Accurate and transparent.** Official rates live in data files with a source and a verification date. Never guess them.

---

## 2. Tech Stack

| Area | Choice |
|---|---|
| Framework | Astro 5, `output: 'static'` |
| Language | TypeScript (strict) |
| Interactive tools | React 19 as Astro islands (`client:visible`) |
| Styling | Tailwind CSS 4 (CSS-first config with `@theme`) |
| Blog | Astro Content Collections + MDX |
| Images | `astro:assets` (`<Image>`, `<Picture>`), WebP/AVIF |
| Icons | `lucide-react` / `@lucide/astro` |
| SEO | Custom `<SEO />` component, `@astrojs/sitemap` |
| Tests | Vitest (+ Testing Library for complex components) |
| Lint/format | ESLint, Prettier (+ `prettier-plugin-astro`, `prettier-plugin-tailwindcss`) |
| Hosting | Cloudflare Pages (auto-deploy from `main`) |
| Client-side libs (lazy-loaded) | `pdf-lib`, `pdfjs-dist`, `browser-image-compression`, `jszip`, `jspdf` |

### Commands

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:4321
npm run build        # production build to dist/
npm run preview      # preview the production build
npm run test         # run Vitest
npm run lint         # ESLint + Prettier check
npm run check        # astro check (type errors)
```

Before finishing any task, run `npm run check && npm run test && npm run build`. All three must pass.

### Dependencies
- Prefer the platform and existing deps. Add a package only if it saves significant work, and say why in your summary.
- Check the licence first. Avoid GPL/AGPL in client bundles unless the human approves.

---

## 3. Repository Structure

```
toolkade/
├── AGENTS.md
├── PLAN.md
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   ├── robots.txt
│   ├── _redirects            # Cloudflare redirects (old slug → new slug)
│   ├── favicon.svg
│   ├── fonts/                # FM Abhaya (if licence allows), self-hosted fonts
│   └── og/                   # generated Open Graph images
└── src/
    ├── styles/
    │   └── global.css        # Tailwind import + @theme design tokens
    ├── components/
    │   ├── layout/           # Header, MegaMenu, MobileNav, Footer, Breadcrumbs, ThemeToggle
    │   ├── seo/              # SEO.astro, JsonLd.astro, schema.ts
    │   ├── tool/             # ToolHeader, HowToUse, FAQ, RelatedTools, RelatedPost, RatesNotice
    │   ├── blog/             # PostCard, TableOfContents, ToolCTA
    │   ├── ads/              # AdSlot.astro (disabled until PUBLIC_ADS_ENABLED=true)
    │   └── ui/               # Button, Input, Select, Textarea, Card, Tabs, CopyButton, FileDrop, Toast
    ├── tools/
    │   └── <tool-slug>/
    │       ├── Tool.tsx      # React UI (island)
    │       ├── logic.ts      # pure functions — no DOM, no React
    │       ├── logic.test.ts # Vitest tests
    │       └── content.ts    # intro, how-to steps, FAQs
    ├── data/
    │   ├── site.ts           # site name, URL, social links, default OG image
    │   ├── categories.ts     # category definitions
    │   ├── tools.ts          # TOOL REGISTRY (single source of truth)
    │   └── rates/            # versioned official rates (JSON)
    ├── content/
    │   ├── config.ts         # content collection schemas
    │   └── blog/             # <post-slug>.mdx (+ images/)
    ├── layouts/
    │   ├── BaseLayout.astro
    │   ├── ToolLayout.astro
    │   └── BlogLayout.astro
    ├── lib/                  # shared helpers: format.ts (LKR, numbers), slug.ts, readingTime.ts
    └── pages/                # see Routing
```

### The tool registry

`src/data/tools.ts` exports an array of `ToolMeta`:

```ts
export interface ToolMeta {
  slug: string;              // "vehicle-import-duty-calculator"
  name: string;              // "Vehicle Import Duty Calculator"
  shortName?: string;        // shorter label for menus
  category: CategoryId;      // "sri-lanka" | "image" | "pdf" | "developer" | "text" | "business"
  title: string;             // SEO title, ≤ 60 chars
  description: string;       // meta description, ≤ 155 chars
  keywords: string[];        // target search terms (planning only, not a meta tag)
  icon: string;              // lucide icon name
  blogSlug?: string;         // companion blog post
  related: string[];         // 3–4 related tool slugs
  status: "live" | "beta" | "coming-soon";
  ratesFile?: string;        // e.g. "vehicle-duty.json"
  publishedAt: string;       // ISO date
  updatedAt: string;         // ISO date
}
```

The nav, mega menu, category pages, search, sitemap, related-tools blocks and home page all read from this registry. **Never hardcode tool lists anywhere else.**

### How to add a new tool
1. Add a `ToolMeta` entry to `src/data/tools.ts`.
2. Create `src/tools/<slug>/` with `logic.ts`, `logic.test.ts`, `Tool.tsx` and `content.ts`.
3. If the tool needs official rates, add `src/data/rates/<name>.json` (format in §10).
4. Create `src/pages/tools/<slug>.astro` using `ToolLayout`.
5. Write the companion post in `src/content/blog/<blog-slug>.mdx` with `tool: <slug>`.
6. Run check, test and build. Confirm the tool appears in the menu, its category page, search and the sitemap.

---

## 4. Routing

Astro file-based routing with static generation.

### Config
```js
// astro.config.mjs
export default defineConfig({
  site: 'https://toolkade.lk',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
```

### Route map

| URL | File | Notes |
|---|---|---|
| `/` | `pages/index.astro` | Home |
| `/tools/` | `pages/tools/index.astro` | All tools, grouped by category |
| `/tools/<category>/` | `pages/tools/[category].astro` | `getStaticPaths` from `categories.ts` |
| `/tools/<tool-slug>/` | `pages/tools/<tool-slug>.astro` | Thin wrapper: `ToolLayout` + island |
| `/blog/` | `pages/blog/index.astro` | Paginated list |
| `/blog/page/<n>/` | `pages/blog/page/[page].astro` | Pagination (`paginate()`) |
| `/blog/<post-slug>/` | `pages/blog/[...slug].astro` | `getStaticPaths` from the collection, excluding drafts |
| `/about/`, `/contact/` | `pages/about.astro`, `pages/contact.astro` | |
| `/privacy-policy/`, `/terms/`, `/disclaimer/`, `/cookie-policy/` | matching `.astro` files | Legal pages |
| `/404` | `pages/404.astro` | Search box + popular tools |
| `/rss.xml` | `pages/rss.xml.ts` | Blog RSS feed |

Category slugs must never collide with tool slugs. Tool slugs end in a noun such as `-calculator`, `-converter`, `-generator`, `-formatter` or `-counter`; category slugs are short single words.

### Rules
- Slugs are lowercase, kebab-case, English, and include the main keyword (`salary-apit-calculator`, not `apit`).
- **Slugs are permanent.** If you must change one, add `/old-slug/ /new-slug/ 301` to `public/_redirects` and update every internal link.
- All internal links use absolute paths with a trailing slash (`/tools/word-counter/`).
- Tool state may be saved in query parameters for sharing (`?amount=500000`), but the canonical URL never includes parameters.
- Pages for `coming-soon` tools are not generated and do not appear in the sitemap.
- Sinhala versions (later) will live under `/si/` with mirrored paths and `hreflang` links. Don't build this until asked, but don't block it either: keep UI text in `content.ts`, not scattered through components.

---

## 5. Styling System

Tailwind CSS 4 with design tokens defined once in `src/styles/global.css`. **Use tokens, not raw colours.**

### Design tokens
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand */
  --color-brand-50:  #effaf8;
  --color-brand-100: #d7f2ed;
  --color-brand-500: #14857a;   /* deep teal: primary */
  --color-brand-600: #0f6b62;
  --color-brand-700: #0d564f;
  --color-accent-400: #f5a524;  /* warm amber: highlights, badges */
  --color-accent-500: #e08e0b;

  /* Semantic */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger:  #dc2626;

  /* Typography */
  --font-sans: "Inter", "Noto Sans Sinhala", "Noto Sans Tamil", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Shape */
  --radius-card: 1rem;
  --radius-control: 0.625rem;
}
```

Neutral colours use Tailwind's `slate` scale. Dark mode uses the `dark:` variant with a `.dark` class on `<html>`, toggled by `ThemeToggle` and saved to `localStorage` (wrapped in try/catch, defaulting to the system preference, applied by an inline script in `<head>` to avoid a flash).

### Typography scale
| Use | Classes |
|---|---|
| Page H1 | `text-3xl md:text-4xl font-bold tracking-tight` |
| Section H2 | `text-2xl font-semibold` |
| H3 | `text-lg font-semibold` |
| Body | `text-base leading-7 text-slate-700 dark:text-slate-300` |
| Small / helper | `text-sm text-slate-500` |
| Blog prose | `prose prose-slate dark:prose-invert max-w-none` (`@tailwindcss/typography`) |

Sinhala and Tamil text needs more line height. Use `leading-8` on blocks with `lang="si"` or `lang="ta"`.

### Component patterns
- **Card:** `rounded-[--radius-card] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900`
- **Primary button:** `bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-[--radius-control] px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500`
- **Input:** `w-full rounded-[--radius-control] border border-slate-300 px-3 py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900`
- **Result panel:** `rounded-[--radius-card] bg-brand-50 border border-brand-100 p-5 dark:bg-brand-700/20` with the key figure at `text-3xl font-bold text-brand-700`
- **Badge:** `rounded-full bg-accent-400/15 text-accent-500 text-xs font-medium px-2.5 py-0.5`

Build these once in `src/components/ui/` and reuse them. Do not restyle the same element differently on different pages.

### Rules
- Use utility classes only. No inline `style=""` except for dynamic values (such as chart widths).
- Avoid arbitrary values (`w-[437px]`) unless no token fits; leave a comment if you use one.
- Every interactive element has a visible `focus-visible` state.
- Colour contrast meets WCAG AA in both light and dark mode.
- Icons: 20px (`size-5`) inline, 24px (`size-6`) in cards; decorative icons get `aria-hidden="true"`.
- Animations are subtle (`transition-colors`, `duration-150`) and respect `motion-reduce:`.
- Format money as `Rs. 1,234,567.00` via `lib/format.ts` (`Intl.NumberFormat('en-LK')`).

---

## 6. Responsiveness

Design mobile-first. Most users are on phones, so the 360px layout is the primary design.

### Breakpoints (Tailwind defaults)
| Prefix | Min width | Typical device |
|---|---|---|
| (none) | 0 | Phones, design from 360px |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

### Layout rules
- Page container: `mx-auto w-full max-w-6xl px-4 sm:px-6`. Blog articles: `max-w-3xl`.
- **Tool pages:** one column on mobile (inputs → result → content). From `lg`, show inputs and result side by side (`lg:grid lg:grid-cols-2 lg:gap-8`), with the result panel `lg:sticky lg:top-24`. Add a sticky ad sidebar only at `xl`.
- **Tool grids:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **Header:** the full nav and mega menu appear from `lg`; below that, a hamburger opens a full-height drawer with categories as collapsible sections and the search box at the top.
- **Tables** (breakdowns, amortisation schedules): wrap in `overflow-x-auto` so the page itself never scrolls sideways. On mobile, consider a stacked card view for tables with more than 4 columns.
- **Text areas** (converters, formatters): `min-h-48` on mobile, `md:min-h-72`; two-pane tools stack vertically below `md`.
- **File drop zones:** on mobile, a tap opens the file picker; don't rely on drag and drop.

### Touch and input
- Tap targets are at least 44×44px.
- Use the right input types: `inputmode="decimal"` for money and numbers, `type="email"` where relevant.
- No hover-only features. Anything shown on hover must also work on tap and focus.
- Font size on inputs is at least 16px, so iOS doesn't zoom in on focus.

### Testing
Check every page at 360px, 768px, 1024px and 1440px. No horizontal page scroll, no overlapping elements and no cut-off text at any width.

---

## 7. SEO Rules (non-negotiable)

### Every page
Use `<SEO />` in the layout with:
- **Title:** unique, ≤ 60 characters, main keyword near the start, ending in `| ToolKade`
  - Tool: `Vehicle Import Duty Calculator Sri Lanka 2026 | ToolKade`
  - Blog: `How Vehicle Import Duty Is Calculated in Sri Lanka | ToolKade`
- **Meta description:** unique, 120–155 characters, says what the user gets, includes the keyword naturally
- **Canonical:** absolute URL with a trailing slash and no query parameters
- **Open Graph and Twitter:** `og:title`, `og:description`, `og:url`, `og:image` (1200×630), `og:type` (`website` or `article`), `twitter:card=summary_large_image`
- `<html lang="en">` (or `si`/`ta` on localised pages later)
- `noindex` only for 404, drafts and utility pages

### Structured data (JSON-LD via `schema.ts`)
| Page | Schema |
|---|---|
| Home | `WebSite` (with `SearchAction`) + `Organization` |
| Tool page | `WebApplication` (`applicationCategory`, `operatingSystem: "Any"`, `offers.price: 0`) + `FAQPage` + `BreadcrumbList` |
| Category page | `CollectionPage` + `BreadcrumbList` |
| Blog post | `BlogPosting` (headline, dates, author, image) + `BreadcrumbList` (+ `FAQPage` if it has FAQs) |

FAQs shown on the page must match the `FAQPage` JSON-LD exactly; both come from the same data.

### Content and structure
- Exactly one `<h1>` per page, containing the main keyword. No skipped heading levels.
- Tool pages include, below the tool: a short intro, "How to use", "How it works" (the formula or method), 4–6 FAQs, related tools and the related blog post. Aim for 300+ words of useful text so the page isn't thin.
- Visible breadcrumbs on every page except the home page.
- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`.

### Internal linking
- Tool → its blog post; blog post → its tool (at the top and the end).
- Each tool links to 3–4 related tools from `related`.
- Category pages link to every live tool in the category.
- Use descriptive anchor text ("calculate your APIT"), never "click here".

### Images
- Astro `<Image>` with descriptive `alt`, explicit `width`/`height`, WebP/AVIF.
- `loading="eager"` + `fetchpriority="high"` only for the LCP image; lazy-load the rest.
- Generate a unique OG image per tool and per blog post.

### Technical
- `@astrojs/sitemap` includes only live, non-draft pages, with `lastmod` from `updatedAt`.
- `robots.txt` allows everything and points to `/sitemap-index.xml`.
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms. Lighthouse mobile ≥ 95 in all categories.
- Reserve fixed height for `AdSlot` so ads never cause layout shift.
- Lazy-load heavy libraries with dynamic `import()` when the user starts an action, never on page load.
- No content that only appears after client-side rendering: titles, intros, how-to and FAQs are static HTML.

---

## 8. Blog Posts

Every tool has one companion post. Posts live in `src/content/blog/` as MDX.

### Frontmatter schema (enforced in `content/config.ts`)
```yaml
title: "How Vehicle Import Duty Is Calculated in Sri Lanka (2026 Guide)"   # ≤ 60 chars before " | ToolKade" ideally
description: "Step-by-step guide to vehicle import duty in Sri Lanka, with a worked example and a free calculator."  # 120–155 chars
tool: vehicle-import-duty-calculator     # must match a registry slug
category: sri-lanka
publishDate: 2026-10-20
updatedDate: 2026-10-20
author: "ToolKade Team"
heroImage: ./images/vehicle-duty.webp
heroAlt: "Imported cars waiting at a Sri Lankan port"
tags: ["vehicle import", "tax", "sri lanka"]
faqs:
  - q: "Question?"
    a: "Answer."
draft: true
```

### Structure
1. **Intro** (2–3 sentences): the problem and what the reader will learn. Link to the tool in the first paragraph.
2. **Main explanation** under H2s: how it works, step by step.
3. **Worked example** with real-looking numbers and a breakdown table.
4. **Tool call-to-action:** `<ToolCTA slug="..." />` component.
5. **Common mistakes or tips.**
6. **FAQ** (from frontmatter; rendered and added to JSON-LD).
7. **Conclusion** with a link back to the tool and 1–2 related tools.

### Writing rules
- 1,000–1,500 words. Plain, friendly English; short paragraphs; explain local terms (APIT, EPF, CIF).
- One main keyword per post, used in the title, the H1, the first paragraph, one H2 and the description. Write naturally; never stuff keywords.
- **Never invent figures, laws or tax rules.** Use the same rates data file as the tool and link to the official source. If something is uncertain, say so.
- Add a "Last updated" date and update the post when the rates change.
- AI-drafted posts must have `draft: true`. A human reviews, adds local examples and removes the flag before publishing.
- Slug: kebab-case, keyword-led, without the year (so the URL never goes stale); the year can go in the title.

---

## 9. Code Conventions

- TypeScript strict; no `any` without a comment explaining why.
- Components: PascalCase. Files and slugs: kebab-case.
- `logic.ts` is pure: no side effects, no `window`, no `Date.now()` unless passed in. Rates are passed in as parameters.
- Every `logic.ts` has tests covering normal cases, edge cases (0, negative, very large, empty) and at least one worked example from an official source.
- Use named exports, except for Astro/React page components.
- Accessibility: every input has a visible `<label>`; results areas use `aria-live="polite"`; everything works by keyboard.
- Prettier formatting; don't reformat files you didn't otherwise change.

---

## 10. Rates Data

```json
{
  "name": "Personal income tax (APIT) brackets",
  "source": "https://www.ird.gov.lk/...",
  "effectiveFrom": "2025-04-01",
  "lastVerified": "2026-10-01",
  "notes": "Monthly thresholds",
  "data": { }
}
```

- **Never invent or guess rates.** If you don't have an official figure, set `"data": null` with a `TODO`, make the UI show "Rates are being updated", and tell the human what needs verifying.
- Never put rates in components or `logic.ts`.
- Every rates-based tool renders `<RatesNotice>`: last-verified date, source link and an estimate disclaimer.

---

## 11. Ads and Privacy

- `AdSlot` renders nothing unless `PUBLIC_ADS_ENABLED=true`.
- Never place an ad between a tool's inputs and its result.
- No tracking scripts load before consent once the CMP is installed.
- The Privacy Policy states that files are processed in the browser and never uploaded.

---

## 12. Definition of Done

- [ ] `npm run check`, `npm run test` and `npm run build` pass
- [ ] Appears correctly in the menu, category page, search and sitemap
- [ ] SEO tags and JSON-LD present and valid
- [ ] Works at 360px, 768px, 1024px and 1440px, and with a keyboard, in light and dark mode
- [ ] No console errors
- [ ] Summary to the human: what changed, new deps, and any rates or facts that need verification

## 13. Do Not

- Upload or send user data or files to any server.
- Hardcode tool lists or rates.
- Invent official figures, laws or tax rules.
- Remove or weaken tests to make a build pass.
- Change live URL slugs without a 301 in `public/_redirects`.
- Use raw hex colours or one-off styles instead of the design tokens.

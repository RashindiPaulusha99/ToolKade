# ToolKade — Project Plan

> **ToolKade** ("kade" = shop): a free online tools website with Sri Lanka-focused calculators plus everyday image, PDF, developer and text tools.
> Domain ideas: `toolkade.lk` (preferred for local SEO), with `toolkade.com` as a backup. Check availability before you commit to the name.
> Tagline: *Free, fast tools. Everything runs in your browser.*

---

## 1. Goals

1. Rank on Google for high-intent searches ("vehicle import duty calculator sri lanka", "apit calculator", "unicode to fm abhaya").
2. Earn through AdSense first, then add premium features later.
3. Make the architecture scalable, so that adding a new tool takes about an hour instead of a day.
4. Process files in the browser (privacy-friendly, with no server costs).

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** (static output) | Ships zero JS by default, which suits SEO and Core Web Vitals |
| Interactive tools | **React islands** (`client:visible`) | Lets you reuse your React skills; JS loads only where a tool needs it |
| Styling | **Tailwind CSS** | Fast, consistent, small CSS |
| Blog | **Astro Content Collections + MDX** | Type-safe frontmatter; MDX can embed the tool inside a post |
| Tests | **Vitest** | Unit tests for every calculation |
| Hosting | **Cloudflare Pages** (free) or GitHub Pages | Global CDN, free SSL, automatic deploys from GitHub |
| Analytics | Google Search Console + GA4 (or Plausible) | Track rankings and traffic |
| Ads | Google AdSense (Phase 4) + a Consent Mode v2 CMP | Monetisation |

Client-side libraries (only where needed): `pdf-lib` and `pdfjs-dist` (PDF), `browser-image-compression` (images), `jszip` (batch downloads), `jspdf` (invoice export).

## 3. Site map and navigation

**Top navigation**
- **Home**
- **Tools ▾** (mega menu, grouped by category)
  - 🇱🇰 Sri Lanka Calculators
  - 🖼️ Image Tools
  - 📄 PDF Tools
  - 💻 Developer Tools
  - ✍️ Text Tools
  - 🧾 Business Tools
- **Blog**
- **About**
- **Contact**
- A search box that filters tools instantly

**Footer:** Privacy Policy · Terms of Use · Disclaimer · Cookie Policy · Sitemap · Contact · category links

> AdSense approval requires About, Contact, and Privacy Policy pages. Build them in Phase 0.

**URL structure** (lowercase, hyphenated, trailing slash):
```
/                                   Home
/tools/                             All tools
/tools/sri-lanka/                   Category page
/tools/vehicle-import-duty-calculator/   Tool page
/blog/                              Blog index
/blog/how-vehicle-import-duty-is-calculated-in-sri-lanka/   Blog post
/about/  /contact/  /privacy-policy/  /terms/  /disclaimer/
```

## 4. Tool list and phases

### Phase 0: Foundation (week 1)
- Astro, Tailwind, React and MDX setup; base layout; header/mega menu; footer
- `<SEO />` component, JSON-LD helpers, sitemap, robots.txt, 404 page
- **Tool registry** (`src/data/tools.ts`), the single source of truth that drives the nav, category pages, search, sitemap and "related tools"
- Reusable `ToolLayout` (title, intro, the tool, how-to, FAQ, related tools, related blog post, ad slots)
- Legal pages: About, Contact, Privacy, Terms, Disclaimer
- Deploy to Cloudflare Pages and connect Search Console

### Phase 1: Launch set (weeks 2–3) — 8 tools + 8 blog posts
| # | Tool | Category |
|---|---|---|
| 1 | Vehicle Import Duty Calculator | Sri Lanka |
| 2 | Salary & APIT Calculator (EPF/ETF) | Sri Lanka |
| 3 | Sinhala Unicode ↔ FM Abhaya Converter | Sri Lanka |
| 4 | Loan / Leasing EMI Calculator | Sri Lanka |
| 5 | Electricity Bill Calculator (CEB/LECO) | Sri Lanka |
| 6 | Image Compressor | Image |
| 7 | JSON Formatter & Validator | Developer |
| 8 | Word & Character Counter | Text |

### Phase 2: Expand (weeks 4–6)
- Sri Lanka: A/L Z-Score Cutoff Finder, University GPA Calculator, Avurudu Nekath Times
- Image: Image Resizer, Passport Photo Maker
- PDF: Merge PDF, Split PDF, Compress PDF
- Developer: Regex Tester, JWT Decoder, Base64 Encoder/Decoder, Cron Expression Builder
- Text: Case Converter, Lorem Ipsum Generator

### Phase 3: Advanced (weeks 7–9)
- Background Remover (client-side ML model; check the library licence first)
- PDF to Word (hard to do well in the browser; may need a serverless function on AWS Lambda)
- Invoice & Receipt Generator (LKR support, PDF export)
- Rent & Service Charge Calculator
- Clothing Size Chart Converter

### Phase 4: Monetise (once you have ~25+ quality pages and steady traffic)
- Apply for AdSense; add a Consent Mode v2 CMP
- Ad slots: below the tool result, in-article in blog posts, a sticky sidebar on desktop. Never place an ad between the input and the result.
- Later: a "Pro" tier (ad-free, batch processing, saved history)

## 5. Data that changes (important)

Tax brackets, import duty rates, CEB tariffs, Z-score cutoffs and Nekath times **change every year or more often**.
- Store them in `src/data/rates/*.json`, never in component code.
- Each file includes `source` (the official URL), `effectiveFrom` and `lastVerified`.
- Show "Rates last verified: <date> · Source" on every calculator page.
- Add a disclaimer that results are estimates and users should confirm with the official authority.
- Review each file monthly. This keeps the site trustworthy, which helps both users and rankings.

## 6. SEO checklist (every page)

- Unique `<title>` (≤ 60 chars) and meta description (≤ 155 chars) built around the target keyword
- One `<h1>`, a logical H2/H3 structure
- Canonical URL, Open Graph and Twitter tags, plus an OG image (auto-generate one per tool)
- JSON-LD:
  - Home: `WebSite` (with `SearchAction`) + `Organization`
  - Tool pages: `WebApplication` + `FAQPage` + `BreadcrumbList`
  - Blog posts: `BlogPosting` + `BreadcrumbList` (+ `FAQPage` if the post has FAQs)
- Visible breadcrumbs
- Internal links: each tool page links to its blog post and vice versa, plus 3–4 related tools
- Images: `<Image>` component, WebP/AVIF, `alt` text, width/height set
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms; reserve space for ad slots to avoid layout shift
- `sitemap-index.xml` + `robots.txt`; submit the sitemap in Search Console
- Later: Sinhala versions of the Sri Lanka tools under `/si/` with `hreflang`

## 7. Blog strategy (one post per tool)

- 1,000–1,500 words, written to answer the question behind the search, e.g. "How is vehicle import duty calculated in Sri Lanka?"
- Structure: the problem → how it works (with a worked example) → embedded tool or call-to-action button → common mistakes → FAQ → link to the tool
- Frontmatter includes `tool` (slug) so the tool and post link to each other automatically
- Write the drafts with AI if you like, **but edit them yourself** and add real local examples. Google and AdSense reject thin or generic AI content.

## 8. Launch checklist

- [ ] All Phase 1 tools pass unit tests and manual checks against official examples
- [ ] Lighthouse ≥ 95 for Performance, SEO, Accessibility and Best Practices on mobile
- [ ] Legal pages are live, and the contact form works
- [ ] Search Console verified and the sitemap submitted
- [ ] The site works on a cheap Android phone over slow 3G

## 9. Files in this package

- `PLAN.md` — this file
- `AGENTS.md` — standing rules for any AI coding agent working in the repo (put it at the repo root)
- `BUILD_PROMPT.md` — the prompt to start the build, phase by phase

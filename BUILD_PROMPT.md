# Build Prompt — ToolKade

Use these prompts in order with an AI coding agent (for example Claude Code) in a fresh repo. Put `AGENTS.md` and `PLAN.md` at the repo root first. Run **one prompt per session or phase**, then review, test and commit before moving on.

---

## Prompt 1: Foundation (Phase 0)

```
You are building "ToolKade", a static, SEO-first online tools website. Read AGENTS.md and PLAN.md in the repo root first and follow them strictly.

Task: set up the foundation only (Phase 0). Do not build any tools yet.

1. Scaffold an Astro 5 project (static output) with TypeScript strict, React, Tailwind CSS, MDX, @astrojs/sitemap, Vitest, ESLint and Prettier. Add the npm scripts listed in AGENTS.md.
2. Create the folder structure exactly as described in AGENTS.md.
3. Build src/data/categories.ts (sri-lanka, image, pdf, developer, text, business) and src/data/tools.ts with the ToolMeta interface. Add registry entries for all Phase 1 tools with status "coming-soon".
4. Layouts and components:
   - BaseLayout with <SEO />, skip-to-content link, Header, Footer
   - Header: logo "ToolKade", nav (Home, Tools mega menu grouped by category, Blog, About, Contact), and a tool search box that filters the registry client-side. Make it mobile-friendly with a hamburger menu.
   - Footer: category links, Privacy Policy, Terms, Disclaimer, Cookie Policy, Contact, copyright
   - Breadcrumbs component
   - SEO.astro + schema.ts with JSON-LD builders for WebSite, Organization, WebApplication, FAQPage, BreadcrumbList, BlogPosting
   - ToolLayout: H1, short intro, tool slot, RatesNotice (optional), How to use, FAQ (rendered + FAQPage JSON-LD from the same data), Related tools, Related blog post, AdSlot placeholders (hidden unless PUBLIC_ADS_ENABLED=true)
   - BlogLayout with author, dates, reading time, table of contents, link to the related tool
5. Pages: Home (hero, search, category cards, popular tools, latest posts), /tools/, /tools/[category]/, /blog/, /blog/[...slug]/, About, Contact (a form using a third-party form endpoint as a placeholder), Privacy Policy (state that files are processed in the browser and never uploaded), Terms, Disclaimer, Cookie Policy, and 404.
6. Set up the blog content collection schema exactly as in AGENTS.md (including the `tool`, `faqs` and `draft` fields).
7. Add robots.txt, sitemap, a default OG image, a favicon and the site URL config (https://toolkade.lk).
8. Design: clean, modern, trustworthy. Light theme with a dark-mode toggle. Brand colour: deep teal with a warm accent. Use system font stack or one Google Font (Inter or similar). Mobile-first.
9. Add a GitHub Actions or Cloudflare Pages config so pushes to main deploy.

When finished: run check, test and build; fix any errors; then give me a short summary of the structure and anything I need to set up manually (domain, form endpoint, Search Console).
```

---

## Prompt 2: Phase 1 tools (run one tool per session, in this order)

Replace the placeholders in `{braces}` for each tool:

```
Read AGENTS.md. Build the tool "{TOOL NAME}" (slug: {tool-slug}, category: {category}) following the "How to add a new tool" checklist in AGENTS.md exactly.

Requirements:
{TOOL-SPECIFIC REQUIREMENTS — see below}

Rules:
- All calculation logic lives in logic.ts as pure typed functions, with thorough Vitest tests.
- If the tool needs official rates, create the rates JSON with source, effectiveFrom and lastVerified. If you are not certain of the current official figures, do NOT guess. Set data to null, mark it TODO, and list exactly what I need to verify and where.
- Fill content.ts with an intro, how-to steps and 5 FAQs.
- Write the companion blog post as src/content/blog/{blog-slug}.mdx (draft: true), 1,000–1,500 words, with a worked example, common mistakes and an FAQ section, and link it to the tool.
- Set the registry status to "live".
- Run check, test and build, then summarise what you did and what I must verify.
```

### Tool-specific requirements to paste in

**1. Vehicle Import Duty Calculator** (`vehicle-import-duty-calculator`, sri-lanka)
> Inputs: vehicle type (car, SUV, van, EV, hybrid), fuel type, engine capacity (cc) or motor power (kW) for EVs, year of manufacture, CIF value in JPY/USD with an exchange-rate field (editable, with a note to use the current CBSL rate). Output: a breakdown of each duty and tax component, the total payable in LKR, and the estimated landed cost. Show a clear breakdown table and a Copy summary button. All rates come from `rates/vehicle-duty.json`.

**2. Salary & APIT Calculator** (`salary-apit-calculator`, sri-lanka)
> Inputs: monthly gross salary, allowances, monthly/annual toggle. Output: employee EPF (8%), employer EPF (12%), ETF (3%), APIT per the current tax brackets, and net take-home pay, with a per-bracket breakdown table. Brackets come from `rates/apit.json`. Add a "compare two salaries" mode.

**3. Sinhala Unicode ↔ FM Abhaya Converter** (`sinhala-unicode-converter`, sri-lanka)
> Two text areas with a direction toggle (Unicode → FM Abhaya, FM Abhaya → Unicode). Convert as the user types. Copy and Clear buttons. Character mapping lives in a separate mapping file with tests covering vowel signs, conjuncts (yansaya, rakaransaya, repaya) and common words. Show the FM Abhaya output in the FM Abhaya font if available, with a note to install it.

**4. Loan / Leasing EMI Calculator** (`loan-emi-calculator`, sri-lanka)
> Inputs: amount, annual interest rate, tenure (months/years), flat-rate vs reducing-balance toggle (leasing in Sri Lanka often quotes flat rates). Output: monthly instalment, total interest, total payable, an amortisation table (collapsible) and a simple chart. Explain the flat vs reducing difference in the content.

**5. Electricity Bill Calculator** (`electricity-bill-calculator`, sri-lanka)
> Inputs: units consumed (kWh), provider (CEB/LECO), category (domestic first). Output: block-by-block charge breakdown, fixed charge and total. Tariff blocks come from `rates/electricity-tariff.json`. Add a reverse mode that estimates units from a bill amount.

**6. Image Compressor** (`image-compressor`, image)
> Drag-and-drop multiple JPG/PNG/WebP images, a quality slider, an optional max width, and output format selection. Show before/after size and the percentage saved per file. Download individually or all as a ZIP. Everything runs in the browser; lazy-load the libraries when the user adds files.

**7. JSON Formatter & Validator** (`json-formatter`, developer)
> Paste JSON → format (2/4 spaces/tab), minify, validate with the line and column of the error, sort keys, and show a collapsible tree view. Copy and download buttons. Handle large inputs without freezing the UI.

**8. Word & Character Counter** (`word-counter`, text)
> Live counts: words, characters (with and without spaces), sentences, paragraphs, reading time and speaking time. Works correctly with Sinhala and Tamil text. Show the top keyword frequency list.

---

## Prompt 3: SEO and quality audit (after Phase 1)

```
Read AGENTS.md. Audit the whole site for SEO, performance and accessibility:
- Every page: unique title and description within the length limits, canonical URL, OG tags, valid JSON-LD, one H1.
- Internal links: each tool ↔ its blog post, related tools present.
- Sitemap includes all live pages and excludes drafts and coming-soon tools.
- Run Lighthouse (mobile) on the home page, one tool page and one blog post; fix anything below 95.
- Check 360px layouts and keyboard navigation.
Produce a short report of what you fixed and anything left for me.
```

---

## Prompt 4: Later phases

Reuse Prompt 2 for every Phase 2 and Phase 3 tool listed in PLAN.md. For heavy tools (Background Remover, PDF to Word), start with:

```
Before writing code, propose 2–3 implementation options for {TOOL} (libraries, client-side vs serverless, bundle size, licence, quality). Wait for my choice.
```

---

### Tips
- Commit after each tool, so you can roll back easily.
- Verify every rate file against the official source yourself before setting a tool live. The agent is told not to guess, but you are responsible for accuracy.
- Edit every AI-drafted blog post, add your own local examples, then remove `draft: true`.

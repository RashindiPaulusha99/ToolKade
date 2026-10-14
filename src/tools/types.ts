export interface Faq {
  q: string;
  a: string;
}

/** Static, server-rendered text for a tool page. Lives in src/tools/<slug>/content.ts. */
export interface ToolContent {
  /** 1–2 sentence intro under the H1, containing the main keyword. */
  intro: string;
  /** Ordered "How to use" steps. */
  howTo: string[];
  /** "How it works" paragraphs (formula or method). */
  howItWorks: string[];
  /** 4–6 FAQs. Rendered on the page and emitted as FAQPage JSON-LD from this same data. */
  faqs: Faq[];
}

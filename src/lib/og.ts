// A type alias (not an interface) so it satisfies Astro's index-signature `Props` in getStaticPaths.
export type OgImageInput = {
  title: string;
  /** Small label above the title, e.g. the category. */
  eyebrow?: string;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Greedy word wrap by character count (good enough for a bold sans at a fixed size). */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s.,:;-]+$/, '')}…`;
    return kept;
  }
  return lines;
}

/** 1200×630 Open Graph image as SVG, using the brand tokens from global.css. */
export function buildOgSvg({ title, eyebrow }: OgImageInput): string {
  const lines = wrapText(title, 26, 3);
  const fontSize = lines.length === 3 ? 64 : 72;
  const lineHeight = Math.round(fontSize * 1.18);
  const startY = 330 - ((lines.length - 1) * lineHeight) / 2;
  const font = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d564f"/>
      <stop offset="1" stop-color="#082f2c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="80" r="220" fill="#14857a" opacity="0.35"/>
  <circle cx="1150" cy="560" r="120" fill="#f5a524" opacity="0.18"/>
  <rect x="80" y="80" width="64" height="64" rx="16" fill="#f5a524"/>
  <text x="112" y="126" text-anchor="middle" font-family="${font}" font-size="36" font-weight="800" fill="#082f2c">T</text>
  <text x="164" y="124" font-family="${font}" font-size="36" font-weight="700" fill="#ffffff">Tool<tspan fill="#f8c56a">Kade</tspan></text>
  ${
    eyebrow
      ? `<text x="80" y="${startY - fontSize - 10}" font-family="${font}" font-size="28" font-weight="600" fill="#a9e2d9" letter-spacing="2">${escapeXml(eyebrow.toUpperCase())}</text>`
      : ''
  }
  ${lines
    .map(
      (line, i) =>
        `<text x="80" y="${startY + i * lineHeight}" font-family="${font}" font-size="${fontSize}" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  <text x="80" y="550" font-family="${font}" font-size="28" fill="#d7f2ed">Free, fast tools. Everything runs in your browser.</text>
  <text x="1120" y="550" text-anchor="end" font-family="${font}" font-size="28" font-weight="600" fill="#f8c56a">toolkade.lk</text>
</svg>`;
}

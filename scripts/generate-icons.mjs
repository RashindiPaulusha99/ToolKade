// Regenerates PNG icons from public/favicon.svg. Run after changing the logo:
//   node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url));

await sharp(svg, { density: 600 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(svg, { density: 600 }).resize(512, 512).png().toFile('public/icon-512.png');

console.log('Icons written to public/');

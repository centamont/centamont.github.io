// Prints the one-page developer brief in each language, each from its source in _src/brief/:
// developer-brief.html to developer-brief.pdf beside index.html, desarrolladores.html to es/centamont-desarrolladores.pdf,
// incorporadoras.html to pt/centamont-incorporadoras.pdf.
// Run it from the repo root after changing a brief (or the developers page words it follows): node tools/brief.mjs
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const BRIEFS = [
  ['developer-brief.html', 'developer-brief.pdf'],
  ['desarrolladores.html', 'es/centamont-desarrolladores.pdf'],
  ['incorporadoras.html', 'pt/centamont-incorporadoras.pdf'],
];
// (a local run uses the preinstalled Chromium where there is one, as playwright.config.js does)
const local = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(local) ? { executablePath: local } : {});
const page = await browser.newPage();
for (const [src, out] of BRIEFS) {
  await page.goto(pathToFileURL(resolve(ROOT, '_src/brief', src)).href);
  await page.evaluate(() => document.fonts.ready);
  const pages = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight / (11 * 96)));
  if (pages > 1) { console.error(src + ' runs to ' + pages + ' pages; it must fit on one.'); process.exit(1); }
  await page.pdf({ path: resolve(ROOT, out), format: 'Letter', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  console.log(out);
}
await browser.close();

// Prints the one-page developer brief, _src/brief/developer-brief.html, to developer-brief.pdf beside index.html.
// Run it from the repo root after changing the brief (or the developers page words it follows): node tools/brief.mjs
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
// (a local run uses the preinstalled Chromium where there is one, as playwright.config.js does)
const local = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(local) ? { executablePath: local } : {});
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(ROOT, '_src/brief/developer-brief.html')).href);
await page.evaluate(() => document.fonts.ready);
const pages = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight / (11 * 96)));
if (pages > 1) { console.error('The brief runs to ' + pages + ' pages; it must fit on one.'); process.exit(1); }
await page.pdf({ path: resolve(ROOT, 'developer-brief.pdf'), format: 'Letter', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
await browser.close();
console.log('developer-brief.pdf');

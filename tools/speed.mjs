// Times the main pages as a phone loads them, with Lighthouse's own phone (a mid-range handset on a slow 4G line), and
// holds each to its budget: blocking time, layout shift, and full marks for accessibility, best practices and search.
// The "Phone speed" workflow runs it on every pull request and weekly; it is not a required check, so a page over its
// budget is flagged on the pull request without blocking the merge.
// Run from the repo root with the site served on 4173: node tools/speed.mjs (CHROME_PATH names the browser if needed)
// The server here sends files uncompressed, where GitHub Pages compresses them, so load times read slower than on the
// live site and only the blocking time, which is the phone's own work, is held to a budget; load times are printed.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.SPEED_BASE || 'http://127.0.0.1:4173';
// Total blocking time allowed, in milliseconds. The three home pages run the tower drawing and the sales curve, so
// theirs is set just above what they took on 24 October 2026; every other page keeps to a quarter second.
const PAGES = [
  ['/', 1300], ['/es/', 1300], ['/pt/', 1300],
  ['/developers.html', 250], ['/markets.html', 250], ['/south-florida.html', 250],
  ['/report.html', 250], ['/journal/reading-the-pace-of-sales.html', 250],
];
const CLS = 0.1;
const dir = mkdtempSync(join(tmpdir(), 'speed-'));
const rows = [], over = [];

// Blocking time on the tower pages swings by half a second from one load to the next, so each page is loaded three
// times and the run with the median blocking time is the one read.
const RUNS = 3;
const run = (path, i) => {
  const out = join(dir, `${path.replace(/\W+/g, '_')}-${i}.json`);
  execFileSync('npx', ['--yes', 'lighthouse@13.5.0', BASE + path, '--quiet', '--output=json', `--output-path=${out}`,
    '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-sandbox'], { stdio: 'inherit' });
  return JSON.parse(readFileSync(out, 'utf8'));
};

for (const [path, tbtMax] of PAGES) {
  const runs = Array.from({ length: RUNS }, (_, i) => run(path, i))
    .sort((x, y) => x.audits['total-blocking-time'].numericValue - y.audits['total-blocking-time'].numericValue);
  const r = runs[RUNS >> 1];
  const a = r.audits, c = r.categories;
  const tbt = Math.round(a['total-blocking-time'].numericValue), cls = a['cumulative-layout-shift'].numericValue;
  const lcp = (a['largest-contentful-paint'].numericValue / 1000).toFixed(1);
  const marks = ['accessibility', 'best-practices', 'seo'].map((k) => Math.round(c[k].score * 100));
  const fails = [];
  if (tbt > tbtMax) fails.push(`blocking ${tbt} ms, budget ${tbtMax}`);
  if (cls > CLS) fails.push(`layout shift ${cls.toFixed(3)}, budget ${CLS}`);
  ['accessibility', 'best practices', 'search'].forEach((k, i) => marks[i] < 100 && fails.push(`${k} ${marks[i]}`));
  if (fails.length) over.push(`${path}: ${fails.join(', ')}`);
  rows.push(`| ${path} | ${tbt} / ${tbtMax} | ${cls.toFixed(3)} | ${lcp} s | ${marks.join(' · ')} | ${fails.length ? 'over' : 'ok'} |`);
  console.log(`${path}: blocking ${tbt} ms (budget ${tbtMax}), shift ${cls.toFixed(3)}, largest paint ${lcp} s, marks ${marks.join('/')}`);
}

const table = ['| Page | Blocking ms / budget | Layout shift | Largest paint | Access · practice · search | |', '|---|---|---|---|---|---|', ...rows].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Phone speed\n\n${table}\n`);
if (over.length) { console.error('Over budget:\n' + over.join('\n')); process.exit(1); }

// Writes the plates that close the home's developer story: the finished tower as it will look, one for each of the four
// hero stills (hero/day, morning, gold, night), photographed from the hero itself under that still with its sky, and with
// the drawing's ruler, names, sun path and guides left out. Each is a portrait crop round the tower, 395 x 836 CSS px of
// the 1440 x 900 hero at three times, written as hero/plate-NAME.webp (1185 px wide) and hero/plate-NAME-half.webp.
// Run from the repo root after the stills change, then python3 tools/rights.py: node tools/plates.mjs
import { chromium } from '@playwright/test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
// each still at an hour its sun suits, in Miami on the day the plates were first made (UTC)
const HOURS = { morning: '2026-10-24T11:50:00Z', day: '2026-10-24T15:00:00Z', gold: '2026-10-24T22:20:00Z', night: '2026-10-25T01:00:00Z' };
const server = spawn('python3', ['-m', 'http.server', '4174', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const local = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ ...(existsSync(local) ? { executablePath: local } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const tmp = mkdtempSync(join(tmpdir(), 'plates-'));
try {
  for (const [name, hour] of Object.entries(HOURS)) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3, colorScheme: 'dark', reducedMotion: 'reduce', bypassCSP: true });
    const page = await ctx.newPage();
    await page.addInitScript(([name, hour]) => {
      sessionStorage.setItem('cm-intro', '1'); window.__cmStill = name; window.__cmForce3D = true;
      const T = new Date(hour).getTime(), D = Date, t0 = D.now();
      window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T + (D.now() - t0)])); } static now() { return T + (D.now() - t0); } };
      // (the hero's drawing, kept as it is made, so its ruler, names, sun path and guides can be put away)
      let M; Object.defineProperty(window, 'CentamontModel', { configurable: true, get: () => M, set(v) { if (!v) { M = v; return; } class W extends v { constructor(...a) { super(...a); (window.__cmModels ||= []).push(this); } } Object.assign(W, v); W.still = v.still; W.stills = v.stills; W.geo = v.geo; M = W; } });
    }, [name, hour]);
    await page.goto('http://127.0.0.1:4174/index.html');
    await page.waitForFunction(() => document.getElementById('heroModel').dataset.still, null, { timeout: 30000 });
    await page.evaluate(() => { const m = window.__cmModels[0]; Object.assign(m.o, { labels: false, sunPath: false, guides: false }); m.lens = null; m.touch(); });
    await page.addStyleTag({ content: '.hero .wrap,.hero .coords,header.site{visibility:hidden!important}' });
    await page.waitForTimeout(1500);
    const png = join(tmp, name + '.png');
    await page.screenshot({ path: png, clip: { x: 790, y: 64, width: 395, height: 836 } });
    execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB")\nim.save(sys.argv[2],quality=82,method=6)\nim.resize((im.width//2,im.height//2),Image.LANCZOS).save(sys.argv[3],quality=82,method=6)', png, resolve(ROOT, 'hero/plate-' + name + '.webp'), resolve(ROOT, 'hero/plate-' + name + '-half.webp')]);
    console.log('hero/plate-' + name + '.webp');
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); rmSync(tmp, { recursive: true, force: true }); }

// Screenshots of every tab in both languages → docs/screenshots/{en,zh}-NN-<tab>.png
// Requires Playwright with Chromium (PLAYWRIGHT_BROWSERS_PATH or a local install).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
  try { playwright = require(p); break; } catch (e) { /* try next */ }
}
if (!playwright) { console.error('Playwright not found'); process.exit(1); }

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'docs/screenshots');
mkdirSync(out, { recursive: true });
const url = pathToFileURL(resolve(root, 'app/index.html')).href;

const browser = await playwright.chromium.launch();
for (const lang of ['en', 'zh']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate((l) => {
    localStorage.setItem('bcrcl-state-v1', JSON.stringify({ lang: l, mode: 'instructor' }));
  }, lang);
  await page.reload();
  const tabs = await page.$$eval('[role=tab]', (els) => els.map((e) => e.id));
  for (let i = 0; i < tabs.length; i += 1) {
    await page.click(`#${tabs[i]}`);
    // Reveal everything on the tab so the screenshot shows the model answers.
    for (let k = 0; k < 20; k += 1) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const name = `${lang}-${String(i).padStart(2, '0')}-${tabs[i].replace('tab-', '')}.png`;
    await page.screenshot({ path: resolve(out, name), fullPage: true });
    console.log(name);
  }
  // Presenter layout (projector) example.
  if (lang === 'en') {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.click('#tab-repricing');
    await page.keyboard.press('p');
    await page.waitForTimeout(150);
    await page.screenshot({ path: resolve(out, 'en-presenter-1920x1080.png') });
    await page.keyboard.press('p');
  }
  await ctx.close();
}
await browser.close();

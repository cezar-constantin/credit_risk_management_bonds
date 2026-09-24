// Font-size audit: renders every tab (EN and 中文, normal and presenter layout) and lists the distinct
// rendered font sizes of all visible text, including SVG chart text (scaled to screen pixels).
// Usage: node tests/e2e/font-audit.mjs [app/focus.html] [maxSizes]
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { pw = require(p); break; } catch (e) { /* next */ } }
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const file = process.argv[2] || 'app/focus.html';
const max = Number(process.argv[3] || 3);
const url = pathToFileURL(resolve(root, file)).href;

const browser = await pw.chromium.launch();
let worst = 0;
for (const lang of ['en', 'zh']) {
  for (const presenter of [false, true]) {
    const page = await browser.newPage({ viewport: presenter ? { width: 1920, height: 1080 } : { width: 1440, height: 900 } });
    await page.goto(url);
    await page.evaluate(([l, p]) => localStorage.setItem('bcrcl-state-v1', JSON.stringify({ lang: l, mode: p ? 'instructor' : 'participant', presenter: p })), [lang, presenter]);
    await page.reload();
    const tabs = await page.$$eval('[role=tab]', (els) => els.map((e) => e.id));
    const sizes = new Map();
    for (const id of tabs) {
      await page.click(`#${id}`);
      // Open every "Show workings" and reveal every answer so hidden text is audited too.
      await page.$$eval('details', (ds) => ds.forEach((d) => { d.open = true; }));
      await page.$$eval('.btn-reveal:not([disabled])', (bs) => bs.forEach((b) => b.click()));
      const found = await page.evaluate(() => {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent.trim()) continue;
          const el = n.parentElement;
          if (!el || el.closest('script,style,noscript,.sr-only,option,title')) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          let px = parseFloat(cs.fontSize);
          const svg = el.closest('svg');
          if (svg && svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) {
            px *= svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          }
          out.push([Math.round(px * 2) / 2, el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), n.textContent.trim().slice(0, 30)]);
        }
        return out;
      });
      found.forEach(([px, sel, txt]) => { if (!sizes.has(px)) sizes.set(px, `${id}: ${sel} “${txt}”`); });
    }
    const list = [...sizes.keys()].sort((a, b) => a - b);
    worst = Math.max(worst, list.length);
    console.log(`${lang}${presenter ? ' presenter' : ''}: ${list.length} sizes → ${list.join(', ')} px`);
    if (list.length > max) list.forEach((px) => console.log(`   ${px}px e.g. ${sizes.get(px)}`));
    await page.close();
  }
}
await browser.close();
if (worst > max) { console.error(`FAIL: more than ${max} font sizes`); process.exit(1); }
console.log(`OK: at most ${max} font sizes in every language and layout`);

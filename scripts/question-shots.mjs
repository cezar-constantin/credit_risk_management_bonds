// Reachability + screenshots of every class question (update prompt §7):
// for each question in data/questions.json, in EN and 中文 and in participant and instructor mode,
// open the screen named by its `app` field, find its "Choose one" panel, reveal it and screenshot it
// into docs/questions/. Fails if any question is not reachable on its screen.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { pw = require(p); break; } catch (e) { /* next */ } }
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bank = resolve(root, 'data/questions.json');
if (!existsSync(bank)) { console.error('data/questions.json is missing — add the class question bank first.'); process.exit(1); }
const raw = JSON.parse(readFileSync(bank, 'utf8'));
const items = Array.isArray(raw) ? raw : raw.questions || raw.items || [];
const out = resolve(root, 'docs/questions');
mkdirSync(out, { recursive: true });

const browser = await pw.chromium.launch();
const missing = [];
for (const lang of ['en', 'zh']) {
  for (const mode of ['participant', 'instructor']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(pathToFileURL(resolve(root, 'app/index.html')).href);
    await page.evaluate(([l, m]) => localStorage.setItem('bcrcl-state-v1', JSON.stringify({ lang: l, mode: m, guided: true })), [lang, mode]);
    await page.reload();
    for (const q of items) {
      // The app resolves the screen; find the tab whose panel list contains this question.
      const tabs = await page.$$eval('[role=tab]', (els) => els.map((e) => e.id));
      let found = false;
      for (const id of tabs) {
        await page.click(`#${id}`);
        const panel = page.locator(`section.choose-panel[aria-label$=" ${q.id}"]`);
        if (await panel.count()) {
          const btn = panel.locator('button.btn-reveal');
          if (await btn.count()) await btn.click();
          await page.locator(`section.choose-panel[aria-label$=" ${q.id}"]`).screenshot({ path: resolve(out, `${lang}-${mode}-${q.id}.png`) });
          found = true;
          break;
        }
      }
      if (!found) missing.push(`${lang}/${mode}: ${q.id}`);
    }
    await page.close();
  }
}
await browser.close();
if (missing.length) { console.error(`Not reachable:\n  ${missing.join('\n  ')}`); process.exit(1); }
console.log(`${items.length} questions reachable and captured in EN/中文, participant/instructor → docs/questions/`);

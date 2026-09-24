// Browser interaction checks (run locally: node tests/e2e/interactions.mjs). Needs Playwright + Chromium.
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { pw = require(p); break; } catch (e) { /* next */ } }
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const url = pathToFileURL(resolve(root, process.argv[2] || 'app/index.html')).href;

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
const external = [];
page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) external.push(r.url()); });
await page.goto(url);
const text = async (sel) => (await page.textContent(sel)).replace(/\s+/g, ' ');

// Class defaults tie-out: every figure ties.
await page.click('#tab-position');
const summary = await text('#tabpanel');
assert.match(summary, /51 of 51 figures reproduced|(\d+) of \1 /, 'tie-out summary');
assert.ok(!summary.includes('✗'), 'no drift in class defaults');

// Instructor shortcuts: → reveals poll verdicts, R resets, P toggles presenter.
await page.click('#tab-home');
await page.click('text=Instructor');
await page.click('#tabpanel');
await page.keyboard.press('ArrowRight');
assert.ok((await text('#tabpanel')).includes('Wrong'), '→ reveals verdict A');
await page.keyboard.press('r');
assert.ok(!(await text('#tabpanel')).includes('Wrong'), 'R resets reveals');
await page.keyboard.press('p');
assert.equal(await page.getAttribute('html', 'data-presenter'), 'true', 'P enables presenter layout');
await page.keyboard.press('p');

// Tally: + increments.
await page.click('button[aria-label="Hand count for option A +1"]');
assert.equal(await page.inputValue('input[data-fkey="poll.counts.A"]'), '1');
assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-fkey')), 'poll.counts.A+', 'focus kept on tally button');

// Counterfactual drives the tiles.
await page.selectOption('#main ~ * select, .panel select', 'jul26').catch(() => {});
await page.click('#tab-timeline');
await page.click('.card:has-text("Counterfactuals (Jul 2026)") label:has-text("B · extension")');
assert.ok((await text('.tiles')).includes('900'), 'counterfactual B → spread 900 bp in the tiles');

// Free play recomputes; class defaults restore.
await page.click('#tab-position');
await page.click('.panel label:has-text("Free play")');
await page.fill('input[data-fkey="position.spread"]', '300');
await page.press('input[data-fkey="position.spread"]', 'Tab');
assert.ok((await text('#tabpanel')).includes('free play'), 'free play marks departures from the deck');
await page.click('.panel button:has-text("Reset to class values")');
assert.ok(!(await text('#tabpanel')).includes('✗'));

// Decision form: validation, JSON export.
await page.click('#tab-decision');
assert.ok((await text('#tabpanel')).includes('Incomplete'));
await page.selectOption('select[data-fkey="decision.form.action"]', 'reduce');
await page.fill('input[data-fkey="decision.form.sellShare"]', '50');
await page.press('input[data-fkey="decision.form.sellShare"]', 'Tab');
await page.fill('textarea[data-fkey="decision.form.rationale"]', 'Sale proceeds 91.32 vs expected hold value; liquidity need and Stage 2 capital cost.');
await page.fill('input[data-fkey="decision.form.owner"]', 'Head of credit investments');
await page.fill('input[data-fkey="decision.form.triggers.0.number"]', '800');
await page.fill('input[data-fkey="decision.form.triggers.0.date"]', '2026-09-15');
await page.fill('input[data-fkey="decision.form.triggers.0.consequence"]', 'Sell the remaining half within 5 days');
await page.fill('textarea[data-fkey="decision.form.escalation"]', 'Risk committee within 2 days; CRO decides');
await page.fill('textarea[data-fkey="decision.form.responseA"]', 'Hold the rest, review at 350 bp');
await page.fill('textarea[data-fkey="decision.form.responseB"]', 'Sell the rest before the bondholder meeting');
assert.ok((await text('#tabpanel')).includes('Complete — ready for committee'), 'form validates');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Export JSON")')]);
const saved = JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8'));
assert.equal(saved.form.action, 'reduce');
await page.click('.card:has-text("Replay the decision") label:has-text("B · extension")');
assert.ok((await text('#tabpanel')).includes('Sell the remaining half'), 'replay B fires the spread trigger');

// Language switch keeps state.
const before = await page.inputValue('input[data-fkey="decision.form.owner"]');
await page.selectOption('.topbar select', 'zh');
assert.equal(await page.getAttribute('html', 'lang'), 'zh-Hans');
assert.equal(await page.inputValue('input[data-fkey="decision.form.owner"]'), before, 'state survives a language switch');
await page.selectOption('.topbar select', 'en');

assert.deepEqual(external, [], 'no network requests');
assert.deepEqual(errors, [], 'no console errors');
console.log('interaction checks passed');
await browser.close();

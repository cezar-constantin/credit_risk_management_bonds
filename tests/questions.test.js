// Engine questions (update prompt §4.2): the engine must answer Q12, Q13, Q14, Q15, Q21, Q27, Q31
// at runtime, and the option it selects must equal the `answer` stored in data/questions.json.
// Also checks the Q17 quoted executable bid (94.35 = price at 6.70% with two years remaining).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { engineAnswers, selectOption, ENGINE_QUESTION_IDS } from '../engine/index.js';

const data = JSON.parse(readFileSync(new URL('../data/case.json', import.meta.url), 'utf8'));
const A = engineAnswers(data);
const r2 = (x) => Math.round(x * 100) / 100;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

test('Q12 — benchmark +30 bp and spread +30 bp on a 2.80-duration bullet are identical (−0.84 m each)', () => {
  assert.equal(r2(A.Q12.values.benchmark), -0.84);
  assert.equal(r2(A.Q12.values.spread), -0.84);
  assert.equal(r2(A.Q12.values.modifiedDuration), 2.8);
});

test('Q13 — decomposition at 15 Mar 2026: rates −0.57, spread −4.36 of −4.93', () => {
  assert.equal(r2(A.Q13.values.rates), -0.57);
  assert.equal(r2(A.Q13.values.spread), -4.36);
  assert.equal(r2(A.Q13.values.total), -4.93);
});

test('Q14 — holding period: gross −1.33, funded −3.33', () => {
  assert.equal(r2(A.Q14.values.gross), -1.33);
  assert.equal(r2(A.Q14.values.funded), -3.33);
});

test('Q15 — break-even default rate 210 bp ÷ 60% = 3.5%', () => {
  assert.equal(A.Q15.values.breakEvenPD.toFixed(4), '0.0350');
});

test('Q21 — cash cover 42 ÷ 98 = 0.43× (alarm)', () => {
  assert.equal(A.Q21.values.cashCover.toFixed(2), '0.43');
  assert.ok(A.Q21.values.cashCover < 1);
});

test('Q27 — Stage 2 charge 6.00 − 0.60 = 5.40 (distractors: 3.00 Stage 1, −6.41 FVTPL)', () => {
  assert.equal(r2(A.Q27.values.stage2Charge), 5.4);
  assert.equal(r2(A.Q27.values.stage1Charge), 3.0);
  assert.equal(r2(A.Q27.values.fvtpl), -6.41);
});

test('Q6 (= old Q31) — same-date break-even (91.32 − 89.91) ÷ (98.11 − 89.91) ≈ 17%', () => {
  assert.equal(Math.round(A.Q6.values.breakEven * 100), 17);
  assert.equal(A.Q6, A.Q31);
});

test('Q5 (new) — allowance 1.20 → 6.00; period charge −4.80', () => {
  assert.equal(r2(A.Q5.values.charge), -4.8);
});

test('Q17 — executable bid 94.37 = price at 6.70% with two years remaining', () => {
  assert.equal(r2(A.Q17bid.values.bid), 94.37);
});

test('option selection logic picks the option carrying the computed figure', () => {
  assert.equal(selectOption(A.Q14, ['+3.60 (coupon)', '−1.33 (gross)', '−3.33 (funded)']), 2);
  assert.equal(selectOption(A.Q13, ['RMB −0.57 m', 'RMB −4.36 m', 'All of it']), 1);
  assert.equal(selectOption(A.Q12, ['benchmark hurts more', 'spread hurts more', 'identical, −0.84 m each']), 2);
  assert.equal(selectOption(A.Q6, ['≈ 8%', '≈ 17%', '≈ 50%']), 1);
  assert.equal(selectOption(A.Q5, ['−6.41', '−4.80', '−3.60']), 1);
  assert.equal(selectOption(A.Q27, ['−6.41', '−5.40', '−4.80']), 1);
});

// ---- Against the class question bank ----------------------------------------------------------
const bankPath = new URL('../data/questions.json', import.meta.url);
const hasBank = existsSync(bankPath);

test('question bank: engine questions select the stored answer', { skip: hasBank ? false : 'data/questions.json not yet added' }, () => {
  const raw = JSON.parse(readFileSync(bankPath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.questions || raw.items || [];
  const byId = Object.fromEntries(items.map((q) => [q.id, q]));
  // v5 renumbering: the class tier uses Q3 (old Q12) and Q6 (old Q31); whichever ids the bank carries are checked.
  const ids = [...ENGINE_QUESTION_IDS, 'Q3', 'Q6'].filter((id) => byId[id] && byId[id].kind === 'engine');
  assert.ok(ids.length >= 7, `engine questions found: ${ids.join(', ')}`);
  for (const id of ids) {
    const q = byId[id];
    assert.equal(q.kind, 'engine', `${id} is an engine question`);
    const opts = (q.opts || []).map((o) => (typeof o === 'string' ? o : o.en ?? Object.values(o)[0]));
    const picked = selectOption(A[id], opts);
    assert.notEqual(picked, null, `${id}: the engine figure ${A[id].display} identifies exactly one option in ${JSON.stringify(opts)}`);
    assert.equal(picked, q.answer, `${id}: engine selects ${LETTERS[picked]}, bank says ${LETTERS[q.answer]}`);
    assert.equal(LETTERS[picked], A[id].expectedLetter, `${id}: expected ${A[id].expectedLetter}`);
  }
});

test('question bank: shape (v5: 31 items)', { skip: hasBank ? false : 'data/questions.json not yet added' }, () => {
  const raw = JSON.parse(readFileSync(bankPath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.questions || raw.items || [];
  assert.equal(items.length, 31);
  for (const q of items) for (const f of ['id', 'slide', 'kind', 'q', 'opts', 'app', 'tier']) assert.ok(q[f] != null, `${q.id} has ${f}`);
  assert.equal(new Set(items.map((q) => q.id)).size, items.length, 'ids are unique');
  // Class tier = the participant sheet: Q1–Q6 and the three committee votes.
  assert.deepEqual(items.filter((q) => q.tier === 'class').map((q) => q.id).sort(), ['D1', 'D2', 'D3', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6']);
  for (const q of items) {
    assert.ok(q.q.en && q.q.zh, `${q.id} is bilingual`);
    q.opts.forEach((o, i) => assert.ok(o.en && o.zh, `${q.id} option ${i} is bilingual`));
    if (q.kind === 'vote') assert.equal(q.answer, null, `${q.id}: votes have no stored answer`);
    else assert.ok(q.answer >= 0 && q.answer < q.opts.length, `${q.id}: answer is an option index`);
  }
});

test('question bank: every question routes to a screen that exists', { skip: hasBank ? false : 'data/questions.json not yet added' }, () => {
  const raw = JSON.parse(readFileSync(bankPath, 'utf8'));
  const tabs = ['home', 'position', 'mechanisms', 'bondsloans', 'repricing', 'spread', 'ratings', 'timeline', 'structure', 'portfolio', 'recognition', 'controls', 'decision', 'workout', 'answer', 'capital', 'glossary'];
  for (const q of raw.questions) assert.ok(tabs.includes(q.app), `${q.id} → ${q.app}`);
  const routed = new Set([...data.route, ...data.appendix].flatMap((r) => r.questions || []));
  for (const q of raw.questions) assert.ok(routed.has(q.id), `${q.id} is placed on the slide route`);
});

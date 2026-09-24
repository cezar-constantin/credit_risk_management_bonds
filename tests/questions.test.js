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

test('Q31 — break-even support probability (91.32 − 90.68) ÷ (98.53 − 90.68) ≈ 8%', () => {
  assert.equal(Math.round(A.Q31.values.breakEven * 100), 8);
});

test('Q17 — quoted executable bid 94.35 = price at 6.70% with two years remaining', () => {
  assert.ok(Math.abs(A.Q17bid.values.bid - 94.35) < 0.05, `bid ${A.Q17bid.values.bid}`);
});

test('option selection logic picks the option carrying the computed figure', () => {
  assert.equal(selectOption(A.Q14, ['+3.60 (coupon)', '−1.33 (gross)', '−3.33 (funded)']), 2);
  assert.equal(selectOption(A.Q13, ['rates −4.36, spread −0.57', 'rates −0.57, spread −4.36', 'rates −2.47, spread −2.46']), 1);
  assert.equal(selectOption(A.Q12, ['benchmark hurts more', 'spread hurts more', 'identical, −0.84 m each']), 2);
  assert.equal(selectOption(A.Q31, ['≈ 8%', '≈ 50%', '≈ 92%']), 0);
});

// ---- Against the class question bank ----------------------------------------------------------
const bankPath = new URL('../data/questions.json', import.meta.url);
const hasBank = existsSync(bankPath);

test('question bank: engine questions select the stored answer', { skip: hasBank ? false : 'data/questions.json not yet added (copy question_bank.json unchanged)' }, () => {
  const raw = JSON.parse(readFileSync(bankPath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.questions || raw.items || [];
  const byId = Object.fromEntries(items.map((q) => [q.id, q]));
  for (const id of ENGINE_QUESTION_IDS) {
    const q = byId[id];
    assert.ok(q, `${id} is in the bank`);
    assert.equal(q.kind, 'engine', `${id} is an engine question`);
    const opts = (q.opts || []).map((o) => (typeof o === 'string' ? o : o.en ?? Object.values(o)[0]));
    const picked = selectOption(A[id], opts);
    assert.notEqual(picked, null, `${id}: the engine figure ${A[id].display} identifies exactly one option in ${JSON.stringify(opts)}`);
    assert.equal(picked, q.answer, `${id}: engine selects ${LETTERS[picked]}, bank says ${LETTERS[q.answer]}`);
    assert.equal(LETTERS[picked], A[id].expectedLetter, `${id}: expected ${A[id].expectedLetter}`);
  }
});

test('question bank: shape (29 items, 26 choose-one with an answer, 3 votes)', { skip: hasBank ? false : 'data/questions.json not yet added' }, () => {
  const raw = JSON.parse(readFileSync(bankPath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.questions || raw.items || [];
  assert.equal(items.length, 29);
  assert.equal(items.filter((q) => q.kind === 'vote').length, 3);
  assert.equal(items.filter((q) => q.kind !== 'vote' && q.answer != null).length, 26);
  for (const q of items) for (const f of ['id', 'slide', 'kind', 'q', 'opts', 'app']) assert.ok(q[f] != null, `${q.id} has ${f}`);
});

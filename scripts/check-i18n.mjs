// EN/中文 parity check — fails CI when:
//   * a key exists in one language file but not the other (or types / array lengths differ);
//   * a value is empty;
//   * a key used in src/ (t('…') / tr('…') literals, or a known dynamic family) is missing;
//   * a Chinese value is identical to the English one and contains English words (untranslated).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(readFileSync(join(root, 'i18n/en.json'), 'utf8'));
const zh = JSON.parse(readFileSync(join(root, 'i18n/zh.json'), 'utf8'));
const CASE = JSON.parse(readFileSync(join(root, 'data/case.json'), 'utf8'));
const errors = [];

function flatten(o, p = '', out = {}) {
  if (Array.isArray(o)) {
    out[p] = o;
    o.forEach((v, i) => flatten(v, `${p}.${i}`, out));
  } else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) flatten(v, p ? `${p}.${k}` : k, out);
  } else out[p] = o;
  return out;
}

const fe = flatten(en);
const fz = flatten(zh);
for (const k of Object.keys(fe)) {
  if (!(k in fz)) errors.push(`missing in zh.json: ${k}`);
  else if (Array.isArray(fe[k]) !== Array.isArray(fz[k]) || typeof fe[k] !== typeof fz[k]) errors.push(`type differs: ${k}`);
  else if (Array.isArray(fe[k]) && fe[k].length !== fz[k].length) errors.push(`array length differs: ${k}`);
}
for (const k of Object.keys(fz)) if (!(k in fe)) errors.push(`missing in en.json: ${k}`);
for (const [k, v] of Object.entries({ ...fe })) if (v === '' || v == null) errors.push(`empty en value: ${k}`);
for (const [k, v] of Object.entries({ ...fz })) if (v === '' || v == null) errors.push(`empty zh value: ${k}`);

// Untranslated heuristic.
const ALLOW = new Set(Object.keys(fe).filter((k) => k.startsWith('glossary.acronyms.')));
for (const [k, v] of Object.entries(fz)) {
  if (typeof v !== 'string' || ALLOW.has(k)) continue;
  if (v === fe[k] && /[a-z]{4,}/.test(v)) errors.push(`untranslated (zh identical to en): ${k} = "${v}"`);
}

// Keys used in the source.
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}
const exists = (dict, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict) !== undefined;
const used = new Set();
for (const file of walk(join(root, 'src'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt[r]?\(\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
}

// Dynamic key families (template literals) expanded from case data.
const TABS = ['home', 'position', 'mechanisms', 'repricing', 'spread', 'ratings', 'timeline', 'structure', 'portfolio', 'recognition', 'capital', 'controls', 'decision', 'answer', 'glossary'];
TABS.forEach((id) => ['title', 'short', 'intro', 'back'].forEach((f) => used.add(`tabs.${id}.${f}`)));
CASE.stops.forEach((s) => used.add(`stops.${s.id}.short`));
CASE.classStops.forEach((s) => { used.add(`classStops.s${s.n}`); used.add(`classStops.d${s.n}`); });
CASE.agenda.forEach((b) => used.add(`agenda.${b.id}`));
CASE.mechanisms.forEach((m) => {
  ['name', 'desc', 'case'].forEach((f) => used.add(`mech.${m.id}.${f}`));
  ['AC', 'FVOCI', 'FVTPL'].forEach((l) => used.add(`mech.${m.id}.where.${l}`));
});
CASE.impacts.forEach((i) => used.add(`impact.${i}`));
['AC', 'FVOCI', 'FVTPL'].forEach((l) => { used.add(`lens.${l}.short`); used.add(`lens.${l}.name`); });
['none', 'A', 'B'].forEach((c) => used.add(`cf.${c}`));
CASE.tieOut.forEach((r) => used.add(`tie.${r.id}`));
CASE.timeline.forEach((f) => { used.add(`timeline.facts.${f.id}`); used.add(`timeline.readings.${f.id}`); used.add(`timeline.kinds.${f.kind}`); });
CASE.portfolio.forEach((l) => ['name', 'desc', 'mechanism', 'missing', 'control', 'evidence'].forEach((f) => used.add(`portfolio.lines.${l.id}.${f}`)));
CASE.portfolioControls.forEach((c) => used.add(`portfolio.controls.${c}`));
CASE.referenceList.forEach((r) => ['name', 'mech', 'control'].forEach((f) => used.add(`portfolio.ref.${r.id}.${f}`)));
CASE.riskWeights.forEach((r) => { used.add(`capital.rwRows.${r.id}`); used.add(`capital.rwRef.${r.id}`); });
CASE.controlSteps.forEach((s) => { used.add(`controls.steps.${s.id}.name`); used.add(`controls.steps.${s.id}.text`); s.dates.forEach((d) => used.add(`controls.dates.${d}`)); });
CASE.escalation.observations.forEach((o) => used.add(`controls.dates.${o.id}`));
['CNY', 'USD'].forEach((c) => used.add(`ccy.${c}`));
['cgb', 'ust'].forEach((b) => used.add(`bench.${b}`));
['A', 'B', 'C', 'D', 'E', 'F'].forEach((L) => ['text', 'kind', 'why'].forEach((f) => used.add(`home.poll.${L}.${f}`)));
['coupon', 'tenor', 'nominal', 'benchmark', 'spread', 'funding', 'pd12', 'lgd'].forEach((k) => used.add(`position.field.${k}`));
CASE.shocks.forEach((s) => used.add(`lab.shock.${s.id}`));
['t0', 'sep25', 'mar26'].forEach((p) => used.add(`lab.preset.${p}`));
['issuerRequest', 'avoidDowngrade', 'cost', 'sufficientOther', 'unknown'].forEach((r) => used.add(`ratings.reasons.${r}`));
['g3', 'g4', 'g5', 'g6', 'g7', 'g8'].forEach((g) => used.add(`ratings.grades.${g}`));
['projectDebt', 'restrictedCash', 'maturityProfile', 'jvDebt', 'salesCollection', 'landBank', 'trustTerms', 'supportDocs', 'crossDefault', 'auditOpinion'].forEach((m) => used.add(`timeline.missing.${m}`));
['strong', 'moderate', 'limited', 'low'].forEach((l) => { used.add(`timeline.levels.${l}`); used.add(`timeline.levelText.${l}`); });
['revenue', 'debt', 'debtEbitda', 'ebitdaInterest', 'cashCover', 'ocfProfit', 'salesGrowth'].forEach((f) => used.add(`fin.${f}`));
['mtn', 'keepwell', 'tier2'].forEach((i) => ['name', 'obligor', 'currency', 'claim', 'support', 'whilePaying', 'watch'].forEach((f) => used.add(`structure.inst.${i}.${f}`)));
['obligor', 'currency', 'claim', 'support', 'whilePaying', 'watch'].forEach((r) => used.add(`structure.rows.${r}`));
['q1', 'q2', 'q3', 'q4', 'q5'].forEach((q) => { used.add(`structure.quiz.${q}.q`); used.add(`structure.quiz.${q}.a`); });
['founder', 'baoshang', 'noncall'].forEach((p) => { used.add(`structure.prec.${p}.title`); used.add(`structure.prec.${p}.text`); });
['mechanism', 'missing', 'control', 'evidence'].forEach((q) => { used.add(`portfolio.q.${q}`); used.add(`portfolio.q.${q}Short`); });
['spread', 'rating', 'financials', 'watchlist', 'dpd30'].forEach((e) => used.add(`recog.evidence.${e}`));
[0, 1, 2].forEach((i) => used.add(`recog.scen${i}`));
['normal', 'specialMention', 'substandard', 'doubtful', 'loss'].forEach((c) => used.add(`recog.fc.cats.${c}`));
['impaired', 'dpd90', 'sicr', 'dpd30', 'none'].forEach((r) => used.add(`recog.fc.stageReason.${r}`));
['dpdAny', 'adverse', 'restructured', 'dpd90', 'impaired', 'debtor10', 'dpd270', 'ecl50', 'dpd360', 'ecl90'].forEach((r) => used.add(`recog.fc.rules.${r}`));
['investment', 'risk', 'audit', 'operations'].forEach((l) => ['name', 'role', 'case'].forEach((f) => used.add(`controls.lenses.${l}.${f}`)));
['hold', 'reduce', 'hedge', 'exit'].forEach((a) => used.add(`decision.actions.${a}`));
['spread', 'price', 'cashCover', 'event', 'date'].forEach((m) => used.add(`decision.metrics.${m}`));
['action', 'sellShare', 'rationale', 'owner', 'trigger', 'escalation', 'responseA', 'responseB'].forEach((v) => used.add(`decision.v.${v}`));
['A', 'B'].forEach((c) => used.add(`decision.r.lesson${c}`));
['s1', 's2', 's3', 's4', 's5'].forEach((s) => { used.add(`answer.${s}.title`); used.add(`answer.${s}.text`); });

TABS.forEach((id) => { used.add(`desc.modules.${id}.inputs`); used.add(`desc.modules.${id}.outputs`); });
['purposeTitle', 'purpose', 'questionTitle', 'modulesTitle', 'colModule', 'colDoes', 'colInputs', 'colOutputs', 'inputsTitle', 'inputs', 'outputsTitle', 'outputs', 'runTitle', 'run', 'privacyTitle', 'privacy', 'disclaimerTitle'].forEach((k) => used.add(`desc.${k}`));
used.add('units.year');

for (const k of used) {
  if (!exists(en, k)) errors.push(`key used in src but missing in en.json: ${k}`);
  if (!exists(zh, k)) errors.push(`key used in src but missing in zh.json: ${k}`);
}

if (errors.length) {
  console.error(`i18n check FAILED (${errors.length} problems):`);
  errors.slice(0, 400).forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log(`i18n check passed: ${Object.keys(fe).length} entries, ${used.size} keys referenced, EN/中文 in parity.`);

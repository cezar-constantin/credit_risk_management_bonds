// Class questions (data/questions.json = the class question bank, loaded unchanged).
// One "Choose one" panel design for every screen; engine questions are answered by the engine at
// runtime, concept questions reveal the stored answer and its reference, votes show the room's tally.
import { QUESTIONS, CASE } from './data.js';
import { t, getLang } from './i18n.js';
import * as store from './state.js';
import * as fmt from './format.js';
import { h, workings, button } from './ui.js';
import { tallyInput, voteBar } from './tabs/common.js';
import { engineAnswers, selectOption } from '../engine/index.js';
import { TABS, position } from './model.js';
import { I18N } from './data.js';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Localised value of a bilingual field ({en, zh} object, [en, zh] pair or plain string). */
export function L(x) {
  if (x == null) return '';
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  if (Array.isArray(x)) return String(getLang() === 'zh' && x.length > 1 ? x[1] : x[0]);
  return String(x[getLang()] ?? x.en ?? x.zh ?? Object.values(x)[0] ?? '');
}
const EN = (x) => (x == null ? '' : typeof x === 'string' ? x : Array.isArray(x) ? String(x[0]) : String(x.en ?? Object.values(x)[0] ?? ''));

export function allQuestions() {
  const raw = QUESTIONS;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.questions || raw.items || [];
}

/** Screen for a question: its `app` field (tab id or screen name), else the route entry of its slide. */
export function tabFor(q) {
  const app = EN(q.app).toLowerCase().trim();
  if (app) {
    if (TABS.includes(app)) return app;
    const byName = TABS.find((id) => {
      const names = [I18N.en.tabs[id].short, I18N.en.tabs[id].title].map((s) => s.toLowerCase());
      return names.some((n) => n === app || app.includes(n) || n.includes(app));
    });
    if (byName) return byName;
  }
  const slide = String(q.slide ?? '').replace(/^0+/, '');
  const r = CASE.route.find((x) => String(x.slide) === slide) || CASE.appendix.find((x) => x.slide === slide);
  return r ? r.tab : 'home';
}

export function questionsFor(tab) {
  return allQuestions().filter((q) => tabFor(q) === tab).sort((a, b) => Number(a.slide) - Number(b.slide));
}

let engineCache = null;
function engine() {
  const key = JSON.stringify(position());
  if (!engineCache || engineCache.key !== key) engineCache = { key, answers: engineAnswers(CASE, { position: position() }) };
  return engineCache.answers;
}

/** The correct option index: computed by the engine for engine questions, stored otherwise. */
export function correctIndex(q) {
  if (q.kind === 'engine' && engine()[q.id]) {
    const idx = selectOption(engine()[q.id], (q.opts || []).map(EN));
    return idx == null ? q.answer : idx;
  }
  return q.answer ?? null;
}

export function score() {
  const s = store.get();
  const graded = allQuestions().filter((q) => q.kind !== 'vote' && q.answer != null);
  const answered = graded.filter((q) => s.answers[q.id] != null);
  const right = answered.filter((q) => s.answers[q.id] === correctIndex(q));
  return { total: graded.length, answered: answered.length, right: right.length };
}

function linkify(text) {
  const parts = String(text).split(/(https?:\/\/\S+)/g);
  return parts.map((p) => (/^https?:\/\//.test(p) ? h('a', { href: p, target: '_blank', rel: 'noreferrer noopener' }, p) : p));
}

/** The "Choose one" panel — identical on every screen. */
export function choosePanel(ctx, q) {
  const key = `${ctx.tab}.q-${q.id}`;
  ctx.revealKeys.push(key);
  const opts = q.opts || [];
  return ctx.live(() => {
    const s = store.get();
    const shown = Boolean(s.reveals[key]);
    const mine = s.answers[q.id];
    const vote = q.kind === 'vote';
    const correct = shown && !vote ? correctIndex(q) : null;
    const counts = s.qtally[q.id] || {};
    const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    const eng = q.kind === 'engine' ? engine()[q.id] : null;

    const optionRows = opts.map((o, i) => {
      const isMine = mine === i;
      const cls = ['choose-opt', isMine ? 'is-mine' : '', correct === i ? 'is-correct' : '', shown && !vote && isMine && correct !== i ? 'is-wrong' : ''].join(' ');
      return h('div', { class: cls },
        h('button', {
          type: 'button', class: 'choose-btn', role: 'radio', 'aria-checked': String(isMine), 'data-fkey': `q:${q.id}:${i}`,
          onClick: () => { s.answers[q.id] = i; store.save(); store.emit('answers'); },
        }, h('span', { class: 'choose-letter' }, LETTERS[i]), h('span', null, L(o))),
        correct === i && eng ? h('span', { class: 'choose-engine' }, `${t('q.engine')}: ${eng.display}`) : null,
        s.mode === 'instructor' ? h('span', { class: 'choose-tally' }, tallyInput(`qtally.${q.id}.${i}`, `${q.id} ${LETTERS[i]}`), voteBar(counts[i] || 0, total)) : null);
    });

    const revealBlock = shown ? h('div', { class: 'choose-reveal' },
      vote ? h('p', null, h('strong', null, `${t('q.modelAnswer')}: `), L(q.why)) : [
        h('p', null, h('strong', null, `${t('q.answer')}: ${LETTERS[correct] ?? '–'}`),
          mine != null ? h('span', { class: `pill ${mine === correct ? 'ok' : 'red'}`, style: { marginLeft: '8px' } }, mine === correct ? t('ui.correct') : t('ui.notQuite')) : null),
        eng ? h('p', null, `${t('q.engineLine')}: ${eng.workings} → ${LETTERS[correct]}`) : null,
        q.why ? h('p', null, L(q.why)) : null,
        eng ? workings(`q-${q.id}`, eng.workings, Object.entries(eng.values).map(([k, v]) => [k, fmt.num(v, Math.abs(v) < 1 ? 4 : 2)])) : null,
        q.verification ? h('p', { class: 'small muted' }, `${t('q.reference')}: `, ...linkify(L(q.verification))) : null,
      ]) : null;

    return h('section', { class: 'choose-panel', 'aria-label': `${vote ? t('q.vote') : t('q.chooseOne')} ${q.id}` },
      h('div', { class: 'choose-head' },
        h('span', { class: 'choose-label' }, vote ? t('q.vote') : t('q.chooseOne')),
        h('span', { class: 'choose-id' }, `${q.id} · ${t('ui.slide')} ${q.slide}`)),
      h('p', { class: 'choose-q' }, L(q.q)),
      h('div', { class: 'choose-opts', role: 'radiogroup', 'aria-label': L(q.q) }, optionRows),
      shown ? revealBlock : button(s.mode === 'participant' && !vote ? t('ui.checkAnswer') : t('ui.reveal'), () => { s.reveals[key] = true; store.save(); store.emit('reveals'); },
        { cls: 'btn btn-reveal', attrs: { 'data-fkey': `reveal:${key}` } }));
  }, { cls: 'choose-wrap' });
}

// ---- Printable question sheet and answer key --------------------------------------------------

export function questionSheet({ key = false } = {}) {
  const qs = allQuestions();
  return h('div', null,
    h('h2', null, key ? t('q.keyTitle') : t('q.sheetTitle')),
    key ? null : h('p', null, `${t('q.name')}: ____________________________    ${t('q.unit')}: ____________________`),
    h('ol', { class: 'sheet-list' }, qs.map((q) => h('li', null,
      h('p', null, h('strong', null, `${q.id} · ${q.kind === 'vote' ? t('q.vote') : t('q.chooseOne')} · ${t('ui.slide')} ${q.slide}`)),
      h('p', null, L(q.q)),
      h('ul', { class: 'sheet-opts' }, (q.opts || []).map((o, i) => h('li', null, `${key && correctIndex(q) === i && q.kind !== 'vote' ? '☑' : '☐'} ${LETTERS[i]}. ${L(o)}`))),
      key ? h('p', { class: 'small' }, q.kind === 'vote' ? `${t('q.modelAnswer')}: ${L(q.why)}` : `${t('q.answer')}: ${LETTERS[correctIndex(q)] ?? '–'} — ${L(q.why)}`) : null,
      key && q.verification ? h('p', { class: 'small muted' }, `${t('q.reference')}: ${L(q.verification)}`) : null))),
    h('p', { class: 'small' }, t('disclaimer.text')));
}

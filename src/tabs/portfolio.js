// 8 · Portfolio contrasts — five lines, four questions each; nine-line reference list.
import { t } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import { h, card, table, select, reveal, textField } from '../ui.js';
import { tabHeader, guidedKeep } from './common.js';

const QUESTIONS = ['mechanism', 'missing', 'control', 'evidence'];

export function render(root, ctx) {
  const mechOptions = [{ value: '', label: t('ui.choose') }].concat(CASE.mechanisms.map((m) => ({ value: m.id, label: t(`mech.${m.id}.name`) })));
  const ctlOptions = [{ value: '', label: t('ui.choose') }].concat(CASE.portfolioControls.map((c) => ({ value: c, label: t(`portfolio.controls.${c}`) })));

  const lines = CASE.portfolio.map((line, i) => card(`${i + 1}. ${t(`portfolio.lines.${line.id}.name`)}`,
    h('p', { class: 'small muted' }, t('portfolio.ccyBench', { ccy: t(`ccy.${line.currency}`), bench: t(`bench.${line.benchmark}`) })),
    h('p', { class: 'small' }, t(`portfolio.lines.${line.id}.desc`)),
    h('div', { class: 'grid grid-2' },
      select({ path: `portfolio.answers.${line.id}.mechanism`, label: t('portfolio.q.mechanism'), options: mechOptions }),
      select({ path: `portfolio.answers.${line.id}.control`, label: t('portfolio.q.control'), options: ctlOptions })),
    textField({ path: `portfolio.answers.${line.id}.notes`, label: t('portfolio.notes'), multiline: true, rows: 2, placeholder: t('portfolio.notesPh') }),
    reveal(ctx, line.id, () => {
      const a = (store.get().portfolio.answers[line.id]) || {};
      const mOk = a.mechanism && line.mechanism.includes(a.mechanism);
      const cOk = a.control && line.control.includes(a.control);
      return h('div', null,
        a.mechanism || a.control ? h('p', { class: 'row' },
          h('span', { class: `pill ${mOk ? 'ok' : 'red'}` }, `${t('portfolio.q.mechanismShort')}: ${mOk ? t('ui.correct') : t('ui.notQuite')}`),
          h('span', { class: `pill ${cOk ? 'ok' : 'red'}` }, `${t('portfolio.q.controlShort')}: ${cOk ? t('ui.correct') : t('ui.notQuite')}`)) : null,
        h('dl', { class: 'kv' }, QUESTIONS.map((q) => [h('dt', null, t(`portfolio.q.${q}Short`)), h('dd', null, t(`portfolio.lines.${line.id}.${q}`))])));
    }, { label: t('portfolio.modelAnswer'), participantLabel: t('portfolio.checkModel') })));

  const ref = card(t('portfolio.refTitle'),
    table([t('portfolio.refCols.line'), t('portfolio.refCols.ccy'), t('portfolio.refCols.bench'), t('portfolio.refCols.mech'), t('portfolio.refCols.control')],
      CASE.referenceList.map((r) => [t(`portfolio.ref.${r.id}.name`), t(`ccy.${r.currency}`), t(`bench.${r.benchmark}`), t(`portfolio.ref.${r.id}.mech`), t(`portfolio.ref.${r.id}.control`)])),
    h('p', { class: 'note' }, t('portfolio.ccyNote')));

  root.append(...tabHeader('portfolio'),
    h('p', { class: 'small' }, t('portfolio.questionsIntro')),
    h('ol', { class: 'small' }, QUESTIONS.map((q) => h('li', null, t(`portfolio.q.${q}`)))),
    guidedKeep(h('div', { class: 'grid grid-2' }, lines)), h('div', { style: { marginTop: '16px' } }, ref));
}

// 7 · Structure and claims — parent MTN vs offshore keepwell SPV notes vs bank Tier-2.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { h, card, table, paras, select, reveal } from '../ui.js';
import { tabHeader, guidedKeep } from './common.js';

const INSTRUMENTS = ['mtn', 'keepwell', 'tier2'];
const ROWS = ['obligor', 'currency', 'claim', 'support', 'whilePaying', 'watch'];
const QUIZ = [
  { id: 'q1', answer: 'no' },
  { id: 'q2', answer: 'no' },
  { id: 'q3', answer: 'no' },
  { id: 'q4', answer: 'yes' },
  { id: 'q5', answer: 'depends' },
];
const PRECEDENTS = ['founder', 'baoshang', 'noncall'];

export function render(root, ctx) {
  const compare = card(t('structure.compareTitle'),
    table([t('structure.feature'), ...INSTRUMENTS.map((i) => t(`structure.inst.${i}.name`))],
      ROWS.map((r) => [t(`structure.rows.${r}`), ...INSTRUMENTS.map((i) => t(`structure.inst.${i}.${r}`))])),
    h('p', { class: 'note' }, t('structure.compareNote')));

  const quiz = card(t('structure.quizTitle'), h('p', null, t('structure.quizIntro')),
    QUIZ.map((q) => h('div', { class: 'card', style: { marginBottom: '8px' } },
      h('p', null, t(`structure.quiz.${q.id}.q`)),
      select({ path: `structure.quiz.${q.id}`, label: t('structure.isDefault'), options: [{ value: '', label: t('ui.choose') }, { value: 'yes', label: t('structure.yesDefault') }, { value: 'no', label: t('structure.notDefault') }, { value: 'depends', label: t('structure.depends') }] }),
      reveal(ctx, q.id, () => {
        const mine = store.get().structure.quiz[q.id];
        const right = mine === q.answer;
        return h('div', null,
          mine ? h('p', null, h('span', { class: `pill ${right ? 'ok' : 'red'}` }, right ? t('ui.correct') : t('ui.notQuite'))) : null,
          h('p', null, h('strong', null, t(`structure.${q.answer === 'yes' ? 'yesDefault' : q.answer === 'no' ? 'notDefault' : 'depends'}`)), ' — ', t(`structure.quiz.${q.id}.a`)));
      }))));

  const precedents = card(t('structure.precTitle'),
    PRECEDENTS.map((p) => h('div', { style: { marginBottom: '10px' } },
      h('h4', null, t(`structure.prec.${p}.title`)), ...paras(tr(`structure.prec.${p}.text`), 'small'))),
    h('p', { class: 'note' }, t('structure.precNote')));

  guidedKeep(compare);
  root.append(...tabHeader('structure'), compare, h('div', { class: 'grid grid-2', style: { marginTop: '16px' } }, quiz, precedents));
}

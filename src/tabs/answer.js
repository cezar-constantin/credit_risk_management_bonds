// 13 · The answer — five statements with links back to where each was computed; ZKB visit questions.
import { t, tr } from '../i18n.js';
import * as fmt from '../format.js';
import { h, card, button, paras } from '../ui.js';
import { tabHeader } from './common.js';
import * as store from '../state.js';
import { score, questionSheet, allQuestions } from '../questions.js';
import { figures, value } from '../model.js';

const STATEMENTS = [
  { id: 's1', tabs: ['repricing', 'timeline'] },
  { id: 's2', tabs: ['timeline', 'spread'] },
  { id: 's3', tabs: ['recognition'] },
  { id: 's4', tabs: ['repricing', 'decision'] },
  { id: 's5', tabs: ['capital'] },
];

export function render(root, ctx, { goTab }) {
  const list = ctx.live(() => {
    const F = figures();
    const jun = value('jun26', 'none');
    const vars = {
      mar: fmt.money(F.mar26.totalPriceEffect, 2, { sign: true }),
      jun: fmt.money(F.jun26.economic, 2, { sign: true }),
      ecl: fmt.money(F.ecl.stage2Charge),
      bid: fmt.money(jun.liquidity, 2, { sign: true }),
      realised: fmt.money(F.jun26.realised, 2, { sign: true }),
      oci: fmt.money(F.recognition.fvoci.equityCumulative, 2, { sign: true }),
      a: fmt.price(F.jul26.A), b: fmt.price(F.jul26.B),
    };
    return h('ol', { class: 'statements' }, STATEMENTS.map((s) => h('li', null,
      h('strong', null, t(`answer.${s.id}.title`)),
      h('p', null, t(`answer.${s.id}.text`, vars)),
      h('div', { class: 'row small' }, h('span', { class: 'muted' }, t('answer.computedIn')),
        s.tabs.map((tab) => button(t(`tabs.${tab}.title`), () => goTab(tab), { cls: 'btn btn-link btn-small' }))))));
  });

  // Score (participant) and printable question sheet / answer key.
  const printView = h('div', { class: 'print-sheet print-only' });
  const print = (key) => {
    printView.replaceChildren(questionSheet({ key }));
    document.documentElement.dataset.print = 'sheet';
    window.print();
    setTimeout(() => { delete document.documentElement.dataset.print; }, 500);
  };
  const scoreCard = card(t('q.scoreTitle'), ctx.live(() => {
    const sc = score();
    if (!allQuestions().length) return h('p', { class: 'note' }, t('q.noBank'));
    return [
      store.get().mode === 'participant' ? h('p', { class: 'metric-value' }, t('q.score', { right: sc.right, total: sc.total })) : null,
      h('p', { class: 'small muted' }, t('q.scoreNote', { answered: sc.answered, total: sc.total })),
      h('div', { class: 'row no-print' },
        button(t('q.printSheet'), () => print(false), { cls: 'btn' }),
        store.get().mode === 'instructor' ? button(t('q.printKey'), () => print(true), { cls: 'btn' }) : null),
    ];
  }));

  root.append(...tabHeader('answer'),
    scoreCard,
    h('p', { class: 'question-hero' }, t('question')),
    card(t('answer.shortTitle'), ...paras(tr('answer.short'))),
    h('h3', { style: { marginTop: '16px' } }, t('answer.fiveTitle')),
    list,
    h('div', { class: 'grid grid-2', style: { marginTop: '16px' } },
      card(t('answer.notTitle'), h('ul', null, tr('answer.nots').map((x) => h('li', null, x)))),
      card(t('answer.zkbTitle'), h('p', { class: 'small muted' }, t('answer.zkbIntro')), h('ol', null, tr('answer.zkb').map((x) => h('li', null, x))))),
    printView);
}

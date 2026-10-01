// 8 · Portfolio contrasts — five lines, four questions each; nine-line reference list.
import { t } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, table, select, reveal, textField, workings, fictionalBadge } from '../ui.js';
import { tabHeader, guidedKeep, voteCard } from './common.js';
import { figures } from '../model.js';

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
    table([t('portfolio.refCols.line'), t('portfolio.refCols.bench'), t('portfolio.refCols.spread'), t('portfolio.refCols.book'), t('portfolio.refCols.mech')],
      CASE.referenceList.map((r, i) => [`${i + 1}. ${t(`portfolio.ref.${r.id}.name`)}`, `${t(`bench.${r.benchmark}`)} / ${t(`ccy.${r.currency}`)}`, r.spread, t(`lens.${r.book}.short`), t(`portfolio.ref.${r.id}.mech`)])),
    h('p', { class: 'note' }, t('portfolio.ccyNote')));

  // Group view (deck slide 20; ledger §8): one group, several legal obligors, one support provider.
  const G = CASE.groupView;
  const group = card(t('portfolio.group.title'),
    table([t('portfolio.group.obligor'), t('portfolio.group.instrument'), t('portfolio.group.amount'), t('portfolio.group.status')],
      G.rows.map((r) => ({
        cls: r.case ? 'hl' : null,
        cells: [t(`portfolio.group.obligors.${r.obligor}`), `${t(`portfolio.group.rows.${r.id}`)} · ${t(`portfolio.group.books.${r.book}`)}`,
          r.memo || !r.bank ? `(${fmt.num(r.amount, 0)})` : fmt.num(r.amount, 0), t(`portfolio.group.statuses.${r.status}`)],
      })), { numericCols: [2], caption: t('portfolio.group.caption') }),
    ctx.live(() => {
      const P = figures().portfolio;
      return h('ul', { class: 'small' },
        h('li', null, t('portfolio.group.cGroup', { on: fmt.num(P.onBalance, 0), off: fmt.num(P.withOff, 0), share: fmt.pct(100 / P.onBalance, 0) })),
        h('li', null, t('portfolio.group.cSupport', { soe: fmt.num(G.rows.find((r) => r.id === 'soe').amount, 0) })),
        h('li', null, t('portfolio.group.cSector', { sector: fmt.num(G.sectorBn, 0), region: fmt.num(G.regionBn, 0) })),
        h('li', null, t('portfolio.group.cLegal')));
    }));

  const stress = card(t('portfolio.stress.title'), ctx.live(() => {
    const S = figures().portfolio.stress;
    const X = G.stress;
    return [
      table([t('portfolio.stress.shock'), t('portfolio.stress.effect')], [
        [t('portfolio.stress.spread', { bp: X.spreadShockBp }), fmt.num(S.bondFV, 1)],
        [t('portfolio.stress.pd', { from: fmt.pct(X.pdFrom, 0), to: fmt.pct(X.pdTo, 0), lgd: fmt.pct(X.lgd, 0), loans: fmt.num(X.loans, 0) }), fmt.num(S.loanEcl, 1)],
        [t('portfolio.stress.width'), fmt.num(S.exit, 1)],
        { cls: 'total', cells: [t('portfolio.stress.total', { share: fmt.pct(S.loanShare, 0) }), fmt.num(S.total, 1)] },
      ], { numericCols: [1] }),
      workings('pf-stress', t('portfolio.stress.formula'), [[t('portfolio.stress.dur'), fmt.num(X.spreadDuration, 1)], [t('portfolio.stress.bond'), fmt.num(X.bond, 0)], [t('portfolio.stress.loans'), fmt.num(X.loans, 0)]], t('portfolio.stress.note')),
    ];
  }));

  const choice = voteCard(ctx, {
    id: 'mgmt', title: t('portfolio.choice.title'), question: t('portfolio.choice.q', { limit: fmt.num(G.groupLimit, 0) }),
    options: ['A', 'B', 'C'].map((v) => ({ value: v, label: t(`portfolio.choice.${v}`) })),
    note: t('portfolio.choice.note'),
  });

  root.append(...tabHeader('portfolio', fictionalBadge()),
    guidedKeep(group),
    h('div', { class: 'grid grid-2', style: { margin: '16px 0' } }, stress, choice),
    h('h3', null, t('portfolio.contrastTitle')),
    h('p', { class: 'small' }, t('portfolio.questionsIntro')),
    h('ol', { class: 'small' }, QUESTIONS.map((q) => h('li', null, t(`portfolio.q.${q}`)))),
    h('div', { class: 'grid grid-2' }, lines), h('div', { style: { marginTop: '16px' } }, ref));
}

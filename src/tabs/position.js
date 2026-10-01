// 1 · Position — term sheet, FY2024 profile, editable in Free play; tie-out table of class figures.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, numberField, table, fictionalBadge, button, workings } from '../ui.js';
import { figureAt } from '../../engine/index.js';
import { tabHeader, isClass, guidedKeep } from './common.js';
import { figures, y0, p0 } from '../model.js';

const EDITABLE = [
  ['coupon', '%'], ['tenor', 'y'], ['nominal', 'm'], ['benchmark', '%'], ['spread', 'bp'], ['funding', '%'], ['pd12', '%'], ['lgd', '%'],
];

function printSheet() {
  document.documentElement.dataset.print = 'factsheet';
  window.print();
  setTimeout(() => { delete document.documentElement.dataset.print; }, 500);
}

export function render(root, ctx) {
  const F = CASE.positionFixed;
  const fy = CASE.financials.fy2024;
  const pos = () => store.get().position;
  const unit = (u) => (u === '%' ? '%' : u === 'bp' ? t('units.bpShort') : u === 'y' ? t('units.years') : t('units.rmbM'));

  const termSheet = ctx.live(() => {
    const p = pos();
    return h('dl', { class: 'kv' },
      h('dt', null, t('position.issuer')), h('dd', null, t('case.issuer')),
      h('dt', null, t('position.issuerProfile')), h('dd', null, t('position.issuerProfileVal')),
      h('dt', null, t('position.book')), h('dd', null, t('position.bookVal')),
      h('dt', null, t('position.structure')), h('dd', null, t('position.structureVal')),
      h('dt', null, t('position.instrument')), h('dd', null, t('position.instrumentVal', { coupon: fmt.pctRaw(p.coupon) })),
      h('dt', null, t('position.currency')), h('dd', null, t('position.currencyVal')),
      h('dt', null, t('position.dates')), h('dd', null, `${fmt.date(F.issueDate)} → ${fmt.date(F.maturityDate)}`),
      h('dt', null, t('position.purchase')), h('dd', null, `${fmt.price(p0())} (${t('position.atIssue')})`),
      h('dt', null, t('position.nominal')), h('dd', null, fmt.money(p.nominal, 0)),
      h('dt', null, t('position.benchmark')), h('dd', null, t('position.benchmarkVal', { b: fmt.pctRaw(p.benchmark) })),
      h('dt', null, t('position.spread')), h('dd', null, `${fmt.bp(p.spread)} → ${t('position.yield')} ${fmt.pct(y0())}`),
      h('dt', null, t('position.support')), h('dd', null, t('position.supportVal', { own: F.ownership, loan: fmt.bn(F.shareholderLoanBn), year: F.shareholderLoanYear })),
      h('dt', null, t('position.businessModel')), h('dd', null, t('position.businessModelVal')),
      h('dt', null, t('position.funding')), h('dd', null, t('position.fundingVal', { f: fmt.pctRaw(p.funding), carry: fmt.bp((y0() * 100 - p.funding) * 100) })),
      h('dt', null, t('position.original')), h('dd', null, t('position.originalVal', { pd: fmt.pctRaw(p.pd12, 1), lgd: fmt.pctRaw(p.lgd, 0), ecl: fmt.money(p.pd12 / 100 * p.lgd / 100 * p.nominal) })));
  });

  const cover = fy.cash / fy.std;
  const profile = table(
    [t('position.metric'), t('position.fy2024')],
    [
      [t('fin.revenue'), fmt.bn(fy.revenue)],
      [t('fin.salesGrowth'), fmt.pctRaw(fy.salesGrowth, 0, { sign: true })],
      [t('fin.debt'), fmt.bn(fy.debt)],
      [t('fin.debtEbitda'), fmt.times(fy.debtEbitda, 1)],
      [t('fin.ebitdaInterest'), fmt.times(fy.ebitdaInterest, 1)],
      [t('fin.cashCover'), `${fmt.bn(fy.cash)} / ${fmt.bn(fy.std)} = ${fmt.times(cover, 2)}`],
      [t('fin.ocfProfit'), `${fmt.bn(fy.ocf, 0, { sign: true })} / ${fmt.bn(fy.netProfit, 0, { sign: true })}`],
    ], { numericCols: [1] });

  const editor = card(t('position.editTitle'),
    ctx.live(() => (isClass() ? h('p', { class: 'note' }, t('position.locked')) : h('p', { class: 'note' }, t('position.freeHelp')))),
    h('div', { class: 'grid grid-3' }, EDITABLE.map(([k, u]) => {
      const [min, max, step] = CASE.bounds[k];
      return numberField({ path: `position.${k}`, label: t(`position.field.${k}`), min, max, step, suffix: unit(u), disabled: isClass() });
    })));

  const tieOut = card(t('position.tieTitle'),
    h('p', { class: 'small muted' }, t('position.tieHelp')),
    ctx.live(() => {
      const Fg = figures();
      const classMode = isClass();
      let ok = 0;
      const rows = CASE.tieOut.map((r) => {
        const v = figureAt(Fg, r.path);
        const tol = r.tol ?? 0.5 * 10 ** -r.dp + 1e-9;
        const pass = Math.abs(v - r.expected) <= tol;
        if (pass) ok += 1;
        const show = (x) => (r.pct ? fmt.pct(x, Math.max(1, r.dp - 2)) : fmt.num(x, r.dp));
        return [t(`tie.${r.id}`), `${r.approx ? '≈ ' : ''}${show(r.expected)}`, show(v),
          h('span', { class: pass ? 'check-ok' : 'check-bad' }, pass ? `✓ ${t('position.tieOk')}` : (classMode ? `✗ ${t('position.tieDrift')}` : t('position.tieFree'))),
          t(`tabs.${r.tab}.short`)];
      });
      return [
        h('p', null, h('strong', null, t('position.tieSummary', { ok, total: CASE.tieOut.length }))),
        table([t('position.tieFigure'), t('position.tieDeck'), t('position.tieApp'), t('position.tieStatus'), t('position.tieTab')], rows, { numericCols: [1, 2] }),
        workings('tie', t('position.tieFormula'), [[t('position.yield'), fmt.pct(y0())], [t('position.purchase'), fmt.price(p0())]]),
      ];
    }));

  // Decision 1 · 15 March 2025 — seven-point pre-purchase check (illustrative framework) and vote.
  const PP = CASE.prePurchase;
  const CHECK = ['mandate', 'issuer', 'instrument', 'information', 'downside', 'return', 'size'];
  const check = card(t('position.check.title'),
    h('p', null, h('span', { class: 'label-illustrative' }, t('position.check.label'))),
    ctx.live(() => {
      const P = figures().purchase;
      const p = pos();
      const vals = { limit: fmt.money(PP.limitPerDeveloper, 0), lgd: fmt.pctRaw(p.lgd, 0), net: fmt.bp(P.net, 0), share: fmt.pct(P.issueShare, 1), issue: fmt.money(PP.issueSize, 0), dealer: fmt.money(PP.dealerSize, 0), days: PP.exitDays };
      return [
        h('ol', { class: 'statements' }, CHECK.map((k) => h('li', null, h('strong', null, t(`position.check.${k}.name`)), ' — ', t(`position.check.${k}.text`, vals)))),
        table([t('position.check.line'), t('position.check.bp')], [
          [t('position.check.carry', { y: fmt.pct(y0()), f: fmt.pctRaw(p.funding) }), fmt.num(P.carry, 0)],
          [t('position.check.el', { pd: fmt.pctRaw(p.pd12, 1), lgd: fmt.pctRaw(p.lgd, 0) }), fmt.num(-P.el, 0)],
          [t('position.check.capital', { rw: PP.rw, r: PP.capitalRatio, c: fmt.num(PP.costOfCapital, 1) }), fmt.num(-P.capital, 0)],
          [t('position.check.liquidity'), fmt.num(-P.liquidity, 0)],
          { cls: 'total', cells: [t('position.check.net'), `≈ ${fmt.num(P.net, 0)}`] },
        ], { numericCols: [1] }),
        workings('d1', t('position.check.formula'), [[t('position.check.carryShort'), fmt.num(P.carry, 1)], [t('position.check.elShort'), fmt.num(P.el, 1)], [t('position.check.capitalShort'), fmt.num(P.capital, 1)], [t('position.check.liquidityShort'), P.liquidity], [t('position.check.shareShort'), fmt.pct(P.issueShare, 2)]], t('position.check.note')),
      ];
    }));

  root.append(
    ...tabHeader('position', fictionalBadge()),
    guidedKeep(h('div', { class: 'print-factsheet' },
      h('div', { class: 'print-only' }, h('h2', null, `${t('app.title')} — ${t('position.factSheet')}`), h('p', null, t('ui.fictionalLong'))),
      h('div', { class: 'grid grid-2' },
        h('div', { class: 'stack' },
          card(t('position.termSheet'), termSheet),
          h('section', { class: 'card accent callout' }, h('h3', { class: 'card-title' }, t('position.icbcLensTitle')), ...tr('position.icbcLens').map((x) => h('p', null, x)))),
        card(t('position.profileTitle'), profile, h('p', { class: 'small muted' }, t('position.profileNote')))),
      h('p', { class: 'small print-only' }, t('disclaimer.text')))),
    h('div', { class: 'row no-print', style: { margin: '12px 0' } }, button(t('position.printSheet'), printSheet, { cls: 'btn' })),
    h('div', { class: 'grid grid-2', style: { marginBottom: '16px' } }, check, h('div', { class: 'stack' }, card(t('position.d1.afterTitle'), ...tr('position.d1.after').map((x) => h('p', { class: 'small' }, x))))),
    editor,
    tieOut,
  );
}

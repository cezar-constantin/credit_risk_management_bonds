// 1 · Position — term sheet, FY2024 profile, editable in Free play; tie-out table of class figures.
import { t } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, numberField, table, fictionalBadge, button, workings } from '../ui.js';
import { figureAt } from '../../engine/index.js';
import { tabHeader, isClass } from './common.js';
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
      h('dt', null, t('position.structure')), h('dd', null, t('position.structureVal')),
      h('dt', null, t('position.instrument')), h('dd', null, t('position.instrumentVal', { coupon: fmt.pctRaw(p.coupon) })),
      h('dt', null, t('position.currency')), h('dd', null, t('position.currencyVal')),
      h('dt', null, t('position.dates')), h('dd', null, `${fmt.date(F.issueDate)} → ${fmt.date(F.maturityDate)}`),
      h('dt', null, t('position.purchase')), h('dd', null, `${fmt.price(p0())} (${t('position.atIssue')})`),
      h('dt', null, t('position.nominal')), h('dd', null, fmt.money(p.nominal, 0)),
      h('dt', null, t('position.benchmark')), h('dd', null, t('position.benchmarkVal', { b: fmt.pctRaw(p.benchmark) })),
      h('dt', null, t('position.spread')), h('dd', null, `${fmt.bp(p.spread)} → ${t('position.yield')} ${fmt.pct(y0())}`),
      h('dt', null, t('position.support')), h('dd', null, t('position.supportVal', { own: F.ownership, seats: F.boardSeats, loan: fmt.bn(F.shareholderLoanBn), date: fmt.date(F.shareholderLoanDate, { month: true }) })),
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

  root.append(
    ...tabHeader('position', fictionalBadge()),
    h('div', { class: 'print-factsheet' },
      h('div', { class: 'print-only' }, h('h2', null, `${t('app.title')} — ${t('position.factSheet')}`), h('p', null, t('ui.fictionalLong'))),
      h('div', { class: 'grid grid-2' },
        card(t('position.termSheet'), termSheet),
        card(t('position.profileTitle'), profile, h('p', { class: 'small muted' }, t('position.profileNote')))),
      h('p', { class: 'small print-only' }, t('disclaimer.text'))),
    h('div', { class: 'row no-print', style: { margin: '12px 0' } }, button(t('position.printSheet'), printSheet, { cls: 'btn' })),
    editor,
    tieOut,
  );
}

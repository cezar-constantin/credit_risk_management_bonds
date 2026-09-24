// 4 · Spread anatomy — what a spread pays for; break-even PD; physical vs risk-neutral; sizing.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import * as fmt from '../format.js';
import { h, card, slider, table, workings, paras, reveal, hint } from '../ui.js';
import { spreadAnatomy, sizing, bp, pct } from '../../engine/index.js';
import { stackedBar } from '../charts.js';
import { tabHeader, legend, guidedKeep } from './common.js';

export function render(root, ctx) {
  const S = () => store.get().spread;
  const bpf = (v) => fmt.bp(v);

  const inputs = card(t('spread.inputs'),
    slider({ path: 'spread.spread', label: t('spread.spread'), min: 0, max: 1000, step: 5, fmt: bpf }),
    slider({ path: 'spread.pdPhysical', label: t('spread.pdPhys'), min: 0, max: 15, step: 0.1, fmt: (v) => fmt.pctRaw(v, 1) }),
    slider({ path: 'spread.lgd', label: t('spread.lgd'), min: 5, max: 100, step: 1, fmt: (v) => fmt.pctRaw(v, 0) }),
    slider({ path: 'spread.liquidityPremium', label: t('spread.liq'), min: 0, max: 300, step: 5, fmt: bpf }),
    hint(ctx, 'h1', t('spread.hint')));

  const anatomy = card(t('spread.anatomyTitle'), ctx.live(() => {
    const s = S();
    const a = spreadAnatomy({ spread: bp(s.spread), pdPhysical: pct(s.pdPhysical), lgd: pct(s.lgd), liquidityPremium: bp(s.liquidityPremium) });
    const parts = [
      { label: t('spread.el'), value: a.expectedLoss * 1e4, color: '--series-cost' },
      { label: t('spread.crp'), value: a.creditRiskPremium * 1e4, color: '--series-spread' },
      { label: t('spread.lp'), value: a.liquidityPremium * 1e4, texture: true },
    ];
    return [
      legend([{ label: t('spread.el'), color: '--series-cost' }, { label: t('spread.crp'), color: '--series-spread' }, { label: t('spread.lp'), hatch: true }]),
      stackedBar({ parts, title: t('spread.anatomyTitle'), fmt: (v) => fmt.bp(v) }),
      table([t('spread.component'), t('spread.bpCol')], [
        [t('spread.el'), fmt.bp(a.expectedLoss * 1e4, 0)],
        [t('spread.crp'), fmt.bp(a.creditRiskPremium * 1e4, 0)],
        [t('spread.lp'), fmt.bp(a.liquidityPremium * 1e4, 0)],
        { cls: 'total', cells: [t('spread.total'), fmt.bp(s.spread)] },
      ], { numericCols: [1] }),
      a.creditRiskPremium < 0 ? h('p', { class: 'note', style: { color: 'var(--red-dark)' } }, t('spread.negative')) : null,
      workings('sp-anat', t('spread.anatFormula'), [[t('spread.spread'), fmt.bp(s.spread)], [t('spread.pdPhys'), fmt.pctRaw(s.pdPhysical, 1)], [t('spread.lgd'), fmt.pctRaw(s.lgd, 0)], [t('spread.liq'), fmt.bp(s.liquidityPremium)]]),
    ];
  }));

  const breakeven = card(t('spread.beTitle'), ctx.live(() => {
    const s = S();
    const a = spreadAnatomy({ spread: bp(s.spread), pdPhysical: pct(s.pdPhysical), lgd: pct(s.lgd), liquidityPremium: bp(s.liquidityPremium) });
    return [
      h('p', { class: 'metric-value num' }, fmt.pct(a.breakEvenPD, 2)),
      h('p', null, t('spread.beRead', { spread: fmt.bp(s.spread), lgd: fmt.pctRaw(s.lgd, 0), pd: fmt.pct(a.breakEvenPD, 2) })),
      h('p', { class: 'small' }, t('spread.rnRead', { rn: fmt.pct(a.riskNeutralPD, 2), phys: fmt.pctRaw(s.pdPhysical, 1) })),
      h('p', { class: 'note' }, t('spread.beCaveat')),
      workings('sp-be', t('spread.beFormula'), [[t('spread.spread'), fmt.bp(s.spread)], [t('spread.lgd'), fmt.pctRaw(s.lgd, 0)], [t('spread.liq'), fmt.bp(s.liquidityPremium)]]),
    ];
  }));

  const explainer = card(t('spread.pvsqTitle'), ...paras(tr('spread.pvsq')),
    h('p', null, h('strong', null, t('spread.pvsqQ'))),
    reveal(ctx, 'pvsq', () => paras(tr('spread.pvsqA'))));

  const sizingCard = card(t('spread.sizingTitle'),
    slider({ path: 'spread.weight', label: t('spread.weight'), min: 0.25, max: 10, step: 0.25, fmt: (v) => fmt.pctRaw(v, 2) }),
    slider({ path: 'spread.sizeLgd', label: t('spread.lgd'), min: 5, max: 100, step: 1, fmt: (v) => fmt.pctRaw(v, 0) }),
    slider({ path: 'spread.restSpread', label: t('spread.restSpread'), min: 0, max: 400, step: 5, fmt: bpf }),
    ctx.live(() => {
      const s = S();
      const z = sizing({ weight: pct(s.weight), lgd: pct(s.sizeLgd), restSpread: bp(s.restSpread) });
      const z40 = sizing({ weight: pct(s.weight), lgd: pct(s.sizeLgd), restSpread: bp(40) });
      const z150 = sizing({ weight: pct(s.weight), lgd: pct(s.sizeLgd), restSpread: bp(150) });
      return [
        table([t('spread.measure'), t('spread.ofPortfolio')], [
          [t('spread.lossIfDefault'), fmt.pct(z.loss, 3)],
          [t('spread.restIncome', { s: fmt.bp(s.restSpread) }), fmt.pct(z.restIncome, 3)],
          { cls: 'hl', cells: [t('spread.years'), Number.isFinite(z.yearsToRecover) ? fmt.num(z.yearsToRecover, 2) : '∞'] },
          s.restSpread !== 40 ? [t('spread.restIncome', { s: fmt.bp(40) }), fmt.pct(z40.restIncome, 3)] : null,
          s.restSpread !== 150 ? [t('spread.restIncome', { s: fmt.bp(150) }), fmt.pct(z150.restIncome, 3)] : null,
        ].filter(Boolean), { numericCols: [1] }),
        h('p', { class: 'small' }, t('spread.sizingRead')),
        workings('sp-size', t('spread.sizingFormula'), [[t('spread.weight'), fmt.pctRaw(s.weight, 2)], [t('spread.lgd'), fmt.pctRaw(s.sizeLgd, 0)], [t('spread.restSpread'), fmt.bp(s.restSpread)]]),
      ];
    }));

  guidedKeep(breakeven);
  root.append(
    ...tabHeader('spread'),
    h('div', { class: 'grid grid-side' },
      h('div', { class: 'stack' }, inputs, sizingCard),
      h('div', { class: 'stack' }, anatomy, h('div', { class: 'grid grid-2' }, breakeven, explainer))),
  );
}

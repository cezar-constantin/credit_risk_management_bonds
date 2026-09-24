// 10 · Capital — illustrative risk weights, IRB vs weighted approach, OCI into CET1, G-SIB/TLAC facts.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, segmented, select, slider, table, workings, paras, list, reveal } from '../ui.js';
import { irbCorporateRW, capitalCharge } from '../../engine/index.js';
import { tabHeader, guidedKeep } from './common.js';
import { position, figures } from '../model.js';

export function render(root, ctx) {
  const rwTable = card(t('capital.rwTitle'),
    h('span', { class: 'label-illustrative' }, t('ui.illustrative')),
    table([t('capital.exposure'), t('capital.rw'), t('capital.ref')],
      CASE.riskWeights.map((r) => [t(`capital.rwRows.${r.id}`), fmt.pctRaw(r.rw, 0), t(`capital.rwRef.${r.id}`)]), { numericCols: [1] }),
    h('p', { class: 'note' }, t('capital.rwNote')),
    workings('cap-holdings', t('capital.weightedFormula'), [[t('capital.rwRows.bankTier2'), '150%']], t('capital.holdingsNote')));

  const approach = card(t('capital.approachTitle'),
    segmented({ path: 'capital.approach', label: t('capital.approach'), options: [{ value: 'weighted', label: t('capital.weighted') }, { value: 'irb', label: t('capital.irb') }] }),
    ctx.live(() => {
      const c = store.get().capital;
      if (c.approach === 'weighted') {
        return select({ path: 'capital.rwClass', label: t('capital.rwClass'), options: CASE.riskWeights.map((r) => ({ value: r.id, label: `${t(`capital.rwRows.${r.id}`)} — ${fmt.pctRaw(r.rw, 0)}` })) });
      }
      return h('div', null,
        slider({ path: 'capital.pd', label: t('capital.pd'), min: 0.05, max: 30, step: 0.05, fmt: (v) => fmt.pctRaw(v, 2) }),
        slider({ path: 'capital.lgd', label: t('capital.lgd'), min: 5, max: 100, step: 1, fmt: (v) => fmt.pctRaw(v, 0) }),
        slider({ path: 'capital.maturity', label: t('capital.maturity'), min: 1, max: 5, step: 0.25, fmt: (v) => fmt.years(v, 2) }));
    }),
    slider({ path: 'capital.ratio', label: t('capital.ratio'), min: 8, max: 16, step: 0.25, fmt: (v) => fmt.pctRaw(v, 2) }),
    ctx.live(() => {
      const c = store.get().capital;
      const ead = position().nominal;
      let rw;
      let rows;
      let formula;
      if (c.approach === 'weighted') {
        rw = CASE.riskWeights.find((r) => r.id === c.rwClass).rw / 100;
        formula = t('capital.weightedFormula');
        rows = [[t('capital.rwClass'), t(`capital.rwRows.${c.rwClass}`)], [t('capital.rw'), fmt.pct(rw, 0)]];
      } else {
        const irb = irbCorporateRW({ pd: c.pd / 100, lgd: c.lgd / 100, maturity: c.maturity });
        rw = irb.rw;
        formula = t('capital.irbFormula');
        rows = [[t('capital.pd'), fmt.pctRaw(c.pd, 2)], [t('capital.lgd'), fmt.pctRaw(c.lgd, 0)], [t('capital.maturity'), fmt.num(c.maturity, 2)], ['R', fmt.num(irb.R, 4)], ['b', fmt.num(irb.b, 4)], ['K', fmt.pct(irb.K, 2)]];
      }
      const ch = capitalCharge({ exposure: ead, rw, ratio: c.ratio / 100 });
      return [
        table([t('capital.measure'), t('capital.value')], [
          [t('capital.ead'), fmt.money(ead, 0)],
          [t('capital.rw'), fmt.pct(rw, 1)],
          [t('capital.rwa'), fmt.money(ch.rwa)],
          { cls: 'total', cells: [t('capital.capitalReq', { r: fmt.pctRaw(c.ratio, 2) }), fmt.money(ch.capital)] },
        ], { numericCols: [1] }),
        workings('cap-rw', formula, [...rows, [t('capital.ead'), fmt.money(ead, 0)], [t('capital.ratio'), fmt.pctRaw(c.ratio, 2)]], t('capital.irbNote')),
      ];
    }));

  const oci = card(t('capital.ociTitle'), ctx.live(() => {
    const F = figures();
    const R = F.recognition;
    return [
      h('p', { class: 'small' }, t('capital.ociText')),
      table([t('capital.measure'), t('lens.AC.short'), t('lens.FVOCI.short'), t('lens.FVTPL.short')], [
        [t('capital.cet1Effect'), fmt.money(R.ac.equityCumulative, 2, { sign: true }), fmt.money(R.fvoci.equityCumulative, 2, { sign: true }), fmt.money(R.fvtpl.equityCumulative, 2, { sign: true })],
        [t('capital.ofWhichOci'), '–', fmt.money(R.fvoci.ociCumulative, 2, { sign: true }), '–'],
      ], { numericCols: [1, 2, 3], caption: t('capital.ociCaption') }),
      workings('cap-oci', t('capital.ociFormula'), [[t('recog.pnl'), fmt.money(R.fvoci.pnlCumulative, 2, { sign: true })], [t('recog.oci'), fmt.money(R.fvoci.ociCumulative, 2, { sign: true })]], t('capital.ociNote')),
    ];
  }));

  const gsib = card(t('capital.gsibTitle'), list(tr('capital.gsibFacts')), h('p', { class: 'note' }, t('capital.gsibNote')));

  const nots = card(t('capital.notTitle'), h('ol', { class: 'statements' }, tr('capital.nots').map((x) => h('li', null, x))));

  const q = card(t('capital.qTitle'), h('p', null, t('capital.q')), reveal(ctx, 'q', () => paras(tr('capital.a'))));

  guidedKeep(nots);
  root.append(...tabHeader('capital'),
    h('div', { class: 'grid grid-2' }, h('div', { class: 'stack' }, approach, oci, q), h('div', { class: 'stack' }, rwTable, nots, gsib)));
}

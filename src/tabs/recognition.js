// 9 · Recognition — the April 2026 position through AC / FVOCI / FVTPL; ECL scenarios; SICR; five categories.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import * as fmt from '../format.js';
import { h, card, slider, segmented, checkbox, table, workings, paras, reveal, button, numberField, hint } from '../ui.js';
import { weightedEcl, recognition, fiveCategory, ifrsStage, ecl, pct, ceclOrderOfMagnitude } from '../../engine/index.js';
import { tabHeader, guidedKeep } from './common.js';
import { value, position, y0, figures } from '../model.js';

const EVIDENCE = ['spread', 'rating', 'financials', 'watchlist', 'dpd30'];

function compute() {
  const s = store.get();
  const r = s.recog;
  const pos = position();
  const v = value('apr26', 'none');
  const scen = r.scenarios.map((x) => ({ weight: x.weight, pd12: pct(x.pd12), pdLife: pct(x.pdLife), lgd: pct(x.lgd) }));
  const w = weightedEcl(scen, pos.nominal, { discount: r.discount, eir: y0(), years: 1 });
  const prev = ecl(pct(pos.pd12), pct(pos.lgd), pos.nominal);
  const allowance = Number(r.stage) === 1 ? w.ecl12 : w.eclLifetime;
  const rec = recognition({ grossAmortisedCost: v.amortisedCost, fairValue: v.mid, allowancePrev: prev, allowanceNew: allowance });
  return { s, r, pos, v, w, prev, allowance, rec };
}

export function render(root, ctx) {
  const scenCard = card(t('recog.scenTitle'),
    h('p', { class: 'small muted' }, t('recog.scenIntro')),
    [0, 1, 2].map((i) => h('fieldset', { class: 'card', style: { marginBottom: '8px' } },
      h('legend', null, t(`recog.scen${i}`)),
      h('div', { class: 'grid grid-4' },
        numberField({ path: `recog.scenarios.${i}.weight`, label: t('recog.weight'), min: 0, max: 100, step: 5, suffix: '%' }),
        numberField({ path: `recog.scenarios.${i}.lgd`, label: t('recog.lgd'), min: 0, max: 100, step: 1, suffix: '%' }),
        numberField({ path: `recog.scenarios.${i}.pd12`, label: t('recog.pd12'), min: 0, max: 100, step: 0.5, suffix: '%' }),
        numberField({ path: `recog.scenarios.${i}.pdLife`, label: t('recog.pdLife'), min: 0, max: 100, step: 0.5, suffix: '%' })))),
    segmented({ path: 'recog.discount', label: t('recog.discount'), options: [{ value: false, label: t('recog.undiscounted') }, { value: true, label: t('recog.discounted') }] }));

  const sicr = card(t('recog.sicrTitle'),
    h('p', { class: 'small' }, t('recog.sicrIntro')),
    EVIDENCE.map((e) => checkbox({ path: `recog.evidence.${e}`, label: t(`recog.evidence.${e}`) })),
    ctx.live(() => {
      const ev = store.get().recog.evidence;
      const n = EVIDENCE.filter((e) => ev[e]).length;
      return h('p', { class: 'small' }, ev.dpd30 ? t('recog.presumption') : t('recog.evidenceCount', { n }));
    }),
    segmented({ path: 'recog.stage', label: t('recog.stageJudgement'), options: [{ value: 1, label: t('recog.stage1') }, { value: 2, label: t('recog.stage2') }] }),
    hint(ctx, 'h1', t('recog.hint')),
    h('p', { class: 'note' }, t('recog.poci')));

  const eclCard = card(t('recog.eclTitle'), ctx.live(() => {
    const c = compute();
    return [
      table([t('recog.measure'), t('recog.amount')], [
        [t('recog.ecl12'), fmt.money(c.w.ecl12)],
        [t('recog.eclLife'), fmt.money(c.w.eclLifetime)],
        [t('recog.prevAllowance'), fmt.money(c.prev)],
        [t('recog.marAllowance'), fmt.money(figures().ecl.mar26)],
        { cls: 'hl', cells: [t('recog.allowance', { n: c.r.stage }), fmt.money(c.allowance)] },
        { cls: 'total', cells: [t('recog.charge'), fmt.money(-(c.allowance - c.prev), 2, { sign: true })] },
        [t('recog.periodCharge'), fmt.money(-(c.allowance - figures().ecl.mar26), 2, { sign: true })],
        [t('recog.altCharge', { n: Number(c.r.stage) === 1 ? 2 : 1 }), fmt.money(-((Number(c.r.stage) === 1 ? c.w.eclLifetime : c.w.ecl12) - c.prev), 2, { sign: true })],
      ], { numericCols: [1] }),
      workings('rec-ecl', t('recog.eclFormula'), [
        ...c.r.scenarios.map((x, i) => [t(`recog.scen${i}`), `w ${fmt.pctRaw(x.weight, 0)} · PD12 ${fmt.pctRaw(x.pd12, 1)} · PDlife ${fmt.pctRaw(x.pdLife, 1)} · LGD ${fmt.pctRaw(x.lgd, 0)}`]),
        [t('recog.ead'), fmt.money(c.pos.nominal)], [t('recog.eir'), fmt.pct(y0())], [t('recog.discount'), c.r.discount ? t('recog.discounted') : t('recog.undiscounted')],
      ]),
    ];
  }));

  // v5: accounting bridge — three dates × three lenses, plus the period 15 Mar → 15 Apr 2026.
  const lenses = card(t('recog.bridgeTitle'), ctx.live(() => {
    const B = figures().bridge;
    const D = B.order;
    const m = (x) => fmt.money(x, 2, { sign: true });
    const c = (x) => fmt.money(x);
    const dateHead = D.map((d) => t(`recog.bridgeDates.${d}`));
    const rows = [
      { cls: 'hl', cells: [t('lens.AC.name'), '', '', '', ''] },
      [t('recog.bridge.acNet'), ...D.map((d) => c(B[d].ac.carrying)), '–'],
      [t('recog.bridge.allowance'), ...D.map((d) => c(B[d].ac.allowance)), m(B[D[2]].ac.allowance - B[D[1]].ac.allowance)],
      [t('recog.bridge.pnl'), ...D.map((d) => m(B[d].ac.pnl)), m(B.period.ac.pnl)],
      { cls: 'hl', cells: [t('lens.FVOCI.name'), '', '', '', ''] },
      [t('recog.bridge.carrying'), ...D.map((d) => c(B[d].fvoci.carrying)), '–'],
      [t('recog.bridge.allowanceOci'), ...D.map((d) => c(B[d].fvoci.allowance)), '–'],
      [t('recog.bridge.pnl'), ...D.map((d) => m(B[d].fvoci.pnl)), m(B.period.fvoci.pnl)],
      [t('recog.bridge.oci'), ...D.map((d) => m(B[d].fvoci.oci)), m(B.period.fvoci.oci)],
      [t('recog.bridge.equity'), ...D.map((d) => m(B[d].fvoci.equity)), m(B.period.fvoci.equity)],
      { cls: 'hl', cells: [t('lens.FVTPL.name'), '', '', '', ''] },
      [t('recog.bridge.pnlEquity'), ...D.map((d) => m(B[d].fvtpl.equity)), m(B.period.fvtpl.pnl)],
    ];
    return [
      table([t('recog.line'), ...dateHead, t('recog.bridgeDates.period')], rows, { numericCols: [1, 2, 3, 4], caption: t('recog.bridgeCaption') }),
      h('p', { class: 'small' }, t('recog.bridgeRead')),
      workings('rec-bridge', t('recog.bridgeFormula'), [
        [t('recog.bridgeDates.day1'), `${t('recog.allowanceShort')} ${c(B.day1.ac.allowance)}`],
        [t('recog.bridgeDates.mar26'), `${t('recog.allowanceShort')} ${c(B.mar26.ac.allowance)} (PD 2%)`],
        [t('recog.bridgeDates.apr26'), `${t('recog.allowanceShort')} ${c(B.apr26.ac.allowance)} (Stage 2)`],
      ], t('recog.lensNote')),
    ];
  }));

  const classification = card(t('recog.classTitle'), ...paras(tr('recog.classText'), 'small'),
    table([t('recog.bm'), t('recog.sppi'), t('recog.result')], [
      [t('recog.bmHold'), t('recog.sppiPass'), t('lens.AC.name')],
      [t('recog.bmBoth'), t('recog.sppiPass'), t('lens.FVOCI.name')],
      [t('recog.bmOther'), t('recog.sppiAny'), t('lens.FVTPL.name')],
      [t('recog.bmAny'), t('recog.sppiFail'), t('lens.FVTPL.name')],
    ]));

  // Five-category vs IFRS stage.
  const fcInputs = h('div', { class: 'grid grid-2' },
    slider({ path: 'recog.fc.dpd', label: t('recog.fc.dpd'), min: 0, max: 400, step: 1, fmt: (v) => t('recog.fc.days', { n: v }) }),
    slider({ path: 'recog.fc.eclRatio', label: t('recog.fc.eclRatio'), min: 0, max: 100, step: 1, fmt: (v) => fmt.pctRaw(v, 0) }),
    slider({ path: 'recog.fc.npShare', label: t('recog.fc.npShare'), min: 0, max: 100, step: 1, fmt: (v) => fmt.pctRaw(v, 0) }),
    h('div', null,
      checkbox({ path: 'recog.fc.impaired', label: t('recog.fc.impaired') }),
      checkbox({ path: 'recog.fc.restructured', label: t('recog.fc.restructured') }),
      checkbox({ path: 'recog.fc.adverse', label: t('recog.fc.adverse') }),
      button(t('recog.fc.useCase'), () => {
        const c = compute();
        store.get().recog.fc.eclRatio = Math.round((100 * c.allowance) / c.v.amortisedCost);
        store.save();
        store.emit('*');
      }, { cls: 'btn btn-small' })));

  const fcOut = ctx.live(() => {
    const s = store.get();
    const fc = s.recog.fc;
    const cat = fiveCategory({ dpd: fc.dpd, creditImpaired: fc.impaired, eclRatio: fc.eclRatio / 100, restructured: fc.restructured, npShare: fc.npShare / 100, adverse: fc.adverse });
    const st = ifrsStage({ dpd: fc.dpd, creditImpaired: fc.impaired, sicr: Number(s.recog.stage) === 2 });
    return [
      h('div', { class: 'grid grid-2' },
        h('div', { class: 'metric tone-red' }, h('div', { class: 'metric-label' }, t('recog.fc.category')), h('div', { class: 'metric-value' }, t(`recog.fc.cats.${cat.category}`)),
          h('div', { class: 'metric-sub' }, cat.nonPerforming ? t('recog.fc.npl') : t('recog.fc.performing'))),
        h('div', { class: 'metric' }, h('div', { class: 'metric-label' }, t('recog.fc.stage')), h('div', { class: 'metric-value' }, t('tiles.stage', { n: st.stage })),
          h('div', { class: 'metric-sub' }, t(`recog.fc.stageReason.${st.reason}`)))),
      h('p', { class: 'small', style: { marginTop: '8px' } }, h('strong', null, t('recog.fc.rulesFired')), ' ',
        cat.fired.length ? cat.fired.map((f) => t(`recog.fc.rules.${f}`)).join('; ') : t('recog.fc.noRule')),
      h('p', { class: 'small' }, t(cat.category === 'normal' && st.stage === 2 ? 'recog.fc.whyDiffer' : 'recog.fc.whyGeneral')),
      workings('rec-fc', t('recog.fc.formula'), [[t('recog.fc.dpd'), fc.dpd], [t('recog.fc.eclRatio'), fmt.pctRaw(fc.eclRatio, 0)], [t('recog.fc.npShare'), fmt.pctRaw(fc.npShare, 0)]], t('recog.fc.source')),
    ];
  });

  const fcCard = card(t('recog.fc.title'), ...paras(tr('recog.fc.intro'), 'small'), fcInputs, fcOut,
    h('p', { class: 'note' }, t('recog.fc.group')));

  // New York branch: CECL day-one comparison (order of magnitude only).
  const cecl = card(t('recog.cecl.title'), h('p', { class: 'small' }, t('recog.cecl.text')), ctx.live(() => {
    const pos = position();
    const ifrs = ecl(pct(pos.pd12), pct(pos.lgd), pos.nominal);
    const us = ceclOrderOfMagnitude({ pdAnnual: pct(pos.pd12), lgd: pct(pos.lgd), ead: pos.nominal, years: pos.tenor });
    return [
      table([t('recog.measure'), t('recog.amount')], [
        [t('recog.cecl.ifrs'), fmt.money(ifrs)],
        { cls: 'hl', cells: [t('recog.cecl.cecl'), `≈ ${fmt.money(us)}`] },
      ], { numericCols: [1] }),
      h('p', { class: 'note' }, t('recog.cecl.label')),
      workings('rec-cecl', t('recog.cecl.formula'), [[t('recog.pd12'), fmt.pctRaw(pos.pd12, 1)], [t('recog.lgd'), fmt.pctRaw(pos.lgd, 0)], [t('recog.ead'), fmt.money(pos.nominal)], [t('recog.cecl.years'), pos.tenor]]),
      h('p', { class: 'small muted' }, t('recog.cecl.source')),
    ];
  }));

  const q = card(t('recog.qTitle'), h('p', null, t('recog.q')), reveal(ctx, 'q', () => paras(tr('recog.a'))));

  guidedKeep(lenses);
  root.append(...tabHeader('recognition'),
    h('div', { class: 'grid grid-side' },
      h('div', { class: 'stack' }, scenCard, sicr),
      h('div', { class: 'stack' }, lenses, h('div', { class: 'grid grid-2' }, eclCard, q), classification, fcCard, cecl)));
}

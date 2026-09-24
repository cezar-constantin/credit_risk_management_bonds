// 3 · Repricing lab (Stops 1–2) — approximation vs DCF, decomposition, price path, holding-period result.
import { t } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, slider, segmented, table, workings, button, hint } from '../ui.js';
import { cashflows, pv, macaulayDuration, modifiedDuration, shockCompare, decompose, holdingPeriod, pricePath, accrued, bp } from '../../engine/index.js';
import { lineChart, barChart } from '../charts.js';
import { tabHeader, tallyInput, voteBar, legend } from './common.js';
import { bond, y0, p0, scale, position, value, stopById } from '../model.js';

const PRESETS = [
  { id: 't0', dBench: 0, dSpread: 0, bidAsk: 5, months: 0 },
  { id: 'sep25', dBench: 30, dSpread: 120, bidAsk: 40, months: 6 },
  { id: 'mar26', dBench: 30, dSpread: 240, bidAsk: 40, months: 12 },
];

function applyPreset(p) {
  const lab = store.get().lab;
  Object.assign(lab, { dBench: p.dBench, dSpread: p.dSpread, bidAsk: p.bidAsk, months: p.months });
  if (p.id === 'mar26' || p.id === 'sep25') store.get().ctx.stop = p.id;
  store.save();
  store.emit('*');
}

export function render(root, ctx) {
  const L = () => store.get().lab;
  const maxMonths = position().tenor * 12 - 1;
  const bpFmt = (v) => fmt.bp(v, 0, { sign: true });

  const controls = card(t('lab.controls'),
    h('div', { class: 'row', style: { marginBottom: '8px' } }, PRESETS.map((p) => button(t(`lab.preset.${p.id}`), () => applyPreset(p), { cls: 'btn btn-small' }))),
    slider({ path: 'lab.dBench', label: t('lab.dBench'), min: -100, max: 300, step: 5, fmt: bpFmt }),
    slider({ path: 'lab.dSpread', label: t('lab.dSpread'), min: -150, max: 900, step: 5, fmt: bpFmt }),
    slider({ path: 'lab.bidAsk', label: t('lab.bidAsk'), min: 0, max: 200, step: 5, fmt: (v) => fmt.bp(v) }),
    slider({ path: 'lab.months', label: t('lab.horizon'), min: 0, max: maxMonths, step: 1, fmt: (v) => t('lab.months', { n: v }) }),
    segmented({ path: 'lab.view', label: t('lab.view'), options: [{ value: 'instant', label: t('lab.instant') }, { value: 'holding', label: t('lab.holding') }] }),
    segmented({ path: 'lab.dirty', label: t('lab.priceBasis'), options: [{ value: false, label: t('lab.clean') }, { value: true, label: t('lab.dirty') }] }),
    hint(ctx, 'h1', t('lab.hint')));

  // Shared computation for the live regions.
  const calc = () => {
    const l = L();
    const b = bond();
    const e = l.months / 12;
    const yb = y0();
    const d = decompose(b, e, { y0: yb, dBench: bp(l.dBench), dSpread: bp(l.dSpread), bidAsk: bp(l.bidAsk) });
    const flows = cashflows(b, e);
    const dy = bp(l.dBench + l.dSpread);
    const sh = shockCompare(flows, yb, dy, scale());
    const hp = holdingPeriod(b, e, { purchasePrice: p0(), y: d.yMid, fundingRate: position().funding / 100 });
    const acc = accrued(b, e);
    return { l, b, e, yb, d, flows, dy, sh, hp, acc, mac: macaulayDuration(flows, yb), mod: modifiedDuration(flows, yb) };
  };

  const approxCard = card(t('lab.approxTitle'), ctx.live(() => {
    const c = calc();
    return [
      table([t('lab.measure'), t('lab.value')], [
        [t('lab.remaining'), fmt.years(c.b.tenor - c.e)],
        [t('lab.mvBefore'), fmt.money(c.sh.p0)],
        [t('lab.macaulay'), fmt.years(c.mac, 2)],
        [t('lab.modified'), fmt.num(c.mod, 2)],
        [t('lab.dy'), fmt.bp(c.dy * 10000, 0, { sign: true })],
        [t('lab.approx'), fmt.money(c.sh.approx, 2, { sign: true })],
        [t('lab.dcf'), fmt.money(c.sh.dcf, 2, { sign: true })],
        [t('lab.gap'), fmt.money(c.sh.gap, 2, { sign: true })],
      ], { numericCols: [1] }),
      workings('lab-approx', t('lab.approxFormula'), [
        [t('lab.y0'), fmt.pct(c.yb)], [t('lab.dy'), fmt.bp(c.dy * 10000, 0, { sign: true })],
        [t('lab.cashflows'), c.flows.map((f) => `${fmt.num(f.amount, 2)} @ ${fmt.num(f.t, 3)}`).join('; ')],
        [t('lab.scale'), fmt.num(scale(), 2)],
      ], t('lab.approxNote')),
    ];
  }));

  const decompCard = card(t('lab.decompTitle'), ctx.live(() => {
    const c = calc();
    const s = scale();
    const items = [
      { label: t('lab.rates'), value: c.d.rates * s, color: '--series-rates' },
      { label: t('lab.spreadEff'), value: c.d.spread * s, color: '--series-spread' },
      { label: t('lab.liquidity'), value: c.d.liquidity * s, texture: true },
      { label: t('lab.realisedIfSold'), value: c.d.realised * s, color: '--series-cost' },
    ];
    return [
      legend([{ label: t('lab.rates'), color: '--series-rates' }, { label: t('lab.spreadEff'), color: '--series-spread' }, { label: t('lab.liquidity'), hatch: true }, { label: t('lab.realisedIfSold'), color: '--series-cost' }]),
      barChart({ items, title: t('lab.decompTitle'), fmt: (v) => fmt.money(v, 2, { sign: true }) }),
      h('p', { class: 'small' }, t('lab.decompRead', { mid: fmt.price(c.d.mid), bid: fmt.price(c.d.bid), base: fmt.price(c.d.base) })),
      workings('lab-decomp', t('lab.decompFormula'), [
        [t('lab.y0'), fmt.pct(c.yb)], [t('lab.yMid'), fmt.pct(c.d.yMid)], [t('lab.yBid'), fmt.pct(c.d.yBid)],
        [t('lab.base'), fmt.price(c.d.base)], [t('lab.afterRates'), fmt.price(c.d.afterRates)], [t('lab.mid'), fmt.price(c.d.mid)], [t('lab.bid'), fmt.price(c.d.bid)],
      ], t('lab.decompNote')),
    ];
  }));

  const pathCard = card(t('lab.pathTitle'), ctx.live(() => {
    const c = calc();
    const dirty = Boolean(c.l.dirty);
    const pAC = pricePath(c.b, c.yb, { dirty }).filter((p) => p.m < c.b.tenor * 12);
    const pMid = pricePath(c.b, c.d.yMid, { dirty }).filter((p) => p.m < c.b.tenor * 12);
    const pBid = pricePath(c.b, c.d.yBid, { dirty }).filter((p) => p.m < c.b.tenor * 12);
    const toPts = (arr) => arr.map((p) => ({ x: p.m, y: p.v }));
    const markers = store.get().preset === 'class' ? ['sep25', 'mar26', 'apr26', 'jun26'].map((id) => {
      const v = value(id, 'none');
      const st = stopById(id);
      const acc = accrued(c.b, st.months / 12);
      const y = dirty ? v.perHundred.mid : v.perHundred.mid - acc;
      return { x: st.months, y, label: fmt.date(st.date, { month: true }) };
    }) : [];
    return [
      legend([{ label: t('lab.pathAC'), color: '--series-cost', line: true }, { label: t('lab.pathMid'), color: '--series-spread', line: true }, { label: t('lab.pathBid'), color: '--series-bid', line: true, dash: true }]),
      lineChart({
        title: t('lab.pathTitle'),
        series: [
          { id: 'ac', label: t('lab.pathACShort'), color: '--series-cost', points: toPts(pAC) },
          { id: 'mid', label: t('lab.pathMidShort'), color: '--series-spread', points: toPts(pMid) },
          { id: 'bid', label: t('lab.pathBidShort'), color: '--series-bid', dash: '6 4', points: toPts(pBid) },
        ],
        markers,
        vline: { x: c.l.months, label: t('lab.months', { n: c.l.months }) },
        xLabel: t('lab.xMonths'), yLabel: dirty ? t('lab.dirty') : t('lab.clean'),
        fmtX: (v) => String(Math.round(v)), fmtY: (v) => v.toFixed(2),
      }),
      h('p', { class: 'small muted' }, t('lab.pathNote')),
    ];
  }));

  const hpCard = card(t('lab.hpTitle'), ctx.live(() => {
    const c = calc();
    const s = scale();
    if (c.l.view === 'instant') {
      return [h('p', null, t('lab.instantNote')),
        table([t('lab.measure'), t('lab.value')], [
          [t('lab.economicChange'), fmt.money(c.d.economic * s, 2, { sign: true })],
          [t('lab.realisedIfSold'), fmt.money(c.d.realised * s, 2, { sign: true })],
        ], { numericCols: [1] })];
    }
    const dirty = Boolean(c.l.dirty);
    const rows = [
      [t('lab.couponsRecv'), fmt.money(c.hp.couponIncome * s, 2, { sign: true })],
      [t('lab.accrued'), fmt.money(c.hp.accrued * s, 2, { sign: true })],
      [dirty ? t('lab.dirtyChange') : t('lab.priceChange'), fmt.money((dirty ? c.hp.dirty - p0() : c.hp.priceChange) * s, 2, { sign: true })],
      { cls: 'total', cells: [t('lab.gross'), fmt.money(c.hp.gross * s, 2, { sign: true })] },
      [t('lab.funding', { f: fmt.pctRaw(position().funding) }), fmt.money(-c.hp.funding * s, 2, { sign: true })],
      { cls: 'total', cells: [t('lab.funded'), fmt.money(c.hp.funded * s, 2, { sign: true })] },
      [t('lab.liquidityIfSold'), fmt.money(c.d.liquidity * s, 2, { sign: true })],
    ];
    if (dirty) rows.splice(1, 1);
    return [
      table([t('lab.component'), t('lab.value')], rows, { numericCols: [1] }),
      h('p', { class: 'small muted' }, dirty ? t('lab.dirtyNote') : t('lab.cleanNote')),
      workings('lab-hp', t('lab.hpFormula'), [
        [t('lab.purchasePrice'), fmt.price(p0())], [t('lab.cleanNow'), fmt.price(c.hp.clean)], [t('lab.dirtyNow'), fmt.price(c.hp.dirty)],
        [t('lab.accrued'), fmt.num(c.hp.accrued, 2)], [t('lab.couponsRecv'), fmt.num(c.hp.couponIncome, 2)],
        [t('lab.fundingRate'), fmt.pctRaw(position().funding)], [t('lab.elapsed'), fmt.years(c.e)],
      ]),
    ];
  }));

  // Three-shock exercise: vote first, then reveal.
  const shocks = CASE.shocks;
  const exercise = card(t('lab.exTitle'),
    h('p', null, t('lab.exQ')),
    h('ol', { type: 'A' }, shocks.map((sh) => h('li', null, t(`lab.shock.${sh.id}`)))),
    ctx.live(() => {
      const s = store.get();
      const total = shocks.reduce((a, sh) => a + (s.lab.votes[sh.id] || 0), 0);
      if (s.mode === 'instructor') {
        return h('div', null, h('p', { class: 'small muted' }, t('lab.exTally')),
          shocks.map((sh, i) => h('div', { class: 'row' }, h('span', { style: { minWidth: '2em', fontWeight: 700 } }, 'ABC'[i]),
            tallyInput(`lab.votes.${sh.id}`, t('lab.voteFor', { x: 'ABC'[i] })), h('div', { style: { flex: 1 } }, voteBar(s.lab.votes[sh.id] || 0, total)))));
      }
      return segmented({ path: 'lab.myVote', label: t('lab.myVote'), options: shocks.map((sh, i) => ({ value: sh.id, label: 'ABC'[i] })) });
    }),
    (() => { ctx.revealKeys.push('repricing.shocks'); return null; })(),
    ctx.live(() => {
      const s = store.get();
      const voted = s.mode === 'instructor' ? shocks.some((sh) => s.lab.votes[sh.id] > 0) : Boolean(s.lab.myVote);
      if (!s.reveals['repricing.shocks']) {
        return h('div', null,
          !voted ? h('p', { class: 'small muted' }, t('lab.voteFirst')) : null,
          button(s.mode === 'participant' ? t('ui.checkAnswer') : t('ui.reveal'), () => { s.reveals['repricing.shocks'] = true; store.save(); store.emit('reveals'); },
            { cls: 'btn btn-reveal', attrs: { disabled: !voted, 'data-fkey': 'reveal:repricing.shocks' } }));
      }
      const flows0 = cashflows(bond(), 0);
      const rows = shocks.map((sh, i) => {
        const r = shockCompare(flows0, y0(), bp(sh.bp), scale());
        return ['ABC'[i] + '. ' + t(`lab.shock.${sh.id}`), fmt.money(r.approx, 2, { sign: true }), fmt.money(r.dcf, 2, { sign: true }), sh.kind === 'benchmark' ? t('mech.notCredit') : t('mech.credit')];
      });
      return h('div', { class: 'revealed', tabindex: '-1', 'data-fkey': 'reveal:repricing.shocks' },
        table([t('lab.shockCol'), t('lab.approx'), t('lab.dcf'), t('lab.creditQ')], rows, { numericCols: [1, 2] }),
        h('p', null, t('lab.exAnswer')),
        workings('lab-ex', t('lab.exFormula'), [[t('lab.y0'), fmt.pct(y0())], [t('lab.modified'), fmt.num(modifiedDuration(flows0, y0()), 2)], [t('lab.mvBefore'), fmt.money(pv(flows0, y0()) * scale())]]));
    }));

  root.append(
    ...tabHeader('repricing'),
    h('div', { class: 'grid grid-side' },
      h('div', { class: 'stack' }, controls, exercise),
      h('div', { class: 'stack' },
        h('div', { class: 'grid grid-2' }, approxCard, hpCard),
        decompCard,
        pathCard)),
  );
}

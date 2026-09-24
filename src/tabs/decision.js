// 12 · Decision (Stop 4) — proceeds vs probability-weighted holding value, extension branch, hedge
// feasibility and the decision form (validate, print/PDF, JSON export/import, replay against A or B).
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import * as fmt from '../format.js';
import { h, card, slider, numberField, segmented, select, textField, table, workings, button, paras } from '../ui.js';
import { holdValue, breakEvenProbability, extensionBranch } from '../../engine/index.js';
import { barChart } from '../charts.js';
import { tabHeader, legend } from './common.js';
import { value, allowanceAt, market } from '../model.js';

const ACTIONS = ['hold', 'reduce', 'hedge', 'exit'];
const METRICS = ['spread', 'price', 'cashCover', 'event', 'date'];

function econ() {
  const d = store.get().decision;
  const jun = value('jun26', 'none');
  const A = value('jul26', 'A');
  const B = value('jul26', 'B');
  const al = allowanceAt('jun26');
  const pA = d.pA / 100;
  const hv = holdValue({ pA, valueA: A.mid, valueB: B.mid, capitalCost: d.capitalCost, liquidityCost: d.liquidityCost });
  const be = breakEvenProbability({ saleProceeds: jun.bid, valueA: A.mid, valueB: B.mid, capitalCost: d.capitalCost, liquidityCost: d.liquidityCost });
  return { d, jun, A, B, al, pA, hv, be };
}

export function validate(form) {
  const checks = [
    ['action', Boolean(form.action)],
    ['rationale', (form.rationale || '').trim().length >= 30],
    ['owner', (form.owner || '').trim().length >= 2],
    ['trigger', (form.triggers || []).some((x) => x.number !== '' && x.number != null && x.date && (x.consequence || '').trim().length >= 5)],
    ['escalation', (form.escalation || '').trim().length >= 5],
    ['responseA', (form.responseA || '').trim().length >= 5],
    ['responseB', (form.responseB || '').trim().length >= 5],
  ];
  if (form.action === 'reduce') checks.splice(1, 0, ['sellShare', form.sellShare > 0 && form.sellShare < 100]);
  return checks;
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function scenarioMetrics(cf) {
  const v = value('jul26', cf);
  const m = market('jul26', cf);
  return { spread: m.spread, price: v.perHundred.mid, cashCover: cf === 'A' ? 0.6 : 0.3, event: cf === 'B', date: '2026-07-15' };
}

function triggerFires(tr, sm) {
  if (tr.metric === 'event') return sm.event;
  if (tr.metric === 'date') return Boolean(tr.date) && tr.date <= sm.date;
  const n = Number(tr.number);
  if (tr.number === '' || Number.isNaN(n)) return false;
  const v = sm[tr.metric];
  return tr.op === 'le' ? v <= n : v >= n;
}

export function render(root, ctx, { goTab }) {
  // ---- Ladder ---------------------------------------------------------------------------------
  const ladder = card(t('decision.ladderTitle'), ctx.live(() => {
    const e = econ();
    const s = e.jun.scale;
    const items = [
      { label: t('decision.l.acGross'), value: e.jun.amortisedCost / s, color: '--series-cost' },
      { label: t('decision.l.acNet'), value: (e.jun.amortisedCost - e.al.allowance) / s, color: '--series-cost' },
      { label: t('decision.l.mid'), value: e.jun.mid / s, color: '--series-spread' },
      { label: t('decision.l.bid'), value: e.jun.bid / s, color: '--series-bid' },
      { label: t('decision.l.holdA'), value: e.A.mid / s, color: '--series-rates' },
      { label: t('decision.l.holdB'), value: e.B.mid / s, color: '--series-rates' },
      { label: t('decision.l.expected', { p: fmt.pctRaw(e.d.pA, 0) }), value: e.hv / s, texture: true },
    ];
    return [
      legend([{ label: t('decision.l.legendAC'), color: '--series-cost' }, { label: t('decision.l.mid'), color: '--series-spread' }, { label: t('decision.l.bid'), color: '--series-bid' }, { label: t('decision.l.legendHold'), color: '--series-rates' }, { label: t('decision.l.expectedShort'), hatch: true }]),
      barChart({ items, title: t('decision.ladderTitle'), base: 85, fmt: (v) => fmt.price(v), marker: { value: e.jun.bid / s, label: t('decision.l.bidMarker') } }),
      h('p', { class: 'small muted' }, t('decision.ladderNote')),
    ];
  }));

  // ---- Probability, break-even ----------------------------------------------------------------
  const prob = card(t('decision.probTitle'),
    slider({ path: 'decision.pA', label: t('decision.pA'), min: 0, max: 100, step: 1, fmt: (v) => fmt.pctRaw(v, 0) }),
    h('div', { class: 'grid grid-2' },
      numberField({ path: 'decision.capitalCost', label: t('decision.capitalCost'), min: 0, max: 20, step: 0.05, suffix: t('units.rmbM') }),
      numberField({ path: 'decision.liquidityCost', label: t('decision.liquidityCost'), min: 0, max: 20, step: 0.05, suffix: t('units.rmbM') })),
    ctx.live(() => {
      const e = econ();
      const hold = e.hv;
      const sell = e.jun.bid;
      const better = hold > sell ? 'hold' : 'sell';
      const beClip = e.be.clipped * 100;
      return [
        h('div', { class: 'row prob-bar', style: { alignItems: 'center' } },
          h('div', { style: { flex: 1, position: 'relative', height: '26px', background: 'var(--panel)', borderRadius: '4px' }, role: 'img', 'aria-label': t('decision.beAria', { p: fmt.pct(e.be.raw, 1), cur: fmt.pctRaw(e.d.pA, 0) }) },
            h('span', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${e.d.pA}%`, background: 'var(--red-tint)', borderRight: '2px solid var(--red)' } }),
            h('span', { class: 'ladder-marker', style: { position: 'absolute', left: `calc(${beClip}% - 1px)`, top: '-4px', bottom: '-4px', borderLeft: '3px dashed var(--red-dark)' } }),
            h('span', { class: 'small', style: { position: 'absolute', left: `calc(${Math.min(beClip, 80)}% + 6px)`, top: '3px', fontWeight: 700, color: 'var(--red-dark)' } }, `${t('decision.breakEven')} ${fmt.pct(e.be.raw, 1)}`))),
        table([t('decision.measure'), t('decision.value')], [
          [t('decision.saleProceeds'), fmt.money(sell)],
          [t('decision.holdA'), fmt.money(e.A.mid)],
          [t('decision.holdB'), fmt.money(e.B.mid)],
          [t('decision.costs'), fmt.money(-(e.d.capitalCost + e.d.liquidityCost), 2, { sign: true })],
          { cls: 'total', cells: [t('decision.expectedHold'), fmt.money(hold)] },
          { cls: 'hl', cells: [t('decision.breakEvenP'), fmt.pct(e.be.raw, 1)] },
        ], { numericCols: [1] }),
        h('p', null, h('strong', null, better === 'hold' ? t('decision.readHold', { p: fmt.pct(e.be.raw, 1) }) : t('decision.readSell', { p: fmt.pct(e.be.raw, 1) }))),
        h('p', { class: 'note' }, t('decision.probNote')),
        workings('dec-be', t('decision.beFormula'), [[t('decision.saleProceeds'), fmt.money(sell)], [t('decision.holdA'), fmt.money(e.A.mid)], [t('decision.holdB'), fmt.money(e.B.mid)], [t('decision.capitalCost'), fmt.money(e.d.capitalCost)], [t('decision.liquidityCost'), fmt.money(e.d.liquidityCost)], [t('decision.pA'), fmt.pctRaw(e.d.pA, 0)]]),
      ];
    }));

  // ---- Extension branch -----------------------------------------------------------------------
  const ext = card(t('decision.extTitle'),
    h('p', { class: 'small' }, t('decision.extIntro')),
    h('div', { class: 'grid grid-2' },
      slider({ path: 'decision.ext.paidShare', label: t('decision.ext.paidShare'), min: 0, max: 100, step: 5, fmt: (v) => fmt.pctRaw(v, 0) }),
      slider({ path: 'decision.ext.delayYears', label: t('decision.ext.delay'), min: 1, max: 5, step: 1, fmt: (v) => fmt.years(v, 0) }),
      slider({ path: 'decision.ext.coupon', label: t('decision.ext.coupon'), min: 0, max: 10, step: 0.1, fmt: (v) => fmt.pctRaw(v, 2) }),
      slider({ path: 'decision.ext.rate', label: t('decision.ext.rate'), min: 0, max: 20, step: 0.1, fmt: (v) => fmt.pctRaw(v, 2) }),
      slider({ path: 'decision.ext.eir', label: t('decision.ext.eir'), min: 0, max: 10, step: 0.1, fmt: (v) => fmt.pctRaw(v, 2) })),
    ctx.live(() => {
      const x = store.get().decision.ext;
      const s = value('jun26', 'none').scale;
      const r = extensionBranch({ paidShare: x.paidShare / 100, delayYears: x.delayYears, coupon: x.coupon / 100, marketRate: x.rate / 100, eir: x.eir / 100 });
      return [
        table([t('decision.measure'), t('decision.value')], [
          [t('decision.ext.delayed'), fmt.money(r.delayed * s)],
          [t('decision.ext.pvMarket'), fmt.money(r.pvMarket * s)],
          { cls: 'hl', cells: [t('decision.ext.pvCost'), fmt.money(r.pvCost * s)] },
          [t('decision.ext.pvEir'), fmt.money(r.pvEir * s)],
          { cls: 'total', cells: [t('decision.ext.modLoss'), fmt.money(r.modificationLoss * s)] },
        ], { numericCols: [1] }),
        h('p', { class: 'small' }, t('decision.ext.read')),
        workings('dec-ext', t('decision.ext.formula'), r.flows.map((f) => [`t = ${f.t}`, fmt.num(f.amount * s, 2)]).concat([[t('decision.ext.rate'), fmt.pctRaw(x.rate, 2)], [t('decision.ext.eir'), fmt.pctRaw(x.eir, 2)]]), t('decision.ext.note')),
      ];
    }));

  const hedge = card(t('decision.hedgeTitle'), ...paras(tr('decision.hedge'), 'small'));

  // ---- Decision form (static inputs; only summaries are live) ---------------------------------
  const triggersBox = h('div');
  const buildTriggers = () => {
    const form = store.get().decision.form;
    triggersBox.replaceChildren(
      ...form.triggers.map((tr, i) => {
        if (!tr.op) tr.op = tr.metric === 'price' || tr.metric === 'cashCover' ? 'le' : 'ge';
        return h('div', { class: 'trigger-row' },
          select({ path: `decision.form.triggers.${i}.metric`, label: t('decision.f.metric'), options: METRICS.map((m) => ({ value: m, label: t(`decision.metrics.${m}`) })) }),
          select({ path: `decision.form.triggers.${i}.op`, label: t('decision.f.op'), options: [{ value: 'ge', label: '≥' }, { value: 'le', label: '≤' }] }),
          textField({ path: `decision.form.triggers.${i}.number`, label: t('decision.f.number'), type: 'number' }),
          textField({ path: `decision.form.triggers.${i}.date`, label: t('decision.f.date'), type: 'date' }),
          textField({ path: `decision.form.triggers.${i}.consequence`, label: t('decision.f.consequence'), placeholder: t('decision.f.consequencePh') }),
          button(t('decision.f.remove'), () => { form.triggers.splice(i, 1); store.save(); buildTriggers(); store.emit('decision.form'); }, { cls: 'btn btn-small', attrs: { 'aria-label': `${t('decision.f.remove')} ${i + 1}`, disabled: form.triggers.length <= 1 } }));
      }),
      button(t('decision.f.add'), () => { form.triggers.push({ metric: 'spread', op: 'ge', number: '', date: '', consequence: '' }); store.save(); buildTriggers(); store.emit('decision.form'); }, { cls: 'btn btn-small' }));
  };
  buildTriggers();

  const importInput = h('input', {
    type: 'file', accept: 'application/json,.json', class: 'sr-only', id: 'decision-import',
    onChange: (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      f.text().then((txt) => {
        try {
          const data = JSON.parse(txt);
          if (data && data.form) {
            store.get().decision.form = { ...store.get().decision.form, ...data.form };
            store.save();
            store.emit('*');
          }
        } catch (err) { /* ignore invalid files */ }
      });
    },
  });

  const exportJson = () => {
    const e = econ();
    const payload = {
      app: 'bond-credit-risk-case-lab', kind: 'decision', exportedAt: new Date().toISOString(), lang: store.get().lang,
      disclaimer: t('disclaimer.text'),
      position: store.get().position,
      economics: { saleProceeds: e.jun.bid, holdA: e.A.mid, holdB: e.B.mid, pA: e.d.pA / 100, expectedHold: e.hv, breakEven: e.be.raw, capitalCost: e.d.capitalCost, liquidityCost: e.d.liquidityCost },
      form: store.get().decision.form,
    };
    download('huaxing-decision.json', JSON.stringify(payload, null, 2));
  };

  const printForm = () => {
    document.documentElement.dataset.print = 'decision';
    window.print();
    setTimeout(() => { delete document.documentElement.dataset.print; }, 500);
  };

  const form = card(t('decision.formTitle'),
    h('p', { class: 'small' }, t('decision.formIntro')),
    h('div', { class: 'grid grid-2' },
      select({ path: 'decision.form.action', label: t('decision.f.action'), options: [{ value: '', label: t('ui.choose') }].concat(ACTIONS.map((a) => ({ value: a, label: t(`decision.actions.${a}`) }))) }),
      numberField({ path: 'decision.form.sellShare', label: t('decision.f.sellShare'), min: 0, max: 100, step: 5, suffix: '%', hint: t('decision.f.sellShareHint') })),
    textField({ path: 'decision.form.rationale', label: t('decision.f.rationale'), multiline: true, required: true, rows: 4, placeholder: t('decision.f.rationalePh') }),
    textField({ path: 'decision.form.owner', label: t('decision.f.owner'), required: true, placeholder: t('decision.f.ownerPh') }),
    h('h4', null, t('decision.f.triggers')),
    h('p', { class: 'small muted' }, t('decision.f.triggersHelp')),
    triggersBox,
    textField({ path: 'decision.form.escalation', label: t('decision.f.escalation'), multiline: true, required: true, rows: 2, placeholder: t('decision.f.escalationPh') }),
    h('div', { class: 'grid grid-2' },
      textField({ path: 'decision.form.responseA', label: t('decision.f.responseA'), multiline: true, required: true, rows: 3, placeholder: t('decision.f.responseAPh') }),
      textField({ path: 'decision.form.responseB', label: t('decision.f.responseB'), multiline: true, required: true, rows: 3, placeholder: t('decision.f.responseBPh') })),
    ctx.live(() => {
      const checks = validate(store.get().decision.form);
      const ok = checks.every(([, v]) => v);
      return h('div', { role: 'status' },
        h('p', null, h('strong', null, ok ? t('decision.complete') : t('decision.incomplete'))),
        h('ul', { class: 'validation' }, checks.map(([k, v]) => h('li', { class: v ? 'ok' : null }, t(`decision.v.${k}`)))));
    }),
    h('div', { class: 'row no-print' },
      button(t('decision.print'), printForm, { cls: 'btn btn-primary' }),
      button(t('decision.exportJson'), exportJson, { cls: 'btn' }),
      h('label', { for: 'decision-import', class: 'btn', tabindex: '0', role: 'button', onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); importInput.click(); } } }, t('decision.importJson')),
      importInput));

  // ---- Replay ---------------------------------------------------------------------------------
  const replay = card(t('decision.replayTitle'),
    segmented({ path: 'decision.replay', label: t('decision.replay'), options: [{ value: 'none', label: t('decision.replayNone') }, { value: 'A', label: t('cf.A') }, { value: 'B', label: t('cf.B') }] }),
    ctx.live(() => {
      const s = store.get();
      const cf = s.decision.replay;
      if (cf === 'none') return h('p', { class: 'small muted' }, t('decision.replayHelp'));
      const f = s.decision.form;
      if (!f.action) return h('p', { class: 'note' }, t('decision.replayNeedsAction'));
      const e = econ();
      const sold = f.action === 'exit' ? 1 : f.action === 'reduce' ? Math.min(1, Math.max(0, f.sellShare / 100)) : 0;
      const scen = cf === 'A' ? e.A.mid : e.B.mid;
      const outcome = sold * e.jun.bid + (1 - sold) * scen;
      const sm = scenarioMetrics(cf);
      const fired = f.triggers.filter((x) => triggerFires(x, sm));
      return h('div', { class: 'revealed' },
        table([t('decision.measure'), t('decision.value')], [
          [t('decision.r.scenario'), `${t(`cf.${cf}`)} · ${fmt.bp(sm.spread)} · ${fmt.price(sm.price)}`],
          [t('decision.r.sold'), fmt.pct(sold, 0)],
          { cls: 'total', cells: [t('decision.r.outcome'), fmt.money(outcome)] },
          [t('decision.r.vsSellAll'), fmt.money(outcome - e.jun.bid, 2, { sign: true })],
          [t('decision.r.vsHoldAll'), fmt.money(outcome - scen, 2, { sign: true })],
        ], { numericCols: [1] }),
        h('h4', null, t('decision.r.triggers')),
        fired.length ? h('ul', null, fired.map((x) => h('li', null, `${t(`decision.metrics.${x.metric}`)} ${x.metric === 'event' || x.metric === 'date' ? '' : `${x.op === 'le' ? '≤' : '≥'} ${x.number}`} (${x.date || '—'}) → ${x.consequence}`)))
          : h('p', { class: 'small' }, t('decision.r.noTriggers')),
        h('h4', null, t('decision.r.response')),
        h('p', null, (cf === 'A' ? f.responseA : f.responseB) || t('decision.r.noResponse')),
        h('p', { class: 'note' }, t(`decision.r.lesson${cf}`)));
    }),
    button(t('decision.toAnswer'), () => goTab('answer'), { cls: 'btn btn-link' }));

  // ---- Print summary (direct child of the tab panel, shown only when printing) -----------------
  const printSummary = ctx.live(() => {
    const s = store.get();
    const f = s.decision.form;
    const e = econ();
    return [
      h('h2', null, `${t('app.title')} — ${t('decision.formTitle')}`),
      h('p', null, t('ui.fictionalLong')),
      h('dl', { class: 'kv' },
        h('dt', null, t('decision.f.action')), h('dd', null, f.action ? t(`decision.actions.${f.action}`) + (f.action === 'reduce' ? ` (${f.sellShare}%)` : '') : '—'),
        h('dt', null, t('decision.f.rationale')), h('dd', null, f.rationale || '—'),
        h('dt', null, t('decision.f.owner')), h('dd', null, f.owner || '—'),
        h('dt', null, t('decision.f.escalation')), h('dd', null, f.escalation || '—'),
        h('dt', null, t('decision.f.responseA')), h('dd', null, f.responseA || '—'),
        h('dt', null, t('decision.f.responseB')), h('dd', null, f.responseB || '—')),
      h('h3', null, t('decision.f.triggers')),
      h('ul', null, f.triggers.map((x) => h('li', null, `${t(`decision.metrics.${x.metric}`)} ${x.op === 'le' ? '≤' : '≥'} ${x.number} · ${x.date} → ${x.consequence}`))),
      h('h3', null, t('decision.probTitle')),
      h('p', null, t('decision.printEcon', { sale: fmt.money(e.jun.bid), a: fmt.money(e.A.mid), b: fmt.money(e.B.mid), p: fmt.pctRaw(e.d.pA, 0), hold: fmt.money(e.hv), be: fmt.pct(e.be.raw, 1) })),
    ];
  }, { cls: 'print-decision print-only' });

  root.append(...tabHeader('decision'),
    h('div', { class: 'stack' },
      ladder,
      h('div', { class: 'grid grid-2' }, prob, h('div', { class: 'stack' }, ext, hedge)),
      form,
      replay),
    printSummary);
}

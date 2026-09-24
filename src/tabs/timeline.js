// 6 · Timeline (Stop 3) — deterioration while every coupon is paid; votes, ratios, missing information,
// support scoring and the July 2026 counterfactuals that drive spread → price everywhere downstream.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, slider, segmented, table, checkbox, button, workings, paras, reveal, tone } from '../ui.js';
import { tabHeader, tallyInput, voteBar } from './common.js';
import { value, market } from '../model.js';

const MISSING = ['projectDebt', 'restrictedCash', 'maturityProfile', 'jvDebt', 'salesCollection', 'landBank', 'trustTerms', 'supportDocs', 'crossDefault', 'auditOpinion'];

function ratioRows() {
  const a = CASE.financials.fy2024;
  const b = CASE.financials.fy2025;
  const A = CASE.alarms;
  const cell = (v, txt, rule) => ({ v, txt, cls: rule ? `cell-${tone(v, rule)}` : null });
  const rows = [
    ['revenue', cell(a.revenue, fmt.bn(a.revenue)), cell(b.revenue, `${fmt.bn(b.revenue)} (${fmt.pctRaw(b.revenueGrowth, 0, { sign: true })})`)],
    ['debt', cell(a.debt, fmt.bn(a.debt)), cell(b.debt, fmt.bn(b.debt))],
    ['debtEbitda', cell(a.debtEbitda, fmt.times(a.debtEbitda, 1), A.debtEbitda), cell(b.debtEbitda, fmt.times(b.debtEbitda, 1), A.debtEbitda)],
    ['ebitdaInterest', cell(a.ebitdaInterest, fmt.times(a.ebitdaInterest, 1), A.ebitdaInterest), cell(b.ebitdaInterest, fmt.times(b.ebitdaInterest, 1), A.ebitdaInterest)],
    ['cashCover', cell(a.cash / a.std, `${fmt.bn(a.cash)} / ${fmt.bn(a.std)} = ${fmt.times(a.cash / a.std, 2)}`, A.cashCover), cell(b.cash / b.std, `${fmt.bn(b.cash)} / ${fmt.bn(b.std)} = ${fmt.times(b.cash / b.std, 2)}`, A.cashCover)],
    ['ocfProfit', cell(a.ocf / a.netProfit, `${fmt.bn(a.ocf, 0, { sign: true })} / ${fmt.bn(a.netProfit, 0, { sign: true })}`, A.ocfVsProfit), cell(b.ocf / b.netProfit, `${fmt.bn(b.ocf, 0, { sign: true })} / ${fmt.bn(b.netProfit, 0, { sign: true })}`, A.ocfVsProfit)],
  ];
  return rows;
}

export function render(root, ctx) {
  const facts = CASE.timeline;
  facts.forEach((f) => ctx.revealKeys.push(`timeline.${f.id}`));

  const factList = card(t('timeline.factsTitle'), ctx.live(() => {
    const s = store.get();
    const shown = facts.filter((f) => s.reveals[`timeline.${f.id}`]);
    const next = facts.find((f) => !s.reveals[`timeline.${f.id}`]);
    return [
      h('ol', { class: 'timeline' }, shown.map((f) => {
        const v = s.timeline.votes[f.id] || { yes: 0, no: 0 };
        const total = (v.yes || 0) + (v.no || 0);
        return h('li', null,
          h('div', null, h('span', { class: 't-date' }, fmt.date(f.date, { month: true })), h('span', { class: 't-kind' }, t(`timeline.kinds.${f.kind}`))),
          h('p', null, t(`timeline.facts.${f.id}`)),
          f.spread ? h('p', { class: 'small muted' }, t('timeline.marketLine', { spread: fmt.bp(f.spread), ba: fmt.bp(f.bidAsk) })) : null,
          h('div', { class: 'row small' }, h('strong', null, t('timeline.thesis')),
            s.mode === 'instructor'
              ? [h('span', null, t('ui.yes')), tallyInput(`timeline.votes.${f.id}.yes`, `${t('ui.yes')} ${f.id}`), h('span', null, t('ui.no')), tallyInput(`timeline.votes.${f.id}.no`, `${t('ui.no')} ${f.id}`),
                h('span', { class: 'muted' }, total ? t('timeline.stillStands', { pct: Math.round((100 * (v.yes || 0)) / total) }) : '')]
              : segmented({ path: `timeline.myVotes.${f.id}`, label: t('timeline.thesis'), options: [{ value: 'yes', label: t('ui.yes') }, { value: 'no', label: t('ui.no') }] })),
          s.mode === 'instructor' && total ? voteBar(v.yes || 0, total) : null,
          h('p', { class: 'small note' }, t(`timeline.readings.${f.id}`)));
      })),
      next ? button(t('timeline.revealNext', { date: fmt.date(next.date, { month: true }) }), () => { s.reveals[`timeline.${next.id}`] = true; store.save(); store.emit('reveals'); }, { cls: 'btn btn-primary', attrs: { 'data-fkey': 'tl-next' } })
        : h('p', { class: 'revealed' }, t('timeline.allRevealed')),
      h('p', { class: 'small muted' }, t('timeline.progress', { n: shown.length, total: facts.length })),
    ];
  }));

  const ratios = card(t('timeline.ratiosTitle'),
    table([t('position.metric'), t('position.fy2024'), t('timeline.fy2025')], ratioRows().map(([k, a, b]) => ({
      cells: [t(`fin.${k}`), a.txt, b.txt],
    })), { numericCols: [1, 2] }),
    h('p', { class: 'small muted' }, t('timeline.alarmNote')));
  // Alarm colouring: apply classes after build (cells carry tone classes).
  const tb = ratios.querySelectorAll('tbody tr');
  ratioRows().forEach(([, a, b], i) => {
    const tds = tb[i].querySelectorAll('td');
    if (a.cls) tds[0].className += ` ${a.cls}`;
    if (b.cls) tds[1].className += ` ${b.cls}`;
  });

  const missing = card(t('timeline.missingTitle'), h('p', { class: 'small' }, t('timeline.missingIntro')),
    MISSING.map((m) => checkbox({ path: `timeline.missing.${m}`, label: t(`timeline.missing.${m}`) })),
    ctx.live(() => {
      const n = MISSING.filter((m) => store.get().timeline.missing[m]).length;
      return h('p', { class: 'small muted' }, t('timeline.missingCount', { n, total: MISSING.length }));
    }));

  const support = card(t('timeline.supportTitle'),
    h('p', { class: 'small' }, t('timeline.supportIntro')),
    slider({ path: 'timeline.support.importance', label: t('timeline.importance'), min: 0, max: 5, step: 1, fmt: (v) => `${v}/5`, hint: t('timeline.importanceHint') }),
    slider({ path: 'timeline.support.linkage', label: t('timeline.linkage'), min: 0, max: 5, step: 1, fmt: (v) => `${v}/5`, hint: t('timeline.linkageHint') }),
    slider({ path: 'timeline.support.capacity', label: t('timeline.capacity'), min: 0, max: 5, step: 1, fmt: (v) => `${v}/5`, hint: t('timeline.capacityHint') }),
    ctx.live(() => {
      const sp = store.get().timeline.support;
      const score = (sp.importance + sp.linkage + sp.capacity) / 3;
      const weakest = Math.min(sp.importance, sp.linkage, sp.capacity);
      const level = weakest <= 1 ? 'low' : score >= 4 ? 'strong' : score >= 3 ? 'moderate' : score >= 2 ? 'limited' : 'low';
      return [
        h('p', null, h('strong', null, t('timeline.supportScore')), ' ', h('span', { class: `pill ${level === 'strong' ? 'ok' : level === 'moderate' ? 'amber' : 'red'}` }, t(`timeline.levels.${level}`)), ' ', fmt.num(score, 1), '/5'),
        h('p', { class: 'small' }, t(`timeline.levelText.${level}`)),
        workings('tl-support', t('timeline.supportFormula'), [[t('timeline.importance'), sp.importance], [t('timeline.linkage'), sp.linkage], [t('timeline.capacity'), sp.capacity]], t('timeline.supportNote')),
      ];
    }));

  const cf = card(t('timeline.cfTitle'),
    h('p', null, t('timeline.cfIntro')),
    segmented({ path: 'ctx.cf', label: t('ui.counterfactual'), options: [{ value: 'none', label: t('cf.none') }, { value: 'A', label: t('cf.A') }, { value: 'B', label: t('cf.B') }], onChange: () => { store.get().ctx.stop = 'jul26'; store.save(); store.emit('ctx'); } }),
    h('div', { class: 'grid grid-2' },
      h('div', null, h('h4', null, t('cf.A')), ...paras(tr('timeline.cfA'))),
      h('div', null, h('h4', null, t('cf.B')), ...paras(tr('timeline.cfB')))),
    ctx.live(() => {
      const rows = ['none', 'A', 'B'].map((c) => {
        const v = value('jul26', c);
        const m = market('jul26', c);
        return { cls: store.get().ctx.cf === c ? 'hl' : null, cells: [t(`cf.${c}`), fmt.bp(m.spread), fmt.pct(m.yield), fmt.price(v.mid / v.scale), fmt.money(v.economic, 2, { sign: true })] };
      });
      return [
        table([t('timeline.cfCase'), t('tiles.spread'), t('tiles.yield'), t('tiles.mid'), t('tiles.economic')], rows, { numericCols: [1, 2, 3, 4], caption: t('timeline.cfCaption') }),
        workings('tl-cf', t('timeline.cfFormula'), [[t('timeline.remaining'), fmt.years(value('jul26', 'A').remaining)]]),
      ];
    }));

  const funnel = card(t('timeline.funnelTitle'),
    h('ol', { class: 'small' }, tr('timeline.funnel').map((x) => h('li', null, x))),
    h('p', { class: 'note' }, t('timeline.funnelNote')));

  const q = card(t('timeline.qTitle'), h('p', null, t('timeline.q')), reveal(ctx, 'q', () => paras(tr('timeline.a'))));

  root.append(
    ...tabHeader('timeline'),
    h('div', { class: 'grid grid-2' },
      h('div', { class: 'stack' }, factList, q, funnel),
      h('div', { class: 'stack' }, ratios, cf, support, missing)),
  );
}


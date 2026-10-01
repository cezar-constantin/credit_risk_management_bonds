// 11 · Controls — monitoring → escalation → formal impairment assessment → execution, mapped to the case
// dates; the illustrative escalation rule (editable, NOT ICBC policy, NOT regulation); decision-rights map; four measures.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import * as fmt from '../format.js';
import { h, card, numberField, table, workings, paras, reveal } from '../ui.js';
import { evaluateEscalation, accrued } from '../../engine/index.js';
import { tabHeader, guidedKeep } from './common.js';
import { value, stopById, position, bond } from '../model.js';

// Decision-rights map (deck slide 21) and four observable control measures (slide 26) — illustrative.
const RIGHTS = ['purchase', 'watchlist', 'sicr', 'regulatory', 'sale', 'legal'];
const RIGHT_COLS = ['proposes', 'decides', 'consulted', 'tested'];
const MEASURES = ['m1', 'm2', 'm3', 'm4'];

function observations() {
  return CASE.escalation.observations.map((o) => {
    if (!o.stop) return { ...o, spread: null, price: null };
    const v = value(o.stop, 'none');
    const st = stopById(o.stop);
    return { ...o, spread: v.market.spread, price: v.perHundred.mid - accrued(bond(), st.months / 12) };
  });
}

export function render(root, ctx) {
  const steps = card(t('controls.stepsTitle'),
    h('ol', { class: 'timeline' }, CASE.controlSteps.map((s) => h('li', null,
      h('div', null, h('span', { class: 't-date' }, t(`controls.steps.${s.id}.name`)), h('span', { class: 't-kind' }, s.dates.map((d) => t(`controls.dates.${d}`)).join(' · '))),
      h('p', { class: 'small' }, t(`controls.steps.${s.id}.text`))))));

  const ruleInputs = h('div', { class: 'grid grid-fields' },
    numberField({ path: 'controls.rule.spreadLevel', label: t('controls.rule.spreadLevel'), min: 0, max: 2000, step: 10, suffix: t('units.bpShort') }),
    numberField({ path: 'controls.rule.spreadWidening', label: t('controls.rule.spreadWidening'), min: 0, max: 2000, step: 10, suffix: t('units.bpShort') }),
    numberField({ path: 'controls.rule.priceFloor', label: t('controls.rule.priceFloor'), min: 50, max: 110, step: 0.5 }),
    numberField({ path: 'controls.rule.cashCover', label: t('controls.rule.cashCover'), min: 0, max: 3, step: 0.05, suffix: '×' }),
    numberField({ path: 'controls.rule.minHits', label: t('controls.rule.minHits'), min: 1, max: 5, step: 1 }));

  const rule = card(t('controls.ruleTitle'),
    h('p', null, h('span', { class: 'label-illustrative' }, t('controls.notPolicy'))),
    h('p', { class: 'small' }, t('controls.ruleText')),
    ruleInputs,
    ctx.live(() => {
      const r = store.get().controls.rule;
      const obs = observations();
      const res = evaluateEscalation(r, obs, position().spread);
      const mark = (b) => (b ? '●' : '○');
      return [
        table([t('controls.date'), t('controls.cols.spreadLevel'), t('controls.cols.widening'), t('controls.cols.price'), t('controls.cols.cover'), t('controls.cols.event'), t('controls.cols.hits')],
          res.rows.map((row, i) => ({
            cls: row.id === res.firstTrigger ? 'hl' : null,
            cells: [t(`controls.dates.${row.id}`),
              `${mark(row.hits.spreadLevel)} ${obs[i].spread != null ? fmt.bp(obs[i].spread) : t('controls.na')}`,
              `${mark(row.hits.spreadWidening)} ${obs[i].spread != null ? fmt.bp(obs[i].spread - position().spread, 0, { sign: true }) : ''}`,
              `${mark(row.hits.price)} ${obs[i].price != null ? fmt.price(obs[i].price) : ''}`,
              `${mark(row.hits.cashCover)} ${fmt.times(obs[i].cashCover, 2)}`,
              mark(row.hits.event),
              `${row.count}${row.triggered ? ` → ${t('controls.escalate')}` : ''}`],
          })), { numericCols: [6] }),
        h('p', { class: 'small muted' }, t('controls.legend')),
        h('p', null, h('strong', null, res.firstTrigger ? t('controls.firstTrigger', { date: t(`controls.dates.${res.firstTrigger}`) }) : t('controls.noTrigger'))),
        workings('ctl-rule', t('controls.ruleFormula'), [[t('controls.rule.spreadLevel'), fmt.bp(r.spreadLevel)], [t('controls.rule.spreadWidening'), fmt.bp(r.spreadWidening)], [t('controls.rule.priceFloor'), fmt.price(r.priceFloor)], [t('controls.rule.cashCover'), fmt.times(r.cashCover, 2)], [t('controls.rule.minHits'), r.minHits]], t('controls.ruleNote')),
      ];
    }));

  const rights = card(t('controls.rights.title'),
    h('p', null, h('span', { class: 'label-illustrative' }, t('controls.rights.label'))),
    table([t('controls.rights.decision'), ...RIGHT_COLS.map((c) => t(`controls.rights.cols.${c}`))],
      RIGHTS.map((r) => [t(`controls.rights.rows.${r}.name`), ...RIGHT_COLS.map((c) => t(`controls.rights.rows.${r}.${c}`))])),
    h('div', { class: 'grid grid-2' },
      h('div', null, h('h4', null, t('controls.rights.disagreeTitle')), h('p', { class: 'small' }, t('controls.rights.disagree'))),
      h('div', null, h('h4', null, t('controls.rights.infoTitle')), h('p', { class: 'small' }, t('controls.rights.info')))),
    h('p', { class: 'small note' }, t('controls.rights.note')));

  const measures = card(t('controls.measures.title'),
    h('ol', { class: 'statements' }, MEASURES.map((m) => h('li', null, h('strong', null, t(`controls.measures.${m}.name`)), h('br'), h('span', { class: 'small' }, t(`controls.measures.${m}.text`))))),
    h('p', { class: 'small note' }, t('controls.measures.note')));

  const q = card(t('controls.qTitle'), h('p', null, t('controls.q')), reveal(ctx, 'q', () => paras(tr('controls.a'))));

  guidedKeep(rights);
  root.append(...tabHeader('controls'),
    h('div', { class: 'grid grid-2' }, h('div', { class: 'stack' }, steps, q), rule),
    h('div', { style: { marginTop: '16px' } }, rights),
    h('div', { style: { marginTop: '16px' } }, measures));
}

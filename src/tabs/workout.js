// Workout and wealth products (class slides 24–25) — if support fails: the recovery decision (claim, vote,
// NAFMII deadlines, recovery range, cost); and the same bond in the bank's own book vs a WM product.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import * as fmt from '../format.js';
import { h, card, table, numberField, textField, checkbox, workings, fictionalBadge } from '../ui.js';
import { holdersMeeting } from '../../engine/index.js';
import { tabHeader, guidedKeep } from './common.js';
import { figures } from '../model.js';

const OPTIONS = ['vote', 'enforce', 'restructure'];
const OPT_COLS = ['involves', 'rules', 'range'];
const RECORD = ['claim', 'vote', 'range', 'negotiator', 'branch'];
const WM_ROWS = ['loss', 'accounting', 'liquidity', 'conflicts', 'mandate'];

export function render(root, ctx) {
  const options = card(t('workout.options.title'),
    ctx.live(() => {
      const X = figures().extension;
      const vals = { pv: fmt.num(X.pvCost, 2), mod: fmt.num(Math.abs(X.modificationLoss), 2) };
      return table([t('workout.options.option'), ...OPT_COLS.map((c) => t(`workout.options.cols.${c}`))],
        OPTIONS.map((o) => [t(`workout.options.rows.${o}.name`), ...OPT_COLS.map((c) => t(`workout.options.rows.${o}.${c}`, vals))]));
    }),
    workings('wo-ext', t('workout.options.formula'), [[t('workout.options.pvCost'), fmt.num(figures().extension.pvCost, 2)]], t('workout.options.note')));

  const meeting = card(t('workout.meeting.title'),
    h('p', { class: 'small' }, t('workout.meeting.intro')),
    h('div', { class: 'grid grid-fields' },
      textField({ path: 'workout.meetingDate', label: t('workout.meeting.date'), type: 'date' }),
      numberField({ path: 'workout.totalVotes', label: t('workout.meeting.total'), min: 0, max: 100, step: 1, suffix: '%' }),
      numberField({ path: 'workout.presentVotes', label: t('workout.meeting.present'), min: 0, max: 100, step: 1, suffix: '%' }),
      numberField({ path: 'workout.votesFor', label: t('workout.meeting.for'), min: 0, max: 100, step: 1, suffix: '%' })),
    ctx.live(() => {
      const w = store.get().workout;
      const m = holdersMeeting({ meetingDate: w.meetingDate, totalVotes: w.totalVotes, presentVotes: w.presentVotes, votesFor: Math.min(w.votesFor, w.presentVotes) });
      const pill = (ok) => h('span', { class: `pill ${ok ? 'ok' : 'red'}` }, ok ? t('ui.yes') : t('ui.no'));
      return [
        table([t('workout.meeting.test'), t('workout.meeting.result')], [
          [t('workout.meeting.notice'), m.noticeBy ? fmt.date(m.noticeBy) : '—'],
          [t('workout.meeting.agenda'), m.agendaBy ? fmt.date(m.agendaBy) : '—'],
          [t('workout.meeting.presentTest', { s: fmt.pct(m.shareOfPresent, 1) }), pill(m.presentOk)],
          [t('workout.meeting.totalTest', { s: fmt.pct(m.shareOfTotal, 1) }), pill(m.totalOk)],
          { cls: 'total', cells: [t('workout.meeting.passes'), pill(m.passes)] },
        ]),
        h('p', { class: 'small muted' }, t('workout.meeting.note')),
      ];
    }));

  const record = card(t('workout.record.title'),
    RECORD.map((r) => checkbox({ path: `workout.record.${r}`, label: t(`workout.record.${r}`) })),
    ctx.live(() => {
      const n = RECORD.filter((r) => (store.get().workout.record || {})[r]).length;
      return h('p', { class: 'small muted' }, t('workout.record.count', { n, total: RECORD.length }));
    }));

  const ask = h('section', { class: 'card accent callout' }, h('h3', { class: 'card-title' }, t('workout.askTitle')), h('p', null, t('workout.ask')));

  const wm = card(t('workout.wm.title'),
    h('p', { class: 'small' }, t('workout.wm.intro')),
    table([t('workout.wm.dimension'), t('workout.wm.own'), t('workout.wm.product')],
      WM_ROWS.map((r) => [t(`workout.wm.rows.${r}.name`), t(`workout.wm.rows.${r}.own`), t(`workout.wm.rows.${r}.product`)])),
    h('p', { class: 'small muted' }, t('workout.wm.source')));

  const wmLens = h('section', { class: 'card accent callout' }, h('h3', { class: 'card-title' }, t('workout.wm.lensTitle')), ...tr('workout.wm.lens').map((x) => h('p', null, x)));

  guidedKeep(options);
  root.append(...tabHeader('workout', fictionalBadge()),
    options,
    h('div', { class: 'grid grid-2', style: { marginTop: '16px' } }, meeting, h('div', { class: 'stack' }, record, ask)),
    h('div', { class: 'grid grid-2', style: { marginTop: '16px' } }, wm, wmLens),
    h('p', { class: 'small muted', style: { marginTop: '12px' } }, t('workout.sources')));
}

// 5 · Ratings and evidence — national vs global scales; rating termination as information to assess.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { h, card, paras, list, select, textField, button, reveal } from '../ui.js';
import { tabHeader, guidedKeep } from './common.js';

const REASONS = ['issuerRequest', 'avoidDowngrade', 'cost', 'sufficientOther', 'unknown'];
const GRADES = ['g3', 'g4', 'g5', 'g6', 'g7', 'g8'];

export function render(root, ctx) {
  const scales = card(t('ratings.scalesTitle'), ...paras(tr('ratings.scales')),
    h('div', { class: 'grid grid-2' },
      h('div', null, h('h4', null, t('ratings.national')), list(tr('ratings.nationalPoints'))),
      h('div', null, h('h4', null, t('ratings.global')), list(tr('ratings.globalPoints')))),
    h('p', { class: 'note' }, t('ratings.noMapping')));

  const form = h('div', null,
    select({ path: 'ratings.reason', label: t('ratings.reason'), options: [{ value: '', label: t('ui.choose') }].concat(REASONS.map((x) => ({ value: x, label: t(`ratings.reasons.${x}`) }))) }),
    textField({ path: 'ratings.note', label: t('ratings.note'), multiline: true, required: true, placeholder: t('ratings.notePh') }),
    select({ path: 'ratings.grade', label: t('ratings.newGrade'), options: [{ value: '', label: t('ui.choose') }].concat(GRADES.map((g) => ({ value: g, label: t(`ratings.grades.${g}`) }))) }));
  ctx.effect(() => {
    const r = store.get().ratings;
    form.hidden = !r.terminated || r.refreshed;
  });

  const event = card(t('ratings.eventTitle'), ctx.live(() => {
    const r = store.get().ratings;
    if (!r.terminated) {
      return [
        h('p', null, t('ratings.eventBefore')),
        h('dl', { class: 'kv' }, h('dt', null, t('ratings.internalGrade')), h('dd', null, t('ratings.grades.g4'))),
        button(t('ratings.fire'), () => { store.get().ratings.terminated = true; store.save(); store.emit('ratings'); }, { cls: 'btn btn-primary', attrs: { 'data-fkey': 'rating-fire' } }),
      ];
    }
    const canRefresh = r.reason && r.note.trim().length >= 10 && r.grade;
    return [
      h('p', { class: 'revealed wrong' }, t('ratings.eventText')),
      h('p', null, h('strong', null, t('ratings.nothingYet'))),
      h('dl', { class: 'kv' },
        h('dt', null, t('ratings.internalGrade')), h('dd', null, r.refreshed ? t(`ratings.grades.${r.grade}`) : `${t('ratings.grades.g4')} (${t('ratings.stale')})`),
        h('dt', null, t('ratings.watchlist')), h('dd', null, r.refreshed && ['g6', 'g7', 'g8'].includes(r.grade) ? t('ui.yes') : t('ui.no'))),
      r.refreshed ? h('p', { class: 'revealed' }, t('ratings.refreshedText', { grade: t(`ratings.grades.${r.grade}`), reason: t(`ratings.reasons.${r.reason}`) })) : null,
      !r.refreshed && !canRefresh ? h('p', { class: 'small muted' }, t('ratings.needReason')) : null,
    ];
  }),
  form,
  ctx.live(() => {
    const r = store.get().ratings;
    if (!r.terminated) return null;
    if (r.refreshed) return button(t('ratings.undo'), () => { Object.assign(store.get().ratings, { terminated: false, reason: '', note: '', grade: '', refreshed: false }); store.save(); store.emit('*'); }, { cls: 'btn btn-small' });
    const ok = r.reason && r.note.trim().length >= 10 && r.grade;
    return button(t('ratings.refresh'), () => { store.get().ratings.refreshed = true; store.get().recog.evidence.watchlist = ['g6', 'g7', 'g8'].includes(r.grade); store.save(); store.emit('ratings'); },
      { cls: 'btn btn-primary', attrs: { disabled: !ok, 'data-fkey': 'rating-refresh' } });
  }));

  const history = card(t('ratings.historyTitle'), h('p', null, t('ratings.history')));

  const q = card(t('ratings.qTitle'), h('p', null, t('ratings.q')), reveal(ctx, 'q', () => paras(tr('ratings.a'))));

  guidedKeep(event);
  root.append(...tabHeader('ratings'), h('div', { class: 'grid grid-2' }, h('div', { class: 'stack' }, scales, q), h('div', { class: 'stack' }, event, history)));
}

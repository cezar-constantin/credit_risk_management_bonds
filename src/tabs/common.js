// Shared tab helpers.
import { t } from '../i18n.js';
import * as store from '../state.js';
import { h, backStrip, nextId } from '../ui.js';

/** Standard tab header: number, title, intro and the "Back to the question" strip. */
export function tabHeader(id, extra) {
  return [
    h('div', { class: 'tab-head' },
      h('h2', null, t(`tabs.${id}.title`)),
      extra || null),
    backStrip(id),
    h('p', { class: 'tab-intro' }, t(`tabs.${id}.intro`)),
  ];
}

/** Manual tally input (instructor enters hand counts; no participant devices required). */
export function tallyInput(path, label) {
  const id = nextId('tally');
  return h('span', { class: 'tally' },
    h('label', { for: id, class: 'sr-only' }, label),
    h('button', { type: 'button', class: 'btn btn-small', 'data-fkey': `${path}-`, 'aria-label': `${label} −1`, onClick: () => store.set(path, Math.max(0, (store.getPath(path) || 0) - 1)) }, '−'),
    h('input', {
      type: 'number', id, min: 0, step: 1, value: store.getPath(path) || 0, 'data-fkey': path,
      onChange: (e) => store.set(path, Math.max(0, Math.round(Number(e.target.value) || 0))),
    }),
    h('button', { type: 'button', class: 'btn btn-small', 'data-fkey': `${path}+`, 'aria-label': `${label} +1`, onClick: () => store.set(path, (store.getPath(path) || 0) + 1) }, '+'));
}

/** Horizontal share bar for a vote count. */
export function voteBar(count, total) {
  const pct = total > 0 ? (100 * count) / total : 0;
  return h('div', { class: 'vote-bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${pct}%` } }));
}

export function legend(items) {
  return h('ul', { class: 'legend' }, items.map((it) => h('li', null,
    h('span', { class: `swatch${it.line ? ' line' : ''}${it.hatch ? ' hatch' : ''}`, style: it.hatch ? null : { background: `var(${it.color})`, borderTop: it.dash ? `3px dashed var(${it.color})` : null, height: it.dash ? '0' : null } }),
    it.label)));
}

export const isClass = () => store.get().preset === 'class';

/** Marks the one element a screen keeps in Guided mode (the table the class uses). */
export function guidedKeep(el) {
  el.dataset.guided = 'keep';
  return el;
}

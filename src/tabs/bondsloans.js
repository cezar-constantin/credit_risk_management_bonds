// Bonds vs loans (class slide 8) — the same obligor in the branch book (loan) and the head-office book
// (bond): six rows, flipped one by one, each feeding one of the six loss mechanisms.
import { t, tr } from '../i18n.js';
import { h, card, reveal } from '../ui.js';
import { tabHeader, guidedKeep } from './common.js';

const ROWS = [
  { id: 'information', mech: [5] },
  { id: 'renegotiation', mech: [6] },
  { id: 'valuation', mech: [1, 2, 3] },
  { id: 'exit', mech: [3] },
  { id: 'security', mech: [5] },
  { id: 'concentration', mech: [4] },
];

export function render(root, ctx) {
  const table = h('div', { class: 'table-wrap' }, h('table', { class: 'data bl-table' },
    h('thead', null, h('tr', null,
      h('th', { scope: 'col' }, t('bl.colTopic')),
      h('th', { scope: 'col' }, t('bl.colLoan')),
      h('th', { scope: 'col' }, t('bl.colBond')),
      h('th', { scope: 'col' }, t('bl.colMech')))),
    h('tbody', null, ROWS.map((r) => h('tr', null,
      h('th', { scope: 'row' }, t(`bl.rows.${r.id}.topic`)),
      h('td', null, t(`bl.rows.${r.id}.loan`)),
      h('td', { colspan: 2 }, reveal(ctx, r.id, () => h('div', { class: 'bl-flip' },
        h('span', null, t(`bl.rows.${r.id}.bond`)),
        h('span', { class: 'bl-mech' }, `${t('bl.mech')} ${r.mech.join(' · ')}`)),
      { label: t('bl.flip'), participantLabel: t('bl.flip') })))))));

  root.append(...tabHeader('bondsloans'),
    guidedKeep(h('div', { class: 'stack' },
      card(t('bl.tableTitle'), table),
      h('div', { class: 'grid grid-2' },
        card(t('bl.measuresTitle'), h('p', null, t('bl.measures'))),
        card(t('bl.closeTitle'), ...tr('bl.close').map((x) => h('p', null, x)))))));
}

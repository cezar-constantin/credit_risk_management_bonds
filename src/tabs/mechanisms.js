// 2 · Mechanisms — six ways to lose money while payments continue, and where each appears.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import { h, card, segmented, table, checkbox, paras } from '../ui.js';
import { tabHeader, guidedKeep } from './common.js';

export function render(root, ctx) {
  const lensCtl = segmented({ path: 'ctx.lens', label: t('ui.lens'), options: ['AC', 'FVOCI', 'FVTPL'].map((v) => ({ value: v, label: t(`lens.${v}.short`) })) });

  const cards = h('div', { class: 'mech-grid' }, CASE.mechanisms.map((m, i) => {
    const path = `mech.${m.id}`;
    return ctx.live(() => {
      const s = store.get();
      const on = Boolean(s.mech && s.mech[m.id]);
      const where = m.where[s.ctx.lens];
      return h('article', { class: 'mech', 'data-on': String(on) },
        h('h3', null, `${i + 1}. ${t(`mech.${m.id}.name`)}`),
        h('p', { class: 'small' }, t(`mech.${m.id}.desc`)),
        h('span', { class: `pill ${m.credit ? 'red' : 'neutral'}` }, m.credit ? t('mech.credit') : t('mech.notCredit')),
        checkbox({ path, label: t('mech.showWhere') }),
        on ? h('div', null,
          h('div', { class: 'impact-row', role: 'list', 'aria-label': t('mech.whereLabel') },
            CASE.impacts.map((imp) => h('span', { role: 'listitem', class: `impact${where.includes(imp) ? ' on' : ''}` },
              `${where.includes(imp) ? '● ' : '○ '}${t(`impact.${imp}`)}`))),
          h('p', { class: 'small', style: { marginTop: '6px' } }, t(`mech.${m.id}.where.${s.ctx.lens}`)),
          h('p', { class: 'small muted' }, t(`mech.${m.id}.case`))) : null);
    });
  }));

  const matrix = ctx.live(() => {
    const s = store.get();
    const lens = s.ctx.lens;
    return table(
      [t('mech.mechanism'), ...CASE.impacts.map((i) => t(`impact.${i}`)), t('mech.creditCol')],
      CASE.mechanisms.map((m) => [
        t(`mech.${m.id}.name`),
        ...CASE.impacts.map((i) => (m.where[lens].includes(i) ? '●' : '–')),
        m.credit ? t('ui.yes') : t('mech.control'),
      ]),
      { caption: t('mech.matrixCaption', { lens: t(`lens.${lens}.name`) }) },
    );
  });

  root.append(
    ...tabHeader('mechanisms'),
    h('div', { class: 'row' }, lensCtl,
      h('button', { type: 'button', class: 'btn btn-small', onClick: () => { store.get().mech = Object.fromEntries(CASE.mechanisms.map((m) => [m.id, true])); store.save(); store.emit('mech'); } }, t('mech.showAll')),
      h('button', { type: 'button', class: 'btn btn-small', onClick: () => { store.get().mech = {}; store.save(); store.emit('mech'); } }, t('mech.hideAll'))),
    cards,
    h('div', { class: 'grid grid-2', style: { marginTop: '16px' } },
      guidedKeep(card(t('mech.matrixTitle'), matrix, h('p', { class: 'small muted' }, t('mech.matrixNote')))),
      card(t('mech.noncallTitle'), ...paras(tr('mech.noncall')))),
  );
}

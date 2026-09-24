// 0 · Home — central question, opening poll, settings, disclaimer.
import { t, tr } from '../i18n.js';
import * as store from '../state.js';
import { CASE } from '../data.js';
import { h, card, segmented, select, button, paras, fictionalBadge } from '../ui.js';
import { tabHeader, tallyInput, voteBar, guidedKeep } from './common.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function render(root, ctx, { goTab }) {
  root.append(
    ...tabHeader('home', fictionalBadge()),
    h('p', { class: 'question-hero' }, t('question')),
    h('div', { class: 'grid grid-2' },
      guidedKeep(card(t('home.pollTitle'),
        h('p', null, h('strong', null, t('home.poll.q'))),
        h('p', { class: 'small muted' }, t('home.pollHow')),
        ctx.live(() => {
          const s = store.get();
          const total = LETTERS.reduce((a, L) => a + (s.poll.counts[L] || 0), 0);
          return h('div', { class: 'poll-list' }, LETTERS.map((L) => {
            const key = `home.poll${L}`;
            const shown = Boolean(s.reveals[key]);
            const verdict = t(`home.poll.${L}.kind`);
            return h('div', { class: 'poll-item' },
              h('span', { class: 'poll-letter', 'aria-hidden': 'true' }, L),
              h('div', null,
                h('div', null, h('span', { class: 'sr-only' }, `${L}. `), t(`home.poll.${L}.text`)),
                s.mode === 'instructor' ? voteBar(s.poll.counts[L] || 0, total) : null,
                shown ? h('div', { class: `revealed${L === 'A' ? ' wrong' : ''}`, style: { marginTop: '6px' } },
                  h('span', { class: `pill ${L === 'A' ? 'red' : L === 'B' ? 'neutral' : 'ok'}` }, verdict), ' ',
                  t(`home.poll.${L}.why`)) : null),
              h('div', { class: 'row' },
                s.mode === 'instructor' ? tallyInput(`poll.counts.${L}`, t('home.tallyFor', { L })) : null,
                shown ? null : button(t('ui.reveal'), () => {
                  s.reveals[key] = true;
                  store.save();
                  store.emit('reveals');
                }, { cls: 'btn btn-reveal btn-small', attrs: { 'aria-label': `${t('ui.reveal')} ${L}` } })));
          }));
        }),
        (() => { LETTERS.forEach((L) => ctx.revealKeys.push(`home.poll${L}`)); return null; })(),
        ctx.live(() => {
          const s = store.get();
          const all = LETTERS.every((L) => s.reveals[`home.poll${L}`]);
          return all ? h('p', { class: 'note' }, t('home.pollTakeaway')) : null;
        }))),
      h('div', { class: 'stack' },
        card(t('home.settings'),
          select({ path: 'lang', label: t('ui.language'), options: [{ value: 'en', label: 'English' }, { value: 'zh', label: '简体中文' }] }),
          segmented({ path: 'mode', label: t('ui.mode'), options: [{ value: 'instructor', label: t('ui.instructor') }, { value: 'participant', label: t('ui.participant') }] }),
          segmented({ path: 'preset', label: t('ui.preset'), options: [{ value: 'class', label: t('ui.classDefaults') }, { value: 'free', label: t('ui.freePlay') }], onChange: (v) => { if (v === 'class') store.resetToClass(); } }),
          h('p', { class: 'small muted' }, t('home.presetHelp'))),
        card(t('home.stopsTitle'),
          h('ol', null, CASE.classStops.map((cs) => h('li', null,
            h('strong', null, t(`classStops.s${cs.n}`)), ' — ', t(`classStops.d${cs.n}`), ' ',
            button(t('ui.go'), () => {
              store.get().ctx.stop = cs.stop;
              goTab(cs.tab);
            }, { cls: 'btn btn-link btn-small' }))))),
        card(t('ui.route'),
          h('details', null, h('summary', null, t('home.routeOpen')),
            h('ol', { class: 'small route-list' }, CASE.route.map((r) => h('li', { value: r.slide },
              button(`${t(`route.s${r.slide}`)}${r.questions.length ? ` · ${r.questions.join(' ')}` : ''}`, () => goTab(r.tab), { cls: 'btn btn-link btn-small' })))))),
        card(t('home.howTitle'),
          h('h4', null, t('ui.instructor')), ...paras(tr('home.howInstructor')),
          h('h4', null, t('ui.participant')), ...paras(tr('home.howParticipant'))))),
    card(t('disclaimer.title'), h('p', null, t('disclaimer.text')), h('p', { class: 'small muted' }, t('home.fictionalNote'))),
  );
}

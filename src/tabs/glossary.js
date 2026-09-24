// 14 · Glossary and acronyms — bilingual, searchable (class deck Appendix A7 and A9).
import { t } from '../i18n.js';
import * as store from '../state.js';
import { I18N } from '../data.js';
import { h, card, textField } from '../ui.js';
import { tabHeader } from './common.js';

function matches(q, ...fields) {
  if (!q) return true;
  const n = q.trim().toLowerCase();
  return fields.some((f) => String(f || '').toLowerCase().includes(n));
}

export function render(root, ctx) {
  const lang = store.get().lang;
  const other = lang === 'zh' ? 'en' : 'zh';
  const terms = Object.keys(I18N.en.glossary.items);
  const acr = Object.keys(I18N.en.glossary.acronyms);

  const search = textField({ path: 'glossaryQuery', label: t('glossary.search'), placeholder: t('glossary.searchPh') });

  const termList = ctx.live(() => {
    const q = store.get().glossaryQuery || '';
    const rows = terms.filter((k) => matches(q, I18N.en.glossary.items[k].term, I18N.zh.glossary.items[k].term, I18N.en.glossary.items[k].def, I18N.zh.glossary.items[k].def));
    return [
      h('p', { class: 'small muted', role: 'status' }, t('glossary.count', { n: rows.length, total: terms.length })),
      h('div', { class: 'glossary-list' },
        h('div', { class: 'gloss-item', 'aria-hidden': 'true' }, h('strong', null, t('glossary.colTerm')), h('strong', null, t('glossary.colOther')), h('strong', null, t('glossary.colDef'))),
        rows.map((k) => h('div', { class: 'gloss-item' },
          h('div', { lang: lang === 'zh' ? 'zh-Hans' : 'en' }, h('strong', null, I18N[lang].glossary.items[k].term)),
          h('div', { lang: other === 'zh' ? 'zh-Hans' : 'en' }, I18N[other].glossary.items[k].term),
          h('div', { class: 'small' }, I18N[lang].glossary.items[k].def)))),
    ];
  });

  const acrList = ctx.live(() => {
    const q = store.get().glossaryQuery || '';
    const rows = acr.filter((k) => matches(q, k, I18N.en.glossary.acronyms[k], I18N.zh.glossary.acronyms[k]));
    return h('div', { class: 'glossary-list' }, rows.map((k) => h('div', { class: 'gloss-item' },
      h('div', null, h('strong', null, k.replace(/_/g, '-'))),
      h('div', { lang: 'en' }, I18N.en.glossary.acronyms[k]),
      h('div', { lang: 'zh-Hans' }, I18N.zh.glossary.acronyms[k]))));
  });

  root.append(...tabHeader('glossary'), search,
    h('div', { class: 'grid grid-2' },
      card(t('glossary.termsTitle'), termList),
      card(t('glossary.acrTitle'), acrList)),
    h('p', { class: 'note' }, t('glossary.source')));
}

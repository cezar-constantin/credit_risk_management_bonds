// Translation lookup. All user-visible strings live in i18n/en.json and i18n/zh.json.
import { I18N } from './data.js';

let lang = 'en';

export const LANGS = ['en', 'zh'];

export function setLang(l) {
  lang = LANGS.includes(l) ? l : 'en';
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
}

export function getLang() {
  return lang;
}

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
}

/** Raw value (string, array or object) for a key in the current language. */
export function tr(key) {
  const v = lookup(I18N[lang], key);
  if (v !== undefined) return v;
  const fb = lookup(I18N.en, key);
  if (fb === undefined && typeof console !== 'undefined') console.warn('Missing i18n key', key);
  return fb;
}

/** String lookup with {placeholder} interpolation. */
export function t(key, vars) {
  const v = tr(key);
  if (typeof v !== 'string') return v === undefined ? `⟦${key}⟧` : String(v);
  if (!vars) return v;
  return v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

export function has(key) {
  return lookup(I18N[lang], key) !== undefined;
}

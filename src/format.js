// Number, money, date and unit formatting for both languages.
// RMB m in English; 亿元 in Chinese (1 亿 = 100 m; 1 bn = 10 亿).
import { getLang, t } from './i18n.js';

const MINUS = '−';

export function num(x, dp = 2) {
  if (x == null || Number.isNaN(x)) return '–';
  if (!Number.isFinite(x)) return '∞';
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const zero = Number(Math.abs(x).toFixed(dp)) === 0;
  return (x < 0 && !zero ? MINUS : '') + s;
}

export function signed(x, dp = 2) {
  if (x == null || Number.isNaN(x)) return '–';
  const zero = Number(Math.abs(x).toFixed(dp)) === 0;
  return (x > 0 && !zero ? '+' : '') + num(x, dp);
}

/** Money given in RMB m. */
export function money(m, dp = 2, { sign = false } = {}) {
  if (getLang() === 'zh') {
    const v = m / 100;
    return `${sign ? signed(v, dp + 2) : num(v, dp + 2)}${t('units.yi')}`;
  }
  return `${t('units.rmb')}\u00a0${sign ? signed(m, dp) : num(m, dp)}\u00a0${t('units.m')}`;
}

/** Money given in RMB bn (financial statements). */
export function bn(b, dp = 0, { sign = false } = {}) {
  if (getLang() === 'zh') {
    const v = b * 10;
    return `${sign ? signed(v, dp) : num(v, dp)}${t('units.yi')}`;
  }
  return `${t('units.rmb')}\u00a0${sign ? signed(b, dp) : num(b, dp)}\u00a0${t('units.bn')}`;
}

export function usdM(m) {
  if (getLang() === 'zh') return `${num(m / 100, 0)}${t('units.usdYi')}`;
  return `US$ ${num(m, 0)} m`;
}

export function price(x, dp = 2) {
  return num(x, dp);
}

export function bp(x, dp = 0, { sign = false } = {}) {
  return `${sign ? signed(x, dp) : num(x, dp)}${t('units.bp')}`.replace(' ', '\u00a0');
}

/** Percent from a decimal (0.036 → 3.60 %). */
export function pct(x, dp = 2, { sign = false } = {}) {
  return `${sign ? signed(x * 100, dp) : num(x * 100, dp)}%`;
}

/** Percent already expressed in percent units (3.6 → 3.60 %). */
export function pctRaw(x, dp = 2, { sign = false } = {}) {
  return `${sign ? signed(x, dp) : num(x, dp)}%`;
}

export function times(x, dp = 2) {
  return `${num(x, dp)}×`;
}

export function years(x, dp = 3) {
  const one = Number(x.toFixed(dp)) === 1 && dp === 0;
  return `${num(x, dp)}${t(one ? 'units.year' : 'units.years')}`.replace(' ', '\u00a0');
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function date(iso, { month = false } = {}) {
  const [y, m, d] = iso.split('-').map(Number);
  if (getLang() === 'zh') return month ? `${y}年${m}月` : `${y}年${m}月${d}日`;
  return month ? `${MONTHS_EN[m - 1]} ${y}` : `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

// Application state: one plain object, persisted to localStorage (per-browser convenience only).
import { CASE } from './data.js';

const KEY = 'bcrcl-state-v1';

const clone = (o) => JSON.parse(JSON.stringify(o));

export function defaultState() {
  return {
    lang: 'en',
    mode: 'participant',
    preset: 'class',
    presenter: false,
    tab: 'home',
    position: clone(CASE.position),
    ctx: { stop: 'mar26', cf: 'none', lens: 'AC' },
    poll: { counts: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }, mine: null },
    lab: { dBench: 30, dSpread: 240, bidAsk: 40, months: 12, view: 'holding', dirty: false, votes: { spread120: 0, spread50: 0, bench30: 0 }, myVote: null },
    spread: {
      spread: CASE.position.spread,
      pdPhysical: CASE.spreadAnatomy.pdPhysical,
      lgd: CASE.position.lgd,
      liquidityPremium: CASE.spreadAnatomy.liquidityPremium,
      weight: CASE.sizing.weight,
      sizeLgd: CASE.sizing.lgd,
      restSpread: CASE.sizing.restSpreads[0],
    },
    ratings: { terminated: false, reason: '', note: '', grade: '', refreshed: false },
    timeline: { revealed: 0, votes: {}, myVotes: {}, missing: {}, support: { importance: 3, linkage: 2, capacity: 2 } },
    structure: { quiz: {} },
    portfolio: { answers: {} },
    recog: {
      scenarios: [
        { weight: 100, pd12: CASE.ecl.pd12, pdLife: CASE.ecl.pdLife, lgd: CASE.ecl.lgd },
        { weight: 0, pd12: 3, pdLife: 5, lgd: 45 },
        { weight: 0, pd12: 15, pdLife: 25, lgd: 75 },
      ],
      discount: false,
      stage: 2,
      evidence: { spread: true, rating: true, financials: true, watchlist: false, dpd30: false },
      fc: { dpd: 0, impaired: false, eclRatio: 6, restructured: false, npShare: 0, adverse: true },
    },
    capital: { approach: 'weighted', rwClass: 'corpGeneral', pd: 6, lgd: 45, maturity: CASE.capital.maturity, ratio: CASE.capital.ratio, ociLoss: 0.41 },
    controls: { rule: clone(CASE.escalation.rule) },
    decision: {
      pA: 10,
      capitalCost: 0,
      liquidityCost: 0,
      ext: { paidShare: CASE.extension.paidShare, delayYears: CASE.extension.delayYears, coupon: CASE.position.coupon, rate: 8.8, eir: 3.6 },
      form: { action: '', sellShare: 0, rationale: '', owner: '', triggers: [{ metric: 'spread', number: '', date: '', consequence: '' }], escalation: '', responseA: '', responseB: '' },
      replay: 'none',
    },
    reveals: {},
    visited: {},
    hints: {},
    tally: {},
  };
}

let state = defaultState();
const listeners = new Set();

function merge(base, saved) {
  if (saved == null || typeof saved !== 'object' || Array.isArray(saved)) return saved === undefined ? base : saved;
  const out = Array.isArray(base) ? [] : { ...base };
  for (const k of Object.keys(saved)) {
    out[k] = base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]) ? merge(base[k], saved[k]) : saved[k];
  }
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = merge(defaultState(), JSON.parse(raw));
  } catch (e) {
    state = defaultState();
  }
  if (state.preset === 'class') state.position = clone(CASE.position);
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* storage unavailable — the app keeps working without persistence */
  }
}

export function get() {
  return state;
}

export function getPath(path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), state);
}

export function set(path, value, { silent = false } = {}) {
  const keys = path.split('.');
  let o = state;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (o[keys[i]] == null) o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
  save();
  if (!silent) emit(path);
}

export function emit(path = '*') {
  listeners.forEach((fn) => fn(path));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Restores every class value (keeps language, mode and presenter layout). */
export function resetToClass() {
  const keep = { lang: state.lang, mode: state.mode, presenter: state.presenter, tab: state.tab };
  state = { ...defaultState(), ...keep, preset: 'class' };
  save();
  emit('*');
}

/** Clears reveals and tallies of one tab (instructor "R"). */
export function resetReveals(prefix) {
  Object.keys(state.reveals).forEach((k) => {
    if (k.startsWith(prefix + '.')) delete state.reveals[k];
  });
  save();
  emit('reveals');
}

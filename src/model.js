// Derived values: everything shown on screen is computed here from state + case data via the engine.
import { CASE } from './data.js';
import * as store from './state.js';
import {
  bondOf, purchaseYield, purchasePrice, valueAtStop, caseFigures, stopMarket, ecl, lifetimeEcl,
} from '../engine/index.js';

export const TABS = ['home', 'position', 'mechanisms', 'bondsloans', 'repricing', 'spread', 'ratings', 'timeline', 'structure',
  'portfolio', 'recognition', 'capital', 'controls', 'decision', 'answer', 'glossary'];

export const STOP_IDS = CASE.stops.map((s) => s.id);

export function position() {
  return store.get().position;
}

export function stopById(id) {
  return CASE.stops.find((s) => s.id === id);
}

/** Counterfactual applies only to the July 2026 stop. */
export function cfFor(stopId) {
  const s = stopById(stopId);
  return s && s.counterfactuals ? store.get().ctx.cf : 'none';
}

export function value(stopId, cf = cfFor(stopId)) {
  return valueAtStop(position(), stopById(stopId), cf);
}

export function market(stopId, cf = cfFor(stopId)) {
  return stopMarket(position(), stopById(stopId), cf);
}

export function y0() {
  return purchaseYield(position());
}

export function p0() {
  return purchasePrice(position());
}

export function bond() {
  return bondOf(position());
}

export function figures() {
  return caseFigures(CASE, { position: position() });
}

/** Allowance at a stop under its default ECL assumptions (class case). */
export function allowanceAt(stopId) {
  const s = stopById(stopId);
  const pos = position();
  const pd12 = s.ecl.pd12 ?? pos.pd12;
  const pdLife = s.ecl.pdLife ?? pos.pd12;
  const lgd = s.ecl.pd12 != null ? CASE.ecl.lgd : pos.lgd;
  const ead = pos.nominal;
  const e12 = ecl(pd12 / 100, lgd / 100, ead);
  const eLife = lifetimeEcl(pdLife / 100, lgd / 100, ead);
  return { stage: s.ecl.stage, ecl12: e12, eclLife: eLife, allowance: s.ecl.stage === 1 ? e12 : eLife };
}

/** Coupons received up to a stop (all paid in full in this case). */
export function couponsReceived(stopId) {
  const s = stopById(stopId);
  const n = Math.floor(s.months / 12 + 1e-9);
  return n * position().coupon * position().nominal / 100;
}

export function scale() {
  return position().nominal / 100;
}

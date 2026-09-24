// Case data and translations are injected by the build (scripts/build.mjs) as globals so that the
// single-file app works from file:// without loading anything.
export const CASE = globalThis.__CASE__;
export const I18N = globalThis.__I18N__;
export const VERSION = globalThis.__VERSION__ || 'dev';
/** 'standard' (app/index.html) or 'focus' (app/focus.html) — presentation only. */
export const VARIANT = globalThis.__VARIANT__ || 'standard';

// Tiny DOM toolkit: element builder, form controls bound to state paths, "Show workings",
// reveal buttons and live (re-rendered) regions. No framework.
import { t } from './i18n.js';
import * as store from './state.js';
import { num } from './format.js';

let uid = 0;
export const nextId = (p = 'id') => `${p}-${(uid += 1)}`;
/** Deterministic ids across full re-renders so focus can be restored (e.g. after a language switch). */
export const resetIds = () => { uid = 0; };

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // only used for trusted, build-time strings
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Paragraphs from a translation value that may be a string or an array of strings. */
export function paras(value, cls) {
  const list = Array.isArray(value) ? value : [value];
  return list.map((p) => h('p', { class: cls }, p));
}

export function list(items, { ordered = false, cls } = {}) {
  return h(ordered ? 'ol' : 'ul', { class: cls }, (items || []).map((i) => h('li', null, i)));
}

// ---- Rendering context -------------------------------------------------------------------------

/** Creates the context passed to each tab: live regions + reveal registry. */
export function createCtx(tabId) {
  const lives = [];
  const ctx = {
    tab: tabId,
    revealKeys: [],
    live(fn, { tag = 'div', cls, attrs } = {}) {
      const el = h(tag, { class: cls, ...(attrs || {}) });
      const render = () => {
        // Preserve keyboard focus across re-renders: controls carry a stable data-fkey.
        const active = document.activeElement;
        const fkey = active && el.contains(active) ? active.getAttribute('data-fkey') : null;
        const out = fn();
        el.replaceChildren(...[out].flat(Infinity).filter((x) => x != null && x !== false)
          .map((x) => (x instanceof Node ? x : document.createTextNode(String(x)))));
        if (fkey) {
          const next = [...el.querySelectorAll('[data-fkey]')].find((n) => n.getAttribute('data-fkey') === fkey);
          if (next) next.focus();
        }
      };
      render();
      lives.push(render);
      return el;
    },
    /** Runs `fn` now and after every state change without rebuilding DOM (e.g. toggling `hidden`). */
    effect(fn) {
      fn();
      lives.push(fn);
    },
    update() {
      lives.forEach((r) => r());
    },
  };
  return ctx;
}

// ---- Controls bound to state -------------------------------------------------------------------

function locked(opts) {
  return typeof opts.disabled === 'function' ? opts.disabled() : Boolean(opts.disabled);
}

/** Range slider + numeric readout. `path` is a state path; value stored as a number. */
export function slider(opts) {
  const { path, label, min, max, step = 1, fmt = (v) => num(v, 0), hint } = opts;
  const id = nextId('sl');
  const val = Number(store.getPath(path));
  const out = h('output', { class: 'slider-value', for: id }, fmt(val));
  const input = h('input', {
    type: 'range', id, min, max, step, value: val, 'data-fkey': path,
    'aria-valuetext': fmt(val),
    disabled: locked(opts),
    onInput: (e) => {
      const v = Number(e.target.value);
      out.textContent = fmt(v);
      e.target.setAttribute('aria-valuetext', fmt(v));
      store.set(path, v);
    },
  });
  return h('div', { class: 'field field-slider' },
    h('div', { class: 'field-head' }, h('label', { for: id }, label), out),
    input,
    hint ? h('div', { class: 'field-hint' }, hint) : null);
}

/** Number input bound to a state path, clamped to [min, max]. */
export function numberField(opts) {
  const { path, label, min, max, step = 'any', suffix, hint } = opts;
  const id = nextId('nf');
  const input = h('input', {
    type: 'number', id, min, max, step, value: store.getPath(path), inputmode: 'decimal', 'data-fkey': path,
    disabled: locked(opts),
    onChange: (e) => {
      let v = Number(e.target.value);
      if (Number.isNaN(v)) v = Number(store.getPath(path));
      if (min != null) v = Math.max(min, v);
      if (max != null) v = Math.min(max, v);
      e.target.value = v;
      store.set(path, v);
    },
  });
  return h('div', { class: 'field field-number' },
    h('label', { for: id }, label),
    h('div', { class: 'input-suffix' }, input, suffix ? h('span', { class: 'suffix', 'aria-hidden': 'true' }, suffix) : null),
    hint ? h('div', { class: 'field-hint' }, hint) : null);
}

export function textField({ path, label, multiline = false, placeholder, required = false, rows = 3, type = 'text' }) {
  const id = nextId('tf');
  const attrs = { id, placeholder, required, 'aria-required': required ? 'true' : null, 'data-fkey': path };
  // Text fields must never sit inside a live region (re-rendering would move the caret).
  const onInput = (e) => store.set(path, e.target.value);
  const input = multiline
    ? h('textarea', { ...attrs, rows, onInput })
    : h('input', { ...attrs, type, onInput });
  input.value = store.getPath(path) ?? '';
  return h('div', { class: 'field field-text' }, h('label', { for: id }, label, required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null), input);
}

export function select({ path, label, options, disabled, onChange }) {
  const id = nextId('se');
  const cur = String(store.getPath(path));
  const el = h('select', {
    id,
    disabled,
    'data-fkey': path,
    onChange: (e) => {
      const raw = e.target.value;
      const opt = options.find((o) => String(o.value) === raw);
      store.set(path, opt ? opt.value : raw);
      if (onChange) onChange(opt ? opt.value : raw);
    },
  }, options.map((o) => h('option', { value: o.value, selected: String(o.value) === cur }, o.label)));
  return h('div', { class: 'field field-select' }, label ? h('label', { for: id }, label) : null, el);
}

/** Segmented control (radio group). */
export function segmented({ path, label, options, onChange, disabled }) {
  const name = nextId('seg');
  const cur = String(store.getPath(path));
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label });
  options.forEach((o) => {
    const id = nextId('opt');
    group.appendChild(h('span', { class: 'seg-item' },
      h('input', {
        type: 'radio', name, id, value: o.value, checked: String(o.value) === cur, disabled, 'data-fkey': `${path}=${o.value}`,
        onChange: () => {
          store.set(path, o.value);
          if (onChange) onChange(o.value);
        },
      }),
      h('label', { for: id }, o.label)));
  });
  return h('div', { class: 'field field-seg' }, label ? h('div', { class: 'field-label', 'aria-hidden': 'true' }, label) : null, group);
}

export function checkbox({ path, label, disabled, onChange }) {
  const id = nextId('cb');
  return h('div', { class: 'field field-check' },
    h('input', {
      type: 'checkbox', id, checked: Boolean(store.getPath(path)), disabled, 'data-fkey': path,
      onChange: (e) => {
        store.set(path, e.target.checked);
        if (onChange) onChange(e.target.checked);
      },
    }),
    h('label', { for: id }, label));
}

export function button(label, onClick, { cls = 'btn', attrs } = {}) {
  return h('button', { type: 'button', class: cls, onClick, ...(attrs || {}) }, label);
}

// ---- Presentation helpers ---------------------------------------------------------------------

export function card(title, ...children) {
  return h('section', { class: 'card' }, title ? h('h3', { class: 'card-title' }, title) : null, ...children);
}

export function metric(label, value, { tone, sub } = {}) {
  return h('div', { class: `metric${tone ? ' tone-' + tone : ''}` },
    h('div', { class: 'metric-label' }, label),
    h('div', { class: 'metric-value num' }, value),
    sub ? h('div', { class: 'metric-sub' }, sub) : null);
}

export function table(headers, rows, { cls = 'data', caption, numericCols = [] } = {}) {
  return h('div', { class: 'table-wrap' },
    h('table', { class: cls },
      caption ? h('caption', null, caption) : null,
      h('thead', null, h('tr', null, headers.map((x, i) => h('th', { scope: 'col', class: numericCols.includes(i) ? 'num' : null }, x)))),
      h('tbody', null, rows.map((r) => h('tr', { class: r.cls || null }, (r.cells || r).map((c, i) => (i === 0
        ? h('th', { scope: 'row' }, c)
        : h('td', { class: numericCols.includes(i) ? 'num' : null }, c))))))));
}

export function tone(value, { amber, red, direction = 'below' }) {
  if (direction === 'above') return value >= red ? 'red' : value >= amber ? 'amber' : 'ok';
  return value < red ? 'red' : value < amber ? 'amber' : 'ok';
}

const openWorkings = new Set();

/**
 * "Show workings": the formula and every input used for a calculation.
 * rows: [[label, value], …]; formula: string (plain text, monospace).
 */
export function workings(id, formula, rows, note) {
  const det = h('details', {
    class: 'workings',
    open: openWorkings.has(id),
    onToggle: (e) => (e.target.open ? openWorkings.add(id) : openWorkings.delete(id)),
  },
  h('summary', null, t('ui.showWorkings')),
  h('div', { class: 'workings-body' },
    h('pre', { class: 'formula' }, formula),
    rows && rows.length ? h('table', { class: 'workings-inputs' }, h('tbody', null, rows.map(([k, v]) => h('tr', null, h('th', { scope: 'row' }, k), h('td', { class: 'num' }, v))))) : null,
    note ? h('p', { class: 'workings-note' }, note) : null));
  return det;
}

/**
 * Reveal block: a button that uncovers content. State: reveals["tab.key"].
 * Registered in ctx.revealKeys so the instructor's → key reveals the next one.
 */
export function reveal(ctx, key, content, { label, participantLabel } = {}) {
  const full = `${ctx.tab}.${key}`;
  ctx.revealKeys.push(full);
  return ctx.live(() => {
    const shown = Boolean(store.get().reveals[full]);
    if (shown) {
      return h('div', { class: 'revealed', role: 'region', tabindex: '-1', 'data-fkey': `reveal:${full}`, 'aria-label': label || t('ui.reveal') },
        typeof content === 'function' ? content() : content);
    }
    const lbl = store.get().mode === 'participant' ? (participantLabel || t('ui.checkAnswer')) : (label || t('ui.reveal'));
    return button(lbl, () => {
      store.get().reveals[full] = true;
      store.save();
      store.emit('reveals');
    }, { cls: 'btn btn-reveal', attrs: { 'data-reveal': full, 'data-fkey': `reveal:${full}` } });
  }, { cls: 'reveal-slot' });
}

/** Participant hint (collapsible). */
export function hint(ctx, key, text) {
  const full = `${ctx.tab}.${key}`;
  return ctx.live(() => {
    if (store.get().mode !== 'participant') return null;
    const open = Boolean(store.get().hints[full]);
    return h('div', { class: 'hint' },
      button(open ? t('ui.hideHint') : t('ui.showHint'), () => store.set(`hints.${full}`, !open), { cls: 'btn btn-link', attrs: { 'aria-expanded': String(open), 'data-fkey': `hint:${full}` } }),
      open ? h('p', { class: 'hint-text' }, text) : null);
  });
}

/** "Back to the question" strip — what this screen adds to the central question. */
export function backStrip(tabId) {
  return h('aside', { class: 'back-strip', 'aria-label': t('ui.backToQuestion') },
    h('span', { class: 'back-label' }, t('ui.backToQuestion')),
    h('span', { class: 'back-text' }, t(`tabs.${tabId}.back`)));
}

export function fictionalBadge() {
  return h('span', { class: 'badge badge-fictional', title: t('ui.fictionalLong') }, t('ui.fictional'));
}

export function note(text, cls = 'note') {
  return h('p', { class: cls }, text);
}

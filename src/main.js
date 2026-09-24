// App shell: header, left control panel, live metric tiles, tabs, footer, instructor tools.
import { CASE, VERSION, VARIANT } from './data.js';
import { t, setLang } from './i18n.js';
import * as store from './state.js';
import * as fmt from './format.js';
import { h, createCtx, segmented, select, button, metric, resetIds } from './ui.js';
import { TABS, STOP_IDS, value, market, allowanceAt, couponsReceived, stopById } from './model.js';
import { TAB_MODULES } from './tabs/index.js';
import { questionsFor, choosePanel } from './questions.js';

const app = document.getElementById('app');
let ctx = null;
let tilesCtx = null;
let panelCtx = null;
let timerEl = null;

const FULL = new Set(['*', 'lang', 'mode', 'preset', 'presenter', 'tab', 'guided']);

function applyRootAttrs() {
  const s = store.get();
  setLang(s.lang);
  document.documentElement.dataset.presenter = String(Boolean(s.presenter && s.mode === 'instructor'));
  document.documentElement.dataset.mode = s.mode;
  document.title = `${t('app.title')} — ${t(`tabs.${s.tab}.title`)}`;
  const skip = document.getElementById('skip-link');
  if (skip) skip.textContent = t('ui.skip');
}

// ---- Header -------------------------------------------------------------------------------------

function header() {
  const s = store.get();
  timerEl = h('div', { class: 'timer instructor-only', role: 'timer', 'aria-live': 'off' });
  return h('header', { class: 'topbar' },
    h('div', { class: 'brand' },
      h('h1', { class: 'brand-title' }, t('app.title')),
      h('div', { class: 'brand-sub' }, t('app.subtitle'), ' ', h('span', { class: 'badge badge-fictional' }, t('ui.fictional')))),
    h('div', { class: 'tools' },
      timerEl,
      segmented({ path: 'mode', label: t('ui.mode'), options: [{ value: 'instructor', label: t('ui.instructor') }, { value: 'participant', label: t('ui.participant') }] }),
      s.mode === 'instructor' ? h('button', {
        type: 'button', class: 'btn-top', 'aria-pressed': String(Boolean(s.presenter)), title: t('ui.presenterHint'),
        onClick: () => store.set('presenter', !store.get().presenter),
      }, t('ui.presenter')) : null,
      select({ path: 'lang', label: t('ui.language'), options: [{ value: 'en', label: 'English' }, { value: 'zh', label: '简体中文' }] }),
      // Switch between the two views of the same app; state is shared through localStorage.
      h('a', { class: 'btn-top view-switch', href: `${VARIANT === 'focus' ? 'index.html' : 'focus.html'}${location.hash}`, title: t('ui.viewHint') },
        VARIANT === 'focus' ? t('ui.standardView') : t('ui.focusView'))));
}

// ---- Left panel ---------------------------------------------------------------------------------

// Screens tied to one case date move the date context with them (the tiles follow).
const TAB_STOP = { recognition: 'apr26', decision: 'jun26' };

function goTab(id) {
  if (TAB_STOP[id] && store.get().tab !== id) store.get().ctx.stop = TAB_STOP[id];
  store.set('tab', id);
  try { history.replaceState(null, '', `#${id}`); } catch (e) { /* file:// in some browsers */ }
}

function panel() {
  panelCtx = createCtx('panel');
  const stopOptions = STOP_IDS.map((id) => ({ value: id, label: `${fmt.date(stopById(id).date, { month: true })} — ${t(`stops.${id}.short`)}` }));
  return h('aside', { class: 'panel', 'aria-label': t('ui.controlPanel') },
    h('div', { class: 'panel-inner' },
      h('div', null,
        h('h2', null, t('ui.jumpToStop')),
        h('div', { class: 'stop-nav' }, CASE.classStops.map((cs) => button(`${t('ui.stop')} ${cs.n} · ${t(`classStops.s${cs.n}`)} (${cs.questions.join(', ')})`, () => {
          store.get().ctx.stop = cs.stop;
          if (cs.n === 3) store.get().ctx.cf = 'none';
          goTab(cs.tab);
        }, { cls: 'btn btn-small' })))),
      h('div', null,
        h('h2', null, t('ui.context')),
        select({ path: 'ctx.stop', label: t('ui.date'), options: stopOptions }),
        segmented({ path: 'ctx.cf', label: t('ui.counterfactual'), options: [{ value: 'none', label: t('cf.none') }, { value: 'A', label: t('cf.A') }, { value: 'B', label: t('cf.B') }] }),
        panelCtx.live(() => (store.get().ctx.stop === 'jul26' ? null : h('p', { class: 'field-hint' }, t('ui.cfOnlyJul')))),
        segmented({ path: 'ctx.lens', label: t('ui.lens'), options: ['AC', 'FVOCI', 'FVTPL'].map((v) => ({ value: v, label: t(`lens.${v}.short`) })) })),
      h('div', null,
        h('h2', null, t('ui.preset')),
        segmented({ path: 'guidedView', label: t('q.viewMode'), options: [{ value: true, label: t('q.guided') }, { value: false, label: t('q.full') }], onChange: (v) => store.set('guided', v) }),
        segmented({ path: 'preset', label: t('ui.preset'), options: [{ value: 'class', label: t('ui.classDefaults') }, { value: 'free', label: t('ui.freePlay') }], onChange: (v) => { if (v === 'class') store.resetToClass(); } }),
        button(t('ui.resetClass'), () => store.resetToClass(), { cls: 'btn btn-small' })),
      h('div', { class: 'instructor-only' },
        h('h2', null, t('ui.agenda')),
        h('ol', { class: 'small' }, CASE.agenda.map((b) => h('li', null, `${b.start}–${b.end} `, t(`agenda.${b.id}`), ' ',
          b.tabs.map((tab) => button(t(`tabs.${tab}.short`), () => goTab(tab), { cls: 'btn btn-link btn-small' }))))),
        h('h2', null, t('ui.route')),
        h('ol', { class: 'small route-list' }, CASE.route.map((r) => h('li', { value: r.slide },
          button(`${t(`route.s${r.slide}`)}${r.questions.length ? ` · ${r.questions.join(' ')}` : ''}`, () => goTab(r.tab), { cls: 'btn btn-link btn-small' })))),
        h('p', { class: 'small' }, `${t('ui.appendix')}: `, CASE.appendix.map((a, i) => button(`${a.slide} ${t(`route.a${i + 1}`)}`, () => goTab(a.tab), { cls: 'btn btn-link btn-small' }))),
        h('p', { class: 'shortcut-help' }, h('kbd', null, '→'), ' ', t('ui.kNext'), ' · ', h('kbd', null, 'R'), ' ', t('ui.kReset'), ' · ', h('kbd', null, 'P'), ' ', t('ui.kPresenter'))),
      panelCtx.live(() => {
        const s = store.get();
        if (s.mode !== 'participant') return null;
        const done = TABS.filter((id) => s.visited[id]).length;
        return h('div', null,
          h('h2', null, t('ui.progress')),
          h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': TABS.length, 'aria-valuenow': done, 'aria-label': t('ui.progress') },
            h('span', { style: { width: `${(100 * done) / TABS.length}%` } })),
          h('p', { class: 'small muted' }, t('ui.progressText', { done, total: TABS.length })));
      })));
}

// ---- Tiles --------------------------------------------------------------------------------------

function tiles() {
  tilesCtx = createCtx('tiles');
  return tilesCtx.live(() => {
    const s = store.get();
    const id = s.ctx.stop;
    const st = stopById(id);
    const v = value(id);
    const mk = market(id);
    const al = allowanceAt(id);
    const cf = st.counterfactuals && s.ctx.cf !== 'none' ? ` · ${t(`cf.${s.ctx.cf}`)}` : '';
    return [
      metric(t('tiles.date'), fmt.date(st.date), { sub: `${t(`stops.${id}.short`)}${cf}` }),
      metric(t('tiles.yield'), fmt.pct(mk.yield), { sub: `${t('tiles.benchmark')} ${fmt.pctRaw(mk.benchmark)}` }),
      metric(t('tiles.spread'), fmt.bp(mk.spread), { sub: `${fmt.bp(mk.dSpread, 0, { sign: true })} ${t('tiles.vsPurchase')}`, tone: mk.spread >= 500 ? 'red' : mk.spread >= 330 ? 'amber' : null }),
      metric(t('tiles.mid'), fmt.price(v.mid / v.scale), { sub: `${t('tiles.bid')} ${fmt.price(v.bid / v.scale)} · ${t('tiles.bidAsk')} ${fmt.bp(mk.bidAsk)}` }),
      metric(t('tiles.economic'), fmt.money(v.economic, 2, { sign: true }), { sub: t('tiles.vsAC'), tone: v.economic < -5 ? 'red' : v.economic < 0 ? 'amber' : null }),
      metric(t('tiles.realised'), fmt.money(v.realised, 2, { sign: true }), { sub: t('tiles.ifSold'), tone: v.realised < -5 ? 'red' : v.realised < 0 ? 'amber' : null }),
      metric(t('tiles.ecl'), fmt.money(al.allowance), { sub: t('tiles.stage', { n: al.stage }), tone: al.stage > 1 ? 'red' : null }),
      metric(t('tiles.coupons'), fmt.money(couponsReceived(id)), { sub: t('tiles.allPaid'), tone: 'ok' }),
    ];
  }, { cls: 'tiles', attrs: { role: 'group', 'aria-label': t('tiles.label') } });
}

// ---- Tabs ---------------------------------------------------------------------------------------

function tablist() {
  const s = store.get();
  const list = h('div', { class: 'tablist', role: 'tablist', 'aria-label': t('ui.modules') });
  TABS.forEach((id, i) => {
    const selected = s.tab === id;
    const b = h('button', {
      type: 'button', role: 'tab', id: `tab-${id}`, class: `tab${s.visited[id] ? ' visited' : ''}`,
      'aria-selected': String(selected), 'aria-controls': 'tabpanel', tabindex: selected ? '0' : '-1',
      onClick: () => goTab(id),
      onKeydown: (e) => {
        const k = e.key;
        let j = null;
        if (k === 'ArrowRight') j = (i + 1) % TABS.length;
        if (k === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
        if (k === 'Home') j = 0;
        if (k === 'End') j = TABS.length - 1;
        if (j != null) {
          e.preventDefault();
          e.stopPropagation();
          goTab(TABS[j]);
          requestAnimationFrame(() => document.getElementById(`tab-${TABS[j]}`)?.focus());
        }
      },
    }, h('span', { class: 'tab-n', 'aria-hidden': 'true' }, String(i)), t(`tabs.${id}.short`));
    list.appendChild(b);
  });
  return list;
}

function footer() {
  return h('footer', { class: 'footer', role: 'contentinfo' },
    h('p', null, h('strong', null, t('disclaimer.title')), ' ', t('disclaimer.text')),
    h('p', null, `${t('app.title')} v${VERSION} · ${t('app.footerCredit')} · `, h('a', { href: 'description.html' }, t('ui.about'))));
}

function renderTab() {
  const s = store.get();
  const mod = TAB_MODULES[s.tab] || TAB_MODULES.home;
  ctx = createCtx(s.tab);
  const panelEl = h('section', { class: 'tabpanel', id: 'tabpanel', role: 'tabpanel', 'aria-labelledby': `tab-${s.tab}`, tabindex: '-1' });
  mod.render(panelEl, ctx, { goTab });
  // Every teaching screen ends with its choose-one questions (identical panels on every screen).
  const qs = questionsFor(s.tab);
  const qBox = qs.length ? h('div', { class: 'choose-list' }, qs.map((q) => choosePanel(ctx, q))) : null;
  if (qBox) panelEl.appendChild(qBox);
  // Guided mode: the screen shows only its heading, the one table the class uses and the questions.
  const keep = panelEl.querySelector('[data-guided="keep"]');
  if (isGuided() && keep) {
    const head = [...panelEl.children].filter((el) => el.matches('.tab-head, .back-strip, .tab-intro'));
    panelEl.replaceChildren(...head, keep, ...(qBox ? [qBox] : []),
      h('p', { class: 'no-print' }, button(t('q.showFull'), () => store.set('guided', false), { cls: 'btn btn-small' })));
  }
  if (!s.visited[s.tab]) {
    s.visited[s.tab] = true;
    store.save();
  }
  return panelEl;
}

/** Guided mode is on by default for participants and off for the instructor, until chosen. */
function isGuided() {
  const s = store.get();
  return s.guided == null ? s.mode === 'participant' : Boolean(s.guided);
}

function renderAll() {
  resetIds();
  store.get().guidedView = isGuided();
  applyRootAttrs();
  const s = store.get();
  if (!TABS.includes(s.tab)) s.tab = 'home';
  const main = h('main', { class: 'main', id: 'main' }, tiles(), tablist(), renderTab(), footer());
  app.replaceChildren(header(), h('div', { class: 'layout' }, panel(), main));
  tickTimer();
}

function updateAll() {
  tilesCtx?.update();
  panelCtx?.update();
  ctx?.update();
}

// ---- Instructor tools: shortcuts and session timer --------------------------------------------

function isTyping(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

document.addEventListener('keydown', (e) => {
  const s = store.get();
  if (s.mode !== 'instructor' || isTyping(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (document.activeElement && document.activeElement.getAttribute('role') === 'tab') return;
  if (e.key === 'ArrowRight') {
    const next = ctx && ctx.revealKeys.find((k) => !s.reveals[k]);
    if (next) {
      e.preventDefault();
      s.reveals[next] = true;
      store.save();
      store.emit('reveals');
    }
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    store.resetReveals(s.tab);
  } else if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    store.set('presenter', !s.presenter);
  }
});

function clockMinutes() {
  const s = store.get();
  const now = new Date(Date.now() + (s.timerOffset || 0));
  return { now, min: now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 };
}

const toMin = (hhmm) => {
  const [a, b] = hhmm.split(':').map(Number);
  return a * 60 + b;
};

function tickTimer() {
  if (!timerEl) return;
  const { now, min } = clockMinutes();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const block = CASE.agenda.find((b) => min >= toMin(b.start) && min < toMin(b.end));
  let text;
  if (block) {
    const left = Math.ceil(toMin(block.end) - min);
    text = t('timer.inBlock', { block: t(`agenda.${block.id}`), left });
  } else if (min < toMin(CASE.meta.classStart)) {
    text = t('timer.before', { start: CASE.meta.classStart });
  } else {
    text = t('timer.after');
  }
  timerEl.replaceChildren(h('strong', null, hhmm), ' · ', text, ' ',
    h('button', {
      type: 'button', class: 'btn btn-small', style: { marginLeft: '6px' }, title: t('timer.rehearseHint'),
      onClick: () => {
        const d = new Date();
        const target = new Date(d);
        target.setHours(10, 0, 0, 0);
        store.set('timerOffset', store.get().timerOffset ? 0 : target - d, { silent: true });
        tickTimer();
      },
    }, store.get().timerOffset ? t('timer.realClock') : t('timer.rehearse')));
}
setInterval(tickTimer, 15000);

// ---- Boot ---------------------------------------------------------------------------------------

store.load();
const hash = (location.hash || '').slice(1);
if (TABS.includes(hash)) store.get().tab = hash;
store.subscribe((path) => {
  const top = path.split('.')[0];
  if (FULL.has(path) || FULL.has(top) || path === 'position' || path === 'reveals-full') {
    const focusId = document.activeElement && document.activeElement.id;
    renderAll();
    if (path === 'tab') document.getElementById('tabpanel')?.focus({ preventScroll: true });
    else if (focusId) document.getElementById(focusId)?.focus();
  } else {
    updateAll();
  }
});
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (TABS.includes(id) && id !== store.get().tab) store.set('tab', id);
});
renderAll();

// Minimal local SVG chart library (no dependencies, no CDN).
// Line charts with hover crosshair + direct end labels, and a signed bar/waterfall chart.
// Colours come from CSS tokens (--series-*) so the palette stays editable in tokens.css.

const NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  children.flat().forEach((c) => c != null && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return el;
}

function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((m) => span / m <= count) || 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { lo, hi, ticks };
}

/**
 * Line chart.
 * series: [{ id, label, color (css var name), dash, points: [{x, y}] }]
 * markers: [{ x, y, label }]  vline: { x, label }
 */
export function lineChart({ series, markers = [], vline, title, xLabel, yLabel, fmtX = String, fmtY = (v) => v.toFixed(2), width = 640, height = 300 }) {
  const m = { t: 16, r: 110, b: 40, l: 52 };
  const W = width - m.l - m.r;
  const H = height - m.t - m.b;
  const all = series.flatMap((x) => x.points).concat(markers);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yt = niceTicks(Math.min(...ys), Math.max(...ys));
  const X = (x) => m.l + ((x - xMin) / (xMax - xMin || 1)) * W;
  const Y = (y) => m.t + H - ((y - yt.lo) / (yt.hi - yt.lo || 1)) * H;

  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img', 'aria-label': title, preserveAspectRatio: 'xMidYMid meet' });
  svg.appendChild(s('title', {}, title));
  const g = s('g');
  yt.ticks.forEach((v) => {
    g.appendChild(s('line', { x1: m.l, x2: m.l + W, y1: Y(v), y2: Y(v), class: 'grid' }));
    g.appendChild(s('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, fmtY(v)));
  });
  const xt = niceTicks(xMin, xMax, 6);
  xt.ticks.filter((v) => v >= xMin && v <= xMax).forEach((v) => {
    g.appendChild(s('text', { x: X(v), y: m.t + H + 18, 'text-anchor': 'middle', class: 'tick' }, fmtX(v)));
  });
  g.appendChild(s('line', { x1: m.l, x2: m.l + W, y1: m.t + H, y2: m.t + H, class: 'axis' }));
  if (xLabel) g.appendChild(s('text', { x: m.l + W / 2, y: height - 4, 'text-anchor': 'middle', class: 'axis-label' }, xLabel));
  if (yLabel) g.appendChild(s('text', { x: 12, y: m.t + H / 2, transform: `rotate(-90 12 ${m.t + H / 2})`, 'text-anchor': 'middle', class: 'axis-label' }, yLabel));
  if (vline) {
    g.appendChild(s('line', { x1: X(vline.x), x2: X(vline.x), y1: m.t, y2: m.t + H, class: 'vline' }));
    g.appendChild(s('text', { x: X(vline.x) + 4, y: m.t + 12, class: 'vline-label' }, vline.label));
  }
  svg.appendChild(g);

  // Direct labels where the series are most spread out (start or end), nudged apart vertically.
  const spreadAt = (idx) => {
    const ys = series.map((se) => Y(se.points[idx === 0 ? 0 : se.points.length - 1].y));
    return Math.max(...ys) - Math.min(...ys);
  };
  const atStart = spreadAt(0) > spreadAt(-1);
  const ends = series.map((se) => {
    const p = se.points[atStart ? 0 : se.points.length - 1];
    return { se, p, y: Y(p.y) };
  }).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i += 1) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;

  series.forEach((se) => {
    const d = se.points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
    svg.appendChild(s('path', { d, class: 'line', style: `stroke: var(${se.color})`, 'stroke-dasharray': se.dash || null }));
  });
  ends.forEach(({ se, p, y }) => {
    svg.appendChild(atStart
      ? s('text', { x: X(p.x) + 6, y: y - 6, class: 'end-label' }, se.label)
      : s('text', { x: X(p.x) + 8, y: y + 4, class: 'end-label' }, se.label));
  });
  markers.forEach((mk) => {
    svg.appendChild(s('circle', { cx: X(mk.x), cy: Y(mk.y), r: 5, class: 'marker' }));
    if (mk.label) svg.appendChild(s('text', { x: X(mk.x), y: Y(mk.y) - 10, 'text-anchor': 'middle', class: 'marker-label' }, mk.label));
  });

  // Hover crosshair + tooltip (nearest x).
  const cross = s('line', { y1: m.t, y2: m.t + H, class: 'crosshair', visibility: 'hidden' });
  const tipBg = s('rect', { class: 'tip-bg', rx: 4, visibility: 'hidden' });
  const tip = s('text', { class: 'tip', visibility: 'hidden' });
  svg.append(cross, tipBg, tip);
  const hit = s('rect', { x: m.l, y: m.t, width: W, height: H, fill: 'transparent' });
  const xsAll = series[0].points.map((p) => p.x);
  hit.addEventListener('pointermove', (e) => {
    const box = svg.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * width;
    const xv = xMin + ((px - m.l) / W) * (xMax - xMin);
    const nearest = xsAll.reduce((a, b) => (Math.abs(b - xv) < Math.abs(a - xv) ? b : a), xsAll[0]);
    cross.setAttribute('x1', X(nearest));
    cross.setAttribute('x2', X(nearest));
    tip.replaceChildren();
    const lines = [fmtX(nearest)].concat(series.map((se) => {
      const p = se.points.find((q) => q.x === nearest);
      return p ? `${se.label}: ${fmtY(p.y)}` : null;
    }).filter(Boolean));
    lines.forEach((ln, i) => tip.appendChild(s('tspan', { x: 0, dy: i ? 15 : 0 }, ln)));
    const tx = Math.min(X(nearest) + 10, width - 170);
    tip.setAttribute('transform', `translate(${tx},${m.t + 18})`);
    tipBg.setAttribute('x', tx - 6);
    tipBg.setAttribute('y', m.t + 4);
    tipBg.setAttribute('width', 170);
    tipBg.setAttribute('height', 15 * lines.length + 8);
    [cross, tip, tipBg].forEach((el) => el.setAttribute('visibility', 'visible'));
  });
  hit.addEventListener('pointerleave', () => [cross, tip, tipBg].forEach((el) => el.setAttribute('visibility', 'hidden')));
  svg.appendChild(hit);
  return svg;
}

/**
 * Horizontal signed bars (decomposition / ladder). items: [{ label, value, color, texture, valueLabel }]
 * Each bar is directly labelled with its value; zero line drawn.
 */
export function barChart({ items, title, fmt = (v) => v.toFixed(2), width = 640, rowH = 34, domain, marker, base = 0 }) {
  const m = { t: 8, r: 120, b: 8, l: 190 };
  const height = m.t + m.b + rowH * items.length + (marker ? 18 : 0);
  const W = width - m.l - m.r;
  const vals = items.map((i) => i.value).concat(domain || [], marker ? [marker.value] : []);
  const lo = Math.min(base, ...vals);
  const hi = Math.max(base, ...vals);
  const X = (v) => m.l + ((v - lo) / (hi - lo || 1)) * W;
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart chart-bars', role: 'img', 'aria-label': title });
  svg.appendChild(s('title', {}, title));
  const defs = s('defs', {}, s('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
    s('rect', { width: 6, height: 6, class: 'hatch-bg' }), s('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'hatch-line' })));
  svg.appendChild(defs);
  items.forEach((it, i) => {
    const y = m.t + i * rowH;
    const x0 = X(Math.min(base, it.value));
    const w = Math.max(1, Math.abs(X(it.value) - X(base)));
    svg.appendChild(s('text', { x: m.l - 10, y: y + rowH / 2 + 4, 'text-anchor': 'end', class: 'bar-label' }, it.label));
    const bar = s('rect', { x: x0, y: y + 6, width: w, height: rowH - 12, rx: 3, style: `fill: ${it.texture ? 'url(#hatch)' : `var(${it.color})`}`, class: 'bar' });
    bar.appendChild(s('title', {}, `${it.label}: ${it.valueLabel || fmt(it.value)}`));
    svg.appendChild(bar);
    // Values in a fixed right-hand column so they never collide with bars or labels.
    svg.appendChild(s('text', { x: width - 4, y: y + rowH / 2 + 4, 'text-anchor': 'end', class: 'bar-value' }, it.valueLabel || fmt(it.value)));
  });
  svg.appendChild(s('line', { x1: X(base), x2: X(base), y1: m.t, y2: m.t + rowH * items.length, class: 'axis' }));
  if (marker) {
    const yb = m.t + rowH * items.length;
    svg.appendChild(s('line', { x1: X(marker.value), x2: X(marker.value), y1: m.t, y2: yb + 4, class: 'vline' }));
    svg.appendChild(s('text', { x: X(marker.value), y: yb + 16, 'text-anchor': 'middle', class: 'vline-label' }, marker.label));
  }
  return svg;
}

/** One stacked horizontal bar (spread anatomy). parts: [{ label, value, color, texture }] */
export function stackedBar({ parts, title, fmt = (v) => v.toFixed(0), width = 640, height = 90 }) {
  const m = { l: 8, r: 8, t: 8 };
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  const W = width - m.l - m.r;
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart chart-stack', role: 'img', 'aria-label': title });
  svg.appendChild(s('title', {}, title));
  svg.appendChild(s('defs', {}, s('pattern', { id: 'hatch2', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
    s('rect', { width: 6, height: 6, class: 'hatch-bg' }), s('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'hatch-line' }))));
  let x = m.l;
  parts.forEach((p) => {
    const w = (Math.max(0, p.value) / total) * W;
    if (w <= 0) return;
    const r = s('rect', { x: x + 1, y: m.t, width: Math.max(0, w - 2), height: 34, rx: 3, style: `fill: ${p.texture ? 'url(#hatch2)' : `var(${p.color})`}` });
    r.appendChild(s('title', {}, `${p.label}: ${fmt(p.value)}`));
    svg.appendChild(r);
    if (w > 60) {
      svg.appendChild(s('text', { x: x + w / 2, y: m.t + 56, 'text-anchor': 'middle', class: 'bar-label' }, p.label));
      svg.appendChild(s('text', { x: x + w / 2, y: m.t + 74, 'text-anchor': 'middle', class: 'bar-value' }, fmt(p.value)));
    }
    x += w;
  });
  return svg;
}

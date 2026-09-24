// Zero-dependency build: bundles src/ + engine/ (ES modules), i18n/*.json, data/case.json and the CSS
// into ONE self-contained app/index.html that runs from file:// with no network access.
//
// Module bundling: each module is wrapped in a function scope; `import { a, b as c } from './x.js'`
// becomes a destructuring of the dependency's export object; `export function/const/let/class` and
// `export { … }` / `export * from` are collected into the module's export object.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(root, p).split('\\').join('/');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const modules = new Map(); // abs path -> { id, code, deps }
const order = [];

function modId(abs) {
  return '__m_' + rel(abs).replace(/[^a-zA-Z0-9]/g, '_');
}

function load(abs) {
  if (modules.has(abs)) return;
  const src = readFileSync(abs, 'utf8');
  const deps = [];
  const header = [];
  const exportNames = [];
  const reexports = [];
  let body = src;

  // import { a, b as c } from './x.js';   import * as X from './x.js';
  body = body.replace(/^import\s+([\s\S]*?)\s+from\s+['"](.+?)['"];?\s*$/gm, (_, what, spec) => {
    const dep = resolve(dirname(abs), spec);
    deps.push(dep);
    const id = modId(dep);
    what = what.trim();
    if (what.startsWith('* as ')) {
      header.push(`const ${what.slice(5).trim()} = ${id};`);
    } else if (what.startsWith('{')) {
      const inner = what.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
        .map((s) => s.replace(/\s+as\s+/, ': '));
      header.push(`const { ${inner.join(', ')} } = ${id};`);
    } else {
      throw new Error(`Default imports are not supported (${rel(abs)}): ${what}`);
    }
    return '';
  });

  // export * from './x.js';
  body = body.replace(/^export\s+\*\s+from\s+['"](.+?)['"];?\s*$/gm, (_, spec) => {
    const dep = resolve(dirname(abs), spec);
    deps.push(dep);
    reexports.push(modId(dep));
    return '';
  });

  // export { a, b };  (local re-export list)
  body = body.replace(/^export\s+\{([^}]*)\}\s*;?\s*$/gm, (_, list) => {
    list.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
      const [local, as] = s.split(/\s+as\s+/);
      exportNames.push(as ? `${as}: ${local}` : local);
    });
    return '';
  });

  // export function / async function / const / let / class
  body = body.replace(/^export\s+(async\s+function|function\*?|const|let|class)\s+([A-Za-z0-9_$]+)/gm, (_, kind, name) => {
    exportNames.push(name);
    return `${kind} ${name}`;
  });

  if (/^export\s/m.test(body)) throw new Error(`Unsupported export syntax in ${rel(abs)}`);

  modules.set(abs, { id: modId(abs), header, body, exportNames, reexports, deps });
  deps.forEach(load);
  order.push(abs);
}

const entry = resolve(root, 'src/main.js');
load(entry);

const bundled = order.map((abs) => {
  const m = modules.get(abs);
  const exp = `{ ${m.reexports.map((r) => `...${r}`).concat(m.exportNames).join(', ')} }`;
  return `// ---- ${rel(abs)}\nconst ${m.id} = (() => {\n${m.header.join('\n')}\n${m.body}\nreturn Object.freeze(${exp});\n})();`;
}).join('\n\n');

const css = ['src/styles/tokens.css', 'src/styles/app.css', 'src/styles/print.css'].map(read).join('\n');
const i18n = { en: JSON.parse(read('i18n/en.json')), zh: existsSync(resolve(root, 'i18n/zh.json')) ? JSON.parse(read('i18n/zh.json')) : {} };
const caseData = JSON.parse(read('data/case.json'));
const pkg = JSON.parse(read('package.json'));

// Prevent "</script>" inside JSON strings from closing the inline script.
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const template = read('src/index.template.html');
const html = template
  .replace('/*__CSS__*/', () => css)
  .replace('/*__DATA__*/', () => `window.__CASE__ = ${safeJson(caseData)};\nwindow.__I18N__ = ${safeJson(i18n)};\nwindow.__VERSION__ = ${JSON.stringify(pkg.version)};`)
  .replace('/*__JS__*/', () => `"use strict";\n${bundled}`);

mkdirSync(resolve(root, 'app'), { recursive: true });
writeFileSync(resolve(root, 'app/index.html'), html);

// ---- app/description.html: generated from the same translation files --------------------------
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TABS = ['home', 'position', 'mechanisms', 'repricing', 'spread', 'ratings', 'timeline', 'structure', 'portfolio', 'recognition', 'capital', 'controls', 'decision', 'answer', 'glossary'];
function descBody(L) {
  const d = i18n[L];
  if (!d.desc) return '';
  const D = d.desc;
  const ul = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const ps = (arr) => (Array.isArray(arr) ? arr : [arr]).map((x) => `<p>${esc(x)}</p>`).join('');
  const rows = TABS.map((id, i) => `<tr><th scope="row">${i} · ${esc(d.tabs[id].short)}</th><td>${esc(d.tabs[id].intro)}</td><td>${esc(D.modules[id].inputs)}</td><td>${esc(D.modules[id].outputs)}</td></tr>`).join('');
  return `<section data-lang="${L}" lang="${L === 'zh' ? 'zh-Hans' : 'en'}">
<h1>${esc(d.app.title)}</h1>
<p class="question-hero">${esc(d.question)}</p>
<h2>${esc(D.purposeTitle)}</h2>${ps(D.purpose)}
<h2>${esc(D.modulesTitle)}</h2>
<div class="table-wrap"><table class="data"><thead><tr><th scope="col">${esc(D.colModule)}</th><th scope="col">${esc(D.colDoes)}</th><th scope="col">${esc(D.colInputs)}</th><th scope="col">${esc(D.colOutputs)}</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>${esc(D.inputsTitle)}</h2>${ul(D.inputs)}
<h2>${esc(D.outputsTitle)}</h2>${ul(D.outputs)}
<h2>${esc(D.runTitle)}</h2>${ul(D.run)}
<h2>${esc(D.privacyTitle)}</h2>${ps(D.privacy)}
<h2>${esc(D.disclaimerTitle)}</h2><p><strong>${esc(d.disclaimer.text)}</strong></p>
</section>`;
}
const desc = read('src/description.template.html')
  .replace('/*__CSS__*/', () => [read('src/styles/tokens.css'), read('src/styles/app.css')].join('\n'))
  .replace('/*__BODY__*/', () => descBody('en') + descBody('zh'));
writeFileSync(resolve(root, 'app/description.html'), desc);
console.log(`app/index.html + app/description.html written (${(html.length / 1024).toFixed(1)} KiB, ${order.length} modules)`);

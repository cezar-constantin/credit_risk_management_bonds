// Fails if the built app references any external resource (scripts, styles, fonts, images, fetch).
import { readFileSync } from 'node:fs';

let failed = false;
for (const file of ['app/index.html', 'app/focus.html', 'app/description.html']) {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const problems = [];
  for (const m of html.matchAll(/<(script|link|img|iframe|source|audio|video)\b[^>]*\b(src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const url = m[3];
    if (/^(data:|#|index\.html$|description\.html$)/.test(url)) continue;
    problems.push(`${m[1]} → ${url}`);
  }
  if (/@import\s+url|@font-face[^}]*url\(\s*["']?https?:/i.test(html)) problems.push('external CSS import or font');
  if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket/.test(html)) problems.push('network API used');
  if (problems.length) {
    failed = true;
    console.error(`${file}: external resources found:\n  ${problems.join('\n  ')}`);
  } else {
    console.log(`${file}: no external resources, no network APIs.`);
  }
}
process.exit(failed ? 1 : 0);

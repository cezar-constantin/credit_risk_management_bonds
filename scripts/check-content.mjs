// De-identified Huaxing (v3): the built app must not describe the issuer with the old v2 profile.
import { readFileSync } from 'node:fs';

const BANNED = ['tier-1', '28%', 'two board seats', 'RMB 8 bn', '一线城市', '持股28%', '两个董事席位', '80亿元股东借款'];
let failed = false;
for (const file of ['app/index.html', 'app/focus.html', 'app/description.html']) {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const hits = BANNED.filter((b) => html.includes(b));
  if (hits.length) {
    failed = true;
    console.error(`${file}: old Huaxing profile found: ${hits.join(', ')}`);
  } else console.log(`${file}: no old Huaxing profile strings.`);
}
process.exit(failed ? 1 : 0);

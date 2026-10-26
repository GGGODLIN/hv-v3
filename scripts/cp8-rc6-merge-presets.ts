/** cp8-rc6 bugs 1 + 3: replace only the postF20 entries in public/data/cp6-presets.json with a cp8 re-export (school lean kit, school-locked
 *  auto-equip, school-aware 自動分配). Usage: npx tsx scripts/cp8-rc6-merge-presets.ts /tmp/post.json  (see cp6-export-presets.ts header). */
import { readFileSync, writeFileSync } from 'node:fs';
const F = 'public/data/cp6-presets.json';
const cur = JSON.parse(readFileSync(F, 'utf8')) as Record<string, unknown>;
const add = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as Record<string, unknown>;
for (const k of Object.keys(add)) { if (!k.startsWith('postF20-')) throw new Error(k); cur[k] = add[k]; console.error('replaced', k); }
writeFileSync(F, JSON.stringify(cur) + '\n');

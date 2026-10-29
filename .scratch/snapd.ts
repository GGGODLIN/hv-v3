import { readFileSync } from 'node:fs';
import { RULES, runDerived } from '../src/core/run';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const f of process.argv.slice(2)) { const d = JSON.parse(readFileSync(f, 'utf8')); for (const [k, v] of Object.entries(d.snaps as Record<string, any>)) { const F = +k.split(':F')[1]!; if (F < 40 || F > 65) continue; const o = typeof v === 'string' ? JSON.parse(v) : v; const dd = runDerived(o.player, o.run) as any;
  console.log(f.split('/').pop(), F, o.player.lean, 'lv', o.level, 'adb', Math.round(dd.adb), 'hp', Math.round(dd.hp), 'mh', o.player.equipped.mainHand?.name ?? o.player.equipped.mainHand?.base, o.player.equipped.mainHand?.quality, 'pot', o.player.potions.health); } }

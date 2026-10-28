import { readFileSync } from 'node:fs';
import { act, startBattle, armCp5, primaryKey, reflectRisk9, reflectLethal9, turnHints } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, openingOc, runDerived } from '../src/core/run';
import { Rng } from '../src/core/rng';
import { profsOf } from '../src/core/auto';
import { realBoss } from './rc12f-realboss';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const d0 = JSON.parse(readFileSync('/workspace/qa-saves/rc12j-bulwark-1-end.json', 'utf8'));
const P = JSON.parse(d0['hv-v3-qa-snap:20261028101807-1anh:F60']); const F = +(process.argv[2] ?? 75);
let rd = 0, W = 0, L = 0; const srcs: Record<string, number> = {};
for (let i = 0; i < 128; i++) { const p = structuredClone(P.player), run = structuredClone(P.run); run.floor = F;
  const ms = structuredClone(realBoss(run, pool, true, p.lean).ms), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run, p.lean, !!p.equipped?.offHand); b.oc += openingOc(p, 'boss', run); if (run.cp5) armCp5(b, run.pdot);
  const rng = new Rng((i + 1) ^ 0x5bd1e995), profs = profsOf(p);
  while (!b.over && b.turn < 400) { const t = b.monsters.findIndex((m) => m.hp > 0); const pk = primaryKey(b, t); const h = b.hp; const risk = reflectRisk9(b, t), leth = reflectLethal9(b, t), sh = JSON.stringify(b.monsters.map((m: any) => [m.hp, m.thornTurns, m.affixes]));
    const ev = act(b, pk.action, rng, profs) as any[]; const rfl = ev.filter((e) => /^反傷/.test(e.label ?? '')).reduce((a, e) => a + e.dmg, 0);
    if (b.over === 'lose' && b.hp <= 0) { const rf = (b as any); }
    if (b.over === 'lose' && rfl > 0) { const k = `${pk.key}/${pk.src}/leth=${leth}`; srcs[k] = (srcs[k] ?? 0) + 1; if (pk.action.kind !== 'defend' && pk.action.kind !== 'item') { rd++; if (rd < 6) console.log('DEATH', i, b.turn, 'hp', h, '/', b.d.hp, pk.key, pk.src, 'risk', risk, 'rfl', rfl, leth, sh, '|', pk.why.slice(0, 80)); } } }
  if (b.over === 'win') W++; else L++; }
console.log({ F, W, L, srcs, lean: P.player.lean });

import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, startAbyss, encounter, battleLoot } from '../src/core/run';
import { curveSchool12g } from '../src/core/cp8';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const pr = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8')) as Record<string, Preset>;
for (const sc of ['blade', 'bulwark', 'oc', 'arcane']) { const p = presetPlayer(pr[`postF20-${sc}`]!); let n = 0, h = 0;
  for (let s = 1; s <= 400; s++) { const run = startAbyss(p, s * 7 + 3, 1, 0); run.floor = 20; const ms = encounter(run, pool, 'elite', curveSchool12g(p)); const l = battleLoot(run, ms, 'elite', p); n++; h += l.potions.health ?? 0; }
  console.log(sc, curveSchool12g(p), n, h / n); }

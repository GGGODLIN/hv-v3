import { describe, expect, it, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { newPlayer } from '../src/core/player';
import { RULES, abyssLevel, battleLoot, chestLoot, encounter, merchantStock, startAbyss, startRun } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { CP7 } from '../src/core/cp7';
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const flags = { ...RULES };
afterEach(() => Object.assign(RULES, flags));

// cp7-rc3 playtest bug: abyss drops were at player level (abyssLevel, no +5) and pity drops jumped to Lv33/39 (worn + 3×pass).
describe('cp7-rc3 loot level', () => {
  const setup = (seed: number, depth: number, plv: number) => {
    const p = newPlayer(); starterKit(p, seed); const run = depth ? startAbyss(p, seed, depth) : startRun(p, seed); run.plv = plv; return { p, run };
  };
  it('abyss battle / boss / chest / merchant drops (incl. pity) are all player Lv + lootLvAdd', () => {
    RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp7 = true;
    const lv = new Set<number>();
    for (let s = 1; s <= 40; s++) for (const d of [3, 10, 16]) {
      const { p, run } = setup(s, d, 13);
      for (const t of ['battle', 'elite', 'boss'] as const) battleLoot(run, encounter(run, pool, t), t, p).equips.forEach((e) => lv.add(e.level));
      chestLoot(run, p).equips.forEach((e) => lv.add(e.level));
      merchantStock(run).equips.forEach((x) => lv.add(x.e.level));
    }
    expect([...lv]).toEqual([13 + CP7.lootLvAdd]);
  });
  it('main tower drops are player Lv + lootLvAdd too', () => {
    RULES.cp7 = true; const lv = new Set<number>();
    for (let s = 1; s <= 40; s++) { const { p, run } = setup(s, 0, 9); battleLoot(run, encounter(run, pool, 'battle'), 'battle', p).equips.forEach((e) => lv.add(e.level)); chestLoot(run, p).equips.forEach((e) => lv.add(e.level)); }
    expect([...lv]).toEqual([9 + CP7.lootLvAdd]);
  });
  it('pity never rolls above max(drop level, highest worn level)', () => {
    RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp7 = true;
    for (let s = 1; s <= 40; s++) {
      const { p, run } = setup(s, 18, 13); p.equipped.body = { ...p.equipped.body!, level: 17 };
      const top = Math.max(13 + CP7.lootLvAdd, 17);
      for (let k = 0; k < 4; k++) for (const e of battleLoot(run, encounter(run, pool, 'battle'), 'battle', p).equips) expect(e.level).toBeLessThanOrEqual(top);
    }
  });
  it('cp7 off: abyss drops unchanged (abyssLevel)', () => {
    RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp7 = false;
    const { p, run } = setup(3, 10, 13);
    for (const e of chestLoot(run, p).equips) expect(e.level).toBe(abyssLevel(run));
  });
});

import { describe, expect, it } from 'vitest';
import { RULES, monsterLevel, type RunState } from '../src/core/run';
import { floorLevel } from '../src/core/tower';

describe('CP3-bugfix 4: monster level follows player level (暫定)', () => {
  const run = (floor: number, plv: number) => ({ floor, plv }) as RunState;
  it('no change at or below the free level', () => {
    expect(monsterLevel(run(5, RULES.monLvFollow.free))).toBe(floorLevel(5));
    expect(monsterLevel(run(5, 1))).toBe(floorLevel(5));
  });
  it('rises with player level', () => {
    expect(monsterLevel(run(5, 9))).toBe(floorLevel(5) + Math.round(0.8 * 5));
    expect(monsterLevel(run(5, 12))).toBeGreaterThan(monsterLevel(run(5, 9)));
  });
});

import { readFileSync } from 'node:fs';
import { bossName, cleanRow, genName, NAME_VOCAB, BOSS_SEP } from '../src/core/names';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { generateEquip, equipName } from '../src/core/items';
import { Rng } from '../src/core/rng';
describe('CP3-bugfix r3 #1b: equipment names', () => {
  it('Crude never rolls a suffix (Loot_Drop_Rolls.md: suffix from Fair), names use lower-case "of", no doubled words', () => {
    const rng = new Rng(11);
    for (let i = 0; i < 5000; i++) {
      const e = generateEquip(rng, 1 + (i % 60)); const n = equipName(e);
      if (e.quality === 'crude') expect(e.suffix).toBeNull();
      expect(n).not.toMatch(/\bOf\b/); expect(n.split(' ').some((w, j, a) => j > 0 && w === a[j - 1])).toBe(false);
    }
  });
});
describe('CP3-bugfix r3 #1: whitelist monster names', () => {
  const rows = JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[];
  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tok = `(?:${[...NAME_VOCAB].sort((x, y) => y.length - x.length).map(esc).join('|')})`;
  const WHITE = new RegExp(`^(?:${tok}${esc(BOSS_SEP)})?${tok}+[A-Z]?$`);
  it('all 44,382 display names (normal and boss form) use only generator words; raw names never appear', () => {
    expect(rows.length).toBe(44382);
    for (const r of rows) {
      const n = cleanRow(r)[2];
      expect(WHITE.test(n), n).toBe(true);
      expect(WHITE.test(bossName(n)), bossName(n)).toBe(true);
      expect(n).not.toContain(r[2]);
    }
  });
  it('same row -> same name, stats kept, boss gets a title', () => {
    const r = rows.find((x) => x[2] === 'Touyama Nao')!;
    expect(genName(r)).toBe(genName([...r] as MonsterRow));
    const c = cleanRow(r); expect(c.slice(3)).toEqual(r.slice(3)); expect(c[0]).toBe(r[0]);
    expect(buildMonster(c, 5, 'boss').name).toContain(BOSS_SEP);
    expect(buildMonster(c, 5, 'normal').name).toBe(c[2]);
    const pool = makePool(rows);
    expect(pool.rows.every((x) => /^[\u4e00-\u9fff]+$/.test(x[2]))).toBe(true);
  });
});

import { fmtChange } from '../src/game/text';
import { effectiveStats, type Equip } from '../src/core/items';
describe('CP3-bugfix 7: upgrade preview shows the real change', () => {
  it('evade 0.6 -> 0.624 is not shown as 0.6 -> 0.6', () => {
    const [a, b] = fmtChange('evade', 0.6, 0.624);
    expect(a).not.toBe(b);
    expect(b).toBe('+0.62%');
  });
  it('rapier attack damage grows +4% per IW level', () => {
    const e = { stats: { attackDamage: 23.37, burden: 11.38 }, iw: 0 } as unknown as Equip;
    const s = effectiveStats({ ...e, iw: 1 });
    expect(s.attackDamage).toBeCloseTo(24.3, 1);
    expect(s.burden).toBe(11.38);
  });
});

describe('CP3 polish: names', () => {
  it('marks same-name monsters A/B/C and keeps unique names untouched', async () => {
    const { markDuplicates } = await import('../src/core/names');
    expect(markDuplicates(['霜羽鷹', '霜羽鷹', '炎牙狼'])).toEqual(['霜羽鷹A', '霜羽鷹B', '炎牙狼']);
    expect(markDuplicates(['塔主・古霜羽鷹', '炎牙狼'])).toEqual(['塔主・古霜羽鷹', '炎牙狼']);
  });
  it('every trait+noun (with or without a mark) still maps to its own body', async () => {
    const { TRAIT_WORD, BODY_NOUN, nounBody } = await import('../src/core/names');
    for (const [b, ns] of Object.entries(BODY_NOUN)) for (const n of ns) for (const t of TRAIT_WORD) {
      expect(nounBody(`古霜${t}${n}`)).toBe(b); expect(nounBody(`古霜${t}${n}B`)).toBe(b);
    }
  });
});

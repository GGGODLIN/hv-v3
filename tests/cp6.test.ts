import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { abyssLevel, chestLoot, merchantStock, RULES, advance, battleLoot, depthOf, encounter, settle, startAbyss, startRun, abyssOpen } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { prog } from '../src/core/progress';
import { type Cp5Mon } from '../src/core/cp5';
import { ABYSS, ABYSS_KEY, abyssBaseLevel, abyssMonLevel, abyssMult, abyssTier, diffAt, bossKey, checkpointStart, emptyRecord, abyssCarry, recordTitles, titleFor, guaranteeQuality, loadRecord, pickAffixes, recordTrip, tripleOk } from '../src/core/abyss';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('CP6 abyss scaling', () => {
  it('tier follows The Tower table (The_Tower.md)', () => {
    expect([1, 9, 10, 14, 15, 20, 25, 30, 35, 39, 40, 80].map(abyssTier)).toEqual([0, 0, 1, 1, 2, 3, 4, 5, 6, 6, 6, 6]);
  });
  it('rc7 (a): monster level = player level + LPD×(d−1) (Monster_Stats.md:33, Battles.md:220)', () => {
    expect(ABYSS.levelBase).toBe('player');
    expect(abyssMonLevel(1, 15, 0)).toBe(15 + ABYSS.levelOffset);
    expect(abyssMonLevel(17, 15, 0)).toBe(15 + ABYSS.levelOffset + Math.round(ABYSS.playerLevelPerDepth * 16));
  });
  it('r2b knob: d15/d20/d25 abyss bosses deal ×0.6 damage, d5/d10 untouched (暫定)', () => {
    expect(ABYSS.bossDmgAt[15]).toBe(0.6); expect(ABYSS.bossDmgAt[10] ?? 1).toBe(1); expect(ABYSS.bossDmgAt[20]).toBe(0.6); expect(ABYSS.bossDmgAt[25]).toBe(0.6); expect(ABYSS.bossDmgAt[5] ?? 1).toBe(1);
  });
  it('r4 (c): tier jump phases in over its first 3 depths (hp/dmg/pl), 暫定', () => {
    expect(ABYSS.tierRamp).toBe(3); // rc9 default; mechanism below is checked at ramp 3
    const o0 = ABYSS.tierRamp; ABYSS.tierRamp = 3; try {
    expect(diffAt(9, 'dmg')).toBeCloseTo(1.0);
    expect(diffAt(15, 'dmg')).toBeCloseTo(1.2 + 0.2 / 3); expect(diffAt(16, 'dmg')).toBeCloseTo(1.2 + 0.4 / 3); expect(diffAt(17, 'dmg')).toBeCloseTo(1.4); expect(diffAt(19, 'dmg')).toBeCloseTo(1.4);
    expect(diffAt(15, 'hp')).toBeCloseTo(1.1 + 0.1 / 3); expect(diffAt(16, 'pl')).toBeCloseTo(5 + 10);
    const o = ABYSS.tierRamp; ABYSS.tierRamp = 1; try { expect(diffAt(15, 'dmg')).toBeCloseTo(1.4); expect(diffAt(14, 'dmg')).toBeCloseTo(1.2); } finally { ABYSS.tierRamp = o; }
    } finally { ABYSS.tierRamp = o0; }
  });
  it('r2 knob: hpScale/dmgScale multiply every depth (rc9 暫定 0.9/2)', () => {
    expect(ABYSS.hpScale).toBe(0.9); expect(ABYSS.dmgScale).toBe(2);
    expect(abyssMult(1).hp).toBeCloseTo(0.9); expect(abyssMult(12).dmg).toBeCloseTo(2 * diffAt(12, 'dmg') * (1 + ABYSS.dmgPerDepth * 11));
  });
  it('+2% damage per depth accumulates, past 40 adds +5% HP/dmg every 5', () => {
    expect(ABYSS.dmgPerDepth).toBe(0.08); // rc9 default 暫定; mechanism checked at the sourced +2%
    const k = [ABYSS.hpScale, ABYSS.dmgScale, ABYSS.dmgPerDepth]; ABYSS.hpScale = 1; ABYSS.dmgScale = 1; ABYSS.dmgPerDepth = 0.02; const tr = ABYSS.tierRamp; ABYSS.tierRamp = 3;
    try {
    expect(abyssMult(1)).toEqual({ hp: 1, dmg: 1 });
    expect(abyssMult(6).dmg).toBeCloseTo(1.1);
    expect(abyssMult(12).dmg).toBeCloseTo(1.2 * 1.22);
    expect(abyssMult(44).hp).toBeCloseTo(2);
    expect(abyssMult(45).hp).toBeCloseTo(2.1);
    expect(abyssMult(45).dmg).toBeCloseTo(3 * 1.05 * 1.88);
    } finally { [ABYSS.hpScale, ABYSS.dmgScale, ABYSS.dmgPerDepth] = k as [number, number, number]; ABYSS.tierRamp = tr; }
  });
  it('guarantee quality floors from the trophy table', () => {
    expect([5, 10, 15, 20, 25, 30, 35, 60].map(guaranteeQuality)).toEqual(['average', 'average', 'average', 'superior', 'superior', 'exquisite', 'magnificent', 'magnificent']);
  });
  it('boss rotation summon→shield→thorns→drain', () => { expect([5, 10, 15, 20, 25, 45].map(bossKey)).toEqual([5, 10, 15, 20, 5, 5]); });
  it('checkpoint every 5', () => { expect([0, 4, 5, 9, 10, 23].map(checkpointStart)).toEqual([1, 1, 6, 6, 11, 21]); });
});

describe('CP6 affixes', () => {
  it('3-affix sets never hold 法抗/反魔 and respect EXCLUSIVE', () => {
    const r = new Rng(3);
    for (let i = 0; i < 2000; i++) { const ids = pickAffixes(r, 3); expect(ids.length).toBe(3); expect(tripleOk(ids)).toBe(true); expect(ids).not.toContain('warded'); expect(ids).not.toContain('antimagic'); }
  });
  it('deep elites carry 3 affixes, bosses from d25 carry 1', () => {
    RULES.cp6Abyss = true;
    try {
      const p = newPlayer(); starterKit(p);
      const run = startAbyss(p, 11, 31);
      const e = encounter(run, pool, 'elite')[0] as unknown as Cp5Mon;
      expect(e.affixes!.length).toBe(3);
      const b = startAbyss(p, 12, 25);
      const boss = encounter(b, pool, 'boss')[0] as unknown as Cp5Mon;
      expect(boss.sig).toBe('summon');
      expect(boss.affixes!.length).toBe(1);
    } finally { RULES.cp6Abyss = true; }
  });
});

describe('CP6 run flow', () => {
  it('floors are generated without end; every 5th depth is a boss with a guaranteed piece', () => {
    const p = newPlayer(); starterKit(p);
    const run = startAbyss(p, 5, 6);
    for (let i = 0; i < 12; i++) advance(run, 0);
    expect(run.done).toBeNull();
    expect(depthOf(run)).toBe(18);
    expect(run.tower.floors[4]!.options).toEqual(['boss']); // depth 10
    run.floor = 5;
    const ms = encounter(run, pool, 'boss');
    const loot = battleLoot(run, ms, 'boss');
    expect(loot.equips.length).toBe(4); // r2: boss 2 + guarantee 1 + depth-10 milestone 1
    expect(run.abyss!.titles).toEqual(['深淵初探者']); expect(run.abyss!.ms).toBe(10);
  });
  it('death carries back 50% like the main tower and does not count a main trip', () => {
    const p = newPlayer(); starterKit(p);
    const t0 = prog(p).trips, c0 = p.credits;
    const run = startAbyss(p, 5, 1); run.credits = 1000; run.done = 'dead';
    const s = settle(p, run);
    expect(s.credits).toBe(500); expect(p.credits - c0).toBe(500); expect(prog(p).trips).toBe(t0);
  });
  it('unlocks only with the flag on after a main-tower clear', () => {
    const p = newPlayer(); starterKit(p);
    RULES.cp6Abyss = false; // default is on since cp6-pass
    try { const r1 = startRun(p, 1); r1.cp5 = true; r1.done = 'clear'; settle(p, r1); expect(abyssOpen(p)).toBe(false); } finally { RULES.cp6Abyss = true; }
    try { const r2 = startRun(p, 2); r2.cp5 = true; r2.done = 'clear'; settle(p, r2); expect(abyssOpen(p)).toBe(true); } finally { RULES.cp6Abyss = true; }
  });
});

describe('CP6 records', () => {
  it('tracks best and best per school with trip count', () => {
    const r = emptyRecord();
    expect(recordTrip(r, 7, 'blade')).toBe(true);
    expect(recordTrip(r, 3, 'blade')).toBe(false);
    expect(recordTrip(r, 4, 'oc')).toBe(true);
    expect(r).toEqual({ best: 7, trips: 3, ms: 0, titles: [], bySchool: { blade: { best: 7, trip: 1 }, oc: { best: 4, trip: 3 } } });
    expect(loadRecord(JSON.stringify(r))).toEqual(r);
    expect(loadRecord('garbage')).toEqual(emptyRecord());
    expect(ABYSS_KEY).toBe('hv-v3-abyss');
  });
});

describe('CP6 r2 decisions', () => {
  const at = (start: number, ms = 0) => { const p = newPlayer(); starterKit(p); const run = startAbyss(p, 7, start, ms); return { p, run }; };
  it('6: boss drops 2 + 1 guaranteed (no milestone at depth 5)', () => {
    const { run } = at(5); const loot = battleLoot(run, encounter(run, pool, 'boss'), 'boss');
    expect(loot.equips.length).toBe(3); expect(run.abyss!.titles).toEqual([]);
  });
  it('9: milestone only the first time (record ms already 10)', () => {
    const { run } = at(10, 10); const loot = battleLoot(run, encounter(run, pool, 'boss'), 'boss');
    expect(loot.equips.length).toBe(3); expect(run.abyss!.titles).toEqual([]);
    const b = at(20, 10).run; expect(battleLoot(b, encounter(b, pool, 'boss'), 'boss').equips.length).toBe(4); expect(b.abyss!.titles).toEqual([titleFor(20)]);
  });
  it('9: titles recorded once, ms only rises', () => {
    const r = emptyRecord(); recordTitles(r, 20, ['a', 'b']); recordTitles(r, 10, ['a']);
    expect(r).toMatchObject({ ms: 20, titles: ['a', 'b'] });
    expect(loadRecord(JSON.stringify({ best: 3, trips: 1, bySchool: {} }))).toMatchObject({ ms: 0, titles: [] }); // old records upgrade
  });
  it('7: chest and merchant item level follow depth (monster formula)', () => {
    const { run } = at(30); const L = abyssLevel(run);
    expect(L).toBe(abyssMonLevel(30, run.plv ?? 0, 0));
    expect(chestLoot(run).equips.every((e) => e.level === L)).toBe(true);
    expect(merchantStock(run).equips.every((x) => x.e.level === L)).toBe(true);
  });
  it('8: carry multiplier 1 + 0.05 × tier, on death too', () => {
    expect([1, 9, 10, 20, 35, 60].map(abyssCarry)).toEqual([1, 1, 1.05, 1.15, 1.3, 1.3]);
    const p = newPlayer(); starterKit(p); const c0 = p.credits;
    const run = startAbyss(p, 5, 20); run.credits = 1000; run.done = 'dead';
    expect(settle(p, run).credits).toBe(575); expect(p.credits - c0).toBe(575);
  });
});

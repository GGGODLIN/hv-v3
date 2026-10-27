import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sortieLabel } from '../src/core/progress';
import { CP5_TOWER, TOWER, towerRules } from '../src/core/tower';
import { scrollToCurrentFloor } from '../src/game/mapscroll';
import { level } from '../src/core/player';
import type { Preset } from '../src/core/preset';

const presets = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>;

describe('rc11 town sortie count includes abyss trips', () => {
  it('shows total with main / abyss split', () => {
    expect(sortieLabel(9, 3)).toBe('出擊 12 次（主塔 9 ／ 深淵 3）');
    expect(sortieLabel(4, 0)).toBe('出擊 4 次（主塔 4 ／ 深淵 0）');
  });
});

describe('rc11 boss floors come from tower rules', () => {
  it('CP5 tower lists 5/10/15/20, legacy 10-floor tower 5/10', () => {
    expect(towerRules(true).bossFloors).toEqual([5, 10, 15, 20]);
    expect(towerRules(true).bossFloors).toBe(CP5_TOWER.bossFloors);
    expect(towerRules(false).bossFloors).toEqual(TOWER.bossFloors);
  });
});

describe('rc11 map scrolls to the current floor', () => {
  it('centres .floor.cur inside its .tower box', () => {
    // rc18: scrollToCurrentFloor measures with rects (the .tower is now position:relative); same centring outcome
    const box = { offsetHeight: 300, clientHeight: 300, scrollTop: 0, getBoundingClientRect: () => ({ top: 100, height: 300 }) };
    const cur = { offsetHeight: 40, getBoundingClientRect: () => ({ top: 1100 }), closest: (sel: string) => (sel === '.tower' ? box : null) };
    scrollToCurrentFloor({ querySelector: (sel: string) => (sel === '.panel.map .floor.cur' ? cur : null) } as unknown as ParentNode);
    expect(box.scrollTop).toBe(1100 - 100 - (300 - 40) / 2);
  });
  it('no current floor → no-op', () => {
    expect(() => scrollToCurrentFloor({ querySelector: () => null } as unknown as ParentNode)).not.toThrow();
  });
});

describe('rc11 abyss15 preset', () => {
  it('is not below abyss10 in level, best 15 (cp7-rc3 re-export: Lv13 bulwark)', () => {
    const a10 = presets.abyss10!, a15 = presets.abyss15!;
    expect(level(a15.player)).toBeGreaterThanOrEqual(level(a10.player));
    expect((a15.record as { best: number }).best).toBe(15);
    expect(level(a15.player)).toBe(13);
  });
});

import { makePool, type MonsterRow } from '../src/core/monsters';
import { battleLoot, encounter, lootLevel, monsterLevel, RULES, startRun } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { newPlayer } from '../src/core/player';
import { BOSS_PHASE_TEXT } from '../src/core/battle';
import { floorLevel } from '../src/core/tower';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('rc11 main-tower boss clear-bonus labelled 保底', () => {
  it('F5 boss: the first piece is marked guaranteed, Average or better', () => {
    const saved = RULES.cp5Bosses; RULES.cp5Bosses = true;
    try {
      const p = newPlayer(); starterKit(p); const run = startRun(p, 7); run.floor = 5;
      const loot = battleLoot(run, encounter(run, pool, 'boss'), 'boss');
      expect(loot.guaranteed?.length).toBe(1); // 2 boss pieces (F<10) after any ordinary kill drops; the first boss piece is labelled
      const g = loot.equips.find((e) => e.id === loot.guaranteed![0])!;
      expect(loot.equips.indexOf(g)).toBe(loot.equips.length - 2);
      expect(['crude', 'fair']).not.toContain(g.quality);
    } finally { RULES.cp5Bosses = saved; }
  });
});

describe('rc11 loot level (report only; flag stays OFF)', () => {
  it('default: loot level = floor level, monster level follows player level', () => {
    expect(RULES.lootPlayerLevel).toBe(false);
    const p = newPlayer(); starterKit(p); const run = startRun(p, 7); run.plv = 12;
    expect(lootLevel(run)).toBe(floorLevel(1));
    expect(monsterLevel(run)).toBe(floorLevel(1) + Math.round(0.8 * (12 - 4)));
  });
  it('flag ON: loot level = player level', () => {
    RULES.lootPlayerLevel = true;
    try { const p = newPlayer(); starterKit(p); const run = startRun(p, 7); run.plv = 12; expect(lootLevel(run)).toBe(12); } finally { RULES.lootPlayerLevel = false; }
  });
});

describe('rc11 boss revive text', () => {
  it('says the revive clears status ailments', () => { expect(BOSS_PHASE_TEXT).toContain('復活清除異常狀態'); });
});

// cp7-pass: RULES.cp7 is on by default; this file pins the pre-CP7 (cp6-pass) formulas, so it runs with cp7 off.
// CP7 behaviour is covered by tests/cp7*.test.ts.
let savedCp7 = false;
beforeAll(() => { savedCp7 = RULES.cp7; RULES.cp7 = false; });
afterAll(() => { RULES.cp7 = savedCp7; });

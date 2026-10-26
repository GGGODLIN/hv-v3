import { describe, expect, it } from 'vitest';
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
    const box = { offsetTop: 100, clientHeight: 300, scrollTop: 0 };
    const cur = { offsetTop: 1100, offsetHeight: 40, closest: (sel: string) => (sel === '.tower' ? box : null) };
    scrollToCurrentFloor({ querySelector: (sel: string) => (sel === '.panel.map .floor.cur' ? cur : null) } as unknown as ParentNode);
    expect(box.scrollTop).toBe(1100 - 100 - (300 - 40) / 2);
  });
  it('no current floor → no-op', () => {
    expect(() => scrollToCurrentFloor({ querySelector: () => null } as unknown as ParentNode)).not.toThrow();
  });
});

describe('rc11 abyss15 preset', () => {
  it('is not below abyss10 in level, best 15, rule-compliant blade', () => {
    const a10 = presets.abyss10!, a15 = presets.abyss15!;
    expect(level(a15.player)).toBeGreaterThanOrEqual(level(a10.player));
    expect((a15.record as { best: number }).best).toBe(15);
    expect(level(a15.player)).toBe(17);
  });
});

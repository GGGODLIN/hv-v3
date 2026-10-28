import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { derive, equip, level, newPlayer, powerScore, type Player } from '../src/core/player';
import { RULES } from '../src/core/run';
import { generateEquip, type Equip } from '../src/core/items';
import { gearVerdict } from '../src/core/cp7';
import { Rng } from '../src/core/rng';
import { prepEquip, prepIssues } from '../src/core/prep';

const flags = { ...RULES };
beforeEach(() => { RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = true; });
afterEach(() => Object.assign(RULES, flags));
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

/** Playtest save (cp7-rc4 bug 1): bulwark plays the main tower until it reaches F6 and retreats; a 優良 club is in storage. */
function save(seed: number, lo: number, hi: number): { p: Player; club: Equip; delta: number } {
  const p = newPlayer(); starterKit(p, seed);
  for (let i = 1; i <= 30; i++) if (autoRun(p, pool, seed * 1000 + i, 'buff:bulwark', { mode: 'counter', retreat: 0.3 }).floorReached >= 6) break;
  const rng = new Rng(seed);
  for (let k = 0; k < 400; k++) {
    const club = generateEquip(rng, level(p) + 5, { group: 'oneHand', base: 'club', slot: 'mainHand', quality: 'superior' });
    const c = structuredClone(p); const a = powerScore(derive(c)); equip(c, structuredClone(club)); const delta = powerScore(derive(c)) - a;
    if (delta >= lo && delta <= hi) { p.inventory.push(club); return { p, club, delta }; }
  }
  throw new Error('no club');
}

describe('cp7-rc5 bug 1: 裝備欄 ▲ and 出發前整備 share one rule', () => {
  it('bulwark F6 retreat + 優良棍棒 戰力 ▲9 → reminder lists 換上, 換上 wears the club and keeps the shield rule', () => {
    const { p, club, delta } = save(1, 9, 9);
    expect(delta).toBe(9);
    expect(gearVerdict(p, club)).toBe('better');
    expect(prepIssues(p)).toContain('equip');
    expect(prepEquip(p)).toBeGreaterThan(0);
    expect(p.equipped.mainHand?.id).toBe(club.id);
    expect(prepIssues(p)).not.toContain('equip');
  });
  it('a ▲ at or under betterMargin is labelled 小幅提升 (verdict small) and never nags — no contradictory ▲ vs reminder', () => {
    const { p, club, delta } = save(4, 1, 4) /* rc12: 2b/3/6 default-on change the autoRun save; fixture window narrowed so the club stays ≤ betterMargin */;
    expect(delta).toBeGreaterThan(0);
    expect(gearVerdict(p, club)).toBe('small');
    expect(prepIssues(p)).not.toContain('equip');
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it, afterEach } from 'vitest';
import { act, chargeEstimate, potHint, startBattle, windingUp } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
import { CP8 } from '../src/core/cp8';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const snap = { ...RULES };
afterEach(() => Object.assign(RULES, snap));
const cp8 = () => { RULES.cp7 = true; RULES.cp8 = true; RULES.cp5Bosses = true; RULES.cp6Abyss = true; };
const setup = (rank: 'elite' | 'normal', adb: number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1, rank); m.adb = adb; m.acc = 1e6;
  const b = startBattle({ ...d, evade: 0, parry: 0, block: 0 }, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 2, mana: 0, spirit: 0 });
  m.hp = m.maxHp = 1e9; return b;
};
describe('cp8-rc9 P0-1 big single hit is wound up first (自訂，非原版)', () => {
  it('elite hit ≥ 50% max HP: 1 round wind-up (shown as windingUp with its estimate), then the hit', () => {
    cp8(); const b = setup('elite', 1); const m = b.monsters[0]!;
    m.adb = 1; while (chargeEstimate(b, m) < CP8.bigTele * b.d.hp) m.adb *= 1.5;
    const hp0 = b.hp; act(b, { kind: 'focus' }, new Rng(3), {});
    expect(b.hp).toBe(hp0); expect(windingUp(m)).toBe(true); expect(chargeEstimate(b, m)).toBeGreaterThanOrEqual(CP8.bigTele * b.d.hp);
    act(b, { kind: 'focus' }, new Rng(3), {});
    expect(windingUp(m)).toBe(false);
  });
  it('small elite hit and normal monsters are not wound up', () => {
    cp8(); const b = setup('elite', 1); act(b, { kind: 'focus' }, new Rng(3), {}); expect(windingUp(b.monsters[0]!)).toBe(false);
    const c = setup('normal', 1e5); act(c, { kind: 'focus' }, new Rng(3), {}); expect(windingUp(c.monsters[0]!)).toBe(false);
  });
});
describe('cp8-rc9 P0-2 potion hint uses HP − next hit estimate', () => {
  it('lights at 80% HP when the next hit leaves < potAfter, not at 80% HP vs a weak hit', () => {
    cp8(); const b = setup('normal', 1); b.hp = b.d.hp * 0.8; b.itemCd.health = 0;
    expect(potHint(b)).toBe(false);
    const m = b.monsters[0]!; while (chargeEstimate(b, m) < b.d.hp * 0.6) m.adb *= 1.5;
    expect(potHint(b)).toBe(true);
  });
});
import { autoAllocate, allocWeights, autoEquip, leanStyle } from '../src/core/auto';
import { attrCost } from '../src/core/formulas';
import { powerScore, unspentExp } from '../src/core/player';
import { ATTRS } from '../src/core/formulas';
import { generateEquip } from '../src/core/items';
import { applyPreset } from '../src/core/preset';
const presets = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8'));
const kv = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
describe('cp8-rc9 P1 bulwark', () => {
  it('5. new bulwark and the postF20-bulwark preset wear heavy body armour, no cloth', () => {
    cp8(); const p = newPlayer(); starterKit(p, 7, 'bulwark'); expect(p.equipped.body!.group).toBe('heavy');
    const s = applyPreset(kv(), presets['postF20-bulwark']);
    expect(Object.values(s.player.equipped).some((e) => e!.group === 'cloth')).toBe(false);
  });
  it('7. auto-equip never lowers 戰力 (school-lock swap of a disallowed piece for a weaker one is undone)', () => {
    cp8(); const p = applyPreset(kv(), presets['postF20-bulwark']).player;
    p.equipped.body = generateEquip(new Rng(1), 20, { group: 'cloth', base: 'gossamer', slot: 'body', quality: 'magnificent' });
    p.inventory.push(generateEquip(new Rng(2), 1, { group: 'heavy', base: 'plate', slot: 'body', quality: 'crude' }));
    const pw = powerScore(derive(p)); autoEquip(p, [], leanStyle(p));
    expect(powerScore(derive(p))).toBeGreaterThanOrEqual(pw);
    for (let s = 0; s < 30; s++) { const q = applyPreset(kv(), presets['postF20-bulwark']).player;
      const bag = [0, 1, 2, 3].map((i) => generateEquip(new Rng(s * 10 + i), 14)); const w = powerScore(derive(q));
      autoEquip(q, bag, leanStyle(q)); expect(powerScore(derive(q))).toBeGreaterThanOrEqual(w); }
  });
  it('8. 自動分配 leaves no affordable allowed point unspent (rc10 P0-1: allowed = school weight > 0)', () => {
    cp8(); for (const lean of ['bulwark', 'blade', 'oc', 'arcane'] as const) for (const exp of [37, 2438, 2441, 5000]) {
      const p = newPlayer(); p.lean = lean; p.exp = exp; autoAllocate(p);
      const w = allocWeights(p); const cheapest = Math.min(...ATTRS.filter((a) => (w[a] ?? 0) > 0).map((a) => attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a])));
      expect(unspentExp(p)).toBeLessThan(cheapest);
    }
  });
});
import { abyssMult } from '../src/core/abyss';
import { abyssBestMsg, reachedMsg } from '../src/core/run';
describe('cp8-rc9 P1 bugs', () => {
  it('9. ×14.19 at d26 is the combined value (d1 already ×2); the UI shows it relative to d1 (≈ ×7.09)', () => {
    expect(abyssMult(26).dmg).toBeCloseTo(14.19, 1); expect(abyssMult(1).dmg).toBeCloseTo(2, 5);
    expect(abyssMult(26).dmg / abyssMult(1).dmg).toBeCloseTo(7.09, 1);
  });
  it('10. one wording: 到達第 N 層（已通過 N-1 層）', () => {
    expect(reachedMsg(13, 12)).toBe('到達深淵第 13 層（已通過 12 層）');
    expect(abyssBestMsg(12)).toBe('深淵新紀錄：到達第 13 層（已通過 12 層）');
  });
});

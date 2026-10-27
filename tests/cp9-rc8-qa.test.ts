// cp9-rc8 QA（自訂）: bug b banner copy; QA c boss never winds up on the boss turn right after its own telegraphed heavy hit.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { act, startBattle, chargeAdvice, stunTag9, WIND9, nextRoundEstimate, extra9, armCp5 } from '../src/core/battle';
import { CP5 } from '../src/core/cp5';
import { urgentLine, pushOnce9 } from '../src/game/app';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('cp9-rc8 QA', () => {
  it('bug b: lethal but survivable by defending → orange 不防禦會死; still lethal when defending → red', () => {
    const o = urgentLine({ est: 425, hp: 384 }, 297);
    expect(o).toContain('warn-def'); expect(o).toContain('不防禦會死：暴擊估 425 ≥ HP 384，防禦後 297'); expect(o).not.toContain('class="warn"');
    const r = urgentLine({ est: 425, hp: 384 }, 400);
    expect(r).toContain('class="warn"'); expect(r).not.toContain('不防禦會死');
    expect(urgentLine({ est: 425, hp: 384 })).toContain('class="warn"');
  });
  it('rc9 item 4: danger warning shown once per fight even though cp5Tips runs every round', () => {
    const box: string[] = []; for (let i = 0; i < 30; i++) pushOnce9(box, '<div data-cp5danger>⚠ 高危險精英（尖刺）</div>');
    expect(box.length).toBe(1);
    const src = readFileSync('src/game/app.ts', 'utf8'); expect(src).toMatch(/pushOnce9\(this\.cp5TipBox, `<div class="unlock warn" data-cp5danger>/);
    expect(readFileSync('src/style.css', 'utf8')).toMatch(/\.cp5tips \{[^}]*max-height/);
  });
  it('QA c: no boss wind-up on the boss turn after its telegraphed heavy hit (boss + minions, many seeds)', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      WIND9.hits = 0; WIND9.viol = 0; WIND9.minion = 0; WIND9.minHits = 0; WIND9.minViol = 0; WIND9.ex.length = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const p = newPlayer(); starterKit(p); const d = derive(p);
        const boss = buildMonster(pool.rows[seed % pool.rows.length]!, 30, 'boss'); boss.hp = boss.maxHp = 1e6; boss.adb = d.hp * (0.3 + (seed % 5) * 0.2);
        const mins = [1, 2].map((k) => { const m = buildMonster(pool.rows[(seed * 7 + k) % pool.rows.length]!, 30, 'normal'); m.hp = m.maxHp = 1e6; m.adb = d.hp * (seed % 3 ? 0.05 : 0.6); return m; });
        const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss, ...mins], { health: 0, mana: 0, spirit: 0 });
        const rng = new Rng(seed);
        for (let t = 0; t < 40 && !b.over; t++) { b.hp = b.d.hp; act(b, t % 3 ? { kind: 'attack', target: 0 } : { kind: 'defend' }, rng); }
      }
      expect(WIND9.hits).toBeGreaterThan(0);
      expect(WIND9.viol, WIND9.ex.join('\n')).toBe(0);
      expect(WIND9.minHits).toBeGreaterThan(0); expect(WIND9.minViol).toBe(0); // cp9-rc9 item 2: minions too
    } finally { RULES.cp8 = o; }
  });
  it('rc9 item 1: estimate includes burn/bleed tick and 反傷 cap; defended estimate drops both', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const m = buildMonster(pool.rows[3]!, 25, 'boss'); m.hp = m.maxHp = 1e6;
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 }); armCp5(b);
      const base = nextRoundEstimate(b, true, false);
      b.cp5!.pdot.burn = 40; b.cp5!.pdot.burnTurns = 2; b.cp5!.pdot.bleed = 25; b.cp5!.pdot.bleedTurns = 1;
      (m as { affixes?: string[] }).affixes = ['spikes'];
      const refl = Math.round(d.hp * CP5.reflectCapHp);
      expect(extra9(b, false)).toBe(65 + refl); expect(extra9(b, true)).toBe(0);
      expect(nextRoundEstimate(b, true, false)).toBeGreaterThan(base);
    } finally { RULES.cp8 = o; }
  });
  it('rc9 item 7: estimate ≥ current HP never gets the 「< 最大 HP 20%，不必防禦」 exemption (QA oc1 F73)', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      let n = 0;
      for (let r = 0; r < 60; r++) {
        const p = newPlayer(); starterKit(p); const d0 = derive(p); const d = { ...d0, hp: d0.hp * 20 };
        const ms = [0, 1].map((k) => buildMonster(pool.rows[(r * 3 + k) % pool.rows.length]!, 40, 'normal'));
        const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 0, mana: 0, spirit: 0 });
        const est = chargeAdvice(b).est; if (est < 2 || est >= d.hp * 0.2) continue;
        b.hp = est - 1; const a = chargeAdvice(b); n++;
        expect(a.text, `row ${r}: ${a.text}`).not.toContain('不必防禦');
        expect(a.keys[0]).not.toBe('A');
      }
      expect(n).toBeGreaterThan(5);
    } finally { RULES.cp8 = o; }
  });
  it('rc9 item 6: stun / stun-resist tag stays on the monster for every turn it applies', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const m = buildMonster(pool.rows[5]!, 30, 'boss'); m.hp = m.maxHp = 1e6; m.adb = 1;
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
      m.status.stun = 3; const tags: string[] = [stunTag9(m)]; const rng = new Rng(1);
      for (let t = 0; t < 6; t++) { b.hp = b.d.hp; act(b, { kind: 'defend' }, rng); tags.push(stunTag9(m)); }
      expect(tags.slice(0, 3)).toEqual(['暈眩 3', '暈眩 2', '暈眩 1']);
      expect(tags.filter((x) => x.startsWith('暈眩抵抗')).length).toBeGreaterThan(0);
      expect(tags[tags.length - 1]).toBe('');
      expect(readFileSync('src/game/stage.ts', 'utf8')).toMatch(/stunTag9\(v\.m\)/);
    } finally { RULES.cp8 = o; }
  });
});

// rc10（自訂，製作人決定）: items 0–3 — potion-cooldown aware tips, banner/decision consistency, post-hit 重新蓄力 text, 暈眩抵抗中 log.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, rewindNote9, type BEvent, defendEst9, defendRaw9, defendVerdict9, chargeAdvice, coolStunKey9, deathTip, potCooling9, skillKit, startBattle, turnHints, zHint } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';
import { CP9 } from '../src/core/cp8';
import { cdDefNote9, stunResistLines9, urgentLine } from '../src/game/app';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
export const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const lethalCooling = () => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 5000; m.adb = d.hp * 0.25; /* rc12ae（自訂）: adb ≥ bigTele would wind up first (0 this round, real act loop) → keep the plain hit below bigTele */ m.charge = 0;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); b.oc = 300; b.hp = Math.round(d.hp * 0.08); b.itemCd.health = 2; return b;
};

describe('rc10 item 0: potion cooldown → stun / S / D, never 「按 Z」', () => {
  it('deathTip: cooldown branch names 打斷技能、S、D; the Z branch carries the cooldown fallback', () => {
    const cd = deathTip({ lastDmg: 300, maxHp: 1000, pots: 2, potCd: 1 });
    expect(cd).toContain('打斷技能'); expect(cd).toContain('S·靈動架勢'); expect(cd).toContain('D·防禦'); expect(cd).not.toMatch(/按 Z/);
    const z = deathTip({ lastDmg: 300, maxHp: 1000, pots: 2, potCd: 0 });
    expect(z).toMatch(/HP 低於 60% 時就按 Z（藥水冷卻中則改用打斷技能（暈眩）、S·靈動架勢 或 D·防禦）/);
  });
  it('lethal + potion cooling + usable stun → stun key first, then S/D; no Z; sim presses the same stun', () => withCp8(() => {
    const b = lethalCooling(); expect(potCooling9(b)).toBe(true);
    const k = coolStunKey9(b, 0); expect(k).toMatch(/^[QWE]·(盾擊|震盪打擊)$/);
    const a = chargeAdvice(b, 0);
    expect(a.keys[0], a.text).toBe(k); expect(a.keys).not.toContain('Z'); expect(a.text).toContain('打斷'); expect(a.text).toMatch(/冷卻 2 回合/); expect(zHint(b)).toBe(false);
    expect(a.keys.slice(1).every((x) => x === 'S' || x === 'D')).toBe(true);
    expect(turnHints(b, 0).adv!.keys[0]).toBe(k); // UI panel and the sim's ui policy read this same chargeAdvice expect(skillKit(b).length).toBeGreaterThan(0);
  }));
  it('no stun when the target is already stunned / OC is short → falls back to S/D as before', () => withCp8(() => {
    const b = lethalCooling(); b.oc = 0; expect(coolStunKey9(b, 0)).toBeNull(); expect(chargeAdvice(b, 0).keys[0]).toMatch(/^[SDA]$/);
    const c = lethalCooling(); c.monsters[0]!.status.stun = 2; expect(coolStunKey9(c, 0)).toBeNull();
  }));
  it('potion ready (not cooling) → no stun-first rewrite', () => withCp8(() => {
    const b = lethalCooling(); b.itemCd.health = 0; expect(potCooling9(b)).toBe(false); expect(chargeAdvice(b, 0).keys[0]).not.toMatch(/^[QWE]·/);
  }));
});

describe('rc10 item 1: banner 「HP 危險 估計≥HP」 and decision 「防禦後撐得住」 share one verdict', () => {
  it('defendVerdict9 pure cases (incl. rounding and 防禦保命)', () => {
    expect(defendVerdict9(null, null, 100)).toBe('none');
    expect(defendVerdict9(99, 99, 100)).toBe('safe'); expect(defendVerdict9(99.6, 99.6, 100)).toBe('fails');
    expect(defendVerdict9(99, 150, 100)).toBe('saveOnly'); expect(defendVerdict9(120, 150, 100)).toBe('fails');
    expect(cdDefNote9('fails')).toContain('擋不住'); expect(cdDefNote9('saveOnly')).toContain('保命'); expect(cdDefNote9('safe')).toContain('低於 HP');
  });
  it('no state shows a red lethal banner while the decision line says 撐得住 (boss+minion matrix, potion ready / cooling / none, 20% exemption, defendRaw9)', () => withCp8(() => {
    let n = 0; const seen = new Set<string>();
    for (let r = 0; r < 30; r++) for (const f of [0, 0.03, 0.1, 0.25, 0.45, 0.7]) for (const heavy of [false, true]) for (const pot of ['ready', 'cool', 'none'] as const) {
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const boss = buildMonster(pool.rows[r % pool.rows.length]!, 20, 'boss'); boss.hp = boss.maxHp = 1e6; boss.adb = d.hp * (0.05 + (r % 6) * 0.25);
      const min = buildMonster(pool.rows[(r * 7 + 1) % pool.rows.length]!, 20, 'normal'); min.hp = min.maxHp = 1e6; min.adb = d.hp * (r % 5 === 4 ? 0.3 + (r % 3) * 0.5 : 0.02 + (r % 4) * 0.12); // r%5==4: normal fight, no boss cap / 防禦保命
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, r % 5 === 4 ? [min] : r % 3 ? [boss, min] : [boss], { health: pot === 'none' ? 0 : 3, mana: 0, spirit: 0 });
      (boss as { heavyNext?: boolean }).heavyNext = heavy; b.hp = Math.max(1, Math.round(d.hp * f)); b.oc = (r % 2) * 300; if (pot === 'cool') b.itemCd.health = 2; if (r % 4 === 1) (b as { used9?: boolean }).used9 = true; if (f === 0 && r % 2) (b as { stand9?: boolean }).stand9 = true; // 防禦保命 already spent / 1 HP standing
      const a = chargeAdvice(b, 0); if (!a.danger) continue; n++;
      const v = defendVerdict9(defendEst9(b), defendRaw9(b), b.hp); seen.add(v);
      const banner = urgentLine(a, defendEst9(b), defendRaw9(b)), redLethal = /class="warn"[^>]*>(下回合全體暴擊估計 ≥|防禦只靠保命)/.test(banner);
      if (/防禦後撐得住/.test(a.text)) { expect(v, a.text).toBe('safe'); expect(redLethal, banner + ' | ' + a.text).toBe(false); }
      if (v === 'saveOnly' || v === 'fails') expect(a.text, banner).not.toMatch(/防禦後撐得住/);
      if (/不必防禦/.test(a.text)) expect(banner, a.text).not.toMatch(/≥ 目前 HP|≥ HP/);
      if (/class="warn-def"/.test(banner)) expect(v).toBe('safe');
      if (/保命/.test(banner)) expect(v).toBe('saveOnly');
    }
    expect(n).toBeGreaterThan(100); expect([...seen].sort().join(',')).toBe('fails,safe,saveOnly');
  }));
  it('the cooldown line and urgentLine read defendVerdict9 (no 「擋不住」 text matching left)', () => {
    const app = readFileSync('src/game/app.ts', 'utf8');
    expect(app).toMatch(/cdDefNote9\(defendVerdict9\(defendEst9\(b\), defendRaw9\(b\), b\.hp\)\)/);
    expect(app).not.toMatch(/text\.includes\('擋不住'\) \? '（防禦也擋不住/);
    expect(app).toMatch(/const v = defendVerdict9\(estD, estDR, h\)/);
    expect(readFileSync('src/core/battle.ts', 'utf8')).toMatch(/saveOnly = RULES\.cp8 && CP9\.on && defendVerdict9\(estD, estDR, hp\) === 'saveOnly'/);
  });
});

describe('rc10 item 2: boss heavy-hit turn shows 「1 回合後重新蓄力」', () => {
  it('a landed boss 重擊 sets windHitCd and the log note reads it; minions / plain hits get none', () => withCp8(() => {
    expect(CP9.windHitCd).toBe(1);
    let landed = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const boss = buildMonster(pool.rows[0]!, 20, 'boss'); boss.hp = boss.maxHp = 1e6; boss.adb = 30; boss.charge = 1;
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss], { health: 3, mana: 0, spirit: 0 }); b.d.evade = 0; b.d.parry = 0; b.d.block = 0;
      const ev: BEvent[] = act(b, { kind: 'defend' }, new Rng(seed));
      const h = ev.find((e) => e.t === 'hit' && (e as { to?: unknown }).to === 'player' && /重擊/.test((e as { label?: string }).label ?? '')) as { label: string } | undefined;
      if (!h) continue; landed++;
      expect(rewindNote9(b.monsters[0], h.label)).toBe('（1 回合後重新蓄力）');
      expect(rewindNote9(b.monsters[0], undefined)).toBe('');
    }
    expect(landed).toBeGreaterThan(0);
    const mn = buildMonster(pool.rows[1]!, 20, 'normal'); (mn as { windCd?: number }).windCd = 1; expect(rewindNote9(mn, '蓄力一擊！')).toBe('');
    expect(readFileSync('src/game/app.ts', 'utf8')).toMatch(/\$\{refl \? '' : rewindNote9\(b\.monsters\[e\.from\], e\.label\)\}/);
  }));
});

describe('rc10 item 3: battle log notes 「暈眩抵抗中」 while a monster is stun-resisting', () => {
  it('a boss whose stun just ran out logs 暈眩抵抗中 each turn of the resist window (not twice when a stun was just resisted)', () => withCp8(() => {
    const p = newPlayer(); starterKit(p); const d = derive(p);
    const boss = buildMonster(pool.rows[0]!, 20, 'boss'); boss.hp = boss.maxHp = 1e6; boss.adb = 1; boss.status.stun = 1;
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss], { health: 3, mana: 0, spirit: 0 });
    expect(stunResistLines9(b, [])).toEqual([]);
    let ev: BEvent[] = act(b, { kind: 'defend' }, new Rng(1)); // stun ends → resist window opens
    expect(CP9.stunImm).toBeGreaterThan(0);
    expect(stunResistLines9(b, ev)).toEqual([[0, `暈眩抵抗中（剩 ${(b.monsters[0] as { stunImm9?: number }).stunImm9} 回合）`]]);
    expect(stunResistLines9(b, [{ t: 'status', to: 0, text: '暈眩抵抗中' } as BEvent])).toEqual([]);
    ev = act(b, { kind: 'defend' }, new Rng(2));
    const left = (b.monsters[0] as { stunImm9?: number }).stunImm9 ?? 0;
    expect(stunResistLines9(b, ev).length).toBe(left > 0 ? 1 : 0);
    b.monsters[0]!.hp = 0; expect(stunResistLines9(b, [])).toEqual([]);
    expect(readFileSync('src/game/app.ts', 'utf8')).toMatch(/for \(const \[i, t\] of stunResistLines9\(b, ev\)\) this\.log\.push/);
  }));
});

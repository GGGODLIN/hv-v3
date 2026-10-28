// rc11b item 2: shield / iron expiry lines + QA blade-2 F35 t19→t20 (◈ telegraph only; the 尖刺盾 is not up yet at the player's action).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, chargeAdvice, reflectLethal9, reflectRisk9, startBattle } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive] as const; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]; RULES.cp8 = o[1]; SIM_AI.naive = o[2]; } };
function setup(hp: number, mon: Record<string, unknown>) {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 35, 'boss'); Object.assign(m, mon);
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 }); (b as any).cp5 = { pdot: { burn: 0, burnTurns: 0, bleed: 0, bleedTurns: 0 } }; b.hp = hp; return b;
}
const texts = (ev: { t: string; text?: string }[]) => ev.filter((e) => e.t === 'status').map((e) => e.text);
describe('rc11b item 2', () => {
  it('尖刺盾 and 鐵壁 print a line when they run out', () => withCp8(() => {
    const b = setup(1e6, { thornTurns: 1, ironTurns: 1 }); b.d = { ...b.d, hp: 1e6 };
    const t = texts(act(b, { kind: 'defend' }, new Rng(3)) as never);
    expect(t).toContain('尖刺盾消失了（物理攻擊不再反彈）'); expect(t).toContain('鐵壁消失了');
    expect((b.monsters[0] as { thornTurns?: number }).thornTurns).toBe(0);
  }));
  it('no line while the shield still has turns', () => withCp8(() => {
    const b = setup(1e6, { thornTurns: 3 }); b.d = { ...b.d, hp: 1e6 };
    expect(texts(act(b, { kind: 'defend' }, new Rng(3)) as never).some((x) => /消失/.test(x ?? ''))).toBe(false);
  }));
  it('blade-2 F35 t20: ◈ telegraphed (sigPending), shield not up → A cannot be reflected, hint A is correct', () => withCp8(() => {
    const b = setup(1, { sig: 'thorns', sigPending: true, thornTurns: 0 });
    expect(reflectRisk9(b, 0)).toBe(0); expect(reflectLethal9(b, 0)).toBe(false);
    expect(chargeAdvice(b, 0).keys[0]).toBe('A');
  }));
});
import { SIG_TEXT } from '../src/core/cp5';
describe('rc11c: telegraph wording', () => {
  it('◈ telegraph says the shield is only being prepared', () => { expect(SIG_TEXT.thorns.tele).toBe('守門者準備舉起尖刺盾（下回合起物理攻擊會被反彈）'); expect(SIG_TEXT.thorns.icon).toBe('◈'); });
});

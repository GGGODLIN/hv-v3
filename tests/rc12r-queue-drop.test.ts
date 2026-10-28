// rc12r 製作人決定: only a NEW charge telegraph this round drops every queued key and flashes 「蓄力預告！排隊指令已取消」;
// otherwise the rc7 QA item 4 queue rule stays (stun keys survive a wind-up turn).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { queueAfterAct, startBattle } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { App } from '../src/game/app';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (n = 2) => { const p = newPlayer(); starterKit(p); const d = derive(p);
  const ms = Array.from({ length: n }, () => { const m = buildMonster(pool.rows[0]!, 30); m.hp = m.maxHp = 1e5; return m; });
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 2, mana: 0, spirit: 0 }); };
const heavy = (b: ReturnType<typeof mk>, i: number) => { (b.monsters[i] as { heavyNext?: boolean }).heavyNext = true; };
const stun = 'skill:shieldBash';
describe('rc12r: queued keys vs a new telegraph', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('NEW telegraph: every queued key (incl. stun / defend) is dropped and flagged', () => {
    const b = mk(); heavy(b, 0);
    const r = queueAfterAct([false, false], b, { q: stun, queued: 'defend', queued2: 'attack:0' });
    expect(r).toEqual({ q: null, queued: null, queued2: null, dropped: true });
    expect(queueAfterAct([false, false], b, { q: null, queued: null, queued2: null }).dropped).toBe(false); // nothing to cancel → no flash
  });
  it('a second monster starting a telegraph while another is ongoing counts as new', () => {
    const b = mk(); heavy(b, 0); heavy(b, 1);
    expect(queueAfterAct([true, false], b, { q: stun, queued: null, queued2: null }).dropped).toBe(true);
  });
  it('ongoing / old telegraph: not re-triggered, stun key kept (rc7 QA item 4), attack dropped', () => {
    const b = mk(); heavy(b, 0);
    const r = queueAfterAct([true, false], b, { q: stun, queued: 'attack:0', queued2: null });
    expect(r).toEqual({ q: stun, queued: null, queued2: null, dropped: false });
  });
  it('no telegraph: queue untouched', () => {
    const b = mk();
    expect(queueAfterAct([false, false], b, { q: 'attack:0', queued: stun, queued2: 'defend' })).toEqual({ q: 'attack:0', queued: stun, queued2: 'defend', dropped: false });
  });
  it('panel shows the flash only on the drop turn', () => {
    const b = mk(); heavy(b, 0); const p = newPlayer(); starterKit(p);
    const a = Object.create(App.prototype) as any; a.data = { player: p, run: { floor: 30 }, settings: { speed: 1, skipAnim: true } };
    Object.assign(a, { notice: [], pk: null, log: [], pending: {}, enc: [], encAt: 0, cp5TipBox: [], recent: [], cdPending: [], cdShown: [], lastAdvice: null, queued: null, queued2: null, windWas: false, holdKey: null, monsters: [], screen: 'battle', battle: b, target: 0, battleType: 'battle', qDrop: b.turn });
    const h = a.battleHtml() as string;
    expect(h).toContain('蓄力預告！排隊指令已取消');
    a.qDrop = b.turn - 1; expect(a.battleHtml() as string).not.toContain('排隊指令已取消');
  });
  it('real command(): a NEW telegraph during the act drops the queued key, writes a persistent log line and bumps data-qdropcount', async () => {
    const b = mk(1); b.monsters[0]!.adb = 1e5; // worstHit ≥ bigTele → the monster winds up (heavyNext) in this act
    const p = newPlayer(); starterKit(p); const noop = () => undefined;
    const stage = new Proxy({ speed: 1 }, { get: (t: any, k) => (k in t ? t[k] : ['lootBeams', 'play'].includes(String(k)) ? async () => undefined : noop) });
    const a = Object.create(App.prototype) as any; a.data = { player: p, run: { floor: 30 }, settings: { speed: 1, skipAnim: true } };
    Object.assign(a, { notice: [], pk: null, log: [], pending: {}, enc: [], encAt: 0, cp5TipBox: [], recent: [], cdPending: [], cdShown: [], lastAdvice: null, queued: 'attack:0', queued2: null, windWas: false, holdKey: null, screen: 'battle', battle: b, target: 0, battleType: 'battle', stage, busy: false, chargeHoldUntil: 0, rng: { next: () => 0.5, int: () => 0 }, qDrop: -1, qDropN: 0 });
    a.render = noop; a.save = noop; a.go = noop; a.endBattle = async () => undefined;
    a.rng = new (await import('../src/core/rng')).Rng(7);
    const g = globalThis as any; const hadW = 'window' in g; if (!hadW) g.window = { setTimeout, clearTimeout, addEventListener: noop, removeEventListener: noop };
    try { await a.command('defend'); } finally { if (!hadW) delete g.window; }
    expect((b.monsters[0] as { heavyNext?: boolean }).heavyNext).toBe(true);
    expect(a.queued).toBe(null); expect(a.qDropN).toBe(1); expect(a.qDrop).toBe(b.turn);
    expect(a.log.join('')).toMatch(/data-queuedroplog="\d+">蓄力預告！排隊指令已取消（attack:0）/);
    const h = a.battleHtml() as string;
    expect(h).toContain('data-qdropcount="1"'); expect(h).toContain('data-queuedrop');
  });
});

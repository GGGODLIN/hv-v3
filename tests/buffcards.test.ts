/** CP4 rc #1: every buff card's description must agree with its before → after preview (unit and size). */
import { describe, expect, it } from 'vitest';
import { BUFFS } from '../src/core/buffs';
import { RULES, startRun } from '../src/core/run';
import { buffPreview } from '../src/game/buffpreview';
import { newPlayer } from '../src/core/player';
import { readFileSync } from 'node:fs';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
/** A trip-4 character (spells, skills, spirit unlocked; non-zero accuracy and SP). */
const P0 = (() => { const p = newPlayer(); starterKit(p, 1); for (let i = 1; i <= 3; i++) autoRun(p, pool, 1000 + i, 'buff:arcane'); return p; })();

type Kind = 'rel' | 'pp' | 'add';
/** derived-mod key → [preview row key, how the change shows, stat itself is a percentage]. */
const D: Record<string, [string, Kind, boolean]> = {
  adbPct: ['adb', 'rel', false], mdbPct: ['mdb', 'rel', false], hpPct: ['hp', 'rel', false], mpPct: ['mp', 'rel', false], spPct: ['sp', 'rel', false],
  physAccPct: ['physAcc', 'rel', true], magAccPct: ['magAcc', 'rel', true],
  physCrit: ['physCrit', 'pp', true], magCrit: ['magCrit', 'pp', true], evade: ['evade', 'pp', true], parry: ['parry', 'pp', true], block: ['block', 'pp', true],
  physMit: ['physMit', 'pp', true], magMit: ['magMit', 'pp', true], specMitAll: ['specMit', 'pp', true], manaCons: ['manaCons', 'pp', true],
  critMod: ['critMod', 'add', false], spellCritMod: ['spellCritMod', 'add', false], counterResist: ['counterResist', 'pp', true], edbAll: ['edb.fire', 'add', false],
};
const num = (s: string) => Number(s.replace(/[%+回合]/g, '').trim());
const fmt = (x: number) => String(Math.round(x * 1000) / 1000);

describe('buff cards match their preview', () => {
  const was = RULES.cp4RunBuffs;
  for (const bf of BUFFS) it(`${bf.id} ${bf.zh}：${bf.desc}`, () => {
    (RULES as { cp4RunBuffs: boolean }).cp4RunBuffs = true;
    try {
      const p = structuredClone(P0);
      const run = startRun(p, 7); run.buffs = [];
      const rows = buffPreview(p, run, bf.id);
      const row = (k: string) => rows.find((r) => r.k === k);
      for (const [k, v] of Object.entries(bf.d ?? {})) {
        if (k === 'edb') { for (const [e, x] of Object.entries(v as object)) { const r = row(`edb.${e}`)!; expect(r).toBeTruthy(); expect(num(r.after) - num(r.before)).toBeCloseTo(x as number, 0); expect(bf.desc).toContain(`+${x}`); } continue; }
        const [rk, kind, isPct] = D[k]!; const x = v as number; const r = row(rk);
        expect(r, `${k} row`).toBeTruthy();
        const a = num(r!.before), b = num(r!.after);
        // CP4-rc-fix 1: unit consistency — before/after share a unit, and probability stats show % on both the card and the preview.
        expect(r!.before.endsWith('%'), `${k} unit before/after`).toBe(r!.after.endsWith('%'));
        if (isPct) { expect(r!.after, `${k} preview unit`).toMatch(/%$/); expect(bf.desc, `${k} card unit`).toMatch(/[%×]/); }
        if (!isPct && kind !== 'rel') expect(r!.after, `${k} preview unit`).not.toMatch(/%$/);
        if (kind === 'rel') {
          const tol = Math.max(0.02, 0.5 / a); // integer stats (e.g. SP 9→11) round by up to half a point
          expect(b / a).toBeGreaterThan(1 + x - tol); expect(b / a).toBeLessThan(1 + x + tol);
          if (isPct) expect(r!.after).toMatch(/%$/);
          expect(bf.desc).toContain(isPct ? `×${fmt(1 + x)}` : `+${fmt(x * 100)}%`);
        } else if (kind === 'pp') {
          expect(r!.after).toMatch(/%$/); expect(b - a).toBeCloseTo(x * 100, 0);
          expect(bf.desc).toContain(k === 'manaCons' ? `−${fmt(x * 100)}%` : `+${fmt(x * 100)}%`);
        } else { expect(b - a).toBeCloseTo(x, 1); expect(bf.desc).toContain(`+${fmt(x)}`); }
      }
      for (const [k, v] of [...Object.entries(bf.b ?? {}), ...Object.entries(bf.r ?? {})]) {
        if (k === 'skillCd') continue;
        const r = row(`b.${k}`) ?? row(`r.${k}`); expect(r, `${k} row`).toBeTruthy();
        const d = num(r!.after) - num(r!.before); const x = v as number;
        expect(Math.abs(d - x) < 0.011 || Math.abs(d - x * 100) < 0.6, `${k}: ${r!.before}→${r!.after} vs ${x}`).toBe(true);
      }
    } finally { (RULES as { cp4RunBuffs: boolean }).cp4RunBuffs = was; }
  });
});

describe('merchant buff shelf (CP4 rc #2)', () => {
  it('never rolls an empty shelf across 2000 states', async () => {
    const { merchantBuffs } = await import('../src/core/buffoffer');
    const { RULES } = await import('../src/core/run');
    const was = RULES.cp4RunBuffs; RULES.cp4RunBuffs = true;
    for (let s = 0; s < 2000; s++) {
      const r = startRun(structuredClone(P0), s); r.floor = 1 + (s % 10);
      r.buffs = BUFFS.filter((_, i) => (s >> (i % 11)) & 1).map((b) => b.id).slice(0, s % 9);
      expect(merchantBuffs(P0, r).length).toBeGreaterThanOrEqual(1);
    }
    RULES.cp4RunBuffs = was;
  });
  it('advance clears the stale buff stock', async () => {
    const { advance } = await import('../src/core/run');
    const r = startRun(structuredClone(P0), 3); r.buffStock = [{ id: 'B1', price: 1 }];
    advance(r, 0); expect(r.buffStock).toBeUndefined();
  });
});

describe('CP4-rc-fix 2: 韌魂 preview never says "用不到" just because of rounding', () => {
  it('O4 always shows a 最大 SP row, whatever the base SP', () => {
    for (const lv of [1, 3, 8]) {
      const p = newPlayer(); starterKit(p, lv);
      const r = startRun(p, 9);
      const rows = buffPreview(p, r, 'O4');
      expect(rows.some((x) => x.k === 'sp')).toBe(true);
    }
  });
});

describe('CP4-rc-fix 3: merchants in one trip never repeat a non-stackable buff', () => {
  it('many merchants in one trip: each non-S buff listed at most once, none held', async () => {
    const { merchantBuffs } = await import('../src/core/buffoffer');
    const was = RULES.cp4RunBuffs; RULES.cp4RunBuffs = true;
    try {
      for (let seed = 1; seed <= 30; seed++) {
        const p = newPlayer(); starterKit(p, 5);
        const r = startRun(p, seed); r.buffs = ['B2'];
        const listed: string[] = [];
        for (let m = 0; m < 4; m++) for (const x of merchantBuffs(p, r)) if (!x.id.startsWith('S-')) listed.push(x.id);
        expect(new Set(listed).size).toBe(listed.length);
        expect(listed).not.toContain('B2');
      }
    } finally { RULES.cp4RunBuffs = was; }
  });
});

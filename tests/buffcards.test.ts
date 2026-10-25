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
  critMod: ['critMod', 'add', false], spellCritMod: ['spellCritMod', 'add', false], counterResist: ['counterResist', 'add', false], edbAll: ['edb.fire', 'add', false],
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
        if (kind === 'rel') {
          expect(b / a).toBeGreaterThan(1 + x - 0.02); expect(b / a).toBeLessThan(1 + x + 0.02);
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

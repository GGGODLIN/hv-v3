/**
 * CP3 early unlocks (gameplay layer). Every number here is 暫定 (no findings source) and listed in docs/design.md "CP3".
 * Systems open over the first trips; tutorials are keyed by what is still locked, so each one shows only once.
 */
import type { Player } from './player';

export type SystemId = 'defend' | 'potion' | 'ocSkill' | 'spell' | 'merchant' | 'spirit' | 'alloc' | 'shrine' | 'shop' | 'iw';
export const SYSTEMS: { id: SystemId; zh: string; when: string }[] = [
  { id: 'defend', zh: '防禦', when: '第 1 趟 F1 第一場戰鬥' },
  { id: 'potion', zh: '藥水', when: '第 1 趟 F1 第一場戰鬥' },
  { id: 'ocSkill', zh: 'OC 技能', when: '第一次到達 F2' },
  { id: 'spell', zh: '法術（祕法書）', when: '第一次到達 F3 商店' },
  { id: 'merchant', zh: '塔內商人', when: '第一次到達 F3 商店' },
  { id: 'spirit', zh: '靈動架勢', when: '第一次到達 F4（精英戰中 OC 到 50 時提示）' },
  { id: 'alloc', zh: '屬性配點', when: '第 1 趟回城' },
  { id: 'shrine', zh: '神龕（祭壇）', when: '第 2 趟出發（保證 1 個祭壇）' },
  { id: 'shop', zh: '城鎮商店', when: '第 2 趟回城' },
  { id: 'iw', zh: '道具界', when: '首次打倒 F10 首領（第一次免費）' },
];

export interface Progress { trips: number; unlocked: SystemId[]; tips: string[]; iwUses: number; news: string[] }

/** 暫定 (CP3-8): EXP and credits carried home are x3 on trip 1, x2 on trip 2, x1 from trip 3. */
export const CARRY_MULT = [3, 2, 1] as const;
export const carryMult = (trip: number) => CARRY_MULT[Math.min(trip, CARRY_MULT.length) - 1]!;
/** 暫定 (CP3-7): one-time credits gift at the first F3 shop. */
export const F3_GIFT = 300;

export function freshProgress(): Progress { return { trips: 0, unlocked: [], tips: [], iwUses: 0, news: [] }; }
/** Saves from before CP3 have no progress: treat them as veterans with everything open. */
export function prog(p: Player): Progress {
  if (!p.prog) p.prog = { trips: 3, unlocked: SYSTEMS.map((s) => s.id).filter((id) => id !== 'iw'), tips: [], iwUses: 0, news: [] };
  return p.prog;
}
export const has = (p: Player, id: SystemId) => prog(p).unlocked.includes(id);
/** Unlock a system; returns the announcement text when it is new. */
export function unlock(p: Player, id: SystemId): string | null {
  const g = prog(p);
  if (g.unlocked.includes(id)) return null;
  g.unlocked.push(id);
  const s = SYSTEMS.find((x) => x.id === id)!;
  const msg = `🔓 解鎖：${s.zh}`;
  g.news.push(msg);
  return msg;
}
/** Show a tutorial tip once; returns the text the first time only. */
export function tip(p: Player, key: string, text: string): string | null {
  const g = prog(p);
  if (g.tips.includes(key)) return null;
  g.tips.push(key);
  return text;
}
export const unlockRate = (p: Player) => prog(p).unlocked.length / SYSTEMS.length;

export const TIPS = {
  f1: '教學：HP 低時按 Z 喝生命藥水；首領蓄力時按 D 防禦。',
  f2: '教學：攻擊會累積 OC。OC 夠時可用 Q·盾擊 等技能。',
  f3: '教學：商人送你一本祕法書（法術已解鎖）與一筆金錢。下一場的敵人怕某種元素，試試對應法術（1–4）。',
  spirit: '教學：OC 已達 50！按 S 開啟靈動架勢：物理傷害 +100%，每回合消耗 1 SP 與 10 OC，不足時自動關閉。',
} as const;

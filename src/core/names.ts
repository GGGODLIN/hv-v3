/** CP3-bugfix r3 #1 (whitelist): every monster's display name is generated from race (body), PL tier and element;
 * the player-submitted name in monsters.json is never shown. Word lists are this project's own (暫定), not from any source.
 * Stats are untouched. Same row -> same name (pure function of id / race / PL / resist columns). */
import { bodyOf, type Body } from './bodies';

/** Element word: the monster's highest elemental resistance (cold, wind, elec, fire, dark, holy columns). */
export const ELEM_WORD = ['霜', '風', '雷', '炎', '闇', '聖'] as const;
/** PL tier word (thresholds 暫定, PL median 358 / 3rd quartile 1080 / 1600). */
export const TIER_WORD = ['', '老', '古', '太古'] as const;
export const TIER_PL = [358, 1080, 1600] as const;
export const TRAIT_WORD = ['羽', '甲', '牙', '角', '鱗', '影', '岩', '鋼', '骨', '爪', '紋', '翼'] as const;
export const BODY_NOUN: Record<Body, readonly string[]> = {
  bird: ['鳳凰', '鷹', '鴉', '隼'], bug: ['甲蟲', '蜘蛛', '蠍', '螳螂'], beast: ['狼', '熊', '豹', '野豬'],
  undead: ['骷髏', '怨靈', '屍鬼', '亡魂'], mech: ['機兵', '魔像', '鐵偶', '自走甲'], dragon: ['飛龍', '蜥蜴', '蛇龍', '地龍'],
  humanoid: ['戰士', '巨人', '術士', '遊俠'], spirit: ['精靈', '元素靈', '光靈', '妖精'],
};
export const BOSS_TITLE = ['塔主', '深淵之王', '守門者', '災厄'] as const;
export const BOSS_SEP = '·';

/** Every word a display name may contain (the e2e / test whitelist). */
export const NAME_VOCAB: string[] = [...ELEM_WORD, ...TIER_WORD.filter(Boolean), ...TRAIT_WORD, ...Object.values(BODY_NOUN).flat(), ...BOSS_TITLE];
const NOUN_BODY = new Map<string, Body>(Object.entries(BODY_NOUN).flatMap(([b, ns]) => ns.map((n) => [n, b as Body])));
/** Body of a generated name (its noun suffix), so sprites keep matching the name. */
export function nounBody(name: string): Body | null {
  let best: [string, Body] | null = null;
  for (const [n, b] of NOUN_BODY) if (name.endsWith(n) && (!best || n.length > best[0].length)) best = [n, b];
  return best?.[1] ?? null;
}

type Row = [number, string, string, number, string, string, number, number, number, number, number, number, number, number, number];
export function genName(row: Row): string {
  const [id, race, raw, pl] = row;
  const el = row.slice(9, 15) as number[];
  const ei = el.indexOf(Math.max(...el));
  const tier = TIER_WORD[pl < TIER_PL[0] ? 0 : pl < TIER_PL[1] ? 1 : pl < TIER_PL[2] ? 2 : 3];
  const body = bodyOf(race, raw); // body from race / keywords as in cp3-pass2, so sprites do not change
  const nouns = BODY_NOUN[body];
  return `${tier}${ELEM_WORD[ei]}${TRAIT_WORD[id % TRAIT_WORD.length]}${nouns[Math.floor(id / TRAIT_WORD.length) % nouns.length]}`;
}
export function bossName(name: string): string {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${BOSS_TITLE[h % BOSS_TITLE.length]}${BOSS_SEP}${name}`;
}
/** Every row gets a generated name; every stat column is kept. */
export function cleanRow<T extends Row>(row: T): T {
  const r = row.slice() as T;
  r[2] = genName(row);
  return r;
}

/**
 * CP5 (docs/cp5-bosses-floors.md): boss signatures, elite affixes, floor themes, player bleed / burn.
 * Everything here is used only when RULES.cp5Bosses is on. Every number is 暫定 (gameplay layer, no source).
 */
import type { Monster, MonsterRow } from './monsters';
import type { Element } from './player';

/** 暫定 tuning (see docs/design.md CP5). */
export const CP5 = {
  summonEvery: 5, summonMax: 2,
  shieldEvery: 3, shieldSpec: 75, breachSpec: -50, shieldOrder: ['fire', 'cold', 'elec', 'wind'] as Element[],
  thornsEvery: 3, thornsTurns: 3, thornsFrac: 1.0, // CP5 sim tune r1 (was 4/2/0.4)
  drainEvery: 1, drainFrac: 1.0, // CP5 sim tune r1 (was 2/0.5)
  eliteDoubleFloor: 6, eliteDoubleChance: 0.3,
  burn: { frac: 0.15, turns: 3 },
  bleed: { frac: 0.1, turns: 3 },
  maxMonsters: 4,
  spikesFrac: 0.15, leechFrac: 0.25, ironTurns: 2, ironMit: 0.5, splitHp: 0.15, // tune r1 (was 0.25)
  /** CP5 sim tune r1: frost melee damage multiplier; 2-affix elite HP multiplier. */
  frostMult: 0.75, doubleHp: 0.8,
  mitCap: 0.75,
  /** CP5 r2 (暫定): elite HP / ADB multipliers (school-gap fix; 1 = unchanged). */
  eliteHp: 0.7, eliteAdb: 1, // r3 (暫定): 0.8 → 0.7
  /** CP5 r2 (暫定): 1 = elites fight without the normal add. */
  eliteSolo: 1,
  /** CP5 r3 (暫定): 1 = a solo elite gets one extra normal-rank drop roll at its own level (exp included) to replace the missing add. */
  eliteExtraRoll: 1,
  /** CP5 r3 (暫定, producer decision 2): spell-punishing affixes. 反魔 reflects a share of spell damage;
   *  法抗 resist / magic mitigation; pick weight of 法抗/反魔 vs 1 for the others. */
  antimagicFrac: 0.3, wardedResist: 0.3, wardedMit: 0.2, magAffixWeight: 4,
};

export type BossSig = 'summon' | 'shield' | 'thorns' | 'drain';
/** Decision 2: fixed title per boss floor (no hash). */
export const BOSS_BY_FLOOR: Record<number, { sig: BossSig; title: string }> = {
  5: { sig: 'summon', title: '塔主' },
  10: { sig: 'shield', title: '深淵之王' },
  15: { sig: 'thorns', title: '守門者' },
  20: { sig: 'drain', title: '災厄' },
};
export const SIG_TEXT: Record<BossSig, { tele: string; icon: string; tip: string }> = {
  summon: { tele: '塔主正在呼喚援軍（暈眩可打斷）', icon: '⟳', tip: '塔主每隔幾回合會呼喚援軍（最多 2 隻）。看到 ⟳ 預告時用盾擊暈眩它就能打斷；範圍法術可以一次清掉援軍。' },
  shield: { tele: '', icon: '◇', tip: '深淵之王會輪流展開元素之盾：盾的元素抗性大增，下一個元素變成破綻。看弱點面板換用破綻元素，或改用物理攻擊。' },
  thorns: { tele: '守門者舉起尖刺盾（物理攻擊會被反彈）', icon: '◈', tip: `守門者看到 ◈ 預告後會舉起尖刺盾 ${CP5.thornsTurns} 回合，期間物理攻擊會反彈傷害。改用法術，或先防禦等它放下。` },
  drain: { tele: '災厄張開血口（下回合吸血重擊：防禦可減傷，暈眩可打斷）', icon: '♥', tip: `災厄${CP5.drainEvery === 1 ? '每次蓄力都是' : `每第 ${CP5.drainEvery} 次蓄力會變成`}吸血重擊（×2 並回血）。看到紅色 ♥ 預告就防禦，或用盾擊暈眩打斷。` },
};

export type AffixId = 'hard' | 'swift' | 'flame' | 'frost' | 'split' | 'leech' | 'berserk' | 'guard' | 'warded' | 'spikes' | 'keen' | 'iron' | 'antimagic';
export const AFFIXES: Record<AffixId, { zh: string; desc: string }> = {
  hard: { zh: '堅硬', desc: '物理減傷 +15%' },
  swift: { zh: '迅捷', desc: '閃避 +10%' },
  flame: { zh: '烈焰', desc: '命中使你燃燒 3 回合' },
  frost: { zh: '冰霜', desc: '冰抗 +50，近戰改為冰屬性' },
  split: { zh: '分裂', desc: '死亡時分裂成 2 隻小怪' },
  leech: { zh: '嗜血', desc: '命中回血 25% 並使你流血' },
  berserk: { zh: '狂戰', desc: 'HP 低於 50% 狂暴並開始蓄力' },
  guard: { zh: '守護', desc: '格擋 +10%、物理減傷 +5%' },
  warded: { zh: '法抗', desc: `抵抗 +${Math.round(CP5.wardedResist * 100)}%、魔法減傷 +${Math.round(CP5.wardedMit * 100)}%` },
  spikes: { zh: '尖刺', desc: '反彈 15% 物理傷害' },
  keen: { zh: '銳眼', desc: '命中 +10%、暴擊 +5%' },
  iron: { zh: '鐵壁', desc: '前 2 回合傷害減半' },
  antimagic: { zh: '反魔', desc: `反彈 ${Math.round(CP5.antimagicFrac * 100)}% 法術傷害` },
};
export const AFFIX_IDS = Object.keys(AFFIXES) as AffixId[];
export const EXCLUSIVE: [AffixId, AffixId][] = [['hard', 'guard'], ['hard', 'warded'], ['spikes', 'hard'], ['split', 'leech'], ['antimagic', 'warded'], ['antimagic', 'spikes']];
export const compatible = (a: AffixId, b: AffixId) => a !== b && !EXCLUSIVE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
/** Every legal 1- or 2-affix set (death-combo exhaustion). */
export function affixCombos(): AffixId[][] {
  const out: AffixId[][] = AFFIX_IDS.map((a) => [a]);
  AFFIX_IDS.forEach((a, i) => AFFIX_IDS.slice(i + 1).forEach((b) => { if (compatible(a, b)) out.push([a, b]); }));
  return out;
}

/** CP5 extra monster state (all optional, so a flag-off Monster is unchanged). */
export interface Cp5Mon {
  sig?: BossSig; sigTurns?: number; sigPending?: boolean; thornTurns?: number; charges?: number; drainNext?: boolean;
  shieldEl?: Element; breachEl?: Element; specBase?: Monster['spec']; reserve?: Monster[]; summoned?: boolean;
  affixes?: AffixId[]; ironTurns?: number; splitInto?: Monster[]; splitDone?: boolean; ownTurns?: number;
  elemAttack?: Element; critBonus?: number;
}

export function applyAffixes(m: Monster, ids: AffixId[]): void {
  const x = m as Monster & Cp5Mon;
  x.affixes = ids;
  const cap = (v: number) => Math.min(CP5.mitCap, v);
  for (const id of ids) {
    if (id === 'hard') m.physMit = cap(m.physMit + 0.15);
    if (id === 'swift') m.evade += 0.1;
    if (id === 'frost') { m.spec.cold = Math.min(100, m.spec.cold + 50); x.elemAttack = 'cold'; }
    if (id === 'guard') { m.parry += 0.1; m.physMit = cap(m.physMit + 0.05); }
    if (id === 'warded') { m.resist += CP5.wardedResist; m.magMit = cap(m.magMit + CP5.wardedMit); }
    if (id === 'keen') { m.acc += 0.1; x.critBonus = 0.05; }
    if (id === 'iron') x.ironTurns = CP5.ironTurns;
  }
  m.name = `${ids.map((i) => AFFIXES[i].zh).join('')}・${m.name}`;
}
/** Affix pick weight (法抗/反魔 weighted by CP5.magAffixWeight). */
export const affixWeight = (id: AffixId) => (id === 'warded' || id === 'antimagic' ? CP5.magAffixWeight : 1);
export const hasAffix = (m: Monster, id: AffixId) => !!(m as Monster & Cp5Mon).affixes?.includes(id);

export interface Theme { zh: string; races: Record<string, number>; elems: Element[] }
/** §3 floor themes. Weighting inside the existing PL window, never a filter. */
export const THEMES: Theme[] = [
  { zh: '荒野獸徑', races: { Beast: 3, Avion: 3, Arthropod: 3, Reptilian: 3, Celestial: 0.5, Daimon: 0.5 }, elems: ['wind', 'fire'] },
  { zh: '機關墓所', races: { Mechanoid: 3, Undead: 3, Giant: 3, Sprite: 0.5 }, elems: ['elec', 'cold'] },
  { zh: '天穹聖所', races: { Celestial: 3, Sprite: 3, Elemental: 3, Undead: 0.5 }, elems: ['holy', 'wind'] },
  { zh: '深淵王座', races: { Daimon: 3, Dragonkin: 3, Undead: 3, Avion: 0.5 }, elems: ['dark', 'fire'] },
];
export const themeOf = (floor: number): Theme => THEMES[Math.min(3, Math.floor((floor - 1) / 5))]!;
const COL: Record<string, number> = { cold: 9, wind: 10, elec: 11, fire: 12, dark: 13, holy: 14 };
/** A row's theme weight: race weight × 2 if its highest elemental resistance is a theme element. */
export function themeWeight(t: Theme, r: MonsterRow): number {
  let top = 'cold';
  for (const k of Object.keys(COL)) if ((r[COL[k]!] as number) > (r[COL[top]!] as number)) top = k;
  return (t.races[r[1]] ?? 1) * (t.elems.includes(top as Element) ? 2 : 1);
}
/** Strongest themed races, for the map title. */
export const themeRaces = (t: Theme) => Object.entries(t.races).filter(([, w]) => w > 1).map(([r]) => RACE_ZH[r] ?? r);
export const RACE_ZH: Record<string, string> = { Beast: '野獸', Avion: '飛禽', Arthropod: '節肢', Reptilian: '爬蟲', Celestial: '天界', Daimon: '惡魔', Mechanoid: '機械', Undead: '不死', Giant: '巨人', Sprite: '精靈', Elemental: '元素', Dragonkin: '龍族', Humanoid: '人形' };
export const ELEM_ZH: Record<string, string> = { fire: '火', cold: '冰', elec: '雷', wind: '風', holy: '聖', dark: '暗' };

/** Player bleed / burn (decision 3). Damage per tick, turns left. */
export interface PDot { burn: number; burnTurns: number; bleed: number; bleedTurns: number }
export const emptyDot = (): PDot => ({ burn: 0, burnTurns: 0, bleed: 0, bleedTurns: 0 });

/** Sim-only overrides (cp5-sim.ts). */
export const CP5_FORCE: { affixes?: AffixId[] | null; themeOff?: boolean } = {};

/** Sim instrumentation only (never read by game logic). */
export const CP5_STAT = { reflect: 0, reflectN: 0, thornsOn: 0, drainHits: 0, drainHeal: 0, drainTele: 0, summons: 0 };

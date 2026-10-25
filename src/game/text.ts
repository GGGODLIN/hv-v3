import type { StatKey } from '../core/items';

export const STAT_ZH: Record<StatKey, string> = {
  attackDamage: '攻擊傷害', attackAccuracy: '攻擊命中', attackCritChance: '暴擊率', attackCritDamage: '暴擊傷害', attackSpeed: '攻速',
  parry: '招架', block: '格擋', evade: '閃避', resist: '抵抗', burden: '負重', interference: '干擾', counterResist: '反抵抗',
  magicDamage: '魔法傷害', magicAccuracy: '魔法命中', magicCritChance: '法術暴擊', manaConservation: '法力節省', castSpeed: '施法速度', spellCritDamage: '法暴傷害',
  physMitigation: '物理減傷', magMitigation: '魔法減傷', crushMit: '打擊抗性', slashMit: '斬擊抗性', pierceMit: '刺擊抗性',
  fireMit: '火抗', coldMit: '冰抗', elecMit: '雷抗', windMit: '風抗', holyMit: '聖抗', darkMit: '暗抗',
  fireEdb: '火焰增傷', coldEdb: '冰霜增傷', elecEdb: '雷電增傷', windEdb: '風暴增傷', holyEdb: '神聖增傷', darkEdb: '黑暗增傷',
  elementalProf: '元素熟練', divineProf: '神聖熟練', forbiddenProf: '禁忌熟練', deprecatingProf: '減益熟練', supportiveProf: '增益熟練',
  str: '力量', dex: '靈巧', agi: '敏捷', end: '體質', int: '智力', wis: '智慧',
};
const FLAT = new Set(['attackDamage', 'magicDamage', 'burden', 'interference', 'str', 'dex', 'agi', 'end', 'int', 'wis', 'elementalProf', 'divineProf', 'forbiddenProf', 'deprecatingProf', 'supportiveProf']);
export const fmtStat = (k: string, v: number) => (FLAT.has(k) ? `${v >= 0 ? '+' : ''}${Math.round(v * 10) / 10}` : `${v >= 0 ? '+' : ''}${Math.round(v * 10) / 10}%`);
export const ATTR_ZH = { str: '力量 STR', dex: '靈巧 DEX', agi: '敏捷 AGI', end: '體質 END', int: '智力 INT', wis: '智慧 WIS' } as const;
export const ATTR_HINT = { str: '物理傷害、暴擊', dex: '物理傷害、命中、暴擊', agi: '閃避', end: 'HP、物理減傷', int: '魔法傷害、MP', wis: 'MP、魔法減傷、MP 回復' } as const;
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

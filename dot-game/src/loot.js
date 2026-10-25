/** Independent equipment implementation. See docs/LOOT-DESIGN.md for provenance. */
export const SLOTS = Object.freeze(['weapon', 'armor', 'accessory']);
// Original research ranges overlap. We sample tier first, then each stat's R.
// Drop weights below are independent expedition pacing, NOT original-HV rates.
export const QUALITY_TIERS = Object.freeze([
  { name: 'Crude', label: '粗製', color: '#8c97a8', min: 0, max: 40, weight: 2 },
  { name: 'Fair', label: '尚可', color: '#a5b0be', min: 30, max: 70, weight: 5 },
  { name: 'Average', label: '普通', color: '#b6c6d8', min: 60, max: 100, weight: 35 },
  { name: 'Superior', label: '優良', color: '#80d8a0', min: 90, max: 130, weight: 32 },
  { name: 'Exquisite', label: '精良', color: '#6ecbff', min: 120, max: 160, weight: 18 },
  { name: 'Magnificent', label: '華麗', color: '#bd9bff', min: 150, max: 180, weight: 6 },
  { name: 'Legendary', label: '傳奇', color: '#ffbd64', min: 170, max: 200, weight: 1.9 },
  { name: 'Peerless', label: '無雙', color: '#ffe9a6', min: 200, max: 200, weight: 0.1 },
].map(Object.freeze));
export const RARITIES = QUALITY_TIERS;
const finite = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rounded = value => Math.round(value * 10000) / 10000;
const safeLevel = level => clamp(Math.floor(finite(level, 1)), 1, 1000);
function draw(rng) {
  try { return clamp(finite(typeof rng === 'function' ? rng() : 0.5, 0.5), 0, 1 - Number.EPSILON); }
  catch { return 0.5; }
}
function pick(rng, list) { return list[Math.floor(draw(rng) * list.length)]; }
export function qualityFactor(roll) {
  return Math.pow(clamp(finite(roll), 0, 200) / 200, 1.52);
}
/** Conservative display helper only: an R cannot uniquely identify a tier. */
export function qualityFromRoll(roll) {
  const r = Math.floor(clamp(finite(roll), 0, 200));
  if (r === 200) return 'Peerless';
  return QUALITY_TIERS.find(t => r >= t.min && r <= t.max).name;
}
// Weapon ADB endpoint pairs independently transcribed from research 003 §1.6.
// Other displayed base names and armor/accessory endpoints are this game's content.
const BASES = Object.freeze({
  weapon: [
    { name: '暮鋼戰斧', family: 'axe', attack: [350*.0854,701*.0854], slaughter: [470*.0854,888*.0854], note: '重視基礎斬擊傷害。' },
    { name: '逐風刺劍', family: 'rapier', attack: [150*.0854,461*.0854], slaughter: [230*.0854,601*.0854], crit: [124*.0105/100,511*.0105/100], balance: [342*.0105/100,991*.0105/100], note: '較低基礎傷害，可搭配平衡詞綴。' },
    { name: '裂岩戰棍', family: 'club', attack: [250*.0854,621*.0854], slaughter: [353*.0854,792*.0854], crit: [124*.0105/100,511*.0105/100], balance: [344*.0105/100,991*.0105/100], note: '穩定的中量武器。' },
  ],
  armor: [
    { name: '鐵衛胸甲', defense: [8,17], hp: [28,60], block: [.012,.035], note: '偏重減傷與格擋。' },
    { name: '巡獵皮甲', defense: [4,10], hp: [22,48], evade: [.025,.065], note: '較輕的防護，換取閃避。' },
    { name: '餘燼護衣', defense: [5,12], hp: [60,125], note: '偏重生命，適合長線消耗戰。' },
  ],
  accessory: [
    { name: '赤晶指環', attack: [3,8], crit: [.012,.03], note: '為進攻添一分鋒芒。' },
    { name: '守望墜飾', defense: [2,5], hp: [30,70], note: '為防線保留餘裕。' },
    { name: '輕羽符印', evade: [.018,.045], block: [.01,.028], note: '小幅提高躲避與格擋。' },
  ],
});
const PREFIXES = Object.freeze([
  { name: '銳意', stats: { attack: 2 }, note: '攻擊加成' },
  { name: '堅守', stats: { defense: 2, hp: 10 }, note: '防禦與生命加成' },
  { name: '獵隙', stats: { crit: 0.009 }, note: '暴擊機會加成' },
  { name: '流風', stats: { evade: 0.009 }, note: '閃避加成' },
]);
const SUFFIXES = Object.freeze([
  { name: '破陣', stats: { attack: 2, crit: 0.004 }, note: '攻擊與暴擊' },
  { name: '長夜', stats: { hp: 28 }, note: '生命加成' },
  { name: '壁壘', stats: { defense: 2, block: 0.008 }, note: '防禦與格擋' },
  { name: '追風', stats: { evade: 0.008, crit: 0.004 }, note: '閃避與暴擊' },
]);
const STAT_KEYS = Object.freeze(['attack', 'defense', 'hp', 'crit', 'evade', 'block']);
const RATES = new Set(['crit', 'evade', 'block']);
function rollQuality(rng) {
  let choice = draw(rng) * 100;
  for (const tier of QUALITY_TIERS) {
    choice -= tier.weight;
    if (choice < 0) return tier;
  }
  return QUALITY_TIERS.at(-1);
}
/** Pure with deterministic RNG. Caller supplies unique inventory IDs if needed. */
export function generateItem(rng, level = 1, slot) {
  const lv = safeLevel(level);
  const actualSlot = SLOTS.includes(slot) ? slot : pick(rng, SLOTS);
  const base = pick(rng, BASES[actualSlot]);
  const tier = rollQuality(rng);
  const rank = QUALITY_TIERS.indexOf(tier);
  const prefix = rank > 0 && (rank >= 6 || draw(rng) < .3) ? pick(rng, PREFIXES) : null;
  let suffix = null;
  if (rank > 0 && (rank >= 3 || draw(rng) < .45)) {
    if (actualSlot === 'weapon') {
      // Slaughter changes ADB endpoints; Balance changes crit endpoints where documented.
      const available = [{ name: '屠戮', code: 'slaughter', stats: {}, note: '屠戮基底攻擊區間' }];
      if (base.balance) available.push({ name: '平衡', code: 'balance', stats: {}, note: '平衡暴擊區間' });
      suffix = pick(rng, available);
    } else {
      // This game's new armor/accessory affixes have explicitly restricted families.
      const available = actualSlot === 'armor' ? SUFFIXES.slice(1) : SUFFIXES;
      suffix = pick(rng, available);
    }
  }
  const itemStats = {}, rolls = {};
  for (const key of STAT_KEYS) {
    let endpoints = base[key];
    if (key === 'attack' && suffix?.code === 'slaughter') endpoints = base.slaughter;
    if (key === 'crit' && suffix?.code === 'balance') endpoints = base.balance;
    const affix = (prefix?.stats[key] || 0) + (suffix?.stats[key] || 0);
    if (!endpoints && !affix) continue;
    const r = tier.min + Math.floor(draw(rng) * (tier.max - tier.min + 1));
    rolls[key] = r;
    const q = qualityFactor(r);
    const [lo, hi] = endpoints || [0,0];
    const value = lo + (hi - lo) * q + affix * (.75 + .5*q);
    // Original ADB/rate level scale; flat defense and bonus HP are explicit adaptations.
    const scale = RATES.has(key) ? 2000 : key === 'attack' ? 50/3 : key === 'hp' ? 12 : 20;
    itemStats[key] = RATES.has(key) ? rounded(clamp(value*(1+lv/scale),0,.16)) : Math.max(1,Math.round(value*(1+lv/scale)));
  }
  const values = Object.values(rolls);
  const roll = Math.round(values.reduce((a,b)=>a+b,0)/Math.max(1,values.length));
  const id = `loot-${lv}-${roll}-${Math.floor(draw(rng) * 0x100000000).toString(36)}`;
  const item = {
    id, name: `${tier.label}・${prefix?.name || ''}${base.name}${suffix ? '・'+suffix.name : ''}`,
    slot: actualSlot, quality: tier.name, rarityColor: tier.color,
    level: lv, roll, rolls, power: 0, stats: itemStats, locked: false,
    description: `${base.note}詞綴：${[prefix?.note,suffix?.note].filter(Boolean).join('／') || '無'}。`,
    prefix: prefix?.name || '', suffix: suffix?.name || '',
  };
  item.power = scoreItem(item);
  return item;
}
/** Comparison aid only: the engine uses the individual stats, never this scalar. */
export function scoreItem(item) {
  const s = item && typeof item === 'object' && item.stats && typeof item.stats === 'object' ? item.stats : {};
  return Math.round(clamp(finite(s.attack), 0, 1e7) * 2 + clamp(finite(s.defense), 0, 1e7) * 1.6
    + clamp(finite(s.hp), 0, 1e8) * 0.12 + clamp(finite(s.crit), 0, 1) * 260
    + clamp(finite(s.evade), 0, 1) * 200 + clamp(finite(s.block), 0, 1) * 180);
}
export function describeItem(item) {
  if (!item || typeof item !== 'object' || !item.stats || typeof item.stats !== 'object') return '無裝備資料';
  const labels = { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋' };
  return STAT_KEYS.filter(key => finite(item.stats[key]) > 0).map(key =>
    `${labels[key]} +${RATES.has(key) ? `${(finite(item.stats[key]) * 100).toFixed(1)}%` : Math.round(finite(item.stats[key]))}`
  ).join(' · ') || '無額外屬性';
}

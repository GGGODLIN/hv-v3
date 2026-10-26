/** Independent equipment implementation. See docs/LOOT-DESIGN.md for provenance. */
export const SLOTS = Object.freeze(['weapon', 'armor', 'accessory']);
export const WEAPON_FAMILIES = Object.freeze(['axe', 'rapier', 'club']);
// Independent fixed-spec commission choices, not an original-HV shop catalog.
export const COMMISSION_WEAPON_FAMILIES = Object.freeze([
  { family: 'axe', label: '戰斧' },
  { family: 'rapier', label: '刺劍' },
  { family: 'club', label: '戰棍' },
].map(Object.freeze));
// Original research ranges overlap. We sample tier first, then each stat's R.
// Drop weights below are independent expedition pacing, NOT original-HV rates.
// Only already supported original-research base/suffix pairs; no new drop weights.
export const COMMISSION_WEAPON_SUFFIXES = Object.freeze(Object.fromEntries([
  ['axe', ['slaughter']], ['rapier', ['slaughter', 'balance', 'nimble']], ['club', ['slaughter', 'balance']],
].map(([family, suffixes]) => [family, Object.freeze(suffixes.map(suffix => Object.freeze({
  suffix, label: { slaughter: '屠戮', balance: '平衡', nimble: '靈巧' }[suffix],
})))])));
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
    { name: '逐風刺劍', family: 'rapier', attack: [150*.0854,461*.0854], slaughter: [230*.0854,601*.0854], crit: [124*.0105/100,511*.0105/100], balance: [342*.0105/100,991*.0105/100], parry: [75*.0894,211*.0894], nimble: [137*.0894,301*.0894], note: '較低基礎傷害，可搭配平衡詞綴。' },
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
const SLAUGHTER_SUFFIX = Object.freeze({ name: '屠戮', code: 'slaughter', stats: Object.freeze({}), note: '屠戮基底攻擊區間' });
// Exact names emitted by our v0.1/v0.2 generator, not substring guesses.
// Precompute without RNG so adding identity never changes item rolls or IDs.
const LEGACY_WEAPON_NAMES = new Map();
for (const [rank, tier] of QUALITY_TIERS.entries()) {
  const prefixes = rank === 0 ? [''] : rank >= 6 ? PREFIXES.map(p => p.name) : ['', ...PREFIXES.map(p => p.name)];
  for (const base of BASES.weapon) {
    const eligibleSuffixes = ['屠戮', ...(base.balance ? ['平衡'] : []), ...(base.nimble ? ['靈巧'] : [])];
    const suffixes = rank === 0 ? [''] : rank >= 3 ? eligibleSuffixes : ['', ...eligibleSuffixes];
    for (const prefix of prefixes) for (const suffix of suffixes) {
      LEGACY_WEAPON_NAMES.set(`${tier.label}・${prefix}${base.name}${suffix ? '・' + suffix : ''}`, base.family);
    }
  }
}
/** Pure identity lookup for generated items and conservative legacy-save migration.
 * An explicit unsupported value (including null) disables fallback. Save validation
 * must retain that null sentinel rather than silently making the field absent.
 */
export function resolveWeaponFamily(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || item.slot !== 'weapon') return null;
  if ('weaponFamily' in item) {
    return Object.hasOwn(item, 'weaponFamily') && WEAPON_FAMILIES.includes(item.weaponFamily) ? item.weaponFamily : null;
  }
  return typeof item.name === 'string' ? LEGACY_WEAPON_NAMES.get(item.name) ?? null : null;
}
// Safe-sale identity is stricter than combat family identity: only our entire
// generated name grammar counts, including distinct armor/accessory bases.
// This table adds no persistent fields and consumes no RNG.
const GENERATED_ITEM_IDENTITIES = new Map();
for (const [rank, tier] of QUALITY_TIERS.entries()) {
  const prefixes = rank === 0 ? [''] : rank >= 6 ? PREFIXES.map(p => p.name) : ['', ...PREFIXES.map(p => p.name)];
  for (const slot of SLOTS) for (const base of BASES[slot]) {
    const eligibleSuffixes = slot === 'weapon'
      ? ['屠戮', ...(base.balance ? ['平衡'] : []), ...(base.nimble ? ['靈巧'] : [])]
      : (slot === 'armor' ? SUFFIXES.slice(1) : SUFFIXES).map(suffix => suffix.name);
    const suffixes = rank === 0 ? [''] : rank >= 3 ? eligibleSuffixes : ['', ...eligibleSuffixes];
    for (const prefix of prefixes) for (const suffix of suffixes) {
      GENERATED_ITEM_IDENTITIES.set(`${tier.label}・${prefix}${base.name}${suffix ? '・' + suffix : ''}`,
        Object.freeze({ slot, base: base.name, weaponFamily: base.family ?? null, quality: tier.name, prefix, suffix }));
    }
  }
}
const WEAPON_TRAITS = Object.freeze({
  rapier: '刺劍特性：普攻造成傷害時有機會施加穿透護甲，暴擊必定觸發。新層數在該次傷害後生效，降低敵人的一般物理減傷；後續物理技能也受益，但技能不會觸發。',
  axe: '戰斧特性：普攻造成傷害且目標仍存活時，有機會附加可疊層的流血傷口，暴擊必定觸發。依觸發時面板攻擊快照，在之後的 Tick 造成無類型傷害；不是直擊傷害的比例，穿透護甲不會增幅。再觸發會增加層數並刷新，滿層仍刷新；技能與魔法不會觸發。此為歷史模型改編。',
  club: '戰棍特性：普攻命中且造成傷害、目標仍存活時有機會擊暈，符合條件的暴擊必定觸發。暈眩期間敵人不能攻擊、閃避或招架，格擋仍有效；已有暈眩不能疊加或刷新。暈眩結束後，敵人在下個玩家回合先獲得一次恢復行動；技能不會觸發。',
});
const UNKNOWN_WEAPON_TRAIT = '未識別武器類型：不會觸發武器特效。';
// Previous generators persisted these summaries after the flavor/affix description.
// Keep old axe/club wording only for exact display cleanup, never as current rules.
const APPENDED_WEAPON_TRAITS = Object.freeze([
  ...Object.values(WEAPON_TRAITS), UNKNOWN_WEAPON_TRAIT,
  '戰棍：本版尚未實作武器特效。',
  '戰斧：本版尚未實作武器特效。',
]);
/** Plain-text mechanism summary; numeric combat rules live in engine.js. */
export function describeWeaponTrait(item) {
  return WEAPON_TRAITS[resolveWeaponFamily(item)] ?? (item?.slot === 'weapon' ? UNKNOWN_WEAPON_TRAIT : '');
}
/** Display-only cleanup: preserve saved prose, render the live family trait separately. */
export function describeItemFlavor(item) {
  const description = typeof item?.description === 'string' ? item.description : '';
  if (item?.slot !== 'weapon') return description;
  for (const trait of APPENDED_WEAPON_TRAITS) {
    if (description.endsWith(trait)) return description.slice(0, -trait.length);
  }
  return description;
}
const STAT_KEYS = Object.freeze(['attack', 'defense', 'hp', 'crit', 'evade', 'block', 'parry']);
const RATES = new Set(['crit', 'evade', 'block']);
const SAFE_LOOT_QUALITIES = new Set(['Crude', 'Fair', 'Average']);
const ITEM_KEYS = new Set(['id', 'name', 'slot', 'weaponFamily', 'quality', 'rarityColor',
  'level', 'roll', 'rolls', 'power', 'stats', 'locked', 'description', 'prefix', 'suffix', 'soulbound', 'itemWorld']);
const STAT_KEY_SET = new Set(STAT_KEYS);
const REQUIRED_ITEM_KEYS = ['id', 'name', 'slot', 'quality', 'level', 'power', 'stats', 'locked'];
const OBJECT_PROTOTYPE_KEYS = new Set(Reflect.ownKeys(Object.prototype));
const NATIVE_OBJECT_SOURCE = Function.prototype.toString.call(Object);
function plainRecordPrototype(prototype) {
  if (prototype === null || prototype === Object.prototype) return true;
  // JSON parsed by another window/realm is still ordinary data. Require its
  // genuine native Object prototype, not an arbitrary inherited metadata bag.
  if (Object.getPrototypeOf(prototype) !== null) return false;
  const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor')?.value;
  const keys = Reflect.ownKeys(prototype);
  return typeof constructor === 'function' && Function.prototype.toString.call(constructor) === NATIVE_OBJECT_SOURCE
    && keys.length === OBJECT_PROTOTYPE_KEYS.size && keys.every(key => OBJECT_PROTOTYPE_KEYS.has(key));
}
// Inspect descriptors rather than invoking imported accessors. Unknown future
// item/stat/roll keys must not disappear into a permissive comparison.
function knownDataRecord(value, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (!plainRecordPrototype(prototype)) return false;
  return Reflect.ownKeys(value).every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && allowedKeys.has(key) && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  });
}
/** Detect metadata a legacy sanitizer would otherwise silently discard. This is
 * independent of quality/lock/name eligibility, for conservative import handling.
 */
export function hasUnknownSaleMetadata(item) {
  try {
    if (!knownDataRecord(item, ITEM_KEYS)
      || (item.slot !== 'weapon' && Object.hasOwn(item, 'weaponFamily'))
      || (Object.hasOwn(item, 'locked') && typeof item.locked !== 'boolean')
      || ['name', 'description', 'rarityColor', 'prefix', 'suffix'].some(key => Object.hasOwn(item, key) && typeof item[key] !== 'string')
      || ['level', 'power', 'roll'].some(key => Object.hasOwn(item, key)
        && (typeof item[key] !== 'number' || !Number.isFinite(item[key])))) return true;
    if (Object.hasOwn(item, 'stats')) {
      if (!knownDataRecord(item.stats, STAT_KEY_SET)) return true;
      for (const [key, value] of Object.entries(item.stats)) {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > (RATES.has(key) ? 1 : 1000000)) return true;
      }
    }
    if (Object.hasOwn(item, 'rolls')) {
      if (!knownDataRecord(item.rolls, STAT_KEY_SET)) return true;
      for (const [key, value] of Object.entries(item.rolls)) {
        if (!item.stats || !Object.hasOwn(item.stats, key) || !Number.isInteger(value) || value < 0 || value > 200) return true;
      }
    }
    if ((Object.hasOwn(item, 'soulbound') || Object.hasOwn(item, 'itemWorld')) && !isSoulboundItem(item)) return true;
    return false;
  } catch { return true; }
}
/** Pure fail-closed classification for safe-sale rules, not a combat identity override.
 * Optional historical diagnostic fields may be absent; supplied metadata must be
 * recognized, well-formed, and consistent with the complete generated name.
 */
function classifyItemIdentity(item) {
  try {
    if (!knownDataRecord(item, ITEM_KEYS) || !REQUIRED_ITEM_KEYS.every(key => Object.hasOwn(item, key)) || typeof item.id !== 'string' || !item.id || item.id.length > 100
      || typeof item.name !== 'string' || typeof item.locked !== 'boolean'
      || !Number.isInteger(item.level) || item.level < 1 || item.level > 1000
      || typeof item.power !== 'number' || !Number.isFinite(item.power) || item.power < 0 || item.power > 1000000) return null;
    const identity = GENERATED_ITEM_IDENTITIES.get(item.name);
    if (!identity || item.slot !== identity.slot || item.quality !== identity.quality) return null;
    if (identity.slot === 'weapon') {
      if (resolveWeaponFamily(item) !== identity.weaponFamily) return null;
    } else if (Object.hasOwn(item, 'weaponFamily')) return null;
    for (const key of ['prefix', 'suffix']) {
      if (Object.hasOwn(item, key) && item[key] !== identity[key]) return null;
    }
    if (Object.hasOwn(item, 'rarityColor') && (typeof item.rarityColor !== 'string' || !/^#[\da-f]{3,8}$/i.test(item.rarityColor))) return null;
    if (Object.hasOwn(item, 'description') && (typeof item.description !== 'string' || item.description.length > 240)) return null;
    if (Object.hasOwn(item, 'roll') && (!Number.isInteger(item.roll) || item.roll < 0 || item.roll > 200)) return null;
    if (!knownDataRecord(item.stats, STAT_KEY_SET) || !Object.keys(item.stats).length) return null;
    for (const [key, value] of Object.entries(item.stats)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > (RATES.has(key) ? 1 : 1000000)) return null;
    }
    if (Object.hasOwn(item, 'rolls')) {
      if (!knownDataRecord(item.rolls, STAT_KEY_SET)) return null;
      for (const [key, value] of Object.entries(item.rolls)) {
        if (!Object.hasOwn(item.stats, key) || !Number.isInteger(value) || value < 0 || value > 200) return null;
      }
    }
    return identity;
  } catch { return null; }
}
/** Valid bound weapons may be comparison keepers, never sale candidates. */
export function classifySafeLootItem(item) {
  const identity = classifyItemIdentity(item);
  if (!identity || ((Object.hasOwn(item, 'soulbound') || Object.hasOwn(item, 'itemWorld')) && !isSoulboundItem(item))) return null;
  return identity;
}
const SOULBOUND_KEYS = new Set(['version', 'level', 'stats']);
export const ITEM_WORLD_QUALITIES = Object.freeze(['Fair', 'Average', 'Superior']);
const ITEM_WORLD_KEYS = new Set(['version', 'level']);
// This bounded first slice supports only Fair/Average/Superior IW0 → IW1, not original max10.
function itemWorldLevel(item) {
  if (!Object.hasOwn(item, 'itemWorld')) return 0;
  const world = item.itemWorld;
  return ITEM_WORLD_QUALITIES.includes(item.quality) && knownDataRecord(world, ITEM_WORLD_KEYS)
    && Object.keys(world).length === 2 && world.version === 1 && world.level === 1 ? 1 : null;
}
const SOULBIND_COSTS = Object.freeze({ Crude:100, Fair:100, Average:100, Superior:100,
  Exquisite:100, Magnificent:250, Legendary:500, Peerless:1000 });
const validHeroLevel = level => Number.isInteger(level) && level >= 1 && level <= 500;
function soulStatsValid(stats) {
  return knownDataRecord(stats, STAT_KEY_SET) && Object.hasOwn(stats, 'attack') && stats.attack > 0
    && Object.entries(stats).every(([key, value]) => typeof value === 'number' && Number.isFinite(value)
      && value >= 0 && value <= (RATES.has(key) ? .16 : 1000000)
      && (RATES.has(key) || key === 'parry' ? value === rounded(value) : Number.isInteger(value)));
}
// Preserve historical generated values rather than inventing unknown base rolls.
// 50/3 is this game's historical ADB approximation, not the current wiki's exact
// 16.60027 factor. HP/defense and scaling whole prefix contributions are adapters.
function soulStatsAt(anchor, level, worldLevel = 0) {
  if (level === anchor.level && worldLevel === 0) return { ...anchor.stats };
  return Object.fromEntries(Object.entries(anchor.stats).map(([key, value]) => {
    const scale = RATES.has(key) || key === 'parry' ? 2000 : key === 'attack' ? 50/3 : key === 'hp' ? 12 : 20;
    // Apply IW to the unrounded level ratio, never yesterday's rounded cache.
    const effective = value * (1 + level / scale) / (1 + anchor.level / scale) * (1 + worldLevel * (key === 'attack' ? .02 : .01));
    return [key, RATES.has(key) ? rounded(clamp(effective, 0, .16))
      : key === 'parry' ? rounded(effective) : Math.round(effective)];
  }));
}
function sameStats(a, b) {
  return Object.keys(a).length === Object.keys(b).length
    && Object.keys(a).every(key => Object.hasOwn(b, key) && a[key] === b[key]);
}
// Positive level scaling is monotonic, including rounding and capped rates.
// Admit only anchors whose full future growth fits the existing save schema;
// otherwise a valid binding today could become unsavable on a later level-up.
function soulAnchorSupportsMaxLevel(anchor, worldLevel = 0) {
  const stats = soulStatsAt(anchor, 500, worldLevel);
  return soulStatsValid(stats) && scoreItem({ stats }) <= 1000000;
}
/** Structural integrity, not a cryptographic claim about user-editable saves. */
export function isSoulboundItem(item) {
  try {
    if (!classifyItemIdentity(item) || item.slot !== 'weapon' || !validHeroLevel(item.level)
      || item.locked !== true || !Object.hasOwn(item, 'soulbound')) return false;
    const anchor = item.soulbound, worldLevel = itemWorldLevel(item);
    if (worldLevel === null) return false;
    if (!knownDataRecord(anchor, SOULBOUND_KEYS) || Object.keys(anchor).length !== 3
      || anchor.version !== 1 || !validHeroLevel(anchor.level) || anchor.level > item.level
      || !soulStatsValid(anchor.stats) || !soulStatsValid(item.stats)
      || !soulAnchorSupportsMaxLevel(anchor, worldLevel)) return false;
    const expected = soulStatsAt(anchor, item.level, worldLevel);
    return sameStats(expected, item.stats) && item.power === scoreItem({ stats: expected });
  } catch { return false; }
}
/** Pure quote; already-bound, unknown, overlevel and unsupported items have no offer. */
export function soulbindCost(item, playerLevel) {
  try {
    if (!validHeroLevel(playerLevel) || !classifyItemIdentity(item) || hasUnknownSaleMetadata(item)
      || Object.hasOwn(item, 'soulbound') || item.slot !== 'weapon' || item.level > playerLevel
      || !soulStatsValid(item.stats) || item.power !== scoreItem(item)) return null;
    // Binding is permanent: all future levels, not only today's quote, must fit.
    if (!soulAnchorSupportsMaxLevel({ level:item.level, stats:item.stats })) return null;
    return SOULBIND_COSTS[item.quality] ?? null;
  } catch { return null; }
}
function soulboundCopy(item, anchor, level, worldLevel = itemWorldLevel(item)) {
  if (worldLevel === null || !soulAnchorSupportsMaxLevel(anchor, worldLevel)) return null;
  const stats = soulStatsAt(anchor, level, worldLevel);
  const power = scoreItem({ stats });
  if (!soulStatsValid(stats) || power > 1000000) return null;
  const soulbound = Object.freeze({ version:1, level:anchor.level, stats:Object.freeze({ ...anchor.stats }) });
  return { ...item, ...(Object.hasOwn(item, 'rolls') ? { rolls:{ ...item.rolls } } : {}),
    level, stats, power, locked:true, soulbound,
    ...(worldLevel === 1 ? { itemWorld:Object.freeze({ version:1, level:1 }) } : {}) };
}
export function createSoulboundItem(item, playerLevel) {
  if (soulbindCost(item, playerLevel) === null) return null;
  return soulboundCopy(item, { level:item.level, stats:item.stats }, playerLevel);
}
/** Validate old cache first, then derive from the original immutable anchor. */
export function scaleSoulboundItem(item, playerLevel) {
  if (!validHeroLevel(playerLevel) || !isSoulboundItem(item) || playerLevel < item.soulbound.level) return null;
  return soulboundCopy(item, item.soulbound, playerLevel);
}
/** Pure first-tier upgrade; identity, source anchor, rolls and absent stats survive.
 * Reject prospective level-500 overflow before a seed can be spent. */
export function createItemWorldUpgrade(item, heroLevel) {
  try {
    if (!validHeroLevel(heroLevel) || !isSoulboundItem(item) || !ITEM_WORLD_QUALITIES.includes(item.quality)
      || Object.hasOwn(item, 'itemWorld') || heroLevel < item.level) return null;
    return soulboundCopy(item, item.soulbound, heroLevel, 1);
  } catch { return null; }
}
/** Returns evidence, never sells. Caller must supply only currently equipped or
 * explicitly locked inventory keepers and must exclude equipped candidates.
 * Missing implemented stats mean zero; equality and every tradeoff are retained.
 */
export function dominanceWitness(candidate, keepers) {
  try {
    const identity = classifySafeLootItem(candidate);
    if (!identity || Object.hasOwn(candidate, 'soulbound') || candidate.locked !== false || !SAFE_LOOT_QUALITIES.has(candidate.quality) || !Array.isArray(keepers)) return null;
    // Reject self-comparison even if another supplied keeper could dominate it.
    if (keepers.some(keeper => keeper === candidate || (keeper && typeof keeper === 'object'
      && Object.getOwnPropertyDescriptor(keeper, 'id')?.value === candidate.id))) return null;
    for (const keeper of keepers) {
      const keptIdentity = classifySafeLootItem(keeper);
      if (!keptIdentity || keptIdentity.slot !== identity.slot || keptIdentity.base !== identity.base
        || keptIdentity.weaponFamily !== identity.weaponFamily) continue;
      const strictlyBetterKeys = [];
      let dominates = true;
      for (const key of STAT_KEYS) {
        const keptValue = Object.hasOwn(keeper.stats, key) ? keeper.stats[key] : 0;
        const candidateValue = Object.hasOwn(candidate.stats, key) ? candidate.stats[key] : 0;
        if (candidateValue > keptValue) { dominates = false; break; }
        if (candidateValue < keptValue) strictlyBetterKeys.push(key);
      }
      if (dominates && strictlyBetterKeys.length) return { keeperId: keeper.id, strictlyBetterKeys };
    }
    return null;
  } catch { return null; }
}
/** Existing individual-sale formula, not an eligibility or dominance score. */
export function itemSalePrice(item) {
  if (item && typeof item === 'object' && ('soulbound' in item || 'itemWorld' in item)) return 0;
  const level = item?.level, power = item?.power;
  if (typeof level !== 'number' || !Number.isFinite(level) || typeof power !== 'number' || !Number.isFinite(power)) return 0;
  const price = Math.max(1, Math.round(level * 3 + power));
  return Number.isFinite(price) ? price : 0;
}
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
      const available = [SLAUGHTER_SUFFIX];
      if (base.balance) available.push({ name: '平衡', code: 'balance', stats: {}, note: '平衡暴擊區間' });
      if (base.nimble) available.push({ name: '靈巧', code: 'nimble', stats: {}, note: '靈巧招架值區間' });
      suffix = pick(rng, available);
    } else {
      // This game's new armor/accessory affixes have explicitly restricted families.
      const available = actualSlot === 'armor' ? SUFFIXES.slice(1) : SUFFIXES;
      suffix = pick(rng, available);
    }
  }
  return buildItem({ level: lv, slot: actualSlot, base, tier, prefix, suffix,
    rollStat: () => tier.min + Math.floor(draw(rng) * (tier.max - tier.min + 1)),
    makeId: roll => `loot-${lv}-${roll}-${Math.floor(draw(rng) * 0x100000000).toString(36)}` });
}
// One arithmetic/schema path for random drops and deterministic commissions.
// The caller controls only stat rolls, ID construction, and initial lock state.
function buildItem({ level: lv, slot: actualSlot, base, tier, prefix, suffix, rollStat, makeId, locked = false }) {
  const itemStats = {}, rolls = {};
  for (const key of STAT_KEYS) {
    let endpoints = base[key];
    if (key === 'attack' && suffix?.code === 'slaughter') endpoints = base.slaughter;
    if (key === 'crit' && suffix?.code === 'balance') endpoints = base.balance;
    if (key === 'parry' && suffix?.code === 'nimble') endpoints = base.nimble;
    const affix = (prefix?.stats[key] || 0) + (suffix?.stats[key] || 0);
    if (!endpoints && !affix) continue;
    const r = rollStat(key);
    rolls[key] = r;
    const q = qualityFactor(r);
    const [lo, hi] = endpoints || [0,0];
    const value = lo + (hi - lo) * q + affix * (.75 + .5*q);
    // Original ADB/rate level scale; flat defense and bonus HP are explicit adaptations.
    const scale = RATES.has(key) || key === 'parry' ? 2000 : key === 'attack' ? 50/3 : key === 'hp' ? 12 : 20;
    // Parry is an original equipment rating, not an already converted probability.
    // Do not apply the older .16 probability cap or integer-stat rounding to it.
    itemStats[key] = key === 'parry' ? rounded(Math.max(0,value*(1+lv/scale))) : RATES.has(key) ? rounded(clamp(value*(1+lv/scale),0,.16)) : Math.max(1,Math.round(value*(1+lv/scale)));
  }
  const values = Object.values(rolls);
  const roll = Math.round(values.reduce((a,b)=>a+b,0)/Math.max(1,values.length));
  const id = makeId(roll);
  const item = {
    id, name: `${tier.label}・${prefix?.name || ''}${base.name}${suffix ? '・'+suffix.name : ''}`,
    slot: actualSlot, ...(actualSlot === 'weapon' ? { weaponFamily: base.family } : {}), quality: tier.name, rarityColor: tier.color,
    level: lv, roll, rolls, power: 0, stats: itemStats, locked,
    description: `${base.note}詞綴：${[prefix?.note,suffix?.note].filter(Boolean).join('／') || '無'}。`,
    prefix: prefix?.name || '', suffix: suffix?.name || '',
  };
  // Mechanism prose is derived at display time so saved descriptions cannot go stale.
  item.power = scoreItem(item);
  return item;
}
/** Detached fixed-spec ordinary weapon, or null for an unsupported request.
 * This independent commission consumes no RNG or state: Superior, each stat
 * R110, a supported suffix (default Slaughter), no prefix. The engine must replace the preview ID on purchase.
 * Hero levels are deliberately stricter than generateItem's import-safe clamp.
 */
export function createCommissionWeapon(family, level, suffix = 'slaughter') {
  if (!WEAPON_FAMILIES.includes(family) || !Number.isInteger(level) || level < 1 || level > 500
    || !COMMISSION_WEAPON_SUFFIXES[family].some(choice => choice.suffix === suffix)) return null;
  const affix = suffix === 'slaughter' ? SLAUGHTER_SUFFIX : suffix === 'balance'
    ? { name: '平衡', code: 'balance', stats: {}, note: '平衡暴擊區間' }
    : { name: '靈巧', code: 'nimble', stats: {}, note: '靈巧招架值區間' };
  return buildItem({ level, slot: 'weapon', base: BASES.weapon.find(base => base.family === family),
    tier: QUALITY_TIERS.find(tier => tier.name === 'Superior'), prefix: null, suffix: affix,
    rollStat: () => 110, makeId: () => `commission-${family}-${level}${suffix === 'slaughter' ? '' : '-' + suffix}`, locked: true });
}
/** Flat-stat comparison aid only; excludes proc utility. Never used by combat. */
export function scoreItem(item) {
  const s = item && typeof item === 'object' && item.stats && typeof item.stats === 'object' ? item.stats : {};
  return Math.round(clamp(finite(s.attack), 0, 1e7) * 2 + clamp(finite(s.defense), 0, 1e7) * 1.6
    + clamp(finite(s.hp), 0, 1e8) * 0.12 + clamp(finite(s.crit), 0, 1) * 260
    + clamp(finite(s.evade), 0, 1) * 200 + clamp(finite(s.block), 0, 1) * 180
    + clamp(finite(s.parry), 0, 1e6) * 1.8);
}
export function describeItem(item) {
  if (!item || typeof item !== 'object' || !item.stats || typeof item.stats !== 'object') return '無裝備資料';
  const labels = { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋', parry: '招架值' };
  return STAT_KEYS.filter(key => finite(item.stats[key]) > 0).map(key =>
    `${labels[key]} +${RATES.has(key) ? `${(finite(item.stats[key]) * 100).toFixed(1)}%` : key === 'parry' ? finite(item.stats[key]).toFixed(1) : Math.round(finite(item.stats[key]))}`
  ).join(' · ') || '無額外屬性';
}

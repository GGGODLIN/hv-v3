import { createGame, advance, act, stats, validateSave, STRATEGIES, MAJOR_ABILITIES, TARGET_PRIORITIES, targetPriorityView, INVENTORY_LIMIT, pendingLootView, previewSelectedSale, previewSafeSale, previewWeaponCommission, previewSoulbindWeapon, previewItemWorld, itemWorldView, expeditionReports, abilityView, growthReadiness, protectionView, emergencySupplyView, counterattackView, gearSetsView, previewGearSet, isGearSetProtected, finishThenCampView, clearFinishThenCamp } from './engine.js';
import { createPump, createOwnership, loadVersionedSave } from './session.js';
import { QUALITY_TIERS } from './loot.js';
import { resolveWeaponFamily, describeWeaponTrait, describeItemFlavor, COMMISSION_WEAPON_FAMILIES, COMMISSION_WEAPON_SUFFIXES } from './loot.js';
import { PENETRATED_ARMOR_RULES, penetratedArmorStatus, CLUB_STUN_RULES, stunStatus, AXE_BLEED_RULES, bleedStatus, previewStage, enemyDefenseView, enemyAttackView, playerMagicDefenseView } from './engine.js';

// Candidate builds never share progress or tab leases with the accepted game.
const candidatePath = location.pathname.match(/\/candidates\/([^/]+)/);
const storageScope = candidatePath ? `candidate-${candidatePath[1].replace(/[^a-zA-Z0-9._-]/g, '_')}` : 'stable';
const SAVE_KEY = `hv-v3-dot-${storageScope}-save-v3`;
const LEGACY_SAVE_KEYS = [`hv-v3-dot-${storageScope}-save-v2`, `hv-v3-dot-${storageScope}-save-v1`];
const PREF_KEY = `hv-v3-dot-${storageScope}-preferences-v3`;
const LOCK_NAME = `hv-v3-dot-${storageScope}-writer-v3`;
const $ = id => document.getElementById(id);
const format = value => Math.round(Number(value) || 0).toLocaleString('zh-TW');
const clock = value => `${Math.floor((value || 0) / 60).toString().padStart(2, '0')}:${Math.floor((value || 0) % 60).toString().padStart(2, '0')}`;
const qualityNames = Object.fromEntries(QUALITY_TIERS.map(tier => [tier.name, tier.label]));
const qualityName = quality => qualityNames[quality] || quality;
const slotNames = { weapon: '武器', armor: '護甲', accessory: '飾品' };
const weaponFamilyNames = { axe: '戰斧', rapier: '刺劍', club: '戰棍' };
function itemTypeName(item) { return weaponFamilyNames[resolveWeaponFamily(item)] || slotNames[item.slot] || '裝備'; }
function weaponRuleText(item) {
  const family = resolveWeaponFamily(item);
  if (family === 'axe') {
    const rules = AXE_BLEED_RULES;
    return `普通攻擊造成正傷害且目標存活時：非暴擊 ${format(rules.chance * 100)}% 觸發，暴擊必觸發；技能與魔法不觸發。最多 ${rules.maxStacks} 層，重觸發（含滿層）統一刷新為未來 ${rules.durationTicks} Tick，下一個 Tick 才開始，第 ${rules.durationTicks} 次結算後解除。每層每 Tick 依觸發時面板攻擊（ADB）的 ${format(rules.damageFractionPerStack * 100)}% 計算，合計後向下取整；不是本次直擊傷害的百分比。重新觸發會更新全部層數的攻擊快照，也可能變弱。流血為無類型傷害，不受一般／特定減傷及閃避、招架、格擋影響，不能暴擊；穿透護甲不增幅流血。採歷史模型；固定機率、層數上限、時長、快照與刷新時序為本作改編，不是原版當前數值。`;
  }
  if (family === 'rapier') {
    const rules = PENETRATED_ARMOR_RULES;
    return `普通攻擊造成傷害且目標存活時：非暴擊 ${format(rules.chance * 100)}% 觸發，暴擊必觸發。最多 ${rules.maxStacks} 層 · 持續 ${rules.durationTicks} Tick，重觸發刷新。每層降低原本物理總減傷率的 ${format(rules.mitigationReductionPerStack * 100)}%，不是直接增加同等傷害；從後續攻擊生效。固定機率與時長為本作選定參數。`;
  }
  if (family === 'club') {
    const rules = CLUB_STUN_RULES;
    return `目標未暈眩、未待恢復行動時，普通攻擊造成傷害且目標存活：非暴擊 ${format(rules.chance * 100)}% 觸發，符合條件的暴擊必觸發。持續 ${rules.durationTicks} Tick，不疊層、不刷新。到期後敵人恢復閃避與招架，並在下次我方行動前先行動；可能反擊致敗，不能視為永久控制。固定機率、時長與自動戰鬥時序為本作改編參數，不是原版當前數值。`;
  }
  return '';
}
function powerComparisonText(item, current) {
  if ((item.power || 0) <= (current?.power || 0)) return '';
  if (item.slot === 'weapon' && resolveWeaponFamily(item) !== resolveWeaponFamily(current)) return '異路線';
  return '分數＋';
}
function enemyRolePresentation(enemy) {
  const roles = { baseline: { id: 'baseline', label: '均衡', mark: '◆' }, armored: { id: 'armored', label: '厚甲', mark: '▣' }, agile: { id: 'agile', label: '靈巧', mark: '➶' } };
  return Object.hasOwn(roles, enemy?.roleId) ? roles[enemy.roleId] : roles.baseline;
}
function defenseRate(value) {
  const rate = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  return `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
}
function defenseLines(view, prefix) {
  return [`${prefix}一般物理減傷 ${defenseRate(view.mitigation)}`, `閃 ${defenseRate(view.evade)} / 招 ${defenseRate(view.parry)} / 擋 ${defenseRate(view.block)}`];
}
function renderRoutePreview() {
  const panel = $('route-preview');
  panel.hidden = state.mode !== 'town';
  if (panel.hidden || lastPreviewStage === state.stage) return;
  lastPreviewStage = state.stage;
  const route = previewStage(state.stage);
  $('route-preview-title').textContent = `第 ${route.stage} 層 · 四波路線`;
  $('route-preview-intro').textContent = route.stage >= 5 ? '赤砂守衛交替使用物理攻擊與魔法技能（本作節奏改編）。物理護甲、招架不防魔法；閃避、格擋仍有效，Protection 兩類皆減傷。玩家抵抗機率尚未實作（0%）。' : route.stage < 3 ? '前 2 層維持原有防線；第 3 層起加入厚甲與靈巧。' : '厚甲重減傷，靈巧重閃避與招架；配裝仍須看實際屬性。';
  $('route-preview-list').replaceChildren(...route.waves.map(wave => {
    const row = node('li', 'route-wave');
    row.append(node('span', 'route-wave-number', wave.boss ? `${wave.wave} · 首領` : `${wave.wave} · 波次`));
    const groups = new Map();
    for (const enemy of wave.enemies) {
      const key = JSON.stringify([enemy.roleId, enemy.defense, enemy.mitigation, enemy.evade, enemy.parry, enemy.block, enemy.attackPattern]);
      if (!groups.has(key)) groups.set(key, { enemy, names: [] });
      groups.get(key).names.push(enemy.name);
    }
    const lineup = node('div', 'route-lineup');
    for (const { enemy, names } of groups.values()) {
      const role = enemyRolePresentation(enemy);
      const group = node('div', 'route-enemy');
      const badge = node('span', `enemy-role role-${role.id}`, `${role.mark} ${role.label}${names.length > 1 ? ` ×${names.length}` : ''}`);
      const values = node('span', 'route-defense');
      const [mitigation, avoidance] = defenseLines(enemy, '基礎');
      values.append(node('span', '', mitigation), node('span', '', avoidance));
      if (enemy.attackPattern === 'alternating') values.append(node('span', 'enemy-effect', '赤砂守衛 · 物理 → 赤砂術式（魔法）→ 重複'));
      group.append(badge, values);
      group.title = `${names.join('、')}。基礎防禦 ${enemy.defense}；${mitigation}。閃＝閃避、招＝招架、擋＝格擋，各為單次判定機率，不是完全擋下攻擊的總機率。`;
      lineup.append(group);
    }
    row.append(lineup);
    return row;
  }));
}
const slotIcons = { weapon: 'unknown', armor: 'armor', accessory: 'accessory' };
const statNames = { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋', parry: '招架值' };
const rateStats = new Set(['crit', 'evade', 'block']);
const stageNames = ['霧松邊境', '青苔古道', '斷月遺跡', '幽燈深林', '灰燼城門', '沉星聖所'];
const stageName = stage => stageNames[(Math.max(1, Number(stage)) - 1) % stageNames.length];
let storeAvailable = true;
function readStorage(key) { try { return localStorage.getItem(key); } catch { storeAvailable = false; return null; } }
function writeStorage(key, value) { try { localStorage.setItem(key, value); return true; } catch { storeAvailable = false; return false; } }
function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = String(text); return el; }
function colorOf(item) { return /^#[0-9a-f]{3,8}$/i.test(item?.rarityColor || '') ? item.rarityColor : '#b8c3b0'; }
const loaded = loadVersionedSave({ read: readStorage, currentKey: SAVE_KEY, legacyKeys: LEGACY_SAVE_KEYS,
  validate: validateSave, create: () => createGame(1000 + Math.floor(Math.random() * 1e8)) });
let loadProblem = loaded.error ? '既有存檔無法讀取：資料可能損壞，或資料含本版不支援的欄位。已開啟暫時的新旅程，原始資料尚未覆寫；請保留原存檔並匯入有效備份。' : '';
let state = loaded.state;
let preventOverwrite = loaded.error || !storeAvailable;
let lastSavedRaw = loaded.raw;
let prefs = { sound: false, backgroundIdle: true, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
try { const saved = JSON.parse(readStorage(PREF_KEY) || '{}'); if (typeof saved.backgroundIdle === 'boolean') prefs.backgroundIdle = saved.backgroundIdle; if (typeof saved.reducedMotion === 'boolean') prefs.reducedMotion = saved.reducedMotion; } catch { /* optional preferences only */ }
let finishCampCancelled = false; // Session-only feedback, never serialized.
let selectedId = null;
let selectedSlot = null;
let selectedSaleIds = new Set();
const selectedSaleCheckboxes = new Map();
// Exact rendered nodes, not names or selector strings, identify comparison focus.
const comparisonButtons = { inventory: new Map(), pending: new Map(), equipment: new Map() };
function comparisonButtonVisible(button) {
  return button && !button.disabled && button.isConnected !== false && !button.closest?.('[hidden], [inert], dialog:not([open])');
}
function captureComparisonFocus() {
  const button = document.activeElement;
  if (!comparisonButtonVisible(button)) return null;
  for (const [location, buttons] of Object.entries(comparisonButtons)) {
    for (const [id, rendered] of buttons) if (rendered === button) return { location, id, button };
  }
  return null;
}
function restoreComparisonFocus(previous) {
  if (!previous || comparisonButtons[previous.location].get(previous.id) === previous.button || previous.button.isConnected === true) return;
  const active = document.activeElement;
  // A later renderer or explicit action may already have chosen a focus target.
  if (active && active !== previous.button && active !== document.body && active !== document.documentElement) return;
  const locations = [previous.location, ...Object.keys(comparisonButtons).filter(location => location !== previous.location)];
  const replacement = locations.map(location => comparisonButtons[location].get(previous.id)).find(comparisonButtonVisible);
  // A moved item follows its ID, not its old slot/name. A filtered/removed item
  // leaves focus on a visible stable control, but only after losing that node.
  const target = [replacement, $('slot-filter'), $('settings-toggle')].find(comparisonButtonVisible);
  target?.focus({ preventScroll: true });
}
// Preserve keyboard position in the exact item's basic actions after repaint.
const detailActionButtons = new Map();
function captureDetailActionFocus() {
  const button = document.activeElement;
  if (!comparisonButtonVisible(button)) return null;
  for (const [action, entry] of detailActionButtons) if (entry.button === button) return { action, ...entry };
  return null;
}
function restoreDetailActionFocus(previous) {
  if (!previous || previous.button.isConnected === true) return;
  const active = document.activeElement;
  if (active && active !== previous.button && active !== document.body && active !== document.documentElement) return;
  const entry = detailActionButtons.get(previous.action);
  const sameAction = entry?.id === previous.id ? entry.button : null;
  const sameItem = Object.values(comparisonButtons).map(buttons => buttons.get(previous.id));
  [sameAction, ...sameItem, $('slot-filter'), $('settings-toggle')].find(comparisonButtonVisible)?.focus({ preventScroll: true });
}
let selectedSaleConsent = null;
let safeSaleBatch = null;
let commissionConsent = null;
let soulbindConsent = null;
let itemWorldConsent = null;
let gearSetConsent = null;
let lastGearSetSignature = "";
let lastCommissionSignature = '';
let lastSafeLootSignature = '';
let lastInventorySignature = '';
let lastEquipmentSignature = '';
let lastLogSignature = '';
let lastEnemyStatusSignature = '';
let lastReportSignature = '';
let lastAbilitySignature = '';
let abilityRenderVersion = 0;
let pinnedExpeditionReport = null;
let lastStageCount = 0;
let lastPreviewStage = null;
let toastTimer;
let bannerTimer;
let procTimer;
let bleedTimer;
let counterTimer;
let procTargetId = null;
let recoveryTimer;
let recoveryTargetId = null;
let lastSaveAt = 0;
let lastProcessedEvent = null;
const seenEvents = new Set((state.events || []).map(event => String(event.id)));
let audioContext;
let flash = 0;
let attackPulse = 0;
let enemyPulse = 0;
let particles = [];
let tabOwner = false;
const tabId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
let pageActive = true;
let handoff = false;
let lastFrame = performance.now();

let lastRendered = 0;
let suspendSaveUntil = 0;

function showToast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3100); }
function notice(message) { $('notice').textContent = message; $('notice').hidden = !message; }
function save(force = false) {
  if (!ownership.supported || !tabOwner || preventOverwrite || performance.now() < suspendSaveUntil) return false;
  if (!force && performance.now() - lastSaveAt < 5000) return false;
  const raw = JSON.stringify(state);
  const saved = writeStorage(SAVE_KEY, raw);
  if (saved) lastSavedRaw = raw;
  lastSaveAt = performance.now();
  $('save-status').textContent = saved ? '進度已保存' : '僅此分頁 · 請匯出';
  $('save-detail').textContent = saved ? `自動存檔已更新 · ${new Date().toLocaleTimeString('zh-TW')}` : '此瀏覽器不允許儲存資料。請使用匯出存檔保留進度。';
  if (!saved) notice('無法寫入瀏覽器存檔。遊戲仍可進行，請用「存檔 → 匯出存檔」保存。');
  return saved;
}
function claimLease() { return pageActive && tabOwner && (!document.hidden || (ownership.supported && prefs.backgroundIdle)); }
function releaseLease() { ownership.release(); }
function ownershipStatus() {
  $('tab-status').textContent = !ownership.supported ? '相容模式：僅前景遊玩、不自動存檔，請匯出' :
    tabOwner ? (prefs.backgroundIdle ? '此分頁持有進度 · 可背景掛機' : '此分頁持有進度 · 僅前景運行') : '唯讀分頁 · 顯示最近保存進度';
  if (ownership.supported && !tabOwner) {
    $('save-status').textContent = '唯讀 · 不寫入存檔';
    $('save-detail').textContent = '目前顯示最近保存的營地進度；接手後才可戰鬥、換裝或匯入。';
  }
  if (!ownership.supported) $('save-detail').textContent = '此相容模式不自動存檔，請匯出目前進度。';
  $('takeover-button').hidden = tabOwner || !ownership.supported;
  $('takeover-button').disabled = !channel;
}
function refreshSavedState() {
  // A different owner may have repaired a rejected save. Recheck durable bytes
  // under the newly acquired lock; a follower's storage event is not authority.
  const raw = readStorage(SAVE_KEY);
  if (!storeAvailable) { preventOverwrite = true; notice('無法核對最新存檔，已停止覆寫；請先匯出進度。'); return; }
  if (raw === null) {
    // Only an initially empty slot (including validated migration) may be new.
    // Deletion cannot turn a protected/adopted journey into permission to save.
    if (preventOverwrite || lastSavedRaw !== null) {
      preventOverwrite = true; notice('最新存檔已不存在，已停止覆寫；請先匯出進度或匯入有效備份。');
    }
    return;
  }
  if (preventOverwrite || raw !== lastSavedRaw) {
    try {
      const recovering = preventOverwrite;
      state = validateSave(JSON.parse(raw)); resetEventObservation(); lastSavedRaw = raw; syncSelection();
      preventOverwrite = false;
      if (recovering) { loadProblem = ''; notice(''); }
    }
    catch { preventOverwrite = true; notice('其他分頁的存檔無法讀取；已阻止覆寫，請匯出或匯入有效存檔。'); }
  }
}
const ownership = createOwnership({
  locks: navigator.locks, name: LOCK_NAME,
  acquired: refreshSavedState,
  releasing: () => save(true),
  changed: owner => { tabOwner = owner; pump.reset(); syncSelection(); ownershipStatus(); renderSafeLoot(); }
});
let channel;
try { channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(LOCK_NAME) : null; } catch { channel = null; }
const pump = createPump({ now: () => performance.now(), active: () => claimLease(), step: seconds => advance(state, seconds) });
if (channel) channel.onmessage = event => {
  if (event.data?.type === 'takeover' && event.data.id !== tabId && tabOwner) {
    handoff = true; releaseLease();
  }
};
if (!ownership.supported) tabOwner = true; // ephemeral memory only; never writes SAVE_KEY
// A validated replacement restarts transient engine event IDs. Only a new
// journey object resets observation; ownership changes on the same object must
// retain deduplication or old rewards would play again.
function resetEventObservation() {
  seenEvents.clear();
  for (const event of state.events || []) seenEvents.add(String(event.id));
  lastProcessedEvent = null;
}
function syncSelection() {
  $('bleed-notice').hidden = true; // Imported/reloaded journeys never inherit recent damage feedback.
  resetInventoryFilters(); // A newly imported/adopted journey must not inherit a hidden subset.
  if ($('magic-notice')) $('magic-notice').hidden = true;
  clearFinishThenCamp(state); finishCampCancelled = false;
  closeGearSetDialog(); lastGearSetSignature = ''; $('gear-set-feedback').textContent = '';
  $('counter-notice').hidden = true; clearTimeout(counterTimer);
  pinnedExpeditionReport = null; lastReportSignature = ''; // Local comparisons never cross adopted journeys or ownership changes.
  lastAbilitySignature = ''; $('ability-feedback').textContent = '';
  clearSelectedSale(); // Local sale intent never crosses ownership, reload or import.
  closeWeaponCommission(); // Ownership transfer, reload and import never retain consent.
  closeSoulbindWeapon(); // Permanent investment always needs fresh local consent.
  closeItemWorld(); // A paid trial never inherits consent from another journey or owner.
  if (selectedId && ![...state.inventory, ...state.pendingLoot].some(item => item.id === selectedId)) selectedId = null;
  lastInventorySignature = ''; lastEquipmentSignature = ''; lastLogSignature = ''; lastEnemyStatusSignature = ''; lastStageCount = 0; lastPreviewStage = null;
}
// Match the engine's existing departure reserve; this is feedback, not a new rule.
function departureReadiness() {
  const missingSlots = Math.max(0, state.inventory.length - (INVENTORY_LIMIT - 5));
  const pendingCount = state.pendingLoot.length;
  return {
    ready: missingSlots === 0 && pendingCount === 0,
    reason: pendingCount > 0
      ? `尚有 ${pendingCount} 件待領戰利品；請先整理背包並領完，再保留 5 格空位出戰。`
      : missingSlots > 0
        ? `出戰需保留 5 格空位，目前還差 ${missingSlots} 格；請先整理背包。`
        : '',
  };
}
function dispatch(action, payload) {
  if (!claimLease(true)) { showToast('此分頁為唯讀；請在存檔設定接手，或關閉持有進度的分頁。'); return false; }
  try {
    const previousMode = state.mode;
    act(state, action, payload);
    // A successful lifecycle change cannot credit time from the previous mode.
    // Rejected/repeated starts and ordinary combat actions keep their interval.
    if ((action === 'start' || action === 'enterItemWorld' || action === 'retreat' || action === 'finishThenCamp') && state.mode !== previousMode) pump.reset();
    if (action === 'start' || action === 'enterItemWorld' || action === 'retreat') finishCampCancelled = false;
    reconcileWeaponCommission(); reconcileItemWorld(); render(true); if (action === 'start' || action === 'enterItemWorld' || action === 'retreat') $('bleed-notice').hidden = true; save(true); return true;
  } catch (error) { console.error('Action failed', error); showToast('此操作目前無法完成，進度仍保留。'); }
}
// Gear-only plans reference owned items; they never copy items or save abilities.
function gearSetIntentSignature() {
  return JSON.stringify([state.gearSets, state.equipment, state.inventory, state.pendingLoot, state.hero.level, state.hero.attributes, state.hero.proficiency, state.abilities, state.strategy, state.targetPriority, state.autoProtection, state.emergencySupply, state.mode, tabOwner]);
}
function closeGearSetDialog() {
  gearSetConsent = null;
  $('gear-set-confirm').disabled = true;
  if ($('gear-set-dialog').open) $('gear-set-dialog').close();
}
function reconcileGearSetConsent() {
  if (!gearSetConsent) return;
  if (!tabOwner || state.mode !== 'town' || gearSetConsent.signature !== gearSetIntentSignature()) {
    gearSetConsent = null; $('gear-set-confirm').disabled = true;
    $('gear-set-dialog-feedback').textContent = '資料或控制權已變更，確認已取消；請關閉後重新預覽。未套用、覆寫或清除配裝。';
  }
}
function gearSetItemLine(slot, item, prefix = '') {
  return `${prefix}${slotNames[slot]}：${item?.name || '遺失／無效裝備'}${item?.id ? `（ID：${item.id}）` : ''}`;
}
function gearSetStatText(value, rate = false) {
  return rate ? `${(Number(value || 0) * 100).toFixed(2)}%` : Number(value || 0).toFixed(2).replace(/\.?0+$/, '') || '0';
}
function gearSetComparison(preview) {
  const wrap = node('div', 'gear-set-comparison');
  wrap.append(node('p', 'muted', '目前 → 套用後；保留目前能力與戰術。這是面板差異，不是勝率或速度保證。'));
  for (const [key,label,rate] of [['attack','攻擊',false],['maxHp','生命上限',false],['maxMp','魔力上限',false],['mitigation','一般物理減傷',true],['crit','暴擊',true],['evade','閃避',true],['block','格擋',true],['parry','招架判定率',true]]) {
    const row=node('p', 'gear-set-stat'); row.append(node('span','',label), node('strong','',`${gearSetStatText(preview.currentStats?.[key],rate)} → ${gearSetStatText(preview.nextStats?.[key],rate)}`)); wrap.append(row);
  }
  const counter = view => view?.eligible ? `${gearSetStatText(view.chance,true)}／回合最多 ${view.maxPerTurn} 次` : '未啟用';
  wrap.append(node('p','gear-set-counter',`招架／格擋成功後的條件反擊：${counter(preview.currentCounter)} → ${counter(preview.nextCounter)}。不是每次受擊機率。`));
  return wrap;
}
// This is the current configuration retained by a gear-only switch, not saved
// preset data. The matching consent signature cancels if any displayed choice changes.
function gearSetRetainedContext() {
  const section = node('section', 'report-build gear-set-retained-context');
  const abilities = abilityView(state), protection = protectionView(state), supply = emergencySupplyView(state);
  const strategy = STRATEGIES.find(entry => entry.id === state.strategy)?.label || '未辨識';
  const current = {targetPriority: targetPriorityView(state).policy, autoProtection: protection.enabled};
  section.append(node('h3', '', '目前設定 · 套用後維持'),
    node('p', 'report-build-note', '以下是現在的設定，不是配裝方案儲存的內容。只換三件裝備；不學習、裝配或升階能力，也不切換任何戰鬥政策。'),
    node('p', 'report-build-policy', `目前戰術：${strategy}`),
    node('p', 'report-build-policy', buildPolicyText(current, '目前政策')),
    node('p', 'report-build-note', protection.unlocked
      ? `Protection 政策不代表護盾已生效；出戰後仍依原施法條件判斷，每次 ${format(protection.manaCost)} MP 並取代一次攻擊。`
      : `Protection 尚未解鎖（Lv.${protection.unlockLevel}）；政策不代表護盾已生效，目前不能施放。`),
    node('p', 'report-build-policy', `目前設定：${buildEmergencySupplyText(supply.enabled)}`));
  if (supply.strategy === 'sustain') section.append(node('p', 'report-build-note', '目前為持久：額外緊急補給開關不生效；原本治癒後 HP 低於 30% 自動喝藥的規則仍獨立運作，可以用最後 1 瓶。'));
  section.append(node('p', 'report-build-policy', '目前已裝配能力 · 套用後仍生效'),
    buildAbilityList(abilities.valid ? abilities.catalog.filter(choice => choice.slotted).map(choice => ({id: choice.id, rank: choice.currentRank})) : null),
    node('p', 'report-build-note', '只列已裝配階級；學會但未裝配的能力不生效。面板預覽已包含這些能力，不是另一份能力方案，也不保證勝率或速度。'));
  return section;
}
function requestGearSet(id, kind) {
  if ($('gear-set-dialog').open || !claimLease() || state.mode !== 'town') return;
  const view = gearSetsView(state), row = view.sets.find(entry => entry.id === id);
  if (!view.valid || !row) return;
  if (kind === 'save' && !row.saved) { performGearSetChange({id,kind,signature:gearSetIntentSignature()}); return; }
  if (kind === 'clear' && !row.saved) return;
  if (!['save','clear','apply'].includes(kind)) return;
  const preview = kind === 'apply' ? previewGearSet(state,id) : null;
  if (kind === 'apply' && (!preview.available || preview.active)) { $('gear-set-feedback').textContent = preview.reason || '目前已穿著此配裝，不必重複套用。'; return; }
  gearSetConsent = {id,kind,signature:gearSetIntentSignature(),quoteBasis:preview?.quoteBasis};
  $('gear-set-title').textContent = `${kind === 'apply' ? '預覽套用' : kind === 'save' ? '確認覆寫' : '確認清除'}${row.label}`;
  $('gear-set-summary').textContent = kind === 'apply' ? '一次換上以下三件原有裝備；不花金幣、不複製物品、不改能力與戰術。回營資源會按新配裝恢復。' : kind === 'save' ? '以目前穿著的三件裝備覆寫這份配裝，並將這三件鎖定。原方案的裝備不會刪除或自動解鎖。' : '只清除此配裝記錄，不會卸下、出售、刪除或自動解鎖任何裝備。其他方案仍可能保護同一件裝備。';
  const rows = [];
  if (preview) {
    for (const entry of preview.items) { const line=node('li','gear-set-item'); line.append(node('p','',gearSetItemLine(entry.slot,entry.current,'目前 ')),node('strong','',gearSetItemLine(entry.slot,entry.item,'套用 ')),node('span','muted',entry.changed?'會換裝':'維持原裝備')); rows.push(line); }
  } else {
    for (const slot of ['weapon','armor','accessory']) {
      const oldId=row.ids?.[slot], old=[...Object.values(state.equipment),...state.inventory].find(item=>item.id===oldId);
      const line=node('li','gear-set-item'); line.append(node('p','',gearSetItemLine(slot,old,'已儲存 ')));
      if(kind==='save') line.append(node('strong','',gearSetItemLine(slot,state.equipment[slot],'改存 ')));
      rows.push(line);
    }
  }
  $('gear-set-items').replaceChildren(...rows);
  $('gear-set-stats').replaceChildren(...(preview ? [gearSetRetainedContext(), gearSetComparison(preview)] : []));
  $('gear-set-dialog-feedback').textContent = '取消不會改變裝備或記錄；確認只處理這份預覽。';
  $('gear-set-confirm').textContent = kind === 'apply' ? '確認套用配裝' : kind === 'save' ? '確認鎖定並覆寫' : '確認清除記錄';
  $('gear-set-confirm').disabled = false; $('gear-set-dialog').showModal();
}
function performGearSetChange(consent) {
  if (!claimLease(true) || state.mode !== 'town' || consent.signature !== gearSetIntentSignature()) return false;
  const before = gearSetsView(state).sets.find(row=>row.id===consent.id);
  const expected = consent.kind === 'save' ? Object.fromEntries(Object.entries(state.equipment).map(([slot,item])=>[slot,item.id])) : before?.ids;
  const action = {save:'saveGearSet',clear:'clearGearSet',apply:'applyGearSet'}[consent.kind];
  const completed=dispatch(action,consent.kind==='apply'?{id:consent.id,quoteBasis:consent.quoteBasis}:consent.id);
  const after=gearSetsView(state).sets.find(row=>row.id===consent.id);
  const sameIds=(a,b)=>['weapon','armor','accessory'].every(slot=>a?.[slot]===b?.[slot]);
  const succeeded=completed && (consent.kind==='clear' ? !after?.saved : consent.kind==='save' ? after?.saved && sameIds(after.ids,expected) && Object.values(state.equipment).every(item=>item.locked) : after?.active && sameIds(Object.fromEntries(Object.entries(state.equipment).map(([slot,item])=>[slot,item.id])),expected));
  if (!succeeded) return false;
  $('gear-set-feedback').textContent=consent.kind==='save'?`${after.label} 已儲存；三件裝備已鎖定。舊方案裝備不會自動解鎖。`:consent.kind==='clear'?`${before.label} 記錄已清除；裝備與鎖定狀態保留。`:`已套用${after.label}；能力與戰術未變更。`;
  return true;
}
function confirmGearSet() {
  reconcileGearSetConsent(); if (!gearSetConsent) return;
  const consent=gearSetConsent; gearSetConsent=null; $('gear-set-confirm').disabled=true;
  if (performGearSetChange(consent)) { closeGearSetDialog(); focusGearSetButton(consent.id,consent.kind); }
  else $('gear-set-dialog-feedback').textContent='未確認完成，裝備或記錄可能已變更；請關閉後重新預覽。';
}
function focusGearSetButton(id, kind) {
  const card = Array.from($('gear-set-choices').children).find(entry=>entry.dataset.gearSetId===id);
  const actions = card && Array.from(card.children).find(entry=>entry.className==='gear-set-actions');
  if (!actions) return;
  const buttons = Array.from(actions.children);
  const button = buttons.find(entry=>entry.dataset.gearSetAction===kind&&!entry.disabled) || buttons.find(entry=>!entry.disabled);
  button?.focus();
}
function renderGearSets() {
  reconcileGearSetConsent();
  const signature=gearSetIntentSignature();
  if(signature===lastGearSetSignature)return;
  lastGearSetSignature=signature;
  const focused = document.activeElement;
  const focusTarget = focused?.dataset?.gearSetId ? {id:focused.dataset.gearSetId,kind:focused.dataset.gearSetAction} : null;
  const view=gearSetsView(state), ready=tabOwner&&state.mode==='town'&&view.valid;
  $('gear-set-status').textContent=!view.valid?'配裝資料無效，請保留存檔並重新載入有效備份。':!tabOwner?'唯讀分頁；接手後才能儲存或換裝。':state.mode!=='town'?'請先回營；戰鬥中不能儲存、清除或套用配裝。':'三份配裝只記錄裝備，不包含能力、戰術或角色屬性。';
  $('gear-set-choices').replaceChildren(...view.sets.map(row=>{
    const card=node('article','gear-set-card'); card.dataset.gearSetId=row.id;
    card.append(node('h4','',`${row.label}${row.active?' · 目前穿著':''}`));
    if(row.saved) {
      const items=[...Object.values(state.equipment),...state.inventory];
      for(const slot of ['weapon','armor','accessory'])card.append(node('p','gear-set-saved-item',gearSetItemLine(slot,items.find(item=>item.id===row.ids?.[slot]))));
      if(!row.available&&!row.active)card.append(node('p','gear-set-warning',row.reason));
    } else card.append(node('p','muted','尚未儲存；先穿好想保留的三件裝備。'));
    const actions=node('div','gear-set-actions');
    for(const [kind,label,enabled] of [['save',row.saved?'以目前裝備覆寫':'鎖定並儲存目前配裝',row.canSave],['apply','預覽套用',row.saved&&row.available&&!row.active],['clear','清除記錄',row.canClear]]) {
      const button=node('button',kind==='apply'?'primary-button':'secondary-button',label);button.dataset.gearSetAction=kind;button.dataset.gearSetId=row.id;button.setAttribute('aria-label',`${row.label}：${label}`);button.disabled=!ready||!enabled;button.setAttribute('aria-haspopup',kind==='save'&&!row.saved?'false':'dialog');button.addEventListener('click',()=>requestGearSet(row.id,kind));actions.append(button);
    }
    card.append(actions);return card;
  }));
  if (focusTarget) focusGearSetButton(focusTarget.id,focusTarget.kind);
}

// These transient view criteria never enter a save or choose an equipment action.
function inventoryFilters() {
  const choice = (id, allowed) => allowed.includes($(id)?.value) ? $(id).value : 'all';
  return {
    slot: choice('slot-filter', ['all', 'weapon', 'armor', 'accessory']),
    family: choice('family-filter', ['all', 'axe', 'rapier', 'club', 'unknown']),
    investment: choice('investment-filter', ['all', 'unbound', 'bound', 'iw1']),
    quality: choice('quality-filter', ['all', ...QUALITY_TIERS.map(tier => tier.name)]),
    protection: choice('protection-filter', ['all', 'protected', 'unprotected']),
    name: ($('name-filter')?.value || '').trim().toLowerCase()
  };
}
function inventoryMatchesFilters(item, filters) {
  const protectedItem = (filters.protection === 'protected' || filters.protection === 'unprotected') && (!!item.locked || Object.hasOwn(item, 'soulbound') || isGearSetProtected(state, item.id));
  if (filters.protection === 'protected' && !protectedItem) return false;
  if (filters.protection === 'unprotected' && protectedItem) return false;
  if (filters.name && !String(item.name || '').toLowerCase().includes(filters.name)) return false;
  if (filters.quality && filters.quality !== 'all' && item.quality !== filters.quality) return false;
  if (filters.slot !== 'all' && item.slot !== filters.slot) return false;
  if (filters.family !== 'all') {
    if (item.slot !== 'weapon') return false;
    const family = resolveWeaponFamily(item);
    if (filters.family === 'unknown' ? !!family : family !== filters.family) return false;
  }
  const bound = Object.hasOwn(item, 'soulbound'), iw1 = bound && item.itemWorld?.level === 1;
  if (filters.investment === 'unbound' && bound) return false;
  if (filters.investment === 'bound' && (!bound || iw1)) return false;
  if (filters.investment === 'iw1' && !iw1) return false;
  return true;
}
function inventoryFilterLabels(filters) {
  return [({ protected: '受保護裝備', unprotected: '未受保護裝備' })[filters.protection] || '', filters.name ? `名稱含「${filters.name}」` : '', filters.quality && filters.quality !== 'all' ? `${qualityName(filters.quality)}品質` : '', filters.slot !== 'all' ? slotNames[filters.slot] : '',
    filters.family !== 'all' ? weaponFamilyNames[filters.family] || '未辨識武器' : '',
    ({ unbound: '未綁定裝備', bound: '已綁定・未升 IW', iw1: 'IW1 已完成' })[filters.investment] || ''].filter(Boolean);
}
function hiddenSelectedSaleCount(filters = inventoryFilters()) {
  return state.inventory.filter(item => selectedSaleIds.has(item.id) && !inventoryMatchesFilters(item, filters)).length;
}
function resetInventoryFilters() {
  if ($('name-filter')) $('name-filter').value = '';
  for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter', 'protection-filter']) $(id).value = 'all';
  // Both inspected items and exact personal sale selections survive a view reset.
}
function resetInventoryFilterView() {
  resetInventoryFilters(); render(true); $('slot-filter').focus();
}

// Explicit personal selection is separate from the conservative downgrade filter.
function closeSelectedSale() {
  selectedSaleConsent = null;
  $('selected-sale-confirm').disabled = true;
  if ($('selected-sale-dialog').open) $('selected-sale-dialog').close();
}
function clearSelectedSale() {
  closeSelectedSale(); selectedSaleIds.clear(); lastInventorySignature = '';
}
function abortSelectedSale(message) {
  selectedSaleConsent = null; $('selected-sale-confirm').disabled = true;
  $('selected-sale-feedback').textContent = `已取消，未出售任何裝備。${message}`;
}
function toggleSelectedSale(id, checked) {
  const restoreFocus = document.activeElement === selectedSaleCheckboxes.get(id);
  if (!claimLease() || state.mode !== 'town' || $('selected-sale-dialog').open) { render(true); return; }
  if (checked) {
    const preview = previewSelectedSale(state, [id]);
    if (!preview.available) { showToast(`無法加入出售清單：${preview.reason}`); render(true); return; }
    selectedSaleIds.add(id);
  } else selectedSaleIds.delete(id);
  render(true);
  if (restoreFocus) selectedSaleCheckboxes.get(id)?.focus();
}
function selectedSaleComparison(entry) {
  const table = node('div', 'compare-table');
  for (const key of Object.keys(statNames)) {
    const value = Number(entry.item.stats?.[key]) || 0, old = Number(entry.currentEquipment?.stats?.[key]) || 0;
    const diff = value - old;
    const number = amount => rateStats.has(key) ? `${Number((amount * 100).toFixed(4))}%` : String(Number(amount.toFixed(4)));
    const delta = diff === 0 ? '相同' : `${diff > 0 ? '+' : ''}${number(diff)}${rateStats.has(key) ? ' 點' : ''}`;
    const row = node('div', 'compare-row');
    row.append(node('span', '', statNames[key]), node('strong', '', number(value)), node('span', `delta ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`, delta));
    table.append(row);
  }
  return table;
}
function openSelectedSale() {
  if (!claimLease() || state.mode !== 'town') { showToast('請在持有進度的分頁回營後，確認自選出售。'); return; }
  if ($('selected-sale-dialog').open) return;
  const ids = [...selectedSaleIds];
  const preview = previewSelectedSale(state, ids);
  const filters = inventoryFilters(), hidden = hiddenSelectedSaleCount(filters);
  if (!preview.available) { showToast(`無法預覽：${preview.reason}`); render(true); return; }
  selectedSaleConsent = { ids, ...preview };
  $('selected-sale-list').replaceChildren(...preview.items.map(entry => {
    const row = node('li', 'safe-sale-item');
    if (!inventoryMatchesFilters(entry.item, filters)) row.append(node('p', 'selected-sale-warning', '背包篩選外・仍在本次完整出售清單'));
    row.append(node('strong', '', entry.name), node('span', 'safe-sale-meta', `${qualityName(entry.quality)} · ${slotNames[entry.slot]} · ${format(entry.value)} 金幣`), node('span', 'safe-sale-id', `出售 ID：${entry.id}`));
    row.append(node('p', '', `保留目前裝備：${entry.currentEquipment?.name || '無'}。以下差值＝本件減目前同部位裝備；正值代表將出售的這項屬性較高。`), selectedSaleComparison(entry));
    if (entry.slot === 'weapon') row.append(node('p', 'selected-sale-warning', `出售路線：${itemTypeName(entry.item)} · ${describeWeaponTrait(entry.item)}。目前路線：${entry.currentEquipment ? itemTypeName(entry.currentEquipment) : '無'}。武器特效不同，不能只看評分或單項差值。`));
    return row;
  }));
  $('selected-sale-summary').textContent = `自行選定 ${preview.items.length} 件 · 合計 ${format(preview.total)} 金幣 · 出售後 ${format(preview.goldAfter)} 金幣${hidden ? `（含背包篩選外 ${hidden} 件，已全部列出）` : ''}`;
  $('selected-sale-feedback').textContent = '尚未出售。這是你自行挑選的裝備，不保證是劣化品，也可能包含稀有或更強裝備。確認後無法買回；只出售上述 ID，不加入其他物品。';
  $('selected-sale-confirm').textContent = `確認出售自選 ${preview.items.length} 件 · +${format(preview.total)} 金幣`;
  $('selected-sale-confirm').disabled = false;
  $('selected-sale-dialog').showModal();
}
function reconcileSelectedSale() {
  if (!tabOwner || state.mode !== 'town') {
    if (selectedSaleConsent) abortSelectedSale('進度控制權或營地狀態已改變，請重新選取。');
    if (selectedSaleIds.size) { selectedSaleIds.clear(); lastInventorySignature = ''; }
    return;
  }
  const preview = previewSelectedSale(state, [...selectedSaleIds]);
  if (selectedSaleConsent && (!preview.available || preview.quoteBasis !== selectedSaleConsent.quoteBasis)) abortSelectedSale('裝備、比較對象或金幣已變更，請關閉後重新預覽。');
  if (selectedSaleIds.size && !preview.available) {
    selectedSaleIds.clear(); lastInventorySignature = '';
    showToast('自選清單已失效，已清除選取；沒有出售任何裝備。');
  }
}
function confirmSelectedSale() {
  if (!selectedSaleConsent || !$('selected-sale-dialog').open) return;
  if (!claimLease()) { abortSelectedSale('此分頁為唯讀，請接手後重新選取。'); return; }
  reconcileSelectedSale();
  const consent = selectedSaleConsent;
  if (!consent) return;
  const gold = state.hero.gold;
  // Consume once before dispatch, including a rejected engine operation.
  selectedSaleConsent = null; $('selected-sale-confirm').disabled = true;
  selectedSaleIds.clear();
  const completed = dispatch('sellSelected', { ids: consent.ids, quoteBasis: consent.quoteBasis });
  const sold = completed && consent.ids.every(id => !state.inventory.some(item => item.id === id)) && state.hero.gold === gold + consent.total;
  if (!sold) { abortSelectedSale('本次操作未確認完成，請核對背包與金幣後重新選取。'); return; }
  closeSelectedSale(); render(true);
  showToast(`已出售自行選定的 ${consent.items.length} 件 · +${format(consent.total)} 金幣；其餘裝備保留。`);
}
function renderSelectedSale() {
  const preview = previewSelectedSale(state, [...selectedSaleIds]);
  const hidden = hiddenSelectedSaleCount();
  $('selected-sale-status').textContent = !tabOwner ? '唯讀分頁：接手後才能選取出售。' : state.mode !== 'town' ? '請先回營；出戰會清除自選清單。' : `已選 ${selectedSaleIds.size} 件 · ${format(preview.total)} 金幣${hidden ? `（另有 ${hidden} 件在目前篩選外，預覽會完整列出）` : ''}。未確認不會出售。`;
  $('review-selected-sale').disabled = !tabOwner || state.mode !== 'town' || !preview.available;
  $('clear-selected-sale').disabled = !selectedSaleIds.size;
}
function abilityNumber(value) {
  // Unlike the compact hero readout, ability previews never round sheet stats
  // to whole numbers or turn a small/zero proficiency bonus into a fake +2.
  return Number.isFinite(value) ? String(value) : '—';
}
function changeAbility(action, id, expectedRank, expectedRenderVersion) {
  const capabilities = { learnAbility: 'canLearn', upgradeAbility: 'canUpgrade', slotAbility: 'canSlot', unslotAbility: 'canUnslot', refundAbility: 'canRefund' };
  if (!Object.hasOwn(capabilities, action)) return;
  if (!claimLease()) { $('ability-feedback').textContent = '此分頁為唯讀；接手進度後才能調整能力。'; renderAbilities(); return; }
  if (state.mode !== 'town') { $('ability-feedback').textContent = '請先回營，再學習、升階、裝配或遺忘能力。'; renderAbilities(); return; }
  // Recheck the live engine view, not the potentially stale card closure.
  // One rendered upgrade authorizes one rank only, even if a repeated click
  // could afford another rank after the card has been replaced. The render
  // generation also rejects detached controls after refund/relearn or adoption.
  const before = abilityView(state), choice = before.catalog.find(entry => entry.id === id);
  if (!choice?.[capabilities[action]] || (expectedRank !== undefined && choice.currentRank !== expectedRank) ||
    (expectedRenderVersion !== undefined && expectedRenderVersion !== abilityRenderVersion)) {
    $('ability-feedback').textContent = '目前條件不符或已完成此操作，沒有變更能力。請查看最新階級與費用。'; renderAbilities(); return;
  }
  const dispatched = dispatch(action, id);
  const after = abilityView(state), current = after.catalog.find(entry => entry.id === id);
  const completed = dispatched && current && (
    action === 'learnAbility' ? current.currentRank === 1 && current.learned && !current.slotted && after.availableAp === before.availableAp - choice.apCost :
    action === 'upgradeAbility' ? current.currentRank === choice.currentRank + 1 && current.learned && current.slotted === choice.slotted && current.spentAp === choice.spentAp + choice.nextRank.apCost && after.availableAp === before.availableAp - choice.nextRank.apCost :
    action === 'slotAbility' ? current.currentRank === choice.currentRank && current.learned && current.slotted && after.availableAp === before.availableAp :
    action === 'unslotAbility' ? current.currentRank === choice.currentRank && current.learned && !current.slotted && after.availableAp === before.availableAp :
    current.currentRank === 0 && !current.learned && !current.slotted && after.availableAp === before.availableAp + choice.spentAp);
  if (!completed) { $('ability-feedback').textContent = '本次操作未確認完成，請核對能力狀態後再試。'; renderAbilities(); return; }
  const messages = {
    learnAbility: `已學習 ${choice.label} Rank 1，花費 ${choice.apCost} AP；尚未裝配，請另按「裝入能力槽」才生效。`,
    upgradeAbility: `已升階 ${choice.label} 至 Rank ${current.currentRank}，額外花費 ${choice.nextRank?.apCost} AP，累計已用 ${current.spentAp} AP；${current.slotted ? '保持裝配，新階級現在生效。' : '保持未裝配，尚未生效；請另按「裝入能力槽」。'}`,
    slotAbility: `已裝配 ${choice.label} Rank ${current.currentRank}，現在生效；未再花費 AP。`,
    unslotAbility: `已卸下 ${choice.label}，加成停止；仍已學習，AP 不退還。`,
    refundAbility: `已免費遺忘 ${choice.label} 的全部階級，同時卸下並退還 ${choice.spentAp} AP；可從 Rank 1 重新學習。`
  };
  $('ability-feedback').textContent = `${messages[action]} 營地生命與魔力已恢復。`;
}
function renderGrowthReadiness() {
  const view = growthReadiness(state, claimLease());
  const labels = {slot: '待裝配', learn: '可學習', upgrade: '可升階'};
  const parts = Object.entries(view.counts).filter(([, count]) => count).map(([action, count]) => `${labels[action]} ${count}`);
  const available = parts.join(' · ');
  const optional = view.protectionAvailable ? '護盾可選' : '';
  const blocked = {invalid: '能力資料需檢查', readonly: '唯讀檢視', away: '回營配置'}[view.status];
  $('growth-tab-summary').textContent = blocked || available || optional || '暫無能力可配置';
  if (available && optional) $('growth-tab-summary').textContent += ' · 護盾可選';
  let detail = available ? `${available}。學習與裝配是分開的兩步。` : view.missingAp ? `目前沒有可配置能力；最近一項仍差 ${view.missingAp} AP。` : view.nextLevel ? `目前沒有可配置能力；下一個能力等級門檻 Lv.${view.nextLevel}。` : '目前沒有可配置能力；已裝配能力會繼續生效。';
  if (view.choices.reduce((sum, choice) => sum + choice.cost, 0) > view.availableAp) detail += ' 各項分別可負擔，不代表能同時全選。';
  if (blocked) detail = view.status === 'away' ? '回營後再學習、裝配或升階；戰鬥不會因查看這裡而暫停。' : view.status === 'readonly' ? '接手進度並回營後才能配置；目前不會修改進度。' : '請先核對能力資料；目前不提供配置操作。';
  if (!blocked) detail += view.protectionAvailable ? ' Protection 已解鎖，可自行選擇減傷與施法回合的取捨；不是必選強化。' : !view.protectionUnlocked ? ` Protection 於 Lv.${view.protectionUnlockLevel} 解鎖，不需 AP。` : ' Protection 已啟用。';
  $('growth-summary').textContent = `可用 AP ${view.availableAp} · ${detail}`;
  const first = view.choices[0], button = $('growth-jump');
  button.hidden = !first && !view.protectionAvailable;
  button.disabled = !!blocked;
  button.textContent = first ? `查看 ${first.label} · ${labels[first.action]}` : '查看 Protection 選項';
}
function focusGrowthChoice() {
  // Recompute on activation: a stale shortcut never spends AP or triggers actions.
  const view = growthReadiness(state, claimLease()), first = view.choices[0];
  if (view.status !== 'ready') { renderGrowthReadiness(); return; }
  const target = first ? document.querySelector(`[data-ability-id="${first.id}"][data-ability-action="${first.action}"]`) : view.protectionAvailable ? $('auto-protection') : null;
  if (target && !target.disabled) target.focus();
}
function renderAbilities() {
  const view = abilityView(state), canEdit = claimLease() && state.mode === 'town';
  const signature = JSON.stringify([view, canEdit]);
  $('ability-ap').textContent = `可用 AP ${view.availableAp} / 累計 ${view.earnedAp}`;
  $('ability-slots').textContent = `Major 槽 ${view.majorUsed} / ${view.majorCapacity} · 全部免費`;
  $('ability-status').textContent = !claimLease() ? '唯讀檢視：接手進度後才能調整。' : state.mode !== 'town' ? '目前不能調整能力：請先回營。預覽不改變戰鬥。' : '只在營地調整 · 不花金幣、不抽取隨機結果 · 每次有效調整後回滿 HP／MP';
  if (signature === lastAbilitySignature) return;
  lastAbilitySignature = signature;
  const renderVersion = ++abilityRenderVersion;
  const focused = document.activeElement?.dataset;
  const buttons = [];
  $('ability-choices').replaceChildren(...view.catalog.map(choice => {
    const card = node('article', `ability-card${choice.slotted ? ' is-slotted' : ''}`);
    card.dataset.abilityId = choice.id;
    const heading = node('div', 'ability-card-heading');
    heading.append(node('h4', '', `${choice.label} · Rank ${choice.currentRank} / ${choice.maxRank}`), node('span', 'ability-state', choice.slotted ? '已裝配 · 生效中' : choice.learned ? '已學習 · 未生效' : '尚未學習'));
    card.append(heading, node('p', 'ability-description', `${choice.learned ? '本階效果' : 'Rank 1 效果'}：${choice.description}`));
    const current = view.currentStats, preview = choice.previewStats;
    const key = choice.id === 'hp-tank' ? 'maxHp' : choice.id === 'mp-tank' ? 'maxMp' : 'attack';
    const label = { maxHp: '生命上限', maxMp: '魔力上限', attack: '面板攻擊 ADB' }[key];
    card.append(node('p', 'ability-preview', `${choice.learned ? '本階' : 'Rank 1'}預覽（假設已學習並裝配）：${label}：目前 ${abilityNumber(current[key])} → 裝配後 ${abilityNumber(preview[key])}${choice.slotted ? '（已包含此能力）' : '；未裝配時不生效'}`));
    if (choice.id === 'one-handed-damage') {
      card.append(node('p', 'ability-proficiency', `有效單手熟練度 ${abilityNumber(view.effects.effectiveProficiency)} · 此能力 ADB 加成：目前 +${abilityNumber(view.effects.attackBonus)} → 裝配後 +${abilityNumber(choice.previewEffects.attackBonus)}`));
    }
    const next = choice.nextRank;
    if (choice.learned) {
      if (next) {
        const gate = state.hero.level < next.minLevel ? `尚需 Lv.${next.minLevel}（目前 Lv.${state.hero.level}）` : `Lv.${next.minLevel} 門檻已達成`;
        card.append(node('p', 'ability-next', `下一階 Rank ${next.rank} · ${gate} · 額外 ${next.apCost} AP${view.availableAp < next.apCost ? ' · 可用 AP 不足' : ''}`));
        card.append(node('p', 'ability-description', `下一階效果：${next.description}`));
        const extra = choice.id === 'one-handed-damage' ? `；此能力 ADB 加成 +${abilityNumber(choice.upgradePreviewEffects.attackBonus)}` : '';
        card.append(node('p', 'ability-next-preview', `下一階預覽（假設升階並裝配，未直接套用）：${label} 目前 ${abilityNumber(current[key])} → ${abilityNumber(choice.upgradePreviewStats[key])}${extra}。${choice.slotted ? '升階會保留裝配。' : '只升階仍不生效，須另行裝配。'}`));
      } else {
        card.append(node('p', 'ability-next', `已達最高 Rank ${choice.maxRank} · 沒有下一階`));
      }
      card.append(node('p', 'ability-cost', `累計已用 ${choice.spentAp} AP · 免費遺忘退還 ${choice.spentAp} AP（全部階級）`));
    } else {
      card.append(node('p', 'ability-cost', `學習費用 ${choice.apCost} AP${view.availableAp < choice.apCost ? ' · 可用 AP 不足，可保留點數升級後再學' : ''} · Rank 1 等級門檻 Lv.${choice.minLevel} · 尚未花費 AP`));
    }
    const actions = node('div', 'ability-actions');
    const addAction = (action, text, capability, kind) => {
      const button = node('button', kind === 'slot' ? 'primary-button' : 'secondary-button', text);
      button.disabled = !canEdit || !choice[capability];
      button.dataset.abilityId = choice.id; button.dataset.abilityAction = kind;
      button.setAttribute('aria-label', `${choice.label}：${text}`);
      button.addEventListener('click', () => changeAbility(action, choice.id, choice.currentRank, renderVersion));
      actions.append(button); buttons.push(button);
    };
    if (choice.learned) addAction('upgradeAbility', next ? `升至 Rank ${next.rank} · 額外 ${next.apCost} AP` : `已達最高 Rank ${choice.maxRank}`, 'canUpgrade', 'upgrade');
    else addAction('learnAbility', `學習 · ${choice.apCost} AP`, 'canLearn', 'learn');
    addAction(choice.slotted ? 'unslotAbility' : 'slotAbility', choice.slotted ? '卸下能力' : '裝入能力槽', choice.slotted ? 'canUnslot' : 'canSlot', 'slot');
    addAction('refundAbility', `免費遺忘 · 退 ${choice.spentAp} AP`, 'canRefund', 'refund');
    card.append(actions);
    return card;
  }));
  // A keyboard action should not discard focus when the changed cards repaint.
  // Learning still leads to the separate activation step, not an unseen upgrade.
  if (focused?.abilityId) {
    const available = buttons.filter(button => !button.disabled && button.dataset.abilityId === focused.abilityId);
    (available.find(button => button.dataset.abilityAction === focused.abilityAction) ||
      (focused.abilityAction === 'learn' && available.find(button => button.dataset.abilityAction === 'slot')) || available[0])?.focus?.();
  }
}
function commissionQuoteSignature(preview) {
  return JSON.stringify([preview.family, preview.suffix, preview.item, preview.price, preview.goldAfter, preview.quoteBasis, preview.currentWeapon, state.mode, state.stage, state.unlocked, state.wins, state.inventory, state.pendingLoot]);
}
// Camp-only UI preference, deliberately absent from saves and ownership transfer.
const commissionSuffixSelection = { axe: 'slaughter', rapier: 'slaughter', club: 'slaughter' };
const commissionSuffixNames = { slaughter: '屠戮（Slaughter）', balance: '平衡（Balance）', nimble: '靈巧（Nimble）' };
function selectCommissionSuffix(family, suffix) {
  if (!claimLease() || state.mode !== 'town' || !(state.wins >= 1)) return;
  if (!COMMISSION_WEAPON_SUFFIXES[family]?.some(choice => choice.suffix === suffix)) return;
  if (commissionSuffixSelection[family] === suffix) return;
  closeWeaponCommission();
  commissionSuffixSelection[family] = suffix;
  renderWeaponCommission();
}
function commissionStat(value, rate = false) {
  const number = (Number(value) || 0) * (rate ? 100 : 1);
  return Number(number.toFixed(rate ? 2 : 4)).toLocaleString('zh-TW', { maximumFractionDigits: rate ? 2 : 4 });
}
function abortWeaponCommission(message) {
  commissionConsent = null;
  $('commission-confirm').disabled = true;
  $('commission-feedback').textContent = `委託已取消，未扣款、未交付。${message}`;
}
function closeWeaponCommission() {
  commissionConsent = null;
  $('commission-confirm').disabled = true;
  if ($('commission-dialog').open) $('commission-dialog').close();
}
function reconcileWeaponCommission() {
  if (!commissionConsent) return;
  if (!claimLease()) { abortWeaponCommission('此分頁已失去進度控制權，請接手後重新預覽。'); return; }
  const fresh = previewWeaponCommission(state, commissionConsent.family, commissionConsent.suffix);
  if (!fresh.available) { abortWeaponCommission(fresh.reason || '請回營後重新預覽。'); return; }
  if (commissionConsent.signature !== commissionQuoteSignature(fresh)) abortWeaponCommission('報價、進度或目前裝備已改變，請關閉後重新預覽。');
}
function openWeaponCommission(family) {
  if (!claimLease()) { showToast('此分頁為唯讀；接手後才能進行武器委託。'); return; }
  if (state.mode !== 'town') { showToast('請先回營，再查看武器委託。'); return; }
  if (!(state.wins >= 1)) { showToast('完成首次遠征後解鎖武器委託；目前未扣款。'); return; }
  // One visible offer is one consent scope; another selection cannot silently replace it.
  if ($('commission-dialog').open) return;
  const preview = previewWeaponCommission(state, family, commissionSuffixSelection[family]);
  if (!preview.item) { showToast(preview.reason || '無法取得委託報價，未扣款。'); return; }
  const { item, currentWeapon } = preview;
  commissionConsent = preview.available ? { ...preview, signature: commissionQuoteSignature(preview) } : null;
  $('commission-item-name').textContent = item.name;
  $('commission-item-meta').textContent = `${qualityName(item.quality)}（${item.quality}） · Lv.${item.level} · 品質骰 R${commissionStat(item.roll)} · ${commissionSuffixNames[preview.suffix || 'slaughter']} · 無前綴`;
  $('commission-current').textContent = `比較現用：${currentWeapon?.name || '無武器'}（${qualityName(currentWeapon?.quality || '')} · Lv.${currentWeapon?.level || 0}）`;
  const heading = node('div', 'commission-stat-row commission-stat-heading');
  heading.append(...['屬性', '委託值', '現用值', '差值'].map(text => node('span', '', text)));
  $('commission-comparison').replaceChildren(heading, ...Object.entries(statNames).map(([key, label]) => {
    const value = Number(item.stats?.[key]) || 0, old = Number(currentWeapon?.stats?.[key]) || 0;
    const diff = Number((value - old).toFixed(4)), rate = rateStats.has(key);
    const delta = diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${commissionStat(diff, rate)}${rate ? ' 百分點' : ''}`;
    const row = node('div', 'commission-stat-row');
    row.append(node('span', '', label), node('strong', '', `${commissionStat(value, rate)}${rate ? '%' : ''}`), node('span', '', `${commissionStat(old, rate)}${rate ? '%' : ''}`), node('span', `delta ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`, delta));
    return row;
  }));
  $('commission-trait').replaceChildren(node('strong', '', `武器路線 · ${itemTypeName(item)}`), node('p', '', describeWeaponTrait(item)));
  const rules = weaponRuleText(item);
  if (rules) $('commission-trait').append(node('p', 'muted', rules));
  const tradeoffs = { slaughter: '屠戮提高基底攻擊；不含平衡的暴擊區間或靈巧的招架值區間。', balance: '平衡提高暴擊機率；放棄屠戮的攻擊區間，並非每次出手都更強。', nimble: '靈巧提高招架值；放棄屠戮攻擊與平衡暴擊區間，實際招架判定率依角色換算，並非等值百分比。' };
  $('commission-trait').append(node('p', 'muted', tradeoffs[preview.suffix || 'slaughter']));
  $('commission-cost').textContent = `委託費用 ${format(preview.price)} 金幣 · 現有 ${format(state.hero.gold)} · 購買後餘額 ${format(preview.goldAfter)}`;
  $('commission-feedback').textContent = preview.available ? '尚未購買。確認後只交付這一件；若報價或比較條件變更，本次確認失效。' : `目前不可委託：${preview.reason} 未扣款、未交付。`;
  $('commission-confirm').textContent = `確認委託 · 支付 ${format(preview.price)} 金幣`;
  $('commission-confirm').disabled = !preview.available;
  $('commission-dialog').showModal();
}
function confirmWeaponCommission() {
  if (!commissionConsent || !$('commission-dialog').open) { commissionConsent = null; $('commission-confirm').disabled = true; return; }
  reconcileWeaponCommission();
  const consent = commissionConsent;
  if (!consent) return;
  const equipmentBefore = JSON.stringify(state.equipment), countBefore = state.inventory.length;
  // Consume consent synchronously before dispatch, including an engine no-op or stale quote.
  commissionConsent = null;
  $('commission-confirm').disabled = true;
  const completed = dispatch('commissionWeapon', { family: consent.family, suffix: consent.suffix, quoteBasis: consent.quoteBasis });
  const delivered = state.inventory.find(item => item.id === consent.item.id);
  const purchased = completed && state.hero.gold === consent.goldAfter && state.inventory.length === countBefore + 1 && delivered?.locked === true && JSON.stringify(delivered) === JSON.stringify(consent.item) && JSON.stringify(state.equipment) === equipmentBefore;
  if (!purchased) { abortWeaponCommission('操作未確認完成，請核對金幣與背包後重新預覽。'); return; }
  closeWeaponCommission();
  selectedId = delivered.id; selectedSlot = null;
  resetInventoryFilters(); $('slot-filter').value = 'weapon'; $('sort-select').value = 'new';
  render(true);
  showToast(`已重設背包篩選，以武器／最新取得顯示。已委託「${delivered.name}」· 支付 ${format(consent.price)} 金幣；已鎖定送入背包，未自動裝備。`);
}
function renderWeaponCommission() {
  reconcileWeaponCommission();
  const offers = COMMISSION_WEAPON_FAMILIES.map(choice => ({ ...choice, preview: previewWeaponCommission(state, choice.family, commissionSuffixSelection[choice.family]) }));
  const signature = JSON.stringify([tabOwner, state.mode, state.wins, commissionSuffixSelection, offers]);
  if (signature === lastCommissionSignature) return;
  lastCommissionSignature = signature;
  const focused = typeof document !== 'undefined' ? document.activeElement?.id : null;
  const controls = [];
  const canPreview = tabOwner && state.mode === 'town' && state.wins >= 1;
  $('commission-status').textContent = !tabOwner ? '唯讀分頁：接手後才能委託。' : state.mode !== 'town' ? '僅營地可委託；請先回營整備。' : !(state.wins >= 1) ? '完成首次遠征後解鎖。' : offers.every(offer => !offer.preview.available) && new Set(offers.map(offer => offer.preview.reason)).size === 1 ? offers[0].preview.reason : '選擇路線查看精確報價與比較；確認前不會扣款。';
  $('commission-affixes').replaceChildren(...offers.map(({ family, label }) => {
    const field = node('div', 'commission-affix');
    const caption = node('label', '', `${label}詞綴`);
    const select = node('select'); select.id = `commission-suffix-${family}`;
    caption.setAttribute('for', select.id);
    select.setAttribute('aria-label', `${label}委託詞綴`);
    select.append(...COMMISSION_WEAPON_SUFFIXES[family].map(choice => {
      const option = node('option', '', commissionSuffixNames[choice.suffix]); option.value = choice.suffix; return option;
    }));
    select.value = commissionSuffixSelection[family];
    select.disabled = !canPreview;
    select.addEventListener('change', () => selectCommissionSuffix(family, select.value));
    controls.push(select); field.append(caption, select); return field;
  }));
  $('commission-choices').replaceChildren(...offers.map(({ family, label, preview }) => {
    const button = node('button', 'commission-choice');
    button.id = `commission-preview-${family}`; controls.push(button);
    const routes = { axe: '流血傷口', rapier: '穿透護甲', club: '暈眩控制' };
    button.append(node('strong', '', label), node('span', '', routes[family] || ''), node('span', 'commission-price', preview.item ? `${format(preview.price)} 金幣 · 查看` : '暫無報價'));
    button.disabled = !canPreview || !preview.item;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', `查看${label}武器委託${preview.item ? `，${format(preview.price)} 金幣` : ''}，尚未購買`);
    button.addEventListener('click', () => openWeaponCommission(family));
    return button;
  }));
  controls.find(control => control.id === focused && !control.disabled)?.focus?.();
}
function safeSaleSignature(entry) {
  const item = state.inventory.find(item => item.id === entry.id);
  const equipped = Object.values(state.equipment).find(item => item.id === entry.keeperId);
  const keeper = equipped || state.inventory.find(item => item.id === entry.keeperId);
  return JSON.stringify([entry, item, keeper, Boolean(equipped)]);
}
function safeSaleIsCurrent(batch, preview = previewSafeSale(state)) {
  const current = new Map(preview.items.map(item => [item.id, item]));
  return batch.items.every(item => current.has(item.id) && batch.signatures.get(item.id) === safeSaleSignature(current.get(item.id)));
}
function abortSafeSale(message) {
  safeSaleBatch = null;
  $('safe-sale-confirm').disabled = true;
  $('safe-sale-feedback').textContent = `已取消，未出售任何裝備。${message}`;
}
function closeSafeSalePreview() {
  safeSaleBatch = null;
  $('safe-sale-confirm').disabled = true;
  if ($('safe-sale-dialog').open) $('safe-sale-dialog').close();
}
function openSafeSalePreview() {
  if (!claimLease()) { showToast('此分頁為唯讀；接手後才能預覽出售。'); return; }
  if (state.mode !== 'town') { showToast('請先回營，再預覽安全整理。'); return; }
  // A repeated click must not silently replace a batch already awaiting consent.
  if ($('safe-sale-dialog').open) return;
  const preview = previewSafeSale(state);
  const items = preview.items.map(item => ({ ...item, strictlyBetterKeys: [...item.strictlyBetterKeys] }));
  safeSaleBatch = items.length ? { items, total: preview.total, signatures: new Map(items.map(item => [item.id, safeSaleSignature(item)])) } : null;
  $('safe-sale-list').replaceChildren(...items.map(item => {
    const row = node('li', 'safe-sale-item');
    const equipped = Object.values(state.equipment).some(keeper => keeper.id === item.keeperId);
    row.append(node('strong', '', item.name), node('span', 'safe-sale-meta', `${qualityName(item.quality)} · ${slotNames[item.slot]} · ${format(item.value)} 金幣`), node('span', 'safe-sale-id', `出售 ID：${item.id}`));
    row.append(node('p', 'safe-sale-reason', `保留「${item.keeperName}」（${equipped ? '已裝備' : '背包已鎖定'}；ID：${item.keeperId}）。同型的七項屬性均不低，且${item.strictlyBetterKeys.map(key => statNames[key] || key).join('、')}較高；不以評分判定。`));
    return row;
  }));
  $('safe-sale-summary').textContent = `本次預覽 ${items.length} 件 · 合計 ${format(preview.total)} 金幣`;
  $('safe-sale-confirm').textContent = `確認出售這 ${items.length} 件 · +${format(preview.total)} 金幣`;
  $('safe-sale-confirm').disabled = !items.length;
  $('safe-sale-feedback').textContent = items.length ? '尚未出售。只會處理此處列出的 ID；若條件改變，整批取消，不會自動加入其他裝備。' : '沒有符合條件的裝備，未出售任何裝備。先保留或鎖定要留的同型裝備，再回來預覽。';
  $('safe-sale-dialog').showModal();
}
function confirmSafeSale() {
  const batch = safeSaleBatch;
  if (!batch || !$('safe-sale-dialog').open) { safeSaleBatch = null; return; }
  if (!claimLease()) { abortSafeSale('此分頁已失去進度控制權，請接手後重新預覽。'); return; }
  if (state.mode !== 'town') { abortSafeSale('請先回營後重新預覽。'); return; }
  if (!safeSaleIsCurrent(batch)) { abortSafeSale('裝備或保留條件已改變，請關閉後重新預覽。'); return; }
  // Consume consent before dispatch. Engine atomically revalidates this exact ID set.
  safeSaleBatch = null;
  $('safe-sale-confirm').disabled = true;
  const gold = state.hero.gold;
  const completed = dispatch('sellSafe', { ids: batch.items.map(item => item.id) });
  const sold = completed && batch.items.every(item => !state.inventory.some(current => current.id === item.id)) && state.hero.gold === gold + batch.total;
  if (!sold) { abortSafeSale('本次操作未完成，請核對背包後重新預覽。'); return; }
  closeSafeSalePreview();
  showToast(`已安全出售預覽的 ${batch.items.length} 件 · +${format(batch.total)} 金幣；保留裝備不變。`);
}
function setSafeAutoSell(enabled) {
  if (!claimLease()) { renderSafeLoot(); showToast('此分頁為唯讀，自動出售設定未變更。'); return; }
  if (state.mode !== 'town') { renderSafeLoot(); showToast('請先回營，再調整自動出售；設定未變更。'); return; }
  if (!dispatch('setAutoSell', enabled) || (state.autoSell === true) !== enabled) { renderSafeLoot(); return; }
  showToast(enabled ? '安全自動出售已開啟：只檢查之後的新掉落，既有背包不變。' : '安全自動出售已關閉：之後的新掉落保留。');
}
function renderSafeLoot() {
  const canEdit = tabOwner && state.mode === 'town';
  $('auto-sell-toggle').checked = state.autoSell === true;
  $('auto-sell-toggle').disabled = !canEdit;
  $('auto-sell-state').textContent = state.autoSell === true ? '開 · 僅新掉落' : '關 · 預設';
  $('sell-safe').disabled = !canEdit;
  const signature = JSON.stringify([state.inventory, state.equipment, state.pendingLoot, state.mode, tabOwner, state.autoSell]);
  if (signature === lastSafeLootSignature) return;
  lastSafeLootSignature = signature;
  const preview = previewSafeSale(state);
  $('safe-loot-status').textContent = !tabOwner ? '唯讀分頁：接手後才可調整與出售。' : state.mode !== 'town' ? '回營後才可調整與整理；既有設定仍依新掉落規則運作。' : `目前可預覽 ${preview.items.length} 件 · ${format(preview.total)} 金幣；確認前不會出售。`;
  if (safeSaleBatch) {
    if (!tabOwner) abortSafeSale('此分頁已失去進度控制權，請接手後重新預覽。');
    else if (state.mode !== 'town' || !safeSaleIsCurrent(safeSaleBatch, preview)) abortSafeSale('裝備或保留條件已改變，請回營並重新預覽。');
  }
}
function playSound(kind) {
  if (!prefs.sound || document.hidden) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const tone = { loot: 700, win: 530, level: 630, crit: 250, hit: 120, heal: 430 }[kind] || 140;
    osc.type = ['loot', 'win', 'level', 'heal'].includes(kind) ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(tone, now); osc.frequency.exponentialRampToValueAtTime(tone * (kind === 'loot' ? 1.5 : .65), now + .1);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.035, now + .008); gain.gain.exponentialRampToValueAtTime(.0001, now + .15);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + .17);
  } catch { prefs.sound = false; updatePreferences(); }
}
function updatePreferences() {
  document.body.classList.toggle('reduced-motion', prefs.reducedMotion);
  $('motion-toggle').checked = prefs.reducedMotion;
  $('background-toggle').checked = prefs.backgroundIdle;
  $('sound-toggle').textContent = `音效 ${prefs.sound ? '開' : '關'}`;
  $('sound-toggle').setAttribute('aria-label', `${prefs.sound ? '關閉' : '開啟'}音效`);
  writeStorage(PREF_KEY, JSON.stringify({ reducedMotion: prefs.reducedMotion, backgroundIdle: prefs.backgroundIdle }));
}
function eventEffects() {
  const magicNotice = $('magic-notice');
  const magicOwner = typeof tabOwner === 'boolean' && tabOwner;
  if (magicNotice && (state.mode !== 'battle' || !magicOwner)) magicNotice.hidden = true;
  const bleedEvents = [];
  for (const event of state.events || []) {
    const key = String(event.id);
    if (seenEvents.has(key)) continue;
    seenEvents.add(key); lastProcessedEvent = key;
    if (seenEvents.size > 200) { const keep = Array.from(seenEvents).slice(-100); seenEvents.clear(); keep.forEach(id => seenEvents.add(id)); }
    const type = event.type;
    if (type === 'cast' && event.effect === 'magic' && magicNotice && state.mode === 'battle' && magicOwner) {
      // Actual initiated cast, not next-action prediction. Persists through waves
      // until another cast, camp, reload/import or ownership change.
      magicNotice.textContent = `最近敵方施法 · ${event.text || '赤砂術式 · 魔法技能'}（已施放，不代表命中）`;
      magicNotice.hidden = false;
    }
    if ((type === 'proc' || type === 'recovery') && state.mode === 'battle') {
      // Text feedback remains visible with reduced motion; never infer a proc from a weapon name.
      const enemy = state.enemies.find(enemy => enemy.id === event.target && enemy.hp > 0);
      if (!enemy) continue; // Expired targets remain in the log, not the current battlefield.
      const recovering = type === 'recovery';
      const stunning = event.effect === 'stun';
      const bleeding = event.effect === 'bleed';
      const effectNotice = $(recovering ? 'recovery-notice' : 'proc-notice');
      effectNotice.className = `proc-notice${recovering ? ' recovery-notice' : stunning ? ' stun-proc' : bleeding ? ' bleed-proc' : ''}`;
      effectNotice.textContent = `${enemy.name} · ${event.text || (recovering ? '暈眩解除，敵人恢復行動' : stunning ? '暈眩觸發' : bleeding ? '流血傷口觸發' : '武器特效觸發')}`;
      effectNotice.hidden = false;
      // A recovery and a new proc can occur in one update; neither notice erases the other.
      if (recovering) {
        recoveryTargetId = enemy.id;
        clearTimeout(recoveryTimer); recoveryTimer = setTimeout(() => { effectNotice.hidden = true; }, 3200);
      } else {
        procTargetId = enemy.id;
        clearTimeout(procTimer); procTimer = setTimeout(() => { effectNotice.hidden = true; }, 3200);
      }
      playSound('crit');
    }
    if (type === 'protection' && !prefs.reducedMotion) {
      const number = node('span', 'floating-number protection', '護盾');
      $('floating-layer').append(number); setTimeout(() => number.remove(), 950);
    }
    if (type === 'counter' && event.effect === 'counter') {
      // An action notice survives a lethal target/wave change, unlike live statuses.
      const counterNotice = $('counter-notice');
      counterNotice.textContent = `最近反擊 · ${event.text || '反擊'} · ${format(event.value)} 傷害（反擊，不計入普攻／技能）`;
      counterNotice.hidden = false;
      clearTimeout(counterTimer); counterTimer = setTimeout(() => { counterNotice.hidden = true; }, 3200);
      attackPulse = 1;
      if (!prefs.reducedMotion) {
        const number = node('span', 'floating-number counter', `反擊 ${format(event.value)}`);
        $('floating-layer').append(number); setTimeout(() => number.remove(), 950);
      }
      playSound('hit');
    }
    if (type === 'bleed' && event.effect === 'bleed') {
      // Damage is an event, not a live-target status: keep lethal/final-wave ticks readable.
      bleedEvents.push({ text: event.text || `流血傷口造成 ${format(event.value)} 傷害`, value: event.value });
    }
    if (['hit', 'crit', 'miss', 'block', 'heal'].includes(type)) {
      const targetHero = event.target === 'hero' || event.target === 'player';
      if (targetHero) enemyPulse = 1; else attackPulse = 1;
      if (!prefs.reducedMotion) {
        const number = node('span', `floating-number ${type}${targetHero ? ' enemy' : ''}`, event.value ? `${type === 'heal' ? '+' : ''}${format(event.value)}${type === 'crit' ? '!' : ''}` : (type === 'miss' ? '閃避' : type === 'block' ? '格擋' : event.text));
        number.style.marginLeft = `${(Math.random() - .5) * 36}px`;
        $('floating-layer').append(number);
        setTimeout(() => number.remove(), 950);
      }
      if (type === 'crit') { flash = .3; if (!prefs.reducedMotion) { $('battle-scene').classList.remove('shake'); void $('battle-scene').offsetWidth; $('battle-scene').classList.add('shake'); } }
      playSound(type);
    }
    if (['loot', 'win', 'level', 'defeat'].includes(type)) {
      $('reward-banner').textContent = event.text || ({ loot: '獲得戰利品', win: '遠征完成', level: '等級提升', defeat: '暫時撤退，整備後再出發' }[type]);
      $('reward-banner').hidden = false;
      clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { $('reward-banner').hidden = true; }, type === 'loot' ? 2400 : 3500);
      if (!prefs.reducedMotion) for (let i = 0; i < 16; i++) particles.push({ x: .65, y: .63, vx: (Math.random() - .5) * .15, vy: -Math.random() * .22, life: 1, color: type === 'level' ? '#a9e3cf' : '#e9c77e' });
      playSound(type);
    }
  }
  if (bleedEvents.length) {
    const recent = bleedEvents.slice(-3);
    const damageNotice = $('bleed-notice');
    damageNotice.textContent = `流血結算 · ${recent.map(event => event.text).join('；')}${bleedEvents.length > 3 ? `；本次共 ${bleedEvents.length} 筆，這裡顯示最近 3 筆` : ''}`;
    damageNotice.hidden = false;
    clearTimeout(bleedTimer); bleedTimer = setTimeout(() => { damageNotice.hidden = true; }, 3200);
    if (!prefs.reducedMotion) recent.forEach((event, index) => {
      const number = node('span', 'floating-number bleed', `流血 −${format(event.value)}`);
      number.style.marginTop = `${index * 24}px`; // Batch catch-up never overlays unbounded floating labels.
      $('floating-layer').append(number);
      setTimeout(() => number.remove(), 950);
    });
  }
}
function setMeter(id, value, max) { $(id).style.width = `${Math.max(0, Math.min(100, Number(value) / Math.max(1, Number(max)) * 100))}%`; }
function renderEnemyStatuses() {
  const enemies = state.mode === 'battle' ? state.enemies.filter(enemy => enemy.hp > 0) : [];
  const tick = state.timing?.ticks || 0;
  const targetId = targetPriorityView(state).targetId;
  const rows = enemies.map(enemy => ({ enemy, status: penetratedArmorStatus(enemy, tick), stun: stunStatus(enemy, tick), bleed: bleedStatus(enemy, tick), defense: enemyDefenseView(enemy, tick), attack: enemy.attackPattern === 'alternating' ? enemyAttackView(enemy) : null, magicDefense: enemy.attackPattern === 'alternating' ? playerMagicDefenseView(state) : null }));
  const signature = JSON.stringify([targetId, rows.map(({ enemy, status, stun, bleed, defense, attack, magicDefense }) => [enemy.id, enemy.name, enemy.roleId, enemy.hp, status, stun, bleed, defense, attack, magicDefense])]);
  $('enemy-status-panel').hidden = !rows.length;
  if (!rows.length || (procTargetId && !enemies.some(enemy => enemy.id === procTargetId))) {
    $('proc-notice').hidden = true; clearTimeout(procTimer); procTargetId = null;
  }
  if (!rows.length || (recoveryTargetId && !enemies.some(enemy => enemy.id === recoveryTargetId))) {
    $('recovery-notice').hidden = true; clearTimeout(recoveryTimer); recoveryTargetId = null;
  }
  if (signature === lastEnemyStatusSignature) return;
  lastEnemyStatusSignature = signature;
  $('enemy-status-list').replaceChildren(...rows.map(({ enemy, status, stun, bleed, defense, attack, magicDefense }, index) => {
    const pending = stun?.recoveryPending;
    const card = node('div', `enemy-status-card${status ? ' has-penetration' : ''}${stun ? pending ? ' recovery-ready' : ' is-stunned' : ''}${bleed ? ' is-bleeding' : ''}`);
    const name = node('strong', '', `${enemy.id === targetId ? '目標 · ' : ''}${enemy.name}`);
    const effect = node('span', 'enemy-effect penetration-effect', status ? `穿透護甲 ${status.stacks}/${PENETRATED_ARMOR_RULES.maxStacks} 層 · 剩 ${status.ticksRemaining} Tick` : '穿透護甲：無');
    const control = node('span', 'enemy-effect stun-effect', pending ? '甦醒待行動 · 下次我方行動前可反擊' : stun ? `暈眩 · 剩 ${stun.ticksRemaining} Tick` : '暈眩：無');
    card.append(name);
    if (attack?.mixed) {
      card.append(node('strong', 'enemy-effect', `下一次行動：${attack.nextLabel}${stun && !pending ? ' · 暈眩中，暫不行動' : ''}`));
      card.append(node('span', 'enemy-effect', `我方魔法屬性減傷 ${defenseRate(magicDefense.mitigation)} · 抵抗 0%（尚未實作）`));
      card.append(node('span', 'enemy-effect', '魔法不吃物理護甲／招架；可閃避／格擋，Protection 仍有效。'));
    }
    card.append(effect, control);
    card.append(node('span', 'enemy-effect bleed-effect', bleed ? `流血傷口 ${bleed.stacks}/${AXE_BLEED_RULES.maxStacks} 層 · 剩 ${bleed.ticksRemaining} Tick · 每 Tick ${format(bleed.damagePerTick)} 傷害` : '流血傷口：無'));
    const role = enemyRolePresentation(enemy);
    card.append(node('span', `enemy-role role-${role.id}`, `${role.mark} ${role.label}${enemy.boss ? ' · 首領' : ''}`));
    const currentDefense = node('div', 'enemy-current-defense');
    currentDefense.append(...defenseLines(defense, '目前').map(line => node('span', '', line)));
    card.append(currentDefense);
    const details = [`基礎一般物理減傷 ${defenseRate(defense.baseMitigation)}；目前數字已計入穿透護甲與暈眩。閃＝閃避、招＝招架、擋＝格擋，各為單次判定機率，不是完全擋下攻擊的總機率。暈眩不取消格擋。`];
    if (attack?.mixed) details.push('物理攻擊與赤砂術式交替為本作改編；只有實際發起行動才交替，被閃避或格擋仍算行動。暈眩跳過行動不推進。魔法不附加武器特效；格擋魔法後仍可依既有條件嘗試反擊，此為通用格擋規則推論。');
    if (status) details.push(`物理減傷為原本的 ${format(status.mitigationMultiplier * 100)}%；不是直接增加同等傷害。`);
    if (stun) details.push(pending ? '暈眩已結束，閃避與招架恢復；下一次我方行動前，敵人先行動。' : '暫停敵方行動，期間不能閃避或招架；到期後會恢復行動。');
    if (bleed) details.push(`流血每 Tick ${format(bleed.damagePerTick)} 點無類型傷害；以觸發時面板攻擊快照計算，不受減傷、閃避、招架與格擋影響；穿透護甲不增幅流血。`);
    card.title = details.join(' ');
    return card;
  }));
}
function renderCounterattack() {
  const view = counterattackView(state);
  $('counterattack-status').textContent = view.eligible
    ? `已啟用 · ${weaponFamilyNames[resolveWeaponFamily(state.equipment.weapon)]} · 有效單手熟練度 ${Number(view.effectiveProficiency).toFixed(2).replace(/\.?0+$/, '')}`
    : '未啟用 · 換上可辨識的戰斧、刺劍或戰棍後生效；入門鈍劍不適用。';
  $('counterattack-chance').textContent = view.eligible
    ? `符合招架／格擋條件後，${(view.chance * 100).toFixed(2).replace(/\.?0+$/, '')}% 機率反擊`
    : '目前武器不會發起反擊';
  $('counterattack-budget').textContent = view.eligible
    ? `每個我方回合最多 ${format(view.maxPerTurn)} 次${state.mode === 'battle' ? ` · 本回合已發起 ${format(view.usedThisTurn)} 次，剩 ${format(view.remainingThisTurn)} 次` : ' · 出發時重新計數'}`
    : '這不是每次敵人攻擊都會觸發的機率。';
}
function renderPlayerParry(derived) {
  $('stat-parry').textContent = `${((Number(derived.parry) || 0) * 100).toFixed(2)}%`;
}
function renderEmergencySupply() {
  const toggle = $('emergency-supply');
  if (!toggle) return; // A cached older document may omit this optional panel.
  const view = emergencySupplyView(state), sustain = view.strategy === 'sustain';
  toggle.checked = view.enabled;
  toggle.disabled = !tabOwner || state.mode !== 'town' || sustain;
  const access = !tabOwner ? '唯讀分頁；取得控制權並回營後可改。' : state.mode !== 'town' ? '回營後可改。' : '僅營地可調整。';
  $('emergency-supply-status').textContent = sustain
    ? `持久戰術不受此開關控制：仍按既有規則在治癒後 HP 低於 30% 自動喝藥，可用最後 1 瓶。均衡／猛攻設定保留為${view.enabled ? '開啟' : '關閉'}。${access}`
    : `${view.enabled ? '已開啟' : '預設關閉；目前藥水僅手動使用'}。${view.enabled ? '每個我方回合先依戰術判斷治癒，再檢查 HP；低於 30% 且剩餘超過 1 瓶才用 1 瓶。' : ''}${access}`;
  const live = $('emergency-supply-live');
  live.hidden = state.mode !== 'battle';
  if (live.hidden) { live.textContent = ''; return; }
  const stock = `補給剩 ${format(view.remaining)} 瓶 · 本場已用 ${format(state.battle.actions.potions)} 瓶（含手動／自動）`;
  const condition = view.status === 'away' ? '目前不在交戰；不自動喝藥。'
    : view.status === 'empty' ? '庫存已空，不會購買或補充。'
    : view.status === 'reserved' ? '已到保留量；額外緊急補給不再使用，仍可手動喝藥。'
    : view.status === 'ready' ? '目前低於 30%；待我方回合先判斷治癒，再判斷是否使用，不是立即觸發。'
    : '等待我方回合治癒後仍低於 30%；不保證能防止戰敗。';
  live.textContent = sustain
    ? `${stock} · 持久既有自動補給：治癒後低於 30% 可用最後 1 瓶；不受額外補給開關控制。`
    : view.effective ? `${stock} · 額外緊急補給保留 ${format(view.reserve)} 瓶供手動使用。${condition}`
    : `${stock} · 額外緊急補給關閉；均衡／猛攻仍須手動喝藥。`;
}
function renderProtection() {
  const view = protectionView(state);
  const toggle = $('auto-protection');
  toggle.checked = view.enabled;
  toggle.disabled = !tabOwner || state.mode !== 'town' || !view.unlocked;
  $('protection-cost').textContent = `每次 ${format(view.manaCost)} MP · 持續 ${format(view.durationTicks)} Tick · 取代一次攻擊`;
  $('protection-status').textContent = !view.unlocked ? `Lv.${view.unlockLevel} 解鎖；不需 AP。`
    : !tabOwner ? '唯讀分頁；取得進度控制權並回營後可調整。'
    : state.mode !== 'town' ? '回營後可調整；本回合已治癒時不施盾；不足施盾費用就照常攻擊。'
    : view.enabled ? '已啟用：沒有護盾時自動施放；本回合已治癒時不施盾；不足施盾費用就照常攻擊。'
    : '尚未啟用：省下魔力與施法回合，維持原本攻擊節奏。';
  const live = $('protection-live');
  live.hidden = !view.enabled && !view.active;
  live.textContent = view.active
    ? `護盾生效 · 剩 ${format(view.remainingTicks)} Tick · 本場施放 ${format(view.casts)} 次 · 減免 ${format(view.damagePrevented)} 傷害`
    : `自動護盾待命 · ${format(view.manaCost)} MP／次 · 本場施放 ${format(view.casts)} 次 · 減免 ${format(view.damagePrevented)} 傷害`;
}
function renderTargetPriority() {
  const view = targetPriorityView(state);
  $('target-priority-select').value = view.policy;
  $('target-priority-select').disabled = !tabOwner || state.mode !== 'town';
  const rules = { front: '依存活敵人的既定順序集火；不改原有攻擊順序。', caster: '先集火會交替施法的敵人，即使下一動是物理攻擊；沒有施法者時依既定順序。', weakest: '選目前 HP 數字最低的存活敵人，不是血量百分比；同 HP 依既定順序。' };
  $('target-priority-description').textContent = `${rules[view.policy]} ${!tabOwner ? '唯讀分頁；取得控制權並回營後可改。' : state.mode !== 'town' ? '回營後可改。' : '營地可調整，出戰後固定。'}`;
  const live = $('target-priority-live');
  live.hidden = state.mode !== 'battle' || view.targetId === null;
  live.textContent = view.targetId === null ? '' : `目前集火：${view.targetName} · ${view.reason}。普攻與攻擊技能適用；治癒／護盾仍優先，反擊仍打攻擊者。`;
}
function render(force = false) {
  const comparisonFocus = captureComparisonFocus();
  const detailActionFocus = captureDetailActionFocus();
  renderSoulbindStatus();
  renderItemWorldStatus();
  const trial = itemWorldView(state);
  $('strategy-select').value = state.strategy || 'balanced';
  $('strategy-select').disabled = state.mode !== 'town' || !tabOwner;
  $('strategy-description').textContent = (STRATEGIES.find(strategy => strategy.id === state.strategy)?.description || '').replace('藥水手動使用。', emergencySupplyView(state).effective ? '額外緊急補給已開啟；仍可手動喝藥。' : '藥水手動使用。');

  renderCounterattack();
  renderProtection();
  renderTargetPriority();
  renderEmergencySupply();
  const derived = stats(state);
  renderPlayerParry(derived);
  $('level-badge').textContent = `LV. ${state.hero.level}`;
  $('hp-label').textContent = `${format(state.hero.hp)} / ${format(derived.maxHp)}`;
  $('mp-label').textContent = `${format(state.hero.mp)} / ${format(derived.maxMp)}`;
  $('xp-label').textContent = `${format(state.hero.xp)} / ${format(state.hero.xpNext)}`;
  setMeter('hp-bar', state.hero.hp, derived.maxHp); setMeter('mp-bar', state.hero.mp, derived.maxMp); setMeter('xp-bar', state.hero.xp, state.hero.xpNext);
  $('stat-attack').textContent = format(derived.attack); $('stat-defense').textContent = format(derived.defense); $('stat-crit').textContent = `${((derived.crit || 0) * 100).toFixed(1)}%`; $('stat-gold').textContent = format(state.hero.gold);
  $('zone-title').textContent = trial.active ? 'Item World · 武器試煉' : stageName(state.stage);
  $('stage-label').textContent = trial.active ? `IW1 · 本作強度 ${trial.strengthStage}` : `遠征 ${String(state.stage).padStart(2, '0')}`;
  $('wave-label').textContent = trial.active ? `第 ${trial.round} / ${trial.rounds} 回合` : state.mode === 'battle' ? `第 ${state.wave} / ${state.totalWaves} 波` : state.mode === 'defeat' ? '旅者倒下了' : '準備出發';
  $('mode-badge').textContent = trial.active ? '武器試煉進行中' : { town: '整備中', battle: '遠征進行中', defeat: '需要整備' }[state.mode] || '整備中'; $('mode-badge').className = `status-pill ${state.mode}`;
  $('run-time').textContent = clock(state.battle?.elapsed); const best = state.battle?.bestTimes?.[state.stage]; $('best-time').textContent = trial.active ? '不計普通關卡' : best ? clock(best) : '尚無紀錄';
  $('kill-count').textContent = format(state.kills); $('win-count').textContent = format(state.wins); $('deepest-stage').textContent = String(state.unlocked).padStart(2, '0'); $('progress-label').textContent = `${Math.max(0, state.mode === 'town' ? 0 : state.wave - 1)} / ${state.totalWaves}`;
  $('scene-message').hidden = state.mode === 'battle';
  if (state.mode !== 'battle') {
    const msg = $('scene-message'); msg.querySelector('h3').textContent = state.mode === 'defeat' ? '這不是旅程的終點。' : '下一段旅程，準備好了嗎？'; msg.querySelector('p').textContent = state.mode === 'defeat' ? '回營恢復，換上好裝，再來一次。' : '選好裝備，剩下的交給戰鬥。';
  }
  const stageCount = Math.min(1000, Math.max(1, state.unlocked));
  if (lastStageCount !== stageCount) {
    $('stage-select').replaceChildren(...Array.from({ length: stageCount }, (_, i) => { const opt = node('option', '', `${String(i + 1).padStart(2, '0')} · ${stageName(i + 1)}`); opt.value = i + 1; return opt; })); lastStageCount = stageCount;
  }
  $('stage-select').value = state.stage; $('stage-select').disabled = state.mode === 'battle' || !tabOwner; $('auto-advance').checked = Boolean(state.autoAdvance); $('auto-advance').disabled = !tabOwner; $('import-save').disabled = !tabOwner;
  const departure = departureReadiness();
  $('start-button').disabled = !tabOwner || state.mode === 'battle' || state.mode === 'defeat' || !departure.ready; $('retreat-button').disabled = !tabOwner || state.mode === 'town'; $('heal-button').disabled = !tabOwner || state.mode !== 'battle' || state.hero.hp >= derived.maxHp || !(state.potions > 0);
  renderFinishCamp();
  $('heal-button').textContent = `補給藥水 · ${state.potions ?? 0}`;
  $('control-hint').textContent = trial.active ? `目標：${trial.targetName} · 完成五回合才獲 IW1；結束必回營，不自動重刷。` : state.mode === 'battle' ? (state.autoAdvance ? '自動推進中 · 隨時可回營整備' : '自動重刷本關 · 回營後才能換裝與出售') : state.mode === 'defeat' ? '點「回營整備」恢復，再挑戰較適合的關卡。' : departure.reason || '自動戰鬥 · 不考手速 · 隨時回營換裝';
  reconcileSelectedSale();
  const inventorySignature = JSON.stringify([[...selectedSaleIds], tabOwner, state.inventory, state.pendingLoot, selectedId, selectedSlot, inventoryFilters(), $('sort-select').value, state.equipment, state.gearSets, state.mode, state.hero.level, state.soulFragments, state.worldSeeds]);
  if (force || inventorySignature !== lastInventorySignature) { lastInventorySignature = inventorySignature; renderInventory(); renderPendingLoot(); renderItemDetail(); }
  const equipmentSignature = JSON.stringify(state.equipment);
  if (force || equipmentSignature !== lastEquipmentSignature) { lastEquipmentSignature = equipmentSignature; renderEquipment(); }
  const logSignature = JSON.stringify(state.logs);
  if (logSignature !== lastLogSignature) { lastLogSignature = logSignature; const logs = (state.logs || []).slice(0, 6); $('combat-log').replaceChildren(...(logs.length ? logs : ['營火已點亮。準備好後，開始第一場遠征。']).map(text => node('li', '', text))); }
  $('inventory-count').textContent = state.inventory.length;
  renderSafeLoot();
  renderAbilities();
  renderGrowthReadiness();
  renderGearSets();
  renderSelectedSale();
  renderWeaponCommission();
  renderEnemyStatuses();
  renderRoutePreview();
  renderExpeditionReports();
  eventEffects();
  restoreComparisonFocus(comparisonFocus);
  restoreDetailActionFocus(detailActionFocus);
}
// Local original artwork: family is resolved from owned item data, never a name guess.
// Images are decorative; the adjacent full name/type/quality remain readable text.
function itemIcon(item) {
  const family = item.slot === 'weapon' ? resolveWeaponFamily(item) : null;
  const key = ['axe', 'rapier', 'club'].includes(family) ? family : slotIcons[item.slot] || 'unknown';
  const icon = node('span', 'item-icon'); icon.setAttribute('aria-hidden', 'true');
  const image = node('img'); image.setAttribute('src', `./assets/equipment/${key}.svg`);
  image.setAttribute('alt', ''); image.setAttribute('width', '64'); image.setAttribute('height', '64');
  icon.append(image); return icon;
}
// Explicit card names must retain the same identity/investment text as their content.
function itemAccessibleName(item) {
  return [item.name, itemTypeName(item), qualityName(item.quality), `等級 ${item.level}`,
    Object.hasOwn(item, 'soulbound') ? '靈魂綁定，永久鎖定，隨等級成長' : item.locked ? '已鎖定' : '',
    item.itemWorld?.level === 1 ? 'IW1，永久成長' : ''].filter(Boolean).join('，');
}
function itemContent(item, comparing = false) {
  const icon = itemIcon(item);
  const info = node('span', 'gear-info'); info.append(node('strong', '', item.name), node('span', '', `${itemTypeName(item)} · Lv.${item.level} · ${qualityName(item.quality)}`));
  if (Object.hasOwn(item, 'soulbound')) info.append(node('span', 'soulbound-badge', '靈魂綁定 · 隨等級成長'));
  if (item.itemWorld?.level === 1) info.append(node('span', 'item-world-badge', 'IW1 · 永久成長'));
  if (comparing) info.append(node('span', 'comparison-marker', '比較中'));
  return [icon, info];
}
function renderEquipment() {
  const currentWeapon = $('current-weapon-label');
  if (currentWeapon) currentWeapon.textContent = state.equipment.weapon.name;
  comparisonButtons.equipment.clear();
  $('equipment').replaceChildren(...Object.entries(state.equipment).map(([slot, item]) => {
    const button = node('button', `gear-button${slot === selectedSlot ? ' selected' : ''}`); button.setAttribute('aria-pressed', String(slot === selectedSlot)); comparisonButtons.equipment.set(item.id, button); button.style.setProperty('--item-color', colorOf(item));
    button.append(...itemContent(item, slot === selectedSlot)); button.title = `${slotNames[slot]}：${item.name}`;
    button.addEventListener('click', () => { selectedSlot = slot; selectedId = null; lastInventorySignature = ''; render(true); }); return button;
  }));
}
function expeditionReportCard(report, label) {
  const outcomes = { win: '通關', defeat: '戰敗', retreat: '中途回營' };
  const trial = report.itemWorld;
  const outcome = trial && report.outcome === 'win' ? '試煉通關' : Object.hasOwn(outcomes, report.outcome) ? outcomes[report.outcome] : '已結束';
  const family = Object.hasOwn(weaponFamilyNames, report.weapon.family) ? weaponFamilyNames[report.weapon.family] : '未辨識武器路線';
  const strategy = STRATEGIES.find(entry => entry.id === report.strategy)?.label || '未辨識戰術';
  const card = node('article', 'expedition-report-card');
  const heading = node('div', 'report-card-heading');
  heading.append(node('h4', '', label), node('span', 'report-outcome', outcome));
  const route = trial ? `Item World · IW${format(trial.level)} · 本作強度 ${format(trial.strengthStage)}` : `出發第 ${format(report.stage)} 層`;
  card.append(heading, node('p', 'report-start', `${route} · 等級 ${format(report.level)} → 結束 ${format(report.endLevel ?? report.level)} · ${strategy}`));
  if (trial) card.append(node('p', 'report-item-world', `試煉目標：${trial.targetName}（ID：${trial.targetId}） · ${trial.reward ? '已獲永久 IW1' : '未獲 IW1'} · 已消耗 ${format(trial.cost)} 世界之種；不計普通通關或層數紀錄。`));
  card.append(node('p', 'report-weapon', `${family} · ${report.weapon.name}`));
  if (report.startStats) card.append(node('p', 'report-start-stats', `出發面板：攻擊 ${format(report.startStats.attack)} · 生命上限 ${format(report.startStats.maxHp)} · 一般減傷 ${defenseRate(report.startStats.mitigation)}`));
  card.append(expeditionBuildContext(report.build));
  const metrics = node('dl', 'report-metrics');
  const row = (title, value) => { const entry = node('div', 'report-metric'); entry.append(node('dt', '', title), node('dd', '', value)); metrics.append(entry); };
  row('已處理時間', `${report.elapsed.toFixed(1)} 秒`);
  row('實際扣除敵方生命', `普攻 ${format(report.damage.basic)} · 技能 ${format(report.damage.skill)} · 流血 ${format(report.damage.bleed)} · 反擊 ${format(report.damage.counter ?? 0)}`);
  row('承受生命損失', `${format(report.survival.hpLost)} · 最低生命 ${report.survival.minHpPercent.toFixed(1).replace(/\.0$/, '')}%`);
  row('行動次數', `攻擊總數 ${format(report.actions.attacks)}（含技能 ${format(report.actions.skills)}） · 治療 ${format(report.actions.heals)} · 藥水 ${format(report.actions.potions)}`);
  row('額外反擊次數', `${format(report.actions.counters ?? 0)}（含未造成傷害；不佔上述攻擊回合）`);
  row('魔力消耗', format(report.actions.manaSpent));
  if (report.protection) row('護盾取捨', `施放 ${format(report.protection.casts)} 次（各取代一次攻擊） · 減免 ${format(report.protection.damagePrevented)} 傷害`);
  row('特效成功施加／刷新', `流血 ${format(report.procs.bleeding)} · 穿透護甲 ${format(report.procs.penetratedArmor)} · 暈眩 ${format(report.procs.stun)}`);
  card.append(metrics);
  return card;
}
// Read only the detached departure snapshot, never today's live loadout.
function expeditionBuildContext(build) {
  const section = node('div', 'report-build');
  if (!build || typeof build !== 'object' || Array.isArray(build)) {
    section.append(node('p', 'report-build-policy', '出發配置未記錄；不以目前配置推測。'));
    return section;
  }
  section.append(node('p', 'report-build-policy', buildPolicyText(build, '出發政策')),
    node('p', 'report-build-note', '政策不代表護盾已生效；有實際施放時另列護盾取捨。'));
  if (build.emergencySupply === true) section.append(node('p', 'report-build-policy', `出發設定：${buildEmergencySupplyText(true)}`),
    node('p', 'report-build-note', '此設定不代表實際喝藥；行動次數另列本場實際藥水消耗（含手動／自動）。'));
  const details = node('details', 'report-build-details');
  details.append(node('summary', '', '出發配置詳情 · 已裝配能力／裝備'));
  const abilities = buildAbilityList(build.abilities);
  const equipment = node('ul', 'report-build-list');
  const text = value => typeof value === 'string' && value.trim() ? value.slice(0, 160) : '未記錄';
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const item = Array.isArray(build.equipment) ? build.equipment.find(entry => entry?.slot === slot) : null;
    const level = Number.isInteger(item?.level) && item.level > 0 ? item.level : '未記錄';
    const quality = QUALITY_TIERS.find(tier => tier.name === item?.quality)?.label || '未記錄';
    equipment.append(node('li', '', `${slotNames[slot]}：${text(item?.name)} · ID：${text(item?.id)} · Lv.${level} · ${quality}`));
  }
  details.append(abilities, equipment, node('p', 'report-build-note', '僅記錄出發配置；層數、等級與遭遇不同，不代表最佳配裝或勝負原因。'));
  section.append(details);
  return section;
}
// Shared read-only labels keep current preset context and historical reports
// consistent; callers still supply their own current or departure-only data.
function buildPolicyText(build, prefix) {
  const target = TARGET_PRIORITIES.find(entry => entry.id === build.targetPriority)?.label || '未記錄';
  const protection = build.autoProtection === true ? 'ON' : build.autoProtection === false ? 'OFF' : '未記錄';
  return `${prefix}：${target} · Protection ${protection}`;
}
function buildEmergencySupplyText(enabled) {
  return enabled ? '額外緊急補給 ON · 僅均衡／猛攻於治癒後 HP 低於 30% 使用，保留 1 瓶手動；持久仍用既有規則，可用最後 1 瓶。'
    : '額外緊急補給 OFF · 均衡／猛攻維持手動喝藥；持久仍用既有規則，可用最後 1 瓶。';
}
function buildAbilityList(entries) {
  const list = node('ul', 'report-build-list');
  if (!Array.isArray(entries)) list.append(node('li', '', '已裝配能力：未記錄'));
  else if (!entries.length) list.append(node('li', '', '已裝配能力：無'));
  else for (const ability of entries.slice(0, 5)) {
    const known = MAJOR_ABILITIES.find(entry => entry.id === ability?.id);
    const name = known?.label || '未辨識能力';
    const maxRank = ability?.id === 'one-handed-damage' ? 3 : 10;
    const rank = known && Number.isInteger(ability?.rank) && ability.rank > 0 && ability.rank <= maxRank ? ability.rank : '未記錄';
    list.append(node('li', '', `${name} · Rank ${rank} · ID：${known?.id || '未記錄'}`));
  }
  return list;
}
function renderExpeditionReports() {
  const reports = expeditionReports(state).slice(0, 2);
  $('pin-report').disabled = !reports.length;
  const signature = JSON.stringify([reports, pinnedExpeditionReport]);
  if (signature === lastReportSignature) return;
  lastReportSignature = signature;
  $('report-empty').hidden = reports.length > 0;
  $('expedition-report-list').replaceChildren(...reports.map((report, index) => expeditionReportCard(report, index === 0 ? '最近一次' : '前一次')));
  $('pinned-report').hidden = !pinnedExpeditionReport;
  $('pinned-report').replaceChildren(...(pinnedExpeditionReport ? [expeditionReportCard(pinnedExpeditionReport, '比較基準 · 手動保留')] : []));
  const latest = reports[0];
  $('report-status').textContent = latest ? `${latest.itemWorld ? '已記錄最近一次 Item World 試煉' : `已記錄第 ${format(latest.stage)} 層的最近一次遠征`}；新遠征開始後仍可查看。${pinnedExpeditionReport ? '比較基準已保留，不會隨新戰報替換。' : ''}` : '遠征通關、戰敗或中途回營後，戰報會自動出現在這裡。';
}
function pinRecentExpeditionReport() {
  const latest = expeditionReports(state)[0];
  if (!latest) return;
  // The engine getter supplies a detached snapshot. Pinning is local inspection,
  // not a combat action, save mutation, or permission to edit another tab's game.
  pinnedExpeditionReport = latest;
  renderExpeditionReports();
}
function renderInventory() {
  comparisonButtons.inventory.clear();
  selectedSaleCheckboxes.clear();
  const filters = inventoryFilters(), sort = $('sort-select').value;
  const items = state.inventory.filter(item => inventoryMatchesFilters(item, filters)).slice().reverse();
  const labels = inventoryFilterLabels(filters);
  $('inventory-filter-status').textContent = `背包顯示 ${items.length}／${state.inventory.length} 件${labels.length ? ` · ${labels.join(' ＋ ')}` : ' · 全部裝備'}；已穿裝備另列於旅者面板。`;
  $('reset-inventory-filters').disabled = labels.length === 0;
  if (sort === 'power') items.sort((a, b) => (b.power || 0) - (a.power || 0));
  if (sort === 'level') items.sort((a, b) => b.level - a.level);
  // Stable sort retains latest-acquired order within the same quality.
  if (sort === 'quality') items.sort((a, b) => QUALITY_TIERS.findIndex(tier => tier.name === b.quality) - QUALITY_TIERS.findIndex(tier => tier.name === a.quality));
  if (!items.length) {
    const empty = node('div', 'empty-inventory');
    empty.append(node('span', '', labels.length ? '背包中沒有同時符合這些篩選的裝備；已穿裝備不在背包清單內。' : '背包還很輕。出發帶回第一件寶物吧；已穿裝備另列於旅者面板。'));
    if (labels.length) {
      const reset = node('button', 'secondary-button', '清除篩選，查看全部背包');
      reset.addEventListener('click', resetInventoryFilterView); empty.append(reset);
    }
    $('inventory-list').replaceChildren(empty); return;
  }
  $('inventory-list').replaceChildren(...items.map(item => {
    const button = node('button', `inventory-card${item.id === selectedId ? ' selected' : ''}`); button.dataset.inventoryId = item.id; comparisonButtons.inventory.set(item.id, button); button.style.setProperty('--item-color', colorOf(item)); button.append(...itemContent(item, item.id === selectedId));
    const protectedBySet = isGearSetProtected(state, item.id);
    let comparison = '';
    if (Object.hasOwn(item, 'soulbound')) button.append(node('span', 'lock-indicator', '永久'));
    else if (protectedBySet) button.append(node('span', 'lock-indicator', '配裝'));
    else if (item.locked) button.append(node('span', 'lock-indicator', '鎖'));
    else {
      comparison = powerComparisonText(item, state.equipment[item.slot]);
      if (comparison) {
        const marker = node('span', 'item-score-marker', comparison);
        marker.title = comparison === '異路線' ? '武器路線不同；屬性評分不含特效效益，不能視為直接升級。' : '屬性評分較高；不含特效效益，不保證更適合目前配裝。';
        button.append(marker);
      }
    }
    button.setAttribute('aria-label', [itemAccessibleName(item), protectedBySet ? '配裝保護中' : '', comparison, item.id === selectedId ? '比較中' : ''].filter(Boolean).join('，'));
    button.setAttribute('aria-pressed', String(item.id === selectedId));
    button.addEventListener('click', () => { selectedId = item.id; selectedSlot = null; render(true); });
    const row = node('div', 'inventory-entry');
    const label = node('label', 'selected-sale-check');
    const check = node('input'); check.type = 'checkbox'; check.checked = selectedSaleIds.has(item.id);
    check.setAttribute('aria-label', `選取出售：${item.name}（ID：${item.id}）`);
    check.disabled = !tabOwner || state.mode !== 'town' || Object.hasOwn(item, 'soulbound') || isGearSetProtected(state,item.id) || !previewSelectedSale(state, [item.id]).available;
    selectedSaleCheckboxes.set(item.id, check);
    check.addEventListener('change', () => toggleSelectedSale(item.id, check.checked));
    label.append(check, node('span', '', '選售')); row.append(button, label); return row;
  }));
}
// Overflow is a separate FIFO queue, never a hidden part of the sale selection.
function renderPendingLoot() {
  comparisonButtons.pending.clear();
  const view = pendingLootView(state), panel = $('pending-loot');
  panel.hidden = view.count === 0;
  const needed = Math.max(0, state.inventory.length + view.count - (INVENTORY_LIMIT - 5));
  $('pending-loot-summary').textContent = `待領 ${view.count} 件 · 背包 ${state.inventory.length}／${INVENTORY_LIMIT} 件 · 空位 ${view.freeSlots} 格。`;
  $('claim-pending').disabled = !tabOwner || !view.available;
  $('claim-pending').textContent = view.claimable ? `依序領入背包 ${view.claimable} 件` : '背包已滿，先整理裝備';
  $('pending-loot-status').textContent = !tabOwner ? '唯讀分頁：可以比較待領裝備；接手並回營後才能領取。'
    : state.mode !== 'town' ? '待領裝備已保留；請先回營，再整理或領取。'
    : view.freeSlots === 0 ? `背包已滿；請先比較，再自行選擇要整理的背包裝備。出售會自動依序補入待領品；要領完並保留 5 格出戰空間，共需自行整理 ${needed} 件背包裝備。`
    : `可領取前 ${view.claimable} 件，不會自動換裝或出售。${needed ? `要領完並保留 5 格出戰空間，共需自行整理 ${needed} 件背包裝備。` : '領完後已保留出戰所需 5 格空位。'}`;
  $('pending-loot-list').replaceChildren(...state.pendingLoot.map((item, index) => {
    const button = node('button', `inventory-card pending-loot-card${item.id === selectedId ? ' selected' : ''}`);
    button.dataset.pendingLootId = item.id; comparisonButtons.pending.set(item.id, button); button.style.setProperty('--item-color', colorOf(item));
    button.append(node('span', 'pending-loot-order', `${index + 1}`), ...itemContent(item, item.id === selectedId));
    button.setAttribute('aria-label', `第 ${index + 1} 件待領：${itemAccessibleName(item)}，ID：${item.id}，僅查看比較${item.id === selectedId ? '，比較中' : ''}`);
    button.setAttribute('aria-pressed', String(item.id === selectedId));
    button.addEventListener('click', () => { selectedId = item.id; selectedSlot = null; render(true); });
    return button;
  }));
}
function claimPendingLoot() {
  const view = pendingLootView(state);
  if (!tabOwner || state.mode !== 'town' || !view.available) { render(true); return; }
  const before = state.pendingLoot.length, selectedWasPending = state.pendingLoot.some(item => item.id === selectedId);
  if (!dispatch('claimPending')) return;
  const moved = before - state.pendingLoot.length;
  if (!(moved > 0)) return;
  if (selectedSaleConsent) abortSelectedSale('待領裝備已領入背包；請關閉後重新預覽。');
  showToast(`已依序領入 ${moved} 件；尚有 ${state.pendingLoot.length} 件待領。沒有出售、換裝或改變物品。`);
  if (selectedWasPending && state.inventory.some(item => item.id === selectedId)) $('item-detail').querySelector('.detail-name')?.focus?.();
  else if (!state.pendingLoot.length) $('slot-filter').focus();
}
function renderItemDetail() {
  detailActionButtons.clear();
  const inventoryItem = state.inventory.find(item => item.id === selectedId);
  const pending = !selectedSlot && !inventoryItem && state.pendingLoot.some(item => item.id === selectedId);
  const item = selectedSlot ? state.equipment[selectedSlot] : inventoryItem || state.pendingLoot.find(item => item.id === selectedId);
  if (!item) {
    const placeholder = node('div', 'detail-placeholder'); placeholder.append(node('h3', '', '裝備檢視'), node('p', '', '點選裝備查看屬性與差值；選售請用獨立勾選框。')); $('item-detail').replaceChildren(placeholder); return;
  }
  const restoreSoulbindFocus = document.activeElement?.dataset?.soulbindId === item.id;
  const restoreItemWorldFocus = document.activeElement?.dataset?.itemWorldId === item.id;
  const bound = Object.hasOwn(item, 'soulbound');
  const wrap = $('item-detail'); wrap.style.setProperty('--item-color', colorOf(item));
  // Native disclosure state belongs only to this exact inspected item, not saves.
  const previousRules = wrap.querySelector('.weapon-rule-details');
  const sameRuleItem = previousRules?.dataset?.weaponRuleId === item.id;
  const restoreRuleFocus = sameRuleItem && document.activeElement === previousRules.querySelector('summary');
  const current = state.equipment[item.slot];
  const quality = node('div', 'detail-quality', `${qualityName(item.quality)}${selectedSlot ? ' · 已裝備' : pending ? ' · 待領戰利品' : ''}${bound ? ' · 靈魂綁定' : ''}${item.itemWorld?.level === 1 ? ' · IW1' : ''}`);
  const name = node('h3', 'detail-name', item.name); name.tabIndex = -1;
  const subtitle = node('div', 'detail-subtitle', `${itemTypeName(item)} · Lv.${item.level} · 品質骰 ${Number(item.roll || 0).toFixed(0)} · 屬性評分 ${format(item.power)}${pending ? ` · ID：${item.id}` : ''}`);
  const description = node('p', 'detail-description', bound ? '已永久投入靈魂碎片；武器依原始綁定基準隨角色等級成長，沒有重新抽取屬性。' : describeItemFlavor(item) || '一件等待發揮力量的裝備。');
  const trait = node('div', 'weapon-trait');
  let ruleSummary;
  if (item.slot === 'weapon') {
    const family = resolveWeaponFamily(item);
    const fullTrait = describeWeaponTrait(item);
    const conciseTrait = {
      axe: '流血傷口：普攻有機會觸發，之後的 Tick 才造成無類型傷害。可疊層刷新，但重新快照也可能變弱；穿透護甲不增幅流血。',
      rapier: '穿透護甲：普攻有機會降低敵人的一般物理減傷，從後續物理攻擊生效；不是直接加傷，技能不會觸發。',
      club: '暈眩：普攻有機會暫停敵人行動、閃避與招架，仍可格擋。不能刷新；甦醒時會先行動，可能反擊致敗。',
    }[family];
    trait.append(node('strong', '', `武器路線 · ${weaponFamilyNames[family] || '未辨識'}`), node('p', 'weapon-trait-summary', conciseTrait || fullTrait));
    const ruleText = weaponRuleText(item);
    if (ruleText) {
      trait.append(node('p', 'weapon-trait-model muted', '採歷史特效模型；固定參數與自動戰鬥時序為本作改編，不等同原版當前規則。'));
      const rules = node('details', 'weapon-rule-details');
      rules.dataset.weaponRuleId = item.id;
      rules.open = Boolean(sameRuleItem && previousRules.open);
      ruleSummary = node('summary', 'weapon-rule-summary', '完整特效規則・觸發、公式與時序');
      rules.append(ruleSummary, node('p', 'weapon-trait-full', fullTrait), node('p', 'weapon-rule-full muted', ruleText));
      trait.append(rules);
    }
  } else trait.hidden = true;
  const table = node('div', 'compare-table');
  const tableHeading = node('div', 'compare-heading'); tableHeading.append(node('span', '', '屬性'), node('span', '', selectedSlot ? '目前裝備' : '現穿 → 選取'), node('span', '', selectedSlot ? '差值' : '比現穿')); table.append(tableHeading);
  const keys = new Set([...Object.keys(item.stats || {}), ...Object.keys(current?.stats || {})]);
  for (const key of keys) {
    if (!statNames[key]) continue;
    const value = Number(item.stats?.[key]) || 0, old = Number(current?.stats?.[key]) || 0, diff = value - old;
    const display = rateStats.has(key) ? `${(value * 100).toFixed(1)}%` : key === 'parry' ? value.toFixed(1) : format(value);
    const delta = selectedSlot || Math.abs(diff) < .0001 ? '—' : `${diff > 0 ? '+' : ''}${rateStats.has(key) ? `${(diff * 100).toFixed(1)}%` : key === 'parry' ? diff.toFixed(1) : Math.round(diff)}`;
    const oldDisplay = rateStats.has(key) ? `${(old * 100).toFixed(1)}%` : key === 'parry' ? old.toFixed(1) : format(old);
    const row = node('div', 'compare-row'); row.append(node('span', '', statNames[key]), node('strong', '', selectedSlot ? display : `${oldDisplay} → ${display}`), node('span', `delta ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`, delta)); table.append(row);
  }
  const explanation = node('p', 'muted', `${selectedSlot ? '這件裝備正陪伴你的旅程。' : '中欄為現穿 → 選取，右側為同部位裝備差值。招架值是裝備評級，不是機率百分比；未列時為 0。'}屬性評分不含流血、穿透護甲、暈眩等特效效益，不是 DPS；跨武器路線不能只依高分換裝。`);
  const actions = node('div', 'detail-actions');
  if (!selectedSlot && !pending) {
    const equip = node('button', 'primary-button', state.mode === 'battle' ? '回營後換裝' : '換上裝備'); equip.disabled = state.mode === 'battle' || !tabOwner; equip.addEventListener('click', () => { if (!dispatch('equip', item.id)) return; selectedId = null; showToast(`已裝備「${item.name}」`); render(true); });
    const protectedBySet = isGearSetProtected(state,item.id);
    const lock = node('button', 'secondary-button', bound ? '永久綁定' : protectedBySet ? '配裝保護中' : item.locked ? '解鎖' : '鎖定'); lock.disabled = state.mode === 'battle' || !tabOwner || protectedBySet || bound; lock.addEventListener('click', () => { if (!Object.hasOwn(item, 'soulbound')) dispatch('lock', item.id); });
    const sell = node('button', 'secondary-button', '出售'); sell.disabled = !tabOwner || bound || item.locked || isGearSetProtected(state,item.id) || state.mode === 'battle'; sell.addEventListener('click', () => { if (Object.hasOwn(item, 'soulbound')) return; dispatch('sell', item.id); selectedId = null; render(true); }); actions.append(equip, lock, sell);
    for (const [action, button] of [['equip', equip], ['lock', lock], ['sell', sell]]) detailActionButtons.set(action, { id: item.id, button });
  }
  if (pending) explanation.append(node('span', 'pending-loot-detail', '待領裝備只供比較，不占背包顯示件數，也不受背包篩選影響。領入背包前不能換裝、鎖定、出售、綁定或挑戰裝備界；領取依取得先後順序，不會跳過前面的裝備。'));
  if (!selectedSlot && !pending && !inventoryMatchesFilters(item, inventoryFilters())) explanation.append(node('span', 'inventory-detail-hidden', '正在比較的這件裝備位於背包篩選外；選取仍保留，篩選不會自動換裝或出售。'));
  if (bound) explanation.append(node('span', 'soulbind-protection', `永久綁定：不能解除、解鎖或出售（包含安全整理、自選出售）。清除配裝記錄也不會解除保護；${pending ? '領入背包後才可換裝。' : '可以正常換裝。'}`));
  else if (isGearSetProtected(state,item.id)) explanation.append(node('span','gear-set-protection','此裝備被配裝記錄使用，不能解鎖或出售。先清除或覆寫所有使用它的配裝，再手動解鎖；不會自動解鎖。'));
  const soulbind = node('div', 'soulbind-item-action');
  let bindButton;
  if (item.slot === 'weapon' && !bound && !pending) {
    const preview = previewSoulbindWeapon(state, item.id);
    bindButton = node('button', 'secondary-button', '預覽靈魂綁定');
    bindButton.dataset.soulbindId = item.id;
    bindButton.setAttribute('aria-haspopup', 'dialog');
    bindButton.disabled = !tabOwner || state.mode !== 'town' || !preview.before || !preview.after;
    bindButton.addEventListener('click', () => openSoulbindWeapon(item.id));
    const reason = !tabOwner ? '唯讀分頁：接手後才能綁定。' : state.mode !== 'town' ? '請先回營；戰鬥與戰敗時不能綁定。' : !preview.available ? preview.reason : `品質費用 ${format(preview.cost)} 靈魂碎片；預覽不扣除、不自動綁定。`;
    soulbind.append(bindButton, node('p', 'muted', reason));
  }
  const itemWorld = node('div', 'item-world-item-action');
  let itemWorldButton;
  if (item.slot === 'weapon' && resolveWeaponFamily(item) && !pending) {
    const preview = previewItemWorld(state, item.id);
    itemWorldButton = node('button', 'secondary-button', item.itemWorld?.level === 1 ? 'IW1 已完成' : '預覽 Item World · IW1');
    itemWorldButton.dataset.itemWorldId = item.id;
    itemWorldButton.setAttribute('aria-haspopup', 'dialog');
    itemWorldButton.disabled = !tabOwner || state.mode !== 'town' || !preview.before || !preview.after || item.itemWorld?.level === 1;
    itemWorldButton.addEventListener('click', () => openItemWorld(item.id));
    const reason = !tabOwner ? '唯讀分頁：接手並回營後才能挑戰。' : state.mode !== 'town' ? '請先回營後預覽武器試煉。' : item.itemWorld?.level === 1 ? (item.quality === 'Exquisite' ? '原版 Exquisite 上限 IW15；本版只實作 IW1，IW2–15 尚未實作。' : '原版 Fair／Average／Superior 上限 IW10；本版只實作 IW1，IW2–10 尚未實作。') : !preview.available ? preview.reason : '1 世界之種 · 五回合 · 通關才獲永久 IW1；不自動換裝。';
    itemWorld.append(itemWorldButton, node('p', 'muted', reason));
  }
  const detailHeading = node('div', 'detail-item-heading');
  const identity = node('div', 'detail-identity'); identity.append(quality, name, subtitle);
  detailHeading.append(itemIcon(item), identity);
  wrap.replaceChildren(detailHeading, table, actions, explanation, description, trait, soulbind, itemWorld);
  if (restoreSoulbindFocus && bindButton && !bindButton.disabled) bindButton.focus();
  if (restoreItemWorldFocus && itemWorldButton && !itemWorldButton.disabled) itemWorldButton.focus();
  if (restoreRuleFocus && ruleSummary) ruleSummary.focus({ preventScroll: true });
}

// Soulbind is a one-item permanent investment, never an automatic policy.
function soulbindQuoteSignature(quote) {
  return JSON.stringify([quote, state.mode, state.stage, state.hero.level, state.soulFragments, state.equipment, state.inventory, state.pendingLoot, state.gearSets]);
}
function closeSoulbindWeapon() {
  soulbindConsent = null;
  $('soulbind-confirm').disabled = true;
  if ($('soulbind-dialog').open) $('soulbind-dialog').close();
}
function abortSoulbindWeapon(message) {
  soulbindConsent = null;
  $('soulbind-confirm').disabled = true;
  $('soulbind-feedback').textContent = `本次確認已取消。${message} 請核對碎片與裝備後重新預覽。`;
}
function reconcileSoulbindWeapon() {
  if (!soulbindConsent) return;
  if (!claimLease() || state.mode !== 'town') { abortSoulbindWeapon('控制權或營地狀態已改變，未執行綁定。'); return; }
  const fresh = previewSoulbindWeapon(state, soulbindConsent.quote.id);
  if (!fresh.available || soulbindConsent.signature !== soulbindQuoteSignature(fresh)) abortSoulbindWeapon('報價、碎片或裝備資料已改變，未執行綁定。');
}
function soulbindStat(value, rate = false) {
  const number = (Number(value) || 0) * (rate ? 100 : 1);
  return `${Number(number.toFixed(8)).toLocaleString('zh-TW', { maximumFractionDigits: 8 })}${rate ? '%' : ''}`;
}
function openSoulbindWeapon(id) {
  if (!claimLease() || state.mode !== 'town') { showToast('請在持有進度的分頁回營後，再預覽靈魂綁定。'); return; }
  // A second item cannot replace consent while the first item's dialog is open.
  if ($('soulbind-dialog').open) return;
  const quote = previewSoulbindWeapon(state, id);
  if (!quote.before || !quote.after) { showToast(quote.reason || '這件裝備目前不能靈魂綁定。'); return; }
  soulbindConsent = quote.available ? { quote: JSON.parse(JSON.stringify(quote)), signature: soulbindQuoteSignature(quote) } : null;
  $('soulbind-item-name').textContent = quote.before.name;
  $('soulbind-item-meta').textContent = `${qualityName(quote.before.quality)}（${quote.before.quality}） · ${itemTypeName(quote.before)} · ID：${quote.id}`;
  $('soulbind-level').textContent = `裝備等級：Lv.${quote.before.level} → Lv.${quote.after.level}（目前角色 Lv.${state.hero.level}）`;
  const heading = node('div', 'soulbind-stat-row soulbind-stat-heading');
  heading.append(...['武器屬性', '綁定前', '綁定後'].map(text => node('span', '', text)));
  $('soulbind-comparison').replaceChildren(heading, ...Object.entries(statNames).map(([key, label]) => {
    const row = node('div', 'soulbind-stat-row');
    row.append(node('span', '', label), node('span', '', soulbindStat(quote.before.stats?.[key], rateStats.has(key))), node('strong', '', soulbindStat(quote.after.stats?.[key], rateStats.has(key))));
    return row;
  }));
  $('soulbind-cost').textContent = `現有 ${format(state.soulFragments)} − 品質費用 ${format(quote.cost)} ＝ 綁定後 ${format(quote.fragmentsAfter)} 靈魂碎片`;
  $('soulbind-feedback').textContent = quote.available ? '尚未綁定或扣除碎片。取消不變更；確認只處理這件原有武器，不自動換裝。' : `目前不能綁定：${quote.reason} 尚未扣除碎片。`;
  $('soulbind-confirm').textContent = `確認永久綁定 · ${format(quote.cost)} 靈魂碎片`;
  $('soulbind-confirm').disabled = !quote.available;
  $('soulbind-dialog').showModal();
}
function confirmSoulbindWeapon() {
  if (!soulbindConsent || !$('soulbind-dialog').open) { soulbindConsent = null; $('soulbind-confirm').disabled = true; return; }
  reconcileSoulbindWeapon();
  if (!soulbindConsent) return;
  const quote = soulbindConsent.quote;
  const equippedSlot = Object.keys(state.equipment).find(slot => state.equipment[slot]?.id === quote.id);
  const inventoryIds = state.inventory.map(item => item.id).join('|');
  soulbindConsent = null; $('soulbind-confirm').disabled = true;
  const completed = dispatch('soulbindWeapon', quote);
  const bound = equippedSlot ? state.equipment[equippedSlot] : state.inventory.find(item => item.id === quote.id);
  const succeeded = completed && state.soulFragments === quote.fragmentsAfter && bound?.locked === true && bound?.soulbound && JSON.stringify(bound) === JSON.stringify(quote.after) && inventoryIds === state.inventory.map(item => item.id).join('|');
  if (!succeeded) { abortSoulbindWeapon('操作未確認完成，不能視為綁定成功。'); return; }
  closeSoulbindWeapon(); render(true);
  $('item-detail').querySelector('.detail-name')?.focus?.();
  showToast(`「${bound.name}」已永久靈魂綁定 · 消耗 ${format(quote.cost)} 靈魂碎片；不能解鎖或出售。`);
}
function renderSoulbindStatus() {
  reconcileSoulbindWeapon();
  $('soul-fragment-balance').textContent = `${format(state.soulFragments)} 靈魂碎片`;
  $('soulbind-status').textContent = !tabOwner ? '唯讀分頁：可查看，接手並回營後才能綁定。' : state.mode !== 'town' ? '回營後選取已裝備或背包中的武器，再預覽綁定。' : '選取已裝備或背包中的戰斧、刺劍或戰棍，再按「預覽靈魂綁定」；不會自動花費。';
}

// A first-tier challenge is a manual paid departure, never an automatic upgrade.
function itemWorldQuoteSignature(quote) {
  return JSON.stringify([quote, state.mode, state.stage, state.hero.level, state.worldSeeds, state.equipment, state.inventory, state.pendingLoot, state.gearSets]);
}
function closeItemWorld() {
  itemWorldConsent = null;
  $('item-world-confirm').disabled = true;
  if ($('item-world-dialog').open) $('item-world-dialog').close();
}
function abortItemWorld(message) {
  itemWorldConsent = null;
  $('item-world-confirm').disabled = true;
  $('item-world-feedback').textContent = `本次確認已取消。${message} 請重新預覽後再確認。`;
}
function reconcileItemWorld() {
  if (!itemWorldConsent) return;
  if (!claimLease() || state.mode !== 'town') { abortItemWorld('控制權或營地狀態已改變，未進入試煉。'); return; }
  const fresh = previewItemWorld(state, itemWorldConsent.quote.id);
  if (!fresh.available || itemWorldConsent.signature !== itemWorldQuoteSignature(fresh)) abortItemWorld('報價、世界之種或裝備資料已改變，未進入試煉。');
}
function openItemWorld(id) {
  if (!claimLease() || state.mode !== 'town') { showToast('請在持有進度的分頁回營後，再預覽 Item World。'); return; }
  if ($('item-world-dialog').open) return;
  const quote = previewItemWorld(state, id);
  if (!quote.before || !quote.after) { showToast(quote.reason || '這件裝備目前沒有已實作的 Item World 挑戰。'); return; }
  itemWorldConsent = quote.available ? { quote: JSON.parse(JSON.stringify(quote)), signature: itemWorldQuoteSignature(quote) } : null;
  $('item-world-item-name').textContent = quote.before.name;
  $('item-world-item-meta').textContent = `${qualityName(quote.before.quality)}（${quote.before.quality}） · ${itemTypeName(quote.before)} · ID：${quote.id}`;
  $('item-world-route').textContent = `${quote.rounds} 回合 · 出發 Lv.${state.hero.level} → 本作固定強度 ${quote.strengthStage}；不是原版 Lv100／Hard。`;
  const heading = node('div', 'soulbind-stat-row soulbind-stat-heading');
  heading.append(...['武器屬性', '現在', '通關後 · IW1'].map(text => node('span', '', text)));
  $('item-world-comparison').replaceChildren(heading, ...Object.entries(statNames).map(([key, label]) => {
    const row = node('div', 'soulbind-stat-row');
    row.append(node('span', '', label), node('span', '', soulbindStat(quote.before.stats?.[key], rateStats.has(key))), node('strong', '', soulbindStat(quote.after.stats?.[key], rateStats.has(key))));
    return row;
  }));
  $('item-world-cost').textContent = `現有 ${format(state.worldSeeds)} − 入場費 ${format(quote.cost)} ＝ 入場後 ${format(quote.seedsAfter)} 世界之種`;
  $('item-world-feedback').textContent = quote.available ? '尚未扣種子。取消不變更；確認後立即入場，不自動換裝。' : `目前不能入場：${quote.reason} 尚未扣種子。`;
  $('item-world-confirm').textContent = `確認消耗 ${format(quote.cost)} 世界之種並入場`;
  $('item-world-confirm').disabled = !quote.available;
  $('item-world-dialog').showModal();
}
function confirmItemWorld() {
  if (!itemWorldConsent || !$('item-world-dialog').open) { itemWorldConsent = null; $('item-world-confirm').disabled = true; return; }
  reconcileItemWorld();
  if (!itemWorldConsent) return;
  const quote = itemWorldConsent.quote;
  const equipmentIds = Object.values(state.equipment).map(item => item.id).join('|');
  const inventoryIds = state.inventory.map(item => item.id).join('|');
  itemWorldConsent = null; $('item-world-confirm').disabled = true;
  const completed = dispatch('enterItemWorld', quote);
  const trial = itemWorldView(state);
  const succeeded = completed && state.mode === 'battle' && trial.active && trial.targetId === quote.id && state.worldSeeds === quote.seedsAfter && equipmentIds === Object.values(state.equipment).map(item => item.id).join('|') && inventoryIds === state.inventory.map(item => item.id).join('|');
  if (!succeeded) { abortItemWorld('操作未確認完成，不能視為入場成功。'); return; }
  closeItemWorld(); render(true);
  $('retreat-button').focus();
  showToast(`已進入「${quote.before.name}」IW1 試煉 · 消耗 ${format(quote.cost)} 世界之種；完成五回合才獲成長。`);
}
function renderItemWorldStatus() {
  reconcileItemWorld();
  $('world-seed-balance').textContent = `${format(state.worldSeeds)} 世界之種`;
  const trial = itemWorldView(state);
  $('item-world-status').textContent = trial.active ? `試煉中：${trial.targetName} · 第 ${trial.round}／${trial.rounds} 回合；結束必回營。` : '已綁定的 Fair／Average／Superior／Exquisite 戰斧／刺劍／戰棍可預覽 IW1；已裝備或背包皆可，本版只實作首階。';
}

// Entire scene is independently drawn with canvas primitives; no external assets.
const canvas = $('battle-canvas'), ctx = canvas.getContext('2d');
let sceneWidth = 640, sceneHeight = 360;
function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  sceneWidth = Math.max(320, Math.round(bounds.width / 2)); sceneHeight = Math.max(160, Math.round(bounds.height / 2));
  canvas.width = sceneWidth; canvas.height = sceneHeight;
}
const resizeObserver = new ResizeObserver(resizeCanvas); resizeObserver.observe(canvas);
function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function polygon(points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); }
function drawHero(x, y, t) {
  const fighting = state.mode === 'battle' && state.enemies.length > 0;
  const defeated = state.hero?.hp <= 0;
  const pulse = prefs.reducedMotion || defeated ? 0 : attackPulse;
  const bob = prefs.reducedMotion || defeated ? 0 : Math.sin(t * 3) * 1;
  const family = resolveWeaponFamily(state.equipment?.weapon);
  ctx.save(); ctx.translate(x + pulse * 5, y + bob);
  ctx.fillStyle = '#06161d70'; ctx.beginPath(); ctx.ellipse(0, 3, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (defeated) ctx.globalAlpha = .45;
  // Short travel cape, separated legs and layered kit; no armor/stat inference.
  polygon([[-10,-29],[-4,-31],[4,-24],[2,-4],[-8,-3],[-14,-7],[-11,-12]], '#1c343b');
  polygon([[-10,-27],[-5,-28],[-6,-8],[-11,-7],[-9,-16]], '#416561');
  rect(-6,-10,5,13,'#26333b'); rect(3,-10,5,14,'#34434a');
  rect(-6,-7,2,8,'#526162'); rect(4,-6,2,8,'#71807a');
  rect(-8,2,8,5,'#14242c'); rect(2,3,10,4,'#14242c');
  rect(-7,2,6,1,'#7b8274'); rect(4,3,6,1,'#929583');
  polygon([[-7,-28],[2,-31],[10,-26],[9,-14],[5,-9],[-5,-10],[-8,-18]], '#263f47');
  polygon([[-5,-27],[2,-29],[7,-25],[6,-18],[-4,-17]], '#718b83');
  polygon([[-4,-25],[1,-27],[5,-24],[4,-20],[-3,-20]], '#9eafa0');
  rect(-5,-16,12,3,'#9b7c50'); rect(1,-16,3,3,'#d6ba7e');
  rect(-5,-12,4,4,'#526c65'); rect(2,-12,5,4,'#637a70');
  rect(-4,-37,12,10,'#8c7155'); rect(0,-36,8,8,'#d2b186');
  rect(5,-33,2,2,'#17282d'); rect(7,-30,2,2,'#aa8766');
  polygon([[-7,-36],[-7,-42],[-3,-46],[5,-46],[10,-41],[10,-36],[5,-38],[-2,-37]], '#28434a');
  polygon([[-5,-41],[-2,-44],[4,-44],[7,-41],[7,-39],[-3,-40]], '#738e83');
  rect(-5,-41,2,8,'#4b6b65'); rect(-1,-40,9,2,'#b3bca4');
  polygon([[-6,-28],[0,-26],[7,-28],[7,-25],[1,-23],[-6,-25]], '#a48a5d');
  // The small hand guard is costume, not an additional equipment/stat slot.
  polygon([[-11,-25],[-5,-24],[-4,-14],[-8,-10],[-13,-14],[-14,-22]], '#293c43');
  polygon([[-11,-23],[-7,-22],[-6,-15],[-8,-13],[-11,-16]], '#677d73');
  rect(-10,-21,2,6,'#afac88'); rect(-10,-18,3,2,'#d0bd8d');
  rect(7,-25,5,8,'#3b5556'); rect(9,-22,4,5,'#c2a17a');
  ctx.save(); ctx.translate(12,-22); ctx.rotate(pulse * 1.6 - .4);
  // Finite, independently drawn weapon shapes follow the equipped family only.
  if (family === 'axe') {
    rect(-1,-22,3,30,'#795a40'); rect(0,-20,1,25,'#b79967');
    polygon([[-2,-23],[4,-26],[11,-24],[12,-15],[8,-12],[3,-15],[-2,-15]], '#263c45');
    polygon([[2,-23],[6,-24],[10,-22],[10,-16],[7,-14],[3,-17]], '#93a9a2');
    polygon([[8,-23],[10,-22],[10,-16],[7,-14],[8,-18]], '#d0d9bb');
    rect(-2,-21,5,4,'#b9a36d'); rect(-2,3,5,3,'#3b3830');
  } else if (family === 'rapier') {
    polygon([[0,0],[-1,-24],[1,-29],[2,-24],[2,0]], '#d3ddc4');
    rect(1,-23,1,20,'#8fa8a5'); rect(-5,-1,11,2,'#c7aa72');
    polygon([[-4,0],[-5,4],[-2,8],[3,7],[5,3],[4,0],[2,2],[2,5],[-1,5],[-2,2]], '#9b895f');
    rect(0,1,2,7,'#5e4434'); rect(-1,8,4,2,'#cfb982');
  } else if (family === 'club') {
    rect(-1,-14,3,23,'#8a6545'); rect(0,-11,1,17,'#b29564');
    polygon([[-3,-27],[3,-29],[7,-25],[6,-14],[2,-10],[-3,-13],[-5,-22]], '#39494c');
    polygon([[-2,-24],[2,-26],[4,-23],[3,-15],[0,-13],[-2,-16]], '#8b9686');
    rect(-4,-23,10,3,'#bdad7b'); rect(-3,-16,8,3,'#66776d');
    rect(-2,4,5,3,'#3d3930');
  } else {
    // Starter/unsupported family remains a neutral sword, never a proc claim.
    polygon([[-2,-21],[0,-26],[3,-21],[3,0],[-2,0]], '#9baea6');
    rect(0,-21,1,20,'#d3dac0'); rect(-5,0,12,3,'#b49b6c');
    rect(0,3,3,7,'#70543c'); rect(-1,9,5,2,'#aaa27c');
  }
  ctx.restore();
  if (fighting && pulse > .25) { ctx.strokeStyle = '#dcf6d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(15,-23,20,-1,.9); ctx.stroke(); }
  ctx.restore();
}
function drawEnemy(enemy, x, y, index, t) {
  const boss = enemy.boss;
  const role = enemyRolePresentation(enemy);
  const defeated = enemy.hp <= 0;
  const pulse = prefs.reducedMotion || defeated ? 0 : enemyPulse;
  const bob = prefs.reducedMotion || defeated ? 0 : Math.sin(t * 2 + index * 2) * 2;
  ctx.save(); ctx.translate(x - pulse * 4, y + bob); const size = boss ? 1.5 : 1; ctx.scale(size,size);
  ctx.fillStyle = '#06161d70'; ctx.beginPath(); ctx.ellipse(0,4,18,4,0,0,Math.PI*2); ctx.fill();
  // Original stepped silhouettes. Species is cosmetic, never a defense lookup:
  // early-route beetles retain their shell while the live role label says baseline.
  if (defeated) { ctx.translate(0,4); ctx.scale(1,.28); ctx.globalAlpha = .45; }
  const eye = defeated ? '#39444a' : '#e2c58d';
  if (boss) {
    // A walking broken gate: two stone uprights frame a recessed face and rift.
    polygon([[-20,-38],[-17,-45],[-10,-45],[-9,-37],[9,-37],[10,-45],[17,-45],[20,-38],[18,-16],[-18,-16]], '#34363e');
    rect(-17,-42,6,20,'#776770'); rect(11,-42,6,20,'#776770');
    rect(-16,-42,2,16,'#b19a91'); rect(12,-42,2,15,'#aa9087');
    rect(-12,-37,24,5,'#958077'); rect(-11,-37,22,1,'#c7b18f');
    polygon([[-18,-23],[-10,-27],[-8,-15],[-11,-5],[-20,-6],[-21,-16]], '#51515a');
    polygon([[10,-27],[18,-23],[21,-16],[20,-6],[11,-5],[8,-15]], '#55515b');
    rect(-18,-20,4,11,'#8d7c7c'); rect(14,-19,4,10,'#a08a80');
    polygon([[-10,-29],[-6,-33],[6,-33],[10,-29],[9,-12],[5,-7],[-6,-7],[-10,-13]], '#79666b');
    polygon([[-7,-26],[0,-29],[7,-26],[6,-16],[1,-11],[-6,-15]], '#a17d78');
    polygon([[0,-28],[3,-24],[1,-20],[4,-17],[0,-12],[-2,-18],[-1,-22],[-3,-25]], '#283a43');
    rect(0,-23,1,5,'#d4b77d'); rect(0,-15,2,2,'#d4b77d');
    rect(-6,-32,12,5,'#283239'); rect(-5,-31,3,1,eye); rect(2,-31,3,1,eye);
    polygon([[-10,-11],[-2,-9],[-3,4],[-14,4],[-14,0]], '#393c45');
    polygon([[2,-9],[10,-11],[14,0],[14,4],[3,4]], '#3c3d46');
    rect(-11,-7,6,8,'#7d7476'); rect(5,-7,6,8,'#8d7977');
    rect(-14,2,11,3,'#b19b8b'); rect(3,2,11,3,'#ad9685');
  } else if (enemy.name === '灰霧獵犬') {
    // Long muzzle, pointed ears, four separated paws and an upturned short tail.
    polygon([[-9,-18],[-3,-18],[-2,-7],[-4,2],[-9,2],[-7,-7]], '#303f49');
    polygon([[7,-17],[12,-17],[15,-5],[12,3],[7,3],[9,-6]], '#303f49');
    polygon([[10,-20],[16,-22],[18,-29],[21,-26],[20,-18],[13,-12]], '#475964');
    polygon([[-13,-24],[-5,-25],[1,-21],[12,-22],[17,-15],[13,-7],[-3,-8],[-13,-13]], '#46535f');
    polygon([[-9,-23],[-3,-23],[2,-19],[11,-20],[13,-16],[9,-12],[-4,-13]], '#7c8c91');
    polygon([[-14,-21],[-16,-32],[-11,-29],[-9,-25],[-5,-28],[-5,-19],[-11,-14],[-21,-16],[-23,-21]], '#46535f');
    polygon([[-16,-24],[-10,-25],[-9,-21],[-15,-18],[-21,-19],[-21,-21]], '#9eaaa5');
    rect(-22,-22,4,3,'#202e38'); rect(-13,-25,2,2,eye);
    polygon([[-13,-15],[-7,-13],[-8,-4],[-10,4],[-16,4],[-16,1],[-13,-2]], '#596c74');
    polygon([[9,-12],[15,-12],[15,-5],[12,-1],[13,4],[7,4],[7,1],[10,-6]], '#627780');
    rect(-15,2,5,2,'#9da69c'); rect(8,2,5,2,'#a7afa1');
    rect(-4,-18,8,2,'#b4bab0'); rect(-9,-14,2,5,'#9aa79f');
  } else if (enemy.name === '碎晶甲蟲') {
    // Three far legs and three near legs, then a split, faceted carapace.
    polygon([[-11,-19],[-18,-17],[-21,-9],[-18,-9],[-15,-14],[-9,-15]], '#394a50');
    polygon([[-1,-20],[-3,-7],[-7,-2],[-4,0],[1,-5],[4,-18]], '#394a50');
    polygon([[9,-20],[18,-16],[21,-8],[18,-7],[14,-13],[7,-15]], '#394a50');
    polygon([[-16,-18],[-11,-29],[-3,-33],[9,-30],[16,-22],[16,-12],[10,-7],[-6,-6],[-15,-10]], '#334750');
    polygon([[-12,-19],[-8,-27],[-2,-30],[0,-22],[-3,-10],[-10,-10]], '#8b9c9a');
    polygon([[1,-29],[8,-27],[13,-20],[12,-12],[5,-10],[-1,-10],[2,-21]], '#5c7d80');
    polygon([[-7,-26],[-3,-33],[1,-27],[-1,-20]], '#b8c3ae');
    polygon([[4,-23],[8,-28],[12,-22],[8,-17]], '#a4b7a7');
    rect(0,-23,2,15,'#263f49'); rect(8,-14,3,2,'#b5bfa8');
    polygon([[-14,-19],[-20,-18],[-23,-13],[-20,-8],[-13,-9],[-10,-14]], '#526d71');
    rect(-21,-15,2,2,eye);
    polygon([[-21,-10],[-24,-8],[-23,-5],[-18,-6],[-16,-9]], '#b2bba1');
    polygon([[-11,-12],[-17,-6],[-19,2],[-15,3],[-14,-3],[-8,-8]], '#8b9b91');
    polygon([[0,-10],[-1,-3],[-5,3],[-1,5],[3,0],[4,-8]], '#9aaa98');
    polygon([[10,-11],[17,-6],[19,2],[15,3],[13,-3],[7,-8]], '#8c9f94');
  } else if (enemy.name === '荒野影獸') {
    // Low feline haunches and a long hooked tail distinguish it from the hound.
    polygon([[7,-16],[15,-19],[17,-26],[13,-30],[18,-30],[21,-26],[20,-18],[13,-11]], '#52636b');
    polygon([[-10,-11],[-4,-10],[-7,-2],[-13,3],[-18,3],[-17,0],[-11,-3]], '#293944');
    polygon([[6,-13],[12,-12],[11,-4],[17,1],[16,3],[10,3],[5,-3]], '#293944');
    polygon([[-14,-20],[-5,-20],[1,-17],[9,-20],[14,-15],[13,-7],[3,-7],[-5,-11],[-14,-12]], '#3d4859');
    polygon([[-7,-18],[-2,-18],[3,-15],[8,-18],[12,-14],[10,-10],[1,-11]], '#65717d');
    polygon([[-18,-21],[-17,-28],[-12,-24],[-8,-25],[-6,-19],[-11,-13],[-19,-14],[-22,-18]], '#444e60');
    polygon([[-17,-21],[-13,-22],[-10,-19],[-14,-16],[-19,-17]], '#7a8990');
    rect(-19,-20,3,1,eye); rect(-22,-18,3,2,'#1c303a');
    polygon([[-11,-12],[-7,-11],[-10,-5],[-18,4],[-22,4],[-20,1],[-15,-2]], '#60727b');
    polygon([[6,-12],[11,-10],[7,-3],[13,2],[12,4],[5,4],[1,-2]], '#6a7b83');
    rect(-21,2,5,1,'#a4b8ac'); rect(6,2,5,1,'#9eb2a7');
    polygon([[-4,-16],[2,-14],[6,-15],[5,-13],[1,-12]], '#a2b6ac');
  } else if (enemy.name === '赤砂守衛') {
    const caster = enemy.attackPattern === 'alternating';
    // Staff ornament denotes capability only; existing text owns next-action truth.
    rect(15,-33,2,37,'#775e45'); rect(15,-29,1,29,'#b09a6b');
    if (caster) {
      polygon([[12,-36],[14,-41],[17,-43],[20,-39],[19,-35],[16,-32]], '#364a51');
      polygon([[14,-38],[17,-41],[19,-38],[16,-34]], '#bdbd95');
      rect(11,-37,2,6,'#ae8a5d'); rect(19,-37,2,6,'#ae8a5d'); rect(13,-32,6,2,'#bc9b69');
    } else {
      polygon([[14,-34],[14,-40],[16,-43],[19,-39],[18,-34]], '#9ba79b');
      rect(13,-34,6,2,'#6c796f');
    }
    rect(-6,-10,5,13,'#32393e'); rect(3,-10,5,13,'#333a40');
    rect(-8,2,8,3,'#1e2c34'); rect(3,2,9,3,'#1e2c34');
    polygon([[-8,-29],[0,-32],[9,-27],[10,-16],[8,-4],[1,-8],[-5,-5],[-10,-10]], '#594642');
    polygon([[-6,-26],[-1,-29],[5,-25],[4,-16],[7,-7],[1,-10],[-4,-8]], '#a4755c');
    rect(-5,-17,13,3,'#c0a46d'); rect(1,-16,2,8,'#d1b780');
    polygon([[-6,-38],[-3,-44],[5,-43],[9,-37],[8,-30],[-5,-30]], '#40474a');
    polygon([[-4,-39],[-1,-42],[4,-41],[6,-37],[-4,-36]], '#a28b71');
    rect(-5,-36,11,2,'#c1b28b'); rect(-4,-33,3,1,eye); rect(2,-33,3,1,eye);
    rect(-3,-31,7,3,'#775b4a'); rect(7,-28,5,9,'#7f6351'); rect(11,-22,5,4,'#bda17b');
    polygon([[-17,-26],[-10,-29],[-4,-25],[-5,-11],[-11,-6],[-18,-12]], '#283b43');
    polygon([[-15,-24],[-10,-26],[-6,-23],[-7,-13],[-11,-9],[-15,-14]], '#957d60');
    polygon([[-13,-23],[-10,-24],[-8,-22],[-9,-14],[-11,-12],[-13,-15]], '#b5a67d');
    rect(-12,-21,2,7,'#485451');
  } else {
    // Unknown names never inherit a species from role/name substrings.
    polygon([[-9,-25],[-4,-30],[6,-29],[12,-23],[11,-9],[5,-4],[-7,-5],[-12,-13]], '#394d56');
    polygon([[-6,-23],[0,-27],[7,-23],[6,-11],[-3,-8],[-7,-14]], '#718880');
    rect(-6,-36,13,11,'#3b4b52'); rect(-4,-35,9,3,'#9da68e'); rect(-3,-30,2,2,eye); rect(3,-30,2,2,eye);
    rect(-8,-7,6,12,'#31434b'); rect(4,-7,6,12,'#31434b'); rect(-9,3,8,2,'#869589'); rect(3,3,8,2,'#869589');
    // Preserve explicit role-only marks for future/unknown enemy identities.
    if (role.id === 'armored') {
      polygon([[-15,-23],[-8,-26],[-3,-21],[-5,-11],[-10,-7],[-16,-12]], '#a4b6ad');
      polygon([[-13,-21],[-8,-23],[-5,-20],[-7,-12],[-10,-10],[-13,-13]], '#536e72');
      rect(-10,-20,2,8,'#d2c99f');
    } else if (role.id === 'agile') {
      polygon([[6,-24],[17,-29],[12,-21],[20,-23],[11,-16]], '#89aaa0');
      rect(-6,-18,15,2,'#a6b7a1');
    }
  }
  ctx.restore();
  // Compact nameplates are screen-space overlays, never part of the animated body.
  // Keep exact defenses/role and longer explanations in the existing DOM cards.
  const tick = state.timing?.ticks || 0;
  const status = !defeated && penetratedArmorStatus(enemy, tick);
  const stun = !defeated && stunStatus(enemy, tick);
  const bleed = !defeated && bleedStatus(enemy, tick);
  const targeted = !defeated && enemy.id === targetPriorityView(state).targetId;
  const effects = [];
  if (status) effects.push({ text: `PA ${status.stacks} · ${status.ticksRemaining}T`, color: '#abe4d8' });
  if (stun) effects.push({ text: stun.recoveryPending ? 'READY' : `STUN ${stun.ticksRemaining}T`, color: stun.recoveryPending ? '#f3bd91' : '#ddd0ff' });
  if (bleed) effects.push({ text: `BW ${bleed.stacks} · ${bleed.ticksRemaining}T`, color: '#ffb6bb', droplet: true });
  const width = boss ? 116 : 76;
  const effectRows = (boss ? [effects] : [effects.filter(effect => !effect.droplet), effects.filter(effect => effect.droplet)]).filter(row => row.length);
  const height = 32 + effectRows.length * 10;
  const viewportWidth = typeof sceneWidth === 'number' ? sceneWidth : 320;
  // The normal two-enemy formation leaves a central lane for damage numbers.
  // This is a fixed screen-space offset, not a pulse, attack prediction or state.
  const shift = !boss && (state.enemies?.length || 0) > 1 ? (x < viewportWidth * .73 ? -18 : 4) : 0;
  const left = Math.round(Math.max(4, Math.min(viewportWidth - width - 4, x + shift - width / 2)));
  const top = Math.round(Math.max(4, y - (boss ? 115 : 105)));
  const hp = Number.isFinite(Number(enemy.hp)) ? Number(enemy.hp) : 0;
  const maxHp = Number.isFinite(Number(enemy.maxHp)) ? Math.max(1, Number(enemy.maxHp)) : 1;
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  const hpPercent = ratio > 0 && ratio < .01 ? '<1' : ratio < 1 && ratio >= .995 ? '<100' : Math.round(ratio * 100);
  ctx.save();
  if (targeted) {
    ctx.strokeStyle = '#e8ca82'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y + 6, boss ? 25 : 18, 5, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Opaque backing removes the moon/forest from the glyph contrast calculation.
  rect(left, top, width, height, targeted ? '#bda66f' : '#617474');
  rect(left + 1, top + 1, width - 2, height - 2, '#0d191f');
  ctx.textAlign = 'center'; ctx.font = '600 8px system-ui';
  ctx.fillStyle = defeated ? '#9eaaa8' : '#f1eee1';
  ctx.fillText(enemy.name, left + width / 2, top + 11, width - 10);
  ctx.textAlign = 'left'; ctx.font = '7px system-ui'; ctx.fillStyle = '#c9d9d2';
  ctx.fillText(`HP ${hpPercent}%`, left + 5, top + 22, width / 2 - 7);
  if (targeted) {
    ctx.textAlign = 'right'; ctx.font = '600 6.5px system-ui'; ctx.fillStyle = '#f0dba4';
    ctx.fillText('▼ 集火', left + width - 5, top + 22, width / 2 - 7);
  }
  rect(left + 5, top + 25, width - 10, 3, '#354447');
  rect(left + 5, top + 25, (width - 10) * ratio, 3, boss ? '#d29a76' : '#b4a778');
  ctx.font = '600 6.5px system-ui'; ctx.textAlign = 'center';
  effectRows.forEach((row, rowIndex) => {
    const cellWidth = (width - 12 - (row.some(effect => effect.droplet) ? 8 : 0)) / row.length;
    row.forEach((effect, column) => {
      const cellLeft = left + 6 + column * cellWidth;
      const baseline = top + 38 + rowIndex * 10;
      ctx.fillStyle = effect.color;
      ctx.fillText(effect.text, cellLeft + cellWidth / 2, baseline, cellWidth - 2);
      // Fixed in-plate droplet: recognizable without animation or color, never outside bounds.
      if (effect.droplet) {
        const dx = cellLeft + cellWidth + 4;
        polygon([[dx, baseline - 6], [dx - 2, baseline - 2], [dx, baseline], [dx + 2, baseline - 2]], effect.color);
      }
    });
  });
  ctx.restore();
}
function drawScene(t, dt) {
  const w = sceneWidth, h = sceneHeight;
  // Original woodland stage: a quiet clearing framed by broadleaf trunks, not a repeated icon forest.
  // Normalised landscape coordinates preserve the combat lane at every canvas size.
  const land = (points, color) => polygon(points.map(([x, y]) => [x * w, y * h]), color);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#172d32'); sky.addColorStop(.52, '#50675e'); sky.addColorStop(1, '#243a35');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // Receding trunks are low contrast; their uneven fork heights leave a light central opening.
  for (const [x, base, width, fork, lean] of [
    [.08,.68,.013,.19,.018], [.18,.66,.009,.12,-.02], [.29,.65,.011,.26,.015],
    [.38,.64,.007,.09,-.012], [.54,.64,.006,.2,.01], [.63,.65,.009,.13,-.015],
    [.78,.67,.012,.24,.02], [.88,.68,.01,.08,-.014], [.97,.69,.014,.18,.01]
  ]) {
    land([[x-width,base],[x-width*.45,fork],[x+lean,0],[x+lean+width*.45,0],[x+width*.35,fork],[x+width,base]], '#3b564f');
    land([[x,fork+.1],[x-.035,fork-.025],[x-.055,fork-.08],[x-.042,fork-.074],[x+.005,fork+.015]], '#3b564f');
  }
  // A translucent horizontal veil softens distant branches, without moving the background.
  const mist = ctx.createLinearGradient(0, h*.28, 0, h*.74);
  mist.addColorStop(0, '#78867500'); mist.addColorStop(.62, '#8b998137'); mist.addColorStop(1, '#78867500');
  ctx.fillStyle = mist; ctx.fillRect(0, h*.28, w, h*.46);
  land([[0,.64],[.16,.61],[.3,.65],[.48,.62],[.65,.65],[.83,.61],[1,.65],[1,1],[0,1]], '#263e35');
  // The worn trail recedes into the clearing; broad unmarked earth sits under all actors.
  land([[.47,.61],[.53,.61],[.59,.69],[.7,.77],[1,.92],[1,1],[0,1],[0,.94],[.28,.8],[.4,.69]], '#4a5846');
  land([[.48,.63],[.52,.63],[.56,.71],[.65,.8],[.88,.94],[.97,1],[.12,1],[.36,.83],[.45,.71]], '#58604c');
  // Crooked side trunks and forked limbs frame rather than cross the hero/enemy lane.
  land([[0,.84],[.035,.79],[.052,.6],[.048,.34],[.025,.09],[.003,0],[.056,0],[.076,.28],[.077,.56],[.069,.75],[.11,.84],[.064,.82],[.043,.86]], '#1a302b');
  land([[.048,.35],[.115,.21],[.15,.08],[.166,.06],[.135,.22],[.069,.43]], '#1a302b');
  land([[.052,.73],[.061,.54],[.058,.31],[.043,.11],[.049,.1],[.069,.31],[.069,.56],[.061,.76]], '#314a39');
  land([[1,.84],[.96,.8],[.946,.62],[.95,.38],[.974,.16],[.963,0],[.925,0],[.94,.16],[.924,.39],[.929,.65],[.934,.79],[.9,.85],[.948,.82],[.974,.86]], '#1b312c');
  land([[.94,.41],[.883,.27],[.85,.13],[.861,.14],[.899,.25],[.95,.33]], '#1b312c');
  land([[.938,.71],[.938,.43],[.954,.22],[.961,.2],[.945,.46],[.947,.76]], '#344b39');
  // Irregular, overlapping broadleaf masses only occupy the upper frame, never actor bodies.
  land([[0,0],[.36,0],[.35,.06],[.29,.08],[.26,.14],[.2,.12],[.17,.19],[.11,.17],[.07,.23],[0,.21]], '#203b32');
  land([[.57,0],[1,0],[1,.24],[.94,.2],[.9,.23],[.85,.17],[.78,.18],[.75,.12],[.67,.13],[.64,.07],[.58,.06]], '#243f34');
  land([[0,0],[.24,0],[.23,.055],[.17,.075],[.145,.12],[.09,.1],[.065,.15],[0,.13]], '#172f29');
  land([[.76,0],[1,0],[1,.14],[.93,.12],[.9,.16],[.84,.12],[.83,.07],[.78,.08]], '#19322b');
  // Sparse moss and old paving fragments belong at the edge/foreground, below nameplates.
  land([[0,.85],[.055,.81],[.11,.83],[.15,.87],[.1,.86],[.05,.87]], '#3c5238');
  land([[.88,.86],[.925,.82],[.98,.83],[1,.86],[.95,.86],[.91,.88]], '#3a5037');
  for (const [x, y, length, depth] of [[.39,.91,.055,.018],[.51,.87,.043,.013],[.64,.95,.068,.023],[.24,.97,.073,.02]]) {
    land([[x,y],[x+length*.83,y-.006],[x+length,y+depth*.6],[x+length*.2,y+depth]], '#6a6d54');
    land([[x+length*.2,y+depth],[x+length,y+depth*.6],[x+length*.94,y+depth],[x+length*.22,y+depth+.004]], '#414c3c');
  }
  // Six dim motes remain decorative; reduced motion freezes them and no game RNG is consumed.
  for (let i=0;i<6;i++) {
    const x=w*(.15+i*.137), y=h*(.48+(i%3)*.08);
    const drift=prefs.reducedMotion?0:Math.sin(t*.5+i)*2;
    rect(x+drift,y,1,1,'#c5cf9950');
  }
  const ground=h*.79;
  drawHero(w*.28,ground,t);
  const enemies=(state.enemies||[]).slice(0,3);
  enemies.forEach((enemy,i)=>drawEnemy(enemy,w*(enemies.length === 1 ? .72 : .6 + i * .26 / Math.max(1, enemies.length - 1)),ground-i*2,i,t));
  if(!enemies.length){
    // Original camp chest: a grounded wooden volume, not a glowing reward marker.
    // Keep the existing empty-lane visibility rule; this prop has no interaction or loot state.
    const x=w*.68, y=ground;
    polygon([[x-3,y+1],[x+18,y-2],[x+27,y+1],[x+22,y+4],[x-1,y+4]], '#18271e80');
    // Front planks and a darker receding right side.
    polygon([[x,y-12],[x+18,y-12],[x+18,y],[x,y]], '#796044');
    polygon([[x+18,y-12],[x+24,y-16],[x+24,y-4],[x+18,y]], '#453e30');
    rect(x+1,y-9,16,1,'#9b7950');
    rect(x+1,y-5,16,1,'#594630');
    polygon([[x+19,y-9],[x+23,y-12],[x+23,y-11],[x+19,y-8]], '#66553b');
    // Bevelled lid: top plane, front lip and shaded end cap.
    polygon([[x-1,y-13],[x+2,y-17],[x+20,y-17],[x+24,y-14],[x+18,y-11]], '#a18459');
    polygon([[x-1,y-13],[x+18,y-13],[x+18,y-10],[x-1,y-10]], '#87683f');
    polygon([[x+18,y-13],[x+24,y-16],[x+25,y-13],[x+18,y-10]], '#625136');
    rect(x+1,y-13,16,1,'#baa079');
    // Two iron straps follow the lid perspective and continue down the body.
    for (const offset of [3,13]) {
      polygon([[x+offset,y-13],[x+offset+3,y-17],[x+offset+5,y-17],[x+offset+2,y-13]], '#687068');
      rect(x+offset,y-13,2,13,'#4c5651');
      rect(x+offset,y-12,1,2,'#9da28b');
      rect(x+offset,y-2,1,1,'#919680');
    }
    // Small central lock, low contrast enough to leave combat labels as the focal point.
    rect(x+8,y-11,4,5,'#b29b64');
    rect(x+9,y-9,2,2,'#443e2e');
    rect(x,y,18,1,'#343829');
  }
  // Front grass and vignette.
  for(let i=0;i<16;i++){const x=(i*43)%w;polygon([[x,h],[x+2,h-10-(i%3)*3],[x+5,h-3],[x+10,h-8],[x+9,h]],'#0d2326');}
  const vignette=ctx.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,w*.65);vignette.addColorStop(0,'#04151a00');vignette.addColorStop(1,'#04151a88');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*.25;ctx.globalAlpha=Math.max(0,p.life);rect(p.x*w,p.y*h,2,2,p.color);}ctx.globalAlpha=1;
  if(flash>0&&!prefs.reducedMotion){ctx.fillStyle=`rgba(244,221,160,${Math.min(.13,flash)})`;ctx.fillRect(0,0,w,h);}flash=Math.max(0,flash-dt*2);attackPulse=Math.max(0,attackPulse-dt*4);enemyPulse=Math.max(0,enemyPulse-dt*4);
}

// One-shot idle adaptation: not a saved policy or original HV mechanic.
function renderFinishCamp() {
  const trial = itemWorldView(state);
  if (trial.active) {
    const button = $('finish-camp-button'); button.disabled = true; button.setAttribute('aria-pressed', 'false'); button.textContent = '試煉結束必回營';
    $('finish-camp-status').textContent = 'Item World 不自動重刷；立即回營視為撤退，不獲 IW1，種子不退還（本作適配）。';
    return;
  }
  const view = finishThenCampView(state);
  const button = $('finish-camp-button');
  button.disabled = !tabOwner || !view.available;
  button.setAttribute('aria-pressed', String(view.queued));
  button.textContent = view.queued ? '取消通關後回營' : state._phase === 'intermission' && view.available ? '通關完成，立即回營' : '本次通關後回營';
  $('finish-camp-status').textContent = view.queued
    ? '已預約：本次通關獎勵結算後回營，不再自動開下一場。可再次點擊取消。'
    : view.available && state._phase === 'intermission'
      ? '本次獎勵已結算；現在回營不會重複領獎。'
      : view.available && finishCampCancelled
        ? '已取消回營預約；通關後依原設定自動繼續。'
        : view.available
          ? '可預約打完本次再回營；「回營整備」仍會立即撤退。'
          : '單次回營預約不會保存；出戰後可設定，戰敗或重新載入即清除。';
}
$('finish-camp-button').addEventListener('click', () => {
  if (itemWorldView(state).active) return;
  const view = finishThenCampView(state);
  if (!view.available) return;
  if (dispatch('finishThenCamp', !view.queued)) {
    finishCampCancelled = view.queued && !finishThenCampView(state).queued;
    renderFinishCamp();
  }
});

$('start-button').addEventListener('click',()=>{const previousMode=state.mode;if(dispatch('start')&&previousMode!=='battle'&&state.mode==='battle')playSound('win');});
$('retreat-button').addEventListener('click',()=>dispatch('retreat'));
$('heal-button').addEventListener('click',()=>dispatch('heal'));
$('pin-report').addEventListener('click', pinRecentExpeditionReport);
$('claim-pending').addEventListener('click', claimPendingLoot);
for (const strategy of STRATEGIES) { const option = node('option', '', strategy.label); option.value = strategy.id; $('strategy-select').append(option); }
$('strategy-select').addEventListener('change', event => dispatch('setStrategy', event.target.value));
for (const policy of TARGET_PRIORITIES) { const option = node('option', '', policy.label); option.value = policy.id; $('target-priority-select').append(option); }
$('target-priority-select').addEventListener('change', event => {
  if (!tabOwner || state.mode !== 'town') { renderTargetPriority(); return; }
  if (!dispatch('targetPriority', event.target.value)) renderTargetPriority();
});
$('auto-protection').addEventListener('change', event => {
  if (!tabOwner || state.mode !== 'town' || !protectionView(state).unlocked) { renderProtection(); return; }
  dispatch('autoProtection', event.target.checked);
});
$('emergency-supply')?.addEventListener('change', event => {
  if (!tabOwner || state.mode !== 'town' || emergencySupplyView(state).strategy === 'sustain') { renderEmergencySupply(); return; }
  if (!dispatch('setEmergencySupply', event.target.checked)) renderEmergencySupply();
});
$('stage-select').addEventListener('change',event=>dispatch('selectStage',Number(event.target.value)));
$('auto-advance').addEventListener('change',event=>dispatch('setAutoAdvance',event.target.checked));
for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter', 'protection-filter', 'sort-select']) $(id).addEventListener('change', () => render(true));
for (const tier of QUALITY_TIERS) { const option=node('option','',`${tier.label} · ${tier.name}`); option.value=tier.name; $('quality-filter').append(option); }
$('name-filter').addEventListener('input', () => render(true));
$('reset-inventory-filters').addEventListener('click', resetInventoryFilterView);
$('item-world-confirm').addEventListener('click', confirmItemWorld);
$('item-world-dialog').addEventListener('close', closeItemWorld);
$('item-world-dialog').addEventListener('cancel', closeItemWorld);
$('import-save').addEventListener('click', closeItemWorld);
$('soulbind-confirm').addEventListener('click', confirmSoulbindWeapon);
$('soulbind-dialog').addEventListener('close', closeSoulbindWeapon);
$('soulbind-dialog').addEventListener('cancel', closeSoulbindWeapon);
$('import-save').addEventListener('click', closeSoulbindWeapon);
$('gear-set-confirm').addEventListener('click', confirmGearSet);
$('gear-set-dialog').addEventListener('close', closeGearSetDialog);
$('gear-set-dialog').addEventListener('cancel', closeGearSetDialog);
$('import-save').addEventListener('click', closeGearSetDialog);
$('review-selected-sale').addEventListener('click', openSelectedSale);
$('clear-selected-sale').addEventListener('click', () => { clearSelectedSale(); render(true); });
$('selected-sale-confirm').addEventListener('click', confirmSelectedSale);
$('selected-sale-dialog').addEventListener('close', closeSelectedSale);
$('selected-sale-dialog').addEventListener('cancel', closeSelectedSale);
$('import-save').addEventListener('click', clearSelectedSale);
$('sell-safe').addEventListener('click', openSafeSalePreview);
$('safe-sale-confirm').addEventListener('click', confirmSafeSale);
$('safe-sale-dialog').addEventListener('close', closeSafeSalePreview);
$('safe-sale-dialog').addEventListener('cancel', closeSafeSalePreview);
$('auto-sell-toggle').addEventListener('change', event => setSafeAutoSell(event.target.checked));
$('sound-toggle').addEventListener('click',()=>{prefs.sound=!prefs.sound;updatePreferences();if(prefs.sound)playSound('loot');});
$('background-toggle').addEventListener('change', event => {
  prefs.backgroundIdle = event.target.checked; updatePreferences(); pump.reset(); ownershipStatus();
});
$('takeover-button').addEventListener('click', () => {
  if (!channel) return;
  handoff = false; channel.postMessage({ type: 'takeover', id: tabId }); ownership.resume();
  showToast('已請求安全接手；上一分頁先保存，再從營地接續。');
});
$('commission-confirm').addEventListener('click', confirmWeaponCommission);
$('commission-dialog').addEventListener('close', closeWeaponCommission);
$('commission-dialog').addEventListener('cancel', closeWeaponCommission);
$('import-save').addEventListener('click', closeWeaponCommission);
$('motion-toggle').addEventListener('change',event=>{prefs.reducedMotion=event.target.checked;updatePreferences();});
$('help-toggle').addEventListener('click',()=>$('help-dialog').showModal());$('settings-toggle').addEventListener('click',()=>$('settings-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
$('export-save').addEventListener('click',()=>{
  try {
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=node('a');link.href=url;link.download=`hv-v3-dot-lv${state.hero.level}-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);showToast('存檔已準備下載，請確認檔案保存位置。');
  }catch{showToast('匯出失敗，請稍後再試。');}
});
// New choices and leaving the page invalidate any older asynchronous file read.
let importGeneration = 0;
$('import-save').addEventListener('click',()=>{importGeneration++;$('save-file').click();});
$('save-file').addEventListener('change',async event=>{
  const generation=++importGeneration;
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>2*1024*1024){showToast('存檔過大，請選擇小於 2 MB 的 JSON 存檔。');return;}
  try{
    const raw=await file.text();
    if(generation!==importGeneration)return;
    const restored=validateSave(JSON.parse(raw));
    if(!claimLease(true)){showToast('此分頁已失去進度控制權，未匯入；請接手後重新選擇檔案。');return;}
    if(!confirm(`匯入 Lv.${restored.hero.level} 的旅程並取代目前進度？建議先匯出備份。`))return;
    if(!claimLease(true)){showToast('請先關閉另一個正在進行遊戲的分頁。');return;}
    closeSafeSalePreview();state=restored;preventOverwrite=false;selectedId=null;selectedSlot=null;syncSelection();seenEvents.clear();(state.events||[]).forEach(e=>seenEvents.add(String(e.id)));notice('');const persisted=save(true);render(true);showToast(persisted ? '存檔已匯入，進度已保存；從營地接續。' : '存檔僅在此分頁載入，尚未保存；請立即匯出備份。');
  }catch(error){if(generation!==importGeneration)return;console.warn('Invalid save rejected',error);showToast(error?.message === '不支援的裝備欄位或格式，未載入；請保留原存檔。' ? '不支援的裝備欄位或格式，已取消匯入以避免遺失或誤售。請保留原存檔；目前進度沒有改變。' : '存檔格式不符或已損壞，目前進度沒有改變。');}
});
window.addEventListener('popstate', closeSafeSalePreview);
window.addEventListener('pagehide', () => { closeSafeSalePreview(); closeWeaponCommission(); importGeneration++; pageActive = false; releaseLease(); pump.reset(); });
window.addEventListener('pageshow', () => { pageActive = true; pump.reset(); if (!handoff) ownership.resume(); });
window.addEventListener('popstate', closeWeaponCommission);
window.addEventListener('popstate', clearSelectedSale);
window.addEventListener('pagehide', clearSelectedSale);
window.addEventListener('pagehide', closeGearSetDialog);
window.addEventListener('popstate', closeGearSetDialog);
window.addEventListener('popstate', closeItemWorld);
window.addEventListener('pagehide', closeItemWorld);
$('save-file').addEventListener('change', closeItemWorld);
window.addEventListener('popstate', closeSoulbindWeapon);
window.addEventListener('pagehide', closeSoulbindWeapon);
$('save-file').addEventListener('change', closeSoulbindWeapon);
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now(); pump.reset();
  if (document.hidden) { save(true); if (!prefs.backgroundIdle) releaseLease(); }
  else { if (!handoff) ownership.resume(); render(true); }
});
window.addEventListener('storage', event => {
  if (event.key === SAVE_KEY && !tabOwner && event.newValue) {
    try { state = validateSave(JSON.parse(event.newValue)); resetEventObservation(); lastSavedRaw = event.newValue; syncSelection(); if (!document.hidden) render(true); } catch { /* invalid external state never imported */ }
  }
});
$('growth-jump').addEventListener('click', focusGrowthChoice);
// Display-only navigation: deliberately independent of progress, preferences and simulation.
function setupCampNavigation() {
  const names = ['battle', 'gear', 'growth'];
  const tabs = names.map(name => $(`camp-tab-${name}`));
  const panels = names.map(name => $(`camp-panel-${name}`));
  function select(index, moveFocus = false) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    if (moveFocus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index, true));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next, true);
    });
  });
  select(0);
}
setupCampNavigation();

// Simulation has exactly one clock: this timer. rAF never advances gameplay.
setInterval(() => {
  if (!pageActive) return;
  if (ownership.supported && !handoff && (!document.hidden || prefs.backgroundIdle)) ownership.request();
  pump.tick(); reconcileWeaponCommission(); reconcileSoulbindWeapon(); reconcileItemWorld();
  if (tabOwner) save();
}, 250);
function frame(now) {
  const dt = Math.min(.1, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
  if(!document.hidden) {
    if (now - lastRendered > 100) { render(); lastRendered = now; }
    drawScene(now / 1000, dt);
  }
  requestAnimationFrame(frame);
}
if (loaded.migrated) notice('已讀取舊版 v1／v2 儲存位置的進度，將另存至目前的 v3 儲存位置（資料格式 v3）；舊存檔完整保留。舊版分頁之後的進度不會自動合併，請在目前版本繼續遊玩或手動匯出。');
if (loadProblem) notice(loadProblem);
if (!ownership.supported) {
  prefs.backgroundIdle = false;
  $('background-toggle').disabled = true;
  $('save-status').textContent = '暫存旅程 · 請匯出';
  notice('此瀏覽器沒有安全跨分頁鎖定：僅前景遊玩，不覆寫自動存檔。請匯出保留本次進度。');
} else if (!storeAvailable) notice('此瀏覽器不允許儲存資料。請定期匯出存檔，避免關閉後遺失。');
// Clear browser-restored native select values even before a writer lock is acquired.
resetInventoryFilters();
ownership.resume(); ownershipStatus(); updatePreferences(); render(true); resizeCanvas(); requestAnimationFrame(frame);

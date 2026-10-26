import { createGame, advance, act, stats, validateSave, STRATEGIES, previewSafeSale, previewWeaponCommission, expeditionReports } from './engine.js';
import { createPump, createOwnership, loadVersionedSave } from './session.js';
import { QUALITY_TIERS } from './loot.js';
import { resolveWeaponFamily, describeWeaponTrait, describeItemFlavor, COMMISSION_WEAPON_FAMILIES } from './loot.js';
import { PENETRATED_ARMOR_RULES, penetratedArmorStatus, CLUB_STUN_RULES, stunStatus, AXE_BLEED_RULES, bleedStatus, previewStage, enemyDefenseView } from './engine.js';

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
  $('route-preview-intro').textContent = route.stage < 3 ? '前 2 層維持原有防線；第 3 層起加入厚甲與靈巧。' : '厚甲重減傷，靈巧重閃避與招架；配裝仍須看實際屬性。';
  $('route-preview-list').replaceChildren(...route.waves.map(wave => {
    const row = node('li', 'route-wave');
    row.append(node('span', 'route-wave-number', wave.boss ? `${wave.wave} · 首領` : `${wave.wave} · 波次`));
    const groups = new Map();
    for (const enemy of wave.enemies) {
      const key = JSON.stringify([enemy.roleId, enemy.defense, enemy.mitigation, enemy.evade, enemy.parry, enemy.block]);
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
      group.append(badge, values);
      group.title = `${names.join('、')}。基礎防禦 ${enemy.defense}；${mitigation}。閃＝閃避、招＝招架、擋＝格擋，各為單次判定機率，不是完全擋下攻擊的總機率。`;
      lineup.append(group);
    }
    row.append(lineup);
    return row;
  }));
}
const slotIcons = { weapon: '⚔', armor: '◈', accessory: '◇' };
const statNames = { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋' };
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
let loadProblem = loaded.error ? '既有存檔無法讀取：資料可能損壞，或裝備含本版不支援的欄位。已開啟暫時的新旅程，原始資料尚未覆寫；請保留原存檔並匯入有效備份。' : '';
let state = loaded.state;
let preventOverwrite = loaded.error || !storeAvailable;
let lastSavedRaw = loaded.raw;
let prefs = { sound: false, backgroundIdle: true, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
try { const saved = JSON.parse(readStorage(PREF_KEY) || '{}'); if (typeof saved.backgroundIdle === 'boolean') prefs.backgroundIdle = saved.backgroundIdle; if (typeof saved.reducedMotion === 'boolean') prefs.reducedMotion = saved.reducedMotion; } catch { /* optional preferences only */ }
let selectedId = null;
let selectedSlot = null;
let safeSaleBatch = null;
let commissionConsent = null;
let lastCommissionSignature = '';
let lastSafeLootSignature = '';
let lastInventorySignature = '';
let lastEquipmentSignature = '';
let lastLogSignature = '';
let lastEnemyStatusSignature = '';
let lastReportSignature = '';
let pinnedExpeditionReport = null;
let lastStageCount = 0;
let lastPreviewStage = null;
let toastTimer;
let bannerTimer;
let procTimer;
let bleedTimer;
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
      state = validateSave(JSON.parse(raw)); lastSavedRaw = raw; syncSelection();
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
function syncSelection() {
  $('bleed-notice').hidden = true; // Imported/reloaded journeys never inherit recent damage feedback.
  pinnedExpeditionReport = null; lastReportSignature = ''; // Local comparisons never cross adopted journeys or ownership changes.
  closeWeaponCommission(); // Ownership transfer, reload and import never retain consent.
  if (selectedId && !state.inventory.some(item => item.id === selectedId)) selectedId = null;
  lastInventorySignature = ''; lastEquipmentSignature = ''; lastLogSignature = ''; lastEnemyStatusSignature = ''; lastStageCount = 0; lastPreviewStage = null;
}
function dispatch(action, payload) {
  if (!claimLease(true)) { showToast('此分頁為唯讀；請在存檔設定接手，或關閉持有進度的分頁。'); return false; }
  try {
    const previousMode = state.mode;
    act(state, action, payload);
    // A successful lifecycle change cannot credit time from the previous mode.
    // Rejected/repeated starts and ordinary combat actions keep their interval.
    if ((action === 'start' || action === 'retreat') && state.mode !== previousMode) pump.reset();
    reconcileWeaponCommission(); render(true); if (action === 'start' || action === 'retreat') $('bleed-notice').hidden = true; save(true); return true;
  } catch (error) { console.error('Action failed', error); showToast('此操作目前無法完成，進度仍保留。'); }
}
function commissionQuoteSignature(preview) {
  return JSON.stringify([preview.family, preview.item, preview.price, preview.goldAfter, preview.quoteBasis, preview.currentWeapon, state.mode, state.stage, state.unlocked, state.wins, state.inventory, state.pendingLoot]);
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
  const fresh = previewWeaponCommission(state, commissionConsent.family);
  if (!fresh.available) { abortWeaponCommission(fresh.reason || '請回營後重新預覽。'); return; }
  if (commissionConsent.signature !== commissionQuoteSignature(fresh)) abortWeaponCommission('報價、進度或目前裝備已改變，請關閉後重新預覽。');
}
function openWeaponCommission(family) {
  if (!claimLease()) { showToast('此分頁為唯讀；接手後才能進行武器委託。'); return; }
  if (state.mode !== 'town') { showToast('請先回營，再查看武器委託。'); return; }
  if (!(state.wins >= 1)) { showToast('完成首次遠征後解鎖武器委託；目前未扣款。'); return; }
  // One visible offer is one consent scope; another selection cannot silently replace it.
  if ($('commission-dialog').open) return;
  const preview = previewWeaponCommission(state, family);
  if (!preview.item) { showToast(preview.reason || '無法取得委託報價，未扣款。'); return; }
  const { item, currentWeapon } = preview;
  commissionConsent = preview.available ? { ...preview, signature: commissionQuoteSignature(preview) } : null;
  $('commission-item-name').textContent = item.name;
  $('commission-item-meta').textContent = `${qualityName(item.quality)}（${item.quality}） · Lv.${item.level} · 品質骰 R${commissionStat(item.roll)} · 屠戮（Slaughter） · 無前綴`;
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
  const completed = dispatch('commissionWeapon', { family: consent.family, quoteBasis: consent.quoteBasis });
  const delivered = state.inventory.find(item => item.id === consent.item.id);
  const purchased = completed && state.hero.gold === consent.goldAfter && state.inventory.length === countBefore + 1 && delivered?.locked === true && JSON.stringify(delivered) === JSON.stringify(consent.item) && JSON.stringify(state.equipment) === equipmentBefore;
  if (!purchased) { abortWeaponCommission('操作未確認完成，請核對金幣與背包後重新預覽。'); return; }
  closeWeaponCommission();
  selectedId = delivered.id; selectedSlot = null;
  $('slot-filter').value = 'weapon'; $('sort-select').value = 'new';
  render(true);
  showToast(`已委託「${delivered.name}」· 支付 ${format(consent.price)} 金幣；已鎖定送入背包，未自動裝備。`);
}
function renderWeaponCommission() {
  reconcileWeaponCommission();
  const offers = COMMISSION_WEAPON_FAMILIES.map(choice => ({ ...choice, preview: previewWeaponCommission(state, choice.family) }));
  const signature = JSON.stringify([tabOwner, state.mode, state.wins, offers]);
  if (signature === lastCommissionSignature) return;
  lastCommissionSignature = signature;
  const canPreview = tabOwner && state.mode === 'town' && state.wins >= 1;
  $('commission-status').textContent = !tabOwner ? '唯讀分頁：接手後才能委託。' : state.mode !== 'town' ? '僅營地可委託；請先回營整備。' : !(state.wins >= 1) ? '完成首次遠征後解鎖。' : offers.every(offer => !offer.preview.available) && new Set(offers.map(offer => offer.preview.reason)).size === 1 ? offers[0].preview.reason : '選擇路線查看精確報價與比較；確認前不會扣款。';
  $('commission-choices').replaceChildren(...offers.map(({ family, label, preview }) => {
    const button = node('button', 'commission-choice');
    const routes = { axe: '流血傷口', rapier: '穿透護甲', club: '暈眩控制' };
    button.append(node('strong', '', label), node('span', '', routes[family] || ''), node('span', 'commission-price', preview.item ? `${format(preview.price)} 金幣 · 查看` : '暫無報價'));
    button.disabled = !canPreview || !preview.item;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', `查看${label}武器委託${preview.item ? `，${format(preview.price)} 金幣` : ''}，尚未購買`);
    button.addEventListener('click', () => openWeaponCommission(family));
    return button;
  }));
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
    row.append(node('p', 'safe-sale-reason', `保留「${item.keeperName}」（${equipped ? '已裝備' : '背包已鎖定'}；ID：${item.keeperId}）。同型的六項屬性均不低，且${item.strictlyBetterKeys.map(key => statNames[key] || key).join('、')}較高；不以評分判定。`));
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
  const bleedEvents = [];
  for (const event of state.events || []) {
    const key = String(event.id);
    if (seenEvents.has(key)) continue;
    seenEvents.add(key); lastProcessedEvent = key;
    if (seenEvents.size > 200) { const keep = Array.from(seenEvents).slice(-100); seenEvents.clear(); keep.forEach(id => seenEvents.add(id)); }
    const type = event.type;
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
  const rows = enemies.map(enemy => ({ enemy, status: penetratedArmorStatus(enemy, tick), stun: stunStatus(enemy, tick), bleed: bleedStatus(enemy, tick), defense: enemyDefenseView(enemy, tick) }));
  const signature = JSON.stringify(rows.map(({ enemy, status, stun, bleed, defense }) => [enemy.id, enemy.name, enemy.roleId, enemy.hp, status, stun, bleed, defense]));
  $('enemy-status-panel').hidden = !rows.length;
  if (!rows.length || (procTargetId && !enemies.some(enemy => enemy.id === procTargetId))) {
    $('proc-notice').hidden = true; clearTimeout(procTimer); procTargetId = null;
  }
  if (!rows.length || (recoveryTargetId && !enemies.some(enemy => enemy.id === recoveryTargetId))) {
    $('recovery-notice').hidden = true; clearTimeout(recoveryTimer); recoveryTargetId = null;
  }
  if (signature === lastEnemyStatusSignature) return;
  lastEnemyStatusSignature = signature;
  $('enemy-status-list').replaceChildren(...rows.map(({ enemy, status, stun, bleed, defense }, index) => {
    const pending = stun?.recoveryPending;
    const card = node('div', `enemy-status-card${status ? ' has-penetration' : ''}${stun ? pending ? ' recovery-ready' : ' is-stunned' : ''}${bleed ? ' is-bleeding' : ''}`);
    const name = node('strong', '', `${index === 0 ? '目標 · ' : ''}${enemy.name}`);
    const effect = node('span', 'enemy-effect penetration-effect', status ? `穿透護甲 ${status.stacks}/${PENETRATED_ARMOR_RULES.maxStacks} 層 · 剩 ${status.ticksRemaining} Tick` : '穿透護甲：無');
    const control = node('span', 'enemy-effect stun-effect', pending ? '甦醒待行動 · 下次我方行動前可反擊' : stun ? `暈眩 · 剩 ${stun.ticksRemaining} Tick` : '暈眩：無');
    card.append(name, effect, control);
    card.append(node('span', 'enemy-effect bleed-effect', bleed ? `流血傷口 ${bleed.stacks}/${AXE_BLEED_RULES.maxStacks} 層 · 剩 ${bleed.ticksRemaining} Tick · 每 Tick ${format(bleed.damagePerTick)} 傷害` : '流血傷口：無'));
    const role = enemyRolePresentation(enemy);
    card.append(node('span', `enemy-role role-${role.id}`, `${role.mark} ${role.label}${enemy.boss ? ' · 首領' : ''}`));
    const currentDefense = node('div', 'enemy-current-defense');
    currentDefense.append(...defenseLines(defense, '目前').map(line => node('span', '', line)));
    card.append(currentDefense);
    const details = [`基礎一般物理減傷 ${defenseRate(defense.baseMitigation)}；目前數字已計入穿透護甲與暈眩。閃＝閃避、招＝招架、擋＝格擋，各為單次判定機率，不是完全擋下攻擊的總機率。暈眩不取消格擋。`];
    if (status) details.push(`物理減傷為原本的 ${format(status.mitigationMultiplier * 100)}%；不是直接增加同等傷害。`);
    if (stun) details.push(pending ? '暈眩已結束，閃避與招架恢復；下一次我方行動前，敵人先行動。' : '暫停敵方行動，期間不能閃避或招架；到期後會恢復行動。');
    if (bleed) details.push(`流血每 Tick ${format(bleed.damagePerTick)} 點無類型傷害；以觸發時面板攻擊快照計算，不受減傷、閃避、招架與格擋影響；穿透護甲不增幅流血。`);
    card.title = details.join(' ');
    return card;
  }));
}
function render(force = false) {
  $('strategy-select').value = state.strategy || 'balanced';
  $('strategy-select').disabled = state.mode !== 'town' || !tabOwner;
  $('strategy-description').textContent = STRATEGIES.find(strategy => strategy.id === state.strategy)?.description || '';

  const derived = stats(state);
  $('level-badge').textContent = `LV. ${state.hero.level}`;
  $('hp-label').textContent = `${format(state.hero.hp)} / ${format(derived.maxHp)}`;
  $('mp-label').textContent = `${format(state.hero.mp)} / ${format(derived.maxMp)}`;
  $('xp-label').textContent = `${format(state.hero.xp)} / ${format(state.hero.xpNext)}`;
  setMeter('hp-bar', state.hero.hp, derived.maxHp); setMeter('mp-bar', state.hero.mp, derived.maxMp); setMeter('xp-bar', state.hero.xp, state.hero.xpNext);
  $('stat-attack').textContent = format(derived.attack); $('stat-defense').textContent = format(derived.defense); $('stat-crit').textContent = `${((derived.crit || 0) * 100).toFixed(1)}%`; $('stat-gold').textContent = format(state.hero.gold);
  $('zone-title').textContent = stageName(state.stage); $('stage-label').textContent = `遠征 ${String(state.stage).padStart(2, '0')}`;
  $('wave-label').textContent = state.mode === 'battle' ? `第 ${state.wave} / ${state.totalWaves} 波` : state.mode === 'defeat' ? '旅者倒下了' : '準備出發';
  $('mode-badge').textContent = { town: '整備中', battle: '遠征進行中', defeat: '需要整備' }[state.mode] || '整備中'; $('mode-badge').className = `status-pill ${state.mode}`;
  $('run-time').textContent = clock(state.battle?.elapsed); const best = state.battle?.bestTimes?.[state.stage]; $('best-time').textContent = best ? clock(best) : '尚無紀錄';
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
  $('start-button').disabled = !tabOwner || state.mode === 'battle' || state.mode === 'defeat'; $('retreat-button').disabled = !tabOwner || state.mode === 'town'; $('heal-button').disabled = !tabOwner || state.mode !== 'battle' || state.hero.hp >= derived.maxHp || !(state.potions > 0);
  $('heal-button').textContent = `補給藥水 · ${state.potions ?? 0}`;
  $('control-hint').textContent = state.mode === 'battle' ? (state.autoAdvance ? '自動推進中 · 隨時可回營整備' : '自動重刷本關 · 回營後才能換裝與出售') : state.mode === 'defeat' ? '點「回營整備」恢復，再挑戰較適合的關卡。' : '自動戰鬥 · 不考手速 · 隨時回營換裝';
  const inventorySignature = JSON.stringify([state.inventory, selectedId, selectedSlot, $('slot-filter').value, $('sort-select').value, state.equipment, state.mode]);
  if (force || inventorySignature !== lastInventorySignature) { lastInventorySignature = inventorySignature; renderInventory(); renderItemDetail(); }
  const equipmentSignature = JSON.stringify(state.equipment);
  if (force || equipmentSignature !== lastEquipmentSignature) { lastEquipmentSignature = equipmentSignature; renderEquipment(); }
  const logSignature = JSON.stringify(state.logs);
  if (logSignature !== lastLogSignature) { lastLogSignature = logSignature; const logs = (state.logs || []).slice(0, 6); $('combat-log').replaceChildren(...(logs.length ? logs : ['營火已點亮。準備好後，開始第一場遠征。']).map(text => node('li', '', text))); }
  $('inventory-count').textContent = state.inventory.length;
  renderSafeLoot();
  renderWeaponCommission();
  renderEnemyStatuses();
  renderRoutePreview();
  renderExpeditionReports();
  eventEffects();
}
function itemContent(item) {
  const icon = node('span', 'item-icon', slotIcons[item.slot] || '◇');
  const info = node('span', 'gear-info'); info.append(node('strong', '', item.name), node('span', '', `${itemTypeName(item)} · Lv.${item.level} · ${qualityName(item.quality)}`));
  return [icon, info];
}
function renderEquipment() {
  $('equipment').replaceChildren(...Object.entries(state.equipment).map(([slot, item]) => {
    const button = node('button', 'gear-button'); button.style.setProperty('--item-color', colorOf(item));
    button.append(...itemContent(item)); button.title = `${slotNames[slot]}：${item.name}`;
    button.addEventListener('click', () => { selectedSlot = slot; selectedId = null; lastInventorySignature = ''; render(true); }); return button;
  }));
}
function expeditionReportCard(report, label) {
  const outcomes = { win: '通關', defeat: '戰敗', retreat: '中途回營' };
  const outcome = Object.hasOwn(outcomes, report.outcome) ? outcomes[report.outcome] : '已結束';
  const family = Object.hasOwn(weaponFamilyNames, report.weapon.family) ? weaponFamilyNames[report.weapon.family] : '未辨識武器路線';
  const strategy = STRATEGIES.find(entry => entry.id === report.strategy)?.label || '未辨識戰術';
  const card = node('article', 'expedition-report-card');
  const heading = node('div', 'report-card-heading');
  heading.append(node('h4', '', label), node('span', 'report-outcome', outcome));
  card.append(heading, node('p', 'report-start', `出發第 ${format(report.stage)} 層 · 等級 ${format(report.level)} → 結束 ${format(report.endLevel ?? report.level)} · ${strategy}`));
  card.append(node('p', 'report-weapon', `${family} · ${report.weapon.name}`));
  if (report.startStats) card.append(node('p', 'report-start-stats', `出發面板：攻擊 ${format(report.startStats.attack)} · 生命上限 ${format(report.startStats.maxHp)} · 一般減傷 ${defenseRate(report.startStats.mitigation)}`));
  const metrics = node('dl', 'report-metrics');
  const row = (title, value) => { const entry = node('div', 'report-metric'); entry.append(node('dt', '', title), node('dd', '', value)); metrics.append(entry); };
  row('已處理時間', `${report.elapsed.toFixed(1)} 秒`);
  row('實際扣除敵方生命', `普攻 ${format(report.damage.basic)} · 技能 ${format(report.damage.skill)} · 流血 ${format(report.damage.bleed)}`);
  row('承受生命損失', `${format(report.survival.hpLost)} · 最低生命 ${report.survival.minHpPercent.toFixed(1).replace(/\.0$/, '')}%`);
  row('行動次數', `攻擊總數 ${format(report.actions.attacks)}（含技能 ${format(report.actions.skills)}） · 治療 ${format(report.actions.heals)} · 藥水 ${format(report.actions.potions)}`);
  row('魔力消耗', format(report.actions.manaSpent));
  row('特效成功施加／刷新', `流血 ${format(report.procs.bleeding)} · 穿透護甲 ${format(report.procs.penetratedArmor)} · 暈眩 ${format(report.procs.stun)}`);
  card.append(metrics);
  return card;
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
  $('report-status').textContent = latest ? `已記錄第 ${format(latest.stage)} 層的最近一次遠征；新遠征開始後仍可查看。${pinnedExpeditionReport ? '比較基準已保留，不會隨新戰報替換。' : ''}` : '遠征通關、戰敗或中途回營後，戰報會自動出現在這裡。';
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
  const filter = $('slot-filter').value, sort = $('sort-select').value;
  const items = state.inventory.filter(item => filter === 'all' || item.slot === filter).slice().reverse();
  if (sort === 'power') items.sort((a, b) => (b.power || 0) - (a.power || 0));
  if (sort === 'level') items.sort((a, b) => b.level - a.level);
  if (!items.length) { const empty = node('div', 'empty-inventory'); empty.append(node('b', '', '◇'), node('span', '', state.inventory.length ? '這個部位還沒有戰利品。' : '背包還很輕。出發帶回第一件寶物吧。')); $('inventory-list').replaceChildren(empty); return; }
  $('inventory-list').replaceChildren(...items.map(item => {
    const button = node('button', `inventory-card${item.id === selectedId ? ' selected' : ''}`); button.style.setProperty('--item-color', colorOf(item)); button.append(...itemContent(item));
    if (item.locked) button.append(node('span', 'lock-indicator', '鎖'));
    else {
      const comparison = powerComparisonText(item, state.equipment[item.slot]);
      if (comparison) {
        const marker = node('span', 'item-score-marker', comparison);
        marker.title = comparison === '異路線' ? '武器路線不同；屬性評分不含特效效益，不能視為直接升級。' : '屬性評分較高；不含特效效益，不保證更適合目前配裝。';
        button.append(marker);
      }
    }
    button.setAttribute('aria-label', `${item.name}，${qualityName(item.quality)}，等級 ${item.level}${item.locked ? '，已鎖定' : ''}`);
    button.setAttribute('aria-pressed', String(item.id === selectedId));
    button.addEventListener('click', () => { selectedId = item.id; selectedSlot = null; render(true); }); return button;
  }));
}
function renderItemDetail() {
  const item = selectedSlot ? state.equipment[selectedSlot] : state.inventory.find(item => item.id === selectedId);
  if (!item) {
    const placeholder = node('div', 'detail-placeholder'); placeholder.append(node('span', '', '◇'), node('h3', '', '看看下一件好東西'), node('p', '', '選擇一件裝備，比較它會為旅者帶來什麼改變。')); $('item-detail').replaceChildren(placeholder); return;
  }
  const wrap = $('item-detail'); wrap.style.setProperty('--item-color', colorOf(item));
  const current = state.equipment[item.slot];
  const quality = node('div', 'detail-quality', `${qualityName(item.quality)}${selectedSlot ? ' · 已裝備' : ''}`);
  const name = node('h3', 'detail-name', item.name);
  const subtitle = node('div', 'detail-subtitle', `${itemTypeName(item)} · Lv.${item.level} · 品質骰 ${Number(item.roll || 0).toFixed(0)} · 屬性評分 ${format(item.power)}`);
  const description = node('p', 'detail-description', describeItemFlavor(item) || '一件等待發揮力量的裝備。');
  const trait = node('div', 'weapon-trait');
  if (item.slot === 'weapon') {
    trait.append(node('strong', '', `武器路線 · ${weaponFamilyNames[resolveWeaponFamily(item)] || '未辨識'}`), node('p', '', describeWeaponTrait(item)));
    const ruleText = weaponRuleText(item);
    if (ruleText) trait.append(node('p', 'muted', ruleText));
  } else trait.hidden = true;
  const table = node('div', 'compare-table');
  const keys = new Set([...Object.keys(item.stats || {}), ...Object.keys(current?.stats || {})]);
  for (const key of keys) {
    if (!statNames[key]) continue;
    const value = Number(item.stats?.[key]) || 0, old = Number(current?.stats?.[key]) || 0, diff = value - old;
    const display = rateStats.has(key) ? `${(value * 100).toFixed(1)}%` : format(value);
    const delta = selectedSlot || Math.abs(diff) < .0001 ? '—' : `${diff > 0 ? '+' : ''}${rateStats.has(key) ? `${(diff * 100).toFixed(1)}%` : Math.round(diff)}`;
    const row = node('div', 'compare-row'); row.append(node('span', '', statNames[key]), node('strong', '', display), node('span', `delta ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`, delta)); table.append(row);
  }
  const explanation = node('p', 'muted', `${selectedSlot ? '這件裝備正陪伴你的旅程。' : '右側差值與目前同部位裝備比較。'}屬性評分不含流血、穿透護甲、暈眩等特效效益，不是 DPS；跨武器路線不能只依高分換裝。`);
  const actions = node('div', 'detail-actions');
  if (!selectedSlot) {
    const equip = node('button', 'primary-button', state.mode === 'battle' ? '回營後換裝' : '換上裝備'); equip.disabled = state.mode === 'battle' || !tabOwner; equip.addEventListener('click', () => { if (!dispatch('equip', item.id)) return; selectedId = null; showToast(`已裝備「${item.name}」`); render(true); });
    const lock = node('button', 'secondary-button', item.locked ? '解鎖' : '鎖定'); lock.disabled = state.mode === 'battle' || !tabOwner; lock.addEventListener('click', () => dispatch('lock', item.id));
    const sell = node('button', 'secondary-button', '出售'); sell.disabled = !tabOwner || item.locked || state.mode === 'battle'; sell.addEventListener('click', () => { dispatch('sell', item.id); selectedId = null; render(true); }); actions.append(equip, lock, sell);
  }
  wrap.replaceChildren(quality, name, subtitle, description, trait, table, explanation, actions);
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
  const pulse = prefs.reducedMotion ? 0 : attackPulse;
  const bob = prefs.reducedMotion ? 0 : Math.sin(t * 3) * 1;
  ctx.save(); ctx.translate(x + pulse * 5, y + bob);
  ctx.fillStyle = '#06161d70'; ctx.beginPath(); ctx.ellipse(0, 3, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  polygon([[-13,-5],[-9,-31],[-4,-38],[7,-36],[13,-8],[8,0],[-8,0]], '#24575a');
  polygon([[-11,-6],[-4,-29],[5,-31],[9,-6],[3,-2]], '#548c81');
  rect(-6,-9,5,14,'#172d35'); rect(4,-8,5,13,'#20333b'); rect(-7,4,8,3,'#101f28'); rect(3,4,9,3,'#101f28');
  rect(-7,-39,16,13,'#456c68'); rect(-4,-35,10,10,'#dbb98a'); rect(3,-33,2,2,'#17282d');
  polygon([[-10,-34],[-7,-43],[3,-46],[11,-38],[10,-33],[2,-36],[-4,-33]], '#769d87');
  rect(-6,-23,14,3,'#bd9557'); rect(-7,-21,4,13,'#678d7d');
  ctx.save(); ctx.translate(10,-22); ctx.rotate(pulse * 1.6 - .4);
  rect(-1,-21,3,27,'#cbd7c5'); rect(0,-24,2,4,'#f0f1d4'); rect(-5,0,12,3,'#dab478'); rect(0,3,3,7,'#8a6041'); ctx.restore();
  if (fighting && pulse > .25) { ctx.strokeStyle = '#dcf6d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(15,-23,20,-1,.9); ctx.stroke(); }
  ctx.restore();
}
function drawEnemy(enemy, x, y, index, t) {
  const boss = enemy.boss;
  const role = enemyRolePresentation(enemy);
  const pulse = prefs.reducedMotion ? 0 : enemyPulse;
  const bob = prefs.reducedMotion ? 0 : Math.sin(t * 2 + index * 2) * 2;
  ctx.save(); ctx.translate(x - pulse * 4, y + bob); const size = boss ? 1.5 : 1; ctx.scale(size,size);
  ctx.fillStyle = '#06161d70'; ctx.beginPath(); ctx.ellipse(0,4,18,4,0,0,Math.PI*2); ctx.fill();
  const palette = boss ? ['#614456','#a26776','#cf9b8c'] : index % 2 ? ['#3e5654','#6d9582','#adbf93'] : ['#434b5c','#68758b','#a0b4b1'];
  polygon([[-16,0],[-19,-18],[-13,-32],[-4,-29],[6,-36],[17,-29],[21,-10],[13,2]],palette[0]);
  polygon([[-11,-3],[-12,-19],[-5,-26],[5,-30],[13,-21],[13,-4]],palette[1]);
  polygon([[-16,-26],[-23,-44],[-9,-34]],palette[0]); polygon([[10,-32],[20,-47],[18,-23]],palette[0]);
  rect(-7,-22,4,3,'#ebd19a'); rect(5,-23,4,3,'#ebd19a'); rect(-5,-13,13,3,palette[0]);
  rect(-15,-4,7,10,palette[0]);rect(9,-3,7,10,palette[0]);
  // Role silhouettes do not rely on color or motion alone.
  if (role.id === 'armored') {
    polygon([[-18,-24],[-7,-27],[-1,-22],[-3,-9],[-10,-4],[-18,-10]], '#a4b6ad');
    polygon([[-15,-22],[-8,-24],[-4,-20],[-6,-11],[-10,-8],[-15,-12]], '#536e72');
    rect(-11,-21,2,10,'#d2c99f');
  } else if (role.id === 'agile') {
    polygon([[7,-29],[25,-35],[18,-25],[29,-27],[15,-18]], '#89c8c2');
    rect(-8,-18,22,2,'#a6d7c3');
  }
  if(boss){rect(-8,-37,20,4,'#b3996f');polygon([[-7,-37],[-5,-45],[0,-39],[5,-48],[9,-39],[14,-45],[12,-37]],'#d9ba78');}
  ctx.restore();
  const width = boss ? 57 : 40;
  const sy = y - (boss ? 80 : 57);
  rect(x - width/2, sy, width, 3, '#10222a'); rect(x-width/2, sy, width * Math.max(0, enemy.hp) / Math.max(1,enemy.maxHp),3,boss?'#d29a76':'#b4a778');
  ctx.font = '5px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#d8ded0'; ctx.fillText(enemy.name,x,sy-5,width+25);
  if (enemy.hp > 0) {
    const defense = enemyDefenseView(enemy, state.timing?.ticks || 0);
    ctx.fillStyle = role.id === 'armored' ? '#e1cfa3' : role.id === 'agile' ? '#a9e2d8' : '#cedad1';
    ctx.fillText(`${role.mark} ${role.label}`, x, sy - 29, width + 22);
    ctx.fillStyle = '#d8ded0';
    ctx.fillText(`現減 ${defenseRate(defense.mitigation)} · 閃 ${defenseRate(defense.evade)}`, x, sy - 21, width + 26);
    ctx.fillText(`招 ${defenseRate(defense.parry)} · 擋 ${defenseRate(defense.block)}`, x, sy - 13, width + 26);
  }
  const status = penetratedArmorStatus(enemy, state.timing?.ticks || 0);
  if (enemy.hp > 0 && status) {
    rect(x - width / 2, sy + 5, width, 10, '#132c32e8');
    ctx.fillStyle = '#abe4d8'; ctx.fillText(`PA ${status.stacks} · ${status.ticksRemaining}T`, x, sy + 12, width);
  }
  const stun = stunStatus(enemy, state.timing?.ticks || 0);
  if (enemy.hp > 0 && stun) {
    const top = sy + (status ? 16 : 5);
    rect(x - width / 2, top, width, 10, '#30273ae8');
    ctx.fillStyle = stun.recoveryPending ? '#f3bd91' : '#ddd0ff';
    ctx.fillText(stun.recoveryPending ? 'READY' : `STUN ${stun.ticksRemaining}T`, x, top + 7, width);
  }
  const bleed = bleedStatus(enemy, state.timing?.ticks || 0);
  if (enemy.hp > 0 && bleed) {
    const top = sy + 5 + (status ? 11 : 0) + (stun ? 11 : 0);
    rect(x - width / 2, top, width, 10, '#3d222ce8');
    ctx.fillStyle = '#ffb6bb'; ctx.fillText(`BW ${bleed.stacks} · ${bleed.ticksRemaining}T`, x, top + 7, width);
    // A fixed droplet silhouette distinguishes bleeding even without animation or color.
    polygon([[x + width / 2 + 5, top], [x + width / 2 + 2, top + 6], [x + width / 2 + 5, top + 9], [x + width / 2 + 8, top + 6]], '#ffb6bb');
  }
}
function drawScene(t, dt) {
  const w = sceneWidth, h = sceneHeight;
  const gradient = ctx.createLinearGradient(0,0,0,h); gradient.addColorStop(0,'#112730'); gradient.addColorStop(.5,'#28534e'); gradient.addColorStop(1,'#152a2b');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  // Moon, layered fir forest, stone ruins and narrow path.
  ctx.fillStyle='#becdb13b';ctx.beginPath();ctx.arc(w*.72,h*.22,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e3dec77d';ctx.beginPath();ctx.arc(w*.72,h*.22,12,0,Math.PI*2);ctx.fill();
  for(let layer=0;layer<3;layer++)for(let i=0;i<13;i++){
    const x=i*w/11+(layer%2)*17-20,base=h*(.58+layer*.09),height=h*(.28+((i*7+layer*3)%9)/35),color=['#23443f','#1b3b37','#132e2d'][layer];
    rect(x-2,base-height*.35,4,height*.5,color);polygon([[x,base-height],[x-13-layer*4,base-12],[x+15+layer*3,base-12]],color);
  }
  rect(0,h*.75,w,h*.25,'#172e2e');
  polygon([[0,h*.94],[w*.25,h*.72],[w*.62,h*.71],[w,h*.89],[w,h],[0,h]],'#344b42');
  polygon([[0,h*.97],[w*.25,h*.77],[w*.62,h*.77],[w,h*.94],[w,h],[0,h]],'#415649');
  // Broken pillars, never generated from another game's artwork.
  rect(w*.12,h*.39,11,h*.37,'#344e48');rect(w*.1,h*.39,17,5,'#547168');rect(w*.13,h*.45,3,h*.29,'#43635b');
  rect(w*.9,h*.4,13,h*.37,'#344e48');rect(w*.89,h*.4,18,5,'#5d7869');
  for(let i=0;i<26;i++){const x=(i*37+13)%w,y=h*.79+(i*11)%Math.max(1,h*.18);rect(x,y,3+(i%4),1,'#60705966');}
  for(let i=0;i<14;i++){const x=(i*71+9)%w,y=h*.44+(i*19)%(h*.28);const drift=prefs.reducedMotion?0:Math.sin(t*.5+i)*3;ctx.fillStyle=i%2?'#d5cb8359':'#b1ddbd55';ctx.fillRect(x+drift,y,1,1);}
  const ground=h*.79;
  drawHero(w*.28,ground,t);
  const enemies=(state.enemies||[]).slice(0,3);
  enemies.forEach((enemy,i)=>drawEnemy(enemy,w*(enemies.length === 1 ? .72 : .6 + i * .26 / Math.max(1, enemies.length - 1)),ground-i*2,i,t));
  if(!enemies.length){
    rect(w*.68,ground-12,19,12,'#6d6043');rect(w*.68-1,ground-14,21,5,'#9d8255');rect(w*.68+8,ground-12,3,12,'#d2ac66');
    if(state.mode!=='battle'){ctx.fillStyle='#e2bf7660';ctx.beginPath();ctx.arc(w*.7,ground-8,20,0,Math.PI*2);ctx.fill();}
  }
  // Front grass and vignette.
  for(let i=0;i<16;i++){const x=(i*43)%w;polygon([[x,h],[x+2,h-10-(i%3)*3],[x+5,h-3],[x+10,h-8],[x+9,h]],'#0d2326');}
  const vignette=ctx.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,w*.65);vignette.addColorStop(0,'#04151a00');vignette.addColorStop(1,'#04151a88');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*.25;ctx.globalAlpha=Math.max(0,p.life);rect(p.x*w,p.y*h,2,2,p.color);}ctx.globalAlpha=1;
  if(flash>0&&!prefs.reducedMotion){ctx.fillStyle=`rgba(244,221,160,${Math.min(.13,flash)})`;ctx.fillRect(0,0,w,h);}flash=Math.max(0,flash-dt*2);attackPulse=Math.max(0,attackPulse-dt*4);enemyPulse=Math.max(0,enemyPulse-dt*4);
}

$('start-button').addEventListener('click',()=>{if(dispatch('start'))playSound('win');});
$('retreat-button').addEventListener('click',()=>dispatch('retreat'));
$('heal-button').addEventListener('click',()=>dispatch('heal'));
$('pin-report').addEventListener('click', pinRecentExpeditionReport);
for (const strategy of STRATEGIES) { const option = node('option', '', strategy.label); option.value = strategy.id; $('strategy-select').append(option); }
$('strategy-select').addEventListener('change', event => dispatch('setStrategy', event.target.value));
$('stage-select').addEventListener('change',event=>dispatch('selectStage',Number(event.target.value)));
$('auto-advance').addEventListener('change',event=>dispatch('setAutoAdvance',event.target.checked));
$('slot-filter').addEventListener('change',()=>render(true));$('sort-select').addEventListener('change',()=>render(true));
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
$('import-save').addEventListener('click',()=>$('save-file').click());
$('save-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>2*1024*1024){showToast('存檔過大，請選擇小於 2 MB 的 JSON 存檔。');return;}
  try{
    const restored=validateSave(JSON.parse(await file.text()));
    if(!claimLease(true)){showToast('此分頁已失去進度控制權，未匯入；請接手後重新選擇檔案。');return;}
    if(!confirm(`匯入 Lv.${restored.hero.level} 的旅程並取代目前進度？建議先匯出備份。`))return;
    if(!claimLease(true)){showToast('請先關閉另一個正在進行遊戲的分頁。');return;}
    closeSafeSalePreview();state=restored;preventOverwrite=false;selectedId=null;selectedSlot=null;syncSelection();seenEvents.clear();(state.events||[]).forEach(e=>seenEvents.add(String(e.id)));notice('');save(true);render(true);showToast('存檔已匯入，從營地安全接續。');
  }catch(error){console.warn('Invalid save rejected',error);showToast(error?.message === '不支援的裝備欄位或格式，未載入；請保留原存檔。' ? '不支援的裝備欄位或格式，已取消匯入以避免遺失或誤售。請保留原存檔；目前進度沒有改變。' : '存檔格式不符或已損壞，目前進度沒有改變。');}
});
window.addEventListener('popstate', closeSafeSalePreview);
window.addEventListener('pagehide', () => { closeSafeSalePreview(); closeWeaponCommission(); pageActive = false; releaseLease(); pump.reset(); });
window.addEventListener('pageshow', () => { pageActive = true; pump.reset(); if (!handoff) ownership.resume(); });
window.addEventListener('popstate', closeWeaponCommission);
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now(); pump.reset();
  if (document.hidden) { save(true); if (!prefs.backgroundIdle) releaseLease(); }
  else { if (!handoff) ownership.resume(); render(true); }
});
window.addEventListener('storage', event => {
  if (event.key === SAVE_KEY && !tabOwner && event.newValue) {
    try { state = validateSave(JSON.parse(event.newValue)); lastSavedRaw = event.newValue; syncSelection(); if (!document.hidden) render(true); } catch { /* invalid external state never imported */ }
  }
});
// Simulation has exactly one clock: this timer. rAF never advances gameplay.
setInterval(() => {
  if (!pageActive) return;
  if (ownership.supported && !handoff && (!document.hidden || prefs.backgroundIdle)) ownership.request();
  pump.tick(); reconcileWeaponCommission();
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
if (loaded.migrated) notice('已讀取舊版 v1／v2 進度，將另存至目前的 v3 存檔格式；舊存檔完整保留。舊版分頁之後的進度不會自動合併，請在目前版本繼續遊玩或手動匯出。');
if (loadProblem) notice(loadProblem);
if (!ownership.supported) {
  prefs.backgroundIdle = false;
  $('background-toggle').disabled = true;
  $('save-status').textContent = '暫存旅程 · 請匯出';
  notice('此瀏覽器沒有安全跨分頁鎖定：僅前景遊玩，不覆寫自動存檔。請匯出保留本次進度。');
} else if (!storeAvailable) notice('此瀏覽器不允許儲存資料。請定期匯出存檔，避免關閉後遺失。');
ownership.resume(); ownershipStatus(); updatePreferences(); render(true); resizeCanvas(); requestAnimationFrame(frame);

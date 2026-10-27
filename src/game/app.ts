import { CP8 } from '../core/cp8';
import { iconKey } from './icons';
import { act, alive, armCp5, chargeAdvice, type ChargeAdvice, windingUp, type BEvent, canUse, chargeEstimate, suggestSkill, potHint, guardHint, hpDanger, suggestSpell, quickAttack, whyNot, weaknesses, resistances, BOSS_CHARGE_MULT, BULWARK_COUNTER_MULT, BOSS_PHASE_HP, DEF, SPIRIT_MIN_OC, spellCost, startBattle, SKILLS, skillKit, SPELLS, type Action, type BattleState, type PotionId, type SkillId, type SpellId } from '../core/battle';
/** rc15 (2): element names for the encounter log line (display only). */
const ENC_TZ: Record<string, string> = { piercing: '刺擊', crushing: '打擊', slashing: '斬擊', fire: '火', cold: '冰', elec: '雷', wind: '風', holy: '聖', dark: '暗' };
import { nextPointCosts, profsOf, starterKit } from '../core/auto';
import { ATTRS, attrCost, expForLevel } from '../core/formulas';
import { effectiveStats, equipName, QUALITY_COLOR, QUALITY_ZH, sellPrice, SLOT_ZH, SLOTS, type Equip } from '../core/items';
import type { Monster, MonsterPool } from '../core/monsters';
import { allocate, derive, equip, level, newPlayer, powerScore, PROF_ZH, PROFS, profValue, refund, resetAttrs, unequip, unspentExp, type Player } from '../core/player';
import { Rng, randomSeed } from '../core/rng';
import { carryMult, has, prog, tip, TIPS } from '../core/progress';
import { BUFF, RARITY_ZH, SCHOOL_ZH, SCHOOLS, COMBO_AT, COMBO_ZH, combos, formed, schoolCounts, type Combos } from '../core/buffs';
import { buffPreview } from './buffpreview';
import { openOffer, openShrine, takeBuff, takeRisk, skipOffer, merchantBuffs, winOffers, RISKS, type RiskId } from '../core/buffoffer';
import { mapPotion, MAP_LOW_HP, abyssBestMsg, abyssLvFollow, deathCarryMsg, reachedMsg } from '../core/run';
import { abyssOpen, abyssCarryAt, abyssCleared, abyssSchool, depthOf, floorLabel, startAbyss } from '../core/run';
import { ABYSS, ABYSS_KEY, abyssBaseLevel, abyssMonLevel, abyssMult, abyssTier, bossKey, checkpointStart, DIFF, loadRecord, recordTrip, recordTitles, guaranteeQuality, tierZh, abyssDangerHint } from '../core/abyss';
import { advance, applyLoot, armBattle, battleLocks, openingOc, enterNode as coreEnterNode, chestLoot, encounter, finishBattle, merchantStock, rest, RULES, runDerived, settle, shrine, SHRINES, startRun, type Loot, type RunState, type Settlement } from '../core/run';
import { loadFrom, saveTo, SAVE_VERSION, type SaveData } from '../core/save';
import { GAME_KEYS } from '../core/preset';
import { CP7, betterThanWorn, checkpointOptions, gearVerdict } from '../core/cp7';
import { autoWorn, betterInBag, prepAlloc, prepEquip, prepIssues, prepPotions, type PrepIssue } from '../core/prep';
import { TOWN_HP_POTIONS } from '../core/auto';
import { floorLevel, NODE_ICON, NODE_ZH, towerRules, type NodeType } from '../core/tower';
import { sortieLabel } from '../core/progress';
import { scrollToCurrentFloor } from './mapscroll';
import type { Stage } from './stage';
import { BULWARK_CP5_ZH, AFFIXES, dangerHint, BOSS_BY_FLOOR, ELEM_ZH, SIG_TEXT, themeOf, themeRaces, type AffixId, type Cp5Mon } from '../core/cp5';
import { ATTR_HINT, ATTR_ZH, esc, fmtChange, fmtStat, STAT_ZH } from './text';

/** CP3-fix 12 / CP3-bugfix 7: exactly which stats the next +1 changes (town Item World and campfire forge). */
function iwGain(e: Equip): string {
  const a = effectiveStats(e), b = effectiveStats({ ...e, iw: e.iw + 1 });
  const ch = (Object.keys(b) as (keyof typeof b)[]).filter((k) => b[k] !== a[k]).map((k) => { const [x, y] = fmtChange(k, a[k]!, b[k]!); return `<span class="iwgain">${STAT_ZH[k] ?? k} ${x} → <b>${y}</b></span>`; });
  return ch.join(' ') || '<span class="hint">此裝備沒有會隨強化成長的數值</span>';
}

type Screen = 'town' | 'map' | 'battle' | 'node' | 'result';
/** cp8-rc12: placeholder icons for the style skills (no art yet). */
const SKILL_ICON: Partial<Record<SkillId, string>> = { greatCleave: 'mercifulBlow', concussiveStrike: 'shieldBash', rendingBlow: 'vitalStrike', shatterStrike: 'shieldBash' };
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const POTION_ZH: Record<PotionId, string> = { health: '生命藥水', mana: '法力藥水', spirit: '靈力藥水' };

/** Unusable battle buttons stay hoverable (no `disabled`) so the tooltip can show why; clicking logs the reason. */
/** 暫定 (CP3-9): town Item World costs this x (current +level + 1) credits after the free first use. */
const IW_COST = 200;
function gate(b: BattleState, a: Action, desc = ''): string {
  if (canUse(b, a)) return desc ? `title="${esc(desc)}"` : '';
  const why = whyNot(b, a);
  return `aria-disabled="true" data-why="${esc(why)}" title="${esc(why + (desc ? `\n${desc}` : ''))}"`;
}

/** cp8-rc7: device-level speed / skip-animation preference. */
export const SETTINGS_KEY = 'hv-v3-settings';
/** cp8-rc10 P1-9 (UI only): Phaser tweens / delayedCalls stop while the tab is hidden or the GPU stalls, and a tween whose
 *  target is destroyed never calls onComplete — the awaited animation then never resolves, `busy` stays true and the
 *  loot screen's 「繼續前進」 never appears. Animation awaits are capped by a wall-clock timer; the battle state is unaffected. */
const capped = (p: Promise<unknown>, ms: number): Promise<unknown> => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
const ENC_MS = 2500; // 2 s 顯示 + 0.5 s 淡出（自訂，非原版）
export class App {
  data: SaveData;
  screen: Screen = 'town';
  townTab: 'char' | 'gear' | 'shop' | 'iw' = 'char';
  /** CP3 unlock / tutorial notices shown on the current screen. */
  notice: string[] = [];
  /** rc16 item 2: last charge-turn decision shown in battle (reused by the death screen). */
  lastAdvice: { turn: number; a: ChargeAdvice } | null = null;
  /** CP7: chosen abyss start checkpoint. */
  abyssStart: number | null = null;
  noticeHtml(): string { return this.notice.length ? `<div class="unlocks" data-unlock>${this.notice.map((n) => `<div>${esc(n)}</div>`).join('')}</div>` : ''; }
  battle: BattleState | null = null;
  battleType: NodeType = 'battle';
  monsters: Monster[] = [];
  busy = false;
  rng = new Rng(randomSeed());
  log: string[] = [];
  target = 0;
  pending: { loot?: Loot; text?: string } = {};

  stage: Stage;
  pool: MonsterPool;
  root: HTMLElement;
  constructor(stage: Stage, pool: MonsterPool, root: HTMLElement) {
    this.stage = stage; this.pool = pool; this.root = root;
    const loaded = loadFrom(localStorage);
    this.data = loaded ?? App.fresh();
    // cp8-rc7: speed / 跳過動畫 are a device preference kept under their own key, so a preset / slot switch / &fresh (applyPreset writes
    // default settings) no longer resets them on reload.
    try { const st = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'); if (st && [1, 2, 4].includes(st.speed)) this.data.settings = { speed: st.speed, skipAnim: !!st.skipAnim }; } catch { /* ignore */ }
    stage.speed = this.data.settings.speed;
    stage.skip = this.data.settings.skipAnim;
    stage.onTarget = (i) => { this.target = i; stage.setTarget(i); };
    // CP3-fix 6: capture on document so a focused button/canvas cannot swallow the key, and refocus the page on pointer use.
    document.addEventListener('keydown', (e) => this.key(e), { capture: true });
    window.addEventListener('pointerdown', () => { if (document.activeElement instanceof HTMLElement && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) document.activeElement.blur(); window.focus(); });
    // rc10: another tab (or a preset load there) replaced the save. This tab's copy is stale: stop writing it back,
    // otherwise its next save / abyss trip would overwrite the new save (the "preset shows the old character" report).
    window.addEventListener('storage', (e) => { if (e.key === null || (GAME_KEYS as readonly string[]).includes(e.key)) this.markStale(); });
    if (this.data.run && !this.data.run.done) this.go('map');
    else { this.data.run = null; this.go('town'); }
  }

  /** cp8-rc6 (Part A 1): a new character's school is passed to starterKit as its lean, so it gets that school's cp8 starter kit. */
  static fresh(lean?: Player['lean']): SaveData {
    const p = newPlayer();
    starterKit(p, randomSeed(), RULES.cp8 ? lean : undefined);
    return { v: SAVE_VERSION, player: p, run: null, settings: { speed: 1, skipAnim: false }, stats: { runs: 0, bestFloor: 0, clears: 0 } };
  }

  get p(): Player { return this.data.player; }
  get run(): RunState { return this.data.run!; }
  stale = false;
  save() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.data.settings)); if (!this.stale) saveTo(localStorage, this.data); }
  markStale() {
    if (this.stale) return;
    this.stale = true;
    const el = document.createElement('div'); el.dataset.stale = '';
    el.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:#000c;color:#fff;font:16px sans-serif';
    el.innerHTML = '<div>存檔已在其他分頁被更換（例如載入了 preset）。這個分頁不再存檔。<br><button data-stalereload>重新載入</button></div>';
    el.querySelector('button')!.addEventListener('click', () => location.reload());
    document.body.appendChild(el);
  }

  go(s: Screen) {
    this.screen = s;
    this.stage.setDim(s !== 'battle');
    if (s !== 'battle') this.stage.clearMonsters();
    this.save();
    this.render();
  }

  // ---------- rendering ----------
  render() {
    const html =
      this.screen === 'town' ? this.townHtml() :
      this.screen === 'map' ? this.mapHtml() :
      this.screen === 'battle' ? this.battleHtml() :
      this.screen === 'node' ? this.nodeHtml() : this.resultHtml();
    this.root.innerHTML = this.topBar() + html + this.modalHtml();
    this.root.className = `screen-${this.screen}`;
    this.bind();
    if (this.screen === 'map') scrollToCurrentFloor(this.root);
  }

  topBar(): string {
    const st = this.data.settings;
    return `<div class="topbar"><span class="title">HV-v3 · 試煉之塔</span>
      <span class="spacer"></span>
      <span>速度 ${[1, 2, 4].map((n) => `<button data-speed="${n}" class="${st.speed === n ? 'on' : ''}">${n}x</button>`).join('')}</span>
      <label><input type="checkbox" data-skip ${st.skipAnim ? 'checked' : ''}/> 跳過動畫</label></div>`;
  }

  bars(hp: number, mhp: number, mp: number, mmp: number, sp: number, msp: number, oc?: number): string {
    const bar = (cls: string, v: number, m: number, lbl: string) => `<div class="bar ${cls}"><div style="width:${Math.max(0, Math.min(100, (v / m) * 100))}%"></div><span>${lbl} ${Math.round(v)}/${Math.round(m)}</span></div>`;
    return `<div class="bars">${bar('hp', hp, mhp, 'HP')}${bar('mp', mp, mmp, 'MP')}${bar('sp', sp, msp, 'SP')}${oc !== undefined ? bar('oc', oc, 250, 'OC') : ''}</div>`;
  }

  /** CP3-fix 7: procedural icon (scripts/gen-icons.py) for an equipment piece. */
  static icon(e: Equip): string {
    const key = iconKey(e);
    return `<img class="icon" src="assets/icons/${key}.png" alt="" width="32" height="32" onerror="if(!this.dataset.r){this.dataset.r=1;window.__assetRetries=(window.__assetRetries||0)+1;this.src=this.src.split('?')[0]+'?retry=1'}else this.style.visibility='hidden'">`;
  }

  itemCard(e: Equip, actions = ''): string {
    const st = Object.entries(effectiveStats(e)).map(([k, v]) => `<li>${STAT_ZH[k as keyof typeof STAT_ZH] ?? k} <b>${fmtStat(k, v!)}</b></li>`).join('');
    return `<div class="item" style="--q:${hex(QUALITY_COLOR[e.quality])}">
      <div class="iname">${App.icon(e)}${esc(equipName(e))}</div>
      <div class="imeta">${QUALITY_ZH[e.quality]} · ${SLOT_ZH[e.slot]} · Lv${e.level}${e.iw ? ` · 強化+${e.iw}` : ''}</div>
      <ul class="istats">${st}</ul>${actions ? `<div class="iact">${actions}</div>` : ''}</div>`;
  }

  /** Battle / chest loot card. CP7 P1: a drop that beats the worn piece (betterThanWorn, +5% 戰力) gets a green frame and a
   *  「▲ 比身上好」 badge; other drops are shown dimmed without the stat-delta row so they do not distract. Off = cp6 card. */
  lootCard(e: Equip, l: Loot): string {
    const guar = l.guaranteed?.includes(e.id) ? '<b class="warn" data-guar>保底</b> ' : '';
    if (!RULES.cp7) return this.itemCard(e, `${guar}<button data-bequip="${e.id}">立刻換上</button>`) + this.compare(e);
    const up = betterThanWorn(this.p, e);
    const card = this.itemCard(e, `${up ? '<b class="better" data-better>▲ 比身上好</b> ' : ''}${guar}<button data-bequip="${e.id}">立刻換上</button>`);
    return up ? `<div class="loot-better">${card}${this.compare(e)}</div>` : `<div class="loot-plain" data-plain>${card}</div>`;
  }

  /** cp7-rc5 bug 1: storage / run-bag badge from the same rule as 出發前整備 (gearVerdict). Off = '' (cp6 UI). */
  betterTag(e: Equip): string {
    if (!RULES.cp7) return '';
    const v = gearVerdict(this.p, e);
    return v === 'better' ? '<b class="better" data-better>▲ 比身上好</b> '
      : v === 'small' ? `<small class="dim" data-small-gain title="戰力提升未超過 ${Math.round(CP7.betterMargin * 100)}%，不算「比身上好」，出發前整備不會提醒">小幅提升（≤${Math.round(CP7.betterMargin * 100)}%，不列入整備提醒）</small> ` : '';
  }

  /** Derived-stat deltas if e were equipped. */
  compare(e: Equip): string {
    const clone: Player = JSON.parse(JSON.stringify(this.p));
    const a = derive(clone);
    equip(clone, JSON.parse(JSON.stringify(e)));
    const b = derive(clone);
    const rows: [string, number, number, boolean][] = [
      ['戰力', powerScore(a), powerScore(b), false], ['HP', a.hp, b.hp, false], ['物攻', a.adb, b.adb, false], ['魔攻', a.mdb, b.mdb, false],
      ['物理減傷', a.physMit, b.physMit, true], ['閃避', a.evade, b.evade, true], ['暴擊', a.physCrit, b.physCrit, true], ['招架', a.parry, b.parry, true], ['格擋', a.block, b.block, true],
    ];
    const out = rows.filter(([, x, y]) => Math.abs(x - y) > 1e-4).map(([n, x, y, p]) => {
      const d = y - x;
      return `<span class="${d > 0 ? 'up' : 'down'}">${n} ${d > 0 ? '▲' : '▼'}${p ? pct(Math.abs(d)) : Math.round(Math.abs(d) * 10) / 10}</span>`;
    });
    return `<div class="cmp">${out.join(' ') || '<span>無變化</span>'}</div>`;
  }

  statsPanel(): string {
    const d = derive(this.p);
    const rows: [string, string][] = [
      ['等級', `${d.level}`], ['戰力', `${powerScore(d)}`], ['HP / MP / SP', `${d.hp} / ${d.mp} / ${d.sp}`], ['物攻 ADB', `${Math.round(d.adb)}`], ['魔攻 MDB', `${Math.round(d.mdb)}`],
      ['物理暴擊', pct(d.physCrit)], ['閃避 / 招架 / 格擋', `${pct(d.evade)} / ${pct(d.parry)} / ${pct(d.block)}`], ['抵抗', pct(d.resist)], ['物理 / 魔法減傷', `${pct(d.physMit)} / ${pct(d.magMit)}`],
      ['傷害類型', d.damageType], ['負重 / 干擾', `${Math.round(d.burden)} / ${Math.round(d.interference)}`],
    ];
    return `<table class="stats">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  }

  townHtml(): string {
    const p = this.p;
    const lv = level(p);
    const st = this.data.stats;
    const open = { char: true, gear: true, shop: has(p, 'shop'), iw: has(p, 'iw') };
    if (!open[this.townTab]) this.townTab = 'char';
    const tabs = (['char', 'gear', 'shop', 'iw'] as const).filter((t) => open[t]).map((t) => `<button data-tab="${t}" class="${this.townTab === t ? 'on' : ''}">${{ char: has(p, 'alloc') ? '角色與配點' : '角色', gear: '裝備', shop: '商店', iw: '道具界' }[t]}</button>`).join('');
    const lockedHint = ['alloc', 'shop', 'iw'].filter((k) => !has(p, k as 'alloc')).map((k) => ({ alloc: '屬性配點：第 1 趟回城後解鎖', shop: '城鎮商店：第 2 趟回城後解鎖', iw: '道具界：首次打倒 F10 首領後解鎖' }[k])).join('　');
    let body = '';
    if (this.townTab === 'char' && !has(p, 'alloc')) {
      body = `<div class="cols"><div><h3>屬性</h3><div class="hint" data-locked="alloc">🔒 屬性配點在第 1 趟回城後解鎖。</div></div><div><h3>能力值</h3>${this.statsPanel()}</div></div>`;
    } else if (this.townTab === 'iw') {
      const g = prog(p);
      const cost = (e: Equip) => (g.iwUses === 0 ? 0 : IW_COST * (e.iw + 1));
      const gain = (e: Equip) => iwGain(e);
      const rows = SLOTS.map((sl) => p.equipped[sl]).filter((e): e is Equip => !!e).map((e) => `<tr data-iwrow="${e.slot}"><td>${esc(equipName(e))}</td><td>+${e.iw} → +${e.iw + 1}</td><td class="iwprev">${gain(e)}</td><td><button data-iw="${e.slot}" ${p.credits < cost(e) ? 'disabled' : ''}>強化 ${cost(e) ? cost(e) + 'C' : '（免費）'}</button></td></tr>`).join('');
      body = `<h3>道具界</h3><div class="hint">進入裝備的道具界強化 +1：會隨等級成長的數值每級 +4%（下表列出這次會變多少）。第一次免費。</div><table>${rows}</table>`;
    } else if (this.townTab === 'char') {
      const free = Math.floor(unspentExp(p));
      const attrs = ATTRS.map((a) => {
        const next = Math.ceil(attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a]));
        return `<tr><td>${ATTR_ZH[a]}<div class="hint">${ATTR_HINT[a]}</div></td><td class="num">${p.attrs[a]}</td>
          <td class="abtn"><button data-ref="${a}" data-n="all" ${p.attrs[a] <= 0 ? 'disabled' : ''} title="全部退回">全退</button> <button data-ref="${a}" data-n="10" ${p.attrs[a] <= 0 ? 'disabled' : ''}>−10</button> <button data-ref="${a}" data-n="1" ${p.attrs[a] <= 0 ? 'disabled' : ''}>−1</button> <button data-add="${a}" data-n="1" ${free < next ? 'disabled' : ''}>+1</button> <button data-add="${a}" data-n="10" ${free < next ? 'disabled' : ''}>+10</button> <button data-add="${a}" data-n="max" ${free < next ? 'disabled' : ''} title="用掉所有可用 EXP">+最大</button></td><td class="hint">下一點 ${next} EXP</td></tr>`;
      }).join('');
      const profs = PROFS.map((k) => `<span class="prof">${PROF_ZH[k]} ${profValue(p, k)}</span>`).join('');
      body = `<div class="cols"><div><h3>屬性（可自由重置） <button data-resetall ${ATTRS.every((a) => p.attrs[a] <= 0) ? 'disabled' : ''} title="所有屬性歸零，EXP 全數退回">一鍵全部重置</button></h3><div>未分配 EXP：<b>${free.toLocaleString()}</b>${(() => { const nc = nextPointCosts(p); return `<div class="hint" data-nextpoint="${nc.auto?.cost ?? ''}:${nc.any.cost}">屬性 +1 最便宜：${ATTR_ZH[nc.any.attr as keyof typeof ATTR_ZH]} ${nc.any.cost.toLocaleString()} EXP${nc.auto && nc.auto.attr !== nc.any.attr ? `（進入深淵塔時跳出的「出發前整備」裡的「全部處理」只買本流派屬性，最便宜為 ${ATTR_ZH[nc.auto.attr as keyof typeof ATTR_ZH]} ${nc.auto.cost.toLocaleString()} EXP）` : ''}</div>`; })()}<div data-lvgap="${Math.ceil(expForLevel(lv + 1) - p.exp)}">角色升到 Lv ${lv + 1}：還要再<b>獲得</b> ${Math.ceil(expForLevel(lv + 1) - p.exp).toLocaleString()} EXP（等級看累積 EXP；未分配 EXP 已算在內，不能拿來升級）</div></div>
        <table class="attrs">${attrs}</table><h3>熟練度</h3><div class="profs">${profs}</div></div>
        <div><h3>能力值</h3>${this.statsPanel()}</div></div>`;
    } else if (this.townTab === 'gear') {
      const eq = SLOTS.map((s) => {
        const e = p.equipped[s];
        return `<div class="slot"><div class="slotname">${SLOT_ZH[s]}</div>${e ? this.itemCard(e, `<button data-unequip="${s}">卸下</button>`) : '<div class="empty">—</div>'}</div>`;
      }).join('');
      const inv = [...p.inventory].sort((a, b) => a.slot.localeCompare(b.slot)).map((e) => this.itemCard(e, `${this.betterTag(e)}<button data-equip="${e.id}">裝備</button>${has(p, 'shop') ? ` <button data-sell="${e.id}">賣 ${sellPrice(e)}C</button>` : ''}`) + this.compare(e)).join('');
      body = `<div class="cols"><div><h3>穿戴中</h3><div class="slots">${eq}</div></div><div><h3>倉庫（${p.inventory.length}）</h3><div class="inv">${inv || '<div class="empty">空</div>'}</div></div></div>`;
    } else {
      const pot = (Object.keys(RULES.potionPrice) as PotionId[]).map((k) => `<tr><td>${POTION_ZH[k]}</td><td>持有 ${p.potions[k]}</td><td><button data-buy="${k}" ${p.credits < RULES.potionPrice[k] ? 'disabled' : ''}>買 ${RULES.potionPrice[k]}C</button></td></tr>`).join('');
      const junk = p.inventory.reduce((s, e) => s + sellPrice(e), 0);
      body = `<h3>藥水（死亡會失去所有消耗品）</h3><table>${pot}</table>
        <h3>出售</h3><button data-sellall ${p.inventory.length ? '' : 'disabled'}>賣掉倉庫全部（${p.inventory.length} 件，${junk}C）</button>`;
    }
    return `<div class="panel town"><div class="head"><h2>城鎮</h2><span>Lv ${lv} · ${p.credits.toLocaleString()} C · 藥水 ❤${p.potions.health} ✦${p.potions.mana} ☯${p.potions.spirit}</span>
      <span class="spacer"></span><span class="hint" data-runs>${sortieLabel(st.runs, RULES.cp6Abyss && abyssOpen(this.p) ? loadRecord(localStorage.getItem(ABYSS_KEY)).trips : 0)} · 最高 ${st.bestFloor} 層 · 通關 ${st.clears} 次</span></div>
      ${this.noticeHtml()}<div class="tabs">${tabs}</div>${lockedHint ? `<div class="hint locks">🔒 ${lockedHint}</div>` : ''}<div class="body">${body}</div>
      <div class="foot"><button data-newgame class="ghost">新角色</button><span class="spacer"></span><span class="hint" data-deathrule>⚠ 死亡會把帶回折半（EXP、熟練度、Credits 只留 50%）</span><button data-start class="big">進入試煉之塔 ▶</button>${this.abyssBtn()}</div>${this.abyssRecordHtml()}</div>`;
  }

  mapHtml(): string {
    const r = this.run;
    const d = runDerived(this.p, r);
    const floors = [...r.tower.floors].reverse().map((f) => {
      const cur = f.n === r.floor;
      const past = f.n < r.floor;
      const opts = f.options.map((t, i) => {
        const chosen = past && r.path[f.n - 1] === i;
        const ic = `<b class="ni">${NODE_ICON[t]}</b>`;
        // CP5 rc2 fix 3: the death-combo ⚔ warning sits on the elite node itself (the floor banner stays).
        const ew = r.abyss && RULES.cp6Abyss && t === 'elite' ? `<b class="ewarn warn" data-elitemark title="深淵精英可能帶 3 個詞綴，或克制物理的【尖刺】【堅硬】">⚔</b>` : r.cp5 && !r.abyss && t === 'elite' && f.n >= 3 ? `<b class="ewarn warn" data-elitemark title="可能帶【法抗】或【反魔】（法術幾乎無效）">⚔</b>` : '';
        return cur ? `<button class="node n-${t}" data-node="${i}"${r.startPick && r.offer && !RULES.cp8 ? ' disabled' : ''}>${ic}${NODE_ZH[t]}${ew}${RULES.cp8 && t === 'elite' ? '<small class="warn" data-elitedanger>危險，先備好藥</small>' : ''}</button>` : `<span class="node n-${t} ${chosen ? 'chosen' : ''} ${past && !chosen ? 'faded' : ''}" ${chosen ? 'data-visited' : ''}>${ic}${NODE_ZH[t]}${ew}${chosen ? '<i class="tick">✓ 走過</i>' : ''}</span>`;
      }).join('');
      if (r.abyss) {
        const dn = r.abyss.start + f.n - 1;
        const bt = dn % 5 === 0 ? BOSS_BY_FLOOR[bossKey(dn)] : undefined;
        const bh = bt ? `<small class="bosst" data-bosstitle="${dn}">${bt.title}</small>` : '';
        return `<div class="floor ${cur ? 'cur' : ''} ${past ? 'past' : ''}" data-depth="${dn}"><span class="fn">深淵 ${dn} <small data-mlv>Lv${abyssMonLevel(dn, r.plv ?? 0, abyssLvFollow(r))}</small>${bh}</span>${opts}</div>`;
      }
      const th = r.cp5 && f.n % 5 === 1 ? `<div class="theme-sep" data-themesep="${f.n}">▲ 第 ${f.n}–${f.n + 4} 層：${themeOf(f.n).zh}</div>` : '';
      const boss = r.cp5 && BOSS_BY_FLOOR[f.n] ? `<small class="bosst" data-bosstitle="${f.n}">${BOSS_BY_FLOOR[f.n]!.title}</small>` : '';
      return `<div class="floor ${cur ? 'cur' : ''} ${past ? 'past' : ''}"><span class="fn">${f.n}F <small>Lv${floorLevel(f.n)}</small>${boss}</span>${opts}</div>${th}`;
    }).join('');
    const bag = r.bag.map((e) => this.itemCard(e, `${this.betterTag(e)}<button data-bequip="${e.id}">換上</button>`) + this.compare(e)).join('');
    return `<div class="panel map"><div class="head"><h2>${r.abyss ? `深淵塔 · 第 ${depthOf(r)} 層` : `試煉之塔 · 第 ${r.floor} 層`}</h2><span class="spacer"></span>
      <span>本趟：EXP ${Math.round(r.exp).toLocaleString()} · ${r.credits}C · 擊殺 ${r.kills}${r.bonus.dmg ? ` · 傷害+${Math.round(r.bonus.dmg * 100)}%` : ''}${r.bonus.hp ? ` · HP+${Math.round(r.bonus.hp * 100)}%` : ''}</span></div>
      ${r.startPick && r.offer && !RULES.cp8 ? `<div data-startpick><div class="hint">從第 ${r.abyss?.start} 層出發：先選 run buff（本趟有效）</div>${this.offerHtml()}</div>` : ''}${this.themeHtml()}${this.bars(r.hp, d.hp, r.mp, d.mp, r.sp, d.sp)}${this.dotHtml(r.pdot)}${r.hp < d.hp ? `<div class="mappot"><button data-mappot ${this.p.potions.health > 0 ? '' : 'disabled'}>Z·喝生命藥水（剩 ${this.p.potions.health} 瓶，地圖上無冷卻）</button></div>` : ''}${r.hp <= d.hp * MAP_LOW_HP ? `<div class="potgo" data-lowhp><div class="hint warn">HP ${Math.round(r.hp)}/${d.hp} 只剩一半以下：進戰鬥前先喝藥或走休息節點</div>${this.p.potions.health > 0 ? `<button class="potgobtn" data-potgo>🧪 喝藥再出發（剩 ${this.p.potions.health} 瓶）</button>` : '<div class="hint">沒有生命藥水了：優先走休息節點</div>'}</div>` : ''}${this.buffStrip()}${r.floor === 1 && !r.path.length ? this.noticeHtml() : ''}${r.cp5 && r.tower.floors[r.floor - 1]?.options.includes('elite') && r.floor >= 3 ? `<div class="hint warn" data-elitewarn>⚔ 本層精英可能帶【法抗】或【反魔】（法術幾乎無效），還可能疊上嗜血／分裂等詞綴。法術為主又沒把握時，可以選別條路或先撤退回城補強。</div>` : ''}${r.abyss ? `<div class="hint" data-carry-abyss="${abyssCarryAt(r)}">深淵帶回倍率 ×${abyssCarryAt(r)}（1＋0.05×難度階，依目前深度）</div>` : ''}${r.trip && !r.abyss ? `<div class="hint" data-trip="${r.trip}">第 ${r.trip} 趟：帶回 EXP／Credits ×${carryMult(r.trip)}${carryMult(r.trip) > 1 ? '' : '（新手加成已結束）'}</div>` : ''}
      <div class="cols"><div class="tower">${floors}</div><div>${r.startPick && r.offer && RULES.cp8 ? `<div data-startpick><div class="hint">從第 ${r.abyss?.start} 層出發：先選 run buff（本趟有效）</div>${this.offerHtml()}</div>` : ''}${RULES.cp8 && r.held && !r.startPick ? this.heldHtml() : ''}<h3>背包（${r.bag.length}）· 藥水 ❤${this.p.potions.health} ✦${this.p.potions.mana} ☯${this.p.potions.spirit}</h3><div class="inv">${bag || '<div class="empty">還沒有戰利品</div>'}</div></div></div>
      <div class="foot"><button data-retreat class="ghost">撤退回城（保留 100%）</button><span class="spacer"></span><span class="hint">選擇本層一個節點。${r.abyss ? `<span data-bossnext>每 5 層是首領（下一個：深淵 ${Math.ceil(depthOf(r) / 5) * 5} 層）。</span>` : `第 ${towerRules(r.cp5).bossFloors.join('、')} 層是首領。`}</span></div></div>`;
  }

  enc: string[] = []; encAt = 0;
  /** rc17: encounter box shown for the first ENC_MS of a battle, then fades out (CSS); not rendered afterwards. */
  encHtml(): string {
    const t = Date.now() - this.encAt;
    if (!this.enc.length || t >= ENC_MS) return '';
    return `<div class="encounter" data-encounter style="animation-delay:${-t}ms">${this.enc.map((l) => `<div>${l}</div>`).join('')}</div>`;
  }
  battleHtml(): string {
    const b = this.battle!;
    const lean = this.p.lean;
    // cp8-rc10 P0-4: a skill that came off cooldown stays "pending" until it is castable (OC permitting) and has been shown
    // once, so the prompt is no longer lost when the turn it comes off cooldown is short on OC. Reset per battle.
    if (this.cdBattle !== b) { this.cdBattle = b; this.cdShown = []; this.cdPending = skillKit(b).filter((id) => canUse(b, { kind: 'skill', id, target: this.target })); } // cp8-rc11 4(a): opening OC (blade 50) can already pay a skill
    const sugSk = RULES.cp8 ? suggestSkill(b, this.target) : null; // rc13 item 3(b): only the skill whose expected damage beats A by > 10% lights
    const ready = RULES.cp8 && (lean === 'blade' || lean === 'oc') ? this.cdPending.filter((id) => id === sugSk) : [];
    this.cdShown = ready;
    const spellSug = RULES.cp8 && lean === 'arcane' ? this.arcaneSpell(b) : null;
    const sk = skillKit(b).map((id, i) => {
      const s = SKILLS[id];
      const cd = b.cooldowns[id];
      return `<button ${ready.includes(id) ? 'class="suggest" data-readybtn ' : RULES.cp8 && (lean === 'blade' || lean === 'oc') && canUse(b, { kind: 'skill', id, target: this.target }) ? 'class="castable" data-castable ' : ''}data-act="skill:${id}" ${gate(b, { kind: 'skill', id, target: this.target }, s.desc)}><img class="icon sp" src="assets/icons/k-${SKILL_ICON[id] ?? id}.png" alt="" width="32" height="32">${'QWE'[i]}·${s.zh}<small>${cd > 0 ? `冷卻${cd}` : `${s.oc}OC`}</small></button>`;
    }).join('');
    const sp = (Object.keys(SPELLS) as SpellId[]).map((id, i) => `<button class="spell el-${SPELLS[id].element}${spellSug?.id === id ? ' suggest" data-sugbtn="1' : ''}" data-act="spell:${id}" ${gate(b, { kind: 'spell', id, target: this.target })}><img class="icon sp" src="assets/icons/sp-${id}.png" alt="" width="32" height="32">${i + 1}·${SPELLS[id].zh}<small>${spellCost(b, id)}MP${SPELLS[id].targets > 1 ? '·群體' : ''}</small></button>`).join('');
    const po = (['health', 'mana', 'spirit'] as PotionId[]).map((id, i) => `<button data-act="item:${id}" ${b.potions[id] <= 0 ? 'data-potempty' : b.itemCd[id] > 0 ? `data-potcd="${b.itemCd[id]}"` : ''} ${id === 'health' && RULES.cp8 ? (potHint(b) ? 'class="suggest pothint" data-pothint' : '') : id === 'health' && b.itemCd.health <= 0 && b.monsters.some((m) => m.hp > 0 && m.charge > 0) ? 'class="suggest"' : ''} ${gate(b, { kind: 'item', id })}><img class="icon sp" src="assets/icons/p-${id}.png" alt="" width="32" height="32">${'ZXC'[i]}·${POTION_ZH[id]}<small>${b.potions[id] <= 0 ? '用完' : b.itemCd[id] > 0 ? `冷卻 ${b.itemCd[id]}｜剩 ${b.potions[id]}` : `×${b.potions[id]}`}</small></button>`).join('');
    const chargers = b.monsters.filter((m) => (RULES.cp8 ? windingUp(m) : m.hp > 0 && m.charge > 0)); // cp8-rc7 P1 item 3: 元素脈衝 too
    const charging = chargers.length > 0;
    const TZ: Record<string, string> = { piercing: '刺擊', crushing: '打擊', slashing: '斬擊', fire: '火', cold: '冰', elec: '雷', wind: '風', holy: '聖', dark: '暗' };
    // rc17 製作人決定：弱點／抗性只留怪物頭上的簡短版，右上列表拿掉。
    const hpPot = b.potions.health > 0 && b.itemCd.health <= 0;
    // cp8-rc8 P2 item 2: blade / oc see which skills they can use (or what unlocks them) on turn 1 of every fight.
    const skillHint = RULES.cp8 && b.turn === 0 && (lean === 'blade' || lean === 'oc') ? (() => {
      const ids = skillKit(b);
      const now = ids.filter((id) => canUse(b, { kind: 'skill', id, target: this.target })).map((id) => `${'QWE'[ids.indexOf(id)]}·${SKILLS[id].zh}`);
      const later = ids.filter((id) => !canUse(b, { kind: 'skill', id, target: this.target }) && b.cooldowns[id] <= 0 && /OC/.test(whyNot(b, { kind: 'skill', id, target: this.target }) ?? '')).map((id) => `${'QWE'[ids.indexOf(id)]}·${SKILLS[id].zh}（${SKILLS[id].oc}OC）`);
      const sp = canUse(b, { kind: 'spirit' }) ? '、S·靈動架勢' : '';
      return `<div class="hint" data-skillhint>💡 本場可用：${now.length ? now.join('、') + sp : `攻擊累積 OC 後可用 ${later.join('、') || '—'}${sp}`}</div>`;
    })() : '';
    const ids0 = skillKit(b);
    const readyHint = ready.length && !skillHint ? `<div class="hint suggest" data-skillready="${ready.join(',')}">💡 ${ready.map((id) => `${'QWE'[ids0.indexOf(id)]}·${SKILLS[id].zh}`).join('、')} 可以用了（冷卻結束／OC 已夠）（${ready.map((id) => SKILLS[id].desc).join('；')}）</div>` : '';
    const elemHint = spellSug ? this.arcaneHint(b, spellSug) : '';
    const decide = charging ? `<div class="decide" data-decide>⚠ ${chargers.map((m) => esc(m.name)).join('、')} ${chargers.some((m) => m.charge > 0) ? `正在蓄力，下一擊 ×${BOSS_CHARGE_MULT} 傷害！` : chargers.some((m) => (m as { heavyNext?: boolean }).heavyNext) ? '正在蓄力一擊（最大單擊可達最大 HP 一半以上）！' : '準備放出元素脈衝（大招）！'}<br>${this.decideLine(b, hpPot)} · HP ${Math.round(b.hp)}/${Math.round(b.d.hp)}${RULES.cp8 ? this.chargeExtra(b, chargers) : ''}</div>` : '';
    return `<div class="hud"><div class="hudl">${this.bars(b.hp, b.d.hp, b.mp, b.d.mp, b.sp, b.d.sp, b.oc)}
        <div class="status" data-bfloor="${floorLabel(this.run)}">第 ${floorLabel(this.run)} 層 · ${NODE_ZH[this.battleType]} · 回合 ${b.turn}${b.spirit ? ' · <b class="spirit">靈動架勢</b>' : ''}${b.defendTurns > 0 ? ' · 防禦中' : ''}${charging ? ` · <b class="warn" data-chargestatus>${chargers.some((m) => m.rank === 'boss') ? '首領' : '敵人'}蓄力中！建議 ${((k) => k.map((x) => ({ A: 'A·攻擊', D: 'D·防禦', Z: 'Z·喝藥', S: 'S·靈動架勢' } as Record<string, string>)[x] ?? x).join(' 或 '))(chargeAdvice(b, this.target).keys)}</b>` : ''}</div>${this.dotHtml(b.cp5?.pdot)}${this.battleBuffRow()}</div>
        ${this.cp5TipBox.length ? `<div class="cp5tips" data-cp5tips>${this.cp5TipBox.join('')}</div>` : ''}<div class="weakbox">${spellSug ? `<div class="sugtitle" data-sugtitle="${spellSug.id}">建議：<b>${(Object.keys(SPELLS) as SpellId[]).indexOf(spellSug.id) + 1}·${SPELLS[spellSug.id].zh}</b>（${spellSug.pct > 0 ? `弱${TZ[spellSug.type] ?? spellSug.type}` : `${TZ[spellSug.type] ?? spellSug.type}傷害較高`}）</div>` : ''}</div>${decide}${skillHint}${readyHint}${elemHint}
        ${this.refused ? `<div class="warn refused" data-refused>${esc(this.refused)}</div>` : ''}<div class="logwrap">${this.encHtml()}<div class="log">${this.log.slice(-6).map((l) => `<div>${l}</div>`).join('')}</div></div></div>
      <div class="cmdbar ${this.busy ? 'busy' : ''}">
        <div class="grp"><button class="main" data-act="attack"><img class="icon sp" src="assets/icons/c-attack.png" alt="" width="32" height="32">A·攻擊${((q) => (q.kind === 'spell' ? `<small data-quick="${q.id}">${SPELLS[q.id].zh}</small>` : ''))(quickAttack(b, this.target, this.p.equipped.mainHand?.group ?? 'none'))}</button><button data-act="defend" class="${charging && !this.guardOnly(b) && (!RULES.cp8 || hpDanger(b)) ? 'suggest' : ''}"><img class="icon sp" src="assets/icons/c-defend.png" alt="" width="32" height="32">D·防禦</button><button data-act="focus"><img class="icon sp" src="assets/icons/c-focus.png" alt="" width="32" height="32">F·專注</button><button data-act="spirit" ${RULES.cp8 && guardHint(b) === 'spirit' ? 'class="suggest" data-guardhint ' : ''}${gate(b, { kind: 'spirit' }, '需 OC ≥ ' + SPIRIT_MIN_OC + '：技能、防禦、專注都會花 OC，想開架勢就先連續攻擊')}>S·${b.spirit ? '解除架勢' : '靈動架勢'}<small>${b.spirit ? '' : b.locked?.spirit ? 'F4 解鎖' : `OC ${Math.floor(b.oc)}/${SPIRIT_MIN_OC}`}</small></button></div>
        <div class="grp">${sk}</div><div class="grp">${sp}</div><div class="grp">${po}</div>
        <div class="hint">點擊怪物選擇目標 · Tab 切換目標</div></div>`;
  }

  /** CP5: floor theme title (map). */
  themeHtml(): string {
    const r = this.run;
    if (!r?.cp5) return '';
    if (r.abyss) { const dn = depthOf(r), k = abyssMult(dn); return `<div class="theme" data-abyssinfo="${dn}"><b>深淵 · ${tierZh(dn)}</b> · ${(() => { const k1 = abyssMult(1); return `<span data-abyssrel title="深淵總倍率（含第 1 層起算的深淵基礎倍率）：HP ×${k.hp.toFixed(2)}、傷害 ×${k.dmg.toFixed(2)}">怪物 HP ×${(k.hp / k1.hp).toFixed(2)}、傷害 ×${(k.dmg / k1.dmg).toFixed(2)}（相對深淵第 1 層）</span>`; })()} · 每 5 層首領保底 1 件${QUALITY_ZH[guaranteeQuality(dn)]}以上 · 戰死帶回 50%（再乘帶回倍率）</div>`; }
    const t = themeOf(r.floor);
    return `<div class="theme" data-theme="${esc(t.zh)}"><b>${esc(t.zh)}</b>（第 ${Math.floor((r.floor - 1) / 5) * 5 + 1}–${Math.floor((r.floor - 1) / 5) * 5 + 5} 層）· 常見：${themeRaces(t).join('、')} · 多抗：${t.elems.map((e) => ELEM_ZH[e]).join('、')}${BOSS_BY_FLOOR[Math.ceil(r.floor / 5) * 5] ? ` · 首領：${BOSS_BY_FLOOR[Math.ceil(r.floor / 5) * 5]!.title}` : ''}</div>`;
  }
  /** CP5: player bleed / burn with how to clear it. */
  dotHtml(p?: { burn: number; burnTurns: number; bleed: number; bleedTurns: number }): string {
    if (!this.run?.cp5 || !p || (!p.burnTurns && !p.bleedTurns)) return '';
    const parts = [p.bleedTurns ? `<b class="dot-bleed" data-pdot="bleed">🩸流血 ${p.bleed}/回合 ×${p.bleedTurns}</b>` : '', p.burnTurns ? `<b class="dot-burn" data-pdot="burn">🔥燃燒 ${p.burn}/回合 ×${p.burnTurns}</b>` : ''].filter(Boolean).join(' ');
    return `<div class="pdot" data-pdotbox>${parts} <span class="hint">解除：Z·生命藥水 或 D·防禦</span></div>`;
  }
  /** CP5: affix nameplate + boss signature state for one monster (weak panel). */
  plateHtml(m: Monster): string {
    if (!this.run?.cp5) return '';
    const x = m as Monster & Cp5Mon;
    const aff = (x.affixes ?? []).map((a: AffixId) => `<span class="affix" data-affix="${a}" title="${esc(AFFIXES[a].desc)}">${AFFIXES[a].zh}<small>${esc(AFFIXES[a].desc)}</small></span>`).join('');
    let sig = '';
    if (x.sig) {
      const ic = SIG_TEXT[x.sig].icon;
      if (x.sig === 'shield' && x.shieldEl) sig = `${ic} ${ELEM_ZH[x.shieldEl]}之盾 · 破綻 <b>${ELEM_ZH[x.breachEl!]}</b>${x.pulseNext ? ` <b class="warn">⚡ ${esc(SIG_TEXT.shield.tele)}</b>` : ''}`;
      else if (x.thornTurns) sig = `${ic} 尖刺盾 ${x.thornTurns} 回合（別用物理）`;
      else if (x.sigPending || x.drainNext) sig = `<b class="warn">${ic} ${esc(SIG_TEXT[x.sig].tele)}</b>`;
      // CP5 rc2 fix 4: no idle signature icon (the resting ⟳ read like a summon warning); only real tells / states show.
      if (sig) sig = `<span class="tele" data-tele="${x.sig}${x.sigPending || x.drainNext || x.thornTurns || x.pulseNext ? '-on' : ''}">${sig}</span>`;
    }
    return aff || sig ? ` <span class="plate">${aff}${sig}</span>` : '';
  }
  /** CP5: log lines for signature / player DoT events, plus first-encounter tips. */
  cp5Log(ev: BEvent[]): void {
    for (const e of ev) {
      if (e.t === 'sig') this.log.push(`<span class="warn" data-sig="${e.sig}">${SIG_TEXT[e.sig].icon} ${esc(e.text)}</span>`);
      if (e.t === 'pdot') this.log.push(`<span class="dot-${e.kind}" data-pdotlog>${e.kind === 'burn' ? '🔥燃燒' : '🩸流血'} -${e.dmg}（Z·生命藥水 或 D·防禦 可解除）</span>`);
      if (e.t === 'status' && e.to === 'player') this.log.push(`<span class="statusfx" data-status>${esc(e.text)}</span>`);
    }
  }
  /** CP5 first-encounter tips stay on screen for the whole battle. */
  cp5TipBox: string[] = [];
  cp5Tips(b: BattleState): void {
    for (const m of b.monsters as (Monster & Cp5Mon)[]) {
      if (m.sig) { const t = tip(this.p, `cp5sig:${m.sig}`, SIG_TEXT[m.sig].tip); if (t) this.cp5TipBox.push(`<div class="unlock" data-cp5tip="${m.sig}">💡 ${esc(t)}</div>`); }
      { const h = m.affixes ? (RULES.cp6Abyss && this.data.run?.abyss ? abyssDangerHint : dangerHint)(m.affixes) : null; if (h) this.cp5TipBox.push(`<div class="unlock warn" data-cp5danger>${esc(h)}</div>`); }
      for (const a of m.affixes ?? []) { const t = tip(this.p, `cp5aff:${a}`, `精英詞綴【${AFFIXES[a].zh}】：${AFFIXES[a].desc}${a === 'flame' || a === 'leech' ? '。中了可用生命藥水或防禦解除' : a === 'antimagic' || a === 'warded' ? '。改用普攻或技能比較划算' : a === 'spikes' || a === 'hard' ? '。改用法術比較划算' : ''}`); if (t) this.cp5TipBox.push(`<div class="unlock" data-cp5tip="${a}">💡 ${esc(t)}</div>`); }
    }
  }
  /** CP4: held buffs strip (map / battle). */
  buffStrip(): string {
    const ids = this.run?.buffs;
    if (!RULES.cp4RunBuffs || !ids) return '';
    const f = formed(ids), c = combos(ids);
    const on = (Object.keys(c) as (keyof Combos)[]).filter((k) => c[k]);
    return `<div class="buffs${RULES.cp8 ? ' fixh' : ''}" data-buffs="${ids.length}">${ids.map((id) => `<span class="bf r-${BUFF[id]!.rarity}" title="${esc(BUFF[id]!.desc)}">${BUFF[id]!.zh}</span>`).join('') || '<span class="hint">尚無 buff</span>'}
      ${f.length ? `<span class="hint">流派成形：${f.map((s) => SCHOOL_ZH[s]).join('、')}</span>` : ''}${on.length ? `<span class="hint">組合：${on.map((k) => comboZh(k)).join('；')}</span>` : ''}</div>`;
  }
  /** CP4 rc #3: held buffs in battle — one icon per buff, hover for name/desc; combo progress.
   *  CP4-rc-fix 4: icon = school glyph + school colour/tint + the buff's first character, so buffs of one school are told apart too. */
  battleBuffRow(): string {
    const ids = this.run?.buffs;
    if (!RULES.cp4RunBuffs || !ids?.length) return '';
    const GLYPH: Record<string, string> = { blade: '⚔', oc: '⚡', arcane: '✦', bulwark: '⛨', none: '◆' };
    const c = combos(ids), cnt = schoolCounts(ids);
    const prog = SCHOOLS.filter((s) => cnt[s] > 0).map((s) => `<span class="bprog ${c[s as keyof Combos] ? 'on' : ''}" data-tip="${esc(`${SCHOOL_ZH[s]} ${cnt[s]}/${COMBO_AT}：${comboZh(s as keyof Combos)}${RULES.cp8 && s === 'bulwark' ? '（搭盾才有格擋）' : ''}`)}">${GLYPH[s]}${cnt[s]}/${COMBO_AT}</span>`).join('');
    return `<div class="bbuffs" data-bbuffs="${ids.length}">${ids.map((id) => { const b = BUFF[id]!; return `<span class="bic r-${b.rarity} s-${b.school}" data-bic="${id}" data-tip="${esc(`【${b.zh}】${RARITY_ZH[b.rarity]}·${SCHOOL_ZH[b.school]}\n${b.desc}`)}"><i>${GLYPH[b.school]}</i>${esc([...b.zh][0] ?? '')}</span>`; }).join('')}${prog}</div>`;
  }
  buffCard(id: string, btn: string): string {
    const b = BUFF[id]!;
    return `<div class="buffcard r-${b.rarity}"><div class="bh"><b>${b.zh}</b><small>${RARITY_ZH[b.rarity]} · ${SCHOOL_ZH[b.school]}${b.core ? ' · 核心' : ''}</small></div><div class="bd">${esc(b.desc)}${RULES.cp8 && b.school === 'bulwark' ? '<br><small class="warn" data-shieldnote>搭盾才有格擋</small>' : ''}</div>${btn}</div>`;
  }
  /** CP4 r2 step 3: before -> after rows for a buff choice. */
  previewHtml(id: string): string {
    const rows = buffPreview(this.p, this.run, id);
    return `<div class="bprev" data-bprev="${id}">${rows.length ? rows.map((x) => `<div class="iwgain" data-bprow="${x.k}">${esc(x.zh)} ${esc(x.before)} → <b>${esc(x.after)}</b></div>`).join('') : '<div class="hint">目前裝備／技能用不到，數值不變</div>'}</div>`;
  }
  offerHtml(): string {
    const r = this.run;
    if (!RULES.cp4RunBuffs) return '';
    let out = '';
    if (r.offer) out += `<div class="offer" data-offer="${r.offer.src}"><h3>選擇一個 buff（本趟有效）${r.offersLeft ? `　還有 ${r.offersLeft} 次` : ''}</h3><div class="buffrow">${r.offer.ids.map((id) => this.buffCard(id, `${this.previewHtml(id)}<button class="big" data-buff="${id}">選這個</button>`)).join('')}</div>
      <div class="row"><button class="ghost" data-buffskip>不拿</button></div></div>`;
    if (r.risk) {
      const k = r.risk, x = RISKS[k];
      const btns = k === 'discard' ? (r.buffs ?? []).map((id) => `<button data-risk="discard:${id}">捨棄【${BUFF[id]!.zh}】</button>`).join(' ') : `<button data-risk="${k}">${x.zh}</button>`;
      out += `<div class="risk" data-riskbox="${k}"><h3>⚠ 另外可加上風險（選填，三選一照拿）：${x.zh}</h3><div>代價：${x.cost}　回報：${x.reward}</div><div class="row">${btns}</div></div>`;
    }
    return out + this.buffStrip();
  }

  nodeHtml(): string {
    const r = this.run;
    const t = r.current?.type;
    let body = '';
    if (this.pending.loot) {
      const l = this.pending.loot;
      const pots = Object.entries(l.potions).filter(([, v]) => v).map(([k, v]) => `${POTION_ZH[k as PotionId]} ×${v}`).join('、');
      body = `<h2>${t === 'chest' ? '寶箱' : '勝利！'}</h2><div class="gain">${[l.exp ? `+${l.exp.toLocaleString()} EXP` : '', `+${l.credits} C`, pots].filter(Boolean).join(' · ')}</div>
        <div class="inv">${l.equips.map((e) => this.lootCard(e, l)).join('') || '<div class="empty">這次沒有裝備掉落</div>'}</div>`;
    } else if (t === 'merchant') {
      const st = r.merchant!;
      const pot = (Object.keys(RULES.potionPrice) as PotionId[]).map((k) => `<button data-mbuyp="${k}" ${this.p.credits + r.credits < RULES.potionPrice[k] ? 'disabled' : ''}>${POTION_ZH[k]} ${RULES.potionPrice[k]}C</button>`).join(' ');
      body = `<h2>$ 流浪商人</h2><div>可用：${(this.p.credits + r.credits).toLocaleString()} C（先扣本趟所得）</div><div class="row">${pot}</div>
        <div class="inv">${st.equips.map((x, i) => this.itemCard(x.e, `<button data-mbuy="${i}" ${this.p.credits + r.credits < x.price ? 'disabled' : ''}>買 ${x.price}C</button>`) + this.compare(x.e)).join('') || '<div class="empty">賣完了</div>'}</div>
        ${RULES.cp4RunBuffs ? `<h3>Buff（本趟有效）</h3><div class="buffrow">${(r.buffStock ?? []).map((x, i) => this.buffCard(x.id, `${this.previewHtml(x.id)}<button data-bbuy="${i}" ${this.p.credits + r.credits < x.price ? 'disabled' : ''}>買 ${x.price}C</button>`)).join('') || '<div class="empty">Buff 賣完了</div>'}</div>` : ''}`;
    } else if (t === 'rest') {
      const d = runDerived(this.p, r);
      const slots = SLOTS.filter((s) => this.p.equipped[s]).map((s) => `<div class="forge" data-forge="${s}"><button data-up="${s}">強化${SLOT_ZH[s]}（+${this.p.equipped[s]!.iw} → +${this.p.equipped[s]!.iw + 1}）</button> <small>${esc(equipName(this.p.equipped[s]!))}：</small>${iwGain(this.p.equipped[s]!)}</div>`).join('');
      body = `<h2>♨ 營火</h2>${this.bars(r.hp, d.hp, r.mp, d.mp, r.sp, d.sp)}<p>二選一：</p><div class="row"><button class="big" data-heal>休息：回復 60% HP，MP/SP 全滿</button></div>
        <p>或在火邊鍛造（裝備世界 +1，永久保留）：</p><div class="row">${slots || '沒有可強化的裝備'}</div>`;
    } else if (t === 'shrine' && RULES.cp4RunBuffs) {
      body = `<h2>✦ 神龕</h2>`;
    } else if (t === 'shrine') {
      body = `<h2>✦ 神龕</h2><p>選擇一項祝福（僅限本趟）：</p><div class="row">${SHRINES.map((s) => `<button class="big" data-shrine="${s.id}">${s.zh}<small>${s.desc}</small></button>`).join('')}</div>`;
    }
    const done = !!this.pending.loot || !!this.pending.text;
    return `<div class="panel node">${this.noticeHtml()}${body}${this.offerHtml()}${this.pending.text ? `<div class="gain">${this.pending.text}</div>` : ''}
      <div class="foot"><span class="spacer"></span><button class="big" data-continue${this.run.offer ? ' disabled data-needpick title="先選一個 buff 或按「不拿」"' : ''}>${this.run.offer ? '先選 buff 或「不拿」' : done || t === 'merchant' ? '繼續前進 ▲' : '略過 ▲'}</button></div></div>`;
  }

  lastSettlement: Settlement | null = null;
  /** cp8-rc6 item 6: the last enemy hit that did damage this run (for the 死因 line on the death screen). */
  lastHit: { who: string; label?: string; dmg: number; maxHp: number; charged: boolean } | null = null;
  /** cp8-rc7 P1 item 5: damage taken in each of the last DEATH_TURNS enemy turns (biggest single hit + any charged / big-move hit). */
  recent: { turn: number; taken: number; big?: { who: string; label?: string; dmg: number; charged: boolean } }[] = [];
  /** cp8-rc6 items 3 + 6: estimated heavy-hit damage and, when the health potion is on cooldown, a hint to use 防禦 / 靈動 instead. */
  /** rc13 item 1: HP in danger and the health potion unusable (cooldown / none left) → only S (or keep attacking) is hinted, never D. */
  // rc14 item 3: the hpDanger gate let high-HP turns (741/850, 588/786, crit est ≥ HP/2) with the potion on cooldown fall through to 「D·防禦 或 Z」. Potion unusable → S/A only.
  /** rc15 item 3 (QA rc13 arcane: F10 661/724 and F13 724/724 with the potion on cooldown, F16 potions gone): outside HP danger the decision
   *  is A or the hinted skill only (never D). Danger + potion unusable → S / A (rc14 guardOnly). Danger + potion usable → D or Z (unchanged). */
  decideLine(b: BattleState, _hpPot: boolean): string {
    // rc16 items 1–2: one decision function (core chargeAdvice) for the panel, status bar, urgent line and death screen.
    const a = chargeAdvice(b, this.target); this.lastAdvice = { turn: b.turn, a };
    return `<span data-decide="${a.danger ? 'danger' : 'safe'}" data-keys="${a.keys.join(',')}">決策：<b>${a.text}</b></span>`;
  }
  guardOnly(b: BattleState): boolean { return RULES.cp8 && !canUse(b, { kind: 'item', id: 'health' }); }
  chargeExtra(b: BattleState, chargers: Monster[]): string {
    const est = Math.max(...chargers.map((m) => chargeEstimate(b, m)));
    const estD = Math.max(...chargers.map((m) => chargeEstimate(b, m, true)));
    const estC = Math.max(...chargers.map((m) => chargeEstimate(b, m, false, true))); // rc13 item 2: monster crit case
    const estDC = Math.max(...chargers.map((m) => chargeEstimate(b, m, true, true)));
    const pct = Math.round((est / b.d.hp) * 100), pctC = Math.round((estC / b.d.hp) * 100);
    const cd = b.itemCd.health;
    const urgent = RULES.cp8 ? hpDanger(b) : estC >= b.hp * 0.5; // rc16 item 1: same single rule as the decision // cp8-rc7 P1 item 3: ≥ 50% of current HP; rc13 item 2: judged on the crit value
    return `<br><span data-chargeest="${est}:${pct}" data-chargecrit="${estC}:${pctC}">預估傷害 一般–暴擊 約 ${est}–${estC}（佔最大 HP ${pct}–${pctC}%）· 防禦後約 ${estD}–${estDC}</span>`
      + (urgent && (!RULES.cp8 || hpDanger(b)) ? `<br><b class="warn" data-urgent="${estC}:${Math.round(b.hp)}">下回合全體暴擊估計 ≥ 目前 HP（${chargeAdvice(b, this.target).est} ≥ ${Math.round(b.hp)}）：照上面的決策按鍵</b>` : '')
      + (this.guardOnly(b) || (RULES.cp8 && !hpDanger(b)) ? '' : this.chargePayoff(b, chargers, est, estD))
      + (cd > 0 || b.potions.health <= 0 ? `<br><b class="warn" data-cdhint="${cd}">${b.potions.health <= 0 ? '生命藥水已用完' : `生命藥水冷卻中（還要 ${cd} 回合）`}，${guardHint(b) === 'spirit' ? '這回合改用 <b>S·靈動架勢</b>' : '繼續攻擊、儘快收掉怪物'}（D·防禦 在 OC 不足 25 時只減傷不回血，又放棄攻擊，此時不建議）</b>` : '');
  }
  /** cp8-rc9 P2 (自訂，非原版 prompt): arcane — the castable spell that hits the target's biggest elemental weakness. */
  /** cp8-rc10 P0-4 */
  arcaneSpell(b: BattleState): { id: SpellId; type: string; pct: number } | null { return suggestSpell(b, this.target); } // cp8-rc12 item 2: MP- and splash-aware (core)
  arcaneHint(b: BattleState, g: { id: SpellId; type: string; pct: number }): string {
    const m = b.monsters[this.target]!, ids = Object.keys(SPELLS) as SpellId[];
    return `<div class="hint suggest" data-spellhint="${g.id}">💡 ${esc(m.name)} ${g.pct > 0 ? `弱${ELEM_ZH[g.type]} ${g.pct}%` : `用${ELEM_ZH[g.type]}傷害較高`}：建議 <b>${ids.indexOf(g.id) + 1}·${SPELLS[g.id].zh}</b>（已標亮）</div>`;
  }
  /** cp8-rc9 P2 (自訂，非原版 prompt; numbers are the battle's own): what D·防禦 / Q·盾擊 actually buy against this wind-up. */
  chargePayoff(b: BattleState, chargers: Monster[], est: number, estD: number): string {
    const save = Math.max(0, est - estD), parts = [`少受約 <b>${save}</b>（${Math.round((save / Math.max(1, est)) * 100)}%）`];
    if (b.oc >= DEF.ocCost) parts.push(`回 ${Math.round(DEF.hpRecover * 100)}% HP`);
    if (b.mods?.combo.bulwark) parts.push(`下一擊反擊 ×${BULWARK_COUNTER_MULT}`);
    const heavy = chargers.some((m) => (m as { heavyNext?: boolean }).heavyNext);
    const bash = heavy && canUse(b, { kind: 'skill', id: 'shieldBash', target: b.monsters.indexOf(chargers.find((m) => (m as { heavyNext?: boolean }).heavyNext)!) });
    return `<br><span data-payoff="${save}">按 D·防禦：${parts.join('，')}${bash ? '；或 <b>Q·盾擊</b> 暈眩 → 直接打斷蓄力一擊（0 傷害）' : ''}</span>`;
  }
  /** cp8-rc6 item 6: 死因 line — source of the last hit, its damage, and one hint. */
  /** rc16 item 2: the death screen repeats the decision the battle panel showed on the last charge turn (same chargeAdvice). */
  adviceNote(): string {
    const l = this.lastAdvice;
    return l ? `<span data-deathadvice="${l.a.keys.join(',')}">第 ${l.turn} 回合蓄力時的提示：${l.a.text}</span>` : '看到 ⚠ 預告時，照戰鬥面板的「決策」按鍵。';
  }
  deathCause(): string {
    const r = this.recent, hb = r.map((x) => x.big!).filter(Boolean);
    if (r.length) { // cp8-rc7 P1 item 5: the charged / big-move hit (if any) or the biggest single hit of the last turns, plus damage per turn
      const ch = hb.find((x) => x.charged), top = ch ?? hb.reduce((x, y) => (y.dmg > x.dmg ? y : x)), maxHp = this.lastHit?.maxHp ?? 1;
      const hint = ch ? `${esc(ch.who)} 的${esc(ch.label ?? '重擊')}是蓄力／大招。${this.adviceNote()}` : top.dmg >= maxHp * 0.3 ? '單擊佔最大 HP 三成以上：HP 低於這個數字前就先喝藥或撤退。' : 'HP 被慢慢磨光：HP 剩一半時就喝藥，或在休息點回復後再前進。';
      const per = r.map((x) => `第 ${x.turn} 回合 -${x.taken}`).join('、');
      return `<p data-deathcause="${top.dmg}" ${ch ? `data-deathcharge="${ch.dmg}"` : ''}>死因：${ch ? '蓄力大招 ' : '最後幾回合最大單擊 '}${esc(top.who)}${top.label ? ' ' + esc(top.label) : ''} 造成 ${top.dmg} 傷害（佔最大 HP ${Math.round((top.dmg / maxHp) * 100)}%）<br><span data-deathturns>最後 ${r.length} 回合受到的傷害：${per}</span><br><span class="hint">建議：${hint}</span></p>`;
    }
    const h = this.lastHit;
    if (!h) return '<p data-deathcause="none">死因：無法判定（最後一擊不是敵人的普通攻擊）</p>';
    const hint = h.charged ? `首領蓄力（⚠）。${this.adviceNote()}` : h.dmg >= h.maxHp * 0.3 ? '單擊佔最大 HP 三成以上：HP 低於這個數字前就先喝藥或撤退。' : 'HP 被慢慢磨光：HP 剩一半時就喝藥，或在休息點回復後再前進。';
    return `<p data-deathcause="${h.dmg}">死因：${esc(h.who)}${h.label ? ' ' + esc(h.label) : ''} 造成 ${h.dmg} 傷害（佔最大 HP ${Math.round((h.dmg / h.maxHp) * 100)}%）<br><span class="hint">建議：${hint}</span></p>`;
  }
  resultHtml(): string {
    const s = this.lastSettlement!;
    const title = s.outcome === 'clear' ? '♛ 通關試煉之塔！' : s.outcome === 'dead' ? '☠ 倒下了……' : '撤退回城';
    // rc10: the 50% is multiplied again by the carry-back multiplier shown below; say so instead of a bare 50%.
    const carryNote = s.mult !== 1 ? `，再乘下方帶回倍率 ×${s.mult}（合計約 ${Math.round(RULES.death.exp * s.mult * 100)}%）` : '';
    const rule = s.outcome === 'dead' ? `死亡：EXP、熟練度與 Credits 保留 50%${carryNote}，背包只留最好的一件，消耗品全失。穿戴中的裝備不會遺失。` : '全部戰利品、EXP 與 Credits 都帶回城鎮。';
    return `<div class="panel result ${s.outcome}"><h2>${title}</h2><p>${reachedMsg(s.floor, s.passed ?? Math.max(0, s.floor - 1), !!s.abyss).replace(/第 (\d+) 層（已通過 (\d+) 層）/, '第 <b data-reached>$1</b> 層（已通過 <b data-passed>$2</b> 層）')}。${rule}</p>${s.outcome === 'dead' && RULES.cp8 ? this.deathCause() : ''}
      <div class="hint" data-carry="${s.mult}">${s.abyss ? '深淵帶回倍率（1＋0.05×難度階）' : s.mult > 1 ? '新手帶回加成' : '帶回倍率'} ×${s.mult}</div>${s.unlocks.length ? `<div class="unlocks" data-unlock>${s.unlocks.map((u) => `<div>${esc(u)}</div>`).join('')}</div>` : ''}
      <div class="gain">+${s.exp.toLocaleString()} EXP · +${s.credits} C${s.levelAfter > s.levelBefore ? ` · <b>升級！Lv${s.levelBefore} → Lv${s.levelAfter}</b>` : ''}</div>${s.cp8 ? `<div class="gain" data-cp8carry><b>這趟帶回：</b>等級 Lv${s.levelBefore} → Lv${s.levelAfter}${s.levelAfter > s.levelBefore ? ` <b>(+${s.levelAfter - s.levelBefore})</b>` : '（不變）'} · 裝備戰力 ${s.cp8.pw0.toLocaleString()} → <b>${s.cp8.pw1.toLocaleString()}</b>${s.cp8.pw1 > s.cp8.pw0 ? ` (+${Math.round((s.cp8.pw1 / Math.max(1, s.cp8.pw0) - 1) * 100)}%)` : ''}${s.cp8.worn.length ? ` · 途中自動換上 ${s.cp8.worn.length} 件` : ''}${s.cp8.attrPts ? ` · <b>可加 ${s.cp8.attrPts} 點屬性</b>（城鎮「全部處理」）` : ''}</div>` : ''}
      <h3 class="kept-h">保留（${s.kept.length} 件，已放入倉庫）</h3>
      <div class="inv kept">${s.kept.map((e) => this.itemCard(e)).join('') || '<div class="empty">沒有</div>'}</div>
      ${s.outcome === 'dead' ? `<h3 class="lost-h warn">遺失（${s.lostItems.length} 件${Object.values(s.lostPotions).some((n) => n) ? `，藥水 ${(Object.entries(s.lostPotions) as [PotionId, number][]).filter(([, n]) => n).map(([k, n]) => `${POTION_ZH[k]}×${n}`).join('、')}` : ''}）</h3>
      <div class="inv lost">${s.lostItems.map((e) => this.itemCard(e)).join('') || '<div class="empty">沒有</div>'}</div>` : ''}
      <div class="foot"><span class="spacer"></span><button class="big" data-town>回到城鎮</button></div></div>`;
  }

  // ---------- events ----------
  bind() {
    const on = (sel: string, f: (el: HTMLElement) => void) => this.root.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener('click', () => f(el)));
    on('[data-speed]', (el) => { this.data.settings.speed = Number(el.dataset.speed) as 1 | 2 | 4; this.stage.speed = this.data.settings.speed; this.save(); this.render(); (document.activeElement as HTMLElement | null)?.blur?.(); });
    this.root.querySelector<HTMLInputElement>('[data-skip]')?.addEventListener('change', (e) => { this.data.settings.skipAnim = (e.target as HTMLInputElement).checked; this.stage.skip = this.data.settings.skipAnim; this.save(); (e.target as HTMLInputElement).blur(); }); // cp8-rc7: blur so A / D hotkeys work right after
    on('[data-tab]', (el) => { this.townTab = el.dataset.tab as typeof this.townTab; this.render(); });
    const cnt = (el: HTMLElement) => (el.dataset.n === 'max' || el.dataset.n === 'all' ? 9999 : Number(el.dataset.n ?? 1));
    on('[data-add]', (el) => { allocate(this.p, el.dataset.add as keyof Player['attrs'], cnt(el)); this.save(); this.go('town'); });
    on('[data-resetall]', () => this.ask('一鍵全部重置屬性？', '<p>所有屬性歸零，已花的 EXP 全數退回，可以重新分配。</p>', '全部重置', () => { resetAttrs(this.p); this.save(); this.go('town'); }));
    on('[data-ref]', (el) => { refund(this.p, el.dataset.ref as keyof Player['attrs'], cnt(el)); this.save(); this.go('town'); });
    on('[data-equip]', (el) => {
      const e = this.p.inventory.find((x) => x.id === el.dataset.equip);
      if (e) this.confirmEquip(e, () => { equip(this.p, e); this.save(); this.go('town'); });
    });
    on('[data-unequip]', (el) => { unequip(this.p, el.dataset.unequip as Equip['slot']); this.go('town'); });
    on('[data-sell]', (el) => { const i = this.p.inventory.findIndex((x) => x.id === el.dataset.sell); if (i >= 0) { this.p.credits += sellPrice(this.p.inventory[i]!); this.p.inventory.splice(i, 1); } this.go('town'); });
    on('[data-iw]', (el) => {
      const g = prog(this.p); const e = this.p.equipped[el.dataset.iw as keyof Player['equipped']];
      if (!e) return;
      const c = g.iwUses === 0 ? 0 : IW_COST * (e.iw + 1);
      if (this.p.credits < c) return;
      this.p.credits -= c; e.iw++; g.iwUses++;
      this.notice = [`${equipName(e)} 強化至 +${e.iw}${c ? `（-${c}C）` : '（免費）'}`];
      this.save(); this.go('town');
    });
    on('[data-sellall]', () => { const n = this.p.inventory.length; const sum = this.p.inventory.reduce((t, e) => t + sellPrice(e), 0); this.ask('賣掉倉庫全部？', `<p class="warn">會賣掉倉庫裡全部 ${n} 件裝備，得到 ${sum}C。賣掉後無法買回。</p>`, `確定賣掉 ${n} 件`, () => { for (const e of this.p.inventory) this.p.credits += sellPrice(e); this.p.inventory = []; this.go('town'); }); }); // CP3-bugfix 6: confirm
    on('[data-buy]', (el) => { const k = el.dataset.buy as PotionId; if (this.p.credits >= RULES.potionPrice[k]) { this.p.credits -= RULES.potionPrice[k]; this.p.potions[k]++; } this.go('town'); });
    on('[data-newgame]', () => this.ask('建立新角色？', `<p class="warn">目前的存檔（Lv${level(this.p)}、${this.p.inventory.length} 件倉庫裝備、${this.p.credits}C）會被清空，無法復原。</p>${RULES.cp8 ? `<p>流派：<select data-newlean>${(['', 'blade', 'oc', 'arcane', 'bulwark'] as const).map((k) => `<option value="${k}"${(this.p.lean ?? '') === k ? ' selected' : ''}>${k ? SCHOOL_ZH[k] : '不指定'}</option>`).join('')}</select></p>` : ''}`, '清空並建立新角色', () => { const settings = { ...this.data.settings }; const nl = (document.querySelector<HTMLSelectElement>('[data-newlean]')?.value || undefined) as Player['lean']; this.data = App.fresh(nl); this.data.settings = settings; this.stage.speed = settings.speed; this.save(); this.go('town'); })); // CP4-rc-fix 5: speed / skip-anim are preferences, kept
    on('[data-modal-cancel]', () => { this.modal = null; this.prepKind = null; this.render(); });
    on('[data-modal-ok]', () => { const m = this.modal; this.modal = null; m?.onOk(); if (!this.modal) this.render(); });
    on('[data-start]', () => this.depart('main'));
    on('[data-abyss]', () => this.depart('abyss'));
    on('[data-prep]', (el) => this.prepFix(el.dataset.prep as PrepIssue | 'all'));
    document.querySelector('[data-abyss-start]')?.addEventListener('change', (ev) => { this.abyssStart = Number((ev.target as HTMLSelectElement).value); const b = document.querySelector('[data-abyss]'); if (b) b.textContent = `進入深淵塔（第 ${this.abyssStart} 層起）▶`; });
    on('[data-node]', (el) => this.enterNode(Number(el.dataset.node)));
    on('[data-mappot]', () => this.drinkMap());
    on('[data-potgo]', () => this.drinkMap()); // 自訂，非原版：rc18 喝藥再出發
    on('[data-retreat]', () => { if (confirm('撤退回城？本趟所得全部保留。')) { this.run.done = 'retreat'; this.endRun(); } });
    on('[data-bequip]', (el) => this.bagEquip(el.dataset.bequip!));
    on('[data-act]', (el) => this.command(el.dataset.act!));
    on('[data-continue]', () => { if (this.run.offer) return; this.modal = null; this.continueNode(); });
    on('[data-heal]', () => { this.pending.text = rest(this.p, this.run, 'heal'); this.save(); this.continueNode(); });
    on('[data-up]', (el) => { this.pending.text = rest(this.p, this.run, 'upgrade', el.dataset.up); this.save(); this.continueNode(); });
    on('[data-shrine]', (el) => { this.pending.text = shrine(this.p, this.run, el.dataset.shrine as 'might'); this.save(); this.render(); this.root.querySelectorAll<HTMLButtonElement>('[data-shrine]').forEach((b) => (b.disabled = true)); });
    on('[data-mbuy]', (el) => this.merchantBuy(Number(el.dataset.mbuy)));
    on('[data-buff]', (el) => { const r = this.run; this.pending.text = takeBuff(this.p, r, el.dataset.buff!); r.risk = null; this.nextOffer(); });
    on('[data-heldbuff]', (el) => this.heldResolve(el.dataset.heldbuff!));
    on('[data-heldskip]', () => { if (confirm('確定不拿？這次的 buff 放棄後不能再選。')) this.heldResolve(null); });
    on('[data-buffskip]', () => { if (RULES.cp6Abyss && !confirm('確定不拿？這次的 buff 放棄後不能再選。')) return; skipOffer(this.run); this.run.risk = null; this.nextOffer(); });
    on('[data-risk]', (el) => { const [k, id] = el.dataset.risk!.split(':'); this.pending.text = takeRisk(this.p, this.run, k as RiskId, id); this.save(); this.render(); });
    on('[data-bbuy]', (el) => { const r = this.run; const i = Number(el.dataset.bbuy); const x = r.buffStock?.[i]; if (x && this.pay(x.price)) { this.pending.text = takeBuff(this.p, r, x.id); r.buffStock!.splice(i, 1); } this.save(); this.render(); });
    on('[data-mbuyp]', (el) => { const k = el.dataset.mbuyp as PotionId; if (this.pay(RULES.potionPrice[k])) this.p.potions[k]++; this.save(); this.render(); });
    on('[data-town]', () => this.go('town'));
  }

  queued: string | null = null;
  queued2: string | null = null;
  /** cp8-rc9 P1-11: why the last key did nothing (shown above the command bar until the next accepted action). */
  refused = '';
  /** cp8-rc9 P2: skills whose cooldown ended on the last action (blade / oc prompt). */
  cdPending: SkillId[] = []; cdShown: SkillId[] = []; cdBattle: BattleState | null = null;
  /** cp8-rc9 item 1: wind-up input hold. */
  chargeHoldUntil = 0;
  windWas = false;

  key(e: KeyboardEvent) {
    if (this.screen === 'map' && this.run && e.code === 'KeyZ' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); return this.drinkMap(); } // rc16 item 3
    if (this.screen !== 'battle' || !this.battle) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tg = e.target as HTMLElement | null;
    if (tg && /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName) && !(tg instanceof HTMLInputElement && tg.type === 'checkbox')) return; // cp8-rc7: a focused checkbox (跳過動畫) no longer eats hotkeys
    // CP3-fix 6: use the physical key (e.code) so a Chinese IME (e.key = 'Process') or Caps Lock does not break hotkeys.
    const k = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : /^(Digit|Numpad)[0-9]$/.test(e.code) ? e.code.slice(-1) : e.key.toLowerCase();
    const map: Record<string, string> = { a: 'attack', d: 'defend', f: 'focus', s: 'spirit', z: 'item:health', x: 'item:mana', c: 'item:spirit' };
    (Object.keys(SPELLS) as SpellId[]).forEach((id, i) => (map[String(i + 1)] = `spell:${id}`));
    if (this.battle) skillKit(this.battle).forEach((id, i) => (map['qwe'[i]!] = `skill:${id}`)); // cp8-rc12: Q/W/E follow the style kit (was hard-wired to the 1H set)
    if (k === 'tab') {
      e.preventDefault();
      const live = this.battle.monsters.map((m, i) => (m.hp > 0 ? i : -1)).filter((i) => i >= 0);
      const nxt = live[(live.indexOf(this.target) + 1) % live.length] ?? 0;
      this.target = nxt; this.stage.setTarget(nxt);
      return;
    }
    if (!map[k]) return;
    e.preventDefault();
    // Keys pressed during an animation are queued (latest wins) instead of being dropped.
    // cp8-rc9 P1-11: a queued D / Z / X / C is not overwritten by a later A or skill key (rc8 playtest: Z then A-spam = Z never happened).
    // rc16 item 7: a non-defensive key pressed behind a queued D / Z used to be dropped (Z then A = A swallowed); it now waits in queued2.
    if (this.busy) { if (RULES.cp8 && this.queued && /^(defend|item:)/.test(this.queued) && !/^(defend|item:)/.test(map[k]!)) this.queued2 = map[k]!; else this.queued = map[k]!; return; }
    this.command(map[k]!);
  }

  pay(c: number): boolean {
    if (this.p.credits + this.run.credits < c) return false;
    const fromRun = Math.min(this.run.credits, c);
    this.run.credits -= fromRun;
    this.p.credits -= c - fromRun;
    return true;
  }

  merchantBuy(i: number) {
    const st = this.run.merchant!;
    const x = st.equips[i];
    if (!x || !this.pay(x.price)) return;
    this.run.bag.push(x.e);
    st.equips.splice(i, 1);
    this.save(); this.render();
  }

  /** In-game confirmation dialog (replaces window.confirm). */
  modal: { title: string; body: string; ok: string; onOk: () => void; dock?: boolean } | null = null;
  ask(title: string, body: string, ok: string, onOk: () => void) { this.modal = { title, body, ok, onOk }; this.render(); }
  modalHtml(): string {
    const m = this.modal;
    if (!m) return '';
    return `<div class="modal-back${m.dock ? ' dock' : ''}"><div class="modal panel" role="dialog"><h2>${m.title}</h2>${m.body}
      <div class="foot"><button data-modal-cancel>取消</button><span class="spacer"></span><button class="big" data-modal-ok>${m.ok}</button></div></div></div>`;
  }

  /** Power change if e were worn (same basis as compare()). */
  powerDelta(e: Equip): number {
    const clone: Player = JSON.parse(JSON.stringify(this.p));
    const a = powerScore(derive(clone));
    equip(clone, JSON.parse(JSON.stringify(e)));
    return powerScore(derive(clone)) - a;
  }
  /** Every equip entry point (town storage, run bag, battle loot) goes through here: a weaker item asks first. */
  confirmEquip(e: Equip, doIt: () => void) {
    if (this.powerDelta(e) >= 0) return doIt();
    const cur = this.p.equipped[e.slot];
    this.ask(`這件比較弱（戰力 ▼${-this.powerDelta(e)}），確定要換上？`, `<div class="cmp2"><div><h3>目前</h3>${cur ? this.itemCard(cur) : '<div class="empty">—</div>'}</div><div><h3>新裝備</h3>${this.itemCard(e)}</div></div>
        <div class="diff"><h3>換上後的數值變化</h3>${this.compare(e)}</div>`, '仍然換上', doIt);
    // CP5 rc2 fix 8: docked at the top without a blocking backdrop so 「繼續前進」 stays visible and clickable.
    if (RULES.cp5Bosses && this.modal) { this.modal.dock = true; this.render(); }
  }

  bagEquip(id: string, confirmed = false) {
    const r = this.run;
    const i = r.bag.findIndex((x) => x.id === id);
    if (i < 0) return;
    const e = r.bag[i]!;
    if (!confirmed) return this.confirmEquip(e, () => this.bagEquip(id, true));
    const before = runDerived(this.p, r);
    const inv = this.p.inventory.length;
    equip(this.p, e);
    r.bag.splice(i, 1);
    // Anything displaced goes back into the run bag (it is not "safe" until you get home).
    r.bag.push(...this.p.inventory.splice(inv));
    const after = runDerived(this.p, r);
    r.hp = Math.min(after.hp, Math.round(r.hp * (after.hp / before.hp)));
    r.mp = Math.min(after.mp, r.mp); r.sp = Math.min(after.sp, r.sp);
    if (this.pending.loot) this.pending.loot.equips = this.pending.loot.equips.filter((x) => x.id !== id);
    this.save(); this.render();
  }

  /** CP7 出發前整備提醒: town → tower / abyss. Opens the reminder when any prepIssues() holds; otherwise departs at once. */
  depart(kind: 'main' | 'abyss') {
    const go = () => (kind === 'main' ? this.startRun() : this.startAbyss());
    if (!RULES.cp7 || (!prepIssues(this.p).length && !(RULES.cp8 && autoWorn(this.p).length))) return go();
    if (kind === 'abyss') { const v = Number((document.querySelector('[data-abyss-start]') as HTMLSelectElement | null)?.value); if (v) this.abyssStart = v; }
    this.prepKind = kind;
    this.prepModal();
  }
  prepKind: 'main' | 'abyss' | null = null;
  prepModal() {
    const p = this.p, iss = prepIssues(p), kind = this.prepKind!;
    const go = () => { this.prepKind = null; if (kind === 'main') this.startRun(); else this.startAbyss(); };
    const row = (id: PrepIssue, text: string, btn: string) => `<li data-prep-row="${id}">${text} <button data-prep="${id}">${btn}</button></li>`;
    const nb = betterInBag(p).length;
    const worn = RULES.cp8 ? autoWorn(p) : []; // cp8-rc3 item 2: CP8.autoWear already put the better drops on during the trip — say which
    const rows = [
      worn.length ? `<li data-prep-row="worn">上一趟已自動換上 ${worn.length} 件較好的裝備：<span data-prep-worn>${worn.map((e) => `<b data-prep-worn-item="${e.id}">${SLOT_ZH[e.slot]}・${esc(equipName(e))}</b>`).join('、')}</span>（不需處理）</li>` : '',
      iss.includes('alloc') ? row('alloc', `還有 ${unspentExp(p).toLocaleString()} EXP 未分配成屬性點。`, '自動分配') : '',
      iss.includes('potion') ? (RULES.cp8
        ? row('potion', `藥水不足（生命 ${p.potions.health}／魔力 ${p.potions.mana}／靈力 ${p.potions.spirit} 瓶，${p.credits.toLocaleString()}C）。`, `買藥（三種各補到 ${TOWN_HP_POTIONS} 瓶）`)
        : row('potion', `沒有帶生命藥水（持有 ${p.potions.health} 瓶，${p.credits.toLocaleString()}C）。`, `買藥（補到 ${TOWN_HP_POTIONS} 瓶）`)) : '',
      iss.includes('equip') ? row('equip', RULES.cp8 // cp8-rc2 UX: name each better piece (slot · name · power gain), not only the count
        ? `倉庫有 ${nb} 件「▲ 比身上好」的裝備：<span data-prep-items>${betterInBag(p).map((e) => `<b data-prep-item="${e.id}">${SLOT_ZH[e.slot]}・${esc(equipName(e))}（▲${this.powerDelta(e)}）</b>`).join('、')}</span>`
        : `倉庫有 ${nb} 件「▲ 比身上好」的裝備。`, '換上') : '',
    ].join('');
    const body = iss.length
      ? `<ul class="prep" data-prepbox>${rows}</ul><p><button data-prep="all">全部處理</button></p>`
      : `<p data-prepbox data-prep-done>整備完成。</p>`;
    if (worn.length) p.lastWorn = []; // shown once
    this.modal = { title: '出發前整備', body: worn.length && !iss.length ? `<ul class="prep" data-prepbox>${rows}</ul>` : body, ok: iss.length ? '忽略並出發' : '出發', onOk: go };
    this.render();
  }
  prepFix(k: PrepIssue | 'all') {
    const p = this.p;
    const msg: string[] = [];
    const todo = k === 'all' ? prepIssues(p) : [k]; // 全部處理 = each open item, in the sim's town-prep order (alloc → equip → potions)
    const want = (x: PrepIssue) => todo.includes(x);
    if (want('alloc')) { const n = prepAlloc(p); if (n) msg.push(`自動分配 ${n} 點屬性`); }
    if (want('equip')) { const n = prepEquip(p); if (n) msg.push('已換上較好的裝備'); }
    if (want('potion')) { const n = prepPotions(p); msg.push(n ? `買了 ${n} 瓶${RULES.cp8 ? '藥水（生命／魔力／靈力）' : '生命藥水'}` : '錢不夠，沒買到藥水'); }
    if (msg.length) this.notice = msg;
    this.save();
    if (this.prepKind) this.prepModal(); else this.render();
  }

  startRun() {
    this.lastHit = null; this.recent = [];
    this.data.run = startRun(this.p, randomSeed());
    this.notice = [...(this.data.run.notes ?? [])];
    this.data.stats.runs++;
    this.go('map');
  }

  /** CP6: abyss entrance (flag on + first 20-floor clear). */
  abyssBtn(): string {
    if (!RULES.cp6Abyss || !abyssOpen(this.p)) return '';
    const st = checkpointStart(loadRecord(localStorage.getItem(ABYSS_KEY)).best);
    if (!RULES.cp7) return `<button data-abyss class="big">進入深淵塔（第 ${st} 層起）▶</button>`;
    // CP7 decision 2: pick any unlocked checkpoint (default = deepest).
    const opts = checkpointOptions(loadRecord(localStorage.getItem(ABYSS_KEY)).best, ABYSS.checkpoint);
    const sel = opts.includes(this.abyssStart ?? 0) ? this.abyssStart! : st;
    return `<label class="hint">出發檢查點 <select data-abyss-start>${opts.map((d) => `<option value="${d}"${d === sel ? ' selected' : ''}>第 ${d} 層</option>`).join('')}</select></label> <button data-abyss class="big">進入深淵塔（第 ${sel} 層起）▶</button>`;
  }
  abyssRecordHtml(): string {
    if (!RULES.cp6Abyss || !abyssOpen(this.p)) return '';
    const rec = loadRecord(localStorage.getItem(ABYSS_KEY));
    const zh: Record<string, string> = { blade: '刃鋒', oc: '奔流', arcane: '秘術', bulwark: '磐石', none: '無流派' };
    const rows = Object.entries(rec.bySchool).map(([k, v]) => `${zh[k] ?? k} ${v!.best} 層（第 ${v!.trip} 趟）`).join('、');
    return `<div class="hint" data-abyssrec>深淵紀錄：最高 ${rec.best} 層 · 共 ${rec.trips} 趟${rows ? ` · ${rows}` : ''}${rec.titles.length ? `<br>稱號：${rec.titles.map((t) => `<b data-title>${esc(t)}</b>`).join('、')}` : ''}</div>`;
  }
  startAbyss() {
    this.lastHit = null; this.recent = [];
    const rec = loadRecord(localStorage.getItem(ABYSS_KEY));
    let st = checkpointStart(rec.best);
    if (RULES.cp7) { const v = Number((document.querySelector('[data-abyss-start]') as HTMLSelectElement | null)?.value ?? st); if (checkpointOptions(rec.best, ABYSS.checkpoint).includes(v)) st = v; this.abyssStart = st; }
    this.data.run = startAbyss(this.p, randomSeed(), st, rec.ms);
    this.notice = [`深淵塔第 ${st} 層：戰死帶回 50%，撤退保留全部。每 5 層一個檢查點。`];
    this.go('map');
  }

  /** rc16 item 3（自訂，非原版）: health potion on the map, no cooldown. */
  drinkMap() {
    const g = mapPotion(this.p, this.run!); if (g > 0) { this.save(); this.render(); }
  }
  enterNode(i: number) {
    const r = this.run;
    // cp8-rc4: nodes stay clickable during the start-buff picks; entering a node forgoes the picks still open.
    if (RULES.cp8 && r.startPick) { r.held = r.offer ?? null; r.heldLeft = r.offersLeft ?? 0; r.offer = null; r.offersLeft = 0; r.startPick = false; } // rc5: keep as 待選
    const t = r.tower.floors[r.floor - 1]!.options[i]!;
    r.current = { type: t, option: i };
    this.pending = {};
    this.notice = coreEnterNode(this.p, r, t);
    if (t === 'battle' || t === 'elite' || t === 'boss') return this.startBattle(t);
    if (t === 'chest') { this.pending.loot = chestLoot(r, this.p); applyLoot(this.p, r, this.pending.loot); }
    if (t === 'merchant') { r.merchant = merchantStock(r); if (RULES.cp4RunBuffs) r.buffStock = merchantBuffs(this.p, r); }
    if (t === 'shrine' && RULES.cp4RunBuffs) openShrine(this.p, r);
    this.go('node');
  }

  async startBattle(t: NodeType) {
    const r = this.run;
    this.battleType = t;
    this.monsters = encounter(r, this.pool, t);
    this.recent = [];
    this.battle = startBattle(runDerived(this.p, r), { hp: r.hp, mp: r.mp, sp: r.sp }, this.monsters, this.p.potions);
    this.battle.locked = battleLocks(this.p);
    const oc0 = openingOc(this.p, t, r);
    armBattle(this.battle, r);
    this.battle.oc += oc0;
    this.lastAdvice = null; this.queued = this.queued2 = null;
    this.encAt = Date.now(); this.enc = [`遭遇 ${esc(this.monsters.map((m) => m.name).join("、"))}`, ...this.monsters.map((m) => { const w = weaknesses(m), r = resistances(m); return w.length || r.length ? `<span class="enemyelem" data-enemyelem>${esc(m.name)}：${w.map((x) => `弱${ENC_TZ[x.type] ?? x.type} ${Math.abs(x.pct)}%`).join(' ')}${w.length && r.length ? '；' : ''}${r.map((x) => `抗${ENC_TZ[x.type] ?? x.type} ${x.pct}%`).join(' ')}</span>` : ''; }).filter(Boolean)];
    this.log = this.notice.map((n) => `<span class="unlock" data-unlock>${esc(n)}</span>`);
    setTimeout(() => { if (this.screen === 'battle') this.render(); }, ENC_MS + 50);
    if (oc0) this.log.push(`<span class="unlock">首領戰意：開場 OC +${oc0}，可以直接進入靈動架勢</span>`);
    if (r.cp5) { this.cp5TipBox = []; const ev0 = armCp5(this.battle, r.pdot); this.cp5Tips(this.battle); this.cp5Log(ev0); }
    this.target = 0;
    this.go('battle');
    this.stage.setMonsters(this.battle.monsters);
    this.stage.setTarget(0);
  }

  async command(cmd: string): Promise<void> {
    const b = this.battle;
    if (!b || this.busy || b.over) return;
    if (RULES.cp8 && performance.now() < this.chargeHoldUntil && !/^(defend|item:)/.test(cmd)) { // cp8-rc9 item 1
      // rc16 item 7: the hold used to drop the key silently (looked swallowed after a potion / boss phase change). Say so.
      this.refused = `⚠ 敵人剛開始蓄力：先看決策，${Math.ceil((this.chargeHoldUntil - performance.now()) / 100) / 10} 秒後再按（D／Z 立即可用）`; this.render(); return;
    }
    const [kind, id] = cmd.split(':') as [string, string | undefined];
    if (b.monsters[this.target]?.hp === 0) this.target = b.monsters.findIndex((m) => m.hp > 0);
    const a: Action =
      kind === 'skill' ? { kind: 'skill', id: id as SkillId, target: this.target } :
      kind === 'spell' ? { kind: 'spell', id: id as SpellId, target: this.target } :
      kind === 'item' ? { kind: 'item', id: id as PotionId } :
      kind === 'attack' ? quickAttack(b, this.target, this.p.equipped.mainHand?.group ?? 'none') : { kind: kind as 'defend' };
    if (!canUse(b, a)) {
      this.log.push(`<span class="warn">${esc(whyNot(b, a))}</span>`);
      if (RULES.cp8) this.refused = `${kind === 'item' ? `${'ZXC'['health mana spirit'.split(' ').indexOf(id ?? '')] ?? ''}·${POTION_ZH[id as PotionId] ?? ''}` : cmd}沒有作用：${whyNot(b, a)}`; // cp8-rc9 P1-11: say so next to the buttons
      this.render();
      return;
    }
    this.busy = true; this.refused = '';
    this.render();
    const hpBefore = b.hp, turnBefore = b.turn;
    const cd0 = { ...b.cooldowns };
    // cp8-rc11 4(a): a player who only presses A never puts a skill on cooldown, so also count a skill that just became castable (OC crossed its cost)
    const castable = () => skillKit(b).filter((id) => canUse(b, { kind: 'skill', id, target: this.target }));
    const can0 = castable();
    const ev = act(b, a, this.rng, profsOf(this.p));
    { const off = (Object.keys(cd0) as SkillId[]).filter((id) => cd0[id] > 0 && b.cooldowns[id] <= 0); // cp8-rc9 P2 / rc10 P0-4
      const fresh = castable().filter((id) => !can0.includes(id));
      this.cdPending = [...new Set([...this.cdPending, ...off, ...fresh])].filter((id) => !this.cdShown.includes(id) && b.cooldowns[id] <= 0); }
    // cp7-rc5 bug 3: per-turn damage record (display only, no effect on the battle): one line per monster phase, kept in full
    // on window.__turnLog for playtest reports (the on-screen log shows the last 6 lines only).
    if (RULES.cp7) {
      const taken = ev.reduce((t, e) => t + (e.t === 'hit' && e.to === 'player' ? e.dmg : 0), 0);
      const maxHit = ev.reduce((t, e) => Math.max(t, e.t === 'hit' && e.to === 'player' ? e.dmg : 0), 0);
      const rec = { turn: b.turn, action: a.kind, hpBefore, hpAfter: b.hp, maxHp: b.d.hp, taken, maxHit };
      const w = window as unknown as { __turnLog?: (typeof rec)[] }; (w.__turnLog ??= []).push(rec);
      if (b.turn > turnBefore || taken) this.log.push(`<span class="dim" data-turnlog="${b.turn}">第 ${b.turn} 回合：受到 ${taken}（單擊最大 ${maxHit}）HP ${hpBefore} → ${b.hp} / ${b.d.hp}</span>`);
    }
    const turnHits: { who: string; label?: string; dmg: number; charged: boolean }[] = [];
    for (const e of ev) {
      if (e.t === 'hit' && e.dmg > 0 && e.crits) this.log.push(`<span class="crit">${e.from === 'player' ? '暴擊' : '被暴擊'} ${e.dmg}</span>`);
      if (e.t === 'hit' && e.from === 'player' && e.resisted && e.dmg > 0) this.log.push(`<span class="resisthit" data-resisthit>抗性，傷害降低：${esc(b.monsters[e.to as number]!.name)} 抗${ENC_TZ[e.element ?? e.rtype ?? ''] ?? e.element ?? e.rtype} ${e.resisted}%，受到 ${e.dmg}</span>`);
      if (e.t === 'hit' && e.from === 'player' && e.weak && e.dmg > 0) this.log.push(`<span class="weakhit">弱點！${esc(b.monsters[e.to as number]!.name)} 受到 ${e.dmg}</span>`);
      if (e.t === 'hit' && e.to === 'player' && typeof e.from === 'number') {
        const who = esc(b.monsters[e.from]!.name);
        const how = e.avoided === 'evade' ? '（閃避）' : e.avoided === 'parry' ? '（招架）' : e.avoided === 'block' ? '（格擋）' : e.avoided ? '（未命中）' : '';
        if (e.dmg > 0) this.lastHit = { who: b.monsters[e.from]!.name, ...(e.label ? { label: e.label } : {}), dmg: e.dmg, maxHp: Math.round(b.d.hp), charged: !!e.label && /重擊|蓄力一擊/.test(e.label) };
        if (e.dmg > 0) { const hit = { who: b.monsters[e.from]!.name, ...(e.label ? { label: e.label } : {}), dmg: e.dmg, charged: !!e.label && /重擊|脈衝|蓄力一擊/.test(e.label) }; turnHits.push(hit); }
        if (e.avoided === 'block' || e.avoided === 'parry') this.log.push(`<b class="blockfb" data-blockfb="${e.avoided}:${e.dmg}">${e.avoided === 'block' ? '格擋' : '招架'}！-${e.dmg}</b>`); // cp8-rc6 item 7
        this.log.push(`<span class="enemyhit" data-enemyhit="${e.dmg}">${who}${e.label ? ' ' + esc(e.label) : ''} 對你造成 ${e.dmg} 傷害${how}</span>`);
      }
      if (e.t === 'status' && e.phase && typeof e.to === 'number') this.log.push(`<span class="phase" data-phase>⚡ ${esc(b.monsters[e.to]!.name)} ${esc(e.text)}（HP 回到 ${Math.round(BOSS_PHASE_HP * 100)}%，蓄力變快）</span>`);
      // CP3-bugfix 6: skill / stance feedback in the log.
      if (e.t === 'status' && !e.phase && typeof e.to === 'number') this.log.push(`<span class="statusfx" data-status>${esc(b.monsters[e.to]!.name)} ${esc(e.text)}</span>`);
      if (e.t === 'hit' && e.from === 'player' && e.label && !e.weak) this.log.push(`<span class="skillhit" data-skillhit>${esc(e.label)} → ${esc(b.monsters[e.to as number]!.name)} ${e.dmg > 0 ? e.dmg : '未命中'}${e.spirit && e.dmg > 0 ? '（架勢 ×2）' : ''}</span>`);
      if (e.t === 'hit' && e.from === 'player' && !e.label && e.spirit && e.dmg > 0 && !e.weak && !e.crits) this.log.push(`<span class="spirit">架勢攻擊 ${e.dmg}（×2）</span>`);
      if (e.t === 'spirit') this.log.push(e.on ? `<span class="spirit" data-spiritlog>☯ 靈動架勢開啟：物理傷害 ×2（+100%），每回合消耗 1 SP 與 10 OC；OC 或 SP 不足會自動解除</span>` : `<span class="spirit" data-spiritlog>☯ 靈動架勢解除</span>`);
      if (e.t === 'death') this.log.push(`擊倒 ${esc(b.monsters[e.to]!.name)}`);
      if (e.t === 'charge') this.log.push(`<span class="warn">${esc(b.monsters[e.from]!.name)} 正在蓄力！</span>`);
      if (e.t === 'msg') this.log.push(esc(e.text));
      if (b.cp5) this.cp5Log([e]);
      if (e.t === 'heal' && e.label !== '自然回復') this.log.push(`${e.label} +${e.amount} ${e.res.toUpperCase()}`);
    }
    if (b.oc >= 50 && has(this.p, 'spirit') && !b.spirit) { const t = tip(this.p, 'spirit', TIPS.spirit); if (t) this.log.push(`<span class="unlock" data-unlock data-tip="spirit">${esc(t)}</span>`); }
    const g = b.regen;
    this.log.push(`<span class="regen">自然回復 HP +${g.hp} · MP +${g.mp} · SP +${g.sp}</span>`);
    if (turnHits.length) { const big = turnHits.reduce((x, y) => (y.charged && !x.charged) || (y.charged === x.charged && y.dmg > x.dmg) ? y : x); this.recent = [...this.recent, { turn: b.turn, taken: turnHits.reduce((t, h) => t + h.dmg, 0), big }].slice(-3); } // cp8-rc7 P1 item 5
    await capped(this.stage.play(ev, b), 2000 + ev.length * 300); // cp8-rc10 P1-9
    if (b.cp5) { if (this.stage.mons.length < b.monsters.length) { this.stage.setMonsters(b.monsters); this.stage.setTarget(this.target); } this.cp5Tips(b); }
    this.busy = false;
    let q = this.queued; this.queued = this.queued2; this.queued2 = null; // rc16 item 7
    // cp8-rc9 item 1 (UI only, 暫定): a new 蓄力 / 大招 wind-up drops the queued key and holds non-defensive input for
    // CP8.chargeHoldMs, so tapping / holding A at 4x + 跳過動畫 cannot skip the decide panel. D / Z / X / C stay instant.
    if (RULES.cp8 && !b.over && b.monsters.some(windingUp)) {
      const fresh = !this.windWas; this.windWas = true;
      if (fresh) { this.chargeHoldUntil = performance.now() + CP8.chargeHoldMs; if (q && !/^(defend|item:)/.test(q)) q = null; if (this.queued && !/^(defend|item:)/.test(this.queued)) this.queued = null; }
    } else this.windWas = false;
    if (q && !b.over) { this.render(); return this.command(q); }
    if (alive(b).length && b.monsters[this.target]?.hp === 0) { this.target = b.monsters.findIndex((m) => m.hp > 0); this.stage.setTarget(this.target); }
    if (b.over) return this.endBattle();
    this.render();
  }

  async endBattle() {
    const b = this.battle!;
    const r = this.run;
    const nNotes = r.notes?.length ?? 0;
    const loot = finishBattle(this.p, r, b, this.monsters, this.battleType);
    // rc10: milestone / checkpoint notes added by this win are shown on the loot screen.
    const fresh = (r.notes ?? []).slice(nNotes); if (fresh.length) this.notice = fresh;
    this.save();
    if (!loot) {
      this.stage.heroPlay('hurt');
      this.stage.popup(250, 300, '倒下了', '#ff4040', 40, 20);
      await new Promise((res) => setTimeout(res, this.data.settings.skipAnim ? 50 : 1200 / this.stage.speed));
      return this.endRun();
    }
    this.busy = true;
    this.render();
    await capped(this.stage.lootBeams(loot.equips.map((e, i) => ({ q: e.quality, idx: i }))), 2500); // cp8-rc10 P1-9
    await new Promise((res) => setTimeout(res, this.data.settings.skipAnim ? 30 : 500 / this.stage.speed));
    this.busy = false;
    this.pending = { loot };
    if (RULES.cp4RunBuffs) { r.offersLeft = winOffers(this.battleType, r); if (r.offersLeft) { r.offersLeft--; openOffer(this.p, r, this.battleType as 'elite'); } this.save(); }
    this.battle = null;
    this.go('node');
  }

  /** CP4: boss wins open a second offer after the first is resolved. */
  /** cp8-rc5: 「待選」 start-pick buffs the player walked past; they stay pickable for the rest of the trip. */
  heldHtml(): string {
    const h = this.run.held!, left = this.run.heldLeft ?? 0;
    return `<div class="offer held" data-heldpick><h3>待選 buff（本趟有效，隨時可選）${left ? `　之後還有 ${left} 次` : ''}</h3><div class="buffrow">${h.ids.map((id) => this.buffCard(id, `${this.previewHtml(id)}<button class="big" data-heldbuff="${id}">選這個</button>`)).join('')}</div>
      <div class="row"><button class="ghost" data-heldskip>不拿</button></div></div>`;
  }
  /** rc5: resolve the held offer (take `id` or skip), then roll the next owed one into 待選 without touching an open offer. */
  heldResolve(id: string | null) {
    const r = this.run, cur = r.offer ?? null;
    if (id) this.pending.text = takeBuff(this.p, r, id);
    r.held = null;
    if (r.heldLeft) { r.heldLeft--; r.offer = null; openOffer(this.p, r, 'boss'); r.held = r.offer ?? null; }
    r.offer = cur; this.save(); this.render();
  }
  nextOffer() {
    const r = this.run;
    if (!r.offer && r.offersLeft) { r.offersLeft--; openOffer(this.p, r, 'boss'); }
    if (r.startPick && !r.offer) r.startPick = false;
    this.save(); this.render();
  }

  continueNode() {
    if (this.run.offer || this.run.risk) { this.run.offer = null; this.run.risk = null; this.run.offersLeft = 0; }
    const r = this.run;
    advance(r, r.current?.option ?? 0);
    this.pending = {};
    if (r.done) return this.endRun();
    this.go('map');
  }

  endRun() {
    const r = this.run;
    let newBest = 0;
    if (r.abyss) {
      const rec = loadRecord(localStorage.getItem(ABYSS_KEY));
      // rc3 fix 3: the record notice used to go to this.notice, which is cleared below and never shown on the result screen.
      const prevBest = rec.best; recordTrip(rec, abyssCleared(r), abyssSchool(r));
      if (rec.best > prevBest) newBest = rec.best;
      recordTitles(rec, r.abyss.ms ?? 0, r.abyss.titles ?? []);
      if (!this.stale) localStorage.setItem(ABYSS_KEY, JSON.stringify(rec));
    } else {
    const floor = r.done === 'clear' ? r.tower.floors.length : r.floor;
    this.data.stats.bestFloor = Math.max(this.data.stats.bestFloor, floor);
    if (r.done === 'clear') this.data.stats.clears++;
    }
    const raw = { exp: r.exp, credits: r.credits };
    this.lastSettlement = settle(this.p, r);
    if (r.done === 'dead') this.lastSettlement.unlocks.push(deathCarryMsg(raw.exp, raw.credits));
    if (newBest) this.lastSettlement.unlocks.unshift(abyssBestMsg(newBest));
    this.notice = [];
    this.data.run = null;
    this.battle = null;
    this.go('result');
  }
}
/** CP5 r4: the bulwark 3-set text gains the anti-turtle rule when the flag is on. */
function comboZh(k: keyof Combos): string { return COMBO_ZH[k] + (k === 'bulwark' && RULES.cp5Bosses ? BULWARK_CP5_ZH : ''); }


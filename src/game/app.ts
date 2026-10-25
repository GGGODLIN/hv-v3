import { iconKey } from './icons';
import { act, alive, canUse, whyNot, weaknesses, BOSS_CHARGE_MULT, BOSS_PHASE_HP, DEF, SPIRIT_MIN_OC, spellCost, startBattle, SKILLS, SPELLS, type Action, type BattleState, type PotionId, type SkillId, type SpellId } from '../core/battle';
import { profsOf, starterKit } from '../core/auto';
import { ATTRS, attrCost, expForLevel } from '../core/formulas';
import { effectiveStats, equipName, QUALITY_COLOR, QUALITY_ZH, sellPrice, SLOT_ZH, SLOTS, type Equip } from '../core/items';
import type { Monster, MonsterPool } from '../core/monsters';
import { allocate, derive, equip, level, newPlayer, powerScore, PROF_ZH, PROFS, profValue, refund, resetAttrs, unequip, unspentExp, type Player } from '../core/player';
import { Rng, randomSeed } from '../core/rng';
import { carryMult, has, prog, tip, TIPS } from '../core/progress';
import { BUFF, RARITY_ZH, SCHOOL_ZH, COMBO_ZH, combos, formed, type Combos } from '../core/buffs';
import { buffPreview } from './buffpreview';
import { openOffer, openShrine, takeBuff, takeRisk, skipOffer, merchantBuffs, winOffers, RISKS, type RiskId } from '../core/buffoffer';
import { advance, applyLoot, armBattle, battleLocks, openingOc, enterNode as coreEnterNode, chestLoot, encounter, finishBattle, merchantStock, rest, RULES, runDerived, settle, shrine, SHRINES, startRun, type Loot, type RunState, type Settlement } from '../core/run';
import { loadFrom, saveTo, SAVE_VERSION, type SaveData } from '../core/save';
import { floorLevel, NODE_ICON, NODE_ZH, TOWER, type NodeType } from '../core/tower';
import type { Stage } from './stage';
import { ATTR_HINT, ATTR_ZH, esc, fmtChange, fmtStat, STAT_ZH } from './text';

/** CP3-fix 12 / CP3-bugfix 7: exactly which stats the next +1 changes (town Item World and campfire forge). */
function iwGain(e: Equip): string {
  const a = effectiveStats(e), b = effectiveStats({ ...e, iw: e.iw + 1 });
  const ch = (Object.keys(b) as (keyof typeof b)[]).filter((k) => b[k] !== a[k]).map((k) => { const [x, y] = fmtChange(k, a[k]!, b[k]!); return `<span class="iwgain">${STAT_ZH[k] ?? k} ${x} → <b>${y}</b></span>`; });
  return ch.join(' ') || '<span class="hint">此裝備沒有會隨強化成長的數值</span>';
}

type Screen = 'town' | 'map' | 'battle' | 'node' | 'result';
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

export class App {
  data: SaveData;
  screen: Screen = 'town';
  townTab: 'char' | 'gear' | 'shop' | 'iw' = 'char';
  /** CP3 unlock / tutorial notices shown on the current screen. */
  notice: string[] = [];
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
    stage.speed = this.data.settings.speed;
    stage.skip = this.data.settings.skipAnim;
    stage.onTarget = (i) => { this.target = i; stage.setTarget(i); };
    // CP3-fix 6: capture on document so a focused button/canvas cannot swallow the key, and refocus the page on pointer use.
    document.addEventListener('keydown', (e) => this.key(e), { capture: true });
    window.addEventListener('pointerdown', () => { if (document.activeElement instanceof HTMLElement && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) document.activeElement.blur(); window.focus(); });
    if (this.data.run && !this.data.run.done) this.go('map');
    else { this.data.run = null; this.go('town'); }
  }

  static fresh(): SaveData {
    const p = newPlayer();
    starterKit(p, randomSeed());
    return { v: SAVE_VERSION, player: p, run: null, settings: { speed: 1, skipAnim: false }, stats: { runs: 0, bestFloor: 0, clears: 0 } };
  }

  get p(): Player { return this.data.player; }
  get run(): RunState { return this.data.run!; }
  save() { saveTo(localStorage, this.data); }

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
      body = `<div class="cols"><div><h3>屬性（可自由重置） <button data-resetall ${ATTRS.every((a) => p.attrs[a] <= 0) ? 'disabled' : ''} title="所有屬性歸零，EXP 全數退回">一鍵全部重置</button></h3><div>未分配 EXP：<b>${free.toLocaleString()}</b>　下一級需 ${Math.ceil(expForLevel(lv + 1) - p.exp).toLocaleString()} EXP</div>
        <table class="attrs">${attrs}</table><h3>熟練度</h3><div class="profs">${profs}</div></div>
        <div><h3>能力值</h3>${this.statsPanel()}</div></div>`;
    } else if (this.townTab === 'gear') {
      const eq = SLOTS.map((s) => {
        const e = p.equipped[s];
        return `<div class="slot"><div class="slotname">${SLOT_ZH[s]}</div>${e ? this.itemCard(e, `<button data-unequip="${s}">卸下</button>`) : '<div class="empty">—</div>'}</div>`;
      }).join('');
      const inv = [...p.inventory].sort((a, b) => a.slot.localeCompare(b.slot)).map((e) => this.itemCard(e, `<button data-equip="${e.id}">裝備</button>${has(p, 'shop') ? ` <button data-sell="${e.id}">賣 ${sellPrice(e)}C</button>` : ''}`) + this.compare(e)).join('');
      body = `<div class="cols"><div><h3>穿戴中</h3><div class="slots">${eq}</div></div><div><h3>倉庫（${p.inventory.length}）</h3><div class="inv">${inv || '<div class="empty">空</div>'}</div></div></div>`;
    } else {
      const pot = (Object.keys(RULES.potionPrice) as PotionId[]).map((k) => `<tr><td>${POTION_ZH[k]}</td><td>持有 ${p.potions[k]}</td><td><button data-buy="${k}" ${p.credits < RULES.potionPrice[k] ? 'disabled' : ''}>買 ${RULES.potionPrice[k]}C</button></td></tr>`).join('');
      const junk = p.inventory.reduce((s, e) => s + sellPrice(e), 0);
      body = `<h3>藥水（死亡會失去所有消耗品）</h3><table>${pot}</table>
        <h3>出售</h3><button data-sellall ${p.inventory.length ? '' : 'disabled'}>賣掉倉庫全部（${p.inventory.length} 件，${junk}C）</button>`;
    }
    return `<div class="panel town"><div class="head"><h2>城鎮</h2><span>Lv ${lv} · ${p.credits.toLocaleString()} C · 藥水 ❤${p.potions.health} ✦${p.potions.mana} ☯${p.potions.spirit}</span>
      <span class="spacer"></span><span class="hint">出擊 ${st.runs} 次 · 最高 ${st.bestFloor} 層 · 通關 ${st.clears} 次</span></div>
      ${this.noticeHtml()}<div class="tabs">${tabs}</div>${lockedHint ? `<div class="hint locks">🔒 ${lockedHint}</div>` : ''}<div class="body">${body}</div>
      <div class="foot"><button data-newgame class="ghost">新角色</button><span class="spacer"></span><span class="hint" data-deathrule>⚠ 死亡會把帶回折半（EXP、熟練度、Credits 只留 50%）</span><button data-start class="big">進入試煉之塔 ▶</button></div></div>`;
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
        return cur ? `<button class="node n-${t}" data-node="${i}">${ic}${NODE_ZH[t]}</button>` : `<span class="node n-${t} ${chosen ? 'chosen' : ''} ${past && !chosen ? 'faded' : ''}" ${chosen ? 'data-visited' : ''}>${ic}${NODE_ZH[t]}${chosen ? '<i class="tick">✓ 走過</i>' : ''}</span>`;
      }).join('');
      return `<div class="floor ${cur ? 'cur' : ''} ${past ? 'past' : ''}"><span class="fn">${f.n}F <small>Lv${floorLevel(f.n)}</small></span>${opts}</div>`;
    }).join('');
    const bag = r.bag.map((e) => this.itemCard(e, `<button data-bequip="${e.id}">換上</button>`) + this.compare(e)).join('');
    return `<div class="panel map"><div class="head"><h2>試煉之塔 · 第 ${r.floor} 層</h2><span class="spacer"></span>
      <span>本趟：EXP ${Math.round(r.exp).toLocaleString()} · ${r.credits}C · 擊殺 ${r.kills}${r.bonus.dmg ? ` · 傷害+${Math.round(r.bonus.dmg * 100)}%` : ''}${r.bonus.hp ? ` · HP+${Math.round(r.bonus.hp * 100)}%` : ''}</span></div>
      ${this.bars(r.hp, d.hp, r.mp, d.mp, r.sp, d.sp)}${this.buffStrip()}${r.floor === 1 && !r.path.length ? this.noticeHtml() : ''}${r.trip ? `<div class="hint" data-trip="${r.trip}">第 ${r.trip} 趟：帶回 EXP／Credits ×${carryMult(r.trip)}${carryMult(r.trip) > 1 ? '' : '（新手加成已結束）'}</div>` : ''}
      <div class="cols"><div class="tower">${floors}</div><div><h3>背包（${r.bag.length}）· 藥水 ❤${this.p.potions.health} ✦${this.p.potions.mana} ☯${this.p.potions.spirit}</h3><div class="inv">${bag || '<div class="empty">還沒有戰利品</div>'}</div></div></div>
      <div class="foot"><button data-retreat class="ghost">撤退回城（保留 100%）</button><span class="spacer"></span><span class="hint">選擇本層一個節點。第 ${TOWER.bossFloors.join('、')} 層是首領。</span></div></div>`;
  }

  battleHtml(): string {
    const b = this.battle!;
    const sk = (Object.keys(SKILLS) as SkillId[]).map((id, i) => {
      const s = SKILLS[id];
      const cd = b.cooldowns[id];
      return `<button data-act="skill:${id}" ${gate(b, { kind: 'skill', id, target: this.target }, s.desc)}><img class="icon sp" src="assets/icons/k-${id}.png" alt="" width="32" height="32">${'QWE'[i]}·${s.zh}<small>${cd > 0 ? `冷卻${cd}` : `${s.oc}OC`}</small></button>`;
    }).join('');
    const sp = (Object.keys(SPELLS) as SpellId[]).map((id, i) => `<button class="spell el-${SPELLS[id].element}" data-act="spell:${id}" ${gate(b, { kind: 'spell', id, target: this.target })}><img class="icon sp" src="assets/icons/sp-${id}.png" alt="" width="32" height="32">${i + 1}·${SPELLS[id].zh}<small>${spellCost(b, id)}MP${SPELLS[id].targets > 1 ? '·群體' : ''}</small></button>`).join('');
    const po = (['health', 'mana', 'spirit'] as PotionId[]).map((id, i) => `<button data-act="item:${id}" ${id === 'health' && b.monsters.some((m) => m.hp > 0 && m.charge > 0) ? 'class="suggest"' : ''} ${gate(b, { kind: 'item', id })}><img class="icon sp" src="assets/icons/p-${id}.png" alt="" width="32" height="32">${'ZXC'[i]}·${POTION_ZH[id]}<small>${b.itemCd[id] > 0 ? `冷卻${b.itemCd[id]}` : `×${b.potions[id]}`}</small></button>`).join('');
    const chargers = b.monsters.filter((m) => m.hp > 0 && m.charge > 0);
    const charging = chargers.length > 0;
    const TZ: Record<string, string> = { piercing: '刺擊', crushing: '打擊', slashing: '斬擊', fire: '火', cold: '冰', elec: '雷', wind: '風', holy: '聖', dark: '暗' };
    const weakRow = b.monsters.map((m, i) => m.hp <= 0 ? '' : `<div class="wk ${i === this.target ? 'tgt' : ''}" data-weak="${i}">${i === this.target ? '▶ ' : ''}${esc(m.name)}：${weaknesses(m).map((w) => `<b class="${w.type === b.d.damageType ? 'mine' : ''}">${TZ[w.type]} ${w.pct}%</b>`).join(' ') || '<span class="hint">無弱點</span>'}</div>`).join('');
    const hpPot = b.potions.health > 0 && b.itemCd.health <= 0;
    const decide = charging ? `<div class="decide" data-decide>⚠ ${chargers.map((m) => esc(m.name)).join('、')} 正在蓄力，下一擊 ×${BOSS_CHARGE_MULT} 傷害！<br>決策：<b>D·防禦</b>（${DEF.turns} 回合減傷 ${Math.round(DEF.mitigation * 100)}%${b.oc >= DEF.ocCost ? `，消耗 ${DEF.ocCost} OC 回 ${Math.round(DEF.hpRecover * 100)}% HP` : ''}）或 <b>Z·生命藥水</b>（${hpPot ? `剩 ${b.potions.health} 瓶` : b.potions.health > 0 ? `冷卻 ${b.itemCd.health} 回合` : '已用完'}）· HP ${Math.round(b.hp)}/${Math.round(b.d.hp)}</div>` : '';
    return `<div class="hud"><div class="hudl">${this.bars(b.hp, b.d.hp, b.mp, b.d.mp, b.sp, b.d.sp, b.oc)}
        <div class="status">第 ${this.run.floor} 層 · ${NODE_ZH[this.battleType]} · 回合 ${b.turn}${b.spirit ? ' · <b class="spirit">靈動架勢</b>' : ''}${b.defendTurns > 0 ? ' · 防禦中' : ''}${charging ? ' · <b class="warn">首領蓄力中！建議防禦或喝藥</b>' : ''}</div></div>
        <div class="weakbox"><span class="hint">弱點（你的武器：${TZ[b.d.damageType] ?? b.d.damageType}）</span>${weakRow}</div>${decide}
        <div class="log">${this.log.slice(-6).map((l) => `<div>${l}</div>`).join('')}</div></div>
      <div class="cmdbar ${this.busy ? 'busy' : ''}">
        <div class="grp"><button class="main" data-act="attack"><img class="icon sp" src="assets/icons/c-attack.png" alt="" width="32" height="32">A·攻擊</button><button data-act="defend" class="${charging ? 'suggest' : ''}"><img class="icon sp" src="assets/icons/c-defend.png" alt="" width="32" height="32">D·防禦</button><button data-act="focus"><img class="icon sp" src="assets/icons/c-focus.png" alt="" width="32" height="32">F·專注</button><button data-act="spirit" ${gate(b, { kind: 'spirit' }, '需 OC ≥ ' + SPIRIT_MIN_OC + '：技能、防禦、專注都會花 OC，想開架勢就先連續攻擊')}>S·${b.spirit ? '解除架勢' : '靈動架勢'}<small>${b.spirit ? '' : b.locked?.spirit ? 'F4 解鎖' : `OC ${Math.floor(b.oc)}/${SPIRIT_MIN_OC}`}</small></button></div>
        <div class="grp">${sk}</div><div class="grp">${sp}</div><div class="grp">${po}</div>
        <div class="hint">點擊怪物選擇目標 · Tab 切換目標</div></div>`;
  }

  /** CP4: held buffs strip (map / battle). */
  buffStrip(): string {
    const ids = this.run?.buffs;
    if (!RULES.cp4RunBuffs || !ids) return '';
    const f = formed(ids), c = combos(ids);
    const on = (Object.keys(c) as (keyof Combos)[]).filter((k) => c[k]);
    return `<div class="buffs" data-buffs="${ids.length}">${ids.map((id) => `<span class="bf r-${BUFF[id]!.rarity}" title="${esc(BUFF[id]!.desc)}">${BUFF[id]!.zh}</span>`).join('') || '<span class="hint">尚無 buff</span>'}
      ${f.length ? `<span class="hint">流派成形：${f.map((s) => SCHOOL_ZH[s]).join('、')}</span>` : ''}${on.length ? `<span class="hint">組合：${on.map((k) => COMBO_ZH[k]).join('；')}</span>` : ''}</div>`;
  }
  buffCard(id: string, btn: string): string {
    const b = BUFF[id]!;
    return `<div class="buffcard r-${b.rarity}"><div class="bh"><b>${b.zh}</b><small>${RARITY_ZH[b.rarity]} · ${SCHOOL_ZH[b.school]}${b.core ? ' · 核心' : ''}</small></div><div class="bd">${esc(b.desc)}</div>${btn}</div>`;
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
      out += `<div class="risk" data-riskbox="${k}"><h3>⚠ 或接受風險：${x.zh}</h3><div>代價：${x.cost}　回報：${x.reward}</div><div class="row">${btns}</div></div>`;
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
        <div class="inv">${l.equips.map((e) => this.itemCard(e, `<button data-bequip="${e.id}">立刻換上</button>`) + this.compare(e)).join('') || '<div class="empty">這次沒有裝備掉落</div>'}</div>`;
    } else if (t === 'merchant') {
      const st = r.merchant!;
      const pot = (Object.keys(RULES.potionPrice) as PotionId[]).map((k) => `<button data-mbuyp="${k}" ${this.p.credits + r.credits < RULES.potionPrice[k] ? 'disabled' : ''}>${POTION_ZH[k]} ${RULES.potionPrice[k]}C</button>`).join(' ');
      body = `<h2>$ 流浪商人</h2><div>可用：${(this.p.credits + r.credits).toLocaleString()} C（先扣本趟所得）</div><div class="row">${pot}</div>
        <div class="inv">${st.equips.map((x, i) => this.itemCard(x.e, `<button data-mbuy="${i}" ${this.p.credits + r.credits < x.price ? 'disabled' : ''}>買 ${x.price}C</button>`) + this.compare(x.e)).join('') || '<div class="empty">賣完了</div>'}</div>
        ${r.buffStock?.length ? `<h3>Buff（本趟有效）</h3><div class="buffrow">${r.buffStock.map((x, i) => this.buffCard(x.id, `${this.previewHtml(x.id)}<button data-bbuy="${i}" ${this.p.credits + r.credits < x.price ? 'disabled' : ''}>買 ${x.price}C</button>`)).join('')}</div>` : ''}`;
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
      <div class="foot"><span class="spacer"></span><button class="big" data-continue>${done || t === 'merchant' ? '繼續前進 ▲' : '略過 ▲'}</button></div></div>`;
  }

  lastSettlement: Settlement | null = null;
  resultHtml(): string {
    const s = this.lastSettlement!;
    const title = s.outcome === 'clear' ? '♛ 通關試煉之塔！' : s.outcome === 'dead' ? '☠ 倒下了……' : '撤退回城';
    const rule = s.outcome === 'dead' ? '死亡：EXP、熟練度與 Credits 保留 50%，背包只留最好的一件，消耗品全失。穿戴中的裝備不會遺失。' : '全部戰利品、EXP 與 Credits 都帶回城鎮。';
    return `<div class="panel result ${s.outcome}"><h2>${title}</h2><p>到達第 ${s.floor} 層。${rule}</p>
      <div class="hint" data-carry="${s.mult}">${s.mult > 1 ? '新手帶回加成' : '帶回倍率'} ×${s.mult}</div>${s.unlocks.length ? `<div class="unlocks" data-unlock>${s.unlocks.map((u) => `<div>${esc(u)}</div>`).join('')}</div>` : ''}
      <div class="gain">+${s.exp.toLocaleString()} EXP · +${s.credits} C${s.levelAfter > s.levelBefore ? ` · <b>升級！Lv${s.levelBefore} → Lv${s.levelAfter}</b>` : ''}</div>
      <h3 class="kept-h">保留（${s.kept.length} 件，已放入倉庫）</h3>
      <div class="inv kept">${s.kept.map((e) => this.itemCard(e)).join('') || '<div class="empty">沒有</div>'}</div>
      ${s.outcome === 'dead' ? `<h3 class="lost-h warn">遺失（${s.lostItems.length} 件${Object.values(s.lostPotions).some((n) => n) ? `，藥水 ${(Object.entries(s.lostPotions) as [PotionId, number][]).filter(([, n]) => n).map(([k, n]) => `${POTION_ZH[k]}×${n}`).join('、')}` : ''}）</h3>
      <div class="inv lost">${s.lostItems.map((e) => this.itemCard(e)).join('') || '<div class="empty">沒有</div>'}</div>` : ''}
      <div class="foot"><span class="spacer"></span><button class="big" data-town>回到城鎮</button></div></div>`;
  }

  // ---------- events ----------
  bind() {
    const on = (sel: string, f: (el: HTMLElement) => void) => this.root.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener('click', () => f(el)));
    on('[data-speed]', (el) => { this.data.settings.speed = Number(el.dataset.speed) as 1 | 2 | 4; this.stage.speed = this.data.settings.speed; this.save(); this.render(); });
    this.root.querySelector<HTMLInputElement>('[data-skip]')?.addEventListener('change', (e) => { this.data.settings.skipAnim = (e.target as HTMLInputElement).checked; this.stage.skip = this.data.settings.skipAnim; this.save(); });
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
    on('[data-newgame]', () => this.ask('建立新角色？', `<p class="warn">目前的存檔（Lv${level(this.p)}、${this.p.inventory.length} 件倉庫裝備、${this.p.credits}C）會被清空，無法復原。</p>`, '清空並建立新角色', () => { this.data = App.fresh(); this.save(); this.go('town'); }));
    on('[data-modal-cancel]', () => { this.modal = null; this.render(); });
    on('[data-modal-ok]', () => { const m = this.modal; this.modal = null; m?.onOk(); if (!this.modal) this.render(); });
    on('[data-start]', () => this.startRun());
    on('[data-node]', (el) => this.enterNode(Number(el.dataset.node)));
    on('[data-retreat]', () => { if (confirm('撤退回城？本趟所得全部保留。')) { this.run.done = 'retreat'; this.endRun(); } });
    on('[data-bequip]', (el) => this.bagEquip(el.dataset.bequip!));
    on('[data-act]', (el) => this.command(el.dataset.act!));
    on('[data-continue]', () => this.continueNode());
    on('[data-heal]', () => { this.pending.text = rest(this.p, this.run, 'heal'); this.save(); this.continueNode(); });
    on('[data-up]', (el) => { this.pending.text = rest(this.p, this.run, 'upgrade', el.dataset.up); this.save(); this.continueNode(); });
    on('[data-shrine]', (el) => { this.pending.text = shrine(this.p, this.run, el.dataset.shrine as 'might'); this.save(); this.render(); this.root.querySelectorAll<HTMLButtonElement>('[data-shrine]').forEach((b) => (b.disabled = true)); });
    on('[data-mbuy]', (el) => this.merchantBuy(Number(el.dataset.mbuy)));
    on('[data-buff]', (el) => { const r = this.run; this.pending.text = takeBuff(this.p, r, el.dataset.buff!); r.risk = null; this.nextOffer(); });
    on('[data-buffskip]', () => { skipOffer(this.run); this.run.risk = null; this.nextOffer(); });
    on('[data-risk]', (el) => { const [k, id] = el.dataset.risk!.split(':'); this.pending.text = takeRisk(this.p, this.run, k as RiskId, id); this.save(); this.render(); });
    on('[data-bbuy]', (el) => { const r = this.run; const i = Number(el.dataset.bbuy); const x = r.buffStock?.[i]; if (x && this.pay(x.price)) { this.pending.text = takeBuff(this.p, r, x.id); r.buffStock!.splice(i, 1); } this.save(); this.render(); });
    on('[data-mbuyp]', (el) => { const k = el.dataset.mbuyp as PotionId; if (this.pay(RULES.potionPrice[k])) this.p.potions[k]++; this.save(); this.render(); });
    on('[data-town]', () => this.go('town'));
  }

  queued: string | null = null;

  key(e: KeyboardEvent) {
    if (this.screen !== 'battle' || !this.battle) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tg = e.target as HTMLElement | null;
    if (tg && /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName)) return;
    // CP3-fix 6: use the physical key (e.code) so a Chinese IME (e.key = 'Process') or Caps Lock does not break hotkeys.
    const k = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : /^(Digit|Numpad)[0-9]$/.test(e.code) ? e.code.slice(-1) : e.key.toLowerCase();
    const map: Record<string, string> = { a: 'attack', d: 'defend', f: 'focus', s: 'spirit', q: 'skill:shieldBash', w: 'skill:vitalStrike', e: 'skill:mercifulBlow', z: 'item:health', x: 'item:mana', c: 'item:spirit' };
    (Object.keys(SPELLS) as SpellId[]).forEach((id, i) => (map[String(i + 1)] = `spell:${id}`));
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
    if (this.busy) { this.queued = map[k]!; return; }
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
  modal: { title: string; body: string; ok: string; onOk: () => void } | null = null;
  ask(title: string, body: string, ok: string, onOk: () => void) { this.modal = { title, body, ok, onOk }; this.render(); }
  modalHtml(): string {
    const m = this.modal;
    if (!m) return '';
    return `<div class="modal-back"><div class="modal panel" role="dialog"><h2>${m.title}</h2>${m.body}
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

  startRun() {
    this.data.run = startRun(this.p, randomSeed());
    this.notice = [...(this.data.run.notes ?? [])];
    this.data.stats.runs++;
    this.go('map');
  }

  enterNode(i: number) {
    const r = this.run;
    const t = r.tower.floors[r.floor - 1]!.options[i]!;
    r.current = { type: t, option: i };
    this.pending = {};
    this.notice = coreEnterNode(this.p, r, t);
    if (t === 'battle' || t === 'elite' || t === 'boss') return this.startBattle(t);
    if (t === 'chest') { this.pending.loot = chestLoot(r); applyLoot(this.p, r, this.pending.loot); }
    if (t === 'merchant') { r.merchant = merchantStock(r); if (RULES.cp4RunBuffs) r.buffStock = merchantBuffs(this.p, r); }
    if (t === 'shrine' && RULES.cp4RunBuffs) openShrine(this.p, r);
    this.go('node');
  }

  async startBattle(t: NodeType) {
    const r = this.run;
    this.battleType = t;
    this.monsters = encounter(r, this.pool, t);
    this.battle = startBattle(runDerived(this.p, r), { hp: r.hp, mp: r.mp, sp: r.sp }, this.monsters, this.p.potions);
    this.battle.locked = battleLocks(this.p);
    const oc0 = openingOc(this.p, t, r);
    armBattle(this.battle, r);
    this.battle.oc += oc0;
    this.log = [...this.notice.map((n) => `<span class="unlock" data-unlock>${esc(n)}</span>`), `遭遇 ${esc(this.monsters.map((m) => m.name).join("、"))}`];
    if (oc0) this.log.push(`<span class="unlock">首領戰意：開場 OC +${oc0}，可以直接進入靈動架勢</span>`);
    this.target = 0;
    this.go('battle');
    this.stage.setMonsters(this.battle.monsters);
    this.stage.setTarget(0);
  }

  async command(cmd: string): Promise<void> {
    const b = this.battle;
    if (!b || this.busy || b.over) return;
    const [kind, id] = cmd.split(':') as [string, string | undefined];
    if (b.monsters[this.target]?.hp === 0) this.target = b.monsters.findIndex((m) => m.hp > 0);
    const a: Action =
      kind === 'skill' ? { kind: 'skill', id: id as SkillId, target: this.target } :
      kind === 'spell' ? { kind: 'spell', id: id as SpellId, target: this.target } :
      kind === 'item' ? { kind: 'item', id: id as PotionId } :
      kind === 'attack' ? { kind: 'attack', target: this.target } : { kind: kind as 'defend' };
    if (!canUse(b, a)) {
      this.log.push(`<span class="warn">${esc(whyNot(b, a))}</span>`);
      this.render();
      return;
    }
    this.busy = true;
    this.render();
    const ev = act(b, a, this.rng, profsOf(this.p));
    for (const e of ev) {
      if (e.t === 'hit' && e.dmg > 0 && e.crits) this.log.push(`<span class="crit">${e.from === 'player' ? '暴擊' : '被暴擊'} ${e.dmg}</span>`);
      if (e.t === 'hit' && e.from === 'player' && e.weak && e.dmg > 0) this.log.push(`<span class="weakhit">弱點！${esc(b.monsters[e.to as number]!.name)} 受到 ${e.dmg}</span>`);
      if (e.t === 'hit' && e.to === 'player' && typeof e.from === 'number') {
        const who = esc(b.monsters[e.from]!.name);
        const how = e.avoided === 'evade' ? '（閃避）' : e.avoided === 'parry' ? '（招架）' : e.avoided === 'block' ? '（格擋）' : e.avoided ? '（未命中）' : '';
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
      if (e.t === 'heal' && e.label !== '自然回復') this.log.push(`${e.label} +${e.amount} ${e.res.toUpperCase()}`);
    }
    if (b.oc >= 50 && has(this.p, 'spirit') && !b.spirit) { const t = tip(this.p, 'spirit', TIPS.spirit); if (t) this.log.push(`<span class="unlock" data-unlock data-tip="spirit">${esc(t)}</span>`); }
    const g = b.regen;
    this.log.push(`<span class="regen">自然回復 HP +${g.hp} · MP +${g.mp} · SP +${g.sp}</span>`);
    await this.stage.play(ev, b);
    this.busy = false;
    const q = this.queued; this.queued = null;
    if (q && !b.over) { this.render(); return this.command(q); }
    if (alive(b).length && b.monsters[this.target]?.hp === 0) { this.target = b.monsters.findIndex((m) => m.hp > 0); this.stage.setTarget(this.target); }
    if (b.over) return this.endBattle();
    this.render();
  }

  async endBattle() {
    const b = this.battle!;
    const r = this.run;
    const loot = finishBattle(this.p, r, b, this.monsters, this.battleType);
    this.save();
    if (!loot) {
      this.stage.heroPlay('hurt');
      this.stage.popup(250, 300, '倒下了', '#ff4040', 40, 20);
      await new Promise((res) => setTimeout(res, this.data.settings.skipAnim ? 50 : 1200 / this.stage.speed));
      return this.endRun();
    }
    this.busy = true;
    this.render();
    await this.stage.lootBeams(loot.equips.map((e, i) => ({ q: e.quality, idx: i })));
    await new Promise((res) => setTimeout(res, this.data.settings.skipAnim ? 30 : 500 / this.stage.speed));
    this.busy = false;
    this.pending = { loot };
    if (RULES.cp4RunBuffs) { r.offersLeft = winOffers(this.battleType, r); if (r.offersLeft) { r.offersLeft--; openOffer(this.p, r, this.battleType as 'elite'); } this.save(); }
    this.battle = null;
    this.go('node');
  }

  /** CP4: boss wins open a second offer after the first is resolved. */
  nextOffer() {
    const r = this.run;
    if (!r.offer && r.offersLeft) { r.offersLeft--; openOffer(this.p, r, 'boss'); }
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
    const floor = r.done === 'clear' ? TOWER.floors : r.floor;
    this.data.stats.bestFloor = Math.max(this.data.stats.bestFloor, floor);
    if (r.done === 'clear') this.data.stats.clears++;
    this.lastSettlement = settle(this.p, r);
    this.notice = [];
    this.data.run = null;
    this.battle = null;
    this.go('result');
  }
}


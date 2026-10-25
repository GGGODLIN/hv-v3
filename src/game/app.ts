import { act, alive, canUse, whyNot, spellCost, startBattle, SKILLS, SPELLS, type Action, type BattleState, type PotionId, type SkillId, type SpellId } from '../core/battle';
import { profsOf, starterKit } from '../core/auto';
import { ATTRS, attrCost, expForLevel } from '../core/formulas';
import { effectiveStats, equipName, QUALITY_COLOR, QUALITY_ZH, sellPrice, SLOT_ZH, SLOTS, type Equip } from '../core/items';
import type { Monster, MonsterPool } from '../core/monsters';
import { allocate, derive, equip, level, newPlayer, powerScore, PROF_ZH, PROFS, profValue, refund, unequip, unspentExp, type Player } from '../core/player';
import { Rng, randomSeed } from '../core/rng';
import { advance, applyLoot, chestLoot, encounter, finishBattle, merchantStock, rest, RULES, runDerived, settle, shrine, SHRINES, startRun, type Loot, type RunState, type Settlement } from '../core/run';
import { loadFrom, saveTo, SAVE_VERSION, type SaveData } from '../core/save';
import { floorLevel, NODE_ICON, NODE_ZH, TOWER, type NodeType } from '../core/tower';
import type { Stage } from './stage';
import { ATTR_HINT, ATTR_ZH, esc, fmtStat, STAT_ZH } from './text';

type Screen = 'town' | 'map' | 'battle' | 'node' | 'result';
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const POTION_ZH: Record<PotionId, string> = { health: '生命藥水', mana: '法力藥水', spirit: '靈力藥水' };

export class App {
  data: SaveData;
  screen: Screen = 'town';
  townTab: 'char' | 'gear' | 'shop' = 'char';
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
    window.addEventListener('keydown', (e) => this.key(e));
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
    this.root.innerHTML = this.topBar() + html;
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

  itemCard(e: Equip, actions = ''): string {
    const st = Object.entries(effectiveStats(e)).map(([k, v]) => `<li>${STAT_ZH[k as keyof typeof STAT_ZH] ?? k} <b>${fmtStat(k, v!)}</b></li>`).join('');
    return `<div class="item" style="--q:${hex(QUALITY_COLOR[e.quality])}">
      <div class="iname">${esc(equipName(e))}</div>
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
    const tabs = (['char', 'gear', 'shop'] as const).map((t) => `<button data-tab="${t}" class="${this.townTab === t ? 'on' : ''}">${{ char: '角色與配點', gear: '裝備', shop: '商店' }[t]}</button>`).join('');
    let body = '';
    if (this.townTab === 'char') {
      const free = Math.floor(unspentExp(p));
      const attrs = ATTRS.map((a) => {
        const next = Math.ceil(attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a]));
        return `<tr><td>${ATTR_ZH[a]}<div class="hint">${ATTR_HINT[a]}</div></td><td class="num">${p.attrs[a]}</td>
          <td><button data-ref="${a}" ${p.attrs[a] <= 0 ? 'disabled' : ''}>−</button> <button data-add="${a}" ${free < next ? 'disabled' : ''}>+</button> <button data-add5="${a}" ${free < next ? 'disabled' : ''}>+5</button></td><td class="hint">下一點 ${next} EXP</td></tr>`;
      }).join('');
      const profs = PROFS.map((k) => `<span class="prof">${PROF_ZH[k]} ${profValue(p, k)}</span>`).join('');
      body = `<div class="cols"><div><h3>屬性（可自由重置）</h3><div>未分配 EXP：<b>${free.toLocaleString()}</b>　下一級需 ${Math.ceil(expForLevel(lv + 1) - p.exp).toLocaleString()} EXP</div>
        <table class="attrs">${attrs}</table><h3>熟練度</h3><div class="profs">${profs}</div></div>
        <div><h3>能力值</h3>${this.statsPanel()}</div></div>`;
    } else if (this.townTab === 'gear') {
      const eq = SLOTS.map((s) => {
        const e = p.equipped[s];
        return `<div class="slot"><div class="slotname">${SLOT_ZH[s]}</div>${e ? this.itemCard(e, `<button data-unequip="${s}">卸下</button>`) : '<div class="empty">—</div>'}</div>`;
      }).join('');
      const inv = [...p.inventory].sort((a, b) => a.slot.localeCompare(b.slot)).map((e) => this.itemCard(e, `<button data-equip="${e.id}">裝備</button> <button data-sell="${e.id}">賣 ${sellPrice(e)}C</button>`) + this.compare(e)).join('');
      body = `<div class="cols"><div><h3>穿戴中</h3><div class="slots">${eq}</div></div><div><h3>倉庫（${p.inventory.length}）</h3><div class="inv">${inv || '<div class="empty">空</div>'}</div></div></div>`;
    } else {
      const pot = (Object.keys(RULES.potionPrice) as PotionId[]).map((k) => `<tr><td>${POTION_ZH[k]}</td><td>持有 ${p.potions[k]}</td><td><button data-buy="${k}" ${p.credits < RULES.potionPrice[k] ? 'disabled' : ''}>買 ${RULES.potionPrice[k]}C</button></td></tr>`).join('');
      const junk = p.inventory.reduce((s, e) => s + sellPrice(e), 0);
      body = `<h3>藥水（死亡會失去所有消耗品）</h3><table>${pot}</table>
        <h3>出售</h3><button data-sellall ${p.inventory.length ? '' : 'disabled'}>賣掉倉庫全部（${p.inventory.length} 件，${junk}C）</button>`;
    }
    return `<div class="panel town"><div class="head"><h2>城鎮</h2><span>Lv ${lv} · ${p.credits.toLocaleString()} C · 藥水 ❤${p.potions.health} ✦${p.potions.mana} ☯${p.potions.spirit}</span>
      <span class="spacer"></span><span class="hint">出擊 ${st.runs} 次 · 最高 ${st.bestFloor} 層 · 通關 ${st.clears} 次</span></div>
      <div class="tabs">${tabs}</div><div class="body">${body}</div>
      <div class="foot"><button data-newgame class="ghost">重新開始存檔</button><span class="spacer"></span><button data-start class="big">進入試煉之塔 ▶</button></div></div>`;
  }

  mapHtml(): string {
    const r = this.run;
    const d = runDerived(this.p, r);
    const floors = [...r.tower.floors].reverse().map((f) => {
      const cur = f.n === r.floor;
      const past = f.n < r.floor;
      const opts = f.options.map((t, i) => {
        const chosen = past && r.path[f.n - 1] === i;
        return cur ? `<button class="node n-${t}" data-node="${i}">${NODE_ICON[t]} ${NODE_ZH[t]}</button>` : `<span class="node n-${t} ${chosen ? 'chosen' : ''} ${past && !chosen ? 'faded' : ''}">${NODE_ICON[t]} ${NODE_ZH[t]}</span>`;
      }).join('');
      return `<div class="floor ${cur ? 'cur' : ''} ${past ? 'past' : ''}"><span class="fn">${f.n}F <small>Lv${floorLevel(f.n)}</small></span>${opts}</div>`;
    }).join('');
    const bag = r.bag.map((e) => this.itemCard(e, `<button data-bequip="${e.id}">換上</button>`) + this.compare(e)).join('');
    return `<div class="panel map"><div class="head"><h2>試煉之塔 · 第 ${r.floor} 層</h2><span class="spacer"></span>
      <span>本趟：EXP ${Math.round(r.exp).toLocaleString()} · ${r.credits}C · 擊殺 ${r.kills}${r.bonus.dmg ? ` · 傷害+${Math.round(r.bonus.dmg * 100)}%` : ''}${r.bonus.hp ? ` · HP+${Math.round(r.bonus.hp * 100)}%` : ''}</span></div>
      ${this.bars(r.hp, d.hp, r.mp, d.mp, r.sp, d.sp)}
      <div class="cols"><div class="tower">${floors}</div><div><h3>背包（${r.bag.length}）· 藥水 ❤${this.p.potions.health} ✦${this.p.potions.mana} ☯${this.p.potions.spirit}</h3><div class="inv">${bag || '<div class="empty">還沒有戰利品</div>'}</div></div></div>
      <div class="foot"><button data-retreat class="ghost">撤退回城（保留 100%）</button><span class="spacer"></span><span class="hint">選擇本層一個節點。第 ${TOWER.bossFloors.join('、')} 層是首領。</span></div></div>`;
  }

  battleHtml(): string {
    const b = this.battle!;
    const sk = (Object.keys(SKILLS) as SkillId[]).map((id, i) => {
      const s = SKILLS[id];
      const cd = b.cooldowns[id];
      return `<button data-act="skill:${id}" title="${esc(s.desc)}" ${canUse(b, { kind: 'skill', id, target: this.target }) ? '' : 'disabled'}>${'QWE'[i]}·${s.zh}<small>${cd > 0 ? `冷卻${cd}` : `${s.oc}OC`}</small></button>`;
    }).join('');
    const sp = (Object.keys(SPELLS) as SpellId[]).map((id, i) => `<button class="spell el-${SPELLS[id].element}" data-act="spell:${id}" ${canUse(b, { kind: 'spell', id, target: this.target }) ? '' : 'disabled'}>${i + 1}·${SPELLS[id].zh}<small>${spellCost(b, id)}MP${SPELLS[id].targets > 1 ? '·群體' : ''}</small></button>`).join('');
    const po = (['health', 'mana', 'spirit'] as PotionId[]).map((id, i) => `<button data-act="item:${id}" ${canUse(b, { kind: 'item', id }) ? '' : 'disabled'}>${'ZXC'[i]}·${POTION_ZH[id]}<small>${b.itemCd[id] > 0 ? `冷卻${b.itemCd[id]}` : `×${b.potions[id]}`}</small></button>`).join('');
    const charging = b.monsters.some((m) => m.hp > 0 && m.charge > 0);
    return `<div class="hud"><div class="hudl">${this.bars(b.hp, b.d.hp, b.mp, b.d.mp, b.sp, b.d.sp, b.oc)}
        <div class="status">第 ${this.run.floor} 層 · ${NODE_ZH[this.battleType]} · 回合 ${b.turn}${b.spirit ? ' · <b class="spirit">靈動架勢</b>' : ''}${b.defendTurns > 0 ? ' · 防禦中' : ''}${charging ? ' · <b class="warn">首領蓄力中！建議防禦或喝藥</b>' : ''}</div></div>
        <div class="log">${this.log.slice(-6).map((l) => `<div>${l}</div>`).join('')}</div></div>
      <div class="cmdbar ${this.busy ? 'busy' : ''}">
        <div class="grp"><button class="main" data-act="attack">A·攻擊</button><button data-act="defend">D·防禦</button><button data-act="focus">F·專注</button><button data-act="spirit" ${canUse(b, { kind: 'spirit' }) ? '' : 'disabled'}>S·${b.spirit ? '解除架勢' : '靈動架勢'}</button></div>
        <div class="grp">${sk}</div><div class="grp">${sp}</div><div class="grp">${po}</div>
        <div class="hint">點擊怪物選擇目標 · Tab 切換目標</div></div>`;
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
        <div class="inv">${st.equips.map((x, i) => this.itemCard(x.e, `<button data-mbuy="${i}" ${this.p.credits + r.credits < x.price ? 'disabled' : ''}>買 ${x.price}C</button>`) + this.compare(x.e)).join('') || '<div class="empty">賣完了</div>'}</div>`;
    } else if (t === 'rest') {
      const d = runDerived(this.p, r);
      const slots = SLOTS.filter((s) => this.p.equipped[s]).map((s) => `<button data-up="${s}">強化${SLOT_ZH[s]}（+${this.p.equipped[s]!.iw} → +${this.p.equipped[s]!.iw + 1}）</button>`).join(' ');
      body = `<h2>♨ 營火</h2>${this.bars(r.hp, d.hp, r.mp, d.mp, r.sp, d.sp)}<p>二選一：</p><div class="row"><button class="big" data-heal>休息：回復 60% HP，MP/SP 全滿</button></div>
        <p>或在火邊鍛造（裝備世界 +1，永久保留）：</p><div class="row">${slots || '沒有可強化的裝備'}</div>`;
    } else if (t === 'shrine') {
      body = `<h2>✦ 神龕</h2><p>選擇一項祝福（僅限本趟）：</p><div class="row">${SHRINES.map((s) => `<button class="big" data-shrine="${s.id}">${s.zh}<small>${s.desc}</small></button>`).join('')}</div>`;
    }
    const done = !!this.pending.loot || !!this.pending.text;
    return `<div class="panel node">${body}${this.pending.text ? `<div class="gain">${this.pending.text}</div>` : ''}
      <div class="foot"><span class="spacer"></span><button class="big" data-continue>${done || t === 'merchant' ? '繼續前進 ▲' : '略過 ▲'}</button></div></div>`;
  }

  lastSettlement: Settlement | null = null;
  resultHtml(): string {
    const s = this.lastSettlement!;
    const title = s.outcome === 'clear' ? '♛ 通關試煉之塔！' : s.outcome === 'dead' ? '☠ 倒下了……' : '撤退回城';
    const rule = s.outcome === 'dead' ? '死亡：EXP、熟練度與 Credits 保留 50%，背包只留最好的一件，消耗品全失。穿戴中的裝備不會遺失。' : '全部戰利品、EXP 與 Credits 都帶回城鎮。';
    return `<div class="panel result ${s.outcome}"><h2>${title}</h2><p>到達第 ${s.floor} 層。${rule}</p>
      <div class="gain">+${s.exp.toLocaleString()} EXP · +${s.credits} C${s.levelAfter > s.levelBefore ? ` · <b>升級！Lv${s.levelBefore} → Lv${s.levelAfter}</b>` : ''}</div>
      ${s.lost ? `<p class="warn">遺失 ${s.lost} 件背包裝備</p>` : ''}
      <div class="inv">${s.kept.map((e) => this.itemCard(e)).join('')}</div>
      <div class="foot"><span class="spacer"></span><button class="big" data-town>回到城鎮</button></div></div>`;
  }

  // ---------- events ----------
  bind() {
    const on = (sel: string, f: (el: HTMLElement) => void) => this.root.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener('click', () => f(el)));
    on('[data-speed]', (el) => { this.data.settings.speed = Number(el.dataset.speed) as 1 | 2 | 4; this.stage.speed = this.data.settings.speed; this.save(); this.render(); });
    this.root.querySelector<HTMLInputElement>('[data-skip]')?.addEventListener('change', (e) => { this.data.settings.skipAnim = (e.target as HTMLInputElement).checked; this.stage.skip = this.data.settings.skipAnim; this.save(); });
    on('[data-tab]', (el) => { this.townTab = el.dataset.tab as typeof this.townTab; this.render(); });
    on('[data-add]', (el) => { allocate(this.p, el.dataset.add as keyof Player['attrs']); this.go('town'); });
    on('[data-add5]', (el) => { allocate(this.p, el.dataset.add5 as keyof Player['attrs'], 5); this.go('town'); });
    on('[data-ref]', (el) => { refund(this.p, el.dataset.ref as keyof Player['attrs']); this.go('town'); });
    on('[data-equip]', (el) => { const e = this.p.inventory.find((x) => x.id === el.dataset.equip); if (e) equip(this.p, e); this.go('town'); });
    on('[data-unequip]', (el) => { unequip(this.p, el.dataset.unequip as Equip['slot']); this.go('town'); });
    on('[data-sell]', (el) => { const i = this.p.inventory.findIndex((x) => x.id === el.dataset.sell); if (i >= 0) { this.p.credits += sellPrice(this.p.inventory[i]!); this.p.inventory.splice(i, 1); } this.go('town'); });
    on('[data-sellall]', () => { for (const e of this.p.inventory) this.p.credits += sellPrice(e); this.p.inventory = []; this.go('town'); });
    on('[data-buy]', (el) => { const k = el.dataset.buy as PotionId; if (this.p.credits >= RULES.potionPrice[k]) { this.p.credits -= RULES.potionPrice[k]; this.p.potions[k]++; } this.go('town'); });
    on('[data-newgame]', () => { if (confirm('確定要刪除存檔並重新開始？')) { this.data = App.fresh(); this.go('town'); } });
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
    on('[data-mbuyp]', (el) => { const k = el.dataset.mbuyp as PotionId; if (this.pay(RULES.potionPrice[k])) this.p.potions[k]++; this.save(); this.render(); });
    on('[data-town]', () => this.go('town'));
  }

  queued: string | null = null;

  key(e: KeyboardEvent) {
    if (this.screen !== 'battle' || !this.battle) return;
    const k = e.key.toLowerCase();
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

  bagEquip(id: string) {
    const r = this.run;
    const i = r.bag.findIndex((x) => x.id === id);
    if (i < 0) return;
    const e = r.bag[i]!;
    const before = runDerived(this.p, r);
    const trial: Player = JSON.parse(JSON.stringify(this.p));
    equip(trial, JSON.parse(JSON.stringify(e)));
    if (powerScore(runDerived(trial, r)) < powerScore(before) && !confirm(`${equipName(e)} 的戰力比目前裝備低，確定要換上？`)) return;
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
    this.data.stats.runs++;
    this.go('map');
  }

  enterNode(i: number) {
    const r = this.run;
    const t = r.tower.floors[r.floor - 1]!.options[i]!;
    r.current = { type: t, option: i };
    this.pending = {};
    if (t === 'battle' || t === 'elite' || t === 'boss') return this.startBattle(t);
    if (t === 'chest') { this.pending.loot = chestLoot(r); applyLoot(this.p, r, this.pending.loot); }
    if (t === 'merchant') r.merchant = merchantStock(r);
    this.go('node');
  }

  async startBattle(t: NodeType) {
    const r = this.run;
    this.battleType = t;
    this.monsters = encounter(r, this.pool, t);
    this.battle = startBattle(runDerived(this.p, r), { hp: r.hp, mp: r.mp, sp: r.sp }, this.monsters, this.p.potions);
    this.log = [`遭遇 ${this.monsters.map((m) => m.name).join('、')}`];
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
      if (e.t === 'death') this.log.push(`擊倒 ${esc(b.monsters[e.to]!.name)}`);
      if (e.t === 'charge') this.log.push(`<span class="warn">${esc(b.monsters[e.from]!.name)} 正在蓄力！</span>`);
      if (e.t === 'msg') this.log.push(esc(e.text));
      if (e.t === 'heal' && e.label !== '自然回復') this.log.push(`${e.label} +${e.amount} ${e.res.toUpperCase()}`);
    }
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
    this.battle = null;
    this.go('node');
  }

  continueNode() {
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
    this.data.run = null;
    this.battle = null;
    this.go('result');
  }
}


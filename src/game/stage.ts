import * as Phaser from 'phaser';
import type { BEvent, BattleState } from '../core/battle';
import type { Monster } from '../core/monsters';
import { QUALITY_COLOR, type Quality } from '../core/items';

export const W = 1100;
export const H = 620;

interface CharAction { w: number; h: number; anchor: number; files: string[] }
interface Manifest { bg: string; chars: Record<string, { scale: number; actions: Record<string, CharAction> }> }

const BEAST_RACES = new Set(['Arthropod', 'Avion', 'Beast', 'Dragonkin', 'Elemental']);
const RACE_TINT: Record<string, number> = {
  Arthropod: 0xd8f0a0, Avion: 0xe0e8ff, Beast: 0xffffff, Celestial: 0xfff2b0, Daimon: 0xffa0a0,
  Dragonkin: 0xffc080, Elemental: 0x9fe8ff, Giant: 0xe0c8a8, Humanoid: 0xf0d8ff, Mechanoid: 0xb8c8d8, Reptilian: 0xb0f0b0, Sprite: 0xffc8f0, Undead: 0xffffff,
};
const ELEMENT_COLOR: Record<string, number> = { fire: 0xff6a2a, cold: 0x7fd8ff, elec: 0xfff04a, wind: 0x8affb0, holy: 0xfff8c8, dark: 0xb060ff };
const AVOID_ZH: Record<string, string> = { evade: '閃避', parry: '招架', block: '格擋', resist: '抵抗' };

interface MonView { m: Monster; sprite: Phaser.GameObjects.Sprite; kind: 'beast' | 'undead'; x: number; y: number; scale: number; bar: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; ring: Phaser.GameObjects.Ellipse; charge?: Phaser.Tweens.Tween; chargeFx?: Phaser.GameObjects.Ellipse }

export class Stage extends Phaser.Scene {
  manifest!: Manifest;
  hero!: Phaser.GameObjects.Sprite;
  mons: MonView[] = [];
  speed = 1;
  skip = false;
  target = 0;
  onTarget: (i: number) => void = () => {};
  ready!: () => void;
  readyP = new Promise<void>((r) => (this.ready = r));
  dim!: Phaser.GameObjects.Rectangle;

  constructor() { super('stage'); }

  preload() {
    this.load.json('manifest', 'assets/pixel/manifest.json');
    this.load.once('filecomplete-json-manifest', () => {
      const m = this.cache.json.get('manifest') as Manifest;
      this.load.image('bg', `assets/pixel/${m.bg}`);
      for (const [c, def] of Object.entries(m.chars))
        for (const [a, act] of Object.entries(def.actions)) act.files.forEach((f, i) => this.load.image(`${c}-${a}-${i}`, `assets/pixel/${f}`));
    });
  }

  create() {
    this.manifest = this.cache.json.get('manifest') as Manifest;
    this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(W, H);
    for (const [c, def] of Object.entries(this.manifest.chars))
      for (const [a, act] of Object.entries(def.actions))
        this.anims.create({ key: `${c}-${a}`, frames: act.files.map((_, i) => ({ key: `${c}-${a}-${i}` })), frameRate: 10, repeat: a === 'idle' ? -1 : 0 });
    this.hero = this.add.sprite(250, 540, 'hero-idle-0').setScale(1.8).setDepth(5);
    this.setOrigin(this.hero, 'hero', 'idle');
    this.hero.play('hero-idle');
    this.dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0).setDepth(50);
    this.ready();
  }

  private setOrigin(s: Phaser.GameObjects.Sprite, c: string, a: string) {
    const act = this.manifest.chars[c]!.actions[a]!;
    s.setOrigin(act.anchor / act.w, 1);
  }

  /** design §3: at 1x every action animation is <= 0.3 s. The authored timings (longest ~460 ms) are scaled by this. */
  static readonly ANIM_SCALE = 0.55;
  /** Per-event awaited time of the last play() call, in ms (for the headless timing check). */
  timings: { t: string; ms: number }[] = [];
  private d(ms: number) { return this.skip ? 0 : (ms * Stage.ANIM_SCALE) / this.speed; }
  private wait(ms: number) { const t = this.d(ms); return t <= 0 ? Promise.resolve() : new Promise<void>((r) => this.time.delayedCall(t, r)); }
  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((r) => {
      if (this.skip) { this.tweens.add({ ...cfg, duration: 1, delay: 0, yoyo: false, onComplete: () => r() } as Phaser.Types.Tweens.TweenBuilderConfig); return; }
      this.tweens.add({ ...cfg, duration: this.d((cfg.duration as number) ?? 200), onComplete: () => r() } as Phaser.Types.Tweens.TweenBuilderConfig);
    });
  }

  setDim(on: boolean) { this.dim.setVisible(on); }

  heroPlay(a: 'idle' | 'attack' | 'hurt' | 'cast') {
    this.setOrigin(this.hero, 'hero', a);
    this.hero.play({ key: `hero-${a}`, frameRate: 10 * this.speed });
    if (a !== 'idle') this.hero.once('animationcomplete', () => { this.setOrigin(this.hero, 'hero', 'idle'); this.hero.play('hero-idle'); });
  }

  clearMonsters() {
    for (const v of this.mons) { v.sprite.destroy(); v.bar.destroy(); v.label.destroy(); v.ring.destroy(); v.chargeFx?.destroy(); }
    this.mons = [];
  }

  setMonsters(ms: Monster[]) {
    this.clearMonsters();
    const n = ms.length;
    const xs = n <= 2 ? [720, 940] : n === 3 ? [640, 820, 1000] : [600, 740, 880, 1020];
    const ys = n <= 2 ? [560, 540] : [575, 520, 575, 520];
    ms.forEach((m, i) => {
      const kind = BEAST_RACES.has(m.race) ? 'beast' : 'undead';
      const scale = (m.rank === 'boss' ? 1.9 : m.rank === 'elite' ? 1.55 : 1.25) * (n >= 4 ? 0.9 : 1);
      const x = xs[i] ?? 900, y = ys[i] ?? 560;
      const ring = this.add.ellipse(x, y - 4, 110 * scale, 22 * scale, 0xffe060, 0).setStrokeStyle(3, 0xffe060, 0.9).setDepth(3).setVisible(false);
      const sprite = this.add.sprite(x, y, `${kind}-attack-0`).setScale(scale).setDepth(4 + (y > 550 ? 1 : 0));
      this.setOrigin(sprite, kind, 'attack');
      sprite.setTint(RACE_TINT[m.race] ?? 0xffffff);
      if (m.rank === 'elite') sprite.setTint(0xffb0b0);
      if (m.rank === 'boss') sprite.setTint(0xff8080);
      sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (m.hp > 0) this.onTarget(i); });
      const top = y - (kind === 'beast' ? 95 : 148) * scale;
      const label = this.add.text(x, top - 26, `${m.rank === 'boss' ? '♛ ' : m.rank === 'elite' ? '☠ ' : ''}${m.name} Lv${m.level}`, { fontFamily: 'monospace', fontSize: '13px', color: m.rank === 'normal' ? '#ffffff' : '#ffb060', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
      const bar = this.add.graphics().setDepth(20);
      const v: MonView = { m, sprite, kind, x, y, scale, bar, label, ring };
      this.mons.push(v);
      this.drawBar(v);
      sprite.setAlpha(0);
      sprite.x += 80;
      this.tween({ targets: sprite, alpha: 1, x, duration: 300, delay: i * 80 });
    });
  }

  private drawBar(v: MonView) {
    const top = v.y - (v.kind === 'beast' ? 95 : 148) * v.scale;
    const w = 100, x = v.x - w / 2, y = top - 14;
    v.bar.clear();
    if (v.m.hp <= 0) return;
    v.bar.fillStyle(0x000000, 0.7).fillRect(x - 1, y - 1, w + 2, 9);
    const f = v.m.hp / v.m.maxHp;
    v.bar.fillStyle(f > 0.5 ? 0x4ad94a : f > 0.25 ? 0xe0c040 : 0xe04040, 1).fillRect(x, y, w * f, 7);
    if (v.m.status.stun > 0) v.bar.fillStyle(0x7fd8ff, 1).fillRect(x, y + 8, 18, 3);
    if (v.m.status.bleed > 0) v.bar.fillStyle(0xd02020, 1).fillRect(x + 20, y + 8, 18, 3);
  }

  setTarget(i: number) {
    this.target = i;
    this.mons.forEach((v, j) => v.ring.setVisible(j === i && v.m.hp > 0));
  }

  refresh() { this.mons.forEach((v) => this.drawBar(v)); this.setTarget(this.target); }

  popup(x: number, y: number, text: string, color: string, size = 22, rise = 70) {
    const t = this.add.text(x + Phaser.Math.Between(-18, 18), y, text, { fontFamily: 'monospace', fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(40);
    t.setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 120 / this.speed, ease: 'Back.Out' });
    this.tweens.add({ targets: t, y: y - rise, alpha: 0, delay: 350 / this.speed, duration: 650 / this.speed, onComplete: () => t.destroy() });
  }

  private flash(s: Phaser.GameObjects.Sprite, color = 0xffffff) {
    const old = s.tintTopLeft;
    s.setTint(color).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(this.d(90) || 1, () => { s.setTintMode(Phaser.TintModes.MULTIPLY).setTint(old); });
  }

  shake(intensity: number, ms = 180) { if (!this.skip) this.cameras.main.shake(ms / this.speed, intensity); }

  private monTop(v: MonView) { return v.y - (v.kind === 'beast' ? 95 : 148) * v.scale; }

  async play(events: BEvent[], s: BattleState) {
    this.timings = [];
    for (const e of events) {
      const t0 = performance.now();
      await this.one(e);
      this.timings.push({ t: e.t, ms: Math.round(performance.now() - t0) });
    }
    void s;
    this.refresh();
  }

  private async one(e: BEvent) {
    {
      if (e.t === 'hit') await this.hit(e);
      else if (e.t === 'heal') {
        this.popup(this.hero.x, this.hero.y - 230, `+${e.amount} ${e.res.toUpperCase()}`, e.res === 'hp' ? '#6cff6c' : e.res === 'mp' ? '#6cb8ff' : '#ffd060', 20);
        if (e.label !== '自然回復') await this.wait(150);
      } else if (e.t === 'status') {
        const v = typeof e.to === 'number' ? this.mons[e.to] : undefined;
        if (v) this.popup(v.x, this.monTop(v) - 20, e.text, '#c8a8ff', 16, 40);
        else this.popup(this.hero.x, this.hero.y - 250, e.text, '#c8a8ff', 16, 40);
        await this.wait(120);
      } else if (e.t === 'death') {
        const v = this.mons[e.to];
        if (v) {
          v.bar.clear(); v.ring.setVisible(false); v.chargeFx?.destroy(); v.chargeFx = undefined; v.charge?.stop();
          this.tween({ targets: [v.sprite, v.label], alpha: 0, y: '+=20', duration: 420 });
          this.flash(v.sprite, 0xffffff);
          await this.wait(200);
        }
      } else if (e.t === 'charge') {
        const v = this.mons[e.from];
        if (v) {
          this.popup(v.x, this.monTop(v) - 30, '蓄力！', '#ff4040', 24, 30);
          v.chargeFx?.destroy();
          v.chargeFx = this.add.ellipse(v.x, v.y - 60 * v.scale, 140 * v.scale, 150 * v.scale, 0xff2020, 0.18).setDepth(3);
          v.charge = this.tweens.add({ targets: v.chargeFx, alpha: 0.45, scale: 1.12, yoyo: true, repeat: -1, duration: 380 });
          this.shake(0.004, 250);
          await this.wait(450);
        }
      } else if (e.t === 'spirit') {
        this.popup(this.hero.x, this.hero.y - 240, e.on ? '靈動架勢' : '解除架勢', '#ffb0ff', 20, 40);
        this.hero.setTint(e.on ? 0xffc8ff : 0xffffff);
        await this.wait(200);
      }
      this.mons.forEach((v) => this.drawBar(v));
    }
  }

  private async hit(e: Extract<BEvent, { t: 'hit' }>) {
    const avoidTxt = e.avoided ? AVOID_ZH[e.avoided] ?? e.avoided : '';
    if (e.from === 'player' && typeof e.to === 'number') {
      const v = this.mons[e.to];
      if (!v) return;
      const magic = !!e.element;
      if (e.label === '持續') {
        this.popup(v.x, this.monTop(v) + 30, `${e.dmg}`, '#ff5050', 18, 40);
        await this.wait(150);
        return;
      }
      if (magic) {
        this.heroPlay('cast');
        await this.wait(200);
        const c = ELEMENT_COLOR[e.element!] ?? 0xffffff;
        const orb = this.add.circle(v.x, v.y - 50 * v.scale, 10, c, 0.9).setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
        this.tween({ targets: orb, radius: 70 * v.scale, alpha: 0, duration: 380 }).then(() => orb.destroy());
      } else {
        this.heroPlay('attack');
        this.tween({ targets: this.hero, x: 300, yoyo: true, duration: 110 });
        await this.wait(170);
      }
      if (e.dmg > 0) {
        this.flash(v.sprite);
        v.sprite.play({ key: `${v.kind}-hurt`, frameRate: 12 * this.speed });
        this.setOrigin(v.sprite, v.kind, 'hurt');
        v.sprite.once('animationcomplete', () => { if (v.m.hp > 0) { v.sprite.setTexture(`${v.kind}-attack-0`); this.setOrigin(v.sprite, v.kind, 'attack'); } });
        this.tween({ targets: v.sprite, x: v.x + 14, yoyo: true, duration: 60 });
      }
      const top = this.monTop(v);
      if (e.weak && e.dmg > 0) this.popup(v.x, top - 24, '弱點！', '#40ff90', 30, 80);
      if (e.crits > 0) {
        this.popup(v.x, top + 10, `${e.dmg}!`, '#ffe040', 34 + e.crits * 4, 90);
        this.shake(0.006 + e.crits * 0.003);
      } else this.popup(v.x, top + 10, e.dmg > 0 ? `${e.dmg}` : '', magic ? '#9fd8ff' : '#ffffff', 24);
      if (avoidTxt) this.popup(v.x, top - 10, avoidTxt, '#bbbbbb', 15, 40);
      if (e.label) this.popup(v.x, top - 34, e.label, '#ffb060', 15, 30);
      await this.wait(260);
    } else if (typeof e.from === 'number') {
      const v = this.mons[e.from];
      if (v) {
        v.chargeFx?.destroy(); v.chargeFx = undefined; v.charge?.stop();
        v.sprite.play({ key: `${v.kind}-attack`, frameRate: 12 * this.speed });
        this.setOrigin(v.sprite, v.kind, 'attack');
        await this.tween({ targets: v.sprite, x: v.x - 60, yoyo: true, duration: 120 });
      }
      if (e.dmg > 0) { this.heroPlay('hurt'); this.flash(this.hero, 0xff8080); }
      const big = e.label === '重擊！' || e.crits > 0;
      this.popup(this.hero.x, this.hero.y - 220, e.dmg > 0 ? `-${e.dmg}` : '', big ? '#ff3030' : '#ff8080', big ? 30 : 22);
      if (avoidTxt) this.popup(this.hero.x, this.hero.y - 245, avoidTxt, '#cccccc', 15, 40);
      if (e.label === '重擊！') this.shake(0.018, 320);
      else if (e.dmg > 0) this.shake(0.003, 120);
      await this.wait(220);
    }
  }

  async lootBeams(drops: { q: Quality; idx: number }[]) {
    for (const [k, d] of drops.entries()) {
      const v = this.mons[d.idx % Math.max(1, this.mons.length)];
      const x = (v?.x ?? 850) + (k % 3) * 18 - 18, y = v?.y ?? 560;
      const c = QUALITY_COLOR[d.q];
      const beam = this.add.rectangle(x, y, 26, 0, c, 0.55).setOrigin(0.5, 1).setDepth(35).setBlendMode(Phaser.BlendModes.ADD);
      const core = this.add.rectangle(x, y, 6, 0, 0xffffff, 0.9).setOrigin(0.5, 1).setDepth(36).setBlendMode(Phaser.BlendModes.ADD);
      const gem = this.add.star(x, y - 8, 4, 5, 13, c).setDepth(37);
      const qi = ['crude', 'fair', 'average', 'superior', 'exquisite', 'magnificent', 'legendary', 'peerless'].indexOf(d.q);
      const hgt = 160 + qi * 55;
      this.tween({ targets: [beam, core], height: hgt, duration: 260 });
      this.tweens.add({ targets: gem, angle: 360, repeat: -1, duration: 1400 });
      this.tweens.add({ targets: [beam, core], alpha: 0.15, yoyo: true, repeat: -1, duration: 500 });
      if (qi >= 4) { this.shake(0.006 + (qi - 4) * 0.004, 300); this.cameras.main.flash(this.d(220) || 1, (c >> 16) & 255, (c >> 8) & 255, c & 255); }
      this.time.delayedCall(2600, () => { beam.destroy(); core.destroy(); gem.destroy(); });
      await this.wait(qi >= 3 ? 360 : 200);
    }
  }
}

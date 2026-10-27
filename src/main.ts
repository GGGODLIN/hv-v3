import * as Phaser from 'phaser';
import './style.css';
import { makePool, type MonsterRow } from './core/monsters';
import { App } from './game/app';
import { RULES } from './core/run';
import { switchSlot, stripPreset, type Preset } from './core/preset';
import { H, Stage, W } from './game/stage';

function buildBadge() {
  const el = document.createElement('div');
  el.id = 'build';
  el.textContent = `build ${__BUILD__}${RULES.cp4RunBuffs ? ' · CP4' : ''}${RULES.cp5Bosses ? ' · CP5' : ''}${RULES.cp6Abyss ? ' · CP6' : ''}${RULES.cp7 ? ' · CP7' : ''}`;
  el.style.cssText = 'position:fixed;right:6px;bottom:4px;font:11px monospace;color:#a89cb8;opacity:1;pointer-events:none;z-index:9999';
  document.body.appendChild(el);
}

/** CP3-bugfix 8: retry a failed fetch (network error or non-2xx) with backoff. */
async function fetchRetry(url: string, tries = 4, init?: RequestInit): Promise<Response> {
  for (let i = 0; ; i++) {
    try { const r = await fetch(i ? `${url}?retry=${i}` : url, init); if (r.ok) return r; if (i >= tries - 1) return r; } catch (e) { if (i >= tries - 1) throw e; }
    const w = window as unknown as { __assetRetries?: number }; w.__assetRetries = (w.__assetRetries ?? 0) + 1;
    await new Promise((res) => setTimeout(res, 300 * (i + 1)));
  }
}

async function boot() {
  // CP4 run buffs are on by default since cp4-pass; `?cp4` is kept as a no-op alias for old links.
  if (new URLSearchParams(location.search).has('cp4')) RULES.cp4RunBuffs = true;
  // CP5 bosses / affixes / themes are off by default; `?cp5` turns them on for playtesting.
  // CP5 is on by default since cp5-pass; `?cp5` is kept as a no-op alias for old links.
  if (new URLSearchParams(location.search).has('cp5')) RULES.cp5Bosses = true;
  // CP6 abyss tower is off by default; `?cp6` turns it on (and the CP5 bosses / affixes it reuses).
  if (new URLSearchParams(location.search).has('cp6')) { RULES.cp6Abyss = true; RULES.cp5Bosses = true; }
  // CP7 手感 (docs/cp7-feel.md) is off by default; `?cp7` turns it on.
  if (new URLSearchParams(location.search).has('cp7')) RULES.cp7 = true;
  // CP8 真實遊玩 (docs/cp8-real-play.md) is off by default; `?cp8` turns it on.
  if (new URLSearchParams(location.search).has('cp8')) RULES.cp8 = true;
  // CP6 rc3 debug presets (docs/cp6-playtest-checklist.md): `?cp6&debug&preset=postF20-blade|oc|arcane|bulwark|abyss10|abyss15|abyss20` (rc5: `debug` no longer required)
  // overwrites the local save with a sim-exported character (public/data/cp6-presets.json) before the game boots.
  const qs = new URLSearchParams(location.search), preset = qs.get('preset');
  // rc5 (b): `debug` is no longer required — without it the preset was silently ignored and the previous save (e.g. abyss15) stayed.
  if (RULES.cp6Abyss && preset) {
    // rc10: no-store so a browser never serves an older build's preset file.
    const all = (await fetchRetry('data/cp6-presets.json', 4, { cache: 'no-store' }).then((r) => r.json())) as Record<string, Preset>;
    const pr = all[preset];
    if (pr) {
      // rc10: full replacement (save + abyss record), then drop `preset` from the URL so reloading does not wipe progress.
      // cp8-rc5: one save slot per preset (switching presets parks / restores instead of overwriting).
      (window as unknown as { hvSlot: string }).hvSlot = switchSlot(localStorage, preset, pr, qs.has('fresh'));
      history.replaceState(null, '', location.pathname + stripPreset(location.search) + location.hash);
      (window as unknown as { hvPreset: string }).hvPreset = preset;
    } else presetWarn(`未知的 preset「${preset}」，已忽略（可用：${Object.keys(all).join(', ')}）`);
  } else if (preset) presetWarn(`preset「${preset}」被忽略：CP6 深淵未開啟（網址加 ?cp6）`); // rc14 item 6
  buildBadge();
  const stage = new Stage();
  new Phaser.Game({ type: Phaser.AUTO, parent: 'stage', width: W, height: H, pixelArt: true, backgroundColor: '#120c18', scene: stage });
  const [rows] = await Promise.all([fetchRetry('data/monsters.json').then((r) => r.json() as Promise<MonsterRow[]>), stage.readyP]);
  const app = new App(stage, makePool(rows), document.getElementById('ui')!);
  // Test shortcut: only in dev, or when the page is opened with ?debug (used by `npm run e2e`).
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) (window as unknown as { hv: App }).hv = app;
}
boot();

/** rc14 item 6: a preset that is not applied is reported on screen (and in the console), never silently. */
function presetWarn(msg: string): void {
  console.warn(msg);
  const d = document.createElement('div'); d.dataset.presetIgnored = '1'; d.textContent = '⚠ ' + msg;
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#a33;color:#fff;padding:4px 8px;font-size:13px';
  document.body.appendChild(d); (window as unknown as { hvPresetIgnored: string }).hvPresetIgnored = msg;
}

// rc16 item 6: the layout is a fixed 1100px; on narrower windows (QA: 913px) scale it to fit instead of clipping / scrolling sideways.
const fit = () => { const w = document.getElementById('wrap'); if (w) w.style.zoom = String(Math.min(1, (window.innerWidth - 8) / 1100)); };
window.addEventListener('resize', fit); fit();

import * as Phaser from 'phaser';
import './style.css';
import { makePool, type MonsterRow } from './core/monsters';
import { App } from './game/app';
import { RULES } from './core/run';
import { H, Stage, W } from './game/stage';

function buildBadge() {
  const el = document.createElement('div');
  el.id = 'build';
  el.textContent = `build ${__BUILD__}${RULES.cp4RunBuffs ? ' · CP4' : ''}`;
  el.style.cssText = 'position:fixed;right:6px;bottom:4px;font:11px monospace;color:#8a7f99;opacity:.8;pointer-events:none;z-index:9999';
  document.body.appendChild(el);
}

/** CP3-bugfix 8: retry a failed fetch (network error or non-2xx) with backoff. */
async function fetchRetry(url: string, tries = 4): Promise<Response> {
  for (let i = 0; ; i++) {
    try { const r = await fetch(i ? `${url}?retry=${i}` : url); if (r.ok) return r; if (i >= tries - 1) return r; } catch (e) { if (i >= tries - 1) throw e; }
    const w = window as unknown as { __assetRetries?: number }; w.__assetRetries = (w.__assetRetries ?? 0) + 1;
    await new Promise((res) => setTimeout(res, 300 * (i + 1)));
  }
}

async function boot() {
  // CP4 run buffs are off by default (docs/cp4-run-buffs.md §11); `?cp4` turns them on for playtesting.
  if (new URLSearchParams(location.search).has('cp4')) RULES.cp4RunBuffs = true;
  buildBadge();
  const stage = new Stage();
  new Phaser.Game({ type: Phaser.AUTO, parent: 'stage', width: W, height: H, pixelArt: true, backgroundColor: '#120c18', scene: stage });
  const [rows] = await Promise.all([fetchRetry('data/monsters.json').then((r) => r.json() as Promise<MonsterRow[]>), stage.readyP]);
  const app = new App(stage, makePool(rows), document.getElementById('ui')!);
  // Test shortcut: only in dev, or when the page is opened with ?debug (used by `npm run e2e`).
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) (window as unknown as { hv: App }).hv = app;
}
boot();

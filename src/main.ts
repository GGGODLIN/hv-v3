import * as Phaser from 'phaser';
import './style.css';
import { makePool, type MonsterRow } from './core/monsters';
import { App } from './game/app';
import { H, Stage, W } from './game/stage';

function buildBadge() {
  const el = document.createElement('div');
  el.id = 'build';
  el.textContent = `build ${__BUILD__}`;
  el.style.cssText = 'position:fixed;right:6px;bottom:4px;font:11px monospace;color:#8a7f99;opacity:.8;pointer-events:none;z-index:9999';
  document.body.appendChild(el);
}

async function boot() {
  buildBadge();
  const stage = new Stage();
  new Phaser.Game({ type: Phaser.AUTO, parent: 'stage', width: W, height: H, pixelArt: true, backgroundColor: '#120c18', scene: stage });
  const [rows] = await Promise.all([fetch('data/monsters.json').then((r) => r.json() as Promise<MonsterRow[]>), stage.readyP]);
  const app = new App(stage, makePool(rows), document.getElementById('ui')!);
  // Test shortcut: only in dev, or when the page is opened with ?debug (used by `npm run e2e`).
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) (window as unknown as { hv: App }).hv = app;
}
boot();

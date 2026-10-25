import * as Phaser from 'phaser';
import './style.css';
import { makePool, type MonsterRow } from './core/monsters';
import { App } from './game/app';
import { H, Stage, W } from './game/stage';

async function boot() {
  const stage = new Stage();
  new Phaser.Game({ type: Phaser.AUTO, parent: 'stage', width: W, height: H, pixelArt: true, backgroundColor: '#120c18', scene: stage });
  const [rows] = await Promise.all([fetch('data/monsters.json').then((r) => r.json() as Promise<MonsterRow[]>), stage.readyP]);
  const app = new App(stage, makePool(rows), document.getElementById('ui')!);
  (window as unknown as { hv: App }).hv = app;
}
boot();

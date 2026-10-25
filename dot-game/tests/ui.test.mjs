import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { QUALITY_TIERS } from '../src/loot.js';
const base = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', base), 'utf8');
const css = readFileSync(new URL('style.css', base), 'utf8');
const js = readFileSync(new URL('src/ui.js', base), 'utf8');
test('every literal UI ID maps to the standalone document', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const match of js.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(match[1]), `Missing DOM id ${match[1]}`);
});
test('UI uses local relative assets and no imported HTML injection', () => {
  assert.ok(html.includes('src="./src/ui.js"'));
  assert.ok(html.includes('href="./style.css"'));
  assert.doesNotMatch(js, /\.innerHTML\s*=/);
  assert.doesNotMatch(html, /(?:src|href)="https?:/);
  assert.doesNotMatch(css, /@import|url\(https?:/);
});
test('save boundary, hidden-page pause, bounded import and reduced motion are explicit', () => {
  assert.match(js, /validateSave\(JSON\.parse/);
  assert.match(js, /file\.size>2\*1024\*1024/);
  assert.match(js, /if\(!document\.hidden\)/);
  assert.match(js, /releaseLease/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(html, /type="file"/);
});
test('UI has export/import, keyboard-native buttons, help and actionable equipment comparison', () => {
  for (const id of ['export-save','import-save','help-dialog','item-detail','equipment','start-button','retreat-button']) assert.ok(html.includes(`id="${id}"`));
  assert.match(js, /equip\.disabled = state\.mode === 'battle'/);
  assert.match(js, /aria-pressed/);
});

test('all eight quality labels come from the loot tiers without falling back', () => {
  const declaration = js.match(/const qualityNames = [^;]+;/)?.[0];
  assert.ok(declaration, 'qualityNames declaration exists');
  assert.match(js, /import \{ QUALITY_TIERS \} from '\.\/loot\.js'/);
  const labels = runInNewContext(`${declaration} qualityNames`, { QUALITY_TIERS });
  assert.equal(QUALITY_TIERS.length, 8);
  assert.equal(Object.keys(labels).length, 8);
  for (const tier of QUALITY_TIERS) {
    assert.ok(Object.hasOwn(labels, tier.name), `${tier.name} must not use fallback`);
    assert.equal(labels[tier.name], tier.label);
  }
  assert.equal(labels.Fair, '尚可');
  assert.equal(labels.Average, '普通');
  assert.equal(labels.Exquisite, '精良');
});

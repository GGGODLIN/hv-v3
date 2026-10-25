import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
for (const [dialog, title, text] of [['help-dialog','help-title','遠征者手冊'], ['settings-dialog','settings-title','存檔與設定']]) {
  test(`${dialog}: native dialog explicitly uses its visible heading as accessible name`, () => {
    assert.match(html, new RegExp(`<dialog id="${dialog}" aria-labelledby="${title}">`));
    assert.match(html, new RegExp(`<h2 id="${title}">${text}</h2>`));
    assert.equal([...html.matchAll(new RegExp(`\\bid="${title}"`, 'g'))].length, 1);
    const block = html.split(`<dialog id="${dialog}"`)[1].split('</dialog>')[0];
    assert.ok(block.includes(`id="${title}"`));
    assert.ok(block.includes(`data-close="${dialog}"`));
    assert.ok(!block.includes('aria-hidden="true"'));
  });
}
test('dialog naming leaves native opening/closing event wiring unchanged', () => {
  assert.ok(ui.includes("$('help-toggle').addEventListener('click',()=>$('help-dialog').showModal())"));
  assert.ok(ui.includes("$('settings-toggle').addEventListener('click',()=>$('settings-dialog').showModal())"));
  assert.ok(ui.includes('[data-close]'));
});

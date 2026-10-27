import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui=readFileSync(new URL('../src/ui.js', import.meta.url),'utf8');

test('v040 observation reset is confined to two validated adoption boundaries', () => {
  assert.equal((ui.match(/resetEventObservation\(\);/g) || []).length, 2);
  assert.equal((ui.match(/function resetEventObservation\(\)/g) || []).length, 1);
  for (const expression of ['state = validateSave(JSON.parse(raw)); resetEventObservation();', 'state = validateSave(JSON.parse(event.newValue)); resetEventObservation();']) assert.ok(ui.includes(expression));
  const selection = ui.slice(ui.indexOf('function syncSelection()'), ui.indexOf('function departureReadiness()'));
  assert.ok(!selection.includes('resetEventObservation'));
});

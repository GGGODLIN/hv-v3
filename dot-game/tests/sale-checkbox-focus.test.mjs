import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeSaleCheckboxFocus} from './helpers/sale-checkbox-focus-baseline.mjs';
test('checkbox focus inverse preserves v061 UI exactly',()=>{const s=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');assert.equal(createHash('sha256').update(beforeSaleCheckboxFocus(s,'src/ui.js')).digest('hex'),'8cd8f70dc85b528433577a3d6baff96a135c3b208246a33a4989819c87c98117');});

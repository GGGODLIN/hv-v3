import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MERCHANT_HP_POTIONS, RULES } from '../src/core/run';
describe('rc19 item 3 merchant health potions (自訂，非原版)', () => {
  it('1 per merchant (cp9-rc8 WIP 自訂: was 3) at the town price 50C', () => { expect(MERCHANT_HP_POTIONS).toBe(1); expect(RULES.potionPrice.health).toBe(50); });
  it('merchantStock sets hpLeft under cp8; UI and sim respect it', () => {
    expect(readFileSync('src/core/run.ts', 'utf8')).toMatch(/RULES\.cp8 \? \{ hpLeft: merchantHp\(run\) \}/);
    const app = readFileSync('src/game/app.ts', 'utf8');
    expect(app).toMatch(/st!\.hpLeft!--/); expect(app).toMatch(/data-prep-towntip/); expect(app).toContain('可在城鎮買藥');
    expect(readFileSync('src/core/auto.ts', 'utf8')).toMatch(/st\.hpLeft \?\? Infinity/);
  });
  it('battle potion drops stay on the original rolls (≈2.2% health)', async () => {
    const { CONSTANTS: C } = await import('../src/core/data/constants');
    const r = C['F-003-restorative-rolls'].value;
    expect(r.restoratives * r.potion / r.types.length).toBeCloseTo(0.022, 3); expect(RULES.origPotionDrop).toBe(true);
  });
});

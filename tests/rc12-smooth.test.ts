// rc12（自訂）: abyss boss HP sawtooth smoothed without making any floor weaker.
import { describe, expect, it } from 'vitest';
import { abyssMult, bossKey } from '../src/core/abyss';
import { CP5 } from '../src/core/cp5';
import { RULES, smoothEnv12 } from '../src/core/run';
describe('rc12 smooth abyss boss HP', () => {
  it('every boss floor ≥ original and the curve never goes down', () => {
    const f = { ...RULES }; RULES.cp7 = RULES.cp8 = true;
    const c = (d: number) => abyssMult(d).hp * (CP5.bossHp[bossKey(d)] ?? 1);
    let prev = 0; for (let d = 25; d <= 200; d += 5) { const e = smoothEnv12(c, d); expect(e).toBeGreaterThanOrEqual(c(d) - 1e-9); expect(e).toBeGreaterThanOrEqual(prev - 1e-9); prev = e; }
    Object.assign(RULES, f);
  });
});

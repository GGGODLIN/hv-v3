import { describe, expect, it } from 'vitest';
import { resolveHit, type HitInput } from '../src/core/damage';
import { Rng } from '../src/core/rng';

const base: HitInput = { raw: 100, magic: false, acc: 0, evade: 0, parry: 0, block: 0, resist: 0, critChance: 0, critMod: 0.5, mit: 0, spec: 0 };

describe('resolveHit chain', () => {
  it('no defences: damage is raw x roll in 80..120', () => {
    const rng = new Rng(1);
    for (let i = 0; i < 500; i++) {
      const r = resolveHit(rng, base);
      expect(r.damage).toBeGreaterThanOrEqual(80);
      expect(r.damage).toBeLessThanOrEqual(120);
      expect(r.full).toBe(true);
    }
  });
  it('evade: two rolls -> full 0 avoid at p^2, glance at 2p(1-p)', () => {
    const rng = new Rng(2);
    const n = 20000;
    let zero = 0, glance = 0;
    for (let i = 0; i < n; i++) {
      const r = resolveHit(rng, { ...base, evade: 0.5 });
      if (r.avoidMult === 0) zero++;
      else if (r.avoidMult === 0.5) glance++;
    }
    expect(zero / n).toBeCloseTo(0.25, 1);
    expect(glance / n).toBeCloseTo(0.5, 1);
  });
  it('accuracy scales avoid by (1 - acc)', () => {
    const rng = new Rng(3);
    let full = 0;
    for (let i = 0; i < 10000; i++) if (resolveHit(rng, { ...base, evade: 0.5, acc: 1 }).full) full++;
    expect(full).toBe(10000);
  });
  it('magic is never parried or blocked; physical is never resisted', () => {
    const rng = new Rng(4);
    for (let i = 0; i < 2000; i++) {
      expect(resolveHit(rng, { ...base, magic: true, parry: 1, block: 1 }).full).toBe(true);
      expect(resolveHit(rng, { ...base, resist: 1 }).full).toBe(true);
    }
    expect(resolveHit(rng, { ...base, magic: true, resist: 1 }).avoidMult).toBe(0.1);
  });
  it('crits only on full hits; first roll capped at 50%', () => {
    const rng = new Rng(5);
    let crit = 0;
    for (let i = 0; i < 20000; i++) {
      const r = resolveHit(rng, { ...base, critChance: 1 });
      if (r.crits > 0) crit++;
      const g = resolveHit(rng, { ...base, critChance: 1, evade: 0.99 });
      if (!g.full) expect(g.crits).toBe(0);
    }
    expect(crit / 20000).toBeCloseTo(0.5, 1);
  });
  it('mitigation and negative spec (weakness) apply', () => {
    const rng = new Rng(6);
    let a = 0, b = 0;
    for (let i = 0; i < 2000; i++) {
      a += resolveHit(rng, { ...base, mit: 0.5 }).damage;
      b += resolveHit(rng, { ...base, spec: -0.25 }).damage;
    }
    expect(a / 2000).toBeCloseTo(50, -1);
    expect(b / 2000).toBeCloseTo(125, -1);
  });
});

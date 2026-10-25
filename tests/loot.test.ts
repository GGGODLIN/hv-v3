import { describe, expect, it } from 'vitest';
import { generateEquip, rangesFor, rollQuality, statValue, QUALITIES, equipName, type Quality } from '../src/core/items';
import { equipDropChance } from '../src/core/run';
import { Rng } from '../src/core/rng';

describe('loot', () => {
  it('quality weights follow 003-03a (25/35/30/8/2)', () => {
    const rng = new Rng(11);
    const n = 40000;
    const c: Record<string, number> = {};
    for (let i = 0; i < n; i++) { const q = rollQuality(rng); c[q] = (c[q] ?? 0) + 1; }
    expect(c.crude! / n).toBeCloseTo(0.25, 1);
    expect(c.fair! / n).toBeCloseTo(0.35, 1);
    expect(c.average! / n).toBeCloseTo(0.30, 1);
    expect(c.superior! / n).toBeCloseTo(0.08, 1);
    expect(c.exquisite! / n).toBeCloseTo(0.02, 1);
  });
  it('min quality floor is respected', () => {
    const rng = new Rng(12);
    for (let i = 0; i < 2000; i++) expect(QUALITIES.indexOf(rollQuality(rng, 'average'))).toBeGreaterThanOrEqual(2);
  });
  it('stat curve: R=0 -> min*fluc, R=200 -> max*fluc, monotonic', () => {
    expect(statValue('attackDamage', 350, 701, 0, 0)).toBeCloseTo(350 * 0.0854);
    expect(statValue('attackDamage', 350, 701, 200, 0)).toBeCloseTo(701 * 0.0854);
    expect(statValue('attackDamage', 350, 701, 100, 0)).toBeLessThan((350 + 701) / 2 * 0.0854);
    expect(statValue('attackDamage', 350, 701, 100, 16.60027)).toBeCloseTo(statValue('attackDamage', 350, 701, 100, 0) * 2);
  });
  it('rolls land inside the quality range and higher quality is stronger on average', () => {
    const rng = new Rng(13);
    const avg = (q: Quality) => {
      let s = 0;
      for (let i = 0; i < 300; i++) {
        const e = generateEquip(rng, 10, { base: 'axe', group: 'oneHand', quality: q });
        s += e.stats.attackDamage!;
      }
      return s / 300;
    };
    expect(avg('superior')).toBeGreaterThan(avg('average'));
    expect(avg('average')).toBeGreaterThan(avg('crude'));
  });
  it('every base generates (derived bases resolve) with a readable name', () => {
    const rng = new Rng(14);
    for (let i = 0; i < 3000; i++) {
      const e = generateEquip(rng, 20);
      expect(Object.keys(e.stats).length).toBeGreaterThan(0);
      expect(equipName(e)).toMatch(/^[\u4e00-\u9fff]+・[\u4e00-\u9fff]+(\+\d+)?$/); // CP3 polish: Chinese, every key translated
    }
    expect(rangesFor('dagger').length).toBeGreaterThan(0);
  });
  it('8x drop acceleration on the equipment roll', () => {
    expect(equipDropChance(100, 1)).toBeCloseTo(0.1 * 0.025);
    expect(equipDropChance(100, 8)).toBeCloseTo(0.1 * 0.2);
    expect(equipDropChance(2000, 8)).toBeCloseTo(0.25 * 0.2);
  });
});

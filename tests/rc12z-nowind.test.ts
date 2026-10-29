import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RUN12Z } from '../src/core/cp8';
// rc12z 候選（自訂）: bulwark/arcane F45–65 首領戰小怪不蓄力（同 rc12y oc）；blade 不變.
describe('rc12z no-wind deep boss minions', () => {
  it('defaults and gate', () => {
    expect(RUN12Z).toEqual({ noWind: 1 });
    const src = readFileSync('src/core/run.ts', 'utf8');
    expect(src).toContain("(RUN12Z.noWind && (lean === 'bulwark' || lean === 'arcane'))");
    expect(src).not.toContain("lean === 'blade') && ab >= RUN12Y.ocSoloFrom");
  });
});

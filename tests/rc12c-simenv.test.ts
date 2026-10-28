import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SIM_ENV_KNOWN, simEnvProblems, checkSimEnv } from '../src/core/simenv';

const files = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? files(p) : /\.(ts|mjs|js|sh)$/.test(f) ? [p] : []; });

describe('rc12c sim env names', () => {
  it('every SIM_* name in src/ and scripts/ is registered (no silently ignored names)', () => {
    const used = new Set<string>();
    for (const f of [...files('src'), ...files('scripts')]) if (!f.endsWith('simenv.ts')) for (const m of readFileSync(f, 'utf8').matchAll(/SIM_[A-Z0-9_]*[A-Z0-9]/g)) used.add(m[0]);
    for (const x of ['SIM_DIAG', 'SIM_ARC']) used.delete(x); // code identifier / comment fragment
    expect([...used].filter((n) => !SIM_ENV_KNOWN.has(n))).toEqual([]);
  });
  it('POTPOLICY=ui (the rc12b mistake) is rejected and points to SIM_POTPOLICY', () => {
    const p = simEnvProblems({ POTPOLICY: 'ui' });
    expect(p.length).toBe(1); expect(p[0]).toContain('SIM_POTPOLICY');
    expect(() => checkSimEnv({ POTPOLICY: 'ui' })).toThrow(/SIM_POTPOLICY/);
  });
  it('a typo SIM_ name is rejected with a suggestion; known names and system vars pass', () => {
    expect(simEnvProblems({ SIM_POTPOLCY: 'ui' })[0]).toMatch(/SIM_POTPOLICY/);
    expect(simEnvProblems({ SIM_POTPOLICY: 'ui', SIM_POLICY: 'primary', SIM_AI: 'naive', PATH: '/bin', HOME: '/x' })).toEqual([]);
    expect(() => checkSimEnv({ SIM_NOPE: '1', SIM_ENV_LAX: '1' })).not.toThrow();
  });
  it('the current process env passes (auto.ts checks it at import)', () => {
    expect(simEnvProblems(process.env)).toEqual([]);
  });
});

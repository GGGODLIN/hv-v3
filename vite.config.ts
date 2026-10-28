import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';

const sh = (c: string) => { try { return execSync(c, { encoding: 'utf8' }).trim(); } catch { return ''; } };
const hash = sh('git rev-parse --short HEAD') || 'unknown';
const dirty = sh('git status --porcelain --untracked-files=no') ? '+dirty' : '';

export default defineConfig({
  define: { __BUILD__: JSON.stringify(hash + dirty) },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup-env.ts'], // rc10（自訂）: strip sim env switches so tests always see game defaults
  },
});

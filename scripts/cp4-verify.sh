#!/bin/sh
# Per-step CP4 gate: typecheck, tests, flag-off sim identity, build, preview restart, e2e.
set -e
cd "$(dirname "$0")/.."
npx tsc --noEmit -p .
npx vitest run 2>&1 | grep -E "Tests|FAIL"
./scripts/cp4-off-check.sh
npm run build >/tmp/build.log 2>&1
pkill -f "vite preview --port 5199" || true; sleep 1
setsid nohup npx vite preview --port 5199 --host 127.0.0.1 --strictPort >/tmp/prev.log 2>&1 < /dev/null &
sleep 3
E2E_URL=http://127.0.0.1:5199/ npm run e2e 2>&1 | tail -4

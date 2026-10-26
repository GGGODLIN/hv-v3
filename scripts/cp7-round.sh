#!/bin/bash
# CP7 round: $1 name; env CP7 PITY WINHEAL passed through. 4 schools × sets A (1..N) / B (SEED0=N) in parallel → /tmp/cp7/$1.jsonl, then the report.
cd /workspace/hv-v3; mkdir -p /tmp/cp7; N=${N:-256}; : > /tmp/cp7/$1.jsonl
for sc in blade oc arcane bulwark; do for s0 in 0 $N; do SC=$sc SEED0=$s0 npx tsx scripts/cp7-sim.ts $N 4 >> /tmp/cp7/$1.jsonl 2>/dev/null & done; done; wait
npx tsx scripts/cp7-report.ts /tmp/cp7/$1.jsonl | tee /tmp/cp7/$1.txt

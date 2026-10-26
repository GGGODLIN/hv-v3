#!/bin/bash
# rc9 round: $1 name, then env LPD HS DS DPD TR. Runs 4 schools × sets A (1..N) / B (SEED0=N) in parallel → /tmp/rc9/$1.jsonl
cd /workspace/hv-v3; mkdir -p /tmp/rc9; N=${N:-256}; : > /tmp/rc9/$1.jsonl
for sc in blade oc arcane bulwark; do for s0 in 0 $N; do SC=$sc SEED0=$s0 npx tsx scripts/rc9-tune.ts $N 4 >> /tmp/rc9/$1.jsonl 2>/dev/null & done; done; wait

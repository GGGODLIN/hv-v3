#!/bin/bash
# CP8 round: $1 name. rc2: P4FILE=<current-AI jsonl> is passed to the report for P4 (SIM_AI= runs the current AI). Runs cp7-sim with CP8=1 SIM_AI=naive (4 schools × A 1..N / B SEED0=256), then cp8-report. Extra env (K_*, CP8 knobs) passes through.
cd /workspace/hv-v3; mkdir -p /tmp/cp8; N=${N:-128}; : > /tmp/cp8/$1.jsonl
for sc in blade oc arcane bulwark; do for s0 in 0 256; do SC=$sc SEED0=$s0 CP8=1 SIM_AI=${SIM_AI-naive} npx tsx scripts/cp7-sim.ts $N ${F:-4} >> /tmp/cp8/$1.jsonl 2>/dev/null & done; done; wait
npx tsx scripts/cp8-report.ts /tmp/cp8/$1.jsonl ${P4FILE:-} | tee /tmp/cp8/$1.txt

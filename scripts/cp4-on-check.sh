#!/bin/sh
# Baseline since cp5-pass: defaults (cp4RunBuffs on, cp5Bosses on, cp6Abyss off) must match main byte for byte.
# Baseline = difficulty.ts 16 8 + cp4-balance.ts 16 8, generated on the cp5-pass default-on commit (docs/cp5-on-baseline-sim.txt).
# (The CP4-on/CP5-off baseline docs/cp4-on-baseline-sim.txt is kept for history.)
cd "$(dirname "$0")/.." && { npx tsx scripts/difficulty.ts 16 8 2>&1; npx tsx scripts/cp4-balance.ts 16 8 2>&1; } > /tmp/cp4-on.txt && cmp /tmp/cp4-on.txt docs/cp5-on-baseline-sim.txt && echo "CP4+CP5-ON/CP6-OFF SIM == main"

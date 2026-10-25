#!/bin/sh
# New baseline since cp4-pass: defaults (cp4RunBuffs on, cp5Bosses off) must match main (aa66304) byte for byte.
# Baseline = difficulty.ts 16 8 + cp4-balance.ts 16 8, generated on main aa66304 (docs/cp4-on-baseline-sim.txt).
cd "$(dirname "$0")/.." && { npx tsx scripts/difficulty.ts 16 8 2>&1; npx tsx scripts/cp4-balance.ts 16 8 2>&1; } > /tmp/cp4-on.txt && cmp /tmp/cp4-on.txt docs/cp4-on-baseline-sim.txt && echo "CP4-ON/CP5-OFF SIM == main"

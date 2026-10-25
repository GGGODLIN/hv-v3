#!/bin/sh
# Retired at cp4-pass: compared defaults with the cp3-pass3 baseline while the CP4 flag was off. Live gate: cp4-on-check.sh.
cd "$(dirname "$0")/.." && npx tsx scripts/difficulty.ts 16 8 > /tmp/cp4-off.txt 2>&1 && cmp /tmp/cp4-off.txt docs/cp4-baseline-sim.txt && echo "CP4-OFF SIM IDENTICAL"

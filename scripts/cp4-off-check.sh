#!/bin/sh
# CP4 isolation: with RULES.cp4RunBuffs off, the default sim must match the cp3-pass (771f9b3) output byte for byte.
cd "$(dirname "$0")/.." && npx tsx scripts/difficulty.ts 16 8 > /tmp/cp4-off.txt 2>&1 && cmp /tmp/cp4-off.txt docs/cp4-baseline-sim.txt && echo "CP4-OFF SIM IDENTICAL"

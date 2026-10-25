#!/bin/sh
# Baseline since rc4 (producer decision 2026-10-26): defaults (cp4RunBuffs on, cp5Bosses on, cp6Abyss off) with the
# sim weapon fix (c7f60ec) must match docs/cp5-on-baseline-sim-rc4-weaponfix.txt byte for byte.
# Baseline = difficulty.ts 16 8 + cp4-balance.ts 16 8.
# Retired (unarmed-sim era, kept for history only): docs/cp5-on-baseline-sim.txt, docs/cp4-on-baseline-sim.txt.
cd "$(dirname "$0")/.." && { npx tsx scripts/difficulty.ts 16 8 2>&1; npx tsx scripts/cp4-balance.ts 16 8 2>&1; } > /tmp/cp4-on.txt && cmp /tmp/cp4-on.txt docs/cp5-on-baseline-sim-rc4-weaponfix.txt && echo "CP4+CP5-ON/CP6-OFF SIM == rc4 weaponfix baseline"

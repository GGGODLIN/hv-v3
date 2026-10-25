#!/bin/sh
# Baseline since rc4 (producer decision 2026-10-26): defaults (cp4RunBuffs on, cp5Bosses on, cp6Abyss off) with the
# sim weapon fix (c7f60ec) must match docs/cp5-on-baseline-sim-rc7.txt byte for byte (rc7: style passives + monster adb level term removed; rc6 file kept for history; rc6: UI-only AI + school weapon rules; rc4 file kept for history).
# Baseline = difficulty.ts 16 8 + cp4-balance.ts 16 8.
# Retired (unarmed-sim era, kept for history only): docs/cp5-on-baseline-sim.txt, docs/cp4-on-baseline-sim.txt.
cd "$(dirname "$0")/.." && { npx tsx scripts/difficulty.ts 16 8 2>&1; npx tsx scripts/cp4-balance.ts 16 8 2>&1; } > /tmp/cp4-on.txt && cmp /tmp/cp4-on.txt docs/cp5-on-baseline-sim-rc7.txt && echo "CP4+CP5-ON/CP6-OFF SIM == rc7 baseline"

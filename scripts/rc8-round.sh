#!/bin/bash
# $1 name, $2 LPD $3 HS $4 DS $5 DPD $6 TR
cd /workspace/hv-v3
LPD=$2 HS=$3 DS=$4 DPD=$5 TR=$6 npx tsx scripts/rc7-targets.ts 16 4 > /tmp/rc8/$1-T.txt 2>&1 &
npx tsx scripts/cp6-abyss-sim.ts 32 4 auto,buff:blade,buff:oc,buff:arcane,buff:bulwark playerLevelPerDepth=$2 hpScale=$3 dmgScale=$4 dmgPerDepth=$5 tierRamp=$6 > /tmp/rc8/$1-A.txt 2>&1 &
wait; echo END >> /tmp/rc8/$1-A.txt

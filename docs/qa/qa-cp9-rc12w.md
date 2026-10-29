DONE rc12w
Build rc12w, badge fbe6a04 verified on page. Bulwark runs 1-3, preset=postF20-bulwark&fresh, 13 potions, 4x + 跳過動畫, ★ only, no manual retreats (none was ★-recommended). Driver drvRC12w.js (= drvRC12v.js elite-flag patch + per-floor stop/time budget), events rc12w-evflush.jsonl, per-run data qa-cp9-rc12w-data.jsonl.

| run | end | fight | pots F10/20/30/40/50/60/70/80/90 | boss turns F30..F90 (F95) | max hit % | max turn % | feel (推測) |
|---|---|---|---|---|---|---|---|
| bw1 | F95 death | BOSS (守門者 雷鐮雙頭龍, last hit 107, ★ recommended Z/D, 0 pots) | 12/9/10/11/10/8/9/8/4 | 3,5,11,10,13,7,5,5,19,3,24,24,26 (F95:16) | 40.0 (39.4 F95) | <50 | 3/5 |
| bw2 | F90 death | BOSS (霜羽自走甲, last hit 140; 287 charge = 26% a turn earlier) | 13/10/8/9/9/8/8/7/1 | F30..F90: 7,5,2,13,17,6,6,6,3,14,23,31,12 | 40.0 | <50 | 3/5 |
| bw3 | F50 death | BOSS (風鋼魔像, 30 turns, 0 pots) | 12/9/7/7/3 | F30..F50: 6,15,12,18,30 | 39.9 | <50 | 2/5 |
Boss turns above come from fightEnd (F30+) or the highest turn seen per boss floor (F5-25, bw1 F10-15 partly lost, see gaps). Median end floor 90 (95/90/50).

Flags: no hit >40% (max 40.0%, 39.9% F28/F36/F40/F50 normal+boss); no turn >50% (0 dmg50 events). 排隊指令已取消 never seen.
Potion sources: boss reward +1 every boss from F25 up (bw1 F25-F90 = 14, bw2 F25-F85 = 13, bw3 F25-F45 = 5); merchants (sell 1 each, driver buys when below threshold): bw1 9 bought/18 visits, bw2 11/21, bw3 4/7. Non-boss victory screens also gave 生命藥水 ×1: bw1 F18,21,26,43,48,68; bw2 F18,33,36,43,48; bw3 F18. The victory text did NOT contain 精英 so my driver's elite flag was false for all; I did not log which map node type (戰鬥/精英) was clicked, so these are 'non-boss potion drops, elite not confirmed' (推測 elite drops). Elite drops with floor are therefore NOT verified. Earlier floors F1-F9 of bw1 are not in the log (see gaps).
Normal-fight win heal (HP at last decision -> next map): +10% typical, +20% after two wins before the map screen, 0 at full HP; small values 3-7% when near full; bw2 had two -10% rows (map shows a lower HP than the last decision, likely next fight chip, not a heal). bw1 hist {20:14,10:12,7:3,0:2,...}; bw2 {20:13,10:7,0:10}; bw3 {20:12,10:3,0:3}.
★ estimate vs next resolved turn (aligned [第 N 回合] tag): aligned samples bw1 60, bw2 64, bw3 18 (est>=50). Under-estimates (>1.2x) 0 in all three. Over-estimates >20% (actual lower): 38/36/11, expected as ★ picks D/Z and the estimate is a crit worst case. Hits already in the log before the decision were not counted. estSpecial stops (charge turns, est 350-541 vs actual 48-378) are all over-estimates.
Death details: bw1 F95 boss HP low, 0 pots, last turns -66/-347/-107; bw2 F90 boss, potions 13->1 over F80-F90 (boss F80 23 turns, F85 31, F90 12+), last -44/-287/-140; bw3 F50 boss turn 31, last -0/-101/-91, pots 7 at F40 -> 3 at F50 -> 0 (F45 boss 18 turns, F50 30 turns).
Screenshots (files): qa-cp9-rc12w-shots/bw1-death.png, bw2-death.png, bw3-death.png. Saves (下載 QA 紀錄 JSON from death screen): qa-saves/rc12w-bulwark-{1,2,3}-end.json.
Gaps/deviations (honest): (1) first driver call ran against a stale helper state (#s of an old rc12 run) and its event flush timed out, so bw1 events for F1-F9 and a few turns of the F10 boss were lost; bw1 F10 potions 12 is from the partial log. (2) Helper page fill only works when the tab is in front; I switched tabs per flush. (3) I used drvRC12v.js as base (adds elite flag) with per-floor flush + time budget patches. (4) 出發前整備 dialog: chose 忽略並出發 each run (28 unspent stat points / EXP left unallocated, same all runs). (5) Merchant buy rule is the driver threshold, not forced to 13. (6) Turn counts for F5-F25 bosses come from the turnsync max and can be 1-2 off.
Feel: bulwark F90+ ends are boss deaths after potion drain; bw3 weaker. 推測 3/5, 2/5.

## Dispatch 2: blade runs 1-3 (preset=postF20-blade&fresh, same method; badge fbe6a04)
Fixes applied: helper page reloaded and #s/#f cleared before the first call (no events lost this time, flushed every floor); driver now logs a `node` event with the ★ node kind per floor (elite/battle/chest/rest/merchant). 出發前整備 choice: 忽略並出發 every run (2,826 EXP / ~38 stat points left unallocated), same as bulwark.
| run | end | fight | pots F10/20/30/40/50/60 | boss turns F30..F60 | max hit % | max turn % | feel (推測) |
|---|---|---|---|---|---|---|---|
| bl1 | F60 death | BOSS (守護狂戰 災厄 風毒蠍, last hit 180 = 21%), 0 pots, HP 1 before | 13/13/14/7/8/1 | 3,8,2,6,8,27,17(F60) | 32.7 | <50 | 2/5 |
| bl2 | F48 death | NORMAL fight turn 52 (霜毒亡魂 charge 247 = 30%), 0 pots, HP<=1 (nb event T50/T51) | 13/13/14/16 (F40) | F30..F45: 7,1,3,25 | 40.0 (F33) | <50 | 2/5 |
| bl3 | F51 death | NORMAL fight turn 34 (霜影巨人 charge 265 = 30%), 0 pots, HP<=1 (nb T32/T33) | 13/13/13/13/5 | F30..F50: 1,3,4,11,14 | 40.0 (F43, F48 x5) | <50 | 2/5 |
Median end floor blade: 51 (60/48/51). Overall rc12w: bulwark 90 (95/90/50), blade 51.
Flags: no hit >40% (40.0 max); no turn >50% (0 dmg50 events); 排隊指令已取消 not seen.
Potion sources (with node type now logged): boss reward +1 each boss from F25 (bl1 F25-F55 = 7, bl2 F25-F45 = 5, bl3 F25-F50 = 6). Non-boss potion drops: bl1 F18 (elite), F21 (elite); bl2 F38 (elite); bl3 none. So elite drops CONFIRMED by node log: 3 potion drops over 33 elite nodes (bl1 10, bl2 13, bl3 10) = ~9%, floors F18, F21, F38. No potion from chest (27 chest nodes), battle, rest or merchant node (merchant sells 1: bl1 2 bought/5 visits, bl2 1/6, bl3 2/9).
Node mix ★ picked: bl1 elite 10/chest 10/battle 14/rest 9/merchant 5; bl2 elite 13/chest 10/battle 7/rest 3/merchant 6; bl3 elite 10/chest 7/battle 11/rest 4/merchant 9.
Normal-fight win heal: +10% typical, +20% after two wins, 0 at full HP, small values when near full (hist bl1 {20:14,10:5,6:1,3:2,0:2}, bl2 {10:7,20:6,0:3,..}, bl3 {10:5,20:8,0:3,..}).
★ estimate vs next resolved turn (aligned [第 N 回合]): aligned samples bl1 46, bl2 54, bl3 44; under-estimates (>1.2x) 0; over-estimates >20% 36/50/39 (D/Z picks and worst-case crit). Hits already in log before the decision not counted.
Observations: (1) Potion drain is much faster for blade than bulwark at F40-F50: bl2 had 16 potions at F40 and bl3 13 at F40 yet both died in a normal fight at F48-F51 with 0 potions; bl2's F46 normal fight lasted 56+ turns and the F48 one 52 turns (★ looped D/A on repeated 蓄力 telegraphs from 雷鐵飛龍/風晶自走甲, damage 0 on D turns but each charge 247-265). (2) bl2 F45 boss 25 turns, bl1 F55 boss 27 turns. (3) Normal-fight deaths at 0 potions before F55 in 2 of 3 blade runs (F48, F51).
Screenshots (files): qa-cp9-rc12w-shots/bl1-death.png, bl2-death.png, bl3-death.png. Saves: qa-saves/rc12w-blade-{1,2,3}-end.json. Data lines appended to qa-cp9-rc12w-data.jsonl (bl1-bl3).
Note: bl2 F46 stalemate-like normal fight is a candidate bug/balance issue (turn 56 at 4x, HP kept near 450-540 while potions drained); not investigated further. drvsrv.py stopped (port 8765 closed). Feel scores 推測.

## rc12w OC runs (preset=postF20-oc, fresh) — oc1..oc3
Build badge fbe6a04. 出發前整備: 忽略並出發 every run (2,106 EXP unallocated; dialog also offered 買藥 for mana/spirit, ignored). Node type logged per floor. Added a driver stop that screenshots any NORMAL fight >40 turns: it NEVER triggered (0 normal fights >40 turns in oc1-3; longest normal fight by turnsync: 6 turns (F48) / 4 (F21) / 9 (F68)).
| run | end | fight | pots F10/20/30/40/50/60/70 | boss turns (selected) | max hit % | max turn % | feel (推測) |
|---|---|---|---|---|---|---|---|
| oc1 | F50 death | BOSS 堅硬鐵壁・深淵之王・炎血遊俠, turn 20, last hit 66 (8%), 0 pots, HP low | 12/12/12/14/3 | F40 21, F45 38, F50 20 | 40.0 (F45 boss, F50 boss) | <50 | 2/5 |
| oc2 | F45 death | BOSS 迅捷堅硬・塔主・霜鱗蛇龍, turn 40, last hit 160 (20%), 0 pots | 13/11/11/13 | F40 25, F45 40 | 40.0 (F45 boss) | <50 | 2/5 |
| oc3 | F70 death | BOSS 鐵壁嗜血・深淵之王・炎眼蜥蜴, turn 29, last hit 97 (9%), 0 pots | 13/13/11/9/12/8/2 | F25 17, F35 19, F50 39, F65 43, F70 29 | 40.0 (F35 boss) | <50 | 3/5 |
Median end floor oc: 50 (50/45/70). 
Flags: max single hit hits exactly 40.0 / 39.9% on bosses (F35-F70), none >40; no turn >50% (0 dmg50 events); 排隊指令已取消 not seen.
Potion sources (node log): boss reward +1 each boss from F25 (oc1 F25-45 = 5, oc2 F25-40 = 4, oc3 F25-65 = 9). Non-boss potion drops: oc1 F23 (elite), oc2 F33 (elite), oc3 F48 (elite) = 3 drops over 30 elite nodes (oc1 9, oc2 9, oc3 12) = ~10%. Merchant sells 1/visit: oc1 2 bought/6 visits, oc2 1/5, oc3 4/9. Nodes ★ picked: oc1 elite 9/chest 10/battle 11/rest 4/merchant 6; oc2 elite 9/chest 10/battle 9/rest 3/merchant 5; oc3 elite 12/chest 15/battle 16/rest 4/merchant 9.
Normal-fight win heal: +10%/+20% typical, 0 at full HP (hist oc1 {20:9,10:3,..}, oc2 {20:8,10:3,0:4}, oc3 {20:14,10:4,0:6}).
★ estimate vs next resolved turn: aligned samples oc1 19, oc2 18, oc3 35; under-estimates (>1.2x) 0; over-estimates >20%: 12/12/22.
Observations: (1) Unlike blade, all three oc deaths were BOSS fights (F45-F70), none in normal fights; boss fights are long late (F45 38-40 turns twice, F50 39, F65 43 turns) and drain potions fast: oc1 14 pots at F40 -> 3 at F50; oc3 12 -> 8 over F50-F60, 2 at F70. (2) Boss-fight turn counts of 38-43 at F45-F65 are close to the length that made blade normal fights stall; consider if 40+ turn bosses feel OK. (3) oc3 reached F70 (best of the three schools' non-bulwark runs).
Screenshots (files): qa-cp9-rc12w-shots/oc1-death.png, oc2-death.png, oc3-death.png. Saves: qa-saves/rc12w-oc-{1,2,3}-end.json. Data lines appended (oc1-oc3). drvsrv.py stopped (port 8765 closed). Feel scores 推測.

## rc12w ARCANE runs (preset=postF20-arcane, fresh) — ar1..ar3
Build badge fbe6a04. 出發前整備 = 忽略並出發 every run (~2,031 EXP unallocated; dialog also offered 買藥 for mana/spirit, ignored). Node type logged per floor. Normal fights >40 turns get a screenshot (driver stop `long`).
| run | end | fight | pots F10/20/30/40/50 | F30+ boss turns | max hit | feel (推測) |
|---|---|---|---|---|---|---|
| ar1 | F58 DEATH | NORMAL fight, turn 23, 霜尾遊俠 charge 292 (30%) x3 in a row, 0 pots (★ text 沒有可用藥水) | 13/11/11/9/8 | F30 7, 35 11, 40 14, 45 10, 50 9, 55 17 | 40.0 | 2/5 |
| ar2 | F47 RETREAT (★ 撤退回城, after F46 win) | after a NORMAL fight at F46 that lasted 43 turns with 0 pots (screenshot qa-cp9-rc12w-shots/ar2-long-F46-t41.png at turn 41) | 13/10/12/15 | 3,4,8,18 | 40.0 | 3/5 |
| ar3 | F59 RETREAT (★ 撤退回城, F58 cleared) | no fight at retreat | 13/12/11/12/12 | 7,5,11,9,10,16 | 40.0 | 3/5 |
Elite potion drops (node log): ar1 1/10 elites (F16), ar2 6/12 (F16,21,23,28,38,41), ar3 6/18 (F16,26,33,41,51,53). Boss reward +1 each boss F25+. Merchant bought: ar1 5/10 visits, ar2 0/6, ar3 0/3. Est vs next resolved turn: 0 under-estimates >1.2x; over-estimates >20% 38/48/44 of 39/50/49 aligned samples. No turn >50% (0 dmg50). Both retreats were ★-recommended only.

# FINAL — rc12w, 12 runs (bulwark x3, blade x3, oc x3, arcane x3)
Build fbe6a04 / rc12w, localhost:5381, 4x speed + 跳過動畫, press-only-★, 13 potions bought before each run, 出發前整備 = 忽略並出發 in all 12 runs (never allocated the 2-3k unspent EXP / ~30-38 stat points, never used the 買藥 shortcut). Data: qa-cp9-rc12w-data.jsonl (12 lines), shots qa-cp9-rc12w-shots/, saves qa-saves/rc12w-{bulwark,blade,oc,arcane}-N-end.json.

## 12-run table
| run | end floor | death/retreat | boss/normal fight | F30+ boss-turn median | feel (推測) |
|---|---|---|---|---|---|
| bw1 | 95 | death | boss | 10.5 | 3/5 |
| bw2 | 90 | death | boss | 7 | 3/5 |
| bw3 | 50 | death | boss | 15 | 2/5 |
| bl1 | 60 | death | boss | 8 | 2/5 |
| bl2 | 48 | death | normal (turn 52, 0 pots) | 5 | 2/5 |
| bl3 | 51 | death | normal (turn 34, 0 pots) | 4 | 2/5 |
| oc1 | 50 | death | boss (turn 20) | 19 | 2/5 |
| oc2 | 45 | death | boss (turn 40) | 15.5 | 2/5 |
| oc3 | 70 | death | boss (turn 29) | 7 | 3/5 |
| ar1 | 58 | death | normal (turn 23, 0 pots) | 10.5 | 2/5 |
| ar2 | 47 | retreat (★) | after normal win (F46, 43 turns) | 6 | 3/5 |
| ar3 | 59 | retreat (★) | none (F58 cleared) | 9.5 | 3/5 |
(bw feel scores carried from the earlier bulwark section; per-run boss-turn medians use all F30+ boss floors seen, n=4..14 per run.)

## Median end floor per school
bulwark 90 (95/90/50) · blade 51 (60/48/51) · oc 50 (50/45/70) · arcane 58 (58/47/59).
Gap highest vs lowest median: 90 (bulwark) − 50 (oc) = 40 floors (bulwark vs blade 39). Without bulwark the other three are within 8 floors (50-58).

## Potion curve (median held at each checkpoint; n = runs that reached it)
| floor | bulwark | blade | oc | arcane |
|---|---|---|---|---|
| F10 | 12 (3) | 13 (3) | 13 (3) | 13 (3) |
| F20 | 9 (3) | 13 (3) | 12 (3) | 11 (3) |
| F30 | 8 (3) | 14 (3) | 11 (3) | 11 (3) |
| F40 | 9 (3) | 13 (3) | 13 (3) | 12 (3) |
| F50 | 9 (3) | 6.5 (2) | 7.5 (2) | 10 (2) |
| F60 | 8 (2) | 1 (1) | 8 (1) | – |
| F70 | 8.5 (2) | – | 2 (1) | – |
| F80 | 7.5 (2) | – | – | – |
| F90 | 2.5 (2) | – | – | – |
Small n beyond F50 (at most 2 runs); read F60+ as anecdotal.

## Elite potion drops vs elite nodes (expected 35%)
Node type was only logged from blade onward (9 runs): 19 non-boss potion drops, all on elite nodes, from 103 elite nodes ★-picked = 18.4% observed vs 35% expected (blade 3/33, oc 3/30, arcane 13/40 = 32.5%; arcane alone is close to 35%, blade/oc are ~9-10%). No non-boss drop ever came from chest, battle, rest or merchant nodes. Bulwark (no node log): 12 non-boss drops (bw1 6, bw2 5, bw3 1) cannot be attributed to a node type, excluded from the rate. Verified: the rate is below 35% overall (95% CI roughly 11-27%); 推測: elite drop rate varies by school or by floor/elite type rather than being a flat 35%, since arcane runs were near 35% but blade/oc were ~10%.

## 0-potion normal-fight deaths
3 of 12 runs: bl2 (F48, turn 52), bl3 (F51, turn 34), ar1 (F58, turn 23). 0 in bulwark and oc. All other deaths (6) were boss fights, and arcane also had 2 retreats. The one other 0-pot normal fight stall: ar2 F46 won at turn 43 with 0 potions (>40 turns, screenshotted); bl2 F46 and F48 normal fights ran 56 and 52 turns before the >40-turn screenshot rule existed.

## Data gaps and choices
- bw1 F1–F9 events were lost (first driver call ran against stale helper state and its flush timed out), so bw1 per-floor data for F1-F9 (potion/node/heal/boss turns of F5) is missing; the run still ended F95 and F10+ checkpoints are intact. Fixed (helper state cleared) for all later runs.
- 出發前整備: always 忽略並出發.
- Max single hit: exactly 40.0 / 39.9% many times, never above 40; no turn >50% (0 dmg50 events); 排隊指令已取消 never seen; ★ estimate: no under-estimate >1.2x in any run; over-estimate by >20% in ~75-95% of aligned samples (D/Z and worst-case crit).

## Verified (measured from event logs / screenshots)
End floors, death/retreat, fight type, turn counts, potion counts at checkpoints, elite/node counts and drops, 0-potion deaths, hit% flags, estimate samples, files above. Both arcane retreats were ★ recommendations.
## 推測 (my judgement, not measured)
Feel scores; blade/oc/arcane clustering at 50-58 and bulwark outlier (bw3 died at F50 though); elite drop rate varying by school; potion drain being the cause of deaths past F50; bw feel scores.
drvsrv.py stopped (port 8765 closed).

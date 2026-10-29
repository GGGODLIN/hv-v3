# cp9-rc6 QA log
Badge verified: build 5883195, CP4-CP9 listed, no preset-ignored warning (shots/badge.png).

## blade 1
- floor reached: 35 (passed 34). Death: F35 boss, 守門者・霜血戰士 charged strike 246 (30% maxHP) after T25 hit 414 (50%); potions ran out (all 13+10 used, 0 left).
- in-fight drinks: ~28 total (driver counter; drinksHi=0 by its heuristic - hi-HP-no-lethal drinks not detected, not manually audited); map drinks 1
- normal fights A vs non-A: 72 / 12 (driver count, approximate)
- boss turns: f5 12, f10 10, f15 12, f20 12, f25 13, f30 57, f35 41 (driver counts, inflated by repeat polls on same turn; F30 ~36 real turns)
- >=20% turns: warned 7, unwarned 0; max single-turn 50%
- 「防禦也擋不住」: 4 (driver) 
- (a) Z hinted while on cooldown: 0 detected (check added only from F31 on; F5-F30 not checked)
- (b) lethal-forecast: not rigorously audited; at F35 T25 hint was D (potions gone), no interrupt skill/S used
- (c) boss revive charge clear: not observed/not logged
- (d) Q multi-click repeats: not observed
- (e) F30 boss: survived (not a death)
- death screen 共受 246
- Deviations: driver rest logic ran; potion count at start 13 (3+10).


## blade 2
- floor reached: 45 (passed 44). Death: F45 boss 守護尖刺・塔主・雷冠地龍 charged heavy hit 552 (49% maxHP) on T30; potions all used (13 start incl. 10 bought + merchant buys; "生命藥水已用完" from F45 T27); T28 -163, T29 0, T30 -552 at HP 198, D hinted (block can't save).
- Driver: /workspace/drv4.js (drv3 + hint-option parsing, (a)(b)(c)(d) logging, rest/buff handling). One call hit the 30s limit, so counters for F31-F40 segment (incl. F35 boss) were lost; totals below are PARTIAL (F1-F30 and F40-F45 counted; F31-F39 not).
- in-fight drinks counted: ~27 (14 by F30 + 4 F31-40 seg + 5 F45 + ...) approx; drinksHi (>=40% HP without lethal forecast): 0 by heuristic
- normal fights A vs non-A: ~170 / ~12 (approx, partial)
- boss turns (distinct in-game turn counter): f5 7, f10 7, f15 7, f20 9, f25 11, f30 ~50, f35 not captured, f40 ~42, f45 30
- >=20% turns: warned ~26, unwarned 0 (partial); max single-turn 50%
- 「防禦也擋不住」: 3 on F45 (partial) + earlier F30 T3
- (a) Z hinted while potion on cooldown: 0 (hint with cooldown correctly switched to D: F45 T8 "生命藥水冷卻 1 回合" -> D first)
- (b) lethal-forecast turns logged: F20 T6 Z>D, F25 T4 Z>D, F30 T3 Z only, F30 T22 Z>D, F40 T17 Z>D, F40 T29 Z, F45 T5 Z, T7 Z, T8 D (cooldown), T10 Z, T27/28/29 D (no potions). Z first except where hint said "HP N 撐得住，不必喝藥" D only (F30 T17, F40 T41, F45 T25: forecast >= HP yet D first - hint judged HP can survive after D; possible inconsistency with banner "HP 危險 ... ≥ HP", not a violation of Z-first strictly since Z not offered). No interrupt skill / S ever hinted in lethal turns; no violation of the order seen.
- (c) boss revive charge clear: revives seen F5,F10,F15,F20,F25,F40. After revive F15 (T6-T8), F20 (T6-T8), F40 (T20-21) the boss was shown "蓄力中" again within 1-2 turns ("蓄力變快") - cannot distinguish residual vs fresh charge from the UI; F40 T19 text showed charge warning on the same turn as revive message. Count: charge cleared "no/uncertain" 3, F5/F10/F25 not conclusive.
- (d) Q needing several clicks: driver count of same-key repeats without turn counter advance: 10 (up to F30; probably turn-counter artifacts, not confirmed clicks failing)
- (e) F30 boss survived (no death). Analog F45 death from 49% charge: potions 0, D only option, HP 198/1123 -> no surviving action.
- death screen 共受 552 (第30回合, 49%)
- shot: qa-cp9-rc6-shots/death-blade-2.png

## blade 3
- floor reached: 35 (passed 34). Death: F35 boss 嗜血・守門者・霜鬃遊俠 charged heavy hit 233 (28% maxHP) at T60 (T58 -265, T59 -0); 生命藥水已用完, T59 hint D only (forecast 410 ≥ HP 149, block can't save). Potions left 0.
- Driver /workspace/drv4.js (time budget cut to 15s/call, state carried by hand between calls; one run in 11 calls). Start: 13 potions (3+10 bought).
- in-fight drinks: 31 (driver); drinksHi (>=40% HP, no lethal forecast): 0 by heuristic; map drinks 3
- normal fights A vs non-A: 66 / 10 (driver, approx)
- boss turns (distinct in-game turn counter): f5 10, f10 10, f15 7, f20 6, f25 6, f30 46, f35 60
- >=20% turns: warned 21, unwarned 1; max single-turn 50%
- 「防禦也擋不住」: 3 (driver, per-poll count)
- (a) Z hinted while on cooldown: 0 (driver check on every fight read; none triggered)
- (b) lethal/danger hint orders logged (f,turn,order): 8/5 Z>D, 10/4 Z, 10/7 Z>D, 16/1 Z>D, 21/1 Z>D, 23/2 Z>D, 26/2 Z>D, 28/1 Z, 28/3 Z, 30/5 Z, 30/7 D, 30/17 D, 30/19 Z, 30/34 D, 30/35 Z>D, 30/38 Z>D, 30/45 Z, 31/2 Z, 33/2 Z>D, 35: T3 Z, T4 D, T5 Z, T7 Z, T9 Z, T11 D, T13 D, T15 Z, T19 Z, T21 Z, T23 D, T25 D, T26 Z>D, T31 D, T33 Z, T35 D, T36 Z, T40 Z, T45 D, T46 Z, T53 Z, T58 D, T59 D(no potions). D-first cases were "HP N 撐得住，不必喝藥" or potion on cooldown/none; no interrupt skill / S ever hinted; no violation observed.
- (c) boss revives at F5,F10,F15,F20,F25,F30. Charge cleared after revive: F30 yes (not charging for next reads); F5/F10/F15/F20/F25 charge shown again within same/next turn (revive text says 蓄力變快) -> not cleared / inconclusive: 5 no-or-uncertain, 1 yes.
- (d) Q repeated-key count: 10 (driver artifact-prone, same as blade 2)
- (e) F30 boss survived (not a death). F35 death at 28% charge: no potions, D only; HP 149 vs forecast 410 -> no surviving action.
- death screen 共受 233 (第60回合, 28%)
- shot: qa-cp9-rc6-shots/death-blade-3.webp

## blade 4
- floor reached: 30 (passed 29). Death: F30 boss 冰霜・深淵之王・霜眼巨人 charged heavy hit 337 (41% maxHP) on T69 (T67 -165, T68 -0); 生命藥水已用完. Potions left 0 (13 start, 3 map-level/merchant buys not tracked).
- Driver /workspace/drv4.js, 15s/call, state carried by hand (8 calls). 4x speed + skip-animation on.
- in-fight drinks: 26 (driver); drinksHi (>=40% HP, no lethal forecast): 0 by heuristic; map drinks 2
- normal fights A vs non-A: 58 / 7 (driver, approx)
- boss turns (distinct in-game turn counter): f5 ~7, f10 ~11, f15 ~18, f20 ~7, f25 ~7, f30 69
- >=20% turns: warned 16, unwarned 0; max single-turn 50%
- 「防禦也擋不住」: 2 (driver polls) + death-screen T68 hint
- (a) Z hinted while on cooldown: 0 (driver checks Z-button disabled on every fight read)
- (b) lethal-forecast hint orders (f/turn/order): 10/4 Z, 15/17 Z, 23/2 Z, 30/3 Z, 30/4 D, 30/5 Z, 30/7 D, 30/27 Z, 30/32 Z>D, 30/34 Z, 30/39 D, 30/49 Z>D, 30/63 Z, 30/68 D(no potions). D-first only when potion on cooldown/none or "撐得住". No interrupt skill / S ever hinted; no violation.
- (c) boss revives: F5 T5, F10 T9, F15 T12, F20 T5, F25 T5, F30 T39. After each, charge text 蓄力 shown again within 1 turn (revive text says 蓄力變快) -> charge not visibly cleared / inconclusive: 6 no-or-uncertain, 0 clear yes.
- (d) Q repeated-key count: 6 (driver artifact-prone)
- (e) F30 boss death from 41% charge (not 50%): T68 hint D only, potions 0, HP 308 vs forecast 413 -> no surviving action. (Potion exhaustion was the cause.)
- death screen 共受 337 (第69回合, 41%)
- shot: qa-cp9-rc6-shots/death-blade-4.png

## blade 5
- floor reached: 30 (passed 29). Death: F30 boss 堅硬・深淵之王・雷毒蛇龍 charged heavy hit 313 (39% maxHP) on T105 (T103 -0, T104 -0, T105 -313) at HP 29; 生命藥水已用完. Potions left 0 (13 start; map drinks 2).
- Driver /workspace/drv4.js (15s/call, state carried by hand, 8 driver calls). 4x + skip-animation on. Badge verified build 5883195 w/ CP9, no preset-ignored warning.
- in-fight drinks: 28 (driver); drinksHi (>=40% HP no lethal forecast): 0 by heuristic; map drinks 2
- normal fights A vs non-A: ~53 / ~8 (driver, approx)
- boss turns (in-game counter): f5 ~7, f10 ~7, f15 ~7, f20 ~7, f25 ~21, f30 105
- >=20% turns: warned 35, unwarned 0; max single-turn 50%
- 「防禦也擋不住」: 4 (driver polls, F30 T102-104 plus death screen)
- (a) Z hinted while on cooldown: 0 (Z-button disabled check on every fight read)
- (b) lethal-forecast hint orders (f/turn/order): 18/2 Z, 25/4 D, 25/14 Z, 28/3 Z, 30/3 Z, 30/5 Z, 30/11 Z>D, 30/15 D, 30/20 Z, 30/25 Z, 30/35 D, 30/45 D, 30/65 Z>D, 30/85 Z>D, 30/91 D, 30/93 D, 30/94 Z, 30/97 D, 30/99 D, 30/101 D, 30/102-104 D (no potions). D-first only when potion on cooldown/"撐得住"/none (reason text not captured for every one). No interrupt skill / S ever hinted; no violation observed.
- (c) boss revives: F5 T5, F10 T5, F15 T5, F25 T13, F30 T99 (F20 not captured). Charge shown again right after revive F5/F10/F15 (T6) and F30 (T100-102): no x4. F25: charge shown T14, absent T15-16: cleared/uncertain x1. Revive text says 蓄力變快.
- (d) Q repeated-key count: 12 cumulative driver count (artifact-prone, same as earlier runs)
- (e) F30 boss death from 39% charge (not 50%): T104 hint D only, potions 0, HP 29 vs forecast 398 -> no surviving action; root cause potion exhaustion over a 105-turn boss fight.
- death screen 共受 313 (第105回合, 39%)
- shot: qa-cp9-rc6-shots/death-blade-5.png

## blade 6
- floor reached: 35 (passed 34). Death: F35 boss 鐵壁・守門者・炎眼光靈, T20 charged heavy hit -341 (42% maxHP) at HP 424->83 range, then T21 -162; potions all used ("生命藥水已用完" T20), D hinted (block cannot save). Potions left 0. Start 13 (3+10 bought), merchants added more (hint showed 剩 20 at F28).
- Driver /workspace/drv4.js (15s/call, state carried by hand, 9 calls). 4x + skip-animation on. Badge verified build 5883195 w/ CP9, no preset-ignored warning.
- in-fight drinks: 31 (driver); drinksHi (>=40% HP no lethal forecast): 0 by heuristic; map drinks 1
- normal fights A vs non-A: ~90 / ~34 (driver, approx; counts include F31-35 non-boss and one-line boss polls excluded)
- boss turns (in-game counter, distinct): f5 5, f10 7, f15 7, f20 7, f25 7, f30 ~31, f35 21
- >=20% turns: warned 17, unwarned 0; max single-turn 50%
- 「防禦也擋不住」: 4 (driver polls, plus death screen T20 hint)
- (a) Z hinted while on cooldown: 0 (Z-button disabled check every fight read; hint switched to D with "生命藥水冷卻 1 回合" at F30 T4, F33 T4, F35 T4)
- (b) lethal-forecast hint orders (f/turn/order): 28/3 Z, 30/3 Z, 30/4 D(cooldown), 30/5 Z, 30/7 Z, 30/9 Z, 30/11 Z, 30/28 Z, 33/3 Z, 33/4 D(cooldown), 33/6 Z, 33/15 D("撐得住"), 35/3 Z, 35/4 D(cooldown), 35/5 Z, 35/7 Z, 35/9 Z, 35/14 Z, 35/20 D(no potions). Z first whenever available; no interrupt skill / S ever hinted; no violation.
- (c) boss revives: F5 T4, F10 T5, F15 T5, F20 T5, F25 T5, F30 T24. Charge shown again ("蓄力中") at T6 after F10/F15/F20/F25 revives -> not cleared x4; F5 charge not shown T4-T6 (cleared/uncertain x1); F30 not examined closely. Revive text says 蓄力變快.
- (d) Q repeated-key count: 11 cumulative driver count (artifact-prone, same as earlier runs)
- (e) F30 boss survived (not a death). F35 death was from a 42% charge (not 50%): no potions, HP 83 vs forecast 163/341 -> no surviving action; cause potion exhaustion (pots: 5 at F35 T3 -> 0 by T14).
- death screen 共受 162 (第21回合, 20% maxHP; previous turn T20 -341 42%)
- shot: qa-cp9-rc6-shots/death-blade-6.png

## blade 7
- floor reached: 30 (passed 29). Death: F30 boss 冰霜・深淵之王・霜血遊俠 + 霜晶殭屍 charged hit 413 (50% maxHP) at T30 and again T31 (final) with 8 healing potions STILL LEFT (HP 413/826 at T30, Z on cooldown 1 turn, hint D "防禦也擋不住"; T29 Z had brought HP to 413 then T30 -413, T31 -413).
- Driver /workspace/drv4.js (15s/call, state carried by hand, 7 calls). Badge verified build 5883195 w/ CP9, no preset-ignored warning. 13 potions at start (3+10), 4x + skip-animation on.
- in-fight drinks: 20 (driver); drinksHi: 0; map drinks 1
- normal fights A vs non-A: 49 / 6 (driver)
- boss turns (in-game counter): f5 ~7, f10 ~9, f15 ~10, f20 ~7 (revive not captured), f25 ~10, f30 31
- >=20% turns: warned 11, unwarned 0; max single-turn 50%
- 「防禦也擋不住」: 3 driver polls + death-screen hint
- (a) Z hinted while on cooldown: 0 (Z-button disabled check every read; hint switched to D with "生命藥水冷卻 1 回合" at F30 T14, T18, T30)
- (b) lethal-forecast hint orders: F15 T4 Z, F30 T4 Z, T11 Z, T13 Z, T14 D(cooldown), T15 Z, T17 Z, T18 D(cooldown), T19 Z, T22 Z, T24 Z, T27 Z, T29 Z, T30 D(cooldown). Z first whenever available; no interrupt skill / S ever hinted; no violation.
- (c) boss revives: F5 T5, F10 T5, F15 T7, F25 T8, F30 T17 (F20 not captured). Charge cleared: yes x2 (F15 T8, F25 T9 no 蓄力 shown); no x3 (F5/F10 T6 and F30 T18-20 charge shown again). Revive text says 蓄力變快.
- (d) Q repeated-key count: 3 (driver, artifact-prone)
- (e) F30 boss death from 50% charge WITH 8 potions left: loop was Z (HP->413 only, potion heals ~413?) then cooldown turn D at HP 413 vs 413 charged hit -> dead. Potion cooldown 1 turn alternation means every other turn only D available; HP 413 after Z was exactly = forecast so D couldn't save. A survivable action would have needed: Z when HP was still >=826 not possible; possibly an earlier turn (T28 non-charge/rest turn) heal to full or an interrupt/stun - none hinted. Flag: hint at T29 chose Z at HP 413 (heal to 826? then -413 at T30 =413, T31 dead) - a Z/D alternation can't escape 413 per-turn damage; no recommended interrupt.
- death screen 共受 413 (第31回合, 50%); screen says 倒下時還剩 8 瓶生命藥水
- shot: qa-cp9-rc6-shots/death-blade-7.png

## blade 8
- floor reached: 30 (passed 29). Death: F30 boss 冰霜・深淵之王・風鱗齒輪獸 charged heavy hit 174 (21% maxHP) at T25 (T23 -165, T24 -0); 生命藥水已用完, HP 129, T24 hint D only ("防禦後估計 413 ≥ HP 129, 防禦也擋不住"). Potions left 0 (13 start; F25 boss alone took ~43 polls/37 turns and ~8 drinks).
- Driver /workspace/drv4.js (15s/call, state carried by hand, 8 calls). Badge verified build 5883195 w/ CP9, no preset-ignored warning; 4x + skip-animation on.
- in-fight drinks: 27 (driver); drinksHi (>=40% HP, no lethal forecast): 0 by heuristic; map drinks 1
- normal fights A vs non-A: 58 / 7 (driver)
- boss turns (in-game counter): f5 7, f10 7, f15 8, f20 7, f25 37, f30 25
- >=20% turns: warned 12, unwarned 0; max single-turn 50%
- 「防禦也擋不住」: 7 driver polls (+ death-screen hint)
- (a) Z hinted while on cooldown: 0 (Z-button disabled check every fight read)
- (b) lethal hint orders (f/turn/order): 15/4 Z, 25/7 D, 25/9 Z, 25/11 Z, 25/13 Z, 25/14 D, 25/17 Z, 25/18 D, 25/19 Z, 25/21 Z, 25/23 Z, 25/26 Z, 25/29 Z, 25/30 D, 25/31 Z, 26/2 Z, 30/3 Z, 30/7 Z, 30/8 D, 30/10 Z, 30/13 Z, 30/14 D, 30/15 Z, 30/17 D, 30/23 D (no potions), 30/24 D (no potions). D-first on alternate turns (potion cooldown). No interrupt skill / S ever hinted; no violation seen.
- (c) boss revives: F5 T5, F10 T5, F15 T7, F20 T5, F25 T17 (F30 none seen). Charge shown again right after revive at F5/F10/F15/F20 (T6/T6/T7-8/T6) and F25 (T18/T19) -> not cleared x5, cleared 0 (revive text says 蓄力變快).
- (d) Q repeated-key count: 16 (driver, artifact-prone)
- (e) F30 boss death was from a 21% charge, not 50% (potions 0, HP 129 vs forecast 413 -> no surviving action). Cause: potion exhaustion after long F25 boss fight.
- death screen 共受 174 (第25回合, 21%)
- shot: qa-cp9-rc6-shots/death-blade-8.png

## oc 1
- floor reached: 35 (passed 34). Death: F35 boss 堅硬・守門者・炎爪戰士 charged strike 215 (26% maxHP) at T22 (T20 -417, T21 -0); 生命藥水已用完, T21 hint D only (防禦後估計 417 ≥ HP 196, 防禦也擋不住). Potions left 0.
- Driver /workspace/drv4.js (15s/call, state by hand, 9 calls; counters kept across the whole run). Badge verified build 5883195 w/ CP9, no preset-ignored warning; 13 potions at start (3+10), 4x + skip-animation on.
- in-fight drinks: 33 (driver); drinksHi (>=40% no lethal): 0 by heuristic; map drinks 1
- normal fights A vs non-A: 60 / 7 (driver)
- boss turns (driver polls, inflated; F30 ~50 in-game turns, F35 22): f5 7, f10 16, f15 15, f20 16, f25 10, f30 72, f35 39
- >=20% turns: warned 15, unwarned 1; max single-turn 50%
- 「防禦也擋不住」: 1 poll (+ death-screen hint)
- (a) Z hinted while on cooldown: 3 driver flags (F15 T8, F25 T6, F30 T7) - all verified/judged transient stale reads: right after clicking Z the hint line still said Z while Z button already disabled (post-drink cooldown); next turn showed potion drunk (+733 / +701 HP). 0 genuine "hint Z while cooldown 1 at decision time". Shot: qa-cp9-rc6-shots/bug-oc1-a-f15t8 (page screenshot only in tool output, not saved to disk; hint on cooldown correctly switched to Q/D at F15 T9: "生命藥水冷卻中...").
- (b) lethal-forecast hint orders: F10 T4 Z>Q, T7 Z>Q>D, F15 T4 Z>Q, T8 Z, F20 T4 Z>Q, T7 Z, F25 T3 Z>Q, T6 Z, F30 T7,10,14,19,24,27,29,33,35,40,43,46 Z (T21 Z>Q), F35 T9 Z, T11 Z, T21 D (no potions). Z first whenever available; no interrupt skill / S ever hinted; no violation.
- (c) boss revives: F5 T3, F10 T7, F15 T10, F25 T3, F30 T24 (F20 not captured). Charge cleared after revive: yes x4 (F5, F10, F15, F25: no 蓄力 on following reads); no x1 (F30 T25-27 蓄力 shown again).
- (d) Q repeated-key count: 14 (driver, artifact-prone)
- (e) F30 boss survived. Analog F35 death at 26% charge (not 50%): potions 0, HP 196 vs forecast 417 -> no surviving action; D only.
- death screen 共受 215 (第22回合, 26%)
- shot: qa-cp9-rc6-shots/death-oc-1.png


## oc 2 (IN PROGRESS - survived to F83+ at time of note; potions ~8 left)
- Driver drv4.js (15s/call, state by hand). 13 potions at start. Passed F30, F35, F40, F45, F50, F55, F60, F65, F70, F75, F80 bosses (new best, prior runs died F30-F45).
- (a) 1 driver flag F68 T6: transient stale read (screenshot qa-cp9-rc6-shots/bug-oc2-a-f68t6.png shows HP 165->1167 after the drink; Z cooldown 1|7 left). 0 genuine.
- (b) Z first on every lethal turn when available; Q>Z at F35 T4 (interrupt first, Z second, "防禦擋不住"); Q>D at F60 T14 / F66 T4 when potion on cooldown; D when HP "撐得住" or cooldown. No S/violation.
- (c) revives F5,F10,F15,F20,F30,F35,F40,F45,F50,F55,F60,F65,F70,F75,F80; charge visibly shown again right after revive at F70, F75, F80 (T18/T20/T16) -> not cleared; F80 T17 cleared; earlier ones as per notes.
- (d) F35 T4 Q needed 2 clicks (first click: HP/text unchanged; second: 蓄力被打斷). F66 T4 Q hinted over 3 polls.
- UPDATE (budget stop): oc 2 still ALIVE at F101 (passed F100 boss, T27+; ~4-5 potions, HP ~585/1192). Not finished -> NOT counted as a completed run; browser tab left on the live run at localhost:5354. Counters at stop: drinks 60, normal A/nonA ~201/51, maxPct 50, warned>=20% turns 32 / unwarned 1, 防禦也擋不住 polls 2, boss polls f5 8 f10 13 f15 12 f20 17 f25 5 f30 25 f35 19 f40 22 f45 36 f50 74 f55 47 f60 36 f65 35 f70 36 f75 34 f80 25 f85 43 f90 34 f95 27 f100 43. Revives each boss F5..F100; charge visibly cleared after revive: F5? yes-ish earlier; F70 T17 yes, but F70 T18, F75 T20, F80 T16, F90 T19, F95 T15, F100 T25 charge shown again.


## oc 2 (capped)
I stopped this run while the character was still alive at F101, after it had passed every boss from F5 to F100. I'm recording it as ≥101; it counts as above the median and doesn't change it. It used 60 in-fight drinks. Unwarned ≥20% damage turns: 1. Q needed two clicks once (F35 T4): the first click did nothing, and the second gave 蓄力被打斷.
Possible balance issue: from about F35 on, oc's difficulty doesn't seem to keep scaling.


## oc 3
- floor reached: 50 (passed 49). Death: F50 boss, T16 charged strike 204 (24%); T14 -432 (50%), T15 -296 (34%); 生命藥水已用完 from T14 (13 start potions, 34 in-fight drinks incl. merchant buys, 1 map drink); T14/T15 hint D only ("防禦也擋不住，但能減傷").
- Driver drv4.js (15s/call, state by hand, 9 calls). Badge build 5883195 with CP9, no preset warning.
- in-fight drinks: 34; drinksHi (>=40% HP, no lethal forecast): 0 by heuristic; map drinks 1
- normal fights A vs non-A: 87 / 22 (driver, approx)
- boss turns (driver polls, inflated): f5 8, f10 11, f15 15, f20 17, f25 12, f30 34, f35 13, f40 35, f45 19, f50 26
- >=20% turns: warned 16, unwarned 0; max single-turn 50%
- 防禦也擋不住: 2 polls + death-screen hint
- (a) Z hinted while on cooldown: 0 (driver checks Z disabled on every read)
- (b) lethal-forecast hint orders: F10 T4 Z>Q, F15 T4 Z>Q>D, T8 Z>D, F20 T6 Z>D, F26 T3 Z, F30 T4 Z>Q, T6/8/19/22 Z, F40 T7,9,11,20 Z, T13/15/17 Z>Q, F45 T4,8 Z, F46 T3 D (撐得住), F50 T9,11,13 Z, T14,15 D (no potions). Z first whenever available; no interrupt skill/S ever hinted; no violation.
- (c) boss revives F5,F10,F20,F25,F30,F35,F40,F45 (F15 not captured by log): charge shown again after revive: F20 T7-8 yes(not cleared), F25 T6 yes, F30 T18 yes, F35 T6 yes, F40 T14-15 yes, F45 T3-4 yes; cleared (no charge): F10 T8, F5 T5-6, F30 T16-17 briefly. Mostly not cleared (revive text says 蓄力變快).
- (d) Q repeated-key count: 21 (driver, artifact-prone; no confirmed multi-click failure)
- (e) F30 boss survived (no death). Analog F50 death from 50% charge T14: potions 0, HP 432/864 vs forecast 432 -> D only, no surviving action; cause = potion exhaustion.
- death screen 共受 204 (第16回合, 24%)
- shot: qa-cp9-rc6-shots/death-oc-3.png


## oc 4
- floor reached: 45 (passed 44). Death: F45 boss 鐵壁尖刺・塔主・風蹄甲蟲 charged strike 414 (50% maxHP) on T8 (T6 -414, T7 -25, T8 -414). Died with 9 life potions LEFT (death screen: "倒下時還剩 9 瓶生命藥水：最後一擊 46%，HP 低於 92% 時就按 Z"). T7 hint was Z (forecast 414 >= HP 389, defend can't save).
- Driver drv4.js (15s/call, state by hand, ~13 calls). 13 potions at start.
- in-fight drinks: 27 (driver); drinksHi 0 by heuristic; map drinks 1
- normal fights A vs non-A: 80 / 23 (driver)
- boss turns (driver polls, inflated): f5 8, f10 17, f15 10, f20 13, f25 14, f30 46, f35 43, f40 69, f45 11
- >=20% turns: warned 19, unwarned 0; max single-turn 50%
- 防禦也擋不住: 0 polls (death-screen hint shows it)
- (a) Z hinted while on cooldown: 0
- (b) hint orders: F10 T4 Z>Q>D, F16 T3 Z, F20 T4 Z>Q, F28 T1 Z>Q>D, T3 Z>Q, F30 T11/T20 D (撐得住), T28 Z, F33 T2 Z, F35 T14 Z, T16 D, T18 Z, T26 Z>D, T30 Z>Q>D, F38 T4 Z, F40 T11 D, T21 Z, T23 D, T24 Z, T41 D, T42 Z, F41 T1 Z, F45 T3 Z, T5 Z, (T7 Z per death screen). Z first when available; no interrupt skill / S ever hinted; no violation.
- (c) revives captured F10 T10, F15 T4, F20 T9, F25 T5, F30 T18, F40 T29 (F35/F45 not captured): charge shown again right after revive at F15 T6, F20 T10, F25 T6, F30 T19-21, F40 T29-31 (not cleared); F10 T11-13 no charge shown (cleared). 1 yes / 5 no.
- (d) Q repeated-key count: 26 (driver, artifact-prone; no confirmed failed-click)
- (e) F30 boss survived. F45 death from 50% charge: potions 9 left; T8 hint/action not captured (call ended during the fatal turn). T7 had been Z (potion drunk) so Z most likely on cooldown at T8, HP < 414 -> D could not survive (est. 50% reduction => 207 would survive if D halves damage... NOTE death screen states D post-reduction 414 >= HP, "防禦擋不住"). Not fully verified; possible design issue: charge 50% two charges 2 turns apart (T6 -414, T8 -414) with 3-turn potion cooldown.
- death screen 共受 414 (第8回合, 50%)
- shot: qa-cp9-rc6-shots/death-oc-4.png


## oc 5
- floor reached: 35 (passed 34). Death: F35 boss 迅捷・守門者・闇血屍鬼 charged strike 282 (34%) on T28 (T26 -414 = 50%, T27 -0); 生命藥水已用完, T27 hint D only ("防禦也擋不住，但能減傷", forecast 414 ≥ HP 79). Potions left 0 (13 start).
- Driver drv4.js (15s/call, state by hand, 9 calls; counters trimmed mid-run, totals approximate). 4x + skip-animation on, badge OK.
- in-fight drinks: ~27+ (last-segment counters only partly carried); drinksHi 0 by heuristic; map drinks 1
- normal fights A vs non-A: ~68 / ~15 (approx)
- boss turns (max in-game turn): f5 5, f10 11, f15 11, f20 20, f25 9, f30 60, f35 28
- >=20% turns: warned ~21+, unwarned 0; max single-turn 50%
- 防禦也擋不住: 2 polls + death-screen hint
- (a) Z hinted while button disabled: 1 DRIVER HIT at F20 T16 (hint "HP 危險！建議 Z·喝藥", HP 142, Z read as disabled). Next turn log shows the potion WAS drunk (+686, HP 142->663) and Z then showed "冷卻 1｜剩 8", so likely a transient disabled state during resolution/animation (not confirmed as true bug). Screenshot at T17 only (not saved to disk path; no T16 shot). Otherwise 0.
- (b) lethal-forecast hint orders (f/turn/order): F10 T4 Z>Q, F15 T9 Z>D, F20 T4 Z>Q, T16 Z, F30 T9 Z, T13 Q>D, T19 Z, T21 D, T25 D, T43 Z, T45 Q>D, T51 D, T53 Z, F31 T9 Z>D, F33 T3 Z, F35 T10 Z, T14 Z, T17 D, T22 Z, T26 D, T27 D (no potions). D-first only with 撐得住/cooldown/none. No interrupt skill/S ever hinted; no violation (note F30 T13/T45 Q>D without Z when potion cooldown presumably).
- (c) boss revives F15 T8, F20 T13, F25 T8, F30 T45 (F5/F10/F35 none seen): charge shown again right after revive in all 4 sampled (F15 T9-10, F25 T9, F30 T45-47) -> not cleared 4 / cleared 0 (F20 inconclusive).
- (d) Q repeated-key count: 19 (driver, artifact-prone)
- (e) F30 boss survived (T60). F35 death from 34% charge (T26 had taken 50%); potions 0, HP 79 -> no surviving action; cause potion exhaustion.
- death screen 共受 282 (第28回合, 34%)
- shot: qa-cp9-rc6-shots/death-oc-5.png


## oc 6
- floor reached: 50 (passed 49; died on F50 boss, so the >F50 export rule did NOT trigger). Death: F50 boss 鐵壁銳眼・深淵之王・霜影機兵 charged strike 127 (12%) T31 at HP 6; T29 -517 (50%), T30 -0; 生命藥水已用完; T29/T30 hint D only (forecast 518 ≥ HP 6). Potions left 0 (13 start).
- Driver drv4.js (15s/call, state by hand, 15 calls). Badge OK, no preset warning.
- in-fight drinks: ~38 (driver); drinksHi 0 by heuristic; map drinks 3
- normal fights A vs non-A: ~93 / ~26 (approx)
- boss turns (max in-game turn): f5 7, f10 16, f15 ~4+, f20 12, f25 8, f30 12 (short), f35 18, f40 24, f45 29, f50 31
- >=20% turns: warned ~30, unwarned 1; max single-turn 50%
- 防禦也擋不住: 4 polls + death-screen hint
- (a) Z hinted while disabled (stable re-check): 0 (stricter check: body unchanged + still disabled)
- (b) hint orders: F10 T4 Z>Q, F20 T4 Z>Q>D, T6 D, T9 Z, F30 T4 Z, F35 T9 Z, T11 D, T13 Z, F40 T7/9/14/17 Z, T19 Z>Q, T20 Q>D, T21 D, F41 T4 Q>Z>D (!Q listed before Z), F45 T3 D, T17 D, T18 Z, T24 Z, F50 T9/11/13/17/20/22/26 Z, T29 D, T30 D (no potions). One order anomaly: F41 T4 hint "Q>Z>D" (Q first, Z second; likely potion on cooldown or Q interrupt preferred). No S ever hinted.
- (c) revives F5 T4, F10 T10, F15 T4, F20 T9, F25 T4, F30 T2, F35 T7, F40 T7, F45 T15, F50 T16: charge shown again after revive: F20, F25(T6), F30, F35, F40, F45, F50 = 7 not cleared; F5, F10 (no charge shown), F15 (no) = cleared 3.
- (d) Q repeated-key count: 18 (driver, artifact-prone)
- (e) F30 boss survived (only 12 turns, boss revived at T2). F50 death was not from a 50% charge at the last hit (T29 50% hit survived; died T31 on 12% at HP 6, potions 0).
- death screen 共受 127 (第31回合, 12%)
- shot: qa-cp9-rc6-shots/death-oc-6.png

NEXT: oc 7

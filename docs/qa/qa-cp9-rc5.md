# QA cp9-rc5 (build 9bb5c12) — PARTIAL: 7 of 32 runs completed
Badge verified: "build 9bb5c12 · CP4 · CP5 · CP6 · CP7 · CP8 · CP9", no preset-ignored warning (shots/badge.png). &fresh used on every run.
Runs done: blade 1-4 (run 4 partial data), oc 1, arcane 1, bulwark 1. Not done: blade 5-8, oc 2-8, arcane 2-8, bulwark 2-8.
Raw per-run data: qa-cp9-rc5-data.jsonl (blade 1-2 per-turn rows; later runs aggregated in-script because of output size).
## Per run
| run | deepest floor | cause |
|---|---|---|
| blade 1 | 25 | charge hit 171 (20%) after 392 prior turn; boss floor 25 |
| blade 2 | 30 | 428 (50%) charge hit, boss fl30 |
| blade 3 | 31 | 346 (40%) charge |
| blade 4 | 35 (partial data) | 401 (50%) charge |
| oc 1 | 30 | 393 (50%) charge |
| arcane 1 | 30 | 380 (50%) charge |
| bulwark 1 | 30 | 374 (50%) charge |

## blade 5 (session 2, rules v2) — DONE
- Deepest floor 31. Nodes: standard merchant>battle>rest path (rest before every boss 5,10,..,30).
- Potions: bought 28 (10 start + merchants), dropped 0, map drinks 0, in-fight drinks 27 (7 with lethal forecast; 2 at HP>=40% both lethal-forecast).
- Normal fights 13: A 41, non-A 5 (10.9%) — only 決策/建議-line presses count as non-A.
- Boss turns: f5 4, f10 8, f15 8, f20 8, f25 12, f30 ~82 (two 25s call-cuts).
- Turns >=20% max-HP: 48 with previous-turn warning, 19 without. Max single turn 50%.
- 防禦也擋不住 shown on 1 decision turn.
- Stun: none (blade has no stun skill; Q/W are damage skills).
- Lethal turn: HP 266 before, shown intent 434, death screen "第 4 回合共受 391 傷害（佔最大 HP 44%）"; HP-after is 0 (UI vanishes), so own sum = 266+ (lower bound), title 391 inferred correct.
- Death screen: title 倒下了……; advice "最後兩回合共受 568 傷害…倒下時還剩 4 瓶生命藥水…HP 低於 88% 時就按 Z". Shot: shots/death-blade-5.png
- Potion cooldown wording again "藥水冷卻中（2 回合）".

## blade 6 (session 3, rules v2) — DONE (note: first attempt aborted at floor 5 because my driver mis-parsed "建議 Q·… 或 A" without colon and pressed A; discarded, run restarted with &fresh)
- Deepest floor 20 (died on boss fl20). Path: boss-prior rests taken (fl4,9,14,19), battle>chest; no merchant offered on any floor; floors 7/12/17 shrine/chest only (shrine buff taken: first option).
- Potions: 13 start (3+10), 7 left at death; 6 successful in-fight drinks (fl5 23%, fl10 20%, fl10 22%, fl15 20%, fl15 20%, fl18 35%), all with a warning/lethal forecast showing; 2 map drinks (HP<50%). Z press failed (potion cooldown, button not clickable) at fl15 x2, fl18 and fl20 (HP 65, forecast lethal) -> fell back to A (driver fallback, not a rule-prescribed press).
- Normal fights: A 35, non-A 1. Boss turns: f5 10, f10 39, f15 11, f20 ~20 (died).
- Damage turns >=20%: 2 counted (f10 29% prev warned, f20 33% prev warned: "(蓄力大招) 吸血重擊 278"). Max single turn 32.7%. (g20 bookkeeping excludes drink turns and cross-floor.)
- 防禦也擋不住: 0 turns counted by my scan (shown in recommendation lines on drink turns f10/f20 text "防禦擋不住").
- Stun: none (blade). Drain hit: fl20 災厄・霜鋼骷髏 吸血重擊 278 (33%), pressed A (no D) when line said Q or A, HP safe estimate 277<343.
- Lethal turn: HP 65 before, shown forecast 138 ("下回合全體暴擊估計 138 ≥ HP 65"), recommendation Z (防禦擋不住) but Z unavailable (cooldown) -> A; death screen "第 6 回合共受 96 傷害（佔最大 HP 11%）" (96 <138; consistent with 65 HP, overkill).
- Death screen shot: shots/death-blade-6.png. Advice: "倒下時還剩 7 瓶生命藥水：最後一擊 11%，HP 低於 22% 時就按 Z".
- FINDING: Z recommended at HP 65-174 several times but potion on cooldown -> recommendation not actionable (UX/balance issue). Not-done: no stun/pulse seen.

## CUMULATIVE after 9 runs (blade 1-6, oc 1, arcane 1, bulwark 1). NEXT: blade 7.
Floors: blade 25,30,31,35,31,20; oc 30; arcane 30; bulwark 30.
Deaths: 8/9 to charge hit >=40% max HP; blade 6 died to overkill 96 at HP 65 after drain hit 278 (33%) with potion cooldown.
Session 3 budget exhausted after blade 6 (tool-call driver overhead); not done: blade 7-8, oc 2-8, arcane 2-8, bulwark 2-8.

## blade 7 (session 4, rules v2, driver = in-page loop) — DONE
- NOTE: the main tower (試煉之塔) ENDS at floor 20 with a clear (first attempt cleared 20, no death; discarded/not counted, tallies partial). Deeper floors only exist in 深淵塔 → all counted runs use 進入深淵塔 (第 1 層起); buy 10 potions in 商店, then 忽略並出發.
- Deepest floor 30 (abyss boss fl30). Death: 第 5 回合共受 413 傷害（佔最大 HP 50%），蓄力大招 重擊 413; forecast on prior turn "防禦後估計 413 ≥ HP 413，防禦也擋不住"; potion on cooldown (14 left).
- In-fight drinks 10 (0 at HP>=40% without lethal forecast); map drinks 0. Normal fights A 55 / non-A 7 (fallback A when Q/W unavailable: 9). 
- Boss turns: f5 9, f10 13, f15 13, f20 14, f25 19, f30 9 (death). 
- Turns >=20%: 6 warned / 0 unwarned (excluding death turn). Max single turn 46% (non-lethal), death 50%. 防禦也擋不住 on 3 decision turns. Stun: none (blade). S: 0.
- Death screen 共受 413. Shot: shots/death-blade-7.png
- FINDING again: potion cooldown + 413 ≥ HP 413 at fl30 boss.


## blade 8 (session 4) — DONE
- Abyss tower. Deepest floor 30 (boss). Death: 第 6 回合共受 313 傷害（佔最大 HP 38%），最後一擊 烈焰・深淵之王・霜鐮豹 251; prior turns 384 (47%?), 407 (50%) 蓄力大招 重擊; forecast "防禦後估計 407 ≥ HP 227，防禦也擋不住; 生命藥水冷卻 1 回合".
- In-fight drinks 14 (0 at HP>=40% without lethal forecast); map drinks 0. Normal A 57 / non-A 8 (fallback-A 4). Boss turns f5 6, f10 13, f15 12, f20 16, f25 14, f30 9.
- Turns >=20%: 4 warned / 1 unwarned. Max non-death turn 45%. 防禦也擋不住 2 turns. Stun none (blade). S 0.
- 17 potions left at death ("HP 低於 62% 時就按 Z"). Shot: shots/death-blade-8.png

## CUMULATIVE after 11 runs. NEXT: oc 3.
Blade 7-8 both died at abyss floor 30 boss to 407-413 (50%) charge hits with defend unable to block and potion cooldown. Not done: oc 2-8, arcane 2-8, bulwark 2-8 (session 4 stopped for budget; driver approach costs ~4 calls/run).


## oc 2 (session 5, rules v2, in-page driver) — DONE
- Abyss tower (preset postF20-oc, fresh, 13 potions at start). Deepest floor 15 (boss), died on boss fl15.
- Death: 第 5 回合共受 254 傷害（佔最大 HP 31%），最後一擊 霜骨光靈 92; turn 4 warning "守門者・雷紋鴉 蓄力 重擊 162(20%)", recommendation "Q·盾擊（打斷蓄力）；否則 Z（防禦後估計 246 ≥ HP 231，防禦擋不住）". Followed first option Q. 18 potions left at death ("HP 低於 22% 時就按 Z").
- In-fight drinks 2 (0 at HP>=40% without lethal forecast); map drinks 0. Normal fights A 24 / non-A 1 (fallback-A 4 when recommended key unavailable/ race). 
- Boss turns f5 5, f10 13, f15 7 (death). Turns >=20%: ~1 warned (death turn) / 0 unwarned counted. Max non-death single turn 19.9%; death turn 31%. 防禦也擋不住 shown on 0 counted turns before death (appears in death-screen advice). Stun (Q 盾擊 on 蓄力): pressed 6, all reported interrupted (heuristic). S 0.
- Note: tallies for a few turns lost to script races (fight-end race errors 6); counts approximate. Death screen 共受 254. Shot: qa-cp9-rc5-shots/death-oc-2.png
- FINDING: fl15 death with 18 potions in bag: first-option rule Q/stun then 254 damage in a following turn at HP 231 -> no drink.

## CUMULATIVE after 12 runs.

## oc 3 (session 5) — DONE
- Abyss tower, 13 potions at start (18 left at death). Deepest floor 30 (boss), died turn 12 of fl30 boss.
- Death: 第 12 回合共受 408 傷害（佔最大 HP 50%），蓄力大招 烈焰・深淵之王・霜爪幽魂 重擊 394 at HP 394; turn-11 hint "A·攻擊 …（防禦後估計 408 ≥ HP 394，防禦也擋不住；生命藥水冷卻 1 回合）" -> only option A, potion on cooldown. Death screen 共受 408.
- In-fight drinks 7 (0 at HP>=40% without lethal forecast); map drinks 1. Normal fights A 39 / non-A 4 (fallback-A 7 when recommended key unavailable; counts approximate, ~14 script race errors dropped a few turns).
- Boss turns f5 7, f10 11, f15 12, f20 7, f25 19, f30 20 (death). Turns >=20%: 4 warned (incl. death turn) / 0 unwarned. Max non-death turn 42.6%; death turn 50%. 防禦也擋不住 on 5 turns. Stun (Q 盾擊): pressed 16, interrupt text seen 13 (heuristic), not 3. S 0.
- Shot: qa-cp9-rc5-shots/death-oc-3.png
- FINDING: same as blade 7/8: fl30 408 (50%) charge, HP 394 < 408, defend can't block, potion cooldown.

## CUMULATIVE after 13 runs. NEXT: oc 4.
Session 5 stopped on budget after oc 3. Not done: oc 4-8, arcane 2-8, bulwark 2-8.

## oc 4 (session 6, rules v2, in-page driver w/ try/catch race fix) — DONE
- Abyss tower, 13 potions at start (20 left at death incl. merchant buys). Deepest floor 25 (boss), died turn 5 of fl25 boss.
- Death: 第 5 回合共受 285 傷害（佔最大 HP 33%），（蓄力大招）堅硬・塔主・風鐵甲蟲 重擊 285 at HP 265; turn-4 hint "Q·盾擊（打斷蓄力）；否則 Z（防禦後估計 379 ≥ HP 265，防禦擋不住）（HP 危險：下回合全體暴擊估計 426 ≥ HP 265）". Followed first option Q (stun failed to prevent hit). Turns 3-5 damage 125,122,285.
- In-fight drinks 8 (0 at HP>=40% without lethal forecast); map drinks 0. Normal fights A 45 / non-A 4 (fallback-A 8 when recommended key unavailable). Race errors caught 11 (no turns lost to crashes).
- Boss turns f5 7, f10 17, f15 16, f20 22, f25 7 (death). Turns >=20%: 3 warned (+death turn) / 0 unwarned. Max non-death turn 32.2%; death turn 33%. 防禦也擋不住 on 0 counted decision turns (in death advice). Stun (Q 盾擊): pressed 12, interrupt text seen 12 (heuristic). S 0.
- Death-screen advice: "倒下時還剩 20 瓶生命藥水：最後一擊 33%，HP 低於 66% 時就按 Z". Shot: qa-cp9-rc5-shots/death-oc-4.png
- FINDING: died at HP 265/~865 with 20 potions: first-option Q rule never drinks at 31% HP when charge forecast was 379/426 >= HP.

## CUMULATIVE after 14 runs.

## oc 5 (session 6) — DONE
- Abyss tower, 13 potions at start, 15 left at death. Deepest floor 15 (boss), died turn 5 of fl15 boss.
- Death: 第 5 回合共受 185 傷害（佔最大 HP 22%），（蓄力大招）守門者・雷鱗元素靈 重擊 185 at HP 168; turns 3-5 dmg 165,165,185. Turn-4 hint "Q·盾擊（打斷蓄力）；否則 Z（防禦後估計 292 ≥ HP 168，防禦擋不住）（HP 危險：下回合全體暴擊估計 414 ≥ HP 168）". Followed first option Q.
- In-fight drinks 5 (0 at HP>=40% without lethal forecast); map drinks 0. Normal A 29 / non-A 3 (fallback-A 3). Race errors caught 4, none lost turns.
- Boss turns f5 8, f10 15, f15 7 (death). Turns >=20%: 0 warned-counted before death / 0 unwarned (death turn 22% warned). Max non-death turn 19.9%. Stun (Q): pressed 5, interrupt text 5 (heuristic). S 0.
- Death advice: "倒下時還剩 15 瓶生命藥水：最後一擊 22%，HP 低於 44% 時就按 Z". Shot: qa-cp9-rc5-shots/death-oc-5.png
- FINDING: same pattern as oc 2/4: boss charge turn recommends Q first; Q at HP 168/~850 (20%) never drinks, boss follow-up kills with 15 potions unused.

## CUMULATIVE after 15 runs. NEXT: oc 6.
Session 6 stopped on budget after oc 5 (each run ~7 driver calls). Done this session: oc 4 (fl25), oc 5 (fl15). Not done: oc 6-8, arcane 2-8, bulwark 2-8.

## oc 6 (session 7, rules v2, in-page driver drv3.js w/ try/catch + 選這個 buff + 休息 handling) — DONE
- Abyss tower, 13 potions at start (15 left at death). Deepest floor 25 (boss), died turn 5 of fl25 boss.
- Death: 第 5 回合共受 182 傷害（佔最大 HP 21%），最後一擊 霜岩屍鬼 158; turns 3-5 dmg 170,170,182. Death advice "HP 低於 38% 時就按 Z".
- In-fight drinks 8 (0 at HP>=40% without lethal forecast); map drinks 0. Normal A 44 / non-A 5 (fallback-A 2). Race errors caught 6.
- Boss turns f5 8, f10 11, f15 13, f20 14, f25 6 (death). Turns >=20% warned 4 / unwarned 0. Max non-death turn 31.9%. 防禦也擋不住 0 counted. Stun Q pressed 11, interrupt text 9 (heuristic). S 0.
- Q-first/Z-second hints: (1) fl10 boss HP 273/852 (32%) "Q·盾擊 或 Z·喝藥 或 D·防禦" -> Q -> "蓄力被打斷", no damage, survived. (2) fl25 boss HP 172/852 (20%) "Q·盾擊 或 Z·喝藥" -> Q (logged twice, likely a click retry race) -> next turn killed (-182 at HP 172). Z second option was never taken; 15 potions unused.
- Shot: qa-cp9-rc5-shots/death-oc-6.png
- FINDING: same pattern as oc 2/4/5: Q-first at HP 20% on boss charge turn, follow-up 182 kills with 15 potions unused.

## CUMULATIVE after 16 runs. NEXT: oc 7.

## oc 7 (session 7) — DONE
- Abyss tower, 13 potions at start (18 left at death). Deepest floor 15 (boss), died turn 5 of fl15 boss.
- Death: 第 5 回合共受 180 傷害（佔最大 HP 23%），最後一擊 霜角妖精 180; turns 3-5 dmg 157,157,180. Advice "HP 低於 46% 時就按 Z".
- In-fight drinks 4 (0 at HP>=40% without lethal forecast); map drinks 0. Normal A 26 / non-A 3 (fallback-A 1). Race errors 4.
- Boss turns f5 8, f10 12, f15 5 (death). Turns >=20% warned 0 / unwarned 0 counted before death (death turn 23% warned). Max non-death turn 20%. 防禦也擋不住 0. Stun Q pressed 2, interrupt text 1 (heuristic). S 0.
- Q-first/Z-second hints: (1) fl10 boss HP 256/786 (33%) "Q·盾擊 或 Z·喝藥" -> Q -> "蓄力被打斷", HP 256->152 (took ~104 anyway, survived). (2) fl15 boss HP 174/786 (22%) "Q·盾擊 或 Z·喝藥" -> Q -> next turn -180 killed at HP 174. 18 potions unused.
- Shot: qa-cp9-rc5-shots/death-oc-7.png
- FINDING: same pattern again (Q first at ~22% HP, 180 follow-up kills, Z second never used).

## CUMULATIVE after 17 runs. NEXT: oc 8.

## oc 8 (session 7) — DONE
- Abyss tower, 13 potions at start (20 left at death). Deepest floor 30 (boss), died turn 14 of fl30 boss.
- Death: 第 14 回合共受 417 傷害（佔最大 HP 50%），（蓄力大招）霜鬃術士 蓄力一擊 417; turns 12-14 dmg 274,207,417 (last two = 75% max HP). Turn-13 hint "Z·生命藥水（剩 20 瓶）（防禦後估計 417 ≥ HP 353，防禦擋不住）（HP 危險：下回合全體暴擊估計 417 ≥ HP 353）" -> Z pressed but still died next turn (HP never exceeded 417 after one drink / drink heal insufficient). Death advice "HP 低於 100% 時就按 Z".
- In-fight drinks 11 (0 at HP>=40% without lethal forecast); map drinks 1. Normal A 50 / non-A 4 (fallback-A 7). Race errors 13.
- Boss turns f5 14, f10 10, f15 11, f20 15, f25 13, f30 23 (death). Turns >=20% warned 6 / unwarned 0. Max non-death turn 50% (death turn). 防禦也擋不住 3 turns. Stun Q pressed 20, interrupt text 16 (heuristic). S 0.
- Q-first/Z-second hints: fl10 HP 320/834 (38%) -> Q (clicked 3 times with unchanged state before it registered) -> HP 128 + boss 復活 phase 2 (took ~192). fl15 HP 256/834 (31%) -> same -> HP 39 + 復活 phase 2 (took ~217, near death). fl25 HP 223/834 (27%) -> same -> HP 41 + 復活 phase 2 (took ~182, near death). Survived all 3 but ended at 5-15% HP; Z second option never taken on these. Note: Q clicks sometimes needed 3 tries (state unchanged) — possible Q click lag/race or Q on cooldown shown as enabled; worth checking.
- Shot: qa-cp9-rc5-shots/death-oc-8.png
- FINDING: fl30 boss 417 (50%) charge with HP 353 < 417 again; one Z drink insufficient / defend can't block. Same as blade 7/8, oc 3.

## CUMULATIVE after 18 runs. NEXT: arcane 2.
Session 7 stopped on budget after oc 8. Done this session: oc 6 (fl25), oc 7 (fl15), oc 8 (fl30). Not done: arcane 2-8, bulwark 2-8.

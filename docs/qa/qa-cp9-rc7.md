NEXT: blade 7

## blade 1 (build ecd2308, drv5.js)
- floor reached: 40 (died on F40 boss, "已通過 39 層"); death cause: 50% charge one-hit (419 = 50% maxHP) on turn 22 at HP 1, potions exhausted (0 left; hint at turn 21 was "A·攻擊（HP 1、沒有可用藥水）")
- death screen 「共受」: 第22回合共受 419 傷害 (50% max HP)
- in-fight drinks: 34 total (driver counted 0 at HP>=40% w/o lethal forecast); map drinks 1
- normal fights A vs non-A: A 81 / non-A 22
- boss turns (driver press counts): F5 5, F10 10, F15 12, F20 11, F25 11, F30 31 (in-game turn ~26), F35 57 (in-game turn ~44), F40 29 (died, turn 22)
- >=20% damage turns: warned 13 / unwarned 1; max single-turn 43.6%
- 「防禦也擋不住」: 3 (all F40)
- (a) Z hinted while on cooldown: 0
- (b) banner vs decision contradictions: 0 by regex ("HP 危險 ≥ HP" + "撐得住"). Lethal-forecast hint order logged: Z>D mostly; D-only when Z unavailable (F31 t3, F35 t3, F40 t3/t9/t17/t19) — no interrupt skill/S seen first.
- (c) revive: text 「復活清除異常狀態與蓄力，2 回合後重新蓄力」 shown on revive at F5, F10, F15, F20, F30, F35 = 6 yes, 0 no (F25/F40 no revive observed)
- (d) Q/W/E repeated presses in same turn: 2 (F20 t4 Q, F25 t9 W) - may be driver retries after timeouts
- (e) back-to-back 50% heavy hits: 0 detected by driver. F40 death was a 50% charge.
- (f) boss turns F30: 31 presses (~26 turns); F35: 57 presses (~44 turns)
- (g) potions: start 13 (3 held + 10 bought), merchants ~21 bought (driver count), drops 0 detected
- shots: qa-cp9-rc7-shots/death-blade-1.png, badge.png

## blade 2 (build ecd2308, drv5.js)
- floor reached: 46 (died F46 normal fight, "已通過 45 層"); death cause: Thunder-feather eagle 161 dmg (20% maxHP) at HP 1 on turn 7, potions exhausted (0 left); last 3 turns -161/-104/-161
- death screen 「共受」: 第7回合共受 161 傷害 (20% max HP)
- in-fight drinks: 33 (+4 map drinks); driver counted 0 at HP>=40% w/o lethal forecast
- normal fights A vs non-A: A 80 / non-A 22
- boss presses: F5 8, F10 7, F15 8, F20 10, F25 6, F30 14, F35 19, F40 35, F45 62 (F45 in-game turn ~56)
- >=20% damage turns: warned 27 / unwarned 2; max single-turn 39.8%
- 「防禦也擋不住」: 0
- (a) Z hinted while on cooldown: 2 — F20 t5 (HP 212; Z showed "冷卻 1｜剩 21", disabled; shot qa-cp9-rc7-shots/bug-a-blade-2-F20-t6.png) and F45 t25 (HP 1). Both read right after a Z press in the same counter turn, so might be a stale-hint render race; not confirmed as persistent.
- (b) banner/decision contradictions: 0 by regex. Lethal-forecast hint order: Z>D normally, D-only when Z on cooldown (F28 t1, F30 t9, F35 t3, F40 t3, F45 t3/t14/t22, F46 t5). No interrupt-skill/S seen.
- (c) revive: 「2 回合後重新蓄力」 text seen on revives at F10, F15, F20, F40 = 4 yes, 0 no. F5 t4 flagged "no" in driver but it was a heavy-hit line, no revive text (unclear). F30/F35/F45 no revive text observed.
- (d) Q/W/E same-turn repeats: 2 (F20 t4 Q, plus one more; driver retry after timeouts possible)
- (e) back-to-back 50% heavy hits: 0 detected
- (f) boss turns: F30 14 presses; F35 19 presses (in-game turn ~17)
- (g) potions: start 13 (3 held + 10 bought), merchants 21 bought (driver count), drops 0 detected
- shots: death-blade-2.png, bug-a-blade-2-F20-t6.png

## blade 3 (build ecd2308, drv5.js + hit-pause patch)
- floor reached: 40 (died on F40 boss turn 8, "已通過 39 層"); death cause: 166 dmg (20% maxHP) from 嗜血・災厄・風眼巨人 at low HP, potions exhausted (0 left, hint at F40 t5 "生命藥水已用完")
- death screen 「共受」: 第8回合共受 166 傷害 (20% max HP); last 3 turns -187/-166/-166
- in-fight drinks: 32 total, 0 at HP>=40% without lethal forecast; map drinks 5
- normal fights A vs non-A: A 76 / non-A 38
- boss press counts: F5 9, F10 8, F15 7, F20 12, F25 11, F30 43 (in-game turn ~33), F35 59 (in-game turn ~46), F40 11 (died turn 8)
- >=20% damage turns: warned 12 / unwarned 0; max single-turn 39.9%
- 「防禦也擋不住」: 0
- (a) Z hinted while on cooldown: 0 hits, so no screenshots needed (driver pauses on every hit)
- (b) banner vs decision contradictions: 0 by regex. Lethal-forecast hint order: Z>D normally; D-only when Z unavailable/potion cooldown or "防禦後撐得住，先不喝藥" (F30 t17, F33 t3/7/11, F35 t3/6, F38 t3, F40 t5 out of potions). No interrupt skill / S seen first.
- (c) revive text 「復活清除異常狀態與蓄力，2 回合後重新蓄力」 yes at F5, F10, F15, F20, F25, F30, F35 = 7 yes, 0 no. At F30 revive t25 the next charge hint came at t27 (2 turns later, consistent). F35 revive t37, charge hints t39+ (consistent). Driver "chg" flags at F20 t8-10 are regex noise (matches the "重新蓄力" text itself).
- (d) Q/W/E same-turn repeats: 1 (F10 t4 Q; may be a driver retry after timeout)
- (e) back-to-back 50% heavy hits: the driver's detector flagged ~20 entries at F35 (t1-8, 11-16, 19-24...) but it matches the standing "50% forecast" text every turn, so it is unreliable. Consecutive actual charge hints: F35 t5 and t6 (t5 line "敵人蓄力中", t6 "首領蓄力中"); not verified as two heavy hits landing.
- (f) boss turns: F30 43 presses (~33 in-game turns); F35 59 presses (~46 in-game turns)
- (g) potions: start 13 (3 held + 10 bought), merchants 24 bought (driver count), drops 0 detected
- shots: qa-cp9-rc7-shots/death-blade-3.png

## blade 4 (build ecd2308, drv5.js + hit-pause patch)
- floor reached: 40 (died on F40 boss turn 12, "已通過 39 層"); death cause: 274 dmg (35% maxHP) from 守護・災厄・雷爪飛龍 at HP 31 after defending; potions exhausted (0 left; F40 t7+ hints "生命藥水已用完")
- death screen 「共受」: 第12回合共受 274 傷害 (35% max HP); last 3 turns -166/-30/-274
- in-fight drinks: 31 total, 0 at HP>=40% without lethal forecast; map drinks 3
- normal fights A vs non-A: A 74 / non-A 25
- boss press counts: F5 9, F10 6, F15 8, F20 17, F25 19, F30 30 (in-game turn ~26), F35 50 (in-game turn ~41), F40 16 (died turn 12)
- >=20% damage turns: warned 19 / unwarned 0; max single-turn 39.8%
- 「防禦也擋不住」: 3 (F40)
- (a) Z hinted while on cooldown: 0 hits, so no screenshots needed
- (b) banner vs decision contradictions: 0 by regex. Lethal-forecast hint order: Z>D normally; D-only when Z unavailable or after-defend survivable (F20 t4, F30 t3/t23, F31 t4, F33 t4/t9, F35 t3, F36 t4, F38 t4, F40 t3/t7/t9/t10 potions out). No interrupt-skill/S seen first.
- (c) revive text 「2 回合後重新蓄力」 yes at F5, F10, F15, F20, F30, F35 = 6 yes, 0 no. Next charge hints came 2 turns after revive (F30 revive t21 -> t23; F35 t28 -> t30). F25 had heavy hits at t4/t9/t14 with no revive (not a revive case).
- (d) Q/W/E same-turn repeats: 0
- (e) back-to-back 50% heavy hits: 0 detected by driver (detector was noisy in run 3, 0 entries this run)
- (f) boss turns: F30 30 presses (~26 in-game turns); F35 50 presses (~41 in-game turns)
- (g) potions: start 13 (3 held + 10 bought), merchants 18 bought (driver count), drops 0 detected
- shots: qa-cp9-rc7-shots/death-blade-4.png

## blade 5 (build ecd2308, drv5.js + hit-pause patch + fixed (e) detector)
- floor reached: 41 (died F41 normal fight, "已通過 40 層"); death cause: 風蹄甲蟲 168 dmg (20% maxHP) at HP 1, potions exhausted (0 left, "生命藥水已用完")
- death screen 「共受」: 第4回合共受 168 傷害 (20% max HP); last 3 turns -168/-114/-168
- in-fight drinks: 31 total, 0 at HP>=40% without lethal forecast; map drinks 4
- normal fights A vs non-A: A 73 / non-A 14 (driver counts, F20/F30 boss press counts partial)
- boss presses: F5 11, F10 10, F15 11, F20 5(+earlier), F25 18, F30 22 (in-game turn ~20), F35 54 (in-game turn ~42), F40 24 (turn ~17, revive t12)
- >=20% damage turns: warned 20 / unwarned 0; max single-turn 39.9%
- 「防禦也擋不住」: 0
- (a) Z hinted while on cooldown: 1 — F35 t11 (HP 1, sameTurnAsDrink=true): hint read right after the Z press in same counter turn; stale-hint race, screenshot qa-cp9-rc7-shots/bug-a-blade-5-F35-t11.png was taken a moment later (already t12, hint then correctly D only, "生命藥水冷卻中"). Not persistent.
- (b) banner vs decision contradictions: 0 by regex. Lethal-forecast hint order: Z>D normally; D-only when "防禦後撐得住，先不喝藥"/Z cooldown (F30 t3, F35 t3/t9, F40 t3/t9, F41 t2). No interrupt skill/S seen first.
- (c) revive text 「2 回合後重新蓄力」 yes at F5, F10, F15, F20, F30, F35, F40 = 7 yes, 0 no (F25 no revive).
- (d) Q/W/E same-turn repeats: 2 (F15 t4 Q + 1 earlier; may be driver retry after timeout)
- (e) fixed detector (heavy hit landed >=50% maxHP on consecutive boss turns): 0. No 50% hit landed this run at all.
- (f) boss turns: F30 ~20 in-game turns (22 presses); F35 ~42 in-game turns (54 presses)
- (g) potions: start 13 (3 held + 10 bought), merchants 21 bought, drops 0 detected
- shots: qa-cp9-rc7-shots/death-blade-5.png, bug-a-blade-5-F35-t11.png

## blade 6 (build ecd2308, drv5.js + hit-pause patch + fixed (e) detector)
- floor reached: 36 (died F36 normal fight, "已通過 35 層"); death cause: 炎眼術士 169 dmg (20% maxHP) at HP 1, potions exhausted (0 left)
- death screen 「共受」: 第6回合共受 169 傷害 (20% max HP); last 3 turns -169/-95/-169
- in-fight drinks: 25 total (+6 map drinks); 0 at HP>=40% without lethal forecast
- normal fights A vs non-A: A 75 / non-A 18
- boss presses: F5 9, F10 6, F15 8, F20 14 (turn ~12), F25 17 (turn ~13), F30 51 (in-game turn ~41), F35 27 (in-game turn ~24, revive t20)
- >=20% damage turns: warned 9 / unwarned 0; max single-turn 39.8%
- 「防禦也擋不住」: 0
- (a) Z hinted while on cooldown: 0 (driver paused on every hit)
- (b) banner vs decision contradictions: 0 by regex. Lethal-forecast hint order Z>D; D-only when Z unavailable or "防禦後撐得住" (F25 t4, F30 t3/t10, F33 t4, F35 t3, F36 t4). No interrupt skill/S seen.
- (c) revive: 「2 回合後重新蓄力」 yes at F5, F10, F15, F20, F25, F30 (t26), F35 (t20) = 7 yes, 0 no
- (d) Q/W/E same-turn repeats: 2 (F5 t4 W, F20 t9 Q; may be driver retries after timeouts)
- (e) fixed detector (landed >=50% maxHP hit on consecutive boss turns): 0; no 50% hit landed at all this run
- (f) boss turns: F30 ~41 in-game turns (51 presses); F35 ~24 in-game turns (27 presses)
- (g) potions: start 13 (3 held + 10 bought), merchants 18 bought, drops 0 detected
- shots: qa-cp9-rc7-shots/death-blade-6.png

DONE rc12q+rc12r
# rc12q QA — blade (user asked blade 1-2). Badge `build 3ccb63a · CP4…CP9` (5375; badge shot bl1-badge-3ccb63a.png). Driver drvRC12q.js = drvRC12p + per-turn `estturn` log (★下回合估計 vs actual; flags charging / 暈眩解除) + `estSpecial` screenshot (>20% mismatch on charging or stun-recover turns). Saves qa-saves/rc12q-blade-N-end.json. 13 potions, 4x, skip anim, ★ only. 已驗證 unless 推測.
Note: `estturn` can only be logged on turns where ★ text shows 「下回合…估計 X」; blade usually shows it only on charge/danger turns, so few boss turns have an estimate.

## bl1
| item | value |
|---|---|
| End | **death F58, normal fight** (炎骨蠍 蓄力一擊 419 = 40% max HP at HP 1, 0 potions) |
| How died | F58: t14 A HP577; t15 D; t16 D HP210; t17 D; t18 A HP1 (0 pots, ★ "必敗"); t19 A; t20 炎骨蠍 charge 419 killed |
| F30+ boss turns (F30,35,40,45,50,55) | 3,3,10,8,1,3 |
| Boss potions pot start→end (HP start→min) | F30 11→12 (874→707); F35 12→13 (874→631); F40 11→11 (831→874); F45 9→10 (831→396); F50 9→10; F55 9→10 — i.e. 0 net drunk, boss gives +1 each |
| 保底 / boss reward | F25,F30.. 藥水×1 (F5-20 ×0); 保底 優良(F5-15) 精良(F20-25) 華麗(F30) 傳說(F35+) |
| Potions: boss-given vs merchant | boss-given 7 (F25-55); merchant 1 (F57, at 1 potion; F19-54 bought 0); normal/elite/chest: none (已驗證) |
| ckpt | 10\|13\|796/838; 20\|11\|798/838; 30\|11\|874/874; 40\|11\|831/874; 50\|9\|1049/1049 |
| Max hit / max turn | 419 = 39.9% / 419 = 39.9% (F53 t1) — none over 40/50 |
| Z cooldown max | 1 |
| ★ keys on telegraphs | D39 A15 Q4 Z4 E1 |
| ★ estimate vs actual (est20, >20% over) | F36 t8 est174 act349 (+101%, enemy charging) shot bl1-est20-F36-t8-est174-act349; F46 t2 est174 act349 (+101%, charging) shot bl1-est20-F46-t2-est174-act349 — ★'s 「下回合全體暴擊估計」 omits the charge hit; the same panel shows 預估傷害 349 |
| Boss-fight turns with charging/stun-recover mismatch >20% | 0 genuine (F40 t10 flagged est305/act0 = boss died that turn, driver false positive fixed; 暈眩解除 turns: 0 logged) |
| Feel (推測) | 2.5/5 — no big boss threat (bosses 1-10 turns), died to a normal-fight charger at 0 potions |

## bl2
| item | value |
|---|---|
| End | **death F51, normal fight** (風冠精靈 蓄力一擊 349 = 40% at HP 1, 0 potions), one floor after clearing F50 boss |
| How died | F51: t16 A HP483; t17 D; t18 D HP178; t19 D; t20 A HP1 (0 pots); t21 A; t22 charge 349 killed |
| F30+ boss turns (F30,35,40,45,50) | 5,3,7,17,13 |
| Boss potions pot start→end (HP start→min) | F30 13→13 (744→585); F35 13→14 (791→522); F40 11→11 (786→661); F45 10→9 (831→496); F50 5→3 (612→874) — potions drunk ≈ 1-2 in long fights, +1 reward each |
| 保底 / boss reward | 藥水×1 from F25 (×0 F5-20); 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35-50; F50 reward screen shot bl2-F50-boss-reward-screen |
| Potions: boss-given vs merchant | boss-given 6 (F25-50); merchant 1 (F49, 4→5; F17-37 bought 0 while holding 13); normal/elite/chest: none (已驗證) |
| ckpt | 10\|13\|707/820; 20\|13\|820/820; 30\|13\|744/826; 40\|11\|786/826; 50\|5\|612/874 |
| Max hit / max turn | 349 = 39.9–40.0% / 349 = 39.9% (F43 t1) — none over 40/50 |
| Z cooldown max | 1 |
| ★ keys on telegraphs | D33 A11 Q3 Z4 E1 W1 |
| ★ estimate vs actual, every boss turn with an estimate (est→actual) | F40 t7 A 330→0 (C); F45 t1 D 437→305 (C, -30%); F45 t8 Z 203→0; F45 t10 D 383→200 (C, -48%); F45 t14 Z 383→339 (C, -11%); F50 t1 D 437→305 (C, -30%); F50 t9 A 349→326 (C, -7%); F50 t13 W 349→0 (boss died) |
| Mismatches >20% on charging turns (screenshots) | 3: bl2-estSpecial-F45-t1-est437-act305-charging, bl2-estSpecial-F45-t10-est383-act200-charging, bl2-estSpecial-F50-t1-est437-act305-charging — all OVER-estimates (★ estimate > actual because D/parry reduced the charge); no under-estimate in bl2 |
| 暈眩解除 (stun-recover) turns | 0 observed in blade runs (no boss stun/recover text logged) |
| Feel (推測) | 2.5/5 — same pattern as bl1: potions never the issue until F50, died right after boss to a normal-fight charger with 0 potions |

## Summary rc12q blade (badge 3ccb63a)
| run | end | F30+ boss-turn median | max hit | max turn | potions at death | boss-given | merchant | charging est mismatch >20% |
|---|---|---|---|---|---|---|---|---|
| bl1 | death F58 normal fight | 3 (3,3,10,8,1,3) | 419=39.9% | 419=39.9% | 0 | 7 | 1 | est20 under-estimates x2 (F36 t8, F46 t2: est174 act349, +101%) |
| bl2 | death F51 normal fight | 7 (5,3,7,17,13) | 349=40.0% | 349=39.9% | 0 | 6 | 1 | over-estimates x3 (F45 t1, F45 t10, F50 t1: −30%/−48%/−30%) |
Median end floor blade: 54.5 (58, 51). Neither run died in a boss fight; both died at 0 potions in a normal fight to a 蓄力一擊 equal to exactly 40% max HP. No hit >40%, no turn >50%. Findings (已驗證): (a) ★'s 「下回合全體暴擊估計」 on bl1 omitted the charge hit (174 vs 349 actual) on two turns; (b) on bl2 D-defended charge turns the estimate was 30-48% above actual. 暈眩解除 turns never appeared (0). Driver false positives (boss-killed turns est→0) fixed (sum>0 guard).
Files: qa-saves/rc12q-blade-1-end.json, -2-end.json; shots in qa-cp9-rc12q-shots/.

## bl3 (rc12q, badge 3ccb63a)
| item | value |
|---|---|
| End | **death F48, normal fight** (雷骨飛蛾 蓄力一擊 340 = 40% at HP 1, 0 potions) |
| How died | F48: t8 A HP469; t9 D; t10 D HP172; t11 D; t12 A HP1 (0 pots); t13 A; t14 charge 340 killed |
| F30+ boss turns (F30,35,40,45) | 4,8,1,1 |
| Potions per boss fight (Z presses counted in-fight) / pot start→end | F30 Z0, 11→12; F35 Z1, 11→11; F40 Z0, 10→11; F45 Z0, 5→6 (end−start = +1 reward − Z presses) |
| 保底 / reward | 藥水×1 from F25 (×0 F5-20); 保底 優良→精良(F20-25)→華麗(F30)→傳說(F35+) |
| Potions boss-given vs merchant | boss-given 5 (F25-45); merchant 2 (F44 4→5, F47 0→1); normal/elite/chest none; most potion drain (10→5 F40→F45, 5→0 by F48) happened in NORMAL fights/elites, not bosses (已驗證) |
| ckpt | 10\|13\|773/832; 20\|12\|832/832; 30\|11\|832/832; 40\|10\|583/832 |
| Max hit / max turn | 340 = 40.0% / 332 = 39.9% (F38 t1) |
| Z cooldown max | 1 |
| ★ keys on telegraphs | D54 A14 Q1 Z3 |
| ★ est vs actual (boss turns with estimate) | F35 t7 D est415 act0 (charging, blocked fully) — no >20% mismatch flagged (0 = nothing taken, over-estimate by defense); no 暈眩解除 turns |
| Feel (推測) | 2/5 — shortest run; bosses trivial (1-8 turns) yet potions bleed in normal fights, dies at F48 |

## bw1 (rc12q, badge 3ccb63a)
| item | value |
|---|---|
| End | **RETREAT F97** — ★ itself recommended: `🧭 HP 10%、生命藥水 0 瓶（≤ 1）：建議撤退回城（保留 100%）` (HP 104/1025; retreatStar event). No death; F100 not reached. Last fight F96 survived at HP 1 with 0 pots (t14 D HP71, t15 D HP4, t16-19 A/Q/A/W at HP 1) |
| F30+ boss turns (F30..F95 step 5) | 2,4,5,10,5,3,4,10,17,14,17,17,14,8 |
| **Potions used per boss fight (Z presses) / pot start→end** | F30 Z0 12→13; F35 Z0 12→13; F40 Z0 12→13; F45 Z1 12→12; F50 Z1 12→12; F55 Z0 11→12; F60 Z0 12→13; F65 Z1 11→11; F70 Z3 11→9; F75 Z2 8→7; F80 Z2 3→2; F85 Z2 3→2; F90 Z1 1→1; F95 Z1 1→1 (end−start = +1 boss reward − Z) |
| Potion use F30-65 vs F70+ | F30-65 bosses: 0-1 Z per boss (total 4 over 8 bosses); F70+: 1-3 Z per boss (total 11 over 6 bosses); boss turns 2-10 → 14-17 |
| Boss reward / 保底 | 藥水×1 from F25 on every boss (15 total, F25-95) — exactly 1 each, never more; 保底 精良 F20-25, 華麗 F30, 傳說 F35-F95 |
| Potions: boss-given vs merchant | boss-given 15; merchant 6 (F79,82,84,89,92,94: 1 each, all at ≤2 potions held); merchants F2-64 bought 0 while holding ≥11; normal/elite/chest: none (已驗證, 17 chests list no 生命藥水) |
| Where potions drained | F30-F65 held 11-13 (boss rewards ≈ Z use); F65→F80 12→3: mostly normal fights/elites (not bosses); F80+ ≤3 potions |
| ckpt | 10\|13\|748/748; 20\|13\|568/760; 30\|12\|743/950; 40\|12\|664/950; 50\|12\|882/950; 60\|12\|973/973; 70\|11\|1025/1025; 80\|3\|412/1025; 90\|1\|1025/1025 |
| Max hit / max turn | 410 = 40.0% (7 distinct) / 475 = 50.0% F38 t1 (Z turn; exactly at line, not over) |
| Z cooldown max | 5 (F85 boss; F80 4) — first cooldown text shot bw1-F20-first-cooldown-text |
| Key counts (all decisions) | A207 D144 Q66 W34 Z34 E11 |
| ★ estimate vs actual, boss/charge turns | 88 boss turns carried an estimate; 0 under-estimates (actual >120% est). 14 over-estimates >20% on charging turns (bulwark blocks/parries: e.g. F25 t4 234→47, F35 t1 475→62, F40 t1 475→48, F45 t7 475→3, F55 t1 479→22, F65 t3 468→304, F80 t7 513→334, F85 t1 513→358, F90 t1 513→259); 5 screenshots: bw1-estSpecial-F25-t4/F35-t1/F40-t1/F45-t7 (+ cap, rest logged only). Estimate is a worst-case no-defense number; actual after D/parry is 3-70% of it. |
| 暈眩解除 turns | 0 observed |
| Feel (推測) | 3.5/5 — long boss fights F70+ (14-17 turns, Z 1-3/boss, cd up to 5), steady growth, reaches F97 by retreat not death; potion starvation from F80 |

## Summary rc12q blade 3 + bulwark 1
| run | end | F30+ boss-turn median | max hit | max turn | potions at end | boss-given | merchant |
|---|---|---|---|---|---|---|---|
| bl3 | death F48 normal fight (雷骨飛蛾 340=40%) | 4 (4,8,1,1) | 340=40.0% | 332=39.9% | 0 | 5 | 2 |
| bw1 | retreat F97 (★ recommended) | 8 (2,4,5,10,5,3,4,10,17,14,17,17,14,8) | 410=40.0% | 475=50.0% (at line) | 0 | 15 | 6 |
Cumulative rc12q blade median end floor: F51 (58, 51, 48). No hit >40%, no turn >50%. Files: qa-saves/rc12q-blade-3-end.json, rc12q-bulwark-1-end.json.

## rc12q bulwark 2 (bw2)
- **End: DEATH F65 boss fight** (炎鋼地龍, 第21回合 蓄力一擊 416 = 39.96% of 1041 maxHP; HP was 1, 0 potions; ★ had said 「此戰幾乎必敗」). Not >40%. Shot: bw2-death-F65-416-dragon.png. Save: qa-saves/rc12q-bulwark-2-end.json
- F30+ boss turns: F30 4, F35 4, F40 14, F45 17, F50 21, F55 9, F60 8, F65 21(death). Median 11.5 (F30-65 only; no F70+ reached).
- Z (potions) per boss: F40 1, F50 4, F55 1, F65 ≥1 (event lost in interrupted call) ; others 0. Boss reward 藥水×1 each F25-F60 (保底 精良 F25, 華麗 F30, 傳說 F35-60). Merchant buys: 7 (F47–F64, 1 each, only when ≤7 held). Potions fell 13→0 by F64 (boss fights F50 used 4).
- Max hit 416 = 39.96% (many non-boss charges at exactly 416, all blocked/parried except death); max turn: 416 (single charge turn). 估計 vs 實際: 47 boss-turn estimates, 0 under-estimates >20%. Z cooldown max 2 (F55).
- Caveat: F10-F60 ckpt events and F65 drink event lost (helper interrupt/flush) — approximated, 推測.
- Feel (推測): 2.5/5 — potion starvation by F52, 21-turn F50 boss, death to a blockable charge at HP 1.
- **New turnsync logging (from F65 t12; for bw3 full run)**: per turn: turn_read (panel turn when ★ read) , turn_pre (re-read right before click), turn_post (after click resolved). Busy signals checked immediately before click: `.cmdbar` class != "cmdbar", `.cmdbar button[disabled]` count, absence of `button[data-primary]`, plus anim_nodes count (class contains float/shake/anim/fx, info only). In 10 bw2 samples: busy_flag never true, turn_read==turn_pre always, turn_post=turn_pre+1 always.

## bw3 — NOT RUN
5375 went down (connection refused) after bw2 ended (F65 death). bw3 not started; port 5376 now answers (different build, not tested). drvsrv.py stopped.

## rc12r (5376)
Header: rc12r — build badge `432ab2c` (http://localhost:5376/), hv-v3 confirmed (title HV-v3 · 試煉之塔)
Blade and bulwark 1-2 were run on rc12q (see qa-cp9-rc12q.md). Here: bulwark 3, oc 1. Method as rc12q (13 potions, 4x, skip anim, ★ only), turn-sync (turn_read/turn_pre/turn_post/busy) every turn, events flushed to rc12r-evflush.jsonl.

(Producer/dev: rc12r results live in this section; separate qa-cp9-rc12r.md kept only as a stub.)

### rc12r (5376) — bulwark 3 (bw3), build 432ab2c
(Header: blade + bulwark 1-2 were run on rc12q above; results of rc12r here. A stub qa-cp9-rc12r.md points here.)
| item | value |
|---|---|
| **End** | **CLEARED F100 boss** (no death, no retreat). Save qa-saves/rc12r-bulwark-3-end.json; shot bw3-F100-clear-reward.png (保底 傳說) |
| Boss turns F30..F95 | 11,24,6,9,27,16,7,16,11,2,5,24,27,11 (median 11; F30-65: 11,24,6,9,27,16,7,16 → 13.5 ; F70-95: 11,2,5,24,27,11 → 11); F100 turns not captured |
| Z presses per boss (fightEnd) / pot start→end | F30 2 (11→10), F35 3 (10→8), F40 0 (8→9), F45 1 (7→7), F50 3 (6→4), F55 2 (2→1), F60 1 (1→1), F65 1, F70 1, F75 0 (1→2), F80 1, F85 1, F90 0 (1→2), F95 1 (end−start = +1 reward − Z) |
| Boss reward / 保底 | 藥水×0 F5-F20; ×1 every boss F25-F100 (16, never more). 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35-F100 |
| Potion sources | boss-given 16; merchant bought 21 (1 each at F44,47,49,52,54,59,62,64,67,69,72,74,79,82,84,87,89,92,94,97,99; none bought F4/19/34 while holding ≥8); normal/elite fights: none (no non-boss potGain); 11 chests: none contain 生命藥水 (已驗證) |
| Potion trend | held 13 → 10 (F35) → 7-8 (F45) → 2 (F55) → 0-1 from F58 on (potions starved from F55; a lone-potion economy F60-F100) |
| ckpt (boss-start pot/HP from fightEnd; separate ckpt events not emitted this run) | F30 11/807 F35 10/1123 F40 8/807 F45 7/1123 F50 6/1123 F55 2/786 F60 1/618 F65 1/786 F70 1/581 F75 1/581 F80 1/523 F85 1/551 F90 1/613 F95 -/348 (HP/maxHP 1025-1156; gold not captured) |
| Max hit / turn | 462 = 40.0% (h40 rows: 449×34, 462×26; all exactly 40.0%, none over); max single-turn 497 (<50% of 1156 = 43%) |
| Z cooldown max | 2 (F50) |
| ★ estimate vs actual (boss turns) | 129 boss-turn estimates, 0 under-estimates in estturn (actual >120% est, charge/recover turns). 14 estSpecial shots (over-estimates, blocked/parried charges). 暈眩解除: 0 observed. |
| **est20 flags (4)** | F43 t2 (K=Z, HP 201/1123), F58 t4 (K=D, HP 85), F58 t8 (K=D, HP 57), F81 t2 (K=Z, HP 153): ★ estimate 224/224/224/231 vs a 449/449/449/462 charge hit logged as [第 N 回合] (exactly 2× the estimate = estimate looks like the 防禦後 half value; actual hit arrived undefended). Screens: bw3-est20-F43-t2-est224-act449.png, bw3-est20-F58-t4-..., -F58-t8 (shot saved: F43,F58 t4,t8 images in shots/ ). 已驗證 values; cause 推測. |
| **Turn-sync (every turn from F1)** | 633 turnsync events over 60 floors. turn_read == turn_pre on 100%; busy_flag (cmdbar class != cmdbar / button[disabled] / no button[data-primary]) true 0 times → app never busy when clicked. turn_post missing (None, panel gone: fight ended) on 56; of 577 with turn_post: 563 advanced exactly +1, **14 did not advance** (turn_post==turn_pre): 11× S (靈動架勢, free action), 2× Q (F40 t6, F50 t27), 1× W (F41 t6) → candidate dropped/non-turn keys (Q/W may be a boss-kill resolving, 推測). anim_nodes signal dropped mid-run (it slowed each click ~2s). |
| **蓄力預告！排隊指令已取消 toast** | counted 0 in bw3: text never seen in any body read (pre-click or post-click, 633 turns). The toast may be transient (shorter than my read interval) → count is a lower bound, 推測; no screenshots taken. |
| Key counts (turnsync) | A300 D84 Q70 Z47 W38 E27 S11 |
| Feel (推測) | 3/5 — F100 cleared but potion-starved from F55, 24-27-turn bosses at F35/F50/F85/F90, 40%-exact charge hits constant |

### rc12r (5376) — oc 1 (oc1), build 432ab2c
| item | value |
|---|---|
| **End** | **RETREAT F72** — ★ itself recommended 「建議撤退回城（保留 100%）」 on the F72 map (HP 90/888, 0 potions); driver clicked it, confirm accepted. No death. Shot oc1-retreat-F72.png; save qa-saves/rc12r-oc-1-end.json (Lv13→17, 83 items kept) |
| Boss turns F30..F70 | 15,3,11,30,30,18,4,20,6 (median 15; F30-65 median 15; F70 6) |
| Z per boss / pot start→end | F30 3 (10→8), F35 0 (8→9), F40 1 (9→9), F45 5 (8→4), F50 5 (5→1), F55 2 (2→1), F60 0 (2→3), F65 3 (3→1), F70 1 (1→1) |
| Boss reward / 保底 | 藥水×0 F5-F20; ×1 every boss F25-F70; 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35-F70 |
| Potion sources | boss-given 10; merchant bought 8 (1 each F47,49,52,54,57,59,62,64,67,69 when holding ≤4; 0 bought F4-F44 holding ≥8); normal/elite: none; 10 chests: none with 生命藥水 |
| Potion trend | 13 → 8-10 (F30-F44) → 5 (F50, two 30-turn bosses used 10 Z) → 0-2 from F52; OC starves earlier than bulwark bw3 (pot 1 at F60-95 only because bw3 had a long retreat-free run) |
| ckpt (boss-start pot/HP) | F30 10/852 F35 8/852 F40 9/852 F45 8/852 F50 5/659(876) F55 2/614 F60 2/876 F65 3/614 F70 1/308 |
| Max hit / turn | 355 = 39.98% (maxHP 888, F71), 350 = 39.95% (876); none >40%; max single-turn est-actual 434 |
| Z cooldown max | 1 |
| ★ estimate vs actual | 83 boss-turn estimates; 1 under-estimate >20%: F30 t14 est 170 vs actual 340 (K=Z, HP 138/852); est20 flags: F30 t14 (Z, 170→340), F58 t4 (Z, 175→350, HP 46/876), F68 t2 (Z, 175→350, HP 133/876) — all exactly 2× est and all with ★=Z at HP<16% (same pattern as bw3: estimate = half of the charge hit that landed) ; 暈眩解除: 0 |
| Turn-sync | 315 events from F1: turn_read==turn_pre 100%; busy_flag 0; turn_post None 40 (fight ended); 275 with post: turn_post==turn_pre on 5 (2×S, 1×A, 1×Q, 1×E) ; no other jump. |
| 蓄力預告！排隊指令已取消 | counted 0 (text never appeared in any body read) — lower bound, 推測; no screenshots |
| Key counts | A128 D60 Q40 Z33 W27 E25 S2 |
| Feel (推測) | 2.5/5 — potion starvation from F50, two 30-turn bosses at F45/F50, retreat F72 |

## rc12r (5376) summary
| run | end | F30+ boss-turn median | max hit | potions at end | boss-given | merchant |
|---|---|---|---|---|---|---|
| bw3 | CLEAR F100 | 11 | 462 = 40.0% | 1 | 16 | 21 |
| oc1 | retreat F72 (★) | 15 | 355 = 39.98% | 0 | 10 | 8 |
No hit >40%, no turn >50%. Note: drvsrv.py stopped. 排隊指令已取消 never observed (0).

### rc12r (5376) — oc 2 (oc2), build 432ab2c
| item | value |
|---|---|
| **End** | **DEATH F45, boss fight** (鐵壁狂戰・塔主・霜翼熊 重擊 130 = 16% of 792 maxHP, turn 41; HP 1, 0 potions; 死因 text: 「最後是蓄力大招（16%）… 此戰幾乎必敗」). Shot oc2-death-F45-boss.png; save qa-saves/rc12r-oc-2-end.json |
| Boss turns | F20 ≥28 (5 Z), F30 4, F35 21, F40 19, F45 41 (death) → F30+ median 20 |
| Z per boss / pot start→end | F20 5, F30 0 (6→6 start 5), F35 3 (6→4), F40 3 (5→3), F45 ≥4 (4→0) |
| Boss reward / 保底 | 藥水×0 F5-F20; ×1 F25-F40 (4 total); 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35-40 |
| Potion sources | boss-given 4; merchant bought 5 (F24,34,39,42,44, 1 each at ≤5 held; F4-9 held 12-13: 0); normal/elite: none; 8 chests: none |
| ckpt (restored: pot, HP/maxHP) | F10 12 792/792; F20 10 792/792; F30 5 792/792; F40 5 506/792 (gold field blank: regex fixed after this run) |
| Max hit / turn | 316 = 39.9% (792); no hit >40%; max turn est-actual 396 (50.0% of 792 = 396 → at line, not over, 推測 from estturn actual) |
| Z cooldown max | 1 |
| ★ estimate vs actual | 69 boss-turn estimates, 0 under-estimates >20%; **est-half (est20) cases: 0**; 5 estmis (actual > shown 預估 high: F20 t1 247 vs 155, F20 t10 239 vs 155, F20 t21 202 vs 111, F20 t25 219 vs 111, F45 t18 191 vs 139; multi-attacker turns incl. minions) — one shot oc2-estmis-F20-t1 |
| Turn-sync | 197 events from F1: read==pre 100%, busy_flag 0; post None 22; post==pre on 3 (A, Q, W) |
| 排隊指令已取消 | 0 seen. MutationObserver impossible: addInitScript/evaluate are blocked by the Playwright proxy (policy_denied), so I poll body text every ~60 ms in the post-click wait loop + pre-click read (catches flashes ≥~100 ms) |
| Key counts | A76 D54 Q25 Z22 W12 E8 |
| Feel (推測) | 2/5 — potions gone by F45; 41-turn boss; death at F45 |

### rc12r (5376) — oc 3 (oc3), build 432ab2c
| item | value |
|---|---|
| **End** | **DEATH F50, boss fight** (turn 43, last hit 霜牙殭屍 45 at HP 1, 0 potions; turn 42 took 213 from 霜角巨人 charge; 「HP 被慢慢磨光」). Shot oc3-death-F50-boss.png; save qa-saves/rc12r-oc-3-end.json |
| Boss turns | F30 4, F35 24, F40 3, F45 9, F50 43 (death) → F30+ median 9 (mean 16.6) |
| Z per boss / pot start→end | F30 0 (7→8), F35 4 (8→5), F40 0 (6→7), F45 2 (8→7), F50 6 (7→0) |
| Boss reward / 保底 | 藥水×0 F5-F20; ×1 F25-F45 (5); 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35-45 |
| Potion sources | boss-given 5; merchant bought 5 (F39,42,44,47,49 1 each at ≤7 held; F4-34 held ≥8: 0); normal/elite: none; 7 chests: none |
| ckpt (pot, HP/maxHP; gold blank) | F10 12 834/834; F20 9 780/834; F30 7 834/834; F40 6 668/852; F50 7 597/852 (gold regex returned empty in all 3 rerun runs) |
| Max hit / turn | 340 = 39.9% of 852 (11 rows); none >40%; max turn est-actual 340 |
| Z cooldown max | 1 (first cooldown text F5, shot oc3-first-cooldown-text-F5.png) |
| ★ estimate vs actual | 57 boss-turn estimates, 0 under-estimates, 0 est20, 0 estmis |
| Turn-sync | 196 events from F1: read==pre 100%, busy 0, post None 24, post==pre on 5 (3 A, 2 W) |
| Feel (推測) | 2/5 — potions 7→0 inside one 43-turn F50 boss |

### rc12r (5376) — CORRECTION (dev, verified) + summary
- **The 7 "estimate = half" cases (bw3 F43 t2, F58 t4, F58 t8, F81 t2; oc1 F30 t14, F58 t4, F68 t2) were a turn-alignment error in our driver, not game bugs.** The big hit shown in the log at read time landed on the turn BEFORE the decision; the decision turn itself took 0 (the logs show "第 N+1 回合：造成 0，受到 0" right after the Z/D press). The earlier "174 vs 349" case (rc12q) is the same misalignment. Retract the flags and the 'under-estimate' wording about them above (incl. oc1's one "under-estimate" F30 t14 170→340).
- Driver fix: drvRC12r.js estturn events now also carry `actual_aligned` = 受到 X of the summary line `第 (N+1) 回合：…受到 X` where N = turn when ★ estimate was read (the turn the click resolves). Applies from the next run; existing runs' `actual` field is the old misaligned value and the raw log text isn't retained for a re-computation (upper-bound/unknown, 推測) — the oc2/oc3 est20/estSpecial counts are therefore also unaligned.
- Queue-cancel: per dev, can't fire when we press only on an idle app; count `[data-queuedrop]`/`[data-queuedroplog]` if present (not on 5376 yet — 0 text hits for 「排隊指令已取消」 in 4 runs ≈1,350 turns; MutationObserver not possible: addInitScript/evaluate blocked by proxy, so I polled body text each ~60 ms instead). Not forced.
| run | end | F30+ boss-turn median | max hit | potions at end | boss-given / merchant |
|---|---|---|---|---|---|
| bw3 | CLEAR F100 | 11 | 462 = 40.0% | 1 | 16 / 21 |
| oc1 | retreat F72 (★) | 15 | 355 = 39.98% | 0 | 10 / 8 |
| oc2 | death F45 boss | 20 | 316 = 39.9% | 0 | 4 / 5 |
| oc3 | death F50 boss | 9 | 340 = 39.9% | 0 | 5 / 5 |
OC median end floor: F50 (72, 45, 50). Both OC deaths came in 41-43-turn boss fights after potions ran out. Files: qa-saves/rc12r-oc-{1,2,3}-end.json, rc12r-bulwark-3-end.json. drvsrv.py stopped.

### rc12r (5376) — arcane 1 & 2 (ar1, ar2), build 432ab2c
Gold regex fixed: the 「本趟：EXP … · N C」 header is only on map screens, so ckpt gold = value from the last map screen (≤1 floor stale; `gold_src` field in data). Estimate comparison: `estturn.actual_aligned` (=受到 of the 第(N+1)回合 summary) is logged but found only on 13 (ar1) / 8 (ar2) turns; old-aligned `actual` still in events (misaligned values ⇒ est20 events in ar1 (F41 t4 229→400, F68 t2 252→506, F71 t2 255→511; all K=Z at HP<22%) are the same dev-confirmed alignment artefact, NOT bugs). 
| item | ar1 | ar2 |
|---|---|---|
| **End** | **CLEARED F100** (no death) | **RETREAT F81** (★ recommended, 1 potion left; Lv14→18) |
| F30+ boss turns | F30..F95: 3,5,8,7,9,8,11,9,7,23,18,21,21,26 (median 9; F30-70 ≈ 7-11, F75+ 18-26) | F30..F80: 5,11,11,15,6,14,12,6,12,16,33 (median 12) |
| Z per boss | F30-70: 0-1 each; F75 5, F80 2, F85 2, F90 2, F95 3, F100 2 | F30 1, F35 2, F40 2, F45 2, F50 1, F55 2, F60 1, F65 1, F70 2, F75 2, F80 7 (7→1) |
| Boss start HP/maxHP | F30 1095/1095, F35 1113/1118, F40 1135/1140, F45 1158/1163, F50 1175/1185, F55 1181/1208, F60 1220/1230, F65 1248/1253, F70 1270/1275, F75 1293/1298, F80 918/1320, F85 1462/1471, F90 1199/1496, F95 1511/1521 (maxHP 1095→1521, +39%) | F30 875/876, F35 890/894, F40 908/912, F45 732/930, F50 944/948, F55 958/966, F60 976/984, F65 998/1002, F70 705/1020, F75 1031/1038, F80 623/1056 (maxHP 876→1056, +21%) |
| Main hand at boss start | 精良・毀滅之極寒鐵木杖 at every boss F30-F95 (never upgraded) | F30 普通・烏木杖; F35-40 精良・織咒者之烈焰柳木杖; F45-F80 優良・毀滅之鐵木杖 |
| Staff lines | 魔力合流 13, 以太分流 10 (staff2 events) | 魔力合流 4, 以太分流 6 |
| Spell keys / key counts | 1:73 2:62 3:27 4:12 5:14 6:33 A43 D55 Q38 Z36 | 1:55 2:39 3:28 4:7 5:20 6:9 A42 D33 Q12 Z33 |
| Boss reward / 保底 | 藥水×1 each F25-F100 (16); 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35+ | ×1 each F25-F80 (12); same 保底 ladder |
| Potion sources | boss 16; merchant bought 8 (F79,82,84,89,92,94,97,99, all at ≤6 held; 0 bought when ≥11); normal/elite/chests none (15 chests) | boss 12; merchant bought 9 (F42,44,47,59,62,69,74,77,79 at ≤7); none from normal/elite/chests (10 chests) |
| ckpt pot / HP / gold | F10 13 876/876 677C; F20 12 1095/1095 3130C; F30 10 1095/1095 8049C; F40 12 1135/1140 15476C; F50 11 1175/1185 24791C; F60 11 1220/1230 36180C; F70 12 1270/1275 46991C; F80 7 918/1320 62902C; F90 7 1199/1496 78162C; F100 3 1076/1545 93977C | F10 13 876/876 783C; F20 11 876/876 3925C; F30 8 875/876 9389C; F40 7 908/912 15610C; F50 8 944/948 22967C; F60 8 976/984 33444C; F70 8 705/1020 45632C; F80 7 623/1056 59501C |
| Max hit / max turn | 614 = 40.0% of 1536 (h40 rows 511-614, none >40%); max turn 649 est-actual (<50%) | 422 = 39.9% of 1056; max turn 386 |
| Z cooldown max | 1 | 1 |
| ★ estimate vs actual | 65 boss-turn estimates, 0 under-estimates; 3 est20 = alignment artefacts (see above) | 49 estimates, 0 under, 0 est20 |
| Turn-sync | 393 events from F1; read==pre 100%; busy_flag 0; post None 48; post==pre on 12 (7×key 1, 2×key 2, 2×A, 1×Q) | 278 events; read==pre 100%; busy 0; post None 37; post==pre on 11 (5×1, 3×2, 2×3, 1×A) |
| 排隊指令已取消 | 0 | 0 |
| Feel (推測) | 4/5 — clean clear, strongest growth (maxHP +39%), potions steady 10-12 until F75 | 3/5 — weaker gear/HP, 7 Z on the 33-turn F80 boss, retreat F81 |
| Files | shots ar1-first-cooldown-text-F16, ar1-F100-clear-reward, ar2-retreat-F81; saves qa-saves/rc12r-arcane-{1,2}-end.json | |

#### rc12r (5376) summary (all runs)
| run | end | F30+ boss-turn median | max hit | potions at end | boss / merchant potions |
|---|---|---|---|---|---|
| bw3 | CLEAR F100 | 11 | 462 = 40.0% | 1 | 16 / 21 |
| oc1 | retreat F72 (★) | 15 | 355 = 39.98% | 0 | 10 / 8 |
| oc2 | death F45 boss | 20 | 316 = 39.9% | 0 | 4 / 5 |
| oc3 | death F50 boss | 9 | 340 = 39.9% | 0 | 5 / 5 |
| ar1 | CLEAR F100 | 9 | 614 = 40.0% | 1 (3 at F100 start +1 reward) | 16 / 8 |
| ar2 | retreat F81 (★) | 12 | 422 = 39.9% | 1 | 12 / 9 |
No hit >40%, no turn >50%. drvsrv.py stopped.

### rc12r (5376) — arcane 3 (ar3), build 432ab2c
Driver change before ar3: after each click the driver now polls (≤30×60 ms, HP-changed fallback only after ≥14 polls) for the 「第 N+1 回合：…受到 X」 summary and stores it as `turnsync.aligned` / `estturn.actual_aligned` (+ `al_how`, `al_polls`).
- **Alignment coverage (ar3):** turns with a ★ estimate 61 → aligned value found on 44 = **72%**; excluding 8 turns where the fight ended on the click (no next summary exists) = 44/53 = **83%**. The 9 misses are Z/D turns where HP changed but no N+1 summary line appeared in time (`hp_changed_no_summary`). Over all turns: 83/178 summary, 52 hp_changed, 34 fight_ended, 9 none. Boss `estturn` rows: 9/17 aligned. Before the fix: ar1 13, ar2 8 aligned.
- Aligned comparison (est ≥50, 9 turns): 7 differ by >20%, **all over-estimates** (actual < ★ crit-max estimate, e.g. F35 est 447 vs 312, F30 350 vs 165, F15 438 vs 195/199); **0 under-estimates**, no est20 bug.
- **End: RETREAT F57** (★ itself recommended: 「HP 10%、生命藥水 0 瓶（≤ 1）：建議撤退回城」, HP 98/973, 0 potions; Lv14→16, power 587→753). Not boss; F56 was a 24-turn normal fight that took HP to 1 with potions already 0.
- F30+ boss turns: F30 6, F35 11, F40 2, F45 8, F50 7, F55 14 (median 7.5). Z per boss: F30 1, F35 2, F40 0, F45 2, F50 1, F55 2.
- Boss start HP/maxHP: F30 876/876, F35 886/894, F40 875/912, F45 926/930, F50 706/948, F55 962/966; maxHP 876→973. Main hand: F30 精良・蘇爾特之極寒紅木杖 (auto-swapped at F20), F35+ 華麗・弗雷之烈焰紅木杖 (auto-swapped F30).
- Staff lines: 魔力合流 10, 以太分流 7. Max hit: 351 charge at F45 boss = 37.7% of 930 (no ≥39% h40 event); no turn >50%. Z cooldown max 1.
- Boss reward: 藥水×1 each F25-F55 (7), 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35+. Merchant bought 5 (F24, 37, 47, 49, 52; at ≤7 held). No potions from normal/elite/chests (7 chests). Potions at end 0.
- ckpt pot / HP / gold: F10 12 876/876 821C; F20 7 876/876 3463C; F30 7 876/876 8375C; F40 7 875/912 14684C; F50 8 706/948 22628C.
- Turn-sync: 178 events, read==pre 100%, busy_flag 0, post==pre+1 on every logged turn, 排隊指令已取消 0.
- Feel (推測): 2/5 — potions 12→7 by F20 and never recovered, weak growth (maxHP +11%), retreat at F57.
- Saves qa-saves/rc12r-arcane-3-end.json.

## FINAL — all 12 runs (rc12q 3ccb63a = 3ccb63a; rc12r = 432ab2c)
| run | build | end floor / type | F30+ boss-turn median | max hit | potions at end | boss / merchant potions | feel (推測) |
|---|---|---|---|---|---|---|---|
| bl1 | rc12q 3ccb63a | F58 normal | 3 | 419 = 39.9% | 0 | 7 / 1 | 2.5 |
| bl2 | rc12q 3ccb63a | F51 normal | 7 | 349 = 40.0% | 0 | 6 / 1 | 2.5 |
| bl3 | rc12q 3ccb63a | F48 normal | 4 | 340 = 40.0% | 0 | 5 / 2 | 2 |
| bw1 | rc12q 3ccb63a | F97 retreat | 8 | 410 = 40.0% | 0 | 15 / 6 | 3.5 |
| bw2 | rc12q 3ccb63a | F65 boss | 11.5 | 416 = 39.96% | 0 | 8 / 7 | 2.5 |
| bw3 | rc12r 432ab2c | F100 clear | 11 | 462 = 40.0% | 1 | 16 / 21 | 3 |
| oc1 | rc12r 432ab2c | F72 retreat | 15 | 355 = 39.98% | 0 | 10 / 8 | 2.5 |
| oc2 | rc12r 432ab2c | F45 boss | 20 | 316 = 39.9% | 0 | 4 / 5 | 2 |
| oc3 | rc12r 432ab2c | F50 boss | 9 | 340 = 39.9% | 0 | 5 / 5 | 2 |
| ar1 | rc12r 432ab2c | F100 clear | 9 | 614 = 40.0% | 1 | 16 / 8 | 4 |
| ar2 | rc12r 432ab2c | F81 retreat | 12 | 422 = 39.9% | 1 | 12 / 9 | 3 |
| ar3 | rc12r 432ab2c | F57 retreat | 7.5 | 351 = 37.7% | 0 | 7 / 5 | 2 |

Median end floor per school: blade 51 (58, 51, 48); bulwark 97 (97, 65, 100); oc 50 (72, 45, 50); arcane 81 (100, 81, 57).
Gap highest–lowest school median: bulwark 97 − oc 50 = **47 floors** (blade 51 is close to oc; arcane 81 and bulwark 97 well above). Caveats: blade/bulwark 1-2 on a different build (rc12q) than the rest (rc12r); 3 runs per school, so medians are noisy. No hit >40% and no turn >50% in any run.

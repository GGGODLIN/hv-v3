DONE rc12p (partial: 5374 closed; oc3/arcane not run)

oc3 and arcane1 never started (server on 5374 shut down; last floor reached: none — no floor entered). oc1/oc2 last floors F50/F74 are the final oc runs; arcane has no rc12p data.

## Summary of completed rc12p runs (8)
| run | end | F30+ boss-turn median | max single hit | max turn |
|---|---|---|---|---|
| bl1 | death F53 normal fight (2 chargers), 34 turns | 6 | 337=39.9% |  |
| bl2 | DEATH F50 boss fight, 8 potions unused | 2.5 | 335=40.0% (F43 t1; F46 t21-22) | 419=50.0% (fatal, F50 t10) |
| bl3 | death F46 normal fight (2 chargers 雷眼飛龍+風影光靈), 0 potions | 5.5 | 337=39.9% | 422=50.0% (F45 t5, boss) |
| bw1 | death F88 normal fight (霜影刺客+霜刃齒輪獸), 0 potions | 10.5 | 426=40.0% | 533=50.0% F68 t1 |
| bw2 | death F76 normal fight (霜鐮騎士+霜刃殭屍), 0 potions | 7.5 | 477=40.0% (41 distinct F46-F76) | 596=50.0% F76 t1 |
| bw3 | RETREAT F57 (★ recommended 撤退回城; HP 163/1287, 0 potions) | 8.5 | 514=39.9% (23 distinct, 0 over 40) | driver mt 514 (39.9%) F41 t3 |
| oc1 | death F50 BOSS fight (狂戰鐵壁・深淵之王・霜岩隼, t11), 0 potions | 13.5 | 453=39.9% (5 distinct >=39%, none over 4 | 480=42.3% F45 t15 boss (tracker mt; no single |
| oc2 | RETREAT F74 (★ recommended 撤退回城: HP 15%, 0 potions; HP 188/1244) — no death | 11 | 497=40.0% (23 distinct, none over 40) | 622=50.0% F71 t1 (Z turn, tracker mt; at line |

Median end floor per school: bl 50 ([53, 50, 46]), bw 76 ([88, 76, 57]), oc 62.0 ([50, 74]) ; arcane: n/a.

# rc12p QA — blade ×2 (rc12o void). Build badge `build aca8ded · CP4…CP9` verified both runs (bl1-badge-aca8ded.png; bl2 badge read from page text).
Driver drvRC12p.js (copy of 12o + 王戰獎勵 text capture, 預估傷害 vs actual per telegraph, est-mismatch detector). Saves qa-saves/rc12p-blade-{1,2}-end.json. 13 potions, 4x, skip anim, ★ only. 已驗證 unless 推測.

## Summary
| | bl1 | bl2 |
|---|---|---|
| End | **death F53, normal fight** (2 chargers 霜翼刺客+雷骨蜥蜴, 34 turns) | **death F50, BOSS fight** (烈焰堅硬・深淵之王・霜牙戰士 + minion 霜冠術士), **8 potions unused** |
| Boss turns F30/35/40/45/50 | 3, 6, 3, 11, 12 | 1, 2, 3, 10, (died t10) |
| Potions ckpt F10/20/30/40/50 | 13/13/13/10/8 | 13/12/12/14/10 (death: 8 left) |
| HP at ckpt | 784,706,784,844,844 (max 784→844) | 838,838,780,838,701 |
| Max single hit | 337 = 39.9% (F41/F43/F50/F51/F53; F36 330=40.0%) | 335 = 40.0% (F43, F46); **no hit >40%** |
| Max turn % | 40.0% (single-hit turns; no >50%) | **419 = 50.0% on the fatal turn F50 t10** (at threshold, not >50; screenshot bl2-death-F50-*) |
| Z cooldown max | 1 | 1 |
| ★ telegraph keys (59 / 25 telegraphs logged) | D41 A11 Z4 Q3 | D14 A5 E3 Z2 Q1 |
| 預估傷害 vs actual mismatches | 0 flagged (see below) | **1: F50 t10 est 278 vs actual 419** |
| Feel (1-5, 推測) | 2.5 | 2 |

## 王戰獎勵 (every boss, text 「王戰獎勵：藥水 ×N、裝備保底 X 階」)
| Boss | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|---|---|---|---|---|
| potion ×N (bl1) | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 1 |
| 保底 (bl1) | 優良 | 優良 | 優良 | 精良 | 精良 | 華麗 | 傳說 | 傳說 | 傳說 | 傳說 |
| potion ×N (bl2) | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | – (died) |
| 保底 (bl2) | 優良 | 優良 | 優良 | 精良 | 精良 | 華麗 | 傳說 | 傳說 | 傳說 | – |
Matches expectation (1 potion per boss from F25). Actual gear qualities dropped in each boss kill are in data.jsonl (victory_compact; raw text of the first 700 chars kept in session events, per boss: at least one piece of the 保底 tier each time; e.g. bl1 F30 華麗 乙, F35/40/45/50 傳說 present). Screenshots of reward screens at F10/20/30/40(/50 bl1): bl1-bossreward-F*, bl2-bossreward-F*.

## Potion sources (推測 for merchant split: not directly instrumented)
- Boss-given: bl1 +6 (F25–F50), bl2 +5 (F25–F45).
- Normal/elite fight rewards: **NONE** in any of 31 (bl1) / 26 (bl2) victory screens (reward line never showed 生命藥水) — as designed. Chests: not instrumented (no chest potion seen in ckpt jumps).
- Merchant-bought: remainder of potion count changes (bl1 stayed 13 at F20→F30 despite drinks; bl2 12→14→… driver buys at merchants) — exact count not logged.
=> No unexpected potion source → no screenshots required.

## 預估傷害 vs actual (blade telegraphs; per-hit [第N回合] tags)
- Undefended: F36 est 330 → actual 330; F41/F43/F50/F51 est 337 → actual 337 (exact). F46 bl2 est 335 → 335.
- Defended (D): tooltip 「防禦後約 337」 but actual 295 (35% maxHP) in all F41-F53 cases (est ~14% HIGH, harmless); F36 est 270–324 vs 289 OK.
- **MISMATCH (flagged, bl2 F50 t10, fatal)**: UI at t9 said 「下回合全體暴擊估計 278 < HP 350，不需防禦」 and ★ chose A·攻擊 (with minion 霜冠術士 蓄力一擊 + boss 重擊 in the same turn); actual turn damage 419 (minion 208 + boss/burn) = 50.0% maxHP → death with 8 potions left. The estimate omitted the boss follow-up hit/burn. Evidence: bl2-death-F50-boss-8potions-left.png. This is a likely bug: estimate 278 vs actual 419 (+51%) and ★ did not drink/defend at HP 350/838 (42%).
- Other mismatches: none auto-flagged (estmis detector fired 0 times before death).

## Death details
bl1 F53 (normal 2-monster fight, 34 turns!): t30 A HP212/844 pot0; t31 D (HP 212); t32 D took 211 → HP 1; t33 A HP1 pot0 ("此戰幾乎必敗"); t34 霜翼刺客 蓄力一擊 337 (39.9%) → dead. Killer: charge hit at HP 1. Potions ran 13→0 across the 34-turn fight (Z presses at low HP; two chargers per turn pattern D every other turn); no boss involved. Previous boss F50 left potions 7.
bl2 F50 boss: t6 Z (HP205→838, potions 9→8); t7 D HP838 (potion cd 1); t8 took 293 (boss 重擊 160 + 燃燒 24 + minion 133) → HP545; t9 A at HP350 (pot8, "安全" est 278); t10 took 419 → dead. Boss death with 8 potions unused: ★ skipped Z because cooldown / "HP 安全" estimate.

## Other
- Max-HP growth: 784 → 844 over the run (no real growth); Lv14→15 on death bring-back. Gear tier climbs (傳說 保底) but HP flat, so growth feels weak (推測).
- Boss turns F30-45: bl1 3,6,3,11; bl2 1,2,3,10 (both spike at F45: 10-11 turns). F50: bl1 12 turns, bl2 killed us.
- Feel 推測: pressure comes from 蓄力 hits ≈40% of max HP everywhere (337/844 repeated 20+ times), D defends cut to 35%; deaths came from potion drain in a long normal fight and from a mis-estimated boss turn.
- Missing: no F60+ data (both died ≤F53); bl1 events of F51-53 partially large; shots: tele1/2 bl1 F31/F36, bl2 F36/F41.


# rc12p batch 2 — blade run 3 + bulwark run 1 (drvRC12p.js + merchant/chest logging + est20 detector (★「下回合…估計 X」 vs actual next-turn damage >20%))
Badge `build aca8ded · CP4…CP9` verified. Saves rc12p-blade-3-end, rc12p-bulwark-1-end. 已驗證 unless 推測.

| | bl3 | bw1 |
|---|---|---|
| End | **death F46, normal fight** (雷眼飛龍+風影光靈 chargers), 0 potions | **death F88, normal fight** (霜影刺客+霜刃齒輪獸 chargers), 0 potions |
| F30-45 boss turns | 5,5,6,15 | 4,6,11,14 |
| F50-65 boss turns | – | 15,4,3,17 |
| F70-85 boss turns | – | 10,3,12,16 |
| F90-100 | – | – |
| Potions ckpt F10/20/30/40/50/60/70/80 | 12/12/12/11/–/–/–/– | 12/10/8/9/9/6/1/1 |
| Boss-given potions | 5 (F25–F45) | 13 (F25–F85) |
| Merchant-bought (per merchant) | F9,24,27,29,32: 0 (held 12≥thr 7); F44: +1 (5→6) | F9,17,29,32,44: 0; F52,54,57,59,62,64,67,69,72,74,77,79,82,84: +1 each (14 total) |
| Chest contents | F2,7,12,17,22,37,42: gold + gear only, **no potion** | F2,7,12,22,27,37,42,47,87: gold only, **no potion** (gear lists in data) |
| Normal/elite fight potion drops | none (26 victory screens) | none (50 victory screens) |
| Max single hit | 337 = 39.9% | 426 = 40.0% (≈40 occurrences F41-F73) — never >40% |
| Max turn | **422 = 50.0% (F45 boss t5)** | **533 = 50.0% (F68 t1, normal fight)** — both exactly at, not over, 50% |
| Z cooldown max | 1 | 2 |
| ★ keys on telegraphs | D37 A13 Z5 Q2 E1 | A67 D44 Q30 W12 Z10 E6 S1 |
| est20 (★ estimate low by >20%) | **1: F45 t5 est 155 vs actual 422 (+172%)** (screenshot bl3-est20-F45-t5-est155-actual422.png); plus tooltip 防禦後 est 183–230 vs actual 295 at F31 t4, F33 t1/t4 (multi-charger: est covers only one monster; screenshot bl3-estmis-F31-t4-act295-vs-183.png) | 0 real (F45 t6 est 0 vs 12 = parser false positive). The F68 533 turn: not preceded by a lower estimate flagged |
| Feel (1-5, 推測) | 2 | 3.5 |

## Reward text per boss (王戰獎勵), both runs
5/10/15: 藥水 ×0 保底 優良 · 20: ×0 精良 · 25: ×1 精良 · 30: ×1 華麗 · 35-45(bl3)/35-85(bw1): ×1 傳說. Matches expectation (1 potion/boss from F25). Gear qualities actually dropped per boss are in data.jsonl (victory_compact; every boss had ≥1 piece of the 保底 tier; 華麗 also at F40/F50/F60/F70/F80 alongside 傳說).

## Potion economy (the split asked for)
bl3: start 13 → boss +5, merchant +1, drinks ≈ 14 → 0 at F46. Chests/normal fights: 0.
bw1: start 13 → boss +13, merchant +14, drinks ≈ 40 → 0 at F88. Potion ckpt falls 12→1 by F70 and then merchants keep it at 1-2 (buys 1 per merchant, max 1 potion/merchant when held<thr). So after F52 the potion supply (boss 1 per 5 floors + ~1 per merchant) roughly equals consumption; death comes when a charge fight overlaps with 0 potions.

## Deaths (last turns)
bl3 F46: t23 D HP170 pot0 → t24 A HP212 → t25 D took 211 → HP1 → t26 A HP1 → t27 雷眼飛龍 蓄力一擊 337 (40%) dead. Previous boss F45 15 turns drained potions 6→3, then this fight 3→0.
bw1 F88: t1 D (parry 373) HP508; t2 Q stuns 霜影刺客 (HP135); t3 D; t4 A at HP1 pot0; t6 霜刃齒輪獸 蓄力一擊 426 = 40.0% dead.

## Findings
1. est20 hit in blade: boss turn at F45 t5 tooltip/★ estimate 155 vs actual 422 (50.0% maxHP) — boss + multi-source turn; this is the same class as bl2 F50 (est 278 vs 419).
2. Multi-monster telegraphs: tooltip shows one monster's 預估 (e.g. 337 / 防禦後 183–230) while two chargers hit for 295 total (defended) — underestimate ≈ +28-60%.
3. Bulwark is clearly deeper (F88 vs F46-F53 for blade), boss-turn counts F30–65 median ≈ 11 vs F70–85 median ≈ 11 (10,3,12,16) — F70+ not harder in turns; potions are the limiter. Max hit remains 40.0% of max HP (426/1066) everywhere.
4. 533 = 50.0% turn at F68 t1 (normal fight, K=Z drink turn) — sits on the 50% line; not a bug per rule (>50%), but flag: two charge hits + minion in the same turn.
5. Chest/merchant/normal-fight potion sources: only boss reward + merchant. No stray potions.
6. Driver note: h40 events repeat each turn while the same log line persists (counted ~40 for bw1 → really ~10 distinct 426 hits).
Files: qa-cp9-rc12p-data.jsonl/-deathlog.jsonl/-shots, saves qa-saves/rc12p-blade-3-end.json, rc12p-bulwark-1-end.json.

## rc12p bulwark runs 2-3 (badge `build aca8ded` verified both) — 40% detector deduped by floor+[第N回合] tag+dmg
| run | end | F30+ boss turns (F30,35,40,45,50,55,60,65,70,75) | potions at end | boss-given | merchant-bought | max hit | max turn | Z cd max |
|---|---|---|---|---|---|---|---|---|
| bw2 | **death F76**, normal fight (霜鐮騎士 蓄力一擊 477=40.0% at HP 1, 0 pots) | 3,4,2,11,11,8,10,14,4,7 | 0 | 11 (F25-75) | 10 (F52-74, 1 each; 0 at F2-44) | 477=40.0% (41 distinct hits F46-76, none >40) | 596=50.0% F76 t1 (Z-turn driver mt; exactly at line, not over) | 2 |
| bw3 | **retreat F57** (driver low-HP/0-potion rule; HP 163/1287) after F56 fight HP 34/1287 | 4,10,5,13,13,7 | 0 | 7 (F25-55) | 5 (F42-54, 1 each) | 514=39.9% (23 distinct, none >40) | 514 (39.9%) | 2 |

- bw2 ckpt (F|pot|HP): 10|13|1002/1040; 20|11|717/1140; 30|10|1115/1115; 40|11|1231/1231; 50|8|1074/1193; 60|3|1193/1193; 70|1|597/1193. 70+ potions 0-1.
- bw3 ckpt: 10|13|948/948; 20|9|1045/1059; 30|7|749/1059; 40|7|810/1259; 50|7|388/1287.
- bw2 last 5 turns F76: t8 A HP478; t9 D parry 417; t10 Q stun HP61; t11 D took 60 HP1; t13 霜鐮騎士 蓄力一擊 477 dead (no potions; D/Q picked, not Z because pot 0).
- Boss reward text: every boss F25+ "藥水 ×1/裝備保底 X階" (F5-20 ×0); F35+ 保底 傳說; potion always exactly 1 per boss (已驗證). Normal/elite/chest potion drops: none (bw2 chests F7-47 only +C; bw3 chest list no 生命藥水) (已驗證).
- Merchant buys happen only once potions fall <=~6 (1 per merchant, price-limited threshold); boss-given+bought explains all potion gains.
- ★ telegraph key counts: bw2 A60 Q20 D29 E3 W8 Z9; bw3 A45 Q9 Z5 D22 W3. Z cooldown max 2 both; first cd text screenshots bw2/bw3-F10-first-cooldown-text.
- Dedupe: 40% hits near-line (>=39%) logged once per floor+turn+dmg; 0 hits over 40% in either run (40.0% = 477/1193 exactly bw2).
- Feel (推測): bw2 3/5, bw3 3/5 (steady growth, potion starvation after F60, ends in weak-HP small fights, not big boss fights).
- bw3 est-vs-actual events: 8 recorded in data.jsonl events (est20 shots none triggered above threshold). Bulwark F30-65 vs F70+: bosses longer F45-65 (8-14 turns), F70+ shorter/lethal since potions 0-1.
- Files: saves rc12p-bulwark-2-end.json, rc12p-bulwark-3-end.json; shots bw2-F10-first-cooldown-text, bw2-death-F76, bw3-F10-first-cooldown-text, bw3-retreat-F57.

### Correction/check (bw3 F57 retreat)
★ itself recommended it: map text `🧭 HP 13%、生命藥水 0 瓶（≤ 1）：建議撤退回城（保留 100%）` (events lowmap+retreatStar, F57, HP 163/1287, 0 pots) (已驗證). Driver audit: drvRC12p.js has NO own low-HP retreat rule; it clicks retreat only when the ★ recommendation text contains 撤退回城 (line `kind==='retreat'`). The 'lowmap' stop is logging-only (no action); it is now ignored in the run loop. 

## rc12p oc run 1 (badge `build aca8ded` verified)
| run | end | F30+ boss turns (F30,35,40,45,[50]) | potions at end | boss-given | merchant-bought | max hit | max turn | Z cd max |
|---|---|---|---|---|---|---|---|---|
| oc1 | **death F50, BOSS fight** (狂戰鐵壁・深淵之王・霜岩隼, t11), 0 potions | 10,9,17,27 (F50 died t11) | 0 | 5 (F25-45) | 5 (F37-49, 1 each; 0 before F37) | 453=39.9% | 480=42.3% F45 t15 boss (<50%) | 1 |

- Boss start->end pot/HP (F|turns|pot0->pot1|HP0->HP1): F30 10t 7->7 1134->445; F35 9t 6->5 1134->681; F40 17t 5->3 1032->1056; F45 27t 4->1 629->278.
- ckpt: 10|13|1134/1134; 20|10|1134/1134; 30|7|1134/1134; 40|5|1032/1134; 50|1|682/1134.
- Death: F50 boss, boss 預估傷害 453 (40%) every telegraph; ★ chose D 28x total (D/Z picked 33 of 54 telegraphs); last turns HP 537->141 (396 taken), HP 86, heal +284 via D, HP 1, then 63 chip dmg killed; 0 potions since F47 (boss potion F45 only +1, merchants 1/each late).
- est20 mismatches (actual >20% over ★ 下回合估計): F25 t4 est293 act392 (+34%) shot oc1-est20-F25-t4-est293-act392; F35 t1 est419 act567 (+35%) shot oc1-est20-F35-t1-est419-act567.
- Potions: boss reward text 藥水×1 from F25 only (F5-20 ×0) (已驗證); none from normal/elite/chests (已驗證).
- Telegraph ★ keys: A10 Z5 D28 Q8 W3. 
- Feel (推測): 2/5 — potion drain from F30 (7->1 by F50), 27-turn F45 boss attrition, death in boss fight with no growth sense.

## rc12p oc run 2 (badge `build aca8ded` verified)
| run | end | F30+ boss turns (F30,35,40,45,50,55,60,65,70) | potions at end | boss-given | merchant-bought | max hit | max turn | Z cd max |
|---|---|---|---|---|---|---|---|---|
| oc2 | **RETREAT F74** — ★ itself recommended: `🧭 HP 15%、生命藥水 0 瓶（≤ 1）：建議撤退回城（保留 100%）` (已驗證, retreatStar event); HP 188/1244 | 11,3,28,21,20,3,6,27,5 | 0 | 10 (F25-70) | 13 (F42-72, 1 each; 0 before F42) | 497=40.0% (23 distinct near-line, none over) | 622=50.0% F71 t1 (at line, not over) | 1 |

- Boss start->end (F|turns|pot0->pot1|HP0->HP1): F30 11t 9->8 1001->853; F35 3t 8->9; F40 28t 9->4 1044->639; F45 21t 5->2; F50 20t 3->1 863->1008; F55 3t; F60 6t; F65 27t 3->1 1218->306; F70 5t 1->2.
- ckpt: 10|13|887/950; 20|12|994/994; 30|9|1001/1001; 40|9|1044/1044; 50|3|863/1008; 60|4|706/1008; 70|1|853/1218.
- est20 (actual >20% over ★ 估計): F40 t23 est396 act492 (+24%) shot oc2-est20-F40-t23-est396-act492; F50 t1 est395 act504 (+28%) shot oc2-est20-F50-t1-est395-act504.
- Telegraph ★ keys: Q17 Z10 A33 D35 W9 E7 S2. Potions: only bosses (F25+, 1 each) and merchants; normal/elite/chest none (已驗證).
- Feel (推測): 3/5 — long F40/F65 boss fights (27-28 turns) but survived to F74; potion drought from F65.
- F30-65 vs F70+: potions 9->1 by F70; F70+ boss only 5 turns (F70) — no big OC boss damage spike seen (max hit stays 40%).
- Files: saves rc12p-oc-1-end.json, rc12p-oc-2-end.json; shots oc1-*, oc2-*.

## rc12p oc3/arcane1 — NOT RUN: localhost:5374 refuses connections (server down); localhost:5375 serves a different build (3ccb63a). Did not touch game servers.

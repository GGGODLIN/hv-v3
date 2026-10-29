SUPERSEDED rc12s (blade x3 + bw1 partial to F53 kept)

# rc12s (5377) blade 1-2 — build `660c7d7` (badge verified), driver drvRC12s.js (= drvRC12r), blade preset, ★ only, 13 potions, 4x + skip anim. Raw per-turn events: rc12s-evflush.jsonl (run=bl1/bl2); summary: qa-cp9-rc12s-data.jsonl. Dev-confirmed turn alignment used (`turnsync.aligned` = 受到 of the 第(N+1)回合 line). Auto-review classification errors happened earlier (first attempt, nothing run); retry in small steps worked.

| item | bl1 | bl2 |
|---|---|---|
| End | **DEATH F63, normal fight** (炎刃雙頭龍 蓄力一擊 247 = 30% of 826, HP 1, 0 potions) | **CLEAR F100** (boss F100 killed; retreated at F101 map to check panel; Lv14→19) |
| Died in normal fight at 0 potions? | **Yes** (已用完; ★ said 「此戰幾乎必敗」) | n/a (7 potions left) |
| Last 5 turns (bl1 F63) | t17 D @HP166 (est 413→actual 165); t18 A @208; t19 D @208 (est 413→actual 207, survived at 1 HP margin); t20 A @208→1 (took 207); t21 A @HP1 → 247 charge = death. Potions 0 since F61; ★ alternated D/A with no drink available | — |
| F30+ boss turns | F30..F60: 1,3,3,5,9,18,6 (median 5) | F30..F100: 4,1,6,3,7,6,8,6,4,20,13,15,12,16,16 (median 8; F30-65 ≈1-8, F75+ 12-20) |
| Boss Z per fight | F30 0,F35 0,F40 0,F45 1,F50 2,F55 4,F60 1 | F30 1,F35 0,F40 1,F45 0,F50 1,F55 1,F60 1,F65 1,F70 0,F75 4,F80 3,F85 3,F90 3,F95 3,F100 2 |
| Potions at boss start (F30..) | 11,12,13,14,14,10,2 | 12,12,13,13,14,14,14,13,13,13,8,8,8,8,8 (F100: 8→7) |
| Potions gained after boss | 王戰獎勵 藥水×0 for F5-F20, **×1 each F25-F60** (8 total) | ×0 F5-F20, ×1 each F25-F100 (16 total) |
| 保底 tier after boss | F5-15 優良, F20-25 精良, F30 華麗, F35-F60 傳說 | same ladder to F100 (傳說 from F35); actual drops in rc12s-evflush victory events (e.g. F35 傳說・減幅之秘銀塔盾 / 傳說・雷童之琥珀龍皮護腿; F65+ also 華麗 extras) |
| Potion sources | boss 8 / merchant 3 (F57,59,62; 1 each) / **none from normal, elite, chests (10 chests)** | boss 16 / merchant 8 (F82,84,87,89,92,94,97,99) / none from normal/elite/chests (16 chests) |
| ckpt pot / HP / gold | F10 13 764/826 719C; F20 11 826/826 3441C; F30 11 704/826 8802C; F40 13 720/826 15210C; F50 14 826/826 24358C; F60 2 620/826 34251C; death F63 0 | F10 13 820/820 812C; F20 12 3599C; F30 12 695/820 8736C; F40 13 825/862 16506C; F50 14 791/874 25542C; F60 14 700/874 36767C; F70 13 931/979 49463C; F80 8 999/999 64653C; F90 8 552/1222 78721C; F100 8 998/1247 94398C |
| Max single hit | 330 = 39.95% (normal-fight 蓄力, F28 & F33, A key); boss max 305 = 36.9% (F55 est 413 charge) ; death hit 247 = 30% | 498 = 39.9% of 1247 (F95/F100 boss charges); 488=39.9% F90; 399=39.9% F80; normal F68 391 = 39.9% |
| >40% hit (bug) / >30% normal 蓄力 | none >40%; normal 蓄力 >30%: F28, F33 (330 =39.95%), F63 (247≈30%) | none >40%; normal 蓄力 ≥30%: F68 (391=39.9%) |
| Max turn % | no turn >50% (no dmg50 event) | none >50% |
| Z cooldown max | 1 (same-turn text 「藥水冷卻中（還剩 1 回合）」 at F5) | 1 |
| ★ estimate vs next-turn actual | 65 est turns; aligned value on 38 (58%); aligned est≥50: 4 turns, 3 differ >20% — all **over**-estimates (413 crit-max vs 289 after D); **0 under-estimates**, 0 est20 | 142 est turns; aligned 51 (36%; 73 more had HP change but no N+1 summary line within poll); aligned est≥50: 39, 34 differ >20%, all **over**-estimates (e.g. 624 vs 436 D-reduced); 0 under; 2 est20 (F80 t12 est199 vs 399, F90 t10 244 vs 488) = hit already in log before decision (alignment artefact; aligned actual 0) |
| ★ picks D/Z on telegraphs | 49 of 66 telegraph turns (D 47, Z 2); boss: 11 of 13 | 74 of 123 (D 60, Z 14); boss: 53 of 64 |
| Keys | A77 D47 W26 Z24 Q22 E11 (+1-6 none) | A168 Q71 W62 D60 E44 Z30 |
| Turn-sync / busy / 排隊指令已取消 | 207 events, busy_flag 0, qc 0 | 435 events, busy 0, qc 0 |
| Growth panel | After boss kill (shots bl1-growth-panel-after-F60-boss, bl2-growth-panel-after-F10-boss): 「成長：Lv…」 table (等級/最大HP/MP/攻擊/減傷/戰力 before→after, 「本場未升級」) renders correctly. After death (bl1-death-F63-return-panel, bl1-town-after-death): 死因 + 這趟帶回 (Lv14→15, 戰力 572→707) correct, town shows Lv15 128,559C, potions reset 0. After clear/retreat (bl2-retreat-return-panel-F101): Lv14→19, 戰力 572→795 (+39%), 126 items kept — correct | |
| Feel (推測) | 2.5/5 — boss fights trivial (1-9 turns) but potions drained to 0 in F56-F62 normal fights, died to a 30% charge in a normal fight | 3.5/5 — steady growth (maxHP 820→1247, Lv+5), F75+ bosses 12-20 turns with Z 2-4 each, potions stable 8; clear |
| Shots (files) | bl1-h40-F28-normal-charge-330of826, bl1-growth-panel-after-F60-boss, bl1-death-F63-return-panel, bl1-town-after-death | bl2-growth-panel-after-F10-boss, bl2-h40-F80-boss-charge-399of999, bl2-h40-F90-boss-charge-488of1222, bl2-F100-clear-map, bl2-retreat-return-panel-F101 |
| Saves | qa-saves/rc12s-blade-1-end.json | qa-saves/rc12s-blade-2-end.json |

Notes: no retreat was ★-recommended in bl1/bl2 (bl2 retreat after clear at F101 was after the run ended, only to check the panel). Estimate coverage is lower than ar3 because blade shows estimates mostly on Z/D charge turns where the driver's poll sees HP change before the N+1 summary. Only 2 telegraph-estimate screenshots captured in-flow (h40 shots listed); 40%-line hits are exact 39.9% (not >40%).

## rc12s — blade 3 (bl3) — DONE
| item | bl3 |
|---|---|
| End | **DEATH F56, normal fight** (雷蹄飛龍 蓄力一擊 314 = 30% of 1049, HP 1, 0 potions) — died in a normal fight at 0 potions: **yes** |
| Last 5 turns (F56, a 44-turn normal fight) | t38 A @577; t39 D @577 (est 525); t40 D @210 (est 210, aligned 0); t41 D @210 (est 418); t42 A @HP1 (★「此戰幾乎必敗」, 0 potions, took 209); t44 charge 314 = death. 5 Z were burned inside this one fight (potions 5→0) |
| F30+ boss turns | F30..F55: 3,4,1,9,14,8 (median 6) |
| Potions at boss start / Z | F30 13, F35 14, F40 12, F45 13, F50 8 (Z 2), F55 5 (Z 1); F46-49 normal fights burned 14→8 |
| Boss reward | 藥水×0 F5-F20, ×1 F25-F55 (7); 保底 優良 F5-15, 精良 F20-25, 華麗 F30, 傳說 F35+ (same ladder) |
| Potion sources | boss 7 / merchant 2 (F52, F54) / none from normal, elite, chests (12 chests) |
| ckpt pot / HP / gold | F10 13 785/826 952C; F20 13 826/826 3829C; F30 13 781/826 9372C; F40 12 817/991 16366C; F50 8 1013/1013 26333C; death F56 0 |
| Max hit / turn | 396 = 40.0% of 991 (normal-fight charge F33; 39.96%, not >40%); death hit 314 = 30%; no turn >50% |
| Normal-fight 蓄力 ≥30% | F33 (396=40%), F56 (314=30%) |
| Z cooldown max | 1 |
| ★ est vs next-turn actual | 80 est turns, aligned 61 (76%); aligned est≥50: 5, all >20% **over**-estimates (e.g. 525 vs 99 after D / 0 on Z turns); 0 under-estimates |
| ★ D/Z on telegraphs | 60 of 77 |
| turn-sync / busy / qc | 226 events, busy 0, qc 0 |
| Feel (推測) | 2/5 — bosses trivial (1-14 turns), potions bleed in F46-F56 normal fights, dies to a 30% charge in a 44-turn normal fight |
| Shots | bl3-death-F56-return-panel; save qa-saves/rc12s-blade-3-end.json (town after return: Lv15, 125,460C, potions 0 — correct) |

## rc12s — bulwark 1 (bw1) — PARTIAL (stuck at F53)
Setup note: the first `&fresh` load raced with my shop clicks (page reloaded late), so one aborted F1 entry was retreated back to town before the real run (bulwark preset Lv11, 13 potions bought, 4x + skip anim). Driver patched mid-run: ★-estimate alignment polling only on turns that have an estimate (speed-up).
Progress through F53 (boss F50 cleared; **currently F53 turn 7, 0 potions, HP 1099/1099, ★ says continue A**):
- Boss turns: F30 4, F35 2, F40 11, F45 **32** (Z4, potions 7→4), F50 **24** (Z3, potions 3→1). Potions at boss start: F30 11, F35 12, F40 10, F45 7, F50 3. Potion drain across F40-F52; 0 at F52.
- Boss reward ×0 F5-F20, ×1 each F25-F50 (6), merchant bought 4 (F44, F47, F49, F52 incl. +1 each); none from normal/chest; 保底 same ladder.
- ckpt: F10 12 935/935 767C; F20 11 935/973 3513C; F30 11 891/973 8680C; F40 10 1066/1066 16605C; F50 3 563/1123 24645C.
- Max hit so far: 449 = 40.0% of 1123 (F50 boss charge, 39.98%), 426 = 40.0% of 1066 (F45); no >40%, no turn >50%. Z cooldown max 1.
- est vs actual: est20 at F50 t12 (224 vs 449) and F53 t6 (219 vs 329) = hit already in log before the Z decision (aligned actual 0) → alignment artefact, not bugs. aligned est≥50: 4, 2 over-estimates >20%, 0 under.
- **Stuck step:** from F53 turn 7 every `browser_run_code` driver call failed with "Error classifying this action. Please review manually." (read-only calls recover after ~1-2 min, driver calls did not in 8+ tries incl. shorter variants). Run NOT finished; no end floor/death/feel for bw1 yet. Game tab left on F53 (0 potions); helper tab holds driver state.

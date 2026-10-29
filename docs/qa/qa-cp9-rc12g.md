DONE rc12g
# cp9-rc12g acceptance — blade 1 & 2 (build 3728a96, server :5365)
Method as rc12f: ?cp9&cp8&cp6&preset=postF20-blade&fresh (each run reloaded with &fresh → Lv14 / 103,589C / 3 potions / 0 abyss runs = fresh slot, 已驗證), badge 3728a96 (shots bl1-badge-3728a96, bl2-badge-3728a96; 已驗證). 10 potions bought → 13, 4x + 跳過動畫 on (verified), 忽略並出發, 進入深淵塔, ★-only (data-primarykey), ★ map node, ★ buff, merchant buy-to-threshold (thr 7, 1/merchant). Driver /workspace/drvRC12g.js (rc12f + per-boss normal vs charge max hit, 自動換武器 / 魔力合流 / 以太 counters). Cap F101. Dumps qa-saves/rc12g-blade-{1,2}-end.json. Shots qa-cp9-rc12g-shots/. Data qa-cp9-rc12g-data.jsonl (per-boss rows). Deathlog empty (no deaths).

## Results (both: F100 boss cleared, alive on F101 map; 已驗證)
| run | result | pot start | pot end | boss turns F30-100 (sum) | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 魔力合流 / 以太 | >50% turn | 
| bl1 | F100 cleared (28t), alive F101 HP 870/1589 | 13 | 23 | 12,6,11,7,2,6,8,6,10,16,15,17,15,18,28 (=177) | 171 (F60, ≈14% of ~1250 maxHP 推測; F75/F80 normal unknown, see caveat) | 457 = 28.8% of 1589 (F100 蓄力一擊) | 0 lines | 0 / 0 | none |
| bl2 | F100 cleared (24t), alive F101 HP 1600/1600 | 13 | 32 | 6,4,7,5,7,8,9,8,17,15,8,23,27,15,24 (=183) | 234 = 16.5% of 1419 (F100 t22) | 362 = 25.5% of 1419 (F100 t1 蓄力一擊) | 0 lines | 0 / 0 | none |
Boss potions start→end and skills per boss: see data.jsonl. bl1 skills 2,2,1,3,3,4,6,4,6,9,9,8,2*,9,15 (*F90 partial: driver state lost mid-fight). bl2 skills 4,3,4,3,4,5,5,6,9,8,6,12,15,8,13. F100 boss: bl1 28t pot 24→23 sk15; bl2 24t pot 34→32 sk13.
Per-boss max normal hit (bl1): 165,83,126,133,?,?,171,?,?,n/a,n/a,155,127,138,99; (bl2): 139,136,?,197,160,101,201,?,118,151,149,172,110,77,234 (? = 0 parsed, no 「對你造成」 line captured). Charge hits seen: bl1 F75 334, F80 262, F95 384, F100 457; bl2 F60 287, F85 332 (招架), F90 297, F100 362. Max single normal hit per run: bl1 ≥171 (≤~15%), bl2 234 (16.5%). Nothing >40% maxHP; no turn >50% maxHP (driver dmg50/b40 triggers never fired; 已驗證 by driver).
Potions: never a constraint (min 18 at any boss start). Z used bl1 ≥4 (counter partial), bl2 16. Merchants: bl2 entered 7 all skipped (held ≥ thr 7); bl1 merchant count partial (1 in tracked part, skipped).
## Checks
- 自動換武器: 0 log lines in both runs (regex on every turn log; 已驗證 for fight logs, map-phase logs not scanned).
- 魔力合流 / Ether Tap / 以太: 0 in both (expected for blade ✔, 已驗證).
- Buff ★ picks: bl1 (44 picks incl. partial) and bl2 (27) lists in S/hist. 部分無效 tag: seen on 不動之盾/震盪/不滅/厚皮. NEW FLAG (已驗證): ★ was placed ON 部分無效 cards when no fully-applicable card existed: bl1 F70 ★不滅【部分無效】, F75 ★不動之盾【部分無效】, F100 ★厚皮【部分無效】; bl2 F78 ★不動之盾【部分無效】, F80 ★不滅【部分無效】. ★ never on 【無效】. From F70+ offers are mostly 1 full + 部分無效 + 無效 or 2-3 partial.
- First buff: bl1 [★良品嗅覺, 力量祝福, 魔力池(需要法術)] ; bl2 [★生命祝福, 先手氣勢, 輕盈架勢] (shots bl*-buff-pick3-first).
- c6 (red 「只能靠保命」): bl1 F46t2 HP110/826 ★Z, decision == red 「先喝藥」 (no shot). 必敗 never. lowmap/retreat★ never.
## Caveats (honest)
- bl1: driver state was lost twice mid-run (page reload of helper tab, 30s timeout) at ~F88 and F90 — key counters, F90 skill count, and pre-F88 per-run max-normal were re-seeded by hand; F75/F80 normal max not captured (a first-version bug counted the turn-summary 「單擊最大」 as normal; patched). Several bosses show 0 normal hit parsed (bl1 F50/55/65/70, bl2 F40/65) — 推測 hits only appeared in summary lines or all dodged; treat as unknown.
- Charge vs normal is classified by log line containing 蓄力 (含 蓄力一擊 / 重擊…1 回合後重新蓄力). 首領蓄力中 flag not separately used. 反傷 lines (reflect) are counted as 對你造成 normal hits (e.g. F35 83, bl2 F95 77).
- Screens: no >40% hit and no death, so only badge, first buff, F101 shots exist.
## Feel (手感分數, 推測)
- bl1: 8/10 — clears F100 comfortably but F100 boss took 28 turns and 15 skills (longer than rc12f's 6t), mid bosses 15-18t F75-95; HP never in danger, potions 13→23 hoard.
- bl2: 8/10 — same pattern; F85/F90 23-27t bosses with charge hits 297-332 (~22%) are the spikes; potions 13→32, merchants irrelevant.
推測: boss fights are noticeably longer than rc12f blade (177/183 turns vs 96/85) yet still safe; ★ picking 部分無效 buffs late is a mild polish issue.

---
# Update: blade 3 + bulwark 1 (build 3728a96, &fresh each — bl3 Lv14/103,589C/0 abyss runs; bw1 Lv11/114,986C/0 abyss runs, 已驗證; shots bl3-badge, bw1-badge)
Driver drvRC12g.js patched: scans whole body text each loop for 「自動換武器」 (map phase included), records maxHP per boss for %. Calls kept ≤~20 s; helper tab never reloaded mid-run (bl3/bw1 no state loss). 一次 `unk` race at bl3 F70 victory screen, simply resumed.
| run | result | pot start→end | boss turns F30..(every boss) | max NORMAL boss hit | max CHARGE hit | 自動換武器 (floor) | 魔力合流/以太 |
| bl3 | F100 cleared (8t), alive F101 HP 1017/1214 | 13→24 | 4,1,3,14,5,5,2,23,19,8,9,22,12,19,8 (sum 154) | 177 = 20.0% of 886 (F65 t8, F70) | 231 = 26.1% (F65 重擊); F85 140 | 2 lines: F67 優良・平衡之雷擊鐮刀 → 優良・戰鬥法師之雷擊鐮刀; F71 優良・戰鬥法師之雷擊鐮刀 → 精良・戰鬥法師之惡魔鐮刀 | 0 / 0 |
| bw1 | DIED F60 boss t16 (HP1, 0 pot, 必敗) | 13→0 | F30 10, F35 11, F40 34, F45 48, F50 65, F55 113, F60 16+ (died) | 177 = 16.4% of 1082 (F40) | 538 = 49.7% of 1082 (F50 minion 霜棘戰士 蓄力一擊 招架); F55 439 (40%), F60 381/332 | 2 lines: F10 尚可・浣熊之斧 → 優良・平衡之暴風短劍; F37 優良・減幅之塔盾 → 華麗・減幅之塔盾 | 0 / 0 |
- 自動換武器 (bl3): a 鐮刀 (scythe) → 戰鬥法師 scythe swap at F67/F71 while on blade preset — 推測 auto-equip picks 法師-type scythes (INT stats) for a blade build; HPmax stayed low (886 at F70 vs 1382-1589 in bl1/bl2) — 推測 related? not verified. bw1: swaps look reasonable (axe → short sword, shield upgrade).
- bl3 per-boss rows: potions start→end 24→24, 25→25, 28→29, 28→27, 28→28, 26→26, 22→22, 24→22, 23→20, 23→23, 24→23, 24→23, 23→22, 24→21, 24→24 ; skills 2,2,2,2,3,3,3,7,8,6,5,12,7,10,6; bl3 buff 部分無效 ★ picks (已驗證): F55 ★不動之盾, F70 ★厚皮, F80 ★不滅 (all tagged 部分無效); ★ never on 【無效】. F100 boss damage not parsed (mn=0). maxHP 826→1214 over run (low).
- bl3 first buff: [冰之印記【無效】, 堅守, ★節儉]. bw1 first buff: [★良品嗅覺, 元素共鳴【無效】, 磨利].
- bw1 bosses (turns / pot start→end): F30 10 18→18; F35 11 19→18; F40 34 18→17; F45 48 17→16; F50 65 17→13; F55 113 12→1; F60 16 1→0 died. Dev prediction ≤40 turns is EXCEEDED: F45 48, F50 65, F55 113 (已驗證, from turn counter). Fights are D-heavy (D 134, A 258, Q 43, W 22, E 8, Z 31): ★ alternates A/D with 反擊/格擋 and enemy 蓄力 minions; kills very slow. The boss turn counter includes minion turns.
- bw1 merchants (6 entered): 4,29,39,54 skipped (held ≥7); F57 held 1 bought 1 (thr 8), F59 held 0 bought 1 — 1 bottle/merchant can't recover (推測 same as oc/arcane rc12f).
- bw1 >50% turn: none triggered; but a single charge hit 538 = 49.7% of maxHP (F50, minion 蓄力一擊, blocked-parry tag); 439 (39.9%) F55; 381 at F60 t14 took HP 382→1. Normal boss (non-charge) hit never >20%.
- bw1 c6 occurred 8x (e.g. F50 t4 HP 362/1082, decision ★Z == red 「先喝藥」); V「存活優先」★D at F55 t14 HP550; 必敗 at F60 t14 (HP1, 0 pot, ★D) and t15 (★A) — shot bw1-F60t14-HP1-0pot-bisheng, bw1-death-F60.
- bw1 ★ buff picks (13): 不動之盾 靈巧 震盪 堅守 撕裂 不滅 厚皮 活力 力量祝福 弱點洞察 精準 迅捷調和 (+良品嗅覺). 部分無效 never offered to bulwark; ★ never on 【無效】.
- Death (bw1): Lv11→13 return, 1497 EXP / 35,462C earned, 50%×1.3. Details/last-5 turns in qa-cp9-rc12g-deathlog.jsonl.
- Staff mechanics: 0 魔力合流 / 以太 in both (blade/bulwark ✔).
- Merchant behavior is 已驗證 from driver; difficulty/feel below 推測.
## Feel (手感分數, 推測)
- bl3: 7/10 — clears F100 (8t) but weaker build: HPmax only 826-1214, 2 auto-swaps to 戰鬥法師 scythes at F67/F71; bosses 14-23 turns at F45/F65/F70/F85; never below 20 pots.
- bw1: 3/10 — attrition death: F40-F55 bosses take 34/48/65/113 turns (sim ≤40), potions drain 18→1 across F50-F55, died F60 at 0 pot; ★ spends 134 turns on D with 招架/格擋 yet minion charges (332-538) keep grinding; rc12f bulwark 2/2 clears (176/226 turns total) vs this run → high variance / possible regression (推測).

---
# Update: bulwark 2 + bulwark 3 (build 3728a96, preset postF20-bulwark&fresh; both Lv11 / 114,986C / 0 abyss runs = fresh slot, 已驗證; 13 potions, 4x+跳過動畫, 深淵塔, ★-only)
Driver adds c40 trigger (minion/boss 蓄力 hit >40% maxHP → stop + screenshot, max 4/run). Dumps qa-saves/rc12g-bulwark-{2,3}-end.json.
| run | result | pot start→end | boss turns F30.. (every boss) | max NORMAL boss hit | max CHARGE hit | 自動換武器 (floor) | 魔力合流/以太 |
| bw2 | DIED F65 boss t52 (HP1, 0 pot, 必敗) | 13→0 | F30 21, F35 19, F40 26, F45 60, F50 31, F55 48, F60 99, F65 52 (sum 356) | 193 = 15.7% of 1231 (F65 t47) | 610 = 50.0% of 1221 (F60 t70 minion 炎爪戰士 蓄力一擊, HP→52) | 4: F1 尚可・浣熊之斧 → 優良・獵豹之棍棒; F20 優良・減幅之塔盾 → 優良・戰鬥法師之鳶盾; F40 優良・獵豹之棍棒 → 華麗・迅捷之神聖短劍; F50 華麗・迅捷之神聖短劍 → 華麗・浣熊之匕首 | 0 / 0 |
| bw3 | DIED F65 boss t27 (HP1, 0 pot, 必敗) | 13→0 | F30 19, F35 19, F40 31, F45 22, F50 62, F55 38, F60 68, F65 27 (sum 286) | 184 = 17.1% of 1074 (F30; F50 184 = 14.6%) | 509 = 47.4% of 1074 (F40 t4 minion 炎影刺客 蓄力一擊); 497 (39.5%) F50, 467 (35%) F65 | 2: F34 尚可・浣熊之斧 → 優良・浣熊之暴風短劍; F40 優良・浣熊之暴風短劍 → 華麗・奪心魔之暴風棍棒 | 0 / 0 |
Potions per boss start→end: bw2 23→21, 24→24, 25→23, 25→22, 22→19, 18→8, 10→0, 3→0; bw3 20→18, 18→18, 19→15, 18→16, 18→7, 9→5, 7→0, 1→0. Skills per boss: bw2 2,4,3,6,5,5,12,3; bw3 2,3,4,5,7,9,8,3.
- Charge hits >40% of max HP (minion 蓄力一擊; all shot): bw2 F55 t9 535 (43.8%, 被暴擊), F60 t27 549 (45.0%, 格擋 tag), F60 t29 496 (40.6%), F60 t70 610 (50.0%, left HP 52); bw3 F40 t4 509 (47.4%). Shots: bw2-F55t9-minion-charge-535-44pct-c40, bw2-F60t27-minion-charge-549-45pct-c40, bw2-F60t70-minion-charge-610-50pct-HP52, bw3-F40t4-minion-charge-509-47pct-c40 (t29 496 no shot). Boss (non-minion) normal hits never >20%; boss 重擊 ≤ 257 (~24%). No whole TURN >50% (dmg50 never fired), but the 610 hit equals exactly 50.0% of maxHP — 已驗證 (single hit).
- Boss fight length (已驗證, turn counter incl. minions): bw2 F45 60, F60 99, F65 52; bw3 F50 62, F60 68. Dev prediction ≤40 turns exceeded in both runs from F45 on; bw1 (earlier) had F45 48, F50 65, F55 113. Across bw1-3 F45-F60 boss turns: 48-113 (bw1/2) — the dominant cause of death is potion drain (13→~25 by F40, then −5 to −10 per boss from F50).
- Deaths: both F65, 0 pots, HP 1 必敗 ★D/★A; death screens bw2-death-F65, bw3-death-F65. Details last 5 turns in deathlog. Merchant at F57/59/62/64 each sold 1 bottle (thr 8; held 0-6) — 1/merchant cap can't recover (推測 unchanged).
- c6 red decisions: bw2 15, bw3 13 occurrences, ★Z decision == red 「先喝藥」 (e.g. bw2 F50 t11 HP337; bw3 F33 t2 HP179 shot not saved); V「存活優先」★D seen (bw3 F65 t19 HP665, t24). 必敗 shown only at HP1/0 pot.
- ★ buffs: bw2 17 picks, bw3 17 picks (震盪 不動之盾 撕裂/靈巧 不滅 活力 堅守 厚皮 … 生命祝福 弱點洞察 …); ★ never on 【無效】; 部分無效 never offered to bulwark (bw2/3). Buff lists in driver state (not persisted).
- 自動換武器: swaps happen when a better item drops (weapon / shield); bw2 F40 and bw3 F40 both swapped to short sword/mace; bw2 F1 swap bonus line also visible on first victory screen (toast 自動換武器：尚可・浣熊之斧 → 優良・獵豹之棍棒). Weapons end as daggers/maces — 推測 bulwark ends on non-shield-synergy weapons (not verified).
- Staff 魔力合流 / Ether Tap: 0 / 0 (已驗證).
## Feel (手感分數, 推測)
- bw2: 3/10 — F60 boss 99 turns, potions 25→0 across F45-F60, minion charges 535-610 (up to 50% HP in one hit) spike hard; dies F65.
- bw3: 3/10 — same attrition: F50 62t / F60 68t, potions 0 by F60, dies F65. Bulwark 0/3 clears in rc12g (F60, F65, F65) vs 2/2 in rc12f; 推測 a regression or drift in bulwark boss fight length / minion charge damage vs rc12f (bw1/2 rc12f turns 176/226 total vs rc12g 7-boss partial 297 / 356 / 286 within F65).

---
# Update: oc 1 + oc 2 (build 3728a96, preset postF20-oc&fresh; both Lv13 / 109,649C / 0 abyss runs = fresh slot, 已驗證; 13 potions, 4x+跳過動畫, 深淵塔, ★-only). Dumps qa-saves/rc12g-oc-{1,2}-end.json
Main hand (已驗證 from start 裝備 panel + 自動換武器 lines + game's qa-snap saves via /workspace/wpn.py): start 精良・迅捷之棍棒 (club, oneHand) + 普通・石膚之塔盾 for both. oc1: NO swaps → club at every boss (F30-F75). oc2: F8 swap 精良・迅捷之棍棒 → 精良・殺戮之暴風匕首 (dagger, oneHand) → dagger at every boss F30-F100; F60 shield swap 普通・石膚之塔盾 → 華麗・石膚之秘銀塔盾. No staff at any boss in either run.
| run | result | pot start→end | boss turns F30.. | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 魔力合流 / 以太 |
| oc1 | DIED F75 boss t15 (HP1, 0 pot) | 13→0 | F30 16, F35 16, F40 30, F45 32, F50 12, F55 19, F60 35, F65 22, F70 34, F75 15 (died) (sum 231) | 203 = 24.9% of 816 (F75 t1) | 408 = 50.0% of 816 (F45 t21 minion 風冠戰士 蓄力一擊) | 0 lines | 0 / 0 |
| oc2 | F100 boss CLEARED (3t), alive F101 HP 1087/1244 | 13→26 | F30 27, F35 26, F40 40, F45 44, F50 10, F55 20, F60 4, F65 12, F70 18, F75 20, F80 16, F85 26, F90 32, F95 13, F100 3 (sum 311) | 128 = 15.2% of 840 (F25); boss F30+ max 126 = 10.1% (F90) | 435 = 35.0% of 1244 (F90 雷牙翼龍); 412 = 49.0% of 840 (F45 t19 minion 風岩自走甲 蓄力一擊, 招架) | 2 lines: F8 club→dagger; F60 shield→秘銀塔盾 | 0 / 0 |
Potions per boss start→end: oc1 20→18, 19→17, 18→15, 18→13, 15→13, 16→13, 14→3, 6→3, 5→0, 3→0; oc2 23→20, 20→17, 20→16, 16→11, 14→13, 15→13, 15→15, 18→17, 21→19, 20→19, 20→20, 21→22, 26→25, 26→25, 26→26. Skills per boss: oc1 2,2,6,6,4,5,6,3,4,3; oc2 3,3,3,5,3,4,3,3,5,4,4,4,6,3,3.
- Charge hits >40% (minion 蓄力一擊; all shot): oc1 F45 t21 408 (50.0%), F55 t7 335 (41.1%), F60 t31 337 (41.3%), F70 t14 396 (48.5%, hit at HP→1; 3 pots left); oc2 F45 t19 412 (49.0%). Shots: oc1-F45t21-minion-charge-408-50pct-c40, oc1-F55t7-...-335-41pct, oc1-F60t31-...-337-41pct, oc1-F70t14-HP1-minion-charge-396-49pct, oc2-F45t19-minion-charge-412-49pct-c40. Boss (non-minion) normal hits ≤25%; no TURN >50%.
- oc1 died: F60 35t + F65 22t + F70 34t drained 14→0 potions; merchants F62-F74 sold 1 bottle each (thr 8, held 1-5) — cap 1/merchant too small (推測, as rc12f oc1/ar). HP stayed 816 for the whole run (Lv13, no HP growth) vs oc2 1244 (HP growth came with ★ 生命祝福/力量 picks, 推測).
- oc2 min potion 11 at F45 boss end; F60-F100 pots 15-26. c6 9×, ★Z == red 「先喝藥」 each time (oc1 20×). 必敗 only oc1 F70 turn 14/F75 (HP1 0 pot).
- ★ buffs: oc1 18 picks, oc2 27; ★ never on 【無效】; 部分無效 never offered (oc). Staff 魔力合流 / Ether Tap / 以太: 0 / 0 both (已驗證; weapon was club/dagger so expected).
## Feel (手感分數, 推測)
- oc1: 4/10 — 12-35-turn bosses F40-F70 (club+shield, HP 816 flat), potions 18→0, died F75; minion charges ≥40% four times.
- oc2: 7/10 — clears F100 safely (min pot 11), but F40/F45 40-44 turn bosses and a 412 (49%) minion charge at F45 are the tense moments; high variance oc1 vs oc2 (推測 oc depends on HP growth and boss length luck).

## oc3 (preset=postF20-oc&fresh, build 3728a96 已驗證 shot oc3-badge-3728a96.png)
- 新存檔 &fresh 已驗證；13 藥水、4x、跳過動畫、深淵塔。
- 結果：**死於 F50 boss（第44回合）**，已通過 49 層，終局藥水 0。死因：蓄力一擊 266（35% maxHP 762，小怪 霜鋼戰士），HP 1 無藥水。
- Boss 回合（F30+）：F30 20t / F35 18t / F40 **56t** / F45 17t / F50 43t(死)。藥水 起→終：23→19, 19→14, 14→6, 8→6, 8→0；技能數 4,3,6,4,3。
- 最大單擊普通招：boss 場 F30 71(9.3%), F35 89(11.7%), F40 99(13.0%), F45 30(3.9%), F50 無記錄(0)；最大普通單擊 99 = 13.0% maxHP（已驗證，來自 log 單行）。(rmn 欄位在 F15 非boss 107 不計。)
- 最大蓄力：F40 292 (38.3%，吸血重擊，未超 40%)；F50 266 (34.9%)。>40% 蓄力：0 次；>50% 單回合：0 次。
- 自動換武器：1 行（地圖階段，F35）「自動換武器：精良・迅捷之棍棒 → 華麗・專注之短劍」。奇怪：存檔快照顯示主手 F10 起就是 dagger，F5 為 club → 行文與快照時間點不一致（推測：該行為 F10 前的換裝訊息在 F35 才被掃到/或結算畫面重複）。
- 魔力合流 0 / Ether Tap・以太 0（符合 oc 預期）。
- Buff ★：F5 戰意湧動, F8 收斂心神, F10 無盡戰意, F15 魂燃, F20 先手氣勢, F25 王者氣魄, F26 韌魂, F30 輕盈架勢, F35 節儉, F40 良品嗅覺, F45 弱點洞察；部分無效 tag：F8「元素共鳴【無效】」、F35「大秘儀【無效】」為未選之選項（★ 未選到無效）。
- 手感分數（推測）：3/10 — F40 打 56 回合耗掉 8 瓶藥水，之後藥水不夠；與 oc1(F75) oc2(F100) 差距大，變異大。
- 檔案：qa-saves/rc12g-oc-3-end.json；shots oc3-*。

## ar1 (preset=postF20-arcane&fresh, build 3728a96 已驗證, &fresh 已用)
- 結果：**死於 F60 boss（第35回合）**，已通過 59 層，終局藥水 0（起始 13 生命 + 3 法力藥水，非買入）。死因：藥水耗盡後 HP1，最後一擊 173（吸血重擊）。
- Boss 回合 F30+：F30 8t / F35 23t / F40 12t / F45 13t / F50 10t / F55 21t / F60 34t(死)。藥水 起→終：16→15, 15→12, 14→12, 15→12, 14→13, 12→8, 8→0。技能數全 0（★ 只按 A·攻擊/D/Z，從未施法）。
- 最大普通單擊：F40 96(13.3%), F50 113(13.0%), F55 173(19.9%), F60 237(27.3%，run 最大)；F30/F35/F45 記錄為 0（解析缺漏或全閃避，不可靠，推測）。蓄力：F60 小怪 67(7.7%)；無 >40% 蓄力、無 >50% 單回合。
- 主手武器（已驗證，存檔快照 F5–F40 皆 ebony staff；起始截圖 ar1-equip-start-staff.png：普通・烏木杖+2）。F42 自動換武器：「普通・烏木杖+2 → 華麗・專注之極寒柳木杖」(staff→staff，截圖 ar1-autoswap-F42-staff-to-staff.png)；之後無其他換武器行，推測 F45–F60 皆為該法杖（快照只到 F40，F45+ 未直接驗證）。**全程為法杖，未變成非法杖。**
- 自動換武器行數：1（地圖階段 F42）。
- 魔力合流：log 命中 3 次（F1 狂戰・炎角巨人、F35 雷冠飛龍、F40 雷冠地龍）= **敵方怪物詞綴**「魔力合流（Coalesced Mana）5 回合（對牠施法 MP 消耗減半）」，不是玩家法杖機制（已驗證，截圖 ar1-MH-first-F1.png）。Ether Tap / 以太：0。→ 非 arcane 預期 0 的 blade/bulwark/oc 若遇到此詞綴怪也會命中（本批 oc3 為 0）。
- Buff ★：F1 良品嗅覺, F5 元素共鳴, F10 冥想, F13 節能詠唱, F15 大秘儀, F20 魔力池, F25 火之印記, F30 澄心, F33 雷之印記, F35 冰之印記, F40 生命祝福, F43 無盡戰意, F45 尋寶者, F50 戰意湧動, F55 王者氣魄。部分無效/無效 tag（皆為未選選項）：F5 不動之盾, F13 厚皮, F30 鋒刃專精【無效】, F33 震盪+厚皮, F35 震盪, F40 弱點洞察【無效】, F45 處刑者【無效】, F55 不動之盾。
- 手感分數（推測）：3/10 — 法師 ★ 鍵永遠 A·攻擊，從未施法（skill=0），輸出弱，F60 打 34 回合耗盡藥水；屬 ★ 輸入策略限制，非確認遊戲 bug。
- 檔案：qa-saves/rc12g-arcane-1-end.json；shots ar1-*。

## ar2 (preset=postF20-arcane&fresh, build 3728a96 已驗證, &fresh 已用)
- 結果：**死於 F75 boss（第10回合）**，已通過 74 層，終局藥水 0。F75 開場只剩 1 瓶（F65 該場 32 回合耗 5 瓶）。死因：HP1 後被 134 重擊。
- Boss 回合 F30+（turns / 藥水起→終）：F30 17 (16→13) / F35 22 (15→11) / F40 17 (13→10) / F45 17 (12→8) / F50 14 (9→7) / F55 16 (10→7) / F60 15 (9→6) / F65 32 (7→2) / F70 17 (3→0) / F75 10 (1→0)。
- 最大普通單擊 %（maxHP 760/883）：F35 151 (19.9%)、F40 123 (16.2%)、F45 176 (19.9%)、F50 176 (19.9%)、F55 176 (19.9%)、F60 152 (17.2%)、F65 158 (17.9%)、F70 176 (19.9%)；F30、F75 無記錄。**Run 最大 176 = 19.9%**。蓄力/重擊：F65 227 (25.7%) 最大；無 >40%、無 >50% 單回合。
- **法術鍵（需求1–3，已驗證）**：ar1「★ 從不按法術」是我的誤判——driver 的 skill 計數只算 Q/W/E，法術鍵 1–6 沒算進去。ar2 的 ★ 實際按了法術：2 冰封 58 次、3 雷擊 30、4 狂風 10、5 聖擊 8、6 腐化 25，共 131 次；另 A·攻擊 85、Z 44、D 55、Q 2。決策文字：「弱點元素」「傷害較高元素」→ 法術；「普通攻擊」→ A。
  - F30 t1 指令列截圖 `ar2-F30-t1-cmdbar.png`：A/D/F/S/Q + 法術 1–6 全部可按（無 disabled），MP 60/60；★2·冰封（弱點元素）。普通戰 F31 `ar2-F31-normal-t1-cmdbar.png`：★5·聖擊，MP 60/60。
  - 各 boss t0/t1 ★ 鍵：F30 2/D、F35 3/D、F40 2/D、F45 2/6、F50 2/D、F55 A/A（「普通攻擊」）、F60 A/D、F65 3/2、F70 2/Z、F75 4/D（t1 D = 敵人蓄力中，「下回合最多可能受 380–442（≥最大 HP 40%）」）。MP 全程 59–71 滿值。
  - 法術可用但 ★ 選 A：全程 317 個決策回合中法術鍵可按（6 個可用），其中 ★=A 85 次（27%）；boss 戰 237 回合中 52 次（22%）。F55/F60 t0 ★A「普通攻擊」即使 MP 71/71 且 6 個法術可用（推測：該 boss 無弱點/元素抗性太高，選了普攻）。
- 主手（已驗證，存檔快照 F5–F75 皆 staff）：F5–F45 ebony、F50 oak、F55–F75 ebony(貓頭鷹之烏木杖)。全程為法杖，未變成非法杖。
- 自動換武器 3 行（地圖階段）：F45「普通・烏木杖+2 → 普通・毀滅之橡木杖」；F52「普通・毀滅之橡木杖 → 普通・橡木杖」；F52「普通・橡木杖 → 精良・貓頭鷹之烏木杖」。皆 staff→staff。
- 魔力合流：log 9 次，**全為敵方詞綴**（「…魔力合流（Coalesced Mana）5 回合（對牠施法 MP 消耗減半）」）；**玩家端 proc 0 次**；Ether Tap / 以太 0。
- Buff ★：F5 元素共鳴, F10 冥想, F11 節能詠唱, F15 魔力池, F20 澄心, F23 雷之印記, F25 大秘儀, F30 火之印記, F35 良品嗅覺, F40 戰意湧動, F41 生命祝福, F45 輕盈架勢, F50 無盡戰意, F53 迅捷調和, F55 王者氣魄, F60 魂燃, F65 撕裂, F70 韌魂；★ 從未選中任何 部分無效/無效 項（這些 tag 只出現在未選選項：F10/15/40 不動之盾、F35/65/70 震盪、F60/70 不滅 等）。
- 手感分數（推測）：5/10 — 法術流正常運作；F65 32 回合、藥水耗盡造成後段崩盤。
- 檔案：qa-saves/rc12g-arcane-2-end.json；shots ar2-*。

## ar3 (preset=postF20-arcane&fresh, build 3728a96 已驗證, &fresh 已用)
- 結果：**F49 撤退（非死亡）**，已通過 48 層，終局藥水 0。F48 是**普通戰**打 33 回合，藥水 8→0，HP 1 必敗仍倖存；F49 地圖 HP 77/760、0 藥水 → driver 的 ★ 地圖節點 = 「撤退回城（保留 100%）」（lowmap），遊戲建議文字「HP 10%、生命藥水 0 瓶：建議撤退」，我確認了撤退。
  - 奇怪（推測為提示不一致）：同一張地圖同時顯示「沒有生命藥水了：優先走休息節點」與 ★ 撤退，且營火 ♨ 與商人 $（可補藥）在路線上可選；★ 選了撤退。截圖 ar3-F49-lowmap-retreat.png。
- Boss 回合 F30–F45（turns / 藥水起→終）：F30 9 (19→18) / F35 16 (17→14) / F40 11 (13→12) / F45 23 (13→8)；F50 以後未到。
- 最大普通單擊：F35 129 (17.0%)、F40 141 (18.6%)；F30/F45 無記錄；run 最大 151 (19.9%，F20 非boss)。蓄力：F40 124 (16.3%)；無 >40%、無 >50% 單回合。
- 法術鍵（需求1–3，已驗證）：F30 t1 指令列截圖 `ar3-F30-t1-cmdbar.png`（A/D/F/S/Q + 1–6 全可按，MP 52/52，★2·冰封「弱點元素」）；普通戰 F31 `ar3-F31-normal-t1-cmdbar.png`（★2·冰封「傷害較高元素」，MP 52/52）。
  - 各 boss t0/t1 ★ 鍵：F30 2/2、F35 A(「普通攻擊」)/D、F40 2/D、F45 3/D（t1 D = 敵人蓄力中）。
  - ★ 按鍵總計：2 冰封 34、3 雷擊 23、6 腐化 5、A 46、D 46、Z 27、Q 1。
  - 法術可用但 ★ 選 A：182 個決策回合中 46 次（25%）；boss 戰 102 回合中 21 次（21%）。
- 主手：F25 自動換武器「普通・烏木杖+2 → 優良・織咒者之柳木杖」(staff→staff)，之後無其他換武器；結束時（城鎮裝備畫面）主手 = 優良・織咒者之柳木杖（已驗證）。**注意：存檔 qa-snap 沒有 ar3 的 session**（dump 中只有 ar1/ar2 的 session），所以各 boss 的主手是由換武器行 + 結束狀態推得（推測，介於 F25–F49 為該柳木杖）；起始截圖 ar3-equip-start-staff.png 為烏木杖+2。全程為法杖。
- 自動換武器 1 行（地圖階段 F25）。
- 魔力合流：log 7 次，全為敵方詞綴；玩家端 proc 0；Ether Tap / 以太 0。
- Buff ★：F1 魔力池, F5 元素共鳴, F10 火之印記, F15 節能詠唱, F20 冥想, F25 大秘儀, F30 冰之印記, F35 雷之印記, F40 澄心, F45 力量祝福, **F46 不動之盾【部分無效】（★ 選中了「部分無效」標籤的選項，3 選項中另 2 個為 厚皮【部分無效】、弱點洞察【無效】——全部都無效，所以沒有更好選項）**。其他無效 tag 只在未選項：F5 弱點洞察、F15 鋒刃專精、F20 震盪、F35 不動之盾、F45 震盪。
- 手感分數（推測）：3/10 — F45 打 23 回合、F48 普通戰 33 回合耗光藥水，之後只能撤退。
- 檔案：qa-saves/rc12g-arcane-3-end.json；shots ar3-*。

## 更正與彙總（ar1–ar3）
- **更正 ar1**：ar1 記錄的「技能數 0 / ★ 從不施法」是 driver 計數只算 Q/W/E 造成的**誤判**。ar2、ar3 的 ★ 實際會按 1–6 法術鍵（見上），ar1 同一 driver/策略應也有施法，只是沒統計（推測）。
- **更正 ar1 主手**：ar1 的存檔快照（session u9jr）F5–F40 ebony、F45–F60 **willow**（F42 換為極寒柳木杖）全為 staff，已驗證到 F60（原先寫 F45+ 未驗證）。
- 三輪 arcane 魔力合流皆為敵方詞綴（ar1 3、ar2 9、ar3 7），玩家端 proc 0，Ether Tap/以太 0（已驗證 by 句型過濾「對牠施法」；ar1 沒有做過濾，但三筆事件文字皆為敵方詞綴）。
- 法術鍵可用卻被 ★ 選 A 的比例：ar2 27%（boss 22%）、ar3 25%（boss 21%）。「普通攻擊」決策文字出現在 boss t0（ar2 F55/F60、ar3 F35）。

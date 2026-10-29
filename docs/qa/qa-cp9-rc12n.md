DONE rc12n (blade/oc on rc12n 00d6557; bulwark/arcane results are in qa-cp9-rc12m.md on 1f2f0e9)

## FINAL SUMMARY — 4 schools × 3 runs (all with 13 starting potions, ★ only)
Blade and oc: rc12n (00d6557). Bulwark and arcane: rc12m (1f2f0e9) rows taken from qa-cp9-rc12m.md. Boss-turn median = median turns of the F30+ boss fights that ended (the fatal boss excluded). "Max turn %" marked ‡ = pre-fix driver (summed hit lines, can double-count the previous turn's hits) — treat as **upper bound**; unmarked = post-fix (summary line 受到 N). Max single hit % = largest single hit / maxHP over the run (boss or minion).

| School | Run | End floor / outcome | F30+ boss-turn median | Max single hit % | Max turn % | Potions at death/end |
|---|---|---|---|---|---|---|
| blade | bl1 | F80 death | 6.0 | 35.0 (F70 413/1181) | 35.0 ‡ | 0 |
| blade | bl2 | F70 death | 6.5 | 25.6 (F50 216/844) | 35.0 ‡ | 0 |
| blade | bl3 | F70 death | 6.0 | 39.98 (F70 347/868, screenshot) | 50.0 (434/868, not >50) | 0 |
| oc | oc1 | F50 death | 9.0 | 32.8 (F40 260/792) | 47.9 (379/792) | 0 |
| oc | oc2 | F40 death | 16.0 | 35.0 (F30 296/846) | 50.0 (423/846, not >50) | 0 |
| oc | oc3 | F50 death | 24.5 | 40.0 (F30 336/840, hit-line parse only, unverified; detector did not fire) | 35.0 (302/864) | 0 |
| bulwark | bw1 | F72 retreat (kept 100%) | 8.0 | 32.2 (F65 433/1344) | 40.0 ‡ | 0 (HP 138) |
| bulwark | bw2 | F47 retreat | 14.0 | 39.9 (F45 478/1197) | 40.8 ‡ | 0 (HP 289) |
| bulwark | bw3 | F62 retreat | 7.0 | 39.9 (F55 432/1082, screenshot) | 44.5 ‡ | 0 (HP 109) |
| arcane | ar1 | F57 retreat | 16.0 | 21.2 (F25 161/760) | 34.9 ‡ | 0 (HP 77) |
| arcane | ar2 | F60 death | 16.5 | 39.95 (F60 294/736, screenshot) | 30.4 (231/760; dev-corrected, was misread as 50.3) | 0 |
| arcane | ar3 | F70 death | 14.5 | 30.1 (F45 229/760) | 34.9 ‡ | 0 |

**Median end floor per school:** blade **70** (80/70/70) · bulwark **62** (72/47/62) · arcane **60** (57/60/70) · oc **50** (50/40/50).
No single hit >40% of max HP in any run (closest: oc3 40.0% unverified, bl3 39.98%, ar2 39.95%, bw2/bw3 39.9%). Only turn at exactly 50.0%: bl3 F70 t31 and oc2 F10 t5 (not >50%). Bulwark/arcane retreats were driver-accepted retreat dialogs, not deaths. rc12m blade calibration runs (bl1/bl2 on 1f2f0e9) cleared F100 and are not in this table.
Blade F70+ is where potions drain (22–41-turn bosses); oc is weakest — dies F40–50 with long boss fights (16–25 median turns) and no F70+ data.

# qa-cp9-rc12n — blade runs 1–2 (build badge: `build 00d6557 · CP4–CP9`, matches tag 00d6557 / HEAD of hv-v3-cp9rc12n "docs: rc12n") 已驗證
Method as rc12m: preset=postF20-blade&fresh (fresh save each run), 13 potions, 4x + 跳過動畫, ★ only, drvRC12n.js (= rc12m driver, tele screenshots re-enabled for first 2 telegraphs/run), detectors from F1: single hit ≥39% screenshot (>40% = bug), turn >50% screenshot.
Shots: qa-cp9-rc12n-shots/ (bl1-*, bl2-*). Saves: qa-saves/rc12n-blade-1-end.json, rc12n-blade-2-end.json.

## Summary
| | bl1 | bl2 |
|---|---|---|
| Death | **F80** boss (t26, 0 pot, last hit 60=5%) | **F70** boss (t31, 0 pot, last hit 68=8%) |
| Max HP | 820→1181 (F65+) | 832→844 |
| Hits ≥39% / >40% | none / none | none / none |
| Turns >50% | none | none |
| Max single turn | 413/1181 = 35.0% (F70 t9) | 295/844 = 35.0% (F43 t1) |
| Max boss charge | 413 (35.0%, F70) | 216 (25.6%, F50) |
| Z cooldown max | 1 (same-turn 1); first text F21 | 1 (same-turn 1); first text F20 |
| Telegraph rows | 64 | 70 |
| ★ key at telegraph | D 47, Z 5, A 4, 閃避/E 7, W 1 | D 50, A 8, Z 5, E 6, W 1 |
| 自動換武器 | 1 (F40 優良・平衡之雷擊鐮刀→華麗・殺戮之長劍) | 0 |
| Feel (推測) | 4/10 | 3/10 |
Telegraph outcomes: ★D (defend) on 47/50 telegraphs, damage mostly 0 after defend with some 27–35% turns when multiple charges stacked; every charge-turn capped at exactly 35.0% of max HP (413/1181, 295/844) — looks like a 35% cap per charge (推測). Interrupts: bl1 1 (F71), bl2 4 (F56,58,63,66, all with 閃避). Full per-telegraph rows (floor:turn:boss/minion:key:dmg:pct:I/D/E) in -data.jsonl type 'tele'. Telegraph shots: bl1-tele1-F33-t1, bl1-tele2-F33-t4, bl2-tele1-F25-t4, bl2-tele2-F26-t1. Key counts 1–6 not used (blade); Z used to drink.
Thorn/反傷 low-HP ★ attacks: none logged.

## bl1 boss table (F30+)
| F | turns | pot | HP start→end(map)/max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 3 | 17→17 | 712→397/820 | 0 | 163 | 0 |
| 35 | 18 | 15→13 | 820→438/820 | 1 | 147 | 0 |
| 40 | 5 | 10→9 | 820→716/820 | 1 | 82 | 0 |
| 45 | 6 | 8→8 | 918→503/918 | 0 | 0 | 0 |
| 50 | 4 | 8→8 | 917→640/918 | 0 | 0 | 0 |
| 55 | 1 | 8→8 | 965→835/965 | 0 | 0 | 0 |
| 60 | 6 | 8→7 | 872→896/965 | 1 | 0 | 0 |
| 65 | 6 | 8→7 | 1181→1181/1181 | 1 | 222 | 0 |
| 70 | 22 | 8→4 | 1181→1117/1181 | 1 | 128 | 413 |
| 75 | 17 | 6→2 | 940→971/1181 | 1 | 242 | 0 |
| 80 | 26+ | 3→0 | 1004→death/1181 | 1 | – | – |
Checkpoints: F10 16|739/820|754C · F20 17|673/820|3,483C · F30 17|712/820|8,122C · F40 10|820/820|15,269C · F50 8|917/918|23,741C · F60 8|872/965|34,255C · F70 8|1181/1181|45,866C · F80 3|1004/1181|58,206C · death F80 0|0/1181.
F30–65 vs F70+: F30–65 bosses avg 6.1 turns, ~1 potion total; F70/75/80 bosses 22/17/26 turns and potions 8→0 — F70+ is where potions drain.

## bl2 boss table (F30+)
| F | turns | pot | HP start→end(map)/max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 3 | 14→14 | 828→433/844 | 0 | 152 | 0 |
| 35 | 3 | 12→13 | 813→432/844 | 0 | 0 | 0 |
| 40 | 7 | 12→11 | 844→844/844 | 1 | 0 | 0 |
| 45 | 6 | 8→7 | 633→807/844 | 1 | 0 | 0 |
| 50 | 8 | 4→3 | 633→599/844 | 1 | 0 | 216 |
| 55 | 9 | 6→4 | 472→580/844 | 1 | 110 | 0 |
| 60 | 8 | 6→4 | 748→643/844 | 1 | 196 | 0 |
| 65 | 6 | 6→5 | 811→596/844 | 1 | 137 | 0 |
| 70 | 31 | 7→0 | 764→death/844 | 1 | – | 295 turn |
Checkpoints: F10 14|831/832|788C · F20 16|810/832|3,748C · F30 14|828/844|7,866C · F40 12|844/844|14,771C · F50 4|633/844|24,192C · F60 6|748/844|33,078C · F70 7|764/844|43,724C · death F70 0|0/844.
F30–65 vs F70+: F30–65 bosses avg 6.2 turns, potions 14→5; F70 boss 31 turns drained 7 potions and killed.

# bl3 (blade 3, rc12n, driver with per-turn fix: turn dmg = summary line 受到 N) — badge build 00d6557 已驗證
- **Died F70** boss 鐵壁迅捷・深淵之王・霜翼熊 (turn 41, 0 potions, last hit 144 = 17%; last turns -217/-144).
- Max HP 838 → 802 (F40–65) → 868 (F70). 自動換武器 0. Interrupts 2 (F61, F66, with 閃避).
- Hits: **one hit within 1% of the 40% line: F70 t13 炎羽刺客 蓄力一擊 347/868 = 39.98%** (not >40%) — shot bl3-F70-t13-hit347-of-868-39.98pct.png. No hit >40%. Max single turn per fixed driver: F70 t31 434/868 = 50.0% (exactly the line, not >50%; no screenshot taken since the trigger is strict >50%; 推測 whether summary line counts two hits' worth). Other turns ≤34.9% (the repeating 280/303 values are the same charge hit being re-logged — treat as upper bounds, 推測).
- Z cooldown max 1 (same-turn 1); first text F26 (shot bl3-F26-first-cooldown-text.png). Telegraph rows 58; ★ key at telegraph: D 44, A 6, Z 6, 閃避 2. Telegraph shots bl3-tele1-F18-t1, bl3-tele2-F18-t2. 反傷 low-HP ★ attacks: none. Feel (推測): 4/10.

| F | turns | pot | HP start→end(map)/max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 6 | 17→16 | 838→755/838 | 1 | 167 | 0 |
| 35 | 3 | 16→16 | 802→582/802 | 0 | 151 | 0 |
| 40 | 4 | 16→16 | 742→390/802 | 0 | 0 | 0 |
| 45 | 5 | 15→15 | 802→383/802 | 0 | 0 | 0 |
| 50 | 16 | 16→15 | 586→434/802 | 1 | 118 | 0 |
| 55 | 7 | 14→13 | 802→488/802 | 1 | 160 | 0 |
| 60 | 22 | 11→8 | 763→408/802 | 1 | 170 | 0 |
| 65 | 6 | 8→7 | 769→802/802 | 1 | 0 | 0 |
| 70 | 41 | 8→0 | 868→death/868 | 1 | – | 347 |
Checkpoints: F10 13|755/838|784C · F20 14|762/838|3,671C · F30 17|838/838|8,258C · F40 16|742/802|14,746C · F50 16|586/802|24,734C · F60 11|763/802|34,502C · F70 8|868/868|46,507C · death F70 0|0/868.
F30–65 vs F70+: F30–65 bosses avg 8.6 turns, potions 17→7; F70 boss 41 turns drained all 8 remaining potions.

# oc1 (oc 1, rc12n) — badge build 00d6557 已驗證
- **Died F50** boss 守護尖刺・深淵之王・炎爪魔像 (turn 23, 0 potions, last hit 137 = 16%; turns -87/-137). At the end the driver's ★ chose D at HP 1 because attacking a 反傷 target would self-kill (page text: 反傷約 36 ≥ HP 1).
- Max HP 792 → 840 (F45). 自動換武器 1 (F40 普通・石膚之塔盾 → 華麗・戰鬥法師之圓盾). Interrupts 0.
- Hits: no hit ≥39%. Max boss normal 158 (20.0%, F35); max charge 268/840 = 31.9% (F45). Max single turn 379/792 = 47.9% (F35 t3, ★Z during a charge turn; below 50%, no screenshot). No turn >50%. Z cooldown max 1 (same-turn 1); first text F10 (oc1-F10-first-cooldown-text.png). Telegraph rows 67; ★ key at telegraph: D 51, Q 6, Z 6, A 4. Telegraph shots oc1-tele1-F10-t6, oc1-tele2-F25-t1. 反傷 low-HP ★ attacks: none (★ avoided them at HP 1). Feel (推測): 3/10.

| F | turns | pot | HP start→end(map)/max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 11 | 9→7 | 757→718/792 | 1 | 80 | 219 |
| 35 | 6 | 9→7 | 792→683/792 | 1 | 158 | 226 |
| 40 | 7 | 7→6 | 724→698/792 | 1 | 136 | 260 |
| 45 | 22 | 8→5 | 619→671/840 | 1 | 104 | 268 |
| 50 | 23 | 4→0 | 840→death/840 | 1 | – | – |
Checkpoints: F10 15|728/792|748C · F20 11|792/792|3,465C · F30 9|757/792|8,179C · F40 7|724/792|15,538C · F50 4|840/840|24,110C · death F50 0|0/840.
F30–65 vs F70+: only F30–50 reached (5 bosses, 69 turns, potions 9→0); no F70+.

# oc2 (oc 2, rc12n) — badge build 00d6557 已驗證 (shot oc2-badge-00d6557)
- **Died F40** boss 堅硬・災厄・風牙飛蛾 (turn 28, 0 potions, last hit 57 = 6%; turns -131/-20/-57). Potions ran out at the F35 boss (1→0) and the F40 boss was fought with none.
- Max HP 846 → 888 (F35). 自動換武器 1 (F30 普通・石膚之塔盾 → 精良・守護之靈巧鳶盾). Interrupts 0.
- Hits: none ≥39%. Max charge 296/846 = 35.0% (F30). **Max single turn (post-fix summary line): F10 t5 423/846 = 50.0%** (295 charge + 128; exactly on the line, not >50%, no screenshot). Next: F40 t15 310/888 = 34.9%. Z cooldown max 1 (same-turn 1), first text F10 (oc2-F10-first-cooldown-text.png). Telegraph rows 64; ★ keys D 44, Z 9, Q 6, A 5. Telegraph shots oc2-tele1-F10-t4, oc2-tele2-F10-t10. 反傷 low-HP ★ attacks: none. Feel (推測): 2/10.

| F | turns | pot | HP start→end(map)/max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 20 | 5→1 | 692→437/846 | 1 | 76 | 296 |
| 35 | 12 | 1→0 | 888→888/888 | 0 | 0 | 221 |
| 40 | 28 | 0→death | 831→death/888 | 1 | – | – |
Checkpoints: F10 15|846/846|812C · F20 11|846/846|3,417C · F30 5|692/846|7,858C · F40 3|831/888|14,089C · death F40 0|0/888.
F30–65 vs F70+: only F30–40 reached (3 bosses, 60 turns); no F70+.

# oc3 (oc 3, rc12n) — badge build 00d6557 已驗證 (badge text read on page; no separate badge screenshot was saved for oc3)
- **Died F50** boss 迅捷烈焰・深淵之王・霜牙蜥蜴 (turn 27, 0 potions, last hit 60 = 7%; turns -56/-34/-60).
- Max HP 840 → 864 (F45). 自動換武器 1 (F30 精良・迅捷之棍棒 → 精良・殺戮之虛靈短劍). Interrupts 4 (F30, F33, F46, F48, 閃避/打斷).
- Hits: the per-hit detector (summary-line based) did not fire (no hit ≥39%). The older fightEnd parse reports a F30 charge of 336/840 = 40.0% (hit-line parse, exactly on the line, not >40%) — unverified, no screenshot (推測: misattributed). Max single turn 302/864 = 35.0% (F45 t15). Z cooldown max 1 (same-turn 1), first text F5 (oc3-F5-first-cooldown-text.png). Telegraph rows 86; ★ keys D 59, Q 13, Z 9, A 4, S 1. Telegraph shots oc3-tele1-F5-t6, oc3-tele2-F15-t3. 反傷 low-HP ★ attacks: none. Feel (推測): 3/10.

| F | turns | pot | HP start→end(map)/max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 27 | 10→6 | 761→840/840 | 1 | 33 | 336* |
| 35 | 22 | 7→4 | 840→386/840 | 1 | 0 | 251 |
| 40 | 6 | 4→4 | 775→510/840 | 0 | 43 | 213 |
| 45 | 32 | 6→1 | 864→577/864 | 1 | 139 | 299 |
| 50 | 27 | 3→0 | 749→death/864 | 1 | – | – |
Checkpoints: F10 14|840/840|868C · F20 14|790/840|3,734C · F30 10|761/840|8,284C · F40 4|775/840|15,711C · F50 3|749/864|22,953C · death F50 0|0/864.
F30–65 vs F70+: only F30–50 reached (5 bosses, 114 turns, potions 10→0); no F70+.
oc F30+ bosses (oc1–3) take 6–32 turns and eat 1–5 potions each; oc never reaches F60 on 13 potions; F70+ is untested for oc.

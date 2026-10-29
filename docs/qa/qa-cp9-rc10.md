DONE: rc10 finished after oc 4; waiting rc11 (5359)
# cp9-rc10 acceptance (build 89a7cf0, :5358)

## oc 1 — died F45 (boss, T21), passed 44
- Badge: build 89a7cf0 CP4–CP9, not dirty, no preset warning. Start potions 13 (3 held + 10 bought). Lv13, ADB 183.
- Cause: F45 boss 嗜血尖刺・塔主・雷刃飛龍 蓄力一擊 255 (30% maxHP) at HP 1; potions 0 since ~F44; D-only hints ("保命剩 1 HP").
- Potion sources: start 13; merchant 4 purchases entered (mp=4); chest 3; battle drop 5 (F1–3 counts lost to a driver reset; only totals from F4). Battle drinks 25, map drinks 2.
- Merchants offered 16, entered 4 (skips = ★ pointed to rest/chest/elite/battle). Chests offered 9, opened 7 (when ★ pointed there).
- Boss turns: F5 6, F10 6, F15 18, F20 9, F25 14, F30 27, F35 23, F40 16, F45 21. dmgPerTurn: not measurable (boss HP value not in page text; only a tiny bar).
- (j)-style charge log (oc): F5 hit?, F10 hit?, F15 hit?, F20 interrupted, F25 hit?, F35 hit?/hit?/interrupted, F40 interrupted×2 (auto-classified).
- maxPct 50, ≥20% turns warned 8 / unwarned 0 (driver counts "warned" loosely).
- (c): revive text "2 回合後重新蓄力" present each time (F5, F10, F40). Heavy-hit text "1 回合後重新蓄力" present on landed heavy hits (F15 t15, F35 t10); driver's "false" entries are charge lines, not hits.
- (b): 4 flagged lines have "估計 N ≥ HP" with "防禦後撐得住" in the same decision — not a contradiction by text, but matches the brief's example pattern; screenshot not taken. Treat as ambiguous.
- (m) D presses 33, driver check was a bad regex (6 false flags); battle log after D shows "防禦" lines. No real mismatch seen.
- rc10 verification: Q first on charge (F5 t4, shot qhint-charge-oc-1-F5t4); resist shown under boss HP bar "暈眩抵抗中（剩 2 回合）" F25 t9 (stunres-oc-1) — Q was on cooldown there so "no Q hint" is not conclusive; F45 t19 resist: hint was D only (no Q). Reflect: F45 t20 hint "D·防禦（攻擊…會吃反傷約 22 ≥ HP 1，會自殺）" — A not hinted (text only, also on death screen). Cooldown hint (F13 t3, cooldown-oc-1): HP 709 so no hint shown — not a real test.
- Stars: ★ followed every map; kinds seen: rest before boss, merchant when potions low, elite when HP/potions fine, chest.
- Shots: qa-cp9-rc10-shots/{badge,qhint-charge-oc-1-F5t4,cooldown-oc-1-F13t3,stunres-oc-1,death-oc-1,gear-oc-1}.webp
- Feel (opinion): 3/5.

## oc 2 — died F60 boss (T12), passed 59 (not >60, so no cap)
- Badge build 89a7cf0 clean. Start potions 13. Lv13 whole run (Lv15 after).
- Cause: out of potions from ~F49; F60 boss fight with 炎岩巨人 charging every turn (432 crit/302/222) + 嗜血 boss bleed; final turn 10 dmg bleed at HP 1. Hints D-only ("保命剩 1 HP"), at HP1 hint "A·攻擊（HP 1、沒有可用藥水）".
- Potions: start 13; merchant 4 entered purchases; chest 5; battle drops 9 (total 14 gained mid-run). Drinks battle 28, map 3.
- Merchants offered 16, entered 4 (★ rarely pointed to merchant when potions ≥ some level). Chests offered 20, opened 12.
- Boss turns: F5 5, F10 9, F15 4, F20 7, F25 12, F30 38, F35 28, F40 13, F45 28, F50 24, F55 8, F60 12.
- Stun resist shown under boss HP bar (F30 t6, shot stunres-oc-2.webp; Q was on cooldown 6). F30 and F35: Q on cooldown during charges → hint D only (qdis true on all 6 flagged turns) — consistent with "Q held back".
- Q first on charge: F10 t6 (hint Q), F60 t1 "Q·盾擊（打斷蓄力）" → stun 6 turns; then 暈眩抵抗中 shown F60 t7/t8 log.
- (h)/(l): "暈眩 N（之後抵抗 M）" text under HP bar not found in page text; only "暈眩抵抗中（剩 N 回合）".
- (b): b-candidate list empty after I excluded lines containing 防禦後 (they explain defended outcome). 
- Shots: stunres-oc-2, death-oc-2, gear-oc-2 (.webp). No qhint shot for oc 2 (event passed unseen).
- Feel (opinion): 3/5.

## blade 1 — died F35 boss (T16), passed 34
- Badge build 89a7cf0 CP4–CP9, no preset warning. Start potions 13 (3 held + 10 bought). Lv14 (Lv15 after). Post-death gear: weapon 優良・平衡之雷擊鐮刀; armor 精良・守護之瑪瑙板甲頭盔 / 優良・守護之板甲胸鎧 / 優良・減幅之鎖子鐵手套 / 精良・偏轉之皮革護腿 / 優良・噬火者之板甲鐵靴 (3 pieces auto-swapped mid-run).
- Cause: F35 boss 銳眼・守門者・風爪狼 (spiked-shield reflect 92/turn + charges), potions 0 from t9; fatal 183 at HP 1 (20%). At HP 1, hint was "A·攻擊（HP 1、沒有可用藥水：直接輸出）" while the log showed 尖刺盾 up (reflect) — A hinted although reflect would be lethal (candidate violation of "no A hint on lethal reflect"; not screenshotted).
- Potion sources (driver heuristic): start 13; merchant 4; chest 2; drop 5. Drinks 22 battle + 2 map.
- Merchants offered 12, entered 4 (★ pointed elsewhere on skips); chests offered 9, entered 6.
- Boss turns: F5 8, F10 11, F15 7, F20 13, F25 13, F30 51, F35 16. dmgPerTurn in data.jsonl (many nulls; F5/F15 lost to driver reset).
- dumpls: every call failed (AttributeError 'str' object has no attribute 'is_dir'); no saves copied.
- (a) 0. (b) candidates ≥4 (banner "HP 危險 … ≥ HP" + "防禦後撐得住" in one decision, F30 t3,11,14,35). (c) heavy-hit "1 回合後重新蓄力" yes on all landed heavy hits (F10 t5, F30 ×5, F35 t5,t14); revive "2 回合後重新蓄力" yes ×5; driver false positives on charge lines ignored. (d) 0 repeats. (e) not tracked; maxPct 35. (h)/(l): no stun occurred, untested. (k) 0 violations flagged. (m) D lines always showed 防禦; no mismatch seen (weak check).
- Q hinted on charge: F5 t4 only. Q enabled but not first on boss charge: F25 t9 (W>A), F30 t9/t32, F35 t4 (HP full, D hinted) — candidates.
- Shots: qhint-charge-blade-1-F5t4, heavy1-blade-1-F10t5, death-blade-1, gear-blade-1 (.webp). Not captured (never occurred): resist marker w/o Q hint, low-HP cooldown hint, reflect-lethal with no-A hint (only a bad A hint seen).
- Feel (opinion): 3/5.

## blade 2 — died F45 boss (T16), passed 44
- Start potions 13. Lv14 (Lv15 after). Post-death gear: weapon 優良・戰鬥法師之鐮刀 (+160 dmg); armor 華麗・霜生者之翡翠鎖子頭盔 / 優良・噬火者之秘銀鎖子胸鎧 / 優良・偏轉之翡翠鎖子鐵手套 / 華麗・減幅之琥珀克維拉護腿 / 優良・噬火者之板甲鐵靴.
- Cause: F45 boss 尖刺銳眼・塔主・炎尾雙頭龍 (reflect 20–48/hit, summons moth); potions 0 from t12; HP ground to 1 by reflect + moth; fatal charged strike 120 at HP 1 after D (defend did not save).
- Potions (heuristic): start 13; merchant 2; chest 5; drop 11. Drinks 29 + 2 map.
- Merchants offered 11, entered 2; chests offered 12, entered 8.
- Boss turns: F5 7, F10 6, F15 4, F20 5, F25 5, F30 11, F35 42, F40 49, F45 16.
- dumpls: all failed, same error.
- (a) 0. (b) candidates 11 (F30 t3,4; F31 t1; F40 t3,9,13,19,34; F43 t7; F45 t4,10). (c) heavy "1 回合後重新蓄力" yes F30 t5, F35 ×many, F40 t5/14/23/32, F45 t5/6/10/15; revive "2 回合" yes F5,F10,F15,F20,F25,F30(F35,F40). (d) 0. (e) untracked; maxPct 35. (h)/(l) untested (no stun, Q never hinted). (k) 0. (m) no mismatch seen (weak).
- Reflect: F45 t15 hint D only, red text "攻擊…會吃反傷約 40 ≥ HP 1，會自殺" — A not hinted (shot reflect-noA-blade-2-F45t15). Heavy "1 回合後重新蓄力" shot heavy1-blade-2-F30t5.
- Q: never hinted on a boss charge in blade 2 (Q usually on cooldown/off at charge turns or HP lethal first).
- Shots: heavy1-blade-2-F30t5, reflect-noA-blade-2-F45t15, death-blade-2, gear-blade-2.
- Feel (opinion): 3/5.

## blade 3 — died F35 boss (T43), passed 34
- Start potions 13 (3+10). Lv14 (Lv15 after death). Gear at start: weapon 優良・戰鬥法師之鐮刀; armor 華麗霜生者翡翠鎖子頭盔 / 優良噬火者秘銀鎖子胸鎧 / 優良偏轉翡翠鎖子鐵手套 / 華麗減幅琥珀克維拉護腿 / 優良噬火者板甲鐵靴. Post-death gear screen: shot gear-blade-3.
- Cause: F35 boss 尖刺・守門者・風毒精靈 (spiked shield reflect 75/hit + charges 261/374), potions 0 from t37; fatal 蓄力一擊 209 at HP 1 after D (D only saves to 1 HP; red warning shown; Z unavailable).
- Potions: start 13; merchant 1; chest 2; drop 10 (heuristic). Drinks 22.
- Merchants offered 9, entered 1 (★ pointed to merchant only at F32; 8 skips = ★ pointed elsewhere). Chests offered 10, entered 7.
- Boss turns: F5 4, F10 10, F15 5, F20 7, F25 16, F30 70, F35 43.
- (a) 0. (b) 'HP 危險 ≥ HP' + '防禦後撐得住' ≥9 occurrences (shot bline-blade-3-F30t4). (c) heavy hit → "1 回合後重新蓄力" yes on all landed; revive "2 回合後" yes ×7. (e) 0 detected. (k) 0 flagged. (m) D always showed 防禦 in following log where checkable (driver heuristic mDbad false positives from stale reads; strict re-check: 防禦 missing 2/4 at F25 — those logs show 招架/防禦：解除… so no real mismatch seen).
- Q hinted first on charge: F20 t4 (Q→stun/interrupted? then boss revived). Q enabled but not hinted first: F10 t4 (D hinted; shot qnf-blade-3-F10t4); others D-first on F25/F30/F35 charges (Q probably on cooldown/not checked).
- No A-hint-with-lethal-reflect seen (F35 t42 HP1 hint D only: shot reflect-noA-blade-3-F35t42). Resist marker / stun not seen. Cooldown low-HP shot not captured (cooldown event fired at HP 602/599).
- dumpls: ran OK (path+14) but all files identical (pre-run town state).
- Feel (opinion): 3/5.

## blade 4 — died F35 boss (T14), passed 34
- Start potions 13. Lv14 (Lv15 after). Start gear as blade 3 (preset). Post-death gear: weapon 普通・殺戮之鐮刀; armor 精良・守護之瑪瑙板甲頭盔 / 優良・噬火者之秘銀鎖子胸鎧 / 優良・偏轉之翡翠鎖子鐵手套 / 精良・守護之板甲脛甲 / 優良・噬火者之板甲鐵靴 (shot gear-blade-4).
- Cause: F35 boss 冰霜・守門者・雷紋蛇龍 (+moth minion); potions 0 from t10 (only 2 left entering boss); at HP 1 T13 hint was "A·攻擊（HP 1、沒有可用藥水：直接輸出）" (boss charging, spiked shield cast t10 — buffs not captured in a shot, driver pressed A); fatal 重擊 293 (35%).
- Potions: start 13; merchant 1; chest 4; drop 8. Drinks 25.
- Merchants offered 10, entered 1 (★ merchant only at F34). Chests offered 12, entered 8.
- Boss turns: F5 5, F10 8, F15 9, F20 9, F25 25, F30 48, F35 14.
- (a) 0. (b) 'HP 危險 ≥ HP' + '撐得住' ≥5 (F30 t4 ×2 reads, F35 t3,t4,t10; shot bline-blade-4-F30t4). (c) heavy "1 回合後重新蓄力" yes on landed heavy hits; revive "2 回合後" yes ×6. (e) 0. (k) 0. (m) D→防禦 present in following log every time (0 mismatch).
- Q hinted first on charge: F15 t4 (Q first), F20 t4 (Q → interrupted). Q enabled but A/D hinted first: F10 t4 (A, HP safe; shot qnf-blade-4-F10t4), F25/F30/F35 charges D-first (HP danger).
- Reflect-lethal A-hint: occurred F35 T13 (HP 1 no potions) — NOT screenshotted (driver trigger required shield text); verified via death-screen text + trace. At F35 T12 hint was D only with red "反傷約 84 ≥ HP 1 會自殺" (shot reflect-noA-blade-4-F35t12) — so same HP-1 state gave D-only on T12 but A on T13 (inconsistent).
- Resist marker / stun lines not seen. Low-HP-during-cooldown screenshot not captured (driver cooldown event fired after potion at healthy HP).
- Feel (opinion): 3/5.

## oc 3 — ALIVE at F61 (cap, passed F60 boss)
See qa-cp9-rc10-counters-oc-3.txt. Potions start 13; merchant 7; chest ~3; drop ~20 (heuristic). Merchants offered 19/entered 7; chests 13/13. Boss turns F5 6,F10 8,F15 5,F20 8,F25 12,F30 20,F35 21,F40 15,F45 20,F50 27,F55 20,F60 26. maxPct 50.
- (b) contradiction F30 t8 (shot bline-oc-3-F30t8), F45 t5. Q enabled-not-first F20 t4 (Z first, lethal; shot qnf-oc-3-F20t4). Q first on charge F10 t4, F60 t25. Resist marker F45 t6 with Q on cooldown (stunres-oc-3). Revive "2 回合" yes; heavy-landed "1 回合" yes F30 t10, F35 t5.
- No A-at-HP<10% hint, no (a), no (k). No death; death log n/a. Feel (opinion): 4/5.


## oc 4 — died F31 (normal fight after F30 boss cleared at HP 1)
See qa-cp9-rc10-counters-oc-4.txt; deathlog lines run=oc-4; shots in qa-cp9-rc10-shots/*oc-4*. Boss turns F5 9,F10 12,F15 16,F20 16,F25 29,F30 51. Potions ran out at F30; merchants 0/6 entered (star always chest/rest); F31 ★ battle at HP 80.
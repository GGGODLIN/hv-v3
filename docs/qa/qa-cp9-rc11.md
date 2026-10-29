DONE: rc11 stopped after oc 1; switching to rc12 (5360)
# cp9 rc11b (build e745f44) — blade 1 & 2
Details in the final report; per-boss notes: /workspace/qa-saves/rc11-blade-1-bossnotes.md, rc11-blade-2-bossnotes.md. Hooks (hvTurnLog / localStorage qa keys) could NOT be read: browser_run_code blocks page.evaluate (policy_denied), so turnlog/snap JSON files were not written; per-turn damage was derived from the battle log instead.
## blade 1: died F40 boss t27 (potions 0). blade 2: died F35 boss t20 (potions 0, HP1, A hinted with spiked shield).

## bulwark 1 (build e745f44): ALIVE at F61 cap (no death), potions 25
- Lv11 constant; gear per boss in data.jsonl. Boss turns F5..F60: 8,5,9,4,11,11,13,16,22,9,22,17.
- Potions: start 13, merchants 4 (★ pointed to merchant F32,34,44,47), chests 6, fight drops ~19. Potions never <16 so no low-potion merchant shot, no retreat ★, no A@HP<10% hint, no death screen.
- Q first hint when boss charging: yes x5 (F5 t4, F40 t1, F55 t1, F60 t1...). Not Q-first only on lethal forecast (Z first, Q second) or when minion (not boss) charged (D first).
- (b) contradictions 0 (F40 t12 candidate was consistent: 防禦後估計 289<HP388).
- Shots: bw1-zaocheng-F1, bw1-gearpanel-F5.
## bulwark 2 (build e745f44): ALIVE at F61 cap (no death), potions 16
- Boss turns F5..F60: 12,11,8,15,17,22,20,22,18,27,13,25. Potions: start 13, merchant 4, chest 6, fight ~15; min seen 9.
- Q first when boss charging x11 (see data). (b) contradictions 0. No A hint at HP<10%, no retreat ★, no death.
- Shot: bw2-zaocheng-F1.

## bulwark 3 (build e745f44): DIED F40 boss turn 17 (potions 0)
- Verified: boss turns F5..F40: 12,12,18,14,13,27,24,17(died). Potions: start 13, merchants 5 bought, chest ~1, fight drops ~9; reached 0 at ~F31 and stayed ~0 (merchant ★ at F32 took 1/visit; one potion per merchant).
- Death: F40 boss 狂戰・災厄・霜尾光靈 + 雷毒蛇龍. t14 吸血重擊 336 (defended) healed boss +168; t15 -167 (HP90); t16 D→HP1 (防禦只靠保命剩 1HP); t17 -192 fatal. 死亡畫面「第 17 回合共受 192 傷害（佔最大 HP 20%）」.
- Verified texts: F40 t14 banner '防禦中 · 不防禦會死！建議 A·攻擊' + decision 'A·攻擊（...不必防禦）' (candidate banner/decision mismatch, no screenshot). F40 t16 HP1: A hinted 'HP 1、沒有可用藥水：直接輸出'.
- ★ merchant with potions 0 at F32 (shot). Retreat ★ never appeared (map HP never <25%).
- (a) 0; (b) 0 strict (3 false positives + 1 candidate above); (d) 0; (e) 0; maxPct 40.9; 3 warned ≥20% turns, 0 unwarned.
- Shots: bw3-zaocheng-F1, bw3-star-merchant-F32-potions0, bw3-death-F40. Dump: qa-saves/rc11-bulwark-3-end.json.
- Deathlog rows (qa-cp9-rc11-deathlog.jsonl) T9-T17 are reconstructed from driver turn snapshots; dmg per turn from HP deltas (defend heal turns pair with the following log).


## bulwark 4 (build e745f44): ALIVE at F61 cap, potions 21, HP 436/1048
- Verified (F45-F61): boss turns F45=22, F50=27, F60=16; maxPct single turn 50%; ~22 fight drinks + 5 map drinks; merchants entered 4/16, chests opened 16/17.
- (b): 0 strict; F60 t3 and t15 candidates are consistent (防禦後撐得住 -> D).  No retreat ★, no A@HP<10% boss-charging, no death.
- Caveat: early-run details (gear, F5-F40 turns) not retained after context compaction. Dump: qa-saves/rc11-bulwark-4-end.json. Shot: bw4-zaocheng-F1.


## arcane 1 (build e745f44) — died F55 boss t11
Verified (from page text): Lv14 constant; potions start 13; merchants entered 4 (F7,F47,F52,F54), potions bought 4; boss turns F5 4,F10 5,F15 4,F20 6,F25 8,F30 12,F35 25,F40 27,F45 25,F50 16,F55 11(died). Max single hit 50% (380) F50 t1 from second charger.
- ★ merchant with potions 0: F52 (HP 10%, 生命藥水 0 < 預估 8) shot a1-star-merchant-F52-potions0.png. No ★ retreat seen.
- Q first on non-resisted charge: F50 t1 and F55 t1 (shots a1-Qfirst-charge-F50t1.png). All other ~40 charges: Q disabled (OC<50), hint D/Z first. No Q hint during 暈眩抵抗中 (marker shot a1-resist-marker-Qready-F10t2.png; Q button looked enabled there, hint stayed 冰封).
- (j): Q at F50 t1 interrupted the bolt but 2nd charger hit 380; F55 t1 interrupted; every D/Z charge ended hit (defended 242-265).
- A hint at HP1 while boss charging AND spiked shield active (F55 t9) shot a1-A-hint-HP1-charging-spikedshield-F55t9.png: possible bug (reflect/bleed lethal); died t11 by bleed 7.
- b: 0 contradictions (F35t20 candidate was consistent, shot a1-b-candidate-F35t20-falsepositive.png). 造成 shot a1-zaocheng-F3.png. gear panel a1-gearpanel-F5.png. death a1-death-F55.png.
- F51 normal battle (charging monsters 21 turns) drained 6 potions -> 0; ★ chose battle at F51 with 6 potions.
Inferred: boss fights long from F35 because arcane dmg per turn small vs boss HP and 50% charges force D/Z each cycle; turnlog in qa-saves/rc11-arcane-1-end.json.


## arcane 2 (build e745f44) — reached F61 ALIVE
Verified (driver reads of page): Lv14, 12 bosses survived (turns 4/6/10/6/3/11/23/17/32/10/24/27), end potions 9 (start 13), 26 drinks, 0 map-screen contradictions, no retreat star, HP on map never <25%. Q first on non-resisted charge: F30 t1, F55 t1, F60 t1 -> boss charge interrupted. No Q hinted during resist marker (0). Other charges: D/Z, mostly hit.
Flag: F15 t1 charge hint was D while Q button enabled (driver flag only; no screenshot, driver at that time lacked the screenshot trigger).
Inferred: 'interrupted' for D at F40 t12, F60 t20/t25 is from log text match; merchant skipped 12 times when not starred; potion source attribution by delta.
Gear: only F15 leg and F20 mainhand changed. Per-boss: qa-cp9-rc11-counters-arcane-2.txt. Save: qa-saves/rc11-arcane-2-end.json.


## arcane 3 (build e745f44) — ended ALIVE by retreat at F51 (50 floors cleared)
Verified (page reads): Lv14 constant in run (Lv16 after retreat); potions start 13, merchants entered 4 (F7,F12,F47,F49), potions bought 4, drops 10 (fight 8, chest 2), 24 fight/boss drinks + 3 map drinks; boss turns F5 4, F10 5, F15 8, F20 8, F25 10, F30 15, F35 32, F40 35, F45 29, F50 19; max single hit 50%. (b)=0 contradictions (4 candidates e.g. F35 t3 估計 521 ≥ HP 521 / 防禦後 364 → D, consistent). Resist marker shot a3-resist-marker-F25t3.png (hint stayed 冰封, no Q). 造成 shot a3-zaocheng-F1.png; gear panel a3-gearpanel-F5.png.
- ★ → merchant at potions 0, HP 75% (F47): shot a3-star-merchant-F47-potions0.png. Merchant again ★ at F49.
- F51: HP 10%, potions 0, nodes only 戰鬥+精英. 🧭 text says 「建議撤退回城（保留 100%）」 but NO ★建議 mark on the retreat button or anywhere (shot a3-noretreat-star-F51-HP10-potions0.png) → likely missing ★ on retreat. Followed the 🧭 hint and retreated (confirm dialog; I accepted).
- F50 t17-18: A hinted at HP1 with boss charging, potions 0 (only elemental 雷/風之盾, no spike) — survived, boss died t19. Priority spiked-shield A shot did NOT occur this run.
Inferred: j (charge outcomes) from log text only; 'interrupted' for D at F20 t6/F40 t14,23,27,31 unverified.


## arcane 4 (build e745f44) — reached F61 ALIVE
Verified (page reads): Lv14 constant; potions start 13, merchants entered 3 (F2, F29, F42), drops 18 (fight 11, chest 7), 25 drinks, end potions 9; boss turns F5 8, F10 6, F15 8, F20 12, F25 13, F30 20, F35 21, F40 20, F45 20, F50 12, F55 15, F60 20; max single hit 34.9%. (b)=0 contradictions (4 consistent candidates). No ★ retreat, HP never <25% on map with potions 0. Q hinted first on non-resisted charge F55 t1 and F60 t1; no Q hint during 暈眩抵抗中 (resist from F10 t1 onward). F15 t6: Z on cooldown (冷卻 1｜剩 18) → hint D, not Z (OK). F5 t4 charge hint was A (chgNoQ log) — Q disabled; A press while boss charging (hit).
Not triggered this run: A at HP<10% with spiked shield; D hinted with Q enabled; ★ merchant at low potions (lowest 8).
Inferred: 'interrupted' charge outcomes for D at F20 t4/t10, F40 t7/t14/t18 are log-text matches only. Gear: only 主手/身/腿 changed over the run. Dump: qa-saves/rc11-arcane-4-end.json.


## oc 1 (build e745f44) — DIED F40 boss t57, potions 0
Verified (page reads): Lv13 constant; potions start 13, merchants entered 4, drops 15 (fight 9, chest 6), drinks 31; boss turns F5 3, F10 6, F15 14, F20 14, F25 17, F30 10, F35 47, F40 57 (died). Max single hit 50%. (b)=0 contradictions (3 candidates, all consistent e.g. F40 t9 估計514>=HP434 / 防禦後359<434 -> D). (a)=0 (F10 t4 Z on cooldown -> hint Q>D). (k)=0. c: heavy hits show '1 回合後重新蓄力', revives '2 回合後' (yes all).
Death: F40 t56 HP1, potions 0, hint A「沒有可用藥水：直接輸出」; t57 吸血重擊 205 killed (共受 205, 最後兩回合 514 = 50%). D at t55 (HP310, 防禦只靠保命剩1HP) left HP1 after a 309 hit. Shot: oc1-death-F40.webp. Gear: only 主手 changed (迅捷之棍棒 -> 殺戮之極寒斧 at F30); F10 gear not read (panel collapsed).
Shots: oc1-zaocheng-F1, oc1-gearpanel-F5, oc1-death-F40. NOT captured: A@HP<10% w/ spiked shield, D-with-Q-enabled, ★merchant@low potions, retreat, (b) contradiction (none occurred).
Inferred: Q interrupt results from log text/HP deltas (F40 t47 Q then HP519->5: not interrupted); potion-source attribution by delta. Deathlog has gaps (t0-1, t16-42) because driver returned only last 14 turns per call and the localStorage turnlog dump stopped at F40 t15 (stale/partial). Dump: qa-saves/rc11-oc-1-end.json.

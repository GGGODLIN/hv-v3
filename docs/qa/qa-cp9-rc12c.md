NEXT: rc12d oc 1

# cp9-rc12c acceptance (server :5362, badge 21b2339) — blade 1 & 2
Driver: /workspace/drvRC12c.js (reads [data-primarykey], clicks .cmdbar button[data-primary=K]; map follows ★建議 node). Node clicks entered battle fine (no dev issue). Dumps: qa-saves/rc12c-pre.json, rc12c-blade-1-end.json, rc12c-blade-2-end.json. Shots: qa-cp9-rc12c-shots/.
Start potions: 3 default + 10 bought = 13.

## blade 1 — died F40 (boss), potions 0
- Boss F30: 27 turns, pot 16→13, skills 2 (W t0, E t1), interrupts ok 1 (E 粉碎擊 t1), Shatter hints 1, 0-dmg turns 3.
- Boss F35: 42 turns, pot 13→3 (10 drunk), skills 3, interrupt 0 detected (E hinted t1 on charge), Shatter hints 1, 0-dmg 2.
- Boss F40 (炎蹄騎士): 20 turns, pot 2→0, skills 2, interrupt 1, Shatter hints 1, 0-dmg 4. Death: t20 蓄力一擊 278 (35%) at HP1/0 potions after D saved only 1HP.
- Potions: start 13, merchant +F37 +F39 (★ merchant at F39 "1 瓶 < 預估 7 瓶"), drops large (13→16 by F10).
- Gear: Lv14 power 572 constant; equipped gear not shown on map panel (bag only downgrades). Death: +3 auto-equips, 619.
- Checks: 防禦反擊 appears after D on charge when the heavy hit lands (F30 t23/24, F35 t20/33/38, F40 t8/11/14/17) ✔; HP1 & 0 pot & boss not charging (F40 t18): hint A with 「此戰幾乎必敗」 ✔ (shot b1-F40t18); charging at HP1 (t19): D 賭保命 + 必敗 (no A) ✔; 「存活優先」 not seen as such (D hints used 「不防禦會死…防禦後撐得住」); retreat ★ never triggered (HP<25%&0pot only inside boss fights; map had pot ≥1); contradictions: 0 real (my regex "contra?" flagged consistent 「不防禦會死 … 防禦後撐得住」 texts as false positives).
- Anomaly/notes: F10/F25 boss charge with HP safe → ★A (design). F30 D-on-charge sometimes still takes 156 (not blocked fully). Potion counter in Z label parsing returns -1 on some turns (driver artifact).
- Shots: b1-F10t4-bosscharge-A, b1-F30t1-bosscharge-E-shatter, b1-F40t18-HP1-nopot-A-bossnotcharging, b1-death-F40.

## blade 2 — died F40 (boss), potions 0
- Boss F30: 10 turns, pot 12→12, skills 3, interrupt 1, Shatter hints 1, 0-dmg 2.
- Boss F35: 37 turns, pot 10→3, skills 3, interrupt 1, Shatter hints 1, 0-dmg 6.
- Boss F40 (霜眼蜥蜴, 吸血重擊): 24 turns, pot 2→0, skills 2, interrupt 1, Shatter 1, 0-dmg 3. Death t24 169 at HP1, 0 pots.
- Merchants entered 3 (F24, F37, F39). HP1/0pot t23: ★A with 「此戰幾乎必敗」 (boss had just heavy-hit, not charging) ✔ shot b2-F40t23-HP1-nopot-A.
- Contradictions 0; retreat ★ not triggered.
- Shots: b2-F40t23-HP1-nopot-A, b2-death-F40.

## Cross-run
- Both runs: potions drained at F35 (13→3 / 10→3 in 37-42 turns) then F40 arrives with ~2 potions (F36 ★ battle at pot 3, F37/F39 merchant 1 瓶 each) → death at F40 both times. Boss fights are long (D on charge takes partial damage; boss heal/resist). Suggest ★ prefer merchant/rest earlier at F36-F38 or retreat 撤退 at F39 with pot<7.
- Totals (approx, F30+ only): blade1 turns 89, 0-dmg 9; blade2 turns 71, 0-dmg 11. Potions used F30+: b1 14 of ~16, b2 ~10+2.
- Feel score 推測: 6/10 — single ★ key clean and consistent; boss slog and potion starvation at F35-F40 feel punishing.
- Known limits: per-turn deathlog for blade1 F40 is partial (t11-t20); gear before bosses not recorded (map panel shows bag only).


# blade 3 & 4 (appended) — both reached F61 ALIVE (cap), no death
Same driver/method (drvRC12c.js + minor driver edits: gear read on map at F%5==4 via 「Lv · 裝備」 span, shots only f>=30, retry on transient no-primarykey frame). Dumps: qa-saves/rc12c-blade-3-end.json, rc12c-blade-4-end.json (both taken at F61 alive). Start potions 3+10=13 each.
Gear: readable! Map 「Lv14 · 裝備」 span lists 7 slots (battle screen doesn't have it). Start gear = scythe 優良・平衡之雷擊鐮刀, helm 精良・守護之瑪瑙板甲頭盔, chest 優良・噬火者之秘銀鎖子胸鎧, gloves 優良・偏轉之翡翠鎖子鐵手套, legs 精良・抵消之鈷藍克維拉護腿, boots 優良・噬火者之板甲鐵靴 (Lv13). Lv14 constant.

## blade 3 — F61 alive, potions ~30-37 (Z×32 at F61)
- Gear before F35/F40 (F34/F39 map): scythe 平衡之雷擊鐮刀; helm 守護瑪瑙; chest 噬火者鎖子; gloves 精良・減幅之板甲鐵手套; legs 精良・霜生者之克維拉護腿; boots 噬火者鐵靴. From F44: scythe 華麗・平衡之鐮刀 (unchanged to F59). F30 boss gear not captured (F29 map skipped; = start gear + drops).
- Boss F30: 5 turns, pot 31→31, Q/W/E: W t0,E t1 (skills 2), interrupts detected 0 (E hinted on charge t1; driver didn't flag), Shatter hints 1, 0-dmg 1. D on charge t4 → 招架 -107 + 防禦反擊 118 ✔.
- F35: 12 turns, pot 33→31 (2 Z), skills 2, int 0 detected, shatter 1, 0-dmg 2. D-charge x3 (t4 -82 reflect, t7 -236 → 防禦反擊 95, t10 -219 → 防禦反擊 91).
- F40: 3 turns, pot 32→32, skills 2, int 0 detected, shatter 1, 0-dmg 2.
- F45: 4 turns, pot 33→33, skills 2, int 0 detected, shatter 1, 0-dmg 1.
- F50: 7 turns, pot 33→33, skills 2, int 1 (E t1 detected), shatter 1, 0-dmg 1. D-charge t6 took 0 (charge started next).
- F55: 8 turns, pot 34→33 (1 Z), skills 2, int 0 detected, shatter 1, 0-dmg 1. D-charge t7: 招架 -142 → 防禦反擊 224 + 反擊 608 ✔.
- F60: 3 turns, pot 37→37, skills 2, int 0 detected, shatter 1, 0-dmg 2.
- Totals F30+: turns 42, 0-dmg 10 (10/42), potions used in boss fights 3 (of 13 start; drops+merchants lifted pot to 37). Merchants entered 7 (1 potion bought each by driver; ★ merchant at F19/F29/F44/F54/F59 shown 「可補藥水」).
## blade 4 — F61 alive, Z×30
- Gear before bosses: F29/F34/F39: chest 華麗・靈守之琥珀板甲胸鎧 (new), gloves 偏轉翡翠, legs 抵消鈷藍, boots 噬火者; F44 on: boots 華麗・三重祝福之板甲鐵靴; scythe 平衡之雷擊鐮刀 unchanged.
- F30: 8 turns, pot 25→24, skills 3 (W0,E1,Q2), int 0 (boss NOT charging at t1; E hinted as shatter/stun), shatter 1, 0-dmg 1. D on charge t7 → boss no hit logged (charge just started).
- F35: 6 turns, pot 24→23 (1 Z), skills 4, int 1 (E t1 on charge: manually verified in battle log 「蓄力一擊被打斷！」+「暈眩 5 回合」), shatter 1, 0-dmg 1.
- F40: 8 turns, pot 23→21 (2 Z), skills 5, int 0 detected (E t1 and t8 hinted on charge), shatter 2, 0-dmg 1.
- F45: 8 turns, pot 26→26, skills 6, int 1 (t1), shatter 2, 0-dmg 1.
- F50: 8 turns, pot 27→27, skills 5, int 1 (t1), shatter 2, 0-dmg 1.
- F55: 8 turns, pot 29→28 (1 Z), skills 4, int 0 detected, shatter 1, 0-dmg 0.
- F60: 16 turns, pot 32→30 (2 Z), skills 8, int 2 (t1, t15), shatter 3, 0-dmg 3. Lowest HP 309/1025 (F60 t14, ★Z). D-charge t7 → 220 dmg, 防禦反擊 76 ✔.
- Totals F30+: turns 62, 0-dmg 8 (8/62), potions used in boss fights 7. Merchants entered 4.
## Combined blade 3+4
- Turns 104, 0-dmg 18 (17%), boss-fight potions 10. Interrupt-detect by driver undercounts (regex/log window); only manually verified one (b4 F35 t1). E on charge is always the ★ at t1; stun applied ("暈眩 5 回合").
- Checks: 防禦反擊 ✔ after D when charge lands (b3 F30t4, F35 t7/t10, F55 t7; b4 F60 t7). ★ merchant: shown at F19/F29/F44/F54/F59 as 「可補藥水」 even with 25-36 potions (not 'low potions' case; no issue). HP1 hints 必敗: never reached (min HP 242/802 b3? 309/1025 b4) → N/A. 「存活優先」: not seen (D/Z hints use 「不防禦會死…防禦後撐得住」). Retreat ★ never triggered (HP<25%+0pot never). Contradictions: 0 real (driver 'contra?' flags F35t4, F48t1, F51t1/t5 in b3 are consistent 「不防禦會死 … 防禦後撐得住」 texts).
- Anomalies: (1) a 3499-dmg crit one-shot of an F15 elite made the screen momentarily have no ★ key — driver needed retry on transient frame (not a game bug). (2) Z label in battle shows ×N (my parser -1 on Z turns while drinking). (3) F40/F45/F60 b3 fights ended in 3-4 turns, vs b1/b2 fights 20-42 turns: much stronger gear/potion state here → huge variance run-to-run (b3/b4 never starved on potions: 30+ vs 0-3).
- Difference vs blade 1-2 (died F40 both): b3/b4 had 24-32 potions at F30 (vs 12-16) from drops; potion starvation absent.
- Shots (qa-cp9-rc12c-shots/): b3-F30t1-bosscharge-E-shatter, b3-F30t4-bosscharge-D, b3-F61-alive-cap, b4-F30t1-shatter-hint-nocharge, b4-F61-alive-cap. No death shots (no deaths).
- Feel score 推測: 8/10 — single ★ key clean; blade 3/4 smooth with no deaths to F61, boss fights short; the earlier 6/10 potion-starvation pain not reproduced.
- Not done: F30-boss gear for b3 (skipped F29 map); per-turn deathlog n/a (no death); interrupt counts from driver unreliable.


# bulwark 1 & 2 (appended; server :5362 badge 21b2339; driver drvRC12c.js + edits: merchant rule, gear read, shots only F30+)
**Merchant rule (producer change applied from run 1 start, no restart needed — first merchant was F4 with held 16 ≥ thr):** at each merchant buy 生命藥水 until held ≥ next-boss threshold (「< 下一隻首領預估 N 瓶」, N=8 seen in ★/🧭 text; default 7 if not shown); stop when out of money. **Game limit: 「每位商人限 1 瓶，剩 1」 → max 1 potion per merchant, so threshold was never reachable when held was low (e.g. 5<8, bought 1 → 6).** Held tracked from Z label (merchant screen shows no held count). Start potions 3+10=13. Gear: Lv11 constant, 7 slots read on map 「Lv · 裝備」 at F%5==4 (start: axe 尚可・浣熊之斧, shield 優良・減幅之塔盾).
Driver caveat: my `chg` flag also matches minion 「X 正在蓄力」 (D hint says 「小怪不受蓄力鎖」), so F30+ "D on charge" counts include minion charges; "0-dmg turns" = turns whose log lacks 「造成 N≥1」 (includes D/Z turns) — inflated vs real boss-no-damage. Interrupts detected via log 「蓄力一擊被打斷」 (Q 盾擊 stun) — verified in log for r1 F40 t10; r1 F30 t9 Q hinted 「打斷蓄力」, driver didn't flag (undercount likely).

## bulwark 1 — died F55 (boss, t17), potions 0 at death. Dump qa-saves/rc12c-bulwark-1-end.json
Boss table (turns / pot start→end / drunk / Q·W·E presses / interrupts detected / 0-dmg turns):
- F30 (霜鋼刺客 嗜血 + 霜爪殭屍): 36 / 19→11 / 8 Z / W,Q,… skill presses 3 / 0 detected (Q t9 hinted 「打斷蓄力」) / 3
- F35 (風鐵精靈 + 風晶星靈, 尖刺盾): 34 / 14→9 / 5 / skills 2 (Q×1 t24 hinted, W) / 0 / 6
- F40 (炎羽蛇龍 狂戰): 39 / 11→5 / 6 / skills 4 (Q t10 ✔interrupt: log 「蓄力一擊被打斷！」+「暈眩 5 回合」) / 1 / 8
- F45 (雷眼飛龍 塔主, 呼喚援軍): 29 / 6→3 / 3 / skills 4 (Q t1,12,27) / 0 / 3
- F50 (霜尾光靈): 16 / 4→2 / 2 / skills 2 / 0 / 1
- F55 (雷紋刺客 狂戰尖刺 守門者 + 炎晶雙頭龍): 17 (died) / 3→0 / 3 / skills 2 (Q t1, W) / 0 / 2
- Totals F30+: boss turns ≈171, 0-dmg ≈23 (13%); potions used ≈27 in boss fights; merchants entered 10 (F4,12,14,22,39,42,44,47,49,54), bought 5 (+1 each at F42 5→6, F44 5→6, F47 2→3, F49 3→4, F54 2→3; thr 8 each, limit 1/merchant; F4–F39 held ≥7 → 0 bought).
- Gear before bosses (F29–F54 maps): F34: 主手 優良・公牛之短劍, 副手 精良・屏障之秘銀鳶盾, 頭 優良・守護之強固鎖子頭盔, 身 精良・守護之護盾板甲胸鎧, 手 精良・守護之鎖子鐵手套, 腿 優良・靈守之琥珀板甲脛甲, 腳 精良・防衛之鈷藍鎖子鐵靴; F39+: 主手 優良・平衡之虛靈斧, 頭 精良・雷童之秘銀鎖子頭盔 (rest same) through F54. F29 = start gear with 公牛之短劍. Lv11 constant. Death screen: +2 levels, 7 auto-equips.
- Potion starvation path: pot 19 at F30 → 11 → 14 (drops) → 9 → 5 → 6 at F40 → 3 → 2 at F50 → 3 (F54 merchant) → 0 at F55. ★ pointed to merchant at F44/F49/F54 with text 「生命藥水 5/3/2 瓶 < 下一隻首領預估 8 瓶」 ✔ (★ merchant low-potions check passes), but each merchant sells only 1 → can't fill.
- Death: F55 t16 HP 1/1010, Z 用完, boss(守門者 狂戰尖刺 + 雙頭龍) not charging; hint ★D·防禦 「攻擊…會吃反傷約 28 ≥ HP 1，會自殺」, no 「此戰幾乎必敗」 and no A hint (A would suicide on spike reflect ✔ consistent with the 'no A when reflect lethal' rule; but check HP1 rule expects A+必敗 when not charging — here spike shield makes A lethal, so D shown instead; "必敗" text absent → possible gap). Pressed D → died t17: 201 dmg from 雷紋刺客 (20% maxHP), 「第 15 回合 -353、第 16 回合 -55、第 17 回合 -201」, 「共受 201」. Shots: bw1-F55t16-HP1-nopot-D-spikeshield.png, bw1-death-F55.png, bw1-F30t1-bosscharge-Dd.png.
- Checks: 防禦反擊 ✔ after D on charge (F30 t5/t23, F35 t9/t14, F55; ~7 of ~21 D-on-charge turns, rest partial/招架/格擋/blocked-0). HP1 hints: A+必敗 not seen (see above). 「存活優先」 not seen as text (hints: 「防禦只靠保命剩 1 HP…先喝藥」, 「不防禦會死…防禦後撐得住」). Retreat ★: stop 'retreat' never triggered (★ never 撤退回城; HP<25%&0pot occurred only inside boss fight). Contradictions: 0 real; my 'contra?' regex flagged ~6 consistent 「不防禦會死 … 防禦後撐得住」 lines (false positives). Note 「防禦只靠保命剩 1 HP（未保命估 257 ≥ HP 250），先喝藥」 next to 「HP 危險」 consistent.
- Anomalies: F10 boss D-on-charge t4 took 48 (block) and boss 「重擊！…（1 回合後重新蓄力）」 ✔ text present. Boss-fight potion drinking (Z) frequent because bulwark HP 736 vs charge est. 368 (≥50% maxHP) → ★Z/D alternate for ~35 turns at F30/F35.

## bulwark 2 — F61 alive (cap), potions 5 left. Dump qa-saves/rc12c-bulwark-2-end.json
- F30 (尖刺 霜鱗砲台): 4 turns / 15→14 / 1 Z / skills 1 (E t0) / 0 / 0
- F35 (狂戰 雷爪蠍): 10 / 15→13 / 2 / skills 2 (Q t10) / 0 / 0
- F40 (嗜血 災厄 霜岩…): 14 / 15→12 / 3 / skills 2 (Q t14) / 0 / 7 (many Z/D turns)
- F45 (烈焰尖刺 塔主 雷紋地龍): 27 / 14→9 / 5 / skills 5 / 0 / 8
- F50 (狂戰嗜血 霜鋼鐵偶): 25 / 12→6 / 6 / skills 3 / 0 / 7
- F55 (守護冰霜 炎羽蜥蜴): 25 / 10→7 / 3 / skills 4 (Q t4, E t22) / 0 / 2
- F60 (迅捷守護 災厄 闇鐵亡魂): 38 / 10→5 / 5 / skills 4 + E t0 (Q t21 ✔interrupt 「暈眩 6 回合」, Q t34 ✔) / 2 / 5
- Totals F30+: boss turns 143, 0-dmg ≈29 (20%), boss-fight potions ≈25; merchants entered 11 (F2,4,9,12,17,24,29,44,47,52,57): bought 2 (+1 at F52 7→8, +1 at F57 7→8; thr 8; held ≥7 elsewhere → 0). ★ merchant at F4/F9/F24/F29/F44 shown 「可補藥水」 with 15–16 potions (not low-case).
- Gear before bosses: F29 axe/club 優良・平衡之極寒棍棒, shield 優良・減幅之塔盾→F34 優良・守護之鳶盾, head 優良・靈守之板甲頭盔, chest 華麗・防衛之鎖子胸鎧, hands 精良・守護之鎖子鐵手套, legs 精良・防衛之鈷藍板甲脛甲, boots 優良・霜生者之鎖子鐵靴; F39+: 主手 優良・殺戮之暴風斧; F59 legs 精良・減幅之鎖子脛甲. Lv11 constant. (F30 bosses short: run had 15 potions, boss died in 4 turns.)
- Checks: no death (HP1/必敗/存活優先 never reached); contradictions 0; retreat ★ n/a; 防禦反擊 seen (dcr 2 of 13 D-on-charge counted this call + earlier). Shot: bw2-F61-alive-cap.png (Z ×5). No death → no deathlog.
## Cross-run (bulwark 1+2)
- Boss turns F30+: 314, 0-dmg ≈52 (17%); potions in boss fights ≈52; merchant buys 7 total in 21 entries (limit 1/merchant) — the 'buy to threshold' rule is capped by the 1/merchant limit; ★ merchant text correct. Bulwark boss fights are slow (25–39 turns at F35–F60) → potions drain ~3–6 per boss; F55 killed r1 at 0 potions.
- Feel 推測: 6/10 — single ★ key clean; bulwark is a long Z/D/A slog; potion economy tight (1/merchant) deciding death vs F61; HP1 w/ spiked boss has no 必敗 warning.
- Not captured: r1 full per-turn death fight (driver kept only last turn; partial in deathlog), exact Q-interrupt counts (undercount), per-merchant held-before for F4–F22 beyond table.


# bulwark 3 & 4 (appended; server :5362 badge 21b2339; driver /workspace/drvRC12c-bw.js; both runs died)
Method: ?cp9&cp8&cp6&preset=postF20-bulwark&fresh, bought 10 potions (3+10=13), only ★ primary key via dispatchEvent, map ★ node. Merchant rule: buy until held >= threshold in ★ text (7/8, default 7), limit 1/merchant; every entry logged held before/after. chg = body line 「首領蓄力中」 only (not minion 「正在蓄力」). 0-dmg: raw = turns whose log lacks 「造成 N≥1」 (includes D/Z turns); strict (zs, only measured from F40 b3 / F40+ ) = non-D/Z/X/C/F/S key AND boss took 0. Interrupts from driver log regex (「被打斷」), likely undercount (Q hinted 「打斷蓄力」 on charge).
Dumps: qa-saves/rc12c-bulwark-3-end.json, rc12c-bulwark-4-end.json. Shots: qa-cp9-rc12c-shots/bw3-*, bw4-*.

## bulwark 3 — died F45 boss (t20), potions 0. Lv11 constant (Lv13 after death).
Boss table (turns / pot start->end / Z drunk / Q·W·E skill presses / interrupts / 0-dmg raw (strict)):
- F30 (尖刺 深淵之王 雷角骷髏 + 霜鬃騎士): 44 / 13->9 / 4 / 5 (E t0, Q t4, ...) / 1 (Q t4 detected) / 5 (n/a)
- F35 (尖刺 守門者 霜冠光靈 + 霜鐮遊俠): 31 / 13->7 / 6 / 3 / 0 / 9 (n/a)
- F40: 56 / 7->0 / 7 / 4 / 0 / 7 (1)  (potions ran dry at end of the F40 fight)
- F45 (烈焰堅硬 塔主 霜影巨人 + 雷尾蛇龍): died t20 / 2->0 / 2 / 2 / 0 / 4 (2). Death: t18 -294, t19 -321 (boss charge, D hint at 322HP: 「防禦只靠保命剩 1 HP」 -> HP1), t19 HP1/0pot: ★A with 「此戰幾乎必敗」 ✔, t20 -126 died.
- Totals F30+: turns ~151, raw 0-dmg 25, potions used ~19 in boss fights.
- Potions: start 13; held 14-17 through F29 (drops), F30 13 (-> 9), F34/F35 13 (drops), F36 6, F40 7->0, F44 1, F45 2.
- Merchant log (entered 6): F2 held14 thr7 skip(held>=thr); F7 16 skip; F9 17 skip; F12 16 skip; F37 6->7 (thr 7, ★ text 「生命藥水 6 瓶 < 下一隻首領預估 7 瓶」 ✔); F44 1->2 (thr 8, ★ text 「1 瓶 < 預估 8 瓶（下一層是首領）」 ✔, limit 1/merchant so 2<8). Bought 2.
- Gear before bosses (Lv11 constant): F29 (F30 boss) 主手 精良・吸血鬼之虛靈棍棒, 副手 優良・減幅之塔盾, 頭 優良・守護之秘銀板甲頭盔, 身 精良・守護之護盾板甲胸鎧, 手 精良・霜生者之鎖子鐵手套, 腿 優良・靈守之琥珀板甲脛甲, 腳 普通・板甲鐵靴. F34/F39/F44: same except 主手 精良・殺戮之虛靈細劍.
- Checks: 防禦反擊 ✔ (F30 t34 after D on heavy hit, F35 t9/13/17/18/21/25, F20 t9). ★ merchant at F37/F44 correct (low potions). HP1: F45 t19 shows 必敗 ✔ (shot bw3-F45t19-HP1-nopot-A-bisheng). Retreat ★ (HP<25% & 0 pot & only battles): never triggered; map F41-F43 had 0 potions but HP not <25%. Contradictions: driver 'contra?' flags are consistent 「不防禦會死…防禦後撐得住」 texts (0 real).
- Shots: bw3-F30t1-boss-charge-D (shows minion+boss 正在蓄力, hint D with 小怪不受蓄力鎖), bw3-F30t4-bosscharge-Q-interrupt-hint, bw3-F45t19-HP1-nopot-A-bisheng, bw3-death-F45.

## bulwark 4 — died F35 boss (t62), potions 0. Lv11 constant.
- F30 (狂戰 深淵之王 霜紋元素靈 + 霜鬃屍鬼): 38 / 16->8 / 8 / 3 / 0 detected (Q hinted 打斷蓄力) / 7 raw (3 strict)
- F35 (狂戰 守門者 炎鐵刺客 + 風冠騎士): died t62 / 11->0 / 11 / 5 (Q×~4 incl. t41, t61; W×1) / 0 / 10 raw (5 strict)
- Totals F30+: turns 100, potions used 19 in boss fights.
- Death: t59 D at 176HP (「防禦只靠保命剩 1 HP」), t60 HP1/0pot: ★D (「D（HP 1、沒有藥水、首領蓄力中：防禦（靠保命）撐得住」) -> survived at 1 HP (took 175 charge via 保命); t61 HP1/0pot boss NOT charging: ★Q 盾擊 (「打斷蓄力」) with NO 「此戰幾乎必敗」 banner (panel red text: 「下回合全體暴擊估計 > HP」); t62 boss 161 hit killed.
- Merchants entered 4: F4 held16, F14 17, F19 18, F34 11, all thr 7 -> skip (held>=thr), bought 0. ★ merchant text only 「可補藥水」 (not low case). No merchant after F34 (F35 boss at pot 11 -> 0 in 61 turns).
- Gear (Lv11): F29/F34 主手 優良・殺戮之極寒棍棒 (start 尚可・浣熊之斧 -> 普通・平衡之斧 F14 -> 殺戮之極寒棍棒 F24), 副手 優良・減幅之塔盾, 頭 普通・板甲頭盔, 身 精良・守護之護盾板甲胸鎧, 手 華麗・喚風者之板甲鐵手套, 腿 優良・偏轉之鎖子脛甲 (F34: 優良・石膚之鈷藍板甲脛甲), 腳 普通・板甲鐵靴.
- Checks: HP1 hints: t60 D ok (no 必敗, D survivable), t61 Q at HP1/0pot without 必敗 -> ANOMALY (screenshots bw4-F35t60-..., bw4-F35t61-...). Retreat ★ not triggered (fight in boss). 防禦反擊 appeared in logs after D on heavy hit (e.g. t61 log 防禦反擊 -> 57). Contradiction candidate: t60 decision line 「撐得住」 vs red panel line 「防禦只靠保命剩 1 HP: 最壞 404 … 下一擊撐不住」 (shot bw4-F35t60). 
- Shots: bw4-F30t4-bosscharge-D, bw4-F35t60-HP1-nopot-D-bosscharge-no-bisheng, bw4-F35t61-HP1-nopot-Q-interrupt-no-bisheng, bw4-death-F35.

## Cross-run (bulwark 3+4)
- Both died at boss with 0 potions after very long fights (31-61 turns, 4-11 Z each) — bulwark slog; potions drained at F40 (b3) / F35 (b4). Merchant buys 2 of 10 entries (1/merchant limit; threshold unreachable when low). Total boss turns ~251, raw 0-dmg ~65.
- Feel 推測: 5/10 — ★ single-key flow is clean, but bulwark fights are 30-60-turn Z/D grinds and HP1/0pot states appear ~every death; one HP1 hint (Q, no 必敗) looks wrong.
- Not done: strict 0-dmg for b3 F30/F35 and b4 F30 partial; interrupts via log-regex only (undercount); per-turn dmgPerTurn not recorded (use dump turnlog).


# oc 1 & 2 (appended; server :5362 badge 21b2339; preset postF20-oc worked; driver /workspace/drvRC12c-oc.js = drvRC12c-bw.js + potion-label fallback, dl carried across calls, shots limited)
Method: ?cp9&cp8&cp6&preset=postF20-oc&fresh, 10 potions bought (3+10=13), only ★ primary key (dispatchEvent), map ★ node. Merchant rule: buy until held >= thr (thr 7 default / from ★ text), limit 1/merchant; every entry logged. School = oc (club + tower shield, Q 盾擊 = interrupt/stun; no E shatter). Lv13 constant. Dumps: qa-saves/rc12c-oc-1-end.json, rc12c-oc-2-end.json. Shots: qa-cp9-rc12c-shots/oc1-*, oc2-*.
CAVEATS (driver): raw 0-dmg regex /造成 N>=1/ also matches boss dmg *to player* ("對你造成 N"), so raw 0-dmg counts are UNDERcounted this time; strict (zs) = non-D/Z/X/C/F/S key AND no 造成N. Z-label potion parse flaky (-1/1 on Z turns); pot start/end below use the 「剩 N 瓶」 text/map ★ text where possible. Interrupt count from log regex 「被打斷」 undercounts (Q hinted 「打斷蓄力」 on charge turns).

## oc 1 — died F38 (NON-boss normal fight, t7, 炎鬃自走甲 157), potions 0. Dump qa-saves/rc12c-oc-1-end.json
- Boss F30 (深淵之王 霜蹄殭屍 守護 + 霜鬃亡魂): 59 turns, pot 19→9 (10 Z), skills 5 (W t0 + Q×4), interrupts 2 (Q t43, t56 detected), 0-dmg raw 2 / strict 1.
- Boss F35 (迅捷 守門者 聖刃精靈 + 霜骨妖精): 27 turns, pot 9→0 (8 Z), skills 3 (W t0, Q×2), interrupts 0 detected (Q hinted t14 打斷蓄力), 0-dmg raw 3 / strict 3. Won with 0 potions (boss kill).
- Boss F25 (not F30+): shows D-on-charge at t4 etc fine. F30 first-boss charge shot: oc1-F30t4-bosscharge-D.
- Potions: start 13, drops lifted to 19-20 by F20; F30 start 19; F35 start 9 (no merchant ≥F30 until F37). Merchants entered 5: F14 held18 thr7 skip, F19 20 skip, F22 20 skip, F29 19 skip, F37 held0 thr7 → bought 1 (0→1, limit 1/merchant). ★ merchant F14/F19/F29 「可補藥水」 (not low case); F37 ★ text 「生命藥水 0 瓶 < 下一隻首領預估 7 瓶：先去商人補藥（50C／瓶）」 ✔.
- Gear before bosses (Lv13): F29 (F30 boss) 主手 精良・迅捷之棍棒, 副手 優良・守護之秘銀塔盾, 頭 優良・石膚之鎖子頭盔, 身 優良・偏轉之翡翠板甲胸鎧, 手 華麗・霜生者之板甲鐵手套, 腿 優良・石膚之鎖子脛甲, 腳 精良・石膚之皮革靴. F34: same (read F34 map; unchanged). Power 544→612 at death (+3 auto-equips).
- Map F37: HP 141/828, 0 potions, nodes merchant/chest/shrine: ★ merchant (OK: not 'only battles' so retreat ★ not expected); red text 「HP 141/828 只剩一半以下…」「沒有生命藥水了：優先走休息節點」 but NO rest node offered. Shot oc1-F37-map-HP141-0pot-star-merchant.
- After merchant (pot 1, HP still low ~141) F38 ★ pointed to ⚔ battle (no rest/retreat ★) → died in 7 turns to 炎鬃自走甲 (-96,-120,-157). QUESTIONABLE: ★ battle at HP<25% with 1 potion (retreat ★ requires 0 potion; also nothing healed at merchant). Per-turn deathlog n/a (driver only logged boss turns; last 3 turns from death screen).
- Checks: 防禦反擊 ✔ (F30 t4 D-charge → 防禦反擊 66, t33, F35 t23 防禦反擊 114; also F25 t4/17). HP1 hint: none in oc1 (min HP at boss fights 120-ish, then Z). 「存活優先」 not seen; 必敗 not seen. Contradictions: 0 real (driver 'contra?' flags ~9 are consistent 「不防禦會死…防禦後撐得住」 / 「撐得住 下回合最多可能受」 texts). 
- Note: F30 charge text 「下回合最多可能受 414（≥ 最大 HP 40%）」 next to 「撐得住」 consistent (HP≥414).
- Shots: oc1-F30t4-bosscharge-D, oc1-F37-map-HP141-0pot-star-merchant, oc1-death-F38.

## oc 2 — died F36 (NON-boss normal fight, t5, 雷鐮隼 130), potions 0. Dump qa-saves/rc12c-oc-2-end.json
- Boss F30 (深淵之王 聖刃齒輪獸 守護 + 霜鱗巨人): 42 turns, pot 14→6 (8 Z), skills 3 (W t0, Q×2), interrupts 1 (Q t38), 0-dmg raw 4 / strict 1.
- Boss F35 (霜骨… 守門者 + 迅捷 ): 28 turns, pot 7→0 (7 Z), skills 3 (W t0, Q t9 ✔ interrupt, +1), interrupts 1 detected, 0-dmg raw 3 / strict 3.
- Potions: start 13; drops 14-16 by F29; F30 start 14; F34 7 (★ rest, HP 70%); merchants entered 4: F12 held15 skip, F24 16 skip, F29 14 skip, F32 held5 thr7 → bought 1 (5→6, limit 1). ★ F24/F29 merchant 「可補藥水」 at 16/14 potions (not low case). F34 ★ rest: 「下一層是首領，HP 70%：休息補滿」 ✔.
- Gear before bosses: F29 data not captured in this call (driver return dropped it); F19 gear = 主手 精良・迅捷之棍棒, 副手 普通・石膚之塔盾, 頭 優良・石膚之鎖子頭盔, 身 優良・偏轉之翡翠板甲胸鎧, 手 華麗・守護之琥珀板甲鐵手套, 腿 普通・雷童之板甲脛甲, 腳 精良・石膚之皮革靴 (Lv13). Power 544→624 at death (+4 auto-equips).
- Death sequence: F35 boss killed with 0 potions at low HP; F36 ★ chose ⚔ battle (map HP ≥25% so no retreat ★; 0 potions) → fight vs 雷鐮隼 + 雷冠雞: t0 HP238 D (「生命藥水已用完；防禦後估計 166 < HP 238，HP 偏低 ≤35%」), t1 HP73 D 「防禦只靠保命剩 1 HP…HP 危險」, t2 HP208 D, t3 HP79 D, t4 HP 1/828 0 pot → ★A 「A·攻擊（HP 1、沒有可用藥水：直接輸出）」 — NO 「此戰幾乎必敗」 and no retreat/escape option (non-boss normal fight); then t5 -130 died. Red panel text just 「⚠ HP 1/828 決策：★A·攻擊」. Shot oc2-F36t4-HP1-0pot-A-nonboss-no-bisheng. (bulwark-run b3 showed 必敗 only at boss fights; here normal fight has none → possible gap: HP1/0pot A hint lacks 必敗 outside boss.)
- Checks: 防禦反擊 ✔ (F30 t14 → 77, t27 → 82; F25 t4/t17 → 94). Interrupt Q ✔ (F35 t9: log 打斷, F30 t38). Contradictions 0 real. Retreat ★ never shown (HP<25% only with potions>0 or with non-battle nodes).
- Shots: oc2-F36t4-HP1-0pot-A-nonboss-no-bisheng, oc2-death-F36.

## Cross-run (oc 1+2)
- Both died at F36-F38 in NORMAL fights (not bosses) after beating F35 with 0 potions: potion starvation at F35 (F30 boss costs 8-10 potions; F35 boss 7-8) and ★ keeps pointing to ⚔ battle after F35 at 0-1 potions/low HP (only merchant at F37 in run 1 gave 1 potion; limit 1/merchant). Retreat ★ not offered (needs 0 potions AND HP<25% AND only battles).
- Boss turns F30+: oc1 86, oc2 70 (very long oc boss fights: 28-59 turns); F30+ potions used in boss fights oc1 18, oc2 15.
- Merchant: entered 9 total, bought 2 (limit 1/merchant), 6 skips because held ≥ thr; the F37 oc1 merchant (0 potions) is the only 'low' case, 1 potion can't fix it.
- Findings: (1) HP1/0 pot A hint without 必敗 in non-boss fight (oc2 F36t4) and ★ battle at HP141/828, 1 potion (oc1 F38) → deaths. (2) map red text 「優先走休息節點」 when no rest node exists (oc1 F37). (3) 防禦反擊/interrupt OK.
- Feel 推測: 5/10 — single ★ key is clean/consistent, but oc is a long Z/D/A slog; 30-59 turn boss fights drain potions and ★ then walks into normal fights at 0-1 potions with low HP, no retreat/rest guidance.
- Not done / caveats: per-turn deathlog n/a for normal-fight deaths (partial from hint trace), raw 0-dmg undercounted, run2 F29/F34 gear not captured.


# oc 3 & 4 (appended; server :5362 badge 21b2339; driver drvRC12c-oc.js, ?cp9&cp8&cp6&preset=postF20-oc&fresh, 10 potions bought → 13, only ★ key, ★ map node)
Both reached F61 ALIVE (cap). Dumps: qa-saves/rc12c-oc-3-end.json, rc12c-oc-4-end.json. Shots: qa-cp9-rc12c-shots/oc3-*, oc4-*. Driver caveats as oc 1-2 (Z-label parse flaky; raw 0-dmg regex matches damage to player so raw undercounts; strict (zs) = non-D/Z/X/C/F/S key & no 造成N; interrupts via 「被打斷」 undercount). Per-turn trace only for last-fight window (state carried across calls; oc3 F30/F35 fightEnd rows taken from ev). Merchant rule: buy until held>=thr (7 default), limit 1/merchant — every entry skipped (held 8-19 ≥ 7).
Low-HP map check (HP<30% & potions<=1): driver trigger NEVER fired in either run (no such map floor) → no screenshot, N/A.

## oc 3 — F61 alive, Lv13 (HP 1200 at cap). Pot at F61 9 (Z×9 shown).
Boss table (turns / pot start→end / skill presses (Q/W/E) / interrupts detected / 0-dmg raw/strict):
- F30: 16 / 18→17 / 2 / 0 / 1/1
- F35: 30 / 19→14 / 5 / 0 / 7/3
- F40 (炎蹄… 闇毒亡魂 + 迅捷災厄聖影星靈, 吸血重擊): 25 / 18→12 / 2 / 0 / 3/1 (D-charge t10 538 taken at HP399→539 after Z; t14 331; t18 376; t22 376)
- F45: 12 / 12→10 / 2 / 0 / 1/1 (D-charge t1 招架 54 + 防禦反擊 119 ✔)
- F50: 35 / 12→8 (4 drunk) / 5 / 1 (Q t18 ✔) / 5/1
- F55: 6 / 8→8 / 3 / 0 / 1/1
- F60: 12 / 11→9 / 3 / 0 / 5/3
- Totals F30+: turns 136, strict 0-dmg 11 (8%), boss-fight potions ~19. Potions: start 13, F30 18 (drops), min 8 (F50-F56), F61 9. Merchants entered 7 (all skipped, held>=7; ★ merchant F44/F54 「可補藥水」 at 12/8 potions, fine).
- Gear before bosses: F29/F34/F39/F44/F49 = 主手 精良・迅捷之棍棒, 副手 普通・石膚之塔盾, 頭 優良・石膚之鎖子頭盔, 身 優良・偏轉之翡翠板甲胸鎧, 手 華麗・防衛之板甲鐵手套, 腿 優良・霜生者之板甲脛甲腳, 腳 F29 same as F24 精良・石膚之皮革靴 → from F34 精良・守護之紅玉鎖子鐵靴 (F34-F49 unchanged). F54: 主手 華麗・吸血鬼之暴風細劍. F59: + 頭 華麗・防衛之鈷藍鎖子頭盔. (Lv13 constant.)
- F40 first-boss shot flagged 「存活優先」 inside Q hint text: 「Q·盾擊 打斷不保證擋下全部傷害，存活優先」 shown next to ★D at HP539 (not contradictory: D chosen, 撐得住). Shot oc3-F40t10-HP539-D-charge-Q-存活優先-note.
- Checks: 防禦反擊 ✔ (F45 t1, F50 t15, F25). HP1 hints/必敗: N/A (HP never 1; min HP ~320 F40 t4 then ★Z). Retreat ★: never (no low-HP/0-pot map). Contradictions 0 real ('contra?' flags F40 t3/t15/t21, F50 t3/t9/t30, F60 t4/t8 are consistent 「不防禦會死…防禦後撐得住」 texts). 防禦反擊 ✔.
- Shots: oc3-F40t10-HP539-D-charge-Q-存活優先-note, oc3-F61-alive-cap.

## oc 4 — F61 alive, potions 16 at F61 (Z×17 total)
- F30: 10 / 15→14 / 2 / 0 / 3/1
- F35: 5 / 15→14 / 2 / 0 / 3/1
- F40: 10 / 16→15 / 3 / 0 / 3/1
- F45: 3 / 16→16 / 3 / 0 / 0/0
- F50: 11 / 17→16 / 3 / 0 / 1/1
- F55: 7 / 19→18 / 3 / 0 / 0/0
- F60: 14 / 19→16 / 3 / 0 / 2/1
- Totals F30+: turns 60, strict 0-dmg 5 (8%), boss-fight potions ~9. Potions never dropped below 14 at a boss; merchants entered 6, all skipped (held>=7). ★ merchant at F4/F24/F39 「可補藥水」 with 15-17 potions (not low case).
- Gear before bosses: F29/F34 主手 精良・迅捷之棍棒, 副手 優良・海龜之圓盾, 頭 優良・石膚之鎖子頭盔, 身 優良・偏轉之翡翠板甲胸鎧, 手 精良・減幅之板甲鐵手套, 腿 普通・雷童之板甲脛甲腳, 腳 華麗・三重祝福之鈷藍克維拉靴. F39/F44: 副手 華麗・減幅之靈巧鳶盾. F49/F54: 腿 華麗・石膚之瑪瑙鎖子脛甲. F59: 主手 華麗・平衡之暴風短劍.
- Checks: 防禦反擊 ✔ (F25 t14/t21). HP1/必敗, retreat ★, low-HP map: not reached (N/A). Contradictions 0 real. 
- Shots: oc4-F61-alive-cap (no stop triggers).

## Cross-run (oc 3+4)
- Both alive to F61 (vs oc 1-2 dying F36-F38 after potion starvation): oc3/oc4 had 15-19 potions at F30 and short boss fights (5-35 turns vs 27-59). Huge variance run-to-run; the starvation → ★ battle at 0-1 pot / HP<25% death path (oc1/oc2 findings) was NOT reproduced, so the retreat ★ / 必敗 / low-HP-map checks stayed untested this round.
- Boss turns F30+: oc3 136, oc4 60 (combined 196); strict 0-dmg 16 (8%); boss-fight potions ≈28.
- Feel 推測: 7/10 — single ★ key clean and consistent, no contradictions, 防禦反擊 works; but oc3's long F40/F50 fights (25/35 turns) still Z/D-slog and the rc12c findings from oc1/oc2 (HP1/0pot A hint lacks 必敗 in normal fights; ★ battle at low HP with 0-1 pot; 「優先走休息節點」 text with no rest node) remain unverified-fixed.

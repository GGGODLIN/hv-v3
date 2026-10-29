# QA cp9-rc4 log
badge: build 621d7e0, CP4-CP9 listed, no preset warning (shot: qa-cp9-rc4-shots/badge.webp)

## Notes / method
- Bot = Playwright loop pressing recommended key from hint panel (span[data-decide][data-keys], 建議：N·, .hint.suggest) else A. Map: Z if HP<50%; rest if HP<60% or floor%5==4; merchant (buys 3 life potions, 50C ea, limit 3) > battle > rest > chest; elite only if only option. Boss buff/loot: 不拿 / no manual equip (game auto-equips some drops).
- "big hit" = HP loss in one turn >=20% of max HP (measured HP before/after pressing; Z turns excluded); "warned" = a .decide ⚠ panel was showing on the previous turn.
- "lethal forecast" = decide value `danger` (HP 危險：下回合全體暴擊估計 >= HP).
- Early practice (before run 1, discarded, not counted): 2 aborted exploratory sessions on non-fresh state, retreated. First counted run starts after fresh reload.
- Every run: reload `?cp9&cp8&cp6&preset=postF20-<school>&fresh`, buy 10 life potions (start stock 3 -> 13), 4x + skip anim, 忽略並出發, start floor 1.

## blade run 1: DEEPEST 25 (died, boss floor 25)
- death: 風眼熊 蓄力一擊 (charge) during boss fight 塔主・風尾蜈蚣 (鐵壁); potions on 1-turn cooldown at lethal turn (rec was A, not Z)
- nodes (floor:type): 1戰 2商 3戰 4營火 5首領 6戰 7商 8戰 9營火 10首領 11戰 12商 13戰 14營火 15首領 16戰 17寶箱 18戰 19營火 20首領 21戰 22寶箱 23戰 24營火 25首領 (no elites)
- potions: bought town 10, merchants 9 (3 merchants x3), dropped ~1 (derived: end 18 = 13+9-5+1), drunk 5
- drinks: 1) HP28% lethal-forecast YES (Z) 2) HP26% lethal YES 3) map HP49% no forecast 4) HP6% lethal YES 5) HP47% lethal YES
- normal fights (10): A=19, nonA=7 (hints seen: 本場可用 Q/W/E tips, Q/W 可以用了; Z x1 in f11). 
- boss fights: f5 turns4 maxhit11.4% big0; f10 t2 29.9% big1 (unwarned1); f15 t2 29.9% big1 (unwarned1); f20 t2 11.4% big0; f25 t10 (death) max 50.0% big3 (unwarned2)
- largest single-turn %: 50.0 (boss f25, 383/766); normal-fight max 29.9
- 0.6秒 msgs: 0 ; Z-recommended-while-cooldown: 0 (at HP383 charge turn panel said "A·攻擊…生命藥水冷卻 1 回合")
- drain/life-steal charges: boss f20 had hint "災厄每次蓄力都是吸血重擊" but boss died in 2 turns, no drain charge seen
- death screen: title "死因：（蓄力大招）風眼熊 蓄力一擊！ 最後一擊 232 傷害（佔最大 HP 30%）"; lethal line "最後 3 回合受到的傷害：第 8 回合 -383、第 9 回合 -0、第 10 回合 -383"; advice "建議：最後兩回合共受 383 傷害（佔最大 HP 50%）…先喝藥或防禦" + "生命藥水已用完，最後是蓄力大招（30%）：看到 ⚠ 蓄力就按 D·防禦，出發前多買藥水。"
  - title hit (232, 30%) != lethal-turn damage (383, 50%) -> title shows one hit of a multi-hit turn. BUG? advice says "生命藥水已用完" but 18 life potions were still held (lost list: 生命藥水×18). shot: qa-cp9-rc4-shots/death-blade-1.webp

### TALLY after blade 1: floors [25]

## blade run 2: DEEPEST 20 (died, boss floor 20)
- (bot v2: page.content()-based, faster; run 1 used bot v1, same rules)
- death: 雷羽翼龍 蓄力一擊 in boss fight 20 (災厄・炎眼蠍 boss, life-steal drain charges). Potion on cooldown 1 turn at lethal turn; panel advised A (防禦也擋不住)
- nodes: 1戰 2商 3戰 4營火 5首領 6戰 7商 8戰 9營火 10首領 11戰 12商 13戰 14營火 15首領 16戰 17寶箱? 18戰 19營火 20首領 (no elites; ! = only option on 5/10/15/20)
- potions: bought town 10, merchants 9, drunk 5 (map 0), end stock 17 lost (lost list: 生命藥水×17) => dropped = 17-13-9+5 = 0
- drinks (HP% / lethal forecast): 33% YES(N), 34% YES(N), 26% YES(N), 33% YES(boss), 31% YES(boss)
- normal fights (8): A=19, nonA=6 ; hints: Q/W 可以用了, 本場可用 tips
- bosses: f5 t3 max14.4% big0; f10 t2 17% big0; f15 t3 12% big0; f20 t10 (death) max27.1% (excl. death-turn) big3 (unwarned 1); death screen turns: -360,-116,-376 (≈47%,15%,49% of ~766 max)
- largest single-turn %: ~49% (death-screen -376 / ~766; non-death-turn max 30.0% normal)
- 0.6秒: 0 ; Z-rec-on-cooldown: 0 (panel: "生命藥水冷卻中（還要 1 回合），繼續攻擊…")
- drain charge (災厄・炎眼蠍): hint "♥ 災厄張開血口（下回合吸血重擊：防禦可減傷，暈眩可打斷）" shown (stun interrupt hinted: YES; blade has no stun skill pressed since rec was not stun); log: "吸血重擊！ 對你造成 139/140 傷害" ; "吸血（防禦減半） +70" (with D) ; per-line D/no-D pairing not captured in v2 -> improved in v3
- death screen: title "死因：（蓄力大招）雷羽翼龍 蓄力一擊！ 最後一擊 267 傷害（佔最大 HP 33%）"; lethal line "最後 3 回合受到的傷害：第 8 回合 -360、第 9 回合 -116、第 10 回合 -376"; advice "建議：最後兩回合共受 492 傷害（佔最大 HP 60%）…" + "生命藥水已用完，最後是蓄力大招（33%）…" while 17 life potions still held => same BUG as run 1 (wording wrong when potion is on cooldown).
  title hit 267 (33%) != turn damage 376 (49%) -> title is single biggest hit, turn had more damage

### TALLY after blade 2: floors [25,20]

## blade run 3: DEEPEST 31 (died in NORMAL fight on floor 31)
- nodes: 1B 2M 3B 4R 5K! 6B 7M 8B 9R 10K! 11B 12C 13B 14R 15K! 16B 17C 18B 19R 20K! 21B 22M 23B 24R 25K! 26B 27M 28B 29R 30K! 31B  (B battle,M merchant,R rest,C chest,K boss,!=only option)
- potions: town 10, merchants 12, drunk 12 (1 map @48%), lost at death 13 => dropped 13-13-12+12=0
- drinks (HP%/lethal): 18Y 34Y 48(map,no fcst) 32Y 20Y 20Y 50Y(boss) 16Y(b) 20Y(b) 22Y(b) 17Y 2Y   (Y = lethal forecast showing)
- fights: see data.jsonl (machine-readable per-fight [floor,boss,A,N,turns,maxHit%,big,unwarned])
- death screen: title "死因：風棘野豬 最後一擊 255 傷害（佔最大 HP 30%）"; lethal "最後 3 回合受到的傷害：第 7 回合 -238、第 8 回合 -425、第 9 回合 -255"; also "最後 2 回合最大單擊：（蓄力大招）炎鐮騎士 蓄力一擊！ 358（42%）"; advice "建議：最後兩回合共受 680 傷害（佔最大 HP 80%）…先喝藥或防禦" + "生命藥水已用完：出發前多買藥水…" (13 potions still held => same wording BUG when potion on cooldown). Title (255) == lethal last-turn damage (255): YES.
  shot: qa-cp9-rc4-shots/death-blade-3.webp
- largest single-turn: 50% (425/850 at turn 8)
- 0.6秒 0; Z-rec-on-cooldown 0 (panel said "生命藥水冷卻 1 回合… A·攻擊")
### TALLY after blade 3: floors [25,20,31]
(machine-readable data for all runs: /workspace/data.jsonl)

## blade run 4: DEEPEST 25 (died boss f25, charge 霜晶術士; potion on cooldown, panel said A)
- nodes: 1B 2M 3B 4R 5K! 6B 7C 8B 9R 10K! 11B 12M 13B 14R 15K! 16B 17C 18B 19R 20K! 21B 22M 23B 24R 25K!
- potions town 10, merchants 9, drunk 4 (map 46%, 30%Y, 1%Y, 40%Y), lost 18
- death: title "（蓄力大招）霜晶術士 蓄力一擊！ 最後一擊 257 傷害（佔最大 HP 31%）"; lethal "第 8 回合 -416、第 9 回合 -0、第 10 回合 -416"; advice present ("最後兩回合共受 416 傷害…" + "生命藥水已用完…" wording bug w/ 18 potions held). Title(257) != lethal turn dmg(416): shows single hit of a 2-hit turn. shot death-blade-4.webp
- max single-turn 50% (416/832); 0.6秒 0; Z-rec-on-cd 0
### TALLY after blade 4: floors [25,20,31,25]

## blade run 5: DEEPEST 30 (died boss f30: 堅硬・深淵之王・雷牙飛龍 重擊 416 = 50%)
- nodes 1B 2M 3B 4R 5K 6B 7M 8B 9R 10K 11B 12C 13B 14R 15K 16B 17M 18B 19R 20K 21B 22M 23B 24R 25K 26B 27M 28B 29R 30K
- potions town 10, merchants 15, drunk 8 (map 46%; 19%Y 41%Y 9%Y 17%Y 7%Y 27%Y 34%Y), lost 21
- death: title "（蓄力大招）堅硬・深淵之王・雷牙飛龍 重擊！ 最後一擊 416 傷害（佔最大 HP 50%）" ; lethal "第 3 回合 -130、第 4 回合 -416、第 5 回合 -416"; advice present (+ "生命藥水已用完…" wording bug with 21 potions held). Title == lethal hit: YES. shot death-blade-5.webp
- boss f25 lasted 21 turns (max 42.4%, 7 big-hit turns, 3 unwarned) ; max single-turn 50%; 0.6秒 0; Z-rec-on-cd 0
### TALLY after blade 5: floors [25,20,31,25,30]
- shot drain WITH D (blade run6 boss f20 災厄・炎毒術士: 傷害181 → 吸血（防禦減半）+91): qa-cp9-rc4-shots/drain-with-D-blade6.webp
- shot stun-interrupt hint (summon ⟳ 塔主正在呼喚援軍（暈眩可打斷）, NOT a drain): qa-cp9-rc4-shots/stun-hint-summon-blade6.webp. NOTE: bot v3 stun regex was too broad for the first trigger; v3b restricts to ♥ drain lines.

## blade run 6: DEEPEST 30 (died boss f30 鐵壁・深淵之王・霜鋼骷髏; 413=50% then 276 lethal; potion cd)
- potions town 10, merchants 18, drunk 6 (24Y 25Y 26Y 22Y 9Y 50Y; no map drink), lost 25. normal/boss detail in data.jsonl
- drain (boss f20 災厄・炎毒術士, defended): 181 dmg -> 吸血（防禦減半）+91. stun-interrupt hint on a drain charge not shown in panel (hint only "看到紅色 ♥ 預告就防禦，或用盾擊暈眩打斷" tip).
- death title "（蓄力大招）…蓄力一擊！ 最後一擊 276 傷害（佔最大 HP 33%）" == lethal last hit 276: YES; advice present (wording bug "生命藥水已用完" w/ 25 potions). shot death-blade-6.webp
### TALLY after blade 6: floors [25,20,31,25,30,30]
- shot stun-interrupt hint on a DRAIN charge (blade run7 boss f20 災厄・雷鱗地龍): log line '♥ 災厄張開血口（下回合吸血重擊：防禦可減傷，暈眩可打斷）' + panel tip; panel decision was Z (HP 241/850 lethal fcst), no stun skill recommended: qa-cp9-rc4-shots/stun-interrupt-hint-on-drain-blade7.webp
- shot drain WITHOUT D (blade run7 boss f20 災厄・雷鱗地龍; pressed Z per panel): 吸血重擊 311 dmg -> 吸血 +311 (full heal) : qa-cp9-rc4-shots/drain-without-D-blade7.webp  [vs with D: 181 dmg -> 吸血（防禦減半）+91]

## blade run 7: DEEPEST 20 (died boss f20 災厄・雷鱗地龍 fight; killed by 霜鬃刺客 add; potion cd) 
- drinks: map 45%, 15%Y(N), 28%Y(boss). potions town 10, merchants 12, lost 22. shots: stun-interrupt hint on drain, drain without D, death-blade-7.webp
- title "霜鬃刺客 最後一擊 175 傷害（佔最大 HP 21%）" = "最後一擊：霜鬃刺客 175" line (equal to final hit); last-turn total -255; advice present (+"生命藥水已用完" wording bug w/ 22 held)
### TALLY after blade 7: floors [25,20,31,25,30,30,20]

## blade run 8: DEEPEST 30 (boss f30 charge 419 dmg =50%; potion cd 2 turns, A recommended at HP 50%)
- death title "（蓄力大招）嗜血・深淵之王・霜尾騎士 重擊！ 最後一擊 419 傷害（佔最大 HP 50%）" = 最後一擊 line 419; advice present (but says 生命藥水已用完 while 22 potions lost -> wording bug). shot death-blade-8.webp
### BLADE DONE floors [25,20,31,25,30,30,20,30]

## oc run 1: DEEPEST 30 (boss f30 霜翼巨人 charge 315=39%; potion cd 1 turn; death-oc-1.webp). title 315 = 最後一擊 315; advice present ("生命藥水已用完" wording although potions remained). Drain: 71 with D (stun hinted). details in data.jsonl
## oc run 2: DEEPEST 30 (boss f30 霜影巨人 charge 405=50%, cd1) death-oc-2.webp; title 405=最後一擊 405; advice present ("已用完" wording again w/18 left). drain 260 noD (stun hinted). Floors so far oc [30,30]
## oc run 3: DEEPEST 35 (boss f35 雷蹄蜈蚣 charge 417=50%, cd1, HP13) death-oc-3.webp; title=lethal 417; advice present. Floors oc [30,30,35]
## oc run 4: DEEPEST 30 (boss f30 霜鐵自走甲 charge; title 最後一擊 134 (16%) = final-hit line 134 but last-turn total -236 (28%)). death-oc-4.webp. Floors oc [30,30,35,30]
## oc run 5: DEEPEST 30 (boss f30 霜蹄騎士 charge 368=47%) death-oc-5.webp; title=lethal 368; advice present. Floors oc [30,30,35,30,30]
## oc run 6: DEEPEST 30 (boss f30 風鱗齒輪獸 hit 225=30%) death-oc-6.webp; title=lethal 225; advice present. Floors oc [30,30,35,30,30,30]
## oc run 7: DEEPEST 30 (boss f30 霜蹄遊俠 charge 293=37%) death-oc-7.webp; title=lethal 293. Floors oc [30,30,35,30,30,30,30]
## oc run 8: DEEPEST 35 (boss f35 風尾戰士 charge; title 最後一擊 97 (13%) while last turn total -375 (50%)) death-oc-8.webp + BUG-death-title-... shot. OC DONE floors [30,30,35,30,30,30,30,35]
- shot arcane spell hint (arcane run1 f5 boss): '建議：3·雷擊（弱雷）' -> arcane-spell-hint-arcane1.webp
## arcane run 1: DEEPEST 40 (boss f40 烈焰災厄霜角虎 charge; title 323(43%) final hit vs last turn -380 (50%)). death-arcane-1.webp. spell hints seen (建議：3·雷擊) shot. drains 160D,190D
## arcane run 2: DEEPEST 30 (boss f30 霜鬃骷髏 charge 365=50%) death-arcane-2.webp; title=lethal 365. Floors arcane [40,30]
## arcane run 3: DEEPEST 30 (boss f30 霜棘魔像 charge; title 344 final hit vs last turn 383) death-arcane-3.webp. Floors arcane [40,30,30]
## arcane run 4 (restart after interruption; earlier aborted attempt discarded): DEEPEST 30 (boss f30 雷蹄鳳凰 charge 380=50%) death-arcane-4.webp; title=lethal. Floors arcane [40,30,30,30]
## arcane run 5: DEEPEST 30 (boss f30 炎鋼鐵偶 charge 380=50%, cd2) death-arcane-5.webp; title=lethal. Floors arcane [40,30,30,30,30]
## arcane run 6: DEEPEST 20 (boss f20 災厄炎毒巨人 吸血重擊 380=50%, cd2) death-arcane-6.webp; title=lethal. Floors arcane [40,30,30,30,30,20]
## arcane run 7: DEEPEST 30 (boss f30 霜晶妖精 charge 380=50%, cd2) death-arcane-7.webp; title=lethal. Floors arcane [40,30,30,30,30,20,30]
## arcane run 8: DEEPEST 30 (boss f30 霜蹄殭屍 charge 365=50%) death-arcane-8.webp. ARCANE DONE floors [40,30,30,30,30,20,30,30]
## bulwark run 1: DEEPEST 35 (boss f35 風毒精靈, lethal 211=26%) death-bulwark-1.webp; skill hint shot bulwark-skill-hint-q-shield-bash.webp. Floors bulwark [35]
## bulwark run 2: DEEPEST 35 (boss f35 雷鬃雙頭龍 charge; title 200 but lethal turn -337 => TITLE BUG) death-bulwark-2-BUG-title-mismatch.webp. Floors bulwark [35,35]
## bulwark run 3: DEEPEST 30 (boss f30 霜牙巨人 charge; title 340 vs -401 (title clipped to HP)) death-bulwark-3-title-clipped.webp. Floors bulwark [35,35,30]
## bulwark run 4: DEEPEST 30 (boss f30 闇翼幽魂 charge; title 225 vs -395 mismatch) death-bulwark-4-title-mismatch.webp. Floors bulwark [35,35,30,30]
## bulwark run 5: DEEPEST 30 (boss f30 霜眼術士 charge; title 165 vs -354 mismatch) death-bulwark-5-title-mismatch.webp. Floors bulwark [35,35,30,30,30]
## bulwark run 6: DEEPEST 30 (boss f30 霜爪砲台 charge; title 159 = lethal) death-bulwark-6.webp. Floors bulwark [35,35,30,30,30,30]
## bulwark run 7: DEEPEST 45 (boss f45 雷晶梟 charge 395; title=lethal) death-bulwark-7.webp. Floors bulwark [35,35,30,30,30,30,45]
## bulwark run 8: DEEPEST 30 (boss f30 霜冠幽魂 charge; title 336 vs -374 mismatch) death-bulwark-8-title-mismatch.webp. ALL 32 RUNS DONE. Floors bulwark [35,35,30,30,30,30,45,30]

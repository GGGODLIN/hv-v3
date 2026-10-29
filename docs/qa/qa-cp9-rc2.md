# QA cp9-rc2 (served HEAD 04c1767; badge text shows stale "build 682aee8+dirty · CP4 · CP5 · CP6 · CP7 · CP8 · CP9", confirmed by user as stale hash)
URL per run: http://127.0.0.1:5350/?cp9&cp8&cp6&preset=postF20-<school>&fresh  (blade for blade; oc/arcane/bulwark use the matching preset name — deviation: user specified only postF20-blade)
Bot-driven: a Playwright script reads the hint DOM each turn and presses the recommended key (decide keys[0] unless A; else Z pothint; else element-spell suggestion; else ready skill Q/W/E; else A). Node priority literal: merchant > battle > rest(if HP<60% or pre-boss) > chest > rest > non-elite > elite. Merchant: buy 3 health potions. Buff offers: take first. Map Z when HP<50%.
Notes: OC "end" value = OC read at the last turn start of the fight (before the finishing turn), so it is a lower-bound-ish proxy.

## blade run 01 — DONE — deepest floor 16 — death: 霜翼刺客 (Frost-wing assassin) at F16
(Run 1 caveat: hint text strings were not captured (script bug); map depth parse bug had no effect on node choice since rest was only taken as fallback.)
nodes: battle, merchant, battle, chest, boss(F5), battle, merchant, battle, rest, boss(F10), battle, merchant, battle, merchant, boss(F15), battle
potions: bought 10 town + 12 merchant; dropped 0; drunk 6; lost at death 19 health
drinks: F8T1 HP17% lethal=no(danger decide); F11T1 37% no; F11T4 10% no; F16T1 17% no; F16T4 21% no; F16T7 6% no (all danger-flagged, none with urgent lethal forecast)
fights: F1 A3/nonA0; F3 A2/1 (skillready greatCleave); F5 boss 2 turns maxdmg 8%; F6 A1/1 (rendingBlow ready); F8 A3/1 pothint; F10 boss 1 turn? (2 keys) 30% unwarned; F11 A4/2 pothint maxdmg 43%; F13 A1/1; F15 boss 2 turns 8%; F16 A4/6 DEATH
bosses: F5 2t max 8%; F10 ~1-2t max 30% (bigUnwarned 1 by my 20% heuristic); F15 2t max 8%
death screen: title ☠ 倒下了…… ; 到達深淵第16層（已通過15層）; 死因：最後2回合最大單擊 霜翼刺客 造成205傷害（佔最大HP 25%）; 最後一擊：霜翼刺客 191; 最後3回合受到的傷害：第8回合 -480、第9回合 -205、第10回合 -191; 建議：最後一擊佔最大HP 23%（≥15%）：HP低於這一擊的兩倍前就先喝藥或防禦。
final fight log (F16, 10 turns, max HP 820): T0 HP674 A => HP141 (-533, 65%!) ; T1 Z => 510 ; T2 D => 420 ; T3 D => 176 (-244) ; T4 Z => 460 ; T5 D => 279 ; T6 A => 48 (-231) ; T7 Z => 340 ; T8 A => 135 (-205) ; T9 A => dead (-191 vs HP135: list shows 191 >= 135, no undercount)
screenshot: /workspace/qa-cp9-rc2-shots/death-blade-r01.png
OC pairs (end of prev fight -> start of next): 16->24, 35->55, 20->25, 35->14, 27->82, 44->25, 52->60, 70->92, 55->30 (mixed; see check 7)

## blade run 02 — DONE — deepest floor 26 — death: 霜尾戰士 (+霜骨豹) F26 (normal fight)
(the script call was split in two at F21; F21 turn counts merged: A=4 nonA=1)
nodes: 1b 2m 3b 4rest 5boss 6b 7m 8b 9m 10boss 11b 12chest 13b 14rest 15boss 16b 17m 18b 19m 20boss 21b 22m 23b 24rest 25boss 26b
potions: bought 10 town + 18 merchant; dropped 0; drunk 12 (2 on map); lost at death 19
drinks: F8T1 39% lethal=no; F13T1 32% no; F18T2 10% no; map 50%; F20T3 32% LETHAL-FORECAST-SHOWING; F20T6 30% no; map 47%; F21T3 23% no; F23T2 13% no; F25T4 22% no; F25T11 27% LETHAL-FORECAST; F26T1 27% no  (all battle drinks were under danger/low-HP decide)
fights:
F1 風鱗怨靈、風爪屍鬼 A3/0 max16% hints skillhint
F3 A2/0 max9% oc 23->34
F5(boss) 塔主・炎蹄飛龍 4t A2/nonA2 max13% prewarn(charge) yes
F6 A1/1 max30% skillready rendingBlow
F8 A3/1 max30% pothint
F10(boss) 深淵之王・霜爪星靈 2t A0/2 max12%
F11 1t nonA1
F13 A3/1 max52% (normal fight, unwarned)
F15(boss) 守門者・霜毒刺客 2t A0/2 max28% (1 unwarned >=20%)
F16 A3/0 max20%; F18 A3/2 max39% pothint skillready greatCleave
F20(boss) 災厄・霜眼戰士 9t A3/nonA6 max38% charge+urgent shown (1 big unwarned by heuristic)
F21 A4/1 max33%; F23 A3/1 max41%
F25(boss) 守護・塔主・炎眼翼龍 13t A4/nonA8 max42% charge+urgent
F26 霜骨豹、霜尾戰士 A3/1 max62% DEATH
death screen: ☠ 倒下了……; 到達深淵第26層（已通過25層）; 死因：最後2回合最大單擊 霜尾戰士 造成283傷害（佔最大HP 36%）; 最後一擊：霜尾戰士 126; 最後3回合受到的傷害：第2回合 -411、第3回合 -283、第4回合 -126; 建議：最後兩回合共受409傷害（佔最大HP 51%）：兩回合內就會被打穿，HP低於這個數字前就先喝藥或防禦。
final fight log (max HP 796; my T = their turn-1): T0 HP714 A => 217 (-497, 62% one turn, normal fight); T1 HP217 Z => 385 (list shows -411 for this turn: heal+damage consistent); T2 HP385 A => 102 (-283 matches list); T3 HP102 A => dead (last hit 126 > ... list 126, HP was 102 so no undercount)
bugs: 'swallowed key W resent', 'swallowed key A resent' (0.6s message seen; resent once after 1s). S never recommended.
shots: death-blade-r02.png, oc-carry-blade-r02-F3.png (F3 start OC 23 after prev fight end 17), boss-prewarn-blade-r02-F5.png, skillhint-blade-r02-F6.png
OC pairs (prev end -> next start): 17->23, 34->93(boss), 24->30, 38->19, 34->93(boss), 67->41, 41->23, 39->98(boss), 59->40, 57->66, 85->105(boss), 0->15, 37->42, 56->114(boss), 23->23

## blade run 03 — DONE — deepest floor 30 — death: 嗜血・深淵之王・霜鐮巨人 boss F30 (蓄力一擊 415)
(split into 2 script calls at F26; F26 summary lost in the split: F26 霜蹄騎士、霜岩熊 A>=3/n>=3 maxturn 53% unw 2, drinks F26T1 26%, F26T4 19% lethal=no)
nodes: 1b 2m 3b 4rest(rs avail; chose b? first rest taken) 5boss 6b 7m 8b 9m 10boss 11b 12m 13b 14m 15boss 16b 17m 18b 19rest 20boss 21b 22chest 23b 24m 25boss 26b 27m 28b 29m 30boss
potions: bought 10 town + 27 merchant (21+6); dropped 0; drunk 17; 
drinks: F10T2 29% no; F11T1 20% no; F11T4 29% no; map 48%; F16T2 31% no; F16T6 27% no; F20T3 19% no; map 45%; F23T2 31% no; F25T5 35% no; F26T1 26% no; F26T4 19% no; F28T2 3% no; F28T5 29% no; map 49%; F30T3 25% no; F30T7 28% LETHAL-FORECAST yes
fights (A/nonA, max-turn dmg%, hints): F1 A4/0 11% sk; F3 2/1 20% rdy rendingBlow; F5b 1/1 5%; F6 0/1; F8 1/1 21% rdy; F10b 3/3 33% charge+urg; F11 4/2 43% pot; F13 1/1 25% rdy greatCleave; F15b 2/1 30% ; F16 3/4 56% pot; F18 1/1 25% rdy; F20b 3/2 30% (3 unw by heuristic); F21 2/1 28% rdy; F23 3/1 35%; F25b 2/5 19% charge+urg rdy rendingBlow; F28 3/5 59% rdy greatCleave pot; F30b 5/5 45% charge+urg pot
boss table: F5 2t 5%; F10 5t 33%; F15 3t 30%; F20 5t 30%; F25 7t 19%; F30 10t 45%
death screen: ☠ 倒下了……; 到達深淵第30層（已通過29層）; 死因：最後2回合最大單擊（蓄力大招）嗜血・深淵之王・霜鐮巨人 蓄力一擊！ 造成415傷害（佔最大HP 45%）; 最後一擊：（蓄力大招）…415; 最後3回合受到的傷害：第8回合 -466、第9回合 -47、第10回合 -462; 建議：最後兩回合共受509傷害（佔最大HP 55%）… 第9回合蓄力時的提示：A·攻擊（儘快收掉怪物）（防禦後估計466 ≥ HP 419，防禦也擋不住；生命藥水冷卻1回合，HP危險…）
BUG-CANDIDATE(undercount): lethal line says 最後一擊 415, but HP at start of last turn was 419 (415 < 419); the turn list shows -462 for that turn (415 + another 47 hit), so the list is right and the 最後一擊 line is the single biggest hit, not the turn total.
final fight log (F30 boss, max HP 932): T0 932 Q => 932(0); T1 932 D CHARGE URG => 512 (-420, 45%); T2 512 A => 233 (-279, 30%); T3 233 Z(drink 25%) => 932; T4 932 D CHG URG => 569 (-363, 39%); T5 569 A (swallowed once, resent) => 262 (-307, 33%); T6 ...; T7 262 Z CHG URG (lethal forecast, drink 28%) => 466; T8 466 A => 419 (-47); T9 419 A (CHG URG; "defense can't stop it") => dead (-462)
Warnings: every charged big hit had a CHG/⚠ decide the turn before (the 415–420 hits); bursts of 30–33% without a charge flag were normal attacks.
bugs: swallowed A resent F10T4, F30T5, F30T8. S never recommended.
shot: death-blade-r03.png
OC pairs: 16>22, 39>70(boss), 42>49, 49>29, 38>65, 15>15, 41>46, 51>71(boss), 43>43, 28>28, 41>65(boss), 16>26, 49>31, 59>109(boss), 6>15, 41>50, 13>63(boss)

## blade run 04 — DONE — deepest floor 16 — death: 雷刃翼龍 (+雷紋翼龍) F16 normal
nodes: 1b 2m 3b 4rest 5b(boss) 6b 7m 8b 9rest 10boss 11b 12m 13b 14m 15boss 16b
potions: bought 10 town + 12 merchant; dropped 0; drunk 2 (F11T2 33% L=no; F16T1 39% L=no); lost 23
fights (turns, A/non-A, max-turn dmg %, hints): F1 3t 3/0 6% sk; F3 3t 2/1 15% rdy greatCleave; F5b 3t 2/1 7%; F6 2t 1/1 23% rdy rendingBlow; F8 3t 3/0 27%; F10b 2t 0/2 23% rdy; F11 4t 3/1 38% pot; F13 3t 3/0 26%; F15b 2t 0/2 13%; F16 4t 2/3 44% pot DEATH
death: ☠ 倒下了……; 到達深淵第16層(通過15); 死因：最後2回合最大單擊 雷刃翼龍 造成158傷害（佔最大HP 19%）; 最後一擊：雷刃翼龍 158; 最後3回合受到的傷害：第3回合 -372、第3回合 -0、第4回合 -158 (duplicate turn 3 with -0: the S press shows up as its own 0-damage 'turn'); 建議：最後一擊佔最大HP 19%（≥15%）：HP低於這一擊的兩倍前就先喝藥或防禦。
final fight (max HP 838): T0 432 D => 330 (-12%); T1 330 Z => 499; T2 499 A => 127 (-44%); T3 127 S (recommended, first press of this run) then A on same turn => dead (-158 vs HP127: no undercount)
S: recommended once at T3 (HP127), pressed once, not re-recommended after.
OC pairs: 23>23, 38>62(boss), 34>34, 44>22, 43>101(boss), 64>39, 53>59, 76>126(boss), 95>70
shot: death-blade-r04.png

## blade run 05 — DONE — deepest floor 18 — death: 雷棘翼龍 (+炎岩地龍) F18 normal
nodes: 1b 2m 3b 4m 5boss 6b 7chest 8b 9m 10boss 11b 12m 13b 14m 15boss 16b 17m 18b
potions: bought 10+18; dropped 1; drunk 10 (1 map): F11T1 36%; map 26%; F13T1 40%; F13T4 34%; F13T7 8%; F16T1 9%; F16T4 35%; F16T7 12%; F18T1 27%; F18T4 8% — lethal forecast showing: none (all L=0)
fights (turns A/n max%): F1 4t 4/0 9%; F3 2t 1/1 14% rdy; F5b 3t 2/1 10%; F6 1t 0/1; F8 2t 2/0 23%; F10b 2t 0/2 11%; F11 4t 3/1 37% pot; F13 9t 3/6 60% pot; F15b 2t 0/2 30%; F16 9t 4/5 56% pot; F18 7t 3/4 54% pot DEATH
death: 到達深淵第18層; 死因：最後2回合最大單擊 雷棘翼龍 造成236傷害（佔最大HP 29%）; 最後一擊：雷棘翼龍 227; 最後3回合受到的傷害：第5回合 -312、第6回合 -407、第7回合 -227; 建議：最後兩回合共受634傷害（佔最大HP 77%）：兩回合內就會被打穿…
note: headline "最大單擊 236" is the biggest single hit; the turn list is the per-turn total; no undercount (last 227 vs HP 101).
final fight (HP 820): T0 665 A =>224(-54%); T1 Z =>425; T2 D =>411; T3 D =>63(-42%); T4 Z =>508; T5 A =>101(-50%); T6 A => dead
OC pairs: 21>28, 17>67(boss), 44>44, 44>25, 32>90(boss), 31>31, 50>50, 25>75(boss), 17>17, 29>29
shot: death-blade-r05.png

## blade run 06 — DONE — deepest floor 26 — death: 霜牙獅 (last hit 232) + 霜晶遊俠 (biggest 289), F26 normal (13 turns)
nodes: 1b 2m 3b 4m 5boss 6b 7m 8b 9rest 10boss 11b 12m 13b 14m 15boss 16b 17m 18b 19rest 20boss 21b 22chest 23b 24rest 25boss 26b
potions: bought 10+18; dropped 1; drunk 7 (none on map): F8T2 33%; F13T1 33%; F16T1 30%; F18T2 37%; F26T3 45%; F26T6 36%; F26T10 11% — lethal forecast showing in all: no
fights: F1 2t 2/0 16%; F3 2t 2/0 19%; F5b 3t 1/2 7% tip; F6 2t 1/1 21% rdy; F8 4t 3/1 20% pot; F10b 3t 2/1 11%; F11 3t 3/0 19%; F13 4t 3/1 39%; F15b 2t 1/1 10%; F16 3t 1/2 27% rdy greatCleave; F18 4t 2/2 38%; F20b 2t 1/1 5%; F21 1t 0/1; F23 2t 2/0 40%; F25b 2t 0/2 15%; F26 13t 3/10 58% DEATH
death: 到達深淵第26層; 死因：最後2回合最大單擊 霜晶遊俠 造成289傷害（佔最大HP 35%）; 最後一擊：霜牙獅 232; 最後3回合受到的傷害：第11回合 -253、第12回合 -482、第13回合 -232; 建議：最後兩回合共受714傷害（佔最大HP 86%）…
final fight (HP 826): T0 781 A =>433(-42%); T1-2 D; T3 Z(45%) ; T4-5 D; T6 Z(36%); T7-9 D (T9 -44%); T10 Z(11% =>573); T11 A => 91 (-58%); T12 A => dead (232 vs HP91, no undercount)
OC carries: 137>137, 149>149, 153>153, 8>18 etc (see check 7); OC drained by D over the long fight (153 -> 11)
OC pairs: 8>18, 27>85(boss), 55>28, 35>13, 31>81, 50>59, 74>83, 107>157(boss), 137>137, 151>128, 121>171(boss), 149>149, 149>137, 156>206(boss), 153>153
shot: death-blade-r06.png

## blade run 07 — DONE — deepest floor 26 — death: 風血蜈蚣 (last 180) / 霜毒熊 (biggest 202), F26 normal
nodes: 1b 2m 3b 4rest 5boss 6b 7chest 8b 9rest 10boss 11b 12m 13b 14rest 15boss 16b 17chest 18b 19rest 20boss 21b 22m 23b 24rest 25boss 26b
potions: bought 10+9; dropped 1; drunk 9 (1 map): F11T2 27%; F13T2 36%; F16T3 11%; F16T6 10%; F16T9 32%; F18T1 34%; map 25%; F26T1 20%; F26T5 17% — lethal forecast: none
fights: F1 4t 4/0 14%; F3 2t 1/1 15%; F5b 2t 1/1 9%; F6 1t 0/1; F8 2t 2/0 25%; F10b 2t 0/2 28%; F11 4t 3/1 33% pot; F13 5t 2/3 41%; F15b 2t 0/2 30%; F16 11t 5/6 39%; F18 4t 3/2 55%; F20b 3t 1/2 16%; F21 1t 0/1; F23 3t 3/0 37%; F25b 2t 0/2 30%; F26 8t 3/5 50% DEATH
death: 到達深淵第26層; 死因：最後2回合最大單擊 霜毒熊 造成202傷害（佔最大HP 24%）; 最後一擊：風血蜈蚣 180; 最後3回合受到的傷害：第6回合 -293、第7回合 -403、第8回合 -180; 建議：最後兩回合共受583傷害（佔最大HP 71%）…
final fight (HP 826): T0 579 A =>168(-50%); T1 Z; T2-4 D(T4 -35%); T5 Z(17%); T6 A =>130(-49%); T7 A dead (180 vs HP130; list says 180, no undercount)
OC pairs: 23>31, 42>69(boss), 43>52, 52>34, 56>106(boss), 68>49, 74>74, 65>89(boss), 53>28, 36>41, 53>108(boss), 79>52, 52>35, 51>109(boss), 57>57
shot: death-blade-r07.png

## blade run 08 — DONE — deepest floor 30 — death: 堅硬・深淵之王・霜羽騎士 boss F30 (蓄力一擊 392 = exactly 50% max HP)
(call split at F28; F28 first 6 turns: A3/n3 maxturn 54% after charge warning (D pressed), then a resumed tail.)
nodes: 1b 2m 3b 4rest 5boss 6b 7m 8b 9m 10boss 11b 12m 13b 14m 15boss 16b 17m 18b 19m 20boss 21b 22m 23b 24rest 25boss 26b 27m 28b 29m 30boss
potions: bought 10+30; dropped 0; drunk 13 (2 map): F10T1 32%; map 49%; F16T2 40%; F16T5 1%; F18T1 34%; F20T2 26%; F20T5 4%; map 50%; F23T2 26%; F26T1 26%; F26T4 6%; F28T2 44%; F30T2 30% — lethal forecast showing at those battle drinks: no (F28 T2 had URG earlier turn but not at drink); 
fights: F1 3t 3/0 11%; F3 3t 3/0 12%; F5b 3t 1/2 13%; F6 1t 0/1; F8 3t 3/0 33%; F10b 3t 0/3 28%; F11 3t 3/0 26%; F13 2t 2/0 29%; F15b 2t 0/2 30%; F16 7t 2/5 38%; F18 4t 3/1 48%; F20b 9t 4/6 50% charge+urg; F21 2t 2/0 9%; F23 4t 2/2 42%; F25b 2t 0/2 17%; F26 6t 4/2 67% (normal fight, >50%); F28 ~13t (split) max 54% ; F30b 6t 1/5 50% charge+urg DEATH
death: 到達深淵第30層; 死因：最後2回合最大單擊（蓄力大招）堅硬・深淵之王・霜羽騎士 蓄力一擊！ 392（佔最大HP 50%）; 最後一擊：（蓄力大招）…392; 最後3回合受到的傷害：第4回合 -392、第5回合 -0、第6回合 -392; 建議：最後兩回合共受392傷害（佔最大HP 50%）…第5回合蓄力時的提示：D·防禦（敵人蓄力中，HP 392 撐得住，不必喝藥；HP 危險：下回合全體暴擊估計 392 ≥ HP 392）
OBSERVATION: death advice says "D·防禦 ... HP 392 撐得住" yet crit estimate 392 ≥ HP 392 and the player died to a 392 hit while D was active; D at T3 (HP784) also took the full 392 (784->392), i.e. D showed no visible mitigation vs this 堅硬 boss charge.
final fight (HP 784): T0 429 Q =>429; T1 429 D URG CHG =>233(-25%); T2 233 Z(30%) =>784; T3 784 D URG CHG =>392(-50%); T4 392 A (swallowed once, resent) =>392 (boss recharging); T5 392 D URG CHG => dead (392)
OC pairs: 14>20, 41>96(boss), 69>43, 23>23, 50>100(boss), 51>30, 56>56, 64>119(boss), 60>60, 23>32, 53>103(boss), 33>33?, 52>52, 36>86(boss), 53>25, 47>61, 27>42, 42>101(boss)
shot: death-blade-r08.png
## BLADE medians: floors 16,26,30,16,18,26,26,30 -> sorted 16,16,18,26,26,26,30,30 -> median 26

## oc run 01 — DONE — deepest floor 28 — death: 霜眼騎士 (+雷紋翼龍) F28 normal  [preset postF20-oc: Lv13, skills Q/W/E = vitalStrike/shieldBash...]
(split at F25 boss: F25b = A≈1+3 / n≈2+1, 8 turns, max 16%, charge+urg)
nodes: 1b 2m 3b 4rest 5boss 6b 7chest 8b 9rest 10boss 11b 12m 13b 14rest 15boss 16b 17chest 18b 19rest 20boss 21b 22chest 23b 24m 25boss 26b 27m 28b
potions: bought 10+12; dropped 2; drunk 10 (1 map): map 39%; F11T2 13%; F16T1 30%; F18T3 34%; F20T6 11%; F20T10 25%; F21T3 26%; F26T2 26%; F26T5 2%; F28T1 29%  — lethal forecast: none
fights (turns A/n max%): F1 3t 3/0 9%; F3 2t 1/1; F5b 3t 1/2 12% rdy vitalStrike; F6 3t 2/1 10% rdy shieldBash; F8 4t 4/0 35%; F10b 5t 3/2 10% chg; F11 5t 4/1 42%; F13 3t 2/1 16% rdy shieldBash; F15b 2t 1/1 24%; F16 4t 3/1 46%; F18 5t 2/3 17% rdy shieldBash; F20b 19t 13/8 43% chg+urg rdy; F21 6t 4/2 27% rdy; F23 2t 1/1 8%; F25b ~8t 4/3 16% chg+urg; F26 7t 3/4 44% rdy shieldBash; F28 4t 3/2 48% DEATH
death: 到達深淵第28層（已通過27層）; 死因：最後2回合最大單擊 霜眼騎士 造成411傷害（佔最大HP 46%）; 最後一擊：霜眼騎士 411; 最後3回合受到的傷害：第3回合 -240、第3回合 -0、第4回合 -411; 建議：單擊佔最大HP三成以上：HP低於這個數字前就先喝藥或撤退。
 (again duplicate "第3回合" with -0 after an S press; HP 368 vs hit 411 → no undercount)
final fight (HP 900): T0 698 A =>264(-48%); T1 Z(29%) =>608; T2 A =>368(-27%); T3 S(recommended, pressed once) then A => dead (-411)
S: recommended once at T3, pressed, not re-recommended.
OC CARRY evidence: end>next start: 31>31, 15>15, 27>27, 9>9, 21>21, 17>17, 52>52, 33>33 (identical = carried over); others differ by in-fight gains/spend or boss-start bonus (e.g. 37>87, 76>109)
shot: death-oc-r01.png

## oc run 02 — DONE — deepest floor 30 — death: boss F30 堅硬・深淵之王・炎晶戰士 重擊 378 (+霜岩遊俠 18)
(compact v2 logger; split at F28)
nodes (b=battle m=merchant r=rest/R=rested c=chest, '!'=elite none): bmbrRbbmbrRbbmbrRbbmbmbbmbmbbcb + rRb  (nodes 1..30)
potions: bought 10+21; dropped 0; drunk 12 (1 map): F10T5 34% L=0; F11T1 20%; F13T1 15%; F16T2 14%; F23T1 24%; F25T1 26%; F26T1 38%; F28T1 49%; F28T5 54% L=1 (HP>=40, lethal forecast showing); F28T6 26% L=1; map 14%; F30T3 50% L=1 (HP>=40, lethal forecast showing)
normal fights: 12 fights, A=30 / nonA=22 (non-A 42%), biggest normal-fight turn 58%; hints seen: rdy:vitalStrike, rdy:shieldBash, pot, chg, urg
bosses: F5 3t max13% (no charge shown); F10 9t max19% chg; F15 3t max30% unw1; F20 3t max22% unw1; F25 4t max30% unw2; F30 6t max50% chg+urg
death: 到達深淵第30層; 死因：最後2回合最大單擊（蓄力大招）堅硬・深淵之王・炎晶戰士 重擊！ 造成378傷害（佔最大HP 48%）; 最後一擊：（蓄力大招）霜岩遊俠 蓄力一擊！ 18; 最後3回合受到的傷害：第4回合 -396、第5回合 -0、第6回合 -396; 建議：最後兩回合共受396傷害（佔最大HP 50%）…「霜岩遊俠 的蓄力一擊！是蓄力／大招。第5回合蓄力時的提示：A·攻擊…」
BUG (old bugs 6a/6b): lethal line 最後一擊 = 18 while HP before the last turn was 396 (undercount: the line shows only the last single hit; per-turn total was 396 = 378 boss hit + 18). The advice line names 霜岩遊俠 (the 18-dmg minion) as the charger instead of the boss that did 378 → wrong monster named. Evidence: BUG-wrong-monster-advice-undercount-oc-r02.png
final fight (HP 792): T0 792 E(skill) =>792; T1 D URG CHG =>396(-50%); T2 Q; T3 Z(50%, lethal URG showing) =>396; T4 W (swallowed once, resent); T5 A (URG CHG, "防禦也擋不住") => dead (-396)
OC pairs (non-boss fights, end==start): 5 of 11 identical in part 1; mismatches e.g. 37>44, 58>64, 26>38, 75>90, 77>107, 136>146 (increase only, never reset to 0)
shot: death-oc-r02.png

## oc run 03 — DONE — deepest floor 15 — death: 霜毒騎士 on boss floor F15 (11 turns)
nodes: b m b r R b b m b m b b m b r R b(boss15)  (rest taken at F4, F14)
potions: bought 10+12; dropped 0; drunk 6 (1 map): F10T4 30%; F10T10 35%; map 39%; F15T4 26%; F15T7 15%; F15T10 24% — lethal forecast showing: no
normal fights: 6 fights A=12 / nonA=6 (33%), biggest turn 43%; hints: rdy shieldBash/vitalStrike, pot
bosses: F5 5t max11%; F10 13t max25% chg; F15 11t max30% chg (heuristic unw 5, many normal 20-30% hits)
death: 到達深淵第15層; 死因：最後2回合最大單擊 霜毒騎士 170 (20%); 最後一擊：霜毒騎士 103; 最後3回合受到的傷害：第9回合 -242、第10回合 -170、第11回合 -221; 建議：HP被慢慢磨光：HP剩一半時就喝藥，或在休息點回復後再前進。
(HP before last turn 201 after pressing Z at 24% with decide=Z; last hit shown 103 < HP 201 although the turn total 221 ≥ 201: undercount in the lethal line, list correct. NOTE: the final Z may have been refused due to cooldown (Z used at T7, T4): the HP dropped 201->dead with no heal.)
final fight (boss, HP 846): T0 Q; T1-3 A (-12,-22,-25%); T4 Z(26%) +; T5-6 A (-30,-30); T7 Z(15%); T8 D URG CHG (-29%); T9 A (-20%); T10 Z(24%) => dead
OC: mismatches 26>10, 11>20, 33>17 (OC went DOWN between fights: 26>10, 33>17) with 2 identical of 5 non-boss pairs
shot: death-oc-r03.png

## oc run 04 — DONE — deepest floor 26 — death: 霜翼遊俠 F26 normal
nodes: bmbrRbbmbmbbcbmbbmbrRbbmbrRbb (rests at F4, F19(R), F24? ; chest F13)
potions: bought 10+18; dropped 0; drunk 11 (1 map): F11T1 33%; F13T3 18%; F15T2 22%; F15T6 20%; map 41%; F16T2 26%; F18T3 35%; F20T3 29%; F20T6 60% L=0; F23T2 17%; F26T0 50% L=0 — lethal forecast showing: none
normal fights: 11 fights A=28 / nonA=16 (36%); biggest normal turn 42%; hints rdy vitalStrike/shieldBash, pot
bosses: F5 3t 11%; F10 5t 10% chg; F15 11t 30% chg; F20 9t 30% chg; F25 3t 30%
death: 到達深淵第26層; 死因：最後2回合最大單擊 霜翼遊俠 269 (34%); 最後一擊：霜翼遊俠 269; 最後3回合受到的傷害：第1回合 -412、第2回合 -275、第3回合 -269; 建議：最後兩回合共受544傷害（佔最大HP 68%）…
final fight (HP 798, started at 400): T0 Z(50%) =>386 (-2%: heal cancelled by -412 damage; list says -412); T1 A =>111 (-34%); T2 A => dead (269 vs HP111, no undercount)
OC non-boss pairs: 7/10 identical (end==start); mismatches 47>57, 35>42, 52>35
shot: death-oc-r04.png

## oc run 05 — DONE — deepest floor 30 — death: 狂戰・深淵之王・霜尾騎士 boss F30 (重擊 396)
nodes: bmbmbbmbrRbbmbrRbbmbrRbbcbrRbbmbrRb (+F30 boss)
potions: bought 10+18; dropped 0; drunk 10 (1 map): F8T2 29%; F11T1 39%; F13T1 34%; F16T1 28%; map 38%; F26T2 33%; F26T5 42% L=0; F28T7 34%; F28T10 16%; F30T3 31% L=1
normal fights: 12 fights A=30 / nonA=26 (46%); biggest normal turn 52%; bosses: F5 4t 7%; F10 4t 13% chg; F15 3t 30%; F20 3t 19%; F25 4t 30%; F30 ≥6t 50%+ (A2/n4 until the split) chg+urg
death: 到達深淵第30層; 死因：最後2回合最大單擊（蓄力大招）狂戰・深淵之王・霜尾騎士 重擊！ 396（佔最大HP 50%）; 最後一擊：狂戰・深淵之王・霜尾騎士 301; 最後3回合受到的傷害：第4回合 -364、第5回合 -396、第6回合 -301; 建議：最後兩回合共受697傷害（佔最大HP 88%）…第5回合蓄力時的提示：A·攻擊（防禦後估計396 ≥ HP 32，防禦也擋不住；生命藥水冷卻1回合…）
(final-fight per-turn log lost: the script's second call crashed at the result screen (my bug); first call ended with HP 32; last hit 301 vs HP 32+heal?)
OC non-boss pairs identical: 4/11; others rose (56>76, 116>136, 92>125, 68>88, 31>51, 71>76) or 38>23
shot: death-oc-r05.png

## oc run 06 — DONE — deepest floor 26 — death: 霜角戰士/雷鐮幽魂 F26 normal
nodes: bmbrRbbcbmbbmbmbbmbmbbcbrRb + b(F26)
potions: bought 10+18; dropped 2; drunk 13 (2 map): map 47%; F10T4 25%; map 43%; F13T3 41% L=0; F13T6 21%; F15T2 31%; F15T7 26%; F18T1 33%; F20T1 32%; F25T3 40% L=1 (HP>=40, lethal forecast showing); F25T6 26%; F25T11 31%; F26T1 33% (total 12 listed + 1)
normal fights (11): A=31 / nonA=15 (33%); biggest normal turn 62% (F26 T0 -562/828)
bosses: F5 3t 11%; F10 7t 23% chg; F15 9t 33% chg; F20 6t 30%; F25 ~15t max 38% chg+urg (A4/n9 at split, cleared)
death: 到達深淵第26層; 死因：最後2回合最大單擊 雷鐮幽魂 115 (14%); 最後一擊：霜角戰士 115; 最後3回合受到的傷害：第2回合 -564、第3回合 -216、第4回合 -115; 建議：HP被慢慢磨光：HP剩一半時就喝藥，或在休息點回復後再前進。
NOTE: advice says HP "slowly ground down" although the first turn of this fight did -564 (68%): advice does not match the actual burst. Headline names 雷鐮幽魂 (biggest of last two turns, 115) and last hit 霜角戰士 115 – two different monsters named for equal damage.
final fight (HP 828): T0 786 A =>275 (-62%); T1 Z =>264; T2 A =>48 (-26%); T3 A dead
OC non-boss: 7/9 identical; mismatches 58>41, 50>58, 13>21
shot: death-oc-r06.png

## oc run 07 — DONE — deepest floor 26 — death: 霜尾刺客 F26 normal
nodes: bmbrRbbmbmbbmbrRbbmbmbbmbrRb + b(F26)  (bought 10+21, dropped 0)
drunk 8 (1 map): F10T2 28%; F10T6 34%; F13T3 20%; F15T4 21%; F16T1 26%; map 18%; F20T4 35% L=1; F26T1 20% — none >=40%
normal fights (11): A=22 / nonA=16 (42%); biggest normal turn 48%; bosses: F5 6t 9%; F10 9t 20%; F15 7t 30% chg; F20 8t 40% chg+urg; F25 ~6t 28% chg
death: 到達深淵第26層; 死因：最後2回合最大單擊 霜尾刺客 213 (26%); 最後一擊：霜尾刺客 192; 最後3回合受到的傷害：第2回合 -272、第3回合 -404、第4回合 -288; 建議：最後兩回合共受692傷害（佔最大HP 83%）…
final fight (HP 834, started 542): T0 D =>163 (-45%); T1 Z(20%) =>562; T2 D =>158 (-48%); T3 A dead (last hit 192 vs HP158; turn total 288 ≥ 158)
OC non-boss: 6/9 identical; 23>33,16>25,32>39 (rising)
shot: death-oc-r07.png

## oc run 08 — DONE — deepest floor 30 — death: 烈焰・深淵之王・風骨元素靈 boss F30 (11 turns)
nodes: bmbmbbmbmbbmbrRbbmbrRbbmbmb + b c b m b (F26-F30)  (bought 10+27, dropped 1)
drunk 16 (3 map): map 48%; map 45%; F16T3 13%; F18T1 40% L=0 (>=40); F18T5 33%; F20T3 10%; F20T6 34%; map 35%; F25T2 47% L=1 (>=40, lethal forecast showing); F26T1 36%; F26T4 12%; F26T7 7%; F26T10 22%; F28T2 19%; F30T6 7%; F30T10 29%
normal fights (12): A=34 / nonA=22 (39%); biggest normal 50%; bosses: F5 3t 13%; F10 3t 18%; F15 5t 23% chg; F20 10t 36% chg; F25 ~7t 22% chg; F30 11t 45% chg+urg
death: 到達深淵第30層; 死因：最後2回合最大單擊 烈焰・深淵之王・風骨元素靈 194 (24%); 最後一擊：同 194; 最後3回合受到的傷害：第9回合 -344、第10回合 -240、第11回合 -246; 建議：最後兩回合共受486傷害（佔最大HP 59%）…
final fight (boss HP 822): T0 Q; T1 D URG CHG(-6%); T3 D(-23%); T5 D(-45%); T6 Z(7%) =>731; T8 D(-29%); T9 A(-29% => 238); T10 Z(29%) => dead (list: -246 in the last turn vs last hit 194; HP 238 so total ≥ HP; BUT Z should have healed ~+490 first -> the final Z appears to have had no effect: second occurrence after oc r03 F15T10)
OC non-boss pairs: 2/9 identical; mismatches 17>24, 0>7, 30>40, 9>28, 29>14, 6>25, 14>21 (mostly rising)
shot: death-oc-r08.png
## OC medians: floors 28,30,15,26,30,26,26,30 -> sorted 15,26,26,26,28,30,30,30 -> median 27

## arcane run 01 — DONE — deepest floor 20 — death: boss F20 災厄・炎毒巨人 (吸血重擊 380) / headline 炎鐮術士
nodes: bmbrRbbmbmbbmbmbbcbrRb (+F20 boss); bought 10+15; dropped 2
drunk 10 (2 map): F10T2 12%; F10T5 16%; F11T0 54% L=0 (>=40); map 34%; F15T4 40% L=1 (>=40, lethal forecast showing); F15T8 32%; F16T2 19%; map 26%; F18T2 5%; F20T3 24% L=1
normal fights 8: A=10 / nonA=9 (47%); biggest normal 75%; hints: arcane spell hint "建議：N·法術（弱X）" every fight (2·冰封 弱冰, 3·雷擊 弱雷, 5·聖擊 弱聖), A shows quick-attack spell (烈焰爆破), AoE suggested in some
bosses: F5 4t 20% chg; F10 9t 31% chg unw4; F15 10t 29% chg; F20 ≥5t 50% chg+urg DEATH
death: 到達深淵第20層; 死因：最後2回合最大單擊（蓄力大招）炎鐮術士 蓄力一擊！ 380（50%）; 最後一擊：（蓄力大招）災厄・炎毒巨人 吸血重擊！ 380; 最後3回合受到的傷害：第3回合 -163、第4回合 -380、第5回合 -380; 建議：最後兩回合共受760（100%）…災厄・炎毒巨人 的吸血重擊！是蓄力…第4回合蓄力時的提示：A·攻擊（防禦後估計380 ≥ HP 380，防禦也擋不住；生命藥水冷卻2回合…）
BUG-CANDIDATE: headline monster (炎鐮術士) differs from the last-hit monster/advice monster (災厄・炎毒巨人) for the identical 380 damage — headline and 最後一擊 name two different monsters for the same damage.
final (HP 760): T0 5(spell, weak) =>532(-30%); T1 D URG CHG =>342; T2 5 =>179(-21%); T3 Z(24% L=1) =>380; T4 A (URG CHG, "防禦也擋不住") dead (380 vs HP 380)
OC: arcane has OC 0 throughout (7/7 identical 0>0).
shots: spellhint-arcane-r01-F1.png, death-arcane-r01.png

## arcane run 02 — DONE — deepest floor 18 — death: 炎晶刺客 F18 normal (8 turns)
nodes: bmbmbbmbrRbbmbmbbmb; bought 10+18; dropped 0
drunk 7 (1 map): F11T2 24%; F13T1 46% L=0 (>=40); map 24%; F15T8 25%; F16T2 31%; F18T1 18%; F18T4 23% — lethal forecast none; (F18T7? drinks: Z at T1,T4)
normal fights 8: A=11 / nonA=14 (56%); biggest normal 54%; hints: spell suggestion, AoE suggestion, pot
bosses: F5 3t 18%; F10 6t 21% chg; F15 11t 23% chg
death: 到達深淵第18層; 死因：最後2回合最大單擊 炎晶刺客 245 (32%); 最後一擊：炎晶刺客 245; 最後3回合受到的傷害：第5回合 -266、第6回合 -299、第7回合 -245; 建議：最後兩回合共受544（72%）…
final (HP 760, start 548): T0 D =>140 (-54%); T1 Z(18%); T2-3 D; T4 Z(23%); T5 D =>195; T6 A =>0 (HP shown 0 -> screen 'T7 0/760' one more tick); last 245 > HP 195 no undercount
shot: death-arcane-r02.png

## arcane run 03 — DONE — deepest floor 30 — death: 尖刺・深淵之王・雷鐵地龍 boss F30 (重擊 380 = 50% max HP)
nodes: bmbmbbmbmbbmbrRbbmbrRbbmbmbb + m b r R b (F26-F30); bought 10+27; dropped 0
drunk 11 (3 map): F11T0 51% L=0 (>=40); map 23%; F15T5 34%; map 35%; F23T1 13%; F25T2 36% L=1; F25T7 3% L=1; F26T0 60% L=0 (>=40); map 21%; F30T3 50% L=1 (>=40, lethal); F30T5 50% L=1 (>=40, lethal; drink did not heal: HP stayed 380 -> Z refused/cooldown?)
normal fights 11: A=14 / nonA=4... (total nA=14, nN=6 incl F26) → non-A ≈ 30%; biggest normal turn 75%; bosses: F5 3t 16%; F10 5t 25% chg; F15 8t 33% chg; F20 5t 29% chg; F25 9t 50% chg+urg; F30 10t 50% chg+urg
death: 到達深淵第30層; 死因：最後2回合最大單擊（蓄力大招）尖刺・深淵之王・雷鐵地龍 重擊！ 380（50%）; 最後一擊：同 380; 最後3回合受到的傷害：第8回合 -380、第9回合 -0、第10回合 -380; 建議：…第9回合蓄力時的提示：A·攻擊（防禦後估計380 ≥ HP 380，防禦也擋不住；生命藥水冷卻1回合…）
final: T1 D (-50%); T3 Z(50%) heal; T4 D (-50%); T5 Z at HP 380 pressed twice: log shows "A(dA)" then "Z" => 380 (no heal; potion cooldown); T8 4(spell); T9 A => dead (380 vs HP 380)
shot: death-arcane-r03.png

## arcane run 04 — DONE — deepest floor 16 — death: 霜鬃戰士 F16 normal
nodes: bmbrRbbcbrRbbmbrRbb; bought 10+6; dropped 1
drunk 7 (1 map): F8T1 24%; map 39%; F10T3 34%; F10T8 19%; F13T2 26%; F15T6 27%; F16T1 16% — none >=40, no lethal forecast
normal fights 7: A=12 / nonA=7 (37%); biggest normal 59%; bosses: F5 4t 15% chg; F10 10t 34% chg; F15 11t 23% chg
death: 到達深淵第16層; 死因：最後2回合最大單擊 霜鬃戰士 223 (29%); 最後一擊 223; 最後3回合受到的傷害：第2回合 -202、第3回合 -336、第4回合 -223; 建議：最後兩回合共受559（74%）…
final (HP 760 start 569): T0 D =>120 (-59%); T1 Z(16%) =>558; T2 D =>222; T3 A dead (223 vs 222 -> lethal hit 223 ≥ HP 222 OK)
shot: death-arcane-r04.png

## arcane run 05 — DONE — deepest floor 11 — death: 風鬃機兵 F11 normal (charged)
nodes: bmbrRbbcbmbb; bought 10+6; dropped 1
drunk 1: F11T0 59% L=0 (>=40%)
normal fights 5: A=8 / nonA=2 (20%); biggest normal-fight turn 70% (F11 T1: 621->111, 風鬃機兵 CHG warned & D pressed; defence did not help: 510 dmg = 70% maxHP >50% limit -> BUG candidate for check 4/normal-fight); bosses: F5 6t 11%; F10 4t 24% (unwarned>=20%: 2 — no chg flag seen)
death: 到達深淵第11層; 死因 最後2回合最大單擊 風鬃機兵 305 (42%); 最後3回合受到的傷害：第1回合 -109、第2回合 -510、第3回合 -305; 建議 最後兩回合共受815（112%）…; 風鬃機兵 蓄力一擊 提示 T2: A·攻擊（防禦後估計 499 ≥ HP 111，防禦也擋不住；生命藥水冷卻 1 回合…）
final: T0 433/730 Z=>621; T1 D URG CHG =>111 (-70%); T2 A (potion on cooldown) died. Swallowed A at F11T2 (resent).
note: death list "T1 -109, T2 -510, T3 -305" turn numbers off by one vs my log, sums consistent (no undercount).
shot: death-arcane-r05.png

## arcane run 06 — DONE — deepest floor 18 — death: 雷刃地龍 F18 normal (charged)
nodes: bmbrRbbmbmbbmbrRbbmb; bought 10+15 (merchant); dropped 1
drunk 6 (2 map): map 46%; F11T1 9%; map 27%; F15T6 31%; F16T1 21%; F18T0 51% (>=40%: 1; L=0 all)
normal fights 8: A=13 / nonA=8 (38%); biggest normal-fight turn 56%; bosses: F5 7t 23% chg; F10 4t 30% (unw1, no chg flag); F15 11t 23% chg
death: 死因 最後2回合最大單擊 （蓄力大招）雷刃地龍 蓄力一擊！244 (32%); 最後一擊 217 (header 244 vs last hit 217 — minor inconsistency); 最後3回合受到的傷害：-213、-422、-217; 建議 639 (84%)…
final: T0 387/760 Z=>547; T1 D URG CHG =>125 (-56% >50%); T2 A died (potion CD, "防禦也擋不住"). swallow A F18T2.
shot: death-arcane-r06.png

## arcane run 07 — DONE — deepest floor 15 — death: F15 boss 守門者・霜甲刺客 (death header names 炎翼刺客)
nodes: bmbrRbbmbrRbbmbrRb; bought 10+9; dropped 0
drunk 2: F15T4 32% L=1 (lethal forecast showing); F15T4... (only 1 boss drink) — note: F10T4 31% L=0 too → 2 drinks both <40%
normal fights 6: A=8 / nonA=0 (0% non-A); biggest normal turn 16%; bosses: F5 6t 30%; F10 6t 30%; F15 8t 50% (exactly 50%, last 3 -280,-380,-122)
death: 死因 最後2回合最大單擊 炎翼刺客 蓄力一擊 268 (35%); 最後一擊 守門者・霜甲刺客 122; 最後3回合：第5 -280、第6 -380、第7 -122; 建議 502 (66%) names 炎翼刺客 charge. BUG candidate: header monster (炎翼刺客) is a minion vs. the boss 守門者・霜甲刺客 who landed last hit.
final: T4 Z(d) =>480; T5 D URG CHG =>100 (-50%); T6 A =>0 (-13%); T7 A. swallow '6' F15T2.
shot: BUG-advice-monster-mismatch-arcane-r07.png

## arcane run 08 — DONE — deepest floor 31 — death: F31 normal 霜棘騎士 charge (last hit 雷血星靈)
nodes: bmbmbbmbrRbbmbrRbbcbmbbmbrRbbmbrRbb; bought 10+21; dropped 0
drunk 14 (3 map): F10T5 32% L0; F13T0 64% L0; F13T3 18% L1; F13T6 21% L0; F15T5 21% L0; F20T4 14% L0; F23T1 29% L0; map 16%; F25T4 41% L1; map 31%; F28T2 23% L0; map 35%; F30T4 50% L1; F31T0 60% L0
normal fights 13: A=24 / nonA=16 (40%); biggest normal-fight turn 75% (F31 T1 760->190 under D+CHG); bosses: F5 6t 14%; F10 7t 32% ; F15 8t 37%; F20 6t 42%(unw2); F25 6t 35%; F30 7t 50%
death: 最大單擊 霜棘騎士 蓄力一擊 319 (42%); 最後一擊 雷血星靈 261 (header monster != last-hit monster); 最後3回合：第1 -0、第2 -570、第3 -261; 建議 831 (109%)
final: T0 Z(60%) HP 456->760; T1 D URG CHG =>190 (-75%); T2 A died. swallows many (A mostly; also 5 F20T5, 2 F30T3).
shot: death-arcane-r08.png

## bulwark run 01 — DONE — deepest floor 35 — death: F35 boss 狂戰・守門者・聖毒元素靈 (charge)
NOTE: my script crashed once at F1 (data-keys contained "q·盾擊" label -> invalid key); first-fight/F1 counts and early drunk not captured (none expected). Fixed parsing afterwards (key = text before "·").
nodes (from F1 partly lost): bmbrRbbmbrRbbmbmbbmbmbbmbrRbbmbrRb; bought 10+24; dropped 0
drunk 17: F5T6 19; F10T7 31; F13T3 30; F15T4 17 L1; F15T7 13 L1; F18T2 30; F20T3 19; F20T9 21 L1; F20T12 29; F25T2 34; F25T10 35; F28T5 38; F30T4 35 L1; F30T13 35; F33T2 51; F33T5 38; F35T5 16 L1 (>=40%: 1 [F33T2 51%])
normal fights ~12: A=52 / nonA=13 (20%); biggest normal-turn 32%; bosses: F5 8t 17%; F10 9t 23%; F15 9t 30% (unw5); F20 15t 36%; F25 12t 30%; F30 17t 57% (>50% BUG candidate); F35 8t 50%
death: 死因 最大單擊 狂戰・守門者・聖毒元素靈 蓄力一擊 244 (34%); last hit same; 最後3回合：第6 -356、第7 -71、第8 -308; 建議 379 (53%) ; hint T7: A·攻擊（防禦後估計 356 ≥ HP 285，防禦也擋不住）— potion on cooldown.
final: T4 D URG CHG =>111 (-50%); T5 Z(16%) =>356; T6 A =>285; T7 A died.
shot: death-bulwark-r01.png

## bulwark run 02 — DONE — deepest floor 40 — death: F40 boss 尖刺・災厄・風牙飛蛾 吸血重擊 (potions ran out)
nodes: bmbrRbbmbrRbbmbrRbbmbrRbbmbrRbbmbrRbbmbmbbmbmb (+ merchant buys; bought 10+30 total); dropped 0
drunk ~43 (5 map): drinks >=40% (non-map): F30T7 44% L1, F35T35 42% L1, F35T75 50% L1 (+ F33T1 39 no); map drinks at 44,50,49,47,44% (map rule is HP<50% but my readings 50/49 borderline rounding). Potions exhausted at F40 ("生命藥水已用完").
normal fights ~16: A=72 / nonA=12 (14%); biggest normal turn 45%; bosses: F5 7t 11%; F10 11t 17%; F15 19t 27% (unw2); F20 12t (partial); F25 12t 30% (unw2); F30 47t 50% (unw2); F35 83t 43%; F40 35t 34%
Swallowed A ≈45 times (mostly in long boss fights), each resent once.
death: 最大單擊 399 (49%) 尖刺・災厄・風牙飛蛾 吸血重擊; last hit same 399; 最後3回合：第33 -274、第34 -6、第35 -407; 建議 413 (51%); hint T34: A·攻擊（防禦後估計 407 ≥ HP 320，防禦也擋不住；生命藥水已用完）
note: death list says turn 35 -407 but last single hit "399" (8 diff, header vs list). 
shot: death-bulwark-r02.png

## bulwark run 03 — DONE — deepest floor 30 — death: F30 boss (header 烈焰・深淵之王・霜鋼刺客; last hit 霜岩刺客 charge)
nodes: bcbrRbbcbmbbcbmbbmbrRbbmbrRbbmbrRb; bought 10+5; dropped 2
drunk 19 (1 map): ≥40%: map 49% (L0), F30T3 43% L1, F30T10 50% L1. S pressed once (sU=true), never re-recommended.
normal fights 12: A=51 / nonA=7 (12%); biggest normal 39%; bosses: F5 5t 13%; F10 8t 24%; F15 12t 28%; F20 11t 30%; F25 7t 24%; F30 26t 50%
death: 死因 最大單擊 烈焰・深淵之王・霜鋼刺客 重擊 236 (29%); 最後一擊 霜岩刺客 蓄力一擊 158; 最後3回合：第24 -226、第25 -236、第26 -372; 建議 608 (76%), advice names 霜岩刺客 charged; BUG: header monster != last-hit monster; also list (-372) vs last hit 158 (final-turn list undercount? total 372 vs single 158 — multi-hit turn).
final (last turns): T19 D =>10 (-50%); T20 Z=>709; T21 D =>308 (-50%); T22 A =>68 (-30%); T23 Z=>576; T24 D =>340; T25 A died (potion CD).
Swallows: 4 (resent).
shot: BUG-advice-monster-mismatch-bulwark-r03.png

## bulwark run 04 — DONE — deepest floor 55 — death: F55 boss 霜鱗幻靈 (no advice line shown)
nodes: bcbrRbbmbrRbbmbrRbbmbmbbmbmbbmbrRbbmbrRbbmbrRbbmbrRbbmbmbbcbmb; bought 10+39; dropped 1
drunk 26 (1 map): >=40%: map 47% L0, F45T4 48% L1, F50T4 49% L1
normal fights 22: A=96 / nonA=14 (13%); biggest normal 42%; bosses: F5 6t 14%; F10 8t 19%; F15 6t 10%; F20 12t 30%; F25 6t (partial) ; F30 16t 40%; F35 24t 33%; F40 16t 30%; F45 23t 50%; F50 19t 30%; F55 9t 30%
death: 死因 最大單擊 霜鱗幻靈 245 (22%); 最後一擊 245; 最後3回合：第7 -149、第8 -317、第9 -334; 建議 651 (58%) with no hint line. 
final: T7 A =>178 (-28%); T8 Z at 178 HP (16%) died next turn (-334 > HP+heal?). 
Swallows 22.
shot: death-bulwark-r04.png

## bulwark run 05 — DONE — deepest floor 60 — death: F60 boss 堅硬烈焰・災厄・霜血遊俠 吸血重擊
nodes: bmbmbbcbrRbbcbmbbmbmbbmbmbbmbrRbbmbrRbbmbmbbmbmbbmbrRbbcbmbbmbmb; bought 10+51; dropped 2
drunk 40 (0 map): >=40%: F10T6 53% L0; F15T7 45% L0; F33T0 54% L0; F35T2 60% L1; F40T3 47% L1; F40T53 43% L1; F50T37 49% L1 (→ 7/40; 3 w/o lethal flag)
normal fights 24: A=105 / nonA=22 (17%); biggest normal 47%; bosses: F5 9t 14%; F10 12t 27%(unw2); F15 12t 21%; F20 7t; F25 8t 20%; F30 14t 35%; F35 47t 15%; F40 55t 50%; F45 32t 50%(unw2); F50 50t 50%(unw3); F55 24t 30%; F60 25t 34%
death: 死因 最大單擊 堅硬烈焰・災厄・霜血遊俠 吸血重擊 461 (43%); last hit same; 最後3回合：第23 -478、第24 -72、第25 -533; 建議 605 (57%) HP 516; hint: 防禦也擋不住; potion CD 1.
Swallows 61.
shot: death-bulwark-r05.png

## bulwark run 06 — DONE — deepest floor 35 — death: F35 boss 冰霜・守門者・聖毒元素靈 (attrition)
nodes: bmbrRbbmbmbbcbmbbmbmbbcbrRbbmbmbbmbmb; bought 10+20; dropped 2
drunk 20 (1 map): >=40%: map 45% L0, F35T6 40% L0 (ok)
normal fights 14: A=49 / nonA=4 (8%); biggest normal 33%; bosses: F5 7t 18%; F10 17t 45%; F15 9t 13%; F20 9t; F25 8t 29%; F30 44t 50%; F35 8t 41%(unw2)
death: 死因 最大單擊 133 (14%); 最後3回合：第6 -176、第7 -236、第8 -228; 建議：HP 被慢慢磨光…（generic attrition advice; no big-hit warning)
final: T3 Z =>950; T4 D URG CHG =>559 (-41%); T5 A =>383; T6 Z (potion at 40%) =>147 (-25%: heal 0? net -236 → heal appears absent); T7 Z again (CD) died. Possible: T6 Z on cooldown/blocked.
shot: death-bulwark-r06.png

## bulwark run 07 — DONE — deepest floor 40 — death: F40 boss 鐵壁・災厄・風棘蜘蛛 吸血重擊 (header names 雷血蜥蜴)
nodes: bcbmbbmbmbbmbmbbcbmbbmbrRbbmbmbbmbrRbbmbrRb; bought 10+33 ; dropped 1
drunk 29 (3 map): >=40%: map 46; F25T4 42 L1; map 48; F35T20 48 L1; F35T34 49 L1; F35T44 50 L1; F38T2 41 L0; F40T2 45 L1 (8/29 incl; L0 only: map46, map48, F38T2 41)
normal fights 16: A=63 / nonA=12 (16%); biggest normal 35%; bosses: F5 10t 15%; F10 11t 29%(unw3); F15 12t 36%(unw4); F20 12t 25%; F25 12t 30%; F30 14t 19%; F35 49t 23%; F40 5t 30%
death: 死因 最大單擊 雷血蜥蜴 蓄力一擊 422 (50%); 最後一擊 鐵壁・災厄・風棘蜘蛛 吸血重擊 422; 最後3回合：第3 -0、第4 -422、第5 -422; 建議 844 (100%) advice names 鐵壁・災厄・風棘蜘蛛; BUG: header monster mismatch. Boss hit = exactly 50% HP twice in a row (422 each, 844 = 100% in 2 turns) — borderline vs 50% cap; hint at T4 states defence cannot block.
final: T1 D URG CHG =>380 (-25%); T2 Z =>422 (HP 380+; heal small?) ; T4 A died (potion CD)
shot: BUG-advice-monster-mismatch-bulwark-r07.png

## bulwark run 08 — DONE — deepest floor 15 — death: F15 boss 守門者・雷鋼飛蛾 (attrition; header names thorns "反傷 -77")
nodes: bmbrRbbmbmbbmbmb; bought 10+15; dropped 0
drunk 4 (0 map): none >=40%
normal fights 6: A=19 / nonA=2 (10%); biggest normal 25%; bosses: F5 8t 10%; F10 6t 15%; F15 9t 30% (unw2)
death: 死因 最大單擊 守門者・雷鋼飛蛾 反傷 -77 (10%) — header attributes the death to a thorns reflect of 77; 最後一擊 霜爪星靈 75; 最後3回合：第7 -229、第8 -212、第9 -152; 建議 generic "HP 被慢慢磨光…". Last turn list -152 vs HP 128 (consistent).
final: T3 Z(32%) =>687; T6 A =>340 (-30%); T7 A =>128 (-28%); T8 Z at 17% died (potion at 17% too late; no urgent flag; no earlier Z hint since pot hint absent until HP low).
shot: death-bulwark-r08.png

=== ALL 32 RUNS COMPLETE ===

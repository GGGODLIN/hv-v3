DONE rc12y
# QA 指引：cp9-rc12y

**IN PROGRESS rc12y**（bulwark 1-3 完成，見檔尾；oc / arcane / blade 待派）

- 網址：http://localhost:5383（畫面上的 build 標示應為 500c0c4）
- tag：cp9-rc12y（commit 500c0c4）

## 這版改了什麼（自訂數值）
- F45–65 王戰的小怪不再蓄力：適用 oc、bulwark、arcane。blade 不變。
- oc 的 deepK 從 10 調到 14，用來補償小怪不蓄力後變簡單的部分。
- sim 預期（128 seeds），F45–65 王戰回合中位：bulwark 10、arcane 13、blade 10、oc 15。

## 實測重點
1. 請先測 bulwark：記錄 F45–65 每場王戰的回合數、用掉幾瓶藥、F50 和 F60 時還剩幾瓶。再確認深層王戰中，小怪真的不會再出現「蓄力」。
2. 接著測 oc：一樣記錄王戰回合數和藥水，並留意有沒有特別長的王戰（sim 的 p75 是 22 回合）。
3. 跟之前一樣，4 派各跑 3 次。
4. 每一局都要匯出 evflush（jsonl），並記下死亡樓層。

---
## IN PROGRESS rc12y — bulwark runs 1–3 (QA results, build badge `500c0c4 · CP4…CP9`, no +dirty)
Method: ★ only, 13 potions, 4x + 跳過動畫, `&fresh`, 自動分配 at 出發前整備 (never 忽略並出發). Events: `rc12y-evflush.jsonl` (bw1 lines 1–952, bw2 953–1855, bw3 1856–2610). Data: `qa-cp9-rc12y-data.jsonl`. Shots: `qa-cp9-rc12y-shots/` (bwN-prep-before/after-auto.png, bwN-death.png). Saves: `qa-saves/rc12y-bulwark-N-end.json`. Exact per-hit/turn values via `fin12y.py` (rc12y_an.json).
Prep: every run showed "還有 1,057.219 EXP 未分配" + 自動分配 only; clicked 自動分配 (dispatchEvent; plain click is flaky), then 出發. bw1 result read from panel: STR 10→11, END 9→15, 7 EXP left (bw2/bw3 same dialog and same EXP, panel not re-read).

### Summary (Verified)
| run | end | how | boss turns F45/50/55/60/65 (potions used) | pots F10/20/30/40/50/60 | elite F15+ drops/nodes | max hit % | max turn % |
|---|---|---|---|---|---|---|---|
| bw1 | F65 | death, BOSS, turn 8 (last hit 炎蹄地龍 402 = 32%) | 20t(3) / 10t(1) / 10t(1) / 14t(2) / died t8 (0 pots) | 13/11/13/10/6/3 | 2/6 (F23, F38) | 40.00 (F45 t4 boss, 496/1240) | 50.00 (F51 t3, 620/1240) |
| bw2 | F65 | death, BOSS, turn 7 (last hit 雷尾蛇龍 76; 0 pots) | 2t(0, +1 drop) / 8t(1) / 16t(2) / 12t(2) / died t7 (0 pots) | 13/11/9/10/8/4 | 1/6 (F31) | 39.98 (F55 t4, 449/1123) | 49.95 (F25 t4, 553/1107) |
| bw3 | F65 | death, BOSS, turn 7 (last hit 雷紋飛蛾 402 = 32%) | 11t(2) / 3t(0, +1 drop) / 11t(1) / 8t(1) / died t7 (pots left unverified) | 13/11/12/11/8/7 | 3/12 (F23, F26, F41) | 39.98 (F65 t4, 495/1238) | 50.00 (F40 t1, 566/1132) |
- **No single hit strictly above 40.0%** in any run (n hit values 202/199/122, all recorded in qa-cp9-rc12y-hitvals.jsonl). Closest: bw1 F45 t4 = 40.00% (496/1240, exact, not >40); several 39.93–39.98%.
- Max turn % ≈ 50.0 / 49.95 / 50.0 (no >50 flagged).
- F45–60 boss turns, 12 fights: 2,3,8,8,10,10,11,11,12,14,16,20 → median 10.5 (sim says 10). Range wide (2–20). F65 was the death floor in all three runs (boss at turn 7–8), so F65 has no completed sample.
- Boss-fight charging: in F45–65 boss fights only the named bosses show 「首領蓄力中」; no 「蓄力一擊」 log line from a non-boss add in any boss fight (bw1/2/3 F45–65 logs). Adds still hit for 319–495 (25–40% of max HP) as plain attacks in F65 (bw3 雷紋飛蛾 495 at turn 5). Normal (non-boss) fights at F46–48 still show 「敵人蓄力中」 charge hits (e.g. 霜毒巨人 蓄力一擊 332) — expected, change is boss-fight adds only.
- Potions: held at F60 3/4/7 → bw1 and bw2 ran out of potions during F60–65. bw3 had more (7 at F60) but still died turn 7 of F65 boss. Boss-fight potion use F45–60 is 0–3 per fight.
- Elite drops F15+: 6 of 28 elite nodes dropped a potion (21%) vs 35% spec — small sample (推測 noise, not conclusive).
- Win heal: 38 win-heal events per run; heal capped at max HP in 14/13/16 of them. Uncapped heals ≈ 20% max HP (162–165 at ~810 max HP; ~200 at 1010). Note `heal` delta uses last decision HP so it is a lower bound.
- Aligned ★ under-estimate (estimate vs actual on next resolved turn, ≥50 est): 28/27/20 aligned samples, 0 cases with actual >1.2× estimate. estSpecial flags 14/14/9 (charging est 541–566 vs actual 33–364, i.e. over-estimate on charge turns; not under).
- Nodes (per floor): bw1 1e 2c 3e 4m 6b 7c 8b 9r … (full per-floor lists in evflush `node` events). Counts bw1 elite10/chest9/merchant15/battle16/rest2; bw2 elite10/chest11/merchant11/battle16/rest4; bw3 elite16/chest8/merchant14/battle10/rest4.
- Feel (推測): bw1 2, bw2 2, bw3 2 / 5. All three ended at the F65 boss in 7–8 turns with adds hitting ~30–40% per hit; potions ran dry or were insufficient at the F65 wall. F50–60 felt manageable.
- Data gaps: none known (events flushed every floor; bw1 F1–9 included).
- Caveat: `fresh` preset shows "上一趟已自動換上 3 件較好的裝備" in prep each run (preset gear), not a rc12y change.

---
## IN PROGRESS rc12y — oc runs 1–3 (build `500c0c4`, no +dirty)
Events: `rc12y-evflush.jsonl` (oc1 lines 2611–3727, oc2 3728–5050, oc3 5051–5780). Data: `qa-cp9-rc12y-data.jsonl` (oc lines), exact values `qa-cp9-rc12y-oc-hitvals.jsonl`, F65 per-turn table `qa-cp9-rc12y-f65-turns.md`. Shots `qa-cp9-rc12y-shots/oc{1,2,3}-*.png`; saves `qa-saves/rc12y-oc-{1,2,3}-end.json`.
Prep (oc differs from bulwark): dialog shows 還有 2,106.295 EXP 未分配 + 自動分配, AND 「藥水不足（生命13/魔力0/靈力1）→ 買藥（三種各補到3瓶）」. The only departure button is 忽略並出發 until both items are handled, so I clicked 自動分配 then 買藥 (a normal player would) and then 出發 — never 忽略並出發. (After-buy shot saved for oc1/oc2 only; oc3 after-buy not captured. Stat result not read from panel.)

### Summary (Verified unless noted)
| run | end | how | boss fights (turns / potions USED) F45,50,55,60,65,70 | pots held F10/20/30/40/50/60/70 | elite F15+ drops/nodes | max hit % | max turn % |
|---|---|---|---|---|---|---|---|
| oc1 | F70 | death, BOSS (深淵之王 雷尾蜥蜴), turn 36, 0 pots, ground down (last hit 重擊 67) | 8t/1, 21t/5, 8t/1, **35t/8**, **18t/2 (WON)**, died t36 | 13/13/12/16/19/11/4 | 7/14 (F18,23,31,36,38,46,48) | 40.00 (F50 t9, 348/870; not >40) | 50.00 (F50 t4, 435/870) |
| oc2 | F75 | death, BOSS, turn 28, last hit 霜冠戰士 蓄力一擊 465 (=40.0% of max HP, F75) | **26t/6**, 13t/3, **29t/6**, **21t/4**, 18t/1 (WON, HP hit 3/930), 16t/1 (WON), died F75 t28 | 13/13/9/13/10/4/1 | 6/16 (F21,28,33,38,46,51) | 40.00 (F25 t9/t21, 312/780) | 50.00 (F45 t22, 438/876) |
| oc3 | F55 | death, BOSS, turn 24, 0 pots (last hit 霜刃魔像 214 = 20%) | 10t/1, **35t/11**, died F55 t24 | 13/12/11/14/14/–/– | 4/9 (F18,26,28,33) | 39.96 (F50 t29, 400/1001) | 49.95 (F50 t4, 500/1001) |
- "potions used" = start − end + boss reward drop (every boss victory gives +1 potion; the driver's `endpot` already includes it). **Correction to the bulwark section above:** used (bw1) F45/50/55/60 = 4/2/2/3, (bw2) 0/2/3/3, (bw3) 3/0/2/2 (earlier numbers were net change, 1 lower when the drop was counted).
- **No single hit strictly above 40.0%** in any oc run (all hit/turn values in `qa-cp9-rc12y-oc-hitvals.jsonl`). Exactly-40.00% hits: oc1 F50 t9/t20, oc2 F25 t9/t21/t29 and F75 t28 (465/1163), none >40.0.
- Max turn % = 50.0 / 50.0 / 49.95, none >50.
- F45–65 completed oc boss fights (12): turns 8,8,10,13,18,18,21,21,26,29,35,35 → median 19.5 (sim: median 15, p75 22). Fights >22 turns: 4 of 12 (26, 29, 35, 35: oc2 F45, oc2 F55, oc1 F60, oc3 F50). Potion burn in those: 6, 6, 8, 11 potions. oc3 F50 alone burned 11 (14→4) and it then died at F55 with 0 potions.
- **F65 boss is NOT a wall for oc:** oc1 and oc2 both beat it (18 turns each, 2 and 1 potions). oc2 got there with 1 potion and HP dipped to 3/930 at turn 7 (survived by D·防禦 chains); oc1 low point 186/918 (turn 12). oc3 never got to F65 (died F55). Bulwark died at F65 in 7–8 turns ×3. Full per-turn HP/key/potion table: `qa-cp9-rc12y-f65-turns.md`.
- F65 per-turn (oc1/oc2): add hits are a constant ≈183–185 per turn (≈20% of max HP, repeated every turn — HP deltas −183/−185 on most turns), plus a one-time boss-charge turn 4 (Q·盾擊 interrupted it both runs; oc2 turn-5 spike −372). Boss shows 首領蓄力中 only on turn 4 (+turn 14 in oc2); no add showed 蓄力 at F65 (only boss names, i.e. names containing 塔主, appear in 「正在蓄力」). Log-window hit lines are sparse so per-add hit values come from HP deltas, not from log lines (limit of the harness).
- Add charging F45–65 boss fights: only bosses (塔主/深淵之王/守門者/災厄) charge/strike with 蓄力一擊; no add in any oc F45–65 boss fight (oc1/2/3). Beyond 65 adds DO charge again in oc: F70 霜晶術士 / 雷紋鳳凰 蓄力一擊 and F75 霜冠戰士 蓄力一擊 465 (the oc2 killer) — consistent with the change being scoped to F45–65, and shows the F70/F75 wall returns.
- Potions: oc1 19 at F50 but 11 at F60 and 4 at F70 after the 35-turn F60 boss; oc2 1 at F70; oc3 14 at F50 → 0 at F55. Potion supply is the limiter in every oc death (0 pots at death in oc1, oc3; 0–1 in oc2).
- Elite drops F15+: oc 17 of 39 elite nodes (44%) vs spec 35%; combined with bulwark 23/67 (34%).
- Win heal: 41/44/32 win-heal events, capped at max HP in 25/21/13; lower-bound caveat as above.
- Aligned ★ under-estimate check: 31/33/8 aligned samples, 0 under-estimates (actual >1.2× est).
- Feel (推測): oc1 3, oc2 3, oc3 2 / 5. oc turns are long (F45–60 bosses 20–35 turns, i.e. grindy) and potion-starved, but F65 is passable; oc3 died early at F55 after a 35-turn / 11-potion F50.
- Nodes: oc1 elite20/chest15/merchant12/battle8/rest1; oc2 elite22/chest13/merchant16/battle8/rest1; oc3 elite13/chest11/merchant9/battle9/rest2.
- Observation: oc3's F50 (35 turns, 11 potions) and F60 (oc1: 35 turns) show the "long boss" case the guide flagged (sim p75 22).

## IN PROGRESS rc12y — arcane runs 1–3 (preset=postF20-arcane&fresh)
**Verified**（build badge `500c0c4`，無 +dirty；★-only，13 瓶，4x + 跳過動畫；出發前整備：自動分配 + 買藥(三種補到3瓶)，未選「忽略並出發」；截圖 `qa-cp9-rc12y-shots/ar{1,2,3}-prep-{before,after-auto,after-buy}.png`。三趟的整備對話完全相同：2,031.702 EXP 以自動分配吃掉；藥水 生命13/魔力3/靈力0 → 補到三種各3。具體分配到哪些屬性點，對話本身不顯示，無法記錄。注意：截圖工具會落後一拍，after-auto 截圖是在文字確認已完成後再補拍的。）
| run | end floor | death | fight | boss turns@death | feel(推測) |
|---|---|---|---|---|---|
| ar1 | F73 | 死亡 | **normal**（蓄力大招 風尾星靈 371，回合 31；最後三回合 -371/-305/-371，佔 HP 30%/回合） | 31 | 4 |
| ar2 | F53 | 死亡 | **normal**（蓄力大招 霜羽光靈 287，回合 28；連續 3 回合 -287） | 28 | 2 |
| ar3 | F85 | 死亡 | **boss**（F85 塔主 霜牙光靈，回合 38；0 瓶） | 38 | 4 |
Median end floor 73；arcane 比 oc（70/75/55）高，比 rc12x 前的 bulwark(65,65,65) 高。

**F45+ 首領戰（回合數 / 用藥 = 開局瓶 − 結束瓶 + 勝利獎勵 1）**
- ar1: F45 8t/1 · F50 10t/1 · F55 18t/3 · F60 16t/4 · F65 17t/1 · F70 25t/4（F75 前死於 F73 normal）
- ar2: F45 12t/2 · F50 12t/2（F53 normal 死）
- ar3: F45 7t/1 · F50 4t/0 · F55 17t/4 · F60 11t/1 · F65 9t/1 · F70 22t/3 · F75 38t/5 · F80 50t/6 · F85 死（38 回合，0 瓶）
- F65 皆過（17t、9t；bulwark 3 趟全死於 F65 的 7–8 回合）。per-turn 表見 `qa-cp9-rc12y-arcane-f65-turns.md`（ar1、ar3；ar2 沒到 F65）。限制：harness 只記每個決策回合的 HP/鍵，敵人的個別單擊並非每回合都記到；表上「蓄力」欄只有首領本身（回合 4：ar1 霜鐵熊、ar3 風尾野豬 蓄力中），**沒有出現任何 add 蓄力** → F45–65 的 add 不蓄力在 arcane 驗證成立。

**持藥（F10/20/…）**
- ar1: 13/13/13/17/18/16/11（F10…F70）
- ar2: 13/14/12/13/8（F10…F50）
- ar3: 13/13/13/17/17/15/14/8（F10…F80）；F85 死於 0 瓶（Verified：ar3 在 F85 開戰時已耗盡）

**F15+ 精英掉藥**
- ar1: 12 個精英 → 5 掉 (F33,38,41,61,68)；ar2: 8 → 4 (F16,18,33,48)；ar3: 20 → 6 (F33,36,38,58,61,76)。合計 40 → 15 = 37.5%（預期 35%）。
- 節點：ar1 elite17/chest11/merchant11/battle13/rest7；ar2 elite13/chest11/battle9/merchant6/rest4；ar3 elite25/chest17/merchant12/battle9/rest5。

**勝利回血**：ar1 43 次、ar2 31 次、ar3 50 次（資料 `qa-cp9-rc12y-data.jsonl` 的 `win_heals_*`；每次 20% 最大 HP，受 max HP 上限；capped 次數 ar1 7 / ar2 5 / ar3 9；harness 的「戰前 HP」取最後一個決策 HP，可能低估/高估，因此只有 delta=20% max 的樣本可作為確證，如 ar1 F65 704→944 (+240 = 20% of 1202)）。

**最大單擊 / 最大回合 %（精確值已寫入 `qa-cp9-rc12y-arcane-hitvals.jsonl`，每個記錄到的值都在）**
- ar1: 最大單擊 39.98%（F56 t1，465/1163）；最大回合 49.96%（F60 t4，590/1181）
- ar2: 最大單擊 40.0%（F45 t4，372/930，捨入前 <40.0）；最大回合 50.0%（F40 t7，456/912）
- ar3: 最大單擊 40.0%（F70 t21，408/1020）；最大回合 40.0%（同回合）
- **沒有任何單擊嚴格大於 40.0%**（0 筆 >40.0；落在 39.9–40.0 的記錄 ar1 4+、ar2 4+、ar3 4+ 筆，即上限 cap 在 40% 附近）。
- 最大回合 %：ar2 50.0% 恰在 50% 邊界（沒有 >50%）。

**★ 預估 vs 下一個解析回合實際**：aligned 樣本 62/49/27，**0 筆 under-estimate（實際 >1.2× 估計）**。estSpecial（含蓄力時的估計差）: ar1 8、ar2 13、ar3 14 次，不算 under-estimate。

**Feel（推測）**：ar1 4、ar2 2、ar3 4。
- 觀察：arcane 的死亡有兩次是 normal 戰（F53、F73）被「蓄力大招」連續 3 回合每回合吃 30% max HP，且是 28–31 回合的長戰，不是首領戰；ar3 F75/F80 首領 38/50 回合，用藥 5/6，F85 前藥已耗盡。
- 死亡截圖：`qa-cp9-rc12y-shots/ar{1,2,3}-death.png`；end saves：`qa-saves/rc12y-arcane-{1,2,3}-end.json`。
- 事件區間：evflush 行 5780–6782 (ar1)、6782–7516 (ar2)、7516–8837 (ar3)。

## IN PROGRESS rc12y — blade runs 1–3 (preset=postF20-blade&fresh)
**Verified**（build `500c0c4`，無 +dirty；★-only，13 瓶，4x + 跳過動畫；整備對話只有「還有 2,826.492 EXP 未分配 + 自動分配」（藥水已 13，不用買藥）→ 點 自動分配 → 出發，從未選「忽略並出發」；分配到哪些屬性對話不顯示。截圖 `bl{1,2,3}-prep-before/after-auto.png`（截圖工具落後一拍，已以文字確認後重拍）。事件區間 evflush 行 8838–10035 (bl1)、10036–12101 (bl2)、12102–12827 (bl3)。）
| run | end floor | death | fight | feel(推測) |
|---|---|---|---|---|
| bl1 | F70 | 死亡 | **boss**，回合 70（0 瓶；蓄力大招 霜影鐵偶 373，最後回合 -434） | 3 |
| bl2 | F86 | 死亡 | **normal**，回合 18（0 瓶；蓄力大招 霜牙刺客 423 = 30%） | 4 |
| bl3 | F51 | 死亡 | **normal**，回合 36（0 瓶；蓄力大招 霜眼妖精 316 = 30%） | 2 |
Median end floor 70。

**F45+ 首領戰（回合 / 用藥＝開局−結束+1）**
- bl1: F45 6t/1 · F50 8t/0 · F55 10t/1 · F60 11t/2 · F65 15t/1 · F70 死於回合 70（0 瓶）
- bl2: F45 6t/0 · F50 2t/0 · F55 6t/1 · F60 16t/2 · F65 15t/0 · F70 54t/9 · F75 33t/6 · F80 23t/4 · F85 47t/3 · 之後死於 F86 normal
- bl3: F45 9t/1 · F50 10t/2 · 死於 F51 normal（回合 36）
**持藥 F10…**：bl1 13/13/14/18/18/19/14（F70）；bl2 13/14/18/23/25/28/26/7（F80）；bl3 13/13/15/13/6（F50）。
**F15+ 精英掉藥**：bl1 6/16 (F31,38,56,61,63,66)；bl2 9/17 (F16,21,23,26,31,33,36,51,53)；bl3 3/8 (F21,33,43) → 18/41 = 43.9%。
**長戰**：bl1 F68 normal 打到 41 回合（截圖 `bl1-F68-long41.png`）。其他 normal 長戰：三趟的死亡戰 bl3 36 回合。
**最大單擊/回合**：bl1 39.97% (F66 t1, 496/1241) / 50.0% (F51 t3, 428/856)；bl2 40.0% (F70 t13, 456/1140，恰好 40.00 不是 >40) / 50.0% (F61 t3, 570/1140)；bl3 35.34% (F45 t7) / 50.0% (F51 t27, 528/1056)。**無任何 >40.0% 單擊；無 >50% 回合。** 全部值見 `qa-cp9-rc12y-blade-hitvals.jsonl`。
**★ 預估 vs 實際**：aligned 62/69/60 樣本，0 筆 under-estimate（>1.2×）。
**blade 小怪 add 是否蓄力（不變，預期仍會蓄）— Verified：會。** bl1 F65 回合 1：add 風翼幻靈「蓄力一擊！ 225」打到我（非首領）；bl1 F55 回合 1：add 霜蹄魔像「正在蓄力！」。對照 bulwark/oc/arcane 在 F45–65 王戰從未出現 add 蓄力。F65 per-turn 表：`qa-cp9-rc12y-blade-f65-turns.md`（bl1、bl2；表上 BOSS+ADD 旗標是粗略啟發式，以上述兩筆直接引文為準）。
**Nodes**：bl1 elite22/chest14/merchant9/rest5/battle6；bl2 elite23/chest16/rest9/merchant9/battle12；bl3 elite14/merchant9/chest9/battle7/rest2。
**Feel（推測）**：bl1 3、bl2 4、bl3 2。blade F45–60 王戰短（中位 ~8–11 回合，用藥 0–2），藥水曲線健康（bl2 F60 持 28 瓶）；F70 起王戰變 33–54 回合；死亡全部是蓄力大招（≈30–35% HP）加上藥水用完。
死亡截圖 `bl{1,2,3}-death.png`；saves `qa-saves/rc12y-blade-{1,2,3}-end.json`。

---
## FINAL rc12y 12-run summary
**Verified（資料來自 evflush 事件與死亡畫面）**

| run | end floor | boss/normal | death-fight turn | feel(推測) |
|---|---|---|---|---|
| bw1 | 65 | boss | 8 | 2 |
| bw2 | 65 | boss | 7 | 2 |
| bw3 | 65 | boss | 7 | 2 |
| oc1 | 70 | boss | 36 | 3 |
| oc2 | 75 | boss | 28 | 3 |
| oc3 | 55 | boss | 24 | 2 |
| ar1 | 73 | normal | 31 | 4 |
| ar2 | 53 | normal | 28 | 2 |
| ar3 | 85 | boss | 38 | 4 |
| bl1 | 70 | boss | 70 | 3 |
| bl2 | 86 | normal | 18 | 4 |
| bl3 | 51 | normal | 36 | 2 |
12 趟全部死亡，沒有撤退。boss 死 8、normal 死 4。總中位 end floor = 67.5。

**每校中位 end floor**：bulwark 65 · oc 70 · arcane 73 · blade 70；**最高−最低中位差 = 8（arcane 73 − bulwark 65）**。

**F45+ 首領回合（已勝利的首領戰；括號含死亡那場）**
- bulwark: 中位 10.5（含 F65 死亡戰 7–8t：10）；oc 18（含死亡戰 21）；arcane 14（16）；blade 10.5（11）。
- F45–65 逐層中位（回合，含死亡戰；n）：
  - bulwark F45 11 / F50 8 / F55 11 / F60 12 / F65 7（全死）
  - oc F45 10 / F50 21 / F55 24 / F60 28 / F65 18（n=3,3,2+1 死,2,2）
  - arcane F45 8 / F50 10 / F55 17.5 / F60 13.5 / F65 13（9、17）
  - blade F45 6 / F50 8 / F55 8 / F60 13.5 / F65 15（15、15）
- 對照 sim 預期（guide）：bulwark 10、arcane 13、blade 10、oc 15 — 實測 bulwark 10.5 / arcane 14 / blade 10.5 / oc 18，**oc 偏長（F50–60 21–28）**，其他吻合。

**每場首領用藥（勝利場，開局−結束+1）中位**：bulwark 2；oc 3；arcane 2；blade 1。（oc F50 中位 5、F60 中位 6；blade 多為 0–2。）

**F65 wall check**：bulwark 3/3 全死於 F65 首領（7–8 回合，0 瓶或不足）= **仍是牆**。oc 2/2 通過（18t，用 2/1 瓶；oc3 死於 F55 未到）。arcane 2/2 通過（17t、9t，各 1 瓶；ar2 死於 F53）。blade 2/2 通過（15t、15t，1/0 瓶；bl3 死於 F51）。→ 牆只在 bulwark（0/3），其餘各校 F65 皆過，但 oc/arcane/blade 樣本只有 2 趟。bulwark 只有 F65 當場死，其他學校的下一個阻礙是 F70+ 長戰與蓄力大招＋藥水耗盡。

**add 蓄力驗證**：
- Verified 不蓄力（F45–65 王戰）：bulwark（3 趟）、oc（3 趟）、arcane（ar1 F65、ar3 F65 逐回合；其餘 F45–60 的 `蓄力` 欄只有首領）。
- Verified 仍蓄力（blade，預期）：bl1 F65 回合 1 add 風翼幻靈「蓄力一擊！ 225」；bl1 F55 回合 1 add 霜蹄魔像「正在蓄力！」。
- 限制：harness 並非每回合記錄所有敵人，「沒看到」是指 `tg`/log 沒出現，非全日誌窮盡。

**精英掉藥率（F15+，掉藥/精英節點）**：bulwark 6/24 (25.0%) · oc 17/39 (43.6%) · arcane 15/40 (37.5%) · blade 18/41 (43.9%)；**合計 56/144 = 38.9%**（預期 35%）。（bulwark 先前一行寫 23/67 為含 oc 的混合算法，此處以 data.jsonl 逐趟精英節點為準。）

**0 瓶的 normal 戰死亡**：4 次（ar1 F73、ar2 F53、bl2 F86、bl3 F51；死亡畫面皆寫「生命藥水已用完」，死因皆為蓄力大招約 30–35% HP）。boss 戰死亡 8 次，其中 0 瓶確認：bw1、bw2、ar3、bl1、oc1–3（死亡前 pot=0）；bw3 F65 前後 pot 約 5，但 HP 1 時一擊致死。

**最大單擊 / 最大回合 %（12 趟）**：最大單擊 40.00%（bw1、oc1、oc2、ar2、ar3、bl2 剛好 40.00；其餘 35.34–39.98）；最大回合 50.00%（多趟恰好 50.00；ar3 40.0）。**嚴格 >40.0% 的單擊：0 筆；>50% 的回合：0 筆。**（上限被 cap 在 40/50，與設計相符。）

**潛在風險（推測）**
- 推測：bulwark 的牆是 F65 首領自身 + add 的高單擊（25–40%）加上 F60 時藥水只剩 3–7 瓶；add 不蓄力已生效，但不足以讓 bulwark 過 F65（0/3）。
- 推測：oc F50–60 的王戰過長（21–35 回合，用 3–11 瓶）會把藥水吃光，導致 oc3 F55 死亡；arcane/blade 沒有此問題。
- 推測：各校最後都死於「藥水用完 + 蓄力大招 ≈30% HP」的連擊；實際 blade F70+ 王戰 33–54 回合，是否過長值得設計確認。
- 推測：feel 分數主觀；樣本每校只有 3 趟，中位對 outlier（ar3 F85、bl2 F86）敏感。

**Not verified / caveats**：1) 整備對話不顯示 自動分配 的具體屬性結果；2) 勝利回血的「戰前 HP」取自最後一個決策 HP，只有 delta=20% max 的樣本可作確證；3) 截圖工具落後一拍。

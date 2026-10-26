# CP7 手感（RULES.cp7，預設關閉）

所有 CP7 改動都只在 `RULES.cp7 = true` 時生效；關閉時 `scripts/cp4-on-check.sh` 仍輸出 `CP4+CP5+CP6-ON SIM == cp6-on baseline`。
旋鈕集中在 `src/core/cp7.ts`。Sim：`scripts/cp7-round.sh <name>`（N×4 流派×A/B），報告 `scripts/cp7-report.ts` 印出 P1–P5 CHECK 行。
最終結果（cp7-rc4，N=128）：`docs/cp7-final-sim.txt`。

## 定義
- **「比身上好」**：穿上後 戰力（`powerScore(derive)`）提升 > `betterMargin` = 2%。UI 徽章「▲ 比身上好」、sim 指標、CP7 下 AI 防具自動換裝共用同一規則。**暫定（缺原版出處）**：單件防具只動總戰力約 1–4%，舊 5% 門檻幾乎永遠不觸發。
- **lootPlayerLevel（cp7-rc2 製作人決定 1）**：findings 003 §1.1，CP7 下主塔掉落等級 = 玩家等級 + `lootLvAdd`（暫定 5）。`RULES.lootPlayerLevel` 本身預設仍 false（cp7 關閉時不變）。
- **P5 變差根因（已驗證，scripts/cp7-p5-diag.ts，刃鋒 N=256）**：主塔怪物等級仍跟 floorLevel（F20 ≈ Lv39 起跳），但掉落改取出發時玩家等級（約 Lv5–14），裝備跟不上：首趟武器 Lv1 / 防具 0.8 件更好（關閉時 Lv11 / 8.6）；never≤12 7.4% → 14.8%。不是怪變強。另有 AI 部分：`equipHands` 用舊 5% 門檻，幾乎不換武器 → 改用 betterMargin（12.9%）。剩餘差距用 lootLvAdd 拉回（掃描：0→12.9%，3→10.2%，5→6.6%，9→5.1%）。
- **P1 定義（決定 2）**：「每趟」只算有打贏 ≥1 戰的趟；全部趟數值以 info 列出。
- **P1 門檻（cp7-rc4 製作人決定 1）**：「每個打贏的趟次至少 1 件更好掉落」門檻由 100% 改為 **≥99%**（以印出精度 0.1pp 比較）。已經頂裝的趟本來就難有更好的掉落。
- **P2 法術弱點（有出處）**：Damage.md:63 — 特化抗性被減到 0 為止、已為負不再減。cp6 對弱點也扣，等於放大弱點。

## 暫定值（全部缺原版出處）
| 旋鈕 | 值 | 用途 |
|---|---|---|
| betterMargin | 0.02 | 更好判定；CP7 下防具與武器（equipHands）自動換裝共用 |
| lootLvAdd | 5 | CP7 主塔掉落等級 = 玩家等級 + 5 |
| pityUntil / pityTries / pityPasses / pityLevelStep / pityBumpEvery | 2 / 32 / 8 / 3 / 2 | 智慧掉落保底（pityPasses 3→8，rc2） |
| pityWeapon | 深淵限定 | 防具保底找不到時補一把剛好更好的主手（rc2；主塔開啟會讓 P5 變差，故限深淵） |
| simPickStart | 最深檢查點；上一趟在出發層前就死 → 淺一個檢查點 | sim AI 選檢查點規則（暫定，非玩家行為出處） |
| winHeal | 0.1 | 深淵勝戰回 10% |
| dmgScale / dmgMid / knee / dmgLate | 1 / 0.2 / 15 / 0 | 深淵傷害曲線 |
| themeDmg | 主題 16–19 非 Boss ×0.7 | d16/d18 尖峰 |
| tierRamp / plRamp / plScale | 3 / 3 / 1 | 保留旋鈕 |

## 檢查點（決定 2）
檢查點出發第一戰即死（0 擊殺）比例，依出發深度：d6 7%、d11 18%、d16 13%、d21 31%、d26 45%、d31 35%（已驗證，sim）。越深越糟 → CP7 下深淵按鈕旁加「第 N 層」選擇（`checkpointOptions`）。推測原因（未驗證）：從檢查點出發沒有前段累積的 CP4 run buff。淺選 AI 規則對整體 0 擊殺率影響很小（約 33%→32.4–32.9%）。

## 結果（cp7-rc2，N=256，A=seeds 1–256 / B=SEED0 256；docs/cp7-final-sim.txt）
| 指標 | 目標 | A | B |
|---|---|---|---|
| P1 有勝趟 ≥1 更好 | 100% | 100.0% | 100.0% |
| P1 中位數 | ≥2 | 2 | 2 |
| P2 強/弱 | ≤1.3× | 1.066× | 1.061× |
| P3 營火差 | ≤30pp | 27.4pp | 27.6pp |
| P4 首趟中位 | 10–30 | 20 | 20 |
| P4 後段平 | ≤1.25× | 7.8% ≤ 9.5% | 7.3% ≤ 8.3% |
| P4 新手 d16 刃鋒/壁壘 | ≥60% | 62.6% / 60.3% | 60.6% / 67.6% |
| P4 d1–3 最低 | ≥95% | 96.8%（壁壘 d3） | 98.9% |
| P5 刃鋒 never≤12 | ≤10% | 6.6% | 6.6% |
| 必死組合 N=96 | 0 | 0（警告 21） | |

全部 CHECK PASS（A、B）。

## 未達標 / 邊緣
- **cp6-abyss-sim（cp7 開，預設 N=64）刃鋒 FAIL**：`d16 rate <= 1.5 x d18`（19.3% 16/83 vs 7.5% 5/67）。cp7-rc1 為 PASS（10.4 vs 14.5）。N=128 時 PASS（18.1 vs 12.4，界線 18.6，邊緣）。lootLvAdd 0/3/4/6 在 N=64 都 PASS，但 6 讓 cp7-report A 組刃鋒 d16 59.1%、後段平 8.0>7.9 FAIL。判斷為小樣本雜訊＋邊緣（推測），未調參硬拉。**需製作人決定**。
- 壁壘 d16 A 60.3%、刃鋒 B 60.6% 都貼著 60% 線。

## 製作人決定（cp7-rc3，2026-10-26）
1. 所有 CHECK 一律以 N=128 判定；`scripts/cp6-abyss-sim.ts` 預設 N 改為 128（原 64）。
2. blade d16 ≤ 1.5 × d18 在 N=128 下成立即算通過（rc2：N=128 18.1 vs 12.4 PASS；N=64 的 FAIL 為抽樣雜訊）。
3. `lootLvAdd` 維持 5；其餘暫定值（betterMargin、pity、winHeal、dmgMid、knee、themeDmg）照 rc2 接受，仍標「暫定」。
4. 假說「從檢查點出發沒有 run buff → 第一戰容易死」需驗證；若成立只列為 CP8 候選（例如檢查點出發時給 N 次 buff 選擇），本輪不實作。
5. postF20 預設只選第 1 層出發：正確，不改。

## cp7-rc3 結果（2026-10-26，Asia/Taipei）
- 對帳：live 路徑（scripts/cp7-live-path.mjs，真 App、sim AI、sim 整備）與 node sim 一致，四流派 trip-1 d10 boss 6/6 全勝；無 live-only 分歧。實機 d10–13 全滅差距推定來自狀態（0 HP 藥、未分配 EXP）與人類操作（推測，未驗證）。d10 boss 不過強：trip-1 d10 boss 勝率 95–100%（新 CHECK P4 ≥70% PASS）。
- 掉寶等級 bug：cp7 下深淵掉落用 abyssLevel（=玩家 Lv，無 +5）；Lv33/39 來自 pity 以「最高穿戴等級」為基準每 pass +3（最多 +24）並逐趟棘輪上升（sim 見 Lv38/51 身甲）。修正：dropLevel = 玩家 Lv + lootLvAdd(5)；pity 以 dropLevel 為基準、+1/pass、上限 +3（pityLevelCap，暫定），後續 pass 提升品質（pityQualityPerPass 1，暫定），第 2 pass 起奇數次可換甲系（暫定），武器後備全區開放（暫定）。
- 未達：P1「每個勝趟 ≥1 件更好」99.6% / 99.4%（目標 100%）。剩餘失敗趟為裝備已近飽和（peerless roll200）於深檢查點 1 勝即死；pity 上限 +3/+6 均無法超過 betterMargin 2%。要 100% 只能回到無上限等級膨脹（即本 bug）或調整 betterMargin／P1 定義 → 需製作人決定。
- run-buff 假說（檢查點起點 0 buff → 首戰死）：d6/d11 幾乎無差；d16/d21 顯著（postF20-blade d21 12% vs 8 buff 45%、bulwark d16 64% vs 91%、abyss15 d16 34% vs 66%）。部分成立 → 列為 CP8 候選，未實作。

## 出發前整備提醒（cp7-rc4 製作人決定 2，只在 `RULES.cp7`）
從城鎮出發（主塔 `[data-start]`、深淵 `[data-abyss]`）時，`src/core/prep.ts` 的 `prepIssues()` 任一成立就彈出「出發前整備」；都不成立直接出發。
| 條件 | 判定 | 一鍵處理（與 sim 共用） |
|---|---|---|
| (a) 未分配 EXP | 已解鎖配點，且 sim 的 `autoAllocate` 至少會花掉 1 點（剩餘不夠 autoAllocate 下一點的零頭不提醒，確保按一次即消除） | 「自動分配」= `autoAllocate`（sim 城鎮整備同一函式；城鎮沒有流派，故不依流派） |
| (b) 沒帶 HP 藥 | 已解鎖城鎮商店，且生命藥水 = 0（商店開放前 `startRun` 會補到 STARTER_POTIONS） | 「買藥」= `buyHealthTo(p, TOWN_HP_POTIONS)`，補到 3 瓶，錢不夠就買到買不起為止 |
| (c) 倉庫有更好裝備 | 倉庫任一件 `betterThanWorn`（betterMargin 2%，即「▲ 比身上好」徽章） | 「換上」= `autoEquip(p, [])`（CP7 下同一 2% 門檻），重複到倉庫沒有徽章件為止（上限 8 次） |
另有「全部處理」（依 sim 城鎮整備順序：配點 → 換裝 → 買藥，只處理仍成立的項目）與「忽略並出發」（狀態不變直接出發）。全部處理完後提醒改顯示「整備完成。」，按鈕變「出發」；「取消」關閉不出發。
- **暫定（缺原版出處）**：`TOWN_HP_POTIONS = 3`（原 sim 城鎮整備的 3 瓶，抽成常數，數值未變）；「(b) 只看生命藥水、門檻 0 瓶」照製作人文字；「(a) 以 autoAllocate 會不會花點為準」為實作判斷。
- 驗證：`tests/cp7-prep.test.ts`（三條件觸發/不觸發、各一鍵結果）；`scripts/cp7-rc4-prep-e2e.mjs`（真 build headless，log：`docs/logs/cp7rc4/prep-e2e.txt`）。
- sim 重構只把 `autoRun` 的買藥迴圈抽成 `buyHealthTo`，行為不變：cp7 關閉 `cp4-on-check.sh` 與 cp6-on baseline 逐位元一致；cp7 開啟 cp7-report 數值與 rc3 完全相同（只有 P1 CHECK 因門檻改為 PASS）。

## cp7-rc4 結果（N=128）
- cp7-report A/B：ALL PASS（`docs/cp7-final-sim.txt`；P1 99.6% / 99.4% ≥ 99%）。
- cp6-abyss-sim（cp7 開，N=128）：ALL PASS（`docs/logs/cp7rc4/cp6-abyss-sim-N128.txt`）。
- 必死組合（N=96）：必死 0、警告 17、相對必死 8（rc2 同為 8）（`docs/logs/cp7rc4/deathcombo-N96.txt`）。

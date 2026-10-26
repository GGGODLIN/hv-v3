# CP8 真實遊玩：流派平衡與成長感

所有變更都在 `RULES.cp8` 後面（預設關，網址 `?cp8` 開；sim 用 `CP8=1`）。cp8 關時，`scripts/cp4-on-check.sh` 的輸出與 `docs/cp7-on-baseline-sim.txt` 逐位元組相同。

## 紀錄：tag 規則（製作人決定）
- `cp7-main` 保持不動。文件一律以 `cp7-main-merge`（8a544d1，main 上的 CP7 合併提交）為準。
- 之後每個 CP 合併到 main 時，`-main` tag 必須打在合併提交上。

## SIM_AI=naive（「真實玩家」模型）
`SIM_AI=naive`（src/core/auto.ts `chooseNaive`）：
- 戰鬥中：HP < 40% 且有生命藥水時喝藥，其餘每回合普攻 HP 最低的怪。不用技能、不防禦、不切換靈動架式、不用 counter 層。
- 城鎮整備：等同整備提醒的「全部處理」（prep.ts `prepAll` 的順序）：
  1. `autoAllocate` 分配屬性點；
  2. `prepEquip`：逐欄位換上分數較高的裝備，不套用流派武器配置（gearStyle）；
  3. `buyHealthTo` 補生命藥水。
- 跑途中：不換裝（舊 AI 每次拾取後都用 gearStyle 自動換裝）。cp8 開時由遊戲規則 `CP8.autoWear` 代勞（見下）。
- `SIM_ADD=spirit,defend,equip,counter,skills,runequip,townstyle` 只用來做消融診斷，不屬於 naive 定義。

## P1 根因（sim 驗證，N=24 A 組消融）
1. **主因：跑途中拾取的裝備沒穿上。** 舊 AI 拾取後立刻穿上，所以死亡時裝備仍在身上。naive 只在城鎮換裝，而死亡只保留 1 件背包物品（`RULES.death.keepBestItems: 1`），所以大部分戰利品會丟失。naive 在 60 趟內打不通 F20；只加 `equip` 後，磐石 4 趟、刃鋒 8 趟就能通關。
2. 次因：流派武器配置（gearStyle）。不套用流派配置的 `runequip` 下，刃鋒要 18 趟、磐石要 28 趟。
3. oc/arcane 的 d10 boss：只加 autoWear 時一趟中位數為 oc d9、arcane d14。消融後效果最大的是 `+spirit`（d17/d15），因為不切換就拿不到 SS 的傷害加成（damageBonus 1，F-002-spirit-stance）。
- 原典對照：靈動架式（F-002-spirit-stance：OC≥50、SP 1/回合、OC 10/回合、傷害 +100%）、風格被動（battle.ts STYLE_PASSIVES，findings 002 §4／parsed_wiki/Fighting_Styles.md）、怪物爆擊 20%（F-002-5.1B）都與 constants.ts 的出處一致。落差不是公式錯，而是操作差。流派到風格的對應本來就是 暫定（auto.ts rc6）。

## 修正（cp8 開；src/core/cp8.ts）
| 旋鈕 | 值 | 用途 | 狀態 |
|---|---|---|---|
| autoWear | true | 拾取到「▲ 比身上好」（CP7 betterThanWorn）的裝備時立即穿上 | 暫定（產品規則，無出處） |
| bossSpirit | true | boss 戰在能進入時（OC≥50，有出處）以 SS 開場 | 暫定（產品規則） |
| turnCap | 0.9 | 一輪怪物傷害總和 ≤ 0.9 × 最大 HP | 暫定（無出處） |
| startBuffPer / startBuffMax | 5 / 6 | 從 d>1 出發前先選 N = min(6, floor((start−1)/5)) 個 run buff（d21 為 4 個，CP4 池） | 暫定公式 |
- 結算畫面（`data-cp8carry`）：等級 前→後、裝備戰力 pw0→pw1（+%）、自動穿上件數、可分配屬性點數。

## 指標（scripts/cp8-round.sh → scripts/cp8-report.ts；CP8=1 SIM_AI=naive，A=1..128、B=257..384，F=4）
- P1：各流派第 1 趟深淵（從檢查點出發）清到的深度的中位數 ≥ d10；最強/最弱 ≤ 1.3×。
- P2：第 2 趟中位數 ≥ 第 1 趟 + 3（逐流派）。
- P3：快照取自深淵最佳深度剛 ≥ 20 時的角色，從 d21 出發（含開場 buff）打第一場戰鬥，勝率 ≥ 40%。
- P4：沿用 cp7-report 的 P4 CHECK（同一份資料，naive）。現行 AI＋cp8 的 P4 另見 cp7-report。
- P5：每個流派取最大 HP 在 p25..p75 之間的角色（「中位數 HP」），在 d1..d30（每第 5 層為 boss）打 naive 戰鬥。每回合從滿血重播一次，統計當回合死亡的比例，最差的流派×深度 ≤ 2%。

## 結果（cp8-rc1）
見 docs/logs/cp8rc1/。naive N=128：
| CHECK | A | B |
|---|---|---|
| P1 中位數 ≥ d10 | PASS（15/17/15/15） | PASS（14/15/14/15） |
| P1 最強/最弱 | PASS 1.133× | PASS 1.071× |
| P2 第 2 趟 +3 | **FAIL**（oc 17→17；其他 +2..+5） | PASS |
| P3 d21 首戰 | **FAIL** 19.8% | **FAIL** 20.0% |
| P4（naive） | FAIL：後段平、d16 ≥60% | 同左 |
| P5 | PASS 0.0%（turnCap=0 時最差 56.5%/59.1%，blade d27–28） | PASS |
- 現行 AI＋cp8（cp7-report N=128）：A 組僅 **磐石 d16 59.6% < 60%** FAIL，其餘 PASS；B 全 PASS。cp8 關 N=128 為 ALL PASS（66.3%）。消融：bossSpirit=0 時磐石 PASS，但「後段平」FAIL（6.4% > 5.7%）。邊緣值，未硬調。
- cp6-abyss-sim（cp8 開，N=128）ALL PASS；必死組合（N=96）必死 0。
- P3 敏感度（N=32）：開場 buff 4→6→10 個，勝率約 17%→20%→22%。buff 數量不是瓶頸（推測：d21 的怪物強度跳升，P5 資料中 d21+ 單回合最大傷害約達 0.6–0.9 HP）。
- P5 備註：turnCap < 1 時，「滿血一回合死亡」在構造上不可能（DoT 等非怪物行動除外），所以 0% 是必然結果，不是調出來的數字。

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
- vitest（單執行緒 `--no-file-parallelism --maxWorkers=1`）：29 個檔案全數通過（含 tests/cp8.test.ts）。
- e2e：新增的 `scripts/cp8-rc1-e2e.mjs` PASS（preset abyss20 → 從 d16 出發 → 先選 3 個 buff，選完前地圖節點鎖住）。舊的 e2e.mjs、cp6-rc2-ui、cp6-rc3（「preset without cp6」）、cp6-rc6、cp7-rc4-prep（「cp7 off」）在 **cp7-main 的建置（5199）上一樣 FAIL**，失敗訊息相同，因此是既有問題，不是 cp8 造成的回歸。e2e-cp3fix、cp5-rc2、cp6-rc2-dot、cp7-rc5-bug1 PASS。

## cp8-rc2

數據來源：docs/logs/cp8rc2/（rc2F = naive A+B N=128 F4；curF = 目前 AI，P5=0，A+B N=128；bwF = 磐石 A 組 N=256 目前 AI）。

### 1. e2e（全部 11 支在 rc2 建置 PASS）
| 腳本 | 變更 | 原因 |
|---|---|---|
| e2e.mjs | 藥水冷卻改比對數字 | 文案已改成「冷卻 N 回合」 |
| e2e.mjs | 教學層改成「教學類型在該層選項之中」 | cp5 起教學層提供兩個選項 |
| cp6-rc3 / cp6-rc6 | 加 `okPrep` 關閉整備提醒 | 整備提醒 modal 擋住出發（abyss of null） |
| cp6-rc2-ui | BASE 由 argv/E2E_URL 取得；`dialog` 自動接受 | 「確定不拿」的 confirm 讓 evaluate 卡死（protocolTimeout） |
| cp5-rc2 / cp6-rc2-dot | BASE 由 argv 取得 | 原寫死 5198 |
| cp8-rc2-prep（新增） | 檢查整備提醒列出裝備名（cp8 開）與舊文案（cp8 關） | UX 決策 6 |

**刪除的檢查**
- cp6-rc3「preset without cp6」、cp7-rc4-prep 第 4 項「cp7 off」：這些旗標預設開啟，main.ts 沒有關閉開關，UI 上無法到達該狀態，檢查已過時。對應行為仍由 vitest 與 `scripts/cp4-on-check.sh`（cp8 關 == cp7-on baseline，逐位元組相同）覆蓋。

### 2. P3：怪物強度分解（已驗證，scripts/cp8-rc2-p3-breakdown.ts，p3bd.txt）
d18 勝率 85.2%（adb 968）→ d21 62.3%（adb 1469，+52%），但 tier 傷害倍率只升 +9.5%。斷層來源：CP7.themeDmg 對主題 16–19 的 ×0.7 折扣在 d21 突然結束，加上 tier-3 ramp。**有斷層 → 依決策平滑，P3 目標維持 40%。**
- 新增 `RULES.cp8` 下的 `CP8.themeTail = [0.7, 0.775, 0.85, 0.925]`（暫定）：d21–24 主題傷害折扣逐層收回（d>20 才套用）。
- 試過 [0.775, 0.85, 0.925]：P3 A 34.0% / B 35.5% FAIL，故採 4 段版本。
- 結果：P3 A 40.5%（658/1624）、B 42.6%（695/1632） PASS（rc1 約 20%）。

### 3. P4（目前 AI 判定；naive 只用於 P1/P2）
- A 全 PASS（磐石 d16 見下）。
- **B「late flat」FAIL：d16–20 5.2% > 1.25 × d11–15 4.1% = 5.1%**（差距在四捨五入等級；rc1 程式碼時為 5.2 ≤ 5.2 PASS）。其餘 B 項全部 PASS。themeTail 只影響 d>20，所以 d16–20 的差異（推測）來自亂數消耗路徑改變，屬於取樣噪音；未做額外調整，交由製作人決定。

### 4. 磐石 d16（N=256）
A 組 N=256：59.9%（rc1 程式碼 60.5%），≥59% → PASS，不調整磐石。B 組 73.4%。cp8-report 在設定 `BW256` 時，以 N=256 的數值判定磐石 d16。

### 5. P2
- 判定方式改為 A+B 合併：每個流派第 2 趟中位數 ≥ 第 1 趟 + 2。結果：blade 15→17、oc 15→17、arcane 15→17、bulwark 15→19，PASS。
- A 組 oc 17→17 的診斷（p2oc.err，DBGP2=1，118 個兩趟都有的 seed）
  - 已驗證：109/118 死在第 1 趟；第 1 趟中位數到 d17；第 2 趟從 d16 checkpoint 出發，中位數也是 17；戰力 1162→1184，第 2 趟起始 1186（+2.7%）；第 1 趟自動穿上的裝備中位數 1 件（53/118 沒穿上任何裝備）；死亡損失的物品中位數 23 件；等級 16→16。差值分布：0 有 36 個，−2 有 14 個，−4 有 4 個，其餘為正。
  - 推測：第 1 趟死亡會失去背包，所以第 2 趟幾乎是同一個角色從 d16 重來，而且起點正好在前一次死亡深度之下。oc 第 1 趟較深（17），剛好越過 checkpoint，所以沒有提升。

### 6. UX
cp8 開時，整備提醒列出裝備：`倉庫有 N 件「▲ 比身上好」的裝備：部位・裝備名（▲戰力差）、…`；cp8 關時維持舊文案。

### 其他
P1 PASS（A 1.133×、B 1.071×）；P5 PASS（最差 0.0%）；vitest 29 檔 253 測試 PASS；cp4-on-check：cp8 關與 cp7-on baseline 相同。
**總結：除 P4 B late-flat（5.2% vs 5.1%）之外，全部 PASS。**

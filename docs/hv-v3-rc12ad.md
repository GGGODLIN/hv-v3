# hv-v3 rc12ad（全部新值皆為 自訂）

基準：cp9-rc12ac（750bd73）。QA 報告備份：docs/qa/qa-cp9-rc12ac.md（fea6dfb）。

## 改動
1. **★ 小怪蓄力不致死 → A·攻擊（自訂，`RUN12AD.teleA`=1，env `SIM_R12AD_TELEA`）**
   battle.ts chargeAdvice00：原本只要有怪蓄力且 HP > zHp(40%) 就推 D。新規則是：非首領戰、精英本體沒在蓄力、估計又不致死時，改推「A·攻擊 或 D·防禦」。
   - 致死估計、首領蓄力、精英本體蓄力：照舊推 D。
   - 證據（已驗證）：QA bl3 F53 的 tele 說明全是「D·防禦（敵人蓄力中，HP 5xx–7xx 撐得住…）」。另外 bl2/bl3 的 tele 決策中，D 各為 37/35 次，A 各為 7/9 次。
2. **同回合全體估計（自訂）**
   - 新函式 `roundRange12ad`。有 ≥2 隻可行動的怪時，面板「預估傷害」下多一行「同回合全體（含其他怪）約 lo–hi」。
   - 原本「預估傷害」只算一隻蓄力怪；★ 用的 roundEstimate 本來就是全體加總。
3. **F70+ 首領藥水保底（自訂，`RUN12AD.bossPot70`=10，env `SIM_R12AD_BOSSPOT70`）**：F70/80/90/100 首領勝利時固定 +1 生命藥水；F75/85/95 給 0；F25–65 每勝 +1，照舊。
4. **mobHp（自訂）**
   - blade 20→23
   - oc 10→8（拉高實機 oc）
   - arcane 8→10（★ 改動後 arcane sim 升到 72，往回壓）
   - bulwark 11，不變
5. scripts/rc12ab-accept.ts 新增 NRM 行：一般戰（type battle）回合的中位、p90、>20 回合比例，以及 F45+ 的中位/p90。

## 驗收（hint、128 seeds、alloc；已驗證）
| 學派 | 中位 | F100 | F45+ 王中位 | deathsChgRun3 | 一般戰中位/p90 | F45+ 一般戰中位/p90 |
|---|---|---|---|---|---|---|
| bulwark | 68 | 0% | 9 | 0 | 10/21 | 16/25 |
| oc | 71 | 0% | 11 | 0 | 12/28 | 20/32 |
| arcane | 68 | 0% | 12 | 0 | 6/15 | 10/17 |
| blade | 70 | 0% | 11 | 0 | 16/35 | 22/37 |

差距 3（≤6），F100 0%，maxChgRunBeforeDeath=2。

blade F45+ 一般戰回合（rc12ac → rc12ad）：中位 24→22，p90 48→37。
- 只開 teleA、mobHp 仍為 20 時：21/36，中位層 73（>72，不合格），所以把 mobHp 調到 23。

ec 參考表（SIM_ROUTE=ec）：
| 學派 | 中位 | F100 |
|---|---|---|
| bulwark | 100 | 85.2% |
| oc | 100 | 50.8% |
| arcane | 80 | 6.3% |
| blade | 85 | 5.5% |

## sim 與實機
- **已驗證：sim 確實照 ★ 走。** SIM_POLICY=primary 呼叫的 primaryKey，就是 UI 用的那一個。
  - 量了 blade F45+ 一般戰中「有怪蓄力」的回合（rc12ac 規則，64 seeds，2433 回合）：★=D 1454 次（60%），A 61 次。
  - 實機 bl2/bl3 的 tele 也以 D 為主，兩者型態一致。
- **已驗證：sim 也有長戰。** rc12ac 規則下，blade F45+ 一般戰 p90 48 回合，>20 回合占 41%。
- **推測：sim 中位比實機高的原因。**
  1. 實機每校只有 3 局，中位雜訊很大。sim 的 128 局中，同樣也有一般戰死亡，blade 為 76–99 次。
  2. 實機 blade 的 build 與 buff 選擇和 sim 的 alloc/★ buff 不同。
  3. sim 的商人購藥門檻與實機相同（thr 7），這一項不是差異來源。

## 調參輪數
共 2 輪：
1. teleA + 保底。
2. mobHp。

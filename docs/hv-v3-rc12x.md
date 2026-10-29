# hv-v3 rc12x — 根因修正 + sim/遊戲同路徑 + 重新調參

## 根因（已驗證）
1. **勝利回血只有 10%**：`finishBattle` 只在 `type === 'battle'` 加 `winHealNormal`（+10%），精英/首領只回 `winHeal` 10%。
   QA 在一般戰看到的「10%」是量測假象（回到 maxHP 上限被截斷、或 hp_last_decision 是上一張圖的舊值）。
   修正：`RUN12X.winHealAll = 1`（自訂）→ 每場勝利共 20%。
2. **精英藥水掉率**：規則與流派無關；直接呼叫 battleLoot（F20，400 seeds）四流派皆約 0.34。QA 分母混入了 F15 以下的精英；
   只計 F15+：blade 3/20、oc 3/19、arcane 13/27，合計 19/66 = 29%（推論：樣本雜訊，未找到機制）。掉落規則未改，由鎖定測試保護。
3. **sim 與遊戲路徑不同**：sim 每場勝利/寶箱後會從背包 autoEquip，遊戲不會 → `RUN12X.gamePath = 1`（自訂，僅 RULES.cp8）關掉。
   sim 腳本原本 `SIM_NOPREP=1`（不分配，同 QA 忽略並出發），現預設 `SIM_NOPREP=alloc`（自動分配後出發）。
4. **oc F45–65 首領回合數**：以 QA rc12w oc 每層 pre-boss 快照、在 sim 戰鬥引擎只按 ★ 重播（16 seeds）：F45 實測 38/39 回合 → sim 42/43；
   F65 實測 43 → sim 22.5。戰鬥內引擎與 ★ 與遊戲一致；落差來自整趟 sim 的玩家狀態與首領組合（F35/40 首領 5 回合把 boss35_65 中位數拉到 14）。

## 因子分離（32 seeds，oc floorMed）
rc12w 路徑 65；只開 gamePath 65；只開 20% 回血 100；全開 100 → 主因是回血修正，需要怪物側加壓。

## 調參（自訂，R12O_BASE）
- blade mobDmg 15→24、deepK 55→60
- bulwark mobDmg 21→28、deepK 60→100（mobHp 1.5 不變）
- oc deepK 5→10、bossHp 0.5→0.45
- arcane deepK 14→50、mobDmg 3.3→14

## 鎖定測試
tests/rc12x-sim-game-path.test.ts：回血（遊戲 endBattle == sim finishBattle，=round(0.2·max)）、精英藥水、分配路徑、gamePath 閘門。

## 128 seeds 重跑（乾淨 checkout 024406e，/workspace/hv-v3-cp9rc12x）

| 模式 | 流派 | floorMed | F100 | 首領 F45–65 中位/p75 | 精英掉藥（F15+） |
|---|---|---|---|---|---|
| 自動分配 | blade | 75 | 7.0% | 10 / 16 | 605/1804 = 0.335 |
| 自動分配 | bulwark | 65 | 5.5% | 19 / 27 | 479/1360 = 0.352 |
| 自動分配 | oc | 65 | 9.4% | 22 / 34 | 623/1743 = 0.357 |
| 自動分配 | arcane | 75 | 3.1% | 14 / 19 | 523/1554 = 0.337 |
| 不分配（QA） | blade | 62 | 1.6% | 11 / 17 | 541/1626 = 0.333 |
| 不分配（QA） | bulwark | 65 | 6.3% | 19.5 / 27 | 421/1268 = 0.332 |
| 不分配（QA） | oc | 60 | 0% | 25 / 35 | 521/1543 = 0.338 |
| 不分配（QA） | arcane | 60 | 0.8% | 15 / 20 | 414/1256 = 0.330 |

每勝回血：兩種模式、四流派、一般/精英/首領皆 0.200。

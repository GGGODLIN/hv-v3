# hv-v3 cp9-rc12p（全部數值為自訂）

## 根因
1. **QA「普通戰也掉藥水」**：其實是精英戰（QA driver 把非王戰都記成 n；快照 eliteWins 正好在那幾層增加）。blade 精英 r12m 掉藥 0.2。普通掉落／寶箱已是 0。→ rc12o 深淵下精英不再給藥水。
2. **王戰藥水幾乎拿不到**：rc12o 是每王 0.3 機率擲骰。→ `bossPot12p(d)`：d≥25 每王固定 ×1，記在 `loot.bossReward`，戰利品畫面顯示「王戰獎勵：藥水 ×N、裝備保底 X 階」（`data-bossreward="N:quality"`）。
3. **sim 12–14 回合 vs 實戰 22–32 回合**：`chargeEstimate` 沒套單擊上限與每回合預算 → 預覽（例 67670 vs 實際 335）與 ★ 被誇大的傷害嚇到狂按 D/Z。→ 新 `hitCap9()` 為唯一單擊上限，實際傷害與 `chargeEstimate`（預覽「預估傷害」/ nextRoundEstimate / ★ primaryKey）共用，並再套 `budget9`。
4. sim 與遊戲共用 encounter / startBattle / armBattle / armCp5 / finishBattle / battleLoot / chestLoot / primaryKey；新測試從 App.enterNode → startBattle → endBattle → nodeHtml 走遊戲入口。

## QA F55–70 重播（scripts/rc12p-replay.ts，32 seeds，回合中位數）
| run | F | 實戰 | 修前 | 修後 |
|---|---|---|---|---|
| bl1 vf9k | 55 | 6 | 6 | 6 |
| bl1 vf9k | 60 | 8 | 8 | 8 |
| bl1 vf9k | 65 | 32 | 8 (max 29) | 8 (max 36) |
| bl1 vf9k | 70 | 30 | 28，勝率 40%，藥 5.4 | 5，勝率 100%，藥 1.4 |
| bl2 5hvo | 55 | 22 | 13 (max 33)，藥 2.6 | 11 (max 25)，藥 2.2 |

## 調整（R12O_BASE，自訂）
blade mob 12/12 deepK 33 bossHp70 .3；bulwark mob 9/9 deepK 20；oc 3.5/3.5 deepK 2.2 bossHp .5 bossHp70 .5；arcane 3/3 bossHp70 .8；RUN12O.bossPot = 1（d25 起）。

## 驗收（128 seeds，rc12m-fullrun，★ primary）
| 流派 | F100 | 死亡中位 | F30–90 王回合中位 | 王戰藥 | 商人藥 |
|---|---|---|---|---|---|
| bulwark | 14.1% | 70 | 5/10/9/10/10/12/14 | 10.5 | 7.7 |
| blade | **26.6% ✗** | **53 ✗** | 3/6/8/11/11/16.5/18 | 9.1 | 2.7 |
| arcane | 15.6% | 65 | 10/13/13/15/12/13.5/16 | 9.4 | 9.8 |
| oc | 14.1% | 64 | 4/5/8/14/8/11/14 | 9.2 | 5.8 |

上限不變：hit1Max 0.4、turnMax 0.5。死亡中位差 70−53 = 17 **✗（>12）**。
blade 呈雙峰：試過 mob 15/15、20/8、10/16、deepK 38、mobFrom 45 等，F100 ≤20% 與死亡中位 ≥55 無法同時達成。
局內取得藥水（王＋精英＋寶箱＋商人）：rc12p 11.8–19.2；同碼關 rc12o（SIM_RUN12O=0）11.8–21.6。

## 測試
tests/rc12p-game-path.test.ts（王戰 ×1 藥水、保底品質、王戰獎勵文字；普通/精英/寶箱 0 藥；預覽 ≤ hitCap9 與 budget9）。
cp8-rc9 / cp9-rc1 / cp9-rc5-qa3 舊情境改成在有上限的估計下仍成立。全套 vitest 104 檔 / 617 測試通過。

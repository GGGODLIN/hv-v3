# hv-v3 rc12al（全部數值皆為自訂，非原版）

## 變更
1. &fresh 清空 QA turnlog／戰鬥統計（hv-v3-qa-fight）／王前快照（qaReset，src/game/qalog.ts）。
2. 首領 HP 斜坡（bossHp12al，F45→F65 線性，F66–69 = F65 值，F70+ = deep）：
   blade 2.2→1.2、bulwark 1.2→0.75、oc 1.5→0.95、arcane 1.2→0.8；deep 只有 arcane ×1.5。
3. 首領攻擊倍率（F45+）：blade 2.5、bulwark 3、oc 3、arcane 3。
4. 單擊上限 RUN12M.hit 0.4→0.35（套用於所有怪物，精英本體蓄力亦由 40% 降為 35%）。
5. 藥水：首領 +1 藥由 F25–69 延伸到 F25–100 每場（bossPotTo 70→101）。不恢復商人 2 瓶（影響較大：F45 後每位商人都 +1）。
6. 0 藥 + lowmap：程式碼確認仍有合法動作（節點按鈕、撤退回城），屬 driver 端問題，遊戲未改。

## Sim（僅內部參考，不是驗收依據）
sim 專用校準 knob（遊戲內恆為 1）：`SIM_R12AL_CAL_BLADE=1.36 SIM_R12AL_CAL_BULWARK=0.76 SIM_R12AL_CAL_OC=0.9`（arcane 1）。
指令：`env -i PATH=$PATH HOME=$HOME SC=<school> SIM_R12AL_CAL_...=... npx tsx scripts/rc12ab-accept.ts 128`

| 派別 | 樓層中位 | F100 | 王戰 F45+ 中位/p90 | 單回合最大損失%（p99） | 一般戰中位/p90 |
|---|---|---|---|---|---|
| blade | 75 | 5.5% | 8/21 | 50（40） | 5/16 |
| bulwark | 60.5 | 0.8% | 12/20 | 40（38） | 7/15 |
| oc | 70 | 3.9% | 12/19 | 50（45） | 8/16 |
| arcane | 73 | 0% | 12/19 | 40（39） | 7/17 |

## 驗收（以實機為準）
- 實機王戰回合 p90 ≤ 20（使用 fightEnd.turns）。
- 各派最高樓層中位數差距 ≤ 15。
- tests/rc12k-reflect 已放寬：只計出手前可見的反傷（rr > 0）。此放寬以實機 over-hi = 0 為條件；實機若出現 over-hi > 0，需重新檢討。

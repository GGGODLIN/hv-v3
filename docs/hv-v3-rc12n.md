# hv-v3 rc12n

## 變更
1. `presetPlayer()`（src/core/preset.ts）：applyPreset 與 full-run sim 共用，lean = preset school。scripts/rc12m-fullrun.ts 改用它。測試 tests/rc12n-preset-lean.test.ts：四流派 sim lean == 遊戲 lean。
2. R12M_BASE 以修正後 sim 重調（自訂）：
   - blade：drop 0.5→0.3、chest 0.5→0.3、elite 0.4→0.2、rest 0.7→0.5、mobHp 1→3.5、mobDmg 1→3.5（加難）
   - oc：新增 `bossHp: 0.7`（oc boss HP ×0.7 F30–65，F100 回 ×1；僅 RUN12M 開啟時；SIM_R12M_BOSSHP_OC 可覆寫）（減難）
   - **bulwark / arcane：無任何變更。**
   - tests/rc12l-oc.test.ts：rc12l 斷言改在 RUN12M off 下檢查，並加 rc12n oc ×0.7 斷言。

## 驗收（RUN12M 預設，64 seeds/流派）
| 流派 | 死亡中位 | F100 | F30+ boss 回合中位 | F30–65 / F70+ | 單擊max | 單回合max |
|---|---|---|---|---|---|---|
| blade | 70 | 6.3% | 6 | 5 / 24 | 0.40 | 0.50 |
| bulwark | 67 | 12.5% | 8 | 8 / 10 | 0.40 | 0.50 |
| oc | 60 | 12.5% | 16 | 15 / 20 | 0.40 | 0.50 |
| arcane | 55 | 12.5% | 15 | 14 / 18 | 0.40 | 0.50 |
流派差 70−55 = 15（≤15，邊界）。

## rc12l 校準（SIM_RUN12M=0 SIM_POTFLOOR=0，64 seeds）
| 流派 | QA rc12l | sim |
|---|---|---|
| blade | 3/3 通關，剩藥 25–30，boss 2.5–6 / 12–19 | F100 88%，剩藥 24.5，5 / 14 |
| oc | 2/3 通關（死 F45），剩藥 0/28/10，12–33 / 7–13 | F100 59%，死亡中位 47.5，剩藥 7.5，18 / 8 |
| arcane | 1/2 通關（死 F60），剩藥 6/0，13–16 / 17 | F100 22%，死亡中位 65，剩藥 0，15 / 17 |
| bulwark | 無 QA 資料 | F100 100%，剩藥 27 |
rc12l 模式 sim 數字與 rc12n 前一致（RUN12M off 不受影響）。

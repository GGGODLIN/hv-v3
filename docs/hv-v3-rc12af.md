# hv-v3 rc12af

## 1. blade 王戰長尾（d8fbcbc）
- 根因（已驗證，scripts/rc12af-bossdiag.ts，128 seeds）：F30–65 只有 blade 沒有首領 HP 係數。首領 maxHp 中位 blade 32535、bulwark 9904、oc 13381、arcane 8439。blade 王戰回合中位 16、p90 37（其他 10–12、p90 16–21）。打小怪的回合比例各流派相近，不是原因。
- 調整（自訂）：blade 首領 HP ×0.5（F30–65，F65–70 漸回 1）；blade 勝利回血 ×0.27；blade mobHp 14→6；blade bossHp70 0.4→1；mobHp bulwark 11→10、oc 8→7.5、arcane 10→10.5。

## 2. 驗收（hint，128 seeds，env -i）
| 流派 | 樓層中位 | F100 | F45+ boss 中位 | p90 | 最大 | >30 | 連蓄≥3 死亡 |
|---|---|---|---|---|---|---|---|
| blade | 72 | 5.5% | 9 | 18 | 48 | 15/840 | 0 |
| bulwark | 71 | 0% | 9 | 15 | 35 | 1/781 | 0 |
| oc | 71 | 0% | 10.5 | 16 | 44 | 5/746 | 0 |
| arcane | 69 | 0% | 12 | 20 | 31 | 1/718 | 0 |
差距 3。blade F75–89 一般戰中位 25、p90 34（n=237；rc12ae 45）。arcane 未下降（69）。

## 3. 面板區間（6cc0507，不改數值）
- hi 低於實際（QA bl2 F45 T12 381>353）。根因（已驗證）：hi 用平均擲骰暴擊，實際最高 ×1.2。修正：面板 hi 改最高擲骰（topRoll12af），★/Z/D 建議不變。
- 無閃避格擋卻低於 lo。根因（已驗證）：lo 假設全部怪出手；實際玩家本回合擊倒／暈眩怪，或怪改起手蓄力。只改說明文字。
- 測試：tests/rc12af.test.ts、tests/rc12af-range.test.ts。

## 4. 風險（推測）
- blade 約 1.8% F45+ 王戰 >30 回合（最大 48）。
- blade 樓層中位 72，在上限。

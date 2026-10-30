# hv-v3 rc12ak（只推分支，未打 tag、未部署）

## 變更（自訂值）
- F55-75 mobK 回到 rc12ai `{ blade 0.85, bulwark 0.9, oc 0.45 }`
- 深層首領攻擊 F45+ ×2.5，四個流派相同（自訂，SIM_R12AK_BOSSATK_*、SIM_R12AK_ATKFROM）
- blade：R12O mobHp 6→4，bossK 0.75→0.6（自訂）；bulwark：mobHp 10→7（自訂）
- 深層 2 瓶商人預設關閉（MERCHANT_HP_DEEP_FROM 999，自訂；SIM_MERCHFROM 可開）
- 估計 hi：已倒地但還有第二階段的首領，本回合會復活並出手，現在計入（over-hi 修正，非數值）
- 無效旋鈕（輸出完全相同）：SIM_R12M_DROP/CHEST/BOSSDMG70/MOBDMG

## Sim（128 seeds）
| 流派 | 樓層中位 | F100 | 首領 F45+ p90 | 藥水 F60 中位 | F55+ 一般戰 中位/p90/>30 |
|---|---|---|---|---|---|
| blade | 70 | 0% | 23 ✗ | 8 | 12/17/0 筆 (n664) |
| bulwark | 70 | 8.6% ✗ | 16 | 8 | 15/23/8 筆 (1.0%) |
| oc | 80.5 ✗ | 10.2% ✗ | 17 | 10 | 14/21/5 筆 (0.5%) |
| arcane | 70.5 | 0% | 18 | 6 | 12/20/1 筆 |
deathsChgRun3 0、A-miss 0%、over-hi 0（四個流派都是）。

## 校準
用 scripts/rc12ak-calib.ts 對照 rc12aj 的 evflush（只有一場 blade）和 sim 的 AJ 行。evflush 沒有逐回合的首領傷害，所以只能比回合數和按鍵組成。

## 輪4（製作人加開一輪；已同意關掉 2 瓶商人）
- 首領攻擊：bulwark 2.5→4、oc 2.5→3.5（自訂）；blade 首領 HP 倍率 bossK 0.6→0.5（自訂）
- QA 紀錄：回合行加上「首領受傷 X（平均 Y／N 回合，含重新載入前）」（data-bossdmg / data-bossavg / data-bossturns），也存在 window.hvFight。計數存在 localStorage `hv-v3-qa-fight`，重新載入後接著算，所以 turns 包含重新載入前的回合。

| 流派 | 樓層中位 | F100 | 首領 F45+ p90 | 藥水 F60 中位 | F55+ 一般戰 中位/p90/>30 |
|---|---|---|---|---|---|
| blade | 70.5 | 0.8% | 21 ✗ | 8.5 | 12/19/5 筆 (n781) |
| bulwark | 72 | 3.9% | 18 | 7.5 | 15/22/6 筆 (n764) |
| oc | 80.5 ✗ | 4.7% | 17 | 10 | 14/21/3 筆 (n932) |
| arcane | 70.5 | 0% | 18 | 6 | 12/20/1 筆 (n700) |
over-hi 0、A-miss 0%、deathsChgRun3 0（四個流派都是）。

### 沒達標
- oc 樓層中位 80.5（目標 ≤72）
- blade 首領 F45+ p90 21（目標 ≤20）

### 校準（scripts/rc12ak-bossdiag.ts 對照 QA bl1 的 turnlog.bossDmg）
- sim 的 blade 王戰也是前 4 回合靠技能爆發，之後以 A 為主：第 5 回合起技能只占 4–12%。所以「sim 高估技能能撐多久」這個假設不成立，MP 回復沒有改。
- 每回合平均傷害：sim 1900–2400，真實 1600–1850。sim 第 5 回合起每回合中位只有 150–300，比真實的 100–1000 還低。差距主要來自前 4 回合的爆發，以及 D/Z 回合（sim 第 5 回合起 A 只占 35–52%）。

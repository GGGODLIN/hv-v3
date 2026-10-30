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

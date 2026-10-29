# rc12t（本地，未打 tag，未開服務）
根據 QA rc12s 回報（/workspace/qa-cp9-rc12s.md）調整。

## 改動（全部 自訂，非原版）
- 普通戰勝利後多回復最大 HP 的 10%（CP7.winHealNormal；環境變數 SIM_RC12T_WINHEAL；原本的 winHeal 0.1 不變），不增加藥水來源。
- bulwark 的 boss HP 倍率（F30–65）由 0.45 改為 0.3（DEEP12G.bwBossHp）。
- 為了抵銷回血，雜兵強度改為：blade 13→15、bulwark 16→21、oc 3.5→5、arcane 2.6/3→2.9/3.3。
- 上限都沒動（普通戰蓄力 30%、單次命中 40%）。

## sim 結果（每校 128 seeds，完整跑一趟，★ 策略）
| 學校 | floorMed | F100 | boss F30+ 回合中位數 | boss F45–50 回合中位數 | 每趟用藥 |
|---|---|---|---|---|---|
| blade | 69 | 14.8% | 6 | 6 | 23.9（rc12s 24.3） |
| bulwark | 68 | 0% | 11 | 13（rc12s 14） | 28.1（27.9） |
| oc | 65 | 15.6% | 10 | 11 | 28.5（29.5） |
| arcane | 65.5 | 27.3% | 10 | 8 | 27.6（26.3） |
最大差距 4（目標 ≤12），中位數都在 55–70 之間。

## 備註：中間 commit 狀態（docs-only，於 tag cp9-rc12t 之後）

- 中間 commit `aaff6a4` 單獨 checkout 時 vitest 為紅（3 個舊測試失敗），已於 `72c2778` 修正。
- 往後每一個 commit 都必須單獨通過完整 vitest（green）。

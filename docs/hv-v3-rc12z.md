# hv-v3 rc12z — 三點修正（全部「自訂」）

所有開關在 `src/core/cp8.ts` `RUN12Z`，預設開啟，遊戲與 sim 共用 `src/core/run.ts` / `battle.ts`，可用 `SIM_R12Z_*` 覆寫（僅 sim）。

## 1. bulwark F65 王牆
- 根因（已驗證，sim）：深層 deepK + mobDmg 讓王戰小怪原始傷害遠超 40% 單擊上限，幾乎每擊都貼上限；bulwark 的 BW12W block/parry×0.6 降低迴避。F45→65 每回合受傷 0.15→0.18 maxHP（arcane 0.08–0.12、oc 0.13–0.14），F65 王戰勝率 61%。單調 adb 無效（被上限吃掉）。
- 修正（自訂）：bulwark 在 F45–65 王戰，非王小怪單擊上限 `bwAddCap=0.15` maxHP（`bwAddFrom=45`、`bwAddTo=65`）。不延伸至 65 以上以免 F100 暴增。

## 2. oc F50–60 王戰回合過長
- 已驗證：QA 實玩 F50–60 王戰 21/35/13/29/21/35 回合；sim 中位 16。實玩每回合承受小怪約 20% maxHP，sim 約 14%。
- 差異（推測）：實玩玩家會補血/防禦/換目標，輸出回合比例低於 sim 的貪婪 AI；harness 無法逐回合對齊，比例約 1.3–1.75×。
- 修正為數值（自訂）：oc 在 F45–65 王 HP ×`ocBossHp=0.6`。sim 中位 16→11，換算實玩約 14–19。

## 3. 一般戰被 30% 蓄力磨死
- 修正（自訂）：非王戰第 `tiredAt=25` 回合後，敵人「疲憊」：不再蓄力，單擊上限 `tiredCap=0.15`。
- 效果：長一般戰死亡 blade 28→16、arcane 18→11。>25 回合比例不變（長度來自怪物 HP，非傷害）。

## 驗收
`SC=<school> npx tsx scripts/rc12z-accept.ts 128`，於乾淨 worktree `env -i` 執行。

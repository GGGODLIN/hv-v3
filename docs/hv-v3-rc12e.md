# hv-v3 rc12e（bot/grok，無 tag）

Commits: af9ba34（法杖機制）、a9418c3（cp3 拆分）、037ef0f（battle-run 時限）、27413bb（QA ★ 鍵一致）＋本報告。

## 1. 法杖 Coalesced Mana / Ether Tap
| 值 | 來源 |
|---|---|
| CM 機率 10 + (INT+WIS)×0.01 + 法杖熟練/20，上限 35%，5 tick | Fighting_Styles.md:146-172；findings 002:281 |
| 對 CM 目標施法耗魔 ×0.5（與 Spirit Stance 疊乘） | Spells.md:84,88 |
| Concussive Strike 可觸發 CM | Skills.md:79 |
| ET：每回合回 2% Base_MP，最多疊 1 次（×2），4 tick，觸發時移除 CM；擊殺的 Arcane Blow 必觸發 | Fighting_Styles.md；findings 002:281 |
| ET 機率 0.36 | findings 003:114-118 寫「~36–40%」，**取下限＝自訂** |
| Base_MP = baseMp(level,wis) | formulas.ts |

**自訂**：被法術擊中的每個敵人各擲 1 次 CM，被迴避則不擲；再次觸發會把 CM 重設為 5；多目標法術以主目標計價；ET 再觸發刷新為 4 tick；1 tick＝1 回合，在 endOfPlayerTurn 遞減。
UI 與 sim 共用 `spellCost(s,id,target)`、canUse/whyNot/suggestSpell，所以提示和 ★ 是同一套邏輯。狀態列顯示「以太分流 [x2] N」，怪物標籤顯示「合流N」。tests/rc12e-staff.test.ts 共 7 項。

## 2. 主 sim 前後對照（before=288baa2，after=af9ba34；std 以 CP8=1 跑）
欄位：中位樓層 / F100 比例 / bossTmed / 法術★占比（不含 A）；arcane 另列 A 占比與「A 因 MP 不足未施法」占比。
| run | blade | oc | arcane | bulwark | gap |
|---|---|---|---|---|---|
| preset battle before | 36.0/0.02/3/0.023 | 30.0/0.0/6/0.03 | 35.0/0.0/7/0.36/A0.35/mp0 | 40.0/0.08/9/0 | 10.0 |
| preset battle after | 37.0/0.02/3/0.024 | 30.0/0.0/6/0.027 | 35.0/0.0/7/0.347/A0.367/mp0 | 40.0/0.08/9/0 | 10.0 |
| preset hint before | 90.0/0.5/5/0.035 | 50.0/0.38/7/0.076 | 55.0/0.2/12/0.36/A0.265/mp0 | 100.0/0.91/10/0 | 50.0 |
| preset hint after | 90.0/0.5/5/0.035 | 50.0/0.38/7/0.074 | 59.0/0.14/12/0.364/A0.263/mp0 | 100.0/0.91/10/0 | 50.0 |
| std battle before | 100.0/0.62/7/0 | 55.5/0.15/15/0 | 79.0/0.3/13/0.29/A0.451/mp0 | 65.0/0.28/17/0 | 44.5 |
| std battle after | 100.0/0.62/7/0 | 55.5/0.15/15/0 | 75.0/0.31/13/0.295/A0.45/mp0 | 65.0/0.28/17/0 | 44.5 |
| std hint before | 100.0/0.91/6/0 | 100.0/0.66/16/0 | 100.0/0.68/16/0.281/A0.442/mp0 | 100.0/0.68/19/0 | 0.0 |
| std hint after | 100.0/0.91/6/0 | 100.0/0.66/16/0 | 100.0/0.68/16/0.288/A0.432/mp0 | 100.0/0.68/19/0 | 0.0 |

## 3. cp3 acceptance timeout 根因
同一個 test 內跑了約 375 次 autoRun，單獨就要約 3.5 s，負載下超過 5 s 預設時限。修法：拆成 3 個策略 test 加 1 個 avoid test，結果 memoize 共用，斷言不變。另外 battle-run 的 16-run 鏈是循序且決定性的，負載下要 4.8 s，因此給明確 30 s 時限。沒有加 retry。

## 4. QA bug（rc12d oc2 F40 t14：★Z 喝藥，紅字卻說「按 D」）
根因：chargePayoff 寫死「按 D·防禦」，urgentLine 只依防禦判定選字，兩者都沒讀 ★ primaryKey。修法：urgentLine 接收 pk。★≠D 時，紅字改成「…所以這回合按 ★label」；payoff 改成「防禦的效果（本回合 ★ 是 label）」。D 或喝藥的判定邏輯不變。
不變式 test（tests/rc12e-key-invariant.test.ts）：4 種 lean × 6 個 seed × 3 次 autoRun，開 cp7+cp8，每回合渲染 battleHtml。所有「按 X」都必須等於 ★。修正前失敗（例：blade/1 t14 ★Q 按D、oc/2 t9 ★Z 按D），修正後通過；約 1.1 萬回合，有 64 處點名按鍵。

## 5. 商人
維持 1 瓶，未改。

## 已驗證
- 全套件在負載 10–12（8 核）下連跑 3 次，3 次都是 561/561 通過（/tmp/rc12e/final{1,2,3}.log）。
- 上表數字取自 /tmp/rc12e/{before,after}/*.log。
- 不變式 test 修前失敗、修後通過。
- git status 乾淨（只剩 untracked 的 tests/scratch）。

## 推測
- 機制對平衡的影響很小：只有 arcane 有變動，其他學派完全相同。主 sim 下「A 因 MP 不足」的占比本來就是 0，所以 CM 半價和 ET 回魔幾乎沒有可以改善的空間。
- arcane 的小幅變動（preset hint 中位 55→59、F100 0.20→0.14；std battle 79→75）應是多出來的擲骰改變了 RNG 序列造成的雜訊，沒有用多 seed 驗證。
- cp8 下 arcane 的 A 本身就是快速法術，所以「法術★占比」低估了實際的施法量。

# CP7 手感（RULES.cp7，預設關閉）

所有 CP7 改動都只在 `RULES.cp7 = true` 時生效；關閉時 `scripts/cp4-on-check.sh` 仍輸出 `CP4+CP5+CP6-ON SIM == cp6-on baseline`。
旋鈕集中在 `src/core/cp7.ts`。Sim：`scripts/cp7-round.sh <name>`（N×4 流派×A/B），報告 `scripts/cp7-report.ts` 印出 P1–P5 CHECK 行。
最終 N=256 結果：`docs/cp7-final-sim.txt`。

## 定義
- **「比身上好」**：穿上後 戰力（`powerScore(derive)`）提升 > `betterMargin` = 2%。UI 徽章「▲ 比身上好」、sim 指標、CP7 下 AI 防具自動換裝共用同一規則。**暫定（缺原版出處）**：單件防具只動總戰力約 1–4%，舊 5% 門檻幾乎永遠不觸發。
- **Superior 矛盾 / lootPlayerLevel**：findings 003 §1.1 說 Superior+ 掉落時取玩家當前等級；本作主塔掉落用 floorLevel(1+2(f−1))。CP7 試過強制玩家等級，刃鋒 F20 永不通關升到 22–30%（P5 失敗），故回復 `RULES.lootPlayerLevel` 原設定（false）。**需製作人決定**。
- **P2 法術弱點（有出處）**：Damage.md:63 — 特化抗性被減到 0 為止、已為負不再減。cp6 對弱點也扣，等於放大弱點。

## 暫定值（全部缺原版出處）
| 旋鈕 | 值 | 用途 |
|---|---|---|
| betterMargin | 0.02 | 更好判定 |
| pityUntil / pityTries / pityPasses / pityLevelStep / pityBumpEvery | 2 / 32 / 3 / 3 / 2 | 智慧掉落保底：當趟「更好」不足 2 件時補 1 件剛好更好的防具（最小合格增益，品質＝身上品質、最多升一級） |
| winHeal | 0.1 | 深淵勝戰回 10% HP/MP/SP（P3：降低營火依賴） |
| dmgScale / dmgMid / knee / dmgLate | 1 / 0.2 / 15 / 0 | 取代 ABYSS.dmgPerDepth：低→中段上升→後段平 |
| themeDmg | 主題 16–19 非 Boss 傷害 ×0.7 | **d16/d18 死亡尖峰根因**：CP5 主題 16–19 選到的怪基礎傷害高約 12%（80→90），疊上 Nightmare 階 DIFF 跳升 |
| tierRamp / plRamp / plScale | 3 / 3 / 1 | 保留為旋鈕（實驗證明 PL 不是尖峰原因） |

## 結果（N=256，A=seeds 1–256 / B=SEED0 256）
| 指標 | A | B | 狀態 |
|---|---|---|---|
| P1 每趟 ≥1 更好 | 70.2% | 69.9% | FAIL（見下） |
| P1 中位數 | 2 | 2 | PASS |
| P2 強/弱 | 1.065× | 1.061× | PASS |
| P3 營火差 | 25.6pp | 25.5pp | FAIL |
| P4 首趟中位深度 | 22 | 22 | FAIL（目標 8–18） |
| P4 低→升 | 0.0% < 4.7% | 0.0% < 4.2% | PASS |
| P4 後段平 | 8.0% vs 6.4%×1.25 | 7.7% vs 6.2%×1.25 | A 邊緣 FAIL（8.0 = 8.0，未嚴格小於） / B PASS |
| P4 fresh 勝率 | 全流派 PASS | 全流派 PASS | PASS |
| P4 必死組合 | 0（N=96；cp7 關為 1） | | PASS |
| P5 刃鋒 never | 7.4% | 6.3% | PASS |

## 未達標（目標不改，誠實回報）
- **P1 每趟**：約 30% 的趟從 d26 檢查點出發、第一戰就死、0 擊殺 → 沒有任何掉落事件，掉落時保底無從觸發。贏過 ≥1 場的趟 99.4% 以上有更好掉落。**需製作人決定**：是否接受「每趟」定義為「有戰鬥勝利的趟」，或給檢查點出發一次保底。
- **P4 首趟中位 / P3**：與 fresh d16 ≥60%（刃鋒、壁壘最弱）互相牽制。把首趟壓到 ≤18 的設定（dmgScale 1.2–1.4 或 dmgMid ≥0.28）都讓刃鋒/壁壘 d16 掉到 50–57%、B 組 d3 <95%，P3 也擴大到 29–40pp。

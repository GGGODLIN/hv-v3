# rc12l 實機校準與 blade 差異根因（僅分析，未改 src/tests）

Sim: scripts/rc12m-fullrun.ts（rc12l 行為：SIM_RUN12M=0 SIM_POTFLOOR=0），64 seeds；QA：qa-cp9-rc12l-data.jsonl。

## 已驗證
- 根因：src/core/preset.ts:16 applyPreset 在 cp8 下設 `player.lean = pr.school`；fullrun sim 直接讀 cp6-presets.json，未設 lean → blade/oc 在 sim 中 lean=None（arcane/bulwark 已有 lean）。
  依賴 p.lean 者：armBattle（auto.ts:533 / app.ts:888，含 CP9.bladeOc 0.7）、allocWeights 自動分配（auto.ts:68）、leanStyle 鎖流派自動換裝（auto.ts:129）、LEAN_ROUTE（auto.ts:353）、buffoffer。encounter 曲線用 curveSchool12g，兩邊一致。
- rc12l 校準（F100 率 / 剩藥中位 / Boss 回合 F30–65、F70+ 中位）：
  | 流派 | QA | sim 無 lean | sim 有 lean |
  |---|---|---|---|
  | blade | 3/3, 25–30, 2.5–6 / 12–19 | 31%, 0, 6 / 29 | 88%, 24.5, 5 / 14 |
  | oc | 2/3（oc1 F45 死）, 0/28/10, 12–33 / 7–13 | 81%, 20, 14 / 10 | 59%, 7.5, 18 / 8 |
  | arcane | 1/2（ar2 F60 死）, 6/0, 13–16 / 17 | — | 22%, 0, 15 / 17（death med F65） |
  有 lean 後三流派皆與 QA 大致吻合。
- 分解（blade, lean）：SIM_BLADEOC=1 → F100 58%；無 lean 不論 BLADEOC 皆 31%。即 OC 減費約貢獻 30pt，換裝/分配/路線約 27pt。
- 命中上限：rc12l 中 boss 蓄力/預告重擊無單擊上限，只受每回合 bossBurst 0.5（budget9）；非 boss 蓄力 minionCharge 0.4；boss 普攻 CP9.bossAtk。ar1 F65 T19 470/1014=46.4% 符合 50% 設計。rc12m 的 hitCap12m（RUN12M.hit 0.4）則對所有怪物單擊含 boss 蓄力封頂 40%。
- **rc12m 影響（RUN12M 預設，有 lean）**：blade F100 73%、剩藥 3.5、F70+ 15 回合（無 lean 時 3%）；oc F100 1.6%、floor/death 中位 49/48（無 lean 時 14%、60/55）。rc12m 驗收數字建立在 blade/oc 缺 lean 的 sim 上，不代表實機。

## 推測
- 實機 rc12m（5371）blade 會明顯偏易、oc 偏難（中位約 F48 死），與 rc12m 驗收宣稱不符。
- oc 有 lean 更難，可能因 lean 鎖換裝/分配不利於 oc，未拆解。

## 建議修正（未實作）
1. fullrun sim 載入 preset 後呼叫 applyPreset（或 `p.lean = preset.school`），並加一個測試斷言 sim 玩家 lean 與 app 一致。
2. 以修正後 sim 重新調校 R12M_BASE blade（加難）/ oc（減難）係數，重跑驗收。

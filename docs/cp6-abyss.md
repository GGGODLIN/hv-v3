# CP6 設計草稿：深淵塔（無限層）

> 狀態：製作人已回覆 §8 八題（2026-10-26，全部暫定），決定見 §9；實作進行中，旗標 `RULES.cp6Abyss`（預設關閉，網址 `?cp6` 開啟）。所有新規則都會放在新旗標 `RULES.cp6Abyss` 底下，旗標關閉時輸出要和 cp5-rc 逐位元相同。
> 出處規則：只引用 repo 內有出處的值，包括 `src/core/data/constants.ts` 的鍵名、`.scratch/hv-v3/wayfinder/findings/00x`（以下簡稱 findings）和它引用的 `.scratch/hv-v3/sources/parsed_wiki/*.md`，以及 `public/data/monsters.json`。repo 內找不到出處的值一律標 **暫定（缺原版出處）**。
> Clean Room：本文件沒有讀取 CLAUDE.md 黑名單上的任何路徑。

## 0. 原版對照：哪一個模式最像「無限層」

| 原版模式 | 縮放方式（有出處的部分） | 出處 |
|---|---|---|
| **The Tower**（Isekai 專屬） | 層數「effectively unlimited」。每層的波數逐漸增加；怪物等級 = 層數 × 10，可以超過玩家等級；難度由層數決定，從 F10 起每 5 層升一階（Normal → … → PFUDOR）；F40 之後每 5 層再加 5% 怪物傷害和 5% HP；每天 3 次嘗試，勝、敗、逃都算一次；F5 前不列排名；每層通關保底 1 件 Tier 1–7 獎盃級裝備和 10 個 Soul Fragments；每層只能通關一次 | `sources/parsed_wiki/The_Tower.md`（Details／Ranking／Rewards 表）；findings 003「2026-10-22 稽核補充」第 1 點 |
| The Tower 每波增傷 | 第 1 波 100%，每波 +2% | `sources/parsed_wiki/Battles.md:261` |
| Grindfest | 1000 波；怪物傷害從 50% 起，每波 +0.4%（兩個數字原文都帶「?」） | findings 003 §3.2(4)；`Grindfest.md:21` |
| Item World | 5–30 波，每波 +1% 傷害，Credits ×1/4 | findings 003 §3.2(5)；findings 005 `003-06a`、`003-06c` |
| Arena | 24 關，波數 2→100，`arena_bonus` 1.0x→5.0x，關卡依序解鎖 | findings 003 §3.2(2)；constants `F-003-arena-stages`（第 1–2 關） |
| 難度七階乘數 | 怪物 HP ×1.0／1.1／1.2／1.4／1.7／2.0／2.0；傷害 ×1.0／1.2／1.4／1.6／2.0／2.5／3.0；PL 上限修正 +0／5／20／30／60／100／125；Quality Roll ×1／1.5／2／2.5／3／5／6；EXP ×1／2／4／7（或 6，有分歧）／10／15／20 | findings 003 §3.1；EXP 的分歧見 findings 002 GAP-002-10 |

結論：深淵塔以 **The Tower** 為骨架（層數決定難度、每 5 層一階、F40 後線性加成），Boss 和詞綴沿用 CP5。

## 1. 無限層的縮放

符號：`d` 是深淵層數（1, 2, 3…）。`tier = floor(d / 5)`，用來對應 The Tower 的「每 5 層一階」。

### 1.1 怪物等級
- 原版 The Tower：怪物等級 = 層數 × 10（**有出處**，The_Tower.md）。
- 本作主塔每層只 +2 級（`TOWER.levelPerFloor = 2`，暫定，CP3），F20 的怪物約 Lv39。直接套用 ×10 的話，深淵第 1 層就會跳到 Lv10 以上，並且每層 +10，和本作的經驗曲線（constants `F-002-1.1A-exp`）落差太大。
- 提案：`怪物等級 = floorLevel(20) + 2 × d`，再加上現有的 `monLvFollow` 跟隨玩家等級規則（k 0.8、free 4，暫定，CP3）。**暫定（缺原版出處；原版是 ×10，這裡縮小成 ×2，以配合本作已縮小的等級曲線）**。
- 怪物屬性照原版公式隨等級成長（**有出處**）：constants `F-005-monster-scaling`（`0.01·base·lv + lv^1.076675·0.3325`）、`F-005-monster-hp`（`(100 + 10·lv + 5·END)·level_mod`，lv>100 時 `level_mod = 1 + 0.01·(lv-100)`）。
- PL 範圍照 constants `F-005-pl-window`（lv<100 時上限 = lv，否則 `lv^1.27 − 247`，下限 = min(上限/2, 500)），**有出處**（Monster_Lab.md:137-144，原文帶「?」）。從 `public/data/monsters.json`（44,382 列）抽怪；資料中最大 PL 是 2250，和 findings 003 §4.1(A) 的上限 2250 一致。

### 1.2 HP 與攻擊（難度階）
- 照 The Tower 的難度表：`tier` 0–1（d 1–9）用 Normal，d 10–14 用 Hard，15–19 Nightmare，20–24 Hell，25–29 Nintendo，30–34 IWBTH，35–39 PFUDOR（**有出處**，The_Tower.md 表格）。
- 各階的 HP、傷害、PL 上限、Quality Roll 乘數照 findings 003 §3.1（**有出處**）。
- d ≥ 40：在 PFUDOR 的基礎上，每多 5 層，怪物傷害和 HP 各 +5%（**有出處**，The_Tower.md：「adds a base 5% monster damage and 5% HP at each additional 5 Floors past 40」）。
- 每場內的增傷：深淵每層只有 1 場（加上精英、Boss 節點），不是多波戰，所以不套用原版「每波 +2%」。改成**每層 +2% 怪物傷害，跨層累加**，**暫定（缺原版出處；把原版「每波 +2%」換算成每層）**。
- PFUDOR 怪物的額外強化（行動速度 +25% 等，findings 003 §3.1）本作沒有對應系統，先不實作，**暫定**。

### 1.3 詞綴數量
- 原版沒有精英詞綴，這整個系統都是 CP5 新增的，**全部暫定（缺原版出處）**。
- 提案：d 1–9 帶 1 個詞綴（雙詞綴機率沿用 `CP5.eliteDoubleChance` 0.3）；d 10–19 固定 2 個；d 20–29 為 2 個、30% 機率 3 個；d ≥ 30 固定 3 個。3 個詞綴仍要遵守 `EXCLUSIVE` 互斥表。
- 同時有 3 個詞綴時，精英 HP 乘數以 `CP5.doubleHp` 0.8 為基礎再乘 0.8，**暫定**。
- 【法抗】或【反魔】出現時，照 CP5 r5 顯示 ⚠ 高危險提示（`dangerHint`）。

### 1.4 Boss 輪替
- 每 5 層一隻 Boss（對應 The Tower 每 5 層一階）。招牌機制依序輪替：召喚 → 元素盾 → 尖刺盾 → 吸血重擊，以 `(d/5 − 1) mod 4` 決定。**暫定（缺原版出處；原版 The Tower 沒有寫 Boss 配置）**。
- 從第二輪（d 25 起），每隻 Boss 加上 1 個精英詞綴（但不抽【法抗】或【反魔】，避免出現必死組合）；第三輪（d 45 起）加 2 個。**暫定**。
- Boss HP 沿用 `monLvFollow.bossHp` 0.18（暫定，CP3）和 `CP5.bossHp` 表；深淵層不另外降 HP。

### 1.5 層內結構
- 每層 1 個節點選擇（戰鬥、精英、寶箱、商人、營火、神龕），權重照 `TOWER.weights`（暫定）。
- 每 5 層固定一個營火，`d mod 5 == 4`，**暫定**。
- 每 10 層一次商人保底，**暫定**。

## 2. 紀錄

- **最高層**：存檔記錄 `abyss.best`，也就是最高通關層。原版 The Tower 的排名依「已通關的層數」決定、同層同名次、F5 前不列排名（**有出處**）。本作是單機遊戲，沒有排名，只記錄個人最佳，並在 d ≥ 5 時才顯示。
- **各流派紀錄**：以抵達該層時成形的 CP4 流派（刃鋒、奔流、秘術、磐石，或無）為鍵，記錄 `abyss.bestBySchool[school]`，另外記錄 buff 數和角色等級。**暫定（原版沒有流派系統）**。
- **死亡規則**：
  - 原版 The Tower 每天 3 次嘗試，勝、敗、逃都算一次；每層只能通關一次（**有出處**）。
  - 本作沒有日期系統，提案：深淵塔一趟就是一次挑戰；戰死就結束這一趟，回城時帶回本趟所得的 50%（主塔戰死時的帶回比例沿用現有 `settle` 規則，這裡另外設一個值），撤退則保留 100%。**暫定（缺原版出處）**。
  - 接續：下一趟可以從 `max(1, 5 × floor(best / 5) − 5)` 層開始（每 5 層一個檢查點，退回上一個），**暫定**。
  - 不做每日次數限制，**暫定**（待決問題 Q3）。

## 3. 獎勵

- **掉寶**：一般掉落照 constants `F-003-loot-rolls`（`0.10 + clamp((PL−500)/5000, 0, 0.15)`，裝備 ×0.025，**有出處**）。品質照 `003-01a` 的品質區間（**有出處**）；Quality Roll 乘數照該層對應難度階（findings 003 §3.1，**有出處**）。
- **通關保底**：原版 The Tower 每層通關保底 1 件 Tier 1–7 獎盃級裝備（**有出處**，Tier 依難度階：1–9 層 T1、10–14 T2…35+ T7）。本作改成**每 5 層（Boss 層）**保底 1 件，Tier 照該層對應的原版階。**暫定（把原版每層一件縮成每 5 層一件，避免單機遊戲中裝備通膨）**。Tier 對應的最低品質目前只有「T1 = Average 以上」有出處（constants `F-003-clear-bonus`），T2–T7 的品質下限 **缺原版出處，暫定**。
- **Soul Fragments**：本作沒有這種道具，不實作。
- **帶回倍率**：原版 EXP 倍率可參考難度階 `difficulty_bonus`（findings 002 §1.1、003 §3.1，**有出處**），但 Hell 是 7x 還是 6x 有分歧（GAP-002-10）。提案：深淵塔的 EXP／Credits 帶回倍率 = 主塔 ×1，再乘 `1 + 0.05 × tier`；**不**直接套用 1→20 倍的難度乘數，因為本作的升級曲線已經縮小。**暫定（缺原版出處）**。
- **里程碑**（首次抵達才給）：
  - d 5：解鎖紀錄顯示。
  - d 10、20、30、40：一次性 Credits，數額沿用 Arena 首通獎金的級距概念（Lv10 關 1,000 C、Lv20 關 2,000 C…，**有出處**，findings 003 §3.2(2) 表）。這裡只取「每 10 層 = Arena 下一關首通」的對應方式，數額需另外乘上本作的經濟比例，**暫定**。
  - d 40：稱號「深淵行者」，**暫定**（原版 Endgame 等關卡有解鎖稱號，但這個稱號名稱是自訂的）。

## 4. 解鎖條件，以及和主塔、Item World 的關係

- **解鎖**：首次通關 20 層主塔（擊敗 F20 災厄）。比照原版 Arena「必須先通關前一關」（**有出處**，findings 003 §3.2(2) 通用規則）。
- **和主塔的關係**：主塔仍是主要的成長路線（第 6–10 趟通關，CP5 r5 指標）。深淵塔是通關後的終局內容，獨立計算趟數，不影響主塔的 `carryMult` 新手加成。CP4 的 run buff 照樣在深淵塔裡抽取，層數越深，可以疊的 buff 越多。
- **和 Item World 的關係**：
  - 原版 IW 是讓裝備成長的模式：每通過 1 層 IW，裝備 +1 IW 等級、+1 Charm Point、+1 鍛造上限（findings 003 §3.2(5)，**有出處**）。IW 回合數 `min(30, 5 + IW 等級)` 是 findings 005 `003-06a` 的 **暫定** 值。
  - 本作已有「簡化道具界」（`IW_STEP` +4%／IW 等級，暫定），在營火和城鎮可用（design.md）。
  - 深淵塔不取代 IW。提案：深淵 Boss 層額外掉 1 個「深淵碎片」，可以抵掉一次城鎮道具界的 Credits 費用（城鎮道具界費用 200 ×（N + 1）C，design.md，暫定）。這是讓兩種玩法互相連結的唯一管道，**暫定（缺原版出處）**。

## 5. 驗收指標

| 指標 | 門檻（全部暫定） |
|---|---|
| 剛通關主塔的角色（第 6–10 趟的狀態）在深淵塔的首次抵達層中位數 | 8–15 層 |
| 每 +5 層，應對 AI 的 Boss 勝率下降 | 5–15pp（單調下降，沒有斷崖） |
| 50% 角色止步的層數，流派間的差距 | ≤ 5 層 |
| 精英必死組合（應對 AI 勝率 <50%） | 允許，但每一組都要有 `dangerHint` 或其他提示；3 詞綴的必死組合要列表 |
| 深淵 Boss 戰回合數 | 10–25 回合 |
| 掉寶價值／趟 | 深淵 d 1–5 ≥ 主塔 F16–20 |
| 旗標 `cp6Abyss` 關閉 | 和 cp5-rc 逐位元相同（cp4-on-check、cp4-off-check、cp5 sim） |

## 6. sim 計畫

1. `scripts/cp6-abyss-sim.ts N`：每個流派 × N 個種子。先用 cp5-sim 的方式把角色打到第 10 趟（主塔已通關），存下快照，再進深淵塔，用應對 AI 一路打到死或打到 d 60。輸出：止步層的分佈、各 5 層區段的勝率、回合數、藥水用量、掉寶價值。
2. `scripts/cp6-deathcombo.ts`：把 CP5 的必死組合掃描延伸到 3 詞綴，在 d 10、20、30 各做一次。
3. 縮放敏感度：分別把每層增傷（2%）、詞綴數量、F40 後的 +5% 調為 ×0.5 和 ×2，看止步層的變化。
4. 回歸檢查：`cp4-on-check.sh`、`cp4-off-check.sh`、`cp5-sim` 在旗標關閉時都必須完全不變。
5. 結果寫進 `docs/logs/cp6-*.txt`，並在本文件追加 r1 狀態表，已驗證和推測分開寫。

## 7. 決策與理由

1. **以 The Tower 為骨架**：它是原版唯一的「無限層」模式，而且層數決定難度、每 5 層一階這兩點都有出處，和本作「每 5 層一隻 Boss」的節奏剛好對上。
2. **怪物等級 ×10 縮成 ×2**：本作主塔已經用每層 +2 級（暫定），直接套 ×10 的話，第 1 層的難度會一下子跳到主塔 F20 的好幾倍。
3. **難度階照原版乘數**：HP、傷害、PL 上限都有出處，可以直接用；EXP 不照原版的 1→20 倍，以免通膨。
4. **保底裝備從每層改成每 5 層**：單機遊戲沒有交易需求，每層一件會讓背包和經濟通膨。
5. **詞綴和 Boss 輪替沿用 CP5**：不重做機制，試玩已經學會的應對方式可以直接延用。
6. **不做每日次數限制**：單機遊戲沒有日期系統，改用「死亡就結束這一趟、帶回比例降低」來製造風險。

## 8. 需要製作人決定的問題

1. 怪物等級要用 ×2／層（提案），還是更接近原版 ×10、但另外壓低 HP 和攻擊？
2. 每層 +2% 增傷要跨層累加（提案），還是每 5 層重置？
3. 要不要模仿原版的每日 3 次限制，例如每主塔趟可以挑戰 3 次？
4. 深淵塔戰死的帶回比例：50%（提案）、和主塔相同，還是 0%？
5. 保底裝備：每 5 層一件（提案），還是照原版每層一件、但品質較低？T2–T7 的品質下限缺出處，要不要先用 T1 = Average、往上每階 +1 品質？
6. 3 詞綴的精英要不要允許【法抗】＋【反魔】以外的必死組合？還是 3 詞綴時一律禁抽這兩個？
7. 深淵碎片抵道具界費用這條連結要不要做，還是深淵塔完全獨立？
8. 要不要做排名的替代品（例如各流派最高層的本機排行）？

## 9. 製作人決定（2026-10-26，全部暫定）

| # | 決定 | 實作規則 | 出處狀態 |
|---|---|---|---|
| 1 | 怪物等級每層 ×2 | `怪物等級 = floorLevel(20) + 2 × d` + 現有 `monLvFollow` | **偏離原版**：原版 The Tower 是「層數 × 10」（`The_Tower.md:9`，有出處）。理由：本作主塔每層 +2 級、經驗曲線已縮小；照 ×10，第 1 層就跳 10 級、之後每層 +10，配合本作成長曲線會失控（玩家等級追不上，第 2–3 層就全滅）。×2 是**暫定（缺原版出處）** |
| 2 | +2% 增傷跨層一路累加 | 怪物傷害 ×(1 + 0.02 × (d − 1))，不重置 | 對應原版 Tower 每波 +2%（`Battles.md:261`，有出處）；「每波 → 每層」的換算是**暫定** |
| 3 | 不做每日次數限制 | 無限制 | 原版每天 3 次（有出處）；本作不採用，**暫定** |
| 4 | 戰死帶回 50%，照主塔規則；每 5 層一個檢查點 | 戰死直接套 `settle`（`RULES.death` 0.5／保留最好 1 件），撤退 100%；下一趟可從 `5 × floor(best / 5) + 1` 層開始（已通關的最後一個 5 的倍數之後） | **暫定（缺原版出處）** |
| 5 | 保底每 5 層 1 件，品質下限隨階數上升 | Boss 層（d mod 5 = 0）保底 1 件，Tier 照 The Tower 表（d 1–9 T1、10–14 T2、15–19 T3、20–24 T4、25–29 T5、30–34 T6、35+ T7，`The_Tower.md:32-48`，有出處）；品質下限照原版 Trophy 表（`Items.md:161-185`，有出處）：T1–T3 普通（Average）、T4–T5 優良（Superior）、T6 精良（Exquisite）、T7 華麗（Magnificent） | 製作人原提案「T2 尚可、T4 優良、T6 以上絕佳」已對照原版表調整：原版 T2 最低是 Average（高於「尚可」=Fair），T4 是 Superior（與提案一致），T6 是 Exquisite、T7 是 Magnificent（本作沒有「絕佳」這個品質名，最接近的是 華麗）。「每 5 層一件」本身是**暫定** |
| 6 | 3 詞綴精英不允許必死組合 | 沿用 `EXCLUSIVE`，另加 3 詞綴互斥：3 詞綴時禁抽【法抗】【反魔】（CP5 sim 的必死組合清單全部都含這兩個，也就是 `dangerHint` 會亮的組合）；1–2 詞綴照舊可抽，並照舊顯示 ⚠ | **暫定（缺原版出處；原版沒有詞綴）** |
| 7 | 碎片與道具界連結不做 | 列入待辦（§10） | — |
| 8 | 做本機紀錄 | localStorage `hv-v3-abyss`：總最高層、各流派（刃鋒／奔流／秘術／磐石／無）最高層與達成時的趟數、深淵總趟數。這是深淵的主要長期目標 | **暫定（原版是全服排名，本作改本機）** |

## 10. 待辦

- 深淵碎片抵城鎮道具界費用（Q7，製作人決定先不做）。
- PFUDOR 怪物額外強化（行動速度等）沒有對應系統。

## CP6 round 2 (2026-10-26)：決定 6–9 與調參（全部 暫定，缺原版出處）
- (6) 深淵首領掉寶 2 件，另加 1 件保底（`ABYSS.bossDrops`）。(7) 商人和寶箱的物品等級隨深度，用怪物等級公式 `abyssLevel`。(8) 帶回倍率 = 1 + 0.05×tier（`abyssCarry`）。(9) 每 10 層里程碑只在第一次給：1 件保底裝備＋1 個稱號（存在 localStorage 紀錄的 `ms`/`titles`，UI 會顯示；稱號名稱暫定）。都有測試（tests/cp6.test.ts）。
- sim：`scripts/cp6-abyss-sim.ts 24 5`。先在主塔打到第一次通關 F20，再進深淵 5 趟（撤退 0.3）→ docs/logs/cp6-abyss-sim.txt。進深淵時角色等級中位數 13（p10 11–12、p90 14–17），主塔通關所需趟數中位數 3–8。

### 調參紀錄（只新增旋鈕，已接受的 1–5、10 不動）
| 輪 | 變更 | 理由 / 結果 |
|---|---|---|
| 0 | 無 | 第 1 趟中位數 2、5 趟後最佳中位數 4、d5 首領勝率 37–44%：深淵 d1 怪物約 Lv 40，玩家 Lv 13，全部未達標 |
| 1 | `levelOffset` −10 / −20 | −20：第 1 趟 7–9、最佳 9–12，最佳深度仍不足；等級差同時也壓低經驗值和掉寶等級，所以不採用 |
| 2 | 新增 `hpScale`、`dmgScale`（深淵怪物 HP／傷害整體倍率）0.6 / 0.5 / 0.52 / 0.55 | 0.5：第 1 趟 10–14，超過 10；0.6：最佳只到 14 |
| 定案 | `hpScale = dmgScale = 0.55`，`levelOffset = 0` | 見下方結果 |

### 結果（0.55）
- 第 1 趟深淵中位數：auto 10 / 刃鋒 10 / 奔流 10 / 秘術 9 / 磐石 9 → **達成**（5–10）
- 5 趟後最佳深度中位數：17 / 14 / 14 / 14 / 15 → **未達成**（刃鋒、奔流、秘術是 14，差 1。卡在 d15 首領：checkpoint 從 d10 開始，到 d14 就死）
- 流派最佳深度差：17/14 = 1.21× → 達成（≤1.5×）
- d5 首領勝率：96 / 92 / 93 / 88 / 84% → 達成（≥60%）
- 通膨：每趟深淵保留的裝備平均 1.2–1.8 件，中位數 1（死亡時只留 1 件，`RULES.death.keepBestItems`）。品質分布：一般 19–21%、普通 31–42%、精良 28–37%、精緻 4–11%、華麗 0–2%

## CP6 round 2b (2026-10-26)：單獨調整 d15 首領（全部 暫定；hpScale/dmgScale 維持 0.55）
- 先確認卡點（sim 新增每個深度的死亡分布，並固定印出 d5/d10/d15/d20/d25 首領）：d15 首領勝率只有 32–63%（刃鋒/秘術 32%），死亡集中在 d13（首領前的消耗）和 d15。卡在 d15 屬實。
| 嘗試 | 結果 |
|---|---|
| d15 首領 HP ×0.7 / ×0.5 | d15 勝率升到 48–77%，但最佳中位數仍是 14（玩家抵達時已被消耗，問題在受到的傷害，不在打得慢）→ 不採用 |
| **d15 首領傷害 ×0.6（`ABYSS.bossDmgAt[15]`）** | 採用，見下方 |
| d15 首領傷害 ×0.4 | 更容易，但 ×0.6 已達標，取影響較小的值 |
- 結果（×0.6，24 seeds × 5 趟；docs/logs/cp6-abyss-sim.txt）：
  - 5 趟後最佳中位數：auto 17 / 刃鋒 15 / 奔流 17 / 秘術 15 / 磐石 17 → 達成，但刃鋒和秘術剛好卡在 15
  - 第 1 趟中位數 10 / 10 / 10 / 9 / 9 → 達成；流派差 17/15 = 1.13× → 達成；d5 首領 96 / 92 / 93 / 88 / 84% → 達成
  - d15 首領勝率 78 / 68 / 73 / 82 / 88%
- **新的難度牆：d20 首領** 勝率 44 / 0 / 0 / 0 / 22%（樣本 n 只有 4–11）；d25 只有 auto 打到（n 4，勝率 0%）。另外死亡集中在 d16，也就是從 d15 checkpoint 出發後，進入 Nightmare 階的第一層。本輪不調整，待製作人決定。

## CP6 round 3（2026-10-26）：64 seeds × 10 趟，逐個首領調 bossDmgAt（全部 暫定；hpScale/dmgScale 維持 0.55）
驗收條件：5 趟後最佳中位數 ≥15；10 趟累計 d20 首領勝率每個流派 ≥25%（不得為 0）；第 1 趟 5–10 層；流派差 ≤1.5×；d5 勝率 ≥60%；曲線平滑，不能有單點難度牆。
| 設定（只有 d15=0.6 時為 base） | d20 首領勝率 auto/刃鋒/奔流/秘術/磐石 |
|---|---|
| base | 29.8 / 8.3 / 18.9 / 13.7 / 19.1% → 未達標 |
| **d20 ×0.6** | 38.9 / 34.7 / 47.1 / 41.7 / 41.5% → 採用 |
| d20 ×0.45 / ×0.35 | 45–64%，在 d20 形成一個凹陷，不平滑，不採用 |
- d25：在 d20 ×0.6 的條件下，d25 原本 0%（樣本 n 2–10），屬於單點牆，所以也加上 ×0.6。調整後 33 / 0 / 20 / 17 / 0%，但 **n 只有 2–9，統計上不可靠**。×0.4 和 ×0.6 的結果差不多，所以取影響較小的 ×0.6。
- 最終設定 `bossDmgAt = {15: 0.6, 20: 0.6, 25: 0.6}`；d5 和 d10 不調。
- 首領勝率曲線（n）：
  - d5 98.5(67) / 91.5(71) / 95.7(70) / 90.8(76) / 92.0(75)
  - d10 93.2(73) / 88.0(83) / 86.6(82) / 77.7(94) / 83.1(89)
  - d15 84.1(88) / 70.3(101) / 63.3(109) / 68.1(94) / 71.6(88)
  - d20 38.9(54) / 34.7(49) / 47.1(34) / 41.7(48) / 41.5(41)
- 5 趟後最佳中位數 17 / 15 / 15 / 15 / 15；10 趟後 19 / 17 / 17 / 17 / 17；第 1 趟中位數皆為 10；流派差 1.13×。
- 死亡深度：最集中在 d16（175–265 次，也就是從 d15 checkpoint 出發後進入 Nightmare 階的第一層，屬於一般怪），其次是 d18。這是階層門檻，不是首領；本輪按規則只調首領，留待製作人決定。完整數據見 docs/logs/cp6-abyss-sim.txt。
- sim 預設改為 N=64、T=10，並額外印出「best after 5 trips」。

## CP6 round 4（2026-10-26）：難度階跳升分 3 層漸進（決定 (c)，暫定）—— **未達標，不打 tag**
- 實作：`diffAt(d, key)` 會把 DIFF 的 hp/dmg/pl 從上一階分成 `ABYSS.tierRamp = 3` 層漸進加上，分別是 1/3、2/3、全額。每一階都套用同一規則。只在 RULES.cp6Abyss 開啟時生效，因為深淵只在這個旗標下存在。
- **難度階的起點和製作人範例不同**：程式中的難度階邊界來自 The_Tower.md:32-48，**Nightmare 從 d15 開始**，不是 d16（上一輪我回報「d16 是 Nightmare 第一層」是錯的；d16 其實是從 d15 checkpoint 出發後的第一層）。所以採用的版本是 d15 加 1/3、d16 加 2/3、d17 加全額。範例那種寫法（d16 加 1/3）我另外用 sim 參數 `tierRampOffset=1` 測過，結果見下方。
- 驗收：**d16 的死亡數仍是全塔最高**，兩種做法都一樣；另外 auto 第 1 趟中位數是 14，超過 10。
- 診斷（sim 新增每個深度的「進入次數與死亡率」）：
  - 就算把每一階的跳升整個移除（`tierRampOffset=50`，整座塔都低一階），d16 的死亡數仍是最高，死亡率約 43–50%。
  - 原因在於 d16 是每一趟從 checkpoint 15 出發時的第一層。卡在 best 15–19 的玩家會一再從 d16 重來，d16 的進入次數是 315–412，約為 d15 的 4–5 倍。
  - 換句話說，死亡數高主要是因為進入次數多，不是難度階跳升造成的。光靠漸進加上無法滿足「d16 死亡數不是最高」這項驗收。
- 64 × 10 的兩組種子（1–64 和 65–128；完整數據見 docs/logs/cp6-abyss-sim.txt 和 cp6-abyss-sim-seeds65-128.txt）：
  - 5 趟後最佳中位數：seeds 1–64 是 17/17/17/15/17，seeds 65–128 是 17/17/17/17/17。
  - d20 勝率：53–71% 與 37–74%。
  - d5 勝率 ≥87%。
  - 第 1 趟中位數 auto 14 ✗，其他流派 10。
  - 流派差 ≤1.13×。
- 漸進加上之後整體變簡單了（d20 最高到 74%），之後可能需要重新調 bossDmgAt。因為 d16 這項驗收不是 bossDmgAt 能處理的，本輪沒有重調。

## CP6 round 5（2026-10-26）：改用每次進入的死亡率驗收（程式數值與 7559867 相同）—— **未達標，不打 tag**
- 驗收定義（更新）：
  - 5 趟後最佳中位數 ≥15
  - d20 首領勝率 ≥25%
  - 第 1 趟中位數 5–10，只看刃鋒、oc、秘術、磐石；auto 是 14，已接受
  - 流派差 ≤1.5×
  - d5 勝率 ≥60%
  - d16 的「每次進入的死亡率」不能是全塔最高，且 ≤ 1.5 × d15、≤ 1.5 × d17
- sim 會按深度印出「進入次數、死亡次數、死亡率」，並附自動判定（CHECK / VERDICT）。
- 結果：A 組（seeds 1–64）和 B 組（seeds 65–128）都是 **FAIL**。只有以下兩項沒過，其餘全部 PASS：
  - **d17 是非戰鬥層**（d%5==2，見 abyssFloor），兩組的死亡率都是 0%（進入 136–192 次，0 次死亡）。所以「d16 ≤ 1.5 × d17」在任何數值下都不可能成立。
  - d16 ≤ 1.5 × d15 也沒過：d15 是首領層，但這裡只算從 d11 出發、一路打到 d15 的趟次，死亡率 14–25%；d16 是 49–61%。
| 流派 | A：d15 / d16 / d17 / d18 % | B：d15 / d16 / d17 / d18 % |
|---|---|---|
| auto | 13.9 / 61.0 / 0 / 61.8 | 17.6 / 59.0 / 0 / 60.0 |
| 刃鋒 | 25.3 / 50.6 / 0 / 73.1 | 18.4 / 53.5 / 0 / 76.2 |
| oc | 24.7 / 57.7 / 0 / 73.2 | 22.4 / 49.3 / 0 / 77.0 |
| 秘術 | 21.6 / 56.8 / 0 / 75.5 | 24.1 / 49.9 / 0 / 78.6 |
| 磐石 | 16.4 / 59.8 / 0 / 70.7 | 17.1 / 55.8 / 0 / 74.7 |
- d16 不是全塔最高：d18 和更深的層死亡率更高。完整的每層數據見 docs/logs/cp6-abyss-sim.txt 和 cp6-abyss-sim-seeds65-128.txt。

### 驗收改版（製作人 2026-10-26 第二次決定）
- d16 每次進入死亡率 ≤ 1.5 × d13 且 ≤ 1.5 × d18，且不得為全塔最高（d14 是休息層、d17 是非戰鬥層，都改掉）。
- 第 1 趟中位數門檻放寬為 5–12（四個流派；auto 不列入）。
- 數值未改動。重跑結果（A = seeds 1–64，B = 65–128），d13 / d16 / d18 %，d16/d13，d16/d18：

| 流派 | A | B |
|---|---|---|
| auto | 31.9 / 64.0 / 58.1，**2.01**，1.10 | 25.5 / 58.4 / 54.4，**2.29**，1.07 |
| 刃鋒 | 52.1 / 53.8 / 75.9，1.03，0.71 | 46.7 / 50.6 / 74.9，1.08，0.68 |
| 奔流 | 48.5 / 52.5 / 72.6，1.08，0.72 | 40.3 / 53.6 / 78.1，1.33，0.69 |
| 秘術 | 51.7 / 56.9 / 76.8，1.10，0.74 | 46.7 / 54.5 / 77.8，1.17，0.70 |
| 磐石 | 53.6 / 55.2 / 76.1，1.03，0.73 | 46.3 / 58.4 / 70.1，1.26，0.83 |

- 判定：只有 auto 的 d16 ≤ 1.5 × d13 不過（兩組皆然），其餘全過。依規則不硬調、不打 tag，待製作人決定 auto 是否列入此項。

### 判定範圍（製作人 2026-10-26 第三次決定）
- **所有平衡指標只看四個流派（刃鋒、奔流 oc、秘術、磐石）**；auto 只當參考，sim 中以 `INFO` 列出、不計入 VERDICT，也不計入流派差。
- 重跑（數值未改）：A、B 兩組 VERDICT 皆為 **ALL PASS**。auto 的 d16/d13 為 2.01（A）/ 2.29（B），僅供參考。

## rc4 備註

- **四流派 buff 使用率規則：** 見 docs/cp4-run-buffs.md §7-4（核心 B1/O1/A1/W1 不設上限、其他 ≤80% 通關組合、本流派被選率 ≥5%），四流派一律適用。
- **併回 main 時（尚未執行）：** `tests/buffcards.test.ts` 的 O4 韌魂門檻要改成 <1.25。原因：c7f60ec 的武器修正後實測值為 1.2308（=16/13），main 上舊的容差會失敗；bot/grok 已用 `tol = Math.max(0.02, 0.5 / a)`。現在不動 main。
- **sim 依流派選裝（7fb8014）：** 秘術用法杖、磐石用單手＋盾（W1 格擋／招架）；刃鋒用單手、副手自由（推定：B7 強化的 Merciful Blow 屬單手技能線）；奔流不限主手、盾自由，取主副手最佳組合（推定：文件沒有指定武器；強制雙手版 sim 未通關 97%，見 docs/logs/rc4-noclear-schoolgear-oc2h.txt）。主副手一起評估。`auto`、`human`、`buff:random` 維持原本逐格邏輯。

## rc6 項目 3：流派武器規則（sim 依流派選裝）

| 流派 | 主手 | 副手 | 來源 |
|---|---|---|---|
| 刃鋒 blade | 雙手（twoHand） | 不帶盾 | 風格定義：parsed_wiki/Fighting_Styles.md L86–88（Two-Handed）；流派↔風格對應為製作人決定，「暫定，無來源」 |
| OC | 單手（oneHand） | 不帶盾 | 製作人要求雙持；雙持定義見 Fighting_Styles.md L106–108（"two one-handed weapons"）。本遊戲無雙持：副手只收盾牌群組（src/core/constants.ts L255–264，F-003-base-groups）→ 改為單手無盾，「暫定，無來源」 |
| 秘術 arcane | 法杖（staff） | 不帶盾 | Fighting_Styles.md L146（Staff）；findings/001:64 引用同頁；對應「暫定，無來源」 |
| 磐石 bulwark | 單手（oneHand） | 盾 | Fighting_Styles.md L57–59（"single one-handed weapon (possibly in combination with a shield)"）；對應「暫定，無來源」 |

實作：`gearStyle()`（src/core/auto.ts），測試 tests/rc6-ai.test.ts。若持有物中沒有該群組武器，sim 才退用其他主手（既有行為）。

## rc6 項目 1：d16 牆調參紀錄（只動兩個旋鈕）

旋鈕（皆深淵限定、暫定，無來源）：A = `ABYSS.lvFollowK`（怪物等級追蹤 k，rc5 = 0.8，free = 4 不動）；B = `ABYSS.physResScale`（怪物 physMit 與正值物理 spec 的倍率，rc5 = 1）。
量測：`scripts/rc6-targets.ts 24 4`（四流派各 24 種子；首通 F20 時的角色打 d5 首領 ×4；深淵紀錄達 15 的角色打 d16 一般戰、d20 首領各 ×4；滿血、counter AI；新 UI-only AI）。目標（暫定）：d5 首領 ≥75%、d16 一般戰 ≥60%、d20 首領 ≥35%。原始輸出：docs/logs/rc6-targets-*.txt。

| 輪 | K | PR | blade d5/d16/d20 | oc | arcane | bulwark |
|---|---|---|---|---|---|---|
| R0（rc5 值，omni 參考 AI） | 0.8 | 1 | 58/11/0 | 59/45/10 | 98/74/48 | 51/22/11 |
| R0（rc5 值，UI-only AI） | 0.8 | 1 | 77/**3**/57 | 59/45/10 | 98/74/48 | 51/12/70 |
| R1 | 0.4 | 1 | 81/9/55 | 72/30/11 | 98/76/54 | 56/13/84 |
| R2 | 0.8 | 0.5 | 83/13/59 | 61/45/16 | 98/74/49 | 56/25/88 |
| R3 | 0.4 | 0.5 | 89/9/58 | 72/31/13 | 98/79/58 | 59/32/82 |
| R4 | 0 | 0.5 | 92/13/62 | 84/48/18 | 100/73/58 | 66/35/74 |
| R5（兩旋鈕極限） | 0 | 0 | 95/**28**/70 | 84/52/**18** | 100/73/59 | **68**/52/80 |

結論（已驗證）：兩旋鈕開到極限（怪物不追蹤等級、物理抗性全歸零）時，blade d16 仍只有 28%、oc d20 18%、bulwark d5 68%、bulwark/oc d16 52%，目標無法只用這兩個旋鈕達成。依指示停止，不硬調；旋鈕維持 rc5 值（K 0.8、PR 1）。
推論（未驗證）：d16 一般戰的牆不是物理抗性或等級追蹤造成（PR 0 只讓 blade 3%→28%），而 d20 首領反而比 d16 一般戰容易，原因可能是 d16 的多隻怪／tier ramp 帶來的數量與傷害；需另查原因後才能決定新旋鈕。

## rc6 項目 4：重新量測（前 = rc5，後 = rc6；新 UI-only AI）

| 項目 | rc5 | rc6 | 來源 |
|---|---|---|---|
| 12 趟內從未全通 F20：auto / blade / oc / arcane / bulwark（目標每流派 ≤10%） | 0 / 25 / 13 / 0 / 0 % | 0 / **6** / **78** / 0 / **3** % | docs/logs/rc4-schoolgear-noclear.txt → rc6-noclear.txt |
| 同上，omni 參考 AI（僅供對照） | — | 0 / 84 / 78 / 0 / 0 % | rc6-noclear-omni-reference.txt |
| 死亡組合掃描 必死 / 警告 / 相對必死 | 18 / 70 / 48 | **13** / 71 / **30** | rc4-schoolgear-deathcombo.txt → rc6-deathcombo.txt |
| CP4 使用率檢查 | PASS | PASS | rc6-cp4-buffs.txt |
| CP6 abyss-sim A / B VERDICT | ALL PASS / ALL PASS | **FAIL / FAIL**（A：oc best5、d20、d5，bulwark d5；B：oc best5/d20/trip1，blade、bulwark d5 等） | rc6-A.txt、rc6-B.txt |
| CP4+CP5 開、CP6 關 基線 | rc4-schoolgear 檔 | 改變（cp4-balance 的流派列），另存 docs/cp5-on-baseline-sim-rc6.txt；cp4-on-check.sh 指向新檔 | |
| vitest | 全過 | 221/221 | |

OC 退步原因（已驗證，診斷跑 rc4-noclear 32×12 只改 OC 選裝）：1H 無盾 78%；1H 可帶盾 25%；rc5 的自由選裝 13%（docs/logs/rc6-noclear-oc-diag-*.txt）。也就是項目 3「OC 雙持→本遊戲無雙持改單手、不帶盾」這條規則本身造成；未調任何數值，需製作人決定 OC 是否可帶盾或改其他武器。

## rc7 項目 2：OC 可帶盾（暫定）

製作人決定（暫定）：OC 用單手武器，可帶盾也可不帶，由 AI 依主手＋副手組合的戰力分數擇優（`gearStyle('buff:oc') = { main: 'oneHand', shield: 'free' }`，src/core/auto.ts）。取代 rc6 的「單手、不帶盾」。

## rc7 — d16 fix: (a) monster level, (c) sourced formula deviations

Harness: `scripts/rc7-targets.ts 16 4` (UI-only AI, N=16 chars × F=4 trips per school). Logs are in `docs/logs/rc7-*.txt`.
Targets: d5 boss ≥75%, d16 normal battle ≥60%, d20 boss ≥35%.

### (a) Monster level = player level
Source: parsed_wiki/Monster_Stats.md:33 ("monster_level = monster's level when it is spawned, equal to player's level") and Battles.md:220 ("Monster Level: Equal to player's level"). The Tower's floor × 10 (The_Tower.md:9) is not used.
The rc6 curve gave about Lv74–84 against a player around Lv15.
Verification: with player level, LPD 0, and scales 0.55, every school wins 100% at every depth. Level was the dominant cause.

Each tuning round below gives d16 battle win % for blade / oc / arcane / bulwark. LPD = 暫定，無來源 extra levels per depth; HS/DS = hpScale/dmgScale, 暫定，無來源.

| round | LPD / HS / DS | blade | oc | arcane | bulwark |
|---|---|---|---|---|---|
| rc6 | floor curve, 0.55 | 4 | 44 | 66 | 18 |
| a1 | 1 / 1 / 1 | 27 | 92 | 84 | 38 |
| a2 | 1 / 1.5 / 1.5 | 0 | 33 | 41 | 6 |
| a3 | 0.5 / 2 / 2 | 0 | 32 | 35 | 9 |
| a4 | 1 / 2 / 1.5 | 0 | 19 | 18 | 3 |
| a5 | 0.25 / 2 / 2 | 6 | 48 | 63 | 20 |
| a6 | 0 / 2 / 2 | 31 | 83 | 81 | 38 |
| a7 | 0 / 2.5 / 2.5 | 8 | 53 | 68 | 20 |
| a8 | 0.25 / 1.5 / 1.5 | 32 | 92 | 83 | 45 |
| c1 (+style passives) | 0.25 / 1.5 / 1.5 | 50 | 92 | 83 | 58 |
| c1 | 0.25 / 2 / 2 | 15 | 50 | 67 | 22 |
| c1 | 0.5 / 2 / 2 | 0 | 19 | 50 | 11 |
| **c2 (+monster adb level term removed)** | **0.25 / 1.5 / 1.5** | **70** | **92** | **83** | **64** |
| c2 | 0.25 / 2 / 2 | 22 | 58 | 68 | 35 |
| c2 | 0.5 / 2 / 2 | 0 | 16 | 40 | 12 |

After a8, oc and arcane met every target, while blade and bulwark still missed in d16 and d18 normal battles. That triggered (c). The theme-off diagnostic (LPD 1/1/1) gave blade 20% and bulwark 59%, so the theme is not the cause.

### (c) Sourced deviations
| # | deviation | source | code | action |
|---|---|---|---|---|
| 1 | Fighting-style passives not implemented: 2H Domino Strike, 1H Overwhelming Strikes, 1H Counter-Attack | parsed_wiki/Fighting_Styles.md:59-98; findings 002 lines 277-278 | src/core/battle.ts `stylePassive`, `counterAttack`, `STYLE_PASSIVES` | Implemented with the source formulas. The 4 ticks of Overwhelming Strikes are mapped to 4 player turns (暫定). Domino gives +1% OC per hit. Counter-Attack OC is once per turn. Its stun chance and weapon procs are not modelled. The bulwark riposte combo is kept on top. |
| 2 | Monster base damage had `+ level * 0.5` | Monster_Stats.md:56 (STR*2+DEX only, no level term) | src/core/monsters.ts `MON_ADB.levelTerm` (was in 4a8aefa) | Set to 0 (source). This affects all schools and the main tower; the new baseline files are separate. |
| 3 | 1H Block / 2H Parry proficiency bonuses (findings 002 (G)) | purchasable abilities in the original | player.ts `PROF_ADB` stand-in | Not changed: these are not innate in the original. |
| 4 | Block skipped for magic | Battles.md (block covers magic) | damage.ts:55 | Not changed: monster attacks are all physical, so there is no practical effect. |

Final row c2 0.25/1.5/1.5 in full (d5 boss / d13 / d16 / d18 / d20 boss):
blade 100/97/70/66/100 · oc 100/100/92/88/78 · arcane 100/89/83/88/94 · bulwark 100/83/64/58/89. All schools meet the targets.

### rc6 → rc7 (UI-only AI, rc7-targets 16 4; d5 boss / d13 / d16 / d18 / d20 boss win %)
| school | rc6 | rc7 |
|---|---|---|
| blade | 82/42/4/2/54 | 100/97/70/66/100 |
| oc | 81/78/44/42/30 | 100/100/92/88/78 |
| arcane | 97/70/66/55/43 | 100/89/83/88/94 |
| bulwark | 48/63/18/8/68 | 100/83/64/58/89 |

Pre-tag suite results (logs in docs/logs/rc7-*.txt):
- never-clear F20 within 12 trips, rc6 → rc7: blade 6→9%, oc 78→3%, arcane 0→0%, bulwark 3→3%, auto 0→0%.
- death-combo scan: 必死 0, 警告 34. rc6 had 必死 lines.
- CP4/CP5: the main-tower baseline changed (style passives and the adb term are shared). It is saved as the new file docs/cp5-on-baseline-sim-rc7.txt; the rc6 file is kept. First clear median went from 2 to 1, and the F10 boss win rate over trips 1-3 went from 84% to 98%.
- CP6 A/B: both FAIL on "trip1 median 5-12" (trip-1 depth is now median 25) and on "d16 ≤ 1.5 × d13". rc6 also failed CP6 A/B, on other checks. Early depths are now too easy; this is a known open item and was not retuned (outside the producer's scope).
- vitest: 221/221 passed when run alone. Under the parallel load of the suite, one cp3 acceptance test hit its 5 s timeout.

## rc8 item 2: CP4/CP5 acceptance on rc7 (the easier main tower is accepted)
The baseline is now `docs/cp5-on-baseline-sim-rc7.txt` (`scripts/cp4-on-check.sh`); the rc6 file is kept for history.
Reason: rc7 fixed sourced original-game formulas: the fighting-style passives (Fighting_Styles.md:59-98) and monster base damage without a level term (Monster_Stats.md:56). The user also wants a fast early game.
Key items in cp5-sim (counter AI, N=32 M=12), rc6 → rc7. Thresholds are in cp5-bosses-floors.md §4.2: counter ≥90%, ignore ≤ counter − 25pp and ≤70%.

| item | rc6 | rc7 | change |
|---|---|---|---|
| auto F5 boss gap (counter/ignore) | 100/67.9 (32pp, pass) | 100/83.6 (16pp) | **pass → fail** |
| blade F5 boss gap | 99.3/62.0 (37pp, pass) | 100/75.4 (25pp) | **pass → fail** (by 0.4pp) |
| bulwark F15 boss gap | 94.4/66.7 (28pp, pass) | 96.5/77.2 (19pp) | **pass → fail** |
| arcane F5 boss gap | 100/47.9 pass | 100/63.5 pass | still pass |
| oc counter win F10/F15/F20 | 81/58/33 | 99/87/54 | better (below 90 → F10 now ≥90) |
| blade counter win F15/F20 | 88/77 | 89/82 | better |
| first clear median (auto/blade/oc/arcane/bulwark) | 1/2/3/2/2 | 1/2/2/2/2 | oc faster |
| full clear median (auto/blade/oc/arcane/bulwark) | 3/4/—/4/3 | 2/4/6/4/3 | oc now clears |
| death-combo 必死 | some (rc6 log) | 0 | pass |

Every other gap item already failed at rc6 and is unchanged in kind. The three items that flipped from pass to fail do so because counter-play matters less once players hit harder (sourced passives). This follows from the accepted easier main tower and is not retuned.

## rc8 item 1: first-trip pacing (all knobs 暫定，無來源)
Allowed knobs only: LPD (levels per depth), HS/DS (HP/damage ×), TR (tier ramp), DPD (dmgPerDepth; the source is +2% per wave, Battles.md:261).
Each round runs `scripts/rc8-round.sh` (rc7-targets 16 4 plus cp6-abyss-sim 32 4) and is summarised by `scripts/rc8-table.py`. Logs are in `docs/logs/rc8/`.
Columns:
- battle win % for blade/oc/arcane/bulwark: d5 boss, d16 normal battle, d20 boss.
- abyss-sim trip-1 median depth for auto/blade/oc/arcane/bulwark (target 5-12).
- d16/d13 per-entry death-rate ratio, same order (target ≤1.5).

| round | LPD / HS / DS / DPD / TR | d5 boss | d16 battle | d20 boss | trip1 median | d16/d13 |
|---|---|---|---|---|---|---|
| rc7 | 0.25 / 1.5 / 1.5 / 0.02 / 3 | 100/100/100/100 | 70/92/83/64 | 100/78/94/89 | 25 (auto) | 3.11 (auto) |
| r1A | 0 / 2 / 2 / 0 / 3 | 100/100/100/100 | 80/97/86/70 | 100/95/98/97 | 27/27/20/20/39 | —/0.45/0.82/0.29/0.71 |
| r1B | 0 / 2 / 2 / 0 / 5 | 100/100/100/100 | 94/98/88/73 | 100/100/100/95 | 30/27/22/22/37 | —/0.31/0.33/0.00/0.00 |
| r1C | 0 / 2.2 / 2.2 / -0.01 / 5 | 100/100/100/98 | 91/95/89/73 | 100/97/100/95 | 30/27/17/24/42 | 3.49/0.00/0.68/0.49/0.50 |
| r1D | 0.25 / 1.8 / 1.8 / 0 / 5 | 100/100/100/100 | 75/94/88/63 | 100/91/98/89 | 22/22/17/19/29 | —/1.11/1.76/1.08/2.59 |
| r2A | 0 / 2.5 / 2.5 / 0 / 5 | 100/98/100/94 | 59/83/86/69 | 98/81/95/96 | 20/15/10/14/20 | 1.81/0.73/0.36/0.59/0.35 |
| r2B | 0 / 3 / 3 / 0 / 5 | 97/91/89/89 | 13/64/77/31 | 96/50/71/90 | 10/5/5/7/7 | 1.50/0.36/0.66/1.27/0.51 |
| r2C | 0 / 3.5 / 3.5 / 0 / 5 | 83/69/77/78 | 0/40/58/15 | 96/35/40/83 | 5/0/4/4/2 | 0.96/2.14/1.55/1.07/0.78 |
| r2D | 0 / 3 / 3 / -0.01 / 5 | 97/94/95/91 | 29/69/80/60 | 100/66/86/98 | 10/7/5/7/10 | 1.41/0.21/1.16/1.72/0.47 |
| r3A | 0 / 2 / 3.5 / -0.01 / 5 | 100/98/97/86 | 61/89/88/75 | 100/83/94/100 | 20/10/9/15/17 | 2.52/0.74/0.66/1.55/2.10 |
| r3B | 0 / 2.5 / 3.5 / -0.01 / 5 | 95/89/92/88 | 33/68/82/50 | 100/72/83/96 | 12/7/5/7/12 | 1.26/0.91/0.74/0.86/0.25 |
| r3C | 0 / 2 / 3 / -0.01 / 5 | 100/100/100/92 | 75/94/86/81 | 100/95/97/100 | 25/19/14/12/27 | 6.70/0.00/1.68/0.82/0.46 |
| r3D | 0 / 2.5 / 3 / -0.01 / 5 | 98/95/97/92 | 39/80/86/69 | 95/83/95/98 | 15/7/9/10/17 | 7.33/0.37/0.96/0.80/0.91 |
| r4A | 0 / 1.5 / 4 / -0.01 / 5 | 100/98/100/88 | 86/92/86/67 | 100/92/97/93 | 27/17/12/15/22 | 4.74/—/0.54/0.51/0.85 |
| r4B | 0 / 2 / 4 / -0.01 / 5 | 98/97/95/86 | 42/78/84/50 | 93/70/91/100 | 15/9/7/12/7 | 1.45/0.50/0.63/0.61/0.74 |
| r4C | 0 / 1.5 / 4.5 / -0.01 / 5 | 100/97/98/88 | 69/89/86/68 | 94/89/97/96 | 22/12/9/15/17 | 3.24/0.30/0.92/1.03/0.30 |
| r4D | 0 / 1.75 / 3.75 / -0.01 / 5 | 100/97/100/89 | 58/86/86/73 | 100/91/95/95 | 22/12/10/15/17 | 2.86/1.08/0.54/0.81/0.84 |

Findings from rounds 1-4:
- Abyss deaths occur only at fixed node depths (d1/3/6/8/11/13/16/18/…; elite or boss nodes). Normal battles almost never kill.
- Monsters follow the player's level, so trip-1 depth is set mainly by the flat HS/DS.
- A negative DPD moves pressure to shallow depths. It is capped at −0.01: at −0.0167 monster damage reaches 0 at d60.
- Blade's d16 normal battle is the binding constraint. Every config that puts the trip-1 median ≤12 for all schools (r2B, r2D, r3B, r4B) drops blade d16 to 13-42%. Every config that keeps blade ≥60 (r3A, r3C, r4A, r4C) leaves auto/arcane/bulwark trip-1 at 15-27.
- HP × hurts blade's d16 more than damage ×.

Round 5 (low HS / high DS):

| round | LPD / HS / DS / DPD / TR | d5 boss | d16 battle | d20 boss | trip1 median | d16/d13 |
|---|---|---|---|---|---|---|
| r5A | 0 / 1.25 / 5 / -0.01 / 5 | 100/98/98/89 | 67/89/88/75 | 95/92/98/95 | 25/17/9/17/17 | 0.92/0.84/1.21/0.59/0.49 |
| r5B | 0 / 1 / 5.5 / -0.01 / 5 | 100/98/98/91 | 88/94/88/79 | 100/91/92/95 | 27/19/15/17/25 | 4.02/0.29/2.18/0.80/— |
| r5C | 0 / 1.5 / 5 / -0.01 / 5 | 98/94/97/84 | 47/88/86/62 | 97/77/95/94 | 15/7/7/10/15 | 2.18/0.44/1.21/0.48/0.63 |
| r5D | 0 / 1.25 / 6 / -0.01 / 5 | 97/92/95/84 | 58/82/88/63 | 97/83/91/94 | 12/9/9/12/12 | 0.99/0.41/0.36/1.03/0.90 |

r5D comes closest: every trip-1 median is ≤12 and every ratio is ≤1.03. Blade's d16 battle is 58% (target 60, N=16x4, likely within noise; to be confirmed).

Round 6 (around r5D):

| round | LPD / HS / DS / DPD / TR | d5 boss | d16 battle | d20 boss | trip1 median | d16/d13 |
|---|---|---|---|---|---|---|
| r6A | 0 / 1 / 6 / -0.01 / 5 | 100/97/97/88 | 86/94/88/77 | 95/95/94/93 | 27/14/12/17/22 | 6.13/0.55/1.27/1.13/0.67 |
| r6B | 0 / 1.25 / 6.5 / -0.01 / 5 | 97/92/94/83 | 45/75/88/50 | 93/73/80/96 | 10/5/5/10/7 | 2.41/0.61/1.16/1.46/1.09 |
| r6C | 0 / 1 / 6.5 / -0.01 / 5 | 100/92/95/88 | 72/88/88/66 | 94/89/92/93 | 17/12/9/12/17 | 3.25/0.34/1.65/0.53/1.61 |
| r6D | 0 / 1.1 / 6 / -0.01 / 5 | 98/95/97/86 | 77/88/88/64 | 94/86/95/95 | 27/12/9/12/20 | 1.05/0.26/1.54/0.81/0.53 |

Round 6 does not improve on r5D. At N=32 the results move by about ±5 depths and ±10pp (for example, r5D vs r6D). Next step: confirm r5D at a larger N.

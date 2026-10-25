# hv-v3 設計文件：HV 刷寶爬塔（Roguelite）

> 數值與規則以 `.scratch/hv-v3/wayfinder/findings/001–005` 和 `src/core/data/constants.ts` 為準，並遵守 Clean Room 規則。標「暫定」的值是 findings 查不到、為了好玩先定的，可玩後實測再調整。

## 1. 核心循環
城鎮（換裝、配點、補給）→ 選塔出發 → 每層選一條路線、處理該節點 → 每 5 層打 Boss → 通關、撤退或死亡 → 把 EXP、熟練度和戰利品帶回城鎮 → 變強後爬更高。單趟大約 10–20 分鐘。

## 2. 塔與節點
- **兩座塔**：試煉之塔 10 層，對應原版 Arena 5／10 回合的結構；深淵之塔 20 層，打通試煉之塔後解鎖。
- **層級強度**：怪物 PL 隨層數上升，`PL = 塔基準PL × (1 + 0.08 × 層數)`（暫定）；試煉之塔塔基準 PL = 40（暫定，findings 無出處，製作人定案保留）。深淵之塔的基準 PL 是試煉之塔的 2 倍。
- **路線**：每層出現 2–3 個節點，由玩家選一個；用固定種子產生，可以重現。
- **節點權重**：戰鬥 45%、精英 12%、寶箱 10%、商人 10%、休息 13%、祭壇／事件 10%。
  - 第 1 層一定是戰鬥。
  - 第 4、9、14、19 層一定有休息可選。
  - 第 5、10、15、20 層固定是 Boss。
  - 同一種節點不連續出現 3 次。
- **各節點內容**
  - **戰鬥**：一場 1–3 波，每波 1–4 隻怪。
  - **精英**：一隻高 PL 怪加隨從，掉寶率更高。
  - **寶箱**：掉 2–3 件裝備，品質偏高（與下方單機加速一致；暫定）。
  - **商人**：賣藥水和 2–3 件裝備，也能收購裝備。
  - **休息**：二選一：恢復 50% HP／MP／SP，或「簡化道具界」——一件裝備 +1 IW 等級（見第 5 節）。
  - **祭壇／事件**：付出代價換一個 buff，見第 6 節。

## 3. 戰鬥（純回合制，不等讀條）
- **流程**：玩家下指令 → 依攻擊速度判斷是否觸發額外行動 → 所有怪物依序出手 → 回合結束。每個動作的動畫控制在 0.3 秒以內，可以 2 倍速或跳過。
- **指令**
  - 攻擊：選一個目標。
  - 技能：消耗 Overcharge／SP，例如 constants 裡的 shieldBash、vitalStrike、mercifulBlow。
  - 法術：消耗 MP，先做火、冰、雷、風、聖、暗各一招，加上治療。
  - 道具：healthPotion、manaPotion、spiritPotion。
  - Spirit Stance 開關：開啟後消耗 SP 換傷害加成，開啟當回合不自然回復（findings 002）。
  - 撤退：只能在節點之間撤，戰鬥中不能逃。
- **傷害判定**：照 Whiff → Absorb → Evade → Parry → Block → Resist → 多段暴擊 → 減傷（物理三系、六元素）→ 亂數骰，寫成純函式 `resolveHit()`。每一步都有專屬的跳字和特效，例如 MISS、PARRY、BLOCK、RESIST 50%、CRIT×2。
- **衍生數值**：由六圍、熟練度和裝備詞綴（constants 的 attackDamage、parry、block、evade、resist、各屬性減傷、burden、interference）推算。SP 公式為 `(1+六圍和/5)`（findings 002）。
- **怪物 AI**：會依種族屬性選物理或元素攻擊；Boss 有可預讀的蓄力大招，讓玩家有理由選擇防禦或喝藥（暫定）。

## 4. 怪物選擇
- 依 `PL ± 15%` 從 `monsters.json` 篩選怪物（範圍內無怪時依序放寬到 ±25%、±40%），同一場戰鬥優先同種族。
- 攻擊屬性和 9 種抗性直接讀資料，種族參數讀 `constants.ts`。
- 精英和 Boss 取該塔該層 PL 區間的最高 10% 怪物，並套用 HP 倍率（暫定：精英 2.5 倍、Boss 5 倍）。
- 美術：有 beast 和 undead 兩組圖，依種族對應；其他種族先用換色或縮放代替。

## 5. 掉寶與品質
- **掉落判定**照 findings 003：
  - 先擲 `Loot = 0.10 + clamp((PL−500)/5000, 0, 0.15)`；
  - 成功後再判斷是否為裝備，原版是 2.5%；
  - 失敗則有 20% 機率改掉金錢。
  - 掉落物分布：恢復藥 35%、水晶 35%，其餘再分。
- **單機加速**（暫定）：每隻怪的裝備率 ×8；精英一定掉 1 件；Boss 和寶箱各掉 2–3 件，對應原版 Arena 的通關獎勵。
- **品質**：先擲 R，再用 `(R/200)^1.52` 決定 Crude～Peerless 的區間。每 5 層下限品質提高一階（暫定），之後從 579 列裝備基底依詞綴範圍擲值；裝備等級等於怪物等級。
- **簡化道具界**：每 +1 IW 解鎖 1 級鍛造上限並 +1 CP，提升照 findings 003 的 iwCoeff 計算，消耗金錢和水晶。

## 6. 局內暫時 Buff（只在本趟有效）
- 祭壇選項舉例：
  - 扣 20% 最大 HP，換暴擊 +10%；
  - 付金錢換 +1 掉寶品質階；
  - 詛咒「怪物 +20% PL」，換 EXP 與掉寶 ×1.5。
- 拾取：Battle Powerup 寶石（擊殺時 4%，findings 003），本場有效。
- 同一趟最多 5 個 buff，回城清空。

## 7. 城鎮與經濟（findings 004）
- **配點**：自由 EXP 預算制，六圍成本照 `Attr_Total_EXP(S)` 計算，可以退點。
- **等級**：照 Cumulative_EXP 公式。
- **熟練度**：依使用的武器、法術和護甲類別累積。
- **設施**
  - 商店：買藥、賣裝。
  - 鍛造：用水晶和金錢升級，表格照 findings 003。
  - 倉庫：無上限。
- **資源來源**：金錢只靠賣裝、怪物掉落和通關獎勵產出，沒有課金項目。

## 8. 死亡與撤退
| 結局 | EXP／熟練度 | 金錢 | 本趟裝備 | 消耗品 |
|---|---|---|---|---|
| 打倒 Boss 後回城 | 100% | 100% | 全部帶回 | 保留 |
| 節點之間撤退 | 100% | 100% | 全部帶回 | 保留 |
| 死亡 | 50% | 50% | 只保留最好的 1 件 | 失去 |

身上原本穿的裝備一律不會掉。

## 9. UI 與爽感設計
- **畫面**：城鎮、選塔、路線地圖、戰鬥、節點事件、本趟結算、換裝（新舊對比加綠紅箭頭）。
- **操作**：滑鼠點選，或鍵盤 A／S／M／I 加數字鍵快速指令。
- **戰鬥手感**：受擊頓格 60ms、畫面震動、暴擊放大跳字、連段計數。
- **掉寶演出**：依品質發不同顏色光柱；高品質慢動作加音效，並跳出「比目前裝備更好」的提示。
- **成長回饋**：結算畫面讓戰力分數往上跳，地圖顯示「最高到達層數」。

## 10. MVP 與之後再做
- **MVP**
  - 試煉之塔 10 層、6 種節點、回合戰鬥與完整傷害鏈。
  - 物理攻擊、3 個技能、6 個法術、3 種藥水。
  - 掉寶與品質。
  - 城鎮：配點、換裝、商店。
  - 存檔（localStorage）、README。
- **之後**：深淵之塔、完整鍛造、Soulbind／Charm、更多事件、音效、平衡工具。

## 11. 里程碑與測試
- **M0 骨架**：建立 `index.html` 和 Phaser 場景。測試：`npm run build` 通過。
- **M1 核心數值**：衍生屬性、`resolveHit`、EXP、配點成本。用 findings 的已知數值寫 Vitest。
- **M2 掉寶**：品質曲線、詞綴擲值、掉落率。用固定種子跑 10 萬次統計測試。
- **M3 塔生成**：節點規則和 Boss 層。測試保證每層都有可走路線。
- **M4 戰鬥畫面**：回合流程、指令、AI。測試：無頭模擬一整場戰鬥。
- **M5 城鎮與存檔**：存檔讀檔往返測試。
- **M6 爽感與平衡**：用自動模擬確認「第 1 趟到第 5 層，第 3 趟能通關」，最後寫 README。

## 12. 待確認問題
1. 單機掉寶加速倍率 ×8 可以接受嗎？
2. 死亡懲罰要「保留 50%」，還是更嚴格？
3. MVP 要不要包含鍛造，還是只做休息點的 IW 強化？
4. 只做桌機，還是也要支援手機？
5. 難度要不要做原版的 7 階難度，配上 EXP 倍率？

## 第 5 輪暫定值（bot/grok）

以下數值沒有 findings 出處，全部為「暫定」，用 `npx tsx scripts/difficulty.ts 20 15` 量測調整：

- 戰鬥開場 OC：0 → 25（`P-oc-start`）。新角色可立刻用盾擊，3–5 次攻擊後能開 Spirit Stance。
- Boss 傷害倍率：×1.3 → ×0.6（`RANK_MULT.boss.dmg`）。
- Boss 蓄力重擊：×3 → ×2（`BOSS_CHARGE_MULT`）。
- 1–5 層裝備最低品質：crude → fair（`floorMinQuality`）。
- 前 4 層保底 1 件裝備（`RULES.earlyEquipByFloor`）。
- 寶箱掉 2–3 件裝備。
- 自動換裝門檻：戰力需提高 5% 以上（`AUTO_EQUIP_MARGIN`），只用於模擬器。

## 第 6 輪暫定值（bot/grok）

- Spirit Stance 開啟條件：OC ≥ 25 且 SP ≥ 1（`P-spirit-min-oc`；findings 的 50 仍保留在 `F-002-spirit-stance`，此處覆寫）。
- 生命藥水冷卻：10 回合（`P-health-potion-cd`）；法力／靈力藥水維持 findings 的 40 回合。
- 第 10 層 Boss 戰的隨從最多 1 隻（原本 2 隻）。
- 動畫時間縮放 `Stage.ANIM_SCALE = 0.55`，讓 1x 時每個動作 ≤ 0.3 秒（§3）；另有 2x、4x 與「跳過動畫」。

## CP2 暫定值（好玩與節奏）

全部為 **暫定**，可再調；程式內同樣標註 `暫定 CP2`。

| 項目 | 值 | 原值 | 位置 |
|---|---|---|---|
| Boss HP 倍率 `RANK_MULT.boss.hp` | 2.5 | 5 | src/core/monsters.ts |
| EXP 倍率 `RULES.expMult` | 8 | 6 | src/core/run.ts |
| 6–9 樓怪物強度 `MID_FLOOR_MULT` | HP ×1.0、傷害 ×1.05 | 無 | src/core/run.ts |
| 戰鬥中 HP 自然回復 | 0（無資料來源，紀錄仍顯示 HP +0） | — | src/core/battle.ts |

弱點：直接取 monsters.json 各列的負值屬性抗性（傷害公式 `(1 - spec)` 已自然放大），**沒有另加任何弱點加成**。
缺資料（未發明）：弱點額外倍率規則、Boss 專屬弱點機制、戰鬥中 HP 自然回復來源。

## CP2b 暫定值（試玩回饋修正）

全部為 **暫定**；程式內標註 `暫定 (CP2b)`。難度以 `npx tsx scripts/difficulty.ts 20 15` 量測，需 `auto` 與 `human` 兩種策略都達標。

| 項目 | 值 | 先前 | 位置 |
|---|---|---|---|
| Boss HP 倍率 `RANK_MULT.boss.hp` | 2.2 | 2.5（CP2）／5 | src/core/monsters.ts |
| 6–9 樓每波怪數上限 | 2 | 3–4 | src/core/run.ts `encounter` |
| `MID_FLOOR_MULT`（6–9 樓） | HP ×1.2、傷害 ×1.0 | HP ×1.0、傷害 ×1.05 | src/core/run.ts |
| `EARLY_FLOOR_MULT`（1–4 樓，新增） | HP ×1.4、傷害 ×1.8 | 無 | src/core/run.ts |
| EXP 倍率 `RULES.expMult` | 8（不變） | 8 | src/core/run.ts |
| 真人策略 `HUMAN_COMBAT_SHARE` | 0.5（HP ≥ 55% 時有一半機率選戰鬥節點） | 新增 | src/core/auto.ts |

模擬策略：
- `auto`：原自動玩家（會用靈動架勢與 OC 技能、偏好戰鬥／精英路線）。
- `human`：不用靈動架勢與 OC 技能；目標若對某法術屬性為負抗性就施放該法術，否則普攻；Boss 蓄力時防禦（HP < 60% 改喝藥）；HP < 40% 喝藥；路線上 HP < 55% 一律選非戰鬥節點，否則一半機率選戰鬥。
- `avoid`（參考用）：與 human 相同戰鬥方式，但只要有非戰鬥節點就不選戰鬥。

生命藥水冷卻：維持 `P-health-potion-cd` = 10。喝下後接下來 10 個行動不可用，按鈕依序顯示 冷卻10 … 冷卻1（單元測試與 e2e 已驗證）。切換靈動架勢是免費行動，不消耗冷卻；每場戰鬥開始時冷卻歸零。

## CP3：數值回原版 + 前期解鎖（bot/grok）

### A. 回原版（有出處，鎖測試 tests/cp3.test.ts，改動需製作人同意）
- 靈動架勢門檻 OC 50、每回合 1 SP + 10 OC、不足自動關閉（F-002-spirit-stance）。原「暫定 OC 25」作廢。
- 戰鬥開始 OC 0（P-oc-start）。
- EXP 倍率 ×1（P-exp-multiplier）。EARLY_FLOOR_MULT / MID_FLOOR_MULT 已刪除。
- 賣價依 findings/005 003-04e（F-005-003-04e-sell；findings 內標暫定）。CP3-fix 1：照 003-04e 原文實作，Superior 只賣 100C（1 Low ×200 ×50%），比 Average 便宜。改為玩法層保底（見下表），材料價與分解數量不變。
- 藥水店 50/100/100（findings/004）。生命藥水冷卻 10 = assumed（HVP potion 10）；魔力/靈力 40（F-002-4.1A）。

### B. 玩法層暫定值（無出處）
| 項目 | 值 |
|---|---|
| 首領/精英擊殺 EXP 倍率 RULES.rankExp | ×8 / ×3（CP3-fix 3，原 ×5 / ×2；原公式不變） |
| 塔內商人裝備價 RULES.merchantMarkup | 賣價 ×1.25（CP3-fix 1：原 ×3.5，Average 約 8,845C ≈ 5 趟收入，太貴） |
| Superior 以上賣價保底 SELL_TIER_STEP | max(分解價, Average 公式（不設 5,000 上限）× 1.2^(品質−Average)) — 品質越高賣價不降 |
| 帶回倍率 CARRY_MULT | CP3-fix 3：第 1 趟 ×5、第 2 趟 ×3、第 3 趟起 ×2（原 3/2/1；EXP、Credits、熟練度）。sim 第 1/2/3 趟後平均 Lv 約 4/7/9（原 2.4/4.1/4.9），首通中位數 3→2 |
| 每層等級 TOWER.levelPerFloor | 3 → 2（為了首通中位數落在第 3 趟） |
| 奇數層 1/3/7/9 只有戰鬥/精英；偶數層只有非戰鬥；營火 4/8 | 防避戰：任一路線不會連續 2 個非戰鬥 |
| 第 1 趟教學塔 | F2 只有戰鬥、F3 固定商人（送祕法書＝解鎖法術 + 300C）、F4 單隻精英且有元素弱點 |
| 城鎮商店開放前的藥水 STARTER_POTIONS | CP3-fix 2：每趟出發補到 生命3／魔力2／靈力1（死亡會清空藥水，而商店第 2 趟回城才開） |
| F3 教學禮 F3_GIFT_POTIONS | CP3-fix 2：加送 2 瓶生命藥水（另 300C 可在 F3 商人買藥水） |
| 第 2 趟起 | 保證 1 個神龕 |
| 城鎮道具界 | 首次打倒 F10 首領解鎖；第一次免費，之後 200 ×（目前 +N + 1）C |

### CP3-fix 4：靈動架勢
解鎖條件（第一次到達 F4）不變；第 2 趟 F5 已解鎖。按鈕變灰是有出處的 OC ≥ 50 門檻（戰鬥開始 OC 0、每次命中 +5–10，技能／防禦／專注都花 OC）。按鈕現在顯示「OC n/50」，滑鼠提示說明怎麼累積。

### CP3-fix 8：首領第二階段（暫定）
| 值 | 暫定 |
|---|---|
| RULES.bossPhases | 1（首領 HP 歸零時以第二階段復活，不會死） |
| BOSS_PHASE_HP | 第二階段回到最大 HP 的 30% |
| BOSS_ENRAGED_EVERY | 第二階段狂暴：每 3 回合蓄力一次（原 4） |
怪物原始數值、RANK_MULT 不變。sim（16 種子，第 1–3 趟所有首領戰）打對弱點 F5 9.4→12.8 回合、F10 8.9→13.4 回合；不打弱點 F5 22.8→27.4 回合（勝率 98%）、F10 14.4→20.9 回合（勝率 69%）。

### CP3-fix 9：成長
沿用 CP3-fix 3 的帶回倍率 5/3/2 與首領/精英 ×8/×3（原 EXP 公式不變）。sim 第 1/2/3 趟後平均 Lv：打對弱點 4.9/7.6/9.3、auto 4.8/8.4/9.9、避戰 4.4/6.9/8.6、不打弱點 3.6/5.8/7.3（CP3-fix 前 2.4/4.1/4.9）。

### CP3-fix 10：首領戰意（暫定）
OC 起始 0 與靈動架勢門檻 50 是原版值，不改。玩法層加 run buff：解鎖靈動架勢後，首領戰開場 OC +50（RULES.bossOpenOc），一開場就能進架勢。一般戰鬥仍從 0 開始。sim 第 1–3 趟：首領戰使用率 100%，全部戰鬥約 26–30%（改前 0%）。

### CP3-fix 11：怪物外型
舊版只有 beast/undead 兩組圖＋換色，且 Avion/Elemental 也畫成獸。改為 scripts/gen-monsters.py 程序生成 8 種外型：鳥、蟲、獸、亡靈（骷髏）、機械、龍、人形、精靈（能量球）。
對應（src/core/bodies.ts，只用 monsters.json）：先看名字裡的明確英文關鍵字（phoenix/hawk→鳥、spider→蟲、dragon→龍、skeleton→亡靈、robot→機械、wolf→獸…），否則用種族：Avion→鳥、Arthropod→蟲、Beast→獸、Undead→亡靈、Mechanoid→機械、Dragonkin/Reptilian→龍、Giant/Humanoid/Daimon→人形、Elemental/Celestial/Sprite→精靈。44,382 隻中 508 隻由名字關鍵字決定。
sha256 比對：docs/cp3fix11-hash-check.md（與舊專案相同 0）。

### 系統解鎖清單（10 項）
防禦、藥水（F1 第一場）→ OC 技能（F2）→ 法術、塔內商人（F3）→ 靈動架勢（F4，OC 到 50 提示）→ 屬性配點（第 1 趟回城）→ 神龕（第 2 趟出發）→ 城鎮商店/出售（第 2 趟回城）→ 道具界（首次 F10 首領）。
CP3 前的舊存檔沒有進度欄位，視為老玩家：除道具界外全部解鎖。

## CP3-fix 12：UI 可讀性（暫定）
- 戰鬥列攻擊／防禦／專注／架勢、三個技能、三種藥水都有 32px 圖示（scripts/gen-icons.py 程序生成）。
- 不可用按鈕：圖示灰階變暗、深色斜紋底、虛線框、原因文字紅色；文字保持可讀（不再只靠 opacity）。
- 地圖節點符號 26–30px＋陰影；走過的節點填色並標「✓ 走過」，略過的灰階淡出。修正帶回倍率提示改用 carryMult（5/3/2）。
- 道具界每列顯示 +n → +n+1 與每個會變的數值「前 → 後」（effectiveStats 以 iw+1 試算）。

## CP4 Run Buffs（暫定，旗標 RULES.cp4RunBuffs，預設關）

詳見 docs/cp4-run-buffs.md §10–§12。Step 6 調參值：Boss 勝利 1 次三選一、elite 每 2 次勝利 1 次、同流派權重 4、Boss HP 每個 buff +6%。全部暫定。

### CP4 磐石修正（暫定，決策 2026-10-25 #1）
| 值 | 暫定 | 位置 |
|---|---|---|
| 磐石組合「防禦後下一擊」倍率 | ×1.5（原 ×1.3） | battle.ts `BULWARK_COUNTER_MULT` |
| 磐石組合「格擋、閃避或招架後反擊」 | 普攻公式（physHit）×0.8 | battle.ts `BULWARK_RIPOSTE_MULT` |
| nocore-nofloor 對照組 | 只在 sim 使用，關掉兩項核心保底 | buffoffer.ts `coreFloor` |

32 種子 sim 的結果見 docs/logs/cp4-r3-sim32-bulwark-riposte-nofloor.txt。cp3-pass3 之後重跑，輸出逐位元相同。持有 ≥5 個 buff 時的 F10 首領：

| 流派 | 勝率 | 平均回合 |
|---|---|---|
| 磐石 | 97% | 14.3 |
| 劍 | 91% | 13.3 |
| OC | 91% | 13.8 |
| 奧術 | 95% | 13.1 |

## CP3 polish（bot/grok，全部暫定）
- 怪物名詞表擴充：TRAIT_WORD 12→24（新增 刃棘晶毒鐵冠尾眼血鬃鐮蹄），每種體型名詞 4→6（新增各 2 個），皆為本專案自創、暫定。44,382 列的相異名稱 4,382→9,856。體型對應（nounBody）不變，精靈圖不變；數值欄位不動。
- 同一場戰鬥同名怪物加 A/B/C…（`markDuplicates`，暫定）。nounBody 會先去掉尾端字母。
- Boss 稱號分隔符「·」→「・」；頭頂標籤移除 ♛（已有稱號），菁英保留 ☠。
- 帶回倍率 ×1 的趟次也顯示（地圖提示與結算）。戰鬥紀錄字體 12→14px。遭遇訊息經 esc()。
- 以上皆不影響模擬：cp4-off-check 與 docs/cp4-baseline-sim.txt 相同（未更新基準）。
- 裝備名稱中文化（src/core/equip-zh.ts，翻譯皆暫定）：格式「品質・[後綴之][前綴][基底][部位][+強化]」，例「精良・三重祝福之板甲鐵手套+2」。來源英文鍵值與名稱（F-003-*）保留不動，原英文名改由 equipNameEn() 產生；名稱生成不讀寫數值，cp4-off-check 相同。

## CP5 Boss／詞綴／20 層塔（RULES.cp5Bosses，預設關）

全部數值暫定，定義在 `src/core/cp5.ts` 的 `CP5`。flag 關閉時 `docs/cp4-baseline-sim.txt` 相同。
sim：`npx tsx scripts/cp5-sim.ts 32 12`（輸出 docs/logs/cp5-sim.txt）、`npx tsx scripts/cp5-deathcombo.ts 32 12`（docs/logs/cp5-deathcombo.txt）。
兩個 script 都可以在最後加 `key=value` 覆寫 CP5 值來試調。

### 調整紀錄（sim tune r1，32 種子，≤12 趟，退場線 HP<30%）
| 值 | 原暫定 | 現暫定 | 理由 |
|---|---|---|---|
| thornsEvery / thornsTurns / thornsFrac | 4 / 2 / 0.4 | 3 / 3 / 1.0 | 原值每次反傷約 21，ignore 與 counter 勝率差 0–1pp |
| drainEvery / drainFrac | 2 / 0.5 | 1 / 1.0 | 原值 F20 counter 勝率反而低於 ignore |
| splitHp | 0.25 | 0.15 | 分裂組合是最常見的必死組合 |
| frostMult（新） | — | 0.75 | 冰霜近戰走魔法減傷，繞過物理減傷 |
| doubleHp（新） | — | 0.8 | 雙詞綴精英 HP ×0.8 |

### 結果（現值；counter 和 ignore 從同一個 Boss 戰快照出發，比較配對結果）
| 指標 | 目標 | 結果 | 達標 |
|---|---|---|---|
| 首通（F10 勝）趟數 | 2–3 | 中位數 2（五流派都是），平均 1.9–2.8 | ✅ |
| 20 層全通趟數 | 6–10 | 中位數 auto 6、blade 10、oc 12、arcane 10、bulwark 5；12 趟內沒全通：1/14/15/9/0 人 | ⚠️ 只有 auto 和 arcane 在範圍內 |
| B5 counter 勝率 ≥90%、差距 ≥25pp | | 100%；差距 42–52pp | ✅ |
| B10 | 同上 | 93–99%；差距 4–11pp | ❌ 差距不足（文件規定護盾不懲罰物理，ignore 只限制單一元素） |
| B15 | 同上 | 86–95%；差距 2–5pp | ❌ |
| B20 | 同上 | 55–80%；差距 2–15pp | ❌ counter 也太難 |
| Boss 回合數（第 2 趟以後）10–15 | | B5 11–15.5、B10 8–12、B15 10–13、B20 9–12.6 | 大致達標，B10 auto 8.0 偏短 |
| 第 1 趟 Boss ≤18 回合 | | F5 25–29 | ❌（沿用 CP4 已知問題） |
| 必死組合 = 0 | | 絕對值（<50%）58 組；比無詞綴對照低 25pp 以上的有 4 組 | ❌ 無詞綴對照在 F13/F18 本身只有 46–78% |

### 需要製作人決定
1. 必死組合的定義：快照取自「第一次到達該層」的角色，所以無詞綴精英的勝率本來就只有 46–78%。要改成用無詞綴對照的相對值，還是降低 F11–20 精英的基礎強度？
2. B10、B15、B20 的 ignore 懲罰不夠。可以加入應對獎勵（例如暈眩打斷吸血後 Boss 破綻 1 回合），或讓 ignore 的定義更嚴格。
3. 全通趟數：blade 和 oc 兩派偏慢（中位數 10–12 趟，近半數 12 趟內沒全通）。

## CP4 rc balance (2026-10-25, all values 暫定)

Tools:
- `scripts/cp4-balance.ts N M [knobs]`: N seeds × M trips per school.
- `scripts/cp4-duel.ts N K [knobs]`: the same characters, each given an equal 3-buff set per school, fight K F9 elite / F10 boss encounters.
- `scripts/cp4-knobs.ts`: sim-only overrides. `play=school` makes 刃鋒/奔流/磐石 attack instead of casting at weaknesses.

Changes:

| Knob | Before | After |
|---|---|---|
| ELITE_OFFER_EVERY | 2 | 3 (an offer on the 1st, 4th, … elite win) |
| B1 物理傷害 | +12% | +20% |
| B2 物理傷害 | +10% | +15% |
| 刃鋒 3-buff combo 連斬 | 暴擊 OC +5 | also ×1.5 physical damage vs elite/boss (`BLADE_BIG_GAME`) |
| 磐石反擊 riposte | ×0.8, every block/evade/parry | ×0.5, first per enemy phase |
| W1 格擋 | +5% | +3% |

Tower shield stats are sourced and were not changed. With the flag off, `difficulty.ts 16 8` is byte-identical to `docs/cp4-baseline-sim.txt`.

Campaign sim, 64 seeds × 8 trips, human play (the same tactics for every school):

| School | 1st F10 win, before → after | Cleared within 8 trips | F9 elite win | Median buffs at 1st clear |
|---|---|---|---|---|
| 刃鋒 | 83% → 88% | 100% | 66% | 5 → 4 |
| 奔流 | 83% → 81% | 100% | 65% | 5 → 4 |
| 秘術 | 88% → 88% | 98% | 63% | 5 → 4 |
| 磐石 | 86% → 83% | 100% | 68% | 5 → 4 |

The gap between schools went from 5pp to 7pp, under the 15pp target. The 32-seed run before the change showed 78–94%.

Duel, 32 chars × 6 fights, each set played its own way:

| Set | F9 elite win, before → after | F10 win, before → after | F10 win with tower shield, before → after |
|---|---|---|---|
| 刃鋒 | 26% → 35% | 73% → 80% | 81% |
| 奔流 | 21% | 71% | 69% |
| 秘術 | 74% | 80% | 84% |
| 磐石 | 39% → 32% | 89% → 86% | 91% (97% with the human-play duel) → 88% |

Known limit: attack-only play vs the F9 elite is a base-game issue.
- With no buffs, attack-only play wins only 21%, while weakness-spell play wins 69%.
- In losing fights the elite (~1000 HP) is still at full HP when the player dies around turn 8.
- Even +100% physical damage lifts 刃鋒 only to 42%.
- Fixing this needs elite/base values, which would change the flag-off baseline, so they were not touched in CP4.

# Ticket 003：HentaiVerse 裝備基底、詞綴範圍、The Armory 鍛造系統、五大戰鬥模式與怪物資料庫完整考證報告

> 2026-10-22 已依 [audits/audit-003.md](../audits/audit-003.md) 修正；修正處附 sources/ 出處。

- **關聯決策票**：`003-equipment-affixes-forge-and-battle-modes-audit`
- **前置依據**：`001-public-sources-and-open-source-tools-census`、`012`（拍板以 `v0.91 The Armory` 世代為主體，並於 WIP 區段與基礎範圍底層對照 `v0.86 The Forge`）
- **下游消費票**：`004`（經濟循環與市場依賴）、`005`（空白缺口最小補齊）、`006`（單機化改造）
- **查證日期**：2026-10-22
- **Clean Room 邊界聲明**：本報告完全基於公開網路資源（Wayback Machine 保存之 `ehwiki.org` 2024–2026 快照、`anon962/AmyBotV2`、`Trendymen/hentaiverse`、`SukkaW/AmyBot`、`dodying/UserJs`、`anon962/HvLogV3` 與 `SukkaLab/hv-monster-data` 的 44,431 筆實測怪物 JSON）獨立考證並交叉驗證，未讀取本機任何舊世代專案目錄或本地記憶庫，亦未連線原版遊戲伺服器。

---

## 零、執行摘要與核心引擎規格對齊結論

1. **裝備數值雙世代對映（v0.91 正規化 `0–250` 骰值 ↔ v0.86 浮點範圍表）**：
   - 在 **v0.91（The Armory）** 中，裝備生成改為「先骰品質（Quality），再於該品質的正規化整數／浮點區間 `[Min_R, Max_R]`（總範圍 `0–250`，Peerless 為 `200`、Ultimate 為 `250`）獨立擲出各屬性基礎骰值 $R_i$」。
   - 有對應 **Binding（共 38 種，百科稱 39 種含舊稱）** 的屬性各自獨立擲骰；**無對應 Binding 的妥協與衍生屬性**（`Burden`、`Interference`、`Attack Speed`、`Casting Speed`、`Attack Crit Damage`、`Spell Crit Damage`、`Mana Conservation`、`Counter-Resist` 及武器特效機率／持續時間），其骰值直接取該裝備所有具 Binding 屬性骰值的算術平均 $\bar{R} = \frac{1}{k}\sum_{i=1}^k R_i$（出處：[The Armory#Ranges](https://ehwiki.org/wiki/The_Armory#Ranges)、`anon962/AmyBotV2` 之 `infer_equip_stats.py:69-85`）。
   - 每個基底與詞綴組合的實際 Lv.0 基礎屬性（`Base_Stat`），由 `Equipment_Ranges_*` 四子頁與 `hvUtils.js` `$equip.pmax` 記載的 `Roll:[Roll_Min, Roll_Max]` 及屬性波動係數 `Fluctuation (fluc)` 決定：正向屬性在 $R=0$ 對應 $\text{Roll\_Min} \times \text{fluc}$、在 $R=200$（Peerless）對應 $\text{Roll\_Max} \times \text{fluc}$；負向妥協屬性（Burden / Interference）在 $R=0$ 最差（高數值）、在 $R=200$ 最佳（低數值）。
   - 防具五個穿戴部位（Head / Body / Hands / Legs / Feet）的所有屬性範圍與護符效果，嚴格遵循固定部位乘數（**Slot Multiplier**）：**Head `1.0x`、Body `1.2x`、Hands `0.9x`、Legs `1.1x`、Feet `0.8x`**（出處：[The Armory#Charms](https://ehwiki.org/wiki/The_Armory#Charms) 與 [Equipment Ranges Clothes](https://ehwiki.org/wiki/Equipment_Ranges_Clothes) 五部位實測比值）。
2. **The Armory（v0.91）對 The Forge（v0.86）的機制替換**：
   - **強化（Forging）與道具界（Item World）合一為 `Upgrade Tier: Forge / IW / MaxIW`**：每通過 1 層 IW 解鎖 1 級鍛造上限、給予 +1 Charm Point，且每級 IW 與每級 Forging 均使**全基礎屬性線性 `+1%`（物理／魔法基礎傷害 ADB/MDB `+2%`）**，取代 v0.86 分屬性獨立對數升級 `1 + factor * ln(1 + 0.1 * Lv)`。
   - **護符（Charms）與護符袋（Pouches）取代隨機 IW Potency 與時效性附魔**：v0.86 通關 IW 隨機賦予的 18 種 Potency 與時效性 Shards/Infusions，在 v0.91 整併為鑲嵌於 **Charm Slots** 的 **27 種 Charms（各分 Lesser / Greater，共 54 個變體；2026-10-22 稽核更正：原稿寫 23 種，The Armory 的 Charms 表列 27 種，`sources/parsed_wiki/The_Armory.md:321-386`；題幹的「23 種」在來源中找不到對應）**。Charm 屬消耗品、會磨損、裝上後無法拆下（`sources/parsed_wiki/The_Armory.md:305,319`），並以 **3 種 Pouches（Silk / Kevlar / Mithril）** 抵銷戰鬥耐久磨損。
   - **屬性融合（Stat Fusion）**：允许犧牲同基底同部位的 Legendary / Peerless 裝備，將目標裝備的各屬性骰值每次提升 `+1`（需 Core）或 `+2`（無雙祭品或祭品該項骰值較高，免 Core），溢出點數自動補向最低未滿屬性，直至全滿 `200` 晉升 **Peerless**，或搭配 `Limit Breaker I–V` Hath Perks 升至 `250` **Ultimate**。
3. **怪物資料庫（44,431 筆實測母體）關鍵發現**：
   - 對 `SukkaLab/hv-monster-data` 的 `persistent.json`（44,431 筆怪物）進行全量統計，確認包含 **27 隻系統內建怪（MID 1–32：12 隻 Common、4 隻 Rare Boss、4 隻 Legendary 學姊、7 隻 Ultimate 神怪）**、**18 筆 Tenboro 官方怪（PL 2,250 的 15 筆＝小馬關 9 隻 + PGC 6 隻，另有 PL 271、452、881 各 1 筆；2026-10-22 更正，原稿寫 15 隻皆 2,250）**，以及玩家於 Monster Lab 培育的 13 大種族怪。（2026-10-22 稽核補註：此 JSON 是玩家自創怪的抗性快照，只有 `monsterId, created_at, monsterClass, monsterName, plvl, attack, trainer` 與九系抗性、`lastUpdate` 共 17 欄，沒有六圍、HP、技能；另含 Snowflake 的 3 隻龍（PL 1675／1675／1575），官方怪因此是 PL 2250 的 15 筆 Tenboro（PGC 6 隻＋Pony 9 隻）加 3 隻龍共 18 筆，原稿只算了前 15 筆，`sources/persistent_monsters.json`。）
   - 13 大種族的物理三系抗性（Crushing / Slashing / Piercing）在所有 PL 下標準差趨近 `0.00`（因 Monster Lab 無法用規律水晶升級物理抗性，完全維持種族天生值 `+25 / 0 / -25`），而六系元素抗性則隨 PL 呈現由天生值向 `+45% ~ +75%` 集中的分布。

---

## 一、v0.91 裝備系統全表與 v0.86 對照

### 1.1 10 階品質（Quality）之 `0–250` 基礎骰值區間與特性表

根據 [Detailed Equip Characteristics#Quality](https://ehwiki.org/wiki/Detailed_Equip_Characteristics#Quality)、[The Armory#Ranges](https://ehwiki.org/wiki/The_Armory#Ranges) 與 `anon962/AmyBotV2` 的 `infer_equip_stats.py:6-16`，v0.91 共定義 10 階裝備品質（舊版 v0.86 另有已廢棄之 `Flimsy` 與 `Fine`）：

| 品質階級 (Quality) | v0.91 基礎骰值區間 `[Min_R, Max_R]` | 對應Peerless百分比區間 | 最低掉落難度 | 基礎掉落率 / 取得途徑 | 詞綴、等級與 PAB（主屬性加成）保證規則 |
|---|---|---|---|---|---|
| **Crude**（粗糙） | `0 – 40` (`infer_equip_stats` 作 `1–40`) | `0% – 20%` | Normal ~ Hell（Nintendo 以上為 0%） | 一般掉落 | 永無 Prefix、永無 Suffix、永無 PAB；掉落時為 `Level Unassigned`（首次穿戴時同步為玩家當前等級，之後不再成長） |
| **Fair**（尚可） | `30 – 70` | `15% – 35%` | Normal ~ Hell（Nintendo 以上為 0%） | 一般掉落 | 無 Prefix；可帶 Suffix；掉落時為 `Level Unassigned` |
| **Average**（普通） | `60 – 100` | `30% – 50%` | Normal ~ IWBTH（Nintendo 保底品質） | 一般掉落 / T1–T3 獎盃保底 | 可帶 Suffix；掉落時為 `Level Unassigned` |
| **Superior**（上等） | `90 – 130` | `45% – 65%` | 全難度（PFUDOR 隨機掉落保底品質） | 一般掉落 / T4–T5 獎盃保底 | **保證有 Suffix**、開始可帶 Prefix；PAB 最多 2 項；掉落時直接賦予玩家當前等級（依據 `Equipment_Basics`；`Detailed_Equip_Characteristics` 則載 Exquisite 起賦予等級） |
| **Exquisite**（精良） | `120 – 160` | `60% – 80%` | 全難度 | 一般掉落 / T6 獎盃保底（T6 約 `78%`） | 保證有 Suffix、可帶 Prefix；PAB 最多 2 項；掉落即綁定玩家當前等級 |
| **Magnificent**（史詩） | `150 – 180` | `75% – 90%` | 全難度 | 基礎掉率 **`0.0005%`**（T6 獎盃約 `20%`；T7–T8 獎盃保底） | 保證有 Suffix、高機率帶 Prefix |
| **Legendary**（傳奇） | `170 – 200`（並列：中文百科 Detailed Equip Characteristics 註 `170–199`，`sources/parsed_wiki/Detailed_Equip_Characteristics_Chinese.md:115`；中文 The Armory 則為 `170 / 200`，`sources/parsed_wiki/The_Armory_Chinese.md:435`，兩頁並存、未解） | `85% – 100%` | **僅限 Hell（4x）及以上**（Arena 通關獎勵在 Normal 亦有極低機率） | 基礎掉率 **`0.00025%`**（T6 獎盃約 `2%`；T9 Tenbora's Box 保底） | **保證有 Prefix 與 Suffix**；**保證擁有該基底所有可用 PAB**（通常 3 項、輕甲 4 項；例外：盾牌從 STR/DEX/AGI/END 4 項中隨機骰出 3 項） |
| **Peerless**（無雙） | **`200 – 200`**（全屬性鎖定 200） | **`100%`** | **僅限 Hell（4x）及以上** | **Hell**：`1 / 1,000,000` (`0.0001%`)<br>**Nintendo**：`1 / 333,333` (`0.0003%`)<br>**IWBTH**：`1 / 200,000` (`0.0005%`)<br>**PFUDOR**：`1 / 100,000` (`0.001%`)<br>**所有階層 Trophy**：固定 `0.0001%`<br>亦可由 Legendary 經 **Stat Fusion** 融合全滿 200 晉升 | 全屬性固定為該詞綴組合之最大值（`200`）；保證全Prefix/Suffix與全PAB（盾牌 3 項） |
| **Peerless+**（無雙+） | **`201 – 249`**（2026-10-22 稽核補註：百科跨頁矛盾，並列兩說：The Armory Ranges 表為 `200 / 249`，`sources/parsed_wiki/The_Armory.md:433`；Detailed Equip Characteristics 為 `201-249`，`sources/parsed_wiki/Detailed_Equip_Characteristics.md:117`。原稿只採 `201-249` 且未揭露衝突） | `100.5% – 124.5%` | 不直接掉落 | 擁有至少 1 階 `Limit Breaker` Hath Perk 時，對 Peerless 裝備執行 **Stat Fusion** 取得 | 每階 `Limit Breaker I–V` 依序將 Stat Fusion 上限解鎖至 `210 / 220 / 230 / 240 / 250` |
| **Ultimate**（至臻） | **`250 – 250`**（全屬性鎖定 250） | **`125%`** | 不直接掉落 | 擁有滿階 `Limit Breaker V`（總計 300,000 Hath）並將 Peerless+ 裝備全屬性透過 **Stat Fusion** 融合至 `250` 晉升 | 全屬性鎖定 `250`；最高鍛造與 IW 上限提升至 **Lv.33** |

---

### 1.2 戰利品與裝備掉落判定完整管線（Loot Drop Pipeline）

根據 [Loot Drop Rolls](https://ehwiki.org/wiki/Loot_Drop_Rolls)，每隻怪物被擊殺時最多產生 1 次一般戰利品掉落（Battle Powerup 寶石除外，寶石於擊殺當下獨立以 `~4%` 機率判定並直接填入 `P` 槽；若玩家 Stamina 為 `0` 則無任何掉落）：

1. **Step 1 — 總掉落檢定（Drop Roll）**：
   $$\text{Loot\_Drop} = 0.10 \times (1 + 0.01 \times \text{Scavenger\_Lv}) + \text{clamp}\left(\frac{\text{Monster\_PL} - 500}{5000},\ 0,\ 0.15\right)$$
   - 基礎機率 `10%`；滿級 Scavenger（Lv.5）提升 `+5%`（乘算 `1.05` 或加算至 `15%`，百科公式寫為 `0.10 * (1 + 0.01 * Lv)` 但文字寫滿級 `15%`，實務上每級 Scavenger 為 `+10%` 相對倍率即 `0.10 * (1 + 0.10 * Lv)` 達 `15%`，`HentaiVerse_Advice` 則稱 `12.5%` 即每級 `+5%`）（2026-10-22 稽核：以上三種解讀互斥、原稿未收斂；來源 Loot Drop Rolls 寫「Scavenger training (up to +5%)」`sources/parsed_wiki/Loot_Drop_Rolls.md:25`，又寫「maxing out Scavenger can bring this up to 15%」`sources/parsed_wiki/Loot_Drop_Rolls.md:58`，兩句本身也不一致，? 滿級 Scavenger 的實際總掉落率未定）；怪物 `PL > 500` 時每 50 PL 增加 `+1%`，於 `PL 1,250` 達到上限 `+15%`，總掉落率最高 `27.5%`（或 `30%`）。
   - 若檢定失敗：進入獨立的 **Credits 掉落檢定**（固定約 `~20%` 機率掉落金錢，不受 Scavenger 影響）。
   - 若在 **Grindfest** 模式：每隻怪除了正常 `Drop Roll` 外，額外獲得 1 次獨立的相等機率檢定，成功時直接跳至水晶種類檢定（`C.Type Roll`）。
2. **Step 2 — 裝備掉落檢定（Equipment Roll）**：
   $$\text{Equipment\_Drop} = \text{Loot\_Drop} \times 0.025 \times (1 + 0.05 \times \text{Quartermaster\_Lv})$$
   - 在已通過 `Drop Roll` 的前提下，基礎有 **`2.5%`** 機率為裝備；滿級 Quartermaster（Lv.20? 或 Lv.5 達 2x）最高翻倍至 `5.0%`。
   - 若玩家當前 `Equipment Inventory + Storage` 已達 `1,000` 件上限（扣除 Hoarder Perk 免計額度後），裝備檢定自動失敗或丟棄。
   - **Arena** 與 **Ring of Blood** 通關結算時，額外保底觸發 1–3 次獨立的 `Battle Clear Bonus` 裝備掉落。
3. **Step 3 — 裝備部位權重檢定（Slot Roll）**：
   - 七大裝備分類的固定權重為 **`9 : 3 : 3 : 3 : 15 : 15 : 15`**（總權重 `63`）：
     - **One-Handed Weapon（單手武）**：`9 / 63`（`14.29%`）
     - **Two-Handed Weapon（雙手武）**：`3 / 63`（`4.76%`）
     - **Staff（法杖）**：`3 / 63`（`4.76%`）
     - **Shield（盾牌）**：`3 / 63`（`4.76%`）
     - **Cloth Armor（布甲）**：`15 / 63`（`23.81%`，五部位 Cap/Robe/Gloves/Pants/Shoes 各佔 `3/63 = 4.76%`）
     - **Light Armor（輕甲）**：`15 / 63`（`23.81%`，五部位 Helmet/Breastplate/Gauntlets/Leggings/Boots 各佔 `3/63 = 4.76%`）
     - **Heavy Armor（重甲）**：`15 / 63`（`23.81%`，五部位 Helmet/Cuirass/Gauntlets/Greaves/Sabatons 各佔 `3/63 = 4.76%`）
   - 在 Shrine 獻祭 Trophy 時，玩家可手動指定上述 7 大分類之一。
4. **Step 4 — 稀有材質檢定（Tier Roll）**：
   - 僅對 Shield、Cloth、Light、Heavy 進行（因武器與法杖無 Common/Rare 材質階級之分）。
   - 決定是否產出稀有材質（`Force Shield`、`Phase`、`Shade`、`Power`）：基礎機率隨品質提升（Crude/Fair 為 `0%`，Average 約 `2%`，Peerless `>25%`），並直接乘上 `Luck of the Draw` 訓練加成（最高 `+25%`）。
5. **Step 5 — 前後綴與主屬性檢定（Prefix / Suffix / PAB Rolls）**：
   - 依品質決定是否帶 Prefix / Suffix（見 1.1 表），再依下節 1.3 與 1.4 的權重分布抽出具體詞綴。
6. **Step 6 — 古董與其他道具分流（若 Step 2 非裝備）**：
   - **Artifact Roll**：基礎 `0.2%` × `(1 + 0.1 * Archaeologist_Lv)`（Random Encounter 額外 `2.5x`）；其中極小比例分流為 **Collectable Roll**（27 種小馬雕像，約 `1%` 的古董檢定）。
   - **Token Roll**：基礎 `0.2%`（Random Encounter `2.5x`，Tokenizer Perk I–III 分別為 `2x / 3x / 4x`）；成功時 `T.Type Roll` 基礎為 **20% Token of Blood / 80% Chaos Token**（Tokenizer Perk 進一步提高 Chaos 比例）。
   - **I.Type Roll（一般消耗品與素材，100% 兜底）**：
     - **Restoratives（恢復藥）`35%`**：再以 **79% Draught / 19% Potion / 2% Elixir** 分配品質，並均分給 Health / Mana / Spirit 三種。
     - **Crystals（水晶）`35%`**：均分給 6 種主屬性水晶與 6 種元素水晶（或含 Quintessence），數量乘上 `Crystal Multiplier`。
     - **Scrolls（卷軸）`10%?`**（2026-10-22 稽核：來源帶問號，`sources/parsed_wiki/Loot_Drop_Rolls.md:37`；下列 Infusions `4%?` 同）
     - **Food（怪物飼料）`10%`**：依難度分配 Chow / Edibles / Cuisine（IWBTH 封頂為 `40% / 30% / 30%`）。
     - **Infusions（魔藥）`4%?`**（六系元素均分）
     - **Shards（碎片）`4%`**（Voidseeker / Aether 僅在 Hard 以上掉落）
     - **Special Items `2%`**（Bubble-Gum、Flower Vase、Happy Pills、World Seeds 等；World Seeds 僅在 Hard 以上掉落）。

---

### 1.3 全部 33 種裝備基底（11 種新基底 + 22 種經典；2026-10-22 稽核更正：原標題「v0.91 擴編 11 種」不成立，其中 9 種在舊世代已有，見各列）總覽表

根據 [Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics)、[Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics)、[Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs) 與 `anon962/AmyBotV2` 之 `parse_equip_name.py:81-150`，v0.91 共計 **33 種裝備基底**（其中防具 12 種材質 × 5 個部位 = 60 種防具全名，連同 13 種武器／法杖／盾牌，共 **73 種裝備模板 Slot-Type**）：（2026-10-22 稽核更正：此句內部數字對不上：下方 (A) 小節標題與表列為 21 種武器／法杖／盾牌基底，60 + 21 = 81，不是 73；33 = 21 + 12 亦與此句「13 種」不符。此處以表列實數為準：21 + 12 = 33 種基底、60 + 21 = 81 種模板。另，原稿把 11 種基底稱為「v0.91 新增」，經查其中 9 種在舊世代已有（見各列更正，`sources/parsed_wiki/Obsolete_Items.md:256-311`），只有 Ironsilk 與 Reactive 在舊世代清單查無，? 是否為新增未直接驗證；舊世代 Dagger／Sword Chucks／Scythe／Tower／Gossamer／Kevlar／Ebony 的相對強弱 ▲▼ 見 `sources/parsed_wiki/Obsolete_Items.md:271-311`，可作為 GAP-003-01 的定性依據。）

#### (A) 武器、法杖與盾牌（21 種基底）

| 分類 (Category) | 基底名稱 (Base Type) | 登場世代 | 基礎傷害類型 | 武器內建特效 (Innate Proc) | 滿值觸發率 / 持續回合 / DoT% | 拆解與升級對應基礎素材 | 對應 Core 類型 | 基礎特性與定位說明 |
|---|---|---|---|---|---|---|---|---|
| **單手武器 (1H)** | **Axe**（斧） | v0.86 | Slashing | Bleeding Wound | 25% / 7t / 20% ADB | Metals | Weapon Core | 單手最高基礎物傷、高負重、無內建招架 |
| **單手武器 (1H)** | **Club**（棍棒） | v0.86 | Crushing | Stunned | 25% / 4t / — | Metals | Weapon Core | 擊暈控場（防閃避與招架）、中等物傷、僅 `of the Nimble` 有招架 |
| **單手武器 (1H)** | **Rapier**（西洋劍） | v0.86 | Piercing | Penetrated Armor | 25% / 7t / 每層破甲 25%（疊 3 層） | Metals | Weapon Core | 內建破甲、高命中、中招架、低負重 |
| **單手武器 (1H)** | **Shortsword**（短劍） | v0.86 | Slashing | Bleeding Wound | 25% / 7t / 20% ADB | Metals | Weapon Core | 極高命中、均衡物傷與招架、低負重 |
| **單手武器 (1H)** | **Wakizashi**（脇差） | v0.86 | Slashing | Bleeding Wound | 25% / 7t / 20% ADB | Metals | Weapon Core | 二天一流副手、內建攻速與最高單手招架、極低負重 |
| **單手武器 (1H)** | **Dagger**（匕首） | 舊世代已有、0.91 復活（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:262,273`） | Slashing（2026-10-22 稽核更正，原稿寫 Piercing / Slashing：`sources/parsed_wiki/Damage_Types.md:46`、`sources/parsed_wiki/Obsolete_Items.md:273`） | Bleeding Wound（2026-10-22 稽核更正，原稿標「百科未單列」：Slashing 武器的特效即 Bleeding Wound，`sources/parsed_wiki/Damage_Types.md:60`；Equipment Procs 的武器表未列 Dagger，`sources/parsed_wiki/Equipment_Procs.md:17-27`） | ? 觸發率／持續／DOT% 來源未找到 | Metals | Weapon Core | 0.91 單手武；可骰 `of Focus` 與 `of the Battlecaster`，為 1H 法師新主力 |
| **雙手武器 (2H)** | **Longsword**（長劍） | v0.86 | Slashing | Bleeding Wound | 25% / 7t / 30% ADB | Metals | Weapon Core | 雙手極高基礎物傷、高負重與干涉 |
| **雙手武器 (2H)** | **Estoc**（刺劍） | v0.86 | Piercing | Penetrated Armor | 25% / 7t / 每層破甲 25%（疊 3 層） | Metals | Weapon Core | 雙手破甲主力、高暴擊與高 STR 加成 |
| **雙手武器 (2H)** | **Mace / Great Mace**（重槌） | v0.86 | Crushing | Stunned | **30%** / 4t / — | Metals | Weapon Core | 全遊戲最高擊暈率（30%）、高物傷；註：無前綴時名為 `Great Mace`，有前綴時名為 `<Prefix> Mace` |
| **雙手武器 (2H)** | **Katana**（太刀） | v0.86 | Slashing | Bleeding Wound | 25% / 7t / 30% ADB | Metals | Weapon Core | 二天一流主手、雙手最高命中與高暴擊 |
| **雙手武器 (2H)** | **Scythe**（鐮刀） | 舊世代已有、0.91 復活（2026-10-22 稽核更正：`sources/parsed_wiki/Obsolete_Items.md:260,277`） | Slashing（`sources/parsed_wiki/Damage_Types.md:52`） | Bleeding Wound | ? 觸發率／持續／DOT% 來源未找到 | Metals | Weapon Core | 0.91 雙手武；`HentaiVerse_Advice_Advanced` 明載 `Scythe of Slaughter` 為全遊戲最高物理基礎傷害（略高於 Longsword） |
| **雙手武器 (2H)** | **Swordchucks**（鎖鏈雙劍） | 舊世代已有、0.91 復活（2026-10-22 稽核更正：舊世代名稱 Sword Chucks，`sources/parsed_wiki/Obsolete_Items.md:256,275`） | Slashing（`sources/parsed_wiki/Damage_Types.md:56`） | Bleeding Wound（2026-10-22 稽核更正，原稿標「?」：Slashing 武器特效，`sources/parsed_wiki/Damage_Types.md:60`；舊世代亦為 Bleeding Wound，`sources/parsed_wiki/Obsolete_Items.md:275`） | ? 觸發率／持續／DOT% 來源未找到 | Metals | Weapon Core | 0.91 特殊雙手武（Detailed Equip Characteristics 列於 Two-Handed 區，`sources/parsed_wiki/Detailed_Equip_Characteristics.md:320,376`；舊世代為 1H，兩頁並存；`hvUtils.js` 索引曾列於 1H/2H，百科歸於 2H），僅有 Slaughter / Ox / Raccoon（及 Battlecaster/Balance）後綴 |
| **法杖 (Staff)** | **Oak Staff**（橡木杖） | v0.86 | Crushing | Ether Tap (Siphon MP) | ~36–40% / 4t | Wood | Staff Core | 主修 Supportive 熟練與 Holy EDB，附 Fire/Cold EDB 與 Counter-Resist，0 干涉 |
| **法杖 (Staff)** | **Redwood Staff**（紅杉木杖） | v0.86 | Crushing | Ether Tap (Siphon MP) | ~36–40% / 4t | Wood | Staff Core | 主修 Elemental 熟練與火冰雷風四系 EDB，附 Sup/Dep 熟練，0 干涉 |
| **法杖 (Staff)** | **Willow Staff**（柳木杖） | v0.86 | Crushing | Ether Tap (Siphon MP) | ~36–40% / 4t | Wood | Staff Core | 主修 Deprecating 熟練與 Dark EDB，附 Elec/Wind EDB、Ele/For 熟練與 Counter-Resist，0 干涉 |
| **法杖 (Staff)** | **Katalox Staff**（鐵木杖） | v0.86 | Crushing | Ether Tap (Siphon MP) | ~36–40% / 4t | Wood | Staff Core | 主修 Divine + Forbidden 雙熟練與 Holy + Dark 雙 EDB，高法暴、無 Counter-Resist，0 干涉 |
| **法杖 (Staff)** | **Ebony Staff**（烏木杖） | 舊世代已有、0.91 復活（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:258,283`） | Crushing | Ether Tap (Siphon MP) | ~36–40% / 4t | Wood | Staff Core | v0.91 新增泛用法杖，可骰全 6 系 EDB 與 Ele/Div/For 後綴，但基礎專精低於四木杖（`Advice` 註：`Anything but Ebony`） |
| **盾牌 (Shield)** | **Buckler**（小圓盾） | v0.86 | — | — | — | Wood | Armor Core | Common 盾；高格擋、極低負重與干涉，可骰 Nimble（招架）與 Fleet（閃避） |
| **盾牌 (Shield)** | **Kite Shield**（鳶盾） | v0.86 | — | — | — | Wood | Armor Core | Common 盾；最高物理三系特定減傷（Reinforced + Dampening/Deflection/Stoneskin 疊加）、高格擋 |
| **盾牌 (Shield)** | **Tower Shield**（塔盾） | 舊世代已有、0.91 復活（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:301,307`） | — | — | — | Wood | Armor Core | v0.91 新增重型盾；`Advice_Advanced` 明載 `Tower Shield of the Barrier` 擁有全遊戲最高格擋率（高於 Kite 與 Force） |
| **盾牌 (Shield)** | **Force Shield**（力場盾） | v0.86 | — | — | — | **Metals**（升級需 `Defense Matrix Modulator`） | Armor Core（拆解給 **5 顆**） | Rare（Magitech）盾；內建極高格擋、極低負重、極高干涉，必帶六元素抗性前綴之一，耗 Energy Cell |

#### (B) 防具（12 種材質基底 × 5 部位 = 60 種模板）

防具五部位（Head / Body / Hands / Legs / Feet）的部位名稱映射與部位乘數（Slot Multiplier）如下：

| 護甲重量分類 | Head（`1.0x`） | Body（`1.2x`） | Hands（`0.9x`） | Legs（`1.1x`） | Feet（`0.8x`） | 升級與拆解基礎素材 |
|---|---|---|---|---|---|---|
| **Cloth Armor（布甲）** | `Cap` | `Robe` | `Gloves` | `Pants` | `Shoes` | `Cloth` |
| **Light Armor（輕甲）** | `Helmet` | `Breastplate` | `Gauntlets` | `Leggings` | `Boots` | `Leather` |
| **Heavy Armor（重甲：Plate / Chain / Reactive）** | `Helmet` | `Cuirass` | `Gauntlets` | `Greaves` | `Sabatons` | `Metals` |
| **Heavy Armor（重甲：Power）** | `Helmet` | `Armor` | `Gauntlets` | `Leggings` | `Boots` | `Metals` |

12 種防具材質基底的特性對照：

| 護甲分類 | 材質名稱 (Armor Type) | 登場世代 | 稀有度階級 | 升級稀有素材 / 拆解 Core 數 | 負重 / 干涉特徵 | 核心屬性與流派定位 |
|---|---|---|---|---|---|---|
| **Cloth** | **Cotton**（棉布） | v0.86 | Common | 無 / 1 Armor Core | 0 Burden / 0 Interference | 傳統熟練度布甲（可骰五大魔法熟練度後綴與 v0.91 復活之六元素減傷後綴），基礎物魔減傷高於 Phase |
| **Cloth** | **Gossamer**（薄紗） | 舊世代已有、0.91 復活（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:299,309`） | Common | 無 / 1 Armor Core | 0 Burden / 0 Interference | v0.91 新增純法系布甲，僅骰五大熟練度與 Fox (INT) / Owl (WIS) 後綴 |
| **Cloth** | **Ironsilk**（鐵絲絨） | **v0.91 新增**（? 2026-10-22 稽核：`sources/parsed_wiki/Obsolete_Items.md` 中找不到 Ironsilk，是否為全新基底只是「舊世代清單查無」，未直接驗證） | Common | 無 / 1 Armor Core | 0 Burden / **有 Interference** | v0.91 新增近戰／閃避型布甲（`Interference` 頁明載為唯一有干涉的布甲），可骰 `Reinforced` 前綴與 Protection/Warding/Fleet/Raccoon/Cheetah 後綴 |
| **Cloth** | **Phase**（相位布甲） | v0.86 | **Rare (Magitech)** | `Crystallized Phazon` / **5 Armor Cores** | 0 Burden / 0 Interference | 頂級法師裝；高魔命、高閃避，可骰 `Radiant` (+MDB) / `Mystic` (+法暴傷) 前綴，以及六系 EDB 或五大熟練度後綴 |
| **Light** | **Leather**（皮革） | v0.86 | Common | 無 / 1 Armor Core | 低 Burden / 低 Interference | 高物理與魔法減傷、高敲擊／斬擊特定減傷、高 Resist |
| **Light** | **Drakehide**（龍皮） | 舊世代已有「Dragon Hide」、0.91 以 Drakehide 之名出現（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:289`；? 兩者是否同一基底來源未明寫） | Common | 無 / 1 Armor Core | 低 Burden / 低 Interference | v0.91 新增輕甲，在 Leather 後綴池基礎上新增 `of the Battlecaster`（0 干涉）與 `of Negation`（+Resist） |
| **Light** | **Kevlar**（凱夫拉） | 舊世代已有、0.91 復活（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:297,311`） | Common | 無 / 1 Armor Core | 低 Burden / 低 Interference | v0.91 新增現代輕甲，可骰 `Reinforced` 前綴與 Battlecaster / Negation / 物理與元素減傷後綴 |
| **Light** | **Shade**（暗影輕甲） | v0.86 | **Rare (Magitech)** | `Shade Fragment` / **5 Armor Cores** | **0 Burden** / 低 Interference | 頂級高閃避近戰／混合裝；內建 **Attack Damage**、高物命、高閃避、高抗性；專屬後綴 `Shadowdancer`（+閃避+物暴率）與 `Arcanist`（+INT/WIS/魔命/降干涉） |
| **Heavy** | **Plate**（板甲） | v0.86 | Common | 無 / 1 Armor Core | 高 Burden / 高 Interference | 最高基礎物理減傷與斬擊／刺擊特定減傷，可骰 `Shielding`（+格擋）與 `Mithril`（-25% 負重）前綴 |
| **Heavy** | **Chain**（鎖子甲） | 舊世代已有「Chainmail」、0.91 以 Chain 之名出現（2026-10-22 稽核更正，原稿標「v0.91 新增」：`sources/parsed_wiki/Obsolete_Items.md:295`；? 兩者是否同一基底來源未明寫） | Common | 無 / 1 Armor Core | 高 Burden / 高 Interference | v0.91 新增重甲，可骰 `Mithril` 與 `Reinforced` 前綴，後綴池同 Plate |
| **Heavy** | **Reactive**（反應裝甲） | **v0.91 新增**（? 2026-10-22 稽核：`sources/parsed_wiki/Obsolete_Items.md` 中找不到 Reactive，只是舊世代清單查無，未直接驗證） | **Rare (Magitech)** | ? / **5 Armor Cores** | 高 Burden / 高 Interference | v0.91 新增 Magitech 重甲（耗 Energy Cell，拆解給 5 顆 Core），唯一可骰 **`of the Barrier`（+Block 格擋率）** 後綴的重甲 |
| **Heavy** | **Power**（動力裝甲） | v0.86 | **Rare (Magitech)** | `Repurposed Actuator` / **5 Armor Cores** | 中高 Burden / 高 Interference | 頂級暴力重甲；內建高 **Attack Damage**、**Attack Accuracy**、**Attack Crit Chance** 與 **Attack Crit Damage**，後綴僅 4 種（Slaughter 8% / Balance 8% / Protection 42% / Warding 42%） |

---

### 1.4 前綴（Prefixes）與後綴（Suffixes）配對合法性、機率權重與效果全表

#### (A) 全部 22 種前綴（Prefixes）配對與掉落權重表

根據 [Detailed Equip Characteristics#Prefixes](https://ehwiki.org/wiki/Detailed_Equip_Characteristics#Prefixes) 與 `hvUtils.js:1411-1434`：

1. **武器與法杖前綴（共 7 種，所有 1H / 2H / Staff 基底通用，權重總和 100%）**：
   | 前綴名稱 | 權重分布 | 傷害類型變更 | 賦予特效 (Strike Proc) | 賦予面板屬性加成 |
   |---|---|---|---|---|
   | **Ethereal**（空靈） | **20%** | 基礎傷害轉為 **Void（虛空）** | 賦予 **Void Strike**（額外一下約 50% 物傷之虛空追擊） | **Burden = 0、Interference = 0**；無 EDB 加成 |
   | **Fiery**（灼熱） | **15%** | 維持原物理屬性 | 賦予 **Fire Strike** | 增加 **Fire EDB** |
   | **Arctic**（極寒） | **15%** | 維持原物理屬性 | 賦予 **Cold Strike** | 增加 **Cold EDB** |
   | **Shocking**（雷鳴） | **15%** | 維持原物理屬性 | 賦予 **Elec Strike** | 增加 **Elec EDB** |
   | **Tempestuous**（風暴） | **15%** | 維持原物理屬性 | 賦予 **Wind Strike** | 增加 **Wind EDB** |
   | **Hallowed**（神聖） | **10%** | 維持原物理屬性 | 賦予 **Holy Strike** | 增加 **Holy EDB** |
   | **Demonic**（惡魔） | **10%** | 維持原物理屬性 | 賦予 **Dark Strike** | 增加 **Dark EDB** |

2. **盾牌前綴（依盾牌基底獨立分配權重，總和 100%）**：
   | 盾牌基底 | 可用前綴與各自權重 | 前綴具體效果 |
   |---|---|---|
   | **Buckler** / **Kite Shield** | `Mithril` (**50%**)、`Reinforced` (**25%**)、`Agile` (**25%**) | `Mithril`：減少約 25% Burden；`Reinforced`：增加 Crushing / Slashing / Piercing 三系減傷；`Agile`：新增 Attack Speed 加成 |
   | **Tower Shield** | `Mithril` (`?%`)、`Reinforced` (`?%`) | 同上（無 `Agile`；公開百科未標精確比例，單機版建議採 `Mithril 50% / Reinforced 50%` 或 `67% / 33%`） |
   | **Force Shield** | `Ruby` (**20%**)、`Cobalt` (**20%**)、`Amber` (**20%**)、`Jade` (**20%**)、`Zircon` (**10%**)、`Onyx` (**10%**) | 依序新增 Fire / Cold / Elec / Wind / Holy / Dark 元素減傷（Elemental MIT） |

3. **防具前綴（共 15 種：專屬 9 種 Charged／Frugal／Radiant／Mystic／Reinforced／Agile／Savage／Mithril／Shielding ＋ 6 種元素前綴；2026-10-22 稽核更正，原稿寫 14 種與下表列出的數量不符；依防具材質獨立分配權重，總和 100%）**：
   | 防具材質 | 專屬前綴與權重 | 六元素抗性前綴權重（Ruby / Cobalt / Amber / Jade / Zircon / Onyx） | 前綴具體效果 |
   |---|---|---|---|
   | **Cotton** | `Charged` (**10%**)、`Frugal` (**10%**) | 四元素各 **15%**（共 60%）+ 光暗各 **10%**（共 20%）= **80%** | `Charged`：+Casting Speed；`Frugal`：+Mana Conservation |
   | **Phase** | `Charged` (**10%**)、`Frugal` (**10%**)、`Radiant` (**5%**)、`Mystic` (**5%**) | 四元素各 **12.5%**（共 50%）+ 光暗各 **10%**（共 20%）= **70%** | `Radiant`：+Magic Damage；`Mystic`：+Spell Crit Damage |
   | **Gossamer** | 無專屬前綴 | 四元素各 15%+光暗各 10%（或按比例正規化為 `18.75% × 4 + 12.5% × 2`） | 僅有六元素抗性前綴 |
   | **Ironsilk** / **Kevlar** | `Reinforced` (`?%`，對應經典雙專屬約 **20%**) | 四元素各 15% + 光暗各 10% = **80%** | `Reinforced`：+Crushing / Slashing / Piercing MIT |
   | **Leather** | `Reinforced` (**10%**)、`Agile` (**10%**) | 四元素各 **15%** + 光暗各 **10%** = **80%** | `Reinforced`：+三物理減傷；`Agile`：+Attack Speed |
   | **Drakehide** | 無專屬前綴（或同 Leather） | 六元素抗性前綴 | 百科未單列專屬前綴 |
   | **Shade** | `Savage` (**10%**)、`Agile` (**10%**) | 四元素各 **15%** + 光暗各 **10%** = **80%** | `Savage`：+Attack Crit Damage；`Agile`：+Attack Speed |
   | **Plate** | `Mithril` (**10%**)、`Shielding` (**10%**) | 四元素各 **15%** + 光暗各 **10%** = **80%** | `Mithril`：-25% Burden；`Shielding`：+Block Chance |
   | **Chain** | `Mithril` (`?%`，約 **10%**)、`Reinforced` (`?%`，約 **10%**) | 四元素各 **15%** + 光暗各 **10%** = **80%** | `Mithril`：-25% Burden；`Reinforced`：+三物理減傷 |
   | **Reactive** | `Mithril` (`?%`，約 **20%**) | 四元素各 **15%** + 光暗各 **10%** = **80%** | `Mithril`：-25% Burden |
   | **Power** | `Mithril` (**10%**)、`Savage` (**10%**) | 四元素各 **15%** + 光暗各 **10%** = **80%** | `Mithril`：-25% Burden；`Savage`：大幅提升 Attack Crit Damage |

---

#### (B) 全部 43 種後綴（Suffixes）效果與 33 基底合法配對矩陣

根據 [Detailed Equip Characteristics#Suffixes](https://ehwiki.org/wiki/Detailed_Equip_Characteristics#Suffixes) 與 `parse_equip_name.py:158-204`，全遊戲共有 **43 種不重複後綴**：

1. **物理與戰鬥後綴（10 種）**：
   - `of Slaughter`：大幅提升 `Attack Damage`。
   - `of Balance`：大幅提升 `Attack Accuracy` 與 `Attack Crit Chance`。
   - `of Swiftness`：新增／提升 `Attack Speed`。
   - `of the Nimble`：新增／提升 `Parry Chance`。
   - `of the Barrier`：大幅提升 `Block Chance`。
   - `of the Fleet`：大幅提升 `Evade Chance`。
   - `of the Shadowdancer`（Shade 專屬，權重 **10%**）：提升 `Evade Chance` 並新增 `Attack Crit Chance`。
   - `of the Battlecaster`：新增 `Magic Accuracy` 與 `Mana Conservation`，且使該裝備 **`Interference = 0`**。
   - `of Focus`：提升 `Magic Accuracy`、`Magic Crit Chance`，並新增 `Mana Conservation`。
   - `of the Arcanist`（Shade 專屬，權重 **10%**）：新增 `Intelligence`、`Wisdom`、`Magic Accuracy`，並將 `Interference` 降至 1/4（Peerless 下由 `8.4` 降至 `2.1`）。
2. **武器吸血／吸魔／吸靈特效後綴（3 種）**：
   - `of the Vampire`：賦予 `Siphon Health` 特效（普攻命中時機率吸取生命）。
   - `of the Illithid`：賦予 `Siphon Mana` 特效（普攻命中時機率吸取魔力）。
   - `of the Banshee`：賦予 `Siphon Spirit` 特效（普攻命中時機率吸取靈力）。
3. **法術傷害與熟練度後綴（12 種）**：
   - `of Destruction`：大幅提升 `Magic Damage`。
   - 六神名元素增傷後綴：`of Surtr`（+Fire EDB）、`of Niflheim`（+Cold EDB）、`of Mjolnir`（+Elec EDB）、`of Freyr`（+Wind EDB）、`of Heimdall`（+Holy EDB）、`of Fenrir`（+Dark EDB）。
   - 五大魔法熟練度後綴：`of the Elementalist`（+Elemental Prof）、`of the Heaven-sent`（+Divine Prof）、`of the Demon-fiend`（+Forbidden Prof）、`of the Earth-walker`（+Supportive Prof）、`of the Curse-weaver`（+Deprecating Prof）。
4. **防禦、減傷與抗性後綴（12 種）**：
   - `of Protection`：大幅提升 `Physical Mitigation`。
   - `of Warding`：大幅提升 `Magical Mitigation`。
   - `of Negation`：大幅提升 `Resist Chance`（在 Shade 上權重為 **40%**，與 `of the Fleet` **40%** 並列）。
   - 三物理特定減傷後綴：`of Dampening`（+Crushing MIT）、`of Deflection`（+Piercing MIT）、`of Stoneskin`（+Slashing MIT）。
   - 六元素特定減傷後綴（v0.91 重新啟用）：`of the Fire-eater`（+Fire MIT）、`of the Frost-born`（+Cold MIT）、`of the Thunder-child`（+Elec MIT）、`of the Wind-waker`（+Wind MIT）、`of the Thrice-blessed`（+Holy MIT）、`of the Spirit-ward`（+Dark MIT）。
5. **六大主屬性後綴（6 種，v0.91 大幅擴充至武器／盾牌／防具）**：
   - `of the Ox`（+STR）、`of the Raccoon`（+DEX）、`of the Cheetah`（+AGI）、`of the Turtle`（+END）、`of the Fox`（+INT）、`of the Owl`（+WIS）。

**33 種裝備基底 × 後綴合法配對完整表**：

| 分類 | 裝備基底 | 合法後綴清單（打勾項目） | 已公開之特定權重 |
|---|---|---|---|
| **1H** | **Shortsword** | `Slaughter`, `Balance`, `Battlecaster`, `Swiftness`, `Focus`, `Vampire`, `Illithid`, `Banshee`, `Ox`, `Raccoon`（共 10 種） | 未公開個別權重（均分或依類別） |
| **1H** | **Dagger** | `Slaughter`, `Balance`, `Nimble`, `Battlecaster`, `Swiftness`, `Focus`, `Raccoon`, `Cheetah`（共 8 種） | 未公開 |
| **1H** | **Axe** | `Slaughter`, `Balance`, `Battlecaster`, `Vampire`, `Illithid`, `Banshee`, `Ox`, `Raccoon`（共 8 種） | 未公開 |
| **1H** | **Wakizashi** | `Slaughter`, `Balance`, `Nimble`, `Battlecaster`, `Swiftness`, `Raccoon`, `Cheetah`（共 7 種） | 未公開 |
| **1H** | **Rapier** | `Slaughter`, `Balance`, `Nimble`, `Battlecaster`, `Swiftness`（總表打勾，子表未列）, `Vampire`, `Illithid`, `Banshee`, `Raccoon`, `Cheetah`（共 9–10 種） | 未公開 |
| **1H** | **Club** | `Slaughter`, `Balance`, `Nimble`, `Battlecaster`, `Swiftness`, `Focus`, `Vampire`, `Illithid`, `Banshee`, `Raccoon`, `Cheetah`（共 11 種） | 未公開 |
| **2H** | **Longsword / Estoc / Mace** | `Slaughter`, `Balance`, `Battlecaster`, `Vampire`, `Illithid`, `Banshee`, `Ox`（共 7 種） | 未公開 |
| **2H** | **Katana / Scythe** | `Slaughter`, `Balance`, `Battlecaster`, `Ox`（共 4 種） | 未公開 |
| **2H** | **Swordchucks** | `Slaughter`, `Balance`, `Battlecaster`, `Ox`, `Raccoon`（子表列 5 種，總表僅勾 Slaughter/Ox/Raccoon） | 未公開 |
| **Staff** | **Ebony Staff** | `Destruction`, `Focus`, `Surtr`, `Niflheim`, `Mjolnir`, `Freyr`, `Heimdall`, `Fenrir`, `Elementalist`, `Heaven-sent`, `Demon-fiend`, `Fox`, `Owl`（共 13 種） | 未公開 |
| **Staff** | **Redwood Staff** | `Destruction`, `Focus`, `Surtr`, `Niflheim`, `Mjolnir`, `Freyr`, `Elementalist`, `Fox`, `Owl`（共 9 種） | 未公開 |
| **Staff** | **Oak Staff** | `Destruction`, `Focus`, `Heimdall`, `Earth-walker`, `Fox`, `Owl`（共 6 種） | 未公開 |
| **Staff** | **Katalox Staff** | `Destruction`, `Focus`, `Heimdall`, `Fenrir`, `Heaven-sent`, `Demon-fiend`, `Fox`, `Owl`（共 8 種） | 未公開 |
| **Staff** | **Willow Staff** | `Destruction`, `Focus`, `Fenrir`, `Curse-weaver`, `Fox`, `Owl`（共 6 種） | 未公開 |
| **Shield** | **Buckler** | `Barrier`, `Nimble`, `Battlecaster`, `Fleet`, `Protection`, `Warding`, `Turtle`（共 7 種） | 未公開 |
| **Shield** | **Kite Shield** | `Barrier`, `Battlecaster`, `Protection`, `Warding`, `Dampening`, `Deflection`, `Stoneskin`, `Turtle`（共 8 種） | 未公開 |
| **Shield** | **Tower Shield** | `Barrier`, `Protection`, `Warding`, `Dampening`, `Deflection`, `Stoneskin`, `Turtle`（共 7 種） | 未公開 |
| **Shield** | **Force Shield** | `Protection`, `Warding`, `Dampening`, `Deflection`, `Stoneskin`, `Turtle`（共 6 種） | 未公開 |
| **Cloth** | **Cotton** | `Protection`, `Warding`, 5 大熟練度（`Elementalist`, `Heaven-sent`, `Demon-fiend`, `Earth-walker`, `Curse-weaver`）, 6 元素減傷（`Fire-eater` 等）（共 13 種） | 未公開 |
| **Cloth** | **Gossamer** | 5 大熟練度, `Fox`, `Owl`（共 7 種） | 未公開 |
| **Cloth** | **Ironsilk** | `Protection`, `Warding`, `Fleet`, `Raccoon`, `Cheetah`（共 5 種） | 未公開 |
| **Cloth** | **Phase** | 5 大熟練度, 6 神名 EDB（`Surtr` 等）, `Raccoon`, `Cheetah`, `Fox`, `Owl`（共 15 種） | 未公開 |
| **Light** | **Leather** | `Protection`, `Warding`, `Dampening`, `Deflection`, `Stoneskin`, 6 元素減傷（共 11 種） | 未公開 |
| **Light** | **Drakehide / Kevlar** | `Protection`, `Warding`, `Battlecaster`, `Dampening`, `Deflection`, `Stoneskin`, `Negation`, 6 元素減傷（共 13 種） | 未公開 |
| **Light** | **Shade** | `Shadowdancer`, `Arcanist`, `Fleet`, `Negation`（共 4 種） | **Shadowdancer `10%` / Arcanist `10%` / Fleet `40%` / Negation `40%`** |
| **Heavy** | **Plate / Chain** | `Protection`, `Warding`, `Dampening`, `Deflection`, `Stoneskin`, 6 元素減傷（共 11 種） | 未公開 |
| **Heavy** | **Reactive** | `Barrier`, `Protection`, `Warding`, `Dampening`, `Deflection`, `Stoneskin`, 6 元素減傷（共 12 種） | 未公開 |
| **Heavy** | **Power** | `Slaughter`, `Balance`, `Protection`, `Warding`（共 4 種） | **Slaughter `8%` / Balance `8%` / Protection `42%` / Warding `42%`** |

---

### 1.5 裝備 42 項屬性參數總表、Lv.0 基礎值換算、等級縮放與負重／干涉公式

#### (A) 42 項裝備屬性之 `scale`、`fluc`、`binding`、多件疊加與 IW 對照表

整合自 `Trendymen/hentaiverse` 的 `hvUtils.js:1360-1410`（`$equip.stats`）、`SukkaW/AmyBot` 的 `equip_scraper.py:317-365`、[Level Scaling](https://ehwiki.org/wiki/Level_Scaling) 與 [The Armory#Bindings](https://ehwiki.org/wiki/The_Armory#Bindings)：

| # | 屬性內部名稱 (`$equip.stats`) | 等級縮放分母 (`scale`) | 百科簡化分母 (`Simp_Factor`) | 屬性波動係數 (`fluc` / `baseCoeff`) | 多件裝備疊加方式 (`multi`) | 對應鍛造升級項 (`forge`) | 對應黏合劑 (`binding`，共 38 種) | v0.86 IW 附魔 (`potency` / 每級加成) |
|---|---|---|---|---|---|---|---|---|
| 1 | `Attack Damage` (ADB) | `50 / 3` (`16.6667`) | `16.60027` (`50/3.012`) | `0.0854` | 加算 | `Physical Damage` | `Binding of Slaughter` | `Butcher` (`+2%/lv` 乘算) |
| 2 | `Attack Speed` | `Infinity` (不隨等級縮放) | `∞` | `0.0481` | **遞減乘算** | — (不可鍛造) | — | `Swift Strike` (`+1.924%/lv`) |
| 3 | `Attack Accuracy` | `5000` | `5000` | `0.06069` | 加算 | `Physical Hit Chance` | `Binding of Balance` | — |
| 4 | `Attack Crit Chance` | `2000` | `2000` | `0.0105` | **遞減乘算** | `Physical Crit Chance` | `Binding of Isaac` | — |
| 5 | `Attack Crit Damage` | `Infinity` | `∞` | `0.01` | 加算 | — (不可鍛造) | — | `Fatality` (`+2%/lv`) |
| 6 | `Counter-Parry` | `Infinity` | `∞` | `0` | 加算 | — | — | `Overpower` (`+4%/lv`，`AmyBot` 作 `1.92`) |
| 7 | `Magic Damage` (MDB) | `250 / 11` (`22.7273`) | `22.72727` (`50/2.2`) | `0.082969` | 加算 | `Magical Damage` | `Binding of Destruction` | `Archmage` (`+2%/lv` 乘算) |
| 8 | `Casting Speed` | `Infinity` | `∞` | `0.0489` | 加算 (`hvUtils` 未標 `multi`) | — (不可鍛造) | — | `Spellweaver` (`+1.4675%/lv`) |
| 9 | `Magic Accuracy` | `5000` | `5000` | `0.0491` | 加算 | `Magical Hit Chance` | `Binding of Focus` | — |
| 10 | `Magic Crit Chance` | `2000` | `2000` | `0.0114` | **遞減乘算** | `Magical Crit Chance` | `Binding of Friendship` | — |
| 11 | `Spell Crit Damage` | `Infinity` | `∞` | `0.01` | 加算 | — (不可鍛造) | — | `Annihilator` (`+2%/lv`) |
| 12 | `Mana Conservation` | `Infinity` | `∞` | `0.1` | **遞減乘算** | — (不可鍛造) | — | `Economizer` (`+5%/lv`) |
| 13 | `Counter-Resist` | `Infinity` | `∞` | `0.1` | 加算 | — | — | `Penetrator` (`+4%/lv`) |
| 14 | `Physical Mitigation` | `2000` | `2000` | `0.021` | **遞減乘算** | `Physical Defense` | `Binding of Protection` | — |
| 15 | `Magical Mitigation` | `2000` | `2000` | `0.0201` | **遞減乘算** | `Magical Defense` | `Binding of Warding` | — |
| 16 | `Evade Chance` | `2000` | `2000` | `0.025` | **遞減乘算** | `Evade Chance` | `Binding of the Fleet` | — |
| 17 | `Block Chance` | `2000` | `2000` | `0.0998` | **遞減乘算** | `Block Chance` | `Binding of the Barrier` | — |
| 18 | `Parry Chance` | `2000` | `2000` | `0.0894` | **遞減乘算** | `Parry Chance` | `Binding of the Nimble` | — |
| 19 | `Resist Chance` | `2000` | `2000` | `0.0804` | **遞減乘算** | `Resist Chance` | `Binding of Negation` | — |
| 20 | `HP Bonus` | `Infinity` | `∞` | `0` | 加算 | — | — | `Juggernaut` (`+2%/lv`) |
| 21 | `MP Bonus` | `Infinity` | `∞` | `0` | 加算 | — | — | `Capacitor` (`+2%/lv`) |
| 22 | `Burden` | `Infinity` | `∞` | `0.07` (`hvUtils` 記 `0`) | 加算 | — | — | — |
| 23 | `Interference` | `Infinity` | `∞` | `0.07` (`hvUtils` 記 `0`) | 加算 | — | — | — |
| 24–29 | `Fire / Cold / Elec / Wind / Holy / Dark EDB` | `200` | `199.20319` (`50/0.251`) | `0.0804` | 加算 | `<Elem> Spell Damage` | `Surtr` / `Niflheim` / `Mjolnir` / `Freyr` / `Heimdall` / `Fenrir` | — |
| 30–34 | `Elemental / Divine / Forbidden / Deprecating / Supportive` (Prof) | `250 / 7` (`35.7143`) | `35.46099` (`50/1.410`) | `0.0306` | 加算 | `<Prof> Proficiency` | `the Elementalist` / `Heaven-sent` / `Demon-fiend` / `Curse-weaver` / `Earth-walker` | — |
| 35–37 | `Crushing / Slashing / Piercing` (MIT) | `Infinity` | `∞` | `0.0155` / `0.0153` / `0.015` | **遞減乘算** | `<Phys> Mitigation` | `Dampening` / `Stoneskin` / `Deflection` | — |
| 38–43 | `Fire / Cold / Elec / Wind / Holy / Dark MIT` | `Infinity` | `∞` | `0.1` | **遞減乘算** | `<Elem> Mitigation` | `the Fire-eater` / `Frost-born` / `Thunder-child` / `Wind-waker` / `Thrice-blessed` / `Spirit-ward` | `<Elem>proof` (`+4%/lv`) |
| 44–49 | `Strength / Dexterity / Agility / Endurance / Intelligence / Wisdom` (PAB) | `250 / 7` (`35.7143`) | `35.4108` (`50/1.412`) | `0.03` | 加算 | `<Stat> Bonus` | `the Ox` / `Raccoon` / `Cheetah` / `Turtle` / `Fox` / `Owl` | — |

- **多件裝備遞減乘算公式（`multi: true`，見 `hvUtils.js:1692-1694`）**：
  對於標記為遞減乘算的百分比屬性（`Attack Speed`、`Attack Crit Chance`、`Magic Crit Chance`、`Mana Conservation`、`Physical Mitigation`、`Magical Mitigation`、`Evade Chance`、`Block Chance`、`Parry Chance`、`Resist Chance`、三物理減傷、六元素減傷），全身穿戴 $M$ 件裝備後的總裝備加成百分比為：
  $$\text{Total\_Equip\_Stat}\% = \left(1 - \prod_{m=1}^{M} \left(1 - \frac{v_m}{100}\right)\right) \times 100$$

---

#### (B) 基礎骰值（`0–250`）轉 Lv.0 Base Stat 與等級縮放公式（v0.91 vs v0.86）

1. **v0.91 基礎骰值 $R \in [0, 250]$ 轉 Lv.0 基礎值 `Base_Stat(R)`**：
   - 在 v0.91 中，每項具對應 Binding 的屬性 $i$ 在該品質的骰值區間 `[Min_R, Max_R]` 獨立擲出 $R_i$；無對應 Binding 的屬性則使用該裝備所有具 Binding 屬性的平均骰值 $\bar{R} = \frac{1}{k}\sum_{i=1}^k R_i$。
   - 設該裝備基底在該詞綴組合下的 `Crude Min`（即 $R=0$，對應 `Roll_Min * fluc`）為 $B_0$，`Peerless Max`（即 $R=200$，對應 `Roll_Max * fluc` 或 `$equip.pmax`）為 $B_{200}$：
     - **正向屬性（數值隨品質遞增）**：
       $$\text{Base\_Stat}(R) = B_0 + s(R) \times (B_{200} - B_0),\qquad s(R) = \begin{cases} (R/200)^{1.52}, & R \le 200 \\ R/200, & R > 200 \end{cases}$$
       當 $R = 200$（Peerless）時，$\text{Base\_Stat}(200) = B_{200}$；當 $R = 250$（Ultimate）時，$\text{Base\_Stat}(250) = B_0 + 1.25 \times (B_{200} - B_0)$。
       - **曲線依據（暫定擬合）**：先前版本為線性 $s(R) = R/200$，但 wiki 品質欄（Crude Max = R 40、Legendary Min = R 170 等）在中段明顯低於直線（Axe `Attack Damage` 無前綴：R=40 表 32.42、直線 35.89；R=170 表 53.39、直線 55.37）。`hvUtils.js` / `hvstat.user.js` / `data_gh` 沒有寫明 R→數值的公式，故以 `Equipment_Ranges_Weapons / Clothes / Light / Heavy.md` 品質欄數值擬合冪次：取 R = 30、40、60、70、90、100、120、130、150、160、170、180 共 2088 點（159 列、30 個基底區段；排除 Crude 欄為 0/0 的列與跨距 < 3 的列），指數 1.52（掃 1.48–1.56，最佳 1.516），平均相對誤差 0.52%、中位數 0.24%、最大 5.8%（小數值的四捨五入，以及 Rapier / Club「Others」傷害的幾個離群最小值）。
       - **R > 200**：任何公開來源都沒有 R > 200 的數值，故保留上述 R = 250 的定義，200–250 之間以直線接上（在 200 連續、單調遞增、250 時為 1.25）。
     - **負向妥協屬性（Burden 與 Interference，數值隨品質遞減）**：
       設 $R=0$ 時的最大（最差）負重／干涉為 $B_0 = \text{Roll\_Min} \times 0.07$，$R=200$ 時的 Peerless 最小（最佳）負重／干涉為 $B_{200} = \text{Roll\_Max} \times 0.07$（其中 $\text{Roll\_Min} > \text{Roll\_Max}$）：
       $$\text{Compromise\_Stat}(\bar{R}) = \max\left(0,\ B_0 - s(\bar{R}) \times (B_0 - B_{200})\right)$$
       （$s$ 同上；Burden／Interference 的品質欄 Min／Max 是數值本身的小／大，所以 Min 對應較高的 R。）
2. **v0.91 強化（Forging）與道具界（IW）加成後的有效基礎值 `Forged_Base`**：
   根據 [The Armory#Challenge Item World](https://ehwiki.org/wiki/The_Armory#Challenge_Item_World) 與 [The Armory#Forging](https://ehwiki.org/wiki/The_Armory#Forging)，設裝備當前鍛造等級為 $L_{\text{forge}} \in [0, 33]$、已完成 IW 等級為 $L_{\text{iw}} \in [0, 33]$：
   - **對於 `Attack Damage` (ADB) 與 `Magic Damage` (MDB)**（每級 IW `+2%`、每級 Forge `+2%`）：
     $$\text{Forged\_Base} = \text{Base\_Stat}(R) \times \left(1 + 0.02 \times L_{\text{forge}} + 0.02 \times L_{\text{iw}}\right)$$
     （註：若 Forge 與 IW 分屬兩個乘區則為 $(1 + 0.02 L_{\text{forge}})(1 + 0.02 L_{\text{iw}})$，兩者在百科均表述為 `increases all base stats by 1% (2% for Physical and Magical attack)`）。
   - **對於其餘所有可成長基礎屬性**（每級 IW `+1%`、每級 Forge `+1%`）：
     $$\text{Forged\_Base} = \text{Base\_Stat}(R) \times \left(1 + 0.01 \times L_{\text{forge}} + 0.01 \times L_{\text{iw}}\right)$$
3. **v0.86 對數鍛造與品質加成公式（供對照）**：
   根據 [Equipment Ranges](https://ehwiki.org/wiki/Equipment_Ranges) 與 `hvUtils.js:1776-1797`：
   $$\text{qualityBonus} = \frac{\text{PXP}_0 - 100}{25} \times \text{fluc}$$
   $$\text{forgeCoeff} = 1 + c \times \ln\left(1 + 0.1 \times L_{\text{forge}}\right), \quad c = \begin{cases} 0.279575 \text{ (wiki 記 } 0.278875\text{)}, & \text{ADB / MDB } (L_{\text{forge}} \le 100) \\ 0.2, & \text{其餘屬性 } (L_{\text{forge}} \le 50) \end{cases}$$
   $$\text{Forged\_Base}_{\text{v0.86}} = (\text{baseValue} - \text{qualityBonus}) \times \text{forgeCoeff} \times \text{iwCoeff} + \text{qualityBonus} + \text{iwBonus}$$
4. **等級縮放公式（Level Scaling，v0.86 與 v0.91 通用）**：
   根據 [Level Scaling](https://ehwiki.org/wiki/Level_Scaling) 與 `hvUtils.js:1795`，設裝備有效等級為 $\text{Lv}$（若已 Soulbound 則 $\text{Lv} = \text{Player\_Lv}$；若為耐久度低於 50% 的受損裝備，有效屬性按 $\min(1, \text{Condition}\% / 50\%)$ 線性折減）：
   $$\text{Final\_Stat} = \text{Forged\_Base} \times \left(1 + \frac{\text{Lv}}{\text{Scale\_Factor}}\right)$$
   （面板顯示時無條件捨去或四捨五入至小數點後 2 位，武器大傷顯示為整數）。

---

#### (C) 負重（Burden）與干涉（Interference）懲罰公式

根據 [Burden](https://ehwiki.org/wiki/Burden) 與 [Interference](https://ehwiki.org/wiki/Interference)：

1. **全身總負重 $B_{\text{total}}$ 的三階段懲罰**：
   - **對閃避率（Evade Chance）的乘算懲罰**（每 1 點 Burden 降低 $\frac{4}{3}\% \approx 1.333\%$，於 **$B_{\text{total}} \ge 75$** 時完全歸零）：
     $$\text{Effective\_Evade} = \text{Base\_Evade} \times \max\left(0,\ 1 - \frac{B_{\text{total}}}{75}\right)$$
   - **對近戰攻速加成（Melee Attack Speed Bonus）的懲罰**（當 **$B_{\text{total}} > 40$** 時開始線性扣減，於 **$B_{\text{total}} \ge 90$** 時完全消除所有攻速加成）：
     $$\text{Speed\_Penalty\_Mult} = \begin{cases} 1, & B_{\text{total}} \le 40 \\ \max\left(0,\ 1 - \frac{B_{\text{total}} - 40}{50}\right), & B_{\text{total}} > 40 \end{cases}$$
   - **對物理暴擊率（Physical Crit Chance）的懲罰**（當 **$B_{\text{total}} > 70$** 時開始扣減，於 **$B_{\text{total}} = 120$** 封頂，最多扣減 `2%` 或每點扣減）：
     百科原文：`If burden > 70, decreases physical crit rate by 2%, (capped at 120 burden)`。
2. **全身總干涉 $I_{\text{total}}$ 的懲罰**：
   - **對法術魔力消耗（Spell MP Cost）的懲罰**：每 1 點 Interference 使所有法術 MP 消耗增加 **`+0.5%`**：
     $$\text{MP\_Cost\_Mult}_{\text{interference}} = 1 + 0.005 \times I_{\text{total}}$$

---

### 1.6 裝備基底 × 詞綴之 `Base Rolls`、`Crude Min` 與 `Peerless Max` 完整數值表

以下完整提取自 [Equipment Ranges Weapons](https://ehwiki.org/wiki/Equipment_Ranges_Weapons)、[Equipment Ranges Clothes](https://ehwiki.org/wiki/Equipment_Ranges_Clothes)、[Equipment Ranges Light](https://ehwiki.org/wiki/Equipment_Ranges_Light)、[Equipment Ranges Heavy](https://ehwiki.org/wiki/Equipment_Ranges_Heavy) 及 `hvUtils.js:1468-1524`（`$equip.pmax`）：

#### (A) 單手武器（One-Handed Weapons）數值範圍全表

| 基底 | 屬性名稱 | 詞綴條件 | Base Rolls `[Min, Max]` | `fluc` | Crude `[Min, Max]` ($R=0..40$) | Leg Min / Peerless Max ($R=170..200$) |
|---|---|---|---|---|---|---|
| **Axe** | `Attack Damage` | `Slaughter` / `Others` | `[470, 888]` / `[350, 701]` | `0.0854` | `[0, 0]` / `[29.90, 32.42]` | `[67.79, 75.92]` / `[53.39, 59.87]` |
| **Axe** | `Attack Accuracy` | All | `[75, 211]` | `0.06069` | `[4.56, 5.27]` | `[11.04, 12.81]` |
| **Axe** | `Attack Crit Chance` | All | `[150, 511]` | `0.0105` | `[1.58, 1.89]` | `[4.55, 5.37]` |
| **Axe** | `Burden` | `Ethereal` / `Others` | `[0, 0]` / `[250, 200]` | `0.07` | `0` / `[17.22, 17.50]` | `0` / `[14.00, 14.77]` |
| **Axe** | `Interference` | `Ethereal/Battlecaster` / `Others` | `[0, 0]` / `[150, 50]` | `0.07` | `0` / `[9.94, 10.50]` | `0` / `[3.50, 5.04]` |
| **Axe** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.21, 11.34]` |
| **Axe** | `STR / DEX / AGI` | 基礎 PAB | `[84, 211]` / `[66, 136]` / `[50, 111]` | `0.03` | — | `[5.46, 6.33]` / `[3.63, 4.08]` / `[2.94, 3.33]` |
| **Club** | `Attack Damage` | `Slaughter` / `Others` | `[353, 792]` / `[250, 621]` | `0.0854` | `—` / `[21.36, 23.98]` | `[59.54, 67.72]` / `[45.36, 53.04]` |
| **Club** | `Attack Accuracy` | `Balance` / `Others` | `[216, 511]` / `[80, 211]` | `0.06069` | `—` / `[4.86, 5.52]` | `[27.02, 31.02]` / `[11.11, 12.81]` |
| **Club** | `Attack Crit Chance` | `Balance` / `Others` | `[344, 991]` / `[124, 511]` | `0.0105` | `—` / `[1.31, 1.66]` | `[8.95, 10.41]` / `[4.48, 5.37]` |
| **Club** | `Magic Acc / Mana Cons` | `Battlecaster` | `[82, 161]` / `[81, 161]` | `0.0491` / `0.1` | — | `[7.03, 7.91]` / `[14.44, 16.11]` |
| **Club** | `Parry Chance` | `Nimble` / `Others` | `[54, 101]` / `0` | `0.0894` | — | `[8.17, 9.04]` / `0` |
| **Club** | `Burden` / `Interference` | `Others` (非 Ethereal) | `[220, 140]` / `[150, 50]` | `0.07` | `[14.91, 15.40]` / `[9.94, 10.50]` | `[9.80, 11.06]` / `[3.50, 5.04]` |
| **Club** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.22, 11.34]` |
| **Club** | `STR / DEX / AGI` | 基礎 PAB | `[84, 211]` / `[55, 136]` / `[56, 136]` | `0.03` | — | `[5.46, 6.33]` / `[3.54, 4.08]` / `[3.54, 4.08]` |
| **Rapier** | `Attack Damage` | `Slaughter` / `Others` | `[230, 601]` / `[150, 461]` | `0.0854` | `—` / `[12.82, 15.02]` | `[42.80, 51.33]` / `[31.95, 39.38]` |
| **Rapier** | `Attack Accuracy` | `Balance` / `Others` | `[330, 736]` / `[150, 361]` | `0.06069` | `—` / `[9.11, 10.19]` | `[39.42, 44.68]` / `[19.19, 21.92]` |
| **Rapier** | `Attack Crit Chance` | `Balance` / `Others` | `[342, 991]` / `[124, 511]` | `0.0105` | `—` / `[1.31, 1.66]` | `[8.88, 10.41]` / `[4.48, 5.37]` |
| **Rapier** | `Magic Acc / Mana Cons` | `Battlecaster` | `[81, 161]` / `[81, 161]` | `0.0491` / `0.1` | — | `[7.04, 7.91]` / `[14.43, 16.11]` |
| **Rapier** | `Parry Chance` | `Nimble` / `Others` | `[137, 301]` / `[75, 211]` | `0.0894` | `—` / `[6.72, 7.79]` | `[23.81, 26.94]` / `[16.29, 18.89]` |
| **Rapier** | `Burden` / `Interference` | `Others` | `[180, 90]` / `[150, 50]` | `0.07` | `[12.04, 12.60]` / `[9.94, 10.50]` | `[6.30, 7.70]` / `[3.50, 5.04]` |
| **Rapier** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.22, 11.34]` |
| **Rapier** | `STR / DEX / AGI` | 基礎 PAB | `[56, 136]` / `[84, 211]` / `[56, 136]` | `0.03` | — | `[3.54, 4.08]` / `[5.46, 6.33]` / `[3.54, 4.08]` |
| **Shortsword** | `Attack Damage` | `Slaughter` / `Others` | `[293, 721]` / `[200, 561]` | `0.0854` | `—` / `[17.09, 19.63]` | `[53.22, 61.58]` / `[41.26, 47.92]` |
| **Shortsword** | `Attack Accuracy` | `Balance` / `Others` | `[406, 886]` / `[200, 461]` | `0.06069` | `—` / `[12.15, 13.47]` | `[47.30, 53.79]` / `[24.59, 27.99]` |
| **Shortsword** | `Attack Crit Chance` | `Balance` / `Others` | `[371, 991]` / `[150, 511]` | `0.0105` | `—` / `[1.58, 1.89]` | `[8.99, 10.41]` / `[4.55, 5.37]` |
| **Shortsword** | `Attack Speed` | `Swiftness` / `Others` | `[55, 135]` / `0` | `0.0481` | — | `[5.69, 6.54]` / `0` |
| **Shortsword** | `Magic Acc / Mana Cons` | `Battlecaster` | `[82, 160]` / `[84, 159]` | `0.0491` / `0.1` | — | `[7.09, 7.91]` / `[14.52, 16.11]` |
| **Shortsword** | `Parry Chance` | All | `[75, 211]` | `0.0894` | `[6.72, 7.76]` | `[16.29, 18.89]` |
| **Shortsword** | `Burden` / `Interference` | `Others` | `[150, 75]` / `[150, 50]` | `0.07` | `[10.08, 10.50]` / `[9.94, 10.50]` | `[5.25, 6.44]` / `[3.50, 5.04]` |
| **Shortsword** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.23, 11.34]` |
| **Shortsword** | `STR / DEX / AGI` | 基礎 PAB | `[84, 211]` / `[84, 211]` / `[84, 211]` | `0.03` | — | `[5.46, 6.33]` × 3 |
| **Wakizashi** | `Attack Damage` | `Slaughter` / `Others` | `[238, 541]` / `[160, 411]` | `0.0854` | `—` / `[13.67, 15.44]` | `[39.84, 46.21]` / `[30.49, 35.11]` |
| **Wakizashi** | `Attack Accuracy` | `Balance` / `Others` | `[476, 811]` / `[250, 411]` | `0.06069` | `—` / `[15.18, 16.02]` | `[44.57, 49.24]` / `[22.90, 24.96]` |
| **Wakizashi** | `Attack Crit Chance` | `Balance` / `Others` | `[371, 991]` / `[150, 511]` | `0.0105` | `—` / `[1.58, 1.89]` | `[8.97, 10.41]` / `[4.55, 5.37]` |
| **Wakizashi** | `Attack Speed` | `Swiftness` / `Others` | `[143, 386]` / `[75, 261]` | `0.0481` | `—` / `[3.61, 4.38]` | `[16.12, 18.57]` / `[10.64, 12.56]` |
| **Wakizashi** | `Magic Acc / Mana Cons` | `Battlecaster` | `[80, 161]` / `[80, 161]` | `0.0491` / `0.1` | — | `[7.03, 7.91]` / `[14.33, 16.12]` |
| **Wakizashi** | `Parry Chance` | `Nimble` / `Others` | `[181, 341]` / `[120, 251]` | `0.0894` | `—` / `[10.75, 11.71]` | `[27.51, 30.53]` / `[19.97, 22.48]` |
| **Wakizashi** | `Burden` / `Interference` | `Others` | `[80, 40]` / `[120, 50]` | `0.07` | `[5.39, 5.60]` / `[7.98, 8.40]` | `[2.80, 3.43]` / `[3.50, 4.55]` |
| **Wakizashi** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.23, 11.35]` |
| **Wakizashi** | `STR / DEX / AGI` | 基礎 PAB | `[50, 111]` / `[110, 261]` / `[110, 261]` | `0.03` | — | `[2.94, 3.33]` / `[6.81, 7.83]` / `[6.81, 7.83]` |

#### (B) 雙手武器（Two-Handed Weapons）數值範圍全表

| 基底 | 屬性名稱 | 詞綴條件 | Base Rolls `[Min, Max]` | `fluc` | Crude `[Min, Max]` ($R=0..40$) | Leg Min / Peerless Max ($R=170..200$) |
|---|---|---|---|---|---|---|
| **Estoc** | `Attack Damage` | `Slaughter` / `Others` | `[504, 961]` / `[375, 761]` | `0.0854` | `—` / `[32.03, 34.80]` | `[73.01, 82.07]` / `[57.83, 64.99]` |
| **Estoc** | `Attack Accuracy` | `Balance` / `Others` | `[206, 436]` / `[75, 161]` | `0.06069` | `—` / `[4.56, 4.97]` | `[23.51, 26.47]` / `[8.70, 9.78]` |
| **Estoc** | `Attack Crit Chance` | `Balance` / `Others` | `[653, 1291]` / `[375, 760]` | `0.0105` | `—` / `[3.94, 4.28]` | `[12.01, 13.56]` / `[7.11, 7.99]` |
| **Estoc** | `Magic Acc / Mana Cons` | `Battlecaster` | `[134, 261]` / `[138, 261]` | `0.0491` / `0.1` | — | `[11.50, 12.82]` / `[23.41, 26.11]` |
| **Estoc** | `Burden` / `Interference` | `Others` | `[400, 200]` / `[200, 100]` | `0.07` | `[26.81, 28.00]` / `[13.44, 14.00]` | `[14.00, 17.08]` / `[7.00, 8.54]` |
| **Estoc** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.23, 11.34]` |
| **Estoc** | `STR / DEX / AGI` | 基礎 PAB | `[203, 386]` / `[83, 201]` / `[46, 131]` | `0.03` | — | `[10.32, 11.58]` / `[5.25, 6.03]` / `[3.36, 3.93]` |
| **Longsword** | `Attack Damage` | `Slaughter` / `Others` | `[547, 1153]` / `[400, 921]` | `0.0854` | `—` / `[34.17, 37.88]` | `[86.45, 98.47]` / `[68.93, 78.66]` |
| **Longsword** | `Attack Accuracy` | `Balance` / `Others` | `[215, 511]` / `[75, 211]` | `0.06069` | `—` / `[4.56, 5.26]` | `[27.38, 31.02]` / `[11.05, 12.81]` |
| **Longsword** | `Attack Crit Chance` | `Balance` / `Others` | `[680, 1351]` / `[400, 811]` | `0.0105` | `—` / `[4.20, 4.56]` | `[12.56, 14.19]` / `[7.58, 8.52]` |
| **Longsword** | `Magic Acc / Mana Cons` | `Battlecaster` | `[136, 261]` / `[144, 261]` | `0.0491` / `0.1` | — | `[11.85, 12.82]` / `[25.14, 26.11]` |
| **Longsword** | `Burden` / `Interference` | `Others` | `[500, 300]` / `[300, 150]` | `0.07` | `[33.81, 35.00]` / `[20.09, 21.00]` | `[21.00, 24.08]` / `[10.50, 12.81]` |
| **Longsword** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.31, 11.34]` |
| **Longsword** | `STR / DEX / AGI` | 基礎 PAB | `[213, 411]` / `[160, 311]` / `[81, 161]` | `0.03` | — | `[10.98, 12.33]` / `[8.31, 9.33]` / `[4.29, 4.83]` |
| **Mace** | `Attack Damage` | `Slaughter` / `Others` | `[503, 961]` / `[375, 761]` | `0.0854` | `—` / `[32.03, 34.81]` | `[73.37, 82.07]` / `[57.83, 64.99]` |
| **Mace** | `Attack Accuracy` | `Balance` / `Others` | `[216, 496]` / `[80, 201]` | `0.06069` | `—` / `[4.86, 5.45]` | `[26.48, 30.11]` / `[10.68, 12.20]` |
| **Mace** | `Attack Crit Chance` | `Balance` / `Others` | `[648, 1291]` / `[375, 760]` | `0.0105` | `—` / `[3.94, 4.28]` | `[12.01, 13.56]` / `[7.11, 7.99]` |
| **Mace** | `Magic Acc / Mana Cons` | `Battlecaster` | `[136, 261]` / `[141, 261]` | `0.0491` / `0.1` | — | `[11.50, 12.82]` / `[23.29, 26.11]` |
| **Mace** | `Burden` / `Interference` | `Others` | `[400, 200]` / `[200, 100]` | `0.07` | `[26.81, 28.00]` / `[13.44, 14.00]` | `[14.00, 17.08]` / `[7.00, 8.54]` |
| **Mace** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.22, 11.34]` |
| **Mace** | `STR / DEX / AGI` | 基礎 PAB | `[202, 391]` / `[134, 261]` / `[66, 136]` | `0.03` | — | `[10.44, 11.73]` / `[6.96, 7.83]` / `[3.63, 4.08]` |
| **Katana** | `Attack Damage` | `Slaughter` / `Others` | `[477, 961]` / `[350, 761]` | `0.0854` | `—` / `[29.90, 32.85]` | `[72.61, 82.07]` / `[57.39, 64.99]` |
| **Katana** | `Attack Accuracy` | `Balance` / `Others` | `[405, 886]` / `[200, 461]` | `0.06069` | `—` / `[12.15, 13.45]` | `[47.41, 53.78]` / `[24.58, 27.98]` |
| **Katana** | `Attack Crit Chance` | `Balance` / `Others` | `[685, 1351]` / `[400, 811]` | `0.0105` | `—` / `[4.20, 4.56]` | `[12.56, 14.19]` / `[7.58, 8.52]` |
| **Katana** | `Burden` / `Interference` | `Others` | `[400, 200]` / `[200, 100]` | `0.07` | `[26.81, 28.00]` / `[13.44, 14.00]` | `[14.00, 17.08]` / `[7.00, 8.54]` |
| **Katana** | `<Elem> EDB` | 對應元素前綴 | `[93, 141]` | `0.0804` | — | `[10.23, 11.34]` |
| **Katana** | `STR / DEX / AGI` | 基礎 PAB | `[213, 411]` / `[160, 311]` / `[57, 161]` | `0.03` | — | `[10.98, 12.33]` / `[8.31, 9.33]` / `[4.14, 4.83]` |

#### (C) 法杖（Staffs）與盾牌（Shields）數值範圍全表

| 基底 | 屬性名稱 | 詞綴條件 | Base Rolls `[Min, Max]` | `fluc` | Crude `[Min, Max]` | Leg Min / Peerless Max ($R=170..200$) |
|---|---|---|---|---|---|---|
| **所有四木杖** | `Attack Damage` | All | `[100, 400]` | `0.0854` | `[8.55, 10.68]` | `[28.68, 34.23]` |
| **Katalox** | `Magic Damage` | `Destruction` / `Others` | `[270, 629]` / `[150, 390]` | `0.082969` | `—` / `[12.45, 14.10]` | `[45.85, 52.20]` / `[28.09, 32.39]` |
| **Katalox** | `Magic Accuracy` | `Focus` / `Others` | `[345, 780]` / `[150, 390]` | `0.0491` | `—` / `[7.37, 8.35]` | `[33.40, 38.34]` / `[16.73, 19.18]` |
| **Katalox** | `Magic Crit Chance` | `Focus` / `Others` | `[445, 1086]` / `[250, 640]` | `0.0114` | `—` / `[2.85, 3.22]` | `[10.98, 12.39]` / `[6.34, 7.30]` |
| **Katalox** | `Mana Conservation` | `Focus` | `[115, 330]` | `0.1` | — | `[28.09, 33.08]` |
| **Katalox** | `Divine / Forbidden Prof` | 對應後綴 / 無後綴 | `[250, 530]` / `[90, 270]` | `0.0306` | `—` / `[2.76, 3.21]` | `[14.41, 16.24]` / `[7.10, 8.28]` |
| **Katalox** | `Deprecating Prof` | All | `[65, 200]` | `0.0306` | `[1.99, 2.33]` | `[5.26, 6.14]` |
| **Katalox** | `Holy / Dark EDB` | 雙詞綴 / 僅後綴 / 僅前綴 / 無 | `[289, 470]` / `[137, 340]` / `[149, 270]` / `[25, 140]` | `0.0804` | `[2.02, 2.80]` (無詞綴) | `37.84` / `27.39` / `21.76` / `11.31` (Peerless) |
| **Katalox** | `Fire/Cold/Elec/Wind EDB` | 對應前綴 | `[93, 140]` | `0.0804` | — | `[10.21, 11.31]` |
| **Katalox** | `Burden` / `INT` / `WIS` | 非 Ethereal / PAB | `[200, 100]` / `[76, 240]` / `[57, 160]` | `0.07` / `0.03` | `Burden [13.44, 14]` | `Burden [7.0, 8.54]` / `INT [6.12, 7.22]` / `WIS [4.13, 4.82]` |
| **Redwood** | `Magic Damage` | `Destruction` / `Others` | `[278, 623]` / `[150, 385]` | `0.082969` | `—` / `[12.47, 14.09]` | `[45.95, 51.71]` / `[27.76, 31.98]` |
| **Redwood** | `Magic Acc` / `Crit` / `Mana Cons` | `Focus` / `Others` | `[337, 773]` (Acc), `[294, 930]` (Crit), `[115, 330]` (MC) | 同上 | — | `Acc 38.0 / 18.94`, `Crit 10.61 / 5.82`, `MC 33.09` |
| **Redwood** | `Elemental Prof` / `Sup & Dep Prof` | 後綴 `[251, 530]` / 無 `[100, 270]` / Sup&Dep `[50, 140]` | `0.0306` | `[3.07, 3.48]` | `Ele 16.24 / 8.29`, `Sup 4.31`, `Dep 4.31` |
| **Redwood** | `Fire/Cold/Elec/Wind EDB` | 雙詞綴 / 僅後綴 / 僅前綴 / 無 | `[302, 470]` / `[142, 340]` / `[150, 270]` / `[25, 140]` | `0.0804` | `[2.04, 2.81]` | `37.85` / `27.40` / `21.77` / `11.32` (Peerless) |
| **Redwood** | `Burden` / `INT` / `WIS` | 非 Ethereal / PAB | `[150, 70]` / `[84, 211]` / `[84, 211]` | `0.07` / `0.03` | `Burden [10.01, 10.5]` | `Burden [4.90, 6.16]` / `INT [5.46, 6.32]` / `WIS [5.46, 6.32]` |
| **Willow** | `Magic Damage` | `Destruction` / `Others` | `[270, 623]` / `[150, 385]` | `0.082969` | `—` / `[12.47, 14.10]` | `[44.93, 51.71]` / `[27.76, 31.98]` |
| **Willow** | `Counter-Resist` | All | `[25, 135]` | `0.1` | `[2.54, 3.40]` | `[11.28, 13.58]` |
| **Willow** | `Deprecating Prof` / `Ele & For Prof` | 後綴 `[349, 645]` / 無 `[190, 385]` / Ele&For `[65, 200]` | `0.0306` | `[5.83, 6.30]` | `Dep 19.76 / 11.81`, `Ele 6.14`, `For 6.14` |
| **Willow** | `Dark EDB` / `Elec & Wind EDB` | Dark: 前綴或後綴 `[179, 330]`、無 `[40, 200]`（雙詞綴 `37.85`）；Elec/Wind: 前綴 `[139, 230]`、無 `[25, 100]` | `0.0804` | — | `Dark: 26.60 / 16.14`, `Elec & Wind: 18.56 / 8.10` |
| **Willow** | `Burden` / `INT` / `WIS` | 非 Ethereal / PAB | `[150, 70]` / `[57, 161]` / `[76, 241]` | `0.07` / `0.03` | `Burden [10.01, 10.5]` | `Burden [4.90, 6.16]` / `INT [4.13, 4.82]` / `WIS [6.12, 7.22]` |
| **Oak** | `Magic Damage` | `Destruction` / `Others` | 同 Willow (`[270, 623]` / `[150, 385]`) | `0.082969` | `—` / `[12.45, 14.09]` | `51.71` / `[27.77, 31.98]` |
| **Oak** | `Counter-Resist` | All | `[25, 135]` | `0.1` | `[2.54, 3.42]` | `[11.30, 13.58]` |
| **Oak** | `Supportive Prof` / `Ele & Div Prof` | 後綴 `[341, 645]` / 無 `[190, 385]` / Ele&Div `[75, 210]` | `0.0306` | `[5.82, 6.31]` | `Sup 19.76 / 11.81`, `Ele 6.45`, `Div 6.45` |
| **Oak** | `Holy EDB` / `Fire & Cold EDB` | Holy: 雙 `[318, 530]` / 後綴 `[155, 400]` / 前綴 `[179, 330]` / 無 `[40, 200]`；Fire/Cold: 前綴 `[137, 230]` / 無 `[25, 100]` | `0.0804` | — | `Holy: 42.68 / 32.22 / 26.60 / 16.14`, `Fire & Cold: 18.56 / 8.10` |
| **Oak** | `Burden` / `INT` / `WIS` | 非 Ethereal / PAB | `[150, 70]` / `[58, 161]` / `[76, 241]` | `0.07` / `0.03` | `Burden [10.01, 10.5]` | `Burden [4.90, 6.16]` / `INT [4.14, 4.82]` / `WIS [6.00, 7.22]` |
| **Buckler** | `Physical / Magical MIT` | `Protection` `[83, 200]` / 無 `[50, 110]`；`Warding` `[147, 313]` / 無 `[50, 110]` | `0.021` / `0.0201` | `PMit [1.05, 1.15]` | `PMit: 4.22 / 2.33`, `MMit: 6.65 / 2.23` |
| **Buckler** | `Block` / `Parry` / `ASpd` | `Barrier` `[188, 375]` / 無 `[150, 310]`；`Nimble` `[53, 101]`；`Agile` `[35, 75]` | `0.0998` / `0.0894` / `0.0481` | `Block [14.98, 16.34]` | `Block: 37.52 / 31.03`, `Parry: 9.04`, `ASpd: 3.65` |
| **Buckler** | `Burden` / `Interference` | `Mithril` `[51, 30]` / 無 `[80, 40]`；Interference `[80, 20]` | `0.07` | `Burden [5.39, 5.6]` | `Burden: 2.10 (Mithril) / 2.80`, `Intr: 1.40` |
| **Buckler** | `Crush/Slash/Pierce MIT` / `PAB` | `Reinforced` `[116, 210]`；`STR/DEX/AGI/END` `[60, 211]` (4 抽 3) | `0.0155..` / `0.03` | — | `MIT: 3.27 / 3.23 / 3.16`, `PAB: [5.31, 6.33]` |
| **Kite Shield** | `Physical / Magical MIT` | `Protection` `[114, 260]` / 無 `[75, 160]`；`Warding` `[178, 391]` / 無 `[75, 161]` | `0.021` / `0.0201` | `PMit [1.58, 1.72]` | `PMit: 5.48 / 3.38`, `MMit: 7.86 / 3.24` |
| **Kite Shield** | `Block` / `ASpd` | `Block` 無後綴 `[200, 360]`；`Agile` `[35, 75]` | `0.0998` / `0.0481` | `Block [19.97, 21.35]` | `Block: 36.02` (無 Barrier), `ASpd: 3.65` |
| **Kite Shield** | `Burden` / `Interference` | `Mithril` `[166, 113]` / 無 `[250, 150]`；Intr `[250, 150]` | `0.07` | `Burden [16.94, 17.5]` | `Burden: 7.91 (Mithril) / 10.50`, `Intr: 10.50` |
| **Kite Shield** | `Crush/Slash/Pierce MIT` | 雙詞綴 `[356, 655]` / 僅後綴 `[170, 460]` / 僅前綴 `[117, 210]` | `0.0155 / 0.0153 / 0.015` | — | `Crush: 10.24 / 7.14 / 3.27`, `Slash: 10.11 / 7.05 / 3.23`, `Pierce: 9.91 / 6.91 / 3.16` |
| **Force Shield** | `Physical / Magical MIT` | `Protection` `[123, 260]` / 無 `[81, 160]`；`Warding` `[195, 391]` / 無 `[81, 161]` | `0.021` / `0.0201` | — | `PMit: 5.48 / 3.38`, `MMit: 7.86 / 3.24` |
| **Force Shield** | `Block` / `Burden` / `Intr` | `Block` `[273, 385]`；`Burden` `[91, 40]`；`Intr` `[569, 400]` | `0.0998` / `0.07` / `0.07` | — | `Block: [35.64, 38.52]`, `Burden: [2.80, 3.71]`, `Intr: [28.00, 31.08]` |
| **Force Shield** | `Specific MIT` / `PAB` | 物理後綴 `[235, 460]`；元素前綴 `[149, 261]`；PAB `[77, 211]` | `0.0155..` / `0.1` / `0.03` | — | `Phys MIT: 7.14 / 7.05 / 6.91`, `Elem MIT: [22.74, 26.10]`, `PAB: [5.31, 6.33]` |

#### (D) 防具頭部基準（Head Slot = `1.0x`）數值範圍全表（其餘四部位直接乘上 `Body 1.2x`、`Hands 0.9x`、`Legs 1.1x`、`Feet 0.8x`）

| 頭部基底 (`1.0x`) | 屬性名稱 | 詞綴條件 | Base Rolls `[Min, Max]` | `fluc` | Crude `[Min, Max]` ($R=0..40$) | Leg Min / Peerless Max ($R=170..200$) |
|---|---|---|---|---|---|---|
| **Cotton Cap** | `Attack / Magic Accuracy` | All | `[15, 76]` / `[25, 86]` | `0.06069` / `0.0491` | `[0.92, 1.21]` / `[1.23, 1.47]` | `[3.89, 4.62]` / `[3.63, 4.23]` |
| **Cotton Cap** | `Cast Speed` / `Mana Cons` | `Charged` `[37, 70]` / `Frugal` `[23, 36]` | `0.0489` / `0.1` | — | `[2.99, 3.47]` / `[3.31, 3.61]` |
| **Cotton Cap** | `Physical / Magical MIT` | `Protection` `[149, 320]` / 無 `[100, 210]`；`Warding` `[215, 451]` / 無 `[100, 210]` | `0.021` / `0.0201` | `[2.10, 2.29]` / `[2.01, 2.19]` | `PMit: [6.12, 6.74] / [3.95, 4.43]`，`MMit: [8.05, 9.07] / [3.78, 4.24]` |
| **Cotton Cap** | `Evade` / `Resist` / `Crush MIT` | All | `[50, 161]` / `[25, 75]` / `[100, 210]` | `0.025` / `0.0804` / `0.0155` | `Evade [1.25, 1.47]` | `Evade [3.45, 4.03]`, `Resist [5.31, 6.11]`, `Crush [2.91, 3.27]` |
| **Cotton Cap** | `5 Proficiencies` / `6 Elem MIT` | 對應後綴 `[138, 270]` / 對應前綴 `[149, 261]` | `0.0306` / `0.1` | — | `Prof: [7.38, 8.29]`, `Elem MIT: [22.86, 26.11]` |
| **Cotton Cap** | `AGI / INT / WIS` | 基礎 PAB | `[48, 161]` / `[59, 211]` / `[60, 211]` | `0.03` | — | `[4.08, 4.83]` / `[5.31, 6.33]` / `[5.31, 6.33]` |
| **Phase Cap** | `Attack / Magic Accuracy` | All | `[26, 76]` / `[52, 110]` | `0.06069` / `0.0491` | — | `[3.88, 4.62]` / `[4.76, 5.45]` |
| **Phase Cap** | `MDB / Spell Crit Dmg / Cast Spd / Mana Cons` | `Radiant` `[28, 50]` / `Mystic` `[254, 391]` / `Charged` `[37, 70]` / `Frugal` `[23, 36]` | `0.082969` / `0.01` / `0.0489` / `0.1` | — | `MDB [3.74, 4.23]`, `SCD [3.52, 3.91]`, `CSpd [2.99, 3.47]`, `MC [3.31, 3.61]` |
| **Phase Cap** | `PMit / MMit / Evade / Resist / Crush MIT` | All | `[90, 160]` / `[119, 210]` / `[119, 211]` / `[35, 81]` / `[90, 161]` | 同上 | — | `PMit [3.01, 3.38]`, `MMit [3.78, 4.24]`, `Evade [4.70, 5.28]`, `Resist [5.63, 6.52]`, `Crush [2.22, 2.50]` |
| **Phase Cap** | `<Elem> EDB` / `<Elem> MIT` | 6 神名後綴 `[120, 211]` / 6 元素前綴 `[150, 261]` | `0.0804` / `0.1` | — | `EDB: [15.12, 16.97]`, `Elem MIT: [22.73, 26.11]` |
| **Phase Cap** | `AGI / INT / WIS` | 基礎 PAB | `[76, 201]` / `[93, 236]` / `[95, 236]` | `0.03` | — | `[5.07, 6.03]` / `[6.00, 7.08]` / `[6.00, 7.08]` |
| **Leather Helmet** | `Physical / Magical MIT` | `Protection` `[328, 531]` / 無 `[250, 386]`；`Warding` `[275, 595]` / 無 `[150, 331]` | `0.021` / `0.0201` | `PMit [5.25, 5.50]` | `PMit: [10.33, 11.17] / [7.51, 8.12]`，`MMit: [10.55, 11.97] / [5.89, 6.67]` |
| **Leather Helmet** | `ASpd / Evade / Resist / Burden / Intr` | `Agile` `[35, 76]`；`Evade` `[25, 101]`；`Resist` `[40, 131]`；`Burden` `[100, 50]`；`Intr` `[180, 100]` | 同上 | `Burden [6.72, 7.0]` | `ASpd [3.12, 3.69]`, `Evade [2.17, 2.54]`, `Resist [9.06, 10.59]`, `Burden [3.50, 4.27]`, `Intr [7.00, 8.26]` |
| **Leather Helmet** | `Crush / Slash / Pierce MIT` | 雙詞綴 / 僅後綴 / 僅前綴 / 無 | Crush&Slash 無 `[250, 511]`；Pierce 無 `[125, 262]` | `0.0155 / 0.0153 / 0.015` | `Crush [3.88, 4.21]` | Peerless Max：`Crush 18.01 / 14.91 / 11.03 / 7.93`；`Slash 17.77 / 14.71 / 10.89 / 7.83`；`Pierce 13.68 / 10.68 / 6.93 / 3.93` |
| **Leather Helmet** | `STR / DEX / AGI / END` | 基礎 PAB（輕甲保證 4 項） | `[57, 161]` / `[57, 161]` / `[47, 136]` / `[47, 136]` | `0.03` | — | `STR & DEX: [4.16, 4.85]`, `AGI & END: [3.50, 4.10]` |
| **Shade Helmet** | `ADB / Acc / Crit / Crit Dmg / ASpd` | `ADB` `[43, 132]`；`Acc` `[52, 111]`；`Shadowdancer Crit` `[162, 261]`；`Savage CritDmg` `[200, 313]`；`Agile ASpd` `[36, 76]` | 同上 | — | `ADB [9.37, 11.25]`, `Acc [5.70, 6.78]`, `Crit [2.44, 2.75]`, `CritDmg [2.78, 3.12]`, `ASpd [3.12, 3.69]` |
| **Shade Helmet** | `PMit / MMit / Evade / Resist / Intr` | `PMit` `[180, 332]`；`MMit` `[148, 262]`；`Evade` Fleet/SD `[130, 266]` / 無 `[72, 178]`；`Resist` Neg `[75, 266]` / 無 `[72, 176]`；`Intr` `[187, 120]` (`Arcanist` 為 `1/4`) | 同上 | — | `PMit [6.15, 6.97]`, `MMit [4.68, 5.26]`, `Evade 6.67 / 4.42`, `Resist 21.44 / 14.21`, `Intr 8.40` (`Arcanist 2.10`) |
| **Shade Helmet** | `Crush & Slash MIT / PAB` | `Crush` `[223, 387]`；`Slash` `[224, 387]`；`STR & END` `[57, 137]`；`DEX & AGI` `[70, 162]`；`Arcanist MAcc` `[85, 142]`、`INT & WIS` `[64, 112]` | 同上 | — | `Crush 5.99`, `Slash 5.92`, `STR/END 4.10`, `DEX/AGI 4.85`, `Arcanist MAcc 7.01, INT/WIS 3.38` |
| **Plate Helmet** | `Physical / Magical MIT` | `Protection` `[479, 680]` / 無 `[375, 510]`；`Warding` `[326, 661]` / 無 `[190, 386]` | `0.021` / `0.0201` | `PMit [7.88, 8.12]` | `PMit: [13.34, 14.30] / [10.12, 10.73]`，`MMit: [11.86, 13.29] / [6.92, 7.76]` |
| **Plate Helmet** | `Block / Burden / Intr` | `Shielding Block` `[30, 61]`；`Burden` Mithril `[203, 150]` / 無 `[300, 200]`；`Intr` `[300, 200]` | `0.0998` / `0.07` | `Burden [20.44, 21.0]` | `Block [5.20, 6.09]`, `Burden 10.50 (Mithril) / 14.00`, `Intr [14.00, 15.54]` |
| **Plate Helmet** | `Crush / Slash / Pierce MIT & PAB` | `Crush` 後綴 `[316, 836]` / 無 `[125, 385]`；`Slash & Pierce` 後綴 `[561, 1086]` / 無 `[375, 635]`；`STR/DEX` `[48, 161]`、`END` `[60, 211]` | 同上 | — | `Crush 12.96 / 5.98`, `Slash 16.62 / 9.73`, `Pierce 16.29 / 9.54`, `STR/DEX 4.83`, `END 6.33` |
| **Power Helmet** | `Attack Damage / Accuracy` | `ADB`: Slaughter `[139, 301]` / 無 `[77, 211]`；`Acc`: Balance `[148, 346]` / 無 `[30, 101]` | `0.0854` / `0.06069` | — | `ADB: [19.87, 25.73] / [13.01, 18.04]`，`Acc: [18.12, 21.02] / [5.06, 6.15]` |
| **Power Helmet** | `Attack Crit / Crit Damage` | `Crit`: Balance `[246, 540]` / 無 `[44, 136]`；`CritDmg`: Savage `[287, 436]` / 無 `[78, 136]` | `0.0105` / `0.01` | — | `Crit: [4.92, 5.68] / [1.19, 1.43]`，`CritDmg: [3.94, 4.36] / [1.22, 1.36]` |
| **Power Helmet** | `Physical / Magical MIT` | `Protection` `[352, 531]` / 無 `[274, 386]`；`Warding` `[315, 571]` / 無 `[178, 311]` | `0.021` / `0.0201` | — | `PMit: [10.24, 11.16] / [7.50, 8.11]`，`MMit: [10.16, 11.48] / [5.57, 6.26]` |
| **Power Helmet** | `Burden / Intr / Specific MIT / PAB` | `Burden` Mithril `7.91` / 無 `10.50`；`Intr` `17.50`；`Crush/Slash/Pierce` `4.82 / 7.82 / 7.67`；`STR/DEX/END` `[95, 236] / [78, 211] / [61, 161]` | 同上 | — | `STR [6.01, 7.09]`, `DEX [5.32, 6.34]`, `END [4.09, 4.84]` |

---

## 二、The Armory（v0.91 鍛造／強化／護符／融合／拆解／修理）完整規格

### 2.1 Soulbind（靈魂綁定）公式與等級同步規則

根據 [The Armory#Soulbind](https://ehwiki.org/wiki/The_Armory#Soulbind) 與 [Items#Soul Fragments](https://ehwiki.org/wiki/Items#Soul_Fragments)：
- **前置必要性**：在 v0.91 中，裝備**必須先完成 Soulbind**，才可執行任何改變屬性的改造（包含挑戰 Item World、執行 Forging 強化、鑲嵌 Charms / Pouches、執行 Stat Fusion 與自由命名）。
- **綁定效果**：
  1. 裝備變為不可交易（`Untradeable` / `Soulbound`），但仍可拆解（Salvage）。
  2. 裝備等級立即同步為玩家當前等級，並隨玩家升級（或切換等級）永遠同步縮放（若原裝備等級高於玩家等級，綁定後面板數值會隨等級同步下調，但底層 `Base_Stat` 不變）。
  3. 玩家無法穿戴高於自身等級的未綁定裝備，但**可對高於自身等級 `100 級以內`（即 $\text{Item\_Lv} - \text{Player\_Lv} \le 100$）的裝備執行 Soulbind**。
- **Soul Fragments 消耗公式**：
  $$\text{Soul\_Fragments\_Needed} = \text{Base\_Cost} + \text{Increase} \times \max\left(0,\ \text{Item\_Lv} - \text{Player\_Lv}\right)$$
  （註：每高出玩家 1 級增加 `2%` 基礎消耗；在 Isekai 模式中所有綁定消耗減半）：

| 裝備品質 (Quality) | 基礎消耗 `Base_Cost` (Fragments) | 每高出玩家 1 級附加 `Increase` | Item Shop 購買等值 Credits (`1 Frag = 1,000 C`) |
|---|---|---|---|
| **Crude / Fair / Average / Superior / Exquisite** | `100` | `+2 / level` | `100,000 C` 起 |
| **Magnificent** | `250` | `+5 / level` | `250,000 C` 起 |
| **Legendary** | `500` | `+10 / level` | `500,000 C` 起 |
| **Peerless**（及 Peerless+ / Ultimate） | `1,000` | `+20 / level` | `1,000,000 C` 起 |

---

### 2.2 Forging（v0.91 統一 Upgrade Tier）與 v0.86 對數升級完整對照

#### (A) v0.91 Forging 階層上限、加成與 1–33 級逐級材料／Core／Credits 消耗表

根據 [The Armory#Forging](https://ehwiki.org/wiki/The_Armory#Forging)：
- **顯示格式**：`Upgrade Tier: <Current_Forge_Lv> / <Current_IW_Lv> / <Max_IW_Lv>`（例如 `10 / 15 / 25` 代表目前已強化至 Lv.10、已通關 IW 至 Lv.15 故當前最高可強化至 15、該品質最大上限為 25）。
- **每級強化加成**：每提升 1 級 Forging，**全基礎屬性 `+1%`（物理與魔法基礎傷害 ADB / MDB `+2%`）**，且該裝備可用 **Charm Points `+1`**。
- **各品質最大 Upgrade Tier 上限**：
  - `Crude / Fair / Average`：`0`（不可強化或無列表）
  - `Superior`：**`10`**
  - `Exquisite`：**`10`**
  - `Magnificent`：**`20`**
  - `Legendary`：**`25`**
  - `Peerless / Peerless+`：**`30`**（? 2026-10-22 稽核：Peerless+ 沒有獨立的升級表格，`30` 屬推論；`Crude / Fair / Average = 0` 亦是由「無表格」推出，非明文；其餘各階的最高級數與 `sources/parsed_wiki/The_Armory.md:141-293` 的升級表一致）
  - `Ultimate`：**`33`**
- **材料類型對映**：
  - **基礎材料（Basic Materials，分 Low / Mid / High-Grade）**：
    - `Cloth`：Cloth Armor（Cotton / Gossamer / Ironsilk / Phase）
    - `Leather`：Light Armor（Leather / Drakehide / Kevlar / Shade）
    - `Metals`：Heavy Armor（Plate / Chain / Reactive / Power）、所有 1H/2H Weapons、以及 **Force Shield**
    - `Wood`：所有 Staffs，以及除 Force Shield 外的 Shields（Buckler / Kite / Tower）
  - **稀有材料（Rare Materials，僅稀有裝備需要；表中寫 `1–5 Rare` 僅針對這四類稀有裝備，普通裝備不消耗稀有材料）**：
    - `Crystallized Phazon`：Phase Armor
    - `Shade Fragment`：Shade Armor
    - `Repurposed Actuator`：Power Armor
    - `Defense Matrix Modulator`：Force Shield
  - **裝備核心（Equipment Cores）**：分 `Weapon Core`（1H/2H）、`Staff Core`（Staff）、`Armor Core`（Shield/Cloth/Light/Heavy）三類，各有 `Legendary` 與 `Peerless` 兩階。若背包核心不足，可直接以等值 Credits 替代。

**v0.91 各品質 1–33 級逐級強化消耗完整表**：

| 品質與上限 | 等級區間 (Upgrade Lv) | 每級消耗基礎材料 (Basic Materials) | 每級消耗稀有材料 (僅限 Rare 裝備) | 每級消耗核心 (Cores) | 每級消耗 Credits | 該品質滿級累計總消耗 (Totals) |
|---|---|---|---|---|---|---|
| **Superior**<br>(上限 Lv.10) | **Lv.1 – 5** | `100x Low-Grade` | `1x Rare` | 無 | `1,000 C` | **Low-Grade**: `1,000`<br>**Rare**: `15`<br>**Credits**: `10,000 C` |
| ^ | **Lv.6 – 10** | `100x Low-Grade` | `2x Rare` | 無 | `1,000 C` | ^ |
| **Exquisite**<br>(上限 Lv.10) | **Lv.1 – 5** | `100x Low-Grade` | `1x Rare` | 無 | `5,000 C` | **Low-Grade**: `1,000`<br>**Rare**: `15`<br>**Credits**: `50,000 C` |
| ^ | **Lv.6 – 10** | `100x Low-Grade` | `2x Rare` | 無 | `5,000 C` | ^ |
| **Magnificent**<br>(上限 Lv.20) | **Lv.1 – 5** | `100x Low-Grade` + `5×Lv Mid-Grade` (`5, 10, 15, 20, 25`) | `1x Rare` | 無 | `10,000 C` | **Low-Grade**: `2,000`<br>**Mid-Grade**: `775`<br>**Rare**: `50`<br>**Credits**: `350,000 C` |
| ^ | **Lv.6 – 10** | `100x Low-Grade` + `5×Lv Mid-Grade` (`30, 35, 40, 45, 50`) | `2x Rare` | 無 | `10,000 C` | ^ |
| ^ | **Lv.11 – 15** | `100x Low-Grade` + `50x Mid-Grade` | `3x Rare` | 無 | `25,000 C` | ^ |
| ^ | **Lv.16 – 20** | `100x Low-Grade` + `50x Mid-Grade` | `4x Rare` | 無 | `25,000 C` | ^ |
| **Legendary**<br>(上限 Lv.25) | **Lv.1 – 5** | `100x Mid-Grade` + `5×Lv High-Grade` (`5, 10, 15, 20, 25`) | `1x Rare` | `1x Legendary Core` | `25,000 C` | **Mid-Grade**: `2,500`<br>**High-Grade**: `1,025`<br>**Rare**: `75`<br>**Legendary Core**: `75`<br>**Credits**: `1,250,000 C` |
| ^ | **Lv.6 – 10** | `100x Mid-Grade` + `5×Lv High-Grade` (`30, 35, 40, 45, 50`) | `2x Rare` | `2x Legendary Cores` | `25,000 C` | ^ |
| ^ | **Lv.11 – 15** | `100x Mid-Grade` + `50x High-Grade` | `3x Rare` | `3x Legendary Cores` | `50,000 C` | ^ |
| ^ | **Lv.16 – 20** | `100x Mid-Grade` + `50x High-Grade` | `4x Rare` | `4x Legendary Cores` | `50,000 C` | ^ |
| ^ | **Lv.21 – 25** | `100x Mid-Grade` + `50x High-Grade` | `5x Rare` | `5x Legendary Cores` | `100,000 C` | ^ |
| **Peerless**<br>(上限 Lv.30) | **Lv.1 – 25** | 與 Legendary Lv.1–25 完全相同 | 同上 (`1..5x`) | 同上 (共 `75x Leg Cores`) | 同上 (`1,250,000 C`) | **Mid-Grade**: `3,000`<br>**High-Grade**: `1,275`<br>**Rare**: `100`<br>**Leg / Peer Core**: `75` / `25`<br>**Credits**: `1,750,000 C` |
| ^ | **Lv.26 – 30** | `100x Mid-Grade` + `50x High-Grade` | `5x Rare` | `5x Peerless Cores` | `100,000 C` | ^ |
| **Ultimate**<br>(上限 Lv.33) | **Lv.31 – 33** | `100x Mid-Grade` + `50x High-Grade` | `5x Rare` | `5x Peerless Cores` | `100,000 C` | Lv.31–33 差額：<br>**Mid**: `300`, **High**: `150`, **Rare**: `15`, **Peer Core**: `15`, **Credits**: `300,000 C`（Lv.1–33 總計 `2,050,000 C`） |

#### (B) v0.86 The Forge 分屬性對數升級系統對照（供懷舊／轉換參考）

根據 `The_Forge_2024.md` 與 `hvUtils.js:10442-10540`：
- **升級公式**：每項屬性獨立升級，初始上限為 ADB/MDB `Lv.50`、其餘屬性 `Lv.25`；隨玩家 **Forge Level（上限 Lv.50，升下一級所需經驗 `250 * (Current_Forge_Lv + 1)`）** 每級提升 `+2%` 上限，於 Forge Lv.50 達到 **ADB/MDB `Lv.100`（倍率 `1.668x`）、其餘屬性 `Lv.50`（倍率 `1.358x`）**。
- **v0.86 材料階梯（`_up.set`）**：每次升級固定消耗 6 個基礎材料（依品質起點在 `[6 Low, 0 Mid, 0 High]` 至 `[0 Low, 0 Mid, 6 High]` 的 150 階陣列滑動，Sup 起點 `0`、Exq `15`、Mag `30`、Leg/Peer `50`）＋ 1 顆 Catalyst（Wispy / Diluted / Regular / Robust / Vibrant / Coruscating）＋ Lv.6 起每級消耗 1 個對應屬性的 Binding（Isekai 免 Binding）。

---

### 2.3 Charm Slots、27 種 Charms、3 種 Pouches 與 v0.86 18 種 IW Potency 對照

#### (A) Charm Slots 與 Charm Points (CP) 規則

根據 [The Armory#Charm Slots](https://ehwiki.org/wiki/The_Armory#Charm_Slots) 與 [HentaiVerse Advice#Charms](https://ehwiki.org/wiki/HentaiVerse_Advice#Charms)：
- **Charm Points (CP) 計算公式**：
  $$\text{Total\_CP} = \text{Base\_CP}(\text{Quality}) + L_{\text{iw}} + L_{\text{forge}}$$
  由 `HentaiVerse_Advice` 實例驗證：
  - **Magnificent**（$L_{\text{iw}}=20, L_{\text{forge}}=20$）滿改總 CP 為 **`70`** $\implies \text{Base\_CP}(\text{Magnificent}) = 30$。
  - **Legendary**（$L_{\text{iw}}=25, L_{\text{forge}}=25$）滿改總 CP 為 **`85`** $\implies \text{Base\_CP}(\text{Legendary}) = 35$。
  - （2026-10-22 稽核更正）上面 Magnificent 與 Legendary 兩個 Base CP 是由「滿改總 CP」扣掉 IW 與 Forge 等級反推，有出處（`sources/parsed_wiki/HentaiVerse_Advice.md:325,357`）。原稿接著寫的「每階相差 5 點、Base CP = Max_IW + 10」只是對這兩點的外推，且原稿自己給的數字與該規則不一致（Exquisite 依規則應為 10 + 10 = 20、Ultimate 應為 33 + 10 = 43，原稿卻寫 25 和 45），其餘品質的 Base CP（Superior 20、Exquisite 25、Peerless 40、Ultimate 45）無任何來源。The Armory 只寫「Each equipment piece has a number of Charm Slots, as well as a base number of Charm Points; both depend on the quality」，未給數值（`sources/parsed_wiki/The_Armory.md:303`）。（? 來源未找到，2026-10-22 稽核：除 Magnificent 30／Legendary 35 外的各品質 Base CP 與滿改總 CP。）
- **Charm Slots 數量**：由品質決定（`sources/parsed_wiki/The_Armory.md:303`，數值未給）。（2026-10-22 稽核更正：原稿引 `Advice` 的配裝稱 Legendary 武器可同時插 4–5 個 Charm，並在 GAP-003-05 把 Legendary 定為 4 槽，兩處自相矛盾；Advice 的 1H Imperil 配法為 Voidseeker 15＋Butcher 30＋Penetrator 15＋Economizer 15＋Fatality 10，即 Legendary 武器同時裝 5 個 Charm，`sources/parsed_wiki/HentaiVerse_Advice.md:327`。各品質槽位數 ? 來源未找到。）
- **磨損與替換機制**：
  - 每個新鑲嵌的 Charm **免費自帶 1 個 Silk Pouch（減少 50% 磨損，0 CP）**。
  - 若 Charm 未受 Pouch 保護（Exposed，因戰敗導致 Pouch 損毀），其耐久損耗率等同於基礎裝備損耗率；**Lesser Charm 的磨損速度是 Greater Charm 的 2 倍**；Repair Bear Hath Perk **不影響** Charm 磨損。
  - 當 Charm 耐久降至 **`20%`** 時視為「已磨損（Worn）」（戰鬥日誌提示 `The <Name> Charm on your <Equip> is wearing out, and should be replaced.`），此時可在不消耗額外維持材料（Upkeep Materials）的情況下，用背包中**同名同階 Charm** 直接替換，且舊 Charm 剩餘耐久會直接累加至新 Charm（例如剩 10% 時替換，新 Charm 初始為 **`110%`** 耐久！）。
  - 當 Charm 耐久 `> 20%` 時，可單獨更換 Charm 而不破壞 Pouch，或單獨升級／更換 Pouch 而不破壞 Charm；一旦 `<= 20%`，更換 Pouch 必須連同 Charm 一起更換。

#### (B) 全部 27 種 Charms（Lesser / Greater）完整規格表

根據 [The Armory#Charms](https://ehwiki.org/wiki/The_Armory#Charms)（註：防具與盾牌的槽位倍率 **Slot Multiplier** 為：**Shield / Helmet `1.0x`、Body `1.2x`、Hands `0.9x`、Legs `1.1x`、Feet `0.8x`**）：

| # | 護符名稱 (Charm) | 適用部位 (Slot) | Lesser CP 消耗 | Lesser 效果強度 | Lesser 鑲嵌/維持材料 | Greater CP 消耗 | Greater 效果強度 | Greater 鑲嵌/維持材料 |
|---|---|---|---|---|---|---|---|---|
| 1 | **Featherweight** | All（全裝備） | `5 CP` | 降低 Burden 與 Interference `max(5, 30%)` | `Featherweight Shard x10` | `15 CP` | 降低 Burden 與 Interference `max(10, 50%)` | `Featherweight Shard x20` |
| 2 | **Hollowforged** | Weapon | `15 CP` | 普攻轉為 **Void**，並附加 `30%` **Void Strike** | `Energy Cells x10` | `25 CP` | 普攻轉為 **Void**，並附加 `50%` **Void Strike** | `Energy Cells x20` |
| 3 | **Fire Strike** | Weapon | `10 CP` | 附加 `30%` **Fire Strike** | `Infusion of Flames x10` | `20 CP` | 附加 `50%` **Fire Strike** | `Infusion of Flames x20` |
| 4 | **Cold Strike** | Weapon | `10 CP` | 附加 `30%` **Cold Strike** | `Infusion of Frost x10` | `20 CP` | 附加 `50%` **Cold Strike** | `Infusion of Frost x20` |
| 5 | **Lightning Strike** | Weapon | `10 CP` | 附加 `30%` **Lightning Strike** | `Infusion of Lightning x10` | `20 CP` | 附加 `50%` **Lightning Strike** | `Infusion of Lightning x20` |
| 6 | **Wind Strike** | Weapon | `10 CP` | 附加 `30%` **Wind Strike** | `Infusion of Storms x10` | `20 CP` | 附加 `50%` **Wind Strike** | `Infusion of Storms x20` |
| 7 | **Holy Strike** | Weapon | `10 CP` | 附加 `30%` **Holy Strike** | `Infusion of Divinity x10` | `20 CP` | 附加 `50%` **Holy Strike** | `Infusion of Divinity x20` |
| 8 | **Dark Strike** | Weapon | `10 CP` | 附加 `30%` **Dark Strike** | `Infusion of Darkness x10` | `20 CP` | 附加 `50%` **Dark Strike** | `Infusion of Darkness x20` |
| 9 | **Butcher** | Weapon | `15 CP` | 增加武器 `Attack Damage` **`+6%`** | `Energy Cells x10` | `30 CP` | 增加武器 `Attack Damage` **`+10%`** | `Energy Cells x20` |
| 10 | **Swiftness** | Weapon | `10 CP` | 增加 `Attack Speed` **`+5%`** | `Energy Cells x10` | `20 CP` | 增加 `Attack Speed` **`+7.5%`** | `Energy Cells x20` |
| 11 | **Fatality** | Weapon | `10 CP` | 增加物理暴擊傷害 **`+0.06x`** (`+6%`) | `Energy Cells x10` | `20 CP` | 增加物理暴擊傷害 **`+0.10x`** (`+10%`) | `Energy Cells x20` |
| 12 | **Overpower** | Weapon | `5 CP` | 附加 `Counter-Parry` **`+12%`** | `Energy Cells x10` (`Advice` 記 10/20 CP) | `10 CP` (`Advice` 記 `20 CP`) | 附加 `Counter-Parry` **`+20%`** | `Energy Cells x20` |
| 13 | **Voidseeker** | Weapon | `15 CP` | 普攻轉 **Void**、物理命中增加 `Acc * 0.2 + 10`、附加 `30%` **Void Strike** | `Voidseeker Shard x10` | `30 CP` | 普攻轉 **Void**、物理命中增加 `Acc * 0.3 + 10`、附加 `50%` **Void Strike** | `Voidseeker Shard x20` |
| 14 | **Archmage** | Weapon | `20 CP` | 增加 `Magic Damage` **`+6%`**；若鑲嵌於無基礎 MDB 的近戰武器，先賦予基礎值 $M = \lceil \text{Equip\_Lv}/5 \rceil \times \text{hands\_used}$（單手 1、雙手 2）再乘 `+6%` | `Energy Cells x10` | `40 CP` | 增加 `Magic Damage` **`+10%`**；無 MDB 武器先賦予 $M = \lceil \text{Equip\_Lv}/3 \rceil \times \text{hands\_used}$ 再乘 `+10%` | `Energy Cells x20` |
| 15 | **Economizer** | Weapon | `15 CP` | 附加 `Mana Conservation`：單手 **`+10%`** / 雙手 **`+15%`** | `Energy Cells x10` | `30 CP` | 附加 `Mana Conservation`：單手 **`+15%`** / 雙手 **`+25%`** | `Energy Cells x20` |
| 16 | **Spellweaver** | Weapon | `10 CP` | 增加 `Casting Speed` **`+5%`** | `Energy Cells x10` | `20 CP` | 增加 `Casting Speed` **`+7.5%`** | `Energy Cells x20` |
| 17 | **Annihilator** | Weapon | `15 CP` | 增加法術暴擊傷害 **`+0.06x`** (`+6%`) | `Energy Cells x10` | `30 CP` | 增加法術暴擊傷害 **`+0.10x`** (`+10%`) | `Energy Cells x20` |
| 18 | **Penetrator** | Weapon | `15 CP` | 附加 `Counter-Resist` **`+12%`** | `Energy Cells x10` | `30 CP` | 附加 `Counter-Resist` **`+20%`** | `Energy Cells x20` |
| 19 | **Aether** | Weapon | `15 CP` | 魔法命中增加 `MAcc * 0.2 + 10`、附加 `Mana Conservation` **`+3%`**（法杖為 **`+6%`**） | `Aether Shard x10` | `30 CP` | 魔法命中增加 `MAcc * 0.3 + 10`、附加 `Mana Conservation` **`+5%`**（法杖為 **`+10%`**） | `Aether Shard x20` |
| 20–25 | **Fire / Cold / Lightning / Wind / Holy / Dark-proof** (共 6 種) | Armor / Shield | `10 CP` | 增加對應元素減傷 **`+12 × Slot_Multiplier`** | 對應元素 `Infusion x10` | `20 CP` | 增加對應元素減傷 **`+20 × Slot_Multiplier`** | 對應元素 `Infusion x20` |
| 26 | **Juggernaut** | Armor / Shield | `20 CP` | 增加 `HP Bonus` **`+6% × Slot_Multiplier`** | `Energy Cells x10` | `40 CP` | 增加 `HP Bonus` **`+10% × Slot_Multiplier`** | `Energy Cells x20` |
| 27 | **Capacitor** | Armor / Shield | `10 CP` | 增加 `MP Bonus` **`+6% × Slot_Multiplier`** | `Energy Cells x10` | `20 CP` | 增加 `MP Bonus` **`+10% × Slot_Multiplier`** | `Energy Cells x20` |

> **數量核對說明（2026-10-22 稽核更正）**：上表 6 種元素 `Strike` 與 6 種 `<Elem>-proof` 各自展開，共 **27 個獨立名稱**，每種分 Lesser／Greater，共 54 個變體（`sources/parsed_wiki/The_Armory.md:321-386`，逐列計數）。原稿為了對上題幹的「23 種」，說「收攏後為 22–23 種」，此算術不成立（只收攏 6 種 Strike 為 1 種得 22 種，再收攏 6 種 Proof 為 1 種得 17 種，任何收法都不是 23），已刪除該對應；「23 種」在來源中找不到出處。

#### (C) 3 種 Pouches（護符袋）完整規格表

根據 [The Armory#Pouches](https://ehwiki.org/wiki/The_Armory#Pouches)：
- **唯一取得途徑**：在 Snowflake's Shrine 獻祭 Trophies，**每累積 `500,000` Shrine Value 保底額外贈送 1 個 Pouch**。

| 護符袋名稱 (Pouch) | Shrine 保底掉落權重 | 鑲嵌所需 CP | 減少護符戰鬥磨損比例 | 玩家戰敗（Defeat）時護符袋損毀機率 |
|---|---|---|---|---|
| **Silk Pouch**（絲質護符袋） | **75%**（且每個 Charm 免費附贈 1 個） | **`0 CP`** | 減少 **50%** 磨損（即承受 `0.5x` 磨損） | **100% 必毀**（若戰敗時受到損傷） |
| **Kevlar Pouch**（凱夫拉護符袋） | **20%** | **`1 CP`** | 減少 **90%** 磨損（即僅承受 `0.1x` 磨損） | **20% 機率損毀** |
| **Mithril Pouch**（秘銀護符袋） | **5%** | **`2 CP`** | **減少 100% 磨損（完全免磨損）** | **0%（堅不可摧 Indestructible）** |

#### (D) v0.86 18 種 Potency Tier 附魔與時效 Shards 對照

根據 `Item_World_2024.md` 與 `dodying/UserJs/HentaiVerse/hvIW.user.js:64-85`：
- 在 v0.86 中，裝備透過 IW 升至 Potency Tier 1–10，每件裝備最多隨機獲得 3 種不同 Potency（單項最高 Lv.5，已有 1 種時 50% 機率升舊的、有 2 種時 75% 機率升舊的）：
  - **防具／盾牌（8 種）**：6 種 `<Elem>proof`（每級 `+4%` 對應元素 MIT，盾＋甲可用）、`Juggernaut`（每級 `+2%` HP Bonus，僅甲）、`Capacitor`（每級 `+2%` MP Bonus，僅甲）。
  - **近戰武器（4 種）**：`Butcher`（每級 `+2%` ADB）、`Fatality`（每級 `+2%` 物暴傷）、`Overpower`（每級 `+4%` Counter-Parry，`AmyBot` 逆推常數 `1.92`）、`Swift Strike`（每級 `+1.92%` 攻速）。
  - **法杖（5 種）**：`Archmage`（每級 `+2%` MDB）、`Annihilator`（每級 `+2%` 法暴傷）、`Economizer`（每級 `+5%` 省魔，`of Focus` 法杖不可得）、`Penetrator`（每級 `+4%` Counter-Resist）、`Spellweaver`（每級 `+1.4675%` 施法速度）。
  - **武器 Tier 10 保底（第 18 種）**：非 Ethereal 武器必得 `Hollowforged`（轉 Void + Void Strike）；Ethereal 武器隨機得 6 種 `Elemental Strike` 之一。

---

### 2.4 Stat Fusion（屬性融合）演算法、成本公式與 Bindings 全表

根據 [The Armory#Stat Fusion](https://ehwiki.org/wiki/The_Armory#Stat_Fusion) 與 `anon962/AmyBotV2` 的 `infer_equip_stats.py:69-157`（`_calc_fusion_stats`）：

1. **融合資格與祭品條件**：
   - **主體裝備（Target）**：必須已 **Soulbound**，且品質為 **Legendary**（目標升至 `200` 晉升 Peerless）或 **Peerless / Peerless+**（需擁有 `Limit Breaker I–V` Hath Perks，每階上限依序為 `210 / 220 / 230 / 240 / 250`，全滿 `250` 晉升 **Ultimate**）。
   - **犧牲裝備（Sacrifice / Fodder）**：必須為**相同基底＋相同部位（Same Template + Slot）**的 **Legendary 或 Peerless** 裝備（不論前後綴是否相同，例如任何詞綴的 `Legendary Cotton Shoes` 皆可餵給 `Legendary Charged Cotton Shoes of the Elementalist`）。
2. **單次融合點數提升與溢出重分配演算法（Overflow Redistribution）**：
   - 令主體裝備上所有**具有對應 Binding 的非零屬性**集合為 $S = \{1, 2, \dots, k\}$，當前基礎骰值為 $R_i$，當前品質上限為 $R_{\max} \in \{200, 210, 220, 230, 240, 250\}$。
   - 對每個屬性 $i \in S$：
     - **若 $R_i < R_{\max}$（尚未滿值）**：
       - 若祭品為 **Peerless**，或祭品在該屬性的基礎骰值 $R_i^{\text{sac}} > R_i$：該屬性直接提升 **`+2`**（即 $R_i \leftarrow R_i + 2$），且**該屬性不消耗 Core**（若 $R_i = R_{\max} - 1$，則升至 $R_{\max}$ 並產生 `1` 點溢出）（? 來源未找到，2026-10-22 稽核：來源只有「If any of the stats are already capped, it will add +1 overflow point for each capped stat」，`sources/parsed_wiki/The_Armory.md:412`，沒有談到「+2 剛好越過上限」的情形，`sources/data_gh/infer_equip_stats.py` 也沒有溢出邏輯）。
       - 否則（祭品為 Legendary 且無該屬性或 $R_i^{\text{sac}} \le R_i$）：該屬性提升 **`+1`**（即 $R_i \leftarrow R_i + 1$），且**消耗 1 顆對應主體品質的 Core**（融合 Legendary 耗 `Legendary Core`、融合 Peerless/Peerless+ 耗 `Peerless Core`）。
     - **若 $R_i = R_{\max}$（該屬性在融合前已達上限）**：
       - 該屬性產生 **`+1` 溢出點數（Overflow Point）**（若使用 +1 規則亦計 1 顆 Core）（? 來源未找到，2026-10-22 稽核：「已滿屬性產生溢出時也要耗 Core」於 `sources/parsed_wiki/The_Armory.md:410-412` 找不到，原稿自行推定）。
   - **溢出點數分配規則**：統計本次融合產生的總溢出點數 $O$，將其逐點分配給**當前尚未達 $R_{\max}$ 的屬性，嚴格按當前骰值 $R_j$ 由低至高排序依序加點**（若已滿屬性數量多於未滿屬性數量，單一未滿屬性可獲得多點溢出加成）。
   - **無 Binding 屬性同步更新**：融合完成後，該裝備上所有無對應 Binding 的屬性（如 `Burden`、`Interference`、`Attack Speed` 等），自動以更新後的 $\bar{R} = \frac{1}{k}\sum_{i \in S} R_i$ 重新計算面板值。
3. **每次融合的材料、Core 與 Credits 費用公式（`_calc_fusion_stats`）**：
   - **黏合劑（Bindings）消耗**：每次融合對主體裝備的每項具 Binding 屬性 $i \in S$，固定收取 **10 個對應的 Binding**（注意：是**每次融合固定 10 個**，不論該屬性這次是 +1 或 +2；在最理想全部 +2 的情況下，每提升 1 點平均消耗 5 個 Binding；全部 +1 的情況下，每提升 1 點消耗 10 個 Binding）。
   - **Credits 與 Core 折算費用公式**（2026-10-22 稽核更正：原稿稱「直接提取自 `infer_equip_stats.py:89-149`」並把 `stat_mult` 詮釋為「Core 折算價」，不成立。該程式是社群機器人估算融合成本「上下限」的估算器，不是遊戲公式：`binding_price = 2000` 是假設市價、`min_cost`／`max_cost` 用兩個 while 迴圈估上下界、只處理 Legendary，`sources/data_gh/infer_equip_stats.py:84-148`；程式碼裡沒有「1 顆 Core 的價格」這層語意。百科只寫「fixed number of credits per fusion based on the type of gear … and its average base stats」，`sources/parsed_wiki/The_Armory.md:414`，未給公式。下表為該估算器的常數，只能當社群估算參考，不是官方成本）：
     設主體裝備具 $k = |S|$ 項可融合屬性，當前平均骰值為 $\bar{R} = \frac{1}{k}\sum_{i \in S} R_i$，不同裝備類型的基礎乘數 `base_mult` 與單屬性 Core 折算乘數 `stat_mult` 如下：

| 主體裝備分類 | 每次融合 Credits 基礎乘數 (`base_mult`) | 每個需 Core 屬性的 Core 折算價 (`stat_mult`) | 單次融合基礎 Credits 公式 |
|---|---|---|---|
| **單手／雙手武器 (1H / 2H Weapons)** | `15,000` | `20,000` (即 1 顆 Weapon Core = 20k C) | $\bar{R} \times 15,000$ |
| **法杖 (Staffs)** | `25,000` | `20,000` (即 1 顆 Staff Core = 20k C) | $\bar{R} \times 25,000$ |
| **稀有防具與力場盾 (Phase / Shade / Power / Force Shield)** | `15,000` | `100,000` (即 5 顆 Armor Cores = 100k C) | $\bar{R} \times 15,000$ |
| **普通防具與普通盾 (Cotton / Leather / Plate / Buckler / Kite / Tower 等)** | `5,000` | `20,000` (即 1 顆 Armor Core = 20k C) | $\bar{R} \times 5,000$ |

> （2026-10-22 稽核更正）上表的「即 N 顆 Core = X C」換算是原稿詮釋，程式碼無此語意（`sources/data_gh/infer_equip_stats.py:100-132`）。另外：(1) 稀有防具一列的 `100,000` 是 Legendary 分支下 Phase／Shade／Power／Force Shield 的 `stat_mult`（`:111`），不是 Peerless Core 價格，程式裡沒有 Peerless Core 的價格；(2) 盾牌那列的 regex 是 `r"Buckler" r".* Shield"`（`:118`），Python 會把相鄰字串串接成 `Buckler.* Shield`，所以 Buckler、Kite、Tower 都配不到，Tower、Chain、Reactive 等新基底也根本不在程式裡，「Buckler / Kite / Tower 適用」於程式碼不成立；(3) 程式只處理 Legendary（`:89`）。

---

### 2.5 Salvage（拆解）與 Repair（耐久耗損與修理）完整規則

#### (A) v0.91 Salvage（拆解產出與 Salvaged Remains 機制）

根據 [The Armory#Salvage](https://ehwiki.org/wiki/The_Armory#Salvage)、`The_Forge_2024.md#Salvage` 與 `hvUtils.js:6109-6140`：
1. **未強化裝備的基礎拆解產出**：
   - **Average 及以下品質（Crude / Fair / Average）**：僅產出對應材質的廢料（`Scrap Metal` / `Scrap Leather` / `Scrap Cloth` / `Scrap Wood`），數量依裝備售價（`sale_value`）計算：
     $$\text{Scrap\_Yield} = \text{clamp}\left(\left\lceil \frac{\text{sale\_value}}{100} \right\rceil,\ 1,\ 50\right)$$
     （註：v0.86 `hvUtils.js` 上限曾為 10，v0.91 百科明訂上限為 **50**）。
   - **Superior 及以上品質**：除廢料外，產出 1 個對應階級的基礎材料（Isekai 模式中 Superior 給 3 個、Exquisite 給 2 個、Magnificent+ 給 1 個）：
     - `Superior`：`1x Low-Grade <Material>`
     - `Exquisite`：`1x Mid-Grade <Material>`
     - `Magnificent`：`1x High-Grade <Material>`
     - `Legendary`：`1x High-Grade <Material>` + **`1x Legendary Core`**（若為 **Phase / Shade / Power / Reactive / Force Shield** 則給 **`5x Legendary Armor Cores`**）
     - `Peerless / Peerless+ / Ultimate`：`1x High-Grade <Material>` + **`1x Peerless Core`**（若為 **Phase / Shade / Power / Reactive / Force Shield** 則給 **`5x Peerless Armor Cores`**）
   - **稀有（Magitech）裝備額外產出**：拆解 Phase / Shade / Power / Reactive / Force Shield 額外產出 **Energy Cells**（數量在拆解廢料量的 `10% ~ 100%` 間線性隨機，保底至少 `1` 顆）。
2. **已強化裝備的 90% 材料返還規則**：
   - 拆解任何曾進行過 Forging 強化的裝備，除了上述基礎拆解產出外，額外返還**已投入強化之所有基礎材料与稀有材料總量的 `90%`（無條件捨去 `floor(spent * 0.9)`）**：
     $$\text{Returned\_Material} = \lfloor 0.9 \times \text{Total\_Spent\_Material} \rfloor$$
     （投入的 Credits 與舊版 Catalysts 不返還）。
3. **v0.91 新增：Salvaged Remains（分解殘骸）機制**：
   - 拆解裝備後，除了獲得材料外，還會產生一件狀態標記為 **`Salvaged - Repair Required`**、耐久度為 **`0.0%`** 的原始裝備殘骸。
   - 預設勾選 `Sell Salvaged Equipment` 會將殘骸直接賣給 Bazaar（拆解者在 24 小時內可從 Bazaar 買回）；若取消勾選，殘骸會留在玩家的 `Salvaged` 分頁中，**只要在 Armory 將其修理至 100% Condition 即可完全復原該裝備**（注意：拆解並復原後的裝備會清除原有的強化等級）（? 來源未找到，2026-10-22 稽核：`sources/parsed_wiki/The_Armory.md:527-537` 只寫殘骸耐久為 0%、24 小時內可買回、修到滿耐久即可復原，沒有任何一句提到強化等級會被清除）。

#### (B) Repair（耐久度 Condition 與能量 Energy 耗損與修理公式，v0.86 補齊 v0.91 WIP）

由於 v0.91 [The Armory#Repair](https://ehwiki.org/wiki/The_Armory#Repair) 正文標為 `WIP`，依據 Ticket `012` 決策，此處結合 v0.91 已公開之定性規則與 v0.86 [The Forge#Repair](https://ehwiki.org/wiki/The_Forge#Repair) 之精確數學公式：

1. **裝備耐久度（Condition / Durability）耗損規則**：
   - **新掉落裝備初始耐久**：戰鬥掉落裝備初始耐久在 **`50% ~ 100%`** 間隨機；Shrine 與 Lottery 獲得的裝備初始必為 **`100%`**。
   - **日常戰鬥耗損（Wear）**：每擊殺 1 隻怪物（v0.86）或每通過 1 回合（v0.91），穿戴中的裝備扣除固定點數的 Condition，耗損倍率取決於玩家等級與 `Repair Bear` Hath Perk：
     - **玩家等級倍率**：`Lv < 100` 為 **`0x`（不耗損）**；`Lv 100–199` 為 **`0.5x`**；`Lv 200+` 為 **`1.0x`**（基準耗損率：Lv.200+ 玩家每擊殺 10,000 隻怪約損失 `50` 點 Condition，即 **`0.005 Condition / kill`**，折合每回合平均約 `0.05 Condition / round`）。
     - **Repair Bear Hath Perk 減免**：`Mk.1` 降至 **`50%`**、`Mk.2` 降至 **`25%`**、`Mk.3` 降至 **`10%`**、`Mk.4` 降至 **`0%`（完全免日常磨損）**。
   - **戰敗懲罰（Defeat Loss）**：玩家在戰鬥中 HP 歸零戰敗時，全身穿戴裝備直接扣除最大耐久度的固定百分比：
     - `Lv < 100`：**`-2%`**；`Lv 100–199`：**`-5%`**；`Lv 200+`：**`-10%`**。
     - 擁有 `Repair Bear Mk.4` 時，戰敗耐久懲罰減半（即 `-1% / -2.5% / -5%`）。
   - **低耐久屬性衰減懲罰**：當裝備 `Condition% < 50%` 時，其提供的所有正向屬性（Burden 與 Interference 除外）隨耐久度線性衰減（在戰鬥中即時生效），至 `0%` 時提供 `0` 屬性：
     $$\text{Condition\_Efficiency} = \begin{cases} 1.0, & \text{Condition}\% \ge 50\% \\ \frac{\text{Condition}\%}{50\%}, & 0\% \le \text{Condition}\% < 50\% \end{cases}$$
2. **修理所需廢料（Scraps）與能量電池（Energy Cells）公式**：
   - 當 `Condition% < 100%` 時，完全修復一件裝備所需的對應材質廢料（Scrap Metal / Leather / Cloth / Wood）數量為：
     $$\text{Scraps\_Needed} = 1 + \left\lfloor \frac{100 - \text{Condition}\%}{\text{quality\_mod}} \right\rfloor$$
     其中各品質的 `quality_mod` 常數如下：
     - **Superior 及以下**：`10.0`（即 0% 時需 11 個 Scrap）
     - **Exquisite**：`6.0`（即 0% 時需 17 個 Scrap）
     - **Magnificent**：`2.2 – 2.5`（取 `2.35`，0% 時約需 43 個 Scrap）
     - **Legendary**：`1.3 – 1.5`（取 `1.4`，0% 時約需 72 個 Scrap）
     - **Peerless / Peerless+ / Ultimate**：`1.3`（即 0% 時需 77 個 Scrap）
   - **Magitech 裝備與护符的能量（Energy）補充**：
     - Magitech 裝備（`Phase`、`Shade`、`Power`、`Reactive`、`Force Shield`）以及鑲嵌了 Charm 的裝備具有 `Energy: 0%–100%` 數值，隨通關回合數固定消耗。
     - 修理 Magitech 裝備所需的 `Energy Cells` 數量固定為所需廢料數的 **$\frac{1}{3}$**：
       $$\text{Energy\_Cells\_Needed}_{\text{magitech}} = \left\lceil \frac{\text{Scraps\_Needed}}{3} \right\rceil$$
     - 若裝備上鑲嵌的 Charm 需要補充能量或替換，則依該 Charm 的 `Material Costs`（`10x` Lesser / `20x` Greater 的 Energy Cells、Infusions 或 Shards）按已損耗比例計入修理費。

---

## 三、五大戰鬥模式（RE / Arena / RoB / GF / IW）與 7 階難度倍率

### 3.1 7 階難度（Challenge / Difficulty）完整乘數表

根據 [HentaiVerse Settings](https://ehwiki.org/wiki/HentaiVerse_Settings)、[Grindfest#Crystal Drops](https://ehwiki.org/wiki/Grindfest#Crystal_Drops) 與 [Item World](https://ehwiki.org/wiki/Item_World)：

| 難度名稱 (Difficulty) | 內部代號 | EXP 乘數 | Credits 乘數 | 怪物 HP 乘數 | 怪物傷害乘數 | 水晶基礎乘數 (`diffmod`) | GF 水晶回合加成上限 (`gfbonus`) | 裝備品質檢定加成 (`Quality Roll`) | 怪物 PL 上限修正 (`PL Ceiling Mod`) | 舊版 IW PXP 乘數 (未綁/已綁) | 特殊難度規則與掉落門檻 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Normal** | `1ch` | **`1x`** | `1.0x` | `1.0x` | `1.0x` | `1.0x` | `+0.5x` | `1.0x` | `+0` | `2x / 4x` | GF 與 IW 中古董與 Token 掉率降低；不掉 Voidseeker / Aether / World Seeds |
| **Hard** | `2ch` | **`2x`** | `1.25x` | `1.1x` | `1.2x` | `1.2x` | `+1.0x` | `1.5x` | `+5` | `2x / 4x` | 開始掉落 Voidseeker / Aether Shards 與 World Seeds；GF/IW 古董與 Token 掉率降低 |
| **Nightmare** | `3ch` | **`4x`** | `1.5x` | `1.2x` | `1.4x` | `1.4x` | `+1.0x` | `2.0x` | `+20` | `4x / 8x` | GF/IW 古董與 Token 掉率降低；Nightmare 及以下**無法隨機掉落 Legendary / Peerless** |
| **Hell** | `4ch` | **`7x`** | `1.75x` | `1.4x` | `1.6x` | `1.7x` (`Settings` 記 `1.6x`) | `+1.5x` | `2.5x` | `+30` | `7x / 14x` | **解鎖 Legendary 與 Peerless（`1 / 1,000,000`）隨機掉落**；移除 GF/IW 稀有掉落懲罰 |
| **Nintendo** | `5ch` | **`10x`** | `2.2x` | `1.7x` | `2.0x` | `2.0x` | `+1.5x` | `3.0x` | `+60` | `10x / 20x` | **隨機掉落裝備保底 Average 品質**（Crude / Fair 掉率歸零）；Peerless 掉率 `1 / 333,333` |
| **IWBTH** | `6ch` | **`15x`** | `3.0x` | `2.0x` | `2.5x` | `2.5x` | `+2.0x` | `5.0x` | `+100` | `15x / 30x` | Peerless 掉率 `1 / 200,000`；怪物飼料三階掉率達 `40% / 30% / 30%` 封頂 |
| **PFUDOR** | `7ch` | **`20x`** | `3.0x` | `2.0x` | `3.0x` | `3.0x` | `+2.0x` | `6.0x` | `+125` | `20x / 40x` | **隨機掉落裝備保底 Superior 品質**；Peerless 掉率 `1 / 100,000`；**怪物額外強化**：`+25% Action Speed`、`+50% MP/SP Regen`、`+10% Resist & Parry`、施放技能與法術機率大幅提高 |

> **星期元素減傷弱化機制（Day of the Week，見 [Battles#Day of the Week](https://ehwiki.org/wiki/Battles#Day_of_the_Week)）**：
> 依系統星期幾，玩家與所有怪物的特定屬性減傷（Specific Mitigation）暫時降低 `10` 點（週五為全屬性降低 `5` 點）：
> - **週日 (Sun)**：`Holy -10`｜**週一 (Mon)**：`Dark -10`｜**週二 (Tue)**：`Fire -10`｜**週三 (Wed)**：`Cold -10`｜**週四 (Thu)**：`Wind -10`｜**週五 (Fri)**：**全屬性（含三物理、六元素、Void）`-5`**｜**週六 (Sat)**：`Elec -10`。

---

### 3.2 五大戰鬥模式（Random Encounter / Arena / Ring of Blood / Grindfest / Item World）完整規格

#### (1) Random Encounter（RE，隨機遭遇戰）

根據 [Random Encounter](https://ehwiki.org/wiki/Random_Encounter) 與 [Loot Drop Rolls](https://ehwiki.org/wiki/Loot_Drop_Rolls)：
- **觸發與限制**：原版每 30 分鐘冷卻、每日通過 `Dawn of a New Day` 後最多觸發 **24 次**（單機版可設計為每過若干回合／戰鬥冷卻或計數器觸發，每日上限 24 次）。
- **波數（Rounds）**：固定 **1 波**。
- **耐力消耗（Stamina Cost）**：**`0` Stamina**（不消耗耐力，但結算時按當前耐力享受加成）。
- **怪物配置與強度**：隨機生成，玩家 `Lv < 100` 時單波最多 **5 隻**，`Lv >= 100` 時單波最多 **10 隻**（Common 為主，極低機率混入 Rare Boss 或 Legendary 學姊）；怪物傷害倍率固定 `100%`。
- **倍率與專屬獎勵**：
  - **EXP 倍率**：**`5.0x`**
  - **Credits 倍率**：**`3.0x`**
  - **Artifact 與 Token 掉率倍率**：**`2.5x`**（且整場掉落率等同於 Arena 最終波加成）
  - **Soul Fragments 專屬掉落**：通關時高機率掉落 **`5x Soul Fragments`**（每日當日第 1 場 RE **100% 保底掉落**；每日產出軟上限約 `~60` 顆，每 2 小時恢復 1 顆額度）。

#### (2) The Arena（競技場，全 24 關完整清單）

根據 [Arena](https://ehwiki.org/wiki/Arena)、[Items#Trophies](https://ehwiki.org/wiki/Items#Trophies)、[Hath Perks](https://ehwiki.org/wiki/Hath_Perks) 與 `HvLogV3/src/lib/stats/metaStats.ts:85-97`：
- **通用規則**：
  - 需依序通關前一挑戰並達最低等級方可解鎖下一挑戰。
  - **耐力消耗**：按實際打完的波數（Rounds）逐波扣除（當 `Stamina >= 60`（Great 狀態）時每 100 波扣 **3 點**，即 `0.03 Stamina / round`；當 `Stamina < 60` 時每 100 波扣 **2 點**，即 `0.02 Stamina / round`）。（2026-10-22 稽核更正：原稿寫 `> 60` 與 `<= 60`，來源 Great 狀態為 60–99、Normal 為 1–59，差在恰好 60 這一格，`sources/parsed_wiki/Stamina.md:15`。）
  - **通關保底獎勵（Clear Bonus）**：
    1. **Credits 獎勵**：首次通關發放 `First Clear` 巨額獎金；重複通關發放 `Future Clears` 獎金。
    2. **保底裝備（Equipment Clear Bonus）**：每次通關保底掉落 1 件裝備（`Post Game Content` 掉 **2 件**、`Secret Pony Level` 掉 **3 件**），其品質檢定等同於對應階層之 Trophy（`Endgame` 及以下為 T1；`Longest Journey` 以上在 Nightmare+ 為 T2–T6；最後三關固定為 **T7 Magnificent 保底**）。
    3. **Token 獎勵（Arena Token Bonus）**：通關時有 `15%–25%` 機率額外獲得 1 顆 Token of Blood 或 Chaos Token。
    4. **World Seeds 獎勵（Arena Extra Bonus，v0.91）**：通關 **Lv.200（`The Trio and the Tree`）及以上**的競技場時，基礎有 **20% 機率**（擁有 `Dark Descent` Hath Perk 提升至 **50% 機率**）額外獲得 `World Seeds`。
    5. **Boss Trophy 掉落規則**：在 `Eve of Death`（Lv.180）及以下關卡、以及所有關卡的**最後一波（Final Round）**，擊殺 Boss / 學姊 / 神怪時 **100% 掉落對應 Trophy**；但在 **Lv.225（`End of Days`）及以上關卡的「非最後一波」**中，Boss / 學姊掉落 Trophy 的機率固定降為 **10%**。

**全 24 個 Arena 挑戰關卡規格完整表**：

> （2026-10-22 稽核更正，並以原始 HTML 重新解析 rowspan 核對）原稿「重複通關獎金」欄自 Dark Skies 起的遞增數字（1,200 C 一路到 20,000 C）與 End of Days 以後「首通 60,000? / 75,000? / 100,000?」及 PGC、Secret Pony Level 填「—」皆為錯誤：來源 `sources/ehwiki_pages/Arena.html` 的 Arena Challenges 表中，Future Clears 前 5 關為 20／200／400／600／800 C，自 Fresh Meat 起為單一格 `1,000 C [rowspan=19]`，一路涵蓋到 Secret Pony Level；First Clear 自 The Trio and the Tree 起為單一格 `50,000 C [rowspan=6]`，涵蓋 Trio、End of Days、Eternal Darkness、A Dance with Dragons、Post Game Content、Secret Pony Level。下表已據此改正。同表其餘欄（等級、波數、EXP 倍率、怪物數）經抽驗與來源一致。Arena 另有原稿未寫的限制：每關每天只能打一次、介面只顯示最高等級的 14 個 Arena、Token 機率在 50 波以上的關卡提高到 50–90%、怪物強度固定 100%、Credits 倍率 1x、最後一波掉率提高（出處同 `sources/ehwiki_pages/Arena.html` 的 Details／Rewards／Limits 段；見文末覆蓋缺口）。

| # | 挑戰名稱 (Arena Challenge) | 解鎖等級 | 總波數 (Rounds) | Stamina 消耗 (Stam<60 / ≥60) | EXP 倍率 (`arena_bonus`) | 首通獎金 (`First Clear`) | 重複通關獎金 (`Future Clears`) | 怪物總數統計 (普通 / Rare Boss / 學姊 / 特殊神怪) | 固定 Boss 配置與特殊規則 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **First Blood** | Lv.1 | `2` | `0.04 / 0.06` | `1.0x` | `100 C` | `20 C` | `2 / 0 / 0 / 0` | 純普通怪教學關 |
| 2 | **Learning Curves** | Lv.10 | `4` | `0.08 / 0.12` | `1.0x` | `1,000 C` | `200 C` | `6 / 0 / 0 / 0` | 純普通怪 |
| 3 | **Graduation** | Lv.20 | `6` | `0.12 / 0.18` | `1.0x` | `2,000 C` | `400 C` | `14 / 0 / 0 / 0` | 純普通怪 |
| 4 | **Road Less Traveled** | Lv.30 | `8` | `0.16 / 0.24` | `1.0x` | `3,000 C` | `600 C` | `30 / 0 / 0 / 0` | 純普通怪 |
| 5 | **A Rolling Stone** | Lv.40 | `10` | `0.20 / 0.30` | `1.0x` | `4,000 C` | `800 C` | `42 / 0 / 0 / 0` | 純普通怪 |
| 6 | **Fresh Meat** | Lv.50 | `12` | `0.24 / 0.36` | `1.0x` | `5,000 C` | `1,000 C` | `68 / 0 / 0 / 0` | 純普通怪 |
| 7 | **Dark Skies** | Lv.60 | `15` | `0.30 / 0.45` | `1.0x` | `6,000 C` | `1,000 C` | `82 / 0 / 0 / 0` | 純普通怪 |
| 8 | **Growing Storm** | Lv.70 | `20` | `0.40 / 0.60` | `1.0x` | `7,000 C` | `1,000 C` | `109 / 0 / 0 / 0` | 純普通怪 |
| 9 | **Power Flux** | Lv.80 | `25` | `0.50 / 0.75` | `1.0x` | `8,000 C` | `1,000 C` | `136 / 0 / 0 / 0` | 純普通怪 |
| 10 | **Killzone** | Lv.90 | `30` | `0.60 / 0.90` | `1.0x` | `9,000 C` | `1,000 C` | `162 / 0 / 0 / 0` | 純普通怪 |
| 11 | **Endgame** | Lv.100 | `35` | `0.70 / 1.05` | `1.0x` | `10,000 C` | `1,000 C` | `172 / 1 / 0 / 0` | 最終波 1 隻隨機 Rare Boss（MBP/Bunneh/Mithra/Dalek）；**解鎖 `Ascended` 稱號** |
| 12 | **Longest Journey** | Lv.110 | `40` | `0.80 / 1.20` | `1.1x` | `12,500 C` | `1,000 C` | `216 / 1 / 0 / 0` | 最終波 1 隻隨機 Rare Boss |
| 13 | **Dreamfall** | Lv.120 | `45` | `0.90 / 1.35` | `1.2x` | `15,000 C` | `1,000 C` | `281 / 1 / 0 / 0` | 最終波 1 隻隨機 Rare Boss |
| 14 | **Exile** | Lv.130 | `50` | `1.00 / 1.50` | `1.3x` | `20,000 C` | `1,000 C` | `311 / 1 / 0 / 0` | 最終波 1 隻隨機 Rare Boss |
| 15 | **Sealed Power** | Lv.140 | `55` | `1.10 / 1.65` | `1.5x` | `25,000 C` | `1,000 C` | `295 / 2 / 0 / 0` | 共 2 隻 Rare Boss；**解鎖 `Destined` 稱號** |
| 16 | **New Wings** | Lv.150 | `60` | `1.20 / 1.80` | `1.6x` | `30,000 C` | `1,000 C` | `293 / 3 / 0 / 0` | 共 3 隻 Rare Boss |
| 17 | **To Kill a God** | Lv.165 | `65` | `1.30 / 1.95` | `1.8x` | `35,000 C` | `1,000 C` | `404 / 0 / 1 / 0` | 最終波 1 隻隨機 Legendary 學姊（Konata/Mikuru/Ryouko/Yuki） |
| 18 | **Eve of Death** | Lv.180 | `70` | `1.40 / 2.10` | `1.9x` | `40,000 C` | `1,000 C` | `375 / 1 / 1 / 0` | 1 隻 Rare Boss + 1 隻 Legendary 學姊 |
| 19 | **The Trio and the Tree** | Lv.200 | `75` | `1.50 / 2.25` | `2.0x` | `50,000 C` | `1,000 C` | `394 / 0 / 0 / 4` | 最終波固定為 **三女神 + 世界樹**（`Skuld` + `Urd` + `Verdandi` + `Yggdrasil`）；**解鎖 `Godslayer` 稱號**與 World Seed 掉落 |
| 20 | **End of Days** | Lv.225 | `80` | `1.60 / 2.40` | `2.2x` | `50,000 C` | `1,000 C` | `321 / 2 / 55 / 0` | 混編大量學姊（55 隻，非尾波獎盃掉率 10%） |
| 21 | **Eternal Darkness** | Lv.250 | `85` | `1.70 / 2.55` | `2.5x` | `50,000 C` | `1,000 C` | `228 / 3 / 115 / 0` | 混編 115 隻學姊 |
| 22 | **A Dance with Dragons** (ID `33`) | Lv.300 | `90` | `1.80 / 2.70` | `3.0x` | `50,000 C` | `1,000 C` | `357 / 0 / 179 / 3` | **強制鎖定 PFUDOR 難度**；最終波為 **三龍**（`Drogon` + `Rhaegal` + `Viserion`）；保底 `1x T7` 裝備；**解鎖 `Dovahkiin` 稱號與 `FUS RO DAH` 技能** |
| 23 | **Post Game Content** (ID `34`) | Lv.400 | `95` | `1.90 / 2.85` | `4.0x` | `50,000 C` | `1,000 C` | `375 / 0 / 188 / 6` | **強制鎖定 PFUDOR 難度**；**所有怪物傷害 +50%、玩家自創怪 HP +50%**；最終波為 **6 隻 PGC 終局怪**；保底 `2x T7` 裝備 |
| 24 | **Secret Pony Level** (ID `35`) | Lv.500 | `100` | `2.00 / 3.00` | `5.0x` | — | — | `480 / 0 / 198 / 9` | **強制鎖定 PFUDOR 難度**；**所有怪物傷害 +100%、玩家自創怪 HP +100%**；最終波為 **9 隻彩虹小馬 Boss**；保底 `3x T7` 裝備；**解鎖 `Ponyslayer` 稱號** |

#### (3) Ring of Blood（RoB，浴血擂台，全 8 關完整清單）

根據 [Ring of Blood](https://ehwiki.org/wiki/Ring_of_Blood) 與 `HvLogV3/src/lib/stats/metaStats.ts:89-96`：
- **通用規則**：單波（**1 Round**）全 Boss 高難度挑戰；每一關卡每日（每次 `Dawn of a New Day` 後）**僅能嘗試 1 次**（不論勝負或逃跑皆進入當日冷卻）；入場消耗指定數量的 **Tokens of Blood**；EXP 倍率固定 `1.0x`；重複通關固定獎勵 `1,000 C`、保底掉落 1 件裝備（Clear Bonus）並高機率掉落額外 Token（2026-10-22 稽核補註：來源 `sources/ehwiki_pages/Ring_of_Blood.html` 中 Mikuru／Ryouko／Yuki 三關的額外 Token 機率為 `50%?`、FSM 與 Triple Trio 為 `99%?`，皆帶問號，下表已把問號拿掉的欄位應視為 `?`；其餘關卡的首通獎金與 Token 數（Mikuru／Ryouko／Yuki 均為 Lv.75、2 Token、25,000 C；Real Life 與 IPU 均為 3 Token）核對一致）：

| # | 挑戰名稱 (RoB Challenge) | 內部 ID | 最低等級 | 入場費 (Tokens of Blood) | 首通獎金 (`1st Clear Bonus`) | 重複通關獎金 | 額外 Token 掉落率 | 固定敵方陣容 (Composition) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Konata** | `105` | Lv.50 | `1 Token` | `25,000 C` | `1,000 C` | `50%` | `Konata` + `Manbearpig` |
| 2 | **Mikuru Asahina** | `106` | Lv.75 | `2 Tokens` | `25,000 C` | `1,000 C` | `50%` | `Mikuru Asahina` + `White Bunneh` |
| 3 | **Ryouko Asakura** | `107` | Lv.75 | `2 Tokens` | `25,000 C` | `1,000 C` | `50%` | `Ryouko Asakura` + `Mithra` |
| 4 | **Yuki Nagato** | `108` | Lv.75 | `2 Tokens` | `25,000 C` | `1,000 C` | `50%` | `Yuki Nagato` + `Dalek` |
| 5 | **Real Life** | `109` | Lv.100 | `3 Tokens` | `50,000 C` | `1,000 C` | `70%` | `Real Life` + `Konata` |
| 6 | **Invisible Pink Unicorn** | `110` | Lv.150 | `3 Tokens`（原稿「或 4」? 來源未找到，2026-10-22 稽核；來源 `sources/ehwiki_pages/Ring_of_Blood.html` 的 Real Life 與 IPU 皆為 3 Token） | `100,000 C` | `1,000 C` | `80%` | `Invisible Pink Unicorn` + 隨機 1 隻非 Konata 學姊 (`Mikuru` / `Ryouko` / `Yuki`) |
| 7 | **Flying Spaghetti Monster** | `111` | Lv.200 | `5 Tokens` | `150,000 C` | `1,000 C` | `~99%` | `Flying Spaghetti Monster` + `Ryouko Asakura` + `Mikuru Asahina` + `Yuki Nagato`（共 4 隻） |
| 8 | **Triple Trio And The Tree** | `112` | Lv.250 | `10 Tokens` | `200,000 C` | `1,000 C` | `~99%` | 三女神 (`Skuld`, `Urd`, `Verdandi`) + `Yggdrasil` + 三龍 (`Drogon`, `Rhaegal`, `Viserion`) + 三神 (`Real Life`, `IPU`, `FSM`)（**共 10 隻 Ultimate Boss 同場**，且世界樹與三女神的亡語／護盾對全場 10 隻皆生效） |

#### (4) Grindfest（GF，千波刷晶場）

根據 [Grindfest](https://ehwiki.org/wiki/Grindfest) 與 `dropStats.ts:105-108`：
- **波數（Rounds）**：固定 **1,000 波**。
- **耐力消耗（Stamina Cost）**：**入場時額外先扣 `1` 點 Stamina**，之後每通過 1 波照常扣除耐力（共約 `1 + 20 = 21` 或 `1 + 30 = 31` Stamina）。
- **怪物傷害成長曲線**：第 1 波怪物傷害由基礎的 **`50%`** 起跳，之後每推進 1 波線性增加 **`+0.4%`**（2026-10-22 稽核補註：來源原文為「starts at 50%(?) … 0.4%(?)」，兩個數字都帶問號，`sources/parsed_wiki/Grindfest.md:21`，原稿拿掉了；以下視為 `?`）（至第 126 波達 `100%`，至第 1,000 波達 **`450%`**）：
  $$\text{GF\_Damage\_Mult}(\text{round}) = 0.50 + 0.004 \times (\text{round} - 1)$$
- **收益與懲罰**：
  - **EXP 倍率**：`1.0x`
  - **Credits 掉落懲罰**：**`0.25x`（$\frac{1}{4}$）**；打完第 1,000 波發放 **`5,000 Credits`** 通關獎金。
  - **Nightmare 及以下難度懲罰**：Artifact 與 Token 掉率大幅降低。
- **專屬水晶雙重掉落與數量公式（Crystal Drop Formula）**：
  - 每隻被擊殺的怪物除了正常的 `Drop Roll` 外，額外進行 1 次獨立的水晶掉落檢定（機率等於 `Loot_Drop`）；且單次掉落的水晶數量隨難度、當前回合數 `round`（於 **Round 500** 封頂）與 `Crystarium` Hath Perk 倍增（Isekai 模式中 GF 不掉水晶）：
    $$\text{Crystal\_Drop\_Count} = \left\lfloor \text{crystarium} \times \left(\text{diffmod} + \min\left(\text{gfbonus},\ \frac{\text{gfbonus}}{500} \times \text{round}\right)\right) \right\rfloor$$
    其中：
    - `crystarium`：無 Perk 為 `1`，`Crystarium I–V` 依序為 **`2, 3, 5, 7, 10`**。
    - `diffmod` 與 `gfbonus`（見 3.1 表）：Normal `(1.0, 0.5)`、Hard `(1.2, 1.0)`、Nightmare `(1.4, 1.0)`、Hell `(1.7, 1.5)`、Nintendo `(2.0, 1.5)`、IWBTH `(2.5, 2.0)`、PFUDOR `(3.0, 2.0)`（例：PFUDOR + Crystarium V 在第 500 波起，每次水晶掉落高達 $\lfloor 10 \times (3 + 2) \rfloor = 50$ 顆！）。

#### (5) Item World（IW，道具界：v0.91 現行版 vs v0.86 對照）

根據 [Item World](https://ehwiki.org/wiki/Item_World)、[The Armory#Challenge Item World](https://ehwiki.org/wiki/The_Armory#Challenge_Item_World) 與 `Item_World_2024.md`：
- **入場條件（v0.91）**：
  1. 目標裝備必須已 **Soulbound**，且其當前 IW 等級小於該品質上限（`Current_IW_Lv < Max_IW_Lv`，上限為 Sup/Exq `10`、Mag `20`、Leg `25`、Peerless `30`、Ultimate `33`）。
  2. 消耗 **`1 – 3` 顆 World Seeds**（依裝備品質與當前 IW 階層而定）。
  3. **耐力消耗**：入場時**一次性預扣整場所有波數的 Stamina**（若中途戰敗或逃跑，預扣的 Stamina 與 World Seeds 不退還，且不獲得任何 IW 等級推進）（? 來源未找到，2026-10-22 稽核：Item World 頁只寫 Stamina「Consumed entirely upfront」，`sources/parsed_wiki/Item_World.md:17-29`，沒有任何來源提到戰敗或逃跑時不退還 Stamina／World Seeds 或不推進等級）。
- **波數與戰鬥修正**：
  - **波數（Rounds）**：v0.91 為 **`5 – 30` 波**（依裝備品質與當前 IW 層數決定）；v0.86 舊版則為 `10 – 100` 波，公式為 $\text{Rounds}_{\text{v0.86}} = \text{round}\left(75 \times \left(\frac{\text{PXP}_0 - 100}{250}\right)^3\right)$。
  - **怪物每波增傷**：第 1 波為 `100%`，每推進 1 波怪物傷害線性增加 **`+1%`**：
    $$\text{IW\_Damage\_Mult}(\text{round}) = 1.00 + 0.01 \times (\text{round} - 1)$$
  - **EXP 倍率**：隨裝備品質提高（v0.86 公式為 $\text{EXP}_{\text{IW}} = \text{Base\_EXP} \times (\text{PXP}_0 - 100) \times 0.004$，約 `1.0x – 1.284x`）。
  - **Credits 掉落懲罰**：**`0.25x`（$\frac{1}{4}$）**；Nightmare 及以下難度同樣有古董与 Token 掉率降低懲罰。
- **通關獎勵（v0.91）**：
  1. 該裝備的 `Current_IW_Lv` **`+1`**。
  2. 該裝備所有基礎屬性 **`+1%`**（`Attack Damage` 與 `Magic Damage` 為 **`+2%`**）。
  3. 該裝備的可用 **Charm Points `+1`**，且最大可強化等級 **Max Forge Level `+1`**。
  4. 玩家背包隨機獲得 **1 個 Charm**（戰鬥日誌：`You received a [<Charm Name>]`）（? 來源未找到，2026-10-22 稽核：來源只說「Charms can be obtained by clearing Item Worlds」，`sources/parsed_wiki/The_Armory.md:317`；每次通關「固定 1 個」的數量無出處，`sources/data_gh/_parsers.ts:713` 的日誌字串只能證明會掉 Charm、證明不了數量）。

---

## 四、怪物系統（Monster Stats、System Monsters 與 44,431 筆實測資料庫分析）

### 4.1 怪物 Power Level（PL）、13 大種族基礎六圍與衍生屬性換算公式

#### (A) 玩家遭遇之怪物 PL 區間與等級縮放公式

根據 [Monster Lab#Monster PL vs. Player Level](https://ehwiki.org/wiki/Monster_Lab#Monster_PL_vs._Player_Level) 與 [Monster Stats](https://ehwiki.org/wiki/Monster_Stats)：
- **怪物生成等級（`monster_level`）**：永遠等於**玩家當前等級 `Player_Lv`**。
- **有效等級（`effective_level`）**：$\text{Eff\_Lv} = \text{Player\_Lv} + \text{PL\_Ceiling\_Mod}$（見 3.1 表：Normal `+0`、Hard `+5`、Nightmare `+20`、Hell `+30`、Nintendo `+60`、IWBTH `+100`、PFUDOR `+125`）。
- **可遭遇之怪物 PL 上下限**：
  $$\text{Max\_Monster\_PL} = \begin{cases} \text{Eff\_Lv}, & \text{Eff\_Lv} < 100 \\ \min\left(2250,\ \lfloor \text{Eff\_Lv}^{1.27} - 247 \rfloor\right), & \text{Eff\_Lv} \ge 100 \end{cases}$$
  $$\text{Min\_Monster\_PL} = \min\left(\left\lfloor \frac{\text{Max\_Monster\_PL}}{2} \right\rfloor,\ 500\right)$$
  （抽樣分布偏向靠近 `Max_Monster_PL` 的怪物；單波內同種族怪物傾向結群出現，且**單波最多不會超過 4 種不同種族**）。

#### (B) 13 大種族天生基礎六圍（Starting Attributes）、天生九系抗性與技能表

根據 [Monster Lab#Monster Classes](https://ehwiki.org/wiki/Monster_Lab#Monster_Classes) 與 [Monster Lab#Skill Editor](https://ehwiki.org/wiki/Monster_Lab#Skill_Editor)：

| # | 種族名稱 (Monster Class) | STR | DEX | AGI | END | INT | WIS | 六圍總和 | Crushing | Slashing | Piercing | Fire | Cold | Elec | Wind | Holy | Dark | 可選普攻屬性 | 3 階技能類型與倍率 (PL 0 / PL 200 / PL 400 SP) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Arthropod**（節肢） | `80` | `50` | `70` | `100` | `40` | `40` | `380` | `-25` | `+25` | `0` | `+25` | `-25` | `+25` | `+25` | `0` | `0` | Crush, Pierce | Phys `20` / Phys `50` / Phys `100` |
| 2 | **Avion**（飛禽） | `50` | `80` | `140` | `40` | `60` | `50` | `420` | `0` | `0` | `+25` | `-25` | `0` | `+25` | `-50` | `0` | `0` | Pierce, Slash | Phys `20` / Phys `50` / Phys `100` (可 Wind) |
| 3 | **Beast**（野獸） | `80` | `90` | `90` | `70` | `30` | `20` | `380` | `+25` | `0` | `0` | `-25` | `+25` | `0` | `+25` | `0` | `0` | Slash, Pierce | Phys `20` / Phys `50` / Phys `100` (可 Crush) |
| 4 | **Celestial**（天界） | `50` | `50` | `100` | `50` | `100` | `80` | `430` | `-25` | `-25` | `-25` | `+25` | `+25` | `+25` | `+25` | `+25` | `-50` | Slash, Crush | Phys `50` / P&M Holy `80` / P&M Holy&Void `120` |
| 5 | **Daimon**（惡魔） | `90` | `90` | `80` | `40` | `60` | `50` | `410` | `-25` | `-25` | `-25` | `+25` | `+25` | `+25` | `+25` | `-50` | `+25` | Slash, Pierce | Phys `30` / Phys `60` / P&M Dark&Void `100` |
| 6 | **Dragonkin**（龍族） | `100` | `50` | `30` | `90` | `50` | `60` | `380` | `+25` | `+25` | `0` | `+25` | `-50` | `+25` | `-25` | `0` | `0` | Pierce, Crush | Phys `20` / P&M (+Fire) `50` / P&M (+Fire) `100` |
| 7 | **Elemental**（元素） | `30` | `60` | `60` | `40` | `80` | `120` | `390` | `-25` | `0` | `-25` | `+25` | `+25` | `+25` | `+25` | `+25` | `+25` | Fire, Cold, Elec, Wind | Mag `30` / Mag `60` / Mag `100` (皆同普攻元素) |
| 8 | **Giant**（巨人） | `100` | `80` | `30` | `120` | `20` | `10` | `360` | `+25` | `0` | `-25` | `+25` | `+25` | `-25` | `-25` | `0` | `0` | Crush | Phys `10` / Phys `30` / Phys `50` (皆 Crush) |
| 9 | **Humanoid**（人形） | `50` | `100` | `80` | `50` | `80` | `70` | `430` | `0` | `0` | `0` | `0` | `0` | `0` | `0` | `0` | `-25` | Pierce, Slash, Crush | Phys `30` / Phys `60` / P&M (+4元素) `100` |
| 10 | **Mechanoid**（機械） | `100` | `70` | `40` | `70` | `40` | `30` | `350` | `0` | `+25` | `+25` | `+25` | `+25` | `-50` | `+25` | `+25` | `0` | Pierce, Slash | Phys `20` / Phys `50` / Phys `100` |
| 11 | **Reptilian**（爬蟲） | `70` | `100` | `60` | `80` | `60` | `40` | `410` | `+25` | `+25` | `0` | `+25` | `-50` | `+25` | `0` | `0` | `0` | Pierce, Slash | Phys `20` / Phys `50` / Phys `100` |
| 12 | **Sprite**（精靈） | `30` | `120` | `120` | `20` | `70` | `60` | `420` | `-25` | `0` | `+25` | `+25` | `+25` | `+25` | `+25` | `+25` | `-50` | Pierce, Slash | Phys `50` / P&M (4元素) `100` / P&M Void `150` |
| 13 | **Undead**（不死） | `100` | `70` | `40` | `100` | `20` | `20` | `350` | `+25` | `0` | `+25` | `-50` | `+25` | `+25` | `+25` | `-50` | `+25` | Crush, Slash | Phys `20` / Phys `50` / P&M Dark `100` |

- **Monster Lab 水晶升級對基礎六圍、抗性與 PL 的成長規則**：
  - **主屬性升級（每項上限 `N = 25` 次）**：第 $N$ 次（$N=0..24$）花費 $\text{round}(50 \times 1.555079154^N)$ 顆對應主屬性水晶，增加 $3 + 0.5 N$ 點 PL（滿 25 次共加 **225 PL**；6 項全滿共加 **1,350 PL**）；每升 1 次使該項 `base_stat` 增加 $\text{clamp}(\text{base\_stat}_0 / 10,\ 6,\ 10)$。
  - **六元素抗性升級（每項上限 `N = 50` 次，物理三系抗性不可升級）**：第 $N$ 次（$N=0..49$）花費 $\text{round}(10 \times 1.26485522^N)$ 顆對應元素水晶，增加 $\lfloor 1 + 0.1 N \rfloor$ 點 PL（滿 50 次共加 **150 PL**；6 項全滿共加 **900 PL**；連同主屬性 1,350 PL 合計恰為怪物最高上限 **`2,250 PL`**）；抗性數值隨升级遞減增加（天生 `+25` 滿級升至 `+75`、天生 `0` 滿級升至 `+62`、天生 `-25` 滿級升至 `+50`、天生 `-50` 滿級升至 `+37`）。

#### (C) 怪物基礎六圍轉等級縮放六圍與 HP / 攻 / 防 / 迴避公式

根據 [Monster Stats](https://ehwiki.org/wiki/Monster_Stats)：
1. **等級縮放後六圍（`scaled_stat`）**：
   設怪物某項主屬性（含水晶升級後）為 `base_stat`，怪物等級為 $L = \text{monster\_level}$：
   $$\text{scaled\_stat} = \left\lfloor 0.01 \times \text{base\_stat} \times L + 0.3325 \times L^{1.076675} \right\rfloor$$
2. **怪物生命值（Health Points, HP）**：
   $$\text{level\_mod} = \begin{cases} 1.0, & L \le 200 \\ \min\left(4.0,\ 1.0 + 0.01 \times (L - 100)\right), & L > 200 \text{ (註：Lv.200 為 1.0，Lv.500 封頂為 4.0)} \end{cases}$$
   $$\text{Monster\_HP} = \left\lfloor (100 + 10 L + 5 \times \text{END}) \times \text{level\_mod} \times \text{difficulty\_HP\_mod} \times \text{class\_HP\_mod} \times (1 + 0.05 \times \text{chaos\_fortitude}) \right\rfloor$$
   （普通與自創怪之 `class_HP_mod = 1`；系統 Boss 之 `class_HP_mod` 見 4.2 表，介於 `11` 至 `101`）。
3. **怪物魔力（MP）、靈力（SP）與每回合回復**：
   $$\text{Monster\_MP} = 10 + L + \text{WIS}, \qquad \text{Monster\_SP} = 1 + \frac{\text{PL}}{7} + \frac{\text{STR}+\text{DEX}+\text{AGI}+\text{END}+\text{INT}+\text{WIS}}{5}$$
   - 怪物每次行動回復約 **`10%` MP** 與 **`5%` SP**（PFUDOR 難度下額外 `+50%` 回復量，即 `15%` MP 與 `7.5%` SP）。
   - 僅 `PL >= 400` 的自創怪或 Rare Boss 以上系統怪擁有 SP 槽；當 `MP >= 50%` 時可施放 MP 技能／法術，當 `SP = 100%` 時可施放 SP 必殺技。
4. **怪物基礎物理傷害（Base Physical Damage）**：
   $$\text{Monster\_Base\_Dmg} = \left(\log_{1.0003}(3330 + 2 \times \text{STR} + \text{DEX}) - 27039.81\right) \times (1 + 0.025 \times \text{chaos\_brutality})$$
   （註：$\log_{1.0003}(x) = \frac{\ln(x)}{\ln(1.0003)}$；怪物暴擊率與暴擊傷害加成為固定 `20%` 或由下式決定）。
5. **怪物暴擊、閃避、招架、抵抗與物魔減傷公式**：
   - **暴擊率**：$\text{Phys\_Crit} = 1 - \frac{3750}{3750 + \text{DEX} + \text{STR}/2}$，$\text{Mag\_Crit} = 1 - \frac{3750}{3750 + \text{WIS} + \text{INT}/2}$
   - **閃避率（Evade）**：$\text{Evade} = 1 - \left(1 - \frac{\min(10,\ \text{AGI}/100,\ (\text{AGI}-L)/75)}{100}\right) \times (1 - 0.005 \times \text{chaos\_evasion})$
   - **招架率（Parry）**：$\text{Parry} = 1 - \left(1 - \frac{\min(10,\ \text{DEX}/100,\ (\text{DEX}-L)/75)}{100}\right) \times (1 - 0.005 \times \text{chaos\_interception})$
   - **抵抗率（Resist）**：$\text{Resist} = 1 - \left(1 - \frac{\min(10,\ \text{WIS}/100,\ (\text{WIS}-L)/75)}{100}\right) \times (1 - 0.005 \times \text{chaos\_dissipation})$
   - **物理減傷（Physical Mitigation，上限 80%）**：$\text{PMit} = 1 - \frac{1000}{1000 + \text{END} + \text{AGI}/2} \times (1 - 0.01 \times \text{chaos\_defense})$
   - **魔法減傷（Magical Mitigation，上限 80%）**：$\text{MMit} = 1 - \frac{1000}{1000 + \text{END} + \text{WIS}/2} \times (1 - 0.01 \times \text{chaos\_warding})$

---

### 4.2 全系統固定怪物（System Monsters：Common / Rare / Legendary / Ultimate / PGC / Ponies）完整規格表

整合自 [System Monsters](https://ehwiki.org/wiki/System_Monsters)、[Enemy Procs](https://ehwiki.org/wiki/Enemy_Procs) 與 `persistent.json` 內建系統怪實測記錄：

> （2026-10-22 稽核更正）原稿稱本節六圍與技能「整合自 persistent.json 實測記錄」，與事實不符。`sources/persistent_monsters.json` 的每一筆只有 17 個欄位（`monsterId, created_at, monsterClass, monsterName, plvl, attack, trainer, piercing, crushing, slashing, cold, wind, elec, fire, dark, holy, lastUpdate`），沒有 STR/DEX/AGI/END/INT/WIS、HP、MP/SP、技能、Chaos 升級或 morale 欄位；本節的六圍、`class_HP_mod`（HP 倍率）與技能名稱／Power 來自 System Monsters 頁的 Stats 表與技能表（`sources/parsed_wiki/System_Monsters.md:27-165`），JSON 只提供抗性與普攻類型。另外，該頁 Stats 表中 9 隻 Pony（Fluttershy 至 Spike）的整列為空白（`sources/parsed_wiki/System_Monsters.md:175-183`），所以下方 Ponies 兩列的「六圍」「HP 倍率 26x(×2)」沒有出處（? 來源未找到，2026-10-22 稽核）。抗性欄與 JSON 的差異見表後補註。

#### (A) 系統內建普通怪（MID 1–10, 25–26，共 12 隻，無玩家自創怪可抽時之兜底怪）

提取自 `persistent.json`（`monsterClass: "Common"`, `plvl: 0`）：
- `MID 1` **Green Slime** (Crush | F:-25 C:-50 E:0 W:+75 H:+50 D:+25, 物理全 0)
- `MID 2` **Tentacle Monster** (Pierce | F:-50 C:0 E:-25 W:+25 H:+50 D:+75)
- `MID 3` **Mantitcore** (Pierce | F:+50 C:-50 E:-25 W:+25 H:+75 D:0)
- `MID 4` **Cockatrice** (Pierce | F:0 C:+75 E:+50 W:+25 H:-25 D:-50)
- `MID 5` **Giant Panda** (Slash | F:-25 C:+75 E:+25 W:+50 H:0 D:-50)
- `MID 6` **Fire Fox** (Slash | F:+75 C:-50 E:+25 W:0 H:-25 D:+50)
- `MID 7` **Scary Ghost** (Void | F:-25 C:0 E:+25 W:+50 H:-50 D:+75)
- `MID 8` **Rabid Hamster** (Pierce | F:+75 C:+50 E:-25 W:0 H:-50 D:+25)
- `MID 9` **Cookie Monster** (Slash | F:0 C:+50 E:+25 W:-50 H:+75 D:0)
- `MID 10` **Blue Slime** (Crush | F:+50 C:+25 E:+75 W:-50 H:0 D:-25)
- `MID 25` **Mutant Peacock** (Pierce | F:+50 C:+25 E:0 W:-25 H:+75 D:-50)
- `MID 26` **Amphibious Sperm Whale** (Crush | F:-25 C:+25 E:0 W:+50 H:-50 D:+75)

#### (B) 系統 Boss、學姊、三女神、三龍、三神、PGC 與小馬關 Boss 完整數值與技能表

| 階級與分組 | MID | 怪物名稱 | 基礎六圍 `(STR/DEX/AGI/END/INT/WIS)` | `class_HP_mod` | 普攻屬性 | MP 技能 (類型 / 屬性 / Power) | SP 必殺技 (類型 / 屬性 / Power) | 九系抗性 `(Cr/Sl/Pi | F/C/E/W/H/D)` | 專屬機制與掉落獎盃 (Trophy) |
|---|---|---|---|---|---|---|---|---|---|
| **Rare Boss** | `16` | **Manbearpig** | `140 / 140 / 140 / 140 / 200 / 200` | **`11x`** | Slashing | `Super Serial` (Phys Crush `50`) | `Global Warming` (Mag Fire `200`) | `+25/+25/+25` \| **`F:-1`** C:+75 E:+75 W:+75 H:+75 D:+75 | 掉 `ManBearPig Tail` (T2) |
| **Rare Boss** | `17` | **White Bunneh** | `140 / 140 / 140 / 140 / 200 / 200` | **`11x`** | Piercing | `Awww` (Mag Holy `50`) | `OM NOM NOM NOM` (Phys Slashing `200`) | `+25/+25/+25` \| F:+75 **`C:-1`** E:+75 W:+75 H:+75 D:+75 | 掉 `Holy Hand Grenade of Antioch` (T2) |
| **Rare Boss** | `18` | **Mithra** | `140 / 140 / 140 / 140 / 200 / 200` | **`11x`** | Slashing | `Purr` (Mag Wind `50`) | `Undress` (Phys Piercing `200`) | `+25/+25/+25` \| F:+75 C:+75 E:+75 W:+75 **`H:-1`** D:+75 | 掉 `Mithra's Flower` (T2) |
| **Rare Boss** | `19` | **Dalek** | `140 / 140 / 140 / 140 / 200 / 200` | **`11x`** | Piercing | `Death Ray` (Mag Elec `50`) | `Brain Sucker` (Phys Crushing `200`) | `+25/+25/+25` \| F:+75 C:+75 **`E:-1`** W:+75 H:+75 D:+75 | 掉 `Dalek Voicebox` (T2) |
| **Legendary** | `20` | **Konata** | `160 / 160 / 160 / 160 / 200 / 200` | **`16x`** | Crushing | `Timotei` (Mag Cold `50`) | `Petanko Smash` (Phys Crushing `300`) | `+25/+25/+25` \| F:+75 C:+75 E:+75 **`W:-1`** H:+75 D:+75 | 掉 `Lock of Blue Hair` (T2) |
| **Legendary** | `21` | **Mikuru Asahina** | `180 / 180 / 180 / 180 / 200 / 200` | **`26x`** | Piercing | `Mikuru Beam` (Mag Fire `50`) | `Time Quake` (Mag Dark `400`) | `+50/+50/`**`Pi:-1`** \| F/C/E/W:+75 **`H:-1 D:-1`** | 掉 `Bunny-Girl Costume` (T3) |
| **Legendary** | `22` | **Ryouko Asakura** | `180 / 180 / 180 / 180 / 200 / 200` | **`26x`** | Slashing | `Spike Shot` (Phys Pierce `50`) | `Impaler` (Phys Piercing `400`) | `+50/`**`Sl:-1`**`/+50` \| F/C/E/W:+75 **`H:-1 D:-1`** | 掉 `Hinamatsuri Doll` (T3) |
| **Legendary** | `23` | **Yuki Nagato** | `180 / 180 / 180 / 180 / 200 / 200` | **`26x`** | Crushing | `Stoic Staredown` (Mag Cold `50`) | `Data Rewrite` (Mag Wind `400`) | **`Cr:-1`**`/+50/+50` \| F/C/E/W:+75 **`H:-1 D:-1`** | 掉 `Broken Glasses` (T3) |
| **Ultimate (Trio)** | `27` | **Skuld** | `150 / 150 / 150 / 150 / 150 / 150` | **`26x`** | Crushing | `Future Shock` (Mag Elec `25`) | `Fated Demise` (Phys Slashing `87.5`) | `+25/+25/+25` \| F:+75 C:+75 **`E:0`** W:+75 H:+75 D:+75 | 亡語：`Lamentations of the Future`（存活姊妹加攻）；無獎盃 |
| **Ultimate (Trio)** | `28` | **Urd** | `150 / 150 / 150 / 150 / 150 / 150` | **`26x`** | Piercing | `Frozen Fate` (Mag Cold `25`) | `Altered Timeline` (Phys Crushing `87.5`) | `+25/+25/+25` \| F:+75 **`C:0`** E:+75 W:+75 H:+75 D:+75 | 亡語：`Screams of the Past`（存活姊妹加防）；無獎盃 |
| **Ultimate (Trio)** | `29` | **Verdandi** | `150 / 150 / 150 / 150 / 150 / 150` | **`26x`** | Slashing | `Winds of Change` (Mag Wind `25`) | `No Time Like The Present` (Phys Pierce `87.5`) | `+25/+25/+25` \| F:+75 C:+75 **`E:+50 W:0`** H:+75 D:+75 | 亡語：`Wailings of the Present`（存活姊妹加速）；無獎盃 |
| **Ultimate (Tree)** | `30` | **Yggdrasil** | `150 / 150 / 150 / 150 / 150 / 150` | **`21x`** | Void | `Healing Roots` (全體敵方補血) | 無 SP 技 | `+25/+25/+25` \| **`F:0`** C:+75 E:+75 W:+75 H:+75 D:+75 | 存活時每回合賦予三女神 `Absorbing Ward`；亡語：`Fury of the Sisters`（加雙命雙暴）；掉 `Sapling` (T4) |
| **Ultimate (Dragons)** | `8223` / `8224` | **Rhaegal** / **Viserion** | `300 / 170 / 150 / 270 / 170 / 180` | **`26x`** | Slash / Pierce | `Fiery Breath` (Phys Fire `50`) | `Hellfire` (Mag Fire `200`) | `+25/+25/`**`Pi:0`** \| F:+50 **`C:+20`** E:+75 W:+50 H:+62 D:+62 | PL `1675`；隱藏被動極高法術 Resist；無個人獎盃 |
| **Ultimate (Dragons)** | `8225` | **Drogon** | `300 / 170 / 150 / 270 / 170 / 180` | **`50x`** | Crushing | `Flames of Darkness` (Phys Dark `50`) | `Dark Void` (Mag Void `500`) | `+25/+25/`**`Pi:0`** \| F:+50 **`C:+37`** E:+75 W:+50 **`H:0`** D:+62 | PL `1575`；隱藏被動極高法術 Resist；無個人獎盃 |
| **Ultimate (Gods)** | `24` | **Real Life** | `200 / 200 / 200 / 200 / 200 / 200` | **`51x`** | Void | `Crooks / Rent Is Due...` (9 招名稱隨機，Phys `50`) | `Internet Shutdown` (Mag Dark `700`) | `+50/+50/+50` \| **六元素全 `+95`** | 掉 `Black T-Shirt` (T4) |
| **Ultimate (Gods)** | `31` | **Invisible Pink Unicorn** | `220 / 220 / 220 / 220 / 220 / 220` | **`76x`** | Holy | `Pink Unicorn Sparkles` (Phys Holy `25`) | `Perplexing Paradox` (Mag Holy `1100`) | `+50/+50/+50` \| F/C/E/W/H:+95 **`D:-1`** | 掉 `Unicorn Horn` (T5) |
| **Ultimate (Gods)** | `32` | **Flying Spaghetti Monster** | `250 / 250 / 250 / 250 / 250 / 250` | **`101x`** | Dark | `Sudden Outbreak of Common Sense` (Phys Void `25`) | `Puff of Logic` (Mag Void `1100`) | `+50/+50/+50` \| F/C/E/W/D:+95 **`H:0`** (`persistent.json` 記 `-1`) | 掉 `Noodly Appendage` (T6) |
| **PGC (Lv.400)** | `262405` | **Recycled Boss Rush** (Undead) | `350 / 245 / 190 / 350 / 170 / 170` | **`26x`** (另享滿 Chaos 2x HP) | Crushing | `Power Upgrade` (`20`) / `Team Rush` (`50`) | `Endless Swarm` (Mag Dark `100`) | `+25/0/+25` \| F:+12(37) C:+75 E:+75 W:+75 H:+37 D:+75 | PL `2250`；內建滿階 Chaos Upgrades |
| **PGC (Lv.400)** | `262406` | **Bottomless Dungeon** (Giant) | `350 / 280 / 180 / 370 / 170 / 160` | **`26x`** (×2) | Crushing | `No Saves Allowed` (`10`) / `Uncapped Scaling` (`30`) | `Literally Bottomless` (Phys Crush `50`) | `+25/0/-25` \| F:+75 C:+75 E:+50 W:+50 H:+62 D:+62 | PL `2250`；內建滿階 Chaos Upgrades |
| **PGC (Lv.400)** | `262407` | **New Game +** (Celestial) | `200 / 200 / 350 / 200 / 350 / 280` | **`26x`** (×2) | Slashing | `Level Reset` (Phys `50`) / `Ability Seal` (Mag Holy `80`) | `Monster Rescale` (Mag Void `120`) | `-25/-25/-25` \| F:+75 C:+75 E:+75 W:+75 H:+75 D:+37 | PL `2250`；內建滿階 Chaos Upgrades |
| **PGC (Lv.400)** | `262408` | **Achievement Grind** (Daimon) | `315 / 315 / 280 / 190 / 210 / 200` | **`26x`** (×2) | Piercing | `Pointless Monster Hunt` (`30`) / `Tedious Skill Maxing` (`60`) | `Beat Game Ten Times` (Mag Dark `120`) | `-25/-25/-25` \| F:+75 C:+75 E:+75 W:+75 H:+37 D:+75 | PL `2250`；內建滿階 Chaos Upgrades |
| **PGC (Lv.400)** | `262409` | **Time Trial Mode** (Sprite) | `180 / 370 / 370 / 170 / 245 / 210` | **`26x`** (×2) | Piercing | `OOB` (Phys `50`) / `RNG` (Mag Wind `100`) | `Global Cheaterboard` (Mag Void `150`) | `-25/0/+25` \| F:+75 C:+75 E:+75 W:+75 H:+75 D:+37 | PL `2250`；內建滿階 Chaos Upgrades |
| **PGC (Lv.400)** | `262410` | **Hardcore Mode** (Mechanoid) | `350 / 245 / 190 / 245 / 190 / 180` | **`26x`** (×2) | Slashing | `Arm Swipe` (`20`) / `Blade Cleave` (`50`) | `Bullet Storm` (Phys Pierce `100`) | `0/+25/+25` \| F:+50(75) C:+75 E:+37 W:+75 H:+75 D:+62 | PL `2250`；內建滿階 Chaos Upgrades |
| **Ponies (Lv.500)** | `154404`, `261395..261399` | **Fluttershy / Rainbow Dash / Twilight Sparkle / Rarity / Applejack / Pinkie Pie** (Beast ×6) | Beast 滿級水晶六圍 (`280 / 315 / 315 / 245 / 180 / 170`)（? 來源未找到，2026-10-22 稽核：System Monsters 的 Stats 表此列空白） | **`26x`** (×2)（? 來源未找到，同上） | Slash / Pierce / Crush | 見 `System Monsters#Ponies` | `The Stare` / `Sonic Rainboom` / `Arcane Blast` / `Unexpected Beatdown` / `Hail of Apples` / `Cupcakes` | `+25/+25/+25` \| F:+50 C:+75 E:+62 W:+75 H:+62 D:+62 | PL `2250`；6 隻 Beast 小馬抗性完全一致 |
| **Ponies (Lv.500)** | `261394` / `261400` / `261793` | **Gummy** (Reptilian) / **Angel Bunny** (Daimon) / **Spike** (Dragonkin) | 對應種族滿水晶六圍（? 來源未找到，2026-10-22 稽核：System Monsters 的 Stats 表此列空白） | **`26x`** (×2)（? 來源未找到，同上） | Crush / Void / Slash | `Vicious Bite` / `Bunny Kick` / `Claw Swipe` | `Existential Monologue` / `Dagger Stare` / `Firesneeze` | Gummy: `+25/+25/0 \| +75/+37/+75/+62/+62/+62`<br>Angel: `-25/-25/-25 \| +75/+75/+75/+75/+37/+75`<br>Spike: `+25/+25/0 \| +75/+37/+75/+50/+62/+62` | PL `2250` |

> **4.2(B) 與 `persistent_monsters.json` 的差異（2026-10-22 稽核補註）**：上表三女神與世界樹的抗性值跟著 System Monsters 頁寫（Skuld `E:0`、Urd `C:0`、Verdandi `E:+50 W:0`、Yggdrasil `F:0`），而 JSON 為 Skuld `elec -1`、Urd `cold -1`、Verdandi `elec 75 / wind -1`、Yggdrasil `fire -1`（`sources/persistent_monsters.json`，monsterId 27–30）；原稿只揭露了 FSM 一筆差異（`persistent.json` 記 `-1`）。Rhaegal／Viserion 的普攻類型原稿寫「Slash / Pierce」，JSON 兩者都是 Crushing（wiki 該欄為圖示、無文字可核對）。JSON 另含 Snowflake 的 3 隻龍（Rhaegal／Viserion PL 1675、Drogon PL 1575），上表三龍列已涵蓋。

---

### 4.3 `persistent.json`（44,431 筆實測怪物母體）之 13 大種族統計分析

我們撰寫獨立 Python 統計腳本直接對 `https://hv-monsterdb-data.skk.moe/persistent.json`（共 **44,431 筆**怪物紀錄；扣除 27 筆系統內建怪後，13 大種族共 **44,404 筆**）進行全母體聚合計算，得出各怪物種族在真實遊戲環境中的母體分布、平均 PL、普攻屬性比例與九系抗性（平均值 $\mu \pm$ 標準差 $\sigma$），可直接作為 `hv-v3` 單機版隨機怪生成器的實證參數：

#### (A) 13 大種族樣本數、平均 PL 與普攻屬性比例分布表（`N = 44,404`）

| 種族名稱 (Monster Class) | 樣本數 (`Count`) | 母體佔比 | 平均 PL (`PL_Avg`) | Crushing | Slashing | Piercing | Fire | Cold | Elec | Wind | Void |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Giant**（巨人） | `6,247` | `14.07%` | `576.6` | **`100.00%`** | `0%` | `0%` | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Dragonkin**（龍族） | `4,293` | `9.67%` | `654.9` | **`38.60%`** | `0.02%` | **`61.38%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Celestial**（天界） | `3,991` | `8.99%` | `676.0` | **`45.75%`** | **`54.25%`** | `0%` | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Undead**（不死） | `3,767` | `8.48%` | `635.1` | **`55.51%`** | **`44.49%`** | `0%` | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Mechanoid**（機械） | `3,542` | `7.98%` | `593.3` | `0%` | **`31.37%`** | **`68.63%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Arthropod**（節肢） | `3,438` | `7.74%` | `673.0` | **`39.12%`** | `0%` | **`60.88%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Elemental**（元素） | `3,383` | `7.62%` | `539.9` | `0%` | `0%` | `0%` | **`21.84%`** | **`25.95%`** | **`26.90%`** | **`25.30%`** | `0%` |
| **Humanoid**（人形） | `3,210` | `7.23%` | `544.4` | **`31.12%`** | **`25.70%`** | **`43.18%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Sprite**（精靈） | `2,897` | `6.52%` | `558.8` | `0%` | **`29.00%`** | **`71.00%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Beast**（野獸） | `2,800` | `6.31%` | `551.4` | `0.07%` (小馬) | **`43.36%`** | **`56.57%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Daimon**（惡魔） | `2,675` | `6.02%` | `539.6` | `0%` | **`36.90%`** | **`63.07%`** | `0%` | `0%` | `0%` | `0%` | `0.04%` (Angel Bunny) |
| **Reptilian**（爬蟲） | `2,202` | `4.96%` | `573.0` | `0.05%` (Gummy) | **`33.88%`** | **`66.08%`** | `0%` | `0%` | `0%` | `0%` | `0%` |
| **Avion**（飛禽） | `1,959` | `4.41%` | `560.2` | `0%` | **`33.64%`** | **`66.36%`** | `0%` | `0%` | `0%` | `0%` | `0%` |

#### (B) 13 大種族九系抗性實測平均值與標準差表（`Mean ± SD`，單位：`%`）

| 種族名稱 | 樣本數 | Crushing ($\mu \pm \sigma$) | Slashing ($\mu \pm \sigma$) | Piercing ($\mu \pm \sigma$) | Fire ($\mu \pm \sigma$) | Cold ($\mu \pm \sigma$) | Elec ($\mu \pm \sigma$) | Wind ($\mu \pm \sigma$) | Holy ($\mu \pm \sigma$) | Dark ($\mu \pm \sigma$) |
|---|---|---|---|---|---|---|---|---|---|---|
| **Arthropod** | `3,438` | `-25.00 ± 0.00` | `+25.00 ± 0.00` | `+0.00 ± 0.00` | `+46.17 ± 14.75` | `+6.97 ± 21.85` | `+46.07 ± 14.85` | `+46.00 ± 14.90` | `+25.99 ± 18.58` | `+26.01 ± 18.52` |
| **Avion** | `1,959` | `+0.00 ± 0.00` | `+0.00 ± 0.00` | `+25.00 ± 0.00` | `+3.26 ± 20.71` | `+22.23 ± 17.86` | `+43.49 ± 14.05` | `-16.74 ± 24.28` | `+22.66 ± 17.63` | `+22.58 ± 17.69` |
| **Beast** | `2,800` | `+25.00 ± 0.00` | `+0.05 ± 1.16` | `+0.05 ± 1.16` | `+3.27 ± 20.32` | `+42.08 ± 15.16` | `+22.72 ± 17.20` | `+43.24 ± 13.88` | `+22.64 ± 17.28` | `+22.57 ± 17.29` |
| **Celestial** | `3,991` | `-24.99 ± 0.40` | `-24.99 ± 0.40` | `-24.99 ± 0.40` | `+46.41 ± 14.72` | `+45.40 ± 15.99` | `+46.33 ± 14.79` | `+46.32 ± 14.78` | `+46.37 ± 14.74` | `-12.07 ± 25.45` |
| **Daimon** | `2,675` | `-25.00 ± 0.00` | `-25.00 ± 0.00` | `-25.00 ± 0.00` | `+43.37 ± 13.57` | `+42.07 ± 14.84` | `+43.12 ± 13.73` | `+43.07 ± 13.72` | `-17.40 ± 23.76` | `+43.18 ± 13.72` |
| **Dragonkin** | `4,293` | `+25.00 ± 0.00` | `+25.00 ± 0.00` | `+0.00 ± 0.00` | `+45.87 ± 14.66` | `-13.09 ± 25.40` | `+45.76 ± 14.75` | `+6.37 ± 21.88` | `+25.52 ± 18.48` | `+25.51 ± 18.51` |
| **Elemental** | `3,383` | `-25.00 ± 0.00` | `+0.00 ± 0.00` | `-25.00 ± 0.00` | `+43.54 ± 13.50` | `+42.52 ± 14.62` | `+43.40 ± 13.58` | `+43.28 ± 13.61` | `+43.28 ± 13.65` | `+43.25 ± 13.66` |
| **Giant** | `6,247` | `+25.00 ± 0.00` | `+0.00 ± 0.00` | `-25.00 ± 0.00` | `+43.87 ± 14.14` | `+42.69 ± 15.47` | `+3.36 ± 21.13` | `+3.27 ± 21.15` | `+23.09 ± 17.75` | `+23.07 ± 17.78` |
| **Humanoid** | `3,210` | `+0.00 ± 0.00` | `+0.00 ± 0.00` | `+0.00 ± 0.00` | `+23.09 ± 16.50` | `+22.15 ± 17.07` | `+22.85 ± 16.63` | `+22.84 ± 16.60` | `+22.86 ± 16.63` | `+3.45 ± 19.62` |
| **Mechanoid** | `3,542` | `+0.00 ± 0.00` | `+25.00 ± 0.00` | `+25.00 ± 0.00` | `+44.27 ± 14.09` | `+43.20 ± 15.61` | `-14.76 ± 24.27` | `+44.29 ± 14.26` | `+44.23 ± 14.32` | `+23.88 ± 17.79` |
| **Reptilian** | `2,202` | `+25.00 ± 0.00` | `+25.00 ± 0.00` | `+0.00 ± 0.00` | `+43.97 ± 14.07` | `-16.35 ± 24.47` | `+43.77 ± 14.19` | `+23.08 ± 17.76` | `+23.23 ± 17.74` | `+23.12 ± 17.78` |
| **Sprite** | `2,897` | `-25.00 ± 0.00` | `+0.00 ± 0.00` | `+25.00 ± 0.00` | `+43.89 ± 13.68` | `+42.67 ± 15.15` | `+43.93 ± 13.68` | `+43.81 ± 13.71` | `+43.85 ± 13.68` | `-16.73 ± 23.84` |
| **Undead** | `3,767` | `+25.00 ± 0.00` | `+0.00 ± 0.00` | `+25.00 ± 0.00` | `-13.77 ± 25.36` | `+44.26 ± 15.95` | `+45.26 ± 14.76` | `+45.21 ± 14.76` | `-14.11 ± 25.64` | `+45.31 ± 14.74` |

> **對 `hv-v3` 單機版隨機怪生成器的實證啟示**：
> 1. 直接按一個目标 `PL`（由 4.1(A) 公式依玩家等級與難度決定）將總 PL 預算（`PL - 25`）拆分為「主屬性水晶升級次數（每項 $0..25$）」與「元素抗性水晶升級次數（每項 $0..50$）」，即可重現上表中各種族在任意 PL 下的九系抗性分布。（2026-10-22 稽核更正：原稿稱可「100% 重現所有種族的真實六圍與九系抗性」，六圍部分不成立：JSON 沒有任何六圍或 HP 欄位，`sources/persistent_monsters.json` 僅 17 欄，抗性之外只有 PL 與普攻類型，六圍無從驗證；Monster Stats 頁對六圍分配只寫「between ?? and ???」，`sources/parsed_wiki/Monster_Stats.md:29`。另「無須硬塞隨機高斯雜訊」亦無依據。）
> 　　（另：此表的「母體佔比」反映的是誰在 Monster Lab 創了怪、誰被記錄到，不代表遊戲抽怪的權重；`created_at` 有 21,862 筆集中在 2024-09-26，看起來是匯入批次時間；`lastUpdate` 範圍 2021-04-17 至 2026-10-20，很多筆抗性可能已過時。）
> 2. 亦可直接將 `persistent.json` 內建為單機版的離線魔物池，或按上表的種族佔比與普攻比例程序化生成。

---

## 五、公開資料空白缺口總表與最小原味補齊建議（供 Ticket `005` 拍板）

以下逐項列出在 `003` 範圍內，官方百科（[Missing Data](https://ehwiki.org/wiki/Missing_Data)、[Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics)、[The Armory](https://ehwiki.org/wiki/The_Armory)、[Item World](https://ehwiki.org/wiki/Item_World)）與開源工具中尚未公開或標為 `? / WIP` 的空白缺口，並附上符合「保守修補、原味優先」原則的最小補齊建議：

| 缺口編號 | 子系統分類 | 公開資料中的空白缺口描述（附來源標記） | 建議於 Ticket `005` 拍板之最小原味補齊方案 |
|---|---|---|---|
| **GAP-003-01** | **裝備基底數值** | **11 種新基底的精確 `Base Rolls [Min, Max]` 範圍表缺口**（2026-10-22 稽核更正：原稿稱這 11 種為「v0.91 新增」，其中 9 種在舊世代已有，見 1.3；缺口本身部分成立：`Equipment_Ranges*.md`、`ranges.py`、`v91.ts`、`equip.ts` 中查不到這些基底的數值區間）：<br>`Detailed_Equip_Characteristics` 已完整公開全部 33 種基底的前後綴合法配對矩陣，但 `Equipment_Ranges_*` 與 `ranges.py` / `hvUtils.js` `$equip.pmax` 僅收錄經典 22 種基底；v0.91 新增的 11 種基底（1H `Dagger`、2H `Scythe` / `Swordchucks`、Staff `Ebony`、Shield `Tower`、Cloth `Gossamer` / `Ironsilk`、Light `Drakehide` / `Kevlar`、Heavy `Chain` / `Reactive`）在公開百科僅有定性比較（如 `Scythe` 物傷略高於 `Longsword`、`Tower Shield` 格擋高於 `Kite`、`Ironsilk` 有 Interference、`Reactive` 拆 5 顆 Core 且可骰 `Barrier`）。（2026-10-22 稽核補註：「僅有定性比較」不完整：Obsolete Items 頁有 Dagger、Sword Chucks、Scythe、Ebony、Tower、Gossamer、Kevlar 的舊版相對強弱 ▲▼，`sources/parsed_wiki/Obsolete_Items.md:271-311`，可作為定性素材，原稿未用。）| 在经典 22 種基底 `100%` 精確數值表基礎上，將 11 種新基底以**同階相鄰基底的正規化插值／微調（$\pm 5\% \sim 10\%$）**定義其 `Roll:[Min, Max]`（例如：`Scythe` = `Longsword` 物傷 $\times 1.05$、負重 $\times 1.05$；`Dagger` = `Wakizashi` 加上 `Focus` 法系詞綴池；`Tower Shield` = `Kite Shield` 格擋 $\times 1.08$、負重 $\times 1.25$；`Reactive` = `Plate` 減傷並開放 `Barrier` 後綴）。（? 來源未找到，2026-10-22 稽核：以上插值係數與公式（×1.05、×1.08、×1.25 等）全為自創提案，非來源值。） |
| **GAP-003-02** | **裝備詞綴權重** | **非 Power / 非 Shade 基底的後綴（Suffix）個別掉落權重與新基底前綴權重標 `?`**：<br>`Detailed_Equip_Characteristics` 明列武器前綴（`20/15/15/15/15/10/10`）、盾牌前綴（`50/25/25`）、防具前綴（專屬 `10%+10%` + 元素 `80%`）以及 `Shade`（`10/10/40/40`）與 `Power`（`8/8/42/42`）後綴權重，但武器／法杖／普通防具的後綴欄位與 `Tower / Ironsilk / Kevlar / Chain / Reactive` 的專屬前綴欄位標為 `?`。 | 1. 新防具專屬前綴沿用經典防具的 **`20%` 專屬前綴總額度**（單專屬則 `20%`，雙專屬則 `10% + 10%`，其餘 `80%` 為六元素前綴）；`Tower Shield` 採 `Mithril 50% / Reinforced 50%`。<br>2. 未公開個別權重的後綴池，在同一基底的合法後綴集合內採**等權重均勻分布（Uniform Distribution）**，或對 `Slaughter / Destruction` 設與 `Power` 相近的稀有權重。（? 來源未找到，2026-10-22 稽核：缺口本身成立，`sources/parsed_wiki/Detailed_Equip_Characteristics.md:176,187,191,194,203-205` 確實標 `?`；補值「沿用 20%」「Tower 用 Mithril 50% / Reinforced 50%」「均勻分布」皆為自創提案，且 Phase 實際為 30% 專屬前綴、與「經典 20%」不符。） |
| **GAP-003-03** | **裝備品質與 PAB** | **非傳奇品質（Fair ~ Magnificent）的基礎掉率分布曲線與 PAB 骰出數量機率**：<br>`Missing_Data#Equipment` 明列「Almost everything to do with PAB rolls」（`sources/parsed_wiki/Missing_Data.md:51`；2026-10-22 稽核更正：原稿改寫成「非傳奇裝備的 PAB 出現機率未知」，引文不是原句；另 Loot Drop Rolls 其實有局部資料：Phase 約 3.5% 機率為 0 項 PAB、法杖 5% 或 6.25% 為 0 項，`sources/parsed_wiki/Loot_Drop_Rolls.md:31`，原稿未用）；百科僅知 Crude/Fair 無 PAB、Sup/Exq 最多 2 項、Leg/Peer 必滿 3 項（輕甲 4 項、盾牌 4 抽 3），且僅公開 Mag (`0.0005%`) / Leg (`0.00025%`) / Peerless (`0.0001%–0.001%`) 的絕對掉率，未公開 Crude ~ Exquisite 的精確相對比例。 | 1. **Quality Roll 分布**：以難度 `Quality Roll Bonus`（`1x ~ 6x`）平移品質權重分布（Normal 下以 Crude/Fair/Average 為主；Nintendo 起移除 Crude/Fair；PFUDOR 下保底 Superior，Exquisite 約 `15%–20%`，Mag/Leg/Peer 嚴格按官方萬分比乘難度倍率）。<br>2. **PAB 數量**：Average `0–1` 項（各 50%）、Superior/Exquisite `1–2` 項（各 50%）、Magnificent `2–3` 項（各 50%）、Legendary+ 必滿。（? 來源未找到，2026-10-22 稽核：以上品質分布平移與各品質 PAB 項數機率皆為自創提案；來源明文只有 Sup/Exq 最多 2 項、Leg/Peerless 固定滿項。） |
| **GAP-003-04** | **The Armory (WIP)** | **v0.91 `The Armory#Repair`（Energy 每回合耗損率）與 `The Armory#Sell`（裝備基礎售價公式）標為 `WIP`**：<br>v0.91 百科尚未填入 Energy 每回合精確消耗常數與新版裝備出售價格公式。 | 1. **Repair**：耐久度（Condition）直接採用 **v0.86 `The_Forge#Repair` 完整公式**（每殺怪 `-0.005` 或每回合 `-0.05` Condition，廢料公式 $1 + \lfloor(100-\text{Cond}\%)/\text{quality\_mod}\rfloor$）；Energy 每通過 1 回合消耗 **`0.1%`**（即 1,000 回合耗盡 100% Energy，需 $\lceil\text{Scraps}/3\rceil$ 顆 Energy Cells 補滿）。（? 來源未找到，2026-10-22 稽核：Energy 每回合 `0.1%` 為自創；且 v0.91 寫損耗是「fixed rate depending on the equipment Durability and the number of cleared rounds」，`sources/parsed_wiki/The_Armory.md:490`，補值未考慮 Durability 這個變數；缺口本身成立，Repair 與 Sell 皆標 WIP，`sources/parsed_wiki/The_Armory.md:488,506`。）<br>2. **Sell**：裝備售價按品質階級與等級線性縮放（使 Average 以下售價對應 `1–50 Scrap` 的 `sale_value = Scrap * 100`，即 `100 ~ 5,000 C`，高階品質依序遞增）。 |
| **GAP-003-05** | **The Armory (Core/CP)** | **Core 無庫存時的 Credits 折算單價，以及各品質 Charm Slots 上限數**：<br>`The_Armory` 載明缺少 Core 時可用 Credits 替代，但鍛造表未直接印出單顆 Core 折算價；Charm Slots 節未印出各品質槽位數表。 | 1. **Core 折算價**：~~直接採用 `anon962/AmyBotV2` `infer_equip_stats.py` 實測常數——**Legendary Core = `20,000 C` / 顆**（稀有防具 5 顆 = `100,000 C`），**Peerless Core = `100,000 C` / 顆**~~（2026-10-22 稽核更正：此補值的歸屬錯誤。`infer_equip_stats.py` 是 AmyBot 的成本區間估算器，裡面的常數是估算假設、不是「實測」；程式碼沒有 Peerless Core 的價格，`100_000` 是 Legendary 分支下 Phase／Shade／Power／Force Shield 的 `stat_mult`，`sources/data_gh/infer_equip_stats.py:89-111`。Legendary Core `20,000` 同樣只是該估算器對武器、一般甲、法杖的 `stat_mult`，`:100,122,130`。故 Core 折算價於來源中找不到明文，? 待 Ticket 005 拍板。）<br>2. **Charm Slots 與 Base CP**：~~Base CP 依序為 Sup `20` / Exq `25` / Mag `30` / Leg `35` / Peer `40` / Ult `45`；槽位數為 Sup/Exq `2 槽`、Mag `3 槽`、Leg `4 槽`、Peerless/Ultimate `5 槽`~~（2026-10-22 稽核更正：只有 Mag `30`／Leg `35` 有出處，是由 `Advice` 的 Mag 滿改 `70 CP`、Leg 滿改 `85 CP` 反推；其餘 Base CP 與全部槽位數皆無來源，且與同報告「Base CP = Max_IW + 10」及「Legendary 武器可插 5 個 Charm」自相矛盾，見 2.3(A)。? 來源未找到） |
| **GAP-003-06** | **Item World (v0.91)** | **v0.91 Item World 各品質波數（`5–30` 波）、World Seeds 入場費（`1–3` 顆）與品質對怪物強度加成係數**：<br>`Item_World` 頁面聲明 v0.91 表格仍在開發中（僅載 `5–30 rounds`、`1–3 world seeds`、每波怪物增傷 `+1%`），且 `Missing_Data#Item_World` 指出品質對 IW 怪物強度加成的量化值未知。 | 1. **波數與種子消耗對照**：將 `5–30` 波與 `1–3` 顆種子直接對齊裝備品質與 IW 區間：<br>   - `Superior / Exquisite`（Lv.1–10）：**`10 波` / `1 World Seed`**（低階 `5 波`）<br>   - `Magnificent`（Lv.1–20）：**`15 波` / `1 World Seed`**<br>   - `Legendary`（Lv.1–25）：**`20 波` / `2 World Seeds`**<br>   - `Peerless / Peerless+`（Lv.1–30）：**`25 波` / `2 World Seeds`**<br>   - `Ultimate`（Lv.31–33）：**`30 波` / `3 World Seeds`**<br>2. **品質強度與 EXP 係數**：沿用 v0.86 的 $(\text{PXP}_0 - 100) \times 0.004$（即 Sup `1.0x`、Exq `1.05x`、Mag `1.10x`、Leg `1.15x`、Peerless `1.20x`、Ultimate `1.25x`）。（? 來源未找到，2026-10-22 稽核：上列「Sup/Exq 10 波 1 種子……Ultimate 30 波 3 種子」與 EXP 係數 1.0x–1.25x 皆為自創；缺口本身成立：Item World 頁聲明新版表格仍在開發、表格是空的，`sources/parsed_wiki/Item_World.md:3,45`，且回合數依裝備品質與目前 IW 等級而變，來源最小為 5 波、原稿表最小為 10 波；Missing Data 亦列此項，`sources/parsed_wiki/Missing_Data.md:47`。舊版 IW 回合數為 10–100（`sources/parsed_wiki/Item_World_2024.md:31`）、以 PXP／Potency 為核心，新版為 5–30 回合並收 1–3 顆種子（`sources/parsed_wiki/Item_World.md:19,21`），兩代結構不同，不能直接沿用。） |
| **GAP-003-07** | **怪物 AI 與生成** | **怪物每回合選招 AI 權重（普攻 vs MP 技 vs SP 技）與單波怪物數量分布**：<br>公開百科僅載「怪物 `MP >= 50%` 時可施放魔法／MP 技、`SP = 100%` 時可施放 SP 技、PFUDOR 難度提高施放率、Yggdrasil 存活時必放補血與護盾」，未公開伺服器端確切選招機率與每波生怪數公式。 | 1. **怪物選招 AI 規則**：<br>   - 若為 `Yggdrasil`：每回合優先對無護盾姊妹施放 `Absorbing Ward` 或對受傷友軍施放 `Healing Roots`（2026-10-22 稽核更正：來源寫 Absorbing Ward 是 Yggdrasil 存活期間對全體怪物自動維持的效果、不是選擇式行動，`sources/parsed_wiki/Enemy_Procs.md:5,31`；Healing Roots 是全體補血，不需挑目標，`sources/parsed_wiki/System_Monsters.md:63`）。<br>   - 若被 `Stunned`：跳過回合；若被 `Silenced`：無法使用 Magical 類別技能，強制改為物理普攻。<br>   - 當 `SP == 100%` 時：基礎 **`50%`**（PFUDOR **`75%`**）機率施放 SP 必殺技（施放後 SP 歸零）。<br>   - 當 `MP >= 50%` 且未放 SP 技時：基礎 **`30%`**（PFUDOR **`50%`**）機率施放 MP 技能（施放後扣除 `50%` MP）。<br>   - 其餘情況：執行基礎普攻。<br>2. **單波怪物數量分布**：<br>   - `Lv < 100`：在 `1 ~ 5` 隻間均勻或常態抽樣（Arena 前 5 關按總怪數除以波數配置）。<br>   - `Lv >= 100`：一般波次在 `3 ~ 8` 隻（隨當前波數推進線性上移至 `6 ~ 10` 隻，上限 `10` 隻）；單波先隨機抽 `1 ~ 4` 個種族，再從該種族池抽出對應 PL 區間的怪物。（? 來源未找到，2026-10-22 稽核：SP 技 50%／75%、MP 技 30%／50%、Lv.100 以上每波 3～8 隻等數字皆為自創；缺口部分成立：選招機率確實未公開，但生怪規則公開了一部分而原稿未收：同一隻自創怪大約每 10 波最多出現一次（`sources/parsed_wiki/Battles.md:246`）、同一位 owner 每波最多出 1 隻（`:250`）、每波最多 4 個種族（`:248`）。） |
| **GAP-003-08** | **特殊道具與掉落** | **Flower Vase 命中／閃避加成量、Collectible / Happy Pill 掉率、怪物階級對 Credits 乘數**：<br>明列於 `Missing_Data#Items` 與 `Missing_Data#Loot_Drop_Rolls`。 | 1. **Flower Vase (`Sleeper Imprint`, 50 ticks)**：除百科已載之 `+25%` 雙傷外，賦予 `+25%` 雙命中與 `+25%` Evade / Resist。<br>2. **Collectibles / Happy Pills**：古董檢定成功時，`5%` 轉為未滿上限的小馬雕像；`Special Items`（佔一般掉落 `2%`）中，Bubble-Gum / Flower Vase / Happy Pills / World Seeds 各佔 `25%`。<br>3. **怪物階級 Credits 乘數**：Common `1x`、Rare Boss `5x`、Legendary 學姊 `10x`、Ultimate 神怪 `25x`。（? 來源未找到，2026-10-22 稽核：缺口本身成立，`sources/parsed_wiki/Missing_Data.md:39,59-61,95`；補值 +25%、5%、各 25%、1x/5x/10x/25x 皆為自創。） |

---

## 2026-10-22 稽核補充：覆蓋缺口

來源有寫、但本報告漏掉或只帶過的項目（依 [audits/audit-003.md](../audits/audit-003.md) D 節）。只登錄缺口與出處；`sources/` 路徑相對於 `.scratch/hv-v3/`。

1. **The Tower**：Isekai 專屬戰鬥模式，5–50 波、怪物傷害從 100% 起每波 +2%、保底 Tier 1–7 獎盃裝備與 10 個 Soul Fragments，Persistent 不可用（`sources/parsed_wiki/Battles.md:261`、`sources/parsed_wiki/The_Tower.md`）。本報告標題寫「五大戰鬥模式」，全文沒有出現 The Tower。
2. **Arena 限制**：每關每天只能打一次；介面只顯示最高等級的 14 個 Arena；Token 機率 15–25%，50 波以上的關卡提高到 50–90%；怪物強度固定 100%、Credits 1x；最後一波掉率提高（同 Random Encounter）（`sources/ehwiki_pages/Arena.html` 的 Details／Rewards／Limits 段）。本報告只寫了 15–25%。
3. **生怪規則**：同一隻自創怪約每 10 波最多一次、同一 owner 每波最多 1 隻、每波最多 4 個種族（`sources/parsed_wiki/Battles.md:246,248,250`）。
4. **Armory 的 Organize／Renaming／Purchase**：Organize 有 Pin／Protect／Lock／Store 四種標記（`sources/parsed_wiki/The_Armory.md:51-65`）；Renaming 上限 50 字、改名需先 Soulbind（`sources/parsed_wiki/The_Armory.md:87-97`）；Purchase 只賣玩家賣給 Bazaar 的裝備、系統不自行生成（`sources/parsed_wiki/The_Armory.md:500-502`）。本報告 Organize 與 Renaming 各出現 0 次。
5. **各品質最大耐久範圍**：每個品質有一段可能的最大耐久值範圍，稀有裝備通常較脆、範圍較窄（`sources/parsed_wiki/Repair.md:57`）。
6. **舊裝備數值輪廓可回補新基底**：Obsolete Items 頁有 Dagger、Sword Chucks、Scythe、Ebony、Tower、Gossamer、Kevlar 的舊版相對強弱 ▲▼（`sources/parsed_wiki/Obsolete_Items.md:250-311`），是 GAP-003-01 的現成定性素材，本報告寫「僅有定性比較」卻未使用。
7. **Monster Lab 的 morale、hunger、gift 機制**：本報告完全沒提，但與怪物生成與掉落有關（`sources/parsed_wiki/Monster_Lab.md` 的 Morale／Hunger 段；邊界性較強，僅供參考）。
8. **Peerless+ 與 Legendary 上限的跨頁矛盾、Scavenger 數值互斥**：已於 1.1、1.2 就地並列兩說；此處登錄為「原稿寫成定論、實為百科矛盾」的條目（`sources/parsed_wiki/The_Armory.md:433`、`sources/parsed_wiki/Detailed_Equip_Characteristics.md:117`、`sources/parsed_wiki/Loot_Drop_Rolls.md:25,58`）。
9. **`persistent_monsters.json` 的性質與漏計**：玩家自創怪抗性快照、無六圍／HP／技能，且官方怪應為 18 筆（含 Snowflake 的 3 隻龍），「母體佔比」不等於遊戲抽怪權重（見 4.2、4.3 補註；`sources/persistent_monsters.json`）。





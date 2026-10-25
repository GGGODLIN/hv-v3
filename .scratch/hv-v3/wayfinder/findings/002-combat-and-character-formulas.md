# Ticket 002：角色屬性、熟練度、天賦技能與核心戰鬥公式全量考證報告

> 2026-10-22 已依 [audits/audit-002.md](../audits/audit-002.md) 修正；修正處附 sources/ 出處。

- **關聯決策票**：`002-character-proficiency-abilities-and-combat-formulas-audit`
- **前置來源票**：[001-public-sources-census.md](/.scratch/hv-v3/wayfinder/findings/001-public-sources-census.md)
- **版本基準**：[012-equip-and-forge-generation-era-selection.md](/.scratch/hv-v3/wayfinder/tickets/012-equip-and-forge-generation-era-selection.md)（以 **v0.91 The Armory** 世代為主體，v0.91 標示 `WIP` 處以 v0.86 快照與公開開源工具交叉補齊）
- **查證日期**：2026-10-22
- **Clean Room 邊界聲明**：本報告所有數學公式、常數與表格均取自公開網路資源（Wayback Machine 鏡像之 `ehwiki.org` 官方百科快照與 GitHub 公開第三方儲存庫），未讀取或引用本機任何舊世代目錄（`hv-clone`、`hentaiverse-clone-kb`、`CopyVerse`）與本地記憶庫，亦未連線或逆向原版伺服器。

---

## 零、證據狀態標記與前置勘誤

### 0.1 證據狀態符號定義
- `✓` **已雙重驗證**：`ehwiki.org` 一手百科與至少一個第三方開源倉庫（如 [Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse) 的 `hvUtils.js`、[anon962/HvSim](https://github.com/anon962/HvSim)、[anon962/HvLogV3](https://github.com/anon962/HvLogV3)、[MeiYongAI/JPX-Revanced](https://github.com/MeiYongAI/JPX-Revanced)、[dodying/UserJs](https://github.com/dodying/UserJs)）或百科內部查表驗算完全一致。
- `?` **單一來源或帶問號記載**：`ehwiki.org` 頁面有記載但標有 `?`、或百科不同頁面間存在數值分歧。
- `✗` **公開資料確定空白**：明列於 [Missing Data](https://ehwiki.org/wiki/Missing_Data) 或僅存於原版伺服器黑盒，須移交 Ticket `005` 制定最小規則。

### 0.2 對 Ticket 001 摘要簡化公式之實證勘誤
經直接讀取 `ehwiki.org` 原始 MediaWiki HTML 快照並以 Python 逐級驗算，修正 `001` 索引表中的三處簡寫摘要：
1. **升級所需 EXP 公式**（[Leveling Up](https://ehwiki.org/wiki/Leveling_Up#Formula) vs [Level Table](https://ehwiki.org/wiki/Level_Table)）：
   - `001` 摘要簡寫為 `(current_level + 4)^2.7`；實際百科精確雙重指數公式為：
     $$\text{Cumulative\_EXP}(L) = \begin{cases} 0, & L = 1 \\ \text{round}\!\left((L + 3)^{2.850263212287058^{(1 + L / 1000)}}\right), & 2 \le L \le 500 \end{cases}$$
     $$\text{EXP\_to\_next}(L) = \text{Cumulative\_EXP}(L + 1) - \text{Cumulative\_EXP}(L)$$
   - 其中常數 $c = \left(\frac{\ln(10^{13} - 1)}{\ln 503}\right)^{2/3} = 2.850263212287058$，使得 $L=500$ 滿級累積經驗值恰好收斂於 $9,999,999,999,999$（$10^{13}-1$）。與 [Level Table](https://ehwiki.org/wiki/Level_Table) 查表比對：表內 L=1..499 共 499 列，以本公式重算後 0 處不符（無任何 $\pm 1$ 捨入差；2026-10-22 稽核更正，原稿「496/500 零誤差、4 級 $\pm 1$」為錯誤敘述；出處 `sources/parsed_wiki/Level_Table.md` 全表，`sources/parsed_wiki/Leveling_Up.md` 的 EXP required 公式段），且與 `Trendymen/hentaiverse` (`hvUtils.js` L3431, L4058) 完全一致（`✓`）。
2. **單怪基礎 EXP 公式**（[Experience Points](https://ehwiki.org/wiki/Experience_Points#Monster_Exp_Formula)）：
   - 實際百科公式為：
     $$\text{EXP} = \left\lceil \left(3 + \frac{\text{clamp}(\text{monster\_lvl}, 1, 300)^{1.193}}{6}\right) \times \left(1 + \frac{\text{monster\_plvl}}{500}\right) \times \text{player\_multipliers} \right\rceil$$
3. **武器流血（Bleeding Wound）每跳係數**（[Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs)）：
   - 實際百科公式為 $\text{Damage per tick} = \text{ADB} \times \text{DOT\%} \times 0.4 \times \text{Stack\_Count}$（最多 5 層，滿層 $5 \times 0.4 = 2.0 \times \text{ADB} \times \text{DOT\%}$）。

---

## 一、角色等級、EXP 曲線與六圍衍生屬性

### 1.1 等級成長、EXP 曲線、每級獎勵與里程碑（Lv.1–500）

#### (A) 升級所需 EXP 與累積 EXP 公式（`✓`）
- **出處**：[Leveling Up](https://ehwiki.org/wiki/Leveling_Up#Formula)、[Level Table](https://ehwiki.org/wiki/Level_Table)、`Trendymen/hentaiverse` (`hvUtils.js` L3431, L4054–4068)。
- **數學公式**：
  $$\text{Cumulative\_EXP}(L) = \begin{cases} 0, & L = 1 \\ \text{round}\!\left((L + 3)^{2.850263212287058^{(1 + L / 1000)}}\right), & 2 \le L \le 500 \end{cases}$$
  $$\text{EXP\_to\_next}(L) = \begin{cases} 99, & L = 1 \\ \text{Cumulative\_EXP}(L + 1) - \text{Cumulative\_EXP}(L), & 2 \le L \le 499 \\ 0 \text{ (已達上限)}, & L = 500 \end{cases}$$
- **代表性等級驗算對照表**（取自 [Level Table](https://ehwiki.org/wiki/Level_Table)）：

| 等級 (Lv) | 累積總經驗 (`Cumulative EXP`) | 升下一級所需經驗 (`EXP to Next Level`) |
|---|---|---|
| 1 | 0 | 99 |
| 2 | 99 | 69 |
| 5 | 387 | 159 |
| 10 | 1,616 | 401 |
| 20 | 9,193 | 1,313 |
| 50 | 150,967 | 10,735 |
| 100 | 2,347,611 | 110,474 |
| 150 | 19,333,608 | 775,589 |
| 200 | 128,725,681 | 4,832,973 |
| 250 | 794,019,252 | 29,187,794 |
| 300 | 4,830,567,101 | 178,268,921 |
| 350 | 30,022,935,514 | 1,129,407,019 |
| 400 | 195,026,402,926 | 7,552,444,380 |
| 450 | 1,346,062,431,365 | 54,020,213,174 |
| 499 | 9,599,226,958,874 | 400,773,041,125 |
| 500 | 9,999,999,999,999 | —（上限，不再獲得 EXP） |

#### (B) 每級固定成長與特定等級解鎖（`✓`）
- **出處**：[Leveling Up](https://ehwiki.org/wiki/Leveling_Up#Effects)、[Abilities](https://ehwiki.org/wiki/Abilities#Mastery_Points)。
- **每升 1 級（Lv.2–500）固定效果**：
  1. **Ability Points (AP)**：`+1 AP`（Lv.1 起始為 `1 AP`，Lv.500 滿級由升級共得 `500 AP`；另有 `Ability Boost` 訓練可額外購買最多等同於角色等級的 `500 AP`，總上限 `1,000 AP`）。
  2. **基礎熟練度上限（Base Proficiency Cap）**：兩頁百科說法不同，並列如下（2026-10-22 稽核更正：原稿自行合成「+1.2／上限 1.2×Level」，來源無此寫法）。(a) Leveling Up 頁：「The base proficiency cap increases by 1.」每升 1 級 +1（`sources/parsed_wiki/Leveling_Up.md:15`）；(b) Proficiencies 頁：「Base proficiencies are capped at 20% above the player's current level」，即上限 1.2×Level（`sources/parsed_wiki/Proficiencies.md:201`）。兩者在每級增量上互相矛盾（+1 vs 等效 +1.2），本專案數值待 Ticket 005 拍板，此處不下定論。另 Leveling Up 同段寫「The range on the level of the monsters that can be fought increases by 1」（`sources/parsed_wiki/Leveling_Up.md:15`），即可遭遇怪物等級是一個隨玩家等級放寬的範圍。
  3. **Soulbound 裝備屬性更新**：所有已靈魂綁定裝備於戰鬥結束離開戰場時，依新等級重算 `Level Scalar`。
  4. **法術基礎消耗縮放**：所有法術基礎 MP 消耗隨 `Level × Base_Cost / 100` 同步增加。
- **特定等級解鎖表**：
  - **每 10 級（Lv.10, 20, ..., 500）**：`+1 Mastery Point`（升級共得 `50` 點；配合 `Manifest Destiny` 訓練 `+10` 點，單機非課金總計 `60` 點 Mastery Points）。
  - **每 10 級（Lv.10, 20, ..., 500）**：神殿獻祭 Artifact 可獲得的每項主屬性永久加點上限提高 `+1`（Lv.500 時每項主屬性最多 `+50`）。
  - **Lv.10**：解鎖 `Protection Augment`（Spike Shield）天賦槽。
  - **Lv.50**：解鎖二階（Tier 2）武器技能（需同時達標熟練度 50）。
  - **Lv.100**：解鎖三階（Tier 3）武器技能（需同時達標熟練度 100）；隨機遭遇（RE）單波怪數上限達 10 隻；戰敗裝備耐久度扣損由 `2%` 升至 `5%`；天賦重置費用開始隨等級攀升。
  - **Lv.145**：自訂魔物（Custom Monsters）開始帶有 SP 條並可施放 Spirit Attack。
  - **Lv.150**：解鎖 `Drain Augment`（Ether/Spirit Theft）天賦槽。
  - **Lv.201**：戰敗裝備耐久度扣損由 `5%` 升至 `10%`。
  - **Lv.250**：學齊所有法術（若熟練度達標）；熟練度成長率曲線正常化。
  - **Lv.300**：RiddleMaster 答題時限縮短至 20 秒。
  - **Lv.400**：可對任何等級裝備進行 Soulbind。

#### (C) 主屬性配點機制：自由 EXP 分配模型（`✓`）
- **出處**：[Character Stats](https://ehwiki.org/wiki/Character_Stats#Experience_Point_Allocation)、[Character Menu](https://ehwiki.org/wiki/Character_Menu#Character)。
- **核心機制**：HentaiVerse **並非每升一級發放固定屬性點**，而是將玩家的累積總經驗值（`Total EXP`）作為可自由加退點的預算池（在單一 Persona 內點擊 `+/-` 即可隨時無損加點或退點，按住 `Shift` 為 $\pm 10$、`Ctrl` 為 $\pm 100$）。
- **主屬性配點 EXP 成本公式**：
  - 將單一主屬性從 `0` 提升至 `S`（即 brown base stat = $S$）所需的**累積總 EXP** 為：
    $$\text{Attr\_Total\_EXP}(S) = \begin{cases} 0, & S = 0 \\ \left\lfloor (S + 1)^{\left(2.5475566751265^{\left(1 + \frac{S}{950}\right)}\right)} \right\rfloor, & S \ge 1 \end{cases}$$
  - （2026-10-22 稽核更正）上式的 `S = 0 → 0` 分支與 `⌊ ⌋` 取整是原稿自行加入；百科原文為 `(current_stat + 1)^(2.5475566751265^(1+(current_stat/950)))`（`sources/parsed_wiki/Character_Stats.md:15`），代入 S=0 得 1^x = 1，不是 0；原文沒有寫取整。
  - 在當前點數為 `S` 時，再點高 `1` 點（從 $S \to S+1$）所需的**邊際 EXP** 為：
    $$\text{Attr\_Next\_Point\_EXP}(S) = (S + 2)^{\left(2.5475566751265^{\left(1 + \frac{S + 1}{950}\right)}\right)} - (S + 1)^{\left(2.5475566751265^{\left(1 + \frac{S}{950}\right)}\right)}$$
  - 6 項主屬性消耗的累積 EXP 總和不得超過角色當前的 `Total EXP`：
    $$\sum_{a \in \{\text{STR,DEX,AGI,END,INT,WIS}\}} \text{Attr\_Total\_EXP}(S_a) \le \text{Total\_EXP}$$
- **有效主屬性（Effective Primary Stats）四大來源加總**：
  $$\text{Effective\_Stat}_a = S_{a,\text{exp}} \text{ (棕字)} + S_{a,\text{artifact}} \text{ (紅字，上限 } \lfloor \text{Level}/10 \rfloor\text{)} + S_{a,\text{equip}} \text{ (藍/灰字，裝備 PAB)} + S_{a,\text{isekai}}$$

#### (D) Stamina 區間表與戰鬥 EXP 總公式（`✓`）
- **出處**：[Stamina](https://ehwiki.org/wiki/Stamina)、[Experience Points](https://ehwiki.org/wiki/Experience_Points)、[HentaiVerse Settings](https://ehwiki.org/wiki/HentaiVerse_Settings)、[Dawn of a New Day](https://ehwiki.org/wiki/Dawn_of_a_New_Day)。
- **Stamina 狀態與消耗階段表**（上限 `99`，自然回復每小時 `+1`＝每日 `+24`）：

| Stamina 數值區間 | 狀態名稱 | 戰鬥 EXP 倍率 (`stamina_bonus`) | 戰利品與金錢掉落 | 每回合（Round）結束扣除量 | 入場限制 |
|---|---|---|---|---|---|
| `60–99` | **Great** | `2.0x`（`+100% EXP`） | `1.0x`（不影響掉寶率） | `0.03` / round | 可正常開始任何戰鬥 |
| `2–59` | **Normal** | `1.0x` | `1.0x` | `0.02` / round | 可正常開始任何戰鬥 |
| `1` | **Normal (Low)** | `1.0x`（進行中戰鬥仍有效） | `1.0x` | `0.02` / round | **Stamina `< 2` 時不可開啟新戰鬥** |
| `0`（`< 1`） | **Exhausted** | `0x`（完全無 EXP） | **無 Credits、無熟練度、無 PXP、無掉落** | `0` | 不可開啟新戰鬥 |

- **特殊模式 Stamina 規則**：
  - **Random Encounter**：不消耗 Stamina。
  - **Grindfest**：入場預扣 `1` 點 Stamina，且每波結算仍按上表扣 `0.02` 或 `0.03`。
  - **Item World**：入場時一次預扣完通關全波數所需的全部 Stamina。
  - **戰敗或逃跑**：該未完成波次（Round）不扣除每波 Stamina。
  - **恢復道具**：`Energy Drink` 回復 `10` 點（若有 `Long Gone Before Daylight` Hath Perk 則每日首瓶回復 `20` 點；戰鬥中同時給予 10 ticks `Energized` 每跳 `+10% Base SP` 與 `+10% OC`）；`Caffeinated Candy` 回復 `5` 點（戰鬥中給予 5 ticks `Energized`）。非戰鬥中僅可在 `Stamina < 85` 時飲用，戰鬥中無 `< 85` 限制。
- **單怪擊殺 EXP 與玩家乘區公式**：
  $$\text{player\_multipliers} = \left\lceil \text{stamina\_bonus} \times \text{difficulty\_bonus} \times \text{arena\_bonus} \times (1 + \text{hath\_perk\_bonus} + \text{training\_bonus}) \times (1 + \text{star\_bonus}) \times (1 + \text{award\_bonus}) \times (1 + \text{toplist\_bonus}) \times (1 + \text{posting\_bonus}) \right\rceil$$
  - （2026-10-22 稽核更正：原稿寫成 `mode_bonus` 且乘 `(1 + riddle_blessing)`，來源沒有 riddle_blessing 項，並漏掉 star／award／toplist／posting 四項；原文：`roundup(stamina_bonus * difficulty_bonus * arena_bonus * (1 + hath_perk_bonus + training_bonus) * (1 + star_bonus) * (1 + award_bonus) * (1 + toplist_bonus) * (1 + posting_bonus))`，`sources/parsed_wiki/Experience_Points.md:44`。另 Isekai 的 Tower 每清一層 +20%（僅當季 Isekai），`sources/parsed_wiki/Experience_Points.md:72`。）
  - `difficulty_bonus`（7 階難度，見 [HentaiVerse Settings](https://ehwiki.org/wiki/HentaiVerse_Settings) 與 [Experience Points](https://ehwiki.org/wiki/Experience_Points)）：
    - **分歧標記（`?`）**：`Experience_Points` 頁列為 `[1, 2, 4, 6, 10, 15, 20]`，而 `HentaiVerse_Settings` 頁列為 **`Normal=1, Hard=2, Nightmare=4, Hell=7, Nintendo=10, IWBTH=15, PFUDOR=20`**（Hell 為 `7x`；`sources/parsed_wiki/Experience_Points.md:56` 為 `1x, 2x, 4x, 6x, 10x, 15x, 20x`，`sources/parsed_wiki/HentaiVerse_Settings.md:11` 為 `Hell | x7`）。（2026-10-22 稽核更正：原稿稱 `JPX-Revanced.user.js` L2024 亦列 Hell=7，該行僅 `difficultyMap` 與之相符、用途未驗證；`hvUtils.js` 的 `Hell: 7` 其實是 Item World 的 PXP 倍率表且 Normal=2（`sources/hvUtils.js:10281`），不是 EXP 難度表。）
  - `mode_bonus`：Random Encounter = `5.0x`；一般 RoB / GF / IW / 低階 Arena = `1.0x`；高階 Arena（Lv.110 `Longest Journey` 起）依關卡為 `1.1x` 至 `5.0x`。
  - `training_bonus`：`Adept Learner` 每級 `+0.01`（最高 Lv.300 = `+3.00`）。
  - `hath_perk_bonus`：`Thinking Cap` `+0.25`、`Mentats` `+0.50`、`Learning Chip` `+0.75`、`Cybernetic Implants` `+1.00`（與 `Adept Learner` **加算**，合計上限 $1 + 1.00 + 3.00 = 5.0\text{x}$）。
  - **跨日事件（Dawn of a New Day）**：每日首次觸發直接給予下一級所需 EXP 的 `5%`（Lv.500 停止）。

---

### 1.2 六大主屬性對衍生屬性的逐項精確數學公式

- **出處**：[Character Stats](https://ehwiki.org/wiki/Character_Stats)、[Proficiencies](https://ehwiki.org/wiki/Proficiencies)、[Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles)、[Spirit & Overcharge](https://ehwiki.org/wiki/Spirit_%26_Overcharge)、`Trendymen/hentaiverse` (`hvUtils.js` L1360–1410, L1684–1700, L4157–4245)。

#### (A) 多件裝備 `multi: true` 遞減乘算 vs 線性加算總表（`✓`）
在 `hvUtils.js` L1360–1410 與 L1684–1700 中，裝備面板上的 42 項屬性明確分為**線性加算（Additive）**與**遞減乘算（Multiplicative Layering，`multi: true`）**兩大類：
- **遞減乘算公式**（適用於所有標記 `multi: true` 的百分比屬性，多件裝備 $i=1\dots k$ 之數值為 $v_i\%$）：
  $$\text{Equip\_Multi\_Bonus} = 1 - \prod_{i=1}^{k} \left(1 - \frac{v_i}{100}\right)$$
- **屬性疊算分類表**：

| 疊算方式 | 涵蓋裝備屬性（`$equip.stats` 鍵名） | 與角色基礎值／天賦之結合方式 |
|---|---|---|
| **線性加算 (`multi: false`)** | `Attack Damage` (ADB), `Magic Damage` (MDB), `Attack Accuracy`, `Magic Accuracy`, `Attack Crit Damage`, `Spell Crit Damage`, `Counter-Parry`, `Counter-Resist`, `Casting Speed`, `HP Bonus`, `MP Bonus`, `Burden`, `Interference`, 六系 `EDB` (`Fire/Cold/Elec/Wind/Holy/Dark EDB`), 五系法術熟練度 (`Elemental/Divine/Forbidden/Deprecating/Supportive`), 六大主屬性 (`STR/DEX/AGI/END/INT/WIS`) | 直接與角色主屬性衍生值、天賦熟練度加成相加 |
| **遞減乘算 (`multi: true`)** | `Attack Speed`, `Attack Crit Chance`, `Magic Crit Chance`, `Mana Conservation`, `Physical Mitigation`, `Magical Mitigation`, `Evade Chance`, `Block Chance`, `Parry Chance`, `Resist Chance`, 三物理特化減傷 (`Crushing/Slashing/Piercing`), 六元素特化減傷 (`Fire/Cold/Elec/Wind/Holy/Dark MIT`) | 見下方各屬性獨立公式（Mitigation 與 Attack Speed 連同主屬性/天賦皆為逐層乘算；Avoidance 則在裝備間 `multi: true` 或與主屬性加算，見第六節分歧對照） |

#### (B) 生命、魔力、靈力上限與戰鬥回復（Vitals & Battle Regen，`✓`）
1. **最大生命值（Max HP）**：
   $$\text{Base\_HP} = \left(500 + 10 \times \text{Level} + 6 \times \text{END}\right) \times (1 + \text{Vigorous\_Vitality})$$
   $$\text{Max\_HP} = \left\lfloor \text{Base\_HP} \times \left(1 + \text{HP\_Tank} + \text{Armor\_HP\_Ability} + \sum \text{Juggernaut\_Charm}\right) \right\rfloor$$
   - `Vigorous_Vitality`：擁有該 Hath Perk 時為 `0.10`，否則 `0`。
   - `HP_Tank`：General 天賦，每級 `+0.10`，最高 Lv.10 = `+1.00`。
   - `Armor_HP_Ability`：穿滿 $\ge 3$ 件同類護甲且裝備對應天賦時，每點護甲熟練度給予：
     - `Heavy HP`：`0.05% / 0.06% / 0.07% / 0.08% / 0.09% / 0.095% / 0.10%` $\times \text{Heavy\_Prof}$。
     - `Light HP/MP`：`0.025% / 0.035% / 0.045% / 0.055% / 0.065% / 0.070% / 0.075%` $\times \text{Light\_Prof}$。
   - **關鍵規則**：所有藥水（Draught / Potion / Elixir）、寶石（Health Gem）、治療法術（Cure / Regen）與 Drain 吸血上限，**一律以 `Base_HP`（乘上 `Vigorous_Vitality` 後、乘上 `HP_Tank` 與護甲/Charm HP 加成前）為基準**！
2. **最大魔力值（Max MP）**：
   $$\text{Base\_MP} = \left(10 + \text{Level} + \text{WIS}\right) \times (1 + \text{Effluent\_Ether})$$
   $$\text{Max\_MP} = \left\lfloor \text{Base\_MP} \times \left(1 + \text{MP\_Tank} + \text{Armor\_MP\_Ability} + \sum \text{Capacitor\_Charm}\right) \right\rfloor$$
   - `Effluent_Ether`：擁有該 Hath Perk 時為 `0.10`，否則 `0`。
   - `MP_Tank`：每級 `+0.10`，最高 Lv.10 = `+1.00`。
   - `Armor_MP_Ability`（$\ge 3$ 件同類護甲）：
     - `Cloth MP`：`0.05% / 0.06% / 0.07% / 0.08% / 0.09% / 0.095% / 0.10%` $\times \text{Cloth\_Prof}$。
     - `Light HP/MP`：`0.02% / 0.025% / 0.03% / 0.035% / 0.04% / 0.045% / 0.05%` $\times \text{Light\_Prof}$。
3. **最大靈力值（Max SP）**：
   $$\text{Base\_SP} = \left(1 + \frac{\text{STR} + \text{DEX} + \text{AGI} + \text{END} + \text{INT} + \text{WIS}}{5}\right) \times (1 + \text{Suffusive\_Spirit})$$
   $$\text{Max\_SP} = \left\lfloor \text{Base\_SP} \times (1 + \text{SP\_Tank}) \right\rfloor$$
   - `Suffusive_Spirit`：擁有該 Hath Perk 時為 `0.10`，否則 `0`。
   - `SP_Tank`：每級 `+0.10`，最高 Lv.10 = `+1.00`。
   - **關鍵規則**：`Spark of Life` 與 `Spirit Shield` 的 SP 消耗皆按 `Base_SP` 等比例放大；因此提高 `Base_SP`（加六圍或買 `Suffusive Spirit`）只對固定每回合扣 `1 SP` 的 `Spirit Stance` 有淨收益，而點 `SP Tank` 則能同時降低 `Spark of Life` / `Spirit Shield` 相對總 SP 池的佔比。
4. **戰鬥每 Tick 自然回復（Battle Regen，每經過 100 Time Units = 1 Tick 觸發一次）**：
   $$\text{MP\_Regen\_per\_tick} = 5 + \frac{\text{WIS}}{25} \times \text{regen\_perk\_mult}$$
   $$\text{SP\_Regen\_per\_tick} = 1 + \frac{\text{STR} + \text{DEX} + \text{AGI} + \text{END} + \text{INT} + \text{WIS}}{600} \times \text{regen\_perk\_mult}$$
   - `regen_perk_mult`：預設 `1.0`；擁有 `Resplendent Regeneration` Hath Perk 時為 `1.5`（若同時擁有舊版 Gold Star 則為 `2.0`）。
   - **開啟 Spirit Stance 當回合不觸發自然回復**（[Spirit & Overcharge](https://ehwiki.org/wiki/Spirit_%26_Overcharge#Spirit_Stance)）。

#### (C) 物理基礎傷害（Attack Base Damage, ADB，`✓`）
$$\text{ADB}_{\text{attr}} = \log_{1.0003}\!\left(3330 + 2 \cdot \text{STR} + \text{DEX}\right) - 27029.81 = \frac{\ln(3330 + 2 \cdot \text{STR} + \text{DEX})}{\ln(1.0003)} - 27029.81$$
- 註：因 $\log_{1.0003}(3330) \approx 27039.81$，當 $\text{STR}=\text{DEX}=0$ 時，$\text{ADB}_{\text{attr}} = 10.0$。
- **主手總基礎物理傷害（Mainhand ADB）**：
  $$\text{ADB}_{\text{main}} = \left(\text{ADB}_{\text{attr}} + \text{Prof\_ADB\_Bonus} + \text{ADB}_{\text{main\_wpn}} + \sum_{\text{armor/shield}} \text{ADB}_{\text{equip}}\right) \times \left(1 + \text{2H\_Acc\_Mult}\right)$$
  - `Prof_ADB_Bonus`：
    - `Unarmed`：固定 `+10`。
    - `1H`（已裝備 `1H Damage` 天賦 Lv.1/2/3）：`1H_Prof × (2 / 3 / 4)`。
    - `2H` 或 `Niten`（已裝備 `2H Damage` 天賦 Lv.1/2/3）：`2H_Prof × (2 / 2.5 / 3)`。
    - `DW`（已裝備 `DW Damage` 天賦 Lv.1/2/3）：`DW_Prof × (3 / 4 / 5)`。
    - `Staff`（已裝備 `Staff Damage` 天賦 Lv.1）：`Staff_Prof × 3`。
  - `2H_Acc_Mult`：僅在 `2H` 流派且裝備 `2H Accuracy` 天賦（Lv.1/2）時生效，值為 `2H_Prof × (0.0002 / 0.0004)`（即每 10 點熟練度 `+0.2%` / `+0.4%`）。
- **副手總基礎物理傷害（Offhand ADB，僅限 Dual-Wielding 與 Niten Ichiryu）**：
  $$\text{Offhand\_Wpn\_Mult} = \begin{cases} 1.0, & \text{副手為 Dagger 或 Wakizashi} \\ 1 - 0.2 \times \max\!\left(0, \frac{600 - \text{DW\_Prof}}{600}\right), & \text{副手為其他單手武器} \end{cases}$$
  $$\text{ADB}_{\text{off}} = 0.5 \times \left(\text{ADB}_{\text{attr}} + \text{Prof\_ADB\_Bonus} + \text{ADB}_{\text{off\_wpn}} \times \text{Offhand\_Wpn\_Mult} + \sum_{\text{armor}} \text{ADB}_{\text{equip}}\right)$$
  - 註：[Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics#Elemental_Strikes) 明載副手攻擊具有 50% 傷害懲罰（`offhand 50% damage penalty`），且主手武器的 `ADB` 不計入副手攻擊，反之亦然。

#### (D) 魔法基礎傷害（Magic Base Damage, MDB，`✓`）
$$\text{MDB}_{\text{attr}} = \log_{1.0003}\!\left(3330 + 2 \cdot \text{INT} + \text{WIS}\right) - 27039.81 = \frac{\ln(3330 + 2 \cdot \text{INT} + \text{WIS})}{\ln(1.0003)} - 27039.81$$
$$\text{MDB} = \text{MDB}_{\text{attr}} + \text{Staff\_Prof\_MDB} + \sum_{\text{all\_equipped}} \text{MDB}_{\text{equip}}$$
- `Staff_Prof_MDB`：僅在 `Staff` 流派且裝備 `Staff Spell Damage` 天賦（Lv.1/2/3）時生效，為 `Staff_Prof × (0.2 / 0.4 / 0.5)`。

#### (E) 物理與魔法命中（Attack Accuracy & Magic Accuracy，`?` 係數見第六節）
- **物理命中（Physical Attack Accuracy）**：
  $$\text{Acc}_{\text{phys,main}} = \text{DEX} \times k_{\text{acc}} + \text{Prof\_PhysAcc} + \text{Acc}_{\text{main\_wpn}} + \sum_{\text{armor}} \text{Acc}_{\text{equip}}$$
  $$\text{Acc}_{\text{phys,off}} = \text{DEX} \times k_{\text{acc}} + \text{Prof\_PhysAcc} + \text{Acc}_{\text{off\_wpn}} \times \left(1 - X_{\text{acc}} \cdot \max\!\left(0, \frac{600 - \text{DW\_Prof}}{600}\right)\right) + \sum_{\text{armor}} \text{Acc}_{\text{equip}}$$
  - 其中副手武器命中懲罰係數 $X_{\text{acc}}$：`Dagger` / `Wakizashi` 為 `0.2`，其餘單手武器為 `0.5`。
  - `Prof_PhysAcc`：
    - 武器天賦：`1H Accuracy` / `2H Accuracy` / `DW Accuracy`（Lv.1/2）給予 `+0.1 / +0.2` 每點熟練度（或百分比表示為 `0.01% / 0.02%`）；`Staff Accuracy`（Lv.1/2/3）給予 `+0.075 / +0.10 / +0.125` 每點熟練度。
    - 護甲天賦（$\ge 3$ 件輕甲）：`Light Acc`（Lv.1）給予 `+0.05` 每點輕甲熟練度。
- **魔法命中（Magic Attack Accuracy）**：
  $$\text{Acc}_{\text{mag}} = \text{WIS} \times k_{\text{acc}} + \text{Prof\_MagAcc} + \text{MAcc}_{\text{main}} + \text{MAcc}_{\text{off}} + \sum_{\text{armor}} \text{MAcc}_{\text{equip}}$$
  - 副手武器或盾牌（如 `of the Battlecaster`、`of Focus`）上的 `Magic Accuracy` **無副手懲罰**，且雙持武器時兩把武器的 `Magic Accuracy` 皆全額計入。
  - `Prof_MagAcc`：`Staff Accuracy`（Lv.1/2/3）給予 `+0.075 / +0.10 / +0.125` 每點法杖熟練度；`Cloth Spellacc`（$\ge 3$ 件布甲，Lv.1/2/3）給予 `+0.05 / +0.075 / +0.10` 每點布甲熟練度。
- （? 2026-10-22 稽核：上列 `Staff Accuracy` 3 層與 `Cloth Spellacc` 3 層的係數只是 Abilities 頁一側的說法；Proficiencies 頁與 `sources/hvUtils.js` 只有 2 層／1 層（見 3.2 節表與 GAP-002-04），此處正文未標分歧。另 `Focus` 是否仍影響 Resist 機率，百科 `sources/parsed_wiki/Missing_Data.md:85` 列為未知。）
- **百科內部係數分歧（`k_acc`）**：[Character Stats](https://ehwiki.org/wiki/Character_Stats) 頂部總表寫 `1 DEX/WIS = +0.5 Accuracy`，而同頁下方公式區塊寫 `DEX * 0.05` / `WIS * 0.05`（差 10 倍，詳見第六節缺口 #1）。

#### (F) 物理與魔法暴擊率、暴擊傷害倍率（Crit Chance & Crit Damage，`✓`）
1. **物理暴擊率（Physical Crit Chance，面板百分比）**：
   - 角色自身基礎物理暴擊率（来自 [Monster Stats](https://ehwiki.org/wiki/Monster_Stats#Critical_Chance) 同源公式與裝備層疊）：
     - 裝備與天賦部分：武器之 `Attack Crit Chance` 只套用於使用該武器的手（主手/副手各自獨立），護甲上的 `Attack Crit Chance` 以 `multi: true`（$1 - \prod(1 - v_i/100)$）疊加。
     - **Burden 暴擊懲罰**（[Burden](https://ehwiki.org/wiki/Burden#Effects_of_Burden)）：當總 `Burden > 70` 時，超過 70 的每 1 點 Burden 扣減物理暴擊率（上限扣至 `Burden = 120`）。原文為「If burden > 70, decreases physical crit rate by 2%, (capped at 120 burden)」（`sources/parsed_wiki/Burden.md:23`），最直接的讀法是每點 −2%；每點 −0.04%（70～120 共 −2%）是另一種讀法，未驗證（? 來源未找到，2026-10-22 稽核）。
2. **魔法暴擊率（Magical Crit Chance，面板百分比）**：
   - 由主手、副手與護甲之 `Magic Crit Chance` 以 `multi: true`（$1 - \prod(1 - v_i/100)$）疊加；若開啟 `Arcane Focus`，暴擊率額外乘算疊加 `+10%`：
     $$\text{CritChance}_{\text{mag,arcane}} = 1 - (1 - \text{CritChance}_{\text{mag}}) \times (1 - 0.10)$$
     （驗算自 `hvUtils.js` L4173：`const arcane_crit_chance = 1 - (1 - magic_crit_chance) * (1 - 0.1);`）。
3. **物理暴擊傷害加成（Attack Crit Damage Bonus，`crit_mod`）**：
   $$\text{CritMod}_{\text{phys}} = 0.50 + \frac{\sum \text{Equip\_Attack\_Crit\_Damage}}{100} + \text{DW\_Crit\_Ability} + \text{Light\_Crit\_Ability} + \text{Heartseeker\_Crit\_Bonus}$$
   - 基礎暴擊增傷為 `+50%`（即 `1.50x`）。
   - `DW_Crit_Ability`（`DW` 或 `Niten` 流派，Lv.1）：`0.00025 × DW_Prof`（每 10 點熟練度 `+0.0025x` = `+0.25%`）。
   - `Light_Crit_Ability`（$\ge 3$ 件輕甲，Lv.1–5）：`(0.0001 / 0.00015 / 0.0002 / 0.00023 / 0.00025) × Light_Prof`。
   - `Heartseeker_Crit_Bonus`：開啟 `Heartseeker` 時，未點天賦為 `+0.25`，點 `Better Heartseeker` Lv.1–7 為 `+0.28 / +0.31 / +0.34 / +0.36 / +0.38 / +0.39 / +0.40`。
4. **魔法暴擊傷害加成（Spell Crit Damage Bonus，`crit_mod`）**：
   $$\text{CritMod}_{\text{mag}} = 0.50 + \frac{\sum \text{Equip\_Spell\_Crit\_Damage}}{100} + \text{Cloth\_Spellcrit\_Ability} + \text{Arcane\_Focus\_Crit\_Bonus}$$
   - `Cloth_Spellcrit_Ability`（$\ge 3$ 件布甲，Lv.1–5）：`(0.0001 / 0.00015 / 0.00018 / 0.00021 / 0.00025) × Cloth_Prof`。
   - `Arcane_Focus_Crit_Bonus`：開啟 `Arcane Focus` 時，未點天賦為 `+0.25`，點 `Better Arcane Focus` Lv.1–7 為 `+0.28 / +0.31 / +0.33 / +0.35 / +0.37 / +0.39 / +0.40`（`hvUtils.js` L4174 實證確認）。

#### (G) 四大迴避屬性：閃避（Evade）、招架（Parry）、格擋（Block）、抵抗（Resist）
1. **Evade（閃避）**：
   $$\text{Evade} = \left(0.4 \times \text{AGI} + \text{Equip\_Evade} + \text{Title\_Evade\_Bonus}\right) \times \left(1 - \frac{\min(\text{Burden}, 75)}{75}\right) \times (1 + \text{Shadow\_Veil\_Mod})$$
   - `Title_Evade_Bonus`：`Ascended` `+1`、`Destined` `+2`、`Godslayer` / `Dovahkiin` `+3`、`Ponyslayer` `+4`。
   - （? 來源未找到，2026-10-22 稽核：Character Stats 頁對 Evade 與 Attack Speed 的 `f(Burden)` 都寫「Where f() is some function that still needs to be discovered」，`sources/parsed_wiki/Character_Stats.md:15`；下式為與 Burden 頁範例擬合的定式，原稿未揭露此缺口。）
   - `Burden` 懲罰：每 1 點 Burden 降低 `4/3%`（約 `1.333%`）閃避率，在 `Burden = 75` 時閃避歸零（`1 - 25/75 = 2/3`，50% 閃避在 25 Burden 時變為 $50\% \times (1 - 25/75) = 33.33\%$，與 [Burden](https://ehwiki.org/wiki/Burden) 範例 `~33.5%` 吻合）。
   - `Shadow_Veil_Mod`：施放 `Shadow Veil` 法術時 `+10%`（點滿 `Better Shadow Veil` 為 `+20%`），使用 `Scroll of Shadows` / `Scroll of the Gods` 時為 `+25%`。
2. **Parry（招架）**：
   $$\text{Parry} = 0.4 \times \text{DEX} + \text{Parry}_{\text{main}} + \text{Parry}_{\text{off}} \times \text{Offhand\_Parry\_Mult} + \text{Prof\_Parry\_Bonus}$$
   - `Offhand_Parry_Mult`（副手招架倍率）：
     - 一般雙持（Dual-Wielding）：副手為 `Dagger` 或 `Wakizashi` 時為 **`1.5`**（`+50%`），副手為 `Shortsword` 時為 **`1.2`**（`+20%`），其餘（含盾牌 `of the Nimble`）為 **`1.0`**。
     - 二天一流（Niten Ichiryu）：副手 `Wakizashi` 的招架加成減半為 **`1.25`**（`+25%`，見 [Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles#Niten_Ichiryu)）。
   - `Prof_Parry_Bonus`：
     - `2H Parry`（2H 或 Niten 流派，Lv.1/2）：`2H_Prof × (0.2 / 0.3)`。
     - `DW Damage`（DW 流派，Lv.1/2/3）：附帶 `DW_Prof × (0.1 / 0.15 / 0.2)` Parry。
3. **Block（格擋）**：
   $$\text{Block} = \text{Equip\_Block} + \text{Prof\_Block\_Bonus}$$
   - 主屬性不提供基礎格擋；僅來自盾牌、重甲 `Shielding` 前綴、`of the Barrier` 後綴與武器天賦：
     - `1H Block`（1H 流派，Lv.1）：`1H_Prof × 0.25`（每 10 點熟練度 `+2.5`）。
     - `2H Parry`（2H 或 Niten 流派，Lv.1/2）：同時給予 `2H_Prof × (0.2 / 0.3)` Block（每 10 點熟練度 `+2 / +3` Block）。
4. **Resist（魔法抵抗）**：
   $$\text{Resist} = 0.4 \times \text{WIS} + \text{Equip\_Resist}$$

#### (H) 物理與魔法減傷（Physical & Magical Mitigation）與特化減傷（Specific Mitigation，`✓`）
1. **主屬性與裝備之一般減傷（Physical / Magical Mitigation）**：
   $$\text{Mit}_{\text{phys,attr}} = \min\!\left(0.80,\; 1 - \frac{900}{900 + \text{END} + \text{AGI}/2}\right)$$
   $$\text{Mit}_{\text{mag,attr}} = \min\!\left(0.80,\; 1 - \frac{900}{900 + \text{END} + \text{WIS}/2}\right)$$
   $$\text{Equip\_Mit} = 1 - \prod_{i} \left(1 - \frac{\text{Mit}_{i}}{100}\right)$$
   $$\text{Mit}_{\text{sheet}} = 1 - \left(1 - \text{Equip\_Mit}\right) \times \left(1 - \text{Mit}_{\text{attr}}\right)$$
   - 註：主屬性提供的減傷上限為 `80%`（當 $\text{END} + \text{AGI}/2 = 3600$ 時達到 $1 - 900/4500 = 80\%$）。
   - **戰鬥中 Buff 減傷層疊**（[Character Stats](https://ehwiki.org/wiki/Character_Stats#Limits)、[Damage](https://ehwiki.org/wiki/Damage#The_Player)）：`Protection`（法術 `25%–30%`／卷軸 `50%`）、`Defend`（`25%`）、`Cloak of the Fallen`（`75%`）在面板減傷之後以獨立乘區疊算：
     $$1 - \text{Mit}_{\text{total}} = (1 - \text{Mit}_{\text{sheet}}) \times (1 - \text{Mit}_{\text{Protection}}) \times (1 - \text{Mit}_{\text{Defend}}) \times (1 - \text{Mit}_{\text{Cloak}})$$
2. **特化減傷（Specific Mitigation：3 物理 Crushing/Slashing/Piercing + 6 元素 Fire/Cold/Elec/Wind/Holy/Dark）**：
   - 來自護甲／盾牌詞綴、X-Proof Charms、戰鬥中使用之 `Infusion`（`+25%`）、`Spike Shield` 天賦（Protection 期間 `+10% / 15% / 20% / 25%`）與 `Heavy Crush/Prcg/Slsh` 天賦（每 10 點重甲熟練度 `+0.2% / 0.4% / 0.5%`）。
   - 多件裝備間以 `multi: true`（$1 - \prod(1 - v_i/100)$）乘算（`hvUtils.js` L1395–1403），星期元素日（Day of the Week）則對當日屬性扣減 `10` 點（週五全屬性扣減 `5` 點）。
   - **Void（虛空）傷害**：無任何 Specific Mitigation 可減免（僅受 Physical/Magical Mitigation 與 Protection/Defend 影響）。

---

## 二、四大流派（Fighting Styles）與八大熟練度（Proficiencies）

### 2.1 流派判定條件與專屬被動公式（`✓`）
- **出處**：[Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles)、[Character Stats](https://ehwiki.org/wiki/Character_Stats)、[Overcharge](https://ehwiki.org/wiki/Overcharge)。

| 流派名稱 | 裝備判定條件 | 基礎普攻型態 | 專屬被動特效與精確觸發公式 | Overcharge (OC) 獲取規則 |
|---|---|---|---|---|
| **Unarmed（空手）** | 主副手皆無武器 | 物理 `Crushing`（內建 `+10` ADB） | 無流派被動、不吃也不練任何武器熟練度 | 普攻命中 `+5% ~ +10%` OC |
| **One-Handed（單手 / 1H）** | 主手裝備 1 把單手武器，副手為空或裝備 **Shield（盾牌）** | 物理（依主手武器屬性） | **1. Overwhelming Strikes（壓制打擊）**：<br>• 普攻命中後觸發，機率：<br>$\text{Chance} = \min\!\left(30\%,\; 5 + 0.01 \times (\text{STR} + \text{END}) + \frac{\text{1H\_Prof}}{20}\right)\%$<br>• 效果：持續 **4 ticks**，期間物理傷害 `+15%`、物理命中 `+50%`，且每層提供 `20% Counter-Parry`（降低怪物基礎 Parry 20%/層，最多疊 **5 層 = 100% 破招架**）。<br>**2. Counter-Attack（反擊）**：<br>• 當玩家 **Block 或 Parry** 敵方攻擊時觸發，機率：<br>$\text{Chance} = \min\!\left(75\%,\; 25 + 0.02 \times (\text{STR} + \text{DEX}) + \frac{\text{1H\_Prof}}{10}\right)\%$<br>• 每回合最多反擊次數：$\text{1H\_Prof} < 100$ 為 **1 次**；$100 \le \text{1H\_Prof} < 200$ 為 **2 次**；$\text{1H\_Prof} \ge 200$ 為 **3 次**。<br>• 性質：以主手當前傷害進行反擊，可觸發武器 `Stun`，但**不可暴擊、不可觸發其他武器特效或 Elemental Strike、亦不可被怪物閃避或招架**。 | • 普攻命中：`+5% ~ +10%` OC<br>• 反擊命中：每回合最多觸發 1 次 `+5% ~ +10%` OC |
| **Two-Handed（雙手 / 2H）** | 主手裝備 1 把雙手近戰武器（Longsword, Katana, Scythe, Estoc, Mace, Swordchucks；2026-10-22 稽核：Scythe、Swordchucks 於 Detailed Equip Characteristics 頁列在 Two-Handed 區，`sources/parsed_wiki/Detailed_Equip_Characteristics.md:317,320`，但 Obsolete Items 頁把 Sword Chucks 標為 1H、Scythe 標為 2H 的已淘汰舊世代武器，`sources/parsed_wiki/Obsolete_Items.md:256-262,275,277`，兩頁說法並存，? 0.91 是否沿用舊武器定位未驗證），副手為空 | 物理（依主手武器屬性） | **Domino Strike（連擊濺射）**：<br>• 普攻命中主目標後觸發，向左右相鄰敵人連鎖濺射，機率：<br>$\text{Chance} = \min\!\left(90\%,\; 40 + 0.02 \times (\text{STR} + \text{DEX}) + \frac{\text{2H\_Prof}}{10}\right)\%$<br>• 最大連鎖距離（單側）：基礎 2 格（左右共 4 隻）；當 $\text{2H\_Prof} \ge 100$ 時擴展至單側 **3 格**（左右最多濺射 **6 隻**）。可跨過已死亡怪物繼續向下一格判定。<br>• 距離第 1 / 2 / 3 格的傷害倍率：起始為 `75% / 60% / 40%`，每 10 點 `2H_Prof` 各提高 `+1%`，於 $\text{2H\_Prof} = 250$ 達到上限 **`100% / 85% / 65%`**。<br>• 性質：濺射攻擊仍可能 Miss 或被 Parry（但即使中間目標 Miss，只要非主目標仍可繼續向下連鎖）；可觸發武器 `Stun / Bleed / Penetrated Armor`，但**不可觸發吸血吸魔（Siphon）與 Elemental Strike**。 | • 主手命中：`+5% ~ +10%` OC<br>• 每次 Domino 濺射命中：額外 **`+1%` OC** |
| **Dual-Wielding（雙持 / DW）** | 主手與副手各裝備 1 把單手武器 | 主手物理普攻 | **1. Offhand Strike（副手追擊）**：<br>• 主手普攻成功後觸發副手攻擊，機率：<br>$\text{Chance} = \min\!\left(\text{Cap},\; \text{Base} + 0.01 \times (\text{DEX} + \text{AGI}) + f(\text{DW\_Prof})\right)$（見第六節缺口 #3）。<br>• 副手可獨立觸發自身的武器特效（Stun/Bleed/PA/Siphon）與 Elemental/Void Strike。<br>**2. Spreading Poison（蔓延劇毒）**：<br>• 對處於 `Blind` 狀態的敵人施放 `Backstab` 技能時有 **`~50%` 機率**附加，持續 **20 ticks**：使目標 **Evade 歸零**、物理與魔法 **Mitigation 降低 10%**，且每 tick 造成等同於施放當下主手面板傷害（無視怪物減傷）的固定 DoT。 | • 主手命中：`+5% ~ +10%` OC<br>• 副手命中：額外 **`+5%` OC** |
| **Niten Ichiryu（二天一流）** | 主手裝備 **Katana**（雙手刀）、副手裝備 **Wakizashi**（小太刀） | 主手物理普攻 | 同時享有 2H 與 DW 被動（部分折減）：<br>• **Domino Strike**：觸發率公式同 2H，但**不享有熟練度距離與傷害加成**（固定單側最多 2 格 = 最多濺射 4 隻，倍率固定 `75% / 60%`）。<br>• **Offhand Strike**：觸發率與命中懲罰同 DW，但副手 Wakizashi 招架加成由 `+50%` 減半為 **`+25%`**（即 `1.25x`）。<br>• **武器技能解鎖**：以 $\min(\text{2H\_Prof}, \text{DW\_Prof})$ 判定。<br>• **熟練度獲取**：戰鬥獲得之武器熟練度按 **`50% 2H + 50% DW`** 拆分。 | • 主手命中：`+5% ~ +10%` OC<br>• 副手命中：額外 **`+3%` OC**<br>• Domino 濺射：`+1%` OC |
| **Staff（法杖法師）** | 主手裝備 **Staff** | **Arcane Blow（奧術敲擊）**：<br>$\text{Damage} = \text{Physical\_Damage} + \text{Magical\_Damage}$（屬物理 `Crushing` 攻擊） | **1. Coalesced Mana（魔力合流）**：<br>• 施放任何耗魔攻擊／減益法術或使用 `Concussive Strike` 命中敵人時觸發，機率：<br>$\text{Chance} = \min\!\left(35\%,\; 10 + 0.01 \times (\text{INT} + \text{WIS}) + \frac{\text{Staff\_Prof}}{20}\right)\%$<br>• 效果：持續 **5 ticks**，對該目標施放任何法術的 **MP 消耗減半（`-50%`）**，與 Spirit Stance 乘算疊加。<br>**2. Ether Tap（以太分流）**：<br>• 用普攻 `Arcane Blow` 命中帶有 `Coalesced Mana` 的目標時按法杖特效機率觸發（若該下 `Arcane Blow` **擊殺**帶有 Coalesced Mana 的目標則 **100% 必觸發**）。<br>• 效果：移除目標的 Coalesced Mana，賦予玩家持續 **4 ticks** 的 `Ether Tap` Buff，每回合回復 **`2% Base_MP`**（可疊加 1 次變成 `Ether Tap (x2)`，每回合回復 **`4% Base_MP`**）。 | • Arcane Blow 命中：`+5% ~ +10%` OC |
| **所有流派共通施法被動** | 施放任何消耗 MP 的法術（已在 Channeling 下施放者不重複觸發） | — | **Channeling（魔力引導）**：<br>• 觸發機率估計式：$\text{Chance} \approx \frac{\text{Spell\_MP\_Cost}}{1.2 \times \text{Base\_MP}}$<br>• 效果：持續 **5 ticks**（若由 `Mystic Gem` 觸發則為 **15 ticks**），下一發法術 **MP 消耗變為 `1 MP`**、直接傷害與治療量 **`+50%`**、Buff/Debuff 持續時間 **`+50%`**，且傷害與減益法術 **100% 必中、絕不被 Evade 或 Resist**。施放一發法術後立即消耗消失。 | — |

---

### 2.2 八大熟練度（Equipment & Magic Proficiencies）完整機制與公式

#### (A) 熟練度分類與上限（`✓`）
- **出處**：[Proficiencies](https://ehwiki.org/wiki/Proficiencies)、`Trendymen/hentaiverse` (`hvUtils.js` L3802, L4594–4605)。
1. **7 項裝備熟練度（Equipment Proficiencies）**：
   - 武器 4 項：`One-handed Weapon`, `Two-handed Weapon`, `Dual-wielding`, `Staff`。
   - 護甲 3 項：`Cloth Armor`, `Light Armor`, `Heavy Armor`。
   - **上限**：僅有自然基礎熟練度（Base Proficiency），上限為 **`1.2 × Level`**（比玩家當前等級高 20%；出處 `sources/parsed_wiki/Proficiencies.md:201`，但 Leveling Up 頁寫每級 +1，兩頁矛盾，見 1.1(B) 第 2 點）。裝備與 Hath Perk 無武器／護甲熟練度加成。（? 來源未找到，2026-10-22 稽核：此句「無加成」只對武器／護甲熟練度；Proficiencies 頁 `sources/parsed_wiki/Proficiencies.md:201` 說「bonus proficiency points on equipment, or through certain Hath Perks, allow players to exceed this cap」，與本句並存，原稿未標分歧。）
2. **5 項魔法熟練度（Magic Proficiencies）**：
   - `Elemental`（火/冰/雷/風）、`Divine`（光）、`Forbidden`（暗）、`Deprecating`（減益）、`Supportive`（增益與治療）。
   - **有效魔法熟練度（Effective Magic Proficiency）計算式**（驗算自 `hvUtils.js` L4594–4603）：
     $$\text{Effective\_Prof} = \min\!\left(2.0 \times \text{Level},\; \text{Base\_Prof} \times (1 + \text{Hath\_Prof\_Perk}) + \sum_{\text{staff/cloth}} \text{Scaled\_Equip\_Prof}\right)$$
     - `Base_Prof`：自然練滿上限為 `1.2 × Level`。
     - `Hath_Prof_Perk`：對應學派之 Hath Perk（`Eminent Elementalist` / `Divine Warmage` / `Death and Decay` / `Evil Enchantress` / `Force of Nature`）給予 **`+10%` 自然基礎熟練度**（即 $+0.10 \times \text{Base\_Prof}$）。
     - `Scaled_Equip_Prof`：法杖與布甲（Cotton / Gossamer / Phase）詞綴與鍛造縮放後的熟練度加總。
     - **硬上限**：有效魔法熟練度最高為玩家等級的 **2 倍（`2.0 × Level`）**。

#### (B) 魔法熟練度對抗性穿透、減傷削減、施法速度、MP 消耗與持續時間的精確公式（`✓`）
1. **熟練度係數（`prof_factor`，範圍 `[0, 1]`）**：
   $$\text{prof\_factor} = \text{clamp}\!\left(\frac{\text{Effective\_Prof} - \text{Monster\_Level}}{\text{Monster\_Level}},\; 0,\; 1\right)$$
   - 註（2026-10-22 稽核更正）：百科原文為 `prof_factor = (effective_proficiency - monsterlevel) / monsterlevel`（`sources/parsed_wiki/Proficiencies.md:160`；稽核報告另引 Damage 頁同寫法，但 `sources/parsed_wiki/Damage.md` 中找不到 prof_factor 字樣，故不採）。原稿曾把它簡化成 `Effective_Prof/Level − 1`，理由是「戰鬥中怪物等級等於玩家等級」，此為錯誤：Leveling Up 頁寫「The range on the level of the monsters that can be fought increases by 1」（`sources/parsed_wiki/Leveling_Up.md:15`），怪物等級是一個範圍；簡化式只是開源計算器的近似（`sources/hvUtils.js:3802` 以 `stats_pane[…] / _player.level - 1` 計算），不是遊戲機制。以怪物等級 = 玩家等級代入時才得 `Effective_Prof = 2 × Level` 對應 `prof_factor = 1.0`。
2. **抗性穿透加成（Counter-Resist Bonus，套用於 Elemental / Divine / Forbidden / Deprecating）**：
   $$\text{Prof\_Counter\_Resist} = 0.50 \times \text{prof\_factor} \quad (\text{最高 } +50\%)$$
   $$\text{Total\_Counter\_Resist} = \text{Prof\_Counter\_Resist} + \frac{\text{Staff\_Counter\_Resist} + \text{Penetrator\_Charm}}{100} + \text{Focus\_CR\_Bonus}$$
3. **怪物元素特化減傷削減（Elemental Mitigation Reduction，套用於攻擊法術）**：
   $$\text{Mit\_Reduction} = 0.50 \times \left(\text{prof\_factor}\right)^{1.5} \quad (\text{即最高削減 } 50 \text{ 點元素減傷 percentage points})$$
   - 驗算自 [Proficiencies](https://ehwiki.org/wiki/Proficiencies#Effects)（`Mitigation reduction = (prof_factor ^ 1.5) * 50`）與 `hvUtils.js` L4184（`Math.pow(prof_factor, 1.5) * 0.5`）。
4. **法術施法時間與 MP 消耗熟練度折減（Spell Speed & Cost Factor）**：
   - 根據 [Action Speed](https://ehwiki.org/wiki/Action_Speed#Action_Speed) 與 [Proficiencies](https://ehwiki.org/wiki/Proficiencies#Effects)，每招法術定義有解鎖所需最低熟練度 `req`（`Min Prof`）與滿加成熟練度 `cap`（`Max Prof`，見第四節法術總表）：
     $$\text{spell\_prof\_ratio} = \text{clamp}\!\left(\frac{\text{Effective\_Prof} - \text{req}}{\text{cap} - \text{req}},\; 0,\; 1\right)$$
     $$\text{prof\_speed\_mult} = 1 - 0.25 \times \text{spell\_prof\_ratio} \quad (\text{最高縮短 } 25\% \text{ 施法時間})$$
5. **持續性法術（Buff / Debuff / HoT / DoT）熟練度時間延長**：
   - 當 `Effective_Prof` 從 `req` 提升至 `cap` 時，法術與狀態的持續 ticks 倍率由 `1.0x` 線性提升至上限：
     - **Supportive / Curative 法術**：最高延長至基礎時間（含天賦）的 **`7x`**。
     - **Deprecating 與其他持續效果**：最高延長至基礎時間（含天賦）的 **`4x`**。
6. **Supportive 熟練度對 `Cure` 治療量的加成**：
   $$\text{Cure\_Prof\_Mult} = \min\!\left(1.50,\; \max\!\left(0.80 + 0.20 \times \frac{\text{Supportive\_Prof}}{\text{Level}},\; 1.00 + 0.50 \times \frac{\text{Supportive\_Prof} - \text{Level}}{\text{Level}}\right)\right)$$
   - 當 `Supportive_Prof = 0` 時為 `0.80x`；當 `Supportive_Prof = Level` 時為 `1.00x`；當 `Supportive_Prof >= 2 × Level` 時封頂為 `1.50x`（與 [Spells](https://ehwiki.org/wiki/Spells#Supportive_Spells) 及 `hvUtils.js` L4182 完全一致）。

#### (C) 熟練度經驗獲取率（Proficiency Gain Rate）已知機制與公開缺口（`?` / `✗`）
- **已知定性與結構規則**（[Proficiencies](https://ehwiki.org/wiki/Proficiencies#Gains)）：
  1. **武器熟練度**：每回合（Turn）自動獲取，即使玩家該回合未進行普攻。若用盾牌成功格擋（Block），額外提高 `1H` 熟練度獲取量。二天一流按 `50% 2H + 50% DW` 分配。
  2. **護甲熟練度**：每當玩家受到敵方攻擊（無論命中、閃避、格擋、招架、抵抗或怪物 Miss），系統以每槽位 **20% 機率**隨機挑選一個有穿戴護甲的部位判定熟練度提升。
  3. **魔法熟練度**：只要該波次（Round）內曾施放過該學派法術（無論命中或被抵抗），於波次結算時 **100% 獲得提升**；Innate Arcana 自動施放法術每波也可觸發一次提升。
  4. **與 EXP 連動及 `hvUtils.js` 實證近似模型**：
     - 百科記載：「熟練度獲取率取決於該場戰鬥獲得的總 EXP（含所有 EXP 倍率加成）以及玩家當前等級與當前熟練度的差距（差距越大長越快），並受 `Assimilator` 訓練每級 `+10%`（最高 Lv.25 = `3.5x`）加成。」
     - 在 `Trendymen/hentaiverse` (`hvUtils.js` L4054–4128) 的角色 EXP 模擬器中，作者 sssss2 使用與角色等級相同的累積指數曲線 $E(x) = \text{round}\!\left((x+3)^{2.850263212287058^{(1+x/1000)}}\right)$ 將當前熟練度 $P$ 映射為內部熟練度經驗 $E_{\text{prof}} = E(P)$，每次戰鬥獲得 $\Delta \text{EXP}$ 時累加：
       $$\Delta E_{\text{prof}} = \Delta \text{EXP} \times K_{\text{prof}} \times (1 + 0.10 \times \text{Assimilator\_Level}), \quad P_{\text{new}} = E^{-1}\!\left(E(P) + \Delta E_{\text{prof}}\right)$$
       （其中 `hvUtils.js` L4123 取常數 $K_{\text{prof}} = 4$）。由於指數曲線 $E(x)$ 在 $P < L$ 時斜率極緩、在 $P \to 1.2 L$ 時斜率陡增（2026-10-22 稽核更正：原稿稱 $L=250$ 時 $E(1.2 L)/E(L) \approx 4.2$，查 Level Table 實值為 $E(300)/E(250) = 4{,}830{,}567{,}101 / 794{,}019{,}252 \approx 6.08$，出處 `sources/parsed_wiki/Level_Table.md:505`、`:605`；另 $K_{\text{prof}}=4$ 出自升級模擬計算器的估算常數 `sources/hvUtils.js:4123`（`exp_gain * 4 * (1 + ass * 0.1)`），不是遊戲公式，百科只說明與 EXP 及等級差距相關（`sources/parsed_wiki/Missing_Data.md:91` 列「The base proficiency gain rate」為未知）），此反函數模型自然重現了「落後等級時飛速追趕、接近 $1.2 \times \text{Level}$ 時趨緩封頂」的全部定性特徵！
- **公開空白缺口**：各子類別（武器／護甲／各系法術／黎明跨日獎勵）在伺服器端的精確權重常數 $K_{\text{prof}}$ 未在百科公開（列為第六節缺口 #2）。

---

## 三、天賦樹（Abilities 全節點）與訓練（Training 全 15 項課程）

### 3.1 Ability Points (AP) 與 Mastery Points 槽位規則（`✓`）
- **出處**：[Abilities](https://ehwiki.org/wiki/Abilities)、`Trendymen/hentaiverse` (`hvUtils.js` L4765–4843)。
- **AP 總需求與上限**：點滿全遊戲 75 個天賦節點（2026-10-22 更正：原稿寫 76；逐行計數 `sources/parsed_wiki/Abilities.md` 為 79 行、扣除 Niten 重複後 75 個，與 005 常數表 002-04 一致）共需 **`1,278 AP`**（General `175` + 1H `16` + 2H `16` + DW `16` + Staff `16` + Cloth `52` + Light `50` + Heavy `67` + Deprecating `177` + Supportive `252` + Elemental `281` + Forbidden `80` + Divine `80`；註：2H 與 DW 表格內各有部分節點跨流派共用，百科分類頁頭總計列為 `1,278 AP`）。玩家最多可持有 `1,000 AP`（Lv.500 升級 `500 AP` + `Ability Boost` 訓練 `500 AP`）。
- **Mastery Slots（天賦插槽）解鎖成本表**：
  - **重要機制**：花費 AP 點亮的天賦**必須放入已解鎖的對應 Mastery Slot 中才會生效**！
  - 玩家起始擁有 `5` 個 Major Slots 與 `5` 個 Supportive Slots；升級每 10 級得 `1` 點 Mastery Point（Lv.500 共 `50` 點），`Manifest Destiny` 訓練最多得 `10` 點（非課金共 `60` 點；全槽位解鎖共需 `36 + 27 + 1 + 2 = 66` 點）：

| 插槽類別 (`Ability Slot Type`) | 總槽數 | 可裝備天賦類別 | 第 1–20 槽逐槽解鎖所需 Mastery Points | 總計 Mastery Points |
|---|---|---|---|---|
| **Major Ability** | 20 | General, Weapon (1H/2H/DW/Staff), Armor (Cloth/Light/Heavy), Offensive Spells (Elemental/Forbidden/Divine) | `#1–5`: `0`（初始解鎖）<br>`#6–9`: `1, 1, 1, 1`<br>`#10–14`: `2, 2, 2, 2, 2`<br>`#15–17`: `3, 3, 3`<br>`#18–19`: `4, 4`<br>`#20`: `5` | **36** |
| **Supportive Ability** | 20 | Supportive, Deprecating | `#1–5`: `0`（初始解鎖）<br>`#6–12`: `1, 1, 1, 1, 1, 1, 1`<br>`#13–17`: `2, 2, 2, 2, 2`<br>`#18–19`: `3, 3`<br>`#20`: `4` | **27** |
| **Protection Augment** | 1 | 4 種 Elemental Spike Shields（Lv.10 解鎖此槽，同時僅限裝備 1 種） | `#1`: `1` | **1** |
| **Drain Augment** | 1 | `Ether Theft` 或 `Spirit Theft`（Lv.150 解鎖此槽，同時僅限裝備 1 種） | `#1`: `2` | **2** |

- **天賦重置（Reset）規則**：
  - 每個 Persona 獨立計算重置次數（前 **10 次單一天賦重置**與**第 1 次全重置 Full Reset** 免費，消耗 `0` Soul Fragments）。
  - Lv.100 以下重置僅收基礎費用（單一天賦 `1` Soul Fragment、全重置 `45` Soul Fragments）；Lv.100 以上隨等級與重置次數遞增（單一天賦 Lv.10 滿層在 Lv.500 為 `8` Soul Fragments；全重置第 2–10 次在 Lv.389 實測為 `45, 85, 125, 165, 205, 244, 284, 324, 364` Soul Fragments）。

---

### 3.2 全天賦樹 75 個節點完整規格表（`✓`；2026-10-22 更正：原稿標題寫 76）
以下完整列出 [Abilities](https://ehwiki.org/wiki/Abilities) 與 `hvUtils.js` (`_ab.ability` L4766–4842) 雙重驗證之所有天賦節點的**解鎖等級序列**、**每層 AP 消耗序列**、**總 AP** 與**每層確切數值效果**：

#### (1) General（通用天賦，共 6 節點，總計 175 AP）

| 天賦名稱 | 最大層數 | 總 AP | 各層解鎖等級 (`Lv`) | 各層 AP 成本 (`AP`) | 各層確切數值效果（每層為覆蓋式總效果，非層間累加） |
|---|---|---|---|---|---|
| **HP Tank** | 10 | 36 | `0, 25, 50, 75, 100, 120, 150, 200, 250, 300` | `1, 2, 3, 3, 4, 4, 4, 5, 5, 5` | Max HP `+10% / +20% / +30% / +40% / +50% / +60% / +70% / +80% / +90% / +100%` |
| **MP Tank** | 10 | 36 | `0, 30, 60, 90, 120, 160, 210, 260, 310, 350` | `1, 2, 3, 3, 4, 4, 4, 5, 5, 5` | Max MP `+10% / +20% / +30% / +40% / +50% / +60% / +70% / +80% / +90% / +100%` |
| **SP Tank** | 10 | 36 | `0, 40, 80, 120, 170, 220, 270, 330, 390, 450` | `1, 2, 3, 3, 4, 4, 4, 5, 5, 5` | Max SP `+10% / +20% / +30% / +40% / +50% / +60% / +70% / +80% / +90% / +100%` |
| **Better Health Pots** | 5 | 15 | `0, 100, 200, 300, 400` | `1, 2, 3, 4, 5` | • `Health Draught / Elixir` 每 tick 回復：`3% / 3.5% / 4% / 4.5% / 5%` Base HP（無天賦為 `2%`）<br>• `Health Potion` 瞬間回復：`110% / 120% / 130% / 140% / 150%` Base HP（無天賦為 `100%`） |
| **Better Mana Pots** | 5 | 26 | `0, 80, 140, 220, 380` | `2, 3, 5, 7, 9` | • `Mana Draught / Elixir` 每 tick 回復：`1.1% / 1.2% / 1.3% / 1.4% / 1.5%` Base MP（無天賦為 `1%`）<br>• `Mana Potion` 瞬間回復：`55% / 60% / 65% / 70% / 75%` Base MP（無天賦為 `50%`） |
| **Better Spirit Pots** | 5 | 26 | `0, 90, 160, 240, 400` | `2, 3, 5, 7, 9` | • `Spirit Draught / Elixir` 每 tick 回復：`1.1% / 1.2% / 1.3% / 1.4% / 1.5%` Base SP（無天賦為 `1%`）<br>• `Spirit Potion` 瞬間回復：`55% / 60% / 65% / 70% / 75%` Base SP（無天賦為 `50%`） |

#### (2) Weapon Styles（四大武器流派天賦，共 12 節點；Niten 共用 2H 與 DW 節點）

| 流派 | 天賦名稱 | 最大層數 | 總 AP | 各層解鎖等級 (`Lv`) | 各層 AP (`AP`) | 每 **10 點**對應武器熟練度（Proficiency）提供之確切加成 |
|---|---|---|---|---|---|---|
| **1H** | **1H Damage** | 3 | 10 | `0, 100, 200` | `2, 3, 5` | `+20 / +30 / +40` Attack Base Damage（即每 1 點 1H Prof `+2 / +3 / +4` ADB） |
| **1H** | **1H Accuracy** | 2 | 3 | `50, 150` | `1, 2` | `+1 / +2` Attack Accuracy（即每 1 點 1H Prof `+0.1 / +0.2` Acc） |
| **1H** | **1H Block** | 1 | 3 | `250` | `3` | `+2.5` Block Chance（即每 1 點 1H Prof `+0.25%` Block） |
| **2H / Niten** | **2H Damage** | 3 | 10 | `0, 100, 200` | `2, 3, 5` | `+20 / +25 / +30` Attack Base Damage（即每 1 點 2H Prof `+2 / +2.5 / +3` ADB；對 2H 與 Niten 皆生效） |
| **2H** | **2H Accuracy** | 2 | 3 | `50, 150` | `1, 2` | `+1 / +2` Attack Accuracy 且額外給予 **`+0.002 / +0.004` Attack Damage Multiplier**（僅對純 2H 生效） |
| **2H / Niten** | **2H Parry** | 2 (或 1) | 5 (或 3) | `50, 200` (`hvUtils`: `250`) | `2, 3` (`hvUtils`: `3`) | `+2 / +3` Parry Chance 且同時 `+2 / +3` Block Chance（註：`Abilities` 頁列 2 層 5 AP，`Proficiencies` 頁列 `0.025%`、`hvUtils.js` L4778 列 Lv.250 單層 3 AP；見第六節分歧 #4） |
| **DW** | **DW Damage** | 3 | 10 | `0, 100, 200` | `2, 3, 5` | `+30 / +40 / +50` Attack Base Damage 且同時 `+1 / +1.5 / +2` Parry Chance（僅對純 DW 生效） |
| **DW / Niten** | **DW Accuracy** | 2 | 3 | `50, 150` | `1, 2` | `+1 / +2` Attack Accuracy（對 DW 與 Niten 皆生效） |
| **DW / Niten** | **DW Crit** | 1 | 3 | `250` | `3` | `+0.0025x` Attack Crit Damage Multiplier（即每 1 點 DW Prof `+0.025%` 暴擊傷害，對 DW 與 Niten 皆生效） |
| **Staff** | **Staff Spell Damage** | 3 | 10 | `0, 100, 200` | `2, 3, 5` | `+2 / +4 / +5` Magic Base Damage（即每 1 點 Staff Prof `+0.2 / +0.4 / +0.5` MDB） |
| **Staff** | **Staff Accuracy** | 3 (或 2) | 6 (或 3) | `50, 150, 300` (`hvUtils`: `50, 150`) | `1, 2, 3` (`hvUtils`: `1, 2`) | `+0.75 / +1.0 / +1.25` Attack Accuracy 與 `+0.75 / +1.0 / +1.25` Magic Accuracy |
| **Staff** | **Staff Damage** | 1 | 3 | `0` | `3` | `+30` Attack Base Damage（即每 1 點 Staff Prof `+3` ADB） |

#### (3) Armor Styles（三大護甲天賦，需穿戴 $\ge 3$ 件同類護甲，共 12 節點）

| 護甲類別 | 天賦名稱 | 最大層數 | 總 AP | 各層解鎖等級 (`Lv`) | 各層 AP (`AP`) | 每 **10 點**對應護甲熟練度（Proficiency）提供之確切加成 |
|---|---|---|---|---|---|---|
| **Cloth** | **Cloth Spellacc** | 3 (或 1) | 10 (或 5) | `0, 120, 240` (`hvUtils`: `120`) | `2, 3, 5` (`hvUtils`: `5`) | `+0.5 / +0.75 / +1.0` Magic Accuracy（`Proficiencies` 頁與 `hvUtils` 為單層 `+0.5` = `0.05%/pt`） |
| **Cloth** | **Cloth Spellcrit** | 5 | 18 | `0, 40, 90, 130, 190` | `1, 2, 3, 5, 7` | `+0.001x / +0.0015x / +0.0018x / +0.0021x / +0.0025x` Magic Crit Multiplier |
| **Cloth** | **Cloth Castspeed** | 2 | 7 | `150, 250` | `2, 5` | `+0.15% / +0.25%` Magic Cast Speed（每 1 點熟練度 `+0.015% / +0.025%`） |
| **Cloth** | **Cloth MP** | 7 | 22 | `0, 60, 110, 170, 230, 290, 350` | `1, 2, 3, 3, 4, 4, 5` | `+0.5% / +0.6% / +0.7% / +0.8% / +0.9% / +0.95% / +1.0%` Max MP |
| **Light** | **Light Acc** | 1 | 3 | `0` | `3` | `+0.5` Attack Accuracy（每 1 點熟練度 `+0.05`） |
| **Light** | **Light Crit** | 5 | 18 | `0, 40, 90, 130, 190` | `1, 2, 3, 5, 7` | `+0.001x / +0.0015x / +0.002x / +0.0023x / +0.0025x` Attack Crit Multiplier |
| **Light** | **Light Speed** | 2 | 7 | `150, 250` | `2, 5` | `+0.15% / +0.25%` Attack Speed（每 1 點熟練度 `+0.015% / +0.025%`） |
| **Light** | **Light HP/MP** | 7 | 22 | `0, 60, 110, 170, 230, 290, 350` | `1, 2, 3, 3, 4, 4, 5` | • Max HP：`+0.25% / +0.35% / +0.45% / +0.55% / +0.65% / +0.70% / +0.75%`<br>• Max MP：`+0.20% / +0.25% / +0.30% / +0.35% / +0.40% / +0.45% / +0.50%` |
| **Heavy** | **Heavy Crush** | 3 | 15 | `0, 75, 150` | `3, 5, 7` | `+0.2% / +0.4% / +0.5%` Crushing Mitigation |
| **Heavy** | **Heavy Prcg** | 3 | 15 | `0, 75, 150` | `3, 5, 7` | `+0.2% / +0.4% / +0.5%` Piercing Mitigation |
| **Heavy** | **Heavy Slsh** | 3 | 15 | `0, 75, 150` | `3, 5, 7` | `+0.2% / +0.4% / +0.5%` Slashing Mitigation |
| **Heavy** | **Heavy HP** | 7 | 22 | `0, 60, 110, 170, 230, 290, 350` | `1, 2, 3, 3, 4, 4, 5` | `+0.5% / +0.6% / +0.7% / +0.8% / +0.9% / +0.95% / +1.0%` Max HP |

#### (4) Deprecating（減益法術天賦，共 14 節點，總計 177 AP）

| 天賦名稱 | 層數 | 總 AP | 各層解鎖等級 (`Lv`) | 各層 AP (`AP`) | 各層對法術或狀態之確切修改值 |
|---|---|---|---|---|---|
| **Better Weaken** | 5 | 18 | `70, 100, 130, 190, 250` | `1, 2, 3, 5, 7` | `Weakened` 降傷幅度由 25% 升為 `30% / 35% / 40% / 45% / 50%`；基礎持續時間由 10 升為 `11 / 12 / 13 / 14 / 15` ticks |
| **Faster Weaken** | 3 | 15 | `80, 165, 250` | `3, 5, 7` | `Weaken` CD 由 3 降為 `2 / 1 / 0` turns；施法時間（Cast Time）改為 `0.7 / 0.65 / 0.6`；最大目標數改為 `1 / 2 / 3`；基礎 MP 消耗由 10 改為 `10 / 12 / 15` |
| **Better Imperil** | 5 | 15 | `130, 175, 230, 285, 330` | `1, 2, 3, 4, 5` | `Imperiled` 物理與魔法減傷扣減由 -25% 升為 `-30% / -35% / -40% / -45% / -50%`（乘算）；四元素（Fire/Cold/Elec/Wind）抗性扣減由 -10% 升為 `-20% / -25% / -30% / -35% / -40%`（加算）；基礎持續時間由 10 升為 `11 / 12 / 13 / 14 / 15` ticks |
| **Faster Imperil** | 3 | 15 | `140, 225, 310` | `3, 5, 7` | `Imperil` CD 由 3 降為 `2 / 1 / 0` turns；Cast Time 改為 `0.7 / 0.65 / 0.6`；最大目標數改為 `1 / 2 / 3`；基礎 MP 消耗由 10 改為 `10 / 12 / 15` |
| **Better Blind** | 5 | 15 | `110, 130, 160, 190, 220` | `1, 2, 3, 4, 5` | `Blinded` 物魔命中扣減由 -20% 升為 `-22% / -24% / -26% / -28% / -30%`；基礎持續時間由 10 升為 `11 / 12 / 13 / 14 / 15` ticks（同時加成 `Iris Strike` 附加之 Blind） |
| **Faster Blind** | 3 | 6 | `120, 215, 275` | `1, 2, 3` | `Blind` Cast Time 改為 `1.1 / 1.05 / 1.0`；CD 由 7 降為 `5 / 4 / 3` turns；最大目標數改為 `1 / 2 / 3`；基礎 MP 消耗由 18 改為 `18 / 22 / 25` |
| **Mind Control** | 3 | 9 | `80, 130, 170` | `1, 3, 5` | 同時修改 `Sleep` 與 `Confuse`：<br>• 受擊不醒機率（Break Resistance）：`50% / 75% / 80%`（無天賦時受擊有 90% 機率醒來，即 10% Break Resistance）<br>• `Asleep` 基礎持續時間：`6 / 6 / 7` ticks（無天賦 5）<br>• `Confused` 基礎持續時間：`11 / 12 / 12` ticks（無天賦 10）<br>• 最大目標數：`1 / 2 / 3`；基礎 MP 消耗：`22(25) / 30 / 35` |
| **Better Silence** | 3 | 15 | `120, 170, 215` | `3, 5, 7` | `Silence` CD 由 10 降為 `8 / 6 / 5` turns；最大目標數改為 `1 / 2 / 3`；`Silenced` 基礎持續時間由 10 升為 `11 / 12 / 13` ticks |
| **Better Immobilize** (`Better MagNet`) | 5 | 15 | `250, 295, 340, 370, 400` | `1, 2, 3, 4, 5` | • 新增減速效果：`-25%` Action Speed（全 5 層固定 -25%）<br>• 自然 Resist 扣減由 -25% 升為 `-30% / -35% / -40% / -45% / -50%`<br>• 基礎持續時間由 10 升為 `11 / 12 / 13 / 14 / 15` ticks<br>• CD 由 15 降為 `15 / 12 / 12 / 10 / 10` turns；最大目標數改為 `1 / 1 / 2 / 2 / 3` |
| **Better Slow** | 5 | 15 | `30, 50, 75, 105, 135` | `1, 2, 3, 4, 5` | `Slowed` 減速幅度由 -30% 升為 `-40% / -40% / -45% / -50% / -50%`；基礎持續時間由 10 升為 `11 / 12 / 13 / 14 / 15` ticks；最大目標數改為 `1 / 2 / 2 / 2 / 3`；基礎 MP 消耗由 18 改為 `18 / 21 / 21 / 21 / 25` |
| **Better Drain** | 3 | 10 | `20, 50, 90` | `2, 3, 5` | `Vital Theft` 吸血倍率乘上 `1.2x / 1.35x / 1.5x` |
| **Faster Drain** | 5 | 15 | `30, 70, 110, 150, 200` | `1, 2, 3, 4, 5` | `Drain` Cast Time 改為 `1.15 / 1.10 / 1.06 / 1.03 / 1.00`；CD 改為 `28 / 26 / 24 / 22 / 20` turns（2026-10-22 稽核更正：原稿寫「由 20（或 30）降為 28…」自相矛盾。Abilities 頁 Faster Drain 寫「Changes cooldown to 28 turns … 20 turns」，暗示基礎 CD ≥ 30，`sources/parsed_wiki/Abilities.md:15`；Spells 頁 Drain 列為 CD `20/15`，`sources/parsed_wiki/Spells.md:184`。兩頁互相矛盾，? 基礎 CD 以哪一頁為準待 Ticket 005 拍板） |
| **Ether Theft** | 1 | 5 | `150` | `5` | （佔用 `Drain Augment` 槽）對帶有 `Burning Soul` (`Soul Fire`) 的目標施放 `Drain` 時，100% 附加 5 ticks `Ether Theft`（每回合吸取 5% 目標當前 MP，上限 5% 玩家 Base MP） |
| **Spirit Theft** | 1 | 5 | `150` | `5` | （佔用 `Drain Augment` 槽）對帶有 `Ripened Soul` 的目標施放 `Drain` 時，100% 附加 5 ticks `Spirit Theft`（每回合吸取 5% 目標當前 SP，上限 5% 玩家 Base SP） |

#### (5) Supportive（增益與治療法術天賦，共 14 節點，總計 252 AP）

| 天賦名稱 | 層數 | 總 AP | 各層解鎖等級 (`Lv`) | 各層 AP (`AP`) | 各層對法術或狀態之確切修改值 |
|---|---|---|---|---|---|
| **Better Haste** | 5 | 15 | `60, 75, 90, 110, 130` | `1, 2, 3, 4, 5` | `Hastened` 行動加速由 +25% 升為 `+30% / +35% / +40% / +45% / +50%`；基礎持續時間由 10 升為 `12 / 14 / 16 / 18 / 20` ticks |
| **Better Shadow Veil** | 5 | 18 | `90, 105, 120, 135, 155` | `1, 2, 3, 5, 7` | `Shadow Veil` 自然閃避加成與「怪物揮空 (whiff at shadows)」機率由 10% 同步升為 `12% / 14% / 16% / 18% / 20%`；基礎持續時間由 10 升為 `12 / 14 / 16 / 18 / 20` ticks |
| **Better Absorb** | 3 | 6 | `40, 60, 80` | `1, 2, 3` | `Absorbing Ward` 吸收敵方法術機率由 60% 升為 `70% / 80% / 90%` |
| **Stronger Spirit** | 5 | 15 | `200, 220, 240, 265, 285` | `1, 2, 3, 4, 5` | `Spirit Shield` 觸發門檻（`SS_AP_Damage`）由單擊超過 45% Max HP 降為 **`40% / 35% / 30% / 25% / 20%`** Max HP（同時等比降低觸發時的 SP 消耗）；基礎持續時間由 15 升為 `18 / 21 / 24 / 27 / 30` ticks |
| **Better Heartseeker** | 7 | 28 | `140, 185, 225, 265, 305, 345, 385` | `1, 2, 3, 4, 5, 6, 7` | `Heartseeker` 物理暴擊傷害加成由 +0.25x 升為 `+0.28x / +0.31x / +0.34x / +0.36x / +0.38x / +0.39x / +0.40x`；基礎持續時間由 50 升為 `60 / 70 / 80 / 85 / 90 / 95 / 100` ticks |
| **Better Arcane Focus** | 7 | 28 | `175, 205, 245, 285, 325, 365, 405` | `1, 2, 3, 4, 5, 6, 7` | `Arcane Focus` 法術暴擊傷害加成由 +0.25x 升為 `+0.28x / +0.31x / +0.33x / +0.35x / +0.37x / +0.39x / +0.40x`；基礎持續時間由 50 升為 `60 / 70 / 80 / 85 / 90 / 95 / 100` ticks |
| **Better Regen** | 10 | 55 | `50, 70, 95, 145, 195, 245, 295, 375, 445, 500` | `1, 2, 3, 4, 5, 6, 7, 8, 9, 10` | • 每 tick 回復量：由無天賦 4%（或 5%）升為 `6% / 8% / 10% / 12% / 14% / 16% / 17% / 18% / 19% / 20%` Base HP<br>• 基礎持續時間：由 14 升為 `15 / 18 / 21 / 23 / 25 / 26 / 27 / 28 / 29 / 30` ticks<br>• 基礎 MP 消耗：由 22.5 升為 `30 / 35 / 40 / 45 / 50 / 55 / 60 / 65 / 70 / 75` |
| **Better Cure** | 3 | 10 | `1 (0), 35, 65` | `2, 3, 5` | `Cure` 基礎治療係數（`AP / 100`）由無天賦 `55%` 升為 **`70% / 85% / 100%`** Base HP；CD 由 5 降為 `4 / 3 / 2` turns |
| **Better Spark** | 3 | 10 | `100, 125, 150` | `2, 3, 5` | `Spark of Life` 基礎 MP 消耗由 44 降為 `40 / 35 / 30`；基礎持續時間由 15 升為 `20 / 25 / 30` ticks |
| **Better Protection** | 5 | 15 | `40, 55, 75, 95, 120` | `1, 2, 3, 4, 5` | `Protection` 物理與魔法減傷由 +25% 升為 `+26% / +27% / +28% / +29% / +30%`；基礎持續時間由 15 升為 `18 / 21 / 24 / 27 / 30` ticks |
| **Flame Spike Shield** | 5 | 13 | `10, 65, 140, 220, 300` | `3, 1, 2, 3, 4` | （佔用 `Protection Augment` 槽）`Protection` 期間格擋／招架觸發火焰反傷，且 Lv.2–5 額外給予 `+0% / +10% / +15% / +20% / +25%` Fire Mitigation |
| **Frost Spike Shield** | 5 | 13 | `10, 65, 140, 220, 300` | `3, 1, 2, 3, 4` | （佔用 `Protection Augment` 槽）同上，給予 Cold 反傷與 `+0% / +10% / +15% / +20% / +25%` Cold Mitigation |
| **Shock Spike Shield** | 5 | 13 | `10, 65, 140, 220, 300` | `3, 1, 2, 3, 4` | （佔用 `Protection Augment` 槽）同上，給予 Elec 反傷與 `+0% / +10% / +15% / +20% / +25%` Elec Mitigation |
| **Storm Spike Shield** | 5 | 13 | `10, 65, 140, 220, 300` | `3, 1, 2, 3, 4` | （佔用 `Protection Augment` 槽）同上，給予 Wind 反傷與 `+0% / +10% / +15% / +20% / +25%` Wind Mitigation |

#### (6) Elemental / Forbidden / Divine（三系攻擊法術天賦，共 17 節點，總計 281 + 80 + 80 = 441 AP）

| 學派 | 天賦名稱 | 層數 | 總 AP | 各層解鎖等級 (`Lv`) | 各層 AP (`AP`) | 各層對法術之確切修改值 |
|---|---|---|---|---|---|---|
| **Elemental** | **Conflagration** (Fire)<br>**Cryomancy** (Cold)<br>**Havoc** (Elec)<br>**Tempest** (Wind) | 各 7 | 各 48 | `50, 100, 150, 200, 250, 300, 400` | `3, 4, 5, 6, 8, 10, 12` | 提高對應元素 T1 / T2 / T3 法術的最大目標數（無天賦為 `3 / 5 / 7`）：<br>• Lv.1: T1=`4`<br>• Lv.2: T1=`4`, T2=`6`<br>• Lv.3: T1=`5`, T2=`6`<br>• Lv.4: T1=`5`, T2=`6`, T3=`8`<br>• Lv.5: T1=`5`, T2=`6`, T3=`9`<br>• Lv.6: T1=`5`, T2=`7`, T3=`9`<br>• Lv.7: T1=`5`, T2=`7`, T3=`10` |
| **Elemental** | **Sorcery** (四元素 T1) | 5 | 15 | `70, 140, 210, 280, 350` | `1, 2, 3, 4, 5` | 修改 `Fiery Blast / Freeze / Shockblast / Gale`：<br>• 基礎傷害係數（`Spell Modifier`）由 `4.0` 升為 **`4.10 / 4.15 / 4.20 / 4.23 / 4.25`**<br>• 施法時間（Cast Time）由 `1.20` 降為 **`1.15 / 1.10 / 1.06 / 1.03 / 1.00`** |
| **Elemental** | **Elementalism** (四元素 T2) | 5 | 26 | `85, 170, 255, 340, 425` | `2, 3, 5, 7, 9` | 修改 `Inferno / Blizzard / Chained Lightning / Downburst`：<br>• `Spell Modifier` 由 `5.50` 升為 **`5.63 / 5.71 / 5.78 / 5.82 / 5.85`**<br>• Cast Time 由 `1.40` 降為 **`1.35 / 1.30 / 1.26 / 1.23 / 1.20`**<br>• CD 由 `4` 降為 **`4 / 3 / 3 / 2 / 2`** turns |
| **Elemental** | **Archmage** (四元素 T3) | 5 | 48 | `90, 180, 270, 360, 450` | `5, 7, 9, 12, 15` | 修改 `Flames of Loki / Fimbulvetr / Wrath of Thor / Storms of Njord`：<br>• `Spell Modifier` 由 `7.00` 升為 **`7.15 / 7.25 / 7.35 / 7.42 / 7.50`**<br>• Cast Time 由 `1.60` 降為 **`1.55 / 1.50 / 1.46 / 1.43 / 1.40`**<br>• CD 由 `7` 降為 **`6 / 6 / 5 / 5 / 4`** turns |
| **Forbidden** | **Better Corruption** (Dark T1) | 2 | 8 | `75, 150` | `3, 5` | `Corruption` 最大目標數由 3 升為 **`4 / 5`** |
| **Forbidden** | **Better Disintegrate** (Dark T2) | 2 | 12 | `175, 250` | `5, 7` | `Disintegrate` 最大目標數由 5 升為 **`6 / 7`**；CD 由 4 降為 **`3 / 2`** turns |
| **Forbidden** | **Better Ragnarok** (Dark T3) | 3 | 28 | `250, 325, 400` | `7, 9, 12` | `Ragnarok` 最大目標數由 7 升為 **`8 / 9 / 10`**；CD 由 7 降為 **`6 / 5 / 4`** turns |
| **Forbidden** | **Ripened Soul** | 3 | 32 | `150, 300, 450` | `7, 10, 15` | 暗系法術命中時機率附加 7 ticks `Ripened Soul`（每 tick 無視抗性傷害 `MDB * (1 + Dark_EDB/100) * 0.2`）：<br>• `Corruption` 觸發率：**`4% / 7% / 10%`**<br>• `Disintegrate` 觸發率：**`10% / 20% / 25%`**<br>• `Ragnarok` 觸發率：**`20% / 40% / 50%`** |
| **Forbidden** | **Dark Imperil** | 5 | 26 | `175, 225, 275, 325, 375` | `2, 3, 5, 7, 9` | 使 `Imperil` 額外扣減目標 Dark Mitigation **`-5% / -10% / -15% / -20% / -25%`** |
| **Divine** | **Better Smite** (Holy T1) | 2 | 8 | `75, 150` | `3, 5` | `Smite` 最大目標數由 3 升為 **`4 / 5`** |
| **Divine** | **Better Banish** (Holy T2) | 2 | 12 | `175, 250` | `5, 7` | `Banishment` 最大目標數由 5 升為 **`6 / 7`**；CD 由 4 降為 **`3 / 2`** turns |
| **Divine** | **Better Paradise** (Holy T3) | 3 | 28 | `250, 325, 400` | `7, 9, 12` | `Paradise Lost` 最大目標數由 7 升為 **`8 / 9 / 10`**；CD 由 7 降為 **`6 / 5 / 4`** turns |
| **Divine** | **Soul Fire** | 3 | 32 | `150, 300, 450` | `7, 10, 15` | 光系法術命中時機率附加 7 ticks `Burning Soul`（每 tick 無視抗性傷害 `MDB * (1 + Holy_EDB/100) * 0.2`）：<br>• `Smite` 觸發率：**`4% / 7% / 10%`**<br>• `Banishment` 觸發率：**`10% / 20% / 25%`**<br>• `Paradise Lost` 觸發率：**`20% / 40% / 50%`** |
| **Divine** | **Holy Imperil** | 5 | 26 | `175, 225, 275, 325, 375` | `2, 3, 5, 7, 9` | 使 `Imperil` 額外扣減目標 Holy Mitigation **`-5% / -10% / -15% / -20% / -25%`** |

---

### 3.3 訓練系統（Training 全 15 項課程）完整公式與參數表（`✓`）
- **出處**：[Training](https://ehwiki.org/wiki/Training)、`dodying/UserJs` (`hvTrainer.user.js` L20–98)。
- **訓練費用通用公式**（當目前已訓練等級為 $N \in [0, 	ext{Max}-1]$，訓練第 $N+1$ 級之 Credits 費用）：
  $$	ext{Cost}(N) = 	ext{round}\!\left[\left(	ext{base\_cost} + 	ext{level\_cost} 	imes N
ight)^{(1 + 	ext{exponent} 	imes N)}
ight]$$
- （2026-10-22 稽核更正）上列公式因 LaTeX 反斜線被吃成控制字元而損壞（原稿出現「Night」等殘字）。來源原文為 `Cost = round[(base_cost + level_cost * N) ^ (1 + exponent * N)]`，N 為已訓練等級（`sources/parsed_wiki/Training.md:75`）。下表另有三處來源帶問號、原稿拿掉了：Assimilator 的 base/level cost 為 `50,000?`（`sources/parsed_wiki/Training.md:92`）；Dissociation 上限為 `level / 70?`（`sources/parsed_wiki/Training.md:69`）；Metabolism／Inspiration 效果為 `5%?`（`sources/parsed_wiki/Training.md:52,54`，本表已保留）。
- **全部 15 項訓練課程完整參數表**：

| 訓練課程名稱 | 內部 ID (`hvTrainer`) | 每級效果 | 單級耗時 | 最大級數與等級門檻 | `base_cost` | `level_cost` | `exponent` | 滿級總費用 (`Total Cost`) |
|---|---|---|---|---|---|---|---|---|
| **Adept Learner** | `50` | `+1%` EXP 加成（最高 `+300%`） | 1h | `300` | `100` | `50` | `0.000417446` | `5,126,661` |
| **Assimilator** | `51` | `+10%` 熟練度成長率（最高 `+250%` = `3.5x`） | 24h | `25` | `50,000?` | `50,000?` | `0.0057969565` | `65,074,505` |
| **Ability Boost** | `80` | `+1` Ability Point (AP) | 2h | `500`（上限 $\le 	ext{Level}$） | `100` | `100` | `0.0005548607` | `109,521,466` |
| **Manifest Destiny** | `81` | `+1` Mastery Point | 24h | `10`（上限 $\le \lfloor 	ext{Level}/50 
floor$） | `1,000,000` | `1,000,000` | `0` | `55,000,000` |
| **Scavenger** | `70` | `+1%` 基礎戰利品掉落率（最高 `+50%` 相對加成） | 4h | `50` | `500` | `500` | `0.0088310825` | `17,484,001` |
| **Luck of the Draw** | `71` | `+1%` 稀有裝備掉落率 | 8h | `25` | `2,000` | `2,000` | `0.0168750623` | `18,371,541` |
| **Quartermaster** | `72` | `+5%` 裝備掉落率 | 12h | `20` | `5,000` | `5,000` | `0.017883894` | `20,275,725` |
| **Archaeologist** | — | `+10%` Artifact 掉落率 | 24h | `10` | `25,000` | `25,000` | `0.030981982` | `19,268,647` |
| **Metabolism** | `84` | 減緩 Monster Lab 魔物飢餓消耗 `5%?` / 級 | 24h | `10` | `1,000,000` | `1,000,000` | `0` | `55,000,000` |
| **Inspiration** | `85` | 減緩 Monster Lab 魔物士氣消耗 `5%?` / 級 | 24h | `10` | `2,000,000` | `2,000,000` | `0` | `110,000,000` |
| **Scholar of War** | `90` | `+1` 戰鬥卷軸槽（起始 1，最高 6） | 0h | `5`（上限 $\le \lfloor 	ext{Level}/50 
floor$） | `30,000` | `10,000` | `0` | `250,000` |
| **Tincture** | `91` | `+1` 戰鬥魔藥 Infusion 槽（起始 1，最高 6） | 0h | `5`（上限 $\le \lfloor 	ext{Level}/50 
floor$） | `30,000` | `10,000` | `0` | `250,000` |
| **Pack Rat** | `98` | `+1` 戰鬥一般道具槽（起始 5，最高 15） | 0h | `10`（上限 $\le \lfloor 	ext{Level}/20 
floor$） | `10,000` | `10,000` | `0` | `540,000` |
| **Dissociation** | `88` | `+1` Persona 槽（起始 3，最高 10；? 等級上限 `Level/70` 在來源帶問號，2026-10-22 稽核） | 24h | `7`（上限 $\le \lfloor 	ext{Level}/70 
floor$，Lv.500 滿 7） | `1,000,000` | `1,000,000` | `0` | `28,000,000` |
| **Set Collector** | `96` | `+1` Equipment Set 裝備套裝槽（起始 3，最高 7） | 12h | `4` | `12,500` | `12,500` | `0` | `125,000` |

---

## 四、ATB 行動時間軸（Action Speed）、武器技能（Skills）、法術（Spells）與 Spirit / Overcharge

### 4.1 ATB 時鐘推進公式（Time Units vs Ticks vs Turns，`✓`）
- **出處**：[Action Speed](https://ehwiki.org/wiki/Action_Speed)、[Character Stats](https://ehwiki.org/wiki/Character_Stats)、[Burden](https://ehwiki.org/wiki/Burden)、[Interference](https://ehwiki.org/wiki/Interference)、`anon962/HvSim` (`classes/simulator.py` PriorityQueue 模型)。

#### (A) 三種時間單位的嚴格區分（`✓`）
1. **Turn（玩家操作回合）**：
   - 玩家每次點選動作（普攻、法術、技能、Defend、Focus、Spirit Stance 切換、Item 使用）即為 1 個 Turn。
   - **僅按 Turn 倒數的計數器**：
     - 所有法術與技能的 **Cooldown（冷卻回合）**：每次非道具的 Turn 結束時 `-1`；**使用戰鬥道具（Item）的 Turn 不減少法術／技能 CD**，但會減少其他道具的 40-turn CD。
     - `Defend` 與 `Focus` 的持續時間：固定持續 **2 Turns**（施放當 Turn 與下一 Turn）。
     - `Spirit Stance` 的每回合消耗（`1 SP + 10% OC`）與 `Innate Arcana` 自動施法每回合維持費（Upkeep）。
2. **Time Units（內部時間單位，簡稱 TU）**：
   - 除「使用道具（Using Items，消耗 `0 TU`）」外，玩家每次動作都會推進內部時鐘 $\Delta \text{TU} \in [20, 500]$：
     $$\text{Action\_Speed} = \frac{100}{(1 - \text{Sheet\_Speed}) \times \text{Specific\_Action\_Speed} \times \text{Prof\_Speed\_Mult}} \times (1 + \text{Haste\_Bonus})$$
     $$\Delta \text{TU} = \left\lceil \text{clamp}\!\left(20,\; \frac{10000}{\text{Action\_Speed}},\; 500\right) \right\rceil = \text{clamp}\!\left(20,\; \left\lceil \frac{100 \times (1 - \text{Sheet\_Speed}) \times \text{Specific\_Action\_Speed} \times \text{Prof\_Speed\_Mult}}{1 + \text{Haste\_Bonus}} \right\rceil,\; 500\right)$$
   - 其中：
     - `Sheet_Speed`：物理動作使用面板 `Attack Speed`（小數），法術動作使用面板 `Cast Speed`（小數）。
     - `Specific_Action_Speed`：該動作的基礎耗時倍率（見下表，數值越大代表動作越慢、消耗越多 TU）。
     - `Prof_Speed_Mult`：物理動作為 `1.0`；法術動作為 $1 - 0.25 \times \text{clamp}\!\left(\frac{\text{Effective\_Prof} - \text{req}}{\text{cap} - \text{req}}, 0, 1\right) \in [0.75, 1.0]$。
     - `Haste_Bonus`：無 Haste 為 `0`；`Haste` 法術為 `0.25`（隨 `Better Haste` Lv.1–5 為 `0.30 / 0.35 / 0.40 / 0.45 / 0.50`）；`Scroll of Swiftness` / `Scroll of the Avatar` 為 `0.60`。
3. **Tick（1 Tick = 100 Time Units）**：
   - 玩家累積的總 Time Units 每跨越一個 `100 TU` 整數倍邊界（即 `floor(new_TU / 100) - floor(old_TU / 100)` 次），即觸發一次 **Tick 事件**：
     - 所有 Buff、Debuff、Scroll、Infusion、Draught/Elixir、Weapon/Spell Proc 的持續時間計數器 `-1`。
     - 觸發玩家每 Tick 自然回復（`MP_Regen_per_tick`、`SP_Regen_per_tick`）、`Regen` 法術回血、Draught/Elixir 回血回魔回靈、`Energized` 回 SP/OC。
     - 觸發怪物身上依 Tick 結算的 DoT（如 `Bleeding Wound`、`Spreading Poison`、`Burning Soul`、`Ripened Soul`）。

#### (B) 面板 Attack Speed / Cast Speed 與 Burden / Interference 換算式（`✓` / `?`）
1. **面板 Attack Speed（乘算層疊）**：
   $$\text{AGI\_Speed} = \min\!\left(0.10,\; \max\!\left(0,\; \frac{\text{AGI} - \text{Level}}{\text{Level}}\right) \times 0.10\right)$$
   $$\text{Raw\_Attack\_Speed} = 1 - (1 - \text{AGI\_Speed}) \times (1 - \text{Light\_Speed\_Ability}) \times \prod_{\text{equip}} \left(1 - \frac{\text{Equip\_ASpd}}{100}\right)$$
   - `Light_Speed_Ability`：穿戴 $\ge 3$ 件輕甲且裝備 `Light Speed` 天賦（Lv.1/2）時為 `(0.00015 / 0.00025) × Light_Prof`。
   - **Burden 對 Attack Speed Bonus 的折減関数 $f(\text{Burden})$**：
     - `Burden <= 40` 時無懲罰（$f(\text{Burden}) = 1.0$）；當 `Burden > 40` 時線性削減玩家的 Attack Speed 加成，直至完全歸零（註：[Burden](https://ehwiki.org/wiki/Burden) 頁記載於 `Burden = 90` 歸零，[Action Speed](https://ehwiki.org/wiki/Action_Speed) 頁記載於 `Burden = 130` 歸零，見第六節分歧 #5）：
       $$f(\text{Burden}) = 1 - \text{clamp}\!\left(\frac{\text{Burden} - 40}{\text{Burden}_{\text{cap}} - 40},\; 0,\; 1\right), \quad \text{Burden}_{\text{cap}} \in \{90, 130\}$$
   - （? 來源未找到，2026-10-22 稽核：上列 `f(Burden)` 的線性定式是推定；Character Stats 頁明寫 f() 「still needs to be discovered」（`sources/parsed_wiki/Character_Stats.md:15`），原稿未揭露。90 vs 130 兩個歸零門檻的矛盾屬實：Burden 頁「fully eliminates any bonus at 90 burden」`sources/parsed_wiki/Burden.md:21`，Action Speed 頁「completely removing them at 130 burden」`sources/parsed_wiki/Action_Speed.md:15`。）
2. **面板 Cast Speed（加算）**：
   $$\text{Sheet\_Cast\_Speed} = \frac{\sum \text{Equip\_Cast\_Speed} + \text{Spellweaver\_Charm}}{100} + \text{Cloth\_Castspeed\_Ability}$$
   - `Cloth_Castspeed_Ability`：穿戴 $\ge 3$ 件布甲且裝備 `Cloth Castspeed` 天賦（Lv.1/2）時為 `(0.00015 / 0.00025) × Cloth_Prof`。
3. **Interference 對法術 MP 消耗的懲罰**：
   - 每 `1` 點總 Interference 增加 **`+0.5%` 法術 MP 消耗**（$\text{Interference\_Mult} = 1 + 0.005 \times \text{Interference}$）。

#### (C) 各動作基礎耗時倍率（`Specific_Action_Speed`）與怪物 ATB 規則（`✓` / `?`）
- **玩家各動作 `Specific_Action_Speed` 總表**（取自 [Action Speed](https://ehwiki.org/wiki/Action_Speed#Base_Action_Speeds) 與 [Abilities](https://ehwiki.org/wiki/Abilities) 天賦修正）：
- （2026-10-22 稽核更正，本節原標 `✓` 不成立）Action Speed 頁 Base Action Speeds 表中，所有法術動作值都帶 `?`（Elemental T1 `1.2?`、T2 `1.4?`、T3 `1.6?`；Divine/Forbidden `1.4?/1.6?/1.8?`；Drain `1.2?`；Slow/Sleep/Immobilize `1.5?`；Weaken/Imperil `0.8?`；Blind `1.2?`；Cure, Regen `0.2?`；Supportive `0.1?`；Protection `0.2?`），Fighting Skills 為 `1?`；Spirit Stance 與 Fleeing 只寫 `<1`；表上沒有 Silence、Confuse、Full-Cure（出處：`sources/ehwiki_pages/Action_Speed.html:190-285` Base Action Speeds 表（Fleeing 在 :219、Protection 在 :283-284）；parsed 版 `sources/parsed_wiki/Action_Speed.md` 未保留此表）。下表數值保留作暫用，但整表一律視為 `?`，原稿拿掉問號是錯的；「Flee 約 1 tick 延遲」與 Full-Cure `0.2` 為原稿自填（? 來源未找到，2026-10-22 稽核）。Missing Data 頁亦列「The base action speeds for some things」為未知（`sources/parsed_wiki/Missing_Data.md:89`）。

| 動作分類 | 具體動作／法術名稱 | 基礎 `Specific_Action_Speed` | 天賦點滿後之 `Specific_Action_Speed` | 備註 |
|---|---|---|---|---|
| **物理與武器技能** | 普攻 (`Physical Attack` / `Arcane Blow`) | `1.0` | `1.0` | 基準 100 TU（無加速時） |
| **物理與武器技能** | 武器與特技 (`Fighting Skills`) | `1.0?` | `1.0` | 含 1H/2H/DW/Niten/Staff 技能與 OFC/FRD |
| **基礎指令** | 使用道具 (`Using items`) | `0` (`n/a`) | `0` | **Free Action**：不增加 TU、怪不行動、不減技能 CD |
| **基礎指令** | 切換靈魂姿態 (`Toggling Spirit Stance`) | `< 1`（或 `0`） | `< 1` | 開啟當回合不觸發自然回復 |
| **基礎指令** | `Defend`, `Scan`, `Focus` | `1.0` | `1.0` | 消耗正常回合時間 |
| **基礎指令** | 逃跑 (`Flee`) | `< 1`（原稿「約 1 tick 延遲」? 來源未找到，2026-10-22 稽核；來源只寫 `<1`） | `0`（有 `Yakety Sax` Perk 時瞬間逃離） | 無 Perk 時怪可追擊 1–2 次 |
| **攻擊法術** | 四元素 T1 (`Fiery Blast`, `Freeze`, `Shockblast`, `Gale`) | `1.2?` | `1.15 / 1.10 / 1.06 / 1.03 / 1.00` (`Sorcery` Lv.1–5) | |
| **攻擊法術** | 四元素 T2 (`Inferno`, `Blizzard`, `Chained Lightning`, `Downburst`) | `1.4?` | `1.35 / 1.30 / 1.26 / 1.23 / 1.20` (`Elementalism` Lv.1–5) | |
| **攻擊法術** | 四元素 T3 (`Flames of Loki`, `Fimbulvetr`, `Wrath of Thor`, `Storms of Njord`) | `1.6?` | `1.55 / 1.50 / 1.46 / 1.43 / 1.40` (`Archmage` Lv.1–5) | |
| **攻擊法術** | 光／暗 T1 (`Smite`, `Corruption`) | `1.4?` | `1.4?`（無減詠唱天賦） | |
| **攻擊法術** | 光／暗 T2 (`Banishment`, `Disintegrate`) | `1.6?` | `1.6?`（無減詠唱天賦） | |
| **攻擊法術** | 光／暗 T3 (`Paradise Lost`, `Ragnarok`) | `1.8?` | `1.8?`（無減詠唱天賦） | |
| **減益法術** | `Drain` | `1.2?` | `1.15 / 1.10 / 1.06 / 1.03 / 1.00` (`Faster Drain` Lv.1–5) | |
| **減益法術** | `Weaken`, `Imperil` | `0.8?` | `0.70 / 0.65 / 0.60` (`Faster Weaken / Imperil` Lv.1–3) | |
| **減益法術** | `Blind` | `1.2?` | `1.10 / 1.05 / 1.00` (`Faster Blind` Lv.1–3) | |
| **減益法術** | `Slow`, `Sleep`, `Immobilize` (`MagNet`) | `1.5?` | `1.5?` | |
| **減益法術** | `Silence`, `Confuse` | `1.2?`–`1.5?`（表上無 Silence／Confuse 這兩列，為原稿類比自填，? 來源未找到，2026-10-22 稽核） | `1.2?`–`1.5?` | 見第六節缺口 #6 |
| **治療法術** | `Cure`, `Regen`, `Full-Cure` | `0.2?`（來源只列 Cure, Regen；Full-Cure 為原稿自填，? 來源未找到，2026-10-22 稽核） | `0.2?` | 極快施法（基礎 20 TU） |
| **增益法術** | `Protection` | `0.2?` | `0.2?` | |
| **增益法術** | `Haste`, `Shadow Veil`, `Absorb`, `Spark of Life`, `Arcane Focus`, `Heartseeker`, `Spirit Shield` | `0.1?` | `0.1?` | 觸發最低下限 20 TU |

- **怪物 ATB 時鐘與行動規則**（[Action Speed](https://ehwiki.org/wiki/Action_Speed#Monster_Action_Speed)、`anon962/HvSim`）：
  1. **初始 Initiative**：每波戰鬥開始時，玩家固定在 `TU = 0` 先手行動；每隻怪物在開局獲得 **`10–100 TU` 的隨機初始行動時間**（因此開局玩家未推進 TU 前，怪物絕不會先手攻擊）。
  2. **怪物行動間隔**：基礎為 `100 TU`，受下列修正：
     - **加速**：`PFUDOR` 難度 `+25%`、Custom Monster `Swiftness` 混沌升級（每級 `+2.5%`，最高 Lv.20 = `+50%`）、三女神 `Wails of the Present` Buff。
     - **減速**：`Slow` 法術（`-30%`，點滿 `Better Slow` 為 `-50%`）、`Immobilize`（有 `Better Immobilize` 天賦時 `-25%`）、Cold 特效 `Freezing Limbs`（`-10%`）。
  3. **眩暈甦醒免費行動（Post-Stun Free Action）**：怪物從 `Stunned` 狀態恢復的下一回合，無論玩家該回合 Action Speed 多快，都會立即獲得一次免費行動（Free Action）。

---

### 4.2 全武器主動技能、先天技能與特殊 OC 技完整規格表（`✓`）
- **出處**：[Skills](https://ehwiki.org/wiki/Skills)、`Trendymen/hentaiverse` (`autobattle/docs/battle-mechanics.md`, `tables.ts`)、`dodying/UserJs` (`hvAutoAttack.user.js` L3757–3819)。
- （2026-10-22 稽核補註）本節原標 `✓` 並把下表「傷害倍率」當定值；但 Missing Data 頁明列「Damage multipliers for all offensive skills」為未知（`sources/parsed_wiki/Missing_Data.md:83`），Skills 頁的倍率表（如 `x4`、`x20`、`x10`，`sources/parsed_wiki/Skills.md:101,123`）應視為 `?`。「Focus 是否仍影響 Resist 機率」同樣列為未知（`sources/parsed_wiki/Missing_Data.md:85`），下列 Focus 的 Resist 相關敘述與 5.1(A) Step 6 的 Focus 條目一併視為 `?`。
- **共通核心規則**：
  1. **必中／不可閃避招架**：所有武器主動技能與特殊 OC 技能**不可被怪物 Evade 或 Parry**（`They cannot be parried or evaded`）。
  2. **Spirit Stance 優先扣費**：若在開啟 Spirit Stance 狀態下施放耗費 $C$ 點 OC 的技能，系統會**先扣除該回合 Spirit Stance 的 `10% OC` 維持費**，故玩家實際需要至少 **`C + 10%` OC** 才能成功施放，否則顯示 `Insufficient overcharge to use <Skill>.` 並浪費該回合。
  3. **基礎技能傷害公式**：
     $$\text{Skill\_Base\_Damage} = \text{ADB}_{\text{main}} \times \text{Skill\_Multiplier}$$
     （例外：`Concussive Strike` 使用魔法傷害 $\text{MDB} \times 6$）。

| 分類 / 流派 | 技能名稱 | 內部 ID | 消耗 (OC%) | 冷卻 (Turns) | 解鎖條件（等級 & 熟練度） | 目標數 | 傷害倍率 (`Skill_Mult`) | 傷害屬性與附加狀態／特殊機制 |
|---|---|---|---|---|---|---|---|---|
| **Innate** | **Defend** | `#ckey_defend` | `0`（若有 $\ge 25\%$ OC 則消耗 `25% OC`） | `0` | 初始解鎖 | 自身 | — | • 持續 **2 Turns**（本回合＋下回合），物理與魔法 Mitigation 獨立乘算 **`+25%`**。<br>• 若施放時 $\text{OC} \ge 25\%$，消耗 1 格（`25% OC`）瞬間回復 **`25%` Base HP**（`sources/parsed_wiki/Skills.md:31`，2026-09-29 較新頁；舊 Battles 頁寫 10%，見第六節分歧 #7；2026-10-22 依 005 常數表定案）。 |
| **Innate** | **Focus** | `#ckey_focus` | `0`（若有 $\ge 25\%$ OC 則消耗 `25% OC`） | `0` | 初始解鎖 | 自身 | — | • 持續 **2 Turns**：本回合自身 Evade/Block/Parry/Resist 降為 `0%`（`-100%` 懲罰）；**下一回合** Magic Accuracy 翻倍（`2x`），且對抗怪物 Resist 檢定時再翻倍並 `+100`（或 `+50%` Counter-Resist）。<br>• 若施放時 $\text{OC} \ge 25\%$，消耗 `25% OC` 瞬間回復 **`5% Base MP`**。 |
| **Innate** | **Scan** | `1001` | `0` | `0` | 初始解鎖 | 單體 | — | 顯示目標怪物之 HP/MP/SP、種族、PL、擁有者、普攻屬性、Accuracy、Evade/Parry/Resist 及九系減傷百分比。 |
| **Innate** | **Flee** | `1011` | `0` | `0` | 初始解鎖 | 自身 | — | 脫離當前戰鬥（耗時約 1 tick，期間怪可攻擊；若有 `Yakety Sax` Perk 則 0 時延必成功）。（? 來源未找到，2026-10-22 稽核：「約 1 tick」無出處，Action Speed 表只寫 Fleeing `<1`。） |
| **1H T1** | **Shield Bash** | `2201` | `25` (1 格) | `10` | Lv.1, `1H_Prof >= 0` | 單體 | **`x4`** | • **不需裝備盾牌**即可施放。<br>• 造成 `Crushing` 物理傷害，並附加 **5 ticks `Stunned`**（不可覆蓋既有 Stun）。 |
| **1H T2** | **Vital Strike** | `2202` | `50` (2 格) | `10` | Lv.50, `1H_Prof >= 50` | 單體 | 一般 **`x4`**<br>對暈眩目標 **`x20`** | • 依主手武器屬性。<br>• 若目標正處於 `Stunned`，傷害倍率躍升為 **`x20`**，且直接附加 **5 層（100 點，或對既有流血 +90 點）`Bleeding Wound`**（`DOT% = 50%`，持續 5 ticks）。（? 來源未找到，2026-10-22 稽核：Skills 頁寫「adds 90 stacks of Bleeding Wound to an existing bleed or inflicts 100 stacks」`sources/parsed_wiki/Skills.md:59`，Equipment Procs 頁寫流血「5 stacks at maximum」且「50% for Vital Strike, 20% for Skyward Sword」`sources/parsed_wiki/Equipment_Procs.md:12`；兩頁層數單位對不上（100 vs 5），原稿自行換算成「5 層」無出處，「持續 5 ticks」在來源中找不到。） |
| **1H T3** | **Merciful Blow** | `2203` | `100` (4 格) | `10` | Lv.100, `1H_Prof >= 100` | 單體 | **`x10`**（斬殺時即死） | • 若目標同時帶有 `Bleeding Wound` **且當前 $\text{HP} < 25\%$**，直接觸發 **Instant Kill（即死處決，`is eviscerated`）**！否則造成 `x10` 物理傷害。 |
| **2H T1** | **Great Cleave** | `2101` | `50` (2 格) | `5` | Lv.1, `2H_Prof >= 0` | 單體（可觸發 Domino） | **`x10`** | • **必定暴擊（Always Crits）**！ |
| **2H T2** | **Rending Blow** | `2102` | `50` (2 格) | `5` | Lv.50, `2H_Prof >= 50` | 最多 **5 體** | **`x4`** | • **技能本身傷害無視怪物 Physical Mitigation**。<br>• 對命中之最多 5 個目標直接疊滿 **3 層 `Penetrated Armor`**（降低 75% 物理減傷）。 |
| **2H T3** | **Shatter Strike** | `2103` | `50` (2 格) | `5` | Lv.100, `2H_Prof >= 100` | 最多 **5 體** | **`x3`** | • 對帶有 `Penetrated Armor` 的目標（最多 5 體）附加 **5 ticks `Stunned`**（不可覆蓋既有 Stun）。 |
| **DW T1** | **Iris Strike** | `2301` | `50` (2 格) | `5` | Lv.1, `DW_Prof >= 0` | 單體 | **`x6`** (主手 ADB) | • 附加 **20 ticks `Blinded`**（受 `Better Blind` 天賦強化）。 |
| **DW T2** | **Backstab** | `2302` | `50` (2 格) | `5` | Lv.50, `DW_Prof >= 50` | 單體 | 一般 **`x10`**<br>對致盲目標 **`x20`** | • 對處於 `Blinded` 的目標造成雙倍傷害（`x20` 主手 ADB），並有 **`~50%` 機率**附加 **20 ticks `Spreading Poison`**（Evade 歸零、減傷 -10%、每 tick 固定真實傷害）。 |
| **DW T3** | **Frenzied Blows** | `2303` | `75` (3 格) | `10` | Lv.100, `DW_Prof >= 100` | 最多 **5 體** | 每擊 **`x3`** (主手 ADB) | • 對最多 $N \le 5$ 個目標進行總計 `10–21` 次連擊；面對 $N$ 個目標時，每個目標被命中次數介於 $\lceil 10/N \rceil$ 至 $\lceil 20/N \rceil$ 次之間。 |
| **Niten** | **Skyward Sword** | `2401` (或 `2403`) | `100` (4 格) | `10` | Lv.1, $\min(\text{2H},\text{DW}) \ge 0$ | 最多 **5 體** | **`x4`** (主手 ADB) | • **技能本身傷害無視怪物 Physical Mitigation**。<br>• 對最多 5 個目標同時附加 **3 層 `Penetrated Armor`** 與 **5 層（`DOT% = 20%`）`Bleeding Wound`**。（? 來源未找到，2026-10-22 稽核：同 Vital Strike，來源為「adds 90 stacks … or inflicts 100 stacks」`sources/parsed_wiki/Skills.md:77`，「5 層」為原稿換算；`DOT% = 20%` 見 `sources/parsed_wiki/Equipment_Procs.md:12`。） |
| **Staff** | **Concussive Strike** | `2501` | `50` (2 格) | `10` | Lv.1, `Staff_Prof >= 0` | 單體 | **`x6`** (魔法傷害) | • 造成魔法傷害（不受物理減傷影響），附加 **5 ticks `Stunned`**，且可觸發 `Coalesced Mana`。 |
| **Special** | **Orbital Friendship Cannon (OFC)** | `1111` | `200` (8 格) | `50` | 背包持有 $\ge 21$ 種不同小馬雕像（Collectables）後跨日解鎖 | **全體 (All)** | **`x20`**（有 `Manehattan Project` Perk 時大幅提升） | • 對全場所有敵人造成 **Void（虛空）傷害**（無視九系 Specific Mitigation）。 |
| **Special** | **FUS RO DAH** | `1101` | `100` (4 格) | `10` | 解鎖並裝備 `Dovahkiin` (Lv.300) 或 `Ponyslayer` (Lv.500) 稱號 | **全體 (All)** | **`x4`** | • 對全場所有敵人造成 **Void 傷害**，並附加 **5 ticks `Stunned`**（不可覆蓋既有 Stun）。 |

---

### 4.3 全法術（攻擊 18 招、減益 9 招、治療 3 招、增益 7 招）完整參數表（`✓`）
- **出處**：[Spells](https://ehwiki.org/wiki/Spells)、[Spell Damage](https://ehwiki.org/wiki/Spell_Damage)、`Trendymen/hentaiverse` (`tables.ts`)、`dodying/UserJs` (`hvAutoAttack.user.js` L3860–4000)。

- （2026-10-22 稽核更正）Spells 頁的法術表有多處數值帶 `?`，原稿拿掉了；本節下列表格已補回（Inferno Min Prof `50?`、Chained Lightning 解鎖 `115?`／Min Prof `50?`、Downburst 解鎖 `125?`、Banishment／Disintegrate 解鎖 `100?`、Paradise Lost 解鎖 `200?`、Drain 解鎖 `30?`／Max Prof `300?`／Duration `7?`、Slow `10?`／`300?`、Blind `80?`、Immobilize `250?`／`100?`、Regen `50?`、Protection `10?`／`15?`、Haste `60?`／`10?`、Shadow Veil Duration `10?`、Absorb `50?`／`385+?`、Spark of Life `750?`／`44?`／`15?`、Arcane Focus `980?`／`50?`、Heartseeker `880?`／`50?`、Spirit Shield `950?`／`15?`），出處 `sources/parsed_wiki/Spells.md:133,149,157,165,167,173,184,186,196,200,210,216,218,220,222,224,228,230,232`。另 Spells 頁自己有矛盾：文字例子說 Fiery Blast 基礎 cost 為 5（`sources/parsed_wiki/Spells.md:71`），同頁表格寫 6（`sources/parsed_wiki/Spells.md:131`），原稿只採 6。
#### (A) 法術 MP 消耗與 Innate Arcana 維持費公式（`✓`）
1. **手動施法 MP 消耗公式**：
   $$\text{Spell\_MP\_Cost} = \begin{cases} 1, & \text{Channeling 觸發中} \\ \left\lceil \left(\frac{\text{Level} \times \text{Base\_Cost}}{100}\right) \times (1 + 0.005 \times \text{Interference}) \times (1 - \text{Mana\_Conservation}) \times (1 - \text{Spirit\_Stance\_Disc}) \times (1 - \text{Coalesced\_Disc}) \right\rceil, & \text{一般情況} \end{cases}$$
   - `Spirit_Stance_Disc`：開啟 Spirit Stance 時為 `0.25`，否則 `0`。
   - `Coalesced_Disc`：對帶有 `Coalesced Mana` 的目標施放攻擊／減益法術時為 `0.50`，否則 `0`。
   - `Mana_Conservation`：裝備與 `Economizer Charm` 以 `multi: true`（$1 - \prod(1 - v_i/100)$）疊算。
2. **Innate Arcana（Auto-Cast 自動施法槽）每回合 Upkeep 公式**（[HentaiVerse Settings](https://ehwiki.org/wiki/HentaiVerse_Settings#Auto-cast_Slots)）：
   - 可放入之 5 招增益法術：`Haste`, `Shadow Veil`, `Protection`, `Spark of Life`, `Spirit Shield`（槽位初始即解鎖，不需買 Perk 即可使用；購買 `Innate Arcana I–V` Hath Perks 提供 `10% / 20% / 30% / 40% / 50%` 維持費折扣）。
   - 每回合扣除之 MP 維持費：
     $$\text{Upkeep\_MP} = \frac{\text{Spell\_MP\_Cost} \times \text{Last\_Turn\_Action\_Speed\_Ratio}}{\text{Effective\_Duration}} \times (1 - 0.10 \times \text{IA\_Perk\_Rank})$$
   - **MP 熔斷機制**：當玩家當前 $\text{MP} < 10\% \times \text{Max\_MP}$ 時，所有 Auto-Cast 法術立即消散；待 $\text{MP} \ge 25\% \times \text{Max\_MP}$ 時自動重上（若在 `10%–24%` MP 期間 `Spark of Life` 被觸發消耗，在回到 `25%` MP 前不會自動重上）。

#### (B) 攻擊法術（Offensive Spells，六系三階共 18 招）完整表（`✓`）
- **重要保底命中規則**（[Spells](https://ehwiki.org/wiki/Spells#Offensive_Spells)）：
  - **Tier 1 法術**：正常判定 Evade（可能 Miss / Evaded）。
  - **Tier 2 法術**：**保底至少擦傷（Always at least Glance）**——即使怪物通過兩次 Evade 檢定也不會完全閃避（最少 `0.5x`）。
  - **Tier 3 法術**：**保底必定命中（Always at least Hit）**——完全無視怪物 Evade 檢定（不會 Miss 也不會 Glance，直接進 Resist 與 Crit 檢定）！

| 學派 / 元素 | 階級 | 法術名稱 | 內部 ID | 解鎖等級 | `Min / Max Prof` (`req / cap`) | 基礎 `Cost` | 基礎 / 滿天賦 `CD` | 基礎 / 滿天賦 `Targets` | 基礎 / 滿天賦 `Spell Modifier` | 命中觸發元素異常機率 |
|---|---|---|---|---|---|---|---|---|---|---|
| **Elemental (Fire)** | T1 | **Fiery Blast** | `111` | 15 | `0 / 200` | `6` | `0` | `3 / 5` | `4.0` → `4.1 / 4.15 / 4.2 / 4.23 / 4.25` | `25%` (`Searing Skin`) |
| **Elemental (Fire)** | T2 | **Inferno** | `112` | 95 | `50? / 500` | `14` | `4 / 2` | `5 / 7` | `5.5` → `5.63 / 5.71 / 5.78 / 5.82 / 5.85` | `50%` (`Searing Skin`) |
| **Elemental (Fire)** | T3 | **Flames of Loki** | `113` | 175 | `150 / 800` | `21` | `7 / 4` | `7 / 10` | `7.0` → `7.15 / 7.25 / 7.35 / 7.42 / 7.50` | `75%` (`Searing Skin`) |
| **Elemental (Cold)** | T1 | **Freeze** | `121` | 25 | `0 / 200` | `6` | `0` | `3 / 5` | `4.0` → `4.25` | `25%` (`Freezing Limbs`) |
| **Elemental (Cold)** | T2 | **Blizzard** | `122` | 105 | `50 / 500` | `14` | `4 / 2` | `5 / 7` | `5.5` → `5.85` | `50%` (`Freezing Limbs`) |
| **Elemental (Cold)** | T3 | **Fimbulvetr** | `123` | 185 | `150 / 800` | `21` | `7 / 4` | `7 / 10` | `7.0` → `7.50` | `75%` (`Freezing Limbs`) |
| **Elemental (Elec)** | T1 | **Shockblast** | `131` | 35 | `0 / 200` | `6` | `0` | `3 / 5` | `4.0` → `4.25` | `25%` (`Deep Burns`) |
| **Elemental (Elec)** | T2 | **Chained Lightning** | `132` | 115? | `50? / 500` | `14` | `4 / 2` | `5 / 7` | `5.5` → `5.85` | `50%` (`Deep Burns`) |
| **Elemental (Elec)** | T3 | **Wrath of Thor** | `133` | 195 | `150 / 800` | `21` | `7 / 4` | `7 / 10` | `7.0` → `7.50` | `75%` (`Deep Burns`) |
| **Elemental (Wind)** | T1 | **Gale** | `141` | 45 | `0 / 200` | `6` | `0` | `3 / 5` | `4.0` → `4.25` | `25%` (`Turbulent Air`) |
| **Elemental (Wind)** | T2 | **Downburst** | `142` | 125? | `60 / 500` | `14` | `4 / 2` | `5 / 7` | `5.5` → `5.85` | `50%` (`Turbulent Air`) |
| **Elemental (Wind)** | T3 | **Storms of Njord** | `143` | 205 | `150 / 800` | `21` | `7 / 4` | `7 / 10` | `7.0` → `7.50` | `75%` (`Turbulent Air`) |
| **Divine (Holy)** | T1 | **Smite** | `151` | 65 | `0 / 500` | `14` | `0` | `3 / 5` | **`4.5`**（固定） | `25%` (`Breached Defense`) + `Soul Fire` `4%/7%/10%` |
| **Divine (Holy)** | T2 | **Banishment** | `152` | 100? | `100 / 700` | `21` | `4 / 2` | `5 / 7` | **`6.0`**（固定） | `50%` (`Breached Defense`) + `Soul Fire` `10%/20%/25%` |
| **Divine (Holy)** | T3 | **Paradise Lost** | `153` | 200? | `200 / 900` | `30` | `7 / 4` | `7 / 10` | **`7.5`**（固定） | `75%` (`Breached Defense`) + `Soul Fire` `20%/40%/50%` |
| **Forbidden (Dark)** | T1 | **Corruption** | `161` | 85 | `0 / 500` | `14` | `0` | `3 / 5` | **`4.5`**（固定） | `25%` (`Blunted Attack`) + `Ripened Soul` `4%/7%/10%` |
| **Forbidden (Dark)** | T2 | **Disintegrate** | `162` | 100? | `100 / 700` | `18.5?` (`21`) | `4 / 2` | `5 / 7` | **`6.0`**（固定） | `50%` (`Blunted Attack`) + `Ripened Soul` `10%/20%/25%` |
| **Forbidden (Dark)** | T3 | **Ragnarok** | `163` | 245 | `200 / 900` | `28?` (`30`) | `7 / 4` | `7 / 10` | **`7.5`**（固定） | `75%` (`Blunted Attack`) + `Ripened Soul` `20%/40%/50%` |

#### (C) 元素異常狀態與跨元素連鎖引爆（Elemental Cycle & Explosions，`✓`）
- **出處**：[Spells](https://ehwiki.org/wiki/Spells#Status_Effects)、[Spell Damage](https://ehwiki.org/wiki/Spell_Damage)。
- **兩大閉環相剋引爆鏈**：
  1. **四元素循環鏈**：$$\text{Fire (Searing Skin)} \longrightarrow \text{Cold (Freezing Limbs)} \longrightarrow \text{Wind (Turbulent Air)} \longrightarrow \text{Elec (Deep Burns)} \longrightarrow \text{Fire}$$
  2. **光暗互剋鏈**：$$\text{Holy (Breached Defense)} \longleftrightarrow \text{Dark (Blunted Attack / Drain)}$$
- **引爆（Explosion）傷害與消散規則**：
  - 當怪物身上帶有前一個元素的異常狀態（持續 **3 ticks**；Spike Shield 反擊亦有 `17.5%` 機率附加），且受到循環中下一個元素的攻擊法術命中（`Drain` 視為 Dark 法術，可引爆 `Breached Defense`）時，該狀態立即**引爆（Explode）並消散**：
    $$\text{Explosion\_Base\_Damage} = \text{MDB} \times \left(1 + \frac{\text{EDB}_{\text{trigger\_spell}}}{100}\right) \times 0.73 \times (1 + \text{hath\_bonus}) \times (1 + \text{tower\_bonus}) \times (1 + \text{arcane\_focus\_mod}) \times (1 + \text{channel\_mod})$$
  - **Explosion 專屬特性**：`Spell Modifier = 0.73`、**不可暴擊（Cannot Crit）**，且最終隨機亂數區間為 **`50%–150%`（`0.5–1.5`）**，而非一般法術的 `80%–120%`！

| 異常狀態名稱 | 觸發來源 | 持續 Ticks | 對怪物的基礎 Debuff 效果 | 降低之下游元素抗性（加算） | 可將其引爆之法術屬性 |
|---|---|---|---|---|---|
| **Searing Skin** | Fire 法術 / Flame Spike Shield | 3 | 怪物攻擊傷害 **`-10%`** | Cold Resistance **`-25%`** | **Cold** 法術 |
| **Freezing Limbs** | Cold 法術 / Frost Spike Shield | 3 | 怪物行動速度 **`-10%`** | Wind Resistance **`-25%`** | **Wind** 法術 |
| **Turbulent Air** | Wind 法術 / Storm Spike Shield | 3 | 怪物基礎命中 **`-10%`** | Elec Resistance **`-25%`** | **Elec** 法術 |
| **Deep Burns** | Elec 法術 / Shock Spike Shield | 3 | 怪物基礎 Evade 與 Resist **`-10%`** | Fire Resistance **`-25%`** | **Fire** 法術 |
| **Breached Defense** | Holy 法術 | 3 | 怪物物理與魔法 Mitigation **`-10%`**（乘算） | Dark Resistance **`-25%`** | **Dark** 法術（含 `Drain`） |
| **Blunted Attack** | Dark 法術 | 3 | 怪物攻擊傷害 **`-10%`** | Holy Resistance **`-25%`** | **Holy** 法術 |
| **Burning Soul** | Holy 法術（裝備 `Soul Fire` 天賦） | 7 | 每 tick 造成 `MDB * (1 + Holy_EDB/100) * 0.2` 無視抗性傷害 | 若被施放 `Drain`（含 `Ether Theft` 天賦），100% 附加 5 ticks `Ether Theft` | — |
| **Ripened Soul** | Dark 法術（裝備 `Ripened Soul` 天賦） | 7 | 每 tick 造成 `MDB * (1 + Dark_EDB/100) * 0.2` 無視抗性傷害 | 若被施放 `Drain`（含 `Spirit Theft` 天賦），100% 附加 5 ticks `Spirit Theft` | — |

#### (D) 減益法術（Deprecating Spells，共 9 招）完整表（`✓`）
- 註：百科記載全部 9 招減益法術（Ticket 題幹簡稱 5 招，實為 9 招：`Drain, Slow, Weaken, Sleep, Confuse, Imperil, Blind, Silence, Immobilize`）。當 `Effective_Deprecating_Prof` 達 `Max Prof` 時，持續時間最高延長至 **`4x`**。

| 法術名稱 | 內部 ID | 解鎖等級 | `Min / Max Prof` | 基礎 / 滿天賦 `Cost` | 基礎 / 滿天賦 `CD` | 基礎 / 滿天賦 `Duration` (Ticks) | 基礎 / 滿天賦 `Targets` | 確切數值效果與疊加規則 |
|---|---|---|---|---|---|---|---|---|
| **Drain** | `211` | 30? | `0 / 300?` | `11.5` | `20 / 15`（Spells 頁，`sources/parsed_wiki/Spells.md:184`；Abilities 頁 Faster Drain 暗示基礎 CD ≥ 30、點滿到 20，兩頁矛盾，? 2026-10-22 稽核） | `7?` | `1` | 附加 `Vital Theft`：每次目標行動後先造成 `MDB * (1 + Dark_EDB/100) * 0.1` DoT 並吸取 $\min(5\%\text{ 目標當前 HP}, 5\%\text{ 玩家 Base HP}) \times \text{Better\_Drain\_Mult}$ 回血。 |
| **Weaken** | `212` | 70 | `0 / 345` | `10 / 16`（2026-10-22 稽核更正：原稿 `10 / 15`，來源 Spells 頁為 `10/16`，`sources/parsed_wiki/Spells.md:188`） | `3 / 0` | `10 / 15` | `1 / 3` | 附加 `Weakened`：降低目標物理與魔法傷害 **`25%` → `50%`**，且**完全禁止目標打出暴擊（Prevents Critical Hits）**。 |
| **Imperil** | `213` | 130 | `30 / 495` | `10 / 15` | `3 / 0` | `10 / 15` | `1 / 3` | 附加 `Imperiled`：<br>• 物理與魔法 Mitigation **乘算降低 `25%` → `50%`**（如 80% 減傷乘 0.5 變 40%）。<br>• Fire/Cold/Elec/Wind 抗性 **加算扣減 `10%` → `40%`**（不低於 0%，若原為負抗則不變）。<br>• Holy/Dark 抗性：預設 `0%`，點滿 `Holy/Dark Imperil` 天賦時 **加算扣減 `5%` → `25%`**。 |
| **Slow** | `221` | 10? | `0 / 300?` | `18 / 25` | `3` | `10 / 15` | `1 / 3` | 附加 `Slowed`：降低目標行動速度 **`30%` → `50%`**。 |
| **Sleep** | `222` | 80 | `0 / 410` | `22 / 35` | `7` | `5 / 7` | `1 / 3` | 附加 `Asleep`：目標無法行動、**無法 Evade 或 Parry**、基礎 **Resist 降低 50%**；受到傷害時有 `90%` 機率驚醒（點 `Mind Control` Lv.1–3 降為 `50% / 25% / 20%` 驚醒率）。 |
| **Confuse** | `223` | 150 | `45 / 660` | `25 / 35` | `10` | `10 / 12` | `1 / 3` | 附加 `Confused`：目標隨機攻擊同伴或自己（打自己機率約 `25%?`）；受擊驚醒率同 `Sleep`（`90%` → `50% / 25% / 20%`）。 |
| **Blind** | `231` | 80? | `30 / 610` | `18 / 25` | `7 / 3` | `10 / 15` | `1 / 3` | 附加 `Blinded`：降低目標物理與魔法命中率 **`20%` → `30%`**。 |
| **Silence** | `232` | 120 | `40 / 665` | `18` | `10 / 5` | `10 / 13` | `1 / 3` | 附加 `Silenced`：**完全禁止目標使用法術（Magic）與靈力大招（Spirit Attacks）**，僅能普攻。 |
| **Immobilize** (`MagNet`) | `233` | 250? | `100? / 800` | `22` | `15 / 10` | `10 / 15` | `1 / 3` | 附加 `Immobilized`：目標**完全無法 Evade**（但仍可 Parry）、基礎 **Resist 降低 `25%` → `50%`**；若有 `Better Immobilize` Lv.1+ 則額外降低目標 **`25%` 行動速度**。 |

#### (E) 治療法術（Curative Spells，3 招）與增益法術（Supportive Spells，7 招 + 衍生 `Cloak of the Fallen`）完整表（`✓`）
- 當 `Effective_Supportive_Prof` 達 `Max Prof` 時，持續時間最高延長至 **`7x`**。
- **互斥規則**：`Heartseeker` 與 `Arcane Focus` **不可同時並存**，施放後者會立即頂掉前者。

| 分類 | 法術名稱 | 內部 ID | 解鎖等級 | `Min / Max Prof` | 基礎 / 滿天賦 `Cost` | 基礎 / 滿天賦 `CD` | 基礎 / 滿天賦 `Duration` (Ticks) | 確切數值公式與機制 |
|---|---|---|---|---|---|---|---|---|
| **Curative** | **Cure** | `311` | 5 | `0 / 385+` | `20` | `5 / 2` | 瞬發 | 回復量：$$\text{Heal} = \text{Base\_HP} \times \frac{\text{Cure\_AP}}{100} \times \text{Cure\_Prof\_Mult}$$其中 `Cure_AP` 無天賦為 `55`，點 `Better Cure` Lv.1–3 為 `70 / 85 / 100`；`Cure_Prof_Mult` $\in [0.8, 1.5]$。 |
| **Curative** | **Regen** | `312` | 50? | `0 / 845` | `22.5 / 75` | `0` | `14 / 30` | 每 tick 回復：$\text{Base\_HP} \times \text{Regen\_Pct}$（無天賦 `4%~5%`，`Better Regen` Lv.1–10 為 `6%` 至 `20%`）。 |
| **Curative** | **Full-Cure** | `313` | 220 | `0 / 945+` | `50` | `10` | 瞬發 | 直接將玩家當前 HP **100% 補滿至 `Max_HP`**。 |
| **Supportive** | **Protection** | `411` | 10? | `0 / 320` | `25` | `0` | `15? / 30` | 吸收（乘算減免）所有物理與魔法傷害 **`25%`**（`Better Protection` Lv.1–5 為 **`26%–30%`**；`Scroll of Protection` 為 **`50%`**）。 |
| **Supportive** | **Haste** | `412` | 60? | `0 / 450` | `30` | `0` | `10? / 20` | 提升玩家行動速度 **`+25%`**（`Better Haste` Lv.1–5 為 **`+30%` 至 `+50%`**；`Scroll of Swiftness` 為 **`+60%`**）。 |
| **Supportive** | **Shadow Veil** | `413` | 90 | `0 / 610` | `30` | `0` | `10? / 20` | 提升自然閃避率 **`+10%` → `+20%`**（卷軸 `+25%`），且使怪物攻擊時有 **`10%` → `20%` 獨立機率直接揮空（`whiff at shadows`）**。 |
| **Supportive** | **Absorb** | `421` | 50? | `0 / 385+?` | `30` | `20` | `∞`（直到觸發） | 下一次受到敵方**非暴擊魔法攻擊**時，有 **`60%` → `90%`**（`Better Absorb` Lv.1–3；卷軸為 `100%`）機率將同一回合內的敵方法術完全無效化並轉化為微量 MP（約怪物基礎 Max MP 的 5–10%）。 |
| **Supportive** | **Spark of Life** | `422` | 100 | `0 / 750?` | `44? / 30` | `0` | `15? / 30` | • 當玩家 $\text{HP} > 1$ 且受到致死攻擊時，消耗固定比例 `Base_SP`（卷軸版消耗 `25% Base_SP`並留存 `50% Max_HP`），免於死亡並消散。<br>• 若當前 SP 不足支付消耗，觸發失敗（`Spark of Life fails due to insufficient Spirit!`）並直接戰敗。<br>• 成功觸發時立即衍生 **3 ticks `Cloak of the Fallen`**：觸發當回合剩餘時間內 **100% 完全免疫所有傷害**，之後提供 **`+75%` 物理與魔法減傷**。 |
| **Supportive** | **Spirit Shield** | `423` | 200 | `0 / 950?` | `25` | `0` | `15? / 30` | • 設觸發門檻比例 $T = \text{SS\_AP\_Damage}$：無天賦為 `0.45`（45% Max HP），`Stronger Spirit` Lv.1–5 為 **`0.40 / 0.35 / 0.30 / 0.25 / 0.20`**。<br>• 當單次攻擊傷害 $D > T \times \text{Max\_HP}$ 且當前 SP 足夠時，玩家實際只扣 $T \times \text{Max\_HP}$ 的生命值，超額傷害轉由 SP 承擔：<br>$$\text{Spirit\_Damage} = \text{Base\_SP} \times T \times \min\!\left(1,\; \frac{D - \text{Max\_HP} \times T}{3 \times \text{Max\_HP} \times T}\right)$$ |
| **Supportive** | **Heartseeker** | `431` | 140 | `0 / 880?` | `100` | `0` | `50? / 100` | 物理總傷害 **`+25%`**，且物理暴擊傷害倍率額外 **`+0.25x` → `+0.40x`**（與 `Arcane Focus` 互斥）。 |
| **Supportive** | **Arcane Focus** | `432` | 175 | `0 / 980?` | `100` | `0` | `50? / 100` | 魔法總傷害 **`+25%`**，魔法暴擊率乘算 **`+10%`**，且魔法暴擊傷害倍率額外 **`+0.25x` → `+0.40x`**（與 `Heartseeker` 互斥）。 |

---

## 五、完整傷害判定鏈、乘區公式與防禦觸發狀態機

### 5.1 出手至結算的完整判定順序（Avoidance / Crit / Mitigation / Procs，`✓`）
- **出處**：[Damage](https://ehwiki.org/wiki/Damage)、[Battles](https://ehwiki.org/wiki/Battles#Criticals)、[Physical Damage](https://ehwiki.org/wiki/Physical_Damage)、[Spell Damage](https://ehwiki.org/wiki/Spell_Damage)、[Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs)、[Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics#Elemental_Strikes)、`anon962/HvSim` (`entity.py` L87–135)、`anon962/HvLogV3` (`_parsers.ts`, `_summarizeCombat.ts`)、`Trendymen/hentaiverse` (`hvUtils.js` L4220–4244)。

#### (A) 第一階段：揮空與迴避檢定（Whiff / Evade / Parry / Block / Absorb / Resist，`✓`）
除 `Resist` 為 **3 次獨立檢定**外，`Evade`、`Parry`、`Block` 皆為對抗攻擊方 Accuracy 的 **2 次獨立檢定（Two Separate Rolls）**；多個迴避檢定可同時生效並將倍率相乘（例如同時 Glance $0.5\text{x}$ 且 Partially Parried $0.5\text{x}$，則基礎倍率為 $0.5 \times 0.5 = 0.25\text{x}$）：

| 步驟 | 檢定項目 | 適用攻擊類型 | 檢定次數與結果階梯 | 免除／反制條件（Counter-Avoidance） |
|---|---|---|---|---|
| **Step 1** | **Whiff（盲目揮空）** | 敵方對玩家之物理／魔法／技能 | 1 次獨立檢定：若玩家有 `Shadow Veil`（`10%–20%`）或敵方中 `Blind`（`-20% ~ -30%` 命中），失敗則完全揮空（`0x`，日誌：`whiffs at a shadow`） | 玩家開啟 `Focus` 當回合仍可觸發怪物 Whiff |
| **Step 2** | **Absorb（法術吸收）** | 魔法攻擊（非暴擊） | 1 次獨立檢定：若目標有 `Absorbing Ward`（法術 `60%–90%` / 卷軸 `100%`），成功則傷害歸 `0` 並轉化為 MP | **暴擊法術不可被 Absorb**（`Cannot absorb critical hits`） |
| **Step 3** | **Evade（閃避／擦傷）** | 物理普攻與魔法攻擊 | **2 次獨立檢定**（每次成功率為有效閃避率 $p_{\text{evade}}$）：<br>• **0 次成功（皆命中）**：**`1.0x`**（Full Hit，**具備進入暴擊檢定資格**）<br>• **1 次成功**：**`0.5x`（Glancing Blow 擦傷，失去暴擊資格）**<br>• **2 次成功**：**`0.0x`（Evaded 完全閃避）** | • **武器主動技能與 OC 技**無視 Evade。<br>• **T2 攻擊法術**最多 1 次成功（保底 Glance `0.5x`）。<br>• **T3 攻擊法術**與 **Channeling** 法術無視 Evade（保底 `1.0x`）。<br>• 目標中 `Stunned`、`Asleep`、`Immobilized`、`Spreading Poison` 時 Evade 降為 `0%`；中 `Deep Burns` 基礎 Evade `-10%`。 |
| **Step 4** | **Parry（招架）** | 僅限**物理攻擊**（魔法不可招架） | **2 次獨立檢定**（有效招架率 $p_{\text{parry}} = \text{Base\_Parry} \times (1 - \text{Counter\_Parry})$）：<br>• **0 次成功**：**`1.0x`**<br>• **1 次成功**：**`0.5x`（Partially Parried）**<br>• **2 次成功**：**`0.0x`（Parried 完全招架）** | • **武器主動技能與 OC 技**、**1H Counter-Attack** 無視 Parry。<br>• 目標中 `Stunned`、`Asleep` 時 Parry 降為 `0%`。<br>• 玩家 `Overwhelming Strikes`（每層 `-20%`，5 層 `-100%`）與 `Overpower Charm`（Lesser `-12%` / Greater `-20%`）削減目標 Parry。 |
| **Step 5** | **Block（格擋）** | 物理與魔法攻擊（僅玩家與少數特定怪擁有） | **2 次獨立檢定**：<br>• **0 次成功**：**`1.0x`**<br>• **1 次成功**：**`0.5x`（Partially Blocked）**<br>• **2 次成功**：**`0.0x`（Blocked 完全格擋）** | 玩家開啟 `Focus` 當回合自身 Evade/Parry/Block/Resist 降為 `0%`。 |
| **Step 6** | **Resist（魔法抵抗）** | 僅限**攻擊法術與減益法術** | **3 次獨立檢定**（每次成功率 $r_s = \text{Base\_Resist} \times (1 - \text{Counter\_Resist})$）：<br>• **0 次成功**：傷害 **`1.00x`**（減傷 `0%`）／ Debuff 持續時間 **`100%`**<br>• **1 次成功**：傷害 **`0.50x`**（減傷 `50%`）／ Debuff 持續時間 **`75%`**<br>• **2 次成功**：傷害 **`0.25x`**（減傷 `75%`）／ Debuff 持續時間 **`50%`**<br>• **3 次成功**：傷害 **`0.10x`**（減傷 `90%`）／ Debuff **完全抵抗（`0%` 不生效）** | • **Channeling** 狀態下法術絕不被 Resist（0 次成功）。<br>• 目標中 `Asleep`（基礎 Resist `-50%`）、`Immobilized`（`-25% ~ -50%`）、`Stunned`（`-25%`）、`Deep Burns`（`-10%`）。<br>• 玩家有效抗性穿透 $\text{Counter\_Resist} = 0.5 \cdot \text{prof\_factor} + \text{Staff\_CR} + \text{Penetrator\_Charm} + \text{Focus\_CR}$。<br>• 期望抗性減傷率（`hvUtils.js` L4228）：$E[\text{Resist\_Red}] = 0.15 r_s^3 - 0.75 r_s^2 + 1.5 r_s$。 |

#### (B) 第二階段：暴擊與多倍連環暴擊檢定（Crit & Stacking Multi-Crit up to `9x`，`✓`）
- **出處**：[Battles](https://ehwiki.org/wiki/Battles#Criticals)、`anon962/HvLogV3` (`_parsers.ts` L19 `CritMult`, `_summarizeCombat.ts` L871 `critMults`)。
1. **進入暴擊的前提**：該次攻擊必須在 Step 3 通過兩次命中／閃避檢定（即為 **Full Hit**，非 Glance、非 Evade/Parry/Block 完全迴避），且攻擊者未處於 `Weakened` 狀態。
2. **玩家暴擊與連環暴擊（Stacking Crit `1x`–`9x`）**：
   - **第 1 次暴擊檢定（1x Crit）**：以面板暴擊率（配合半數命中檢定，單次上限 `50%`；若使用 `Bubble-Gum` 則為 `~95%`、若為 `Great Cleave` 則為 `100%`）進行判定。
   - **連環暴擊檢定（2x Crit 至 9x Crit）**：一旦第 1 次暴擊成功，系統會以 **四分之一命中（上限 `25%` 機率）重複追加檢定**，直到檢定失敗或達到最高 **`9x-crit`** 為止！
   - 若累計達成 $N \in [1, 9]$ 重暴擊，總暴擊乘區為：
     $$\text{Total\_Crit\_Multiplier}(N) = 1 + N \times \text{CritMod}$$
     （例如無暴傷裝備時基礎 $\text{CritMod} = 0.50$，則 `1x-crit` 為 $1.5\text{x}$、`2x-crit` 為 $2.0\text{x}$、最高 `9x-crit` 為 $1 + 9 \times 0.5 = 5.5\text{x}$ 傷害！日誌顯示為 `You 2x-crit <Monster>...`）。
   - **暴擊必觸發武器／法術內建特效**：只要達成暴擊，武器內建特效（`Stun / Bleeding Wound / Penetrated Armor`）與攻擊法術內建元素異常為 **100% 必觸發**（但不影響後綴 Siphon 與流派被動機率）。
3. **怪物暴擊規則**：怪物固定擁有 `20%` 基礎暴擊傷害加成（即 `1.20x`），且若怪物中 `Weakened` 則暴擊率強制為 `0%`。（2026-10-22 稽核補正：Battles 頁原文為「fixed 20% crit damage bonus **and crit rate**」，`sources/parsed_wiki/Battles.md:45`，即暴擊率也固定為 20%，原稿漏寫暴擊率。）

#### (C) 第三階段：物理與魔法傷害總乘區公式（`✓`）
1. **玩家物理普攻與技能傷害總公式**：
   $$\text{Raw\_Phys\_Dmg} = \text{ADB} \times \text{Skill\_Mult} \times (1 + \text{Title\_Bonus}) \times (1 + \text{Hath\_Daemon\_Duality}) \times (1 + \text{Tower\_Bonus}) \times (1 + N_{\text{crit}} \cdot \text{CritMod}_{\text{phys}}) \times (1 + \text{Heartseeker\_Dmg}) \times (1 + \text{Overwhelming\_Dmg}) \times (1 + \text{Spirit\_Stance\_Dmg}) \times (1 + \text{Item\_Buff\_Dmg})$$
   - `Title_Bonus`：依裝備之稱號提供 `+0.5%` (Beginner) 至 `+12%` (Ponyslayer) 物理傷害（對魔法無效）。
   - `Hath_Daemon_Duality`：`Dæmon Duality I–IX` 提供 `+10% / +15% / +20% / +25% / +30% / +35% / +40% / +45% / +50%`（覆蓋式，最高 `+50%`）。
   - `Tower_Bonus`：Persistent 模式下依上一季 Isekai 爬塔層數每層 `+0.1%`（單機版預設 `0`）。
   - `Heartseeker_Dmg`：開啟 `Heartseeker` 時為 `+0.25`（`+25%`）。
   - `Overwhelming_Dmg`：1H 流派觸發 `Overwhelming Strikes` 期間為 `+0.15`（`+15%`）。
   - `Spirit_Stance_Dmg`：開啟 `Spirit Stance` 時為 `+1.00`（`+100%`，即雙倍物傷）。
   - `Item_Buff_Dmg`：`Blessing of the RiddleMaster` `+10%`（有 `Enigma Energizer` Perk 為 `+20%`）、`Flower Vase` (`Sleeper Imprint`) `+25%`、`Bubble-Gum` (`Kicking Ass`) `+100%`。
2. **玩家攻擊法術傷害總公式**：
   $$\text{Raw\_Spell\_Dmg} = \text{MDB} \times \left(1 + \frac{\text{EDB}_{\text{elem}}}{100} + \text{Infusion\_Bonus}\right) \times \text{Spell\_Modifier} \times (1 + \text{Hath\_Daemon\_Duality}) \times (1 + \text{Tower\_Bonus}) \times (1 + N_{\text{crit}} \cdot \text{CritMod}_{\text{mag}}) \times (1 + \text{Arcane\_Focus\_Dmg}) \times (1 + \text{Channeling\_Dmg}) \times (1 + \text{Item\_Buff\_Dmg})$$
   - `Infusion_Bonus`：使用對應元素 `Infusion` 戰鬥道具期間為 `+0.25`（`+25%`）。
   - `Arcane_Focus_Dmg`：開啟 `Arcane Focus` 時為 `+0.25`（`+25%`）。
   - `Channeling_Dmg`：觸發 `Channeling` 時為 `+0.50`（`+50%`）。

#### (D) 第四階段：目標減傷（Mitigation & Specific Mitigation）與最終亂數浮動（`✓`）
1. **怪物有效物理／魔法減傷（Effective Physical / Magical Mitigation，乘算削減）**：
   $$\text{Eff\_Phys\_Mit} = \text{Base\_Phys\_Mit} \times (1 - \text{Imperil\_Mod}) \times \left(1 - 0.25 \times \text{PA\_Stacks}\right) \times (1 - \text{Breached\_Mod}) \times (1 - \text{Poison\_Mod})$$
   $$\text{Eff\_Mag\_Mit} = \text{Base\_Mag\_Mit} \times (1 - \text{Imperil\_Mod}) \times (1 - \text{Breached\_Mod}) \times (1 - \text{Poison\_Mod})$$
   - `Imperil_Mod`：未點天賦為 `0.25`，`Better Imperil` Lv.1–5 為 `0.30 / 0.35 / 0.40 / 0.45 / 0.50`。
   - `PA_Stacks`：`Penetrated Armor` 層數 $\in \{0, 1, 2, 3\}$，每層乘算降低 25% 物理減傷（3 層時剩 $1 - 0.75 = 0.25$ 倍，例如 80% 物理減傷經 Imperil 變 $80\% \times 0.5 = 40\%$，再經 3 層 PA 變 $40\% \times 0.25 = 10\%$！若使用 `Rending Blow` 或 `Skyward Sword`，該技能當下直接視 `Eff_Phys_Mit = 0`）。
   - `Breached_Mod`：帶有 Holy 異常 `Breached Defense` 時為 `0.10`。
   - `Poison_Mod`：帶有 DW 異常 `Spreading Poison` 時為 `0.10`。
2. **怪物有效特化／元素減傷（Effective Specific Mitigation，加算削減但有 0% 地板）**：
   - 設怪物原始屬性減傷為 $M_{\text{spec}}$（取自怪物種族抗性表，可為正數、0 或負數如 `-25%` 弱點）：
   - 先扣除星期元素日減免 $\Delta_{\text{day}}$（週日 Holy、週一 Dark、週二 Fire、週三 Cold、週四 Wind、週六 Elec 各扣 `10%`；週五全屬性含物理與 Void 各扣 `5%`）：
     $$M' = M_{\text{spec}} - \Delta_{\text{day}}$$
   - 接著計算來自玩家熟練度、Imperil 與元素異常的加算削減量 $R_{\text{spec}}$：
     $$R_{\text{spec}} = 0.50 \cdot (\text{prof\_factor})^{1.5} + \text{Imperil\_Elem\_Red} + \text{Elem\_Status\_Red}$$
     - `Imperil_Elem_Red`：四元素為 `10%`（`Better Imperil` Lv.1–5 為 `20% / 25% / 30% / 35% / 40%`）；光暗為 `0%`（`Holy/Dark Imperil` Lv.1–5 為 `5% / 10% / 15% / 20% / 25%`）。
     - `Elem_Status_Red`：若目標帶有剋制鏈對應之前置元素異常（如 `Searing Skin` 對 Cold、`Breached Defense` 對 Dark），額外 `+25%`。
   - **0% 地板截斷規則**（[Damage](https://ehwiki.org/wiki/Damage#The_Player) 與 `hvUtils.js` L4239–4240 雙重確認）：若 $M' < 0$（本來就是負抗弱點），$R_{\text{spec}}$ 不會將其進一步壓低；若 $M' > 0$，則最多扣減至 `0%`：
     $$\text{Eff\_Spec\_Mit} = \begin{cases} M', & M' \le 0 \\ \max(0,\; M' - R_{\text{spec}}), & M' > 0 \end{cases}$$
3. **最終結算公式與 $\pm 20\%$ 隨機骰（Final Damage Roll）**：
   $$\text{Final\_Damage} = \left\lfloor \text{Raw\_Dmg} \times \text{Avoidance\_Mult} \times (1 - \text{Eff\_Phys\_or\_Mag\_Mit}) \times (1 - \text{Eff\_Spec\_Mit}) \times \text{Uniform\_Step}(0.80, 1.20, 0.01) \right\rfloor$$
   - 其中 `Uniform_Step(0.80, 1.20, 0.01)` 為從 `80%, 81%, ..., 120%`（共 41 個離散步階，步長 `1%`）等機率抽取（Explosion 則為 `0.50–1.50`）。

---

### 5.2 武器內建特效（Weapon Procs）、元素追擊（Elemental Strikes）與防禦觸發優先序（`✓`）

#### (A) 武器內建特效與後綴特效表（[Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs)、[Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics)）

| 特效名稱 | 觸發武器／來源 | 最高觸發率（暴擊時 100%） | 持續 Ticks | 層數上限與結算順序規則 |
|---|---|---|---|---|
| **Penetrated Armor (PA)** | 1H: `Rapier`<br>2H: `Estoc`<br>Skill: `Rending Blow`, `Skyward Sword` | 武器最高 **`25%`**<br>技能 **`100%`**（直上 3 層） | 武器最高 **`7`** | • 最多疊 **3 層**，每層乘算降低目標 `25%` 物理減傷（3 層降 `75%`）。<br>• **在當次攻擊傷害結算後才附加**，故當回合普攻本身不享受新疊上的 PA，下一回合起生效。 |
| **Bleeding Wound** | 1H: `Axe, Shortsword, Wakizashi`（Equipment Procs 頁僅列這三把 1H 與 `Longsword, Katana` 兩把 2H，`sources/parsed_wiki/Equipment_Procs.md:12,17-27`；原稿另加 `Dagger`、`Scythe` 無此出處，只有舊世代 Obsolete Items 頁把兩者標為 Slashing／Bleeding Wound，`sources/parsed_wiki/Obsolete_Items.md:273,277`，? 2026-10-22 稽核）<br>2H: `Longsword, Katana`<br>Skill: `Vital Strike` (對暈眩), `Skyward Sword` | 武器最高 **`25%`**<br>技能 **`100%`**（直上 5 層） | 武器最高 **`7`**<br>Vital Strike **`5`**（? 來源未找到，2026-10-22 稽核） | • 最多疊 **5 層**；每 1 Tick（100 TU）結算一次固定無屬性傷害（無視目標所有減傷）：<br>$$\text{Bleed\_Tick\_Dmg} = \text{ADB}_{\text{sheet}} \times \text{DOT\%} \times 0.4 \times \text{Stacks} \times \prod \text{Active\_Dmg\_Buffs}$$<br>• `DOT%`：1H 斬擊武器與 `Skyward Sword` 為 **`20%`**；2H 斬擊武器（Longsword/Katana 為 **`30%`**，`sources/parsed_wiki/Equipment_Procs.md:20,22`；原稿所列 Scythe 無此出處，? 來源未找到，2026-10-22 稽核）；`Vital Strike` 為 **`50%`**。<br>• **快照機制**：流血傷害僅在新疊層／刷新時快照當下的 Buff（且在同回合 `Overwhelming Strikes` 觸發前結算）。 |
| **Stunned** | 1H: `Club`<br>2H: `Mace / Great Mace`（2026-10-22 稽核更正：原稿把 Swordchucks 列為 2H Stun 武器，Equipment Procs 頁 Stun 武器只有 Club／Mace，`sources/parsed_wiki/Equipment_Procs.md:13,21,24`；Swordchucks 在舊世代為 Slashing／Bleeding Wound，`sources/parsed_wiki/Obsolete_Items.md:275`、`sources/parsed_wiki/Damage_Types.md:56`，0.91 特效 ? 未找到）<br>Skill: `Shield Bash, Shatter Strike, Concussive Strike, FUS RO DAH` | Club **`25%`**<br>Mace **`30%`**<br>技能 **`100%`** | 武器最高 **`4`**<br>技能 **`5`** | • 目標無法攻擊、無法 Evade 或 Parry、基礎 Resist `-25%`。<br>• **不可覆蓋（Non-refreshable）**：目標已處於 Stunned 時，任何新 Stun（含暴擊或技能）皆不會刷新剩餘時間。<br>• 結束時怪物獲得 1 次 Free Action。 |
| **Siphon Health / Mana / Spirit** | 後綴 `of the Vampire` (HP) / `of the Illithid` (MP) / `of the Banshee` (SP) | 依武器骰值（不受暴擊必發影響） | 瞬發 | 普攻命中主目標時機率吸取固定點數（隨裝備等級以 `Scale_Factor = 25` 成長：$\text{Scaled} = \text{Base} \times (1 + \text{Level}/25)$）。Domino 濺射不觸發。 |
| **Elemental / Void Strike** | 武器前綴（`Fiery` 等 6 元素 / `Ethereal`）或 `Strike / Hollowforged / Voidseeker Charm` | 普攻命中主目標（及 DW 副手命中）**100% 追擊** | 瞬發 | • 單把武器最多同時擁有 **2 種 Elemental Strikes + 1 種 Void Strike**。<br>• 每次追擊作為同回合內的獨立攻擊事件（日誌：`Fire Strike hits <Monster>, causing X additional points of Fire damage`），基礎傷害約為正常物理普攻的 **`50%`**（Lesser Charm 為 `30%`、Greater Charm 為 `50%`），屬**物理攻擊**（吃目標 Physical Mitigation + 對應元素 Specific Mitigation，不吃法術 EDB）。 |

#### (B) 玩家受擊時防禦法術觸發優先序（Defensive Proc Priority，`✓`）
當玩家同時擁有多種防禦性增益並受到敵方攻擊時，系統嚴格按以下優先序依次判定（[Spells](https://ehwiki.org/wiki/Spells#Procs)）：
$$\text{1. Absorb（吸收非暴擊法術）} \longrightarrow \text{2. Spirit Shield（單擊超過 } 45\%\text{–}20\% \text{ Max HP 轉由 SP 承擔）} \longrightarrow \text{3. Spark of Life（致死時消耗 SP 鎖血並觸發 Cloak of the Fallen）} \longrightarrow \text{4. Spike Shield（招架或格擋成功時反彈至少 5 點物理元素傷並機率附加元素異常）}$$

---

## 六、公開資料矛盾與空白缺口總表（供 Ticket `005` 拍板）

下表彙整 `002` 考證範圍內，所有在公開資源中屬於**跨頁分歧（`?`）**或**伺服器黑盒空白（`✗`）**的項目，並給出二手開源專案的實作做法與建議供 Ticket `005` 拍板：

| 缺口編號 | 子系統 | 欄位／公式名稱 | 狀態 | 公開來源記載現況與矛盾點 | 二手開源工具做法／建議 Ticket `005` 拍板預設值 |
|---|---|---|---|---|---|
| **GAP-002-01** | 衍生屬性 | **DEX / WIS 對面板 Accuracy 的轉化係數与基礎命中率** | `?` | [Character Stats](https://ehwiki.org/wiki/Character_Stats) 頁首總表寫 `1 DEX/WIS = +0.5 Accuracy`，同頁下方公式寫 `DEX * 0.05` / `WIS * 0.05`；且攻方 Accuracy 對守方 Evade/Parry/Resist 單次檢定機率 $p(\text{Acc}, \text{Avoid})$ 的精確曲線未在百科公開。 | `HvLogV3` 實測 Scan 顯示怪物 `Evade 934.0 (29.6% vs attack)`、`Parry 1250 (39.9% vs attack)`（2026-10-22 稽核更正：原稿據此推出「每 `~31.4` 點怪物 Avoidance 對應 `1%` 迴避率」為線性常數，不成立：同一行註解寫 `Evade 934.0 (29.6% base chance vs player attack, 12.9% base chance vs player magic)`，同一個 Evade 值對魔法只有 12.9%，另 `Resist 1250` 對魔法只有 8.6%，迴避率取決於攻方命中而非常數，`sources/data_gh/_parsers.ts:327,342`）；原稿建議的 `Base_Acc = 100 + 0.05 * DEX + Equip_Acc`（? 來源未找到，2026-10-22 稽核：常數「100」無出處；百科只有 `Physical Attack Accuracy = DEX * 0.05 + proficiency_bonus + …`，`sources/parsed_wiki/Character_Stats.md:15`），Ticket 005 拍板前不應當成來源值。 |
| **GAP-002-02** | 熟練度 | **每行動基礎熟練度經驗獲取率（Base Proficiency Gain Rate）與黎明跨日保底量** | `✗` | 明列於 [Missing Data](https://ehwiki.org/wiki/Missing_Data#Other)。百科僅定性說明與戰鬥獲得之 EXP 及 `(Level - Prof)` 差距正相關。 | 採用 `Trendymen/hentaiverse` (`hvUtils.js` L4054–4128) 的反函數指數曲線模型：將熟練度 $P$ 映射至與等級相同的累積經驗曲線 $E(P)$，每次行動／每波獲 $\Delta E_{\text{prof}} = \Delta \text{EXP} \times K_{\text{prof}} \times (1 + 0.1 \times \text{Assimilator})$ 後反查 $E^{-1}$，並在 $1.2 \times \text{Level}$ 封頂。（2026-10-22 稽核補註：此模型出自升級模擬計算器 `sources/hvUtils.js:4123` 的估算，`K_prof = 4` 不是遊戲公式；「黎明保底量」Missing Data 頁並未列，只有「The base proficiency gain rate」`sources/parsed_wiki/Missing_Data.md:91`，Proficiencies 頁已說明黎明後下一場戰鬥依 level 與 prof 差距給定量、但沒給數字，`sources/parsed_wiki/Proficiencies.md:195`；此欄「黎明保底量」屬 ? 來源未找到。） |
| **GAP-002-03** | 戰鬥流派 | **Dual-Wielding 副手追擊（Offhand Strike）基礎觸發率與上限** | `?` | [Character Stats](https://ehwiki.org/wiki/Character_Stats) 明載 `100 DEX = +1%`、`100 AGI = +1%`，但 [Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles#Dual-Wielding) 未像 1H/2H 一樣寫出常數項與 Cap。 | 對齊 1H/2H 同構公式：$\text{Offhand\_Chance} = \min\!\left(75\%,\; 25 + 0.01 \times (\text{DEX} + \text{AGI}) + \frac{\text{DW\_Prof}}{10}\right)\%$（或於 `005` 拍板為固定高觸發率 `50%–75%`）。（? 來源未找到，2026-10-22 稽核：此式是比照 1H 公式自創的提案；來源只有「(DW/Niten only) 100 points = +1% Offhand Strike Chance」，`sources/parsed_wiki/Character_Stats.md:15`，Fighting Styles 頁 DW 段 `sources/parsed_wiki/Fighting_Styles.md:108-122` 未給公式；基礎 25%、`DW_Prof/10`、上限 75% 皆無出處。） |
| **GAP-002-04** | 天賦樹 | **少數天賦節點的層數版本差異（`2H Parry`, `Staff Accuracy`, `Cloth Spellacc`）** | `?` | `Abilities` 百科頁列 `2H Parry` 2 層 (5 AP)、`Staff Accuracy` 3 層 (6 AP)、`Cloth Spellacc` 3 層 (10 AP)；而 `Proficiencies` 頁與 `hvUtils.js` L4778–4785 列為單層 `2H Parry` (Lv.250, 3 AP, +0.25%/pt)、2 層 `Staff Accuracy` (3 AP)、單層 `Cloth Spellacc` (Lv.120, 5 AP)。 | 兩套數據皆完整存在於本報告 3.2 節表中；建議於 `005` 拍板以 `Abilities` 百科詳表（支援多段平滑成長）或 `hvUtils.js` v4.0.0 實測表為準。 |
| **GAP-002-05** | 行動速度 | **Burden 歸零 Attack Speed 加成的上限門檻（`90` vs `130`）與 `>70` 扣減暴擊率斜率** | `?` | [Burden](https://ehwiki.org/wiki/Burden)（2021 編輯）寫 `Burden > 40` 起扣減攻速加成、於 **`90`** 完全歸零，且 `Burden > 70` 扣減物理暴擊率（上限 `120`）；而 [Action Speed](https://ehwiki.org/wiki/Action_Speed)（2026-08 編輯）寫於 **`130`** 完全歸零。 | 以較新（2026-08）之 `Action_Speed` 頁為準，採線性折減 $f(\text{Burden}) = 1 - \text{clamp}((\text{Burden}-40)/90, 0, 1)$（於 130 歸零）；物理暴擊率於 `Burden in [70, 120]` 每點扣減 `0.04%`（於 120 共扣 `2%`）或每點扣 `2%` 相對值。（2026-10-22 稽核補註：Burden 頁原文「If burden > 70, decreases physical crit rate by 2%, (capped at 120 burden)」，`sources/parsed_wiki/Burden.md:23`，最直接的讀法是每點 −2%；「每點 0.04%」無出處且與此讀法衝突，? 來源未找到。Burden 頁最後編輯 2021-06-18、Action Speed 頁 2026-08-06，日期出自 `sources/ehwiki_pages/Burden.html`、`sources/ehwiki_pages/Action_Speed.html`。） |
| **GAP-002-06** | 行動速度 | **`Silence` 與 `Confuse` 的基礎 `Specific_Action_Speed` 及 `Toggling Spirit Stance` / `Flee` 的 `< 1` 精確值** | `?` | [Action Speed](https://ehwiki.org/wiki/Action_Speed) 表中未單獨列出 `Silence` 與 `Confuse`，且將 `Toggling Spirit Stance` 與 `Flee` 標為 `< 1`。 | `Silence` 歸入與 `Blind` 相同之 `1.2`、`Confuse` 歸入與 `Sleep/Slow` 相同之 `1.5`；`Toggling Spirit Stance` 設為 `0.2`（最低 20 TU）、無 Perk 之 `Flee` 設為 `1.0`（100 TU = 1 tick）。（? 來源未找到，2026-10-22 稽核：1.2／1.5／0.2／1.0 全為類比自填；Flee 的 1.0 與來源 `<1` 衝突，`sources/ehwiki_pages/Action_Speed.html:219`；且整張 Base Action Speeds 表的法術值本來就都帶 `?`，見 4.1(C) 補註。） |
| **GAP-002-07** | 先天技能 | **`Defend` 消耗 25% OC 時的回血比例（`10%` vs `25%` Base HP）** | `?` | [Skills](https://ehwiki.org/wiki/Skills#Innate_Skills) 寫消耗 25% OC 回復 **`25%` Base HP**，而 [Battles](https://ehwiki.org/wiki/Battles#Combat) 寫消耗 25% OC 回復 **`10%` Base HP**。 | 2026-10-22 已於 [005 常數表](005-constants-table.md) 定案採較新的 Skills 頁 `25%`。 |
| **GAP-002-08** | 特殊技能 / 道具 | **`Manehattan Project` Hath Perk 對 OFC 的倍率加成與 `Flower Vase` 的命中／暴擊／閃避具體加成量** | `✗` | [Skills](https://ehwiki.org/wiki/Skills) 僅記載 OFC 無 Perk 為 `x20`、有 `Manehattan Project`（25,000 Hath）時「大幅提高」；[Missing Data](https://ehwiki.org/wiki/Missing_Data#Items) 明列 `Flower Vase` (`Sleeper Imprint`) 除 `+25%` 傷害外的命中／暴擊／閃避／抵抗加成未公開。 | 建議於 `005` 將 `Manehattan Project` 定義為 OFC 倍率由 `x20` 提升至 `x35`（或 `x40`）；`Flower Vase` 定義為全傷害 `+25%`、物魔命中 `+25%`、物魔暴擊率 `+10%`、Evade/Resist `+10%`。（? 來源未找到，2026-10-22 稽核：x35／x40、命中 +25%、暴擊 +10%、Evade/Resist +10% 全是自填；來源只有 OFC `x20`、Manehattan「Significantly boosts」（`sources/parsed_wiki/Hath_Perks.md`）與 Flower Vase 的 +25% 傷害，Flower Vase 對 hit/crit/evade/resist 的影響 Missing Data 頁列為未知，`sources/parsed_wiki/Missing_Data.md:39`。） |
| **GAP-002-09** | 复活與護盾 | **`Spark of Life` 法術版（非卷軸版）觸發時的精確 SP 消耗比例與留存 HP** | `?` | [Items](https://ehwiki.org/wiki/Items#Scrolls) 明載 `Scroll of Life` 觸發時消耗 `25% Base_SP` 並留下 `50% Max_HP`；而 [Spells](https://ehwiki.org/wiki/Spells#Supportive_Spells) 僅寫法術版 `Spark of Life` 留存「瀕死（on the brink of defeat）」並消耗與 `Base_SP` 成正比的靈力。 | 建議法術版 `Spark of Life` 觸發時消耗 `50% Base_SP`（或與卷軸相同之 `25% Base_SP`），將 HP 鎖定於 `1 HP`（或 `10% Max_HP`）並立即賦予 3 ticks `Cloak of the Fallen`（當回合無敵 + 後續 75% 減傷）。（? 來源未找到，2026-10-22 稽核：法術版的 50% SP、1 HP／10% HP 皆自填；卷軸版「消耗 25% of base spirit、保留 50% max HP」見 `sources/parsed_wiki/Items.md`，Cloak 持續 `3?` 帶問號，`sources/parsed_wiki/Spells.md:226`。） |
| **GAP-002-10** | 難度設定 | **`Hell` 難度的 EXP 倍率（`6x` vs `7x`）** | `?` | [Experience Points](https://ehwiki.org/wiki/Experience_Points) 表格列為 `1x, 2x, 4x, 6x, 10x, 15x, 20x`；而 [HentaiVerse Settings](https://ehwiki.org/wiki/HentaiVerse_Settings) 列為 `Normal=1, Hard=2, Nightmare=4, Hell=7, Nintendo=10, IWBTH=15, PFUDOR=20`（`sources/parsed_wiki/Experience_Points.md:56`、`sources/parsed_wiki/HentaiVerse_Settings.md:11`）。（2026-10-22 稽核更正：原稿稱 `JPX-Revanced.user.js` L2024 與 `hvUtils.js` 皆列 Hell=7；`hvUtils.js` 的 `Hell: 7` 是 Item World 的 PXP 倍率表且 Normal=2，不是 EXP 難度表，`sources/hvUtils.js:10281`，不能當佐證。） | 以 `HentaiVerse_Settings` 頁的 **`Hell = 7x`** 暫用，百科兩頁矛盾（6x vs 7x）屬實，待 `005` 拍板；「全部開源腳本一致」的說法不成立（? 2026-10-22 稽核）。 |

---

## 2026-10-22 稽核補充：覆蓋缺口

來源有寫、但本報告漏掉或只帶過的子系統（依 [audits/audit-002.md](../audits/audit-002.md) 第三節）。以下只登錄缺口與出處，數值與取捨待 Ticket `005`／`006` 處理；`sources/` 路徑相對於 `.scratch/hv-v3/`。

1. **Mod Power**：Lv.50／100／150／…／350 各 +1，共 7 點，Lv.350 後不再增加（`sources/parsed_wiki/Leveling_Up.md:15`）。這是 E-Hentai 站方權限，單機可能不需要，但應明寫排除。
2. **可遭遇怪物等級範圍與 Power Level 上限隨玩家等級成長**：Leveling Up 每級「The range on the level of the monsters that can be fought increases by 1」（`sources/parsed_wiki/Leveling_Up.md:15`）。漏掉這條是 1.1(B) 與 2.2(B) 誤寫「怪物等級 = 玩家等級」的原因（已在上文更正）。
3. **Persona 系統**：各 Persona 獨立的項目有 Primary Attributes、Equipment Sets、Abilities、Difficulty/Font、Battle Items、Quickbar Slots、Auto-casts，其餘共用（`sources/parsed_wiki/Persona.md:21-37`）；AP 與 Mastery Points 由所有 Persona 共用，但 AP 分配、天賦配置與已解鎖 Mastery 槽各自獨立（`sources/parsed_wiki/Abilities.md:15`「Ability and Persona」段）。本報告只在配點段落順帶提一句。
4. **Overcharge 與 Spirit Stance 的規則**：OC 上限 250%（`sources/parsed_wiki/Overcharge.md:21`）；開 Spirit Stance 需至少 50% OC（`sources/parsed_wiki/Spirit_Stance.md:25`）；每回合耗 1 SP＋10% OC，開啟當回合不扣、關閉當回合要扣，低於需求會自動「exhausted」關閉（`sources/parsed_wiki/Spirit_Stance.md:37-41`）。
5. **百科內部的 Overcharge 矛盾**：Spirit & Overcharge 頁寫「Domino Strike and Off-hand Strike hits do not generate additional Overcharge」（`sources/parsed_wiki/Spirit_AND_Overcharge.md:53`），Overcharge 頁寫 Offhand Strike 給 5%／3%、每次 Domino 給 1%（`sources/parsed_wiki/Overcharge.md:27-29`）。本報告採 Overcharge 頁、未標分歧。
6. **百科內部的 SP 公式矛盾**：Spirit & Overcharge 頁的 `SP gained per turn = Spirit Regen * Resplendent Regeneration / 30`（`sources/parsed_wiki/Spirit_AND_Overcharge.md:28-30`）與 Character Stats 的每 tick 公式（本報告 1.2(B)）寫法不同，本報告未標分歧。
7. **百科內部的暴擊「率／傷害」矛盾**：Proficiencies 頁把 DW、Cloth、Light 的加成寫成 Critical Chance（`sources/parsed_wiki/Proficiencies.md:84,104,114`），Abilities 頁寫成 Crit Multiplier（`sources/parsed_wiki/Abilities.md:15`）。本報告只採 Abilities 頁。
8. **Anti-Avoidance**（自訂怪物的 anti-evade／anti-block／anti-parry／anti-resist 升級）：`sources/parsed_wiki/Damage.md:121-123`。本報告未寫。
9. **RiddleMaster 答錯的 Stamina 懲罰**：答錯過多會加快戰鬥中的 Stamina 消耗，數值未公開（`sources/parsed_wiki/Stamina.md:15`）。本報告未寫。
10. **熟練度 Hath Perk 的基準不一致**：Proficiencies 頁「10% bonus to the effective proficiency」（`sources/parsed_wiki/Proficiencies.md:183`），Hath Perks 頁「10% of your natural base proficiency」（`sources/parsed_wiki/Hath_Perks.md:49-50`）。本報告 2.2(A) 只採後者。
11. **Lv.10 起才能從 Artifact 取得主屬性**（`sources/parsed_wiki/Leveling_Up.md:15`「Primary Attributes from artifacts can be received」於 Lv.10 列）。本報告只寫「每 10 級上限 +1」。
12. **Spell Cost 例子矛盾**：文字例子 Fiery Blast 基礎 cost 5（`sources/parsed_wiki/Spells.md:71`），同頁表格 6（`sources/parsed_wiki/Spells.md:131`）。本報告未標分歧（已於 4.3 補註）。
13. **Weaken 點滿天賦的 cost**：Spells 頁為 10/16（`sources/parsed_wiki/Spells.md:188`），原稿為 10/15（小錯，已於 4.3(D) 更正）。

另有四項是「百科明列為缺口或帶 `?`、本報告卻當成已知或標 `✓`」，已在正文就地補註，這裡集中登錄：

14. **各武器技能的傷害倍率**：Missing Data 頁列為未知（`sources/parsed_wiki/Missing_Data.md:83`），4.2 節原標 `✓`。
15. **Focus 是否仍影響 Resist 機率**：Missing Data 頁列為未知（`sources/parsed_wiki/Missing_Data.md:85`），原稿 4.2、5.1 當成確定。
16. **Burden 對 Evade 與攻速的 `f(Burden)`**：Character Stats 頁寫「still needs to be discovered」（`sources/parsed_wiki/Character_Stats.md:15`），原稿給了定式。
17. **法術基礎動作速度與多個法術數值的 `?`**：見 4.1(C)（`sources/ehwiki_pages/Action_Speed.html:190-285`）與 4.3 補註（`sources/parsed_wiki/Spells.md` 各列）。

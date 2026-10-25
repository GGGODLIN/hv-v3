# Ticket 001：HentaiVerse 公開權威來源與開源工具全量普查報告

- **關聯決策票**：`001-public-sources-and-open-source-tools-census`
- **下游消費票**：`002`（角色／熟練度／技能／戰鬥公式）、`003`（裝備／詞綴／鍛造／戰鬥模式）、`004`（經濟循環／多人市場依賴）、`005`（空白機制最小補齊）
- **查證日期**：2026-10-22
- **Clean Room 邊界聲明**：本報告完全從零檢索公開網路資源（`ehwiki.org` 透過 Wayback Machine 快照、`github.com` 公開儲存庫與公開套件端點），未讀取本機任何舊世代專案目錄（`hv-clone`、`hentaiverse-clone-kb`、`CopyVerse`）、未引用本地記憶庫，亦未連線或逆向 `hentaiverse.org` 遊戲伺服器。

---

## 零、執行摘要與兩項關鍵前置發現

### 0.1 `ehwiki.org` 存取現況與 Wayback Machine 鏡像取證方法
1. **直連現況**：`ehwiki.org`（DNS 解析為 `178.162.151.58`）於查證當下對直連 `curl`、Context.dev、Firecrawl 與 Jina Reader 均回傳 `ERR_CONNECTION_REFUSED`。
2. **完整鏡像取得路徑**：透過 [Internet Archive Wayback Machine CDX API](https://web.archive.org/cdx/search/cdx?url=ehwiki.org/wiki/*&output=json&filter=statuscode:200) 檢索，確認 `web.archive.org` 完整保存了 `ehwiki.org` 截至 **2026 年 10 月 16 日**的最新快照（全站歷史快照索引 7,080 筆、2020–2026 年近期快照 35,306 筆）。
3. **取用格式**：後續 `002`、`003`、`004` 考證讀取任何 `ehwiki.org` 頁面時，直接使用 `curl -sL --compressed "https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/<PageName>"` 即可取得無須瀏覽器渲染的原始 MediaWiki HTML。

### 0.2 重大版本斷代：經典 v0.85–v0.86 世代 vs 現行 v0.91（The Armory）世代
本次普查比對 2020–2024 年百科快照與 2026 年 6–10 月最新百科快照及 GitHub 開源工具後，發現原版 HentaiVerse 在 **v0.91 更新（2025–2026 年）** 進行了裝備與鍛造系統的結構性重寫：

| 子系統維度 | 經典 v0.85–v0.86 世代（2014–2024 百科與舊版腳本） | 現行 v0.91 世代（2025–2026 最新百科與新版工具） |
|---|---|---|
| **裝備與鍛造入口** | 分離為 [Equipment Shop](https://ehwiki.org/wiki/Equipment_Shop) 與 [The Forge](https://ehwiki.org/wiki/The_Forge)（Repair / Upgrade / Enchant / Salvage / Reforge / SoulFuse） | 整併為單一 [The Armory](https://ehwiki.org/wiki/The_Armory)（Organize / Modify / Repair / Soulbind / Purchase / Sell / Salvage） |
| **裝備基底種類** | 單手 5 種、雙手 4 種、法杖 4 種、盾 3 種、布甲 2 種、輕甲 2 種、重甲 2 種（共 22 種） | 新增 Dagger、Sword Chucks、Scythe、Ebony Staff、Tower Shield、Gossamer、Ironsilk、Drakehide、Kevlar、Chain、Reactive（擴充至 33 種，見 [Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics)） |
| **裝備屬性底層表示** | 各部位浮點數上下限表（見 [Equipment Ranges Weapons](https://ehwiki.org/wiki/Equipment_Ranges_Weapons) 等四子頁）＋PXP0 品質加成 `(pxp0 - 100) / 25 * fluc` | 統一正規化為 `0–250` 基礎骰值（Crude `0–40`、Fair `30–70`、Average `60–100`、Superior `90–130`、Exquisite `120–160`、Magnificent `150–180`、Legendary `170–200`、Peerless `200`、Peerless+ `201–249`、Ultimate `250`） |
| **強化（Upgrade / Forging）** | 分屬性獨立升級（一般上限 Lv.50、物魔傷上限 Lv.100），對數公式 `1 + factor * ln(1 + 0.1 * Lv)` | 全屬性統一升級階層 `Upgrade Tier: Forge / IW / MaxIW`，每級全基礎屬性 `+1%`（物魔傷 `+2%`），上限取決於已通關 IW 層數（Sup/Exq 10、Mag 20、Leg 25、Peerless 30、Ultimate 33） |
| **道具界（IW）與附魔** | 通關 IW 隨機賦予 Potency Tier 0–10 內部詞綴（Butcher / Archmage 等），不滿意需用 Amnesia Shard 重鑄（Reforge） | 通關 IW 每層全基礎屬性 `+1%`（物魔傷 `+2%`）、鍛造上限 `+1`、Charm Points `+1`；移除隨機內部附魔，改為可自由鑲嵌於 **Charm Slots** 的 Lesser/Greater **Charms** 與抗損耗 **Pouches**（Silk / Kevlar / Mithril） |
| **靈魂融合（SoulFuse vs Stat Fusion）** | SoulFuse 僅花費 Credits＋Soul Stone 將裝備綁定至角色等級 | 拆分為 [Soulbind](https://ehwiki.org/wiki/The_Armory#Soulbind)（耗 Soul Fragments 綁定等級）與 [Stat Fusion](https://ehwiki.org/wiki/The_Armory#Stat_Fusion)（犧牲同基底同部位傳奇／無雙裝備＋10 Bindings＋Cores＋Credits，每次提升基礎骰值 `+1` 或 `+2` 直至晉升 Peerless `200` 或 Ultimate `250`） |

> **對後續票券的影響**：`003` 與 `004` 必須在考證時明確區分 v0.86 與 v0.91 兩套公開規格（兩套在公開來源中皆有完整記載），供架構決策拍板採用哪一世代或如何取捨。

---

## 一、ehwiki 官方百科頁面完整清單

本次普查共檢索 112 個 `ehwiki.org` 路徑，扣除重導向別名後，共確認 **88 個獨立 Canonical 條目**（外加 [Category:HentaiVerse](https://ehwiki.org/wiki/Category:HentaiVerse) 分類下的 21 個單獨競技場挑戰名條目與 63 個 `Bazaar/The_Armory/*` UI 子路徑重導向頁，分類總計 182 頁）。

### 1.1 導覽總表與後設頁面（6 頁）

| Canonical 頁面與連結 | 重導向別名 | 最後編輯日期 | 表格數 | 正文長度 | 內容密度與涵蓋重點 |
|---|---|---|---|---|---|
| [HentaiVerse](https://ehwiki.org/wiki/HentaiVerse) | `Hentaiverse_(Old)` | 2026-06-15 | 5 | 38 KB | **高（總入口）**：含四大導覽表與 `Template:HVnav`，索引全站所有子系統 |
| [Template:HVnav](https://ehwiki.org/wiki/Template:HVnav) | — | 2023-10-29 | 1 | 19 KB | **高（導覽模板）**：全站底部導覽列，分為 Character、Services、The Forge/Armory、Items、Equipment、Battles、Isekai、Misc 8 大區塊 |
| [Missing Data](https://ehwiki.org/wiki/Missing_Data) | — | 2018-03-28 | 0 | 21 KB | **高（官方缺口清單）**：明列百科尚未考證出的公式缺口（Flower Vase 確切加成、IW 品質難度係數、PAB 骰值分布、Collectible/Happy Pill 掉率、Monster Lab 訓練降耗與水晶回士氣公式、部分技能倍率與基礎熟練度成長率） |
| [To Be Added](https://ehwiki.org/wiki/To_Be_Added) | — | 2023-08-30 | 1 | 38 KB | **中**：開發者 Tenboro 曾於論壇提及但尚未實裝的規劃功能紀錄 |
| [Never To Be Added](https://ehwiki.org/wiki/Never_To_Be_Added) | — | 2022-11-17 | 0 | 28 KB | **中**：官方明確認定永不實裝的玩家建議清單 |
| [Acronyms](https://ehwiki.org/wiki/Acronyms) | — | 2022-04-20 | 3 | 29 KB | **高**：全遊戲縮寫對照表（ADB、MDB、EDB、MIT、PAB、PXP、OFC、TBN 等） |

### 1.2 角色屬性、等級、熟練度與行動速度（19 頁，對應 Ticket `002`）

| Canonical 頁面與連結 | 重導向別名 | 最後編輯日期 | 表格數 | 公式數 | 內容密度評估與具體內容 |
|---|---|---|---|---|---|
| [Character Stats](https://ehwiki.org/wiki/Character_Stats) | `Stats` | 2026-09-22 | 4 | 25 | **極高**：六大主屬性（STR/DEX/AGI/END/INT/WIS）對所有衍生屬性（HP/MP/SP、物魔傷公式項、命中、暴擊、閃避、招架、格擋、抗性、雙擊、反擊、壓制、連擊）的完整換算係數 |
| [Character Menu](https://ehwiki.org/wiki/Character_Menu) | — | 2026-08-17 | 4 | 0 | **中**：角色主選單 UI 欄位、裝備欄與道具欄介面說明 |
| [Persona](https://ehwiki.org/wiki/Persona) | — | 2026-09-30 | 1 | 0 | **高**：多重人格槽位、切換規則與獨立配點機制 |
| [Training](https://ehwiki.org/wiki/Training) | — | 2023-01-21 | 3 | 0 | **極高**：全部 15 項訓練課程（Adept Learner 至 Set Collector）的等級上限、所需小時數、Credits 費用、EXP 倍率與效果表 |
| [HentaiVerse Settings](https://ehwiki.org/wiki/HentaiVerse_Settings) | `Ranks`, `Title` | 2026-06-14 | 6 | 0 | **高**：7 階難度倍率表（Normal 1x 至 PFUDOR 20x 的怪物強度、經驗與 Credits 加成）、稱號（Ranks/Titles）完整清單、快捷鍵欄與字型設定 |
| [Experience Points](https://ehwiki.org/wiki/Experience_Points) | `EXP` | 2026-08-18 | 2 | 2 | **極高**：含完整單怪經驗公式 `roundup((3 + clamp(monster_lvl, 1, 300)^1.35) * monster_Modifier)` 與玩家倍率 `roundup(stamina_bonus * difficulty_bonus * arena_bonus * (1 + hath_perk + training + ...))` |
| [Leveling Up](https://ehwiki.org/wiki/Leveling_Up) | `level_up` | 2026-09-26 | 4 | 1 | **極高**：升级所需 EXP 指數公式 `(current_level + 4)^2.7`（及各等級區間修正常數）、每級獲得之 AP 與主屬性點數 |
| [Level Table](https://ehwiki.org/wiki/Level_Table) | `Level_and_Rank_Table` | 2021-09-10 | 2 | 0 | **極高**：Lv.1 至 Lv.500 逐級所需經驗值、累積經驗值、屬性點與稱號完整查表 |
| [Learning Curves](https://ehwiki.org/wiki/Learning_Curves) | — | 2021-09-06 | 2 | 0 | **中**：經驗與熟練度成長曲線概述 |
| [Proficiencies](https://ehwiki.org/wiki/Proficiencies) | — | 2023-01-17 | 2 | 2 | **高**：八大熟練度分類、有效熟練度對法術抗性穿透公式 `prof_factor = (effective_prof - monster_level) / monster_level`（Counter-Resist 加成 `prof_factor * 50%`）、MP 消耗減免公式；惟「每行動基礎熟練度經驗獲取率」僅有定性說明而缺精確常數 |
| [Action Speed](https://ehwiki.org/wiki/Action_Speed) | — | 2026-08-06 | 4 | 7 | **極高**：ATB 行動時鐘機制、各動作（普攻、法術、技能、道具、防禦、專注、靈魂姿態）的基礎延遲 ticks、施法速度與武器攻速加成公式、熟練度加速因子與 Haste/Slow 疊算公式（部分罕見動作標有 `?`） |
| [Stamina](https://ehwiki.org/wiki/Stamina) | — | 2026-06-18 | 5 | 0 | **極高**：耐力上限（99）、隨數值區間變化的經驗與掉寶加成倍率表、每回合耐力消耗規則、Energy Drink 與新的一天回復量 |
| [Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles) | — | 2026-09-13 | 1 | 5 | **極高**：單手（1H）、雙手（2H）、二天一流（Dual Wield / Niten Ichiryu）、法杖（Staff）四大流派觸發條件與專屬被動觸發率公式（Overwhelming Strikes、Counter-Attack、Domino Strike、Offhand Strike） |
| [Abilities](https://ehwiki.org/wiki/Abilities) | `Ability_Points`, `ability` | 2026-08-04 | 21 | 0 | **極高**：21 張表格完整列出所有天賦樹節點、前置條件、最大層數、每層 AP 消耗與具體數值加成 |
| [Skills](https://ehwiki.org/wiki/Skills) | — | 2026-09-29 | 5 | 1 | **高**：武器技能與 OC 特技（Shield Bash、Vital Strike、Merciful Blow、Great Cleave、Rending Blow、Shatter Strike、Iris Strike、backstab、Frenzied Blows、Skyward Sword、Concussive Strike、Orbital Friendship Cannon、Scan、Flee）之消耗、冷卻、連段關係與傷害倍率表 |
| [Spells](https://ehwiki.org/wiki/Spells) | — | 2026-10-15 | 8 | 13 | **高**：火／冰／雷／風／光／暗／減益／治療／增益全法術列表、基礎 MP 消耗與等級縮放公式、冷卻、持續回合、法術暴擊與附加狀態機率（部分高階 DoT 係數含 `?`） |
| [Spell Damage](https://ehwiki.org/wiki/Spell_Damage) | — | 2026-09-29 | 3 | 2 | **極高**：完整法術基礎傷害（MDB）公式、法術傷害總公式 `magic_base_damage * (1 + EDB/100) * spell_modifier * (1 + hath_bonus) * (1 + tower_bonus)` 與各法術獨立係數表 |
| [Spirit & Overcharge](https://ehwiki.org/wiki/Spirit_%26_Overcharge) | — | 2019-12-16 | 1 | 2 | **極高**：SP 上限公式 `(1 + (STR+DEX+AGI+END+INT+WIS)/5) * (1 + SP_Tank) * (1 + Suffusive_Spirit)`、每回合 SP 回復公式、Spirit Stance 與 Overcharge 綜合機制 |
| [Overcharge](https://ehwiki.org/wiki/Overcharge) 與 [Spirit Stance](https://ehwiki.org/wiki/Spirit_Stance) | — | 2026-09-28 / 2014-09-08 | 1 / 1 | 0 | **高**：Overcharge 最大值（250 = 10 格 × 25）、獲取途徑、Spirit Stance 開啟門檻（50% OC）、每回合消耗與傷害／暴擊／減傷加成 |

### 1.3 戰鬥系統、傷害計算、怪物與五大戰鬥模式（17 頁，對應 Ticket `002`、`003`）

| Canonical 頁面與連結 | 重導向別名 | 最後編輯日期 | 表格數 | 公式數 | 內容密度評估與具體內容 |
|---|---|---|---|---|---|
| [Battles](https://ehwiki.org/wiki/Battles) | `Battle_Modes`, `battle_modes` | 2026-08-06 | 7 | 2 | **高**：戰鬥介面、回合流程、怪物顏色階級（白普通／藍 Boss／紅學姊／紫神怪）、寶石掉落（Health/Mana/Spirit/Mystic Gem）與基礎規則 |
| [Damage](https://ehwiki.org/wiki/Damage) | — | 2026-08-17 | 6 | 2 | **極高**：總傷害減免公式 `Original_Damage * (1 - Phys_or_Mag_Mit) * (1 - Specific_Mit)`、抗性階段減傷（50% / 75% / 90% 三次獨立檢定）、閃避／招架／格擋判定順序與暴擊倍率計算 |
| [Physical Damage](https://ehwiki.org/wiki/Physical_Damage) | — | 2021-07-21 | 2 | 1 | **極高**：物理基礎傷害（ADB）公式與總物理傷害乘區公式 `attack_base_damage * (1 + hath_bonus) * (1 + tower_bonus) * (1 + crit_mod) * (1 + heartseeker) * ...` |
| [Damage Types](https://ehwiki.org/wiki/Damage_Types) | — | 2026-08-18 | 1 | 0 | **高**：三大物理屬性（Crushing / Slashing / Piercing）、六大元素屬性（Fire / Cold / Elec / Wind / Holy / Dark）與虛空（Void）之剋制與異常狀態說明 |
| [Enemy Procs](https://ehwiki.org/wiki/Enemy_Procs) | — | 2014-09-22 | 1 | 0 | **中**：怪物攻擊觸發之眩暈、流血、破甲、元素 DoT 效果說明；缺乏怪物端精確觸發機率公式 |
| [Monster Stats](https://ehwiki.org/wiki/Monster_Stats) | — | 2025-11-13 | 2 | 12 | **極高**：怪物 Power Level（PL）與玩家等級縮放公式、怪物基礎六圍轉化為 HP／攻／防／迴避／抗性的完整數學公式 |
| [System Monsters](https://ehwiki.org/wiki/System_Monsters) | `HentaiVerse_Bestiary`, `Bestiary` | 2026-09-27 | 9 | 2 | **極高**：全系統固定怪物（Rare / Legendary / Ultimate Boss，含三女神、三龍、Yggdrasil、Real Life、Flying Spaghetti Monster、小馬關 Boss 等）的 MID、種族、攻擊屬性、技能與九系抗性完整表 |
| [Monster Lab Bestiary](https://ehwiki.org/wiki/Monster_Lab_Bestiary) 與 [Monster Lab Bestiary 250+](https://ehwiki.org/wiki/Monster_Lab_Bestiary_250%2B) | — | 2012-03-23 / 2012-02-06 | 2 / 18 | 0 | **高（歷史資料）**：早期玩家整理的各怪物種族等級抗性與屬性表（已被 `SukkaLab/hv-monster-data` 的 44,431 筆 JSON 完全超越） |
| [Random Encounter](https://ehwiki.org/wiki/Random_Encounter) | — | 2023-06-28 | 1 | 0 | **高**：隨機遭遇觸發條件、冷卻計時、波數與獎勵倍率說明 |
| [Arena](https://ehwiki.org/wiki/Arena) | `The_Arena`, `Battle/The_Arena` | 2026-08-06 | 4 | 0 | **極高**：全部競技場挑戰關卡清單（等級限制、波數、消耗 Stamina、固定 Boss 配置、首次與重複通關 Token/裝備獎勵） |
| [Ring of Blood](https://ehwiki.org/wiki/Ring_of_Blood) | `Battle/Ring_of_Blood` | 2026-04-20 | 2 | 0 | **高**：浴血擂台各階入場 Token of Blood 費用、波數、Boss 陣容與保底獎勵機制 |
| [Grindfest](https://ehwiki.org/wiki/Grindfest) | `Battle/GrindFest` | 2018-04-18 | 2 | 1 | **高**：1,000 波連續戰鬥規則，含水晶掉落公式 `floor((crystarium) * (diffmod + min(gfbonus, (gfbonus / 500) * round)))` |
| [Item World](https://ehwiki.org/wiki/Item_World) | `Battle/Item_World` | 2026-06-16 | 1 | 0 | **中（v0.91 改版過渡中）**：記錄 v0.91 需 Soulbound 裝備與 1–3 顆 World Seeds 入場、5–30 波次、每波怪物增傷 1%；頁面明示 v0.91 新版細節尚在補完 |
| [The Tower](https://ehwiki.org/wiki/The_Tower) 與 [Tower Battle Mode](https://ehwiki.org/wiki/Tower_Battle_Mode) | — | 2021-05-09 / 2021-03-16 | 2 / 0 | 0 | **高**：Isekai 專屬爬塔模式、層數結算與賽季獎勵規則 |
| [RiddleMaster](https://ehwiki.org/wiki/RiddleMaster) | `Riddlemaster` | 2025-05-04 | 1 | 0 | **高**：戰鬥防掛機小馬驗證機制、答對獎勵（Blessing of the RiddleMaster +20% 掉率與經驗 buff、Mystic Gem）與答錯懲罰 |

### 1.4 裝備、詞綴、品質範圍與鍛造／The Armory（14 頁，對應 Ticket `003`）

| Canonical 頁面與連結 | 重導向別名 | 最後編輯日期 | 表格數 | 公式數 | 內容密度評估與具體內容 |
|---|---|---|---|---|---|
| [Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics) | — | 2021-06-05 | 5 | 0 | **高**：裝備欄位、材質分類、命名結構（Quality + Prefix + Base + Slot + Suffix）與基礎屬性概覽 |
| [Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics) | — | 2026-10-09 | 46 | 0 | **極高（v0.91 最新）**：46 張表格詳列 v0.91 全部 10 階品質骰值範圍（`0–250`）與掉率、武器／法杖前綴權重分布（Ethereal 20%、四元素 15%、光暗 10%）、33 種武器／法杖／盾／護甲基底與全部前後綴加成矩陣（部分新基底的精確權重標有 `?`） |
| [Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs) | — | 2021-06-18 | 3 | 2 | **極高**：武器特效（Stun / Bleed / Penetration / Siphon / Elemental Strike / Void Strike）觸發機率、持續時間與 DoT 傷害公式 `ADB * DOT% * 0.25` |
| [Burden](https://ehwiki.org/wiki/Burden) | — | 2021-06-18 | 1 | 0 | **高**：防具與武器負重對耐力消耗、攻擊速度與閃避的懲罰公式（含 STR 抵銷與 Armor Mastery 減免） |
| [Interference](https://ehwiki.org/wiki/Interference) | — | 2026-10-11 | 3 | 0 | **高**：防具干涉對施法速度與法術 MP 消耗的懲罰公式（含 AGI/INT 抵銷） |
| [Level Scaling](https://ehwiki.org/wiki/Level_Scaling) | — | 2025-11-06 | 2 | 1 | **極高**：裝備隨等級縮放公式 `Scaled_Stat = Base_Stat * (1 + Level / Scale_Factor)` 與全屬性 `Scale_Factor` 完整查表 |
| [Peerless PXP Table](https://ehwiki.org/wiki/Peerless_PXP_Table) | — | 2020-01-10 | 2 | 0 | **極高（v0.86 基準）**：各裝備基底在 Peerless 品質下的基準 PXP0 查表（如 Rapier 377、Power 382、Shade 394 等） |
| [Equipment Ranges](https://ehwiki.org/wiki/Equipment_Ranges)（2026-06 前獨立頁） | — | 2022-05-20 | 1 | 3 | **極高（v0.86 公式）**：記載 v0.86 裝備縮放與品質加成公式 `((baseValue - qualityBonus) * forgeCoeff + qualityBonus) * levelScalar` 與各屬性 `baseCoeff`（`fluc`）；2026-08 起重導向至 `The_Armory#Ranges` |
| [Equipment Ranges Weapons](https://ehwiki.org/wiki/Equipment_Ranges_Weapons) | — | 2020-01-10 | 17 | 0 | **極高（v0.86 數值表）**：17 張表詳列單手武、雙手武、法杖、盾牌在 Exquisite 至 Peerless 各前後綴組合下的浮點數上下限 |
| [Equipment Ranges Clothes](https://ehwiki.org/wiki/Equipment_Ranges_Clothes) | — | 2020-01-10 | 11 | 0 | **極高（v0.86 數值表）**：11 張表詳列 Phase 與 Cotton 布甲五部位各詞綴組合的浮點數上下限 |
| [Equipment Ranges Light](https://ehwiki.org/wiki/Equipment_Ranges_Light) | — | 2020-01-10 | 11 | 0 | **極高（v0.86 數值表）**：11 張表詳列 Shade 與 Leather 輕甲五部位各詞綴組合的浮點數上下限 |
| [Equipment Ranges Heavy](https://ehwiki.org/wiki/Equipment_Ranges_Heavy) | — | 2020-01-10 | 11 | 0 | **極高（v0.86 數值表）**：11 張表詳列 Power 與 Plate 重甲五部位各詞綴組合的浮點數上下限 |
| [The Armory](https://ehwiki.org/wiki/The_Armory) | `The_Forge` (2026-06+), `Salvage`, `Equipment_Ranges` (2026-08+) | 2026-10-06 | 13 | 8 | **極高（v0.91 核心大頁）**：完整記載 v0.91 裝備整理（Pin/Protect/Lock/Store）、Soulbind、IW 挑戰規則、Forging 各品質 1–33 級材料與 Core／Credit 消耗表、23 種 Lesser/Greater Charms 效果與材料表、3 種 Pouches 掉落與抗損耗率、Stat Fusion 規則與 0–250 範圍表、39 種 Bindings 對照表、Salvage 拆解產出與 Salvaged Remains 機制（僅 Repair 與 Sell 細部公式標為 WIP） |
| [The Forge](https://ehwiki.org/wiki/The_Forge)（2026-05 獨立快照） | `Repair`, `Upgrade`, `Enchant`, `Reforge`, `SoulFuse` | 2024-05-29 | 10 | 2 | **極高（v0.86 核心大頁）**：完整記載 v0.86 裝備耐久度耗損率、修理廢料公式 `1 + floor((100 - condition%) / quality_mod)`、對數升級公式 `1 + factor * ln(1 + 0.1 * level)`、升級材料曲線、IW Enchant 與 Shard/Infusion 規則、90% 材料拆解返還、Reforge、SoulFuse 成本與 Forge Level 1–50 經驗表 |

### 1.5 經濟系統、商店、神殿、樂透、魔物實驗室與掉落（17 頁，對應 Ticket `003`、`004`）

| Canonical 頁面與連結 | 重導向別名 | 最後編輯日期 | 表格數 | 公式數 | 內容密度評估與具體內容 |
|---|---|---|---|---|---|
| [Bazaar](https://ehwiki.org/wiki/Bazaar) | `Equipment_Shop`, `Item_Shop` | 2026-10-10 | 4 | 0 | **極高**：Item Shop 全品項官方買價、賣價與是否無限供應（綠色標記：基礎藥水、卷軸、魔藥、Soul Fragment、怪物飼料為無限供應；水晶、材料、碎片、古董、獎盃、收藏品為玩家出售後有限庫存，上限 9,999）以及 The Market 掛單撮合機制 |
| [Items](https://ehwiki.org/wiki/Items) | `items` | 2026-09-22 | 12 | 1 | **極高**：全遊戲消耗品、卷軸、魔藥、材料、水晶、碎片、獎盃、收藏品與 Soul Fragment 綁定成本公式 `Base_Cost + Increase * max(Item_level - player_level, 0)` |
| [Obsolete Items](https://ehwiki.org/wiki/Obsolete_Items) | — | 2026-04-07 | 7 | 0 | **高**：v0.85／v0.91 改版移除或轉換的舊版道具（如舊 Catalyst、舊 Soul Stone、舊鍛造物）歷史紀錄 |
| [Loot Drop Rolls](https://ehwiki.org/wiki/Loot_Drop_Rolls) | — | 2025-02-28 | 2 | 7 | **高**：戰利品掉落判定階段（Drop Roll -> Type Roll -> Quality Roll -> Slot Roll -> Prefix/Suffix Roll）、難度對裝備品質掉率的影響、裝備部位權重（`9 / 3 / 3 / 3 / 15 / 15 / 15`）；惟部分特定道具（Happy Pill、Collectibles）精確基礎掉率標有 `?` |
| [Shrine](https://ehwiki.org/wiki/Shrine) | `The_Shrine`, `Bazaar/The_Shrine` | 2026-08-06 | 6 | 2 | **極高**：Snowflake's Shrine 各階層物品獻祭點數（Shrine Value）、兌換獎勵池（主屬性點、Hath、水晶、材料、指定部位裝備、獎盃換無雙券／異界武器／護符與每 500k 保底 Pouch 機率 `75% / 20% / 5%`） |
| [The Lottery](https://ehwiki.org/wiki/The_Lottery) | `Lottery`, `Bazaar/Weapon_Lottery`, `Bazaar/Armor_Lottery` | 2022-02-12 | 3 | 0 | **高**：每日武器／防具雙樂透池規則、每張彩券價格（1,000 Credits）、大獎頭彩裝備與安慰獎（Chaos Token、Scroll of the Gods 等）分配機制 |
| [The Market](https://ehwiki.org/wiki/The_Market) | `Bazaar/The_Market` | 2022-07-26 | 1 | 0 | **高**：玩家雙向掛單交易所（Buy Order / Sell Order）、交易稅率與存款帳戶規則 |
| [MoogleMail](https://ehwiki.org/wiki/MoogleMail) | `Bazaar/MoogleMail` | 2021-06-18 | 1 | 1 | **高**：玩家間郵件、附件寄送、貨到付款（CoD）手續費與郵資規則 |
| [Monster Lab](https://ehwiki.org/wiki/Monster_Lab) | `Bazaar/Monster_Lab` | 2025-05-07 | 12 | 2 | **高**：魔物實驗室槽位開闢費用、創造與培養人工魔物、餵食（Chow/Edibles/Cuisine/Happy Pill）與水晶升級抗性、魔物在戰鬥中作為隨機遭遇敵人並回禮（Materials / Crystals / Bindings）之門檻；惟精確禮物機率與訓練降耗係數部分未公開 |
| [Currency](https://ehwiki.org/wiki/Currency) | — | 2021-08-16 | 1 | 0 | **中**：遊戲內貨幣體系總覽 |
| [Credits](https://ehwiki.org/wiki/Credits) | `credits` | 2026-09-19 | 5 | 0 | **高**：主貨幣 Credits 獲取途徑（戰鬥掉落、賣裝、競技場）與消耗出口總覽 |
| [Hath](https://ehwiki.org/wiki/Hath) | — | 2023-10-15 | 2 | 0 | **高**：高階貨幣 Hath 獲取與用途 |
| [Hath Perks](https://ehwiki.org/wiki/Hath_Perks) | — | 2026-09-13 | 3 | 0 | **極高**：全部 Hath Perks 名稱、階層、Hath 價格與具體遊戲加成效果（含 v0.91 新增之 Limit Breaker 等） |
| [ISK](https://ehwiki.org/wiki/ISK) | `Isk` | 2021-08-16 | 1 | 0 | **高**：Isekai 賽季專屬貨幣 ISK 規則 |
| [Gallery Points](https://ehwiki.org/wiki/Gallery_Points) | — | 2025-09-02 | 2 | 0 | **中**：主站 GP 貨幣說明（與 HV 單機無直接耦合） |
| [Dawn of a New Day](https://ehwiki.org/wiki/Dawn_of_a_New_Day) | — | 2023-08-22 | 2 | 0 | **高**：UTC 00:00 每日跨日結算事件（回復 Stamina、發放每日小馬獎勵、Monster Lab 士氣與飽食度扣除） |
| [Events](https://ehwiki.org/wiki/Events) 與 [Rewards](https://ehwiki.org/wiki/Rewards) | — | 2022-09-10 / 2016-04-21 | 0 / 2 | 0 | **中**：節慶活動與論壇成就獎勵紀錄 |

### 1.6 異界模式（Isekai）、終局內容、攻略與腳本工具（15 頁）

| Canonical 頁面與連結 | 重導向別名 | 最後編輯日期 | 表格數 | 內容密度評估與具體內容 |
|---|---|---|---|---|
| [Isekai](https://ehwiki.org/wiki/Isekai) 與 [Isekai Mode](https://ehwiki.org/wiki/Isekai_Mode) | — | 2021-06-01 / 2021-03-06 | 1 / 0 | **高**：賽季制平行世界規則、與 Persistent 的規則差異（無交易、拆解產出加倍等）與賽季獎勵 |
| [Post Game Content](https://ehwiki.org/wiki/Post_Game_Content) 與 [Secret Pony Level](https://ehwiki.org/wiki/Secret_Pony_Level) | — | 2023-10-26 | 2 / 2 | **高**：Lv.500 終局挑戰與隱藏小馬關卡規則 |
| [Scripts & Tools](https://ehwiki.org/wiki/Scripts_%26_Tools) | `HentaiVerse_Scripts_%26_Tools` | 2026-08-27 | 2 | **極高**：官方認可的第三方腳本與試算表清單（標註支援 HV 0.86 或 HV 0.91）及 2025 Season 2 自動化禁令邊界 |
| [HentaiVerse Advice](https://ehwiki.org/wiki/HentaiVerse_Advice)、[HentaiVerse Advice Advanced](https://ehwiki.org/wiki/HentaiVerse_Advice_Advanced)、[Play Styles](https://ehwiki.org/wiki/Play_Styles) | `Advice` | 2026-09-14 / 2026-07-29 | 2 / 4 / 0 | **高**：新手與進階流派配裝、配點、技能循環與經濟建議 |
| [HentaiVerse FAQ](https://ehwiki.org/wiki/HentaiVerse_FAQ)、[HentaiVerse Hotkeys](https://ehwiki.org/wiki/HentaiVerse_Hotkeys)、[HentaiVerse Bugs & Errors](https://ehwiki.org/wiki/HentaiVerse_Bugs_%26_Errors)、[Known Bugs](https://ehwiki.org/wiki/Known_Bugs)、[Bans](https://ehwiki.org/wiki/Bans) | `Bugs` | 2026-09-15 / 2026-09-18 / 2026-09-30 | 1 / 2 / 1 / 0 / 1 | **高**：常見問題、全鍵盤操作快捷鍵對照表、已知遊戲錯誤與違規處罰條款 |

> **附註：其餘分類頁面說明**
> - `Category:HentaiVerse` 另有 **21 個獨立競技場挑戰條目**（如 `First_Blood`、`Fresh_Meat`、`Graduation`、`A_Rolling_Stone`、`Growing_Storm`、`Power_Flux`、`Killzone`、`Endgame`、`Eternal_Darkness`、`To_Kill_a_God`、`Eve_of_Death`、`The_Trio_and_the_Tree`、`End_of_Days`、`A_Dance_with_Dragons`、`Dreamfall`、`New_Wings`、`Road_Less_Traveled`、`Longest_Journey`、`Dark_Skies`、`Exile`、`Sealed_Power`），其數據已全數彙整於 [Arena](https://ehwiki.org/wiki/Arena) 主頁表格中。
> - 另有 **63 個 `Bazaar/The_Armory/{Modify,Organize,Purchase,Repair,Salvage,Sell,Soulbind}/*` 子頁**，均為導向 [The Armory](https://ehwiki.org/wiki/The_Armory) 的 UI 路徑別名頁。
> - 多數核心頁面另有 `/Chinese` 與 `/Russian` 翻譯子頁（如 `The_Armory/Chinese`、`Equipment_Ranges/Chinese`、`Action_Speed/Chinese` 等，見 Wayback CDX 索引），可作為中文專有名詞譯名的官方對照來源。

---

## 二、GitHub 開源專案／Userscripts／資料表與公開論壇清單

本次透過 `gh search repos`、`gh search code` 與 `gh api` 盤點並讀取原始碼驗證，排除個人歷史專案與無關同名專案（例如 C++ HandleVector 實驗專案 `vittorioromeo/Experiments` 經查 `Random/newHV.cpp` 為資料結構縮寫 `HVStat`，與 HentaiVerse 無關），共確認 **19 個具實質考證價值的第三方 GitHub 公開儲存庫**。

### 2.1 裝備數值、範圍表、鍛造與 Stat Fusion 逆推工具（5 個 Repo）

| Repo 名稱與連結 | 最後更新日 (`pushed_at`) | 星星數 | 內含硬編碼公式、常數與資料檔 | 可交叉驗證之後續票券 |
|---|---|---|---|---|
| [anon962/AmyBotV2](https://github.com/anon962/AmyBotV2)（及前端 [anon962/AmyBotV2-web](https://github.com/anon962/AmyBotV2-web)） | 2026-09-02 | 0 | 1. `server/src/server/lib/infer_equip_stats.py`：含 **v0.91 品質骰值範圍表 `_TIER_RANGES`**（Crude `1–40` 至 Peerless `200`、Ultimate `200–250`）、百分位計算式，以及 **Stat Fusion 最小／最大成本與溢位點數分配公式**（`_calc_fusion_stats`，含武器 `15k/20k`、稀有防具 `15k/100k`、普通防具 `5k/20k`、法杖 `25k/20k` 乘數與每點 10 Bindings 計算）。<br>2. `server/src/server/lib/parse_equip_name.py`：完整 v0.91 裝備品質（含 Ultimate）、22 種前綴、12 種防具材質（含 Kevlar/Reactive/Gossamer/Ironsilk/Drakehide）、武器與後綴解析器。<br>3. `server/src/server/test/stubs/equip_html/ranges.py`（**2.11 MB**）：完整備份自 `reasoningtheory.net/viewranges` 的全裝備基底×品質×前後綴最小／最大屬性範圍 JSON 字典。 | `003`（裝備品質、v0.86 與 v0.91 範圍表、Stat Fusion 公式）、`004`（拍賣與樂透價格） |
| [SukkaW/AmyBot](https://github.com/SukkaW/AmyBot) | 2021-05-13 | 0 | `classes/scrapers/equip_scraper.py`：含 **v0.86 鍛造與 IW 附魔逆推公式**（`_unforge` 與 `_unenchant`）：<br>- 升級係數 `forge_coeff = 1 + coeff * math.log(0.1 * level + 1)`（ADB/MDB 之 `coeff = 0.279575`，其餘 `0.2`）<br>- IW Butcher/Archmage 乘數 `1 + 0.02 * level`、Overpower `+1.92/lv`、Penetrator `+4/lv`<br>- PXP0 品質加成 `quality_bonus = (pxp_zero - 100) * (base_multiplier / 25)`<br>- 全裝備基底平均 PXP0 查表（`_get_pxp_zero`）與 40 項屬性 `base_multiplier`（`_get_base_multiplier`）完整常數表。 | `003`（v0.86 鍛造公式、PXP0 表、屬性基礎乘數、IW 附魔公式） |
| [Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse) | 2026-06-08 | 1 | 1. `hvUtils.js`（sssss2 著 **HV Utils v4.0.0** 完整原始碼，11,035 行 / 505 KB）：<br>- L1225–1527：全裝備分類、33 種基底、品質、前後綴映射表、**Peerless 最大基礎屬性表 `$equip.pmax`** 與 **`$equip.ppxp` 基準表**。<br>- L1360–1410：**42 項裝備屬性的完整參數表 `$equip.stats`**（含 `scale` 等級縮放分母、`fluc` 波動係數、對應 `forge` 名稱、對應 `binding` 名稱、對應 IW `potency` 名稱與每級 `plus` 加成、多件裝備加算 vs 乘算標記 `multi: true`）。<br>- L1755–1835：完整的 `$equip.forge`、`$equip.unforge` 與二分逼近反推基礎 PXP 的 `$equip.calcpxp` 公式 `ceil(1000 * ((1 + pxp0/1000)^n - 1))`。<br>- L5866–6417 & L10442–11035：裝備店拆解產出公式 `_es.salvage_mats`、v0.86 50/100 級鍛造材料階梯表 `_up.set`、鍛造經驗與拆解 90% 返還計算器 `_up.salvage_calc`。<br>- L6440–6841：神殿獻祭與獎勵篩選邏輯。<br>2. `autobattle/docs/battle-mechanics.md` 與 `autobattle/src/battle/`：實測驗證的 Orbital Friendship Cannon（ID `1111`、200 OC、50 回合冷卻）、OC 近戰三連技（Shield Bash `2201` 25 OC -> Vital Strike `2202` 50 OC -> Merciful Blow `2203` 100 OC）、法術與寶石 DBID 表（`tables.ts`）。<br>3. `equip_chinese_2.js` 與 `hv_chinese.js`：完整中英裝備詞綴與介面術語字典。 | `002`（OC 技能、法術/道具 DBID、多件裝備屬性疊加規則）、`003`（裝備縮放、鍛造材料表、PXP 公式、拆解公式）、`004`（商店與神殿機制） |
| [jaredsohn/userscript](https://github.com/jaredsohn/userscript)（Userscripts.org 歷史鏡像） | 2014-07-08 | 66 | 1. `scripts/1/186487.user.js`（**Hentaiverse Equipment Comparison v0.6.3.3**，1,648 行 / 95 KB，另有早期版本 `103444`、`168119`、`173494`、`182848`、`182890`、`186486`）：<br>- L229–939：內建 `Cruncher.scalingFactors` 與 700 行硬編碼 `compareBaseData` 基準數據表（涵蓋所有武器、法杖、盾牌、布／輕／重甲各部位在 Exquisite 至 Peerless 的基準數值）。<br>- L982–1170：PXP 計算式 `lv1PXP * Math.pow(1 + lv1PXP / 1000, level - 1)` 與品質星級評分公式。<br>2. `scripts/1/115209.user.js`（HVSTAT v4.3.3）、`scripts/1/136789.user.js`（Hentaiverse Shop System v0.6.5）、`scripts/4/402402.user.js`（HV Trading Assistant For Auction）。 | `003`（裝備基礎數值表、等級縮放因子與 PXP 公式交叉驗證） |
| [anon962/IwLog](https://github.com/anon962/IwLog) 與 [anon962/HvPytils](https://github.com/anon962/HvPytils) | 2023-03-23 / 2023-06-15 | 0 | `src/iw-log.ts` 與 `hvpytils/classes/equip_parser.py`：Item World 強化紀錄追蹤與裝備頁面 HTML 結構解析器。 | `003`（IW 與裝備解析） |

### 2.2 戰鬥模擬器、戰鬥日誌解析與統計工具（5 個 Repo）

| Repo 名稱與連結 | 最後更新日 (`pushed_at`) | 星星數 | 內含硬編碼公式、常數與資料檔 | 可交叉驗證之後續票券 |
|---|---|---|---|---|
| [anon962/HvSim](https://github.com/anon962/HvSim) | 2023-06-15 | 0 | Python 撰寫之 HentaiVerse 戰鬥模擬器原型：<br>- `classes/simulator.py`：基於 `PriorityQueue` 的 `next_action_time` ATB 行動時間軸佇列模擬。<br>- `classes/entities/entity.py`（L87–135）：實作 `deal_damage` 完整判定鏈（Accuracy Roll -> Evasion Roll -> Crit Roll -> Mitigation `damage *= 1 - target['mitigation']` -> 3 次獨立 Resist 檢定 `eff_resist = target['resist'] * (1 - self['counter_resist'])` 對應 `[0, 0.5, 0.75, 0.9]` 減傷階梯）。<br>- `config/mob_config.yaml`、`config/player_config.yaml`、`config/buff_config.yaml`。 | `002`（ATB 佇列模型、命中／閃避／暴擊／減傷／三次抗性檢定階層 `[0, 50%, 75%, 90%]` 驗證） |
| [anon962/HvLogV3](https://github.com/anon962/HvLogV3)（另有舊版 `HvLog`、`HvLogV2`） | 2026-08-28 | 2 | 支援 **HV v0.91** 的戰鬥日誌解析與收益統計系統：<br>- `src/lib/v91/v91.ts`、`src/lib/v91/_parsers.ts`、`src/lib/v91/_summarizeCombat.ts`、`src/lib/v91/_summarizeMonsters.ts`：完整定義 v0.91 所有玩家與敵方戰鬥事件文法（`P_HIT`、`E_ATTACK`、`E_ATTACK_PARTIAL`、`E_MISS_1..5`、`E_S_ABSORB`、`E_SPELL_HIT`、`E_SKILL_HIT`、暴擊／擦傷 Glanced／部分抵抗 Partial Resist／吸收 Absorb）。<br>- `src/lib/stats/dropStats.ts`、`itemUsageStats.ts`、`combatStats.ts`：全掉落物分類（Consumables、Materials、Scrolls、Shards、Trophies、Equips）與消耗統計。 | `002`（v0.91 戰鬥事件模型與判定結果分類）、`003`（戰鬥模式結算類型）、`004`（戰利品掉落與消耗品收支統計） |
| [GaryMcNabb/HVSTAT](https://github.com/GaryMcNabb/HVSTAT) | 2015-02-08 | 17 | 經典 HVSTAT v5.x 完整原始碼（`data/hvstat.user.js` 5,735 行 + `data/scripts/*.js`）：<br>- `hvstat.user.js` L330–465：完整戰鬥類型、難度、掉落物分類、怪物種族（13 種）、技能類型、傷害類型、防禦迴避類型（Evade/Parry/Block/Resist）與 Debuff 常數定義。<br>- `data/html/proficiency-table.html` 與 `data/json/drops-display-table.json`：熟練度與掉落統計表格結構。<br>- 戰鬥回合與持續狀態（Channeling、Regen、Heartseeker、Hastened、Protection、Shadow Veil、Spirit Shield、Spark of Life 及敵方 Debuff）倒數計時追蹤邏輯。 | `002`（Buff/Debuff 持續回合與觸發訊息解析、熟練度追蹤）、`003`（掉落物分類表） |
| [Kuan-Lun/hv-bie](https://github.com/Kuan-Lun/hv-bie) | 2026-08-27 | 0 | HentaiVerse 戰鬥頁面 HTML 結構化解析器（Python Dataclasses）：<br>- `hv_bie/types/models.py`、`hv_bie/parsers/core.py`、`SRS.md`、`API_SPEC.md`：精確定義戰鬥畫面左欄（HP/MP/SP/OC、作用中 Buff 與剩餘回合、快捷列、技能／法術／道具可用狀態与冷卻）、中欄戰鬥日誌、右欄怪物列表（名稱、MID、PL、HP 比例、作用中 Debuff）的資料契約。<br>- `hv_bie/types/system_monsters.py`：系統怪稀有度（Rare / Legendary / Ultimate）名稱對照表。<br>- `tests/fixtures/hv/The HentaiVerse*.htm`：真實戰鬥頁面靜態 HTML 測試樣本。 | `002`、`008`（戰鬥畫面 UI 狀態資料結構與完整欄位規格） |
| [Kuan-Lun/hvbattle](https://github.com/Kuan-Lun/hvbattle) | 2026-10-07 | 0 | `formal/HVBattle/Model.lean` 與 `src/hvbattle/contracts.py`：以 Lean 4 形式化驗證建模 HV 戰鬥回合階段狀態機（`absent` / `challenge` / `notReady` / `active` / `nextFloor` / `complete`）。 | `002`、`009`（戰鬥狀態機邊界與回合轉移契約） |

### 2.3 自動戰鬥決策與技能／狀態常數工具（5 個 Repo）

| Repo 名稱與連結 | 最後更新日 (`pushed_at`) | 星星數 | 內含硬編碼公式、常數與資料檔 | 可交叉驗證之後續票券 |
|---|---|---|---|---|
| [MeiYongAI/JPX-Revanced](https://github.com/MeiYongAI/JPX-Revanced) | 2026-08-02 | 3 | `JPX-Revanced.user.js`（v26.08.01.1，支援 HV v0.91 `battleVersion: 20251216`）：<br>- 內建各大流派（OneHanded / TwoHanded / DualWield / Staff Mage）完整支援法術、藥水、Draught、Gem、Scroll、Spirit Stance 與攻擊／Debuff 優先序規則表。<br>- 完整列出敵方異常狀態名稱（`Imperiled`, `Weakened`, `Searing Skin`, `Freezing Limbs`, `Turbulent Air`, `Deep Burns`, `Breached Defense`, `Blunted Attack`, `Bleeding Wound`, `Stunned`）與冷卻／持續時間追蹤。 | `002`（v0.91 技能與元素特效衍生 Debuff 名稱、冷卻與流派循環） |
| [dodying/UserJs](https://github.com/dodying/UserJs) | 2024-08-19 | 500+ | `HentaiVerse/` 目錄下共 12 支獨立 Userscripts：<br>- `hvAutoAttack/hvAutoAttack.user.js`（214 KB）：含技能／法術／道具 ID 表、MP/OC 消耗計算、怪物威脅權重與異常狀態回合表。<br>- `hvTrainer.user.js`：全部 15 項 Training 課程 ID（`50`–`98`）與訓練時數表。<br>- `hvIW.user.js`：全部 18 種 v0.86 IW Potency 附魔清單與階層規則。<br>- `hvMonsterStats.user.js`：Monster Lab 士氣（Morale <= 110）與 Chaos Token 升級花費讀取邏輯。<br>- `hvShrine.user.js`：Shrine 物品 ID 區間（`<30000` 換能量/水晶、`30000–70000` 選 `1–7` 裝備分類）規則。<br>- `hvChallenge.user.js`：7 階難度（Normal 1 至 PFUDOR 7）切換參數。 | `002`（Training ID 與時數、戰鬥技能 ID）、`003`（IW 附魔清單、Monster Lab 升級）、`004`（Shrine 物品 ID 與兌換分類規則） |
| [neko-para/HVAuto](https://github.com/neko-para/HVAuto) | 2023-03-05 | 9 | `AI.js`、`AIParser.js`、`hvauto.js`、`zh_CN.js`：基於規則 DSL 的戰鬥行動解析與中英技能狀態對照。 | `002`（戰鬥技能與狀態解析） |
| [phena109/hv-auto-play](https://github.com/phena109/hv-auto-play) | 2020-12-30 | 2 | `src/index.js`：戰鬥血量／魔力／靈力門檻判斷與自動施法邏輯。 | `002`（基礎戰鬥迴圈） |
| [thiliapr/hentaiverse_script](https://github.com/thiliapr/hentaiverse_script)（及 [hentaiverse_battle_bot](https://github.com/thiliapr/hentaiverse_battle_bot)） | 2026-09-25 | 2 | `utils/constants.py`、`utils/battle.py`、`battle_bot.py`：Python 戰鬥狀態解析與法術／技能 ID 常數表。 | `002`（戰鬥常數對照） |

### 2.4 怪物資料庫與全量 JSON 數據庫（3 個 Repo + 2 個公開 JSON 端點）

| Repo 名稱與連結 | 最後更新日 (`pushed_at`) | 星星數 | 內含硬編碼公式、常數與資料檔 | 可交叉驗證之後續票券 |
|---|---|---|---|---|
| [SukkaW/hentaiverse-monster-database](https://github.com/SukkaW/hentaiverse-monster-database) | 2026-10-21 | 11 | 社群標準怪物資料庫 Monorepo（前端 [hv-monster.skk.moe](https://hv-monster.skk.moe)）：<br>- `packages/types/index.d.ts`：定義 `MonsterClass`（13 大種族 + Common/Rare/Legendary/Ultimate）、`MonsterAttack`（3 物理 + 6 元素 + Void）、`plvl`、三物理抗性（`piercing`, `crushing`, `slashing`）與六元素抗性（`cold`, `wind`, `elec`, `fire`, `dark`, `holy`）完整 Schema。 | `003`（怪物種族、攻擊屬性與九系抗性資料結構） |
| [SukkaLab/hv-monster-data](https://github.com/SukkaLab/hv-monster-data) | 2026-10-21 | 1 | 每日 UTC 23:00 自動匯出的全量怪物掃描 JSON 數據庫：<br>- [persistent.json](https://hv-monsterdb-data.skk.moe/persistent.json)（13.5 MB，實測含 **44,431 筆怪物完整數據**）<br>- [isekai.json](https://hv-monsterdb-data.skk.moe/isekai.json)（10.6 MB，Isekai 怪物完整數據）<br>可直接統計各怪物種族（Arthropod、Avion、Beast、Celestial、Daimon、Dragonkin、Elemental、Giant、Humanoid、Mechanoid、Reptilian、Sprite、Undead）在不同 PL 下的真實抗性分布與攻擊型態比例！ | `003`（怪物種族數值、抗性分布與隨機怪生成參數的實證母體） |
| [SukkaW/hv-monsterdb-userscript](https://github.com/SukkaW/hv-monsterdb-userscript) 與 [SukkaW/hentaiverse-util-api-userscript](https://github.com/SukkaW/hentaiverse-util-api-userscript) | 2026-08-26 / 2022-04-15 | 8 / 6 | `src/lib/parseLog.ts`、`src/lib/monster.ts`：Scan 技能戰鬥日誌解析規則，以及會改變怪物當前抗性顯示而影響 Scan 準確度的 Debuff 清單（`imperil`, `firedot`, `coldslow`, `elecweak`, `windmiss`, `holybreach`, `darknerf`）。 | `002`（元素 DoT 與 Imperil 對怪物抗性的扣減效應）、`003`（Scan 解析） |

### 2.5 綜合指南、漢化字典與市場數據工具（4 個 Repo）

| Repo 名稱與連結 | 最後更新日 (`pushed_at`) | 星星數 | 內含硬編碼公式、常數與資料檔 | 可交叉驗證之後續票券 |
|---|---|---|---|---|
| [KesaubeEire/HentaiVerse101](https://github.com/KesaubeEire/HentaiVerse101) | 2024-04-04 | 38 | `README.md`：高星中文新手全流程指南，涵蓋小馬雕像集齊解鎖 Orbital Friendship Cannon（12–24 小時跨日觸發）、四大戰鬥模式定位（Arena 4 倍金錢與掉率、Ring of Blood 消耗 Token 打 Boss 與 Lv.200+ 每日刷 FSM、Grindfest 消耗多餘精力、Item World 升裝備）、1H 重甲劍盾開荒至 300–400 級之裝備詞綴選擇與訓練路線。 | `003`（戰鬥模式獎勵倍率與開荒進程）、`004`（小馬雕像解鎖 OFC 流程與前期經濟循環） |
| [indefined/UserScripts](https://github.com/indefined/UserScripts) | 2023-05-20 | 170+ | `HVTranslate/HentaiVerse汉化.user.js`（308 KB）與 `HV 物品装备汉化.user.js`（50 KB）：完整收錄全遊戲技能、法術、天賦、狀態說明原文、裝備前後綴與物品說明文（tooltip description）的英文原文與中文對照字典。 | `002`、`003`、`004`（全遊戲英文 Tooltip 原文與中文譯名標準字典） |
| [EhTagTranslation/EhSyringe](https://github.com/EhTagTranslation/EhSyringe) | 2026-08-01 | 500+ | `src/services/ui-translation/data/hathperks.ts`：完整收錄所有 Hath Perks 的英文標題、英文原始效果描述與中文翻譯。 | `004`（Hath Perks 清單與效果驗證） |
| [anon962/HvData-server](https://github.com/anon962/HvData-server) 與 [anon962/HvForumAuctions](https://github.com/anon962/HvForumAuctions) | 2023-06-15 | 0 | `src/server/classes/parsers/lottery_parser.py`、`super_parser.py`：樂透開獎紀錄與高階裝備拍賣價格結構解析器。 | `004`（樂透與市場經濟數據） |

### 2.6 官方百科認證之公開論壇關鍵討論帖與第三方資料庫索引
根據 [Scripts & Tools](https://ehwiki.org/wiki/Scripts_%26_Tools)、[Missing Data](https://ehwiki.org/wiki/Missing_Data) 與上述開源工具內嵌引用，以下為原版社群核心機制與工具出處（若需查閱歷史貼文，可透過 Wayback Machine 輸入對應 URL）：
- **Missing Wiki Data 考證集中串**：[E-Hentai Forums Topic #47834](https://forums.e-hentai.org/index.php?showtopic=47834)
- **官方批准腳本總表（Approved HentaiVerse Scripts）**：[E-Hentai Forums Topic #243546](https://forums.e-hentai.org/index.php?showtopic=243546)
- **HV Utils（sssss2 維護，v4.2.4 支援 HV 0.91）**：[E-Hentai Forums Topic #211883](https://forums.e-hentai.org/index.php?showtopic=211883)（原始碼已鏡像於 `Trendymen/hentaiverse/hvUtils.js`）
- **Live Percentile Ranges（LPR v1.1.0，裝備百分位計算器）**：[E-Hentai Forums Topic #212481](https://forums.e-hentai.org/index.php?showtopic=212481)（其核心逆推公式已移植入 `SukkaW/AmyBot` 與 `hvUtils.js`）
- **Forge Optimizers + Cost Calculators（v1.2.0 鍛造試算表）**：[E-Hentai Forums Topic #65126 Post #4790550](https://forums.e-hentai.org/index.php?s=&showtopic=65126&view=findpost&p=4790550)
- **Mage Score（v2.0.3.2 法師裝備評分）**：[E-Hentai Forums Topic #65126 Post #4941626](https://forums.e-hentai.org/index.php?s=&showtopic=65126&view=findpost&p=4941626)
- **HVSTAT（v5.7.1 戰鬥統計）**：[E-Hentai Forums Topic #79552](https://forums.e-hentai.org/index.php?showtopic=79552)（原始碼見 `GaryMcNabb/HVSTAT`）
- **Monsterbation（v1.4.1.3 支援 HV 0.91）**：[E-Hentai Forums Topic #211039](https://forums.e-hentai.org/index.php?showtopic=211039)
- **jpx（v2026.08.26 支援 HV 0.91）**：[E-Hentai Forums Topic #290507](https://forums.e-hentai.org/index.php?showtopic=290507)（分支原始碼見 `MeiYongAI/JPX-Revanced`）
- **ReasoningTheory 裝備範圍資料庫**：`https://reasoningtheory.net/viewranges`（完整 `data-itemranges` 2.11 MB JSON 已備份於 `anon962/AmyBotV2` 的 `server/src/server/test/stubs/equip_html/ranges.py`）

---

## 三、各子系統來源覆蓋矩陣（交叉驗證與已知空白缺口）

下表整合全部 16 個子系統的一手百科來源、二手開源程式碼來源、雙重以上交叉驗證狀態，以及在公開索引階段即識別出的**第一手公式缺口（供 Ticket `005` 收斂）**與**多人市場依賴（供 Ticket `004`／`006` 收斂）**：

| # | 子系統名稱 | 下游票券 | 一手來源（ehwiki 頁面） | 二手交叉驗證來源（GitHub Repo / 檔案） | 覆蓋度與可信度 | 公開索引階段已確認之空白缺口或版本分歧 |
|---|---|---|---|---|---|---|
| 1 | **角色主屬性與衍生屬性** | `002` | [Character Stats](https://ehwiki.org/wiki/Character_Stats)、[Leveling Up](https://ehwiki.org/wiki/Leveling_Up)、[Level Table](https://ehwiki.org/wiki/Level_Table)、[Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles) | `Trendymen/hentaiverse` (`hvUtils.js` L1684–1700 裝備多件乘算/加算規則)、`dodying/UserJs` (`hvCharacterStats.user.js`) | **雙重以上驗證（極高）**：六圍轉化係數、Lv.1–500 升級 EXP 公式與查表、四大流派副手與反擊公式完全公開 | 無明顯缺口；僅需確認多件裝備 `multi: true` 屬性（Mitigation/Evade/Block/Parry/Resist/Crit/Speed/Mana Conservation）之递減乘算 `1 - Π(1 - v_i/100)` 與角色基礎值疊加順序 |
| 2 | **熟練度（Proficiencies）** | `002` | [Proficiencies](https://ehwiki.org/wiki/Proficiencies)、[Learning Curves](https://ehwiki.org/wiki/Learning_Curves) | `GaryMcNabb/HVSTAT` (`hvstat.user.js`、`proficiency-table.html`)、`Trendymen/hentaiverse` (`hvUtils.js`) | **部分驗證（中高）**：熟練度對抗性穿透（`prof_factor * 50%`）、加速因子與 MP 減免公式有明確記載 | **已知缺口**（明列於 [Missing Data](https://ehwiki.org/wiki/Missing_Data#Other)）：**每行動基礎熟練度經驗（Proficiency Gain Rate）之精確常數**未公開，需於 `005` 制定最小規則 |
| 3 | **天賦樹（Abilities）與訓練（Training）** | `002`、`004` | [Abilities](https://ehwiki.org/wiki/Abilities)、[Training](https://ehwiki.org/wiki/Training) | `indefined/UserScripts` (`HentaiVerse汉化.user.js` 完整天賦原文)、`dodying/UserJs` (`hvTrainer.user.js` 15 項課程 ID 與時數) | **雙重以上驗證（極高）**：21 張天賦表與 15 項訓練課程之 AP/Credits/時間/效果全部公開 | Training 在原版為真實世界小時倒數（1h–24h），單機環境需在 `004`/`006` 決定採回合推進、戰場數推進或即時時鐘 |
| 4 | **ATB 行動速度與時間軸** | `002` | [Action Speed](https://ehwiki.org/wiki/Action_Speed) | `anon962/HvSim` (`classes/simulator.py` 優先佇列模型)、`Kuan-Lun/hvbattle` (`Model.lean`) | **雙重驗證（高）**：ATB 延遲公式 `100 / (1 - cast_speed) / action_speed / prof_speed_mult * (1 + haste)` 與主動作基礎速度已公開 | [Action Speed](https://ehwiki.org/wiki/Action_Speed) 與 [Missing Data](https://ehwiki.org/wiki/Missing_Data#Other) 標註少數特殊動作之基礎 Action Speed 帶有 `?`，需於 `002`/`005` 核對 |
| 5 | **物理傷害、暴擊與武器特效（Procs）** | `002`、`003` | [Physical Damage](https://ehwiki.org/wiki/Physical_Damage)、[Damage](https://ehwiki.org/wiki/Damage)、[Damage Types](https://ehwiki.org/wiki/Damage_Types)、[Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs) | `anon962/HvSim` (`entity.py`)、`anon962/HvLogV3` (`_summarizeCombat.ts`)、`Trendymen/hentaiverse` (`battle-mechanics.md`) | **雙重以上驗證（極高）**：ADB 公式、乘區、減傷公式、招架／格擋／閃避順序、武器 Stun/Bleed/Penetration/Elemental Strike 觸發率與 DoT `ADB * DOT% * 0.25` 皆公開 | [Missing Data](https://ehwiki.org/wiki/Missing_Data#Skills) 指出部分主動近戰技能的精確隱藏係數或等級成長需與 [Skills](https://ehwiki.org/wiki/Skills) 表格比對確認 |
| 6 | **魔法傷害、抗性穿透與法術系統** | `002` | [Spells](https://ehwiki.org/wiki/Spells)、[Spell Damage](https://ehwiki.org/wiki/Spell_Damage)、[Damage](https://ehwiki.org/wiki/Damage) | `anon962/HvSim` (`entity.py` 三次獨立抗性檢定 `[0, 0.5, 0.75, 0.9]`)、`SukkaW/hv-monsterdb-userscript` (`monster.ts`)、`Trendymen/hentaiverse` (`tables.ts`) | **雙重以上驗證（極高）**：MDB 公式、EDB 乘區、各法術獨立係數、三次獨立 Resist 檢定（減傷 50%/75%/90%）與 Counter-Resist 穿透公式完全一致 | [Spells](https://ehwiki.org/wiki/Spells) 中少數高階元素 DoT（Searing Skin / Freezing Limbs 等）的觸發率與倍率欄位標有 `?`，[Missing Data](https://ehwiki.org/wiki/Missing_Data#Skills) 亦提問 Focus 是否仍影響抗性率 |
| 7 | **Spirit Stance、Overcharge 與狀態堆疊** | `002` | [Spirit & Overcharge](https://ehwiki.org/wiki/Spirit_%26_Overcharge)、[Overcharge](https://ehwiki.org/wiki/Overcharge)、[Spirit Stance](https://ehwiki.org/wiki/Spirit_Stance)、[Skills](https://ehwiki.org/wiki/Skills) | `Trendymen/hentaiverse` (`battle-mechanics.md` 實測 OC 10 點=250、OFC 200 OC + 50 回合 CD、盾擊 25 OC -> 要害 50 OC 疊 5 層流血 -> 慈悲 100 OC 斬殺)、`MeiYongAI/JPX-Revanced` | **雙重以上驗證（極高）**：SP 上限與回復公式、OC 獲取與消耗、OFC 與 OC 近戰三連技機制皆有百科與實測雙重佐證 | 無明顯缺口 |
| 8 | **裝備基底、品質、詞綴與數值範圍表** | `003` | **v0.91**：[Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics)、[The Armory](https://ehwiki.org/wiki/The_Armory#Ranges)<br>**v0.86**：[Equipment Basics](https://ehwiki.org/wiki/Equipment_Basics)、[Equipment Ranges](https://ehwiki.org/wiki/Equipment_Ranges) 及四子頁、[Level Scaling](https://ehwiki.org/wiki/Level_Scaling)、[Peerless PXP Table](https://ehwiki.org/wiki/Peerless_PXP_Table)、[Burden](https://ehwiki.org/wiki/Burden)、[Interference](https://ehwiki.org/wiki/Interference) | `anon962/AmyBotV2` (`infer_equip_stats.py`、`parse_equip_name.py`、`ranges.py` 2.11 MB JSON)、`Trendymen/hentaiverse` (`hvUtils.js` `$equip.stats` / `$equip.pmax` / `$equip.ppxp`)、`jaredsohn/userscript` (`186487.user.js` 700 行 `compareBaseData`)、`SukkaW/AmyBot` (`equip_scraper.py`) | **三重以上驗證（極高）**：無論採用 v0.86 浮點數範圍表（`ranges.py` + ehwiki 四子頁 + `hvUtils.js`）或 v0.91 正規化 `0–250` 骰值表（`Detailed_Equip_Characteristics` + `infer_equip_stats.py`），皆有完整機器可讀數據 | 1. **版本抉擇**：需於 `003` 決定採用 v0.86（22 基底）或 v0.91（33 基底 + 0–250 正規化骰值）。<br>2. **已知缺口**：[Missing Data](https://ehwiki.org/wiki/Missing_Data#Equipment) 指出非傳奇裝備的 PAB（主屬性加成）出現機率，以及 v0.91 部分新基底後綴權重尚有 `?` |
| 9 | **鍛造、強化、附魔／護符、拆解與融合** | `003` | **v0.91**：[The Armory](https://ehwiki.org/wiki/The_Armory)<br>**v0.86**：[The Forge](https://ehwiki.org/wiki/The_Forge)（2024-05 快照） | **v0.91**：`anon962/AmyBotV2` (`infer_equip_stats.py` Stat Fusion 成本與溢位演算法)<br>**v0.86**：`Trendymen/hentaiverse` (`hvUtils.js` `_up` 50/100 級升級材料表、PXP 公式、90% 拆解返還)、`SukkaW/AmyBot` (`_unforge` / `_unenchant`)、`dodying/UserJs` (`hvIW.user.js`) | **雙重以上驗證（極高）**：v0.86 對數升級公式與材料曲線、v0.91 線性 +1%/+2% 升級成本表、23 種 Charms、3 種 Pouches、Stat Fusion 演算法與拆解產出皆完整公開 | v0.91 [The Armory](https://ehwiki.org/wiki/The_Armory#Repair) 的新版能量（Energy）每回合精確耗損常數標為 WIP，但 v0.86 [The Forge](https://ehwiki.org/wiki/The_Forge#Repair) 的耐久耗損率與修理公式則完全明確 |
| 10 | **五大戰鬥模式（RE / Arena / RoB / GF / IW）与 The Tower** | `003` | [Battles](https://ehwiki.org/wiki/Battles)、[Random Encounter](https://ehwiki.org/wiki/Random_Encounter)、[Arena](https://ehwiki.org/wiki/Arena)、[Ring of Blood](https://ehwiki.org/wiki/Ring_of_Blood)、[Grindfest](https://ehwiki.org/wiki/Grindfest)、[Item World](https://ehwiki.org/wiki/Item_World)、[The Tower](https://ehwiki.org/wiki/The_Tower) | `KesaubeEire/HentaiVerse101` (`README.md` 4 倍 Arena 掉率與金錢說明)、`dodying/UserJs` (`hvChallenge.user.js`, `hvIW.user.js`)、`anon962/HvLogV3` (`metaStats.ts`) | **雙重驗證（高）**：Arena 全挑戰清單、GF 1,000 波與水晶公式、RoB 規則、RE 冷卻皆明確 | **已知缺口**（見 [Missing Data](https://ehwiki.org/wiki/Missing_Data#Item_World) 與 [Item World](https://ehwiki.org/wiki/Item_World)）：IW 中裝備品質對怪物強度加成的精確量化百分比，以及 v0.91 IW 波數與 World Seeds 入場費對照表尚未完全寫入百科 |
| 11 | **怪物種族、能力縮放、系統 Boss 與 AI 選招** | `003` | [Monster Stats](https://ehwiki.org/wiki/Monster_Stats)、[System Monsters](https://ehwiki.org/wiki/System_Monsters)、[Enemy Procs](https://ehwiki.org/wiki/Enemy_Procs) | `SukkaLab/hv-monster-data` (`persistent.json` **44,431 筆怪物實測數據**、`isekai.json`)、`SukkaW/hentaiverse-monster-database`、`Kuan-Lun/hv-bie` (`system_monsters.py`) | **數值極高、AI 選招缺口**：怪物六圍與 PL 縮放公式、系統 Boss 全數值、44,431 筆真實怪物抗性分布均具備 | **已知缺口**：原版伺服器端的**怪物每回合選招權重（普攻 vs 技能／法術之機率）與單波怪物數量／種族生成權重**未在百科公開，需於 `003` 標記並交 `005` 制定最小真實規則 |
| 12 | **戰利品掉落判定（Loot Drop Rolls）** | `003`、`004` | [Loot Drop Rolls](https://ehwiki.org/wiki/Loot_Drop_Rolls)、[Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics)、[Grindfest](https://ehwiki.org/wiki/Grindfest) | `GaryMcNabb/HVSTAT` (`hvstat.user.js` 掉落統計模型)、`anon962/HvLogV3` (`dropStats.ts`) | **部分驗證（中高）**：裝備部位權重（`9/3/3/3/15/15/15`）、武器前綴權重（`20/15/15/15/15/10/10`）、Magnificent/Legendary/Peerless 難度基礎掉率與 GF 水晶掉率公式已公開 | **已知缺口**（明列於 [Missing Data](https://ehwiki.org/wiki/Missing_Data#Loot_Drop_Rolls)）：Collectibles、Happy Pill、低階競技場 Token 掉率、Tokenizer Hath Perk 對 Chaos/Blood Token 比例的精確提升量、怪物階級對 Credit 掉落乘數標有 `?` |
| 13 | **貨幣體系（Credits / Hath / Tokens / ISK）** | `004` | [Currency](https://ehwiki.org/wiki/Currency)、[Credits](https://ehwiki.org/wiki/Credits)、[Hath](https://ehwiki.org/wiki/Hath)、[Hath Perks](https://ehwiki.org/wiki/Hath_Perks)、[ISK](https://ehwiki.org/wiki/ISK) | `EhTagTranslation/EhSyringe` (`hathperks.ts` 全 Perk 原文)、`Trendymen/hentaiverse` (`hvUtils.js`) | **雙重驗證（極高）**：所有貨幣用途與 Hath Perks 價格／效果完全公開 | **單機斷鏈點**：Hath 在原版主要來自 E-Hentai 主站 H@H 掛機、捐款或玩家市場以 Credits 收購；單機環境需於 `004`/`006` 設計本地取得途徑（如 Shrine、成就、Bazaar 固定匯率兌換或里程碑獎勵） |
| 14 | **商店（Bazaar Item/Equip Shop）與多人市場（Market / MoogleMail）** | `004` | [Bazaar](https://ehwiki.org/wiki/Bazaar)、[Items](https://ehwiki.org/wiki/Items)、[The Market](https://ehwiki.org/wiki/The_Market)、[MoogleMail](https://ehwiki.org/wiki/MoogleMail)、[The Armory](https://ehwiki.org/wiki/The_Armory#Purchase) | `Trendymen/hentaiverse` (`hvUtils.js` `$price` / `_es`)、`dodying/UserJs` (`hvBazaarList.user.js`) | **雙重驗證（極高）**：全品項官方買賣價格與無限／有限庫存規則完全公開 | **單機重大斷鏈點**：[Bazaar](https://ehwiki.org/wiki/Bazaar) 與 [The Armory](https://ehwiki.org/wiki/The_Armory#Purchase) 明文記載：Item Shop 中非綠字商品（水晶、材料、碎片、Bindings、Catalysts、Energy Drink、Last Elixir、Happy Pill、獎盃、收藏品）與 Equipment Shop 的所有裝備**在原版「僅來自其他玩家出售給商店，系統不會自行生成」**，且小馬雕像集齊解鎖 OFC、高階鍛造材料與同基底傳奇裝備（供 Stat Fusion）在原版高度依賴玩家市場交易（[The Market](https://ehwiki.org/wiki/The_Market)）。直接照搬至純單機會導致商店空倉與融合材料斷鏈，必須於 `004` 完整盤點並在 `006` 建立單機自給規則（參考原版 Isekai 模式的無市場調整） |
| 15 | **神殿（Shrine）與每日樂透（Lottery）** | `004` | [Shrine](https://ehwiki.org/wiki/Shrine)、[The Lottery](https://ehwiki.org/wiki/The_Lottery) | `Trendymen/hentaiverse` (`hvUtils.js` L6440–6841, L10202–10440)、`dodying/UserJs` (`hvShrine.user.js`)、`anon962/HvData-server` (`lottery_parser.py`) | **雙重驗證（極高）**：Shrine 獻祭階層、物品 ID 區間與獎勵池、Lottery 彩券價格與獎品結構皆公開 | **單機斷鏈點**：原版 Lottery 為全服玩家共同買票抽 1 件頭彩裝備（[The Lottery](https://ehwiki.org/wiki/The_Lottery)）；單機環境無其他玩家買票，需於 `004`/`006` 轉化為單機固定機率抽獎或保底池 |
| 16 | **魔物實驗室（Monster Lab）與跨日事件（Dawn of a New Day）** | `004` | [Monster Lab](https://ehwiki.org/wiki/Monster_Lab)、[Dawn of a New Day](https://ehwiki.org/wiki/Dawn_of_a_New_Day) | `dodying/UserJs` (`hvMonsterStats.user.js`)、`Trendymen/hentaiverse` (`hvUtils.js` L6936–8298 Monster Lab 完整管理模組) | **部分驗證（中高）**：槽位成本、創怪、餵食、Chaos Token 升抗性、跨日扣士氣與回禮門檻（PL 500/750 等）有記載 | **已知缺口**（明列於 [Missing Data](https://ehwiki.org/wiki/Missing_Data#Monster_Lab)）：訓練降低士氣／飽食度消耗之精確百分比（疑似 5%）、水晶回復士氣二次曲線公式（疑似 `-0.0003x^2 + 2.6805x + 554.01`）、PL 對禮物機率影響與他人遭遇觸發機制在單機環境需於 `004`/`005`/`006` 轉化 |

---

## 四、給後續決策票（`002`／`003`／`004`）的具體檢索指引

1. **Ticket `002`（角色／熟練度／技能／戰鬥公式考證）**：
   - **一手百科必讀**：[Character Stats](https://ehwiki.org/wiki/Character_Stats)、[Experience Points](https://ehwiki.org/wiki/Experience_Points)、[Leveling Up](https://ehwiki.org/wiki/Leveling_Up)、[Level Table](https://ehwiki.org/wiki/Level_Table)、[Proficiencies](https://ehwiki.org/wiki/Proficiencies)、[Action Speed](https://ehwiki.org/wiki/Action_Speed)、[Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles)、[Abilities](https://ehwiki.org/wiki/Abilities)、[Skills](https://ehwiki.org/wiki/Skills)、[Spells](https://ehwiki.org/wiki/Spells)、[Spell Damage](https://ehwiki.org/wiki/Spell_Damage)、[Physical Damage](https://ehwiki.org/wiki/Physical_Damage)、[Damage](https://ehwiki.org/wiki/Damage)、[Spirit & Overcharge](https://ehwiki.org/wiki/Spirit_%26_Overcharge)、[Stamina](https://ehwiki.org/wiki/Stamina)。
   - **二手程式碼必對照**：[anon962/HvSim](https://github.com/anon962/HvSim)（`classes/entities/entity.py` 命中／閃避／暴擊／減傷／3 段抗性檢定）、[Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse)（`hvUtils.js` L1684–1700 裝備屬性加算與乘算規則、`autobattle/docs/battle-mechanics.md` OC 技能與 OFC 實測規則）、[MeiYongAI/JPX-Revanced](https://github.com/MeiYongAI/JPX-Revanced)（`JPX-Revanced.user.js` 流派技能循環與 Debuff 列表）。
2. **Ticket `003`（裝備／詞綴／鍛造／戰鬥模式與怪物考證）**：
   - **一手百科必讀**：[Detailed Equip Characteristics](https://ehwiki.org/wiki/Detailed_Equip_Characteristics)（v0.91）、[The Armory](https://ehwiki.org/wiki/The_Armory)（v0.91）、[The Forge](https://ehwiki.org/wiki/The_Forge)（2024-05 快照，v0.86）、[Equipment Ranges](https://ehwiki.org/wiki/Equipment_Ranges) 與四子頁（v0.86）、[Level Scaling](https://ehwiki.org/wiki/Level_Scaling)、[Equipment Procs](https://ehwiki.org/wiki/Equipment_Procs)、[Burden](https://ehwiki.org/wiki/Burden)、[Interference](https://ehwiki.org/wiki/Interference)、[Monster Stats](https://ehwiki.org/wiki/Monster_Stats)、[System Monsters](https://ehwiki.org/wiki/System_Monsters)、[Loot Drop Rolls](https://ehwiki.org/wiki/Loot_Drop_Rolls)、[Arena](https://ehwiki.org/wiki/Arena)、[Ring of Blood](https://ehwiki.org/wiki/Ring_of_Blood)、[Grindfest](https://ehwiki.org/wiki/Grindfest)、[Item World](https://ehwiki.org/wiki/Item_World)。
   - **二手程式碼與數據必對照**：[anon962/AmyBotV2](https://github.com/anon962/AmyBotV2)（`infer_equip_stats.py`、`parse_equip_name.py`、`ranges.py` 2.11 MB 全裝備範圍表）、[Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse)（`hvUtils.js` L1225–1835 裝備 42 屬性縮放與鍛造公式、L10442–10750 升級材料與拆解計算器）、[SukkaW/AmyBot](https://github.com/SukkaW/AmyBot)（`equip_scraper.py`）、[jaredsohn/userscript](https://github.com/jaredsohn/userscript)（`scripts/1/186487.user.js`）、[SukkaLab/hv-monster-data](https://github.com/SukkaLab/hv-monster-data)（`persistent.json` 44,431 筆怪物數據）。
3. **Ticket `004`（經濟循環與多人市場依賴考證）**：
   - **一手百科必讀**：[Bazaar](https://ehwiki.org/wiki/Bazaar)、[Items](https://ehwiki.org/wiki/Items)、[Shrine](https://ehwiki.org/wiki/Shrine)、[The Lottery](https://ehwiki.org/wiki/The_Lottery)、[The Market](https://ehwiki.org/wiki/The_Market)、[MoogleMail](https://ehwiki.org/wiki/MoogleMail)、[Monster Lab](https://ehwiki.org/wiki/Monster_Lab)、[Credits](https://ehwiki.org/wiki/Credits)、[Hath](https://ehwiki.org/wiki/Hath)、[Hath Perks](https://ehwiki.org/wiki/Hath_Perks)、[Dawn of a New Day](https://ehwiki.org/wiki/Dawn_of_a_New_Day)、[Isekai](https://ehwiki.org/wiki/Isekai)。
   - **二手程式碼必對照**：[Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse)（`hvUtils.js` 商店、神殿、魔物實驗室、樂透模組）、[dodying/UserJs](https://github.com/dodying/UserJs)（`hvShrine.user.js`、`hvTrainer.user.js`、`hvMonsterStats.user.js`）、[KesaubeEire/HentaiVerse101](https://github.com/KesaubeEire/HentaiVerse101)（`README.md`）、[EhTagTranslation/EhSyringe](https://github.com/EhTagTranslation/EhSyringe)（`hathperks.ts`）。

# 005 補值常數表（重做版）

- 產出日期：2026-10-22
- 取代對象：`tickets/005-missing-mechanics-minimal-authentic-fill.md` 第 2 節的 17 項常數（Gemini 版）。舊票只用來確認「要處理哪些項目」，舊值不當證據。
- 來源根目錄：`sources/`（下文 `parsed_wiki/X.md:行號`、`ehwiki_pages/X.html:行號`、`data_gh/X:行號`）。`parsed_wiki` 有幾頁整頁擠在第 15 行，引用時以「行號＋原文短引」定位。
- 頁面日期：0.91 上線日是 2026-06-08（`HentaiVerse.md:14`）。早於這天的頁面只能代表舊世代。本表用到的舊頁有：`Monster_Stats`（2025-11-13）、`Monster_Lab`（2025-05-07）、`Loot_Drop_Rolls`（2025-02-28）、`Burden`（2021-06-18）、`Enemy_Procs`（2014-09-22）、`Repair`／`The_Forge_202605`（2024-05-29）。日期取自各 HTML 的「last edited on」。

## 原則

使用者 2026-10-22 定的原則（逐字）：

> 「能推能查的當然要優先，最後真的無法決定的就用 skill 的好玩導向。也就是原版復刻優先，但不要求要 1:1。」

每個值依序走三層，停在第一個成立的層：

1. **原文**：ehwiki 明文，或開源工具實作（附檔名、行號、原文短引）。工具實作另標「（工具）」，因為那是作者的估算，不是遊戲公式。
2. **反推**：用其他已知公式、範例數字、相鄰物品的相對標記推出值，或把範圍縮窄。表內寫出推導過程。如果反推只縮出範圍、沒有定出單一值，就在範圍內取一個值，並註明「區間內取值」。這種情況層級仍記為反推。
3. **暫定**：前兩層都定不了值時，依技能包 `genres/rpg` 的原則決定，標「暫定，可玩後實測調整」。技能原文：`SKILL.md`（以下簡稱 RPG）與 `references/stats-combat-quests.md`（以下簡稱 RPG-ref），2026-10-22 用 `gh api` 讀取。

硬限制：任何值都不得超出原文給的範圍。

### 統計

原本的 17 項 GAP 拆成 55 個值（拆分理由寫在各列），2026-10-22 另補 006-E1 一項，共 56 個：

| 層級 | 項數 |
|---|---|
| 原文（含「工具」2 項） | 18 |
| 反推 | 21 |
| 暫定 | 17 |
| 合計 | 56 |

稽核判為「原文已有」的 4 項（002-04、002-05、002-07、002-10）都直接用原文，並修正抄錯：002-04 的節點數是 75，不是 76；002-07 的 Defend 回 25%，不是 10%。

### 引用的 RPG 原則（暫定值的依據）

- R1「Treat every number as a starting point to tune against playtests, not a law.」（RPG-ref:3–4）
- R2「keep early levels fast (reward in minutes) and stretch later ones … telegraph the next unlock to pull players forward.」（RPG-ref:67–68）
- R3「Drop rates / economy | reward cadence | Avoid trivializing shops with loot.」（RPG:51）
- R4「Stat→derived scaling | build diversity | One attribute shouldn't dominate.」（RPG:48）
- R5「Runaway XP/damage numbers … Pick a curve and a formula family deliberately.」（RPG:106–107）
- R6「Content as code … Define items, enemies, and quests as data」（RPG:108–109）

---

## 主表

| 編號 | 項目 | 採用值或範圍 | 層級 | 依據 | 跟 Gemini 舊值差異 |
|---|---|---|---|---|---|
| 002-01a | 玩家物理／魔法命中的屬性係數 | 物理命中 = DEX×0.05 + 熟練度加成 + 裝備；魔法命中 = WIS×0.05 + 熟練度加成 + 裝備（單位是 %） | 反推 | 同頁兩處互相矛盾：公式寫「Physical Attack Accuracy = DEX * 0.05 + proficiency_bonus + …」（`ehwiki_pages/Character_Stats.html:269`），屬性清單寫「1 point = +0.5 to Attack Accuracy」（`:207`）。採用 0.05 的理由：怪物同類係數是「Every 25 points raises Magic Accuracy by 1%」＝0.04／點（`Monster_Stats.md:40`），和 0.05 同量級，0.5 則大了 10 倍；遊戲面板也把命中顯示成「% hit chance」（`data_gh/hvUtils.js:3784`） | 舊值是「100 + 0.05×DEX/WIS」。**刪掉 100**，原文沒有這個基底；**補回熟練度項**，舊值漏了 |
| 002-01b | 迴避判定結構 | 每次攻擊，Evade、Block、Parry 各擲 2 次，Resist 擲 3 次。物理攻擊成功 0／1／2 次 → 傷害 ×1／×0.5／×0；Resist 成功 0～3 次 → 減傷 0／50／75／90%。不存在獨立的「命中骰」 | 原文 | 「All avoidance stats are rolled twice with the opponent's accuracy or magic accuracy as a counter-stat, except for Resist which is rolled 3 times」（`Damage.md:99`）；倍率表在 `Damage.md:79–95,105–113` | 舊值是「命中率 vs 迴避率」的單次檢定，結構不同 |
| 002-01c | 怪物基礎 Evade／Parry／Resist | Evade = 1 − (1 − min(10, AGI/100, (AGI−Lv)/75)/100) × (1 − Chaos Evasion 階數 × 0.5%)。Parry 換成 DEX，Resist 換成 WIS，公式相同 | 原文 | `Monster_Stats.md:65,69,73`。注意：這頁最後編輯是 2025-11-13，早於 0.91 | 舊值是「每 31.4 Avoidance = 1%」，**整條作廢**。31.4 是從註解範例反推的，同一行對魔法是 12.9%，可見不是常數（`data_gh/_parsers.ts:327`） |
| 002-01d | 命中怎麼抵銷迴避（counter-stat 的作用方式） | 有效迴避 = 基礎迴避 × (1 − 攻方命中%)，再用這個機率擲 002-01b 的次數 | 反推（弱） | 原文只說命中是「counter-stat」（`Damage.md:99`），沒給函數。同頁的反迴避例子是相乘關係：「A target with 20% evade will have effective 15% evade against an attacker with 25% anti-evade」（`Damage.md:123`），本表比照這個形式 | 舊版沒有這一層 |
| 002-02a | 熟練度獲取率 | 熟練度 EXP = 戰鬥 EXP × 4 × (1 + 0.1 × Assimilator 階數)，套用和角色等級相同的 EXP 曲線；Assimilator 最多 25 階（3.5 倍） | 原文（工具） | `data_gh/hvUtils.js:4123`「prof_gain = Math.max(0, exp_gain * 4 * (1 + ass * 0.1))」，曲線在 `:4054–4058`；倍率上限見 `Proficiencies.md:189`「up to a maximum of 3.5x」。曲線本身會讓「熟練度比等級低越多，升得越快」，符合 `:191`。這是升級模擬器的估算 | 公式相同。舊票寫「反函數指數曲線」，實際是正向套用同一條 EXP 曲線 |
| 002-02b | 熟練度上限 | **原文衝突，依本表「以較新頁為準」規則暫採新頁**：每升 1 級基礎熟練度上限 +1（`Leveling_Up.md:15`，2026-09-26）；舊頁寫基礎熟練度 ≤ 1.2 × 等級（`Proficiencies.md:201`，2023-01-17）。有效魔法熟練度 ≤ 2 × 等級（`Proficiencies.md:203`） | 原文（兩頁衝突） | 見左欄；兩頁的「上限」是否指同一件事 ? 未確認 | 舊值只採舊頁，未揭露衝突 |
| 002-02c | 黎明（Dawn）保底熟練度 | 每次黎明後的第一場戰鬥，每項熟練度 + max(0, 等級 − 熟練度) × 5%（以「級」計） | 暫定，可玩後實測調整 | 原文只說「based on the gap between the player's current level and their current proficiency; this amount is not affected by anything else」（`Proficiencies.md:195`），沒給數字。5% 是一個看得到、但追不上戰鬥獲取的小補償，用來每天拉玩家回來（R2），起點值可調（R1） | 舊票沒處理這項（稽核 002-02 指出漏列） |
| 002-03 | 雙持副手追擊率（Offhand Strike） | 10 + (DEX + AGI) × 0.01 + DW 熟練度 / 20（%），上限 35% | 反推 | 屬性項是原文：「(DW/Niten only) 100 points = +1% Offhand Strike Chance」（`Character_Stats.md:15`，DEX 與 AGI 各一條）。其餘 4 種有記載的 proc 都是「基礎 + 屬性×係數 + 熟練度/除數，設上限」（`Fighting_Styles.md:68,82,98,155`）。係數 0.01 的兩種是 Overwhelming（5、/20、上限 30）與 Coalesced Mana（10、/20、上限 35）；係數 0.02 的兩種除數是 /10、上限 75～90。所以範圍縮到「基礎 5～10、除數 20、上限 30～35%」，區間內取最近的同係數兄弟 Coalesced Mana 的常數 | **差很大**：舊值是 25 + … + DW/10，上限 75%，照抄的是係數 0.02 的 Counter-Attack 那一族 |
| 002-04 | 天賦節點與 AP | 75 個不重複節點，全滿共 1,278 AP | 原文 | 「It currently takes 1,278 AP to max out all of the available abilities」（`Abilities.md:15`）。節點數是逐一數 `[COLOR:white] / 名稱` 得到的：共 79 列，其中 Niten 是「pseudo-entry」的 4 列（2H Damage、DW Accuracy、2H Parry、DW Crit）重複，扣掉得 75。這也解掉了稽核留下的 `?` | 76 → **75** |
| 002-05a | 負重對攻速加成的折減門檻 | 負重超過 40 開始折減，到 130 完全歸零。折減的是攻速「加成」，不是攻速本身 | 原文 | 「Having burden above 40 reduces any attack speed bonuses, completely removing them at 130 burden.」（`ehwiki_pages/Action_Speed.html:300`，2026-08 版）。反證：`Burden.md:21` 寫「fully eliminates any bonus at 90 burden」，但那頁是 2021 版，以較新的 Action_Speed 為準 | 數字相同。舊票沒揭露 90 和 130 的衝突 |
| 002-05b | 40～130 之間的折減形狀 | 線性：加成 × max(0, 1 − (負重 − 40)/90) | 反推 | 同一個負重對 Evade 的懲罰是線性的：「Reduces evade by 4/3% … fully eliminates evasion at 75 burden」，例子是 50%→約 33.5%（`Burden.md:17–19`），所以比照線性 | 舊值也是線性，但當成原文；這裡改標反推 |
| 002-05c | 負重對 Evade 與物理暴擊的影響（Character_Stats 寫成「f() 尚未發現」） | Evade × max(0, 1 − 負重 × 4/3%)；負重超過 70 時，物理暴擊率 × (1 − 2% × (負重 − 70))，算到負重 120 為止（到 120 時歸零） | 原文＋讀法（原文只寫「decreases physical crit rate by 2%」，相乘或扣百分點未寫明，本表取相乘） | `Burden.md:17,19,23`；`Character_Stats.md:15` 只寫「Where f() is some function that still needs to be discovered」 | 舊票沒處理 |
| 002-06a | Silence 施法的行動速度 | 1.2 | 反推 | Silence 不在行動速度表上。同類減益法術的值都落在 0.8～1.5（Drain 1.2?、Slow/Sleep/Immobilize 1.5?、Weaken/Imperil 0.8?、Blind 1.2?，見 `ehwiki_pages/Action_Speed.html:253–266`），所以範圍縮到 0.8～1.5。區間內取 Blind 的值，因為兩者 MP 都是 18（`Spells.md:196,198`） | 數值相同，層級從「自創」改成「反推」 |
| 002-06b | Confuse 施法的行動速度 | 1.5 | 反推 | 範圍同上。區間內取 Sleep 的值：兩者都有「Base chance of breaking on damage: 90%?」，屬於控制類（`Spells.md:190,192`） | 數值相同，層級改成反推 |
| 002-06c | 切換 Spirit Stance 的行動速度 | 0.2 | 暫定，可玩後實測調整 | 原文只給「<1」（`ehwiki_pages/Action_Speed.html:211–212`）。取 0.2：在沒有施法速度加成時，剛好落在時間單位下限 20（`minmax(20, 10000/action speed, 500)`，同頁 Time Units 段）。切換幾乎不花時間，玩家才會願意依戰況切換（R4 的 build 多樣性） | 數值相同，層級改成暫定 |
| 002-06d | Flee 的行動速度 | 0.8 | 暫定，可玩後實測調整 | 原文給「<1」（`ehwiki_pages/Action_Speed.html:219–220`）；技能頁寫「Fleeing may take a full turn to take effect, during which monsters may still attack」（`Skills.md:35`）。取表上 1 以下最大的既有值 0.8（Weaken/Imperil），保留逃跑時仍會挨打的風險 | **舊值 1.0 違反原文的「<1」**，改成 0.8 |
| 002-07 | Defend 回血 | 消耗 25% Overcharge，回復 **25%** base HP；減傷 25%，持續 2 回合 | 原文 | 「25% Overcharge … is consumed if available to recover 25% base health」（`Skills.md:31`，2026-09-29 版）。反證：`Battles.md:16` 寫「recover 10% base health」，但那頁是 2026-08-06 版，以較新的技能專頁為準 | **10% → 25%**（舊值抄錯） |
| 002-08a | Manehattan Project 的 OFC 倍率 | ×30（不買 perk 是 ×20） | 反推（弱） | ×20 是原文（`Skills.md:131`）。perk 只寫「Significantly boosts」（`Hath_Perks.md:54`）。同一份 wiki 用「significantly」描述的幅度：Flower Vase 是 +25%，Bubble Gum 是 +100%（`Items.md:146–147`），所以範圍縮到 ×25～×40。區間內取 ×30：+50% 打得出明顯感受，又不至於數字失控（R5） | 舊值 ×35，也在範圍內；這裡改取 ×30 |
| 002-08b | Flower Vase 的傷害與持續時間 | 傷害 +25%，持續 50 ticks | 原文 | 「+25% damage」（`Items.md:147`）；持續時間欄是 `rowspan="2"` 的「50 ticks」，和 Bubble Gum 共用（`ehwiki_pages/Items.html:294`） | 舊值沒寫持續時間 |
| 002-08c | Flower Vase 的命中與迴避／抵抗 | 物理／魔法命中 +25%，Evade／Resist +25% | 反推 | 原文用同一句話描述傷害、命中與迴避／抵抗：「Your attack/magic damage, attack/magic accuracy, and evade/resist chance increases significantly」（`Items.md:147`），句中只給了傷害 +25%，所以其他兩項取同一個幅度。`Missing_Data.md:39` 確認這幾項沒有實測值 | 命中 +25% 相同；迴避 +10% → **+25%** |
| 002-08d | Flower Vase 的暴擊 | 不加暴擊 | 暫定，可玩後實測調整 | 道具頁的效果清單沒有暴擊（`Items.md:147`），只有 `Missing_Data.md:39` 把暴擊列成未知。不加暴擊，讓 Vase（穩定）和 Bubble Gum（約 95% 暴擊，`Items.md:146`）在定位上分得開（R4） | 舊值 +10%，**刪除** |
| 002-09a | Spark of Life 法術版的 SP 消耗 | 觸發時消耗 25% base SP；SP 不足就觸發失敗 | 反推 | 法術版的消耗「和 base SP 成正比」：「increase the spirit cost of Spirit Shield (and Spark of Life) proportionately」（`Spells.md:235`）。卷軸版是「Consumes 25% of base spirit」（`Items.md:137`）。進階攻略也寫「SoL will not be recast if you are below 25%」（`HentaiVerse_Advice_Advanced.md:335`）。比例係數取卷軸版的 25% | 數值相同，改成有出處的反推 |
| 002-09b | Spark of Life 法術版觸發後剩餘的 HP | 1 HP | 反推 | 原文：「Any attack that would one-shot a target with more than 1 HP leaves it alive but on the brink of defeat」（`Spells.md:224`）。條件特別排除「剩 1 HP 的目標」，只有在觸發後剛好留 1 HP 時才需要這條，它用來防止連續觸發。卷軸版是 50%（`Items.md:137`），兩者本來就不同 | **10% → 1 HP** |
| 002-09c | Cloak of the Fallen | 觸發當回合剩餘攻擊全部免疫；之後 3 ticks 內物理與魔法減傷 +75% | 原文 | `Spells.md:226`（持續欄是「3?」，帶問號）；`Damage.md:53`「Cloak of the Fallen - 75%」 | 相同；這裡補上 +75% 減傷 |
| 002-10 | Hell 難度的 EXP 倍率 | ×7 | 原文 | `HentaiVerse_Settings.md:11`「Hell | x7」 | 相同。舊票說「hvUtils 一致」掛錯了出處：那行是 IW 的 PXP 表 |
| 003-01a | 各品質的 base roll 範圍（所有基底通用，含新的 11 種） | Crude 0–40、Fair 30–70、Average 60–100、Superior 90–130、Exquisite 120–160、Magnificent 150–180、Legendary 170–200、Peerless 200、Peerless+ 201–249（較新的 `Detailed_Equip_Characteristics.md:117`，2026-10-09；`The_Armory.md:433` 寫 200–249）、Ultimate 250 | 原文（兩頁差 1，採較新頁） | `The_Armory.md:430–441`；`Detailed_Equip_Characteristics.md:109–118` | 舊值是拿 2020 年 `ranges.py` 的絕對數值去插值，**整套換掉**。0.91 先擲品質、再在 0–250 的尺度上擲 base roll |
| 003-01b | Dagger、Swordchucks、Scythe 的傷害類型與 proc | 三種都是 Slashing，proc 是 Bleeding Wound | 原文 | `Damage_Types.md:46,52,56,62`；`Obsolete_Items.md:273–277` | 舊報告寫 Dagger 是 Piercing、特效「?」，**改正** |
| 003-01c | 7 種舊世代有資料的基底（Dagger、Swordchucks、Scythe、Ebony、Tower、Gossamer、Kevlar），各屬性相對參考基底的方向 | 照 ▲▼ 方向。例：Dagger 傷害 ▼▼、命中 ▲▲、暴擊 ▼、格擋 ▲、負重 ▼▼；Scythe 傷害 ▲▲▲、命中 ▼▼、暴擊 ▲、負重 ▲▲、干擾 ▲；Tower 物防 ▼▼、魔防 ▼▼、負重 ▲▲、干擾 ▲、Block ▲▲ | 反推 | `Obsolete_Items.md:271–313`。這些類型是「復活」，不是新增。參考基底取同部位、同風格的現役類型：Dagger 對 1H、Swordchucks 對 2H（現行頁列在 Two-Handed，`Detailed_Equip_Characteristics.md:310,320`；舊頁 `Obsolete_Items.md:256` 寫 One-handed，採現行頁）、Scythe 對 Longsword、Ebony 對現役法杖、Tower 對 Kite、Gossamer 對 Cotton、Kevlar 對 Leather。wiki 沒寫 ▲▼ 是相對於誰，參考基底的選法是推定 | 舊值是「±5～10% 插值」，沒有用到 ▲▼ |
| 003-01d | 一個箭頭代表的幅度 | 每個 ▲／▼ 代表 ×1.10／×0.90，可以疊加（▲▲▲ = ×1.30）；▬ 和參考基底相同；● 表示有這項但幅度未知，先比照參考基底 | 暫定，可玩後實測調整 | wiki 沒有圖例。取 10% 是因為一個箭頭的差異要在角色面板上看得出來，又不會讓某一種基底一面倒（R4） | 舊值 ±5～10% |
| 003-01e | 沒有舊資料的 4 種：Drakehide、Chain、Ironsilk、Reactive | 先照抄最接近的同部位基底：Drakehide ← Leather、Chain ← Plate、Ironsilk ← Cotton 但物防比照 Kevlar 的 ▲、Reactive ← Power（Reactive 和 Power 一樣，拆解給 5 個 Core，屬於稀有級：`The_Armory.md:523`） | 暫定，可玩後實測調整 | `Obsolete_Items.md` 只有「Dragon Hide」「Chainmail」兩個名稱（`:289,295`），沒有 ▲▼ 列；Ironsilk、Reactive 完全沒有舊資料。照抄現役基底，資料最少、也最容易在實測後單獨調整（R1、R6） | 舊值同樣是插值，這裡改成明確照抄 |
| 003-02a | 新防具材質的前綴權重 | Ironsilk：Reinforced 20%。Kevlar：Reinforced 20%。Reactive：Mithril 20%。Chain：Mithril 10%、Reinforced 10%。以上四種另加通用元素前綴 80%（Ruby/Cobalt/Amber/Jade 各 15、Zircon/Onyx 各 10）。Gossamer、Drakehide 沒有專屬前綴，元素前綴等比例放大到 100%：四種各 18.75%、兩種各 12.5% | 反推 | 6 種已知材質的「專屬前綴＋通用元素前綴」加起來都剛好是 100%：Cotton 20+80、Leather 20+80、Shade 20+80、Plate 20+80、Power 20+80、Phase 30+70（`Detailed_Equip_Characteristics.md:185–209`）。所以新材質的專屬前綴合計是 100 − 80 = 20%。有兩個專屬前綴的 Chain，比照同樣有兩個的 Plate，平分成 10／10 | 舊值寫「沿用經典 20%」，總額一致，但沒寫怎麼分配，也沒處理只有元素前綴的材質 |
| 003-02b | Tower 盾的前綴權重 | Reinforced 33.3%、Mithril 66.7% | 反推 | Buckler 和 Kite 都是 Reinforced 25、Agile 25、Mithril 50（`Detailed_Equip_Characteristics.md:164–169`）。Tower 沒有 Agile（`:170–171`），所以保留 25:50 的比例重新歸一 | 舊報告寫 Mithril 50／Reinforced 50 |
| 003-02c | 後綴權重（wiki 標「?」的所有類型） | 在該類型的合法後綴裡均分 | 暫定，可玩後實測調整 | 只有 Shade（10/10/40/40）與 Power（8/8/42/42）有數字（`Detailed_Equip_Characteristics.md:670–673,740–743`），其餘 270 列都是「?」。均分讓每個後綴都有一樣的追求價值（R3）。可替代的選項：仿 Shade／Power，把招牌後綴壓低、通用防禦後綴拉高 | 相同（均分） |
| 003-03a | 普通品質（Crude～Exquisite）的掉落分布 | Normal 難度的權重：Crude 25、Fair 35、Average 30、Superior 8、Exquisite 2。Quality Roll Bonus 乘在 Superior 以上的權重上，再重新歸一；最後套用 003-03b 的難度下限 | 暫定，可玩後實測調整 | `Missing_Data.md:51`「Almost everything to do with PAB rolls」；品質分布沒有任何頁面寫數字。讓 Superior 以上偶爾出現，換裝才有期待感（R3 的掉落節奏），也讓提高難度有實際回報（R2） | 舊值寫「依難度平移」，沒有基礎權重 |
| 003-03b | 高品質的機率與難度限制 | Magnificent 基礎 0.0005%、Legendary 0.00025%；Peerless 在 Hell 是 1/1,000,000、Nintendo 1/333,333、IWBTH 1/200,000、PFUDOR 1/100,000。Quality Roll Bonus ×1～×6。Nightmare 以下不掉 Legendary／Peerless；Nintendo 以上不掉 Fair／Crude，最低 Average；PFUDOR 最低 Superior | 原文 | `Detailed_Equip_Characteristics.md:114–116`；`Loot_Drop_Rolls.md:27`；`HentaiVerse_Settings.md:8–14`。「基礎機率是以每件裝備掉落為分母」是本表的讀法，原文沒寫分母 | 舊值只寫平移 |
| 003-03c | PAB 數量（有明文的部分） | Superior／Exquisite 最多 2；Legendary／Peerless 固定 3，輕甲 4；盾牌從 4 種裡擲 3 種 | 原文 | `Loot_Drop_Rolls.md:31`；`Detailed_Equip_Characteristics.md:115` | Sup/Exq 相同。舊值「Leg+ 全滿」漏了輕甲 4 與盾牌 3/4 |
| 003-03d | 能擲 PAB 的裝備出現 0 個 PAB 的機率 | 5% | 反推 | 原文的兩個點：「Phase has ~3.5% chance of having 0」「Staffs have 5% or 6.25% chance of having 0」（`Loot_Drop_Rolls.md:31`），區間 3.5～6.25%，取 5% | 舊值沒有這一項 |
| 003-03e | Average 與 Magnificent 的 PAB 上限與分布 | Average：0 個 50%、1 個 50%。Magnificent：0 個 5%，1～3 個各約 31.7%。Superior／Exquisite：0 個 5%，1 和 2 各 47.5% | 暫定，可玩後實測調整 | Magnificent 的上限，反推只能縮到 2 或 3（介於 Exquisite 最多 2 和 Legendary 固定 3 之間），取 3，讓 Magnificent 比 Exquisite 多一階期待（R2）。Average 能不能有 PAB，原文沒寫；1 個以內的 PAB 讓低品質也偶有亮點 | 舊值是 Avg 0–1、Mag 2–3。Mag 下限從 2 放寬到 0 |
| 003-04a | 戰敗時的耐久損失 | 玩家等級 <100：2%；100–199：5%；200 以上：10%。Repair Bear Mk.4 減半 | 反推 | 數字來自舊版表格（`ehwiki_pages/Repair.html` Losses 表，2024-05）。0.91 頁面的描述完全一致，只是沒附數字：「a set percentage of condition … (depends on player's level). … reduced to half with the Repair Bear Mk.4」（`Battles.md:127`，`Hath_Perks.md:86`） | 舊票沒拆出這一項 |
| 003-04b | 每清一回合的耐久損耗 | 每清 1 回合扣 0.05 點耐久（等級 200 以上），等級 100–199 減半，100 以下不扣；換成百分比 = 0.05 / 該裝備的 Durability。Repair Bear Mk.1～4：×0.5、×0.25、×0.1、×0 | 反推 | 0.91 說損耗是「a fixed rate depending on the equipment Durability and the number of cleared rounds」（`The_Armory.md:490`）。舊版範例：「level 250 that killed 10 monsters on average per round for 1,000 rounds would lose ~50 condition」（`Repair.md:51`）→ 每回合 0.05 點（**隱含前提：每回合平均殺 10 隻怪**；舊版按擊殺數計算，換成按回合計等於固定這個前提）；等級倍率 0／0.5／1 取自同一張舊表。耐久用「目前值／最大值」表示，見 `data_gh/hvUtils.js:2819,2983`。Repair Bear 的倍率是原文（`Hath_Perks.md:83–86`） | 舊值是每殺一隻怪扣固定值的舊模型，**改成依回合與 Durability 計算** |
| 003-04c | 修理成本 | Scrap = 1 + floor((100 − 耐久%) / quality_mod)。quality_mod：Superior 以下 10、Exquisite 6、Magnificent 2.35、Legendary 1.4、Peerless 以上 1.3。稀有級另需 Energy Cell = Scrap / 3 | 反推 | 公式取自舊版（`Repair.md:67–80`，`Repair.md:84`）；0.91 仍寫「Repairs require different Scrap Material」（`The_Armory.md:490`）。Magnificent（原文 2.2–2.5）和 Legendary（1.3–1.5）在區間內取中點。Ultimate 沒有資料，比照 Peerless | 舊值說「沿用舊廢料公式」，但沒給參數 |
| 003-04d | Energy 每回合消耗 | 每清 1 回合扣 0.1% | 暫定，可玩後實測調整 | 原文只說「Energy is consumed at a fixed rate depending on the number of cleared rounds」（`The_Armory.md:492`）。取 0.1%：跑完一場 1,000 回合的 Grindfest（`Grindfest.md:17`），剛好需要充一次 Energy Cell，形成固定的維護節奏（R2、R3） | 數值相同，改標暫定並寫明理由 |
| 003-04e | 裝備賣價 | Average 以下：賣價 = 品質基數（Crude 300、Fair 1,000、Average 2,500）× (1 + 等級/1000)，上限 5,000。Superior 以上：賣價 = 拆解所得材料在 Item Shop 單價（Low 200、Mid 1,000、High 5,000，`Item_Shop.md:15`）× 數量 × 50% | 暫定，可玩後實測調整 | 0.91 的 Sell 段是 WIP（`The_Armory.md:506`）。反推只能給出上限：舊版「Scrap … roundup(sale_value / 100)」最多 50 個（`Repair.md:278`，`The_Armory.md:512`），所以 Average 以下的賣價 ≤ 5,000；而且「always more economical to salvage … rather than sell」（`:512`），所以賣價要低於拆解價值。50% 是為了守住這條，也避免賣裝備比打怪賺錢（R3） | 舊值完全沒定賣價 |
| 003-05a | Legendary Core 換算 Credits | 20,000 C／個 | 原文（工具） | `data_gh/infer_equip_stats.py:100,122,130`「stat_mult = 20_000」，用在「+1 需要 1 個 Core」的路徑。稀有防具在 `:111` 是 100_000，等於 5 × 20,000，和「Shade, Power, Reactive, Phase and Force Shield will give 5 armor cores」（`The_Armory.md:523`）一致。限制：這是 AmyBot 的成本估算器，不是遊戲公式（稽核 003 A-9） | 相同 |
| 003-05b | Peerless Core 換算 Credits | 100,000 C／個（反推範圍 50,000～125,000） | 反推（弱） | 工具裡沒有 Peerless Core 的價格（舊值看錯了 `:111`）。Peerless Core 不能交易（`Items.md:282`），只能拆解 Peerless 取得。假設價格和稀有度成正比：Hell 難度下，Legendary 基礎機率 0.00025% 乘上品質加成 ×1～×2.5，再除以 Peerless 的 0.0001%（`Detailed_Equip_Characteristics.md:115–116`），得到 2.5～6.25 倍 → 50k～125k，區間內取整數 100k | 數值相同，但出處從「看錯工具程式」改成「稀有度比例反推」 |
| 003-05c | Magnificent 與 Legendary 的基礎 Charm Points | Magnificent 30、Legendary 35 | 反推 | 全滿總點數：Legendary 85、Magnificent 70（`HentaiVerse_Advice.md:325,357`）。每通關 1 層 IW、每升 1 級各 +1（`The_Armory.md:101,303`），兩者上限分別是 Leg 25、Mag 20（`:202–233` 升級表）。所以 85 − 50 = 35、70 − 40 = 30 | 舊值是 Leg 4 槽，基礎點數沒定 |
| 003-05d | 其他品質的基礎 Charm Points | Superior 20、Exquisite 25、Peerless 40、Ultimate 45 | 反推（弱） | 用 003-05c 兩點的斜率外插：每升一個品質階 +5。只有兩個資料點，屬於弱反推 | 舊報告（L595）的數字一樣，但自稱的規則（Max_IW + 10）推不出這組數字；這裡改用斜率外插 |
| 003-05e | Charm 槽數 | Superior 2、Exquisite 3、Magnificent 4、Legendary 5、Peerless 6、Ultimate 7 | 暫定，可玩後實測調整 | 反推能給出下限：攻略的 Legendary 配法同時裝 5 個 Charm（例：Voidseeker 15 + Butcher 30 + Penetrator 15 + Economizer 15 + Fatality 10 = 85，`HentaiVerse_Advice.md:327`；副手配法同樣 5 個，`:345`），所以 Legendary ≥ 5；Magnificent 配法裝 3 個（`:359`），所以 Magnificent ≥ 3。Legendary 取下限 5，其餘每差一個品質階就 ±1，讓升品質時看得到新的槽位（R2）。真正限制配法的是點數，不是槽數 | **Leg 4 → 5**（舊值和攻略的 5 Charm 配法衝突）；Peerless/Ult 5 → 6/7 |
| 003-06a | Item World 回合數 | 回合數 = min(30, 5 + 目前 IW 等級)。第 0 層 5 回合，第 25 層以後 30 回合。各品質的 IW 等級上限（Sup/Exq 10、Mag 20、Leg 25、Peerless 30、Ult 33）會限制最多能到幾回合：Sup/Exq 最多 15、Mag 25、Leg 以上 30 | 暫定，可玩後實測調整 | 原文：「Rounds: 5 - 30」「An Item World has rounds based on the equipment's quality and current IW level」（`Item_World.md:19,45`），表格是空的。這個公式用滿整個 5～30 的範圍，品質透過等級上限發揮作用。前幾層短、越後面越長，符合 R2 | **差很大**：舊值是 Sup/Exq 10 → Ult 30，只看品質。最少 10 回合，**違反原文的下限 5**，也沒有依 IW 等級變化 |
| 003-06b | World Seed 數 | Superior／Exquisite 1 顆、Magnificent／Legendary 2 顆、Peerless 以上 3 顆 | 暫定，可玩後實測調整 | 原文只有「Entry Fee: 1 - 3 world seeds」（`Item_World.md:21`）。依品質分三段，越投資的裝備成本越高（R3） | 舊值 Leg 2、Peerless 2 → 這裡 **Peerless 改成 3** |
| 003-06c | IW 的其他規則 | 怪物傷害每回合 +1%、Credits ×1/4、Stamina 進場一次付清、只能用在已 Soulbind 的裝備 | 原文 | `Item_World.md:17,25,27,29`（傷害與 Credits 兩條原文附「(Source?)」） | 舊票沒寫 |
| 003-08a | 收藏品（小馬雕像）的掉落 | 每次古董（Artifact）掉落成功時，有 1% 改成收藏品 | 原文（帶「?」） | 「Collectable Roll | 1%?」（`Loot_Drop_Rolls.md:34`）；「the rarest drop in the game (as a portion of artifact drops)」（`Items.md:244`） | **5% → 1%** |
| 003-08b | 特殊道具的掉落 | 一般道具掉落中 2% 是特殊道具，只有 Bubble Gum 和 Flower Vase 兩種，各占一半 | 反推 | 2% 是原文（`Loot_Drop_Rolls.md:37` I.Type Roll）。特殊道具只有兩種（`Items.md:144–147`）。對半分的依據：Shrine 給這兩種的機率都是 10%（`The_Shrine.md:73,75`） | 舊值是「4 種各 25%」，**種類數錯了** |
| 003-08c | Happy Pill 的掉落 | 在 Food 類掉落（I.Type 10%）裡占 5%，其餘 95% 是 Chow／Edibles／Cuisine，比例依難度：IWBTH 以上 40/30/30 | 暫定，可玩後實測調整 | `Missing_Data.md:61`「Happy Pill drop rate」列為未知。Chow/Edibles/Cuisine 在高難度的 40/30/30 是原文（`Monster_Lab.md:400`）。Pill 一顆能補 6,000 士氣（`Monster_Lab.md:359`），掉率要低，才不會讓商店賣的 2,000 C 失去意義（R3） | 舊值把 Pill 混在「4 種特殊消耗品各 25%」裡 |
| 003-08d | 怪物階級的 Credits 倍率 | 倍率 = 該怪的 HP 倍率：一般怪 1、Boss 11、Konata 16、其他三位 Schoolgirl 26、Tree 21、Trio 26、Rhaegal／Viserion 26、Drogon 50、Real Life 51、IPU 76、FSM 101 | 暫定，可玩後實測調整 | 原文只有「Monster class' effect on credit drops (assumed to be a multiplier on the base amount)」（`Missing_Data.md:95`），以及「~20% chance per monster; amount modified by difficulty setting and battle mode」（`Credits.md:15`）。用現成的 HP 倍率（`System_Monsters.md:154–166`）當倍率：打得越久，拿得越多。整條規則沒有新增任何常數（R5、R6） | **差很大**：舊值是 1／5／10／25 四段 |
| 006-E1 | Lottery 虛擬彩池張數 | 每次開獎固定有 20,000 張虛擬彩券；中頭獎機率 = 玩家張數 ÷ (20,000 + 玩家張數)；2～5 獎照原版依彩池大小縮放，彩池 = 虛擬張數 + 玩家張數 | 暫定，可玩後實測調整 | 原版每天開兩次、每次抽 5 位、每人最多買 20,000 張、2～5 獎依彩池大小縮放且上限 500,000 張（`The_Lottery.md`）。單機沒有其他玩家，彩池只剩虛擬彩券。取 20,000 = 原版每人上限，等於「跟一個每次都買滿的 NPC 競爭」：買滿 20,000 張（2,000 萬 C）約 50%、買 1,000 張約 4.8%。公開資料沒有單機每日 Credits 收入，無法再定價（2026-10-22 使用者拍板） | 舊值 250,000 張（[006](../tickets/006-single-player-self-sufficiency-minimal-adaptation.md) 斷點 E），使用者認為單機過高 |

---

## 怪物 AI 的資料前提（005 M2）

### 1. 怪物池能提供什麼

`persistent_monsters.json`：共 44,431 筆。每筆都只有同樣 17 個欄位：`attack, cold, created_at, crushing, dark, elec, fire, holy, lastUpdate, monsterClass, monsterId, monsterName, piercing, plvl, slashing, trainer, wind`（2026-10-22 用 `json.load` 實測）。

| 子集 | 筆數 | 用途 |
|---|---|---|
| `trainer` 空字串（系統怪，MID 1–32，PL 0；Common 12、Rare 4、Legendary 4、Ultimate 7，含 Yggdrasil MID 30） | 27 | 不放進隨機抽樣。技能與六圍用 `System_Monsters.md` |
| `trainer = Tenboro` | 18（PL 271／452／881 各有幾筆，以及 PL 2250 的 15 筆：PGC 6 隻＋小馬 9 隻） | 不放進隨機抽樣。稽核寫 15 筆，實測 18 筆，多出 3 筆 PL 較低的怪 |
| `trainer = Snowflake`（三隻龍） | 3 | 不放進隨機抽樣 |
| 玩家自創怪 | 44,383（5,247 位 trainer） | 隨機抽樣池。原版的一般戰鬥本來就從這種怪裡抽（`Monster_Lab.md:3`） |

### 2. 技能：從哪裡來，哪些推不出來

- **玩家自創怪**：技能由職業表決定（`Monster_Lab.md:169–230`）。建立時有 1 招（類型同普攻，花 50% MP），PL 200 解鎖第 2 招（50% MP，較強），PL 400 解鎖 SP 技（花 100% SP，最強）。各職業各招的 Power 列在 `:190–230`。
  - 可以完全推定的：Arthropod、Avion、Beast、Elemental、Giant、Mechanoid、Reptilian 這 7 個職業，三招都是固定類型。第 1 招的物理／魔法類型跟著 `attack` 欄位走（`:177`），Elemental 的元素也跟著 `attack`。
  - **推不出來的**：Celestial、Daimon、Dragonkin、Humanoid、Sprite、Undead 這 6 個職業的 PL 200 和 PL 400 技能，可以由玩家選物理或魔法，也能改屬性（`:185`）。池子裡 PL ≥ 200 而且屬於這 6 職業的怪有 **14,302 隻（佔玩家怪 32.2%）**，這部分要暫定。建議做法：用 `monsterId` 當種子，在該職業的合法選項裡固定選一個，讓同一隻怪每次登場都一樣（R6）。
  - 技能名稱：JSON 沒有，玩家改過的名稱也拿不到。沒改名的怪會用預設技能（`:171`），預設名稱同樣沒有資料，需要自訂。
- **系統怪**：MP 技和 SP 技的名稱、物理／魔法類型與 Power，都在 `System_Monsters.md:27–143`。小馬的 Power 欄是空的（`:128–144` 只有名稱和類型），需要暫定。

### 3. 六圍：有規則，但分配推不出來

- **成長規則是原文，而且已驗證**：每投入 1 點，屬性增加起始值的 1/10，但限制在 6～10 之間（`Monster_Lab.md:313`），每項最多 +25 點（`:116`）。職業起始值見 `:299–311`。用這條規則驗算 PGC 6 隻（Tenboro，PL 2250）的六圍（`System_Monsters.md:168–173`），**6 隻 × 6 項全部吻合**，條件是每項都是 25 點。所以小馬的空白六圍可以反推為「職業起始值 + 25 點」。例如 Beast 是 280／315／315／245／180／170，HP 倍率比照 PGC 取 26（`:168–173` 與 Note 1，`:185`）。稽核 003 A-25 判這組小馬數字「沒有出處」，用這條規則可以推出來。
- **總點數可以反推**：PL = 主屬性 PL 加上元素抗性 PL（`Monster_Lab.md:116–119`）。主屬性每項 N 點貢獻 N(6+(N−1)×0.5)/2，元素每項 N 點貢獻 (⌊N/10⌋+1)(⌊N/10⌋×5 + N mod 10)。全滿是 6×225 + 6×150 = 2,250，正好等於 PL 上限（`:163`）。
  - 元素抗性的端點已驗證：PL 2250 的 347 隻玩家怪，6 種元素抗性**全部**等於 ⌊62.5 + 起始抗性/2⌋，也就是滿 50 點時的值。
  - 假設中間是線性，從抗性反推每種元素投入幾點，再用總 PL 扣掉元素 PL，得到主屬性 PL。容許 ±3 時，有 43,193／44,383 = **97.3%** 的怪落在合法區間 0～1350，其餘 1,190 隻不合法，原因可能是抗性資料過舊（`lastUpdate` 最早到 2021 年），或中間不是線性。原文說明抗性曲線的那張圖不在快照裡，只留下圖說「Appears to round down」（`Monster_Lab.md:345`）。
- **六項怎麼分配推不出來**：同一個主屬性總 PL，對應很多種六項組合。暫定做法：六項點數盡量相等，餘數依職業起始值由高到低分配。理由是唯一的官方完整樣本（PGC）是六項全滿、各項相等，而且這樣不會讓單一屬性獨大（R4）。
- **Chaos 升級**：JSON 沒有這項資料，暫定玩家怪的 Chaos 都是 0。Tenboro 的怪依原文「act as if they have maximum Chaos Token upgrades, including doubled health」（`System_Monsters.md:185`）。
- 這個六圍模型用的是 `Monster_Stats.md:31` 的縮放公式 `int(0.01 × base × Lv + Lv^1.076675 × 0.3325)`。這頁是 2025-11 版，早於 0.91；第 29 行還寫著「between ?? and ???」。

### 4. AI 真正需要做選擇的範圍

原文記載的怪物行為，全部是「資源門檻＋機率」：

- 每隻活著的怪，每次行動可以普攻、施法或用 SP 技（`Battles.md:23`）。
- MP 達 50% 才可能用 MP 技（`Battles.md:234`）；PL 400 以上或 Boss 級以上，SP 達 100% 才可能用 SP 技（`:236`）。施放分別消耗 50% MP、100% SP（`Monster_Lab.md:175,181,183`）。
- 每回合自然回復 10%? MP 和 5% SP（`Monster_Stats.md:92`）。換算下來，MP 技最快約 5 回合一次，SP 技約 20 回合一次。
- 被 Silence 時不能用技能和魔法（`Spells.md:198`）。
- PFUDOR 難度「A higher chance to use skills/magic attacks」（`HentaiVerse_Settings.md:14`）。這證明原版有一個「基礎施放機率」，而難度會提高它。
- 只有一個玩家，所以沒有選目標的問題。Confuse 打到自己（25%?，`Spells.md:192`）是狀態效果，不是 AI 的決策。

**Yggdrasil 不需要決策**：
- Absorbing Ward 不是施放的動作，而是「Cast on the 3 goddesses throughout the battle as long as Yggdrasil is alive」（`Enemy_Procs.md:7`）。在 RoB 裡「All monsters benefit from Absorbing Ward if Yggdrasil is alive, even non-Goddesses」（`:31`）。Ward 本身是「被魔法打一次有機率吸收」的效果（`Enemy_Procs.md:5`）。實作上採**被消耗後自動重新施放**：Yggdrasil 活著時，女神身上的 Ward 被吸收後立刻補上，不佔 AI 決策；死了就不再補。「立刻補上」是建模推論，原文只寫 throughout the battle。`Enemy_Procs` 最後編輯 2014-09-22，屬舊頁。
- Healing Roots 在 MP 技欄位，效果是「Heals all other monsters」（`System_Monsters.md:63`），不用挑目標。唯一的變數是「何時施放」，套用上面的 MP 門檻即可。
- 女神死亡時觸發的 Fury、Lamentations、Screams、Wailings（`Enemy_Procs.md:9–23`）屬於事件觸發，也不是 AI 決策。

**所以 AI 的決策空間是**：資源門檻打開時，最多從普攻、MP 技 1～2 招、SP 技裡選一個。暫定的施放機率：

| 條件 | 機率 |
|---|---|
| SP 技可用 | 50% |
| 否則，MP 技可用 | 33%（多招時，從已解鎖的招式中平均隨機選） |
| PFUDOR | 上面兩個機率 ×1.5 |

理由：資源門檻已經限制了施放頻率，不會被技能洗版。50% 讓施放時機難以預測，但 SP 條滿格本身就是看得到的預警（R2 的「telegraph」）。

**跟舊票的關係**：
- 偵測玩家 buff 的 Utility AI 在原文裡沒有任何依據，是刻意偏離原版，稽核 3a 已經指出這點。如果要保留，應該標成「本作新增的高難度選項」，不能當作補齊原版缺口。
- 舊票把 Yggdrasil 寫成「優先補 Ward、其次補血」的選擇行為，照做會讓女神有時沒有護盾，比原版弱。本節改成光環。

### 5. 生怪規則（原文，供抽樣器使用）

- 依 PL 和玩家等級抽怪，偏好接近上限的怪（`Monster_Lab.md:137–144`，上限公式帶「?」）。
- 同一隻自創怪大約每 10 回合最多出現一次；同一位 owner 每回合最多 1 隻；每回合最多 4 個職業（`Battles.md:246–250`）。
- 每回合的怪物數量沒有原文，舊票的「3–8 隻」沒有出處。這一項不在本票的 17 項內，留給後續處理。

---

## 可玩後優先實測（暫定值中最影響手感的前 5 項）

1. **003-06a／b Item World 回合數與種子**：IW 是 0.91 的核心養成迴圈，回合長度直接決定「投資一件裝備」的節奏。
2. **003-03a 普通品質的掉落分布**：決定換裝的期待感有多頻繁，連帶影響 003-04e 的拆解和賣錢收入。
3. **003-08d 怪物階級的 Credits 倍率**：倍率範圍 1～101，一不小心就會讓經濟失衡，對應 R3、R5。
4. **003-05e Charm 槽數**：直接決定 build 的組合空間，以及升品質時有沒有感受。
5. **003-04e 裝備賣價**：和拆解價值一起，決定玩家是「賣」還是「拆」，也決定 Credits 的主要來源。

---

## 反證、限制與翻案條件

- **反推（弱）的 4 項，加上 002-03 用兄弟 proc 縮範圍的做法，最容易翻案**：002-01d、002-08a、003-05b、003-05d。002-03 只有兩個同係數樣本，如果有實測日誌顯示副手追擊率高於 35%，就要改回較寬的範圍。
- **舊頁風險**：002-01c 與怪物六圍模型依賴 `Monster_Stats`（2025-11）和 `Monster_Lab`（2025-05），都早於 0.91。如果 0.91 改了怪物的命中或迴避模型，這些都要重查。`_parsers.ts:327` 的 Scan 範例（Evade 934 → 物理 29.6%）用 2025-11 的公式算不太出來：基礎上限 10%，Chaos 最多 20 階 × 0.5%，合計約 19%。這是一條**不利於 002-01c 的反證**，暗示 0.91 的迴避模型可能已經改成評分制。
- **工具估算**：002-02a、003-05a 來自社群工具的估算，不是遊戲公式。
- **線性假設**：怪物元素抗性只驗證了兩個端點，97.3% 的合法率是在「中間線性」的假設下算出來的。
- **什麼會推翻整張表**：取得 0.91 之後的 Item World、Armory Sell／Repair 新版 wiki 頁，或是實測戰鬥日誌。有這些資料時，所有暫定值與反推（弱）都要依新資料重排，不必維持本表的取值。

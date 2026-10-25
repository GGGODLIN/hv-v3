# Ticket 004：HentaiVerse 經濟循環、商店／神殿／樂透規格與單機環境多人市場依賴斷鏈考證報告

> 2026-10-22 已依 [audits/audit-004.md](../audits/audit-004.md) 修正；修正處附 sources/ 出處。

- **關聯決策票**：`004-economy-loops-and-multiplayer-market-dependencies-audit`
- **前置來源**：[001-public-sources-census.md](/.scratch/hv-v3/wayfinder/findings/001-public-sources-census.md)
- **下游消費票**：`005`（空白機制最小補齊）、`006`（單機自給自足經濟規則拍板）
- **版本基準（Ticket 012 決議）**：以現行 **`v0.91（The Armory）`** 世代為主體，WIP 或過渡處以 **`v0.86（The Forge）`** 補齊並標註差異。
- **查證日期**：2026-10-22
- **Clean Room 邊界聲明**：本報告完全從零檢索公開網路資源（透過 Wayback Machine 鏡像之 `ehwiki.org` 條目與 GitHub 公開儲存庫），未讀取本機任何舊世代專案目錄（`hv-clone`、`hentaiverse-clone-kb`、`CopyVerse`）、未引用本地記憶庫，亦未連線或逆向 `hentaiverse.org` 遊戲伺服器。

---

## 零、執行摘要（Verdict & Key Findings）

### 0.1 核心結論（Verdict）
原版 HentaiVerse（Persistent 模式）並非獨立閉環的單機 RPG 經濟體，而是**依附於 E-Hentai 主站貨幣（Hath、GP）與全服數千名玩家雙向市場（The Market、Bazaar 賣店庫存池、MoogleMail）的開放式多人經濟系統**。若將原版數值與規則一字不改直接搬入純單機環境，將在 **5 個核心環節發生結構性資源斷鏈或進度死鎖**：

1. **斷點 A（Item Shop 非綠字商品與 Equipment Shop 永久空倉）**：
   - 依 [Bazaar](https://ehwiki.org/wiki/Bazaar) 原始 HTML（`oldid=65842`，`<span style="color:#00B000">` 標記）與 [Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse)（`hvUtils.js:9905-9936` `itemshop_list`）雙重驗證，原版 Item Shop **僅 31 項基礎商品為系統無限供應（綠字）**；其餘所有高階消耗品（`Energy Drink`、`Last Elixir`）、全部 6 種 `Infusions`、全部 7 種 `Scrolls`、全部 12 種分級鍛造材料（`Low/Mid/High-Grade`）、全部 4 種稀有材料（`Rares`）、全部 38 種 `Bindings`、全部 `Shards`、`Precursor Artifact`、`Trophies` 與 `Collectibles`，在原版皆規定「**僅由其他玩家賣給商店才產生庫存（上限 9,999），系統不會自行生成**」，且 [The Armory](https://ehwiki.org/wiki/The_Armory#Purchase) 的裝備商店（Purchase）亦規定「**100% 來自玩家售出，系統不生成任何裝備**」。
   - **反證與勘誤（Disconfirming Evidence vs 常見誤解）**：常見印象誤以為「Crystals、Happy Pills、Scrap、Energy Cell 是非綠字，而 Scrolls、Infusions 是綠字」，但檢驗 `Bazaar` 原始 HTML 與 `hvUtils.js:9905` 證實**恰好相反**——`Crystals (Any)`（買價 10 C）、`Monster Food` 三階（15/30/50 C）、`Happy Pills`（2,000 C）、`Scrap` 四種（100 C）與 `Energy Cell`（200 C）在原版實為**綠字無限供應**；反而是 **`Scrolls` 與 `Infusions` 為非綠字有限庫存**（在 v0.91 中，`Infusions` 更是鑲嵌與維修元素 Strike / Proof 護符的必需耗材！）。
2. **斷點 B（Hath 與 GP 外部母體貨幣來源斷絕）**：
   - 原版全部 60 階 HentaiVerse **Hath Perks**（含 Postage Paid 100；總計需 **649,500 Hath**；2026-10-22 稽核更正：原稿寫 46 階／497,700，依 `sources/parsed_wiki/Hath_Perks.md:36-95` 逐列加總為 60 階／649,500，與原稿自己 2.1 表的 60 列一致；其中僅 v0.91 新增的 `Limit Breaker I–V` 就需 **300,000 Hath**，`Dæmon Duality I–IX` 需 **170,000 Hath**，`Follower of Snowflake` 需 **50,000 Hath**，`Manehattan Project` 需 **25,000 Hath**）依賴主站 H@H 掛機、現金捐款（Stars）或在主站 Hath Exchange 向其他玩家用 Credits 收購。單機環境若僅保留遊戲內唯一原生來源——向神殿獻祭 `Precursor Artifact`（20% 機率得 2 Hath，期望值每顆 `0.4 Hath`），玩家必須刷出 **1,623,750 顆 Artifact**（649,500 ÷ 0.4；2026-10-22 稽核更正：原稿 1,244,250 是由錯誤總額 497,700 算出）才能點滿全 Perks，形同鎖死；結論方向不變，缺口比原稿寫的更大。
   - 同理，原版 **The Lottery**（每日武器／防具雙樂透）實際消耗的是主站 **GP（Gallery Points，每張 1,000 GP）**（見 [The Lottery](https://ehwiki.org/wiki/The_Lottery) 與 `hv_chinese.js:3145`），單機環境無主站圖庫下載體系，必須統一折算或改由 Credits 承接。
3. **斷點 C（v0.91 Stat Fusion「同基底同部位傳奇裝」與「指定 Bindings」收斂死鎖）**：
   - v0.91 的 [Stat Fusion](https://ehwiki.org/wiki/The_Armory#Stat_Fusion) 要求犧牲「**相同裝備基底（Template）＋相同部位（Slot）**」的 `Legendary` 或 `Peerless` 裝備（每次各屬性僅 `+1` 或 `+2`），且每次融合每個升級屬性需消耗 **10 個對應 `Bindings`**。33 種基底展開為 **75 個獨立「基底×部位」組合**（? 來源未找到，2026-10-22 稽核：報告 5.x 節另寫「22+20+20+20 = 82 組，扣掉舊基底剩 54–75」，兩處的基底數與組合數對不上；003 報告表列為 21 種武器／法杖／盾牌基底＋12 種防具材質，組合數待重算），單機無全服市場互通有無時，要刷出同一基底同一部位的數十件傳奇裝與數百個特定 Binding 會遭遇極端的組合爆炸（Coupon Collector + 稀疏掉落）。
4. **斷點 D（小馬雕像 Collectibles 27 選 21 解鎖 OFC 的重複抽卡困境）**：
   - 依 [Items](https://ehwiki.org/wiki/Items#Collectables) 與 [Skills](https://ehwiki.org/wiki/Skills#Special_Skills)，遊戲共有 **27 種小馬雕像（Figurines）**，玩家必須在背包中同時持有**至少 21 種不同雕像**（不可獻祭），並經過一段等待（Skills 頁寫「It may take up to one day to become available」，`sources/parsed_wiki/Skills.md:87`）才會解鎖終極 AOE 技能 **Orbital Friendship Cannon（OFC）**。（? 來源未找到，2026-10-22 稽核：原稿寫「由跨日事件 Dawn of a New Day 檢查、12–24 小時」，Dawn 事件清單 `sources/parsed_wiki/Dawn_of_a_New_Day.md:14-38` 沒有 OFC 檢查，「12–24 小時」出自社群教學 KesaubeEire/HentaiVerse101 的 README 第 19 行（原始檔不在 `sources/` 內，只存在於 session 暫存目錄 `gh_raw/HentaiVerse101_README.md`（暫存檔已失效風險），未能以 `sources/` 重驗），「由 Dawn 檢查」這個機制無出處。）單機無法在市場買賣交換重複雕像，且雕像掉落僅佔 Artifact 掉落池的 ~1%（? 來源未找到，2026-10-22 稽核：Collectable Roll 在來源本身即標 `1%?`，`sources/parsed_wiki/Loot_Drop_Rolls.md:34`；原稿 5.4 節另寫「非裝備掉落的 0.01%–0.1%」，同一個量給了兩種詮釋，均未驗證），純靠隨機抽取湊齊 21 種不同款式的期望抽數為 **38.92 隻雕像**（2026-10-22 稽核更正：原稿 36.26，以原稿自己的公式 $\sum_{k=0}^{20} 27/(27-k)$ 重算為 38.92；「27 種等機率」的假設亦無出處；原稿換算的「3,600+ 次 Artifact 級掉落」未驗證）。
5. **斷點 E（The Lottery 全服彩池、Monster Lab 他人遭遇回禮、Training 與 Dawn 真實時間等待）**：
   - 原版 Lottery 的 2–5 獎數量依賴「全服玩家買票總數（500,000 張封頂）」；Monster Lab 的自創魔物禮物（Materials / Bindings / World Seeds）依賴「全服其他玩家在戰鬥中遭遇該魔物並落敗／逃跑」累積勝場；Training 課程動輒耗時真實時間 1–24 小時（全點滿需數千小時真實時間）；Arena / RoB 每日冷卻與 OFC 解鎖綁定 UTC 00:00 跨日。

### 0.2 信心水準與證據基礎
- **信心水準**：**極高（High Confidence）**。（2026-10-22 稽核更正：此評級與全文多處 `?` 標記的 DBID（如 `30036?`、`30041?`）以及本次稽核找到的 8 處數值錯誤不相稱；改為「事實骨架可信、凡報告自行加總推算的數字須逐項重算」。）
- **驅動證據**：所有價格、ID、機率、成本公式與文本皆由 `ehwiki.org`（2026 年 6–10 月 v0.91 快照與 2024 年 5 月 v0.86 快照）及多個獨立 GitHub 開源儲存庫（`Trendymen/hentaiverse`、`EhTagTranslation/EhSyringe`、`anon962/AmyBotV2`、`dodying/UserJs`、`Kuan-Lun/hv-bie`、`indefined/UserScripts`、`KesaubeEire/HentaiVerse101`）交叉核對吻合。
- **推翻條件（Falsification Condition）**：若未來發現官方在 v0.91 後期新增了單機 NPC 商人自動補貨腳本或公開了未記載於 Wiki 的本地離線模式參數，則斷點修補方案應優先採用官方新參數。

---

## 一、全貨幣與全物品（Items & Bazaar）官方價格與庫存屬性總表

### 1.1 全貨幣與代幣（Currencies & Tokens）獲取途徑與消耗出口總表

依據 [Currency](https://ehwiki.org/wiki/Currency)、[Credits](https://ehwiki.org/wiki/Credits)、[Hath](https://ehwiki.org/wiki/Hath)、[ISK](https://ehwiki.org/wiki/ISK)、[Items#Tokens](https://ehwiki.org/wiki/Items#Tokens)、[Items#World_Seeds](https://ehwiki.org/wiki/Items#World_Seeds) 與 [Loot Drop Rolls](https://ehwiki.org/wiki/Loot_Drop_Rolls)，原版所有貨幣與代幣規格如下：

| 貨幣／代幣名稱 | DBID | 可否交易／郵寄／賣店 | 原版官方獲取途徑（Sources） | 原版官方消耗出口（Sinks） | 多人／主站依賴度 |
|---|---|---|---|---|---|
| **Credits (C)** | `0` (pane `credits`) | 可透過 MoogleMail 寄送、Market 存入、賣店獲得 | 1. **擊殺怪物掉落**：未掉落其他物品的怪物有固定 `~20%` 機率掉落 Credits（不受 Scavenger 影響；金額隨難度倍率提升：Normal `1x`、Hard `1.25x`、Nightmare `1.5x`、Hell `1.75x`、Nintendo `2.2x`、IWBTH `3x`、PFUDOR `3x`；RE 為 `3x`、Arena 為 `1x`（但總收益約為 GF/IW 的 4 倍）、GF 與 IW 為 `1/4x`）。<br>2. **戰鬥模式通關獎勵**：Arena 首通（`100`–`50,000 C`）與重刷（`20`–`1,000 C`）、Ring of Blood 首通（`25,000`–`200,000 C`）與重刷（`1,000 C`）、Grindfest 1,000 波完賽（`5,000 C`）。<br>3. **出售戰利品**：向 Bazaar Item Shop 或 Equipment Shop（The Armory Sell）出售道具／裝備，或在 The Market 賣給其他玩家（扣 1% 稅）。<br>4. **Dawn of a New Day**：每日觸發給 `100–500 C`（30 天內有論壇發文則為 `500–1,000 C`，另有 Stars/Awards 加成）。<br>5. **主站／賽季轉入**：Isekai 季末超過 100 萬 ISK 的餘額轉入、主站 GP/Hath Exchange 賣出、Bounty 懸賞。 | 1. **Training 訓練課程**：15 項課程，全部點滿總計約 **5.04 億 Credits**（504,287,546 C；2026-10-22 稽核更正：原稿 4.89 億／489,287,546，依 `sources/parsed_wiki/Training.md:34-64` 逐列加總）。<br>2. **The Armory 鍛造升級（Forging）**：v0.91 每級消耗 `1,000`–`100,000 C`（單件 Peerless 升滿 Lv.30 需 `1,750,000 C`，缺 Core 時還可以 Credits 折抵）。<br>3. **v0.91 Stat Fusion（屬性融合）**：每次融合依裝備類別與當前平均基礎屬性收取高額 Credits（武器 `15k * avg`、法杖 `25k * avg`、稀有防具 `15k * avg`、普通防具 `5k * avg`，缺 Core 另加 `20k–100k * stats`）。<br>4. **Bazaar Item Shop / Equipment Shop / The Market 採購**。<br>5. **MoogleMail 郵資與 CoD 手續費**：每封 `10 C`、CoD 收 `10%`（上限 `1,000 C`，可由 `Postage Paid` Perk 免除）。 | **中**（基礎產出可自給，但原版玩家中前期主要靠在 Market 賣 Trophy / Artifact / 高階材料給老玩家換取數百萬啟動資金，見 `HentaiVerse101`） |
| **Hath** | `0` (pane `hath`) | 可透過 MoogleMail 寄送、Hath Exchange 交易；不可賣給 Item Shop | 1. **神殿（Shrine）獻祭 Artifact**：每顆 `Precursor Artifact` 有 `~20%` 機率獲得 **`2 Hath`**（复活節活動 Artifact 為 `1 Hath`）。<br>2. **主站 Hentai@Home (H@H) 客戶端掛機**或 **Adopt-A-Server**（每槽位每日 `15 Hath`）。<br>3. **主站 Hath Exchange**：以 Credits 向其他玩家按市價收購。<br>4. **Dawn of a New Day**：Silver Star 以上贊助者與特定論壇獎章持有者每日領取。<br>5. **主站論壇活動**：每月 Banner / Tagging 比賽（`300–500 Hath`）、Yuletide 聖誕活動（參加獎 `50 Hath`、抽獎 `200 Hath`）。 | 1. **購買 Hath Perks**：HentaiVerse 專屬 Perks 共 60 個購買階層（2026-10-22 稽核更正：原稿「19 個系列／46 階」），全滿總計需 **649,500 Hath**（原稿 497,700；未含 Gallery Perks 的 `7,600 Hath`，原稿 7,800；`sources/parsed_wiki/Hath_Perks.md:21-95` 逐列加總）。<br>2. 在主站 Hath Exchange 賣出換取 Credits，或透過 MoogleMail 轉讓。 | **極高（致命斷鏈）**：單機無主站 H@H 與玩家交易所，僅靠 Shrine 20% 拿 2 Hath 完全無法支撐 64.95 萬 Hath 的 Perk 樹（2026-10-22 稽核更正：原稿 49.7 萬） |
| **Gallery Points (GP)** | 主站貨幣 | 主站 GP Exchange 可與 Credits 雙向兌換 | 1. 主站上傳圖庫、建立 Torrent、Dawn 每日評論獎勵、H@H、捐款。<br>2. 主站 GP Exchange 用 Credits 購買（或由系統自動以 High Rate 將 Credits 轉為 GP）。 | 1. **The Lottery（每日武器／防具樂透）**：每張彩券價格為 **`1,000 GP`**（每期最多買 `20,000` 張 = `20,000,000 GP`）。<br>2. 主站下載圖庫壓縮檔。 | **極高**：單機無主站 GP，必須將 Lottery 改為直接消耗 Credits |
| **ISK (Isekai Credits)** | 賽季貨幣 | 僅限 Isekai 內 Market 與 CoD（限贊助者寄件） | 1. Isekai 模式下擊殺怪物（`~20%` 機率）、通關 Arena / RoB / Grindfest。<br>2. 上一季 Isekai 結算保留（上限 `1,000,000 ISK`）。 | 1. Isekai 模式的 Bazaar 與 The Armory 消費。<br>2. 季末結算：前 `1,000,000 ISK`（含持有物品與裝備賣店殘值）轉入下季 Isekai，超出部分 `1:1` 轉為 Persistent **Credits**。 | **低**（屬賽季獨立貨幣） |
| **Token of Blood**（鮮血令牌 / Blood Token） | 未公開獨立商品 ID（屬 Token 表） | **不可交易**、不可郵寄、不可賣店 | 1. **一般戰鬥隨機掉落**：當觸發 Loot Drop Roll 且未掉裝備／Artifact 時，進 Token Roll（基礎率 **`0.2%`**，RE 加成 `2.5x`，`Tokenizer I/II/III` Perk 分別提升至 `2x / 3x / 4x`）；Token Roll 命中後，基礎有 **`20%` 為 Token of Blood、`80%` 為 Chaos Token**。<br>2. **Arena 與 Ring of Blood 通關額外獎勵**：Arena 通關有 `15%–25%`（50 回合以上高階 Arena 為 `50%–90%`）機率掉落 Token；RoB 通關依關卡有 `50%–99%` 機率掉落 Token。 | **Ring of Blood（浴血擂台）入場門票**：<br>- Lv.50 Konata：`1` 枚<br>- Lv.75 Mikuru / Ryouko / Yuki：`2` 枚<br>- Lv.100 Real Life：`3` 枚<br>- Lv.150 Invisible Pink Unicorn：`3`（或 `4`）枚<br>- Lv.200 Flying Spaghetti Monster：`5` 枚<br>- Lv.250 Triple Trio And The Tree：`10` 枚 | **無（可完全單機自給）** |
| **Chaos Token**（混沌令牌） | 未公開獨立商品 ID（屬 Token 表） | **不可交易**、不可郵寄、不可賣店 | 1. **一般戰鬥隨機掉落**：Token Roll（基礎 `0.2%`）命中後佔 **`80%`**（`Tokenizer` Perk 會進一步提高 Chaos Token 相對比例）。<br>2. **Arena / Ring of Blood 通關獎勵**。<br>3. **Shrine 獻祭 Artifact**：滿屬性點上限時有 **`10%`** 機率獲得 `1` 枚 Chaos Token。<br>4. **The Lottery 安慰獎**：第 4 名與第 5 名獎項（隨彩池縮放，上限各 `500` 枚）。 | **Monster Lab（魔物實驗室）**：<br>1. **解鎖魔物槽位**：第 $N$ 個槽位需 `ceil(1 + (N - 1)^1.2)` 枚 Chaos Tokens（上限 100 槽，Gold Star 贊助者每次解鎖給 2 槽達 200 槽）。<br>2. **Chaos Upgrades（混沌強化）**：共 12 項屬性（Scavenging、Brutality、Swiftness、Accuracy、Precision、Overpower、Fortitude、Interception、Dissipation、Evasion、Defense、Warding），每項 20 級，升第 $K$ 級需 $K$ 枚（單項滿級 `210` 枚，單隻魔物 12 項全滿需 **`2,520` 枚**；每 5 PL 解鎖 1 級上限，PL 1,005 全解鎖）。 | **低**（雖不可交易，但單機少了 Lottery 安慰獎來源） |
| **Soul Fragment**（靈魂碎片，舊稱 Soul Stone） | `48001` | **不可玩家交易／郵寄**，但**可在 Item Shop 綠字無限購買與賣店** | 1. **Item Shop 無限購買**：買價 **`1,000 C`** / 片（賣店價 `1 C`）。<br>2. **Random Encounter（隨機遭遇）**：通關獎勵有機率獲得 **`5` 片**。<br>3. **Soul Catcher (Hath Perk, 500 Hath)**：每逢 Dawn of a New Day 自動免費獲得 **`10` 片**。<br>4. **The Tower（Isekai 模式）**：每通關一層保底獲得 **`10` 片**。 | 1. **The Armory Soulbind（靈魂綁定裝備）**：公式為 `Base_Cost + Increase * max(Item_Level - Player_Level, 0)`（Crude~Exquisite `100 + 2/lv`、Fine `250 + 2/lv`、Magnificent `250 + 5/lv`、Legendary `500 + 10/lv`、Peerless `1,000 + 20/lv`；Isekai 減半；不可綁定高於自身 100 級以上裝備）。<br>2. **天賦重置（Ability Reset）**。 | **無（Item Shop 綠字無限供應，可完全自給）** |
| **World Seed**（世界種子，v0.91 新增） | 未公開獨立 ID | **不可交易**（非 Market 商品） | 1. **Hard 以上難度戰鬥隨機掉落**。<br>2. **Lv.200 以上 Arena 通關獎勵**：基礎 `20%` 機率掉落，擁有 `Dark Descent` Hath Perk（2,000 Hath）提升至 **`50%`**（`hathperks.ts` 舊譯寫 +30% 即 20%→50%）。<br>3. **Shrine 獻祭 Collectibles（小馬雕像）**：每次獻祭有 **`10%`** 機率額外獲得 `1` 顆 World Seed。<br>4. **Monster Lab 魔物回禮**：禮物池中有 **`5%`** 機率為 World Seed。 | **v0.91 Item World（道具界）入場門票**：每次進入 Soulbound 裝備的 Item World 需消耗 **`1–3` 顆 World Seeds**（依裝備品質與已通關 IW 層數而定）。 | **低**（但受制於 Collectible 與 Monster Lab 產出效率） |
| **Golden Lottery Ticket**（黃金彩券） | 未公開獨立 ID | **不可交易**、不可賣店 | **The Lottery 第 2 名獎項**（唯一來源，依彩池大小發放 `1–10` 張）。 | 於任一期 Weapon / Armor Lottery 使用，自動免費增加 `100` 張彩券並使開獎時有效彩券數翻倍（上限為總彩池的 `10%`）。 | **高**（完全綁定 Lottery 機制） |
| **Peerless Voucher**（無雙憑證） | `30036`? (Trophy 區間) | **不可交易** | 1. **Follower of Snowflake (Hath Perk, 50,000 Hath)**：在 Shrine 累計獻祭 Trophies 每滿 **`10,000,000` (10m) Shrine Value**，獲贈 `1` 張（可追溯 2014-09-27 後的紀錄）。<br>2. **Isekai 賽季排名獎勵**（季末轉入 Persistent）。 | 於 **Shrine** 兌換任意自選主分類（1H / 2H / Staff / Shield / Cloth / Light / Heavy）的 **Soulbound `Peerless` 裝備 1 件**。 | **高**（依賴 50,000 Hath Perk 與海量 Trophy 獻祭） |
| **關於「Badge of Courage」之考證勘誤** | 無 | 不存在於原版 HV | 經全量檢索 `ehwiki.org` 全部 88 篇條目（含 `Items`、`Obsolete_Items`、`Currency`）與全部 19 個 GitHub 儲存庫，**原版 HentaiVerse 歷史上從未存在名為 `Badge of Courage` 的代幣或物品**。唯一帶 `Badge` 字樣的物品是 2011 年愚人節活動發放的特殊 Trophy **`RealPervert Badge`**（Tier 7 Trophy，見 `Obsolete_Items.md:95` 與 `hv_chinese.js:1551`）；而原版早期曾存在的第 4 種 Token 為 **`Token of Healing`**（已廢棄，見 `115209.user.js:73`），競技場與擂台代幣則為 **`Token of Blood`** 與 **`Chaos Token`**。 | 若規格提及 `Badge of Courage`，在引擎實作中應確認為 `Token of Blood` / `Chaos Token` 或外部概念誤植，不另建無根據之貨幣。 | **無（確認為名稱誤植）** |

---

### 1.2 全物品（Items & Bazaar）官方價格、DBID、效果與庫存屬性完整總表

以下整合 [Bazaar](https://ehwiki.org/wiki/Bazaar)（`oldid=65842` 原始 HTML）、[Items](https://ehwiki.org/wiki/Items)（`oldid=65165`）、[The Armory](https://ehwiki.org/wiki/The_Armory)（`oldid=65798`）、[Shrine](https://ehwiki.org/wiki/Shrine)（`oldid=64928`）、[Kuan-Lun/hv-bie](https://github.com/Kuan-Lun/hv-bie)（`itemc.js`）、[dodying/UserJs](https://github.com/dodying/UserJs)（`hvTranslator.user.js`、`hvRepairEpument.user.js`）與 [Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse)（`hvUtils.js`、`hv_chinese.js`）。

> **庫存屬性關鍵定義（依 `Bazaar.html` 原文）**：
> - **🟢 綠字（Unlimited Supply）**：系統無限供應，玩家可隨時以官方買價購買任意數量（單筆上限 99,999；若有 `Coupon Clipper` Hath Perk 享 **9 折**，即 `Buy_Cost * 0.9`）。在 The Market 中，綠字商品的買單出價不得高於 Item Shop 官方買價。
> - **⚪ 非綠字（Player-Sold Only, Cap 9,999）**：**系統初始庫存為 0，且絕不自動補貨**；只有當某位玩家以「賣店價（Sale Value）」將該物品賣給 Item Shop 時，商店庫存才會增加（上限 9,999），且老玩家會用 `Item Bot`（採購機器人 `?s=Bazaar&ss=ib`）掛 Backorder 自動秒搶所有被賣進商店的非綠字商品。
> - **🔴 不上架（Not Sold in Item Shop）**：Item Shop 買價為 `N/A` 或根本不在 Item Shop 列表中，僅能從戰鬥掉落、神殿、樂透或玩家市場（The Market）取得。

#### 表 1.2A：戰鬥秘石、回復品、魔藥、卷軸與特殊消耗品（Battle Powerups, Restoratives, Infusions, Scrolls, Special）

| 大類 | 物品英文名稱 | 中文譯名 | DBID (`itemc.js` / `hvTranslator`) | Item Shop 賣店價 (Sale Value) | Item Shop 買價 (Cost to Buy) | Coupon Clipper 9 折買價 | 原版 Item Shop 庫存屬性 | 戰鬥／系統確切效果與冷卻／持續時間 |
|---|---|---|---|---|---|---|---|---|
| **Battle Powerups**（戰場臨時秘石） | `Health Gem` | 生命寶石 | `10005` | N/A | N/A | N/A | 🔴 戰場臨時掉落（每隻怪 `~4%` 掉率，佔 P 槽，戰鬥結束消失） | 立即回復 **`100%` Base HP** |
| **Battle Powerups** | `Mana Gem` | 魔力寶石 | `10006` | N/A | N/A | N/A | 🔴 戰場臨時掉落 | 立即回復 **`50%` Base MP** |
| **Battle Powerups** | `Spirit Gem` | 靈力寶石 | `10007` | N/A | N/A | N/A | 🔴 戰場臨時掉落 | 立即回復 **`25%` Base SP**（`Items` 寫 25%，部分舊翻譯寫 50%） |
| **Battle Powerups** | `Mystic Gem` | 神秘寶石 | `10008` | N/A | N/A | N/A | 🔴 戰場臨時掉落（亦為答對 RiddleMaster 獎勵） | 賦予 `Channeling` 狀態（持續 **15 ticks** 或直到施放下一發法術：法術效果 **`+50%`** 且只消耗 **1 MP**） |
| **Restoratives**（生命回復） | `Health Draught` | 體力長效藥 | `11191` | `1 C` | `25 C` | `22.5 C` | 🟢 **綠字（無限供應）** | 賦予 `Regeneration`：每回合回復 **`2%` Base HP**，持續 **50 ticks**（受通用天賦 `Better Health Pots` 加成） |
| **Restoratives** | `Health Potion` | 體力藥水 | `11195` | `2 C` | `50 C` | `45 C` | 🟢 **綠字（無限供應）** | 立即回復 **`100%` Base HP** |
| **Restoratives** | `Health Elixir` | 終極體力藥 | `11199` | `20 C` | `500 C` | `450 C` | 🟢 **綠字（無限供應）** | 立即回滿 **`100%` HP** + 每回合回復 **`2%` Base HP**，持續 **100 ticks** |
| **Restoratives**（魔力回復） | `Mana Draught` | 法力長效藥 | `11291` | `2 C` | `50 C` | `45 C` | 🟢 **綠字（無限供應）** | 賦予 `Replenishment`：每回合回復 **`1%` Base MP**，持續 **50 ticks**（受 `Better Mana Pots` 加成） |
| **Restoratives** | `Mana Potion` | 法力藥水 | `11295` | `4 C` | `100 C` | `90 C` | 🟢 **綠字（無限供應）** | 立即回復 **`50%` Base MP** |
| **Restoratives** | `Mana Elixir` | 終極法力藥 | `11299` | `40 C` | `1,000 C` | `900 C` | 🟢 **綠字（無限供應）** | 立即回滿 **`100%` MP** + 每回合回復 **`1%` Base MP**，持續 **100 ticks** |
| **Restoratives**（靈力回復） | `Spirit Draught` | 靈力長效藥 | `11391` | `2 C` | `50 C` | `45 C` | 🟢 **綠字（無限供應）** | 賦予 `Refreshment`：每回合回復 **`1%` Base SP**，持續 **50 ticks**（受 `Better Spirit Pots` 加成） |
| **Restoratives** | `Spirit Potion` | 靈力藥水 | `11395` | `4 C` | `100 C` | `90 C` | 🟢 **綠字（無限供應）** | 立即回復 **`50%` Base SP** |
| **Restoratives** | `Spirit Elixir` | 終極靈力藥 | `11399` | `40 C` | `1,000 C` | `900 C` | 🟢 **綠字（無限供應）** | 立即回滿 **`100%` SP** + 每回合回復 **`1%` Base SP**，持續 **100 ticks** |
| **Restoratives**（耐力／全回復） | `Energy Drink` | 能量飲料 | `11401` | `200 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（玩家賣店／僅限 Market 交易）** | 回復 **`10` 點 Stamina**（上限 99；有 `Long Gone Before Daylight` Perk 每日首瓶回復 **`20` 點**）。戰中使用額外賦予 `Energized` **10 ticks**（每 tick `+10%` Base SP 與 `+10%` Overcharge） |
| **Restoratives** | `Caffeinated Candy` | 咖啡因糖果 | `11402` | N/A | N/A | N/A | 🔴 **不上架（僅限 Lottery 3 獎產出與 Market 交易）** | 回復 **`5` 點 Stamina**（上限 99）。戰中使用額外賦予 `Energized` **5 ticks**（每 tick `+10%` Base SP 與 `+10%` Overcharge） |
| **Restoratives** | `Last Elixir` | 終極秘藥 | `11501` | `200 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 等同同時使用 Health + Mana + Spirit Elixir：全滿 HP/MP/SP 並賦予 `Regeneration` + `Replenishment` + `Refreshment` 持續 **100 ticks** |
| **Infusions**（元素魔藥，共 6 種） | `Infusion of Flames` | 火焰魔藥 | `12101` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 1. **戰中消耗**：賦予 `Infused Flames` **50 ticks**（Fire 抗性 `+25%`、Fire 法術傷害 `+25%`，同時間僅能存在 1 種 Infusion）。<br>2. **v0.91 Charm 耗材**：鑲嵌 Lesser/Greater `Fire Strike` 或 `Fire-proof` Charm 耗 `10 / 20` 瓶，維修時亦按耐久損耗消耗。<br>3. **v0.86 Enchant**：武器附加 Fire Strike（15 分鐘）、防具 `+5%` Fire 抗性（60 分鐘）。 |
| **Infusions** | `Infusion of Frost` | 冰冷魔藥 | `12201` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Cold 抗性 `+25%`、Cold 法傷 `+25%`（50 ticks）；鑲嵌與維修 `Cold Strike` / `Cold-proof` Charm 耗 `10 / 20` 瓶 |
| **Infusions** | `Infusion of Lightning` | 閃電魔藥 | `12301` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Elec 抗性 `+25%`、Elec 法傷 `+25%`（50 ticks）；鑲嵌與維修 `Lightning Strike` / `Lightning-proof` Charm 耗 `10 / 20` 瓶 |
| **Infusions** | `Infusion of Storms` | 風暴魔藥 | `12401` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Wind 抗性 `+25%`、Wind 法傷 `+25%`（50 ticks）；鑲嵌與維修 `Wind Strike` / `Wind-proof` Charm 耗 `10 / 20` 瓶 |
| **Infusions** | `Infusion of Divinity` | 神聖魔藥 | `12501` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Holy 抗性 `+25%`、Holy 法傷 `+25%`（50 ticks）；鑲嵌與維修 `Holy Strike` / `Holy-proof` Charm 耗 `10 / 20` 瓶 |
| **Infusions** | `Infusion of Darkness` | 黑暗魔藥 | `12601` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Dark 抗性 `+25%`、Dark 法傷 `+25%`（50 ticks）；鑲嵌與維修 `Dark Strike` / `Dark-proof` Charm 耗 `10 / 20` 瓶 |
| **Scrolls**（戰鬥卷軸，共 7 種） | `Scroll of Absorption` | 吸收卷軸 | `13201` | `4 C` | `100 C` | `90 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 賦予 `Absorbing Ward`（直到觸發）：**100% 機率**吸收下一次非暴擊敵方法術並轉化為 MP |
| **Scrolls** | `Scroll of Swiftness` | 加速卷軸 | `13101` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 賦予 `Hastened` **100 ticks**：Action Speed **`+60%`**（覆蓋同名法術） |
| **Scrolls** | `Scroll of Protection` | 保護卷軸 | `13111` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 賦予 `Protection` **100 ticks**：吸收所有受到傷害的 **`50%`** |
| **Scrolls** | `Scroll of Shadows` | 幻影卷軸 | `13211` | `8 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 賦予 `Shadow Veil` **100 ticks**：閃避率 **`+25%`**，且怪物有 **`20%`** 機率揮空（whiff at shadows） |
| **Scrolls** | `Scroll of Life` | 生命卷軸 | `13221` | `12 C` | `300 C` | `270 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 賦予 `Spark of Life` **100 ticks**：致死攻擊觸發時保留 **`50%` Max HP** 存活（觸發時消耗 **`25%` Base SP**） |
| **Scrolls** | `Scroll of the Avatar` | 化身卷軸 | `13199` | `20 C` | `500 C` | `450 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 同時賦予 `Hastened` + `Protection`，持續 **200 ticks**（雙倍時間） |
| **Scrolls** | `Scroll of the Gods` | 神之卷軸 | `13299` | `32 C` | `800 C` | `720 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 同時賦予 `Absorbing Ward` + `Shadow Veil` + `Spark of Life`，持續 **200 ticks**（雙倍時間） |
| **Special Items**（特殊超稀有消耗品） | `Flower Vase` | 花瓶 | `19111` | `200 C` | `N/A` | `N/A` | 🔴 **Item Shop 不販售（僅能賣店 200 C 或 Market 交易）** | 賦予 `Sleeper Imprint` **50 ticks**：物理／魔法傷害 **`+25%`**，且物理／魔法命中、暴擊率、閃避率、抵抗率大幅提升 |
| **Special Items** | `Bubble-Gum` | 泡泡糖 | `19131` | `200 C` | `N/A` | `N/A` | 🔴 **Item Shop 不販售（僅能賣店 200 C 或 Market 交易）** | 賦予 `Kicking Ass` **50 ticks**：物理與法術傷害 **`+100%`**、必定命中（100% Hit）、幾乎必定暴擊（`~95%` Crit），且每回合回復 20% Base HP/MP |

#### 表 1.2B：水晶、魔物食物、材料、廢料、碎片、催化劑、核心与護符（Crystals, Food, Materials, Shards, Catalysts, Cores, Charms）

| 大類 | 物品英文名稱 | 中文譯名 | DBID (`hvTranslator` / `hvRepair`) | Item Shop 賣店價 (Sale Value) | Item Shop 買價 (Cost to Buy) | Coupon Clipper 9 折買價 | 原版 Item Shop 庫存屬性 | 系統用途與規格明細 |
|---|---|---|---|---|---|---|---|---|
| **Crystals**（主屬性水晶 6 種） | `Crystal of Vigor` | 力量水晶 | `50001` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **STR**（上限 +25；第 $N$ 級耗 `round(50 * 1.555079154^N)` 顆，回士氣 `(ceil(N*0.5)+3)*1000`） |
| **Crystals** | `Crystal of Finesse` | 靈巧水晶 | `50002` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **DEX**（同上） |
| **Crystals** | `Crystal of Swiftness` | 敏捷水晶 | `50003` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **AGI**（同上） |
| **Crystals** | `Crystal of Fortitude` | 體質水晶 | `50004` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **END**（同上） |
| **Crystals** | `Crystal of Cunning` | 智力水晶 | `50005` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **INT**（同上） |
| **Crystals** | `Crystal of Knowledge` | 智慧水晶 | `50006` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **WIS**（同上） |
| **Crystals**（元素抗性水晶 6 種） | `Crystal of Flames` | 火焰水晶 | `50011` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **Fire Resistance**（上限 +50；第 $N$ 級耗 `round(10 * 1.26485522^N)` 顆，回士氣 `(floor(N/10)+1)*2000`） |
| **Crystals** | `Crystal of Frost` | 冰凍水晶 | `50012` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **Cold Resistance**（同上） |
| **Crystals** | `Crystal of Lightning` | 閃電水晶 | `50013` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **Elec Resistance**（同上） |
| **Crystals** | `Crystal of Tempest` | 疾風水晶 | `50014` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **Wind Resistance**（同上） |
| **Crystals** | `Crystal of Devotion` | 神聖水晶 | `50015` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **Holy Resistance**（同上） |
| **Crystals** | `Crystal of Corruption` | 暗黑水晶 | `50016` | `1 C` | `10 C` | `9 C` | 🟢 **綠字（無限供應）** | Monster Lab 提升魔物 **Dark Resistance**（同上） |
| **Monster Food**（魔物飼料與藥丸 4 種） | `Monster Chow` | 怪物飼料 | `51001` | `1 C` | `15 C` | `13.5 C` | 🟢 **綠字（無限供應）** | 餵食 **PL 1–250** 魔物，每份回復 `1,000` 飽食度（有 `That's Good Eatin'` Perk 為 `1,200`；上限 24,000） |
| **Monster Food** | `Monster Edibles` | 怪物食品 | `51002` | `1 C` | `30 C` | `27 C` | 🟢 **綠字（無限供應）** | 餵食 **PL 251–750** 魔物，每份回復 `1,000`（Perk `1,200`）飽食度 |
| **Monster Food** | `Monster Cuisine` | 怪物料理 | `51003` | `1 C` | `50 C` | `45 C` | 🟢 **綠字（無限供應）** | 餵食 **PL 751–2,250** 魔物，每份回復 `1,000`（Perk `1,200`）飽食度 |
| **Monster Food** | `Happy Pills` | 快樂藥丸 | `51011` | `20 C` | `2,000 C` | `1,800 C` | 🟢 **綠字（無限供應）** | 回復魔物 **`6,000`** 點士氣（有 `Extra Strength Formula` Perk 回復 **`12,000`** 點；上限 24,000） |
| **Materials - Scrap & Energy**（維修耗材 5 種） | `Scrap Cloth` | 布製廢料 | `60051` | `1 C` | `100 C` | `90 C` | 🟢 **綠字（無限供應）** | 維修布甲（Cloth Armor）Condition；拆解 Average 以下裝備可得 `ceil(Sale_Value / 100)`（上限 50）個 |
| **Materials - Scrap & Energy** | `Scrap Leather` | 皮革廢料 | `60052` | `1 C` | `100 C` | `90 C` | 🟢 **綠字（無限供應）** | 維修輕甲（Light Armor）Condition |
| **Materials - Scrap & Energy** | `Scrap Metal` | 金屬廢料 | `60053` | `1 C` | `100 C` | `90 C` | 🟢 **綠字（無限供應）** | 維修重甲（Heavy Armor）、單雙手武器、Force Shield 之 Condition |
| **Materials - Scrap & Energy** | `Scrap Wood` | 木材廢料 | `60054` | `1 C` | `100 C` | `90 C` | 🟢 **綠字（無限供應）** | 維修法杖（Staffs）與一般盾牌（Shields）Condition |
| **Materials - Scrap & Energy** | `Energy Cell` | 能量元／電池 | `60071` | `1 C` | `200 C` | `180 C` | 🟢 **綠字（無限供應）** | 1. 維修稀有科技防具（Phase/Shade/Power/Reactive/Force Shield）Energy（用量為 Scrap 的 1/3）。<br>2. **v0.91 Charm 耗材**：鑲嵌與維修 Hollowforged / Butcher / Swiftness / Fatality / Overpower / Archmage / Economizer / Spellweaver / Annihilator / Penetrator / Juggernaut / Capacitor Charm 每次耗 `10`（Lesser）或 `20`（Greater）顆。 |
| **Materials - Basic Graded**（分級基礎鍛造材 12 種） | `Low-Grade Cloth` | 低級布料 | `60001` | `2 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Superior` 布甲產出 1 個（Isekai 3 個）或 Monster Lab 回禮（PL < 750）；用於布甲升级 |
| **Materials - Basic Graded** | `Mid-Grade Cloth` | 中級布料 | `60002` | `10 C` | `1,000 C` | `900 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Exquisite` 布甲產出 1 個（Isekai 2 個）或 Monster Lab 回禮（PL < 1,499）；用於布甲升级 |
| **Materials - Basic Graded** | `High-Grade Cloth` | 高級布料 | `60003` | `50 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Magnificent+` 布甲產出 1 個、Shrine 獻祭小馬雕像（1–3 個）、Monster Lab 回禮（PL ≥ 499） |
| **Materials - Basic Graded** | `Low-Grade Leather` | 低級皮革 | `60004` | `2 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Superior` 輕甲或 Monster Lab 回禮；用於輕甲升级 |
| **Materials - Basic Graded** | `Mid-Grade Leather` | 中級皮革 | `60005` | `10 C` | `1,000 C` | `900 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Exquisite` 輕甲或 Monster Lab 回禮；用於輕甲升级 |
| **Materials - Basic Graded** | `High-Grade Leather` | 高級皮革 | `60006` | `50 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Magnificent+` 輕甲、Shrine 獻祭雕像或 Monster Lab 回禮；用於輕甲升级 |
| **Materials - Basic Graded** | `Low-Grade Metals` | 低級金屬 | `60007` | `2 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Superior` 重甲／武器或 Monster Lab 回禮（佔比 2/5）；用於重甲、單雙手武器、Force Shield 升級 |
| **Materials - Basic Graded** | `Mid-Grade Metals` | 中級金屬 | `60008` | `10 C` | `1,000 C` | `900 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Exquisite` 重甲／武器或 Monster Lab 回禮；用於重甲、武器、Force Shield 升級 |
| **Materials - Basic Graded** | `High-Grade Metals` | 高級金屬 | `60009` | `50 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Magnificent+` 重甲／武器、Shrine 獻祭雕像或 Monster Lab 回禮；用於重甲、武器、Force Shield 升級 |
| **Materials - Basic Graded** | `Low-Grade Wood` | 低級木頭 | `60010` | `2 C` | `200 C` | `180 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Superior` 法杖／盾牌或 Monster Lab 回禮；用於法杖與非力場盾牌升級 |
| **Materials - Basic Graded** | `Mid-Grade Wood` | 中級木頭 | `60011` | `10 C` | `1,000 C` | `900 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Exquisite` 法杖／盾牌或 Monster Lab 回禮；用於法杖與盾牌升級 |
| **Materials - Basic Graded** | `High-Grade Wood` | 高級木頭 | `60012` | `50 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 拆解 `Magnificent+` 法杖／盾牌、Shrine 獻祭雕像或 Monster Lab 回禮；用於法杖與盾牌升級 |
| **Materials - Rares**（稀有科技防具升級材 4 種） | `Crystallized Phazon` | 相位碎片(布) | `60101` | `100 C` | `10,000 C` | `9,000 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 僅從 **Monster Lab 魔物回禮**取得（Isekai 模式改由 Artifact/Collectible 掉落之 20% 替代）；用於升級 `Phase Armor`（v0.91 升滿 Lv.30 需 100 個） |
| **Materials - Rares** | `Shade Fragment` | 暗影碎片(輕) | `60102` | `100 C` | `10,000 C` | `9,000 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 來源同上；用於升級 `Shade Armor` |
| **Materials - Rares** | `Repurposed Actuator` | 動力碎片(重) | `60104` | `100 C` | `10,000 C` | `9,000 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 來源同上；用於升級 `Power Armor` |
| **Materials - Rares** | `Defense Matrix Modulator` | 力場碎片(盾) | `60105` | `100 C` | `10,000 C` | `9,000 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 來源同上；用於升級 `Force Shield` |
| **Shards**（碎片 4 種） | `Voidseeker Shard` | 虛空碎片 | `61001` | `10 C` | `1,000 C` | `900 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Hard 以上難度掉落。v0.91：鑲嵌與維修 `Voidseeker Charm` 耗 `10 / 20` 顆；v0.86：武器附魔 1 小時轉 Void 傷並 `+50%` 物理命中 |
| **Shards** | `Featherweight Shard` | 羽毛碎片 | `61501` | `10 C` | `1,000 C` | `900 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | 全難度掉落。v0.91：鑲嵌與維修 `Featherweight Charm` 耗 `10 / 20` 顆；v0.86：裝備附魔 1 小時降 Burden/Interference `max(7, 50%)` |
| **Shards** | `Aether Shard` | 以太碎片 | `61101` | `50 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（僅靠玩家賣店才有庫存）** | Hard 以上難度掉落。v0.91：鑲嵌與維修 `Aether Charm` 耗 `10 / 20` 顆；v0.86：武器附魔 1 小時 `+10%` 省魔與 `+50%` 魔法命中 |
| **Shards**（v0.86 重鑄專用，v0.91 已退役） | `Amnesia Shard` | 重鑄碎片 | `65001` | `50 C` | `5,000 C` | `4,500 C` | ⚪ **非綠字（v0.86 僅靠玩家賣店）** | **v0.86 專用**：於 The Forge Reforge 重置裝備 Potency Tier 至 0，消耗量 = 當前 Potency Tier（有 `Dark Descent` 減半）。v0.91 移除隨機 Potency 後退役 |
| **Catalysts**（v0.86 催化劑 6 種，v0.91 已退役） | `Wispy / Diluted / Regular / Robust / Vibrant / Coruscating Catalyst` | 6 階催化劑 | `60301`–`60306` | `10 / 50 / 100 / 250 / 500 / 1,000 C` | `100 / 500 / 1,000 / 2,500 / 5,000 / 10,000 C` | 9 折 | 🟢 **v0.86 綠字無限供應（v0.91 已退役）** | **v0.86 專用**：The Forge 升級必備耗材（見 `hvUtils.js:2290, 10852`），拆解不返還。**v0.91 改為直接消耗 Credits + Equipment Cores**，並於 2026 復活節化為紀念古董 `Final Edition Catalysts` |
| **Equipment Cores**（裝備核心 6 種，v0.89+ / v0.91 核心） | `Legendary Weapon / Staff / Armor Core` | 傳奇武器／法杖／護甲核心 | 未公開獨立 ID | N/A | N/A（鍛造／融合缺貨時可付 Credits 折抵） | N/A | 🔴 **Item Shop 不販售（可於 Market 交易）** | 拆解 `Legendary` 武器／法杖／防具產出 `1` 顆（拆解稀有防具 Phase/Shade/Power/Reactive/Force Shield 產出 **`5` 顆 Armor Core**），或 Lottery 勾選 `Do Not Want` 抽中頭獎時獲得 `拆解數 + 1` 顆。用於 v0.91 `Legendary`/`Peerless` 鍛造（Lv.1–25 共需 75 顆）與 Stat Fusion（每次 +1 融合每屬性耗 1 顆，缺貨時武器/法杖/普通防具每顆折抵 `20,000 C`、稀有防具折抵 `100,000 C`（? 來源未找到，2026-10-22 稽核：這組折抵單價出自社群成本估算器 `sources/data_gh/infer_equip_stats.py:89-148` 的假設常數，不是官方公式，見 003 稽核補註）） |
| **Equipment Cores** | `Peerless Weapon / Staff / Armor Core` | 無雙武器／法杖／護甲核心 | 未公開獨立 ID | N/A | N/A（缺貨時可付 Credits 折抵） | N/A | 🔴 **不可玩家交易（Untradeable）** | 拆解 `Peerless` 裝備產出 `1` 顆（稀有防具產出 **`5` 顆**）。用於 v0.91 `Peerless` Lv.26–30 鍛造（共 25 顆）、`Ultimate` Lv.31–33 鍛造（共 15 顆）及 `Peerless+` Stat Fusion |
| **Charms & Pouches**（v0.91 護符 27 種、Lesser／Greater 共 54 個變體 + 護符袋 3 種；2026-10-22 稽核更正：原稿「23 種／46 種」，The Armory 的 Charms 表為 27 種，`sources/parsed_wiki/The_Armory.md:325-378`） | `Lesser / Greater [27 種] Charm`、`Silk / Kevlar / Mithril Charm Pouch` | 次級／強效護符、絲綢／凱夫拉／秘銀護符袋 | 未公開獨立 ID | N/A | N/A | N/A | 🔴 **Item Shop 不販售（可於 Market 交易）** | **Charms**：通關 v0.91 Item World 結算獎勵 `1` 個隨機 Charm（? 來源未找到，2026-10-22 稽核：來源只說「Charms can be obtained by clearing Item Worlds」，`sources/parsed_wiki/The_Armory.md:317`，數量「1 個」無出處），或 Shrine 獻祭 Trophies 獲得。<br>**Pouches**：唯一來源為 **Shrine 獻祭 Trophies 每滿 500,000 (500k) Shrine Value 保底獲贈 1 個**（`75%` Silk / `20%` Kevlar / `5%` Mithril）。 |

#### 表 1.2C：全 38 種黏合劑（Bindings）之 DBID、價格與對應升級／融合屬性表

依據 [Bazaar](https://ehwiki.org/wiki/Bazaar)、[The Armory#Bindings](https://ehwiki.org/wiki/The_Armory#Bindings) 與 `hvTranslator.user.js:185-260`：
- **所有 38 種 Bindings 在 Item Shop 的統一價格**：賣店價（Sale Value）= **`10 C`**，買價（Cost to Buy）= **`1,000 C`**（Coupon Clipper 9 折 `900 C`）。
- **原版 Item Shop 庫存屬性**：⚪ **全部為非綠字（僅靠玩家賣店才有庫存）**。
- **原版獲取途徑**：(1) **Shrine 獻祭 Collectibles（小馬雕像）**：每隻雕像必給 `1` 個隨機種類 Binding；(2) **Monster Lab 魔物回禮**：隨禮物池掉落隨機種類 Binding；(3) **The Market 玩家交易**（`infer_equip_stats.py:133` 基準市價約 `2,000 C`）。
- **v0.91 與 v0.86 用途差異**：
  - **v0.91**：一般鍛造升級（Forging Lv.1–33）**不再消耗 Bindings**；Bindings 專用於 **[Stat Fusion](https://ehwiki.org/wiki/The_Armory#Stat_Fusion)**——每次融合時，裝備上每一個擁有對應 Binding 的屬性固定消耗 **`10` 個該種 Binding**（無論該次融合是 `+1` 還是 `+2`）。
  - **v0.86**：於 The Forge 獨立升級單一屬性時，Lv.1–5 免 Binding，**Lv.6 起每升 1 級消耗 `1` 個對應屬性 Binding**（Isekai 模式免 Binding）。

| DBID | Binding 英文名稱 | 中文譯名 | 對應裝備升級／Stat Fusion 屬性（Upgrades） |
|---|---|---|---|
| `60201` | `Binding of Slaughter` | 黏合劑 - 基礎物理傷害 | Base Physical Damage (`Attack Damage`) |
| `60202` | `Binding of Balance` | 黏合劑 - 物理命中率 | Physical Hit Chance (`Attack Accuracy`) |
| `60238` | `Binding of Isaac` | 黏合劑 - 物理暴擊率 | Physical Crit Chance (`Attack Crit Chance`) |
| `60203` | `Binding of Destruction` | 黏合劑 - 基礎魔法傷害 | Base Magical Damage (`Magic Damage`) |
| `60204` | `Binding of Focus` | 黏合劑 - 魔法命中率 | Magical Hit Chance (`Magic Accuracy`) |
| `60239` | `Binding of Friendship` | 黏合劑 - 魔法暴擊率 | Magical Crit Chance (`Magic Crit Chance`) |
| `60205` | `Binding of Protection` | 黏合劑 - 物理減傷 | Physical Defense (`Physical Mitigation`) |
| `60236` | `Binding of Warding` | 黏合劑 - 魔法減傷 | Magical Mitigation (`Magical Mitigation`) |
| `60206` | `Binding of the Fleet` | 黏合劑 - 迴避率 | Evade Chance (`Evade Chance`) |
| `60207` | `Binding of the Barrier` | 黏合劑 - 格擋率 | Block Chance (`Block Chance`) |
| `60208` | `Binding of the Nimble` | 黏合劑 - 招架率 | Parry Chance (`Parry Chance`) |
| `60237` | `Binding of Negation` | 黏合劑 - 抵抗率 | Resist Chance (`Resist Chance`) |
| `60209` | `Binding of the Elementalist` | 黏合劑 - 元素魔法熟練度 | Elemental Magic Proficiency |
| `60210` | `Binding of the Heaven-sent` | 黏合劑 - 神聖魔法熟練度 | Divine Magic Proficiency |
| `60211` | `Binding of the Demon-fiend` | 黏合劑 - 禁斷／黑暗魔法熟練度 | Forbidden Magic Proficiency |
| `60212` | `Binding of the Curse-weaver` | 黏合劑 - 減益魔法熟練度 | Deprecating Magic Proficiency |
| `60213` | `Binding of the Earth-walker` | 黏合劑 - 輔助／增益魔法熟練度 | Supportive Magic Proficiency |
| `60215` | `Binding of Surtr` | 黏合劑 - 火屬性咒語傷害 | Fire Spell Damage (`Fire Spell Damage`) |
| `60216` | `Binding of Niflheim` | 黏合劑 - 冰屬性咒語傷害 | Cold Spell Damage (`Cold Spell Damage`) |
| `60217` | `Binding of Mjolnir` | 黏合劑 - 雷屬性咒語傷害 | Elec Spell Damage (`Elec Spell Damage`) |
| `60218` | `Binding of Freyr` | 黏合劑 - 風屬性咒語傷害 | Wind Spell Damage (`Wind Spell Damage`) |
| `60219` | `Binding of Heimdall` | 黏合劑 - 聖屬性咒語傷害 | Holy Spell Damage (`Holy Spell Damage`) |
| `60220` | `Binding of Fenrir` | 黏合劑 - 暗屬性咒語傷害 | Dark Spell Damage (`Dark Spell Damage`) |
| `60221` | `Binding of Dampening` | 黏合劑 - 敲擊減傷 | Crushing Mitigation |
| `60222` | `Binding of Stoneskin` (`Stone-skin`) | 黏合劑 - 斬擊減傷 | Slashing Mitigation |
| `60223` | `Binding of Deflection` | 黏合劑 - 刺擊減傷 | Piercing Mitigation |
| `60224` | `Binding of the Fire-eater` | 黏合劑 - 火屬性減傷 | Fire Mitigation |
| `60225` | `Binding of the Frost-born` | 黏合劑 - 冰屬性減傷 | Cold Mitigation |
| `60226` | `Binding of the Thunder-child` | 黏合劑 - 雷屬性減傷 | Elec Mitigation |
| `60227` | `Binding of the Wind-waker` | 黏合劑 - 風屬性減傷 | Wind Mitigation |
| `60228` | `Binding of the Thrice-blessed` | 黏合劑 - 聖屬性減傷 | Holy Mitigation |
| `60229` | `Binding of the Spirit-ward` | 黏合劑 - 暗屬性減傷 | Dark Mitigation |
| `60230` | `Binding of the Ox` | 黏合劑 - 力量 | Strength (`STR`) |
| `60231` | `Binding of the Raccoon` | 黏合劑 - 靈巧 | Dexterity (`DEX`) |
| `60232` | `Binding of the Cheetah` | 黏合劑 - 敏捷 | Agility (`AGI`) |
| `60233` | `Binding of the Turtle` | 黏合劑 - 體質 | Endurance (`END`) |
| `60234` | `Binding of the Fox` | 黏合劑 - 智力 | Intelligence (`INT`) |
| `60235` | `Binding of the Owl` | 黏合劑 - 智慧 | Wisdom (`WIS`) |

> **註**：裝備上的 `Attack Crit Damage`、`Magic Crit Damage`、`Attack Speed`、`Cast Speed`、`Mana Conservation`、`HP Bonus`、`MP Bonus`、`Counter-Resist`、`Counter-Parry`、`Burden`、`Interference` 與武器特效（Procs）**沒有對應的 Binding**；在 v0.91 的基础骰值計算中，沒有對應 Binding 的屬性不由獨立骰值決定，而是直接取該裝備上所有「有對應 Binding 的屬性」之基礎骰值平均數（見 [The Armory#Ranges](https://ehwiki.org/wiki/The_Armory#Ranges)）。

#### 表 1.2D：古遺物（Artifacts）、全獎盃與禮券（Trophies & Coupons）、以及全 27 種小馬雕像（Collectibles）總表

依據 [Items](https://ehwiki.org/wiki/Items#Trophies)、[Bazaar](https://ehwiki.org/wiki/Bazaar)、[Shrine](https://ehwiki.org/wiki/Shrine)、`hvUtils.js:6441-6461` 與 `hvTranslator.user.js:79-109, 281-335`，所有神殿可獻祭物品之規格如下（**全部在 Item Shop 皆為 ⚪ 非綠字玩家賣店庫存或 🔴 不上架**）：

| 類別 | 物品英文名稱 | 中文譯名 | DBID | 掉落來源（Monster / Event） | Trophy Tier | 獻祭保底裝備品質 | Shrine Value（原始 / 升 T3 / 升 T4 / 升 T5） | Item Shop 賣店價 | Item Shop 買價（⚪ 非綠字） |
|---|---|---|---|---|---|---|---|---|---|
| **Artifact** | `Precursor Artifact` | 古遺物 | `20001` | 全戰鬥小怪稀有掉落（基礎 Artifact Roll `0.2%`，受 Archaeologist 最高 `2x` 與 RE `2.5x` 加成） | N/A | 換隨機屬性點 / 2 Hath / 5,000 水晶 / 稀有消耗品 / Chaos Token | 不計入 Trophy 積分 | `2,000 C` | `10,000 C` |
| **Trophy (Boss)** | `ManBearPig Tail` | 人熊豬的尾巴 | `30016` | Manbearpig (MID=16, Boss-class) | **Tier 2** | `Average` | `1,000` / `1,100` / `1,200` / `1,300` | `100 C` | `500 C` |
| **Trophy (Boss)** | `Holy Hand Grenade of Antioch` | 安提阿的神聖手榴彈 | `30017` | White Bunneh (MID=17, Boss-class) | **Tier 2** | `Average` | `1,000` / `1,100` / `1,200` / `1,300` | `100 C` | `500 C` |
| **Trophy (Boss)** | `Mithra's Flower` | 貓人族的花 | `30018` | Mithra (MID=18, Boss-class) | **Tier 2** | `Average` | `1,000` / `1,100` / `1,200` / `1,300` | `100 C` | `500 C` |
| **Trophy (Boss)** | `Dalek Voicebox` | 戴立克音箱 | `30019` | Dalek (MID=19, Boss-class) | **Tier 2** | `Average` | `1,000` / `1,100` / `1,200` / `1,300` | `100 C` | `500 C` |
| **Trophy (Schoolgirl / Legendary)** | `Lock of Blue Hair` | 一綹藍髮 | `30020` | Konata (MID=20, Legendary-class) | **Tier 2** | `Average` | `1,000` / `1,100` / `1,200` / `1,300` | `150 C` | `750 C` |
| **Trophy (Schoolgirl / Legendary)** | `Bunny-Girl Costume` | 兔女郎裝 | `30021` | Mikuru Asahina (MID=21, Legendary-class) | **Tier 3** | `Average` | `2,000` / — / `2,400` / `2,600` | `200 C` | `1,000 C` |
| **Trophy (Schoolgirl / Legendary)** | `Hinamatsuri Doll` | 雛人形 | `30022` | Ryouko Asakura (MID=22, Legendary-class) | **Tier 3** | `Average` | `2,000` / — / `2,400` / `2,600` | `200 C` | `1,000 C` |
| **Trophy (Schoolgirl / Legendary)** | `Broken Glasses` | 破碎的眼鏡 | `30023` | Yuki Nagato (MID=23, Legendary-class) | **Tier 3** | `Average` | `2,000` / — / `2,400` / `2,600` | `200 C` | `1,000 C` |
| **Trophy (God)** | `Black T-Shirt` | 黑色 T 恤 | `30024` | Real Life (MID=24, God-class) | **Tier 4** | `Superior` | `4,000` / — / — / `5,200` | `1,000 C` | `5,000 C` |
| **Trophy (God)** | `Sapling` | 樹苗 | `30030` | Yggdrasil (MID=30, God-class) | **Tier 4** | `Superior` | `4,000` / — / — / `5,200` | `1,000 C` | `5,000 C` |
| **Trophy (God)** | `Unicorn Horn` | 獨角獸的角 | `30031` | Invisible Pink Unicorn (MID=31, God-class) | **Tier 5** | `Superior` | `5,000`（不可再合成升級） | `1,000 C` | `5,000 C` |
| **Trophy (God)** | `Noodly Appendage` | 麵條般的附肢 | `30032` | Flying Spaghetti Monster (MID=32, God-class) | **Tier 6** | `Exquisite`（估計分佈：78% Exq / 20% Mag / 2% Leg） | `5,000` | `1,000 C` | `5,000 C` |
| **Coupons**（主站月榜禮券） | `Bronze Coupon` | 銅禮券 | `30041`? | 主站月榜第 26–50 名 | **Tier 3** | `Average` | `4,000` | `200 C` | `1,000 C` |
| **Coupons** | `Silver Coupon` | 銀禮券 | `30042`? | 主站月榜第 11–25 名 | **Tier 5** | `Superior` | `5,000` | `400 C` | `2,000 C` |
| **Coupons** | `Gold Coupon` | 黃金禮券 | `30043`? | 主站月榜第 4–10 名 | **Tier 7** | `Magnificent` | `6,000` | `600 C` | `3,000 C` |
| **Coupons** | `Platinum Coupon` | 白金禮券 | `30044`? | 主站月榜第 1–3 名 | **Tier 8** | `Magnificent` | `7,000` | `1,000 C` | `5,000 C` |
| **Event / Special Trophies** | `Stocking Stuffers` / `Festival Coupon` / `Shrine Fortune` | 聖誕襪禮物／節日禮券／神社靈籤 | `30034` 等 | 聖誕節／中秋豐收節／復活節活動 | **Tier 7** | `Magnificent` | `2,000` | N/A (`Stocking` 與 `Fortune` 不可交易) | N/A |
| **Event / Special Trophies** | `Vintage Paper Tag` / 歷年復活節與聖誕節大獎 | 歷年節慶 T8 獎盃 | `3003x` | 復活節集齊一套／聖誕節參與獎／Tagging 比賽 | **Tier 8** | `Magnificent` | Varies | Varies | Varies |
| **Event / Special Trophies** | `Tenbora's Box` / `Mysterious Box` | 天菠拉的盒子／神秘寶盒 | `30035` | 年度總榜前 50 名／聖誕抽獎 50 名 | **Tier 9** | `Legendary` | Varies | Varies | Varies |
| **Special Voucher** | `Peerless Voucher` | 無雙憑證 | `30036`? | `Follower of Snowflake` 每獻祭滿 10m Shrine Value 贈與 1 張、Isekai 季末獎勵 | **Peerless** | **100% 保底 `Peerless`（自動 Soulbound）** | `0` | N/A（不可交易） | N/A |
| **Collectibles**（小馬雕像，共 27 種） | 編號 1–27（明細見下表） | 小馬公仔／收藏品 | `70001`–`70026`, `70102` | Artifact Roll 命中時的子分支（`Collectable Roll` 約 `1%?`） | N/A | 獻祭每隻得 **`1` 隨機 Binding + `1–3` 高階基礎材料 + `10%` 機率 `1` 顆 World Seed**；**背包同時持有 ≥ 21 種不同款式解鎖 OFC** | 不計入 Trophy 積分 | `10,000 C` | `50,000 C`（⚪ 非綠字） |

**附：全 27 種 Collectibles（Pony Figurines）編號與 DBID 完整清單**（依 `Items.md:246-255`、`hvTranslator.user.js:281-335` 與 `hv_chinese.js:1736-1762`）：
1. `70001`: `Twilight Sparkle Figurine`（NO.1 暮光閃閃）
2. `70002`: `Rainbow Dash Figurine`（NO.2 雲寶黛西）
3. `70003`: `Applejack Figurine`（NO.3 蘋果傑克）
4. `70004`: `Fluttershy Figurine`（NO.4 小蝶）
5. `70005`: `Pinkie Pie Figurine`（NO.5 萍琪）
6. `70006`: `Rarity Figurine`（NO.6 瑞瑞）
7. `70007`: `Trixie Figurine`（NO.7 崔克茜）
8. `70008`: `Princess Celestia Figurine`（NO.8 塞拉斯提婭公主）
9. `70009`: `Princess Luna Figurine`（NO.9 露娜公主）
10. `70010`: `Apple Bloom Figurine`（NO.10 小萍花）
11. `70011`: `Scootaloo Figurine`（NO.11 飛板露）
12. `70012`: `Sweetie Belle Figurine`（NO.12 甜貝兒）
13. `70013`: `Big Macintosh Figurine`（NO.13 大麥克）
14. `70014`: `Spitfire Figurine`（NO.14 爆火）
15. `70015`: `Derpy Hooves Figurine`（NO.15 小呆）
16. `70016`: `Lyra Heartstrings Figurine`（NO.16 天琴心弦）
17. `70017`: `Octavia Figurine`（NO.17 奧塔維亞）
18. `70018`: `Zecora Figurine`（NO.18 澤科拉）
19. `70019`: `Cheerilee Figurine`（NO.19 車厘子）
20. `70020`: `Vinyl Scratch Figurine`（NO.20 維尼爾）
21. `70021`: `Daring Do Figurine`（NO.21 天馬無畏）
22. `70022`: `Doctor Whooves Figurine`（NO.22 神秘博士）
23. `70023`: `Berry Punch Figurine`（NO.23 酸梅酒）
24. `70024`: `Bon-Bon Figurine`（NO.24 糖糖）
25. `70025`: `Fluffle Puff Figurine`（NO.25 毛毛小馬）
26. `70026`: `Angel Bunny Figurine`（NO.26 天使兔）
27. `70102`: `Gummy Figurine`（NO.27 甘米）
> **歷史演進備註**：早期版本最初僅有前 10 隻（或少數）小馬雕像，後擴充為 27 隻，並將解鎖 `Orbital Friendship Cannon` 的門檻定為「**背包內同時持有至少 21 種不同雕像**」（見 `Items.md:240` 與 `Skills.md:87`）。

---

## 二、Hath Perks、Snowflake's Shrine、The Lottery、Dawn of a New Day、Training 與 Isekai 模式完整規格

### 2.1 全量 Hath Perks 完整規格表（對照 `Hath_Perks` 與 `EhSyringe/hathperks.ts`）

依據 [Hath Perks](https://ehwiki.org/wiki/Hath_Perks)（`oldid=65055`，2026-09-13 v0.91 最新版）與 [EhTagTranslation/EhSyringe](https://github.com/EhTagTranslation/EhSyringe)（`src/services/ui-translation/data/hathperks.ts`），所有 HentaiVerse 專屬 Hath Perks 共 **60 個購買階層**，總計需 **649,500 Hath**（2026-10-22 稽核更正：原稿「19 個能力系列／46 階／497,700」；`sources/parsed_wiki/Hath_Perks.md:36-95` 逐列加總為 60 階／649,500，其中 Limit Breaker I–V 300,000、其餘 55 階 349,500；原稿自己下表亦為 60 列）（另有 13 個主站圖庫專屬 Gallery Perks 共 7,600 Hath（原稿 7,800；`sources/parsed_wiki/Hath_Perks.md:21-33`），單機版無須實作圖庫 Perks，僅列於表末備查）：

| 系列分類 | Hath Perk 英文名稱 | 中文譯名 (`hathperks.ts`) | 前置需求 | 單階成本 (Hath) | 系列累計成本 (Hath) | 確切遊戲內機制效果與公式乘區 |
|---|---|---|---|---|---|---|
| **郵務減免** | `Postage Paid` | 郵費已付 | 無 | `100` | `100` | 免除 MoogleMail 發信郵資（`10 C`）與貨到付款 CoD 手續費（`10%`，原上限 `1,000 C`） |
| **三圍基礎** | `Vigorous Vitality` | 生機勃勃 | 無 | `1,000` | `1,000` | 角色 **Base Health `+10%`** |
| **三圍基礎** | `Effluent Ether` | 溢流以太 | 無 | `1,000` | `1,000` | 角色 **Base Mana `+10%`** |
| **三圍基礎** | `Suffusive Spirit` | 心靈堅強 | 無 | `1,000` | `1,000` | 角色 **Base Spirit `+10%`**（與天賦 `SP Tank` 獨立乘算：`(1 + ΣStats/5) * (1 + SP_Tank) * (1 + Suffusive_Spirit)`） |
| **戰鬥回復** | `Resplendent Regeneration` | 輝煌再起 | 無 | `2,000` | `2,000` | 戰鬥中自然與狀態再生能力（In-combat regeneration）**`+50%`** |
| **驗證增益** | `Enigma Energizer` | 謎之勁量 | 無 | `200` | `200` | 御謎士小馬驗證（RiddleMaster）答對後的 `Blessing of the RiddleMaster` 效果翻倍（物魔傷、掉率與經驗加成加倍），且持續時間延長至 **50 回合** |
| **戰鬥逃跑** | `Yakety Sax` | 葉克蒂·薩克斯 | 無 | `200` | `200` | 使用 `Flee` 技能時 **100% 立即逃跑成功**（無須等待 1 tick 讓怪物多打一輪） |
| **每日資源** | `Soul Catcher` | 靈魂捕手 | 無 | `500` | `500` | 每逢 Dawn of a New Day 自動免費獲得 **`10` 片 Soul Fragments**（過去 30 天內有開啟 HV 即發放） |
| **魔物培養** | `Extra Strength Formula` | 特強配方 | 無 | `2,000` | `2,000` | Monster Lab 中 `Happy Pills` 回復士氣效果翻倍（從 `6,000` 提升至 **`12,000`** 點士氣） |
| **魔物培養** | `That's Good Eatin'` | 這倒是挺好吃的！ | 無 | `2,000` | `2,000` | Monster Lab 中魔物食物（Chow / Edibles / Cuisine）飽食度回復量 **`+20%`**（從 `1,000` 提升至 **`1,200`** 點） |
| **商店折扣** | `Coupon Clipper` | 食利者 | 無 | `1,000` | `1,000` | 於 Bazaar **Item Shop** 購買所有商品享 **`10%` 折扣**（即 9 折） |
| **耐力回復** | `Long Gone Before Daylight` | 黎明之前 | 無 | `2,000` | `2,000` | 每日使用的**第一瓶 `Energy Drink`** 回復雙倍耐力（從 `+10` 提升至 **`+20` Stamina**，戰內戰外皆適用） |
| **道具界種子** | `Dark Descent` | 黑暗後裔 | 無 | `2,000` | `2,000` | **v0.91**：通關 Lv.200 以上 Arena 時掉落 `World Seed` 的機率從 `20%` 提升至 **`50%`**（註：在 **v0.86** 舊版中，此 Perk 效果為 Reforge 消耗的 `Amnesia Shard` 數量減半） |
| **五系魔法熟練度** | `Eminent Elementalist` | 元素大師 | 無 | `1,000` | `1,000` | 有效元素魔法熟練度（Effective Elemental Proficiency）增加自身基礎熟練度的 **`+10%`** |
| **五系魔法熟練度** | `Divine Warmage` | 聖戰法師 | 無 | `1,000` | `1,000` | 有效神聖魔法熟練度（Effective Divine Proficiency）增加自身基礎熟練度的 **`+10%`** |
| **五系魔法熟練度** | `Death and Decay` | 死亡凋零 | 無 | `1,000` | `1,000` | 有效黑暗魔法熟練度（Effective Forbidden Proficiency）增加自身基礎熟練度的 **`+10%`** |
| **五系魔法熟練度** | `Evil Enchantress` | 邪惡的女巫 | 無 | `1,000` | `1,000` | 有效減益魔法熟練度（Effective Deprecating Proficiency）增加自身基礎熟練度的 **`+10%`** |
| **五系魔法熟練度** | `Force of Nature` | 自然之力 | 無 | `1,000` | `1,000` | 有效增益魔法熟練度（Effective Supportive Proficiency）增加自身基礎熟練度的 **`+10%`** |
| **終極技能強化** | `Manehattan Project` | 曼哈頓計劃 | 無 | `25,000` | `25,000` | 大幅提升 `Orbital Friendship Cannon`（友情小馬砲）的傷害倍率（未購時基礎為 `20x ADB`） |
| **神殿保底無雙** | `Follower of Snowflake` | 雪花的信徒 | 無 | `50,000` | `50,000` | 在 Shrine 獻祭 Trophies 累計每滿 **`10,000,000` (10m) Shrine Value**，即贈送 **`1` 張 `Peerless Voucher`**（追溯 2014-09-27 起算） |
| **v0.91 融合突破**（共 5 階） | `Limit Breaker I` | 極限突破 I | 無 | `20,000` | `20,000` | 將裝備 Stat Fusion 基礎骰值上限從 `200`（Peerless）提升至 **`210`**（Peerless+） |
| | `Limit Breaker II` | 極限突破 II | Limit Breaker I | `40,000` | `60,000` | 將裝備 Stat Fusion 基礎骰值上限提升至 **`220`** |
| | `Limit Breaker III` | 極限突破 III | Limit Breaker II | `60,000` | `120,000` | 將裝備 Stat Fusion 基礎骰值上限提升至 **`230`** |
| | `Limit Breaker IV` | 極限突破 IV | Limit Breaker III | `80,000` | `200,000` | 將裝備 Stat Fusion 基礎骰值上限提升至 **`240`** |
| | `Limit Breaker V` | 極限突破 V | Limit Breaker IV | `100,000` | **`300,000`** | 將裝備 Stat Fusion 基礎骰值上限提升至 **`250`（晉升 `Ultimate` 品質）** |
| **經驗加成**（共 4 階，覆蓋式） | `Thinking Cap` | 深思 | 無 | `250` | `250` | 所有獲得 EXP **`+25%`**（計算時與 Training `Adept Learner` 加算） |
| | `Mentats` | 晶算師 | Thinking Cap | `500` | `750` | 將此 EXP 加成提升至 **`+50%`** |
| | `Learning Chip` | 學習晶片 | Mentats | `750` | `1,500` | 將此 EXP 加成提升至 **`+75%`** |
| | `Cybernetic Implants` | 神經植入物 | Learning Chip | `1,000` | **`2,500`** | 將此 EXP 加成提升至 **`+100%`** |
| **自動施法槽**（共 5 階，覆蓋式） | `Innate Arcana I` | 天賦奧術 I | 無 | `500` | `500` | 使所有自動施法維持魔力消耗減少 **`10%`**（2026-10-22 稽核更正：原稿另寫「解鎖第 1 個 Autocast 自動施法槽」；來源只寫「Applies a 10% upkeep discount on autocast spells」，`sources/parsed_wiki/Hath_Perks.md:65`；「解鎖槽位」? 來源未找到，應為原稿自加） |
| | `Innate Arcana II` | 天賦奧術 II | Innate Arcana I | `1,000` | `1,500` | 自動施法維持魔力消耗減少 **`20%`**（`sources/parsed_wiki/Hath_Perks.md:66`；原稿「解鎖第 2 個槽」? 來源未找到） |
| | `Innate Arcana III` | 天賦奧術 III | Innate Arcana II | `1,500` | `3,000` | 自動施法維持魔力消耗減少 **`30%`**（`sources/parsed_wiki/Hath_Perks.md:67`；原稿「解鎖第 3 個槽」? 來源未找到） |
| | `Innate Arcana IV` | 天賦奧術 IV | Innate Arcana III | `2,000` | `5,000` | 自動施法維持魔力消耗減少 **`40%`**（`sources/parsed_wiki/Hath_Perks.md:68`；原稿「解鎖第 4 個槽」? 來源未找到） |
| | `Innate Arcana V` | 天賦奧術 V | Innate Arcana IV | `2,500` | **`7,500`** | 自動施法維持魔力消耗減少 **`50%`**（`sources/parsed_wiki/Hath_Perks.md:69`；原稿「解鎖第 5 個槽」? 來源未找到） |
| **水晶掉落倍率**（共 5 階，覆蓋式） | `Crystarium I` | 水晶礦脈 I | 無 | `1,000` | `1,000` | 戰鬥中每次掉落水晶時，獲得數量變為 **`2x`**（`crystarium = 2`） |
| | `Crystarium II` | 水晶礦脈 II | Crystarium I | `3,000` | `4,000` | 水晶掉落數量變為 **`3x`**（`crystarium = 3`） |
| | `Crystarium III` | 水晶礦脈 III | Crystarium II | `5,000` | `9,000` | 水晶掉落數量變為 **`5x`**（`crystarium = 5`） |
| | `Crystarium IV` | 水晶礦脈 IV | Crystarium III | `7,000` | `16,000` | 水晶掉落數量變為 **`7x`**（`crystarium = 7`） |
| | `Crystarium V` | 水晶礦脈 V | Crystarium IV | `10,000` | **`26,000`** | 水晶掉落數量變為 **`10x`**（`crystarium = 10`） |
| **令牌掉落倍率**（共 3 階，覆蓋式） | `Tokenizer I` | 令牌技師 I | 無 | `1,000` | `1,000` | 小怪隨機掉落 Token 機率變為 **`2x`**，並提高 `Chaos Token` 相對佔比 |
| | `Tokenizer II` | 令牌技師 II | Tokenizer I | `2,500` | `3,500` | 小怪隨機掉落 Token 機率變為 **`3x`**，並提高 `Chaos Token` 相對佔比 |
| | `Tokenizer III` | 令牌技師 III | Tokenizer II | `5,000` | **`8,500`** | 小怪隨機掉落 Token 機率變為 **`4x`**，並提高 `Chaos Token` 相對佔比 |
| **裝備倉庫擴充**（共 5 階，覆蓋式） | `Hoarder I` | 囤積者 I | 無 | `1,000` | `1,000` | 放入裝備倉庫（Storage）的前 **`200` 件**裝備不計入常規裝備上限（1,000 件） |
| | `Hoarder II` | 囤積者 II | Hoarder I | `2,000` | `3,000` | 免計入上限提升至 **`400` 件** |
| | `Hoarder III` | 囤積者 III | Hoarder II | `3,000` | `6,000` | 免計入上限提升至 **`600` 件** |
| | `Hoarder IV` | 囤積者 IV | Hoarder III | `4,000` | `10,000` | 免計入上限提升至 **`800` 件** |
| | `Hoarder V` | 囤積者 V | Hoarder IV | `5,000` | **`15,000`** | 免計入上限提升至 **`1,000` 件** |
| **裝備磨損減免**（共 4 階，覆蓋式） | `Repair Bear Mk.1` | 修理熊 Mk.1 | 無 | `3,000` | `3,000` | 裝備常規磨損（Wear）降為 **`50%`**（**不影響 Charms 磨損**） |
| | `Repair Bear Mk.2` | 修理熊 Mk.2 | Repair Bear Mk.1 | `5,000` | `8,000` | 裝備常規磨損降為 **`25%`** |
| | `Repair Bear Mk.3` | 修理熊 Mk.3 | Repair Bear Mk.2 | `7,000` | `15,000` | 裝備常規磨損降為 **`10%`** |
| | `Repair Bear Mk.4` | 修理熊 Mk.4 | Repair Bear Mk.3 | `10,000` | **`25,000`** | **裝備常規磨損完全消除（`0%`）**，且戰敗死亡時的耐久度損耗減半（**`-50%`**） |
| **總傷乘區加成**（共 9 階，覆蓋式非疊加） | `Dæmon Duality I` | 雙重守護精靈 I | 無 | `2,000` | `2,000` | 物理與魔法總傷害 **`+10%`**（獨立乘區 `1 + hath_bonus`） |
| | `Dæmon Duality II` | 雙重守護精靈 II | Dæmon Duality I | `4,000` | `6,000` | 物理與魔法總傷害提升至 **`+15%`** |
| | `Dæmon Duality III` | 雙重守護精靈 III | Dæmon Duality II | `6,000` | `12,000` | 物理與魔法總傷害提升至 **`+20%`** |
| | `Dæmon Duality IV` | 雙重守護精靈 IV | Dæmon Duality III | `8,000` | `20,000` | 物理與魔法總傷害提升至 **`+25%`** |
| | `Dæmon Duality V` | 雙重守護精靈 V | Dæmon Duality IV | `10,000` | `30,000` | 物理與魔法總傷害提升至 **`+30%`** |
| | `Dæmon Duality VI` | 雙重守護精靈 VI | Dæmon Duality V | `20,000` | `50,000` | 物理與魔法總傷害提升至 **`+35%`** |
| | `Dæmon Duality VII` | 雙重守護精靈 VII | Dæmon Duality VI | `30,000` | `80,000` | 物理與魔法總傷害提升至 **`+40%`** |
| | `Dæmon Duality VIII` | 雙重守護精靈 VIII | Dæmon Duality VII | `40,000` | `120,000` | 物理與魔法總傷害提升至 **`+45%`** |
| | `Dæmon Duality IX` | 雙重守護精靈 IX | Dæmon Duality VIII | `50,000` | **`170,000`** | 物理與魔法總傷害提升至 **`+50%`**（注意：各階為覆蓋替換，總加成為 +50% 而非 +270%） |
| **HV Perks 總計** | **共 60 階**（2026-10-22 稽核更正：原稿「19 系列 / 46 階」） | — | — | — | **`649,500 Hath`**（原稿 497,700） | 若扣除 `Limit Breaker I–V`（300,000 Hath），其餘 **55 階**總計為 **`349,500 Hath`**（原稿「傳統 41 階 197,700」錯誤；逐列加總出處 `sources/parsed_wiki/Hath_Perks.md:36-95`） |

*(附註：主站圖庫專屬 Gallery Perks 共 13 項：`Ads-Be-Gone` 200、`Source Nexus` 1,000、`Multi-Page Viewer` 300、`More Thumbs` 200、`Thumbs Up` 400、`All Thumbs` 800、`More Pages` 200、`Lots of Pages` 500、`Too Many Pages` 1,000、`More Favorite Notes I/II` 500/1,000、`Paging Enlargement I/II` 500/1,000，合計 **7,600 Hath**（2026-10-22 稽核更正：原稿 7,800；`sources/parsed_wiki/Hath_Perks.md:21-33` 13 項逐列加總 200+1,000+300+200+400+800+200+500+1,000+500+1,000+500+1,000），與 HentaiVerse 戰鬥或經濟無關。)*

---

### 2.2 Snowflake's Shrine（雪花神殿）完整規格

依據 [Shrine](https://ehwiki.org/wiki/Shrine)、[The Armory#Pouches](https://ehwiki.org/wiki/The_Armory#Pouches)、`hvUtils.js:6436-6836`、`hvShrine.user.js:18-30` 與 `hv_chinese.js:2704-2710, 2866-2891`，神殿根據獻祭物品的 DBID 區間分為三大類處理：

#### 1. Artifacts（古遺物，`DBID < 30000`，主項為 `20001 Precursor Artifact`）
- **互動方式**：無須選擇裝備分類（`select_reward_type = ''` / `'0'`），直接獻祭。
- **隨機獎勵池與機率分佈**：
  - **當角色尚未達到當前等級之神殿紅字主屬性加成上限時**：
    - 約 **`~10%` 基礎機率**（越接近當前等級上限機率越低）獲得 **隨機一項主屬性（STR / DEX / AGI / END / INT / WIS）永久 `+1`**。
    - **神殿紅字屬性上限規則**：單一主屬性最多透過神殿獲得 **`min(floor(Player_Level / 10), 50)` 點**（即每 10 級開放 +1 上限，Lv.500 達到每項最多 `+50`、六圍合計最多 `+300`）。此加成在角色面板以紅字顯示，**不會增加常規升級配點所需的點數成本**。
  - **當角色已達當前等級之神殿主屬性上限時（或未抽中屬性點時之正規化分佈）**：
    - **`20%`**：**`2 Hath`**（若為復活節活動 Artifacts 則為 `1 Hath`；註：`hvUtils.js:6463` 紀錄亦可能出現 `Energy Drink`）。
    - **`40%`**：**`5,000` 顆隨機單一種類水晶（Crystals）**（若為復活節活動 Artifacts 則為 `3,000` 顆；`hvUtils.js:6463` 亦記錄 `1,000x` / `3,000x` / `5,000x` 變體；不受 `Crystarium` Perk 倍率影響）。
    - **`10%`**：**`3x Last Elixirs`**（或 `1x Last Elixir`）。
    - **`10%`**：**`1x Flower Vase`**。
    - **`10%`**：**`1x Bubble-Gum`**。
    - **`10%`**：**`1x Chaos Token`**。

#### 2. Trophies & Coupons（獎盃與禮券，`30000 <= DBID < 70000`）
- **互動方式**：玩家必須在神殿介面選擇 **7 大裝備分類之一**（`1`: One-Handed、`2`: Two-Handed、`3`: Staffs、`4`: Shields、`5`: Cloth Armor、`6`: Light Armor、`7`: Heavy Armor），每次獻祭獲得 1 件該分類的隨機裝備（耐久度 Condition 固定為 **100%**），或有機率獲得 v0.91 **Charms**。
- **Trophy 自動／手動合成升級規則（Upgrading Trophies）**：
  - 預設隨玩家等級自動將低階獎盃合併獻祭（Lv.200 升 Tier 3、Lv.300 升 Tier 4、Lv.400 升 Tier 5），玩家亦可於 `Settings -> Shrine Trophy Upgrades` 手動強制設定為 `Use Default` / `Upgrade to Tier 3` / `Upgrade to Tier 4` / `Upgrade to Tier 5` / `Do Not Upgrade`（最高只能合成至 **Tier 5**）：
    - **Tier 2 獎盃**（基礎 Shrine Value = `1,000`）：
      - 不升級：`1` 個換 1 件 Tier 2 裝備（計 `1,000` Value）。
      - 升 **Tier 3**：耗 **`4` 個**（單價 ×1.1 = `1,100`，單次獻祭計 **`4,400`** Value）。
      - 升 **Tier 4**：耗 **`8` 個**（單價 ×1.2 = `1,200`，單次獻祭計 **`9,600`** Value）。
      - 升 **Tier 5**：耗 **`32` 個**（單價 ×1.3 = `1,300`，單次獻祭計 **`41,600`** Value）。
    - **Tier 3 獎盃**（基礎 Shrine Value = `2,000`）：
      - 升 **Tier 4**：耗 **`2` 個**（單價 ×1.2 = `2,400`，單次獻祭計 **`4,800`** Value）。
      - 升 **Tier 5**：耗 **`8` 個**（單價 ×1.3 = `2,600`，單次獻祭計 **`20,800`** Value）。
    - **Tier 4 獎盃**（基礎 Shrine Value = `4,000`）：
      - 升 **Tier 5**：耗 **`4` 個**（單價 ×1.3 = `5,200`，單次獻祭計 **`20,800`** Value）。
    - **Tier 5+ 獎盃**（Unicorn Horn `5,000`、Noodly Appendage `5,000`、Coupons `4,000–7,000`）：不可再合併升級，單個直接獻祭。
- **Trophy Tier 對應裝備品質保底與機率**：
  - 所有階層的 Trophy 皆有相同的極低機率（**`0.0001%`**，即百萬分之一，見 `Loot_Drop_Rolls.md:27`）直接骰出原生 `Peerless`！
  - 各階層保底品質（Minimum Quality）：Tier 1–3 保底 `Average`、Tier 4–5 保底 `Superior`、Tier 6（`Noodly Appendage`）保底 `Exquisite`（實測分佈約 **`78%` Exquisite / `20%` Magnificent / `2%` Legendary**）、Tier 7–8 保底 `Magnificent`、Tier 9（`Tenbora's Box`）保底 `Legendary`、`Peerless Voucher` 100% 給 Soulbound `Peerless`。
- **Shrine Value 累計保底獎勵（雙軌計數器）**：
  1. **每累計滿 `500,000` (500k) Shrine Value（v0.91 全玩家適用）**：**100% 保底額外掉落 1 個 Charm Pouch（護符袋）**，且這是全遊戲獲取 Pouch 的唯一來源！三階 Pouch 機率分佈為：
     - **`75%`**：**`Silk Charm Pouch`**（佔 0 CP，減少 Charm 磨損 **50%**，戰敗受傷時 100% 損毀）。
     - **`20%`**：**`Kevlar Charm Pouch`**（佔 **1 CP**，減少 Charm 磨損 **90%**，戰敗受傷時 20% 機率損毀）。
     - **`5%`**：**`Mithril Charm Pouch`**（佔 **2 CP**，**100% 完全消除 Charm 磨損**，且護符袋本身永不損毀）。
  2. **每累計滿 `10,000,000` (10m) Shrine Value（限擁有 `Follower of Snowflake` 50,000 Hath Perk 之玩家）**：**100% 保底贈送 1 張 `Peerless Voucher`**。

#### 3. Collectibles（小馬雕像，`DBID >= 70000`）
- **獻祭獎勵**：每獻祭 1 隻小馬雕像，固定獲得：
  1. **`1` 個隨機種類的 `Binding`**（38 種等機率）。
  2. **`1–3` 個隨機種類的高階基礎鍛造材料（`High-Grade Cloth / Leather / Metals / Wood`）**。
  3. **`10%` 機率**額外獲得 **`1` 顆 `World Seed`**（v0.91 新增）。

---

### 2.3 The Lottery（每日武器／防具雙樂透）完整規格

依據 [The Lottery](https://ehwiki.org/wiki/The_Lottery)、`hvUtils.js:10197-10212`、`lottery_parser.py` 與 `hv_chinese.js:3113-3163`：

1. **雙彩池與開獎時間**：
   - **Weapon Lottery（武器／盾牌樂透，`?s=Bazaar&ss=lt`）**：每日生成 1 件全新 **`Peerless` 品質的武器或盾牌**作為頭獎，週期 24 小時，每日 **UTC 00:00** 開獎（開獎前 1–10 分鐘截止售票）。
   - **Armor Lottery（防具樂透，`?s=Bazaar&ss=la`）**：每日生成 1 件全新 **`Peerless` 品質的防具**作為頭獎，週期 24 小時，每日 **UTC 12:00** 開獎（與武器池錯開 12 小時）。
2. **購票成本與上限**：
   - 每張彩券價格：**原版為 `1,000 GP`**（單機版無主站 GP，依 Ticket 004 規範折算為 **`1,000 Credits`**）（2026-10-22 稽核更正：本報告本身就是 Ticket 004，並無此「規範」，拍板票是 006，此句等於引用尚未做出的決定；折算為 Credits 只是候選方案，待 006 拍板）。
   - 單一玩家每期購票上限：**`20,000` 張**（即每池每日最多投入 `20,000,000` GP/Credits）。
   - **Golden Lottery Ticket（黃金彩券）**：每期最多使用 1 張。使用後免費增加 **`100` 張**彩券，並在開獎瞬間使該玩家的**有效彩券數翻倍（`2x`）**，但翻倍增量最多不超過當期全服總售出彩券數的 **`10%`**（因此若使用黃金彩券，手動買 `19,900` 張即可達上限）。
3. **獎項結構與「Do Not Want（放棄裝備拿核心）」雙頭獎機制**：
   - 單一玩家在同一期開獎中**最多只能中一個獎項**（無論持有多少張彩券）。
   - **第 1 名（Grand Prize 頭獎）分為兩個獨立名額**（可由兩位不同玩家分別抽中，但同一人不可兼得）：
     - **Equip Winner（頭獎裝備得主）**：獲得當期展示的 `Peerless` 裝備（自動 **Soulbound + Locked**，不可交易或賣店，耐久度 100%）。
     - **Core Winner（頭獎核心得主）**：已購買至少 1 張彩券的玩家可點擊 **`Do Not Want`** 按鈕（不可撤銷），放棄抽取頭獎裝備的資格，改為參與「頭獎核心」抽獎；抽中時獲得**「該件 Peerless 裝備若拆解可得之 Peerless Cores 數量 + 1 顆」**（即普通武器／法杖／普通防具得 **`2` 顆 Peerless Cores**，Phase/Shade/Power/Reactive/Force Shield 稀有防具得 **`6` 顆 Peerless Armor Cores**）。未點擊 `Do Not Want` 者無法抽中核心。
   - **第 2 至第 5 名安慰獎（隨當期總售出彩券池 `Pool_Size` 線性縮放，於 `500,000` 張彩券封頂）**（? 來源未找到，2026-10-22 稽核：The Lottery 頁只寫「scale with the size of the betting pool, all capped at a 500,000 pool」，各獎上限為 10／50／500／500，`sources/parsed_wiki/The_Lottery.md:53`（Prizes 段）；下列 `clamp(round(cap × min(Pool,500000)/500000), 1, cap)` 的線性公式與最小值 1 沒有來源）：
     - **2nd Prize**：**`Golden Lottery Ticket`** × `clamp(round(10 * min(Pool_Size, 500000) / 500000), 1, 10)` 張（上限 **`10` 張**）。
     - **3rd Prize**：**`Caffeinated Candy`** × `clamp(round(50 * min(Pool_Size, 500000) / 500000), 1, 50)` 顆（上限 **`50` 顆**）。
     - **4th Prize**：**`Chaos Token`** × `clamp(round(500 * min(Pool_Size, 500000) / 500000), 1, 500)` 枚（上限 **`500` 枚**）。
     - **5th Prize**：**`Chaos Token`** × `clamp(round(500 * min(Pool_Size, 500000) / 500000), 1, 500)` 枚（上限 **`500` 枚**）。

---

### 2.4 Dawn of a New Day（跨日結算）、Stamina（耐力）與 OFC 解鎖規則

依據 [Dawn of a New Day](https://ehwiki.org/wiki/Dawn_of_a_New_Day)、[Stamina](https://ehwiki.org/wiki/Stamina) 與 [Skills#Special_Skills](https://ehwiki.org/wiki/Skills#Special_Skills)：

1. **Dawn of a New Day（每日 UTC 00:00 跨日事件）觸發內容**：
   - **每日獎勵發放**：獲得當前等級升下一級所需 EXP 的 **`5%`**（需進入 HV 才會觸發升級）、**`100–500 Credits`**（活躍帳號 `500–1,000 Credits`）。
   - **Hath Perk / Donator 每日配給**：擁有 `Soul Catcher` Perk 者自動獲得 **`10` 片 Soul Fragments**；Gold Star 以上贊助者自動獲得 **`1–5` 瓶 Energy Drinks**。
   - **每日首勝熟練度獎勵**：跨日後第一場勝利的戰鬥回合結束時，全熟練度（Proficiencies）獲得額外點數加成。
   - **重置每日挑戰與冷卻**：所有 **Arena** 與 **Ring of Blood** 關卡的每日 1 次挑戰限制重置；`Random Encounter` 計時器重置（跨日後 30 分鐘內不會觸發 RE）；`Long Gone Before Daylight` 的每日首瓶雙倍 Energy Drink 額度重置。
   - **今日弱點元素（Element of the Day / Day of the Week）切換**：週日 Holy (`-10%` Mit)、週一 Dark (`-10%`)、週二 Fire (`-10%`)、週三 Cold (`-10%`)、週四 Wind (`-10%`)、週五 **All 全屬性含物理與 Void (`-5%` Mit)**、週六 Elec (`-10%`)。
   - **小馬雕像集齊檢查（解鎖 Orbital Friendship Cannon）**：系統於每日跨日檢查玩家背包是否同時持有 **至少 21 種不同的 Collectibles（小馬雕像）**（必須留在背包中，不可獻祭給神殿）；條件滿足時解鎖特殊技能 **Orbital Friendship Cannon**（因此原版買齊雕像後需等待 **12–24 小時**跨日才生效）（? 來源未找到，2026-10-22 稽核：「由 Dawn 跨日檢查」無出處；Skills 頁只寫「It may take up to one day to become available」，`sources/parsed_wiki/Skills.md:87`，Dawn 事件清單 `sources/parsed_wiki/Dawn_of_a_New_Day.md:14-38` 沒有 OFC 檢查；「12–24 小時」出自社群教學 README，非百科）。
2. **Stamina（耐力）自然回復與消耗規格**：
   - **上限**：**`99` 點**。
   - **自然回復率**：每小時回復 **`1` 點**（每日自然回復 **`24` 點**；Isekai 賽季首月 Early Bird 期間翻倍為每小時 `2` 點）。
   - **Stamina 區間狀態**：
     - **`60–99`（Great 狀態）**：所有戰鬥獲得之 **EXP 翻倍（`2x`，獨立最終乘區）**，但每回合耐力消耗速度增加 50%（每勝利回合消耗 **`0.03` Stamina**）。
     - **`1–59`（Normal 狀態）**：無加成無懲罰，每勝利回合消耗 **`0.02` Stamina**（即 1 點 Stamina 可打 50 回合）。
     - **`0`（Exhausted 力竭狀態）**：無法獲得任何 EXP、Credits、熟練度或掉落物，且無法發起新戰鬥（當 `Stamina < 1` 時無法開始新戰鬥）。
   - **各模式特殊扣除規則**：
     - `Random Encounter`：**不消耗 Stamina（`0`）**。
     - `Grindfest`：入場時預扣 **`1` Stamina**，之後每回合仍照常消耗 `0.02` / `0.03` Stamina。
     - `Item World`：入場時**一次性預扣通關該 IW 全部波數所需的 Stamina**。
     - 戰鬥中逃跑（`Flee`）或戰敗（`Defeat`）：該回合不扣除 Stamina。
     - 戰場外使用 `Energy Drink` / `Caffeinated Candy`：僅在 Stamina 未滿時可用以補充至上限 99。

---

### 2.5 Training（全部 15 項訓練課程）成本公式與時數完整規格

依據 [Training](https://ehwiki.org/wiki/Training)、`hvUtils.js:5128-5143` 與 `hvTrainer.user.js:20-98`：
- **升級費用公式**（$N$ 為當前已訓練等級，$0 \le N < \text{MaxLevel}$，升第 $N+1$ 級之費用）：
  $$\text{Cost}(N) = \text{round}\Big( (\text{base\_cost} + \text{level\_cost} \times N)^{1 + \text{exponent} \times N} \Big)$$

| 課程 ID (`hvUtils`) | 訓練課程英文名稱 | 中文譯名 | 單級效果 | 總等級上限 | 角色等級限制 | 單級耗時 (Real Hours) | 滿級總耗時 | `base_cost` | `level_cost` | `exponent` | 升滿總費用 (Credits) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `50` | `Adept Learner` | 善學者 | `+1%` EXP Bonus | `300` | 無 | `1 H` | `300 H` (12.5 天) | `100` | `50` | `0.000417446` | `5,126,661 C` |
| `51` | `Assimilator` | 同化者 | `+10%` 熟練度獲取率 | `25` | 無 | `24 H` | `600 H` (25 天) | `50,000?` | `50,000?` | `0.0057969565` | `65,074,505 C` |
| `80` | `Ability Boost` | 能力升級 | `+1` Ability Point (AP) | `500` | `≤ Player_Level` | `2 H` | `1,000 H` (41.7 天) | `100` | `100` | `0.0005548607` | `109,521,466 C` |
| `81` | `Manifest Destiny` | 天命昭顯 | `+1` Mastery Point | `10` | `≤ floor(Player_Level / 50)` | `24 H` | `240 H` (10 天) | `1,000,000` | `1,000,000` | `0` | `55,000,000 C` |
| `70` | `Scavenger` | 拾荒者 | `+1%` 基礎總掉寶率（滿級 `10% -> 15%`） | `50` | 無 | `4 H` | `200 H` (8.3 天) | `500` | `500` | `0.0088310825` | `17,484,001 C` |
| `71` | `Luck of the Draw` | 抽籤運 | `+1%` 稀有基底防具（Phase/Shade/Power/Force Shield）出現率 | `25` | 無 | `8 H` | `200 H` (8.3 天) | `2,000` | `2,000` | `0.0168750623` | `18,371,541 C` |
| `72` | `Quartermaster` | 軍需官 | `+5%` 基礎裝備掉落率（滿級 `2.5% -> 5.0%`） | `20` | 無 | `12 H` | `240 H` (10 天) | `5,000` | `5,000` | `0.017883894` | `20,275,725 C` |
| `73` | `Archaeologist` | 考古學家 | `+10%` 基礎 Artifact 掉落率（滿級 `0.2% -> 0.4%`） | `10` | 無 | `24 H` | `240 H` (10 天) | `25,000` | `25,000` | `0.030981982` | `19,268,647 C` |
| `84` | `Metabolism` | 新陳代謝 | 魔物飽食度消耗減緩 `5%?`（滿級 `-50%?`） | `10` | 無 | `24 H` | `240 H` (10 天) | `1,000,000` | `1,000,000` | `0` | `55,000,000 C` |
| `85` | `Inspiration` | 激勵 | 魔物士氣衰減減緩 `5%?`（滿級 `-50%?`） | `10` | 無 | `24 H` | `240 H` (10 天) | `2,000,000` | `2,000,000` | `0` | `110,000,000 C` |
| `90` | `Scholar of War` | 戰鬥學者 | `+1` 戰鬥卷軸槽（初始 1，滿級 6 槽） | `5` | `≤ floor(Player_Level / 50)` | **`0 H`（瞬間）** | `0 H` | `30,000` | `10,000` | `0` | `250,000 C` |
| `91` | `Tincture` | 酩酊 | `+1` 戰鬥魔藥槽（初始 1，滿級 6 槽） | `5` | `≤ floor(Player_Level / 50)` | **`0 H`（瞬間）** | `0 H` | `30,000` | `10,000` | `0` | `250,000 C` |
| `98` | `Pack Rat` | 林鼠 | `+1` 通用戰鬥道具槽（初始 5，滿級 15 槽） | `10` | `≤ floor(Player_Level / 20)` | **`0 H`（瞬間）** | `0 H` | `10,000` | `10,000` | `0` | `540,000 C` |
| `88` | `Dissociation` | 解離症 | `+1` Persona 人格槽（初始 1，滿級 8 槽） | `7` | `≤ floor(Player_Level / 70)?` | `24 H` | `168 H` (7 天) | `1,000,000` | `1,000,000` | `0` | `28,000,000 C` |
| `96` | `Set Collector` | 套裝收藏家 | `+1` 裝備套裝槽（初始 3，滿級 7 套） | `4` | 無 | `12 H` | `48 H` (2 天) | `12,500` | `12,500` | `0` | `125,000 C` |
| **合計** | **15 項課程** | — | — | **991 級**（2026-10-22 稽核更正：原稿 971） | — | — | **`3,716 小時`（约 154.8 天不間斷）** | — | — | — | **`504,287,546 C`**（2026-10-22 稽核更正：原稿 489,287,546；`sources/parsed_wiki/Training.md:34-64` 逐列加總，等級 991、時數 3,716 與費用 504,287,546） |

> （2026-10-22 稽核補註）上表有三處來源帶問號、原稿拿掉了：Metabolism、Inspiration 的效果為「5%?」（`sources/parsed_wiki/Training.md:52,54`）；Assimilator 的 base cost／level cost 為「50,000?」（`sources/parsed_wiki/Training.md:92`）；Dissociation 的等級上限為「level / 70?」（`sources/parsed_wiki/Training.md:69`）。這些欄位一律視為 `?`。另，本節把 Training 的真實等待時間列為「多人斷鏈」不妥：Training 是時間閘、不依賴其他玩家，單機用本機時鐘即可照原版跑，且訓練進行中可照常戰鬥（`sources/parsed_wiki/Training.md:30`），屬體驗設計選擇，見文末斷點稽核補註。

---

### 2.6 原版 Isekai 模式（官方無主站／半封閉賽季世界）之經濟與拆解調整先例

依據 [Isekai](https://ehwiki.org/wiki/Isekai)、[Isekai Mode](https://ehwiki.org/wiki/Isekai_Mode)、[The Tower](https://ehwiki.org/wiki/The_Tower)、`hvUtils.js:2303-2311, 6125, 10276` 與 `hv_chinese.js:2355, 2364`，當官方設計一個**從 Lv.0 白手起家、不依賴既有龐大累積庫存與 Monster Lab** 的平行世界時，官方採用的確切規則調整如下（這是我們在單機版設計「保守修補、原味優先」規則最重要的**官方第一手先例**）：

| 調整維度 | 原版 Persistent（常駐多人主世界） | 原版 Isekai（官方平行賽季世界） | 官方調整背後的設計意圖（供單機版借鏡） |
|---|---|---|---|
| **1. 拆解（Salvage）基礎材料產出** | 拆解 `Superior` 給 **`1` 個 Low-Grade**；拆解 `Exquisite` 給 **`1` 個 Mid-Grade**；拆解 `Magnificent+` 給 `1` 個 High-Grade（`hvUtils.js:6125`）。 | 拆解 `Superior` 給 **`3` 個 Low-Grade（3 倍）**；拆解 `Exquisite` 給 **`2` 個 Mid-Grade（2 倍）**；拆解 `Magnificent+` 給 `1` 個 High-Grade（`Isekai.md:103`、`hvUtils.js:6125`）。 | 因無歷史囤貨與 Monster Lab，直接拉高拆解中低階裝備的材料產出，讓玩家靠打怪拆裝即可自給自足鍛造。 |
| **2. 高階材料與稀有材料（Rares）掉落替代** | `Crystallized Phazon` / `Shade Fragment` / `Repurposed Actuator` / `Defense Matrix Modulator` **只能從 Monster Lab 魔物回禮取得**（? 來源未找到，2026-10-22 稽核：來源沒有明寫「Rare 只來自 Monster Lab」；The Armory 寫 Rare Materials「Cannot be retrieved from salvaging (except from those coming from upgrades…)」，`sources/parsed_wiki/The_Armory.md:126-133`，只有 Phase／Shade／Power／Force Shield 需要，`:107` 寫「rare materials depending on the equipment type」；Items 頁寫 Materials「primarily… gifts from monsters or salvaging」，`sources/parsed_wiki/Items.md:277`。因此斷點 A 所稱「Peerless 全身 7–8 件要 800 個 Rare」很可能誇大，依 `:107` 只有稀有基底裝備才需要）；小怪掉 `Precursor Artifact` 與 `Collectibles`。 | **關閉 Monster Lab**；小怪原本掉落 `Artifact` 與 `Collectible` 的判定，**直接替換為掉落 `High-Grade Materials`（佔 `80%`）與 `Rare Materials`（佔 `20%`）**（`Isekai.md:101`）。 | 徹底解決「沒有養幾十隻高 PL 魔物就拿不到稀有升級材料（Rares）與高階材料」的斷鏈！ |
| **3. 黏合劑（Bindings）與 Stat Fusion** | v0.86 鍛造 Lv.6+ 需 Bindings；v0.91 Stat Fusion 需大量同基底傳奇裝与 10x Bindings。 | **鍛造升級完全不需消耗 Bindings**（`Isekai.md:105`、`hvUtils.js:10479`）；v0.91 則標註 **Stat Fusion 在 Isekai 停用**（`hv_chinese.js:2364`）。 | 官方承認 Bindings 與同基底傳奇裝在無全服長年累積的環境下無法靠個人湊齊。 |
| **4. 靈魂綁定（Soulbind / SoulFuse）與 Soul Fragments** | Soulbind 全額消耗 Soul Fragments；靠 RE 機率掉 5 片或花 1,000 C 買。 | **所有品質的 Soulbind 消耗減半（`0.5x`）**（`Items.md:236`、`Isekai.md:124`），且新增 **The Tower 每通關一層保底給 `10` 片 Soul Fragments + `1` 件對應 Tier 1–7 裝備**（`The_Tower.md:28-30`）。 | 降低換裝綁定門檻，並用爬塔首通提供穩定的裝備與靈魂碎片來源。 |
| **5. Training 訓練課程與等待時間** | 15 項課程需花約 5.04 億 Credits（504,287,546 C；2026-10-22 稽核更正：原稿 4.89 億）與 3,716 小時真實時間逐一掛機。 | **關閉 Training 介面**，直接給所有玩家預設滿級開啟：`Scholar of War`、`Tincture`、`Pack Rat`、`Scavenger`、`Quartermaster`、`Luck of the Draw`、`Archaeologist`（且強化為 **+300%** 而非 +100%），並隨等級自動給滿 **`Ability Boost`（每級 +1 AP）**與 **`Manifest Destiny`（每 50 級 +1 Mastery Point）**（`Isekai.md:66-88`）。 | 證明官方也認為真實時間等待的 Training 在重開局／單人衝刺體驗中是純粹的時間水桶，可直接隨等級給或免等待。 |
| **6. Hath Perks 與經驗倍率** | 需花約 64.95 萬 Hath 逐一購買（2026-10-22 稽核更正：原稿 49.7 萬）。 | 預設免費開啟 `Follower of Snowflake`、`Innate Arcana V`、`Hoarder V`；全局固定給予 **`500%` EXP Bonus**；傳奇 Boss（Schoolgirls）HP 減半（`Isekai.md:89-98, 126-128`）。 | 證明在無主站 Hath 匯入的環境下，核心功能型 Hath Perks 應透過遊戲內建機制解鎖。 |
| **7. Item World 強化效率與市場限制** | v0.86 IW PXP 倍率 Normal/Hard `2`、Nightmare `4`、Hell `7`、Nintendo `10`、IWBTH `15`、PFUDOR `20`。 | IW PXP 獲取量提升為 **Persistent 的 3 倍**（Normal/Hard 直接拉齊至 Nightmare 的 3 倍即 `12`，PFUDOR 達 `60`，見 `hvUtils.js:10276`）；關閉 Lottery、Item Bot、Monster Lab，Market 僅留 Consumables / Materials / Trophies 三分頁（`hvUtils.js:2303-2311`）。 | 大幅壓縮單人養成裝備所需的機械重複場次。 |

---

## 三、單機環境下的「多人市場依賴斷鏈點」全盤點與候選修補方案（供 Ticket `006` 拍板）

以下逐項診斷將原版 HentaiVerse 直接搬移至純單機環境時的 **5 大斷鏈點（A–E）**，給出精確定量分析，並為每一斷點提供 **2–3 個最保守、最貼近原版體感（或直接援引官方 Isekai 模式先例）的候選修補方案**：

---

### 斷點 A：Item Shop 非綠字商品空倉與 Equipment Shop 無裝備生成

#### 1. 原版機制與單機死鎖診斷
- **事實查證（含反證勘誤）**：
  - 如第 1.2 節所述，透過 `Bazaar.html` 原始 HTML `<span style="color:#00B000">` 與 `hvUtils.js:9905-9936` 交叉驗證，**基礎藥水（Draught / Potion / Elixir 共 9 種）、`Soul Fragment`、全部 12 種 `Crystals`、3 種 `Monster Food`、`Happy Pills`、4 種 `Scrap` 與 `Energy Cell`（及 v0.86 的 6 種 `Catalysts`）在原版實為綠字無限供應**，單機版直接保留綠字無限供應即可，不會斷鏈。
  - **真正會在單機版發生「永久空倉（庫存 = 0）」的非綠字商品**為以下 6 類：
    1. **戰鬥卷軸（`Scrolls` 全 7 種）與元素魔藥（`Infusions` 全 6 種）**：在原版 `Loot_Drop_Rolls` 中，每殺 1 隻怪基礎掉率 `10%`，扣除裝備與 Artifact 後進入 `I.Type Roll`，其中 `Scrolls` 僅佔 `10%`（單種約 `0.14%`/kill）、`Infusions` 僅佔 `4%`（單種約 `0.067%`/kill）、`Shards` 僅佔 `4%`（單種約 `0.13%`/kill）。然而在高難度戰鬥中，玩家每 100–200 ticks 就要消耗一整排卷軸（Haste / Protection / Shadow Veil / Spark of Life / Absorb）（? 來源未找到，2026-10-22 稽核：此用量推論沒有用量數據；「入不敷出」的結論缺乏支撐），且在 **v0.91 中鑲嵌與維修元素 Strike / Proof Charms 每次要消耗 10–20 瓶對應 `Infusions`，鑲嵌與維修 Featherweight / Voidseeker / Aether Charms 每次要消耗 10–20 顆對應 `Shards`**！原版多人環境靠全服近戰玩家把不用的 Scrolls / Infusions / Shards 賣給商店或 Market 供貨；純單機若不開放購買，卷軸流與 Charm 鑲嵌維修將嚴重入不敷出。
    2. **耐力與終極回復品（`Energy Drink`、`Caffeinated Candy`、`Last Elixir`；2026-10-22 稽核更正：Last Elixir 有 Shrine 來源，原稿 2.2 節自己也寫了「10% 得 3 瓶 Last Elixir」，不應列為「只能靠玩家賣店」的斷鏈品，`sources/parsed_wiki/The_Shrine.md:45`）**：原版 `Energy Drink` 僅由 Gold Star 以上贊助者每日 Dawn 領取（1–5 瓶）並放到 Market 出售；單機無贊助者賣出，玩家將完全無法取得 `Energy Drink`，每天只能靠自然回復的 24 點 Stamina（約 800–1,200 回合）遊玩。（2026-10-22 稽核更正：事實部分屬實，Gold Star 以上贊助者每日 2～5 瓶、只能在 Market 交易，`sources/parsed_wiki/Stamina.md:15`、`sources/parsed_wiki/Items.md:85`；但「斷鏈」結論誇大：不付費的原版玩家本來也只靠每天自然回復的 24 點；Stamina 頁稱它是「primarily an anti-cheating mechanism」，官方 Isekai 也寫「There are no stamina recovery items, so play will be limited by the available stamina」，`sources/parsed_wiki/Isekai.md:115-116`，官方接受沒有耐力補品，開放購買 Energy Drink 等於讓玩家以 Credits 買體力，是設計取捨而非必要補洞。）
    3. **分級鍛造材料（`Low / Mid / High-Grade Materials` 全 12 種）與稀有科技材料（`Rares` 全 4 種）**：v0.91 單件 `Peerless` 裝備升滿 Lv.30 需要 **`3,000` 個 Mid-Grade + `1,275` 個 High-Grade + `100` 個 Rare Material**（全身 7–8 件裝備共需 **24,000 個 Mid-Grade、10,200 個 High-Grade、800 個 Rare Materials**！）（? 來源未找到，2026-10-22 稽核：「全身 800 個 Rare」很可能誇大，Rare Materials 依 The Armory 只有 Phase／Shade／Power／Force Shield 這類稀有基底裝備需要，`sources/parsed_wiki/The_Armory.md:107,126-133`）。原版單機若商店空倉，且 `Rare Materials` 拆解裝備完全不產出（僅靠 Monster Lab 緩慢回禮），玩家拿到一件 `Phase / Shade / Power / Force Shield` 連 Lv.1 都升不上去！
    4. **黏合劑（`Bindings` 全 38 種）**：Item Shop 庫存為 0（詳見斷點 C）。
    5. **The Armory 裝備商店（`Purchase` 分頁）**：原版 `The_Armory.md:502` 明文記載「*The Equipment found in the purchase section comes solely from players that sold them to the bazaar; it does not generate any equipment on its own*」。單機版 `Purchase` 分頁將永遠是空的（除自己剛賣出／拆解待買回的裝備外），前期開荒無法從商店淘換過渡裝。

#### 2. 候選修補方案（供 Ticket `006` 拍板）
- **方案 A1（最保守、零新公式：將 Item Shop 既有定價之消耗品與基礎材料直接轉為「綠字無限供應」，參考官方定價表）**：
  - **做法**：保留 [Bazaar](https://ehwiki.org/wiki/Bazaar) 官方已經定好的 `Cost to Buy` 價格，直接將 Item Shop 表格中原本標有買價的 **`Scrolls`（100–800 C）、`Infusions`（200 C）、`Shards`（1,000 / 5,000 C）、`Energy Drink`（5,000 C）、`Last Elixir`（5,000 C）、`Low/Mid/High-Grade Materials`（200 / 1,000 / 5,000 C）、`Rare Materials`（10,000 C）、`Bindings`（1,000 C）** 改為與基礎藥水相同的「系統無限供應（綠字）」；而 `Flower Vase` / `Bubble-Gum`（原版 `Cost to Buy: N/A`）與 `Artifacts / Trophies / Collectibles` 則維持「僅限掉落，商店不可直接購買（僅可賣出與 24h 原價/加價買回）」。
  - **優點**：100% 沿用原版 `Bazaar` 官方買價（如全套 Peerless 升級材料若全用買的需 `3000*1000 + 1275*5000 + 100*10000 = 10,375,000 C`，正好成為中後期極佳的 Credits 回收池！），不需發明任何新匯率或虛擬市場演算法，且讓 `Coupon Clipper`（9 折 Perk）價值完全發揮。
- **方案 A2（官方 Isekai 模式混合方案：戰鬥耗材轉綠字無限供應 ＋ 鍛造材料走 Isekai 加倍拆解與掉落替換）**：
  - **做法**：
    1. `Scrolls`、`Infusions`、`Shards`、`Energy Drink`、`Last Elixir` 在 Item Shop 按官方買價開放無限購買（解決戰鬥與 Charm 維護耗材）。
    2. 鍛造材料（`Low/Mid/High-Grade` 與 `Rares`）在 Item Shop 不無限賣（或限量每日刷新），改為採納 **官方 Isekai 規則**：拆解 `Superior` 給 **3 個 Low-Grade**、拆解 `Exquisite` 給 **2 個 Mid-Grade**、拆解 `Magnificent+` 給 **2 個 High-Grade**，且拆解稀有基底防具（`Phase / Shade / Power / Reactive / Force Shield`）在 `Superior+` 品質時額外固定產出 **`1` 個對應 Rare Material**（或採用 Isekai 規則讓小怪額外以 80/20 比例掉落 High-Grade 與 Rare Materials）。（2026-10-22 稽核更正：「拆解 Magnificent+ 給 2 個 High-Grade」與本報告 2.6 表自己寫的「1 個 High-Grade」矛盾，且在 Isekai 頁查不到這一格，`sources/parsed_wiki/Isekai.md:103`；「拆解稀有基底防具額外產出 1 個 Rare Material」不是 Isekai 規則，Isekai 的稀有材料來源是「Artifact and Collectible drops are replaced with high-grade and rare upgrade materials at a rate of 80/20」，`sources/parsed_wiki/Isekai.md:101`，此項為本專案自創提案；Isekai.md 另仍在講 Potency 與 SoulFusing，是 0.91 之前的規則，0.91 後的 Isekai 是否照舊 ? 無法確認。）
  - **優點**：保留「打寶拆裝湊材料」的 RPG 鍛造迴圈，避免所有材料都變成純刷錢向商店買。
- **方案 A3（動態每日刷新商店池＋The Armory 隨機過渡裝刷出）**：
  - **做法**：每逢 Dawn of a New Day（或每完成 N 場戰鬥），Item Shop 非綠字商品按定額補充隨機庫存（例如每日補充 `Energy Drink` 5–10 瓶、`Scrolls/Infusions` 各 100–500 個、各級材料 50–200 個），且 The Armory `Purchase` 分頁每次跨日自動依玩家當前等級生成 10–20 件 `Average`～`Exquisite` 品質的隨機過渡裝備供 Credits 購買（15 分鐘或跨日淘汰）。
  - **優點**：最能還原原版「逛裝備店偶爾淘到好詞綴過渡裝」與「商店有庫存限制」的氛圍。

---

### 斷點 B：Hath（與主站 GP）來源斷絕，導致 649,500 Hath Perks 與樂透鎖死

#### 1. 原版機制與單機死鎖診斷
- **定量缺口計算**：
  - 如表 2.1 所示，HentaiVerse 專屬的 60 階 Hath Perk 全點滿需要 **`649,500 Hath`**（2026-10-22 稽核更正：原稿「19 個系列、497,700」，`sources/parsed_wiki/Hath_Perks.md:36-95` 逐列加總；原稿自己的分項 102,700 ＋ 545,000 ＝ 647,700 已經與錯誤總額 497,700 矛盾，與正確總額只差 1,800，即其餘零散 Perks）（其中開荒與中期核心 QoL Perks：`Thinking Cap ~ Cybernetic Implants` 2,500、`Innate Arcana I–V` 7,500、`Repair Bear Mk.1–4` 25,000、`Crystarium I–V` 26,000、`Hoarder I–V` 15,000、`Tokenizer I–III` 8,500、三圍與五系熟練度 8,000、`Coupon Clipper` 1,000、`Soul Catcher` 500、`Yakety Sax` 200、`Enigma Energizer` 200 等合計約 **`102,700 Hath`**；後期傷害與終局 Perks：`Manehattan Project` 25,000、`Follower of Snowflake` 50,000、`Dæmon Duality I–IX` 170,000、`Limit Breaker I–V` 300,000 合計 **`545,000` 內含於總額 `649,500 Hath`**）。
  - 在原版單機內，唯一的原生 Hath 來源是向 Shrine 獻祭 `Precursor Artifact`（滿紅字屬性上限後 `20%` 機率得 `2 Hath`，每顆期望值 **`0.4 Hath`**）。
  - 依 `Loot_Drop_Rolls.md:70`，即便點滿 `Scavenger`（Lv.50）與 `Archaeologist`（Lv.10）且打高 PL 怪物，每殺 1 隻怪的真實 Artifact 掉率約為 `0.275 * 0.004 = 0.11%`（即約每殺 **909 隻怪**才掉 1 顆 Artifact = `0.4 Hath`）。若無其他來源，玩家要刷 **約 14.8 億隻怪**（1,623,750 顆 Artifact × 909 殺／顆 = 1,475,988,750；2026-10-22 稽核更正：原稿 11.3 億，由錯誤總額 497,700 算出）才能點滿 Hath Perks，在單機版 100% 構成死鎖！（2026-10-22 稽核補註：此掉率的 27.5% 總掉落率要靠「PL ≥ 1250 的怪物」的 +15%，`sources/parsed_wiki/Loot_Drop_Rolls.md:25,58`，而 PL 是 Monster Lab 自創怪的屬性；單機沒有其他玩家的高 PL 怪時此前提不一定成立，掉率與 909 殺的估算都要重算。）
  - 此外，原版 **The Lottery** 彩券價格為 `1,000 GP`，單機版無主站圖庫 GP，必須將 GP 需求徹底移除或轉為 Credits。

#### 2. 候選修補方案（供 Ticket `006` 拍板）
- **方案 B1（最貼近原版主站「Hath Exchange」體驗：在 Bazaar 內建固定／階梯匯率的「Credits ⇄ Hath 兌換所」＋ 樂透改收 Credits）**：
  - **做法**：
    1. 將原版主站的 `Hath Exchange` 直接內建為 Bazaar 的一個子分頁（或 Item Shop 購買項），允許玩家以 **固定匯率（例如原版長期經典匯率區間 `1 Hath = 10,000 ~ 25,000 Credits`，或前期優惠階梯價 `1 Hath = 5,000 ~ 10,000 Credits`；? 來源未找到，2026-10-22 稽核：這些匯率無出處，屬推測；來源只寫原版 Hath Exchange 是「Purchased stock market-style … at the Hath Exchange with credits」向其他玩家買，`sources/parsed_wiki/Hath.md:27`，單機沒有賣方，故「Credits 換 Hath」是本作新增的設計決定，不是保留原版）** 用 Credits 直接兌換 Hath。
    2. 保留 Shrine 獻祭 `Precursor Artifact` 獲得 Hath 的機制，但將單次命中獎勵從 `2 Hath` 提高為 **`10–25 Hath`**（使每顆 Artifact 的神殿價值與賣店／市價匹配）。
    3. **The Lottery** 彩券直接改為消耗 **`1,000 Credits` / 張**（完全移除 GP 概念）。
  - **優點**：完全符合原版無課／非掛機玩家「刷 Credits 去 Hath Exchange 買 Hath 點 Perk」的核心經濟循環，且讓 Credits 在中後期擁有明確、平滑的消耗出口。
- **方案 B2（里程碑／首通成就驅動 + Dawn 每日俸祿，不讓 Credits 通膨直接買光终局 Perks）**：
  - **做法**：
    1. **Arena 與 Ring of Blood 首次通關獎勵**、**角色每升 10 級**、以及 **The Tower 每通關 1 層**，直接發放定額 **Hath 獎勵**（例如 24 個 Arena 首通隨等級發放 `100 ~ 5,000 Hath`，RoB 首通發放 `500 ~ 5,000 Hath`，角色每升 1 級發 `5–20 Hath`）。
    2. **Dawn of a New Day** 依玩家當前稱號（Rank / Title，從 Newbie 到 Godslayer / Ponyslayer）每日固定發放 **`10 ~ 200 Hath`**（模擬原版 Stars 與 Awards 的每日 Dawn Hath 配給）。
    3. 搭配小額的 Bazaar Credits 換 Hath。
  - **優點**：將 Hath 綁定於「推進關卡進度與角色等級」，極具單機 RPG 成就感，防止玩家只靠低階農錢就提早買出 `Dæmon Duality IX`。
- **方案 B3（參考官方 Isekai 先例：QoL 類 Hath Perks 改為隨角色等級／任務自動解鎖，數值類 Perks 併入 Credits 訓練或神殿兌換）**：
  - **做法**：仿照 `Isekai.md:89-98`，將 `Hoarder I–V`、`Innate Arcana I–V`、`Yakety Sax`、`Soul Catcher` 等 QoL Perks 綁定角色等級自動免費解鎖；（2026-10-22 稽核更正：Isekai 只在一開局直接給 Follower of Snowflake、Innate Arcana V、Hoarder V 三項，並寫「all others are disabled」，`sources/parsed_wiki/Isekai.md:89-98`；Yakety Sax、Soul Catcher、Repair Bear、Crystarium、Tokenizer 在 Isekai 都是停用的，Isekai 也沒有「隨等級解鎖」的做法，故「參照 Isekai 先例」只能涵蓋這三項，其餘為本專案自創。）其餘戰鬥與經濟加成 Perks 維持 Hath 購買並由方案 B1/B2 供貨。

---

### 斷點 C：v0.91 Stat Fusion「同基底同部位傳奇裝」與「特定 Bindings」湊齊難度

#### 1. 原版機制與單機死鎖診斷
- **定量缺口計算**：
  - 依 [The Armory#Stat_Fusion](https://ehwiki.org/wiki/The_Armory#Stat_Fusion) 與 `infer_equip_stats.py:69-157`，v0.91 將一件 `Legendary`（基礎骰值 `170–200`，期望平均為 `185`）融合晉升為 `Peerless`（全屬性達 `200`）：
    - 若每次犧牲另一件 `Legendary`（多數情況每次 `+1`，若祭品該項屬性高於本體則 `+2`），平均需要進行 **約 `10–15` 次 Stat Fusion**；若後續開啟 `Limit Breaker I–V` 要從 `Peerless (200)` 融合到 `Ultimate (250)`，犧牲 `Legendary` 每次僅 `+1`，還需要額外 **50 次 Stat Fusion**！
    - **條件 1（同基底同部位祭品）**：規定祭品必須是「**Same Template + Slot**」（例如 `Cotton Shoes` 只能吃 `Cotton Shoes`，不能吃 `Phase Shoes` 或 `Cotton Pants`）。v0.91 共有 33 種裝備基底（7 單手 + 6 雙手 + 5 法杖 + 4 盾牌 = 22 種武器盾牌；布甲 4 基底 × 5 部位 = 20 種；輕甲 4 基底 × 5 部位 = 20 種；重甲 4 基底 × 5 部位 = 20 種；合計 **82 個獨立「基底×部位」槽位**，即便扣除已停產舊基底也有 **54–75 個獨立組合**）（2026-10-22 稽核更正：此處「33 種基底、22+20+20+20 = 82 組、54–75 組」與本報告開頭「33 種基底展開為 75 組」的基底數與組合數都對不上，應以 003 報告表列的 21 種武器／法杖／盾牌基底＋12 種防具材質重算，? 組合數與下列「1/54～1/75」「800–1,100 件傳奇」「40,000–55,000 場 FSM」皆未驗證；另該推算忽略了 Trophy 可指定大類，且 2% 傳奇率出自 `sources/parsed_wiki/Loot_Drop_Rolls.md:27`）。在單機環境中，每掉 1 件 `Legendary` 裝備，只有 **`1/54` ~ `1/75`（約 1.3%–1.8%）** 的機率剛好是你想融合的那個基底與部位！要湊齊 15 件同基底同部位的 `Legendary` 祭品，玩家必須先刷出 **800–1,100 件 `Legendary` 裝備**（以 T6 Trophy 2% 傳奇率計算，相當於要打 **40,000–55,000 場 FSM**）！
    - **條件 2（每次每屬性 10 個對應 Bindings）**：一件裝備通常有 **6–10 個可融合屬性**，每次融合每個屬性收 **10 個對應 Binding**。融合 15 次就需要 **每種對應屬性 `150` 個特定 Binding**（例如一件武器需要 150 個 `Binding of Slaughter` + 150 個 `Binding of Balance` + 150 個 `Binding of Isaac`...）。而在原版中，Bindings 共有 **38 種**，來源只有献祭小馬雕像（每次隨機 1 個，命中特定一種機率僅 `1/38 = 2.63%`）與 Monster Lab 隨機回禮！在沒有全服市場互通有無的情況下，單機玩家根本不可能湊齊單一種類 150 個 Binding！

#### 2. 候選修補方案（供 Ticket `006` 拍板）
- **方案 C1（最推薦、維持 v0.91 Stat Fusion 原貌但放寬單機祭品條件与開放 Binding 購買／轉換）**：
  - **做法**：
    1. **祭品條件放寬（二選一或並行）**：允許使用 **「同部位同大類（例如任意 Cloth Shoes 皆可作為 Phase Shoes 的 `+1` 祭品，而同基底 Phase Shoes 則保底作為 `+2` 祭品）」**，或者允許直接消耗 **額外數量的 `Legendary / Peerless Cores`（例如 `3–5` 顆對應 Core）代替犧牲實體同名裝備**！
    2. **Bindings 取得畅通**：結合方案 A1，讓 38 種 `Bindings` 在 Item Shop 按官方定價 **`1,000 Credits` / 個** 開放綠字無限購買（或在 Shrine 獻祭 Collectible 時允許自選／以 2:1 轉換任意指定種類的 Binding）。
  - **優點**：完全保留 v0.91 最核心的 `Legendary (170–200) -> Peerless (200) -> Ultimate (250)` 養成樂趣與溢位分配演算法（`_calc_fusion_stats`），同時消除單機 `1/75` 同基底配對與 `1/38` Binding 抽卡的數學死鎖。
- **方案 C2（降低單次融合消耗 + 提高單次融合點數）**：
  - **做法**：維持「同基底同部位（或同材質大類）」限制，但將單機版每次犧牲 `Legendary` 的點數從 `+1/+2` 提升為 **`+5 / +10`**（即只需吃 **2–3 件**同類傳奇裝即可從 185 升滿 200 Peerless），且每次融合每屬性消耗的 Binding 從 `10` 個降為 **`1–2` 個**（或參考官方 Isekai 模式免除 Binding 消耗）。
  - **優點**：只需刷到 2–3 件同類傳奇裝就能完成融合，大幅符合單機遊戲的掉落期望值。
- **方案 C3（新增神殿 Trophy 指定基底鍛造／重骰機制）**：
  - **做法**：在 Shrine 獻祭高階 Trophy（Tier 5+）時，除了原版可選 7 大類（1H / 2H / Staff / Shield / Cloth / Light / Heavy）外，允許額外花費 Credits 或 Crystals **鎖定特定基底或部位**，讓單機玩家可以定向農出目標部位的 `Legendary` 祭品。

---

### 斷點 D：小馬雕像（Collectibles 全 27 種集齊 21 種）解鎖 OFC 的單機集換困境

#### 1. 原版機制與單機死鎖診斷
- **定量缺口計算**：
  - 依 `Items.md:240` 與 `Skills.md:87`，解鎖全遊戲最強清場技能 **Orbital Friendship Cannon（OFC，ID `1111`）** 的唯一條件是：**背包內同時保有 27 種小馬雕像中的至少 `21` 種不同款式**，並經過一次 Dawn of a New Day 結算（? 來源未找到，2026-10-22 稽核：「經過 Dawn 結算」無出處，Skills 頁只寫「It may take up to one day to become available」，`sources/parsed_wiki/Skills.md:87`；背包保留不可獻祭見 `sources/parsed_wiki/Items.md:244`）。
  - 在原版多人環境中，新手的標準開荒流程（見 `KesaubeEire/HentaiVerse101` `README.md:18-19`）是：**直接拿 30 萬～50 萬 Credits 去 The Market 把 21–27 種小馬雕像各買 1 隻**，隔天立刻解鎖 OFC 開荒！
  - 但在純單機環境中：
    1. 根據 `Loot_Drop_Rolls.md:33-34`，小怪先要通過 `Drop Roll (10%–27.5%)` -> 未掉裝備 -> 通過 `Artifact Roll (0.2%–0.4%)` -> 再通過 `Collectable Roll (~1%)` 才會掉 1 隻小馬雕像！就算 `Collectable Roll` 指的是佔非裝備掉落的 `0.01%–0.1%`，掉率也極度稀有。
    2. 更嚴重的是 **Coupon Collector's Problem（集換式抽卡問題）**：從 27 種等機率雕像中不重複地湊齊 21 種不同款式，期望需要抽到：
       $$E[T_{21/27}] = \sum_{k=0}^{20} \frac{27}{27 - k} = 27 \times \left(\frac{1}{27} + \frac{1}{26} + \dots + \frac{1}{7}\right) \approx 38.92 \text{ 隻雕像}$$
       （2026-10-22 稽核更正：原稿 36.26，以同一公式重算為 38.92；「27 種等機率」假設無出處。）在沒有玩家市場交換重複雕像的情況下，玩家會抽到十幾隻重複的小馬雕像卻卡在最後幾隻，直到 Lv.300+ 都還沒解鎖原本設計給開荒期使用的 OFC！（? 來源未找到，2026-10-22 稽核：「直到 Lv.300+ 都還沒解鎖」無出處。）

#### 2. 候選修補方案（供 Ticket `006` 拍板）
- **方案 D1（最保守、貼近原版新手體驗：神殿／商店提供「重複雕像交換」＋ Item Shop 按官方價 50,000 C 限量／全部販售）**：
  - **做法**：
    1. **未擁有款式優先掉落或神殿兌換**：在 Shrine 新增「以 `2` 隻任意重複小馬雕像（或 `1` 隻重複雕像 + `10,000 C`）指定兌換 `1` 隻尚未擁有的小馬雕像」；或者在掉落判定時對「背包中尚未擁有的雕像款式」給予權重加成。
    2. **商店開放購買**：在 Item Shop（或透過 Arena 首通解鎖進度）允許玩家以 `Bazaar` 官方定價 **`50,000 Credits` / 隻** 直接購買各款小馬雕像（買齊 21 隻共 `1,050,000 Credits`）。（2026-10-22 稽核更正：原稿稱此價「與原版《HentaiVerse101》花幾十萬 Credits 買齊的節奏完全一致」，不成立：該 README 原文為「乞讨 30w-50w Credits，把市场里的小马雕像每一个都买一个」，即買齊只要 30–50 萬（每隻約 1.1–1.9 萬），本方案是其 2–3.5 倍；且原文寫的是「乞討」，代表新手這筆錢本來就靠其他玩家給；README 第 18 行，原始檔不在 `sources/` 內，僅存於 session 暫存目錄（暫存檔已失效風險）。另 Item Shop 的 50,000 C 是玩家賣給商店的有限庫存價，不是系統無限供應，`sources/parsed_wiki/Item_Shop.md:15`。）
    3. **解鎖觸發時機**：集齊 21 種不同雕像時，**立即解鎖 OFC**（或於手動點擊「休息／跨日」時立即觸發，無須乾等真實世界 12–24 小時）。
- **方案 D2（將小馬雕像綁定至 24 個 Arena 關卡首通保底掉落）**：
  - **做法**：原版 Arena 剛好有 **24 個挑戰關卡**（從 Lv.1 `First Blood` 到 Lv.500 `Secret Pony Level`）。讓前 21–24 個 Arena 挑戰關卡首次通關時，除了原有的 Credits 與裝備獎勵外，**每關固定保底掉落 1 隻不重複的特定小馬雕像**（同時保留小怪隨機掉落供玩家獻祭給 Shrine 換 Binding 與 High-Grade 材料）。
  - **優點**：將 OFC 的解鎖完美轉化為單機 RPG 的主線推進目標（或讓前 10–15 關掉落湊齊即可解鎖）。
- **方案 D3（恢復早期版本「集齊 10 隻解鎖 OFC」門檻 ＋ 不重複掉落保護）**：
  - **做法**：如 Ticket 004 題幹所述，將解鎖 OFC 的門檻調回早期版本的 **10 種不同小馬雕像**，並在集齊前啟用輕度防重複保底。

---

### 斷點 E：每日樂透（The Lottery）、魔物實驗室（Monster Lab 他人遭遇）與 Training／Dawn 真實時間等待

#### 1. 原版機制與單機死鎖診斷
這是一組全部源於「**全服共用伺服器時鐘與多人互動池**」的斷鏈點：
1. **The Lottery 全服彩池消失**：
   - 原版全服玩家每天共同買數十萬張彩券抽 1 件 Peerless 裝備與 1 份 Peerless Cores；且 2–5 獎（Golden Ticket 1–10 張、Caffeinated Candy 1–50 顆、Chaos Token 1–500 枚）的數量依賴「全服總售出彩券數 `Pool_Size / 500,000`」。
   - 若單機版只有玩家 1 人買票：玩家花 `1,000 C` 買 **1 張彩券**，中獎率就是 **100% 必中頭獎 Peerless 裝備**！反之若不給虛擬彩池，2–5 獎永遠拿不到滿額。
2. **Monster Lab 依賴「其他玩家在戰鬥中遭遇你的魔物並落敗／逃跑」**：
   - 依 `Monster_Lab.md:411-419`，自創魔物要帶回禮物（Materials / Bindings / Rares / World Seeds），取決於「該魔物自上次送禮後贏得了多少場戰鬥（Battles Won）」，且原版規定 **「玩家自己死於自己的魔物不計入勝場（Does not count deaths to a player's own monsters）」**！
   - 在純單機環境中，根本沒有「其他玩家」去遇到你的魔物並輸給它或逃跑，若照搬原版規則，Monster Lab 的魔物永遠是 `0 Wins`，只能每 72 小時保底領 1 次低額禮物，整個魔物養成與材料供應鏈徹底癱瘓！
3. **Training 真實時間倒數（0h–24h，總計 3,716 小時）與 Dawn 跨日（UTC 00:00）**（2026-10-22 稽核更正：(a) 單級耗時範圍應為 0H–24H：Scholar of War、Tincture、Pack Rat 是 0H，`sources/parsed_wiki/Training.md:56-60`；(b) 此項歸類錯誤：Training 的真實時間與 Dawn 都是時間閘、不依賴其他玩家，單機用本機時鐘即可照原版跑，且訓練進行中可照常戰鬥，`sources/parsed_wiki/Training.md:30`，屬體驗設計選擇而非「多人斷鏈」；(c) 反而是真正的主站依賴被漏掉：Dawn 事件「is made visible by visiting the news page or any particular gallery page」（在主站新聞頁或圖庫頁的廣告位顯示），`sources/parsed_wiki/Dawn_of_a_New_Day.md:12`，見文末覆蓋缺口）：
   - 單機遊戲玩家不會開著遊戲乾等真實世界 24 小時只為了升 1 級 `Assimilator` 或 `Archaeologist`，也不會在打完當天一輪 Arena / RoB 後關遊戲等明天 UTC 00:00。

#### 2. 候選修補方案（供 Ticket `006` 拍板）

##### 針對 E-1（The Lottery 單機化）：
- **方案 E1-a（最推薦：模擬固定規模的「NPC 虛擬彩池」）：**
  - **做法**：每期 Weapon / Armor Lottery 固定生成一個 **NPC 虛擬總彩池（例如固定為滿池 `500,000` 張，或隨機 `200,000 ~ 500,000` 張）**。
  - 當玩家購買 $K$ 張彩券（每張 `1,000 Credits`，上限 `20,000` 張；若用 `Golden Lottery Ticket` 則為 `min(2*(K+100), 0.1 * Pool_Size)`）時：
    - 玩家抽中第 1 名（頭獎 `Peerless` 裝備或 `Do Not Want` 核心）、第 2 名（`10x Golden Lottery Tickets`）、第 3 名（`50x Caffeinated Candies`）、第 4 名（`500x Chaos Tokens`）、第 5 名（`500x Chaos Tokens`）中任一獎項的機率，嚴格按照玩家彩券佔總彩池比例 $p = \frac{K_{\text{eff}}}{\text{Pool\_Size}}$ 進行無放回抽籤（例如在 250,000 池中買滿 20,000 張，每期有 `8%` 機率拿頭獎 Peerless，且有約 `35%` 機率至少中 1–5 獎之一！）。
- **方案 E1-b（保底累進抽獎池 Pity System）**：
  - **做法**：維持上述虛擬彩池機率，但玩家每投入 1 張彩券未中頭獎，即累積 1 點幸運值；累計滿定額（例如 100,000–200,000 張彩券）時下一期必中頭獎。

##### 針對 E-2（Monster Lab 魔物回禮單機化）：
- **方案 E2-a（最推薦：改由「玩家自身完成戰鬥場次／回合數」驅動魔物出戰與回禮）**：
  - **做法**：在單機版中，玩家在 Monster Lab 啟用（Active，PL ≥ 25 且已命名、未挨餓、士氣 > 0）的自創魔物：
    1. **仍會像原版一樣隨機混入玩家自己的戰鬥波次中作為敵人登場**（享有 `(PL - 500)/50` 最高 `+15%` 的額外掉寶率加成！）。
    2. **回禮觸發改為「隨玩家自身戰鬥回合推進」**：不再要求「其他玩家輸給該魔物」，而是**玩家每完成 $M$ 個戰鬥回合（例如每クリア `50–100` 個戰鬥回合，或每次觸發跨日結算）**，所有飽食度 `> 0` 且士氣 `> 0` 的已啟用魔物即自動累積勝場並按原版 `Morale`（綠 `+25%` / 黃 `1.0x` / 紅 `-50%`）與 `Gift Factor`（基礎 `100%` + Scavenging 與 Chaos Upgrades 最高 `260%`）結算發放禮物（按原版 PL 門檻：PL ≥ 499 出 High-Grade、PL ≥ 750 不出 Low-Grade、PL ≥ 1,499 100% 出 High-Grade，且 Metal:Cloth:Leather:Wood 比例固定為 `2:1:1:1`，外加 Rare Materials、Bindings 與 `5%` 機率 World Seed）！
  - **優點**：100% 保留原版 Monster Lab 的水晶升級、Chaos Token 強化、飼料與快樂藥丸維護、以及 PL 門檻與禮物分配公式，只把「等別人撞怪」改成「自己打怪同時推進魔物巡邏收成」。
- **方案 E2-b（參考官方 Isekai 模式：選用簡化開關）**：
  - **做法**：提供設定選項，若玩家不想養魔物，可開啟 Isekai 掉落模式（小怪直接掉落 High-Grade 與 Rare Materials，水晶可於神殿或商店換取材料）。

##### 針對 E-3（Training 真實時間與 Dawn 跨日單機化）：
- **方案 E3-a（最推薦：將「真實世界 1 小時」映射為「戰鬥回合數推進（Battle Rounds）」＋ 允許手動／消耗耐力觸發 Dawn）**：
  - **做法**：
    1. **Training 戰鬥回合推進制（或雙軌制）**：保留原版 `1H / 2H / 4H / 8H / 12H / 24H` 的相對比例，但將 **「1 小時訓練時間」映射為「完成 `N` 個戰鬥回合（例如 `1H = 20 ~ 50` 勝利回合，同時亦支援真實時間自然流逝雙軌取快者）」**，或提供「瞬間完成訓練（Instant Training，僅收 Credits）」開關。如此一來，原本 `24H` 的訓練只需打完 1–2 場高階 Arena 或半場 Grindfest 即可完成！
    2. **Dawn of a New Day 觸發制**：除了真實時間每日 00:00 自動觸發外，在單機版主選單／旅館提供 **「Rest until Dawn（休息至黎明）」** 按鈕（例如每當 Stamina 耗盡或完成當日 Arena 後即可點擊，或每消耗 `24` 點 Stamina 即可手動觸發一次新的一天），立即執行：回復 `24` 點（或回滿）Stamina、發放每日 Dawn EXP/Credits/Soul Fragments、結算 Weapon/Armor Lottery 開獎、重置 Arena 與 Ring of Blood 每日挑戰次數、扣除 Monster Lab 24 小時份量的飽食度与士氣、並檢查解鎖 OFC！
- **方案 E3-b（純即時抜除等待：Training 0 秒瞬發 ＋ Arena/RoB 無每日冷卻）**：
  - **做法**：所有 Training 課程皆比照 `Scholar of War` / `Tincture` / `Pack Rat` 設為 **`0H`（付 Credits 立即升級）**；Arena 與 Ring of Blood 移除每日 1 次限制（因 RoB 本身已受 `Token of Blood` 門票限制，Arena 本身已受 `Stamina` 消耗限制）。

---

## 四、單機斷點總覽對照表（供 Ticket `006` 逐題拍板）

| 斷點代號 | 斷鏈環節 | 原版多人依賴根因 | 推薦首選方案（保守修補、原味優先） | 備選方案 |
|---|---|---|---|---|
| **斷點 A** | **Item Shop 非綠字商品（Scrolls / Infusions / Shards / Energy Drink / Last Elixir / 鍛造材料）與裝備店空倉** | 原版僅 31 項基礎品為綠字無限供應，其餘靠全服玩家賣店才產生庫存 | **A1 + A2 結合**：Item Shop 所有具官方買價之消耗品与材料全部開放**綠字無限供應**（維持原版買價作為 Credits 回收池），同時採納 **Isekai 拆解加倍**（Sup 3 Low / Exq 2 Mid / 稀有防具拆出 Rare Material）與裝備店每日隨機刷出過渡裝 | **A3**：商店每日跨日限量補貨 |
| **斷點 B** | **Hath（649,500 總需求；2026-10-22 稽核更正，原稿 497,700）與主站 GP（樂透 1,000 GP/張）來源斷絕** | 原版靠主站 H@H 掛機、捐款或 Hath Exchange 玩家交易；樂透收主站 GP | **B1 + B2 結合**：Lottery 直接改收 **`1,000 Credits`/張**；Bazaar 內建 **Hath Exchange（Credits 固定／階梯匯率換 Hath）**，且 **Shrine 獻祭 Artifact 提升至 `10–25 Hath`**，並於 **Arena/RoB 首通與 Dawn 每日結算**發放 Hath | **B3**：參考 Isekai 將 QoL Perks 改為隨等級免費解鎖 |
| **斷點 C** | **v0.91 Stat Fusion「同基底同部位傳奇裝（1/75）」與「特定 Bindings（10 個/屬性 × 38 種）」湊齊死鎖** | 原版靠全服市場互換同名傳奇裝與特定屬性 Binding | **C1 + C2 結合**：允許以 **同部位同材質大類傳奇裝（或定額 `Legendary/Peerless Cores`）** 作為 Stat Fusion 祭品（同名基底給額外點數加成），並將單次融合點數提升（或讓 38 種 Bindings 於 Item Shop 按 `1,000 C` 開放購買／神殿自選兌換） | **C3**：Shrine 獻祭高階 Trophy 時允許指定裝備基底與部位 |
| **斷點 D** | **小馬雕像 Collectibles（27 種集齊 21 種解鎖 OFC）無法交易交換重複款** | 原版新手在 Market 花 30w–50w C 買齊雕像（出處 HentaiVerse101 README，原文為「乞討」這筆錢），隔天解鎖 OFC（? 「跨日檢查」無出處，見 2.4 補註） | **D1 + D2 結合**：Arena 首通保底掉落／Item Shop 按官方價 `50,000 C` 開放購買／Shrine 支援 **2 隻重複雕像換 1 隻未擁有雕像**，且湊齊 21 種時無須乾等真實 24 小時即可解鎖 OFC | **D3**：調回早期版本 10 種雕像解鎖門檻 + 防重複掉落保護 |
| **斷點 E** | **Lottery 全服彩池、Monster Lab 他人遭遇回禮、Training（3,716h）與 Dawn（UTC 00:00）真實時間等待** | 原版綁定全服買票池、他人在戰鬥撞怪、與伺服器真實時鐘 | **E1-a + E2-a + E3-a**：Lottery 內建 **NPC 虛擬彩池（200k–500k）** 按購票佔比抽獎；Monster Lab 改由 **玩家自身完成戰鬥回合數** 推進魔物勝場與回禮；Training 改為 **戰鬥回合推進（或 0 秒瞬發）**；新增 **「Rest until Dawn」** 跨日推進機制 | **E1-b / E2-b / E3-b**：純保底池、Isekai 免養怪掉落模式、全瞬發無冷卻 |

---

## 五、引用來源明細（Sources & Evidence）

1. **Wayback Machine `ehwiki.org` 一手百科快照**：
   - [Bazaar](https://web.archive.org/web/20261016074328id_/https://ehwiki.org/wiki/Bazaar)（`oldid=65842`，2026-10-10）：Item Shop 全品項官方買賣價、`<span style="color:#00B000">` 綠字無限供應標記、The Market 1% 交易稅與掛單規則。
   - [Items](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Items)（`oldid=65165`，2026-09-22）：13 大類物品效果、Trophies Tier 1–9 與 Shrine Value 表、Coupons 表、Soul Fragment 綁定成本公式、27 種 Collectibles 清單與 21 種解鎖 OFC 規則、World Seeds 與 Equipment Cores 規則。
   - [Obsolete Items](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Obsolete_Items)（`oldid=64137`，2026-04-07）：歷年節慶 Artifacts / Trophies 與退役物品紀錄（確認 `RealPervert Badge` 與 2026 `Final Edition Catalysts`）。
   - [The Armory](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/The_Armory)（`oldid=65798`，2026-10-06）：v0.91 Organize / Modify / Forging Lv.1–33 成本表 / 27 種 Lesser & Greater Charms 表（2026-10-22 稽核更正：原稿 23 種） / 3 種 Pouches `75%/20%/5%` 保底規則 / Stat Fusion `0–250` 骰值與溢位規則 / 38 種 Bindings 表 / Purchase / Salvage & Salvaged Remains 規則。
   - [The Forge](https://web.archive.org/web/20240529id_/https://ehwiki.org/wiki/The_Forge)（`oldid=62049`，2024-05-29）：v0.86 Repair 廢料公式 `1 + floor((100 - condition%) / quality_mod)`、對數升級公式、Enchant、90% 材料拆解返還、Reforge、Forge Level 1–50 經驗表。
   - [Hath Perks](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Hath_Perks)（`oldid=65055`，2026-09-13）：全部 Gallery Perks 與 HentaiVerse Perks（含 v0.91 `Limit Breaker I–V`）價格與效果表。
   - [Shrine](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Shrine)（`oldid=64928`，2026-08-06）：Artifact 獎勵分佈（20% Hath / 40% Crystals / 10% 各稀有消耗品 / 紅字主屬性點上限 `min(floor(Lv/10), 50)`）、Trophy 合成升級倍率（1.1x / 1.2x / 1.3x）、Collectible 獻祭產出。
   - [The Lottery](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/The_Lottery)（`oldid=55988`，2022-02-12）：每日 00:00 / 12:00 UTC 雙池、1,000 GP 票價、20,000 張上限、Do Not Want 核心頭獎、500,000 池縮放之 2–5 獎上限、Golden Lottery Ticket 規則。
   - [Monster Lab](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Monster_Lab)（`oldid=63173`，2025-05-07）：槽位公式 `ceil(1 + (N-1)^1.2)`、水晶升主屬性與抗性公式、PL 門檻表（25 / 200 / 250 / 400 / 499 / 750 / 1000 / 1005 / 1499 / 2250）、12 項 Chaos Upgrades 與 Gift Factor（最高 260%）、Morale 與 Hunger 衰減率、禮物 `2:1:1:1` 分配比。
   - [Dawn of a New Day](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Dawn_of_a_New_Day)（`oldid=59286`）、[Stamina](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Stamina)（`oldid=64619`）、[Training](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Training)（`oldid=58100`）、[Loot Drop Rolls](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Loot_Drop_Rolls)（`oldid=62616`）、[Isekai](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Isekai)（`oldid=54614`）、[Currency](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Currency)、[Credits](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Credits)、[Hath](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/Hath)、[ISK](https://web.archive.org/web/2026id_/https://ehwiki.org/wiki/ISK)。
2. **GitHub 公開儲存庫交叉驗證來源**：
   - [Trendymen/hentaiverse](https://github.com/Trendymen/hentaiverse)：`hvUtils.js`（L2126–2472 `$item` 與 `$price`、L5128–5143 Training 參數、L5861–6432 Equipment/Item Shop 與拆解 `_es.salvage_mats`、L6435–6836 Shrine 獎勵與 Trophy 計算、L6931–8291 Monster Lab 升級器與 PL 計算器、L9904–9936 `_mm.itemshop_parse` 30 項可交易綠字商品白名單、L10275–11004 IW 與 Forge 材料計算器）及 `hv_chinese.js`（L1153–3580 全物品英文 Tooltip 與 v0.91 The Armory / Shrine / Lottery / Market 介面原文）。
   - [EhTagTranslation/EhSyringe](https://github.com/EhTagTranslation/EhSyringe)：`src/services/ui-translation/data/hathperks.ts`（全量 Hath Perks 英文標題、描述原文與中文譯名）。
   - [anon962/AmyBotV2](https://github.com/anon962/AmyBotV2)：`server/src/server/lib/infer_equip_stats.py`（v0.91 `_TIER_RANGES` 與 `_calc_fusion_stats` Stat Fusion 最小／最大 Credits、Cores 與 10x Bindings 成本演算法）。
   - [dodying/UserJs](https://github.com/dodying/UserJs)：`HentaiVerse/hvTranslator.user.js`（全物品 `11191`–`70102` DBID 映射表）、`hvRepairEpument.user.js`（`60051`–`60071` Scrap/Energy Cell DBID 與價格）、`hvShrine.user.js`（Shrine ID `<30000` 與 `<70000` 路由規則）、`hvTrainer.user.js`（15 項訓練課程 ID 與時數表）。
   - [Kuan-Lun/hv-bie](https://github.com/Kuan-Lun/hv-bie)：`tests/fixtures/hv/The HentaiVerse1_files/itemc.js`（原版 `dynjs_itemc` 31 項戰鬥消耗品與寶石之官方 DBID 與英文描述）。
   - [KesaubeEire/HentaiVerse101](https://github.com/KesaubeEire/HentaiVerse101)：`README.md`（新手市場買齊小馬雕像跨日解鎖 OFC、Arena 4 倍收益、Lv.200+ 每日 5 Blood Tokens 刷 FSM 拿 T6 Trophy `Noodly Appendage` 之實戰經濟循環）。
   - [anon962/HvData-server](https://github.com/anon962/HvData-server) 與 [anon962/HvLogV3](https://github.com/anon962/HvLogV3)：`lottery_parser.py`、`dropStats.ts`、`itemUsageStats.ts`。

---

## 2026-10-22 稽核補充：覆蓋缺口

來源有、但本報告漏掉或沒當成斷點的項目（依 [audits/audit-004.md](../audits/audit-004.md) 第三節）。只登錄缺口與出處；`sources/` 路徑相對於 `.scratch/hv-v3/`。

1. **Random Encounter 綁主站瀏覽**：這個戰鬥事件「can occur once every 30 minutes upon visitation of the E-Hentai news page or a gallery」，每天最多 24 次（`sources/parsed_wiki/Random_Encounter.md:45,47`）；它是 Soul Fragment 唯一的掉落來源（`sources/parsed_wiki/Loot_Drop_Rolls.md:35`「solely from Random Encounters」），還給 Artifact／Token 2.5 倍、EXP 5 倍（`sources/parsed_wiki/Battles.md:256`）。本報告把 RE 當成正常來源，沒有標成斷點。
2. **Dawn 的顯示綁主站頁面**：Dawn 事件要在主站新聞頁或圖庫頁的廣告位才看得到（`sources/parsed_wiki/Dawn_of_a_New_Day.md:12`）。本報告斷點 E 把 Dawn 當成單純的時間閘，漏掉這個主站依賴。
3. **戰鬥怪物池與 PL 掉率加成靠其他玩家的自創怪**：自創怪是「custom monsters that any player can then encounter during battles」（`sources/parsed_wiki/Monster_Lab.md:3`）；普通怪（Common class）全由玩家創造（`sources/parsed_wiki/Battles.md:224`）、依 PL 選怪、每位擁有者每回合最多出 1 隻（`sources/parsed_wiki/Battles.md:244-250`）；掉率的 PL 加成最高 +15%（`sources/parsed_wiki/Loot_Drop_Rolls.md:25,58`）。單機沒有別人的高 PL 怪，掉率與斷點 B 的估算都會變（? 來源未找到，2026-10-22 稽核：「普通怪是否全部來自玩家」目前只有 `Battles.md:224` 一句佐證，信心較低）。
4. **高階 Trophy 的外部來源**：月榜 Coupons（T3–T8）、Vintage Paper Tag（T8，Tagging 比賽）、Tenbora's Box（T9，年度比賽）都來自主站（`sources/parsed_wiki/Items.md` 的 Trophies／Coupons 表）。它們影響 FoS 每 10m 送 Voucher 與每 500k 送 Pouch 這兩個 Shrine Value 計數器；本報告列出了物品，但沒當成斷點。
5. **真實日曆活動**：Easter、Loot & Harvest、Yuletide（`sources/parsed_wiki/Events.md`），其中有 Hath 獎勵與 T7／T8 Trophy。本報告只引用 Yuletide 的 Hath。
6. **Stamina 與 RiddleMaster 是反作弊機制**：Stamina 頁稱 Stamina 是「primarily an anti-cheating mechanism」（`sources/parsed_wiki/Stamina.md:15`）；RiddleMaster 答錯過多會加快戰鬥中的 Stamina 消耗、答對有 Blessing（`sources/parsed_wiki/RiddleMaster.md:47,58-59`）。單機要不要保留是需要拍板的設計題，本報告沒提。
7. **官方 Isekai 的反例先例沒引用**：「There are no stamina recovery items」「Monster food, chaos tokens and crystals do not drop. Monster wins are not recorded」（`sources/parsed_wiki/Isekai.md:112-116`）。這是官方接受「沒有耐力補品」的直接證據，可用來反駁斷點 A 的 Energy Drink 論證。
8. **贊助者加成**：Gold Star 以上每次解鎖 Monster 槽位得 2 格（`sources/parsed_wiki/Monster_Lab.md:92`）、Stars 每日給 Hath／GP（`sources/parsed_wiki/Dawn_of_a_New_Day.md` Amounts 表）。本報告只零散提到。
9. **Mod Power 與 Gallery Points 的其他來源**：Mod Power 在來源中只出現於 E-Hentai 導覽列（`sources/parsed_wiki/Gallery_Points.md:95`、`sources/parsed_wiki/Credits.md`），與 HV 經濟沒有連結；GP 的其他來源（評論、H@H、上傳）都在主站，對單機沒有額外影響（`sources/parsed_wiki/Gallery_Points.md:18-45`）。這兩項查過、不算缺口，登錄是為了說明已查。

### 斷點前提稽核結論（供 Ticket `006` 參考；為稽核判斷，非來源原文）

- **斷點 A（誇大）**：Scrolls、Infusions、Shards、各級材料都是怪物掉落或拆裝而來（`sources/parsed_wiki/Loot_Drop_Rolls.md:37`、`sources/parsed_wiki/The_Armory.md` Salvage 段），市場只是重新分配，全服平均每人能拿到的量就是平均每人掉出來的量；單機玩家的供給 = 自己的掉落，真正會消失的只有「別人不用、轉賣給你」的差額。裝備不靠商店：Arena 與 RoB 通關保證掉裝備（`sources/parsed_wiki/Loot_Drop_Rolls.md:26`），Trophy 掉落率 100%（`:48`），獻祭時可指定 7 大類（`sources/parsed_wiki/The_Shrine.md:83`）。真正的材料缺口在 Monster Lab 回禮，應併到斷點 E-2。
- **斷點 B（前提成立，數字錯）**：Hath 的遊戲內來源只有 Shrine 獻祭 Artifact（`sources/parsed_wiki/Hath.md:21-37`），結論成立；總額是 649,500、不是 497,700。GP 只是付彩券的貨幣，改成 Credits 是單純替換，不算結構性斷點。
- **斷點 C（誇大）**：Stat Fusion 是可選的後期優化（Legendary→Peerless→Ultimate），不是推進關卡；Peerless 還有別的來源（Lottery 頭獎、FoS Voucher、Trophy 0.0001%，`sources/parsed_wiki/Loot_Drop_Rolls.md:27`）；官方在無市場的 Isekai 是直接把 Stat Fusion 關掉（`hv_chinese.js:2364`「Stat Fusion is not available on Isekai.」；該檔不在 `sources/` 內，只存在於 session 暫存目錄，暫存檔已失效風險），可當「直接不做」的先例；融合成本公式並非官方公式（見 003 稽核補註）。
- **斷點 D（前提大致成立，量化錯）**：需 21 種不同款（`sources/parsed_wiki/Skills.md:87`、`sources/parsed_wiki/Items.md:244`）；期望值應為 38.92；等機率假設與 `Collectable Roll 1%?` 皆未驗證；D1 價格對照錯。
- **斷點 E（E-1、E-2 成立；E-3 歸類錯誤）**：E-1：5 個得獎名額從所有彩券抽、每人最多中一獎（`sources/parsed_wiki/The_Lottery.md`），單人買票一定中頭獎；E-2 最硬：自己的怪戰敗或逃跑都不計勝場（`sources/parsed_wiki/Battles.md:133,157`），回禮只剩 72 小時一次保底（`sources/parsed_wiki/Monster_Lab.md:432`）；E-3 是體驗設計選擇，不是多人斷鏈（見 2.x 補註）。




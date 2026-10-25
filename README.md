# hv-v3 — 試煉之塔（單機 HentaiVerse 刷寶 RPG）

> `bot/grok` 分支：以 HV 公式為核心的 **Roguelite 十層塔＋回合制戰鬥** 單機遊戲。設計文件見 [`docs/design.md`](docs/design.md)。

## 快速開始

```bash
npm install
npm run dev        # 開發伺服器，瀏覽器開 http://localhost:5173
npm test           # Vitest：公式、傷害鏈、掉寶、塔生成、戰鬥、存檔、成長模擬
npm run typecheck
npm run build      # 產出 dist/，可用 npx vite preview 預覽
npx tsx scripts/sim.ts 15 1   # 無頭模擬：同一角色連續爬塔 15 趟（種子 1）
```

只支援桌面瀏覽器（畫面 1100×800）。進度自動存在 localStorage（`hv-v3-save`）。

## 怎麼玩

1. **城鎮**：在「角色與配點」把 EXP 分配到六項屬性（可隨時退點重配）；在「裝備」穿脫裝備，每件倉庫裝備下方會顯示換上後的戰力／HP／攻擊／減傷等變化；在「商店」買藥水、賣掉不要的裝備。
2. **進入試煉之塔**：每層有 2–3 個節點可選——⚔ 戰鬥、☠ 精英、◆ 寶箱、$ 商人、♨ 營火、✦ 神龕；第 5、10 層是 ♛ 首領。第 4、9 層一定有營火。
3. **戰鬥**（回合制）：
   - `A` 攻擊、`D` 防禦（有 25 OC 時回 25% HP 並減傷 2 回合）、`F` 專注（回 MP、本回合必中）、`S` 靈動架勢（消耗 OC/SP 增傷）
   - `Q/W/E` 盾擊／要害打擊／慈悲一擊（消耗 Overcharge）
   - `1–6` 六種法術（火冰雷風群體、聖暗單體），`Z/X/C` 三種藥水（冷卻 40 回合）
   - 點擊怪物或按 `Tab` 選擇目標。首領每 4 回合會「蓄力」，下一擊 ×3——看到紅光就防禦或喝藥。
4. **節點之間可以撤退**，帶回 100% 收穫；**死亡**則 EXP／熟練度／Credits 只保留 50%，背包只留最好的一件，消耗品全失（穿戴中的裝備永不遺失）。
5. 回城變強，再爬更高。右上角可切換 1x／2x／4x 速度或跳過動畫。

## 玩法核心

- **公式照 HV**：EXP 曲線、屬性成本、ADB/MDB、暴擊、閃避→招架→格擋→抵抗→多段暴擊→減傷→亂數骰的完整傷害鏈、怪物 PL 成長、裝備品質曲線 `(R/200)^1.52` 與詞綴範圍，都來自 `findings/001–005` 與 `src/core/data/constants.ts`。
- **刷寶爽感**：裝備掉落率 ×8；掉落時依品質升起不同顏色與高度的光柱，Exquisite 以上會震畫面＋閃光；暴擊數字放大並震動。
- **成長迴圈**：每趟帶回 EXP、熟練度、裝備與 Credits；營火可把一件穿戴裝備「裝備世界 +1」（永久）。

## 程式結構

- `src/core/`：純 TypeScript 遊戲邏輯（無 DOM）：`formulas`、`damage`、`items`、`player`、`monsters`、`battle`、`tower`、`run`、`save`、`auto`（自動玩家／模擬用）
- `src/game/stage.ts`：Phaser 4 戰鬥舞台（像素素材、傷害數字、震動、光柱）
- `src/game/app.ts`：HTML 介面（城鎮、地圖、戰鬥指令列、節點、結算）
- `tests/`：Vitest；`scripts/sim.ts`：無頭成長模擬

## 暫定數值（之後可再調）

| 項目 | 值 |
|---|---|
| 樓層怪物等級 | 1 + 3×(層−1)，首領 +2、精英 +1 |
| 首領 / 精英倍率 | HP ×4 / ×2.5，傷害 ×1.3 / ×1.25 |
| 首領蓄力 | 每 4 回合，下一擊 ×3 |
| 戰鬥 EXP 倍率 | ×6 |
| 掉寶加速 | ×8 |
| 營火 | 回 60% HP、MP/SP 全滿，或裝備世界 +1（每級 +4% 縮放屬性）|
| 武器熟練度 | 每點 +1 ADB |
| 藥水價格 | 生命 50C、法力／靈力 100C |
| 商人售價 | 賣價 ×3.5 |

---

# hv-v3 — 單機 HentaiVerse 核心數值與素材基底

本儲存庫提供單機版 HentaiVerse（以 **v0.91 The Armory** 世代為準）已考證完成的**核心數值、戰鬥與裝備公式、怪物池資料與像素美術素材**。

**遊戲玩法、戰鬥節奏、操作方式與城鎮／關卡介面完全開放重新設計**——不綁定任何既有回合制狀態機或 UI 框架。

## 儲存庫內容

- **核心考證與公式（必讀）**
  - [`/.scratch/hv-v3/wayfinder/findings/001-public-sources-census.md`](/.scratch/hv-v3/wayfinder/findings/001-public-sources-census.md)：公開資料來源盤點
  - [`/.scratch/hv-v3/wayfinder/findings/002-combat-and-character-formulas.md`](/.scratch/hv-v3/wayfinder/findings/002-combat-and-character-formulas.md)：角色屬性、熟練度、天賦技能與傷害判定鏈公式（Whiff → Absorb → Evade → Parry → Block → Resist → 多段暴擊 → 減傷 → 亂數骰）
  - [`/.scratch/hv-v3/wayfinder/findings/003-equipment-armory-and-modes.md`](/.scratch/hv-v3/wayfinder/findings/003-equipment-armory-and-modes.md)：裝備品質（Crude～Ultimate）、詞綴、鍛造、等級縮放與品質骰值曲線（`(R / 200)^1.52`），以及 Arena / RoB / Grindfest / IW 規則
  - [`/.scratch/hv-v3/wayfinder/findings/004-economy-and-singleplayer-gaps.md`](/.scratch/hv-v3/wayfinder/findings/004-economy-and-singleplayer-gaps.md)：經濟循環、商店／神殿／樂透與單機自給自足規則
  - [`/.scratch/hv-v3/wayfinder/findings/005-constants-table.md`](/.scratch/hv-v3/wayfinder/findings/005-constants-table.md)：核心常數與暫定值總表
- **結構化常數程式碼**
  - [`/src/core/data/constants.ts`](/src/core/data/constants.ts)：已轉為 TypeScript 結構的完整常數表（含 579 列裝備基底×詞綴數值範圍、品質區間、曲線指數 `1.52`、武器技能與怪物種族參數），可直接 import 或讀取使用。
- **怪物池資料**
  - [`/public/data/monsters.json`](/public/data/monsters.json)：由 `/.scratch/hv-v3/sources/persistent_monsters.json` 過濾驗證後的精簡怪物池陣列。每列格式為：
    `[id, race, name, pl, attack, trainer, piercing, crushing, slashing, cold, wind, elec, fire, dark, holy]`
- **像素美術素材**
  - [`/public/assets/pixel/`](/public/assets/pixel/)：已切格並對齊腳底錨點的單格 PNG 與 [`manifest.json`](/public/assets/pixel/manifest.json)
  - [`/.scratch/hv-v3/art-trial/poc/pixel/`](/.scratch/hv-v3/art-trial/poc/pixel/) 與 [`poc-battle.html`](/.scratch/hv-v3/art-trial/poc-battle.html)：像素舞台美術 POC 原件

## 分支配置

- `main`：乾淨的數值、公式與素材基底
- `bot/grok`：Grok Bot 獨立開發分支
- `bot/dot`：Dot 獨立開發分支

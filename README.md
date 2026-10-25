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

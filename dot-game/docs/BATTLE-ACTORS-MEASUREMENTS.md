# v0.35 戰場角色：自然進度與繪圖非干預重播

這是 **來源引擎＋模擬 DOM 控制器＋canvas 命令** 的回歸量測，不是實際瀏覽器、像素美術、手機、原生鍵盤或無障礙驗收。沒有連線、發布或讀取使用者私人存檔。

## 接受基點與可重現輸入

基點為完整接受來源 v0.34 `7ade3e41161752c54cbfc4329000bc36e5d8716c`（checkpoint 140）。腳本固定核對 CHECKPOINT／UI／HTML／CSS／engine／loot／session 的 SHA256，再驗證該 CHECKPOINT 所列 **389 檔**的長度與 SHA256；不沿用上一版量測腳本的 v0.33 hash。

這份恢復目錄沒有 Git metadata；commit 身分來自已確認的恢復交接，以其 exact CHECKPOINT 與完整檔案 manifest 固定輸入，腳本不聲稱另做 remote commit 查詢。v0.35 的 engine、loot、session 與接受基點逐 byte 相同。

既有 **40 個歷史 fixture、2 個 browser fixture、2 個 helper** 前後均與接受基點完全相同，沒有改寫歷史樣本來配合新圖。新腳本只附加 canvas 命令 adapter 到既有 helper 的空 context，不修改 production、共用 helper 或既有測試。來源輸入及腳本本身前後 hash 相同。

## 固定的自然取得流程

沿用既有自然量測的 seed 42 與最高分已持有裝備方法，但公開選關動作改為「目前已解鎖最高關，最多第 5 關」，不授予解鎖。預定 **20 次**，普通／均衡；每場前各部位從現穿＋背包選最高分，同分取後者。出征後預約通關回營，以一秒 pulse 推進，單場最多 1,000 pulses；敗北回營、保留所有失敗與未完成，不因結果追加嘗試。

沒有補資源、造物、修改數值、出售、委託、AP 操作、綁定、裝備界或重抽。候選與接受基點分別執行公開動作；**每次動作和 pulse 後比較完整狀態／RNG 與完整戰報**。

| 自然取得結果 | 數值 |
| --- | ---: |
| 嘗試／勝利／失敗或未完成 | 20／20／0 |
| 實際到達關卡 | 1、2、3、4、5 |
| 一秒 source pulses／完整 parity 核對點 | 363／432 |
| 等級／金幣 | 13／2,710 |
| 背包／待領 | 33／0 |
| 自然碎片／世界之種 | 200／20 |

自然 canonical 存檔 SHA256：`ab33eb6db47190714dd0a22bb70b2728af3c6225693fb9b1b41cf22a8849a744`。這是明列協定產生的進度，不是使用者瀏覽器匯出。

實際敵人映射包含全部原型：`灰霧獵犬 → hound`、`碎晶甲蟲 → beetle`、`荒野影獸 → shadowbeast`、`赤砂守衛 → guard`，及以 `boss` 真值辨識的第 1–5 關裂隙守門者。全部五種都在五個關卡自然出現；第 5 關守衛的 `alternating` 攻擊模式也實際出現。收據列出第一個實際 ID、名稱、關卡、波數及不重複敵人數。

## 實際武器與三控制器對照

將同一份未編改自然 canonical 存檔載入三份控制器：

1. 接受 v0.34 UI，正常呼叫 `frame()` 繪圖。
2. v0.35 UI，正常呼叫 `frame()` 繪圖。
3. v0.35 UI，做相同動作與 pump／render，但完全不呼叫 `frame()`／`drawScene()`。

控制器 harness 共用已逐 byte 核對不變的引擎／掉落／session；上節另以兩份分別載入的來源引擎比較。這不是用變更後的玩法規則假裝接受基點。

從已持有物按固定 inventory→equipment 順序選第一件各武器家族，以既有「換上裝備」按鈕實際裝備：

| 家族 | 真正自然 ID | 物品名稱 |
| --- | --- | --- |
| 戰斧 | `loot-2` | 優良・暮鋼戰斧・屠戮 |
| 刺劍 | `loot-23` | 優良・獵隙逐風刺劍・屠戮 |
| 戰棍 | `loot-1` | 傳奇・獵隙裂岩戰棍・平衡 |

每種武器各在第 1–5 關嘗試一次，共 **15／15 勝**，**749 個四分之一秒戰鬥 pulses**；最終三者皆為第 35 勝。奇數關開啟減少動態、偶數關關閉，全部透過原偏好 handler。三種武器皆實際遇到四種普通原型及 boss；不是只有模型呼叫或合成敵人。

每次 action／pulse 均比較完整狀態、完整戰報、動作紀錄、被追蹤儲存寫入；每場結束後再前進八個 pulse，共 **120 個**，逐次確認不自動重開、不重複發獎。每對 frame 前後也單獨比較上述完整快照，確認繪圖不能改變戰鬥、亂數、掉落、政策、資源或存檔寫入。canvas adapter 計數、拒絕非有限座標並核對 save／restore 平衡，但不把命令數當作畫面品質、效能或像素證據。

同時重播真正原始 `starter-weapon` 的營地繪圖，以及唯讀／隱藏／恢復可見的 frame 邊界。未知敵人 fallback **不是自然遇敵證據**：本樣本沒有造假怪物；未知名稱與死亡英雄等合成邊界由獨立來源測試另列，不能由本次 35 場全勝推論其自然驗收。

## 重跑

從 `dot-game/` 執行：

```sh
BASELINE_DOT_GAME=../../hv-v3-dot-v034/dot-game \
  node scripts/battle-actors-measurement.mjs

BASELINE_DOT_GAME=../../hv-v3-dot-v034/dot-game \
BATTLE_ACTORS_OUTPUT=/tmp/battle-actors-rerun.json \
  node scripts/battle-actors-measurement.mjs
cmp docs/battle-actors-measurements.json /tmp/battle-actors-rerun.json
```

其他機器將 `BASELINE_DOT_GAME` 指向獨立恢復的 exact 接受 v0.34 `dot-game` 目錄即可。腳本只使用 Node 內建模組與既有本地 helper，不安裝套件。

[緊湊 JSON 收據](battle-actors-measurements.json)包含固定協定、全部輸入／runner hash、每場 outcome 及完整 state／report hash、實際敵人／武器 ID、三控制器結果與限制；不製造大量 shard，也不保存整份測試存檔。最終數值與兩次獨立執行的逐 byte 可重現結果見下方凍結收據。

## 最終凍結收據

同一份最終來源與 runner 分別啟動兩個 Node 程序，第二次寫入 `/tmp/battle-actors-rerun.json`；`cmp` **逐 byte 相同**，不是沿用開發中的輸出。

- 來源完整 parity：**432** 次；三控制器完整 parity：**1,722** 次。
- frame-only 非干預：**1,542** 組（每組兩次 callback），合計 **3,084** 次實際 `frame()` 呼叫，包含隱藏頁面略過繪圖的邊界。
- 主武器重播中，baseline／candidate 各執行 **1,538** 次可見場景繪圖；no-animation 控制組為 **0**。另有原始 starter 的營地探測，不混入主武器場景計數。
- 自然取得與主重播均包含要求的五關、四普通原型與 boss，三種武器均實際取得；本協定的要求覆蓋缺口為 **0**，不等於下列其他未測界線不存在。
- JSON 收據 **22,121 bytes**，SHA256：`c968b57fe629dfcc6695c3c60d73cd549b689a453694e62fbf232c5476e3029f`。
- runner SHA256：`f7f4cbb7c0ccb74804dd1d04d6a126810df4eebbac739e2006f47ae142190762`。
- 最終 UI SHA256：`3453008a505fd769a04ae459db953cecfa4aadeedb9867c1aefcead55c9ffe5b`。
- 重播後 canonical 存檔 SHA256：`e8cf92d81835e551b4de1f1bb76ae1e398024e0d7f106004c98691f205e8a164`。

## 限制

- 固定 seed 的小樣本只證明此協定的回歸一致，不是戰力、掉率、勝率、畫面可讀性或效能提升證據。
- adapter 不產生像素，不運行 CSS、真正 rAF 排程、原生輸入、視窗縮放、手機或 accessibility tree。
- helper 是不支援 Web Locks 的暫存模式；儲存寫入一致不是實際瀏覽器持久存檔或跨分頁所有權驗收。
- 沒有自然待領溢出、綁定／IW 交易、敗北英雄或未知敵人。缺口不得以本次全勝或繪圖命令推論補齊。
- 原版模型、公式及玩法來源不變；本次獨立 canvas 角色美術不引用他人程式、常數、怪物資料或 pixel art。

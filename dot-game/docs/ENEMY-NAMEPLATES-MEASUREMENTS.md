# v0.36 敵方名牌：自然進度非干預重播

**來源引擎＋模擬 DOM 控制器＋canvas 命令回歸，不是瀏覽器／像素／可讀性驗收。** 沒有讀取私人進度、生成 browser fixture、注入解鎖或更改既有樣本。

## 方法與固定輸入

- 接受基點：v0.35 `609cf796630d03973ccf0a3d4a9f224b848b00c4`。腳本固定其 CHECKPOINT／UI／HTML／CSS／engine／loot／session SHA256，驗證完整 **398 檔** manifest。恢復目錄沒有 Git metadata；commit 身分來自接受交接，沒有另做遠端查詢。
- 候選 engine、loot、session、CSS 與基點逐 byte 相同。`drawEnemy` 起點至角色本體最後的 `ctx.restore()` 也逐 byte 相同；**新舊 overlay 命令本就應不同，不拿全 canvas trace 相等當驗收。**
- 原 **40 個歷史 fixture、2 個 browser fixture、2 個 helper** 前後逐 byte 相同，且三個目錄沒有新增或刪除檔案。既有量測腳本／收據不覆寫。
- 從未編改 `createGame(42)` 出發：預定 20 場，預設均衡；每場前各部位選已持有最高分裝備（同分取後者），選目前自然解鎖最高關、最多第 5 關，預約通關回營，每秒推進、單場上限 1,000 秒。保留敗北／未完成；不因結果追加嘗試。不授物、不改能力／資源、不出售、不委託、不配置 AP、不綁定／IW、不重抽。
- 候選與接受引擎分別執行同一公開動作；每次 action／pulse 後比較**完整 state（含 RNG）、完整 events、完整 reports**。收據含各場完整快照 SHA256 與依序所有核對點的 SHA256，不複製整份歷史狀態。

## 自然取得與三控制器

| 結果 | 實測 |
| --- | ---: |
| 自然嘗試／勝利／敗北或未完成 | 20／20／0 |
| 自然到達關卡 | 1、2、3、4、5 |
| 自然 source pulses／完整 parity | 363／432 |
| 等級／金幣／背包／待領 | 13／2,710／33／0 |
| 自然碎片／世界之種 | 200／20 |

自然 canonical 結果 SHA256：`ab33eb6db47190714dd0a22bb70b2728af3c6225693fb9b1b41cf22a8849a744`。這是固定協定取得的結果，不是使用者瀏覽器匯出。

將此未編改結果載入 **接受 UI／候選 UI／候選不呼叫 frame 的控制組**。三者共用已核對不變的引擎／掉落／session；前段另有分別載入的來源引擎對照。從 inventory→equipment 固定順序選第一件各家族，透過實際物品詳情的「換上裝備」按鈕裝備：

| 家族 | 自然物品 ID | 名稱 |
| --- | --- | --- |
| 戰斧 | `loot-2` | 優良・暮鋼戰斧・屠戮 |
| 刺劍 | `loot-23` | 優良・獵隙逐風刺劍・屠戮 |
| 戰棍 | `loot-1` | 傳奇・獵隙裂岩戰棍・平衡 |

每種武器各嘗試第 1–5 關一次，共 **15／15 勝、749 個 250ms 戰鬥 pulses**，最終皆 35 勝。全部使用原選關／開始／通關回營 handler；奇數關開啟減少動態，偶數關關閉。兩階段均自然遇到四種普通敵人與 Boss。

每次控制器 action／pulse 比較完整 state／events／reports／動作紀錄／被追蹤儲存寫入；**每個戰鬥 pulse 前、後各實際呼叫兩次 frame**，單獨核對其前後完整快照不變，再與不畫圖控制組核對。共 **2,453 次三控制器 parity、3,040 組 frame-only 非干預、6,080 次 frame 呼叫**。每場結束後另推進 8 次、合計 **120 pulses**，逐次確認不重啟、不重複發獎。

另外涵蓋原始 starter 營地、唯讀、隱藏、恢復可見的 frame 邊界。主重播 baseline／candidate 各 **3,036 次可見場景繪製**，no-frame 組 **0 次**；另有 starter probe，不混入該場景計數。canvas adapter 僅檢查有限座標與 save／restore 平衡；字寬為簡化模型，不能證明實際排版或可讀性。

重播後 canonical SHA256：`e8cf92d81835e551b4de1f1bb76ae1e398024e0d7f106004c98691f205e8a164`。

## 自然特效覆蓋與缺口

以下是不同敵人／時間觀測點的有效特效樣本數，**不是觸發率，也不是傷害統計**；JSON 含首個真實 ID、關卡、波數、Tick、view 值及完整 state hash。控制器觀測點同時實際呼叫 frame，不用合成狀態補齊。

| 有效特效 | 20 場自然取得 | 15 場武器控制器 |
| --- | ---: | ---: |
| 穿透護甲 PA | 0 | 41 |
| 暈眩中 | 62 | 52 |
| 恢復待行動 | 0 | 0 |
| 流血傷口 BW | 40 | 24 |

**取得階段沒有自然遇到 PA；兩階段都沒有觀測到恢復待行動。** 不能把這些零樣本當作已驗收；恢復、過期、無效、同時多特效等合成邊界留給獨立 audit，與本自然證據分開。沒有造假未知敵人、待領溢出、敗北或 IW／綁定分支。

## 可重現執行

從 `dot-game/`：

```sh
BASELINE_DOT_GAME=../../hv-v3-dot-v035/dot-game \
  node scripts/enemy-nameplates-measurement.mjs
BASELINE_DOT_GAME=../../hv-v3-dot-v035/dot-game \
ENEMY_NAMEPLATES_OUTPUT=/tmp/enemy-nameplates-rerun.json \
  node scripts/enemy-nameplates-measurement.mjs
cmp docs/enemy-nameplates-measurements.json /tmp/enemy-nameplates-rerun.json
```

只需 Node 內建模組與既有未改 helper。候選輸入、runner、基點 pins、歷史 fixture／helper 在執行前後均核對。緊湊 [JSON 收據](enemy-nameplates-measurements.json) 記錄每場結果及完整快照 hash，不保存或發布生成的整份進度。

## 最終凍結收據

UI 凍結後啟動兩個獨立 Node 程序，分別寫入上述 JSON 與 `/tmp/enemy-nameplates-rerun.json`，`cmp` **逐 byte 相同**。所有以上數值均取自這兩次最終來源執行，不沿用開發中輸出。

- JSON：**16,962 bytes**；SHA256 `a88d761a503f239f9558c30abe3bb881e46403d02779bd50d6b18ba69c92fa80`。
- Runner SHA256：`8925151681f85c08ef8b84a9d342fc9e05cb2ec86ae15f1adcdcf978660e2c72`。
- 最終 UI SHA256：`b9d2e32cc38e7ab19284347ee4586139e4fc65950586347b0e00add5955be1c6`。
- 最終 HTML SHA256：`f3a2abab16b01ae78681b25637ce0744b06ce295f2b782f96acc8f0a64e7f456`。
- 另外逐一 `cmp` 確認全部 **15 個既有量測腳本**與接受 v0.35 原檔相同；本次僅另增此 runner／JSON／說明。

## 限制

固定 seed 小樣本只證明所述協定非干預，不是平衡、勝率、掉率、美術品質或效能結論。此 helper 是不支援 Web Locks 的暫存模式；寫入 parity 不等於真實瀏覽器持久存檔／跨分頁所有權驗收。沒有 CSS、像素、真實 rAF、原生輸入、手機、縮放、無障礙樹證據。使用者原進度與正式網站須由獨立真實瀏覽器驗收，不由此重播代替。

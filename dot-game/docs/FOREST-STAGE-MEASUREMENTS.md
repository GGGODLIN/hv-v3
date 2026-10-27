# v0.37 霧林古道：自然進度非干預重播

**這是來源引擎、模擬 DOM 控制器與 canvas 命令回歸，不是瀏覽器、像素、美術或可讀性驗收。** 沒有讀取私人進度、生成 browser fixture 或注入解鎖。

## 固定輸入與邊界

接受基點為 v0.36 `2a5354689165d7512d279327db8935c3bbef8570`；runner 固定 CHECKPOINT、UI、HTML、CSS、engine、loot、session 的 SHA256 並讀回核對完整 **407 個 manifest payload**。commit 身分來自已接受交接，恢復目錄本身沒有 Git metadata，這個測量不另聲稱遠端查詢。

候選的 engine／loot／session／CSS 全 byte 不變。從 `drawHero` 至 `drawScene` 的完整英雄、敵人及名牌 overlay 區不變；`const ground=h*.79` 起至檔末亦完全相同，保留站位、寶箱、前景、粒子與所有後續 handler。背景命令刻意不同，不能要求全 canvas trace 相等。

原 40 個歷史 fixture、2 個 browser fixture、2 個 helper 前後 byte 相同且目錄沒有增刪；另逐一核對 **16 個既有量測 scripts** 不變。只新增本版 runner、JSON 與本文。執行前後核對候選輸入、runner、基點 pins 與所有歷史 fixture／helper；開發中預檢偵測到並行 UI／HTML 修改而停止，不採用其結果。下列數字來自 UI／版本凍結後兩個獨立完整程序。

## 自然取得與控制器結果

從原樣 `createGame(42)` 出發，預設均衡，固定 20 場。每場各部位選已持有最高分裝備（同分取後者）、選最高已解鎖關但至多第 5 關、開始及預約通關回營，每秒推進，單場上限 1,000 秒。保留所有敗北／未完成，不因結果追加嘗試；不授物、不改資源、不委託、不出售、不配置 AP、不綁定、不進 IW、不重抽。

| 來源自然結果 | 實測 |
| --- | ---: |
| 嘗試／勝／敗北或未完成 | 20／20／0 |
| 自然到達關卡 | 1–5 |
| source pulses／完整 state、RNG、events、reports parity | 363／432 |
| 等級／金幣／背包／待領 | 13／2710／33／0 |
| 碎片／世界之種 | 200／20 |

取得 canonical SHA256：`ab33eb6db47190714dd0a22bb70b2728af3c6225693fb9b1b41cf22a8849a744`。這是固定協定自然取得，不是使用者匯出存檔。

將未編改結果載入接受 UI、候選 UI、候選不畫圖控制組；來源引擎在前段分別載入對比。按 inventory→equipment 順序選第一把各家族，透過實際物品詳情「換上裝備」handler 裝上自然 `loot-2` 戰斧、`loot-23` 刺劍、`loot-1` 戰棍。每把各跑路線 1–5 一次，使用既有選關／開始／回營預約 handler；奇數關減少動態，偶數關正常。

- **15／15 勝**，749 個 250ms 戰鬥 pulses，最終 35 勝；兩階段均遇四種普通敵人及 Boss。
- **2455 次完整三控制器 parity**，包含 state／RNG／events／reports／actions／tracked writes。
- 戰鬥每個 pulse 前後各呼叫兩次 frame，並覆蓋 starter 營地、唯讀、隱藏、恢復可見及序列化重載；共 **3042 組 frame-only 非干預、6084 次 frame**。
- 每場結束後多推進八次，共 120 pulses，沒有重啟或重複發獎。
- 主重播接受／候選各 3036 次 `drawScene`，no-frame 組 0 次。現在直接包裝場景呼叫計數，不把兩個 gradient 誤算成兩個場景；starter／重載 probe 不混入主重播場景數。
- canvas 命令僅檢查有限座標及 save／restore 平衡；簡化字寬不證明實際排版。

## 自然終局序列化與重載

正常取得的終局 state 直接 JSON 序列化，分別經接受與候選 `validateSave`，再載入三個 fullUI 控制器及繪製營地。完整 parity 通過；這是模擬控制器，不是 browser storage／跨分頁驗收。

- 原終局 JSON SHA256：`7514cee162399910783fedfa9d6daee522bce3d7ca0be3be4b5cac831f8433ef`
- canonical 與 loaded state SHA256 均為 `e8cf92d81835e551b4de1f1bb76ae1e398024e0d7f106004c98691f205e8a164`

## 自然覆蓋缺口

有效 PA／暈眩／恢復待行動／BW 樣本：取得階段 **0／62／0／40**，控制器階段 **41／52／0／24**。這不是機率或傷害統計。取得階段沒有 PA、兩階段沒有恢復待行動；不以合成樣本冒充自然目視。沒有敗北、未知敵人、待領溢出、IW／綁定分支。

固定 seed 小樣本不證明平衡、勝率、掉率、背景品質或效能。fullUI 使用不支援 Web Locks 的暫存模式，tracked writes 不等於真實儲存。沒有 CSS、像素、真實 rAF、原生輸入、手機、縮放或無障礙樹證據；正式頁和私人既有進度另由真實瀏覽器驗收。

## 重現與最終收據

從 `dot-game/`：

```sh
BASELINE_DOT_GAME=../../hv-v3-dot-v036/dot-game node scripts/forest-stage-measurement.mjs
BASELINE_DOT_GAME=../../hv-v3-dot-v036/dot-game \
FOREST_STAGE_OUTPUT=/tmp/forest-stage-rerun.json node scripts/forest-stage-measurement.mjs
cmp docs/forest-stage-measurements.json /tmp/forest-stage-rerun.json
```

兩個獨立 Node 程序均通過並 `cmp` 逐 byte 相同。只需 Node 內建模組及既有 helper；[JSON](forest-stage-measurements.json) 保存逐場結果／快照 hash，不保存整份生成進度。

- JSON **17494 bytes**；SHA256 `205d65e3585f01533d26df6de225260dd44d0444e0ffeb972942940065c23163`
- runner SHA256 `ff040e597bfa35b99a678ad6c7ed9f8dbb5a3cae98e20834badc0b5a29484a9a`
- UI SHA256 `ddfdb6cacd727a421c0387d5a257ef98df65a3ba16333db8bee1eee956399f48`
- 候選 HTML SHA256 `5dacdb593f9a0258a0b6d82f4c3b2acb4429305df59f02e0640fd0e11ea3dade`

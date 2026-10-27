# v0.38 原創營地木箱：自然進度非干預回歸

**來源引擎、模擬 DOM 控制器與 canvas 命令證據；不是瀏覽器、像素、美術、可讀性或正式頁驗收。** 沒有讀取私人進度、授物、注入解鎖或生成 browser fixture。

## 凍結來源與修改邊界

基點為 v0.37 凍結來源 `0de5f53220a7660c1fb0c7a304fcd6aa4ebcac8c`，不是 browser-accepted 版本。commit 身分來自恢復交接；沒有另查遠端或聲稱 Git metadata 證明。runner 固定 CHECKPOINT、UI、HTML、CSS、engine、loot、session 七個 SHA256，讀回核對完整 **415 個 manifest payload**。

- `src/ui.js` 除 `drawScene` 的 `if(!enemies.length)` 木箱分支外逐 byte 不變；英雄、敵人、名牌、森林背景、站位、前景、粒子和所有 handler 相同。
- 木箱分支有差異，舊圓形 halo 已移除；不要求新舊 chest canvas 命令相等。這不是像素品質證明。
- engine／loot／session／CSS 不變；40 個歷史 fixture、2 個 browser fixture、2 個 helper、14 個 assets 不變且目錄沒有增刪；17 個既有量測 scripts 全 byte 保留。
- 執行前後核對候選輸入、runner、基點 pins、fixture／helper／assets／歷史 scripts。基點完整 manifest 於每次程序開始核對。
- fullUI 的基點 UI 和候選 UI 使用同一份已驗證 byte 相同的 engine/session/loot；來源取得階段另行載入基點 engine，直接比較兩引擎。

## 固定自然協定

原樣 `createGame(42)`、預設均衡。固定 20 場，每場各部位選已持有最高分裝備（同分取後者），選最高已解鎖關但至多第 5 關，開始並預約通關回營，每秒推進，單場上限 1,000 秒。保留所有結果，不因結果追加嘗試；不授物、不改資源、不委託、不出售、不配置 AP、不綁定、不進 IW、不重抽。

取得未編改 canonical 結果後，載入基點 UI、候選 UI、候選不畫圖控制組。依 inventory→equipment 順序選自然取得第一把戰斧 `loot-2`、刺劍 `loot-23`、戰棍 `loot-1`，使用實際物品詳情「換上裝備」handler。每把各跑路線 1–5 一次，使用既有選關／開始／回營預約 handler，奇數關減少動態、偶數關正常。250ms pump pulses；每個戰鬥 pulse 前後各兩次 frame。比較完整 state（含 RNG）、events、reports、actions 和 tracked writes，不只摘要。

## 實測

| 項目 | 結果 |
| --- | ---: |
| 來源自然嘗試／勝 | 20／20 |
| 來源 pulses／完整 parity | 363／432 |
| 自然到達關卡 | 1–5 |
| 等級／金幣／背包／待領 | 13／2710／33／0 |
| 碎片／世界之種 | 200／20 |
| 控制器嘗試／勝 | 15／15 |
| 控制器戰鬥 pulses／三組完整 parity | 749／2455 |
| frame-only 非干預檢查／frame calls | 3042／6084 |
| 最終勝場 | 35 |

兩階段均自然遇四種普通敵人及 Boss。每場結束後額外八次、共 120 pulses，沒有重啟或重複發獎。涵蓋 starter 營地、自然取得營地、戰鬥、戰後營地、唯讀、隱藏、恢復可見、序列化後重載。

主重播基點／候選各 3036 次 drawScene，no-frame 組 0 次；canvas 命令數 2632561／2637531／0，save/restore 最終深度均為 0。座標只查有限數值，不證明排版或效能。VM cosmetic `Math.random` 固定 .42；遊戲 state RNG 不修改。

自然取得 canonical SHA256：`ab33eb6db47190714dd0a22bb70b2728af3c6225693fb9b1b41cf22a8849a744`。正常終局 JSON 序列化後，基點／候選 validateSave 結果一致，三控制器重載完整 parity 通過：

- 終局序列化 SHA256：`7514cee162399910783fedfa9d6daee522bce3d7ca0be3be4b5cac831f8433ef`
- canonical／loaded state SHA256：`e8cf92d81835e551b4de1f1bb76ae1e398024e0d7f106004c98691f205e8a164`

## 缺口與限制

有效 PA／暈眩／恢復待行動／BW 樣本：取得 **0／62／0／40**；控制器 **41／52／0／24**。取得階段未自然觀察 PA，兩階段未自然觀察恢復待行動；沒有合成替代。沒有敗北、未知敵人、待領溢出、IW／綁定分支；不將測試構造的邊界狀態稱為自然結果。

固定 seed 小樣本不證明平衡、勝率、掉率或木箱視覺品質。fullUI 使用不支援 Web Locks 的暫存模式，tracked writes 不等於真實持久化。沒有 CSS、像素、原生輸入、真實 rAF、手機、縮放、無障礙樹、跨分頁或私人既有存檔證據。所有既有 assets／provenance 保留；本工作沒有 GitHub、網站或發布寫入，亦未繞過既有發布阻擋。

## 重現與收據

從 `dot-game/`：

```sh
BASELINE_DOT_GAME=../../hv-v3-dot-v037/dot-game node scripts/camp-chest-measurement.mjs
BASELINE_DOT_GAME=../../hv-v3-dot-v037/dot-game \
CAMP_CHEST_OUTPUT=/tmp/camp-chest-rerun.json node scripts/camp-chest-measurement.mjs
cmp docs/camp-chest-measurements.json /tmp/camp-chest-rerun.json
```

兩個獨立完整 Node 程序通過，JSON 逐 byte 相同。[JSON](camp-chest-measurements.json) 保存逐場結果與快照 hash，不保存完整生成進度。

- JSON：18051 bytes；SHA256 `bd671053219a5c79665da299058a6a558f954c0092a662fe3fadc1b9bae95c4c`
- runner SHA256：`f919d03f8e1f9317c5c4a43034d7e1daf3cc379338166e88c856c871f12e3e62`
- UI SHA256：`fb0e874e9a185fb7797148aeeb854e3210e6c0af19ab465e499c0c12196a3a2c`
- HTML SHA256：`1106fca652ca61326b9edc95be112aee94515ab283e011f72a7399d6bcce9a98`

# v0.35 戰場角色辨識：完整恢復

## 基點與邊界

來源基點是個人 `GGGODLIN/hv-v3`、`bot/dot` exact commit `7ade3e41161752c54cbfc4329000bc36e5d8716c`，checkpoint140，390 檔／389 payload。最後已驗收正式網站 v0.34 是 `e69c6b8833e41a0f2c0cc7cced3811717fcf6933`，Pages `40497206404`／21 檔 HTTP 與原正式 profile 普通通關、重載已通過。

本版來源候選 checkpoint `141-v035-battle-actors-source`。來源只改本作 `dot-game/`；來源以 expected-head、non-force 更新 `bot/dot`，保留外部 409 個 blob／mode。不改 main、其他分支或其他人的程式、constants、monsters、像素素材。既有已驗收 dot 遊戲是本作自身基底，不是其他能力測試者的程式。

## 取回與啟動

取回 exact commit 的完整 `dot-game/`，不是網站的 21 個 runtime 檔。原始碼、測試、42 個既有 fixture、量測腳本／收據、文件及原件／本地 SVG／CC0 授權與 provenance 都屬於完整來源。比對 CHECKPOINT.files 的檔案集合、bytes 和 SHA256；CHECKPOINT 自身以外部讀回收據核對。修改內容 exact 讀回、不變檔以 Git blob identity 核對；提交編號以實際 GitHub 結果為準，提交前不虛構。

```sh
cd dot-game
node --test --test-reporter=tap tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
BASELINE_DOT_GAME=/path/to/exact-v034/dot-game node scripts/battle-actors-measurement.mjs
python3 -m http.server 8000
```

Node 20 以上，不需安裝依賴或 build。HTTP 伺服器只說明正常恢復方式，不表示本次用 localhost 繞過 cloud 預覽或發布限制。瀏覽器開啟伺服器所示路徑即可出征；已穿武器可從裝備區選擇，戰鬥自動進行。正常匯出存檔保留自己的旅程。

## 候選與正式分離

先完整來源備份／讀回，才發候選至 `public/play/hv-v3-dot/candidates/v0.35/`；使用現有按路徑隔離的儲存 key，不把候選資料匯入正式 profile。候選須 exact commit Pages、21 檔 HTTP、真正畫面與普通遊玩／換裝／重載通過。接著先備份已驗收來源，才更新正式 `public/play/hv-v3-dot/` 並驗證原進度。首頁、`public/play/hv-v3/`、其他作品與所有舊候選保留。

結果不明先讀回，不盲重試；拒絕保留完整原因與確定執行狀態，不改 host／API 繞過。歷史 v0.26／v0.33 拒絕已不代表本版現存阻擋。新授權仍依當時有效的持續候選授權與使用者明確範圍判斷。

## 不保證的事項

只改 `src/ui.js` 角色繪圖，核心 engine／loot／session、所有存檔欄位／格式3／儲存 namespace／RNG／交易不變。v0.34 可讀相同進度；更早版已有 Exquisite IW1、補給選項等歷史相容性限制，沒有因外觀更新消失。完整程式恢復不包含私人瀏覽器存檔、登入、帳號權限、排程或 Library 雙邊同步。

來源模擬畫圖只能證明控制流程、幾何與非干涉，不等於美術好看、真正像素或手機／窄視窗通過。接受階段另記實際證據；森林、寶箱及完整遊戲美術仍未重製。

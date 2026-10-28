# v066 來源候選恢復

Repository `GGGODLIN/hv-v3`，branch `bot/dot`，完整快照 `CHECKPOINT.json` checkpoint `207-v066-restorable` 所在 exact commit。只恢復 `dot-game/`，不要取用或覆寫其他人內容／dot-archive。新 UI 單次遠征不是新存檔格式，仍 v3。已驗收正式為 v066 website426e77fffe719de19eef7927dcf18e705d081030；完整前置已驗收來源205 `07dbdb366b99572216b29c355b7010cb21980e6e` 保留。候選及正式已通過正常桌面實玩（見 QA-V066-BROWSER.md、QA-V066-FORMAL-BROWSER.md）。

1. 讀該 exact commit 的完整 `dot-game/` tree，依 CHECKPOINT.files 核對每檔 bytes/SHA256；包含 src、index/style、assets與授權、全部 tests/fixtures/helpers、scripts與docs。
2. 不依賴臨時 workspace；執行 `npm test`，再對 `src/engine.js`、`src/loot.js`、`src/session.js`、`src/ui.js` 執行 `node --check`。
3. `python3 -m http.server 8000` 從此目錄啟動。勿匯入／修改正式 profile；只用隔離候選存檔 namespace進行正常點擊測試。
4. 單次完整四波勝利回營、預約取消、原連刷、掉寶與匯出重載正常後才接受候選。發布由父層處理，僅網站 public/play/hv-v3-dot/；保持正式與候選分離，未通過的後續候選保留已驗收 v066。

素材與經濟未改。精確 readback receipt 在 dot 雲端 `hv-v3-dot-backups/207-v066-source-verification.json`，不能把此尚未包含未來 commit SHA 的文件誤當發布／CI 證據。

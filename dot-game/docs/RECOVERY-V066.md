# v066 來源候選恢復

Repository `GGGODLIN/hv-v3`，branch `bot/dot`，完整快照 `CHECKPOINT.json` checkpoint `203-v066-candidate` 所在 exact commit。只恢復 `dot-game/`，不要取用或覆寫其他人內容／dot-archive。新 UI 單次遠征不是新存檔格式，仍 v3。已驗收正式仍 v065 website018d4c3a1068c58ea2546752b63ccab2336a6f35；完整已驗收來源202 `8ad50429da453977a4c2cc2a4b5d4ef855938e60` 保留。本候選尚未真實瀏覽器接受。

1. 讀該 exact commit 的完整 `dot-game/` tree，依 CHECKPOINT.files 核對每檔 bytes/SHA256；包含 src、index/style、assets與授權、全部 tests/fixtures/helpers、scripts與docs。
2. 不依賴臨時 workspace；執行 `npm test`，再對 `src/engine.js`、`src/loot.js`、`src/session.js`、`src/ui.js` 執行 `node --check`。
3. `python3 -m http.server 8000` 從此目錄啟動。勿匯入／修改正式 profile；只用隔離候選存檔 namespace進行正常點擊測試。
4. 單次完整四波勝利回營、預約取消、原連刷、掉寶與匯出重載正常後才接受候選。發布由父層處理，僅網站 public/play/hv-v3-dot/；保持正式與候選分離，失敗保留 v065。

素材與經濟未改。精確 readback receipt 在 dot 雲端 `hv-v3-dot-backups/203-v066-source-verification.json`，不能把此尚未包含未來 commit SHA 的文件誤當發布／CI 證據。

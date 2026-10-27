# v0.33 完整來源恢復與發布界線

## 2026-10-27 候選驗收後的恢復界線

凍結來源checkpoint131已完整備份為 `63b39c5a62193988430bdf86379b3f75c1b3a303`（380檔／379manifest payload），exact讀回通過；CHECKPOINT SHA256 `f8cf4635feb44d5884714b4695aee11573bec3078748d8660b3a61c2f8a1b3a1`。同runtime的有限桌面候選已通過 [BROWSER-QA-V033](BROWSER-QA-V033.md)；本次新增驗收文件仍需新的完整checkpoint／exact讀回收據，不由本文件預填成功或新SHA。

候選 `35a4cfff40a7fab92dd1848d9db455878347a1c4`、Pages `40484556586`／21檔HTTP已在09:48:53.442196新候選限定授權後完成。此前v0.26拒絕仍確認未執行，但不再阻擋這次已成功候選；不從它推定正式推廣授權。正式v0.25及原存檔保持原狀，正式推廣與原進度smoke是另一步。不得把候選匯出灌入正式profile。

實際驗收只有1180×757桌面；窄／手機、強制色彩、螢幕閱讀器、全面跨分頁、實際待領FIFO與自動補給觸發未測。現有canvas美術未重製。以下為checkpoint131凍結前的歷史恢復說明，其「尚未瀏覽器／候選」由本節與新瀏覽器記錄補充，不改寫舊拒絕收據。

## 確切來源

- 基點：個人 `GGGODLIN/hv-v3` 的 `bot/dot`，exact v0.32 `0cfde1801d288a94ff485cdc1e9a17442456bf89`。
- 本次 checkpoint：`131-v033-grid-readability-source`。提交前文件不預填新 SHA；以遠端 ref、該 commit 的 `CHECKPOINT.json` 及外部 exact-content 讀回收據確認。
- 最後正式完整來源：v0.25 `e5962e728ae4c20db80172916f3e1a9b72815a91`；正式網站 `f00fdfe1fcad529081057e99592a49466341bb08`。
- 已準備但未發布的 v0.26 網站候選 `14524044ee864ac9ac590ed933c9fd0ef5148680` 不變。其 update_ref 被審核拒絕且確認未執行；本次不重試、不觸發 CI、不更換 host、不操作既有瀏覽器進度。

## 取回與校驗

完整取得確切提交的 `dot-game/`，包括 runtime、所有素材／原件／授權、測試、42個歷史與瀏覽器 fixture、腳本、量測收據、文件及 CHECKPOINT。不要只取網頁執行檔。核對 CHECKPOINT.files 的完整檔案集合、bytes 與 SHA256；CHECKPOINT 本身由外部收據驗證。來源更新僅在 `bot/dot` 使用 non-force 與 expected-head lease；未修改檔以 Git blob identity 核對，新增／修改檔要求 exact-content 讀回。保留 `dot-game/` 外409個 blob 及模式。

本次未改素材。Kenney 選用原件、未修改 CC0 授權與衍生圖 provenance，以及六款原創裝備 SVG 的來源身分，全部隨來源恢復；詳見 [ASSET-CREDITS](ASSET-CREDITS.md)。沒有遠端圖片／字型 runtime 依賴。

```sh
cd dot-game
node --test --test-reporter=tap tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
# 可選：BASELINE_DOT_GAME 指向獨立恢復的 exact v032 dot-game
BASELINE_DOT_GAME=/path/to/exact-v032/dot-game node scripts/grid-readability-measurement.mjs
# 只在具有所需預覽權限的環境中：
python3 -m http.server 8000
```

Node20以上；遊戲不需要安裝依賴或建置。量測使用保留的來源 DOM harness，不啟動瀏覽器，不能證明排版、焦點像素或螢幕閱讀器朗讀。靜態伺服器指令是恢復說明，**不是本次執行或預覽門檻已解除**。不要用 file:// 載入 ES modules。

## 尚未驗收與存檔界線

真實遊戲畫面、窄畫面／縮放／觸控、外框 paint、強制色彩模式、螢幕閱讀器、實際 Tab／焦點復原與個人存檔仍未執行。來源測試與備份成功不等於發布或視覺驗收通過。

engine／loot／session、亂數、資料格式3、儲存命名空間與42個 fixture 保持原bytes。v0.33不新增資料欄位，回至v0.32不改遊戲語意；仍保留 v0.24／v0.25 無法讀 Exquisite IW1、v0.26忽略額外補給設定的歷史界線。先匯出進度並重新整理舊分頁，不讓舊 writer 覆寫新投資。完整來源備份不包含個人瀏覽器進度、帳號、登入、權限或排程。

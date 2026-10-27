# v0.36 戰鬥名牌：完整恢復

## 目前可恢復版本

本檔建立時 v0.36 是尚未發布／未實際瀏覽器驗收的來源候選。最新完整已驗收 v0.35 來源是 `609cf796630d03973ccf0a3d4a9f224b848b00c4`（GGGODLIN/hv-v3，bot/dot）；正式網站版本 `46c3d758e435adcde0e77456f296b7dccd26fbae`。不要把未驗收的新候選當最新可玩恢復版，也不要只因舊連結方便取回更舊版本。

## 啟動與來源

從所選 exact source commit 取得完整 `dot-game/`，先按 CHECKPOINT.json 核對所有列出的檔案長度與 SHA256。manifest 不列自己，需用外部 exact commit／收據確認其身分。保留完整 src、index.html、style.css、package.json、assets、tests、scripts 與 docs，不以網站編譯或部署子集冒充來源。

在 dot-game 目錄使用 Node 20 執行 `npm test`（不需安裝套件），四個 runtime 檔可用 `node --check` 分別檢查。以 `python3 -m http.server 8000` 啟動，瀏覽器打開 `http://localhost:8000/`。此命令是恢復者自己的執行說明，不宣稱本輪 cloud browser 能到達工作區 localhost。

檔案包含必要素材和授權，沒有新增外部資產依賴。本版名牌為原創程式繪圖；既有 Kenney 元件與六個原創裝備SVG來源見 ASSET-CREDITS.md。原版研究見 ORIGINAL-HV.md；禁止沿用其他遊戲程式、constants.ts、monsters.json 或像素素材。

## 存檔與發布

資料格式3與原有key維持；正常匯出／匯入並先備份舊檔。較舊版本對 Exquisite IW1、emergencySupply 的限制保持歷史文件描述。本來源不含使用者瀏覽器存檔、登入、權限或排程，也不聲稱 GPT Library 雙邊同步或完整遠端 Git 歷史封存。

候選路徑限定 `public/play/hv-v3-dot/candidates/v0.36/`，正式限定 `public/play/hv-v3-dot/`。完整來源備份先於發布；隔離key不得與正式共用；exact CI／HTTP只證明部署身分，不能代替真實遊玩。候選接受後先備份接受來源，再替換正式並以其原profile實測，不匯入候選進度。

所有寫入 expected HEAD、non-force，保留來源範圍外與網站其他作品／候選。拒絕或結果不明時先讀回，不盲重試或換route。舊HV與dot-archive保持暫停。測試／備份／發布各階段 exact證據後續追加，尚未完成者不預填。

## 候選來源與部署證據（尚非 browser accepted）

- 完整來源146：`f079b8ffec04f7834768461bde8d809cab749711`，407檔／406payload。27變更在ref前後逐檔讀回；380不變檔與409範圍外blob/mode保留。
- 隔離候選147網站：`1b84676530bb34b8c62fc44025fa00b0642ff9bf`；Pages `40511494672` exact SHA success；21runtime與directory index共22 HTTP回應200且bytes一致。
- 候選只位於 `public/play/hv-v3-dot/candidates/v0.36/`；原4026網站blob/mode保留，原正式v0.35之21runtime＋directory也exact核對。
- 此時尚未真正browser驗收，也未發布正式v0.36。最新已驗收恢復版本仍是上文v0.35，不因候選較新就冒充已驗收。

## 候選已接受（尚待正式發布）

root已於2026-10-27 13:28 UTC明確接受有限桌面候選，詳見 BROWSER-QA-V036.md。接受phase完成1919測試與四語法重新驗證；148完整備份後才可發布正式149。上節「尚非browser accepted」保留其當時狀態，不代表目前仍阻擋。

# 恢復 v0.59 來源候選

取得 GGGODLIN/hv-v3 bot/dot 攜帶 CHECKPOINT.json `184-v059-commission-delta` 的 exact commit，恢復完整 dot-game/。核對 manifest 全部 bytes/SHA-256（manifest 自身不列入）。原始碼、測試、腳本、必要素材與授權完整保存；Git 歷史由 repo 保留，網站副本不是完整原始碼。

在 dot-game/ 執行 npm test，並對 src/engine.js、loot.js、session.js、ui.js 執行 node --check。無需安裝相依或建置。python3 -m http.server 8000 後瀏覽 http://localhost:8000/。測試環境與正式進度隔離，使用玩家正常匯出的存檔且先備份；戰報 JSON 不是存檔。

仍是保存格式 v3。v056–v059 尚未公開瀏覽器驗收，最新完整已驗收來源仍 v055 eaf6e784782a781114352d729a11d0b025f3032a、正式網站 a99ec0252386bb21b94cdec3ae54645805a6b94f。恢復先比較最新且完整驗證的證據，不把較新的候選當正式。

網站零操作；既有 v056 候選發布批准仍待答覆，沒有換 v059 路徑重試。未宣稱 GPT Library 雙邊同步、公開 HTTP 逐檔 hash 或登入／排程恢復。

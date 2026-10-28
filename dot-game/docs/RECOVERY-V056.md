# 恢復 v0.56 來源候選

取得 GGGODLIN/hv-v3 bot/dot 中攜帶 CHECKPOINT.json `180-v056-wave-growth-recovery` 的 exact commit，恢復完整 dot-game/，核對所有manifest檔案的bytes/SHA-256（manifest自身不列入）。保留全部原始碼、測試、腳本、素材與授權；網站副本不等於完整來源。

在 dot-game/ 執行 `npm test`，並 `node --check src/engine.js`、loot.js、session.js、ui.js；不需安裝相依套件或編譯。執行 `python3 -m http.server 8000`，開啟 http://localhost:8000/。先匯出正常遊戲存檔，戰報不是存檔；候選使用獨立命名空間，勿直接覆寫正式進度。

v056 修正清波升級HP被舊上限裁切；存檔格式v3與命名空間不變。來源候選不是已公開驗收。上一完整已驗收來源v055為eaf6e784782a781114352d729a11d0b025f3032a，正式網站a99ec0252386bb21b94cdec3ae54645805a6b94f。恢復時先比較後續驗證證據，不因本舊說明方便忽略更新已驗收版。

未宣稱GPT Library雙邊同步、公開HTTP逐檔hash或登入/排程恢復。沒有網站寫入；瀏覽器驗收由發布流程另記。

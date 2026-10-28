# 恢復 v0.58 來源候選

取 GGGODLIN/hv-v3 bot/dot 攜帶 CHECKPOINT.json `183-v058-completed-wave-progress` 的 exact commit，恢復完整 dot-game/，核對 manifest 的 bytes 與 SHA-256；manifest 不列自身。原碼、全部測試、必要素材、授權及建置說明均在來源庫，Git 歷史由 repo 保留，不以網站編譯成品冒充完整來源。

在 dot-game/ 執行 npm test，以及 node --check src/engine.js、src/loot.js、src/session.js、src/ui.js。無依賴安裝或建置步驟；python3 -m http.server 8000，再瀏覽 http://localhost:8000/。使用玩家正常匯出並已另存備份的存檔；戰報 JSON 不是遊戲存檔，不要覆寫正式進度。

v058 只修已勝利間歇的進度顯示，保存仍格式 v3。包含 v056 清波生命及 v057 藥水回饋修正，三者均未公開瀏覽器驗收。最新完整已驗收恢復來源仍 v055 eaf6e784782a781114352d729a11d0b025f3032a，正式網站 a99ec0252386bb21b94cdec3ae54645805a6b94f。取回時比較最新完整驗收證據，不把較新候選當成正式最新版。

本輪網站零操作，既有 v056 候選批准待答，不換路徑繞過。未宣稱 GPT Library 雙邊同步、公開 HTTP 每檔雜湊或平台登入／權限／排程恢復。

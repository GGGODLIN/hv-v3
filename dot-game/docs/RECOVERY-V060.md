# 恢復 v0.60 來源候選

取得 GGGODLIN/hv-v3 bot/dot 攜帶 CHECKPOINT.json `185-v060-resource-pool` 的 exact commit，恢復完整 dot-game/；逐項核對 manifest 的 bytes/SHA-256（manifest自身不列入）。原始碼、全部測試、必要素材、授權與說明完整保存，Git歷史由repo保留；網站副本不是完整原始碼。

在 dot-game/ 執行 npm test，以及 node --check src/engine.js、src/loot.js、src/session.js、src/ui.js。無相依安裝或建置步驟。python3 -m http.server 8000 後用瀏覽器開 http://localhost:8000/。只用正常匯出的玩家存檔，先保留備份；戰報JSON不是存檔。候選不要覆寫正式進度。

保存格式與命名空間未改，v056–v060尚未瀏覽器驗收。最新完整已驗收來源仍 v055 eaf6e784782a781114352d729a11d0b025f3032a，正式網站 a99ec0252386bb21b94cdec3ae54645805a6b94f；取回先比較較新完整驗證證據，不把本候選當可恢復正式最新版。

未宣稱 GPT Library 雙邊同步、公開HTTP逐檔雜湊或平台登入/排程恢復。網站零操作，既有 v056 候選批准待答，不改路徑繞過。

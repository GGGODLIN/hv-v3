# 恢復 v0.57 來源候選

取得 GGGODLIN/hv-v3 bot/dot 攜帶 CHECKPOINT.json `182-v057-effective-potion-feedback` 的 exact commit，恢復完整 dot-game/。逐項核對manifest的bytes/SHA-256（manifest自身不列入）。原始碼、全部測試、腳本、必要素材與授權完整保存；網站副本不是完整來源，Git歷史由repo保留。

在 dot-game/ 執行 `npm test`，及 `node --check src/engine.js`、loot.js、session.js、ui.js。沒有安裝相依套件或建置步驟。執行 `python3 -m http.server 8000` 後用瀏覽器開 http://localhost:8000/。使用玩家自己正常匯出的存檔，先另存備份；戰報JSON不能當存檔。隔離測試環境勿覆寫正式玩家進度。

v057藥水回饋修正仍使用保存格式v3與原命名空間，包含v056清波成長修正；兩者尚未公開瀏覽器驗收。最新完整已驗收來源仍為v055 `eaf6e784782a781114352d729a11d0b025f3032a`，正式網站 `a99ec0252386bb21b94cdec3ae54645805a6b94f`。還原時比較後續最新且完整驗收的證據，不把本較新候選當可恢復正式最新版。

未宣稱GPT Library雙邊同步、公開HTTP逐檔hash或平台登入／排程恢復。本輪網站零操作；v056的候選發布批准尚待答覆，不換v057路徑繞過。

# 恢復 v0.61 來源候選

取得 GGGODLIN/hv-v3 bot/dot 攜帶 CHECKPOINT.json `186-v061-selection-retention` 的 exact commit，恢復完整 dot-game/。按 manifest 核對所有 bytes/SHA-256（不含 manifest 自己）；全部原始碼、測試、必要素材及授權都保留，Git 歷史由 repo 保留。

在 dot-game/ 執行 `npm test`，以及 `node --check src/engine.js`、loot.js、session.js、ui.js。無需安裝或建置，`python3 -m http.server 8000` 後開 http://localhost:8000/。只使用自己正常匯出的存檔並先備份；戰報不是存檔。

v056–v061 仍來源候選，尚未瀏覽器驗收，不能當正式最新版。最新完整已驗收來源為 v055 `eaf6e784782a781114352d729a11d0b025f3032a`，正式網站 `a99ec0252386bb21b94cdec3ae54645805a6b94f`。取回前比較後續最新完整驗收證據。資料格式與命名空間仍 v3；本輪網站零操作，沒有透過新候選路徑重試拒絕。

不宣稱 GPT Space 雙邊同步、公開 HTTP 全檔雜湊或平台登入／排程恢復。

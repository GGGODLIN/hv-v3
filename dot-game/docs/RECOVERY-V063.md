## 190：最新桌面已驗收來源（正式升版待完成）

取得攜帶CHECKPOINT `190-v063-browser-accepted` 的exact commit，核對全部files bytes/SHA-256並還原完整dot-game/。runtime與188來源a15522c8ff4dbfe855d2e5ed410cdc40a8035cf9逐byte一致；僅新增驗收文件。桌面候選073261986b8deadbeaf47390f194ec2a26125783已PASS，細節與仍unit-only邊界見QA-V063-BROWSER.md。候選index隔離包裝不是source index；來源顯示候選標籤是刻意保留，不影響已驗收runtime對應。

這是最新桌面已驗收來源，不是正式發布或最終恢復收據；正式v055尚未promotion，後續恢復先查是否已有191/192新證據。無Library雙邊同步或公開HTTP逐檔hash聲明。以下188說明保留為歷史基準。

# 恢復 v0.63 來源候選

從 GGGODLIN/hv-v3 bot/dot 取得攜帶 CHECKPOINT.json `188-v063-equip-inspection` 的 exact commit，完整還原 dot-game/，逐檔核對 manifest bytes/SHA-256。包括來源、測試、素材、授權與建置說明；Git 歷史由 repo 保留，網站產物不是完整原始碼。

沒有安裝依賴或編譯步驟。在 dot-game/ 跑 `npm test` 與 `node --check src/engine.js`、loot.js、session.js、ui.js。用 `python3 -m http.server 8000`，瀏覽器開 http://localhost:8000/。先備份玩家正常匯出的存檔，使用隔離測試環境，勿覆寫正式進度。

v063 保持保存格式 v3 與原儲存命名空間；包含 v056–v062 修正，但均未公開瀏覽器驗收。最新完整已驗收來源仍 v055 eaf6e784782a781114352d729a11d0b025f3032a，正式網站 a99ec0252386bb21b94cdec3ae54645805a6b94f。恢復先比較後續證據，不把較新候選當正式最新版。

未宣稱 GPT 檔案庫雙邊同步、公開 HTTP 全檔 hash、平台登入或排程還原。本輪網站零操作，既有候選發布批准待答。

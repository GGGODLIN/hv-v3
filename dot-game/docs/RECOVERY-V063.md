## 192：最新完整桌面已驗收恢復來源

取回攜帶CHECKPOINT `192-v063-restorable` 的exact commit並完整還原dot-game/；逐檔驗證CHECKPOINT files的bytes/SHA-256。包含完整來源、素材、授權、測試、恢復與發布證據；Git歷史在GGGODLIN/hv-v3 bot/dot保留。先比較是否已有更新且完整驗證checkpoint，不因舊連結方便而倒退。

正式website a6bbb8f50445686c7291decec44c563e469872b2、Pages40738324314成功與正常桌面實玩PASS已完成；見PUBLICATION-V063.md及QA-V063-FORMAL-BROWSER-RECEIPT.json。192 runtime/tests/assets不變：21網站runtime中20檔與來源完全相同，index僅發布標記包裝差異，來源index維持188標籤。

無依賴安裝／build：`npm test`與四項`node --check src/{engine,loot,session,ui}.js`（逐檔執行）；`python3 -m http.server 8000`，開localhost:8000。先備份玩家正常匯出存檔，隔離環境測試勿覆寫正式。保存格式v3及正常儲存命名空間保留。桌面之外與精確邊界仍有QA限制；無公開HTTP逐檔hash、Library雙邊同步或登入／權限／排程恢復承諾。

以下為190／188歷史說明，以本節與最新完整證據為準。

## 190：最新桌面已驗收來源（正式升版待完成）

取得攜帶CHECKPOINT `190-v063-browser-accepted` 的exact commit，核對全部files bytes/SHA-256並還原完整dot-game/。runtime與188來源a15522c8ff4dbfe855d2e5ed410cdc40a8035cf9逐byte一致；僅新增驗收文件。桌面候選073261986b8deadbeaf47390f194ec2a26125783已PASS，細節與仍unit-only邊界見QA-V063-BROWSER.md。候選index隔離包裝不是source index；來源顯示候選標籤是刻意保留，不影響已驗收runtime對應。

這是最新桌面已驗收來源，不是正式發布或最終恢復收據；正式v055尚未promotion，後續恢復先查是否已有191/192新證據。無Library雙邊同步或公開HTTP逐檔hash聲明。以下188說明保留為歷史基準。

# 恢復 v0.63 來源候選

從 GGGODLIN/hv-v3 bot/dot 取得攜帶 CHECKPOINT.json `188-v063-equip-inspection` 的 exact commit，完整還原 dot-game/，逐檔核對 manifest bytes/SHA-256。包括來源、測試、素材、授權與建置說明；Git 歷史由 repo 保留，網站產物不是完整原始碼。

沒有安裝依賴或編譯步驟。在 dot-game/ 跑 `npm test` 與 `node --check src/engine.js`、loot.js、session.js、ui.js。用 `python3 -m http.server 8000`，瀏覽器開 http://localhost:8000/。先備份玩家正常匯出的存檔，使用隔離測試環境，勿覆寫正式進度。

v063 保持保存格式 v3 與原儲存命名空間；包含 v056–v062 修正，但均未公開瀏覽器驗收。最新完整已驗收來源仍 v055 eaf6e784782a781114352d729a11d0b025f3032a，正式網站 a99ec0252386bb21b94cdec3ae54645805a6b94f。恢復先比較後續證據，不把較新候選當正式最新版。

未宣稱 GPT 檔案庫雙邊同步、公開 HTTP 全檔 hash、平台登入或排程還原。本輪網站零操作，既有候選發布批准待答。

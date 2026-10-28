## 195：最新桌面已驗收來源，正式發布待完成

從GGGODLIN/hv-v3 bot/dot取得攜帶CHECKPOINT `195-v064-browser-accepted` 的exact commit，完整還原dot-game/並核對files bytes/SHA-256。runtime/tests/assets與193來源17d62dc910c987fdd21c8049436ac5afe0ffb5f2完全相同；包含完整資產授權、測試、恢復與新browser證據。來源index維持v064候選標記，網站index隔離包裝與來源非同bytes。

照下方npm test、四語法檢查及HTTP server步驟恢復。正常桌面候選已PASS；詳見QA-V064-BROWSER.md及收據。正式仍v063 a6bbb8f50445686c7291decec44c563e469872b2，尚未promotion；先比較後續checkpoint，不把本節當正式發布收據。未宣稱Library雙邊同步、公開HTTP逐檔hash、手機或完整無障礙驗收。

以下193說明為來源開發階段歷史。

# 恢復 v0.64 來源候選

從個人 GGGODLIN/hv-v3 bot/dot 取回攜帶 CHECKPOINT `193-v064-detail-sale-selection` 的 exact commit，完整還原 dot-game/。逐檔核對 CHECKPOINT files bytes/SHA-256（manifest 自身不列入 files）。包含完整來源、測試、獨立原創資產、授權與恢復文件；不要只用網站產物當來源備份。

在 dot-game/ 執行 `npm test`；依次 `node --check src/engine.js`、`node --check src/loot.js`、`node --check src/session.js`、`node --check src/ui.js`。無 npm 安裝／build 需求。用 `python3 -m http.server 8000` 開啟隔離測試頁；先正常匯出保存玩家存檔，勿覆寫正式進度。

保存格式與命名空間維持 v3。此候選尚未 browser 驗收／發布；正式已驗收 v063 website a6bbb8f50445686c7291decec44c563e469872b2，完整恢復來源192為361badbe2f5d25ccad528b368f3117cfa727f91b。先查後續 checkpoint，勿把本文件當正式最新發布證據。

來源提交需 expected HEAD 非 force 更新 bot/dot、exact commit changed bytes 讀回及完整 blob/mode 比對、保留409個 dot-game 外 blob。未宣稱 Library 雙邊同步或公開 HTTP 全檔 hash。

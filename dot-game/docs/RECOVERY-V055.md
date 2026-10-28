# 恢復 v0.55 來源候選

取得 GGGODLIN/hv-v3 bot/dot 中攜帶 CHECKPOINT.json `175-v055-loadout-preview` 的 exact commit，恢復完整 dot-game/。先核對 manifest 每個檔案的 bytes / SHA-256；manifest 不包含自身。保存全部來源、測試、腳本、必要素材及授權檔，不以網站編譯／部署副本代替完整來源。GitHub 讀回驗證完成前不宣稱備份完成。

在 dot-game/ 使用 Node.js 執行 `npm test`，對四個 src/*.js 執行 `node --check`；無依賴安裝、無建置步驟。以 `python3 -m http.server 8000` 啟動，開啟 http://localhost:8000/。請先匯出真正遊戲存檔；戰報 JSON 不是可恢復存檔。候選 /candidates/<version>/ 使用獨立命名空間，不自動匯入正式存檔。

v055 尚未瀏覽器驗收與正式發布。需要已驗收版時選 v054 完整來源 c2a048fbadd2c90c536037300463db8a297dec83，對應正式網站 7bc2b344733ba500429de2a52c3d64d87bbad128；先比較後續版本證據，勿因本文件方便而無視新已驗收版。舊來源及歷史測試完整保留。

本輪只修改 UI 投影與樣式、版本標記、測試及說明。engine/loot/session、素材／授權與資料格式 v3 未變。沒有 GPT Library 雙邊同步、登入或排程恢復保證；沒有蒐集玩家原始存檔、公司資料或聊天。

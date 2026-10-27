# v0.32 完整來源恢復與發布界線

## 確切基點與不變的正式版

- 本次來源基點：`GGGODLIN/hv-v3` 個人 `bot/dot`，exact v0.31 `e5aa0213f14b9ead85e8b81c3b5b340259e469be`。
- 本次完整 checkpoint：`130-v032-reference-rpg-interface-source`。最終提交 SHA 應以遠端 ref、該提交的 `CHECKPOINT.json` 與外部備份讀回收據核對；提交前本文件不預填尚未發生的 SHA。
- 最後已驗收完整正式來源仍為 v0.25 `e5962e728ae4c20db80172916f3e1a9b72815a91`。
- 正式網站仍為 `f00fdfe1fcad529081057e99592a49466341bb08`，地址 https://gggodlin.github.io/play/hv-v3-dot/ 。
- 既有已準備但未發布的 v0.26 網站候選 `14524044ee864ac9ac590ed933c9fd0ef5148680` 保留；候選 update_ref 曾被工具審核拒絕且確認未執行。本次不重試、不啟動 CI、不替換 host 或操作既有瀏覽器存檔。

## 恢復要取得什麼

完整取得本 checkpoint 的 `dot-game/`，不是只取 index/CSS/JS：包括全部執行檔、`assets/equipment/` 六款原創 SVG 與 provenance、`assets/kenney-ui/` 三個重色 SVG／兩個原始 SVG／未修改授權／provenance、所有測試與歷史 fixture、量測腳本／收據、文件及 `CHECKPOINT.json`。

逐一核對 `CHECKPOINT.json.files` 的 relative path、bytes 和 SHA256，且檔案集合必須完全相符。完整樹中未修改檔案可用 Git blob identity 校驗；所有新增／修改檔在更新 ref 前要求 exact-content 讀回。保留 `dot-game/` 之外原有409個 blob及模式，不修改別人的程式、常數、怪物或美術。

Kenney 原始 ZIP、官網頁與完整1315檔清單在研究 evidence 留存；這個可恢復來源保存全部**實際使用**資產、精確選用原件、授權與整包雜湊，並不把未使用的聲音／字型／全部色組塞入遊戲。執行不依賴該 ZIP 或外部 CDN。若重新取得官方 ZIP，必須匹配 ASSET-CREDITS 記錄的 SHA256，不能假定同一 URL 永遠相同。

## 來源驗證與啟動

不需安裝前端依賴或打包；執行是本地 ES modules + SVG。Python3 靜態伺服器為一般恢復指令，**不是本次已執行或已獲解除的預覽門檻**：

```sh
cd dot-game
node --test --test-reporter=tap tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
# 在具有所需預覽權限的環境中才執行：
python3 -m http.server 8000
```

不要用 `file://` 開啟 ES modules。瀏覽器真正載入後仍須另外驗收版面、SVG載入、1174×751首屏、窄畫面／放大、可見鍵盤焦點、選售與篩選外選取、待領 FIFO、已穿與背包比較、確認取消，以及受保護／唯讀存檔。尚未執行這些，不代表失敗或通過。

可選來源重播：本機需獨立安裝／提供 JSDOM26.1.0，遊戲本身沒有此 runtime 依賴。`scripts/rpg-interface-measurement.mjs` 的 `BASELINE_DOT_GAME` 必須指向恢復好的 exact v0.31；`JSDOM_MODULE` 指向可用的 JSDOM module，`RPG_INTERFACE_OUTPUT` 可指定另一個證據輸出。腳本會核對基點與輸入雜湊。這只產生來源控制器重播，不產生瀏覽器視覺驗收。

## 存檔與回滾

來源備份不包含個人瀏覽器進度、帳號、權限或排程。正式／候選存檔命名空間仍分離，格式仍3。v0.32不加欄位或遷移，回至v0.31不改遊戲資料語意；但繼續沿用既有v0.24／v0.25無法讀Exquisite IW1、v0.26忽略額外補給設定等歷史界線。先匯出存檔、重新整理舊分頁，禁止舊writer覆寫新投資。

**來源備份成功不等於網站已發布或視覺驗收通過。**解除既有工具門檻前不應直接更新正式網站，或把來源測試、素材PNG檢視當成真實遊戲畫面。

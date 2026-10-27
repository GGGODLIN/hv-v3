# v0.32 來源驗收：裝備圖格與共同介面

**1,800／1,800 項來源測試與四項 runtime 語法檢查通過。尚未瀏覽器視覺驗收或發布。**

## 範圍與確切來源

基點 exact v0.31 `e5aa0213f14b9ead85e8b81c3b5b340259e469be`。本次只變更呈現、SVG 素材、無狀態的圖示路線選擇、目前／候選數值文字與 DOM 排列。引擎／掉落／session、資料格式3、持久欄位、儲存命名空間、亂數與交易政策完全不變。

兩款已核實的 Kenney CC0 原形狀，衍生三個本地重色框／按鈕；六款原創裝備 SVG。完整名稱與品質仍是可讀文字，不讓圖示或顏色取代資訊。所有選用原件、授權與精確 hash 隨完整來源保存。詳見 [ASSET-CREDITS](ASSET-CREDITS.md)。

## 已執行的來源檢查

- `node --test --test-reporter=tap tests/*.test.mjs`：**1,800 pass，0 fail，0 skip**。最終完整凍結後重跑亦為相同結果。
- `node --check`：engine、loot、session、ui 四檔均通過。
- 183個 runtime／資產／測試（含fixtures）／量測腳本／package 驗收輸入，在最終整套測試前後逐 byte、SHA256 核對不變，清單為 `AUDIT-V032-INPUTS.json`。
- 新增作者12項控制器測試、獨立21項圖示／授權／焦點／選售／待領檢查；無新增引擎規則測試或改寫歷史 fixture。
- 12個既有測試檔只隨改版更新版本標籤、空白比較提示、現穿→選取文字或查看後選售的 DOM 順序斷言。保留原數值、招架值非機率、負差值與永久禁售等斷言；沒有把失敗的保護行為跳過。
- 首輪曾有舊版文字／舊 DOM 順序期待失敗；更新必要的介面期待後，43項相關聚焦測試與兩次完整1,800項套件通過。不把中間失敗稱為通過。
- JSDOM 純 CSS 解析752規則、0解析錯誤；不代表瀏覽器支援、實際 style 計算或排版。
- 三個核心JS與40個歷史fixture、2個browser fixture相對exactv0.31保持原bytes。獨立稽核45檔一致。canvas繪圖整段不變；不是完成場景美術重製。

## 來源流程重播

固定seed42自然取得20次通關、237次一秒pulses，沒有新增資源、改骰、補勝場或調難度。相同已取得存檔在v0.31與本候選重播30個語意檢查點：出戰、通關後回營／取消、自然受傷與手動藥水、立即回營、選取比較、確切ID焦點、分頁工具、隱藏篩選、出售預覽／取消／歷史返回、綁定／IW預覽取消及另列的明確模擬綁定、唯讀拒絕、模擬進度寫入與未知存檔保護。完整state／RNG／action／storage-write相同。

9,562 bytes 收據由獨立審查者再次執行，逐byte相同；SHA256 `6f07c738dfc3581c0bc694202752db452cdbfe301d7e3bc3e230edbb8a1fbf45`。見 [RPG-INTERFACE-MEASUREMENTS](RPG-INTERFACE-MEASUREMENTS.md) 與 `docs/measurements/rpg-interface.json`。

## 實際看過什麼，未驗收什麼

已實際靜態渲染與看過六款裝備圖及三個Kenney衍生圖；原始ZIP、授權與原件逐byte核對。計算的九組主要來源色碼對比均>=6.98:1，這不是整頁可及性認證，尤其不包含所有舊元件、禁用opacity或實際字型。

**未執行：實際遊戲瀏覽器、1174×751首屏、窄畫面／縮放／觸控、真正Tab與焦點可見性、螢幕閱讀器、跨分頁鎖與個人存檔操作、網站候選、CI或正式發布。**JSDOM與來源harness不會產生真實排版，也不能證明畫面「好看」。不以其他host、直接headless瀏覽器或錯誤頁繞過門檻。

正式網站仍為已驗收v0.25。完整來源checkpoint130的遠端備份另以exactcommit與讀回收據確認；備份不是發布。見 [AUDIT-V032](AUDIT-V032.md) 與 [RECOVERY-V032](RECOVERY-V032.md)。

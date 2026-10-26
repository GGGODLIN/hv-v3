# v0.18 獨立驗收：委託後綴選擇

2026-10-26 UTC。此檔為獨立研究、程式稽核與模擬驗收，不等同瀏覽器或正式發布驗收；發布證據由 STATUS／版本驗證紀錄補充。

## 原版依據與本作邊界

唯讀核對原版研究固定版本 [003 @ 8e1ff320](https://github.com/GGGODLIN/hv-v3/blob/8e1ff32097d50ba8e1c30266653234506b98a5f4/.scratch/hv-v3/wayfinder/findings/003-equipment-armory-and-modes.md)：

- L227–235 為合法基底／後綴表。這次六組全部在原版合法範圍內：Axe Slaughter；Club Slaughter / Balance；Rapier Slaughter / Balance / Nimble。
- **六組不是原版完整合法清單。** 原版也允許 Axe Balance（L232）、Club Nimble（L235）；本作既有資料未支援這些組合，本次不擴大資料或隨機掉落表，不可說成原版禁止。
- L363：Axe Slaughter / Others attack `[470,888] / [350,701] × .0854`。
- L370、372：Club Slaughter / Others attack `[353,792] / [250,621] × .0854`；Balance / Others crit `[344,991] / [124,511] × .0105`（百分點轉小數）。
- L378、380、382：Rapier Slaughter / Others attack `[230,601] / [150,461] × .0854`；Balance / Others crit `[342,991] / [124,511] × .0105`；Nimble / Others parry `[137,301] / [75,211] × .0894`。
- 原版表也有 Balance accuracy；本作沒有藉本次新增該數值。Nimble 原版欄位叫 Parry Chance，本作存招架值再使用既有 bounded adapter，不能當成原版完整最終判定公式。
- 固定 Superior、全項 R110、無前綴、角色等級、金幣價 `max(250,4*itemSalePrice)`、解鎖／背包保留／鎖定交貨皆既有本作委託適配，不是原版 Bazaar。品質指數1.52沿用研究模型，非宣稱伺服器精確公式。

## 可重跑驗收

`node --test tests/commission-affixes-acceptance.test.mjs`：4 / 4 通過。

1. 以 accepted v0.17 `69c837f85c01b8352be4316874dc959d2462e0cb` 的三武器、等級1/7/20/500完整物件 JSON SHA-256 作獨立舊行為基準。省略 suffix 與顯式 slaughter 完全一致，舊二欄購買 payload 仍有效。
2. 六組預覽與交貨不取 RNG、不修改預覽來源、不自動裝備、鎖定入包、既有存檔往返保留，價錢公式不變；未支援組合拒絕。
3. 後綴／家族置換，金幣、背包內容、容量、待領、比較裝備或 ID 計數變動均拒絕舊報價，除了既有取消日誌外無資源或交貨變動。
4. 公開 API 自然遊玩，無注入等級／裝備／資源，進行三個種子的六組購買及真實戰鬥比較。

額外一次性直接比對 accepted v0.17 完整 source snapshot（不是其他作者程式）：12個預設家族×等級的 preview item/price、購買後完整狀態完全一致。六種購買後存檔分別由 v0.17 與當前 reader 讀取，normalized state 完全相同。測試不依賴暫存工作區；舊預設物件 SHA 留在測試中。未新增歷史原始碼 fixture。

獨立執行 sibling engine/UI tests：`node --test tests/commission-affixes.test.mjs tests/commission-affixes-ui.test.mjs`，15 / 15 通過。人工讀碼確認選擇後綴清除舊 consent，確認帶 family+suffix+quoteBasis，選單僅限本作支援集合，營地／所有權檢查仍在。這不是實際瀏覽器驗收。

## 自然取得與實戰測量

預先固定 seeds29/42/77，預設 balanced，stage1重複20次，每次回營只換背包中最高既有 score 的該槽裝備（測試策略，不是普遍推薦）。不賣裝、不配新 AP、不改資源、不改敵人。三者均20勝、Lv11、1520金幣；每個候選自同一自然 checkpoint 複製，付費後裝備再打同一場。價格依序：Axe Slaughter860、Club Slaughter764、Club Balance656、Rapier Slaughter680、Rapier Balance596、Rapier Nimble608；18場全勝。

seed29 的可重現樣本：

| 選擇 | 攻擊 | 暴擊率 | 招架率 | 時間 | 最低HP |
|---|---:|---:|---:|---:|---:|
| Club Slaughter |170.06|12.60%|3.50%|10.5s|878|
| Club Balance |152.06|16.02%|3.50%|8.4s|896|
| Rapier Slaughter |149.06|12.60%|15.1692%|9.5s|896|
| Rapier Balance |134.06|16.01%|15.1692%|11.6s|874|
| Rapier Nimble |134.06|12.60%|21.7569%|11.4s|880|

Balance 以攻擊交換暴擊，Nimble 以攻擊交換招架；同一個種子的戰棍平衡更快，刺劍平衡反而更慢，故沒有「新後綴必勝」宣稱。seed42 刺劍Nimble與Balance均10.5s但最低HP為838／850；seed77 Nimble11.6s最低828，而Slaughter10.5s最低825。RNG起點相同不代表後續抽樣路徑完全相同，觸發／攻擊次數改變會分岔；這些是小樣本觀測，不是勝率統計或最佳配裝證明。

## 未在本獨立稽核宣稱完成

- 尚需主整合者實際瀏覽器選擇、預覽、付款、裝備、戰鬥及舊存檔 UI 驗收。
- 本檔不宣稱 GitHub source backup、staging / root HTTP、CI 或公開部署通過；必須使用各自 exact commit 證據。

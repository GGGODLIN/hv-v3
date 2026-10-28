# rc12r QA：「★ 估計 = 實際蓄力一擊的一半」調查

## 結論（已驗證，/workspace/rc12r-evflush.jsonl 的 est20 列）
- 7 例（bw3 224/449×3、231/462；oc1 170/340、175/350×2）中，記錄的 449/462/340/350 蓄力一擊都在**決策前一回合**命中（決策時 HP 已扣除它，例如 650→201）；★ 選 Z/D 的那一回合實際受到 0。
- 面板的 224/231/170/175 是「無蓄力中」時的每回合 plain cap：ceil(0.2·maxHP)−1（CP9.bossPlain），因命中後 windCd 鎖住新蓄力。不是防禦減半。
- 蓄力中時，Z/D 決策用的 est 是未防禦全值（例 449 = floor(0.4·1123)，minionCharge）；防禦減半只用在 D 專屬的 estD。回歸測試：tests/rc12r-est-half.test.ts。
- **撤回**先前「174 vs 349 為時序問題」假設：QA 948 回合 panel-read 回合 == click 回合，app 從不 busy；應為同一錯配（前一回合的命中 vs 下一回合的 plain cap）。

## 排隊取消提示
- 只有「有排隊指令」且本回合出現新蓄力時才觸發。QA 只在非 busy 時按 ★，沒有排隊鍵 → 永不觸發，屬預期。
- 新增持久標記：戰鬥紀錄 `[data-queuedroplog]`（值=回合）、狀態列 `[data-qdropcount]`（本次 session 累計，自訂）；原閃示 `[data-queuedrop]` 只在該回合顯示。

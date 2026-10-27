# v0.32 自然進度與來源控制器重播

執行腳本：`scripts/rpg-interface-measurement.mjs`；收據：`docs/measurements/rpg-interface.json`。
基點：exact v0.31 `e5aa0213f14b9ead85e8b81c3b5b340259e469be`，腳本先核對基點七檔雜湊，不以「看起來同版」取代。

沿用預先宣告seed42／20次stage1流程，挑已擁有同部位最高屬性評分裝備（同分選後者），排定通關後回營；每場最多1000次一秒pulses，保留失敗／截斷。這是測量策略，不是新增自動換裝功能，也不保證最佳配裝。

結果20勝、237pulses、無失敗或截斷。完整自然取得state與戰報在每個engine動作／pulse都與v0.31相同。沒有假造資源、掉落、品質、AP或新增勝利。取得後再分支進行30個來源控制器檢查點，包含重複比較、焦點、換裝、取消／返回及資源確認；兩版完整state、RNG、action與存檔寫入紀錄均相同。

明確分開：一般重播用不支援Web Locks的暫存模式；另設模擬owned lock callback測3次正確進度寫入與version999合成保護情境的0次覆寫。綁定確認的實際支出也是來源模擬分支，不是修改正式瀏覽器存檔。JSDOM dialog與事件是模擬，不是實際鍵盤、版面或跨分頁驗收。

獨立再次執行所得收據9,562 bytes逐byte相同，SHA256：
`6f07c738dfc3581c0bc694202752db452cdbfe301d7e3bc3e230edbb8a1fbf45`。
六個runtime輸入、runner雜湊與收據一致；使用的外部審查依賴JSDOM版本26.1.0不屬於遊戲runtime。

沒有從這20場推估勝率、掉率或介面改善後的實際操作速度。既有canvas畫面沒有更動；此次驗證只保證新呈現不把已知遊戲流程改掉，不保證瀏覽器畫面完成。

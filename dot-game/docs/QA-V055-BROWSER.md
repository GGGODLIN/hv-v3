# v055 正常公開候選瀏覽器驗收

2026-10-28，獨立雲端 Chromium，候選 https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.55/ 。來源 19fbd1772b1aa0a806d093fcd7c3c529dfca302b，網站 2ed06f9a320729048429d6ed5045a7e965748dd5，Pages CI40663150260 success。完整非玩家資料證據見 QA-V055-BROWSER-RECEIPT.json；原始玩家存檔不入repo。

正式v054經正常UI匯出LV3、152gold、12kills、2wins；候選正常UI匯入並預覽後再次匯出，3456bytes及SHA256 ead147d4c3f4cc411f04765312484b9145f7aa17bae2c37aaab0efb0fe24dfc9完全相同，確認預覽不改進度／RNG。七列目前／換上後均存在，選刺劍真實換裝後，再檢視戰棍的目前值等於先前預覽七項值；現穿卡無假設預覽。

正常交戰時換裝鍵禁用且提示僅預覽；自然15.8秒遠征使LV3→4、gold152→228、kills12→18、wins2→3，獲Superior戰斧與刺劍，升級後已選裝備預覽自然刷新；新刺劍正常換上。正常匯出→重載→匯出，hero/inventory/equipment/seed/wins/kills/soulFragments/worldSeeds八項保持相同，暫態戰報等依現有規則重置。

桌面1180×757與Chromium300%縮放形成393寬視窗均無水平溢出；後者不是手機實機。最後正式分頁再次匯出與baseline bytes/hash一致，候選無污染。抽樣20筆error/warn皆既知Chrome-extension來源，樣本內未見app來源錯誤。

未實測：待領戰利品、敗北、競爭唯讀分頁、極端stat cap、獨立能力／屬性花點刷新、手機實機、完整鍵盤與screen-reader。來源DOM/engine測試覆蓋其中部分但不能當成瀏覽器實測。

公開HTTP逐檔bytes/hash因工具環境不可執行而未完成，沒有繞用其他瀏覽器fetch。父任務依source exactreadback、部署git tree/ref、exactCI及公開browser正常遊玩接受此候選；不宣稱HTTPhash已完成。正式v055 smoke仍待發布後進行。

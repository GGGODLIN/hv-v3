# v064 隔離候選桌面實玩驗收

來源193：17d62dc910c987fdd21c8049436ac5afe0ffb5f2。候選website：8d7875b52ed812ac679581f60aa9c6cf318502ed，exact Pages40743221581 success。發布者先確認21個網站runtime檔案映射，再由獨立QA於dot雲端Chrome使用正常UI及真實匯出檔案匯入；沒有注入或讀寫localStorage。

- 原正式v063 Lv5／304金／背包5件匯出作隔離測試基準。
- 勾選loot-1後，詳情加入loot-2變2件162金；移出loot-2保留loot-1，焦點跟隨操作按鈕。加入／移出不動物品與金幣。
- 再加入並開預覽，完整列出兩ID與預計466金；取消後正常匯出的原始bytes／SHA-256與輸入完全一致。
- 重新預覽確認，只出售loot-1、loot-2；304→466金、bag5→3。其他loot、鎖定starter、現穿loot-5保留；選取清零、預覽disabled、確認按鈕離開modal。
- 自然第一關11.6秒通關，466→542金，取得loot-6 Superior Ember armor，回營。正常匯出／重載所有durable欄位一致；瞬時戰鬥與事件欄位按既有load規則重設。
- 正式v063再次正常匯出仍與測前基準逐byte相同。桌面1180視窗／document1165，0張broken image，截圖已檢視。

完整機器收據 QA-V064-BROWSER-RECEIPT.json，SHA-256 bf6cf787ba66b74e0b4c96ef3cef3783327a7748dbf365dc87c0f07f68d632cc。來源全套2284tests及4語法檢查再次通過。

限制：舊按鈕重放、精確競態、綁定／配裝保護等仍來源unit coverage，不冒稱browser重現。沒有手機／完整無障礙驗收或公開HTTP逐檔hash。首次等待回營標題短暫timeout，後續fresh UI確認自然完成；沒有遊戲繞過。正式發布仍待完成。來源index保留測試過的候選標記，不為改文字重測出另一runtime。

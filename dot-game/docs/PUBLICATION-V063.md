# v063 正式發布與最後恢復記錄

正式頁 https://gggodlin.github.io/play/hv-v3-dot/ 已升級v063，website exact commit a6bbb8f50445686c7291decec44c563e469872b2。Pages40738324314 completed/success且head_sha一致。發布者核對21runtime Git bytes，其中20檔與190來源672cedf44b8df9480dfd50877832adbc8f49d7c7完全一致，index僅發布標記包裝差異，正常保存命名空間不變；4148範圍外blob/mode保留。沒有公開逐檔HTTP hash成功聲明。

正式正常桌面browser PASS：dot雲端Chrome原Lv4/228存檔先匯出備份再重載，不把候選存檔匯入正式、不注入state。首層18.9秒通關→Lv5/304金、24kill/4win，掉落loot-5精良暮鋼戰斧屠戮；換上後同件明細與焦點保留，舊武器loot-2回背包，無舊換裝／出售按鈕。匯出後重載durable欄位相同，暫態戰鬥欄位正常重設。寬1165、scrollWidth1165、brokenImages0。詳QA-V063-FORMAL-BROWSER-RECEIPT.json，SHA-256 1547671d0bf0ccfe8cd42599d3f9763d523c1a0f86dd3700a8e6ab48473e2a69，2026-10-28 17:46:51 UTC。

192完整恢復來源只補文件與manifest；runtime/tests/assets與190（以及188）逐byte不變。來源index仍保留來源候選標籤，正式網站index有發布標記，不混淆byte對應。最新完整桌面已驗收可恢復checkpoint為192-v063-restorable；取得其exact commit並依CHECKPOINT驗證全部檔案。舊checkpoint繼續可恢復。

限制：正常桌面流程不是實體手機／完整無障礙或全部邊界驗收。精確藥水浮字、極小委託差、小於1資源與焦點競態仍沿用候選receipt的unit-only限制；無公開HTTP逐檔hash或GPT Library雙邊同步聲明；不保證平台登入／權限／排程恢復。

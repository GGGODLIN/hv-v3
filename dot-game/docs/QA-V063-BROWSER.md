# v063 桌面公開候選驗收

證據：QA-V063-BROWSER-RECEIPT.json，SHA-256 cba3aaf3baa35bc9e7b88132004dfbdb7ae1adca75dd27133fb74dfef2d6d1f3。2026-10-28 17:37:51 UTC，dot雲端Chrome正常介面、真實匯出存檔匯入，不注入合成state。候選 https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.63/ commit 073261986b8deadbeaf47390f194ec2a26125783，來源 a15522c8ff4dbfe855d2e5ed410cdc40a8035cf9，Pages40736583520成功由發布者核對。

正常桌面流程PASS：換裝loot-7保留已裝備明細、無舊比較與出售換裝按鈕、焦點跟同件卡片；選售鎖定只移除失格項、解鎖不重選、離營清空；鍵盤Space同件切換；普通委託預覽未購買；正常藥水使用；勝利間歇4/4、下一輪0/4再1/4、回營0/4。自然4勝，Lv6→8、金456→760、擊殺36→60、背包7→15，重刷與回營正常。重新載入durable欄位一致，暫態戰鬥欄位依既有規則重設。正式v055基準4572bytes、SHA-256 49b4cf1645ed29f4324f6b6ae6bfb7a3ff299d241595a7d0f13a139ba5c0c85d逐byte不變。桌面寬1165且scrollWidth1165、brokenImages0。

限制：精確藥水治療浮字未可靠擷取；小於1／四捨五入假滿、極小委託差、開啟確認單失效、一般焦點消失競態／待領等仍僅來源測試。不是實體手機、完整可及性、全機制或所有邊界驗收。公開HTTP逐檔hash未完成。Git runtime identity／CI與browser是不同證據。v056前置receipt另存QA-V056-BROWSER-RECEIPT.json。

190 checkpoint僅更新README/docs/manifest；不更動188 runtime/tests/assets。候選index隔離包裝與來源index差異保留；正式promotion尚未完成。

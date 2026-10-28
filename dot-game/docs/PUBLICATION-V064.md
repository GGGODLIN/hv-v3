# v064 正式發布與驗收

正式頁 https://gggodlin.github.io/play/hv-v3-dot/ 。Website commit8002ee77afc3bb2ab9ab80835beb7bc24b727f0c，Pages run40744749277，completed/success且head_sha精確相符。來源先備份195：b84da78df68b1fe6dc22e37a7a42403ad758bd8a。

只改正式範圍內index.html及src/ui.js；21runtime exact Git blob讀回，20檔與195來源完全一致、index僅發布階段包裝，原儲存命名空間不變。4169個網站範圍外blob/mode保留，沒有force。隔離候選仍獨立，不導入其存檔到正式。

正式獨立QA以dot雲端Chrome正常UI檢查：原存檔Lv5/304載入v064；loot-1詳情加入／移出焦點保留，取消預覽後正常export與原備份逐byte一致；再次確認只出售loot-1 +86金、bag5→4，starter鎖定與現穿loot-5及其他裝備保留；自然11.6秒勝利、取得loot-6，最終466金／XP138/159／bag5；正常匯出重載持久資料一致。零broken image，viewport1180/document1165，無橫向溢出。

證據：PUBLICATION-V064-RECEIPT.json、QA-V064-FORMAL-BROWSER-RECEIPT.json。正式browser收據SHA-256 c62c36e42416db3b38a25ee2f3f34f9350079de0223f0b97db56f578f8f657ee。候選驗收見QA-V064-BROWSER.md及其收據。197僅來源文件更新、runtime/tests/assets不變；2284來源tests／4語法檢查沿用195重跑證據，不冒稱197重跑。

限制：正常桌面煙霧與實玩，不是實體手機或完整無障礙；競態、過期handler重放與保護邊界仍source unit-only。沒有公開HTTP逐檔hash或Library雙邊同步聲明。附加publisher收據中的197 pending是當時時序紀錄；197完成以其exactcommit與本恢復manifest核對。

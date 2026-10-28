# v055 正式發布證據

- 已驗收完整來源：42637d01d5a46afcfdd148559de6c6af785fbaad（177）。標記更新後2134/2134測試、4runtime語法檢查通過；獨立來源12/12通過。
- 隔離候選：2ed06f9a320729048429d6ed5045a7e965748dd5，CI40663150260success，正常公開瀏覽器驗收見 QA-V055-BROWSER.md。
- 正式網站：a99ec0252386bb21b94cdec3ae54645805a6b94f；tree3f72efeda285d392ef20ec173e310f35db0c9c03；預期HEAD2ed06f9，以非force更新。exactref/commit/tree讀回確認。
- 21runtime檔的Git blob SHA與來源核對，僅index.html/style.css/src/ui.js三檔更新，4124個其他blob及mode不變，候選保留。Pages CI40665432751success。
- 公開網址：https://gggodlin.github.io/play/hv-v3-dot/

## 正式真實遊玩

獨立雲端Chromium重新載入原正式v054的LV3／152gold／戰棍進度，沒有匯入候選或注入測試狀態。v055顯示持續開發，正常選刺劍看到7項面板預覽並換裝成功；自然15.8秒第一層遠征使LV3→4、gold152→228、kills12→18、wins2→3，掉Superior戰斧與刺劍。

正常匯出→重載→匯出，兩份JSON可讀；hero/inventory/equipment/seed/wins/kills/soulFragments/worldSeeds八項一致，安全回營且出戰可用。1180px桌面documentScrollWidth1165、brokenImages0，公開森林／寶箱／角色實際畫面已查看。詳見 QA-V055-FORMAL-RECEIPT.json；原始玩家存檔未提交。

## 限制與恢復

公開HTTP逐檔bytes/hash未完成：雲端命令網路核准取消，隨後環境初始化失敗；沒有遠端HTTP結果，未繞過重試。本次接受依據為完整來源exactreadback、部署Git tree/ref、exactSHA CI及公開頁真實瀏覽器遊玩；不聲稱HTTPhash比對或22檔HTTPexact。未宣稱手機實機、完整無障礙、極端cap、待領、敗北等正式瀏覽器覆蓋。

179-v055-publication-receipt僅補文件／manifest，runtime不變。恢復時取該checkpoint之exactcommit完整dot-game並驗證manifest；另保留舊版本可恢復性，先比較後續新版證據。沒有Library雙邊同步、平台登入或排程恢復保證。

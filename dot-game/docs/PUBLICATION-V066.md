# v066 發布紀錄

1. 來源203 `a1830417cd4dcaaafd58ec91e3c95243f14ed321`：2340 tests＋4 syntax，獨立22，完整來源591檔。
2. 候選204 website `80c51ea2b504b1e2947234775a00f3f5ef1327e9`；exact Pages40761026923 success；正常桌面實玩PASS（單次全四波停營、取消續刷、活躍預約重載清除、持久資料、正式隔離）。
3. 已驗收來源205 `07dbdb366b99572216b29c355b7010cb21980e6e`：593檔，runtime/tests/assets/index與203逐byte不變，fresh2340＋4 syntax再次PASS，完整exact讀回。
4. 正式206 website `426e77fffe719de19eef7927dcf18e705d081030`；exact Pages40762476547 success，21 runtime檔Gitbytes核對、4211範圍外blob/mode保留。正式入口 https://gggodlin.github.io/play/hv-v3-dot/ 。正常原profile單次遠征與15秒停營觀察、匯出重載PASS，最終Lv6／618金／7勝。
5. 恢復checkpoint207補完整發布／正式browser收據與manifest；runtime/tests/assets/index仍逐byte同205，不再部署，不宣稱207另跑測試。

候選與正式index各有既定標籤／存檔namespace包裝，不冒稱所有index逐byte相同。資料格式仍v3。舊HV／dot-archive未操作。正式單次smoke不是手機／完整無障礙／全部競態驗收；邊界與公開HTTP逐檔hash限制見browser文件。未宣稱Space／Library雙邊同步。

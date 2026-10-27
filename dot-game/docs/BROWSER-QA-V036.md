# v0.36 真正瀏覽器驗收與限制

## 隔離候選：有限桌面驗收通過

2026-10-27 13:28 UTC，root 以真正 cloud browser 正常操作候選，明確 ACCEPTED；不是模擬 DOM、改存檔或截圖fixture。來源146 `f079b8ffec04f7834768461bde8d809cab749711` 先完整備份／讀回，再發布候選147 `1b84676530bb34b8c62fc44025fa00b0642ff9bf`，Pages `40511494672` exact SHA success，21 runtime＋directory index皆 HTTP200且bytes一致。原4026網站blobs/modes與v0.35正式21 runtime／directory保留且讀回一致。

實際viewport 1180×757、scroll width1165、broken images0。候選獨立profile取正常v0.35遊玩匯出進度，並非正式profile或人工灌入裝備。

### 真正看到的改進

- 不透明名牌在月亮前不再消失；單影獸 PA `1 · 7T` 可讀。
- Boss「裂隙守門者 · 5」、HP41%、PA `1 · 7T` 與飄字153分離。
- 普通雙敵：死亡獵犬HP0%與活甲蟲HP42%名牌分開，未重疊。
- 活caster與獵犬同時100%名牌、角色與飄字298未互擋；本版真正目視caster杖頭晶飾。此為新證據，不回改v0.35當時未目視的歷史記錄。
- 完整DOM實讀保留減傷、閃避／招架／格擋及caster交替下一次物理、抵抗0尚未實作等原有限制。
- 自然戰斧曾在DOM觀察BW1/5、7Tick、16傷；截圖時已進下一波，因此不宣稱BW名牌截圖目視。戰棍未抓到STUN活躍畫面。

### 自然遊玩與持有物保留

四場正常stage5勝利：刺劍15.8秒、起始中性劍21.0秒、戰斧15.8秒、戰棍15.8秒。最後還原原穿loot-12。

正常匯入基線：Lv17／3489金幣／54勝／101背包／HP1018／90碎片／8種子。正常遊玩後並重載：Lv18／4065金幣／58勝／106背包／HP1042／130碎片／12種子。

- 原104件held records全部保留；101件逐byte相同，3件綁定武器因自然17→18成長。
- loot-1：attack42→43、crit .0261→.0262、power91→93。
- loot-9：attack75→77、power159→163。
- loot-12：attack67→69、crit .0299→.03、parry11.8211→11.8269、power163→167。
- 這三件其餘anchor／roll欄位不變；新增loot-104至loot-108五件自然掉落。
- gearSets、abilities、strategy、emergencySupply、autoAdvance不變；原裝備IDs已還原。
- 前正常匯出SHA-256：`519630a0a6b0d8fa9b0c32ada8c096a79455a2d455cbbcd59e4df602e16582a4`。
- 後正常匯出SHA-256：`32dd76295d58bff694dc4cf3f9e8ae13524dde7a00297efeb653f42a58a9d0f9`。
- 原始遊玩匯出不納入repo；這裡只保存必要版本驗收摘要。

62則console皆既知擴充套件來源，app-origin錯誤0：`chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js`。

### 尚未驗收的範圍

減少動畫未在本版browser重測；PA／STUN／BW三effect疊合、READY、極低HP只具來源邊界測試，不在browser人工製造狀態。手機／窄viewport、assistive technology未驗；logical320幾何不是手機驗收。名牌`fillText(maxWidth)`可能壓縮長字，raw opaque對比值不是經vignette後WCAG證明。背景／寶箱仍原樣，不宣稱全美術完成。

## 正式頁

此文件建立時尚未更新正式頁。順序為接受來源148完整備份／讀回→正式149 exact CI／HTTP→原正式profile正常出戰／重載。原正式起點Lv11／1142金幣／21勝／41背包；不得匯入候選替換正式進度。

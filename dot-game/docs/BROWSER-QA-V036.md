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

## 正式發布與原profile驗收通過

接受來源148 `969aae334786a54086b1689c5dbf85b80dbf9293` 完整408檔／407payload已備份讀回，18變更逐檔exact、390不變檔與409範圍外blob/mode保留。正式149 `f192fec4eff401948d80156f941c01404816cbba`、Pages `40513626492` exact SHA success，21runtime＋directory index HTTP200且bytes一致；candidate21runtime＋directory也保持原樣。

發布前網站出現外部並行提交 `277a8d04fc0639f9190de8b5ee439a6116810ab5`，在149任何寫入前停止舊base計畫，以fresh tree唯讀核對：dot區不變，外部44 blob paths（compare43項含rename）變更均完整保留。只用fresh expectedHEAD非force更新dot正式index/ui兩檔；其餘19runtime及4064範圍外blob/mode不動。這不是拒絕或重試繞過，不讀取／沿用別人的遊戲內容。

root於2026-10-27 13:42 UTC真正原正式profile驗收通過：重載v0.36保留Lv11／1142金幣／21勝／41背包、原未綁定Lv7 loot-12。普通route1預約回營11.6秒通關，正常成長至Lv12／1218金幣／22勝／42背包／HP897／70碎片／6種子；重載保留。新名牌HP73%、集火與飄字35清楚分離。

原44件held records全部逐byte EXACT不變，只新增loot-42；equipment、gearSets（原本與現在都不存在）、abilities、strategy、emergencySupply、autoAdvance不變。正常前匯出SHA `68eee9a9e1b53172794d56613ea3d56b38c2eb849518d1bce87e5aafcc994f2e`；後匯出SHA `9ed2d675bba5528fb933215722e634ba98a9712d465bc34712bedf31b3d4d0ec`。從未匯入候選進度到正式；原始匯出未收進repo。

46則console皆既知擴充套件來源，app-origin錯誤0。候選分頁已關，正式停於營地。最後150只保存文件／manifest收據，不修改runtime／tests／assets，不重部署；接受phase實際1919測試／四syntax記錄仍有效，不把文件收據說成另一次測試。

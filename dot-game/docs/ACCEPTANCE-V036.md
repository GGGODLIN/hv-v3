# v0.36 戰鬥名牌：來源驗收

## 改進依據與邊界

v0.35 真正桌面遊玩確認：細小敵方防線字直接疊月亮，角色已可辨識但資訊難讀。本版只改角色上方的資訊層級與 canvas 替代文字，不新增原版機制或本作數值。角色形體、森林、寶箱與既有裝備美術維持原樣。

- 名稱、生命、當前集火與活躍 PA／STUN／READY／BW 必須依真實當下狀態，不以外觀推測。
- 完整「敵方狀態」保留原有數值精度、角色、交替攻擊預告、穿透／暈眩／流血、來源／適配限制，不用 canvas 摘要取代它。
- 雙敵為現有引擎最多同場數；三敵只屬既有繪圖 cap 的防禦性來源邊界，不冒充自然 encounter。
- 死亡不顯示 active target／效果；減少動畫時資訊仍可查。
- 不改存檔格式3、儲存key、亂數、動作時序、物品、費用、掉落或原版HV研究。圖形呈現不可寫state或consume RNG。
- 來源邊界與對比測試不是實際像素、窄螢幕、screen reader或美術完成證據。候選及正式profile必須分開驗收。

## 驗證

實作方與獨立稽核的完整套件皆為 **1,919/1,919 通過**；獨立四個 runtime Node syntax checks 通過，179 個 runtime/tests/assets/HTML/CSS/package 輸入前後 byte 相同。新增8項UI與14項獨立稽核測試。完整輸入 aggregate SHA-256：`acdad29b3e480974968d6aebacde9f26b3ce67f554152ddd6f6742cbc91dc6d7`。

v0.35 的398個來源payload基線核對通過；core、CSS、14素材、42 fixtures、2 helpers不變，ui.js 除 drawEnemy 名牌後段之外維持原byte，hero/enemy body與完整 renderEnemyStatuses不變。正常雙敵logical320最小名牌間隔28px、抽樣含最大擺動的角色淨距3.9px；這不是窄viewport或浮動傷害文字的實際驗收。

自然重播已由兩個獨立 Node process 執行且逐 byte 相同：20 次自然出戰全部勝利，取得三武器並解鎖1–5層；另15次 controller 出戰全部通過。432 次完整來源 parity、2,453 次 controller parity、6,080 次 frame call 與3,040組非干預檢查保留 state/events/reports/RNG/actions/writes。這些不是瀏覽器遊玩或像素證據。

JSON SHA-256：`a88d761a503f239f9558c30abe3bb881e46403d02779bd50d6b18ba69c92fa80`。自然取得階段沒有觀察到 PA／READY；controller 觀察到 PA／STUN／BW，沒有 READY；READY 只有明確標示的合成邊界測試，不虛報自然目視。

舊測試僅更新 canvas 呈現預期：battle-actors、battle-actors-audit、role-ui、weapon-ui 的 HP／role-defense 移位／特效行數與血條寬度；原角色形體、完整 DOM 防線及機制存檔斷言保留。第一個開發中全套曾漏 weapon-ui 的死亡 HP 0% 新標示預期；已精確更正並要求完整重跑，不隱藏失敗。

詳見 AUDIT-V036.md 與 ENEMY-NAMEPLATES-MEASUREMENTS.md。

## 接受phase後重新驗證

root於2026-10-27 13:28 UTC明確接受有限desktop候選，見 BROWSER-QA-V036.md。只將index的「來源候選」改「持續開發」與8個對應精確測試標示；功能runtime/CSS/assets不改。再次完整 **1,919/1,919** 與四runtime syntax通過，179輸入前後一致，aggregate `6d16bf1abb1f187c886cc47aa3d62e604b20347b190ec6ce90b98fd8da4e8aa5`。自然receipt保留原來源phase的hash，沒有誤稱該receipt原HTML hash等於接受phase。

## 正式發布與原profile驗收通過

接受來源148 `969aae334786a54086b1689c5dbf85b80dbf9293` 完整408檔／407payload已備份讀回，18變更逐檔exact、390不變檔與409範圍外blob/mode保留。正式149 `f192fec4eff401948d80156f941c01404816cbba`、Pages `40513626492` exact SHA success，21runtime＋directory index HTTP200且bytes一致；candidate21runtime＋directory也保持原樣。

發布前網站出現外部並行提交 `277a8d04fc0639f9190de8b5ee439a6116810ab5`，在149任何寫入前停止舊base計畫，以fresh tree唯讀核對：dot區不變，外部44 blob paths（compare43項含rename）變更均完整保留。只用fresh expectedHEAD非force更新dot正式index/ui兩檔；其餘19runtime及4064範圍外blob/mode不動。這不是拒絕或重試繞過，不讀取／沿用別人的遊戲內容。

root於2026-10-27 13:42 UTC真正原正式profile驗收通過：重載v0.36保留Lv11／1142金幣／21勝／41背包、原未綁定Lv7 loot-12。普通route1預約回營11.6秒通關，正常成長至Lv12／1218金幣／22勝／42背包／HP897／70碎片／6種子；重載保留。新名牌HP73%、集火與飄字35清楚分離。

原44件held records全部逐byte EXACT不變，只新增loot-42；equipment、gearSets（原本與現在都不存在）、abilities、strategy、emergencySupply、autoAdvance不變。正常前匯出SHA `68eee9a9e1b53172794d56613ea3d56b38c2eb849518d1bce87e5aafcc994f2e`；後匯出SHA `9ed2d675bba5528fb933215722e634ba98a9712d465bc34712bedf31b3d4d0ec`。從未匯入候選進度到正式；原始匯出未收進repo。

46則console皆既知擴充套件來源，app-origin錯誤0。候選分頁已關，正式停於營地。最後150只保存文件／manifest收據，不修改runtime／tests／assets，不重部署；接受phase實際1919測試／四syntax記錄仍有效，不把文件收據說成另一次測試。

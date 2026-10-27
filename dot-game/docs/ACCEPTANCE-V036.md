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

# v0.34 裝備特效說明：來源驗收

## 針對已觀察的問題

v0.33 實際桌面比較已能先看到身分、現穿 → 選取與操作，但下方仍同時常駐完整 `describeWeaponTrait` 和 `weaponRuleText`，把觸發、層數、時序、公式及原版限制重複展開。來源重現證明三類武器各有兩段；戰斧兩段以一個空格連接為 382 Unicode code points。這次不增加玩法或宣稱整體美術完成。

## 實作界線

- 戰斧保留延後流血、可疊層刷新／重新快照可能更弱與 PA 不增幅；刺劍保留後續物理減傷而非直接加傷；戰棍保留不能刷新與甦醒先動可能致敗。
- 簡短特效身分與「歷史模型／固定參數及自動戰鬥時序為本作改編，不等同原版當前規則」常駐。未辨識武器保持沒有特效，不虛構一個空展開區。
- 原本完整的三組 trait／numeric rule 六段原文完全不改，放到相鄰 `<details>`，以原生 `<summary>`「完整特效規則・觸發、公式與時序」展開。沒有自訂鍵盤攔截、移除原生 marker 或設定假 button role。
- 只從舊的當前 detail DOM 讀取 exact item ID 與 open 狀態；同件重畫保持展開，僅原摘要仍聚焦時復原至新摘要，使用 `preventScroll` 避免額外捲動。不同 ID 即使同名也重新收合；不保存所有物品的歷史開合，不新增存檔／sessionStorage key。
- 比較數字、品質／等級／身分、評分不是 DPS 的提醒、待領 FIFO／可用操作限制、永久綁定／配裝保護、靈魂碎片與 IW 種子費用／資格全部仍在展開區外。交易對話框及其不可逆風險／確認完全不動。

## 測試與獨立稽核

來源完整套件 1,862 項通過；四個 runtime 語法檢查通過。本次新增 15 組 UI 與 20 組獨立 audit，沒有新增 engine 測試或改寫歷史黃金資料。獨立 audit 對 exact v0.33 基點只通過兩組既有不變條件，其餘 18 組因沒有新 disclosure 而如預期失敗；不是把基點畫面缺陷全當測試失敗。

覆蓋：完整舊規則原文、可見取捨、同 ID 開合／focus、同名不同 ID reset、不搶篩選或出售 checkbox 焦點、換到護甲／空選取、pending／readonly、費用與保護在外、source-only state／RNG／action／storage invariance。模擬 harness 的 summary 原生 focus 能力只在新測試／量測的局部 adapter 補上，共用 helper 及 production 不為測試增加 tabindex。測試沒有假裝能計算原生 key 行為或畫面。

engine／loot／session 三檔、全部 14 個素材／原件／授權、40 個歷史 fixture、兩個瀏覽器 fixture、兩個共用 helper 逐 byte 等於 exact v0.33。九個舊 UI 測試只更新版本標籤與一個測試名稱，行為 assertions 不變；index/package 版本更為 0.34。完整規則函式與交易、canvas 後段程式不變。具體獨立結果見 [AUDIT-V034](AUDIT-V034.md)。

## 自然取得來源重播

預先限定 seed 42 的 20 次普通路線流程，20 勝／237 一秒 pulses／Lv11／34 背包，286 個完整 state／report 核對點與 exact v0.33 相同；無資源注入或假造裝備。從自然持有三種武器完成九次 disclosure 循環與 12 個控制器核對點，正常再出征 34 個四分之一秒 pulse 取得相同第 21 勝，追加八個 pulse 不重啟、不重複獎勵。

只計兩段 prose 以一個空格相連、排除標題／展開標籤／安全提醒：常駐文字戰斧 382→94、刺劍 181→82、戰棍 248→82。這不是頁面或卡片高度比例，也不代表收益提高。完整 protocol、輸入與輸出 hash、限制見 [EFFECT-READABILITY-MEASUREMENTS](EFFECT-READABILITY-MEASUREMENTS.md)。

## 備份與實際驗收關卡

來源 checkpoint `136-v034-effect-readability-source` 的 exact commit 與完整 readback 由外部收據核對，不在提交前預填成功。最後正式 v0.33 網站 `d734cec7e83f43433f7f50b87710a36e779d06b7` 不變；其過去拒絕已被後續明確授權與成功發布解決，沒有把舊阻擋搬成這次狀態。

**v0.34 實際瀏覽器／發布尚未執行。**新候選須先備份／讀回完整來源，再發隔離 `candidates/v0.34/`，驗證 exact Pages 和 21 檔 HTTP。真正桌面需確認收合後閱讀層次、展開原文、Tab／Enter／Space／焦點、正常通關／重載與原進度不變。手機、窄視窗、縮放、強制色彩、螢幕閱讀器及全面跨分頁不能從來源測試推定。正式推廣另需已驗收來源備份與正式原 profile smoke，見 [RECOVERY-V034](RECOVERY-V034.md)。

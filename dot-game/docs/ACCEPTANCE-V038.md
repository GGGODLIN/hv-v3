# v0.38 原創營地木箱 — 來源驗證，不是瀏覽器驗收

## 實作範圍

基於完整來源候選 `0de5f53220a7660c1fb0c7a304fcd6aa4ebcac8c` (v0.37)，只重畫 `src/ui.js` 的原有 no-enemies 寶箱區塊：21個 paint operations 畫接地陰影、木箱前側面、木板接縫、斜箱蓋、兩道鐵束帶及鎖。移除原黃色圓 halo，沒有新動畫／互動／掉寶／數值。此物件是本作原創裝飾，非原版 HV 機制或素材。

整個 UI 在該區塊以外 byte-identical；背景、角色、名牌、控制器、生命周期與粒子不變。引擎／loot／session／CSS／14個素材（含 Kenney 出處與授權）完全相同。index 只改兩個版本標示，package 只改版本。舊測試只更新精確版本標示；森林測試的舊完整 suffix hash 拆成寶箱之前／之後兩個原 v037 hash，保留非寶箱程式的嚴格保護。

## 測試與自然回歸

最終完整 **1,941/1,941** 測試通過，0 failed／0 skipped（46.2秒）；包括新獨立稽核7項。四個 runtime JS 語法通過。測試／指令記錄不能證明實際渲染美觀、效能、螢幕閱讀器或手機可用性。

兩次獨立自然來源／控制器回歸的收據逐 byte 相同（18,051 bytes，SHA256 `bd671053219a5c79665da299058a6a558f954c0092a662fe3fadc1b9bae95c4c`）：
- 核對 v037 全415 manifest payload；40個舊fixture、2個browser fixture、2個helper、14素材、17舊script保留。
- 真正由 engine 累積的20/20勝，363 source pulses、432全狀態相等比較。
- 15/15 controller自然勝，749 battle pulses、2,455全狀態／事件／操作／寫入相等比較，3,042幀無副作用檢查／6,084 frame calls。
- 回營後120 inert pulses、自然序列化重載相等，最後35勝。
- 沒有為覆蓋缺口注入效果或強迫掉落；PA取得與 recoveryPending 的雙phase自然缺口保留。fullUI測試的WebLocks暫存模式不等於真瀏覽器持久化。

詳見 [獨立稽核](CAMP-CHEST-AUDIT.md)、[自然回歸](CAMP-CHEST-REGRESSION.md)、[可重跑收據](camp-chest-measurements.json)。

## 備份與發布狀態

本輪僅來源提交 `GGGODLIN/hv-v3` 的 `bot/dot`，完整 manifest／原始碼／素材／恢復指南需從 exact commit 讀回核對後才算來源備份成功。`CHECKPOINT.json` 是本輪內容清單，不以編譯產物冒充原始碼。

**v0.38 未瀏覽器驗收、未發布。** 沒有建立或更新候選／正式網站，既有 Kenney 網站 blob 拒絕沒有重試或繞過；素材與出處未刪除／替換。v0.37 的背景也仍未做瀏覽器驗收。來源較新不代表可取代已驗收版。

正式仍 v0.36 (`f192fec4eff401948d80156f941c01404816cbba`)，完整已驗收恢復來源仍 `2a5354689165d7512d279327db8935c3bbef8570`。尚待使用者對既有 Kenney 素材公開發布範圍明確答覆；解決後也必須完成實際瀏覽器候選驗收，再考慮正式替換。本輪不以新增版本解除該限制。

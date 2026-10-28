# v060 獨立來源驗收：生命／魔力邊界顯示

`node --test tests/resource-pool-audit.test.mjs`：16 / 16 通過。以 `RESOURCE_AUDIT_UI_SOURCE=../../hv-v3-dot-v059/dot-game/src/ui.js` 執行相同測試，9 通過、7 失敗，失敗為 HP/MP 正分數、極小正值、接近滿值與 formatter 邊界。

直接執行完整真實 UI 原始碼及實際引擎，使用既有 source-DOM harness，不替換 formatter。覆蓋：

- HP 與 MP 的真正零、真正滿、0.4、最小正浮點、上限減 0.2、普通整數。
- 分數最大值 575.4，當前 575.3 顯示 `575 / 575（未滿）`，真正滿則不帶未滿；不使用數學上錯誤的 `<575`。
- 最大值小於 1、大值千分位等 formatter 邊界。當前引擎 stats 的最大池為整數，這些不是自然遊玩產生分數上限的證據。
- 正常種子 1 出戰、自然推進，確認傷害／恢復後會出現分數 HP 與 MP；反覆 render 保留所有 state（含 seed、獎勵）、戰報、dispatch 與 storage 寫入紀錄。
- 生命／魔力由可見 strong 文字提供資訊，沒有互相矛盾的 `aria-label` 或獨立 `aria-valuenow` 覆蓋。未執行讀屏驗收。
- 非有限暫態 HP/MP 在匯入時由既有 validateSave 的安全回營 recover 重新產生有限值，並非本修改新增拒絕規則。resourcePoolText 接收有效遊戲數值，不宣稱它是任意非法輸入的 sanitizer。

本輪不改遊戲數值、傷害、資源、RNG 或存檔。這些為來源與 UI 模型測試，不是瀏覽器、版面、手機或讀屏驗收；沒有網站操作。

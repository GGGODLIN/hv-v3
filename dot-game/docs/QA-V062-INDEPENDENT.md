# v062 獨立來源驗收：自選出售勾選框焦點

以完整 `src/ui.js` 與既有 focus-faithful DOM 模型執行，不是瀏覽器、畫面、真實鍵盤或無障礙樹驗收。

## 結果

- `node --test tests/sale-checkbox-focus-audit.test.mjs`：13/13 通過，無略過。
- 對 v061 `src/ui.js` 設 `SALE_FOCUS_AUDIT_UI_SOURCE` 執行相同 suite：3 通過、10 失敗，重現焦點回到 body。
- 檢查同一物品 ID 的新 checkbox、重複強制／非強制重繪、排序後換位、篩選隱藏物品、lock／equip／sell 失格、失去分頁控制權，確認失格或移除退至安全且可見的篩選控制，篩選控制不可見時退至設定。
- 原先焦點位於名稱欄時不搶走；後續 renderer 已明確移焦時也不覆蓋。
- 模型連續三次 change（勾選／取消／再勾）保留同 ID；並非真實 OS 鍵盤事件驗收。
- 純重繪前後 state（含 seed）、actions、storage writes、原選取 ID 均一致。
- 已取消的出售確認單維持失效；不自動出售或補選，不將焦點交給另一件物品的出售 checkbox。

未發現這個範圍內的回歸。v056–v062 尚未公開瀏覽器驗收，正式仍 v055；沒有執行網站寫入。

# cp9-rc12c（自訂）單一優先鍵 ★

## QA driver 讀鍵規則（新）
每回合畫面上**只有一個** ★ 優先鍵，三處一致：
- 按鈕：`.cmdbar button[data-primary="K"]`（class `suggest primary`），文字以 `★` 開頭；整個畫面只有這一顆按鈕帶 ★。
- 狀態列橫幅：`[data-primarybar="K"]`，文字「建議 ★K·名稱」。
- 決策行：`[data-primarykey="K"]`（同時有 `data-keys="K"`、`data-decide`），文字「決策：★K·名稱」；下一行 `small[data-decidewhy]` 是「說明：…」，不含其他鍵。
- K ∈ `A D Z S Q W E 1 2 3 4 5 6`（rc12d 更正：法術共 6 個，6＝腐化；法杖的 A 就是 1·烈焰爆破 快速施法，所以 ★ 不會是 1）。按下 K 鍵或點該按鈕即可。
- 💡「可以用了」提示（`data-skillready` 等）已移除；元素提示只寫「元素：火」不帶鍵。
- 建議 driver：直接讀 `document.querySelector('[data-primarykey]').dataset.primarykey`，不要再解析文字。

## 單一來源
`src/core/battle.ts primaryKey(s, target)` → `{key,label,action,why,src}`；UI（app.ts battleHtml）與 sim（`SIM_POLICY=primary`）共用。
順序：蓄力/危險時 chargeAdvice 第一個可用鍵 → guardHint S → 技能 Q/W/E → 法術 1–5 → A。

## env 檢查
`src/core/simenv.ts`：未登記的 `SIM_*`、或已知名稱少了 `SIM_` 前綴（如 `POTPOLICY`）會丟錯；`SIM_ENV_LAX=1` 可略過。

## 驗證
`node scripts/rc12c-primary-e2e.mjs <base>`：四流派各 24 回合，只按 ★，含 OC 滿、蓄力、低血狀態，斷言三處一致且 ★ 唯一。

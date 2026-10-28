# cp9-rc12b 筆記（hint 打斷鏈 / turnlog / HP1）

## 1. 缺 hint 的根因（已驗證，程式碼）
- 王蓄力是 1 回合預備（battle.ts 蓄力→下一回合釋放），玩家只有 1 次行動。撕裂擊（W）在蓄力回合按下**不會**打斷；只有目標已帶 Penetrated Armor（PA）時的粉碎擊（Shatter）會暈住打斷。QA「F25 按 W 沒打斷」即此。
- 舊 suggestSkill / stun 保留規則（reserveStun9）在王未蓄力時一律保留 Shatter，因此 PA 疊滿時從不提示 Shatter；F30+ 危險時直接給 D；非危險蓄力回合文案「W·撕裂擊 或 A」看似打斷實則不是。
- 修正：PA 在身、目標未暈、未抗暈且 Shatter 可用 → 優先提示粉碎擊（在撕裂擊規則之前）；蓄力中能當回合打斷 → 打斷優先於 D/Z；若跳過 D 會致死且打斷不保證 → `D` 優先、打斷列第二並註明「存活優先」。
- 打斷相關 regex（auto.ts 診斷、battle.ts chargeAdvice 反射）原本漏了「粉碎擊」，已補。

## 2. sim 與 UI 的差異
- sim（SIM_AI=naive, POTPOLICY=ui）與 UI 共用 chargeAdvice / turnHints / suggestSkill，按第一個技能鍵；只有危險時才照 Z/D/S。邏輯本身已共用。
- 推測的差距：sim 每次提示撕裂擊都會按（王身上 PA 常駐），真人常改按 A，所以 PA 不在、Shatter 用不出來。這是行為差，不是邏輯差。

## 3. turnlog（rc12b item 2）
- runId 自 rc11b（0cc2eee）起已在 cp9-rc12 內；QA blade-2/3 的 2000 行無 runId 資料來自更舊 build 留在 localStorage 的紀錄。
- QA_RUNCAP 4000（自訂；F100 = 20 王 × 最多 200 回合），總上限 QA_TURNCAP 8000（約 1 MB），超過時整個舊 run 先淘汰；quota 錯誤時先刪快照、再整 run 刪舊紀錄，當前 run 不刪。QA_SNAPCAP 24→12。

## 4. HP 1、王未蓄力
- 提示 A 為設計（無藥、HP 1），文案前加「此戰幾乎必敗（HP 1、沒有藥水）」。商人（item 3）不變。

# cp8-rc19 status (paused 2026-10-27 12:0x UTC+8 for the battle-screen visual revamp; no tag)
Done (bot/grok): (a) 9871024 zHint; (b) 951e3e6 original potion drop rolls + rest-before-boss test (rest before boss was already guaranteed by restBeforeBoss / abyss d%5==4); (c) 1b1842b charge-hold key queue + scripts/cp8-rc19-e2e.mjs.
Not done: (d) chargeAdvice D/S/A when potion unusable; (e) death-advice 「慢慢磨光」 vs last hit ≥ 15% max HP; (b) sim medians vs rc18 (runs started in /tmp/rc19sim); full vitest/e2e; rc19 tag.

## rc19 完成（2026-10-27）
- item 1 f5d9168：地圖／城鎮／裝備套用 Kenney 風格（只改外觀）；截圖 /workspace/ui-revamp2/*-{before,after}-{1280,913}.png（before 拍自 rc18）
- item 2 7f9a7fd：遭遇框置中縮小放在紀錄上方；913 右欄改 .hudr，紀錄不再蓋框
- item 3 06c932d：商人回血藥 50C、每位限 3 瓶（自訂，非原版）；整備提醒「可在城鎮買藥」；掉藥維持 2.2%
- (d) acb34da、(e) 9aa47f4，皆有 vitest
- e2e cp8-rc6 失敗原因：(d) 改了 cdhint 文字（移除「此時不建議」），e2e 正則仍要求舊字串 → 108de63 更新期望；非時序不穩
- sim（battle 路線, naive, N=128, F=4）first 中位數 seed0/seed256：rc19 blade 27/25、oc 24/25；rc18 blade 25/22、oc 29/27
- vitest 40 檔 332 通過；完整 e2e 36/36 exit=0（預覽 5302）

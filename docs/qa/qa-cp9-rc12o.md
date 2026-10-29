
# rc12o QA — blade ×2 (build badge `build 2583a4e · CP4…CP9` verified both runs; screenshots bl1-badge-*, bl2-badge-*)
Driver drvRC12o.js (per-turn damage from `[第 N 回合]` tags; victory/reward logger added). 13 potions, 4x, skip anim, ★ only. Findings 已驗證 unless 推測.

## Summary
| | bl1 | bl2 |
|---|---|---|
| End | **retreat at F71 map** (★advice: HP 85/844, 0 potions) after killing F70 boss — not death; bring-back ×1.3, Lv14→17 | **death F56, normal fight** (not boss) |
| Killer | – | 風鱗精靈 蓄力一擊 337 = 40.0% maxHP @HP 1, 0 potions |
| F30-45 boss turns | 3,4,6,1 | 6,5,3,6 |
| F50-65 boss turns | 2,6,8,32 | 10,22 (F55) |
| F70-85 | F70: 30 turns (potions 6→0, HP→1) | – |
| F90-100 | – | – |
| Potions at ckpt F10/20/30/40/50/60/70 | 13/11/10/9/8/8/6 | 15/17/15/12/9 (death F56: 0) |
| Max single hit | 335 = 40.0% (F70 boss 雷尾鴉 蓄力一擊 t24, 39.98%) | 337 = 39.9–40.0% (F46 雷血幽魂 t4; F56 killer) |
| Max turn % | 40.0% (same single hit; no turn >50%) | 40.0% |
| Z cooldown max | 1 | 1 |
| Feel (1-5, 推測) | 3 | 2 |

## Findings
1. **No hit >40%** (no bug flagged) but the 蓄力一擊 repeatedly lands at exactly ~40% maxHP (335/838, 337/844, 337/844) — sits right on the cap; screenshots: bl1-F70-t24-*, bl2-F46-t4-*, bl2-death-F56.
2. **Potions DO drop from normal fights** (user expected none): bl1 F36, F41 (×1 each; plus F1 in an aborted pre-run); bl2 F1, F3, F13, F16, F33 (×1 each). 已驗證 (reward line `+EXP · +C · 生命藥水 ×1`).
3. **Boss-kill potion reward is inconsistent**: bl1 got +1 only at F45 and F50 (0 at the other 15 bosses); bl2 got 0 at all 11 bosses killed. Gear: every boss drops 3-5 pieces, 傳說 appears from F35 (bl1) / F35 (bl2), 華麗 at F30/40/50/60/70 → "guaranteed 華麗+" is NOT seen at F5-25 or at F35/45/55/65 (only 傳說 cards there). Rewards per boss in data.jsonl (victories_compact; full raw in `victory` events were in helper state, compact summary kept).
4. Potions trend: bl1 declines ~1/10 floors early then fast at F65-70 (F65 32 turns, F70 30 turns); bl2 started higher thanks to normal-fight drops (17 at F20) but F55 22-turn boss burned 4.
5. **Display oddity (推測 bug)**: F70 boss warning tooltip shows `預估傷害 一般~暴擊 約 67670-81204（佔最大 HP 8075~9690%）` with actual hit 335 — estimate wildly off (screenshot bl1-F70-*).
6. Long-boss durations: F65 32 turns, F70 30 turns (bl1), F55 22 turns (bl2) vs F30-45 1-6 turns: big difficulty step at F50+ for blade; boss turns not monotonic.
7. Death-in-big-fight: bl2 died to a 蓄力 on a normal floor at HP 1 / 0 potions after boss F55 attrition; bl1 survived F70 at HP 1 then retreated.
8. Telegraph handling (★ key counts): bl1 D40 A11 E8 Z5; bl2 D36 A9 Z3 E2. ★ defends against almost all 蓄力 (35% hit blocked to ~30%/0); D·防禦 reduces to ~29-35% maxHP.
Feel notes (推測): growth felt present (LV14→17, 傳說 drops) but run is gated by potions; gear drops are auto-equipped yet HP stays 784→844 (no visible growth in max HP), so sense of growth is low; death/retreat both came from potion exhaustion after a long boss.
Files: qa-cp9-rc12o-data.jsonl, -deathlog.jsonl, -shots/, saves qa-saves/rc12o-blade-{1,2}-end.json.

## bl3 — STOPPED PARTWAY by the producer (not finished). Last floor reached: F10 (boss-reward screen after F10 kill, 13 potions). Badge 2583a4e verified. No end data; save dumped as rc12o-blade-3-end. Bulwark 1 not started. Driver now also stores raw victory text and screenshots F10-step boss rewards / first 2 normal-fight potion drops.

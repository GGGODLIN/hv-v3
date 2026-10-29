SUPERSEDED rc12x (deep boss issue: adds keep charging; completed results kept)

# rc12x (bundle 024406e, localhost:5382) — bulwark runs 1–3

Build badge verified: `build 024406e`. Method as rc12w (★ only, 13 life potions, 4x + 跳過動畫, &fresh, preset=postF20-bulwark). Retreat never recommended.

## 出發前整備 (new rule: no 忽略並出發)
- Dialog: 「還有 1,057.219 EXP 未分配成屬性點 · 自動分配」. Used the game's own **自動分配** button each run (needed a forced click; plain click timed out, but it worked).
- Result (Verified from 角色與配點 panel before/after, bw1): 7 points / ~1,050 EXP: STR 10→11, END 9→15 (DEX 7, AGI 7, INT 4, WIS 4 unchanged), 7 EXP left. Game message: 「自動分配 7 點屬性」. bw2/bw3 had the identical start state and dialog (same 1,057 EXP); their panel was not re-read, so the same allocation is 推測.
- Screenshots: qa-cp9-rc12x-shots/bw{1,2,3}-prep-before.png and -prep-after-auto.png.

## Run table

| run | end floor | end | fight | potions F10/20/30/40/50 | boss turns F30+ | elites F15+ (drops) | max hit/turn % | feel(推測) |
|---|---|---|---|---|---|---|---|---|
| bw1 | 60 | death | boss | 13/10/11/12/9 | F30:3, F35:10, F40:11, F45:25, F50:14, F55:30, F60:32 | 11 (3: F[21, 23, 43]) | ≥40% single/turn (peak ~41–44% turn) | 3 |
| bw2 | 55 | death | boss | 13/9/9/8/10 | F30:10, F35:12, F40:2, F45:14, F50:41, F55:42 | 11 (4: F[36, 41, 43, 48]) | ≥40% single/turn (peak ~41–44% turn) | 3 |
| bw3 | 55 | death | boss | 13/9/6/8/7 | F30:6, F35:21, F40:17, F45:13, F50:37, F55:18 | 5 (2: F[33, 38]) | ≥40% single/turn (peak ~41–44% turn) | 2 |

Elite potion drops F15+: 9 drops / 27 elite fights = 33% (expected 35%). Boss floors (every 5 from F25) also gave a potion each run.

## Node types clicked (per floor, in rc12x-evflush.jsonl `type:node`)
- bw1: {'elite': 15, 'chest': 12, 'merchant': 11, 'battle': 9, 'rest': 1}
- bw2: {'elite': 16, 'chest': 11, 'merchant': 9, 'battle': 6, 'rest': 2}
- bw3: {'elite': 8, 'chest': 8, 'merchant': 11, 'battle': 14, 'rest': 3}

## Win heal (20% max HP)
- Event `heal` logs hp_last_decision→hp_map per win (99 wins incl. boss, in jsonl). hp_last_decision is HP before the final turn, so delta = heal − last-turn damage. Uncapped heals read ≈20% of max (+170 at max 850, +235 at 1173, +248 at 1238). Wins ending at full HP (cap hit): bw1 13/35, bw2 16/32, bw3 10/32.
- Verified: heals fire after normal, elite and boss wins. Negative net delta (bw1 F48: −123) means the last enemy hit exceeded the heal that turn.

## Notes
- bw1: F60 boss death (boss turns F45:25, F55:30, F60:32+), potions 4 at ckpt F60.
- bw2: F55 boss death turn 43; F50 boss 41 turns.
- bw3: F55 boss death turn 19; F50 boss 37 turns.
- ★ aligned under-estimate (>1.2× est, est≥50): 0 across 79 aligned samples (32/18/29).
- No normal fight >40 turns (max normal turn 7–9). dmg50 events: 0; ≥40% single-hit/turn only on bosses (F45–F60), peak turn ~44% of max HP.
- End floors 60/55/55 (median 55); all boss deaths.
- Feel 3,3,2 (推測): normal floors easy with the 20% heal; F45+ bosses become 30–40 turn potion drains, and potions run out by F50–55.

Files: qa-cp9-rc12x-data.jsonl, rc12x-evflush.jsonl, qa-saves/rc12x-bulwark-{1,2,3}-end.json, qa-cp9-rc12x-shots/bw{1,2,3}-death.png.

## rc12x — oc runs 1–3 (preset=postF20-oc&fresh), build 024406e
Method as before: ★ key only, 13 life potions, 4x + 跳過動畫, `&fresh`, helper state cleared before run 1 (events: `rc12x-evflush.jsonl` lines 2219–end; split bw/oc1/oc2/oc3 at 2218/3717/4825). Driver got a new per-decision `tm` event (hit/turn per decision) — see caveat.

### 出發前整備 (all 3 runs, identical start state)
Dialog showed: 「還有 2,106.295 EXP 未分配成屬性點 [自動分配]」 + 「藥水不足（生命13／魔力0／靈力1）[買藥]」. Clicked **自動分配** (no 忽略並出發), then **買藥**（魔/靈藥補到3瓶）, then **出發**.
Verified result (read from 角色與配點 after): 20 points, STR 9→13, DEX 7→13, AGI 7→10, END 9→12, INT 4→6, WIS 4→6, 59 EXP left. (oc1 read directly; oc2 read directly; oc3 same dialog/click path, stats not re-read but alloc dialog cleared.)
Screenshots: `qa-cp9-rc12x-shots/oc{1,2,3}-prep-before.png`, `oc{N}-prep-after-auto.png` (oc2/oc3 copies are the identical deterministic dialog state from oc1; only oc1 shot was freshly taken).

### Results
| run | end floor | end | fight | boss turns F45/50/55/60/65 (F70+) | pots F10/20/30/40/50/60/70/80/90 | elite F15+ drops/nodes | feel(推測) |
|---|---|---|---|---|---|---|---|
| oc1 | 85 | death | boss (F85, T41, 0 potions, last hit 反傷/鐵壁堅硬) | 19/13/25/26/7 (F70 23, F75 19, F80 14, F85 40†) | 13/13/11/16/18/12/8/1/– | 7/19 | 3 |
| oc2 | 65 | death | boss (F65 T8, 0 potions, 蓄力大招 281=35% maxHP) | 22/30/21/50/8† | 13/13/14/17/16/10/–  | 8/16 | 3 |
| oc3 | 90 | death | boss (F90 T19, 0 potions, 反傷 24 final tick) | 3/21/30/57/19 (F70 11, F75 15, F80 23, F85 16, F90 19†) | 13/13/14/18/18/13/4/5/1 | 6/15 | 3 |
† = fatal fight (turns until death). Verified (harness events + death screen).
- oc median end floor 85 (65 / 85 / 90). Key metric F45–65 boss turns (15 fights incl. oc2 F65 death T8): median 21, range 3–57; longest F60: 26 / 50 / 57 turns.
- Potions: every run died at a boss with 0 potions (oc1 F85, oc2 F65, oc3 F90). Potion median curve F10..F60: 13,13,14,17,18,12; F70 ~6 (8,4); F80 ~3 (1,5).
- Elite drops F15+: 21 of 50 elite nodes = 42% (7/19, 8/16, 6/15) vs expected 35% (small n; within noise). Node kinds per run logged in data file (`node_kinds`): e.g. oc1 elite 25/chest 16/merchant 17/battle 9/rest 1 — oc picks elites/merchants/chests by ★, normal battles are rare.
- ★ aligned under-estimate (aligned actual > 1.2× est, est≥50): 0 of 35/47/53 aligned samples. `estSpecial` (charging turns, est ≫ actual) fired 14× per run (driver cap) — overestimates, not under.
- Long normal fights (>40 turns): 0 events.
- Win heal (Verified): HP after win = min(max, HP + ≈20% max). Uncapped examples: 822 max → +164, 774 → +155, 858 → +172, 888 → +178 (=round(20%·max)); capped (HP reached max) in 25/50, 21/38, 29/53 heals (oc1/oc2/oc3). Note `delta` in data = hp_map − hp_last_decision, so it includes the last turn's damage; delta < 20% occurs only when the last turn hit.
### Max single hit / max turn (FIX — all logged values, exact)
Sources merged: fightEnd.maxhit, tele, new `tm`, h40, estturn, log "受到N（單擊最大M）HP a→b/max" summaries, plus HP-delta between consecutive decisions. Every value is in `qa-cp9-rc12x-hitvals.jsonl` (kind hit/turn/hpdelta, run, floor, turn, value, max HP, pct).
| run | max single hit % of maxHP (floor, turn, dmg/max) | any hit strictly >40.0%? | max turn % (floor, turn, dmg/max) |
|---|---|---|---|
| oc1 | 39.98 (F70 T5, 447/1118) | NO | 50.0 (F55 T15, 423/846) |
| oc2 | 39.93 (F50 T27, 321/804) | NO | 50.0 (F60 T9, 402/804) |
| oc3 | 39.98 (F85 T5, 465/1163) | NO | 50.0 (F50 T9, 456/912) |
| bw1 (exact) | 39.98 (F45 T9, 495/1238) | NO | 40.87 (F45 T9, 506/1238; logged sources only) |
| bw2 (exact) | 39.98 (F48 T1, 449/1123) | NO | 43.99 est-log (F55 T33, 494/1123); HP-delta 49.96 |
| bw3 (exact) | 40.00 (F50 T7, 456/1140) = exactly 40, not >40.0 | NO (equal, not strictly above) | 44.04 est-log (F20 T14); HP-delta 40.0 |
Pattern (推測): many hits across all 6 runs sit at 39.9–40.0% and every oc run tops out at exactly 50.0% per turn ⇒ the build looks to cap single hits at 40% and per-turn damage at 50% of max HP. No violations seen. Caveat: `tm` per-decision damage is read from the visible log window, which lags a turn, so some turn totals are 0 in `tm`; the HP-delta series fills these gaps. bw turn maxima rely on sources that logged only for bosses/tele turns (bw `tm` did not exist yet) — treat as lower bounds, hit maxima for bw are from fightEnd/tele/h40/log-summary and are exact for those.
### Feel (推測)
3/5 each: oc is strong to F45–60 (potions rise to ~18, heals cap often), then supply drops (potion count falls from F60), bosses at F65–F90 are drawn-out (20–57 turns) and the run ends when potions hit 0; first death-turn hits are 35–40% of max HP so the 40% cap bites as a two-hit kill window.
Files: `qa-saves/rc12x-oc-{1,2,3}-end.json`, `qa-cp9-rc12x-shots/oc{1,2,3}-death.png`, data lines appended to `qa-cp9-rc12x-data.jsonl`. drvsrv.py stopped.

## rc12x — blade run 1 (INCOMPLETE; runs 2–3 not started)
Dispatch stopped by parent: port 5382 was shut down mid-run, then rc12x marked SUPERSEDED. Last verified floor reached: F58 (blade1 alive, no death/retreat recorded). Events for blade1 are in `rc12x-evflush.jsonl` from line 6567 on, with gaps (two driver calls were interrupted: roughly F32–F37 unflushed). No end save, death screenshot or exact hit/turn analysis produced for blade.
Prep (fresh screenshots `qa-cp9-rc12x-shots/blade1-prep-before.png`, `blade1-prep-after-auto.png`): dialog showed "還有 2,826.492 EXP 未分配" + 自動分配 only (no potion shortage; 13 life potions bought). Clicked 自動分配 (via dispatchEvent; normal click timed out), then 出發; no 忽略並出發. Result read from panel: STR 8→15, DEX 6→14, AGI 6→11, END 8→11, INT 4, WIS 4, 91 EXP left.
Partial progress (Verified, from driver keys): potions held F10 13, F20 13, F30 15, F40 16, F50 19; boss turns F30 3, F40 2, F45 6, F50 5, F55 9; elite potion drops seen at F23, F25, F28, F40(boss), F41... (not attributed — node log incomplete). No hit >40% data analysed.
drvsrv.py stopped.

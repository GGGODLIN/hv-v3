# cp9-rc6 acceptance brief (QA for hv-v3, single-player turn-based tower game, no adult content)

Server: http://localhost:5358 — the badge must read "build 89a7cf0" and list CP9.
If it doesn't, or you see a red preset-ignored warning, STOP and report. Do not touch any other port.
URL: http://localhost:5358/?cp9&cp8&cp6&preset=postF20-<school>&fresh — use &fresh on every run.
Enter via 進入深淵塔（第 1 層起）.

Order: blade 1-8, then oc 1-8, arcane 1-8, bulwark 1-8.
Resume from the NEXT marker at the end of /workspace/qa-cp9-rc10.md (create the file if it doesn't exist; start at blade 1).
Driver: reuse /workspace/drv3.js (try/catch retry; node button "⚔ 戰鬥"; handles buff pick 選這個 and rest 休息：).

## Rules
- No debug or console tricks that change state.
- Before each run, buy 10 healing potions in town, then press 忽略並出發.
- In fights, press the FIRST option on the 決策/建議 line (spell N, Q/W/E, Z, S, D). Press A only when nothing is recommended.
- On the map, press Z if HP is below 50%.
- Press S at most once per recommendation; never resend it.
- Use 4x speed with skip-animation on.
- Node priority: merchant (buy 3 potions) > battle > rest > chest.
  - Take rest when HP is below 60%, and always on the floor before a boss (every multiple of 5).
  - Never take an elite unless it is the only option.

## Per-run fields
Record these in a section in qa-cp9-rc10.md AND as one line in qa-cp9-rc10-data.jsonl:
- school, run, floor reached, death cause, potions left
- in-fight drinks: total, and how many at HP ≥40% without a lethal forecast
- normal fights: A vs non-A presses
- boss turns per boss floor
- turns with ≥20% damage: warned vs unwarned
- max single-turn %
- the count of 「防禦也擋不住」
- (a) Z hinted while the potion is on cooldown: count, with a screenshot plus floor and turn
- (b) on lethal-forecast turns: was Z first? When Z was unavailable, did the order run interrupt skill → S → D? Log any violation.
- (c) after a boss revive: did its charge clear? Count yes/no.
- (d) Q needing several clicks: count of repeats
- (e) deaths at the F30 boss from a 50% charge: was there any action that could have survived? Note potion cooldown and HP.
- the death screen's 「共受 N」

Save the death screen to /workspace/qa-cp9-rc10-shots/death-<school>-<n>.png, plus any bug shots.

## Logging
After EVERY run, append the section, update the line "NEXT: <school> <n>", and add the jsonl line.
Stop cleanly when your budget is low, and report the runs done and their floors.

## Efficiency notes (added after blade 1)
- Keep the full working driver in /workspace/drv4.js. If it doesn't exist yet, create it from your inline code. Read it and paste it inline. Make one long call per run if possible.
- Count boss turns from the in-game turn counter, not from repeated reads.
- Check (a), (b) and (c) on EVERY floor, not only late floors. For (b), log the hint order on each lethal-forecast turn.
- Keep each driver call under 18 s. Store the counters in window state or a file after every call, so a timeout can't lose them.
- Do 2 runs per session if possible, then report.
- Before capping or abandoning any run past F50, export the full localStorage as JSON to /workspace/qa-oc2-save/<school>-<n>-F<floor>.json, along with a screenshot of the character's gear and stats. Do this before any &fresh.
- Correction: if you can't export localStorage, skip that part. For any run past F50, still save screenshots of the gear and stats, plus the character panel, to /workspace/qa-oc2-save/. Stop at that point and report, so I can copy the save from my side before anything new starts.

## rc7 overrides (these win over anything above)
- Server: http://localhost:5358. The badge must show build 89a7cf0.
- Run order is blade, oc, arcane, bulwark, 8 runs each, every run with &fresh and 10 potions bought at the start. Output goes to /workspace/qa-cp9-rc10.md and qa-cp9-rc10-data.jsonl. Death shots go to qa-cp9-rc10-shots/.
- Cap: when a run passes F60, stop. Save screenshots of the gear, stats and character panel to /workspace/qa-saves/<school>-<n>-*.png. Log the floor as ">=N". Then STOP the session and report, and don't load any &fresh URL. I'll back up the save first.
- Checks for each run:
  - (a) Z is never hinted while the potion is on cooldown.
  - (b) The banner line and the decision line never contradict each other, for example "HP 危險 ≥ HP" next to "撐得住". Log every contradiction.
  - (c) After a boss heavy hit or a revive, the boss doesn't charge for 2 turns, and the text says 「2 回合後重新蓄力」. Log each instance as yes or no.
  - (d) Q works on one press, including a press during an animation. Log every case where it needed 2 presses, with the floor and turn.
  - (e) There are never two 50% heavy hits back to back. Log any.
  - (f) Count boss turns from the in-game turn counter, and list F30 and F35 separately.
  - (g) Track where potions came from: the start, merchants, or drops. Give a count for each.
- NEXT marker: the first line of qa-cp9-rc10.md starts as "NEXT: blade 1".

## rc10 overrides (these win over everything above)
- The server is http://localhost:5358, and the badge must show build 89a7cf0. Output goes to qa-cp9-rc10.md and qa-cp9-rc10-data.jsonl, with shots in qa-cp9-rc10-shots/.
- (c) changed: the boss must not charge for 1 turn after a heavy hit, and for 2 turns after a revive. Log each case as yes or no, and record which kind it was.
- (h) After the boss is stunned, both the battle log and the boss HP bar must show 「暈眩抵抗中」. Screenshot at least one case per run to qa-cp9-rc10-shots/stunres-<school>-<n>.png, and log every missing case.
- (i) Count how many times you entered a merchant in each run.
- (j) For arcane only, in every boss fight, log how each boss charge ended: hit, interrupted, or boss killed.
- Cap at F60: same as rc7. Save screenshots to /workspace/qa-saves/, then stop and report.
- (h) manual test, approved by the producer: if hint-play never stuns, then once per school (oc or arcane), in one boss fight, press Q by hand when the boss is charging. Screenshot the result. This is a deliberate deviation from hint-play, so log it.
- (c) follow-up: whenever a boss heavy hit lands and the next turn shows the BOSS (not another monster) charging, screenshot that next turn to bug-c-<run>-F<f>-t<t>.png, and log the floor and turn.
- DEATH-FIGHT FULL LOG (producer, from oc on): for the fight you die in, log EVERY turn as one jsonl line in qa-cp9-rc10-deathlog.jsonl:
  {run, floor, turn, key, hp_before, hp_after, forecast, forecast_after_defend, dmg_taken, dmg_sources: [attack, burn, bleed, reflect with amounts, read from the battle-log lines of that turn], monsters: [name and affixes]}.
  The simplest way is to snapshot the battle-log block and the hint panel text on every turn of every boss or elite fight, and keep the snapshots for the fight that kills you.
- Save backup at death: if the game has an export or save button, use it. Otherwise screenshot the gear and stats screen to /workspace/qa-saves/<school>-<n>-death-*.png before you start the next &fresh run.

## rc10 additions (producer, 2026-10-28)
- (k) When a hit is lethal, the lethal warning always shows first. In a "defending only saves you at 1 HP" situation there must be a red-text warning and Z must be the top suggestion. Screenshot any violation: bug-k-<school>-N-F<f>t<t>.png.
- (l) The text 「暈眩 N（之後抵抗 M）」 must show under the HP bar. Screenshot it: stun-l-<school>-N.png.
- (m) When you press D, the action actually sent must also be D. Record the action shown in the battle log; any mismatch is a bug.
- Counters go to /workspace/qa-cp9-rc10-counters-<school>-N.txt after every driver call.
- The death log keeps every turn of the current fight in a rolling array.
- Order: oc 1–8, arcane 1–8, bulwark 1–8, blade 1–8. Report after each school.

## rc10 changes to verify (dev, 2026-10-28 10:10)
- Battle potion drop rate ×8.
- Routes show a 「★建議」 mark plus a 🧭 explanation: merchants come first when potions are low, and chests count toward the score. Follow the ★ route (it is the route hint), and log where it points: merchant, chest, or rest.
- Q is hinted first when the boss is charging and not resisting; Q is held back when the boss isn't charging.
- No Q hint while the boss is resisting; the resist status shows under the HP bar.
- A is not hinted when the reflect from A would be lethal.
- When the potion is on cooldown, the hint suggests stun, S, or D instead.
- Focus: potion sources (start, merchant, chest, drop), merchants (offered, entered, reason for each skip), chests, and boss turns.
- Order: oc 1–8, arcane 1–8, bulwark 1–8, blade 1–8 (unless the producer changes it).

## PRODUCER SPEC rc10 (2026-10-28 10:11), overrides the order above
- 4 runs per school, in the order blade → oc → arcane → bulwark.
- &fresh on every run, and buy 10 potions at the start.
- Press only the first hinted option, in fights AND on routes (★/🧭).
- Potion sources exact: start, merchant, chest, drop. Merchants and chests: offered vs entered.
- Per boss: turns, average damage per turn dealt to the boss, and the character's gear and level.
- Log the fatal fight turn by turn.
- Checks: CP9 1–7 plus (a)–(m). Focus on:
  - (b) contradictions must be 0.
  - (c) the heavy-hit turn must show 「1 回合後重新蓄力」.
  - No Q hint during stun resist, and a resist marker under the HP bar.
  - Q hinted when the boss charges and Q is usable.
  - No A hint when the reflect would be lethal.
  - Feel score.
- Report after each school, with verified and guessed findings kept separate.

## Producer correction 10:11
Keep oc 1 and oc 2 as oc data. Then run blade 1–4, oc 3–4, arcane 1–4, bulwark 1–4.

## Producer logging 10:13
For each boss, add level, weapon and armor names, and dmgPerTurn[] as text to data.jsonl and deathlog.jsonl.
Before each boss, export localStorage to qa-saves/rc10-<school>-<run>-F<floor>.json.
Count boss turns from 1.

## PRODUCER SPEC rc11b (11:29) — overrides above
Server http://localhost:5359, badge e745f44. Report /workspace/qa-cp9-rc11.md (+ -data.jsonl, -deathlog.jsonl, -shots/, counters-<school>-<run>.txt).
Order: blade 1-4, bulwark 1-4, arcane 1-4, oc 1-4. URL ?cp9&cp8&cp6&preset=postF20-<school>&fresh. Buy 10 potions; press only first hint (fights + ★ route).
Data sources (game QA hooks, producer-sanctioned, read-only):
- per-turn dmg to boss, level, boss HP left: window.hvTurnLog or localStorage 'hv-v3-qa-turnlog' -> after each boss save JSON to /workspace/qa-saves/rc11-<school>-<run>-turnlog-F<floor>.json
- pre-boss save: localStorage 'hv-v3-qa-snap:F<floor>' -> /workspace/qa-saves/rc11-<school>-<run>-snap-F<floor>.json
- gear/level: map collapsible panel text, record per boss.
Level constant during run = by design, not a bug.
Checks: (b) contradictions must be 0; ★ points to merchant when potions low; HP<25% + 0 potions + only battles on floor -> ★ must point to 「撤退回城」; screenshot map gear panel and battle-log 「造成 X」; blade Q (巨力劈砍) can't interrupt -> don't check blade Q hint; after spiked shield expires reflect=0 so A hint is correct.
Explain F30+ boss per-turn damage and why boss fights are long, from turnlog.
Stop at F61 alive (save backup first).

## QA-hook access (11:52)
page.evaluate is policy-blocked. Do NOT read hooks in-page. Instead, in Shell run `/workspace/dumpls.sh rc11-<school>-<run>-end` right after each run's death (or F61 stop); it reads the browser's on-disk localStorage incl. hv-v3-qa-turnlog and hv-v3-qa-snap:F*. NOTE: turnlog accumulates across runs, so dump after EVERY run. QA (me) parses it.

## rc12 SPEC (13:46) — overrides above
Server http://localhost:5360, badge c922c68. Report /workspace/qa-cp9-rc12.md (+ -data.jsonl, -deathlog.jsonl, -shots/, counters-<school>-<run>.txt). Dumps: dumpls.sh rc12-<school>-<run>-end.
Order: blade 1-4, bulwark 1-4, oc 1-4, arcane 1-4. Same play rules (fresh, buy 10, first hint only incl ★).
Verify:
1. blade: on boss charge, is the interrupt chain hinted (Rending Blow -> Shatter Strike)? screenshot.
2. pressing D on a charge: does a counterattack trigger? (log text)
3. floor before boss with low potions: ★ -> merchant?
4. HP 1, 0 potions, boss charging: must NOT hint A; should hint 撤退 or another survivable option, or show 「此戰幾乎必敗」 if none. Screenshot any A hint here = bug.
5. turnlog reaches F60 and includes the fatal boss fight (QA parses dump).
6. (b) banner vs decision line contradictions = 0.
7. Retreat ★: when HP<25%, 0 potions, only battles -> ★ on 撤退回城 button (fixed in c922c68). Screenshot.
Design (not bugs): HP safe -> skill/A hinted over D when next-turn est <20% maxHP and non-lethal; no stun skill -> interrupt not first.

# cp9-rc6 acceptance brief (QA for hv-v3, single-player turn-based tower game, no adult content)

Server: http://localhost:5355 — the badge must read "build ecd2308" and list CP9.
If it doesn't, or you see a red preset-ignored warning, STOP and report. Do not touch any other port.
URL: http://localhost:5355/?cp9&cp8&cp6&preset=postF20-<school>&fresh — use &fresh on every run.
Enter via 進入深淵塔（第 1 層起）.

Order: blade 1-8, then oc 1-8, arcane 1-8, bulwark 1-8.
Resume from the NEXT marker at the end of /workspace/qa-cp9-rc7.md (create the file if it doesn't exist; start at blade 1).
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
Record these in a section in qa-cp9-rc7.md AND as one line in qa-cp9-rc7-data.jsonl:
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

Save the death screen to /workspace/qa-cp9-rc7-shots/death-<school>-<n>.png, plus any bug shots.

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
- Server: http://localhost:5355. The badge must show build ecd2308.
- Run order is blade, oc, arcane, bulwark, 8 runs each, every run with &fresh and 10 potions bought at the start. Output goes to /workspace/qa-cp9-rc7.md and qa-cp9-rc7-data.jsonl. Death shots go to qa-cp9-rc7-shots/.
- Cap: when a run passes F60, stop. Save screenshots of the gear, stats and character panel to /workspace/qa-saves/<school>-<n>-*.png. Log the floor as ">=N". Then STOP the session and report, and don't load any &fresh URL. I'll back up the save first.
- Checks for each run:
  - (a) Z is never hinted while the potion is on cooldown.
  - (b) The banner line and the decision line never contradict each other, for example "HP 危險 ≥ HP" next to "撐得住". Log every contradiction.
  - (c) After a boss heavy hit or a revive, the boss doesn't charge for 2 turns, and the text says 「2 回合後重新蓄力」. Log each instance as yes or no.
  - (d) Q works on one press, including a press during an animation. Log every case where it needed 2 presses, with the floor and turn.
  - (e) There are never two 50% heavy hits back to back. Log any.
  - (f) Count boss turns from the in-game turn counter, and list F30 and F35 separately.
  - (g) Track where potions came from: the start, merchants, or drops. Give a count for each.
- NEXT marker: the first line of qa-cp9-rc7.md starts as "NEXT: blade 1".

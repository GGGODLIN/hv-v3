# v0.3 browser acceptance — 2026-10-25

## Candidate and environment
Source candidate `a930d560d970f0352d78a3329062ce36974aa079` (34 files exact-readback verified). Candidate site commit `6cf12ecddffef17f7c15959fa3589957bd40dd19`; Pages run `40205960885` succeeded. All six public runtime SHA-256 values matched frozen source. URL: https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.3/ . Accepted v0.2 root was unchanged throughout candidate testing.

Actual UI operations used dot's cloud Chrome via CUA, not the user's computer, raw Playwright, injected state, or fabricated screenshots. Only ordinary controls and read-only DOM inspection were used. Observations below are bounded desktop acceptance, not complete original-HV fidelity or universal device support.

## Observed candidate checks (15:15–15:21 UTC)
- Candidate opened at Lv1, independent of existing stable Lv17. A test-tab lifecycle interruption saved three kills/27XP; reopening safely returned to camp without offline rewards.
- Started a normal expedition: first completed clear 31.5 seconds, guaranteed club drop. Returned to camp; description correctly says club effects are not implemented. Cross-family item comparison shows a different route rather than a universal upgrade arrow.
- Equipped the club: displayed attack 43→105. Same-stage next clear 12.7 seconds; subsequent growth/repeats continued. This demonstrates the complete loot/equip loop, **not** a causal measurement of PA benefit.
- A rapier dropped naturally during repeat farming. Inspected complete family/proc/stat-score explanations, locked it and equipped it through the UI. Chose stage 2 and completed it, unlocking stage 3. No generated test save or state injection was used.
- Actual proc notice named its target and showed `穿透護甲 1/3 層 · 7 Tick`. After enabling reduced motion, a living stage-2 boss showed `穿透護甲 1/3 層 · 剩 6 Tick`, with matching proc text visible and the reduced-motion body class active. The text feedback does not require shaking/floating numbers.
- Return-to-camp and reload preserved Lv7, gold706, equipped rapier and its displayed family. Enemy-state panel and proc notice were hidden at camp; no enemy status survived reload.
- A second v3 candidate tab was read-only with start/import disabled. Explicit takeover made the new tab a writer with start enabled and old tab read-only with start disabled. The completed read-only test tab was closed.
- Ordinary browser zoom to 300% produced innerWidth393 and document scrollWidth388. The narrow stacked layout was inspected in a screenshot without horizontal overflow, then restored to 100%. This is **not physical-mobile testing**.
- Inspected console entries contained no app-origin errors. Browser-extension errors were excluded only when their URL explicitly began `chrome-extension://`.

## Automated vs browser evidence
147 Node tests and four JS syntax checks pass, including independent proc ordering, strict25% boundaries, max3 stacks, exact seventh crossed-tick expiry, invalid identity, no extra RNG for nonrapiers, v3 namespace isolation and ordered v2/v1 read-only migration. All 3,000 seeded loot baselines retain numeric values and RNG consumption.

The same-stat armored fixture (seed42, 1500HP, 80% general mitigation, no attack/avoidance) clears in173.3s without proc and62.0s with rapier. This is a synthetic test, not a shipped encounter or universal speed claim; proc RNG changes subsequent rolls. Constant-die tests separately prove relative mitigation arithmetic.

Exact natural expiry and three-stack cap were **not visually observed** because tested enemies died quickly; these are automated-test evidence only. New file-chooser import was not rerun in this browser pass; validator/round-trip behavior is covered automatically. Actual stable v2→v3 migration remains a post-publication smoke check; candidate storage must not read stable storage just to manufacture that test.

## Inherited limits and release state
Physical mobile, OS suspension and long-duration stress remain untested. The previous cloud visibility anomaly (foreground-only pause not occurring while document.hidden stayed false) is unresolved; no universal background/pause guarantee. No offline earnings. Historical-model PA differs from the current English wiki; see ORIGINAL-HV.md.

Candidate desktop acceptance is complete within the above boundaries. Public root promotion, exact deployment verification and final migration smoke are pending at this checkpoint. A later publication receipt must record their actual outcome, not assume success.

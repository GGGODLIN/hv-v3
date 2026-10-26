# v0.19 browser acceptance

2026-10-26 14:34–14:37 UTC, supported cloud Chromium, actual desktop viewport 1188 × 761 (client width 1173). Candidate only at this checkpoint; root publication/smoke still pending.

- Runtime source: `88907e42c728922a50038b219799a7baa6c74c4f`.
- Candidate website: `7a424212937f61ce019662ee44389397fc562760`, [isolated v0.19 page](https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.19/).
- Exact Pages run `40340421670`: success; six HTTP 200 payloads match source bytes/SHA-256.

## Actual interactions — PASS

1. Fresh Lv1 / AP1: growth tab says 可學習 2, summary explicitly says the choices are individually affordable, not all affordable together. End key selects growth; Enter on 查看 focuses the native HP Tank learn control without spending AP.
2. Explicit HP Tank learning consumes AP1, leaves it unslotted, and changes cue to 待裝配 1 at AP0. Shortcut focuses slot button without slotting. Explicit slot activation consumes no AP and changes summary to the next missing 1 AP, with no upgrade claim.
3. Imported the stable **own natural QA profile** via normal export/file chooser/confirmation, not hidden state or edited save. Lv9 / gold382 / wins11 / inventory20 / AP9 / HP751 / MP43 / attack127 arrived in isolated candidate; stable remained separate.
4. Three abilities show as learn choices. Explicit HP learning→slot raised HP751→824; explicit MP and 1H learning→slot resulted in MP47 and attack147. This exposes existing growth, not new bonuses. AP5 remaining correctly shows no current configuration and next ability gate Lv25; it does not call those AP an affordable upgrade.
5. Three normal stage-1 expeditions, each queued with 通關後回營, reached Lv10 / gold610 / wins14 / inventory25 / AP6 / HP848 / MP50 / attack155. During battle summary says 回營配置 and has no action shortcut. This is bounded playable progression, not controlled universal clear-speed evidence.
6. At naturally reached Lv10, growth tab says 護盾可選; summary distinguishes optional mitigation/casting-turn tradeoff. Shortcut focuses Protection checkbox, leaving it OFF and AP6 unchanged. Explicit Space toggles it ON; reload preserves ON and all three ability slots, resets selected tab to battle. Explicit OFF restores optional cue.
7. Second candidate tab is readonly, shows 接手進度並回營後才能配置, hides shortcut and disables Protection. It was closed without takeover; writer continued normally. Repeated navigation did not trigger learning, slotting or toggle actions.
8. Desktop screenshot inspected: compact readable growth summary and tabs, no horizontal document overflow (1173 = client width). No narrow/physical-mobile acceptance inferred.
9. Captured 78 error entries, all from the known extension URL `chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js`; **zero application-source errors**. Exclusion is URL-specific, not blanket ignoring console errors.

## Bounds

Real higher-rank browser play was not fabricated: gate/max/upgrade focus cases are independent source/UI tests, not high-level browser progression. No hidden-state injection, forced RNG, free currency, edited save or automatic allocation. Candidate normal export/import is a temporary testing transport, not a backed-up personal save. No OS-suspend, physical-mobile, schema-negative browser import or universal background guarantee claimed. Existing inherited limits remain.

## Root promotion

Pending verified accepted-source backup, exact root Pages/HTTP, and actual stable-root smoke. Root remains v0.18 until those steps.

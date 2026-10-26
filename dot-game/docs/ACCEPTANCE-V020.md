# v0.20 acceptance record

Status: source-tested candidate; **browser and root publication pending**.

## Scope

One stage5+ nonboss enemy archetype now alternates physical attacks and a named magical skill, with route/live next-action cues. Original facts, general-rule inference and own cadence are separated in MAGICAL-ENCOUNTERS-GUIDE.md. No other game implementation, data or art reused. Source only dot-game; no dot-archive or other branch work.

## Source verification

- Integration 1,315/1,315 Node tests passed with no skipped or cancelled tests.
- Independent 12,000 exact firstfour-route state/RNG/report comparisons against portable exactaccepted v0.19 engine/loot fixture.
- Independent 24 finish-camp historical prefix hashes /5,395 observations match accepted v0.19 before entering changedstage5; old600-step golden evidence retained rather than falsely expecting newroute parity.
- Targeted tests cover magic parry omission/RNG, evade-only no counter, actualblock counter, Resist factors, physical/magic Protection, no magic weaponprocs, stunned/recovery sequencing, newwave/load/retreat reset and pure previews.
- UI harness verifies isolatedcasterpreview grouping, nextaction updates evenwithoutHPchange, read-onlyviews and clear unimplementedplayerresist0.
- Naturalpairedmeasurement described separately; not proof of universal improvement.

## Release gates remaining

Complete source checkpoint/readback; isolated publiccandidate exactCI/HTTP; actual browser normalprogress reachingstage5+, telegraph/cast/harm, growth/loot/equip and reload; acceptance source backup; then exactrootCI/HTTP and publicsmoke. Do not replace root before candidate acceptance.

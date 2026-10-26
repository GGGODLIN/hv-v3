# v0.20 independent measurement and audit

Scope: source simulation, not browser-earned evidence. Runtime was compared against dot's own exact accepted v0.19 engine/loot fixture (runtime `88907e42c728922a50038b219799a7baa6c74c4f`, receipt `bab87bce00623391060c2b32124fb7a1e3e36f3f`). No enemy tuning, bonus items, edited quality, free credits, or forced combat RNG was used in the natural cohort. Unit tests separately use synthetic fixtures to isolate rules.

## Reproduce

`node --test tests/magical-encounters-audit.test.mjs`

The test prints a `MAGIC_MEASUREMENT` JSON diagnostic. [Full retained rows](MEASUREMENT-V020.json) include every seed, route, loadout, old/new outcome, elapsed seconds, actual incoming HP loss, minimum-HP percentage, counters, MP spending and observed magic casts.

## Natural cohort

- Seeds1–20, eight normal acquisition expeditions each (160 wins, zero losses), existing score-based equipment selection, ordinary AP learning/slotting once eligible.
- Each independently cloned earned profile purchases and equips one legally quoted axe/Slaughter, club/Slaughter or rapier/Nimble commission using earned credits. No reward or price changes.
- Same saved seed and gear before each v0.19/v0.20 pair; stages4,5,6, for180 paired expeditions. Stage4's60 pairs are identical. These different routes are separate observations, not a claim of causal comparison between route difficulty.
- All180 v0.20 expeditions won. Among120 mixed-route pairs, six actually reached a magic cast (one each). HP loss worsened in3, improved in1, stayed equal in116. Two were slower, none faster; the remaining118 were equal in elapsed time.
- Example: seed6/Nimble/stage6: actual HP loss336→372, same21.0 seconds, zero counters in both. Seed4/Nimble/stage6: HP417→408 while counters3→2 at26.3 seconds. Changed random consumption can produce mixed downstream outcomes; these are not isolated mitigation-only experiments.

**Interpretation:** the new cast is a bounded, visible threat, not a universal buff or proof of broad weapon balance. Most measured equipped characters kill or control this enemy before its second initiated action; only six rows exercise magic. An exploratory25-win cohort produced no increased-HP-loss pairs, motivating the earlier natural profile above; it was not treated as proof that magic never occurred. No difficulty was changed to manufacture a favorable result. Browser acceptance must separately show a real cast without edited saves or forced RNG.

## Independent correctness audit

- 12,000 complete state/RNG/report observations across seeds1,29,42,77,100 and stages1–4 match the own v0.19 baseline exactly.
- 150 synthetic seeded cases compare live magical incoming damage and final RNG against the pure resolver. With no actual block, an eligible rapier and high parry add no counter RNG or counter action.
- Magic's partial evade does not become parry/block evidence; the sampled resolver consumes no parry checks. END/WIS magical attribute mitigation is independent of level, INT, AGI and physical armor; player Resist remains explicitly0/unimplemented.
- Read-only previews mutate nothing. Actually initiated attacks advance the telegraph; active-stun skips do not. New actors/load start physical-first.
- The24 historical finish-camp tests were narrowed before first stage5 observation because later routes intentionally change. All5,395 prefix observations/digests were independently regenerated from the accepted v0.19 fixture and matched. Old full-route hashes remain historical provenance. The v0.5 projection still checks names, ordering and physical defense values, while new tests own attack-pattern parity.

No release-blocking source defect found in this bounded review. Player resistance progression, magic equipment mitigation, elemental types and original monster MP/skill-selection economy remain unimplemented. Counter on magical block follows an inference from the general original block-trigger wording; partial-block qualification remains an existing adaptation.

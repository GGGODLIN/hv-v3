# Camp departure feedback correction

## Existing rule, unchanged
The engine requires inventory count at most115 of120 and an empty pending-loot queue before departure. Five spaces are reserved; this patch neither enlarges inventory nor changes loot, combat, progression, saves or RNG. The prior UI could leave Start enabled at117 items, show a generic camp hint, then reject only through the combat log.

## Narrow correction
The UI imports the existing inventory limit and computes the same five-slot reserve. Start stays disabled under its existing writer/battle/defeat guards and also while capacity or pending loot prevents departure. The adjacent control hint reports the number of additional slots needed, or the pending item count and requirement to finish collection then retain five spaces. Re-render after ordinary sale/refill automatically restores availability when both conditions hold. Pending loot takes explanation priority when both conditions fail.

The click handler plays the existing successful-departure sound only if dispatch obtained ownership and changed a non-battle mode into battle. The general dispatcher contract, engine refusal/log behavior and pump reset condition are unchanged: rejected/repeated starts do not reset the interval, and ordinary actions retain their pending time.

## Verification and limits
Focused independent source/VM tests cover115/116/117 inventory boundaries, pending loot, selling/refilling and restored availability, read-only handling, actual/rejected/repeated starts, sound and existing pump timing. Existing pump-transition tests remain current. Final aggregate results are recorded in the checkpoint manifest and status below.

No browser or site operation was performed for this patch. Public v0.14 remains accepted; v0.15 isolated staging is still awaiting the already-requested authorization. The previously prepared website candidate71c68c26 is stale relative to this UI and must not be blindly published. Source backup does not preserve personal browser saves.

## Final source verification
Final source aggregate: **1,155/1,155 tests pass**, zero failures/skips, and all four runtime syntax checks pass. Independent new UI/engine/pump acceptance:15/15; existing pump-transition checks:16/16. Runtime engine/loot/session bytes are unchanged from the previously verified v0.15 candidate. No browser/site verification was performed.


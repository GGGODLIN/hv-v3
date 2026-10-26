# v0.27 extra emergency supply — independent idle-policy adapter

## What changes

The default-OFF camp option **額外緊急補給（均衡／猛攻）** lets Balanced and Assault use existing limited supply without requiring a precisely timed manual click. After the normal automatic-heal decision, at the existing player-turn boundary, it consumes one potion only when HP is **strictly below 30%** of the current maximum and **more than one** potion remains. One bottle is reserved for manual use. Exact 30% does not qualify; a successful heal that raises HP to or above the threshold suppresses the extra use.

The option preserves the existing healing formulas and decision order, attack cadence, MP costs, Protection priority, damage/reward formulas and inventory/equipment rules; the supply decision introduces no random draw of its own. Changed HP can still alter later healing eligibility, MP use, action/RNG paths and outcomes. It does not grant a new turn or remove the existing attack; Protection can still use that attack turn under its existing rule. There is one automatic potion decision per player turn, not a per-render or per-frame check. Manual clicks retain their existing independent timing and can use the reserved last bottle.

## Sustain is separate

**持久 / Sustain already had automatic potion use.** Its existing rule remains: after normal healing, HP below 30% permits a potion whenever any stock remains, including the last bottle. The new option does not control Sustain and does not impose a reserve on it. The control is disabled and explained while Sustain is selected; its remembered preference becomes effective again on Balanced or Assault. OFF therefore does not mean all tactics avoid automatic potions.

## Existing limited stock, not a shop

Each expedition already begins with three supply potions. Each restores 40% of current max HP, capped at that maximum. Existing wave recovery, camp recovery, start replenishment, manual use and the potion count in reports are unchanged. No gold, Soul Fragments, World Seeds, purchased goods or automatic buying are involved. No new potion item, currency, cooldown or inventory stack is introduced. The retained bottle is a policy reserve, not protected ownership: the player can spend it manually and Sustain can spend it automatically.

The 3-per-expedition stock, 40%-maxHP restoration, automatic heal and the new 30% / one-bottle rule are explicitly this game's adaptations. They do not claim original HentaiVerse potion cost, restoration, cooldown or battle-item rules. No additional original-HV formula has been inferred.

## Controls, observations and limits

The preference is camp-only and requires the existing writable tab ownership. Live combat displays remaining stock and distinguishes the effective extra policy from Sustain. A displayed low-HP condition is an observation, not a guarantee of immediate use: normal healing is checked first at the next eligible player turn. Finished reports retain actual total potion uses; an enabled start preference is recorded separately from outcomes. Manual and automatic uses share the existing total rather than fabricating cause-specific historical counts.

A reserved bottle may mean dying with one bottle remaining. An incoming burst can defeat the hero between player turns. Existing automatic healing may prevent the new policy from ever firing. This is a transparent tradeoff, not a win-rate or unlimited-idle guarantee. Source protocols retain no-use, neutral, adverse, losing or censored observations if they occur. Neither natural cohort produced a loss or censor, but one used-potion pair has a worse observed minimum HP; that counterexample is retained.

## Persistence and historical readers

Save format remains **3**. The optional `emergencySupply` preference accepts only booleans; missing or false canonicalizes to OFF, true is retained. This requires no new currency, item schema or numerical cache. The preference joins relevant combat configuration in Item World entry quotes, so changing it invalidates stale paid-entry consent rather than silently changing the accepted build.

Historical v0.26 readers ignore the unknown root preference and omit it when saving: Balanced/Assault then return to manual supply. They do **not** reject the save merely for this option. Refresh older tabs to retain the choice. This limited preference fallback is not broad backward compatibility: v0.24/v0.25 still reject Exquisite IW1 and v0.23 or earlier reject format3. Existing invested-item validation and protected-writer guards remain.

## Verification status

This is an unpublished source candidate layered on source-only v0.26. The accepted live game remains v0.25. Engine playthroughs and source-DOM tests are not browser play. See STATUS.md, ACCEPTANCE-V027.md and EMERGENCY-SUPPLY-MEASUREMENTS.md for exact checks and outcomes. Website/staging/CI/HTTP/browser actions remain paused by the confirmed tool-review block in PUBLICATION-BLOCKER-V026.md; this feature does not retry or work around that refusal.

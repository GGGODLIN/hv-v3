# Independent equipment system, checkpoint 0.1

This module is independently authored for dot. It does not copy or read the excluded `constants.ts`, monster dataset, pixel artwork, existing game implementation, or other authors' single-player designs. Permitted source: original-game research transcribed in [ORIGINAL-HV.md](ORIGINAL-HV.md), particularly original report 003 §1.1, §1.4, §1.5(B), and §1.6 at the linked research commit.

## Original research retained

- Quality is chosen before numeric stat rolls. Original researched R intervals overlap: Crude 0–40, Fair 30–70, Average 60–100, Superior 90–130, Exquisite 120–160, Magnificent 150–180, Legendary 170–200, Peerless 200. We choose the documented 200 upper endpoint for Legendary and disclose the source's competing 199 endpoint.
- Each generated stat rolls its own R within that quality interval. `item.rolls` stores these samples. `item.roll` is their rounded mean for a compact display, not the source of quality.
- `qualityFromRoll` is a conservative diagnostic display helper, not a reverse mapping used by generation. Because R intervals overlap, a single R cannot uniquely recover the actual quality. It picks the first compatible tier, with R=200 displayed as Peerless; callers must use `item.quality` for a generated item.
- Crude items never have a prefix or suffix. Superior and above always have a suffix. Legendary/Peerless always have both. Primary-attribute bonuses (PABs), shield-specific PAB selection, fusion, and the full original armory are **not implemented** in this checkpoint.
- Peerless+ and Ultimate are fusion progression, never ordinary generated quality tiers.
- The user-selected positive-stat interpolation is `B0 + (B200-B0)*(R/200)^1.52`, with R clamped to 0–200. Exponent 1.52 is the report's fitted model, not a claim of original server-exact code. No extrapolation above R=200 is used.
- Axe, club, and rapier attack endpoints are independently transcribed from the permitted research. Raw endpoint pairs are multiplied by fluctuation 0.0854. Ordinary/Slaughter endpoints: axe 350–701 / 470–888, club 250–621 / 353–792, rapier 150–461 / 230–601.
- Club and rapier crit endpoints are independently transcribed: ordinary 124–511, Balance club 344–991 and rapier 342–991, multiplied by 0.0105 **percentage points**, then divided by 100 for engine fractions.
- ADB scales by `1 + equipmentLevel/(50/3)`. Avoidance/crit rates scale by `1 + equipmentLevel/2000`. This version rounds flat output stats to whole units and rate fractions to four decimals; these presentation/implementation choices are not claimed to match every wiki decimal.

## Deliberate independent adaptations

The following are our new game's choices, not original HV rules and not copied from other single-player candidates:

1. Three coarse slots: weapon, armor, accessory. Accessories and the fictional base names are original content. This is not a claim to reproduce original HV's full slot model.
2. Armor and accessory endpoint tables, flat `defense`, HP bonuses, and weighting of those stats are independent first-playable balance. Flat defense level scale is 20 and bonus HP scale is 12; the combat engine documents how those translate into its original-inspired mitigation model.
3. Four new prefixes (`銳意`, `堅守`, `獵隙`, `流風`) provide small trade-off bonuses. They are not original HV prefixes. Below Legendary, eligible items independently have a 30% prefix chance; Crude remains excluded. New affix improvement is itself scaled by the item's stat-specific R curve.
4. Weapon suffixes are restricted to Slaughter, or Balance only on the independently transcribed club/rapier bases. Balance only supplies the researched crit-endpoint part in this checkpoint; accuracy is not yet an item stat. Armor permits only our new `長夜`, `壁壘`, `追風`; accessories permit those plus `破陣`. These new labels and bonuses are explicitly not an original-HV suffix catalog. Fair/Average have a 45% suffix chance; Superior+ guarantee one.
5. **Conditional on an item already being awarded**, quality weights are Crude 2%, Fair 5%, Average 35%, Superior 32%, Exquisite 18%, Magnificent 6%, Legendary 1.9%, Peerless 0.1%. Original quality-drop probabilities are unknown. This table is not a per-kill equipment-drop rate. The engine owns its separately disclosed expedition reward cadence.
6. Every item receives a tiny comparison score; combat consumes individual stats, never that score. The score is not “true DPS” and cannot prove one item is universally better. Crit, survival, and raw damage create different choices.
7. Individual rate bonuses are capped at 0.16 to keep generated inputs bounded at extreme imported level values. Level is sanitized to integer 1–1000, but this bound does not imply 1000 levels of complete game content.

## API and safe integration

`generateItem(rng, level, slot?)` is pure for a deterministic RNG. The module makes a bounded number of draws, clamps invalid/throwing RNG results safely, and has no wall-clock/random-global dependency. Output IDs are deterministic but are not collision-proof; the engine **must replace them with its monotonic inventory IDs**. Probability stats are fractions, e.g. 0.025 means 2.5%.

Exports: `generateItem`, `describeItem`, `scoreItem`, `qualityFromRoll`, `qualityFactor`, `QUALITY_TIERS`, `RARITIES`, and `SLOTS`. Item extras `rolls`, `prefix`, `suffix` are optional diagnostic metadata; the core interface stays compatible.

`describeItem` returns plain text. Consumers must render it as text, not as HTML from imported saves. The save validator must validate the complete item schema and never trust imported `power` as an authority.

## Verification

Run `node --test tests/loot.test.mjs` from `dot-game/`.

Nine tests cover the specified interpolation, original overlapping quality intervals, deterministic generation, all quality tiers, source-backed weapon endpoint scaling, affix guarantee/legality, 3,000 generated examples, malformed and throwing RNG values, and level growth. These module tests do not establish complete game balance, browser behavior, save validation, or source fidelity of unimplemented systems.

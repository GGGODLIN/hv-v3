# v0.27 emergency-supply source-play protocol

Declared before execution. This is deterministic source play, not browser acceptance.

- Fresh seeds: 1, 7, 12, 19, 29, 42, 55, 77, 101, 123.
- For each seed, retain snapshots before play and after 4, 8 and 12 naturally earned expedition attempts. The acquisition policy is Balanced, the new emergency supply OFF, highest existing held score per equipment slot (ties retain current/first), and learning/slotting the existing three rank-one abilities whenever the normal AP budget permits.
- Each acquisition attempt chooses the deepest legally unlocked route, without changing unlocks, combat stats, items, RNG, or resources. Complete one expedition with the existing finish-then-camp action; return after defeat using the ordinary retreat action. Do not discard failed acquisitions.
- Fork each earned snapshot into Balanced, Assault and Sustain, each with emergency supply OFF and ON. All six branches start with the same earned inventory, resources, equipment, character and RNG; only camp policy actions differ. Choose the same deepest legally unlocked route in each pair. Do not manually drink potions during the comparisons.
- A run is observed for at most 20,000 quarter-second engine pulses (5,000 processed seconds). This is a disclosed simulation observation limit, not an acceptance or balance requirement. Preserve censored, failed and start-blocked results rather than choosing a successful replacement.
- Record actual outcomes, elapsed processed time, minimum HP, incoming HP loss, attack/heal/potion/MP counts, remaining potions, ending RNG, level, gold and earned item counts. Record resource stock throughout each ON run; the added rule must not consume the final potion on Balanced/Assault. Sustain intentionally retains its original last-potion permission.
- OFF/ON changes in healing can alter later action/RNG paths. Do not interpret these pairs as unchanged attack roll sequences after divergence, or make a universal survival/clear-time claim. Report equal or worse outcomes too. Separate both-win elapsed-time comparisons from win-versus-defeat comparisons.
- Keep the script, complete raw measurement and summary with the source backup. No outcome is a browser-play result or permission to retry the known denied candidate publication.

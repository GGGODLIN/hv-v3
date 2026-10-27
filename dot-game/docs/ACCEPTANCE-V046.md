# v0.46 literal backpack name search (source only)

Base 1fdb61a42e656c6fb880e9a5ad78d576434b1981. New optional inventory view, not a claim of a previous defect. Name text is trimmed and lowercased, then matched literally against item.name. Existing filters are ANDed and sort still applies. Search is not persisted and does not touch game state, item data, RNG, ownership or transactions.

Final complete suite: 2,025 passed, 0 failed/skipped; four runtime syntax checks passed. Primary full production UI model: 5 cases; independent model: 6 cases. Coverage includes literal punctuation/markup, whitespace/case, all-filter intersection, empty result/reset, exact comparison and sale identity retention, hidden-sale notice, typing focus, import reset, unchanged worn/pending lists, engine state and writes. These use simulated browser APIs, not real browser/IME or pixel acceptance.

Historical artwork byte pins retain their hashes after reversing only the exact name-search UI/HTML/CSS delta; prior source tests expected the new empty name view field and updated current version labels. No engine/loot/session/research or 14 asset changes. The only CSS change is a scoped search input/label layout.

Not published or browser accepted; zero website operations. Existing Kenney website scope refusal remains unresolved. Formal is still v036. No private profiles or full chats are included; no Library dual-sync claim.

#!/usr/bin/env python3
"""One line per round: worst-school values across A/B for each rc9 target (accept bands)."""
import json, sys
for name in sys.argv[1:]:
    rows = [json.loads(l) for l in open(f'/tmp/rc9/{name}.jsonl')]; k = rows[0]['knobs']
    d13 = min(min(r['win'][f'd{i}'] for i in (1, 2, 3)) for r in rows)
    t1 = [r['trip1']['med'] for r in rows]; rat = max((r['ratio'] if r['ratio'] is not None else 99) for r in rows)
    d5 = min(r['win']['d5'] for r in rows); d16 = min(r['win']['d16'] or 0 for r in rows); d20 = min(r['win']['d20'] or 0 for r in rows)
    nf = sum([d13 < 95, min(t1) < 4 or max(t1) > 14, rat > 1.6, d5 < 75, d16 < 60, d20 < 35])
    bs = {r['sc']: r['win']['d16'] for r in rows}
    print(f"{name:14} LPD{k['LPD']} HS{k['HS']} DS{k['DS']} DPD{k['DPD']} TR{k['TR']} | minD1-3 {d13:5.1f} trip1 {min(t1)}-{max(t1)} maxRatio {rat:.2f} minD5B {d5} minD16 {d16} minD20B {d20} | fails {nf}")

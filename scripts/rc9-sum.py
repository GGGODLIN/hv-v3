#!/usr/bin/env python3
"""Summarise /tmp/rc9/<name>.jsonl: per school A/B trip1 median, d16/d13 ratio, win %, verdict vs rc9 targets."""
import json, sys
for name in sys.argv[1:]:
    rows = sorted((json.loads(l) for l in open(f'/tmp/rc9/{name}.jsonl')), key=lambda j: (['blade','oc','arcane','bulwark'].index(j['sc']), j['S0']))
    k = rows[0]['knobs']; print(f"## {name} LPD{k['LPD']} HS{k['HS']} DS{k['DS']} DPD{k['DPD']} TR{k['TR']} N={rows[0]['N']}")
    for j in rows:
        w = j['win']; m = j['trip1']['med']; r = j['ratio']; e = j['trip1End']
        fails = [x for x, ok in [('d1-3', min(w['d1'], w['d2'], w['d3']) >= 95), ('trip1', 4 <= m <= 14), ('ratio', r <= 1.6), ('d5', w['d5'] >= 75), ('d16', (w['d16'] or 0) >= 60), ('d20', (w['d20'] or 0) >= 35)] if not ok]
        print(f"{j['sc']:8}{'A' if j['S0']==0 else 'B'} t1 {m:>2} ({j['trip1']['p25']}-{j['trip1']['p75']}) end d1-3/4-10/11-20/21+ {e['d1_3']}/{e['d4_10']}/{e['d11_20']}/{e['d21p']} ratio {r:.2f} | d1 {w['d1']} d2 {w['d2']} d3 {w['d3']} d5B {w['d5']} d13 {w['d13']} d16 {w['d16']} d18 {w['d18']} d20B {w['d20']} deep {j['deep']}/{j['built']} | {'PASS' if not fails else 'FAIL '+','.join(fails)}")

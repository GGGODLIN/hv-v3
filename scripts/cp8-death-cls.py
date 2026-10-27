import json,sys,collections
for f in sys.argv[1:]:
  R=[json.loads(l[4:]) for l in open(f) if l.startswith('LOW ')]
  D=[r for r in R if r['why']=='dead' and 9<=r['cl']<=12]
  c=collections.Counter(); m=collections.Counter()
  for r in D:
    mp=r['mp']<0.2*r['mpMax']; burst=r['type'] in('elite','boss') and (r['bturns']<=3 or r['rd']>=0.5)
    pot=r['hpPots']==0 or r['hpCd']>0; low=r['hp0']<0.4
    k='MP' if mp else 'burst' if burst else 'pot' if pot else 'other'
    c[k]+=1
    for n,v in [('MP',mp),('burst',burst),('pot',pot),('hp0<40%',low),('type='+r['type'],1)]:
      if v: m[n]+=1
  n=len(D); print(f, f"cluster {n}/{len(R)}", {k:f"{v} ({v/n:.0%})" for k,v in c.items()}, "| multi:", {k:f"{v/n:.0%}" for k,v in m.items()})
  o=[r for r in D if not(r['mp']<0.2*r['mpMax']) and not(r['type'] in('elite','boss') and (r['bturns']<=3 or r['rd']>=0.5)) and not(r['hpPots']==0 or r['hpCd']>0)]
  print('  other sample hp0/bturns/rd:',[(round(r['hp0'],2),r['bturns'],r['rd'],r['type']) for r in o[:8]])

import re,sys
for n in sys.argv[1:]:
  T=open(f'docs/logs/rc8/{n}-T.txt').read(); A=open(f'docs/logs/rc8/{n}-A.txt').read()
  h=re.search(r'DPD=(\S+) TR=(\S+) LPD=(\S+) hpScale=(\S+) dmgScale=(\S+)',T)
  rows={m[0]:m[1:] for m in re.findall(r'^(blade|oc|arcane|bulwark) \| (\d+)%[^|]*\| \d+%[^|]*\| (\d+)%[^|]*\| \d+%[^|]*\| (\d+)%',T,re.M)}
  med=re.findall(r'trip1 cleared depth:.*?median (\d+)',A); rat=re.findall(r'ratios d16/d13 ([\d.—]+)',A)
  if not h or len(rows)<4 or len(med)<5: print(f'| {n} | incomplete |'); continue
  cfg=f'{h[3]} / {h[4]} / {h[5]} / {h[1]} / {h[2]}'
  sc=['blade','oc','arcane','bulwark']
  print(f"| {n} | {cfg} | {'/'.join(rows[s][0] for s in sc)} | {'/'.join(rows[s][1] for s in sc)} | {'/'.join(rows[s][2] for s in sc)} | {'/'.join(med)} | {'/'.join(rat)} |")

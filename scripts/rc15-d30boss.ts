// @ts-nocheck
import { readFileSync } from 'node:fs';
import { makePool } from '../src/core/monsters';
import { RULES, encounter, startAbyss } from '../src/core/run';
const raw = JSON.parse(readFileSync('/workspace/hv-v3/public/data/monsters.json','utf8'));
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp8 = true;
const pool = makePool(raw);
import { newPlayer } from '../src/core/player';
const pl = newPlayer();
const cnt = {}; const bad = [];
for (let s=1;s<=300;s++){ const run = startAbyss(JSON.parse(JSON.stringify(pl)), s, 30); 
 const ms = encounter(run, pool, 'boss'); const b = ms.find((m)=>m.rank==='boss'); const cands = raw.filter((r)=>r[3]===b.pl && r[1]===b.race); const keys=['piercing','crushing','slashing','cold','wind','elec','fire','dark','holy']; const row = cands.find((r)=>keys.every((k,j)=>r[6+j]===b.spec[k])); const rowF = cands.find((r)=>keys.every((k,j)=>k==='cold'? Math.min(100,r[6+j]+50)===b.spec[k] : r[6+j]===b.spec[k])); if(!row) bad.push((rowF && (b.affixes??[]).includes('frost') ? 'FROST+50 ' : 'OTHER ')+b.name+' pl'+b.pl+' '+JSON.stringify(b.spec)+' cands '+JSON.stringify(cands.map(r=>r.slice(6)))); const k=b.name+' | id '+(row?row[0]+' '+row[2]+' '+row[1]+' PL'+row[3]:'?')+' | spec '+JSON.stringify(b.spec)+' affix '+(b.affixes??[]).join(','); cnt[k]=(cnt[k]??0)+1; }
console.log('samples 300, distinct', Object.keys(cnt).length, 'spec!=monsters.json row:', bad.length); const ff=bad.filter(x=>x.startsWith('FROST')).length; console.log('explained by 冰霜 affix cold+50:', ff, 'unexplained:', bad.length-ff); bad.filter(x=>!x.startsWith('FROST')).forEach(x=>console.log('UNEXPLAINED',x.slice(0,300)));
console.log(Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([k,v])=>v+'  '+k).join('\n'));

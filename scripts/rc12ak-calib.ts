// rc12ak（自訂，非數值）: QA evflush 與 sim AJ 行的首領戰對照。用法：npx tsx scripts/rc12ak-calib.ts <evflush.jsonl> <sim-accept.txt>
// evflush 沒有逐回合「對首領造成」欄位，只能比：每層首領戰回合數（fightEnd.turns）、★鍵組成（turnsync.K）、藥水/暈眩次數。
import { readFileSync } from 'node:fs';
const [ev, sim] = process.argv.slice(2);
const L = readFileSync(ev, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
const real = new Map<number, any>(); for (const d of L) if (d.type === 'fightEnd') real.set(d.f, d);
const keys = (boss: boolean) => { const c: Record<string, number> = {}; for (const d of L) if (d.type === 'turnsync' && d.K && (d.f % 5 === 0) === boss) c[d.K] = (c[d.K] ?? 0) + 1; return c; };
const aj = sim ? (readFileSync(sim, 'utf8').split('\n').find((l) => l.startsWith('AJ')) ?? '') : '';
const s = new Map<number, string>(); for (const m of aj.matchAll(/F(\d+):(\d+)\/(\d+)\(n=(\d+),hp([\d.]+)\)/g)) s.set(+m[1], `${m[2]}/${m[3]} n=${m[4]} hp${m[5]}`);
console.log('floor real_turns(skill,pot,stun) | sim med/p90');
for (const f of [...new Set([...real.keys(), ...s.keys()])].sort((a, b) => a - b)) { const r = real.get(f); console.log(`F${f} ${r ? `${r.turns}(${r.skill},${r.pot},${r.stun})` : '-'} | ${s.get(f) ?? '-'}`); }
console.log('K boss', JSON.stringify(keys(true)), 'K normal', JSON.stringify(keys(false)));

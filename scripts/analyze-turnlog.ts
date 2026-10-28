/** rc11c QA tool（僅分析）: per boss fight on F30+ — turns, damage to the boss per turn (median / mean), level, boss max HP.
 *  Input: a QA export (`{ turnlog: [...] }` from 下載 QA 紀錄 / Shift+L), a bare row array (old rc11b `hv-v3-qa-turnlog`, no runId — runs are
 *  split where the floor goes down and fights where the floor changes or the turn counter resets), or a sim dump (SIM_TURNLOG=<file>).
 *  Usage: npx tsx scripts/analyze-turnlog.ts <qa.json> [--sim <sim.json> ...] [--min 30] [--json] */
import { readFileSync } from 'node:fs';
export interface Row { runId?: string; lean?: string; floor: number; level?: number; turn: number; bossDmg: number; bossHp?: number; bossMaxHp?: number }
export interface Fight { runId: string; lean: string; floor: number; level: number | null; turns: number; dmgMed: number; dmgMean: number; bossMaxHp: number | null }
export const rowsOf = (j: unknown): Row[] => (Array.isArray(j) ? j : ((j as { turnlog?: Row[] })?.turnlog ?? [])) as Row[];
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) >> 1]! : (s[n / 2 - 1]! + s[n / 2]!) / 2) : 0; };
export function fights(rows: Row[], min = 30): Fight[] {
  const out: Fight[] = []; let run = 0, cur: Row[] = [], id = '';
  const flush = () => { if (!cur.length) return; const f = cur[0]!; if (f.floor >= min) { const d = cur.map((r) => r.bossDmg);
    const mx = cur.some((r) => r.bossMaxHp) ? Math.max(...cur.map((r) => r.bossMaxHp ?? 0)) : cur.some((r) => r.bossHp != null) ? Math.max(...cur.map((r) => (r.bossHp ?? 0) + r.bossDmg)) : null; // old rows: HP before the first hit
    out.push({ runId: id, lean: f.lean ?? '', floor: f.floor, level: f.level ?? null, turns: cur.length, dmgMed: med(d), dmgMean: Math.round((d.reduce((t, x) => t + x, 0) / d.length) * 10) / 10, bossMaxHp: mx }); } cur = []; };
  let prev: Row | null = null;
  for (const r of rows) {
    const newRun = prev && (r.runId != null ? r.runId !== prev.runId : r.floor < prev.floor);
    if (newRun && r.runId == null) run++;
    if (!prev || newRun || r.floor !== prev.floor || r.turn < prev.turn) flush(); // same turn may repeat (free actions)
    id = r.runId ?? `legacy-${run}`; cur.push(r); prev = r;
  }
  flush(); return out;
}
export function table(groups: Record<string, Fight[]>): string {
  const lines = ['來源\t派別\t樓層\t場數\t回合中位\t每回合傷害中位\t每回合傷害平均\t等級\tboss 最大 HP 中位'];
  for (const [src, fs] of Object.entries(groups)) {
    const by = new Map<string, Fight[]>(); for (const f of fs) { const k = `${f.lean}\t${f.floor}`; by.set(k, [...(by.get(k) ?? []), f]); }
    for (const [k, g] of [...by].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true })))
      lines.push([src, k, g.length, med(g.map((f) => f.turns)), med(g.map((f) => f.dmgMed)), Math.round(med(g.map((f) => f.dmgMean))), med(g.flatMap((f) => (f.level == null ? [] : [f.level]))) || '—', med(g.flatMap((f) => (f.bossMaxHp == null ? [] : [f.bossMaxHp]))) || '—'].join('\t'));
  }
  return lines.join('\n');
}
if (process.argv[1]?.endsWith('analyze-turnlog.ts')) {
  const a = process.argv.slice(2), min = Number(a[a.indexOf('--min') + 1]) || 30, asJson = a.includes('--json');
  const groups: Record<string, Fight[]> = {}; let sim = false;
  for (let i = 0; i < a.length; i++) { const x = a[i]!; if (x === '--min') { i++; continue; } if (x === '--json') continue; if (x === '--sim') { sim = true; continue; }
    groups[(sim ? 'sim:' : 'qa:') + x.split('/').pop()] = fights(rowsOf(JSON.parse(readFileSync(x, 'utf8'))), min); }
  if (!Object.keys(groups).length) { console.error('usage: npx tsx scripts/analyze-turnlog.ts <qa.json> [--sim <sim.json> ...] [--min 30] [--json]'); process.exit(2); }
  if (asJson) console.log(JSON.stringify(groups, null, 1));
  else { for (const [k, fs] of Object.entries(groups)) { console.log(`# ${k}`); for (const f of fs) console.log(`${f.runId}\t${f.lean}\tF${f.floor}\tLv${f.level ?? '?'}\t${f.turns} 回合\t傷害 中位 ${f.dmgMed} / 平均 ${f.dmgMean}\tboss HP ${f.bossMaxHp ?? '?'}`); }
    console.log('\n' + table(groups)); }
}

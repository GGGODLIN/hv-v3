/** Sim-only overrides of CP4 暫定 knobs: rip.mult=0.5 rip.perTurn=1 buff.B1.d.adbPct=0.2 buff.W1.d.block=0.03 */
import { BLADE_BIG_GAME, BULWARK_RIPOSTE } from '../src/core/battle';
import { BUFF } from '../src/core/buffs';
import { BUFF_PLAY } from '../src/core/auto';
import { CP5 } from '../src/core/cp5';
import { OFFER_KNOBS } from '../src/core/buffoffer';
import type { Cp5Sim } from '../src/core/auto';
/** cp5=counter|base|ignore: run with RULES.cp5Bosses on (passed to autoRun). */
export const KN: { cp5?: Cp5Sim } = {};
export function applyKnobs(argv: string[]): string[] {
  const used: string[] = [];
  for (const kv of argv.filter((a) => a.includes('='))) {
    const [k, v] = kv.split('=') as [string, string];
    if (k === 'rip.mult') BULWARK_RIPOSTE.mult = Number(v);
    else if (k === 'rip.perTurn') BULWARK_RIPOSTE.perTurn = Number(v);
    else if (k === 'play' && v === 'school') BUFF_PLAY.attackOnly = ['buff:blade', 'buff:oc', 'buff:bulwark'];
    else if (k.startsWith('cp5.')) (CP5 as unknown as Record<string, number>)[k.slice(4)] = Number(v);
    else if (k === 'cp5') KN.cp5 = { mode: v as Cp5Sim['mode'] };
    else if (k === 'blade.big') BLADE_BIG_GAME.pct = Number(v);
    else if (k === 'offer.eliteEvery') OFFER_KNOBS.eliteEvery = Number(v);
    else if (k === 'offer.noBoss') OFFER_KNOBS.bossFloors = v.split(',').map(Number);
    else if (k.startsWith('buff.')) { const [, id, part, key] = k.split('.') as [string, string, 'd' | 'b' | 'r', string]; const b = BUFF[id]!; const o = ((b as unknown as Record<string, Record<string, number>>)[part] ??= {}); o[key] = Number(v); }
    else continue;
    used.push(kv);
  }
  return used;
}

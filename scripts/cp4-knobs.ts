/** Sim-only overrides of CP4 暫定 knobs: rip.mult=0.5 rip.perTurn=1 buff.B1.d.adbPct=0.2 buff.W1.d.block=0.03 */
import { BLADE_BIG_GAME, BULWARK_RIPOSTE } from '../src/core/battle';
import { BUFF } from '../src/core/buffs';
import { BUFF_PLAY } from '../src/core/auto';
import { OFFER_KNOBS } from '../src/core/buffoffer';
export function applyKnobs(argv: string[]): string[] {
  const used: string[] = [];
  for (const kv of argv.filter((a) => a.includes('='))) {
    const [k, v] = kv.split('=') as [string, string];
    if (k === 'rip.mult') BULWARK_RIPOSTE.mult = Number(v);
    else if (k === 'rip.perTurn') BULWARK_RIPOSTE.perTurn = Number(v);
    else if (k === 'play' && v === 'school') BUFF_PLAY.attackOnly = ['buff:blade', 'buff:oc', 'buff:bulwark'];
    else if (k === 'blade.big') BLADE_BIG_GAME.pct = Number(v);
    else if (k === 'offer.eliteEvery') OFFER_KNOBS.eliteEvery = Number(v);
    else if (k === 'offer.noBoss') OFFER_KNOBS.bossFloors = v.split(',').map(Number);
    else if (k.startsWith('buff.')) { const [, id, part, key] = k.split('.') as [string, string, 'd' | 'b' | 'r', string]; const b = BUFF[id]!; const o = ((b as unknown as Record<string, Record<string, number>>)[part] ??= {}); o[key] = Number(v); }
    else continue;
    used.push(kv);
  }
  return used;
}

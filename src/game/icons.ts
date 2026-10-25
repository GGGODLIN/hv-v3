import type { Equip } from '../core/items';
/** CP3-fix 7: icon file key (public/assets/icons, scripts/gen-icons.py) for an equipment piece. */
export function iconKey(e: Pick<Equip, 'group' | 'base' | 'slot'>): string {
  if (e.group === 'staff') return 'w-staff';
  if (e.group === 'shield') return `s-${e.base}`;
  if (e.group === 'oneHand' || e.group === 'twoHand') return `w-${e.base}`;
  return `a-${e.group}-${e.slot}`;
}

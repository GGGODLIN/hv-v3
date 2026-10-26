import { describe, expect, it } from 'vitest';
import { switchSlot, SLOT_KEY, type Preset } from '../src/core/preset';
import { SAVE_KEY } from '../src/core/save';
import { ABYSS_KEY } from '../src/core/abyss';

const mem = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
const pr = (name: string): Preset => ({ player: { name } as never, record: { best: name.length } });

describe('cp8-rc5 per-preset save slots', () => {
  it('switching presets parks and restores instead of overwriting', () => {
    const kv = mem();
    expect(switchSlot(kv, 'postF20-blade', pr('blade'))).toBe('fresh');
    const s = JSON.parse(kv.getItem(SAVE_KEY)!); s.player.name = 'blade-progress'; kv.setItem(SAVE_KEY, JSON.stringify(s));
    expect(switchSlot(kv, 'postF20-oc', pr('oc'))).toBe('fresh');
    expect(JSON.parse(kv.getItem(SAVE_KEY)!).player.name).toBe('oc');
    expect(switchSlot(kv, 'postF20-blade', pr('blade'))).toBe('restored');
    expect(JSON.parse(kv.getItem(SAVE_KEY)!).player.name).toBe('blade-progress');
    expect(JSON.parse(kv.getItem(ABYSS_KEY)!).best).toBe(5);
    expect(kv.getItem(SLOT_KEY)).toBe('postF20-blade');
    expect(switchSlot(kv, 'postF20-oc', pr('oc'))).toBe('restored');
  });
  it('same slot again, or fresh, re-applies the preset', () => {
    const kv = mem(); switchSlot(kv, 'a', pr('a'));
    const s = JSON.parse(kv.getItem(SAVE_KEY)!); s.player.name = 'x'; kv.setItem(SAVE_KEY, JSON.stringify(s));
    expect(switchSlot(kv, 'a', pr('a'))).toBe('fresh'); expect(JSON.parse(kv.getItem(SAVE_KEY)!).player.name).toBe('a');
    switchSlot(kv, 'b', pr('b')); expect(switchSlot(kv, 'a', pr('a'), true)).toBe('fresh');
  });
});

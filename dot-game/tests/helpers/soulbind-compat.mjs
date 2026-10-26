import assert from 'node:assert/strict';

// Comparison-only projection for the intentionally unbound historical scenarios.
// Preserve every item/stat, RNG value, event, log and report field. Only the
// version-2/3 envelope and the added root currencies are outside the version-1 oracle.
export function legacyState(state) {
  assert.ok(state && typeof state === 'object', 'expected a state object');
  const version = Object.getOwnPropertyDescriptor(state, 'version');
  assert.ok(version && Object.hasOwn(version, 'value') && [1, 2, 3].includes(version.value), 'expected an inert known state envelope');
  const visited = new Set();
  const visit = value => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    assert.equal('soulbound' in value, false, 'historical projection must never hide bound metadata');
    assert.equal('itemWorld' in value, false, 'historical projection must never hide Item World metadata');
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      assert.ok(Object.hasOwn(descriptor, 'value'), 'historical projection requires inert data');
      visit(descriptor.value);
    }
  };
  visit(state);
  const projected = structuredClone(state);
  projected.version = 1;
  delete projected.soulFragments;
  delete projected.worldSeeds;
  return projected;
}

// Explicitly synthetic historical version-1 input for OLD reader tests only.
// Current version-2/3 exports must still be rejected by those readers; this is
// not an application downgrade feature and may not be used with bound items.
export const legacyEnvelope = legacyState;

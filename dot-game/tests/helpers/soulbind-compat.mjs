import assert from 'node:assert/strict';

// Comparison-only projection for the intentionally unbound historical scenarios.
// Preserve every item/stat, RNG value, event, log and report field. Only the
// version-2 envelope and its new root currency are outside the version-1 oracle.
export function legacyState(state) {
  assert.ok(state && typeof state === 'object', 'expected a state object');
  const version = Object.getOwnPropertyDescriptor(state, 'version');
  assert.ok(version && Object.hasOwn(version, 'value') && [1, 2].includes(version.value), 'expected an inert known state envelope');
  const visited = new Set();
  const visit = value => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    assert.equal('soulbound' in value, false, 'historical projection must never hide bound metadata');
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
  return projected;
}

// Explicitly synthetic historical version-1 input for OLD reader tests only.
// Current version-2 exports must still be rejected by those readers; this is
// not an application downgrade feature and may not be used with bound items.
export const legacyEnvelope = legacyState;

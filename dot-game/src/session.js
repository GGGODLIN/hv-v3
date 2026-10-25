/** No wall-clock/offline rewards: only bounded, observed timer intervals. */
export function createPump({ now, active, step, maxGap = 5, maxStep = 2 }) {
  let previous = now();
  return {
    reset() { previous = now(); },
    tick() {
      const current = now(), elapsed = (current - previous) / 1000;
      previous = current;
      if (!active() || !Number.isFinite(elapsed) || elapsed <= 0 || elapsed > maxGap) return 0;
      const seconds = Math.min(maxStep, elapsed);
      step(seconds);
      return seconds;
    }
  };
}

/** Web Locks is the sole authority; no timeout/storage lease can grant ownership. */
export function createOwnership({ locks, name, acquired = () => {}, releasing = () => {}, changed = () => {} }) {
  let owner = false, pending = false, wanted = true, releaseHold, epoch = 0;
  const supported = Boolean(locks?.request);
  async function request() {
    if (!supported || pending || owner || !wanted) return;
    pending = true;
    const ticket = epoch;
    try {
      await locks.request(name, { mode: 'exclusive', ifAvailable: true }, async lock => {
        if (!lock || !wanted || ticket !== epoch) return;
        // Install release promise before invoking callbacks (which may release).
        const held = new Promise(resolve => { releaseHold = resolve; });
        owner = true;
        try {
          acquired();
          if (owner) changed(true);
          await held;
        } finally {
          owner = false;
          releaseHold = undefined;
          changed(false);
        }
      });
    } catch { wanted = false; changed(false); }
    finally { pending = false; }
  }
  function release() {
    wanted = false; epoch++;
    if (owner) {
      try { releasing(); } // save synchronously while the lock is still held
      finally {
        owner = false;
        releaseHold?.();
        changed(false);
      }
    }
  }
  return {
    supported,
    get owner() { return owner; },
    request,
    resume() { wanted = true; return request(); },
    release
  };
}

/** Read-only migration: never mutate legacy storage, and never prefer it to v2. */
export function loadVersionedSave({ read, currentKey, legacyKey, validate, create }) {
  const raw = read(currentKey);
  const legacy = raw === null ? read(legacyKey) : null;
  const source = raw === null ? legacy : raw;
  if (source === null) return { state: create(), raw: null, migrated: false, error: false };
  try {
    return { state: validate(JSON.parse(source)), raw, migrated: raw === null, error: false };
  } catch {
    return { state: create(), raw, migrated: false, error: true };
  }
}

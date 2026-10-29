// v070 adds session-only drop observations. Historical report parity removes
// only that new top-level field; all pre-existing report fields stay exact.
// This is not a state/save projection and never mutates the supplied reports.
export const withoutLootReceipts = reports => reports.map(({loot, ...historical}) => historical);

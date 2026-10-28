// rc10（自訂）: sim switches are read from process.env at module load (auto.ts ENV, cp8.ts RC22_ENV, battle.ts SIM_EST_CRIT …).
// A shell that just ran a sim (CP8=1 SIM_AI=naive SIM_POTPOLICY=ui P5=0 …) used to leak them into vitest → 7 false failures.
// Tests run on game defaults: drop every sim/diag switch before any test module imports src/. A test that needs one sets
// it itself (and restores it).
export const SIM_ENV_RE = /^(SIM_|CP\d+$|P5(MAX)?$|RC\d+_|K_ARC_AI$|K_BLADE_KIT$|DBGFIGHT$|DBGSK$|SC$|SEED0$)/;
for (const k of Object.keys(process.env)) if (SIM_ENV_RE.test(k)) delete process.env[k];

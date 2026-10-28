/** rc12c item 2（自訂）: every SIM_* environment variable the sim / scripts read. rc12b measured with POTPOLICY=ui (should have been
 *  SIM_POTPOLICY=ui) and the typo was silently ignored. checkSimEnv throws on an unknown SIM_* name (typo) and on a known name passed
 *  without its SIM_ prefix. tests/rc12c-simenv.test.ts keeps this list in sync with the sources. */
export const SIM_ENV_KNOWN: ReadonlySet<string> = new Set(['SIM_ENV_LAX', 'SIM_MERCH_HP', 'SIM_DEEP', 'SIM_DEEPHP', 'SIM_DEEPFROM', 'SIM_DEEP_BLADE', 'SIM_DEEP_OC', 'SIM_DEEP_ARCANE', 'SIM_DEEP_BULWARK', 'SIM_DEEPHP_BULWARK', 'SIM_DEEPHP_BLADE', 'SIM_DEEPATK_BULWARK', 'SIM_DEEPPLAIN_BULWARK', 'SIM_DEEPPOTCD_BULWARK', 'SIM_MINIONCHG', 'SIM_BWBOSSHP', 'SIM_BWOUT', 'SIM_AOBOSSHP', 'SIM_BWCAP', 'SIM_BWBOSS100', 'SIM_BWLINEAR', 'SIM_DEEPATK_BLADE', 'SIM_DEEPPLAIN_BLADE', 'SIM_CHGE_BULWARK', 'SIM_CHGE_BLADE', 'SIM_CHGFROM', 'SIM_AOBOSSHP_OC', 'SIM_OCDMG100', 'SIM_OCPLAIN100', 'SIM_OC12M', 'SIM_OCMOBFROM', 'SIM_OCMOBHP', 'SIM_OCMOBDMG', 'SIM_OCREST', 'SIM_OCPOTDROP', 'SIM_OCDEEPK', 'SIM_OCHIT', 'SIM_A9MDB','SIM_ABL','SIM_ADD','SIM_AI','SIM_ALLCAP','SIM_ARCINT','SIM_ARC_FORCE','SIM_ARC_MELEE','SIM_BLADEOC','SIM_BOSS15','SIM_BOSS30','SIM_BOSS5','SIM_BOSSATK','SIM_BUFFHP','SIM_BOSSBURST','SIM_BOSSEND','SIM_BOSSHP','SIM_BOSSPLAIN','SIM_BUYPOT','SIM_BWDC','SIM_BWDCBOSS','SIM_BWOPT','SIM_CAP','SIM_CBLOG','SIM_CBLOG_OUT','SIM_CHARGEDEF','SIM_CP9','SIM_CRITROLL','SIM_DEFCAP','SIM_DHWHY','SIM_DMIN','SIM_DRAINDEF','SIM_EST9','SIM_EST_CRIT','SIM_GUARDHINT','SIM_HINTSTATS','SIM_HP1A','SIM_LAG','SIM_MAPPOT','SIM_MULTIK','SIM_NAIVE40','SIM_NAIVE_AONLY','SIM_NOEXTRA9','SIM_NOMERCHCAP','SIM_NOPREP','SIM_NORMALCAP','SIM_OCCARRY','SIM_OPEN_OC','SIM_P4SKILL','SIM_POLICY','SIM_POTCD','SIM_POTHINT','SIM_POTPOLICY','SIM_QSPAM','SIM_RC12_CHARGEEVERY','SIM_RC12_CURVE','SIM_RC12_DCOUNTER','SIM_RC12_HP1TELE','SIM_RC12_PREMERCH','SIM_RC12_SHATTER','SIM_RC12_SMOOTH','SIM_RESERVEQ','SIM_REVERT','SIM_ROUTE','SIM_SAVE9','SIM_SAVEONCE','SIM_SKILLHINT','SIM_SKILLS','SIM_SKILLS_FROM','SIM_SPELLHINT','SIM_STUNA','SIM_STUNALL','SIM_STUNIMM','SIM_STUNW','SIM_TGT','SIM_TURNLOG','SIM_WIND9','SIM_WINDCD','SIM_WINDCDHIT','SIM_WINDHIT','SIM_WINDREV','SIM_ZHP','SIM_ZRULE']);
/** Unprefixed names that are real system variables and must never be flagged. */
const SYSTEM_OK = new Set(['SIM_ENV_LAX', 'PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'TERM', 'LANG', 'CI', 'NODE_ENV', 'TZ']);
const dist = (a: string, b: string): number => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
};
const near = (n: string): string => { let best = '', bd = 99; for (const k of SIM_ENV_KNOWN) { const x = dist(n, k); if (x < bd) { bd = x; best = k; } } return bd <= 3 ? `（是不是 ${best}？）` : ''; };
/** Returns the list of problems (empty = ok). */
export function simEnvProblems(env: Record<string, string | undefined>): string[] {
  const out: string[] = [];
  for (const n of Object.keys(env)) {
    if (env[n] === undefined) continue;
    if (/^sim_/i.test(n) && !SIM_ENV_KNOWN.has(n)) out.push(`未知的環境變數 ${n}${near(n.toUpperCase())}`);
    else if (!/^SIM_/i.test(n) && !SYSTEM_OK.has(n) && SIM_ENV_KNOWN.has('SIM_' + n)) out.push(`環境變數 ${n} 少了 SIM_ 前綴，sim 不會讀它：請改用 SIM_${n}`);
  }
  return out;
}
export function checkSimEnv(env: Record<string, string | undefined> | undefined): void {
  if (!env || env.SIM_ENV_LAX === '1') return;
  const p = simEnvProblems(env);
  if (p.length) throw new Error('[sim env] ' + p.join('；') + '（確定要略過檢查請設 SIM_ENV_LAX=1）');
}

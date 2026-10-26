/** Run another sim script with RULES.cp6Abyss on (CP6 rc2 (c) route change). Usage: npx tsx scripts/with-cp6.ts scripts/cp5-sim.ts [args…] */
import { RULES } from '../src/core/run';
RULES.cp6Abyss = true; RULES.cp5Bosses = true;
const [target, ...rest] = process.argv.slice(2);
process.argv = [process.argv[0]!, target!, ...rest];
await import(new URL(`../${target}`, import.meta.url).href);

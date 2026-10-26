/** Run any sim script with RULES.cp7 = true. Usage: npx tsx scripts/with-cp7.ts scripts/<script>.ts [args...] */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { RULES } from '../src/core/run';
RULES.cp7 = true;
const target = process.argv[2]!;
process.argv.splice(2, 1);
await import(pathToFileURL(resolve(target)).href);

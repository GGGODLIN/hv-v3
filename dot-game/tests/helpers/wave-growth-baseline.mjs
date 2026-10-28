import {beforePotionFeedback} from './potion-feedback-baseline.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const oldRecovery="  else{s.wave++;s.enemies=enemiesFor(s);s.hero.hp=Math.min(maxHp,s.hero.hp+maxHp*.10);s._enemyClock=0;}";
const newRecovery="  else{\n    // The killing hit/pulse may have leveled the hero and grown bound gear.\n    // Wave recovery must use that settled maximum, never a pre-kill snapshot.\n    const maxHp=stats(s).maxHp;\n    s.wave++;s.enemies=enemiesFor(s);s.hero.hp=Math.min(maxHp,s.hero.hp+maxHp*.10);s._enemyClock=0;\n  }";
function once(source,from,to){assert.equal(source.split(from).length-1,1,`exact wave-growth anchor: ${from}`);return source.replace(from,to);}
/** Only undo v056 for historical byte-identity audits. Never masks other edits. */
export function beforeWaveGrowth(source,path){
 if(path!=='src/engine.js')return source;
 source=beforePotionFeedback(source,path);
 for(const [from,to] of [
  ['function finishWave(s) {','function finishWave(s, maxHp) {'],
  [newRecovery,oldRecovery],
  ['settleEnemyDeath(s,target,previousHp);finishWave(s);','settleEnemyDeath(s,target,previousHp);finishWave(s,p.maxHp);'],
  ['return finishWave(s);','return finishWave(s,stats(s).maxHp);'],
  ['    let killed=false;','    const maxHp=stats(s).maxHp;\n    let killed=false;'],
  ['if(killed&&finishWave(s))return true;','if(killed&&finishWave(s,maxHp))return true;'],
 ])source=once(source,from,to);
 return source;
}
/** Frozen baseline bytes stay untouched. Apply only post-kill HP recapture in
 * memory so historical feature-parity tests do not demand reproducing this bug.
 * Every state/RNG/report field is still compared, including health. */
export async function withWaveGrowthFix(url){
 let source=readFileSync(url,'utf8');
 source=once(source,oldRecovery,oldRecovery.replace('else{','else{maxHp=stats(s).maxHp;'));
 source=source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,(_,q,path)=>`from ${q}${new URL(path,url).href}${q}`);
 return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

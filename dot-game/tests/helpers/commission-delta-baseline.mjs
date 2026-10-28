import assert from 'node:assert/strict';
const before="const diff = Number((value - old).toFixed(4)), rate = rateStats.has(key);\n    const delta = diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${commissionStat(diff, rate)}${rate ? ' 百分點' : ''}`;";
const after='const diff = value - old, rate = rateStats.has(key);\n    const delta = statDeltaText(key, diff);';
export function beforeCommissionDelta(source,path){
 if(path!=='src/ui.js')return source;
 assert.equal(source.split(after).length-1,1,'exact commission delta expression');
 return source.replace(after,before);
}

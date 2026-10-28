import {beforeSelectionRetention} from './selection-retention-baseline.mjs';
import assert from 'node:assert/strict';
const helper="// Keep compact whole-number labels without calling a live fraction zero or full.\nfunction resourcePoolText(current, maximum) {\n  const value = number => number > 0 && number < 1 ? '<1' : format(number);\n  const currentText = value(current), maximumText = value(maximum);\n  const partial = current > 0 && current < maximum && currentText === maximumText;\n  return `${currentText} / ${maximumText}${partial ? '（未滿）' : ''}`;\n}\n";
export function beforeResourcePool(source,path){
 source=beforeSelectionRetention(source,path);
 if(path!=='src/ui.js')return source;
 assert.equal(source.split(helper).length-1,1);source=source.replace(helper,'');
 for(const [pool,cap] of [['hp','Hp'],['mp','Mp']]){
 const after=`resourcePoolText(state.hero.${pool}, derived.max${cap})`;
 assert.equal(source.split(after).length-1,1);
 source=source.replace(after,'`${format(state.hero.'+pool+')} / ${format(derived.max'+cap+')}`');
 }
 return source;
}

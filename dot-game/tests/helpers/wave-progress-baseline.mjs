import {beforeCommissionDelta} from './commission-delta-baseline.mjs';
import assert from 'node:assert/strict';
const before="${Math.max(0, state.mode === 'town' ? 0 : state.wave - 1)} / ${state.totalWaves}";
const after="${Math.max(0, state.mode === 'town' ? 0 : state.mode === 'battle' && state._phase === 'intermission' ? state.totalWaves : state.wave - 1)} / ${state.totalWaves}";
// Reverse only v058's display expression for frozen historical byte guards.
export function beforeWaveProgress(source,path){
 if(path!=='src/ui.js')return source;
 source=beforeCommissionDelta(source,path);
 assert.equal(source.split(after).length-1,1,'exact wave progress expression');
 return source.replace(after,before);
}

import {beforeSingleExpedition} from './single-expedition-baseline.mjs';
import assert from 'node:assert/strict';
const oldPotion="    s.potions--;s.battle.actions.potions++;\n    s.hero.hp=Math.min(p.maxHp,s.hero.hp+p.maxHp*.4);\n    event(s,'heal','補給藥水',Math.round(p.maxHp*.4),'hero');";
const newPotion="    const previousHp=s.hero.hp;\n    s.potions--;s.battle.actions.potions++;\n    s.hero.hp=Math.min(p.maxHp,s.hero.hp+p.maxHp*.4);\n    // Feedback reports effective recovery, not the nominal amount lost to the cap.\n    event(s,'heal','補給藥水',Math.round(s.hero.hp-previousHp),'hero');";
/** Undo only v057's event presentation for historical byte guards; never alter HP, RNG or counters. */
export function beforePotionFeedback(source,path){
 if(path!=='src/engine.js')return source;
 source=beforeSingleExpedition(source,path);
 assert.equal(source.split(newPotion).length-1,1,'exact potion feedback anchor');
 return source.replace(newPotion,oldPotion);
}

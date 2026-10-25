import test from 'node:test';
import assert from 'node:assert/strict';
import { generateItem, qualityFactor, qualityFromRoll, QUALITY_TIERS, describeItem, scoreItem, SLOTS } from '../src/loot.js';
function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; }; }
test('quality curve is the explicit bounded requested fit', () => {
  assert.equal(qualityFactor(0), 0); assert.equal(qualityFactor(200), 1);
  assert.equal(qualityFactor(100), 0.5 ** 1.52);
  assert.equal(qualityFactor(300), 1); assert.equal(qualityFactor(-1), 0);
  assert.equal(qualityFactor(NaN), 0); assert.equal(qualityFactor(Infinity), 0);
  let last = -1; for(let r = 0; r <= 200; r++) { assert.ok(qualityFactor(r) >= last); last = qualityFactor(r); }
});
test('original quality ranges overlap and exclude fusion-only tiers', () => {
  assert.deepEqual(QUALITY_TIERS.map(t=>[t.min,t.max]),[[0,40],[30,70],[60,100],[90,130],[120,160],[150,180],[170,200],[200,200]]);
  assert.equal(qualityFromRoll(60),'Fair'); // conservative helper, not generation classifier
  assert.equal(qualityFromRoll(200),'Peerless'); assert.equal(qualityFromRoll(201),'Peerless');
  assert.ok(!QUALITY_TIERS.some(t=>/Ultimate|Peerless\+/.test(t.name)));
  assert.ok(Math.abs(QUALITY_TIERS.reduce((n,t)=>n+t.weight,0)-100)<1e-9);
});
test('deterministic generation with explicit RNG and slots', () => {
  const a=seeded(71), b=seeded(71);
  for(let i=0;i<60;i++) assert.deepEqual(generateItem(a, 3), generateItem(b, 3));
  for (const slot of SLOTS) assert.equal(generateItem(seeded(42),1,slot).slot,slot);
});
test('quality generator can select every tier via its weighted interval', () => {
  let low=0;
  for(const tier of QUALITY_TIERS) {
    const draws=[0, (low+tier.weight/2)/100];
    const item=generateItem(()=>draws.shift()??0.5,1,'weapon');
    assert.equal(item.quality,tier.name);
    assert.ok(item.roll>=tier.min && item.roll<=tier.max);
    for(const r of Object.values(item.rolls)) assert.ok(r>=tier.min && r<=tier.max);
    if(tier.name==='Crude') { assert.equal(item.prefix,''); assert.equal(item.suffix,''); }
    if(['Superior','Exquisite','Magnificent','Legendary','Peerless'].includes(tier.name)) assert.ok(item.suffix);
    if(['Legendary','Peerless'].includes(tier.name)) assert.ok(item.prefix);
    low+=tier.weight;
  }
});
test('generated affix stats are positive finite and probability bonuses bounded', () => {
  const rng=seeded(27);
  for(let i=0;i<3000;i++) {
    const item=generateItem(rng,1+i%80);
    assert.ok(SLOTS.includes(item.slot)); assert.equal(item.locked,false);
    assert.ok(item.name.length>0 && item.description.length>0);
    for(const [key,value] of Object.entries(item.stats)) {
      assert.ok(Number.isFinite(value) && value>0);
      if(['crit','evade','block'].includes(key)) assert.ok(value<=0.16);
    }
    assert.equal(item.power,scoreItem(item)); assert.ok(describeItem(item).length>0);
    assert.ok(item.roll>=0 && item.roll<=200);
  }
});
test('malformed inputs and throwing RNG cannot break generation', () => {
  for(const rng of [null,()=>NaN,()=>Infinity,()=>-7,()=>7,()=>{throw Error('no');}]) {
    for(const lv of [NaN,Infinity,-2,0,1e99,'3',null]) {
      const item=generateItem(rng,lv,'invalid');
      assert.ok(Number.isFinite(item.power)); assert.ok(item.level>=1 && item.level<=1000);
      assert.ok(SLOTS.includes(item.slot));
    }
  }
  assert.equal(scoreItem(null),0); assert.equal(describeItem(null),'無裝備資料');
  assert.equal(scoreItem({stats:{attack:NaN,hp:Infinity}}),0);
});
test('equal seeds preserve relative quality and level drives finite growth', () => {
  const a=generateItem(seeded(5),1,'weapon'); const b=generateItem(seeded(5),5,'weapon');
  assert.equal(a.roll,b.roll); assert.ok(b.stats.attack>a.stats.attack);
});

test('base-specific suffix legality and independently rolled stats', () => {
  const rng=seeded(1337); let sawDifferent=false;
  for(let i=0;i<400;i++) {
    const item=generateItem(rng,2,i%2?'weapon':'armor');
    if(item.slot==='weapon') assert.ok(['','屠戮','平衡'].includes(item.suffix));
    else assert.ok(['','長夜','壁壘','追風'].includes(item.suffix));
    if(new Set(Object.values(item.rolls)).size>1) sawDifferent=true;
  }
  assert.ok(sawDifferent);
});
test('research weapon endpoints use fitted quality and documented level scaling', () => {
  // Crude Axe has no prefix/suffix. Force R=0 for all stats.
  const item=generateItem(()=>0,1,'weapon');
  assert.equal(item.quality,'Crude'); assert.equal(item.stats.attack,Math.round(350*.0854*(1+1/(50/3))));
});

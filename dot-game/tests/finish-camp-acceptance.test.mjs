import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as g from '../src/engine.js';

// Portable deterministic trace digests generated from our own unchanged source
// 50d37a0eac4189bbdecd70ccd29dc06bee82c7af, before finish-then-camp.
// Each digest covers 600 complete state + report observations, not just outcome.
const baselines = [
  {
    "seed": 2,
    "family": null,
    "protection": false,
    "sha256": "7bb9aeeb83b80ef04b0203f0711aaf1b93506e2204b4723c7aa611f606bf4e10"
  },
  {
    "seed": 2,
    "family": null,
    "protection": true,
    "sha256": "252d4e66f8aa454bf4ee0cde1ecf79e2a2718751af8b678a5dd75c328c1ab932"
  },
  {
    "seed": 2,
    "family": "axe",
    "protection": false,
    "sha256": "f7a221520e5b2e9ea35bc5a7acc4335a581ae072b12eed7ed0ab9aa129f1c09e"
  },
  {
    "seed": 2,
    "family": "axe",
    "protection": true,
    "sha256": "47a4b770eab7b25d74abf10e71217955397efbc55404869763cc35be7d656de2"
  },
  {
    "seed": 2,
    "family": "club",
    "protection": false,
    "sha256": "0f73ffe0c837b1cc63be758c537f4986e71b0d41dcc0a338a9ed2fd8aed7572b"
  },
  {
    "seed": 2,
    "family": "club",
    "protection": true,
    "sha256": "2d6c01909927c79e7e121038cf2f99afc0803bebeaad94edfad0e67ee4da7570"
  },
  {
    "seed": 2,
    "family": "rapier",
    "protection": false,
    "sha256": "ac15d0d42532299221211cf6d9f40ea414ba362777cf6f7986353dc4c2f33862"
  },
  {
    "seed": 2,
    "family": "rapier",
    "protection": true,
    "sha256": "301d055f6f499bb2094f98b181915f5a10b36f17cc0167ee62ace8cd76253d57"
  },
  {
    "seed": 29,
    "family": null,
    "protection": false,
    "sha256": "96c23b5090912bb673db921b5415b941522a26be99929d294d7a245a569a4e81"
  },
  {
    "seed": 29,
    "family": null,
    "protection": true,
    "sha256": "fa97dd82b667533110d5aef3f7d5d14cc66f977bab056f8cab17951de0b33ac7"
  },
  {
    "seed": 29,
    "family": "axe",
    "protection": false,
    "sha256": "2cf9276650cddd82819ea46ec194db3b0a7ac9e28a3ff720f60d3b55b531cf1b"
  },
  {
    "seed": 29,
    "family": "axe",
    "protection": true,
    "sha256": "54c4fca75582820e85d057f2766485d85cc112c1a21f33972f1b28587263b32f"
  },
  {
    "seed": 29,
    "family": "club",
    "protection": false,
    "sha256": "5391d2209492fb26a024d7ae30518007467044160595b79a7b3b909a69c67a80"
  },
  {
    "seed": 29,
    "family": "club",
    "protection": true,
    "sha256": "23cee1e225b889f11def398c2dd03ee0cfe55d544c09fb2cef34322c5f79b096"
  },
  {
    "seed": 29,
    "family": "rapier",
    "protection": false,
    "sha256": "cba49012f0863bb0790274b915ba724394b2996cb2f3d3434843c49e6ade0812"
  },
  {
    "seed": 29,
    "family": "rapier",
    "protection": true,
    "sha256": "4d33974a633dcc402c4e36dc598b978f88cbd3e1634a769b0d4edd673fda74b5"
  },
  {
    "seed": 42,
    "family": null,
    "protection": false,
    "sha256": "8a68749f87f9da804ce427d4444060c87f750a62103d11ec9309ef6a2240c1e0"
  },
  {
    "seed": 42,
    "family": null,
    "protection": true,
    "sha256": "b20120251b5bc6eca769e6305c669e423864309ee2bc65150f248769b49409a8"
  },
  {
    "seed": 42,
    "family": "axe",
    "protection": false,
    "sha256": "9a2b5bddb9b43dbb0d134bb841a6a176718be97fa2b5cabebc7eadd3424b9113"
  },
  {
    "seed": 42,
    "family": "axe",
    "protection": true,
    "sha256": "ed2f648d64f8b930f48762903539f53e548f0d42bdacb3d74c4f7de7109d4b0d"
  },
  {
    "seed": 42,
    "family": "club",
    "protection": false,
    "sha256": "fb1de2d3e6ae1f9f4143ff371bb74bcda41d84e6ff5bba7aabcd5f595fafc6c9"
  },
  {
    "seed": 42,
    "family": "club",
    "protection": true,
    "sha256": "4ee009ba4c16dd67832380783c16fdaecb20b9c30f84d1adff6045c72a0ed39b"
  },
  {
    "seed": 42,
    "family": "rapier",
    "protection": false,
    "sha256": "1e8f56e6d23fe1f5f50165d5d035efa1232fbcae78d6473a7a5e225bcc6d007d"
  },
  {
    "seed": 42,
    "family": "rapier",
    "protection": true,
    "sha256": "c4a6a70bf1694476ea6f18de1a720c0df7671bfa5f505e8ed686ba50ac2d7540"
  }
];
for(const row of baselines)test(`finish camp default-off parity: ${row.seed}/${row.family}/${row.protection}`,()=>{
 const s=g.createGame(row.seed);s.hero.level=10;s.equipment.weapon.weaponFamily=row.family;s.autoAdvance=true;if(row.protection)s.autoProtection=true;g.act(s,'start');
 const hash=createHash('sha256');for(let i=0;i<600;i++){g.advance(s,i%3===0?2:.1);hash.update(JSON.stringify([s,g.expeditionReports(s)]));}
 assert.equal(hash.digest('hex'),row.sha256);
});
const copy=structuredClone;
function runToEnd(s,dt=.1){for(let n=0;n<20000&&s.mode==='battle'&&s.wins===0;n++)g.advance(s,dt);assert.ok(s.wins>0||s.mode==='defeat','bounded run settles');}
function rewards(s){return {seed:s.seed,hero:copy(s.hero),inventory:copy(s.inventory),pendingLoot:copy(s.pendingLoot),wins:s.wins,kills:s.kills,unlocked:s.unlocked,stage:s.stage,battle:copy(s.battle),timing:copy(s.timing),events:copy(s.events),reports:g.expeditionReports(s)};}
const target=()=>({id:'finish-target',name:'Synthetic stop fixture',hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,boss:false});

for(const seed of [2,29,42])for(const autoAdvance of [false,true])test(`finish camp natural completion retains rewards and stage ${seed}/${autoAdvance}`,()=>{
 const queued=g.createGame(seed),ordinary=g.createGame(seed);
 for(const s of [queued,ordinary]){s.autoAdvance=autoAdvance;g.act(s,'start');}
 const before=JSON.stringify(queued);g.act(queued,'finishThenCamp',true);assert.equal(JSON.stringify(queued),before,'intent neither consumes RNG nor enters save');
 for(let n=0;n<20000&&queued.mode==='battle'&&queued.wins===0;n++){g.advance(queued,.1);g.advance(ordinary,.1);if(queued.wins===0)assert.deepEqual(queued,ordinary);}
 assert.equal(queued.wins,1);assert.equal(queued.mode,'town');assert.equal(queued.stage,1);assert.equal(ordinary._phase,'intermission');
 assert.deepEqual(rewards(queued),rewards(ordinary));assert.equal(g.finishThenCampView(queued).queued,false);
 const settled=rewards(queued);for(let n=0;n<20;n++){g.act(queued,'finishThenCamp',true);g.advance(queued,2);}assert.deepEqual(rewards(queued),settled);
 g.act(queued,'start');assert.equal(g.finishThenCampView(queued).queued,false,'one shot cannot stop the next expedition');
});

test('finish camp cancel restores byte-identical ordinary automatic loop',()=>{
 const a=g.createGame(42),b=g.createGame(42);g.act(a,'start');g.act(b,'start');
 g.act(a,'finishThenCamp',true);assert.equal(g.finishThenCampView(a).queued,true);g.advance(a,.4);g.advance(b,.4);assert.deepEqual(a,b);
 g.act(a,'finishThenCamp',false);assert.equal(g.finishThenCampView(a).queued,false);
 for(let i=0;i<900;i++){g.advance(a,.1);g.advance(b,.1);assert.deepEqual(a,b);}assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
});

test('finish camp intermission click returns already-paid win once, with no extra RNG or report',()=>{
 const s=g.createGame(42);s.autoAdvance=true;g.act(s,'start');runToEnd(s);assert.equal(s._phase,'intermission');
 const paid=rewards(s);g.act(s,'finishThenCamp',true);assert.equal(s.mode,'town');assert.equal(s.stage,1);assert.deepEqual(rewards(s),paid);
 g.act(s,'finishThenCamp',true);g.act(s,'finishThenCamp',false);g.advance(s,2);assert.deepEqual(rewards(s),paid);
});

test('finish camp invalid payloads and town/defeat calls are inert',()=>{
 for(const mode of ['town','defeat']){const s=g.createGame(42);s.mode=mode;const before=copy(s);for(const value of [true,false,null,1,'true',{}])g.act(s,'finishThenCamp',value);assert.deepEqual(s,before);assert.deepEqual(g.finishThenCampView(s),{available:false,queued:false});}
 const s=g.createGame(42);g.act(s,'start');for(const value of [null,1,'true',{},undefined])g.act(s,'finishThenCamp',value);assert.equal(g.finishThenCampView(s).queued,false);
});

test('finish camp retreat, ownership clear and validated reload/import discard one-shot intent',()=>{
 for(const action of ['retreat','ownership','reload']){const s=g.createGame(42);g.act(s,'start');g.act(s,'finishThenCamp',true);assert.equal(g.finishThenCampView(s).queued,true);
  if(action==='retreat'){g.act(s,'retreat');g.act(s,'start');assert.equal(g.finishThenCampView(s).queued,false);}
  else if(action==='ownership'){g.clearFinishThenCamp(s);assert.equal(s.mode,'battle');assert.equal(g.finishThenCampView(s).queued,false);}
  else {const restored=g.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(restored.mode,'town');g.act(restored,'start');assert.equal(g.finishThenCampView(restored).queued,false);}
 }
});

test('finish camp defeat clears queued intent and later start does not inherit it',()=>{
 const s=g.createGame(42);g.act(s,'start');g.act(s,'finishThenCamp',true);s.hero.hp=1;s.hero.mp=0;s._clock=-100;s._enemyClock=1.9;s.enemies=[{...target(),hp:1e9,maxHp:1e9,attack:1e9}];
 for(let i=0;i<50&&s.mode==='battle';i++)g.advance(s,2);
 assert.equal(s.mode,'defeat');assert.equal(g.expeditionReports(s)[0].outcome,'defeat');assert.equal(g.finishThenCampView(s).queued,false);
 g.act(s,'retreat');g.act(s,'start');assert.equal(g.finishThenCampView(s).queued,false);
});

for(const mechanism of ['basic','bleed','counter'])test(`finish camp terminal ${mechanism} settles once, even with long update`,()=>{
 const s=g.createGame(mechanism==='counter'?2:42);if(mechanism==='counter'){s.hero.attributes.str=2000;s.hero.attributes.dex=2000;s.equipment.weapon.weaponFamily='axe';s.equipment.armor.stats.block=1;}
 g.act(s,'start');s.wave=s.totalWaves;s.enemies=[target()];s._clock=-100;s._enemyClock=-100;g.act(s,'finishThenCamp',true);
 if(mechanism==='basic')s._clock=1.05;
 if(mechanism==='bleed'){s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:5};s.timing.tu=99.99;}
 if(mechanism==='counter')s._enemyClock=1.9;
 for(let i=0;i<20&&s.mode==='battle';i++){if(mechanism==='basic')s._clock=1.05;g.advance(s,2);}
 assert.equal(s.mode,'town');assert.equal(s.wins,1);assert.equal(s.kills,1);assert.equal(g.expeditionReports(s).length,1);assert.equal(g.expeditionReports(s)[0].outcome,'win');
 const paid=rewards(s);g.advance(s,2);g.act(s,'finishThenCamp',true);assert.deepEqual(rewards(s),paid);
 if(mechanism==='bleed')assert.equal(g.expeditionReports(s)[0].damage.bleed,1);
 if(mechanism==='counter')assert.equal(g.expeditionReports(s)[0].damage.counter,1);
});

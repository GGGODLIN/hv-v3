// CP3-bugfix e2e (run by `npm run e2e` after e2e.mjs). Same env as e2e.mjs.
import p from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const URL0=process.env.E2E_URL||'http://127.0.0.1:5199/';
const S=(process.env.E2E_SHOTS||'e2e-shots')+'/';mkdirSync(S,{recursive:true});
const w=ms=>new Promise(r=>setTimeout(r,ms));
const b=await p.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader'],defaultViewport:{width:1280,height:900}});
const fails=[];const R={};
// ---- 8: assets fail once, game must retry and boot
{
  const pg=await b.newPage();const hit={};
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();const k=u.includes('manifest.json')?'manifest':u.includes('monsters.json')?'monsters':u.includes('/assets/pixel/')&&u.endsWith('.png')?'png':u.includes('/assets/icons/c-attack')?'icon':null;
    if(k&&!u.includes('retry=')&&(k==='manifest'||k==='png'?(hit[k]??0)<5:!hit[k])){hit[k]=(hit[k]??0)+1;return k==='monsters'?r.respond({status:503,body:'busy'}):r.abort('failed');}r.continue();});
  await pg.goto(URL0+'?debug',{waitUntil:'networkidle0'});await w(500);
  R.retry=await pg.evaluate(()=>({hv:typeof window.hv,retries:window.__assetRetries||0,bg:!!window.hv?.stage?.textures?.exists('bg'),stageRetries:window.hv?.stage?.retries}));
  R.retryHit=hit;
  await pg.screenshot({path:S+'cp3fix-08-asset-retry.png'});
  if(R.retry.hv!=='object'||R.retry.retries<2||!R.retry.bg||!(R.retry.stageRetries>=1))fails.push('8 asset retry '+JSON.stringify(R.retry)+' '+JSON.stringify(hit));
  await pg.close();
}
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto(URL0+'?debug',{waitUntil:'networkidle0'});
await pg.evaluate(()=>{localStorage.clear()});await pg.reload({waitUntil:'networkidle0'});
// veteran profile (all systems except IW)
await pg.evaluate(()=>{hv.p.prog=undefined;hv.p.exp+=200000;hv.save();hv.go('town')});await w(200);
// ---- 3: carry hint trip 3 = x2, trip 4 none
for(const t of [2,3]){await pg.evaluate(t=>{hv.p.prog.trips=t;hv.data.run=null;hv.startRun()},t);await w(200);
  R['trip'+(t+1)]=await pg.$eval('[data-trip]',x=>x.textContent).catch(()=>null);
  if(t===2)await pg.screenshot({path:S+'cp3fix-03-trip3-carry.png'});}
if(!R.trip3?.includes('×2'))fails.push('3 trip-3 hint '+R.trip3);
if(R.trip4!==null)fails.push('3 trip-4 should have no carry hint '+R.trip4);
// ---- 1 + 6: boss phase message, skill/stance feedback
await pg.evaluate(async()=>{hv.run.floor=10;await hv.startBattle('boss');});await w(800);
await pg.evaluate(async()=>{hv.battle.oc=250;hv.render();await hv.command('spirit');});await w(600);
R.spiritLog=await pg.$$eval('.log [data-spiritlog]',xs=>xs.map(x=>x.textContent));
await pg.evaluate(async()=>{hv.target=0;hv.battle.oc=250;await hv.command('skill:shieldBash');});await w(1500);
R.statusLog=await pg.$$eval('.log [data-status]',xs=>xs.map(x=>x.textContent));
R.skillLog=await pg.$$eval('.log [data-skillhit]',xs=>xs.map(x=>x.textContent));
await pg.screenshot({path:S+'cp3fix-06-skill-feedback.png'});
if(!R.spiritLog.some(t=>t.includes('×2')))fails.push('6 spirit stance log');
if(!R.statusLog.some(t=>t.includes('暈眩 5 回合'))&&!R.skillLog.some(t=>t.includes('盾擊')))fails.push('6 shield bash feedback '+R.statusLog+'|'+R.skillLog);
for(let i=0;i<30;i++){const done=await pg.evaluate(async()=>{const m=hv.battle.monsters[0];if(document.querySelector('.log [data-phase]')||hv.battle.over)return true;if(m.hp>1)m.hp=1;hv.target=0;hv.battle.hp=hv.battle.d?.hp??hv.battle.hp;await hv.command('attack');return false;});if(done)break;await w(300);}
await w(400);
R.phaseLog=await pg.$$eval('.log [data-phase]',xs=>xs.map(x=>x.textContent));
await pg.screenshot({path:S+'cp3fix-01-boss-phase2.png'});
if(!R.phaseLog.some(t=>t.includes('復活')&&t.includes('狂暴')))fails.push('1 boss phase message '+R.phaseLog);
// ---- 7: campfire forge preview
await pg.evaluate(()=>{hv.battle=null;hv.run.current={type:'rest',option:0};hv.pending={};hv.go('node')});await w(200);
R.forge=await pg.$$eval('[data-forge]',xs=>xs.map(x=>x.textContent.replace(/\s+/g,' ')));
await pg.screenshot({path:S+'cp3fix-07-campfire-forge.png'});
if(!R.forge.length||!R.forge.some(t=>t.includes('→')))fails.push('7 campfire forge preview '+R.forge);
// ---- 6: sell all needs confirmation
await pg.evaluate(()=>{hv.data.run=null;hv.townTab='shop';hv.go('town')});await w(200);
R.inv0=await pg.evaluate(()=>hv.p.inventory.length);
if(R.inv0===0){await pg.evaluate(()=>{const e=hv.p.equipped.mainHand;hv.p.inventory.push({...e,id:'x1'},{...e,id:'x2'});hv.go('town')});await w(200);R.inv0=2;}
await pg.click('[data-sellall]');await w(200);
R.sellModal=await pg.$eval('.modal',m=>m.textContent.replace(/\s+/g,' ')).catch(()=>null);
await pg.screenshot({path:S+'cp3fix-06-sellall-confirm.png'});
R.invAfterOpen=await pg.evaluate(()=>hv.p.inventory.length);
await pg.click('[data-modal-cancel]');await w(150);R.invAfterCancel=await pg.evaluate(()=>hv.p.inventory.length);
await pg.click('[data-sellall]');await w(150);await pg.click('[data-modal-ok]');await w(200);R.invAfterOk=await pg.evaluate(()=>hv.p.inventory.length);
if(!R.sellModal?.includes('無法買回')||R.invAfterOpen!==R.inv0||R.invAfterCancel!==R.inv0||R.invAfterOk!==0)fails.push('6 sell-all confirm '+JSON.stringify([R.sellModal,R.inv0,R.invAfterOpen,R.invAfterCancel,R.invAfterOk]));
if(errs.length)fails.push('page errors '+errs.join(' | '));
console.log(JSON.stringify(R,null,1));
await b.close();
console.log(fails.length?'E2E-CP3FIX FAIL: '+fails.join(', '):'E2E-CP3FIX PASS');process.exit(fails.length?1:0);

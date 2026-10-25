// npm run e2e — headless end-to-end check against a running build (vite preview).
// Env: CHROME_PATH (default /usr/bin/google-chrome), E2E_URL (default http://127.0.0.1:5199/), E2E_SHOTS (default e2e-shots/).
import p from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const URL0=process.env.E2E_URL||'http://127.0.0.1:5199/';
const b=await p.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader'],defaultViewport:{width:1280,height:900}});
const w=ms=>new Promise(r=>setTimeout(r,ms));const S=(process.env.E2E_SHOTS||'e2e-shots')+'/';mkdirSync(S,{recursive:true});
const pg=await b.newPage();const errs=[];
pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(String(e)));pg.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url())});
await pg.goto(URL0,{waitUntil:'networkidle0'});
const R={};R.hvWithoutDebug=await pg.evaluate(()=>typeof window.hv);
await pg.goto(URL0+'?debug',{waitUntil:'networkidle0'});
await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});
// item 8: new character confirm
await pg.click('[data-newgame]');await w(200);
R.newCharModal=await pg.$eval('.modal',m=>m.textContent.replace(/\s+/g,' ').trim());
await pg.screenshot({path:S+'r6-08-newchar-confirm.png'});
await pg.click('[data-modal-cancel]');await w(100);R.cancelClosed=!(await pg.$('.modal'));
await pg.click('[data-newgame]');await w(100);await pg.click('[data-modal-ok]');await w(200);R.okClosed=!(await pg.$('.modal'));
// battle 1
await pg.click('[data-start]');await w(400);
await pg.evaluate(()=>{const i=window.hv.run.nodes?.[window.hv.run.floor-1];});
await pg.click('[data-node]');await w(1500);
// item 2: disabled tooltip
R.disabled=await pg.$$eval('[aria-disabled="true"]',xs=>xs.map(x=>x.textContent.trim().slice(0,8)+' → '+x.title));
const sbtn=await pg.$('[data-act="spirit"]');const box=await sbtn.boundingBox();
await pg.mouse.move(box.x+box.width/2,box.y+box.height/2);
R.spiritBefore=await pg.evaluate(()=>({oc:hv.battle.oc,sp:hv.battle.sp,title:document.querySelector('[data-act="spirit"]').title,dis:document.querySelector('[data-act="spirit"]').getAttribute('aria-disabled')}));
// item 1: real mouse click
await pg.mouse.click(box.x+box.width/2,box.y+box.height/2);await w(1500);
R.spiritOn=await pg.evaluate(()=>hv.battle.spirit);
await pg.screenshot({path:S+'r6-01-spirit-on.png'});
// hover over a disabled button for screenshot
const dis=await pg.$('[aria-disabled="true"]');if(dis){const bb=await dis.boundingBox();await pg.mouse.move(bb.x+5,bb.y+5);await w(1200);await pg.screenshot({path:S+'r6-02-disabled-hover.png'});}
// item 5: timings at 1x
await pg.keyboard.press('a');await w(2500);
R.timings1x=await pg.evaluate(()=>hv.stage.timings);
// item 3: regen in log
R.regenLines=await pg.$$eval('.regen',xs=>xs.map(x=>x.textContent).slice(0,3));
await pg.screenshot({path:S+'r6-03-regen-log.png'});
// 2x
await pg.evaluate(()=>{hv.stage.speed=2});await pg.keyboard.press('a');await w(2000);
R.timings2x=await pg.evaluate(()=>hv.stage.timings);
await pg.evaluate(()=>{hv.stage.skip=true});const t0=Date.now();await pg.keyboard.press('a');await w(50);
await pg.waitForFunction(()=>!hv.busy,{timeout:5000});R.skipMs=Date.now()-t0;R.timingsSkip=await pg.evaluate(()=>hv.stage.timings);
await pg.evaluate(()=>{hv.stage.skip=false;hv.stage.speed=1});
// ---- item 11: boost (test shortcut) then play to clear
await pg.evaluate(()=>{const p=hv.data.player;p.exp=5e7;for(const k in p.attrs)p.attrs[k]+=1500;hv.save();});
let bagSnap=[],shotModal=false,guard=0;
while(guard++<600){
  const st=await pg.evaluate(()=>({s:hv.screen,over:hv.battle?.over,busy:hv.busy,done:hv.data.run?.done,bag:(hv.data.run?.bag||[]).map(e=>e.id)}));
  if(st.bag.length)bagSnap=st.bag;
  if(st.s==='result')break;
  if(st.s==='map'){await pg.click('[data-node]');await w(300);continue;}
  if(await pg.$('.modal')){await pg.click('[data-modal-ok]');await w(150);continue;}
  if(!shotModal&&await pg.$('[data-bequip]')){ // item 6: force the weaker-item dialog
    const ok=await pg.evaluate(()=>{const r=hv.data.run;const e=r.bag.find(x=>hv.p.equipped[x.slot]);if(!e)return false;e.__w=1;return e.id});
    if(ok){
      await pg.evaluate(id=>{const o=window.confirm;window.__conf=0;window.confirm=()=>{window.__conf++;return true};},ok);
      const before=await pg.evaluate(()=>document.querySelectorAll('.modal').length);
      // degrade the bag item so it is weaker
      await pg.evaluate(id=>{const e=hv.data.run.bag.find(x=>x.id===id);for(const k in e.stats||{})e.stats[k]=0;e.roll=0;e.pabs=[];e.prefix=null;e.suffix=null;hv.render();},ok);
      const btn=await pg.$(`[data-bequip="${ok}"]`);
      if(btn){await btn.click();await w(200);
        R.equipModal=await pg.evaluate(()=>{const m=document.querySelector('.modal');return m?m.innerText.slice(0,400):null});
        R.windowConfirmCalls=await pg.evaluate(()=>window.__conf);
        if(R.equipModal)await pg.screenshot({path:S+'r6-06-equip-modal.png'});shotModal=true;
        if(await pg.$('[data-modal-cancel]'))await pg.click('[data-modal-cancel]');await w(100);continue;}
    }
  }
  if(st.s==='node'&&st.over===false){await pg.keyboard.press('a');await w(150);continue;}
  if(await pg.$('[data-continue]')){await pg.evaluate(()=>{hv.stage.skip=true});await pg.click('[data-continue]');await w(200);continue;}
  await pg.keyboard.press('a');await w(150);
}
R.loops=guard;
R.result=await pg.evaluate(()=>document.querySelector('.panel')?.innerText.slice(0,600));
await pg.screenshot({path:S+'r6-11-settlement.png',fullPage:true});
await pg.click('[data-town]');await w(300);
R.allHome=await pg.evaluate(ids=>ids.filter(id=>!hv.p.inventory.some(e=>e.id===id)&&!Object.values(hv.p.equipped).some(e=>e&&e.id===id)),bagSnap);
R.bagCount=bagSnap.length;R.stats=await pg.evaluate(()=>hv.data.stats);
await pg.evaluate(()=>{document.querySelector('[data-tab="gear"]')?.click()});await w(200);
await pg.screenshot({path:S+'r6-11-town-after.png',fullPage:true});
R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close();
const fails=[];
if(R.hvWithoutDebug!=='undefined')fails.push('window.hv exposed without ?debug');
if(!R.spiritOn)fails.push('spirit stance');
if(!R.okClosed||!R.cancelClosed)fails.push('new-character dialog');
if(R.timings1x.some(t=>t.ms>300))fails.push('1x anim >300ms');
if(R.stats.clears<1||R.allHome.length)fails.push('clear/loot home');
if(errs.length)fails.push('page errors');
console.log(fails.length?'E2E FAIL: '+fails.join(', '):'E2E PASS');process.exit(fails.length?1:0);

// npm run e2e — headless end-to-end check against a running build (vite preview).
// Env: CHROME_PATH (default /usr/bin/google-chrome), E2E_URL (default http://127.0.0.1:5199/), E2E_SHOTS (default e2e-shots/).
import p from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const URL0=process.env.E2E_URL||'http://127.0.0.1:5199/';
const b=await p.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader'],defaultViewport:{width:1280,height:900}});
const w=ms=>new Promise(r=>setTimeout(r,ms));const S=(process.env.E2E_SHOTS||'e2e-shots')+'/';mkdirSync(S,{recursive:true});
const pg=await b.newPage();const errs=[];const consoleErrors=[];const httpErrors=[];
pg.on('console',m=>{if(m.type()==='error'){consoleErrors.push(m.text());errs.push(m.text())}});pg.on('pageerror',e=>{consoleErrors.push(String(e));errs.push(String(e))});pg.on('response',r=>{if(r.status()>=400){httpErrors.push(r.status()+' '+r.url());errs.push(r.status()+' '+r.url())}});pg.on('requestfailed',r=>{httpErrors.push('failed '+r.url());errs.push('failed '+r.url())});
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
// ---- CP3: fresh character — town locks, trip-1 tutorial, locked battle actions
R.cp3town=await pg.evaluate(()=>({alloc:!!document.querySelector('[data-locked="alloc"]'),shopTab:!!document.querySelector('[data-tab="shop"]'),iwTab:!!document.querySelector('[data-tab="iw"]'),locks:document.querySelector('.locks')?.textContent||''}));
await pg.screenshot({path:S+'cp3-01-town-locked.png'});
await pg.click('[data-start]');await w(300);
R.cp3trip=await pg.$eval('[data-trip]',x=>x.textContent).catch(()=>null);
R.cp3floors=await pg.evaluate(()=>hv.run.tower.floors.slice(1,4).map(f=>f.options.join('/')));
await pg.click('[data-node]');await w(1200);
R.cp3unlockLog=await pg.$$eval('.log [data-unlock]',xs=>xs.map(x=>x.textContent));
R.cp3spiritTitle=await pg.evaluate(()=>{hv.battle.oc=60;hv.render();return document.querySelector('[data-act="spirit"]').title});
await pg.screenshot({path:S+'cp3-02-trip1-battle.png'});
// back to a pre-CP3 (veteran) profile for the older checks below
await pg.evaluate(()=>{hv.data.run=null;hv.battle=null;hv.p.prog=undefined;hv.save();hv.go('town')});await w(200);
// ---- CP2 item 6: batch allocation (+1/+10/+最大, refunds)
await pg.evaluate(()=>{hv.p.exp+=300000;hv.go('town')});await w(200);
const A=()=>pg.evaluate(()=>({str:hv.p.attrs.str,dex:hv.p.attrs.dex}));R.cp2alloc={start:await A()};
await pg.click('[data-add="str"][data-n="1"]');await w(100);R.cp2alloc.p1=await A();
await pg.click('[data-add="str"][data-n="10"]');await w(100);R.cp2alloc.p10=await A();
await pg.click('[data-ref="str"][data-n="10"]');await w(100);R.cp2alloc.m10=await A();
await pg.click('[data-add="dex"][data-n="max"]');await w(100);R.cp2alloc.max=await A();R.cp2alloc.maxDisabled=await pg.$eval('[data-add="dex"][data-n="1"]',x=>x.disabled);
await pg.screenshot({path:S+'cp2-06-alloc.png'});
await pg.click('[data-ref="dex"][data-n="all"]');await w(100);R.cp2alloc.refundAll=await A();
await pg.click('[data-add="str"][data-n="10"]');await pg.click('[data-add="agi"][data-n="10"]').catch(()=>{});await w(100);
await pg.click('[data-resetall]');await w(150);R.cp2bResetModal=await pg.$eval('.modal',m=>m.textContent.replace(/\s+/g,' ').trim().slice(0,40)).catch(()=>null);
await pg.screenshot({path:S+'cp2b-06-resetall.png'});
await pg.click('[data-modal-ok]');await w(150);R.cp2bResetAttrs=await pg.evaluate(()=>Object.values(hv.p.attrs).every(v=>v===0));
// ---- CP2 item 1a: equipping a weaker item from town storage asks first
await pg.evaluate(()=>{const e=Object.values(hv.p.equipped).find(Boolean);const c=JSON.parse(JSON.stringify(e));c.id='cp2weak';c.name='CP2 弱化 '+c.name;for(const k of Object.keys(c.stats||{}))c.stats[k]=0;hv.p.inventory.push(c);hv.townTab='gear';hv.go('town')});await w(200);
await pg.click('[data-equip="cp2weak"]');await w(200);
R.cp2townModal=await pg.$eval('.modal',m=>m.textContent.replace(/\s+/g,' ').trim().slice(0,80)).catch(()=>null);
await pg.screenshot({path:S+'cp2-01-town-weaker.png'});
await pg.click('[data-modal-cancel]');await w(100);R.cp2townKept=await pg.evaluate(()=>hv.p.inventory.some(x=>x.id==='cp2weak'));
await pg.evaluate(()=>{hv.p.inventory=hv.p.inventory.filter(x=>x.id!=='cp2weak');hv.townTab='char';hv.go('town')});await w(100);
// battle 1
await pg.click('[data-start]');await w(400);
await pg.evaluate(()=>{const i=window.hv.run.nodes?.[window.hv.run.floor-1];});
await pg.click('[data-node]');await w(1500);
// item 2: disabled tooltip
R.disabled=await pg.$$eval('[aria-disabled="true"]',xs=>xs.map(x=>x.textContent.trim().slice(0,8)+' → '+x.title));
await pg.evaluate(()=>{hv.battle.oc=Math.max(hv.battle.oc,60);for(const m of hv.battle.monsters){m.maxHp*=50;m.hp=m.maxHp}hv.render()});await w(100); // CP3: OC starts at 0, Spirit needs 50
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
// CP3-fix 6: hotkeys with focus on a button / canvas, and with a Chinese IME (key='Process', code='KeyA')
await pg.waitForFunction(()=>!hv.busy,{timeout:8000}).catch(()=>{});
R.fix6=await pg.evaluate(async()=>{const out={};const t0=hv.battle.turn;document.querySelector('canvas')?.setAttribute('tabindex','0');document.querySelector('canvas')?.focus();
document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Process',code:'KeyA',bubbles:true,cancelable:true}));
await new Promise(r=>{const i=setInterval(()=>{if(!hv.busy){clearInterval(i);r();}},50);});out.imeTurnAdvanced=hv.battle.turn>t0||!!hv.battle.over;
const t1=hv.battle.turn;const btn=document.querySelector('[data-act="defend"]');btn?.focus();btn?.dispatchEvent(new KeyboardEvent('keydown',{key:'a',code:'KeyA',bubbles:true,cancelable:true}));
await new Promise(r=>{const i=setInterval(()=>{if(!hv.busy){clearInterval(i);r();}},50);});out.buttonFocusTurnAdvanced=hv.battle.turn>t1||!!hv.battle.over;return out;});
if(!R.fix6.imeTurnAdvanced||!R.fix6.buttonFocusTurnAdvanced)errs.push("CP3-fix 6 hotkey check failed "+JSON.stringify(R.fix6));
// item 3: regen in log
R.regenLines=await pg.$$eval('.regen',xs=>xs.map(x=>x.textContent).slice(0,3));
await pg.screenshot({path:S+'r6-03-regen-log.png'});
// 2x
await pg.evaluate(()=>{hv.stage.speed=2});await pg.keyboard.press('a');await w(2000);
R.timings2x=await pg.evaluate(()=>hv.stage.timings);
await pg.evaluate(()=>{hv.stage.skip=true});const t0=Date.now();await pg.keyboard.press('a');await w(50);
await pg.waitForFunction(()=>!hv.busy,{timeout:5000});R.skipMs=Date.now()-t0;R.timingsSkip=await pg.evaluate(()=>hv.stage.timings);
await pg.evaluate(()=>{hv.stage.skip=false;hv.stage.speed=1});
// ---- CP2 item 2: regen line lists HP/MP/SP
R.cp2regen=await pg.$$eval('.regen',xs=>xs.map(x=>x.textContent));
R.cp2cEnemyHits=await pg.$$eval('.enemyhit',xs=>xs.map(x=>x.textContent));
// ---- CP2 item 5: weakness HUD, 弱點 popup, charge decision
await pg.evaluate(()=>{const b=hv.battle;const m=b.monsters[hv.target]&&b.monsters[hv.target].hp>0?b.monsters[hv.target]:b.monsters.find(x=>x.hp>0);m.spec[b.d.damageType]=-25;m.evade=0;m.parry=0;m.hp=m.maxHp;hv.target=b.monsters.indexOf(m);hv.render()});await w(200);
R.cp2weakHud=await pg.$$eval('[data-weak]',xs=>xs.map(x=>x.textContent.trim()));
await pg.keyboard.press('a');await w(600);await pg.screenshot({path:S+'cp2-05-weak-popup.png'});
await pg.waitForFunction(()=>!hv.busy,{timeout:8000});
R.cp2weakLog=await pg.$$eval('.weakhit',xs=>xs.map(x=>x.textContent));
await pg.evaluate(()=>{const m=hv.battle.monsters.find(x=>x.hp>0);m.charge=1;hv.render()});await w(200);
R.cp2decide=await pg.$eval('[data-decide]',x=>x.textContent.trim()).catch(()=>null);
R.cp2suggest=await pg.$$eval('button.suggest',xs=>xs.map(x=>x.textContent.trim()));
await pg.screenshot({path:S+'cp2-05-charge-decision.png'});
await pg.evaluate(()=>{for(const m of hv.battle.monsters)m.charge=0;hv.render()});
// ---- CP2b item 5: potion cooldown as the player sees it (button label, key presses until usable)
await pg.evaluate(()=>{hv.stage.skip=true;for(const m of hv.battle.monsters){m.adb=0;if(m.hp>0){m.hp=m.maxHp=1e9}}hv.battle.potions.health=Math.max(1,hv.battle.potions.health);hv.battle.itemCd.health=0;hv.battle.hp=Math.round(hv.battle.d.hp/2);hv.render()});
await pg.keyboard.press('z');await pg.waitForFunction(()=>!hv.busy,{timeout:8000});await w(100);
R.cp2bPotion=[];for(let i=0;i<15;i++){const lab=await pg.$eval('[data-act="item:health"] small',x=>x.textContent);R.cp2bPotion.push(lab);if(!lab.startsWith('冷卻'))break;await pg.keyboard.press('a');await w(50);await pg.waitForFunction(()=>!hv.busy,{timeout:8000});await w(50);}
await pg.evaluate(()=>{hv.stage.skip=false});
// ---- CP2b item 6: one-click reset is checked in town (see cp2b-06)
// ---- CP2 item 1b: weaker loot asks first
await pg.evaluate(()=>{for(const m of hv.battle.monsters){if(m.hp>0)m.hp=1;m.evade=0;m.parry=0}});
for(let i=0;i<8&&!(await pg.evaluate(()=>!!hv.pending.loot));i++){await pg.keyboard.press('a');await w(300);await pg.waitForFunction(()=>!hv.busy,{timeout:8000}).catch(()=>{});await w(300);}
await pg.evaluate(()=>{const e=Object.values(hv.p.equipped).find(Boolean);const c=JSON.parse(JSON.stringify(e));c.id='cp2loot';c.name='CP2 弱化 '+c.name;for(const k of Object.keys(c.stats||{}))c.stats[k]=0;hv.run.bag.push(c);hv.pending.loot.equips.push(c);hv.render()});await w(200);
await pg.click('[data-bequip="cp2loot"]');await w(200);
R.cp2lootModal=await pg.$eval('.modal',m=>m.textContent.replace(/\s+/g,' ').trim().slice(0,80)).catch(()=>null);
await pg.screenshot({path:S+'cp2-01-loot-weaker.png'});
await pg.click('[data-modal-cancel]');await w(100);
await pg.evaluate(()=>{hv.run.bag=hv.run.bag.filter(x=>x.id!=='cp2loot');hv.pending.loot.equips=hv.pending.loot.equips.filter(x=>x.id!=='cp2loot');hv.render()});
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
R.cp3resultUnlock=await pg.$$eval('.result [data-unlock]',xs=>xs.map(x=>x.textContent));
await pg.click('[data-town]');await w(300);
R.cp3iw=await pg.evaluate(()=>{const t=document.querySelector('[data-tab="iw"]');if(!t)return null;t.click();return true});await w(200);
if(R.cp3iw){R.cp3iwBtn=await pg.$eval('[data-iw]',x=>x.textContent).catch(()=>null);const c0=await pg.evaluate(()=>hv.p.credits);await pg.click('[data-iw]').catch(()=>{});await w(200);R.cp3iwFree=(await pg.evaluate(()=>hv.p.credits))===c0;R.cp3iwNext=await pg.$eval('[data-iw]',x=>x.textContent).catch(()=>null);await pg.screenshot({path:S+'cp3-03-iw.png'});}
R.allHome=await pg.evaluate(ids=>ids.filter(id=>!hv.p.inventory.some(e=>e.id===id)&&!Object.values(hv.p.equipped).some(e=>e&&e.id===id)),bagSnap);
R.bagCount=bagSnap.length;R.stats=await pg.evaluate(()=>hv.data.stats);
await pg.evaluate(()=>{document.querySelector('[data-tab="gear"]')?.click()});await w(200);
await pg.screenshot({path:S+'r6-11-town-after.png',fullPage:true});
R.consoleErrors=consoleErrors;R.httpErrors=httpErrors;R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close();
const fails=[];
if(R.hvWithoutDebug!=='undefined')fails.push('window.hv exposed without ?debug');
if(!R.spiritOn)fails.push('spirit stance');
if(!R.okClosed||!R.cancelClosed)fails.push('new-character dialog');
if(R.timings1x.some(t=>t.ms>300))fails.push('1x anim >300ms');
if(R.stats.clears<1||R.allHome.length)fails.push('clear/loot home');
if(errs.length)fails.push('page errors');
if(consoleErrors.length)fails.push('console errors');if(httpErrors.length)fails.push('4xx/5xx');
const a=R.cp2alloc;if(a.p1.str!==a.start.str+1||a.p10.str!==a.p1.str+10||a.m10.str!==a.p10.str-10||!(a.max.dex>a.start.dex)||!a.maxDisabled||a.refundAll.dex!==0)fails.push('CP2 batch alloc');
if(!R.cp2townModal||!R.cp2townModal.includes('比較弱')||!R.cp2townKept)fails.push('CP2 town weaker modal');
if(!R.cp2lootModal||!R.cp2lootModal.includes('比較弱'))fails.push('CP2 loot weaker modal');
if(!R.cp2cEnemyHits.length||!R.cp2cEnemyHits.every(t=>/對你造成 \d+ 傷害/.test(t)))fails.push('CP2c enemy hit log');
if(!R.cp2regen.length||!R.cp2regen.every(t=>/HP \+\d+ · MP \+\d+ · SP \+\d+/.test(t)))fails.push('CP2 regen line');
if(!R.cp2weakHud.some(t=>t.includes('25%'))||!R.cp2weakLog.length)fails.push('CP2 weakness');
if(!R.cp2bResetModal||!R.cp2bResetAttrs)fails.push('CP2b reset all');
{const cd=R.cp2bPotion.filter(t=>t.startsWith('冷卻'));if(cd.length!==10||cd[0]!=='冷卻10'||cd[9]!=='冷卻1')fails.push('CP2b potion cooldown '+R.cp2bPotion.join(','));}
if(!R.cp2decide||!R.cp2suggest.some(t=>t.includes('防禦')))fails.push('CP2 charge decision');
{const t=R.cp3town;if(!t.alloc||t.shopTab||t.iwTab)fails.push('CP3 town locks');}
if(!R.cp3trip||!R.cp3trip.includes('×5'))fails.push('CP3 trip-1 carry multiplier (CARRY_MULT 5)');
if(R.cp3floors.join(',')!=='battle,merchant,elite')fails.push('CP3 tutorial floors '+R.cp3floors);
if(!R.cp3unlockLog.some(t=>t.includes('防禦'))||!R.cp3unlockLog.some(t=>t.includes('教學')))fails.push('CP3 unlock notice');
if(!R.cp3spiritTitle.includes('尚未解鎖'))fails.push('CP3 spirit locked');
if(!R.cp3resultUnlock.some(t=>t.includes('道具界'))||!R.cp3iw||!R.cp3iwFree||!R.cp3iwBtn?.includes('免費'))fails.push('CP3 IW unlock');
console.log(fails.length?'E2E FAIL: '+fails.join(', '):'E2E PASS');process.exit(fails.length?1:0);

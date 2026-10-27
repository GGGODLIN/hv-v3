// CP8 rc4 e2e (decision 2026-10-26 #2): the health-potion button lights (data-pothint) at HP < 50%, or < 75% while a foe charges;
// elite nodes carry 「危險，先備好藥」.  Usage: node scripts/cp8-rc4-pothint-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e))); const R = {};
await pg.goto(BASE + '?cp6&cp8&debug&preset=abyss20', { waitUntil: 'networkidle0' }); await w(300);
await pg.evaluate(() => { window.hv.p.potions.health = Math.max(3, window.hv.p.potions.health); });
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
while (await pg.$('[data-startpick] [data-buff]')) { await pg.click('[data-startpick] [data-buff]'); await w(150); }
R.elite = await pg.$$eval('button[data-node]', (n) => n.map((x) => [x.className.includes('n-elite'), !!x.querySelector('[data-elitedanger]')]));
R.eliteOk = R.elite.every(([e, d]) => e === d);
const i = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-(battle|elite)/.test(x.className))));
await pg.click(`button[data-node="${i}"]`); await w(600);
for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
// cp8-rc9 P0-2: the rule is now HP < 50% or HP − next-round estimate < 25% max HP, so each probe also fixes the foes' attack (adb).
const probe = (hp, charge, adb = 1) => pg.evaluate(([hp, charge, adb]) => { const a = window.hv, s = a.battle; s.hp = Math.round(s.d.hp * hp); s.itemCd.health = 0; s.monsters.forEach((m) => { if (m.hp > 0) { m.charge = charge; m.adb = adb === 'big' ? s.d.hp * 3 : adb; } }); a.render(); return !!document.querySelector('[data-pothint]'); }, [hp, charge, adb]);
R.inBattle = !!(await pg.$('.cmdbar'));
R.h40 = await probe(0.4, 0); R.h60 = await probe(0.6, 0); R.h60c = await probe(0.6, 1, 'big'); R.h80c = await probe(0.8, 1); R.h80big = await probe(0.8, 0, 'big'); R.h50big = await probe(0.5, 0, 'big');
R.errs = errs; console.log(JSON.stringify(R));
const ok = R.eliteOk && R.inBattle && /* rc19(a): lights only when chargeAdvice recommends Z (danger estimate), not on bare HP<50% */ !R.h40 && !R.h60 && R.h60c && !R.h80c && R.h80big && R.h50big && /* rc14 item 4: above 50% HP a full-heal potion would mostly be wasted → dark */ !errs.length;
console.log(ok ? 'CP8 RC4 POTHINT E2E PASS' : 'CP8 RC4 POTHINT E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

// cp8-rc17 e2e: weak/resist list gone (head labels keep the short form); encounter box shows at start and is gone after 2.5 s.
import p from 'puppeteer-core';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const pg = await b.newPage(); await pg.setViewport({width:1280,height:900});
const w = (ms) => new Promise((r) => setTimeout(r, ms));
await pg.goto((process.argv[2] ?? 'http://127.0.0.1:5199/') + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(300);
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { await (await pg.$('[data-startpick] [data-buff],[data-heldskip]')).click(); await w(150); }
await pg.evaluate(() => window.hv.startBattle('battle')); await w(500);
const fail = []; const lab = await pg.evaluate(() => (window.hv.stage.mons ?? []).map((v) => v.label.text).join(' '));
if (!(await pg.$('[data-encounter] [data-enemyelem], [data-encounter]'))) fail.push('encounter box missing at start');
if (await pg.$('[data-weak],[data-wk],[data-res]')) fail.push('weak/resist list still shown');
if (!/[弱抗]/.test(lab)) fail.push('head label short weak/resist missing');
await pg.screenshot({ path: '/tmp/enc-0.png' });
await w(2600); await pg.screenshot({ path: '/tmp/enc-3.png' }); if (await pg.$('[data-encounter]')) fail.push('encounter box still there after 2.5 s');
console.log(fail.length ? 'FAIL ' + fail.join(', ') : 'CP8 RC17 ENC E2E PASS'); await b.close(); process.exit(fail.length ? 1 : 0);


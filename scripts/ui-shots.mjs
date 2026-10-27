// rc17: before/after screenshots. node scripts/ui-shots.mjs <base> <label> <outdir>
import p from 'puppeteer-core';
const [BASE, L, OUT] = process.argv.slice(2);
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
for (const W of [1280, 913]) {
  const pg = await b.newPage(); await pg.setViewport({ width: W, height: 900 });
  const shot = async (n) => { await w(500); await pg.screenshot({ path: `${OUT}/${n}-${W}-${L}.png` }); };
  await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(400);
  await pg.evaluate(() => window.dispatchEvent(new Event('resize')));
  await shot('town');
  const g = await pg.$('[data-tab="gear"]'); if (g) { await g.click(); await shot('equip'); }
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { await (await pg.$('[data-startpick] [data-buff],[data-heldskip]')).click(); await w(150); }
  await shot('map');
  const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${ni}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  await shot('battle');
  await pg.keyboard.press('KeyA'); await w(350); await pg.screenshot({ path: `${OUT}/battle-float-${W}-${L}.png` });
  await pg.evaluate(() => { const s = window.hv.battle; const m = s.monsters.find((x) => x.hp > 0); m.charge = 1; s.hp = 1; window.hv.render(); });
  await shot('battle-danger');
  await pg.close();
}
await b.close(); console.log('shots done', L);

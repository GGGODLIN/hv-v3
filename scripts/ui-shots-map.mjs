// rc18 route map: before/after shots of the trial-tower map (fresh and mid-run) and the abyss map.
// node scripts/ui-shots-map.mjs <base> <label> <outdir>
import p from 'puppeteer-core';
const [BASE, L, OUT] = process.argv.slice(2);
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = async (pg) => { for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { await (await pg.$('[data-startpick] [data-buff],[data-heldskip]')).click(); await w(150); } };
for (const W of [1280, 913]) {
  const pg = await b.newPage(); await pg.setViewport({ width: W, height: 900 });
  await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(400);
  await pg.click('[data-start]'); await w(300); await ok(pg); await w(400);
  await pg.screenshot({ path: `${OUT}/maptrial-${W}-${L}.png` });
  // mid-run: pretend floors 1–3 were walked (display only; same path array the game writes)
  await pg.evaluate(() => { const h = window.hv, r = h.run; r.path = [0, 1, 0]; r.floor = 4; h.render(); }); await w(400);
  await pg.screenshot({ path: `${OUT}/maptrial-mid-${W}-${L}.png` });
  await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(400);
  await pg.click('[data-abyss]'); await w(300); await ok(pg); await w(400);
  await pg.screenshot({ path: `${OUT}/mapabyss-${W}-${L}.png` });
  await pg.close();
}
await b.close(); console.log('map shots done', L);

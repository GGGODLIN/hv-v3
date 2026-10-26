// CP8 rc5 e2e (playtest bug 2026-10-26): 「A·攻擊」 casts the staff quick spell only when the main hand is a staff — bulwark
// (1H) in 靈動架勢 must attack, and after 解除架勢 the button's subtitle must match what A does.  Usage: node scripts/cp8-rc5-quickcast-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(preset) {
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e))); const R = { preset };
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=${preset}`, { waitUntil: 'networkidle0' }); await w(300);
  R.main = await pg.evaluate(() => window.hv.p.equipped.mainHand?.group ?? 'none');
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const i = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${i}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  R.inBattle = !!(await pg.$('.cmdbar'));
  const step = async (spirit, forceStyle) => {
    const sub = await pg.evaluate(([sp, fs]) => { const a = window.hv, s = a.battle; s.spirit = sp; if (fs) s.d.style = fs; s.mp = s.d.mp; s.hp = s.d.hp; s.oc = Math.max(s.oc, 200); a.render(); return document.querySelector('[data-act="attack"] [data-quick]')?.textContent ?? ''; }, [spirit, forceStyle]);
    const n0 = await pg.evaluate(() => window.hv.log.length);
    await pg.keyboard.press('KeyA'); await w(900);
    const did = await pg.evaluate((n0) => window.hv.log.slice(n0).join(' '), n0);
    return { sub, fiery: /烈焰爆破/.test(did) };
  };
  R.spirit = await step(true); R.off = await step(false); if (R.main !== 'staff') R.forced = await step(true, 'staff'); // stale battle style must not cast
  R.errs = errs; await pg.close(); return R;
}
const bw = await run('postF20-bulwark'), ar = await run('postF20-arcane');
console.log(JSON.stringify({ bw, ar }));
const cons = (x) => (x.sub === '烈焰爆破') === x.fiery; // subtitle == action
const ok = bw.inBattle && ar.inBattle && bw.main !== 'staff' && !bw.spirit.fiery && !bw.off.fiery && bw.spirit.sub === '' && bw.off.sub === '' && !bw.forced.fiery && bw.forced.sub === ''
  && cons(ar.spirit) && cons(ar.off) && (ar.main !== 'staff' || ar.off.fiery) && !bw.errs.length && !ar.errs.length;
console.log(ok ? 'CP8 RC5 QUICKCAST E2E PASS' : 'CP8 RC5 QUICKCAST E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

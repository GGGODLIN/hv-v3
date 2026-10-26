// cp8-rc11 e2e (real UI, no injected battle state): 4(a) a blade / oc player who only presses A sees the skill-ready prompt and a
// marked Q button on the first turn OC reaches 25; 4(c) potion button reads 用完 (not 冷卻) once empty; 4(b) character tab shows 下一級 = EXP to earn.
// Battle state is only read, never written. Usage: node scripts/cp8-rc11-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 }, protocolTimeout: 60000 });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const idle = (pg) => pg.waitForFunction(() => !window.hv.busy, { timeout: 8000 }).catch(() => {});
async function open(preset) {
  const pg = await b.newPage(); pg.on('dialog', (d) => d.accept().catch(() => {})); pg.on('pageerror', (e) => errs.push(preset + ': ' + String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=${preset}`, { waitUntil: 'networkidle0' }); await w(500);
  return pg;
}
async function fight(pg) {
  const st = await pg.$('[data-start]'); if (st) { await st.click(); await w(400); }
  const all = await pg.$('[data-prep="all"]'); if (all) { await all.click(); await w(400); }
  const go = await pg.$('[data-abyss]'); if (go) { await go.click(); await w(400); }
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${ni}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
}
const look = (pg) => pg.evaluate(() => {  const s = window.hv.battle; const q = document.querySelector('[data-act="skill:shieldBash"]');
  return { oc: s?.oc ?? null, turn: s?.turn, ready: document.querySelector('[data-skillready]')?.dataset.skillready ?? (document.querySelector('[data-skillhint]')?.textContent.includes('Q·') ? 'shieldBash(hint)' : null), qbtn: !!q?.matches('[data-readybtn].suggest'), win: !!document.querySelector('[data-loot],[data-continue],.result') && !s }; });
for (const sc of ['blade', 'oc']) {
  const pg = await open('postF20-' + sc); const r = (R[sc] = { seen: null, trace: [] });
  // 4(b): character tab wording
  const tab = await pg.$('[data-tab="char"]'); if (tab) { await tab.click(); await w(300); }
  r.lvgap = await pg.evaluate(() => { const e = document.querySelector('[data-lvgap]'); return e ? e.textContent : null; });
  r.nextpoint = await pg.evaluate(() => document.querySelector('[data-nextpoint]')?.textContent ?? null);
  if (r.lvgap !== null && !/還要再獲得/.test(r.lvgap)) fail.push(`${sc} 4(b) wording`);
  const town = await pg.$('[data-tab="town"]'); if (town) { await town.click(); await w(200); }
  await fight(pg);
  for (let i = 0; i < 300; i++) {
    const x = await look(pg); r.trace.push(`${x.turn}:${x.oc}`); if (r.trace.length > 40) r.trace.shift();
    if (x.oc === null) { // battle over: walk the real post-battle UI to the next battle node (OC restarts at 0 each battle)
      for (let k = 0; k < 8 && !(await pg.evaluate(() => !!window.hv.battle)); k++) {
        const c = await pg.$('[data-continue]:not([disabled]),[data-modal-ok],[data-buffskip],[data-heldskip],[data-startpick] [data-buff]');
        if (c) { await c.click().catch(() => {}); await w(300); continue; }
        const ni = await pg.$$eval('button[data-node]:not([disabled])', (n) => n.findIndex((x) => /n-battle/.test(x.className)));
        const any = await pg.$$('button[data-node]:not([disabled])');
        if (any.length) { await any[Math.max(0, ni)].click().catch(() => {}); await w(500); continue; }
        break;
      }
      if (!(await pg.evaluate(() => !!window.hv.battle))) break;
      continue;
    }
    if (x.oc >= 25) { r.seen = x; break; }
    await pg.keyboard.press('a'); await w(80); await idle(pg); await w(80);
  }
  if (!r.seen) fail.push(`${sc} 4(a) OC never reached 25 by pressing A (${r.trace.join(' ')})`);
  else if (!r.seen.ready?.includes('shieldBash') || !r.seen.qbtn) fail.push(`${sc} 4(a) no prompt/button at OC ${r.seen.oc}`);
  // 4(c): drink until empty by pressing Z (only player input), check label never says 冷卻 while count is 0
  r.pot = [];
  for (let i = 0; i < 40; i++) {
    const t = await pg.evaluate(() => ({ n: window.hv.battle?.potions.health, small: document.querySelector('[data-act="item:health"] small')?.textContent, refused: document.querySelector('[data-refused],.refused')?.textContent ?? '' }));
    if (t.n === undefined) break; r.pot.push(`${t.n}:${t.small}`);
    if (t.n === 0) { r.empty = t; break; }
    await pg.keyboard.press(t.small?.startsWith('冷卻') ? 'd' : 'z'); await w(80); await idle(pg); await w(80);
  }
  if (r.empty && r.empty.small !== '用完') fail.push(`${sc} 4(c) empty label ${r.empty.small}`);
  if (r.empty) { await pg.keyboard.press('z'); await w(200); r.refusedTxt = await pg.evaluate(() => document.body.innerText.match(/[^\n]*沒有作用[^\n]*/)?.[0] ?? ''); if (/冷卻/.test(r.refusedTxt)) fail.push(`${sc} 4(c) refuse says 冷卻`); }
  await pg.close();
}
if (errs.length) fail.push('errs');
console.log(JSON.stringify({ R, errs }));
console.log(fail.length ? `E2E FAIL ${fail.join(' | ')}` : 'E2E PASS rc11 4(a)(b)(c)'); await b.close(); process.exit(fail.length ? 1 : 0);

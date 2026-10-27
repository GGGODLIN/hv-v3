// CP8 rc15 item 3 e2e (QA rc13 arcane playtest): outside HP danger the decide panel suggests A / a skill only — no D decision, no D highlight,
// no 「按 D·防禦」 payoff — whether the potion is usable, on cooldown, or used up. Danger + potion unusable → S / A (rc14).
// Usage: node scripts/cp8-rc15-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e))); const R = {};
await pg.goto(BASE + '?cp6&cp8&debug&preset=abyss20', { waitUntil: 'networkidle0' }); await w(300);
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
while (await pg.$('[data-startpick] [data-buff]')) { await pg.click('[data-startpick] [data-buff]'); await w(150); }
const i = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-(battle|elite)/.test(x.className))));
await pg.click(`button[data-node="${i}"]`); await w(600);
for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
// hp = fraction of max; pot: 'ok' | 'cd' | 'gone'; foes charge with a small attack (safe) unless big.
const probe = (hp, pot, big = false) => pg.evaluate(([hp, pot, big]) => { const a = window.hv, s = a.battle; s.hp = Math.round(s.d.hp * hp);
  s.potions.health = pot === 'gone' ? 0 : 3; s.itemCd.health = pot === 'cd' ? 3 : 0;
  s.monsters.forEach((m) => { if (m.hp > 0) { m.charge = 1; m.adb = big ? s.d.hp * 3 : 1; } }); a.render();
  const t = document.body.innerText; const dec = (t.match(/決策：[^\n]*/) ?? [''])[0];
  return { dec, dLit: !!document.querySelector('button[data-act="defend"].suggest'), payoff: /按 D·防禦/.test(t), safe: !!document.querySelector('[data-decide="safe"]') }; }, [hp, pot, big]);
for (const [hp, pot] of [[1, 'ok'], [1, 'cd'], [661 / 724, 'cd'], [0.79, 'gone'], [0.9, 'ok']]) {
  const r = await probe(hp, pot); R[`safe ${hp.toFixed(2)} ${pot}`] = r;
  r.pass = r.safe && !/D·防禦/.test(r.dec) && !r.dLit && !r.payoff && /A·攻擊/.test(r.dec);
}
for (const pot of ['cd', 'gone']) { const r = await probe(0.3, pot, true); R[`danger ${pot}`] = r; r.pass = !r.safe && /(S·靈動架勢|A·攻擊)/.test(r.dec) && !/決策：<?b?>?D/.test(r.dec) && !r.dLit; }
{ const r = await probe(0.3, 'ok', true); R['danger ok'] = r; r.pass = !r.safe && /Z·生命藥水/.test(r.dec); }
R.errs = errs; const ok = Object.values(R).every((r) => !r || r.pass !== false) && !errs.length;
console.log(JSON.stringify(R, null, 1)); console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1);

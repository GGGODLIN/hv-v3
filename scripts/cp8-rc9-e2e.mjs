// cp8-rc9 e2e: P0-1 蓄力一擊 panel + estimate, P1-9 relative ×, P1-10 wording, P1-11 Z queue / refusal, P2 prompts.
// Usage: node scripts/cp8-rc9-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
async function enter(preset) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(preset + ': ' + String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=${preset}`, { waitUntil: 'networkidle0' }); await w(300);
  await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.render(); });
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const info = await pg.evaluate(() => document.querySelector('[data-abyssrel]')?.textContent ?? document.querySelector('[data-abyssinfo]')?.textContent ?? '');
  const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${ni}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  return { pg, info };
}
const idle = (pg) => pg.waitForFunction(() => !window.hv.busy, { timeout: 5000 }).catch(() => {});
// P1-9: relative multiplier on the map (abyss d1 → ×1.00, never the raw ×2 base)
{ const { pg, info } = await enter('postF20-oc'); R.info = info;
  if (!/傷害 ×1\.00（相對深淵第 1 層）/.test(info)) fail.push('9 relative ×');
  // P0-1: elite whose hit ≥ 50% max HP winds up; panel shows 蓄力一擊 + estimate + payoff
  await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters.find((x) => x.hp > 0);
    s.monsters = [{ ...m, rank: 'elite', hp: 1e9, maxHp: 1e9, acc: 1e6, adb: m.adb, charge: 0, pulseNext: false, drainNext: false, heavyNext: false, sig: undefined, status: { ...m.status, stun: 0 } }];
    s.d = { ...s.d, evade: 0, parry: 0, block: 0 }; h.target = 0; h.render(); });
  // grow the hit until the estimate is ≥ 55% max HP (the battle's own estimator, no new numbers)
  await pg.evaluate(async () => { const s = window.hv.battle, m = s.monsters[0]; const est = window.__est ?? null; void est; for (let i = 0; i < 60 && !((m.adb ?? 1) > 0 && (window.hv.battle.hp > 0)); i++); });
  for (let i = 0; i < 40; i++) { const ok = await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters[0]; m.adb *= 1.4; s.hp = s.d.hp; h.render(); return !!document.querySelector('[data-chargeest]') || m.adb > 1e7; }); if (ok) break;
    const big = await pg.evaluate(() => { const s = window.hv.battle; return s.monsters[0].adb; }); void big; }
  await pg.evaluate(() => { const s = window.hv.battle; s.hp = s.d.hp; });
  for (let t = 0; t < 30 && !(await pg.$('[data-decide]')); t++) { await pg.evaluate(() => { const s = window.hv.battle; s.hp = s.d.hp; s.monsters[0].adb *= 1.3; }); await pg.keyboard.press('KeyF'); await idle(pg); await w(800); }
  R.heavy = await pg.evaluate(() => ({ txt: document.querySelector('[data-decide]')?.textContent ?? '', est: document.querySelector('[data-chargeest]')?.getAttribute('data-chargeest'), payoff: document.querySelector('[data-payoff]')?.textContent }));
  if (!/蓄力一擊/.test(R.heavy.txt) || !R.heavy.est || !R.heavy.payoff) fail.push('P0-1 heavy panel / estimate / payoff');
  // P1-11: Z queued while busy is not overwritten by A spam; Z with no potions shows a refusal note
  await pg.evaluate(() => { const s = window.hv.battle; s.monsters[0].adb = 1; s.monsters[0].heavyNext = false; s.potions.health = 2; s.itemCd.health = 0; s.hp = Math.round(s.d.hp * 0.5); window.hv.render(); });
  await w(900); await idle(pg);
  const p0 = await pg.evaluate(() => window.hv.battle.potions.health);
  await pg.keyboard.press('KeyF'); await w(5); await pg.keyboard.press('KeyZ'); for (let i = 0; i < 5; i++) { await w(10); await pg.keyboard.press('KeyA'); }
  await w(2500); await idle(pg);
  R.zq = { p0, p1: await pg.evaluate(() => window.hv.battle.potions.health) };
  if (!(R.zq.p1 < R.zq.p0)) fail.push('11 queued Z lost');
  await pg.evaluate(() => { const s = window.hv.battle; s.potions.health = 0; window.hv.render(); }); await w(900); await idle(pg);
  await pg.keyboard.press('KeyZ'); await w(300);
  R.refused = await pg.evaluate(() => document.querySelector('[data-refused]')?.textContent ?? '');
  if (!/Z·生命藥水沒有作用/.test(R.refused)) fail.push('11 refusal note');
  // P1-10: result wording (die)
  await pg.evaluate(() => { const s = window.hv.battle; s.monsters[0].adb = 1e9; s.d.hp = 1; s.hp = 1; s.potions.health = 0; window.hv.render(); });
  for (let i = 0; i < 10 && !(await pg.$('.result')); i++) { await pg.keyboard.press('KeyA'); await w(700); const c = await pg.$('[data-continue],[data-modal-ok]'); if (c) await c.click().catch(() => {}); }
  R.result = await pg.evaluate(() => document.querySelector('.result p')?.textContent ?? '');
  if (!/到達深淵第 \d+ 層（已通過 \d+ 層）/.test(R.result)) fail.push('10 wording');
  await pg.close(); }
// P2 arcane: spell suggestion on the target's elemental weakness
{ const { pg } = await enter('postF20-arcane');
  await pg.evaluate(() => { const h = window.hv, s = h.battle; s.mp = s.d.mp; h.render(); });
  R.arc = await pg.evaluate(() => ({ hint: document.querySelector('[data-spellhint]')?.textContent ?? '', weak: [...document.querySelectorAll('[data-wk]')].map((x) => x.getAttribute('data-wk')) }));
  const elw = R.arc.weak.some((x) => /^(fire|cold|elec|wind|holy|dark):/.test(x));
  // rc12 item 2: the hint is MP/splash-aware and stays silent unless a spell beats the quick-cast spell by >10%, so a weakness alone no longer forces it.
  if (R.arc.hint && !/建議|較高/.test(R.arc.hint)) fail.push('P2 arcane hint');
  R.arc.elw = elw;
  await pg.close(); }
// P2 blade: prompt when a skill comes off cooldown
{ const { pg } = await enter('postF20-blade');
  await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters.find((x) => x.hp > 0); s.monsters = [{ ...m, hp: 1e9, maxHp: 1e9, adb: 1 }]; s.oc = 999; for (const k of Object.keys(s.cooldowns)) s.cooldowns[k] = 1; /* rc12 kit-agnostic */ h.target = 0; h.render(); });
  await w(300); await pg.keyboard.press('KeyF'); await w(1500); await idle(pg);
  R.ready = await pg.evaluate(() => document.querySelector('[data-skillready]')?.textContent ?? '');
  if (!/冷卻結束/.test(R.ready)) fail.push('P2 skill ready');
  await pg.close(); }
await b.close();
console.log(JSON.stringify({ R, errs, fail }, null, 1));
console.log(fail.length || errs.length ? 'CP8-RC9 E2E FAIL' : 'CP8-RC9 E2E PASS');
process.exit(fail.length || errs.length ? 1 : 0);

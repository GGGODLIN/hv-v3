// cp8-rc10 e2e (real UI): P0-1 全部處理 on presets never buys blade/bulwark INT/WIS and leaves no 分配 row; P0-2 every postF20
// preset shows 3 HP potions in town and in battle; P0-3 a normal monster's big hit is wound up (decide panel) before it lands;
// P0-4 blade skill-ready prompt survives an OC-short turn and marks the button, arcane highlights the suggested spell button.
// Usage: node scripts/cp8-rc10-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const idle = (pg) => pg.waitForFunction(() => !window.hv.busy, { timeout: 5000 }).catch(() => {});
async function open(preset) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(preset + ': ' + String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=${preset}`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.render(); });
  return pg;
}
async function fight(pg) {
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${ni}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
}
const zText = (pg) => pg.evaluate(() => document.querySelector('[data-act="item:health"] small')?.textContent ?? '');
for (const sc of ['blade', 'oc', 'arcane', 'bulwark']) {
  const pg = await open('postF20-' + sc); const r = (R[sc] = {});
  r.town = await pg.evaluate(() => /❤(\d+)/.exec(document.querySelector('.town .head')?.textContent ?? '')?.[1]);
  if (r.town !== '3') fail.push(`${sc} P0-2 town ❤${r.town}`);
  // P0-1: 全部處理 through the real prep box
  r.base = await pg.evaluate(() => ({ ...window.hv.p.attrs }));
  await pg.evaluate(() => { const p = window.hv.p; p.exp += 30000; window.hv.render(); });
  const st = await pg.$('[data-start]'); if (st) { await st.click(); await w(400); }
  r.hasAll = !!(await pg.$('[data-prep="all"]')); if (r.hasAll) { await pg.click('[data-prep="all"]'); await w(500); }
  r.after = await pg.evaluate(() => ({ ...window.hv.p.attrs }));
  r.allocLeft = !!(await pg.$('[data-prep="alloc"]'));
  if (!r.hasAll) fail.push(`${sc} P0-1 no 全部處理`);
  if ((sc === 'blade' || sc === 'bulwark') && (r.after.int !== r.base.int || r.after.wis !== r.base.wis)) fail.push(`${sc} P0-1 bought INT/WIS`);
  if (r.allocLeft) fail.push(`${sc} P0-1 分配 row still open after 全部處理`);
  await pg.close();
  // P0-2 in battle (fresh preset again, no prep)
  const pb = await open('postF20-' + sc); await fight(pb); r.z = await zText(pb);
  if (r.z !== '×3') fail.push(`${sc} P0-2 battle Z ${r.z}`);
  await pb.close();
}
// P0-3: normal monster, worst hit ≥ 50% max HP → wound up (decide panel, HP untouched) before the hit
{ const pg = await open('postF20-bulwark'); await fight(pg);
  await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters.find((x) => x.hp > 0);
    s.monsters = [{ ...m, rank: 'normal', hp: 1e9, maxHp: 1e9, acc: 1e6, adb: m.adb * 200, charge: 0, heavyNext: false, pulseNext: false, status: { ...m.status, stun: 0 } }];
    s.d = { ...s.d, evade: 0, parry: 0, block: 0 }; s.hp = s.d.hp; h.target = 0; h.render(); });
  const hp0 = await pg.evaluate(() => window.hv.battle.hp);
  await pg.keyboard.press('KeyF'); await w(1200); await idle(pg);
  R.p03 = await pg.evaluate(() => ({ hp: window.hv.battle.hp, decide: document.querySelector('[data-decide]')?.textContent ?? '' }));
  if (R.p03.hp !== hp0 || !/蓄力一擊/.test(R.p03.decide)) fail.push('P0-3 normal big hit not wound up');
  await pg.close(); }
// P0-4 blade: skill comes off cooldown on a turn with no OC → prompt appears once OC is back
{ const pg = await open('postF20-blade'); await fight(pg);
  await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters.find((x) => x.hp > 0); s.monsters = [{ ...m, hp: 1e9, maxHp: 1e9, adb: 1 }]; s.oc = 0; s.cooldowns.vitalStrike = 1; h.target = 0; h.render(); });
  await w(300); await pg.keyboard.press('KeyF'); await w(1200); await idle(pg);
  R.b0 = await pg.evaluate(() => document.querySelector('[data-skillready]')?.textContent ?? '');
  await pg.evaluate(() => { const h = window.hv; h.battle.oc = 999; h.render(); }); await w(200);
  R.b1 = await pg.evaluate(() => ({ txt: document.querySelector('[data-skillready]')?.textContent ?? '', btn: document.querySelector('[data-readybtn]')?.getAttribute('data-act') ?? '' }));
  if (!/冷卻結束/.test(R.b1.txt) || !R.b1.btn) fail.push('P0-4 blade ready prompt lost on OC-short turn');
  await pg.keyboard.press('KeyA'); await w(1200); await idle(pg);
  R.b2 = await pg.evaluate(() => document.querySelector('[data-skillready]')?.textContent ?? '');
  if (R.b2) fail.push('P0-4 blade prompt repeats after it was shown');
  await pg.close(); }
// P0-4 arcane: hint + highlighted spell button on turn 0 of a real fight (full MP)
{ const pg = await open('postF20-arcane'); await fight(pg);
  R.arc = await pg.evaluate(() => ({ hint: document.querySelector('[data-spellhint]')?.getAttribute('data-spellhint') ?? '', btn: document.querySelector('[data-sugbtn]')?.getAttribute('data-act') ?? '', weak: [...document.querySelectorAll('[data-wk]')].map((x) => x.getAttribute('data-wk')) }));
  const elw = R.arc.weak.some((x) => /^(fire|cold|elec|wind|holy|dark):/.test(x));
  if (elw && (!R.arc.hint || R.arc.btn !== 'spell:' + R.arc.hint)) fail.push('P0-4 arcane hint/button');
  await pg.close(); }
// P1-9: an animation that never resolves (hidden tab / destroyed tween target) no longer blocks 繼續前進
{ const pg = await open('postF20-oc'); await fight(pg);
  await pg.evaluate(() => { const h = window.hv, s = h.battle; h.stage.play = () => new Promise(() => {}); h.stage.lootBeams = () => new Promise(() => {}); s.monsters.forEach((m) => { m.hp = 1; m.maxHp = 1; }); s.d = { ...s.d, acc: 1e6 }; h.render(); });
  const t0 = Date.now(); let ok = false;
  for (let i = 0; i < 25 && !ok; i++) { await pg.keyboard.press('KeyA'); await w(1000); ok = !!(await pg.$('[data-continue]')); }
  R.p19 = { ok, ms: Date.now() - t0, dbg: await pg.evaluate(() => ({ scr: window.hv.screen, busy: window.hv.busy, over: window.hv.battle?.over, hp: window.hv.battle?.monsters.map((m) => m.hp), turn: window.hv.battle?.turn })) }; if (!ok) fail.push('P1-9 繼續前進 never appeared with a hung animation');
  await pg.close(); }
await b.close();
console.log(JSON.stringify({ R, errs, fail }, null, 1));
console.log(fail.length || errs.length ? 'CP8-RC10 E2E FAIL' : 'CP8-RC10 E2E PASS');
process.exit(fail.length || errs.length ? 1 : 0);

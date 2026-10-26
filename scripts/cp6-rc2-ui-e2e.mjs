// CP6 rc2 UI fixes (a)(b)(d) e2e. Needs `npx vite --port 5198`.
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? process.env.E2E_URL ?? 'http://localhost:5198/'; // cp8-rc2: base URL no longer hard-coded
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 });
const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
pg.on('dialog', (d) => d.accept()); // cp8-rc2: rc3 added a 「確定不拿」 confirm on skip; an unhandled dialog froze evaluate (protocolTimeout)
await pg.goto(BASE + '?debug', { waitUntil: 'networkidle0' });
await pg.waitForFunction(() => window.hv); await pg.evaluate(() => localStorage.clear()); await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const res = {}; const fail = [];
// (d) map boss titles carry no signature icon
await pg.evaluate(() => { window.hv.startRun(); window.hv.go('map'); }); await w(300);
res.d = await pg.evaluate(() => [...document.querySelectorAll('[data-bosstitle]')].map((x) => x.textContent));
if (!res.d.length || res.d.some((t) => /[⟳⚡◆✦☠]/.test(t)) || !res.d.some((t) => t.includes('塔主'))) fail.push('d');
// (a) boss 3-pick pending -> continue disabled, click does nothing
await pg.evaluate(() => { const hv = window.hv; const r = hv.run; const i = r.tower.floors.findIndex((f) => f.options.includes('chest')); r.floor = i + 1; hv.enterNode(r.tower.floors[i].options.indexOf('chest')); });
await w(300);
await pg.evaluate(() => { const hv = window.hv; hv.run.offer = { src: 'boss', ids: ['B1', 'B2', 'B3'].filter(() => true) }; hv.render(); });
await w(200);
const ids = await pg.evaluate(() => [...document.querySelectorAll('[data-buff]')].map((x) => x.dataset.buff));
res.a1 = await pg.evaluate(() => { const b = document.querySelector('[data-continue]'); return { disabled: b.disabled, text: b.textContent, need: b.hasAttribute('data-needpick') }; });
await pg.evaluate(() => document.querySelector('[data-continue]').click()); await w(300);
res.a2 = await pg.evaluate(() => ({ screen: window.hv.screen, offer: !!window.hv.run.offer }));
await pg.screenshot({ path: '/tmp/rc2-a.png' });
await pg.evaluate(() => document.querySelector('[data-buffskip]').click()); await w(300);
res.a3 = await pg.evaluate(() => ({ disabled: document.querySelector('[data-continue]').disabled, offer: !!window.hv.run.offer }));
if (!res.a1.disabled || !res.a1.need || res.a2.screen !== 'node' || !res.a2.offer || res.a3.disabled || res.a3.offer) fail.push('a');
// (b) potion on cooldown is greyed and shows remaining turns
await pg.evaluate(() => { const hv = window.hv; hv.startRun(); hv.enterNode(0); }); await w(800);
await pg.evaluate(() => { const hv = window.hv; hv.battle.hp = Math.round(hv.battle.d.hp * 0.3); hv.command('item:health'); }); await w(1500);
res.b = await pg.evaluate(() => { const b = document.querySelector('[data-act="item:health"]'); return { cd: window.hv.battle?.itemCd.health, potcd: b?.dataset.potcd, aria: b?.getAttribute('aria-disabled'), small: b?.querySelector('small')?.textContent, suggest: b?.classList.contains('suggest'), bg: b && getComputedStyle(b).backgroundImage.slice(0, 24), icon: b && getComputedStyle(b.querySelector('.icon')).filter }; });
await pg.screenshot({ path: '/tmp/rc2-b.png' });
if (!(res.b.cd > 0) || res.b.potcd !== String(res.b.cd) || res.b.aria !== 'true' || !new RegExp(`^冷卻 ${res.b.cd}｜剩 \\d+$`).test(res.b.small) || res.b.suggest || !res.b.icon.includes('grayscale')) fail.push('b');
res.errs = errs; if (errs.length) fail.push('errs');
console.log(JSON.stringify(res)); console.log(fail.length ? `E2E FAIL ${fail}` : 'E2E PASS (a)(b)(d)'); await br.close(); process.exit(fail.length ? 1 : 0);

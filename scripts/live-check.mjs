// Slow-network load check: the #hvload loading text shows, then the town with the build badge. Prints PASS/FAIL, exit 0/1.
// post-rc9 #4: defaults (base http://localhost:5199/, out /tmp/live-check) so the e2e runner's `node live-check.mjs <base>` works.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:5199/', out = process.argv[3] ?? '/tmp/live-check';
mkdirSync(out, { recursive: true }); const errs = [];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pg = await b.newPage(); await pg.setViewport({ width: 1100, height: 760 });
pg.on('pageerror', (e) => errs.push(String(e)));
const cdp = await pg.target().createCDPSession();
await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 60000, uploadThroughput: 60000 });
pg.goto(url + '?t=' + Date.now()).catch(() => {});
const loadTxt = await pg.waitForSelector('#hvload', { timeout: 30000 }).then(() => pg.$eval('#hvload', (e) => e.textContent)).catch(() => null);
await pg.screenshot({ path: out + '/live-loading.png' });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
const town = await pg.waitForFunction(() => !document.querySelector('#hvload') && /build/.test(document.body.innerText), { timeout: 90000 }).then(() => true).catch(() => false);
await new Promise((r) => setTimeout(r, 1500));
const badge = await pg.evaluate(() => [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /^build /.test(e.textContent))?.textContent);
await pg.screenshot({ path: out + '/live-town-badge.png' });
const fail = [];
if (!loadTxt?.trim()) fail.push('no #hvload loading text on a slow network');
if (!town) fail.push('town never rendered after load');
if (!/^build /.test(badge ?? '')) fail.push('no build badge');
if (errs.length) fail.push('pageerror: ' + errs.slice(0, 3).join(' | '));
console.log(JSON.stringify({ loadTxt, badge, out, errs: errs.slice(0, 3) }));
await b.close();
console.log(fail.length ? `LIVE-CHECK FAIL: ${fail.join('; ')}` : 'LIVE-CHECK PASS'); process.exit(fail.length ? 1 : 0);

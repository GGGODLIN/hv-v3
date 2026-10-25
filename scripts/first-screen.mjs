// First-screen timing: ms from navigation start until #ui has visible text (main panel no longer black). Usage: node scripts/first-screen.mjs URL [runs=3] [shot.png]
import puppeteer from 'puppeteer-core';
const [url, runs = '3', shot] = process.argv.slice(2);
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
for (let i = 0; i < Number(runs); i++) {
  const ctx = await br.createBrowserContext(); const pg = await ctx.newPage(); await pg.setViewport({ width: 1280, height: 800 });
  await pg.evaluateOnNewDocument(() => { const t0 = performance.now(); const tick = () => { const u = document.getElementById('ui'); const l = document.getElementById('hvload');
      if (l && window.__load == null) window.__load = performance.now();
      if (u && !l && u.innerText.trim().length > 0 && window.__ui == null) window.__ui = performance.now(); if (window.__ui == null) requestAnimationFrame(tick); }; requestAnimationFrame(tick); void t0; });
  if (process.env.THROTTLE) { const c = await pg.createCDPSession(); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  const t = Date.now(); await pg.goto(url, { waitUntil: 'load', timeout: 60000 });
  await pg.waitForFunction(() => window.__ui != null, { timeout: 60000 });
  const r = await pg.evaluate(() => ({ ui: Math.round(window.__ui), load: window.__load == null ? null : Math.round(window.__load), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1) }));
  console.log(`${url} run${i + 1}: 主面板有字 ${r.ui} ms, 載入提示 ${r.load ?? '無'} ms, FCP ${r.fcp} ms, wall ${Date.now() - t} ms`);
  if (shot && i === 0) await pg.screenshot({ path: shot });
  await ctx.close();
}
await br.close();

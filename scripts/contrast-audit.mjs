// rc19 visual audit: WCAG text contrast on shop / 道具界 tabs and the prep modal. node scripts/contrast-audit.mjs <base> <label> <outdir>
// bg = median of pixels in the box of each element's own text nodes (Range rect) with all text hidden; fg = computed color (alpha-blended on bg). Text-shadow ignored (strict).
import p from 'puppeteer-core';
const [BASE, L, OUT] = process.argv.slice(2);
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const all = [];
async function audit(pg, name, W, scope = 'body') {
  await w(400); await pg.screenshot({ path: `${OUT}/${name}-${W}-${L}.png` });
  const els = await pg.evaluate((scope) => {
    const out = []; let id = 0;
    for (const el of document.querySelectorAll(scope + ' *')) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const rg = document.createRange(); const tn = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()); rg.setStartBefore(tn[0]); rg.setEndAfter(tn[tn.length - 1]); const r = rg.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || r.bottom < 0 || r.top > innerHeight) continue;
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) continue; // covered
      let clip = false; for (let e = el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (o !== 'visible') { const q = e.getBoundingClientRect(); if (r.y + r.height / 2 > q.bottom || r.y + r.height / 2 < q.top) { clip = true; break; } } } if (clip) continue; // clipped by a scroller
      let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      el.dataset.ctr = String(id);
      out.push({ id: id++, txt: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 40), cls: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '') + [...el.attributes].filter((a) => a.name.startsWith('data-') && a.name !== 'data-ctr').map((a) => `[${a.name}]`).join(''), color: cs.color, op, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight, x: r.x, y: r.y, w: r.width, h: r.height });
    }
    return out;
  }, scope);
  await pg.addStyleTag({ content: '* { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; } img { visibility: visible; }', }).then((h) => pg.evaluate((n) => n.setAttribute('id', 'ctrhide'), h));
  await w(100);
  const shot = await pg.screenshot({ encoding: 'base64' });
  await pg.evaluate(() => document.getElementById('ctrhide')?.remove());
  const res = await pg.evaluate(async (src, els) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    return els.map((e) => {
      const d = x.getImageData(Math.max(0, Math.round(e.x)), Math.max(0, Math.round(e.y)), Math.max(1, Math.round(e.w)), Math.max(1, Math.round(e.h))).data; const px = [];
      for (let i = 0; i < d.length; i += 16) px.push([d[i], d[i + 1], d[i + 2]]);
      px.sort((a, q) => lum(a) - lum(q)); const bg = px[px.length >> 1];
      const m = e.color.match(/[\d.]+/g).map(Number); const a = (m[3] ?? 1) * e.op; const fg = [0, 1, 2].map((k) => m[k] * a + bg[k] * (1 - a));
      const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const large = e.fs >= 24 || (e.fs >= 18.66 && e.fw >= 700);
      return { ...e, bg: `rgb(${bg.join(',')})`, fg: `rgb(${fg.map(Math.round).join(',')})`, ratio: +ratio.toFixed(2), need: large ? 3 : 4.5 };
    });
  }, shot, els);
  for (const r of res) all.push({ page: name, W, ...r });
}
for (const W of [1280, 913]) {
  const pg = await b.newPage(); await pg.setViewport({ width: W, height: 900 });
  await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(400);
  for (const t of ['shop', 'iw']) { const g = await pg.$(`[data-tab="${t}"]`); if (g) { await g.click(); await audit(pg, t, W); } else all.push({ page: t, W, missing: true }); }
  await pg.evaluate(() => { const a = window.hv, q = a.p; q.potions = { health: 1, mana: 0, spirit: 0 }; a.save(); a.render(); });
  await pg.click('[data-start]'); await w(400);
  if (await pg.$('[data-prep-towntip]')) await audit(pg, 'prep', W, '.modal'); else all.push({ page: 'prep', W, missing: true });
  await pg.close();
}
await b.close();
const bad = all.filter((r) => r.missing || r.ratio < r.need);
console.log(JSON.stringify(bad, null, 0).replace(/\},\{/g, '},\n{'));
console.log(`audit ${L}: ${all.length} text els, ${bad.length} below AA`);

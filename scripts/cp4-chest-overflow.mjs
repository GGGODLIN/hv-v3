// CP4-rc-fix 6 check: 40 chest nodes with 3 items + 5 buffs; every 立刻換上 / 繼續前進 must be reachable (scrolled) and the power-down confirm OK must be on top.
import puppeteer from 'puppeteer-core';
const url = process.argv[2], out = process.argv[3];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pg = await b.newPage(); await pg.setViewport({ width: 1100, height: 760 });
await pg.goto(url + '?debug', { waitUntil: 'networkidle0' });
const res = [];
for (let s = 0; s < 40; s++) {
  res.push(await pg.evaluate(() => {
    const hv = window.hv; hv.data.run = null; hv.startRun();
    const r = hv.run; r.buffs = ['B2', 'W4', 'O3', 'A2', 'B5'];
    r.tower.floors[0].options[0] = 'chest'; hv.enterNode(0);
    const panel = document.querySelector('.panel.node'); const pr = panel.getBoundingClientRect();
    panel.scrollTop = panel.scrollHeight; const hidden = [...document.querySelectorAll('[data-bequip],[data-continue]')].filter((el) => { const q = el.getBoundingClientRect(); const t = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return t !== el; }).map((el) => el.dataset.bequip ? 'equip' : 'continue');
    return { n: hv.pending.loot.equips.length, scrollH: panel.scrollHeight, h: Math.round(pr.height), hidden };
  }));
}
console.log(JSON.stringify(res.filter((x) => x.hidden.length || x.scrollH > x.h + 2).slice(0, 5)), res.length);
const r2 = await pg.evaluate(() => { const hv = window.hv; for (let k = 0; k < 60; k++) { hv.data.run = null; hv.startRun(); const r = hv.run; r.tower.floors[0].options[0] = 'chest'; hv.enterNode(0); const e = hv.pending.loot.equips.find((x) => hv.powerDelta(x) < 0); if (e) { document.querySelector(`[data-bequip="${e.id}"]`).click(); const ok = document.querySelector('[data-modal-ok]'); if (!ok) return { k, modal: false }; const q = ok.getBoundingClientRect(); const t = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return { k, modal: true, okHit: t === ok, top: t?.className || t?.tagName }; } } return 'none'; });
console.log(JSON.stringify(r2));
await pg.screenshot({ path: out });
await b.close();

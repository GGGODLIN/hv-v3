// cp7-rc3: headless REAL-PATH abyss trip. Drives the live App (window.hv) in a browser: town -> startAbyss -> enterNode ->
// startBattle -> command() per turn -> endBattle -> node screen -> continueNode. Decisions come from the same sim AI
// (decide / pickOption / prefBuff), so any gap vs scripts/cp7-sim.ts is state or live-only logic, not AI.
// prep=sim: town prep like autoRun (alloc, equip, buy 3 HP potions; equip loot / buy potions mid-run). prep=raw: none (a player who skips them).
// Needs /src modules, i.e. a `vite` dev server. post-rc9 #4: if [base] does not serve /src (a built preview such as the e2e runner's),
// the script starts its own vite dev server from this repo on a free port and drives that; prints PASS/FAIL and exits 0/1.
// PASS = every run finishes without a script error or pageerror and reports a cleared depth. Usage: node scripts/cp7-live-path.mjs [base] [N] [prep] [presets,...]
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
let BASE = process.argv[2] ?? 'http://localhost:5199/'; let dev = null;
const servesSrc = await fetch(new URL('src/core/auto.ts', BASE)).then((r) => r.ok && /javascript/.test(r.headers.get('content-type') ?? '')).catch(() => false);
if (!servesSrc) { dev = await createServer({ root: new URL('..', import.meta.url).pathname, server: { port: 0, host: '127.0.0.1', strictPort: false }, logLevel: 'error' }); await dev.listen();
  BASE = dev.resolvedUrls.local[0]; console.log(`(${process.argv[2] ?? 'default base'} has no /src → own vite dev server ${BASE})`); }
const N = Number(process.argv[3] ?? 4), PREP = process.argv[4] ?? 'sim';
const KEYS = (process.argv[5] ?? 'postF20-blade,postF20-oc,postF20-arcane,postF20-bulwark').split(',');
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const out = [];
for (const k of KEYS) for (let s = 1; s <= N; s++) {
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&cp7&debug&preset=${k}`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
  const r = await pg.evaluate(async (seed, prep, key) => {
    const hv = window.hv; const A = await import('/src/core/auto.ts'); const R = await import('/src/core/run.ts'); const { Rng } = await import('/src/core/rng.ts');
    const P = await import('/src/core/player.ts'); const U = await import('/src/core/progress.ts'); const BO = await import('/src/core/buffoffer.ts'); const BF = await import('/src/core/buffs.ts');
    const pre = JSON.parse(JSON.stringify((await (await fetch('/data/cp6-presets.json')).json())[key]));
    const strat = `buff:${pre.school}`; const prng = new Rng(seed * 7919 + 1);
    hv.data.settings.skipAnim = true; hv.stage.skip = true; hv.stage.speed = 8;
    if (!R.RULES.cp7) return { err: 'cp7 off' };
    const has = (f) => U.has(hv.p, f);
    if (prep === 'sim') { if (has('alloc')) A.autoAllocate(hv.p); A.autoEquip(hv.p, [], A.gearStyle(strat)); while (hv.p.potions.health < 3 && hv.p.credits >= R.RULES.potionPrice.health) { hv.p.credits -= R.RULES.potionPrice.health; hv.p.potions.health++; } }
    const st0 = { lv: P.level(hv.p), pots: { ...hv.p.potions }, hp: R.runDerived(hv.p, R.startAbyss(JSON.parse(JSON.stringify(hv.p)), 1, 1)).hp };
    hv.startAbyss(); const run = hv.run; const bosses = []; let guard = 0;
    while (hv.data.run && !hv.run.done && guard++ < 2000) {
      const r = hv.run; if (R.depthOf(r) > 30) break;
      const opt = A.pickOption(hv.p, r, strat); const t = r.tower.floors[r.floor - 1].options[opt];
      await hv.enterNode(opt);
      if (hv.battle) {
        const b = hv.battle; const d = R.depthOf(r); let n = 0;
        while (hv.battle && !hv.battle.over && n++ < 400) { const a = A.decide(hv.battle, strat, 'counter'); if ('target' in a) hv.target = a.target;
          const cmd = a.kind === 'skill' || a.kind === 'spell' || a.kind === 'item' ? `${a.kind}:${a.id}` : a.kind; await hv.command(cmd); }
        if (t === 'boss') bosses.push({ d, won: b.over === 'win', turns: b.turn, buffs: r.buffs?.length ?? 0 });
        if (b.over !== 'win') break;
        if (prep === 'sim') { const used = A.autoEquip(hv.p, r.bag, A.gearStyle(strat)); r.bag = r.bag.filter((e) => !used.includes(e)); }
        let g = 0; while (r.offer && g++ < 5) { const id = A.prefBuff(r.offer.ids, strat, prng); if (id) { BO.takeBuff(hv.p, r, id); r.risk = null; } else BO.skipOffer(r); if (r.offer && !id) r.offer = null; hv.nextOffer(); }
        if (r.hp < R.runDerived(hv.p, r).hp * 0.3 && t === 'boss') { r.done = 'retreat'; hv.endRun(); break; }
      } else if (t === 'chest') { if (prep === 'sim') { const used = A.autoEquip(hv.p, r.bag, A.gearStyle(strat)); r.bag = r.bag.filter((e) => !used.includes(e)); } }
      else if (t === 'merchant') { if (prep === 'sim') while (hv.p.potions.health < 4 && hv.pay(R.RULES.potionPrice.health)) hv.p.potions.health++;
        for (const x of r.buffStock ?? []) { const ok = BF.BUFF[x.id]?.school === pre.school; if (ok && !x.sold && hv.pay(x.price)) { BO.takeBuff(hv.p, r, x.id); x.sold = true; } } }
      else if (t === 'rest') { const d = R.runDerived(hv.p, r); R.rest(hv.p, r, r.hp < d.hp * 0.8 || !hv.p.equipped.mainHand ? 'heal' : 'upgrade', 'mainHand'); }
      else if (t === 'shrine') { r.risk = null; let g = 0; while (r.offer && g++ < 3) { const id = A.prefBuff(r.offer.ids, strat, prng); if (id) BO.takeBuff(hv.p, r, id); r.offer = null; } }
      if (hv.data.run && !hv.run.done && (hv.screen === 'node' || !hv.battle)) hv.continueNode();
    }
    const cleared = R.abyssCleared(run);
    return { key, seed, st0, start: run.abyss.start ?? null, cleared, bosses, cp7: R.RULES.cp7 };
  }, s, PREP, k).catch((e) => ({ key: k, seed: s, err: String(e) }));
  r.errs = errs.slice(0, 3); out.push(r); console.log(JSON.stringify(r)); await pg.close();
}
await br.close(); if (dev) await dev.close();
const bad = out.filter((r) => r.err || r.errs.length || typeof r.cleared !== 'number');
console.log(bad.length ? `CP7-LIVE-PATH FAIL: ${bad.length}/${out.length} runs: ${bad.map((r) => `${r.key}#${r.seed} ${r.err ?? r.errs[0] ?? 'no cleared'}`).join(' | ')}` : `CP7-LIVE-PATH PASS (${out.length} runs)`);
process.exit(bad.length ? 1 : 0);

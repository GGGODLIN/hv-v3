/** rc11: the map body scrolls; centre the current floor instead of leaving it at the top (20F). */
export function scrollToCurrentFloor(root: ParentNode): void {
  const cur = root.querySelector<HTMLElement>('.panel.map .floor.cur'); const box = cur?.closest<HTMLElement>('.tower');
  if (!cur || !box) return;
  // rc18: rect-based so it works whether or not .tower is the offsetParent (it is position:relative for the route overlay)
  const bb = box.getBoundingClientRect(); const k = box.offsetHeight / (bb.height || 1);
  const top = (cur.getBoundingClientRect().top - bb.top) * k + box.scrollTop;
  box.scrollTop = Math.max(0, top - (box.clientHeight - cur.offsetHeight) / 2);
}

/**
 * 自訂，非原版：rc18 route map. Presentation only — draws connection lines between floors in an SVG overlay
 * inside `.tower`, from measured node centres. Map rules are unchanged: every option on floor n is reachable
 * from every option on floor n−1, so future floors are drawn all-to-all (faint), the last chosen node fans out
 * to every current option (bright), and past floors join chosen→chosen (gold).
 */
let last: [ParentNode, readonly number[], number] | null = null;
export function drawRoutes(root: ParentNode, path: readonly number[], cur: number): void {
  if (!last && typeof window !== 'undefined') window.addEventListener('resize', () => last && drawRoutes(...last));
  last = [root, path, cur];
  const box = root.querySelector<HTMLElement>('.panel.map .tower'); if (!box) return;
  box.querySelector('svg.routes')?.remove();
  const nodes = new Map<number, HTMLElement[]>();
  for (const el of box.querySelectorAll<HTMLElement>('.node[data-f]')) { const f = +el.dataset.f!; (nodes.get(f) ?? nodes.set(f, []).get(f)!)[+el.dataset.i!] = el; }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'routes'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', String(box.scrollWidth)); svg.setAttribute('height', String(box.scrollHeight));
  box.prepend(svg); const br = svg.getBoundingClientRect(); const k = box.scrollWidth / (br.width || 1); // measure against the overlay itself; k undoes any CSS scale on the app
  const pt = (el: HTMLElement, top: boolean) => { const r = el.getBoundingClientRect(); return [(r.left - br.left + r.width / 2) * k, ((top ? r.top : r.bottom) - br.top) * k] as const; };
  const line = (a: HTMLElement, b: HTMLElement, cls: string) => {
    const [x1, y1] = pt(a, true), [x2, y2] = pt(b, false); const my = (y1 + y2) / 2;
    const e = document.createElementNS(ns, 'path'); e.setAttribute('d', `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`); e.setAttribute('class', cls); e.setAttribute('data-edge', `${a.dataset.f}.${a.dataset.i}-${b.dataset.f}.${b.dataset.i}`); svg.appendChild(e);
  };
  const fs = [...nodes.keys()].sort((a, b) => a - b);
  for (const n of fs) {
    const lo = nodes.get(n)!, hi = nodes.get(n + 1); if (!hi) continue;
    if (n + 1 < cur) { const a = lo[path[n - 1]!], b = hi[path[n]!]; if (a && b) line(a, b, 'e-past'); }
    else if (n + 1 === cur) { const a = lo[path[n - 1]!]; if (a) for (const b of hi) if (b) line(a, b, 'e-next'); }
    else for (const a of lo) for (const b of hi) if (a && b) line(a, b, 'e-future');
  }
}

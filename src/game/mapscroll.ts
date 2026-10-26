/** rc11: the map body scrolls; centre the current floor instead of leaving it at the top (20F). */
export function scrollToCurrentFloor(root: ParentNode): void {
  const cur = root.querySelector<HTMLElement>('.panel.map .floor.cur'); const box = cur?.closest<HTMLElement>('.tower');
  if (!cur || !box) return;
  box.scrollTop = Math.max(0, cur.offsetTop - box.offsetTop - (box.clientHeight - cur.offsetHeight) / 2);
}

// Exact v054 display-only normalization for frozen pre-v054 source audits.
export function beforeGoldCapWarning(source,path) {
  if(path==='src/ui.js') source=source.replace("  const goldAtCapacity = state.hero.gold >= 1e12;\n  $('gold-cap-warning').hidden = !goldAtCapacity;\n  $('gold-cap-warning').textContent = goldAtCapacity ? '金幣已達保存上限。擊殺與通關超額不入帳，也不會補發；建議先消費再遠征。出售若無法完整入帳會保留裝備。' : '';\n",'');
  if(path==='index.html') source=source.replace("      <p id=\"gold-cap-warning\" class=\"muted\" role=\"status\" hidden></p>\n",'');
  return source;
}

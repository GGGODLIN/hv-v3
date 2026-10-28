// Exact inverse for historical artwork byte assertions only; no live test uses reverted behavior.
const changes={
  "src/ui.js": [
    [
      "    const sell = node('button', 'secondary-button', '出售'); sell.disabled = !tabOwner || bound || item.locked || isGearSetProtected(state,item.id) || state.mode === 'battle'; sell.addEventListener('click', () => { if (Object.hasOwn(item, 'soulbound')) return; if (!dispatch('sell', item.id)) return; if (state.inventory.some(current => current.id === item.id)) { showToast('未出售這件裝備；請確認保護狀態及金幣保存上限。'); render(true); return; } selectedId = null; render(true); }); actions.append(equip, lock, sell);\n",
      "    const sell = node('button', 'secondary-button', '出售'); sell.disabled = !tabOwner || bound || item.locked || isGearSetProtected(state,item.id) || state.mode === 'battle'; sell.addEventListener('click', () => { if (Object.hasOwn(item, 'soulbound')) return; dispatch('sell', item.id); selectedId = null; render(true); }); actions.append(equip, lock, sell);\n"
    ]
  ],
  "src/engine.js": [
    [
      "// Manual sale must never consume items for proceeds that cannot round-trip a save.\nfunction canCreditManualSale(s, total) {\n  return Number.isFinite(s.hero.gold) && s.hero.gold >= 0 && Number.isSafeInteger(total) && total >= 0 && s.hero.gold + total <= 1e12;\n}\n",
      ""
    ],
    [
      "    if(!canCreditManualSale(s,total))return s;\n",
      ""
    ],
    [
      "  if(action==='sell'&&item&&!boundMetadata(item)&&!item.locked&&!isGearSetProtected(s,item.id)){const total=Math.max(1,Math.round(item.level*3+item.power));if(!canCreditManualSale(s,total))return s;s.hero.gold+=total;s.inventory.splice(s.inventory.indexOf(item),1);refillPending(s);return s;}\n  if(action==='sellCommon'){const sold=s.inventory.filter(i=>!boundMetadata(i)&&!i.locked&&!isGearSetProtected(s,i.id)&&['Crude','Fair','Average'].includes(i.quality));const total=sold.reduce((n,i)=>n+Math.max(1,Math.round(i.level*3+i.power)),0);if(!canCreditManualSale(s,total))return s;s.hero.gold+=total;s.inventory=s.inventory.filter(i=>!sold.includes(i));refillPending(s);log(s,`整理了 ${sold.length} 件普通裝備；鎖定裝備均保留。`);}\n",
      "  if(action==='sell'&&item&&!boundMetadata(item)&&!item.locked&&!isGearSetProtected(s,item.id)){s.hero.gold+=Math.max(1,Math.round(item.level*3+item.power));s.inventory.splice(s.inventory.indexOf(item),1);refillPending(s);return s;}\n  if(action==='sellCommon'){const sold=s.inventory.filter(i=>!boundMetadata(i)&&!i.locked&&!isGearSetProtected(s,i.id)&&['Crude','Fair','Average'].includes(i.quality));s.hero.gold+=sold.reduce((n,i)=>n+Math.max(1,Math.round(i.level*3+i.power)),0);s.inventory=s.inventory.filter(i=>!sold.includes(i));refillPending(s);log(s,`整理了 ${sold.length} 件普通裝備；鎖定裝備均保留。`);}\n"
    ]
  ]
};
export function beforeManualSaleCap(source,path){for(const [current,previous] of changes[path]||[])source=source.replace(current,previous);return source;}

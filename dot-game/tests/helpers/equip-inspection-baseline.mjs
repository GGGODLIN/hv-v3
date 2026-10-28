import assert from 'node:assert/strict';
const before="if (!dispatch('equip', item.id)) return; selectedId = null; showToast(`已裝備「${item.name}」`); render(true);";
const after="if (selectedId !== item.id || selectedSlot || !state.inventory.some(current => current.id === item.id)) return; if (!dispatch('equip', item.id)) return; if (state.equipment[item.slot]?.id !== item.id) { showToast('未換上這件裝備；請回營後重新選取。'); render(true); return; } selectedId = null; selectedSlot = item.slot; showToast(`已裝備「${item.name}」`); render(true);";
export function beforeEquipInspection(source,path){if(path!=='src/ui.js')return source;assert.equal(source.split(after).length-1,1);return source.replace(after,before);}

// Reverse only exact protection-view delta for historical artwork pins.
const changes={
  "src/ui.js": [
    [
      "    protection: choice('protection-filter', ['all', 'protected', 'unprotected']),\n",
      ""
    ],
    [
      "  const protectedItem = (filters.protection === 'protected' || filters.protection === 'unprotected') && (!!item.locked || Object.hasOwn(item, 'soulbound') || isGearSetProtected(state, item.id));\n  if (filters.protection === 'protected' && !protectedItem) return false;\n  if (filters.protection === 'unprotected' && protectedItem) return false;\n",
      ""
    ],
    [
      "  return [({ protected: '受保護裝備', unprotected: '未受保護裝備' })[filters.protection] || '', filters.name ? `名稱含「${filters.name}」` : '', filters.quality && filters.quality !== 'all' ? `${qualityName(filters.quality)}品質` : '', filters.slot !== 'all' ? slotNames[filters.slot] : '',\n",
      "  return [filters.name ? `名稱含「${filters.name}」` : '', filters.quality && filters.quality !== 'all' ? `${qualityName(filters.quality)}品質` : '', filters.slot !== 'all' ? slotNames[filters.slot] : '',\n"
    ],
    [
      "  for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter', 'protection-filter']) $(id).value = 'all';\n",
      "  for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter']) $(id).value = 'all';\n"
    ],
    [
      "for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter', 'protection-filter', 'sort-select']) $(id).addEventListener('change', () => render(true));\n",
      "for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter', 'sort-select']) $(id).addEventListener('change', () => render(true));\n"
    ]
  ],
  "index.html": [
    [
      "        <div class=\"loot-tools loot-investment-filters\"><label for=\"protection-filter\">保護狀態<select id=\"protection-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部保護狀態</option><option value=\"protected\">受保護（鎖定／綁定／配裝）</option><option value=\"unprotected\">未受保護</option></select></label><label for=\"quality-filter\">品質<select id=\"quality-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部品質</option></select></label><label for=\"family-filter\">武器路線<select id=\"family-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部路線／部位</option><option value=\"axe\">戰斧</option><option value=\"rapier\">刺劍</option><option value=\"club\">戰棍</option><option value=\"unknown\">未辨識武器</option></select></label><label for=\"investment-filter\">投入狀態<select id=\"investment-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部投入狀態</option><option value=\"unbound\">未綁定裝備</option><option value=\"bound\">已綁定・未升 IW</option><option value=\"iw1\">IW1 已完成</option></select></label></div>\n",
      "        <div class=\"loot-tools loot-investment-filters\"><label for=\"quality-filter\">品質<select id=\"quality-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部品質</option></select></label><label for=\"family-filter\">武器路線<select id=\"family-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部路線／部位</option><option value=\"axe\">戰斧</option><option value=\"rapier\">刺劍</option><option value=\"club\">戰棍</option><option value=\"unknown\">未辨識武器</option></select></label><label for=\"investment-filter\">投入狀態<select id=\"investment-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">全部投入狀態</option><option value=\"unbound\">未綁定裝備</option><option value=\"bound\">已綁定・未升 IW</option><option value=\"iw1\">IW1 已完成</option></select></label></div>\n"
    ]
  ]
};
export function beforeProtectionFilter(source,path){for(const [current,previous] of changes[path]||[])source=source.replace(current,previous);return source;}

// Reverse only exact name-search UI/HTML/CSS delta for historical pins.
const changes = {
  "src/ui.js": [
    [
      "    quality: choice('quality-filter', ['all', ...QUALITY_TIERS.map(tier => tier.name)]),\n    name: ($('name-filter')?.value || '').trim().toLowerCase()\n",
      "    quality: choice('quality-filter', ['all', ...QUALITY_TIERS.map(tier => tier.name)])\n"
    ],
    [
      "  if (filters.name && !String(item.name || '').toLowerCase().includes(filters.name)) return false;\n",
      ""
    ],
    [
      "  return [filters.name ? `名稱含「${filters.name}」` : '', filters.quality && filters.quality !== 'all' ? `${qualityName(filters.quality)}品質` : '', filters.slot !== 'all' ? slotNames[filters.slot] : '',\n",
      "  return [filters.quality && filters.quality !== 'all' ? `${qualityName(filters.quality)}品質` : '', filters.slot !== 'all' ? slotNames[filters.slot] : '',\n"
    ],
    [
      "  if ($('name-filter')) $('name-filter').value = '';\n",
      ""
    ],
    [
      "$('name-filter').addEventListener('input', () => render(true));\n",
      ""
    ]
  ],
  "index.html": [
    [
      "        <div class=\"loot-tools inventory-name-filter\"><label for=\"name-filter\">搜尋裝備名稱<input id=\"name-filter\" type=\"search\" autocomplete=\"off\" placeholder=\"例如：追風、刺劍\" aria-describedby=\"inventory-name-help\"></label></div>\n        <p id=\"inventory-name-help\" class=\"panel-description\">名稱包含輸入文字，不分大小寫；與下方篩選同時符合才顯示。只搜尋背包，不會自動出售。</p>\n",
      ""
    ]
  ],
  "style.css": [
    [
      "\n/* Transient literal-name lookup; scoped to the inventory workbench. */\n.loot-workbench .inventory-name-filter { grid-template-columns: minmax(0, 1fr); }\n.inventory-name-filter label { display: grid; gap: 5px; min-width: 0; font-size: 12px; }\n.inventory-name-filter input { width: 100%; min-width: 0; min-height: 40px; padding: 9px 10px; color: var(--text); background: #17282e; border: 1px solid var(--line); border-radius: 7px; }\n.inventory-name-filter input::placeholder { color: var(--muted); }\n",
      ""
    ]
  ]
};
export function beforeNameSearch(source,path){ for(const [current,previous] of changes[path] || []) source=source.replace(current,previous); return source; }

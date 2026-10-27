// Reverse only exact v044 filter delta for historical art/controller pins.
export function beforeQualityFilter(source) {
  source = source.replace("    investment: choice('investment-filter', ['all', 'unbound', 'bound', 'iw1']),\n    quality: choice('quality-filter', ['all', ...QUALITY_TIERS.map(tier => tier.name)])\n", "    investment: choice('investment-filter', ['all', 'unbound', 'bound', 'iw1'])\n");
  source = source.replace("  if (filters.quality && filters.quality !== 'all' && item.quality !== filters.quality) return false;\n", "");
  source = source.replace("  return [filters.quality && filters.quality !== 'all' ? `${qualityName(filters.quality)}\u54c1\u8cea` : '', filters.slot !== 'all' ? slotNames[filters.slot] : '',\n", "  return [filters.slot !== 'all' ? slotNames[filters.slot] : '',\n");
  source = source.replace("  for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter']) $(id).value = 'all';\n", "  for (const id of ['slot-filter', 'family-filter', 'investment-filter']) $(id).value = 'all';\n");
  source = source.replace("for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'quality-filter', 'sort-select']) $(id).addEventListener('change', () => render(true));\nfor (const tier of QUALITY_TIERS) { const option=node('option','',`${tier.label} \u00b7 ${tier.name}`); option.value=tier.name; $('quality-filter').append(option); }\n", "for (const id of ['slot-filter', 'family-filter', 'investment-filter', 'sort-select']) $(id).addEventListener('change', () => render(true));\n");
  return source;
}

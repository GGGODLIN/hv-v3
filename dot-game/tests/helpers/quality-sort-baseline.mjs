// Reverse only quality-sort UI delta for historical source pins.
export function beforeQualitySort(source) {
  source = source.replace("  // Stable sort retains latest-acquired order within the same quality.\n  if (sort === 'quality') items.sort((a, b) => QUALITY_TIERS.findIndex(tier => tier.name === b.quality) - QUALITY_TIERS.findIndex(tier => tier.name === a.quality));\n", "");
  return source;
}

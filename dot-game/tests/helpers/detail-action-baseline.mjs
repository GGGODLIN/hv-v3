// Reverse only the exact v043 focus delta for historical controller/art pins.
export function beforeDetailActionFocus(source) {
  source = source.replace("// Preserve keyboard position in the exact item's basic actions after repaint.\nconst detailActionButtons = new Map();\nfunction captureDetailActionFocus() {\n  const button = document.activeElement;\n  if (!comparisonButtonVisible(button)) return null;\n  for (const [action, entry] of detailActionButtons) if (entry.button === button) return { action, ...entry };\n  return null;\n}\nfunction restoreDetailActionFocus(previous) {\n  if (!previous || previous.button.isConnected === true) return;\n  const active = document.activeElement;\n  if (active && active !== previous.button && active !== document.body && active !== document.documentElement) return;\n  const entry = detailActionButtons.get(previous.action);\n  const sameAction = entry?.id === previous.id ? entry.button : null;\n  const sameItem = Object.values(comparisonButtons).map(buttons => buttons.get(previous.id));\n  [sameAction, ...sameItem, $('slot-filter'), $('settings-toggle')].find(comparisonButtonVisible)?.focus({ preventScroll: true });\n}\n", "");
  source = source.replace("  const detailActionFocus = captureDetailActionFocus();\n", "");
  source = source.replace("  restoreDetailActionFocus(detailActionFocus);\n", "");
  source = source.replace("  detailActionButtons.clear();\n", "");
  source = source.replace("\n    for (const [action, button] of [['equip', equip], ['lock', lock], ['sell', sell]]) detailActionButtons.set(action, { id: item.id, button });", "");
  return source;
}

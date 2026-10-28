// Reverse only the exact v048 display changes for historical artwork byte pins.
export function beforeStatDelta(source) {
  source = source.replace("// Signed absolute stat changes, not a relative percentage gain. Never round a\n// real change into a zero or equal sign; tiny changes remain directionally clear.\nfunction statDeltaText(key, difference, equal = '\u2014') {\n  if (difference === 0) return equal;\n  const magnitude = Math.abs(difference) * (rateStats.has(key) ? 100 : 1);\n  const digits = magnitude < 0.0001 ? '<0.0001' : String(Number(magnitude.toFixed(4)));\n  return `${difference > 0 ? '+' : '-'}${digits}${rateStats.has(key) ? ' \u767e\u5206\u9ede' : ''}`;\n}\n", "");
  source = source.replace("    const delta = statDeltaText(key, diff, '\u76f8\u540c');\n", "    const delta = diff === 0 ? '\u76f8\u540c' : `${diff > 0 ? '+' : ''}${number(diff)}${rateStats.has(key) ? ' \u9ede' : ''}`;\n");
  source = source.replace("    const delta = selectedSlot ? '\u2014' : statDeltaText(key, diff);\n", "    const delta = selectedSlot || Math.abs(diff) < .0001 ? '\u2014' : `${diff > 0 ? '+' : ''}${rateStats.has(key) ? `${(diff * 100).toFixed(1)}%` : key === 'parry' ? diff.toFixed(1) : Math.round(diff)}`;\n");
  return source;
}

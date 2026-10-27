// Exact approved v040 delta only; retain historical art/controller byte pins.
export function beforeEventObservationReset(source) {
  const helper="// A validated replacement restarts transient engine event IDs. Only a new\n// journey object resets observation; ownership changes on the same object must\n// retain deduplication or old rewards would play again.\nfunction resetEventObservation() {\n  seenEvents.clear();\n  for (const event of state.events || []) seenEvents.add(String(event.id));\n  lastProcessedEvent = null;\n}\n";
  const result=source.replace(helper,'').replaceAll(' resetEventObservation();','');
  return result;
}

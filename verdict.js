// Final result is decided here, in code. Never trust the model's own verdict.
// RETAKE  : KOT unreadable or no items found
// WRONG   : any item not ok, any extra item, or cake message not ok / na
// CORRECT : everything else
export function decide(r) {
  const items = r.items || [];
  if (r.kot_readable === false || items.length === 0) return 'RETAKE';

  const itemsBad = items.some((i) => i.status !== 'ok');
  const extras = (r.extra_items || []).filter((x) => x && String(x).trim());
  const msg = (r.cake_message && r.cake_message.status) || 'na';
  const msgBad = !['ok', 'na'].includes(msg);

  return itemsBad || extras.length > 0 || msgBad ? 'WRONG' : 'CORRECT';
}

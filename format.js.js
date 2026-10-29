// Builds the WhatsApp reply text. Keep it short: staff read it on a phone.
export function format(verdict, r) {
  if (verdict === 'RETAKE') {
    return 'RETAKE: could not read the KOT clearly. Please retake with the slip flat and in focus.';
  }

  const lines = (r.items || []).map((i) => {
    const mark = i.status === 'ok' ? '\u2713' : '\u2717';
    const note = i.status === 'unclear' ? ' (cannot see clearly)' : '';
    return `${mark} ${i.name}: KOT ${i.expected_qty}, photo ${i.found_qty}${note}`;
  });

  (r.extra_items || [])
    .filter((x) => x && String(x).trim())
    .forEach((x) => lines.push('\u2717 Extra item not on KOT: ' + x));

  const m = r.cake_message || {};
  if (m.status !== 'na' || m.expected) {
    const ok = ['ok', 'na'].includes(m.status);
    lines.push(
      `${ok ? '\u2713' : '\u2717'} Cake message: KOT '${m.expected || 'none'}', photo '${m.found || '-'}'`
    );
  }

  const head = verdict === 'CORRECT' ? '\u2713 CORRECT' : '\u2717 WRONG';
  return `${head} (Order #${r.order_id || '-'})\n` + lines.join('\n');
}

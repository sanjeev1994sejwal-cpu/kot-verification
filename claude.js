const API_URL = 'https://api.anthropic.com/v1/messages';

const ONE_PHOTO =
  'The photo shows a printed bakery KOT (kitchen order ticket) together with the packed order.';
const TWO_PHOTOS =
  'Image 1 is a printed bakery KOT (kitchen order ticket). Image 2 is the packed order.';

const RULES = [
  'First read the KOT: order number, items with quantities, and any message to be written on the cake.',
  'Then check the packed order against it: identify each item, count quantities, and read any text on the cake or board.',
  'Be strict: the cake message must match the KOT in wording and spelling (ignore letter case).',
  'Include flavour and weight when judging an item.',
  'If the KOT cannot be read, set kot_readable to false.',
  'If something cannot be seen clearly enough to verify, give it the status "unclear".',
  'Item statuses: ok, wrong, missing, unclear.',
  'Cake message statuses: ok, wrong, missing, unclear, na (na = the KOT has no message and none is written).',
  'Reply with JSON only, no other text:',
  '{"kot_readable":true,"order_id":"","items":[{"name":"","expected_qty":0,"found_qty":0,"status":"","note":""}],',
  '"extra_items":[""],"cake_message":{"expected":"","found":"","status":""},"summary":"one short sentence"}',
].join(' ');

function parseJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON in model reply');
  return JSON.parse(text.slice(start, end + 1));
}

async function callOnce(jpegBuffers) {
  const intro = jpegBuffers.length === 2 ? TWO_PHOTOS : ONE_PHOTO;
  const content = [
    ...jpegBuffers.map((buf) => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: buf.toString('base64') },
    })),
    { type: 'text', text: intro + ' ' + RULES },
  ];

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const err = new Error('Claude API error ' + res.status);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const text = data.content.map((c) => c.text || '').join('');
  return parseJson(text);
}

// jpegBuffers: [items] for one-photo mode, or [kot, items] for two-photo mode.
// Retries once on rate limit or server error.
export async function checkPhotos(jpegBuffers) {
  try {
    return await callOnce(jpegBuffers);
  } catch (e) {
    if (e.status === 429 || e.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000));
      return callOnce(jpegBuffers);
    }
    throw e;
  }
}

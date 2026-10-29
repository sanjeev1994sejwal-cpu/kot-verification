const graph = () => `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v21.0'}`;
const auth = () => ({ Authorization: 'Bearer ' + process.env.WA_TOKEN });

export async function reply(to, body) {
  const res = await fetch(`${graph()}/${process.env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { ...auth(), 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  if (!res.ok) console.error('WhatsApp send failed', res.status, await res.text());
}

// Media URLs expire quickly, so download right away.
export async function downloadMedia(mediaId) {
  const metaRes = await fetch(`${graph()}/${mediaId}`, { headers: auth() });
  if (!metaRes.ok) throw new Error('Media lookup failed ' + metaRes.status);
  const meta = await metaRes.json();
  const fileRes = await fetch(meta.url, { headers: auth() });
  if (!fileRes.ok) throw new Error('Media download failed ' + fileRes.status);
  return Buffer.from(await fileRes.arrayBuffer());
}

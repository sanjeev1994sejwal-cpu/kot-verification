import express from 'express';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { checkPhotos } from './claude.js';
import { decide } from './verdict.js';
import { format } from './format.js';
import { reply, downloadMedia } from './whatsapp.js';
import { holdKot, takeKot } from './pairing.js';
import { logCheck } from './log.js';

const app = express();

const staff = new Set(
  (process.env.STAFF_NUMBERS || '').split(',').map((s) => s.trim()).filter(Boolean)
);
const seen = new Set(); // WhatsApp can deliver the same message twice

const HELP =
  'Send ONE photo with the KOT slip placed next to the open box.\n' +
  'If the slip does not fit: send the KOT photo with the caption "kot", then the photo of the items.';

app.get('/health', (_req, res) => res.send('ok'));

// One-time webhook verification when you register the URL in Meta
app.get('/webhook', (req, res) => {
  const q = req.query;
  if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    return res.status(200).send(q['hub.challenge']);
  }
  res.sendStatus(403);
});

function validSignature(req) {
  const expected =
    'sha256=' + crypto.createHmac('sha256', process.env.APP_SECRET).update(req.body).digest('hex');
  const got = String(req.headers['x-hub-signature-256'] || '');
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Incoming messages. Raw body is kept so the signature can be verified.
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  if (!validSignature(req)) return res.sendStatus(401);
  res.sendStatus(200); // answer fast, do the work in the background

  let body;
  try {
    body = JSON.parse(req.body);
  } catch {
    return;
  }
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (msg) handle(msg).catch((e) => console.error('handle error', e));
});

async function toJpeg(raw) {
  return sharp(raw).rotate().resize(1600, 1600, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();
}

async function handle(msg) {
  if (seen.has(msg.id)) return;
  seen.add(msg.id);
  if (seen.size > 5000) seen.clear();

  const from = msg.from;
  if (!staff.has(from)) return; // ignore anyone not on the staff list
  if (msg.type !== 'image') return reply(from, HELP);

  try {
    const caption = (msg.image.caption || '').trim().toLowerCase();
    const jpeg = await toJpeg(await downloadMedia(msg.image.id));

    // Two-photo mode, step 1: hold the KOT photo
    if (caption.startsWith('kot')) {
      holdKot(from, jpeg);
      return reply(from, 'KOT received. Now send the photo of the packed items.');
    }

    await reply(from, 'Checking...');
    const kot = takeKot(from);
    const result = await checkPhotos(kot ? [kot, jpeg] : [jpeg]);
    const verdict = decide(result);

    await reply(from, format(verdict, result));
    await logCheck({ from, order: result.order_id || null, verdict, mode: kot ? 'two' : 'one', result });
  } catch (e) {
    console.error('check failed', e);
    await reply(from, 'Could not check this one. Please send the photo again.');
  }
}

app.listen(process.env.PORT || 3000, () => console.log('Listening'));

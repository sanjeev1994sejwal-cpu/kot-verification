// Two-photo mode: staff send the KOT photo with the caption "kot",
// then the packed-items photo within 5 minutes.
const WINDOW_MS = 5 * 60 * 1000;
const held = new Map(); // sender -> { jpeg, t }

export function holdKot(sender, jpeg) {
  held.set(sender, { jpeg, t: Date.now() });
}

export function takeKot(sender) {
  const h = held.get(sender);
  held.delete(sender);
  return h && Date.now() - h.t < WINDOW_MS ? h.jpeg : null;
}

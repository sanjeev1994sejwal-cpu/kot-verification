# Bakery Packing Check (WhatsApp bot)

Staff send a photo of the packed order with its KOT slip. The bot replies
**CORRECT**, **WRONG** or **RETAKE**, with a line for each item and the cake message.

## How staff use it
1. One photo: put the KOT slip next to the open box and send the photo.
2. If the slip does not fit: send the KOT photo with the caption `kot`, then the photo of the items (within 5 minutes).
3. Read the reply. Fix anything marked with a cross, then send a new photo.

## Directory
```
bakery-packing-check/
├── package.json
├── .env.example
├── src/
│   ├── server.js     webhook, signature check, message handling
│   ├── claude.js     prompt and Claude API call
│   ├── verdict.js    CORRECT / WRONG / RETAKE rules
│   ├── format.js     WhatsApp reply text
│   ├── whatsapp.js   send message, download photo
│   ├── pairing.js    two-photo mode
│   └── log.js        writes data/checks.jsonl
├── test/verdict.test.js
└── docs/PRD.md
```

## Setup
1. Install Node.js 20.6 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and fill it in.
4. `npm test` (checks the verdict rules; needs no keys)
5. `npm run dev` for local use, `npm start` on a server.

## WhatsApp (Meta) setup, in short
Confirm each step in Meta's current WhatsApp Cloud API documentation.
1. Create an app at Meta for Developers and add the WhatsApp product.
2. Use a number that is registered for the Cloud API (not the WhatsApp Business app).
3. Create a permanent access token (System User) and put it in `WA_TOKEN`. Put the phone number ID in `WA_PHONE_ID` and the app secret in `APP_SECRET`.
4. Deploy this app on a server with HTTPS.
5. In the app settings set the webhook callback URL to `https://YOUR-DOMAIN/webhook`, use your `VERIFY_TOKEN`, and subscribe to the `messages` field.
6. Add staff numbers to `STAFF_NUMBERS`.

## Deploy
Any host that runs Node and gives you an HTTPS URL works. Set the variables from `.env.example`
as environment variables on the host. Health check: `GET /health`.
Note: `data/checks.jsonl` is stored on the server disk. Many hosts wipe the disk on redeploy,
so use a database or Google Sheet for a permanent log.

## Before you rely on it
- Confirm the current model name for `CLAUDE_MODEL` and the Graph API version in their docs.
- Run the 20-photo acceptance test (see test/photos/README.md) and record the results.
- The check is done by AI and can misread handwriting or icing text. Keep a human spot check.
- Measure the cost: Claude API usage plus WhatsApp message charges.
- Keep keys only in environment variables. Never commit `.env`.

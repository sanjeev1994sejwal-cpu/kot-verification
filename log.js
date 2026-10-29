import { appendFile, mkdir } from 'node:fs/promises';

// One JSON object per line. Easy to open in Excel / Google Sheets later.
// Replace with a database or sheet if you need sharing across servers.
export async function logCheck(entry) {
  await mkdir('data', { recursive: true });
  const row = { t: new Date().toISOString(), ...entry };
  await appendFile('data/checks.jsonl', JSON.stringify(row) + '\n');
}

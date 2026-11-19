// shots.mjs — capture the app's four views in headless Chrome at 1280x800 and convert to JPEG.
// Run `node tools/shots.mjs` while `node serve.ts` is up on localhost:8080.
//
// The views (shareable via URL hash):
//   1-checklist.jpg  the checklist with a trophy's guide and sources open (cover)
//   2-roadmap.jpg    the platinum roadmap
//   3-missables.jpg  the missables view
//   4-spoiler.jpg    the spoiler setting at work (story trophies hidden)
//
// Chrome is driven with its own --screenshot flag; the PNG is then resized/requantized to a small JPEG
// with Python's PIL so every file stays well under the 256 KiB cap.

import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shotsDir = join(root, 'screenshots');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(shotsDir, { recursive: true });

// name -> URL hash. The detail open is driven with the #trophy= hash; the spoiler view is the default
// checklist with "Hide spoilers" on (its default), showing story trophies as "Hidden trophy".
const views = [
  ['1-checklist', 'demo+trophy=Positive%20Mental%20Attitude'],
  ['2-roadmap', 'demo+roadmap'],
  ['3-missables', 'demo+missables'],
  ['4-spoiler', 'demo+checklist'],
];

const TMP = 'C:/Users/meow/AppData/Local/hermes/profiles/build/cache/scratch';
mkdirSync(TMP, { recursive: true });

for (const [stem, hash] of views) {
  const png = join(TMP, `${stem}.png`);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1280,800', `--screenshot=${png}`,
    `http://localhost:8080/#${hash}`,
  ], { stdio: 'ignore' });
  console.log(`captured ${stem}.png`);
}

console.log('now convert with tools/convert-shots.py');

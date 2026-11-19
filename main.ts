// main.ts — hand in the gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// This directory holds the guide: `app/` is a static, offline web app a browser opens at app/index.html
// (ES modules + CSS, no build step), and `screenshots/` holds 3 or 4 PNG/JPEG captures of it running.
// This program copies both into the output directory and writes `dossier.json` — the summary the judge
// reads — with the vendored make.fun library.
//
// Leave vendor/makefun-frontend.ts byte for byte as it is: the scorer rebuilds the dossier with its own
// copy and requires the two to match exactly.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const indexHtml = join(here, 'app', 'index.html');

// Fail loudly, with a clear message, when the page is missing — better than the scorer's refusal.
if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
  console.error(`main.ts: app/index.html is missing — the entry needs its page at app/index.html`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });

// Copy the app and the screenshots beside this file into the output directory.
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

if (existsSync(join(here, 'screenshots'))) {
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than 993 files+directories in app/, more than
// 48 MiB of app files, or a path over 1,000 UTF-8 bytes).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log(`wrote ${dossierPath} (${dossier.length} bytes)`);
console.log(`copied app/ and screenshots/ to ${out}`);

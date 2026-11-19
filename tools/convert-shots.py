#!/usr/bin/env python3
# convert-shots.py — resize/requantize the Chrome PNG captures into small JPEGs under 256 KiB,
# verifying each is 1280x800 and a valid JPEG. Reads the PNGs written by tools/shots.mjs from
# the scratch dir and writes screenshots/1-*.jpg … 4-*.jpg.

import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH = os.path.join(os.environ.get("LOCALAPPDATA", "C:/Users/meow/AppData/Local"),
                       "hermes", "profiles", "build", "cache", "scratch")
OUT = os.path.join(ROOT, "screenshots")

SHOTS = [
    ("1-checklist", "1-checklist.jpg"),
    ("2-roadmap", "2-roadmap.jpg"),
    ("3-missables", "3-missables.jpg"),
    ("4-spoiler", "4-spoiler.jpg"),
]

os.makedirs(OUT, exist_ok=True)

for stem, out_name in SHOTS:
    png = os.path.join(SCRATCH, stem + ".png")
    if not os.path.exists(png):
        print(f"MISSING {png} — run `node tools/shots.mjs` first", file=sys.stderr)
        sys.exit(1)
    im = Image.open(png).convert("RGB")
    assert im.size == (1280, 800), f"{stem}: expected 1280x800, got {im.size}"
    out_path = os.path.join(OUT, out_name)
    # quality 80 keeps us well under 256 KiB for these screens.
    im.save(out_path, "JPEG", quality=80, optimize=True, progressive=False)
    size = os.path.getsize(out_path)
    print(f"{out_name}: {im.size} -> {size} bytes")
    assert size < 200 * 1024, f"{out_name}: {size} bytes over 200 KiB target"
    # re-open to confirm it parses as a JPEG
    Image.open(out_path).verify()

print("all screenshots written and verified under 256 KiB")

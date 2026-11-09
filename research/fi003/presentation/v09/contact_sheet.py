#!/usr/bin/env python3
"""Build a full-deck contact sheet PNG from a directory of per-slide PNGs.

Usage: python3 contact_sheet.py <png_dir> <out.png> [cols]
Pages are read in filename order. Requires Pillow.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

src, out = Path(sys.argv[1]), Path(sys.argv[2])
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
pages = sorted(src.glob("*.png"))
if not pages:
    sys.exit("no PNG pages found")
thumb_w = 640
gap, label_h = 16, 22
imgs = []
for p in pages:
    im = Image.open(p).convert("RGB")
    h = round(im.height * thumb_w / im.width)
    imgs.append(im.resize((thumb_w, h), Image.LANCZOS))
th = imgs[0].height
rows = -(-len(imgs) // cols)
sheet = Image.new("RGB", (cols * (thumb_w + gap) + gap, rows * (th + label_h + gap) + gap), (236, 236, 236))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(imgs):
    x = gap + (i % cols) * (thumb_w + gap)
    y = gap + (i // cols) * (th + label_h + gap)
    d.text((x, y + 4), f"Slide {i + 1}", fill=(60, 60, 60))
    sheet.paste(im, (x, y + label_h))
    d.rectangle([x - 1, y + label_h - 1, x + thumb_w, y + label_h + th], outline=(190, 190, 190))
sheet.save(out, optimize=True)
print(f"{out} {sheet.size[0]}x{sheet.size[1]} ({len(imgs)} slides)")

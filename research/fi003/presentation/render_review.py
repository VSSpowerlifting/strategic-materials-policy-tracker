#!/usr/bin/env python3
"""Render the exact current PDF for visual QC; no chart/data reconstruction."""
from pathlib import Path
import fitz
from PIL import Image, ImageOps

root=Path(__file__).resolve().parents[1]
out=root/'outputs/presentation-draft-v04'
pdf=fitz.open(out/'SMPT_FI003_JPMorgan_MP_Draft_v04.pdf')
assert len(pdf)==15
sheet=Image.new('RGB',(3*768,5*432),(216,211,199))
for i,page in enumerate(pdf):
    pix=page.get_pixmap(matrix=fitz.Matrix(1.2,1.2))
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    if i+1 in (3,11,13):im.save(out/f'preview-slide-{i+1:02}.png')
    thumb=im.resize((760,424),Image.Resampling.LANCZOS)
    sheet.paste(thumb,((i%3)*768+4,(i//3)*432+4))
sheet.save(out/'contact-sheet.jpg',quality=85,optimize=True)
print('Rendered 15-slide contact sheet and exact-PDF previews for 3, 11, 13')

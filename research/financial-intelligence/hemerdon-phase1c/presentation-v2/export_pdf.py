"""Finalize LibreOffice PDF link colors, metadata and render QA images (no financial edits)."""
import argparse,json
from pathlib import Path
from pypdf import PdfReader,PdfWriter
from pypdf.generic import ContentStream,FloatObject
import subprocess,os
from PIL import Image,ImageOps,ImageDraw
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);a=p.parse_args();d=a.directory
src=d/'.build/SMPT_FI001_Hemerdon_Presentation_v2.pdf';dest=d/'SMPT_FI001_Hemerdon_Presentation_v2.pdf'
r=PdfReader(src);w=PdfWriter();w.clone_document_from_reader(r);old=tuple(n/255 for n in (0x46,0x78,0x86));count=0
for i,page in enumerate(w.pages):
 stream=ContentStream(page.get_contents(),w);rgb=(0xE3,0xB0,0x4B) if i in (0,13) else (0x7A,0x55,0x10)
 for values,op in stream.operations:
  if op in (b'rg',b'RG') and len(values)==3 and all(abs(float(v)-o)<.0001 for v,o in zip(values,old)):
   values[:]=[FloatObject(v/255) for v in rgb];count+=1
 page.replace_contents(stream)
w.add_metadata({'/Title':"Inside Tungsten West's £71 Million Restart Financing",'/Author':'Benjamin Yang / Strategic Materials Policy Tracker','/Subject':'Presentation v2 candidate. Government Capital, Project Expenditure and Refinancing Risk at Hemerdon. Research cutoff 4 November 2026.'})
with dest.open('wb') as f:w.write(f)
qa=d/'.build/rendered';qa.mkdir(exist_ok=True)
pages=len(r.pages)
renderer=Path(os.environ.get('SMPT_RUNTIME','/Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies'))/'bin/override/pdftoppm'
subprocess.run([str(renderer),'-r','120','-png',str(dest),str(qa/'slide')],check=True)
canvas=Image.new('RGB',(1440,6*294),'#D8D3C7');draw=ImageDraw.Draw(canvas)
for i in range(pages):
 im=Image.open(qa/f'slide-{i+1:02}.png');im.thumbnail((468,264));x=(i%3)*480+6;y=(i//3)*294+22;canvas.paste(im,(x,y));draw.text((x,y-18),f'{i+1:02}',fill='#1B1915')
canvas.save(d/'contact-sheet.png')
print(json.dumps({'pages':pages,'hyperlinkColorOperatorsCorrected':count,'pdf':str(dest)}))

"""Preserve PDF layout/links while correcting LibreOffice's hyperlink-color override.
Only the renderer's known default #467886 link color is changed to SMPT gold.
Run after native export, before rendering and final acceptance checks.
"""
import argparse, json
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, FloatObject
parser=argparse.ArgumentParser();parser.add_argument('input',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--deck',action='store_true');args=parser.parse_args()
content=json.loads((Path(__file__).resolve().parent/'publication-content.json').read_text())
reader=PdfReader(args.input);writer=PdfWriter();writer.clone_document_from_reader(reader)
old=tuple(n/255 for n in (0x46,0x78,0x86));changed=0
for i,page in enumerate(writer.pages):
 stream=ContentStream(page.get_contents(),writer)
 rgb=(0xE3,0xB0,0x4B) if args.deck and i in (0,9) else (0x7A,0x55,0x10)
 for operands,operator in stream.operations:
  if operator in (b'rg',b'RG') and len(operands)==3 and all(abs(float(a)-b)<0.0001 for a,b in zip(operands,old)):
   operands[:]=[FloatObject(v/255) for v in rgb];changed+=1
 page.replace_contents(stream)
writer.add_metadata({'/Title':content['title'],'/Author':'Strategic Materials Policy Tracker','/Subject':content['subtitle'],'/Keywords':'SMPT, Financial Intelligence 001, Hemerdon, research cutoff 4 November 2026'})
with args.output.open('wb') as f:writer.write(f)
print(json.dumps({'output':str(args.output),'pages':len(writer.pages),'hyperlinkColorOperatorsCorrected':changed}))

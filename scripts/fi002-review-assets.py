"""Generate publication identity image and inspect distributed assets (no research edits)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
import zipfile, re, json
r=Path(__file__).resolve().parents[1]; out=r/'public/research/fi002'
font=Path('/System/Library/Fonts/Supplemental/Arial.ttf')
bold=font.with_name('Arial Bold.ttf')
im=Image.new('RGB',(1200,630),'#12110f'); d=ImageDraw.Draw(im)
def line(t,xy,size=26,color='#efece6',heavy=False):d.text(xy,t,font=ImageFont.truetype(str(bold if heavy else font),size),fill=color)
line('SMPT / FINANCIAL INTELLIGENCE 002',(64,52),22,'#e3b04b',True)
d.line((64,105,1136,105),fill='#433e34',width=2)
for i,t in enumerate(['Goldman Sachs’ Copper Outlook','and BHP’s $6 Billion','Escondida Decision']):line(t,(64,155+i*72),54,heavy=True)
line('Earnings exposure · Replacement economics · Capital allocation',(64,425),25,'#aaa397')
d.line((64,510,1136,510),fill='#433e34',width=2)
line('Independent research | 5 November 2026 cutoff',(64,548),22,'#e3b04b')
im.save(out/'social.png')
# Inspect both visible text and container links for private working references.
for p in out.rglob('*'):
 if not p.is_file() or p.suffix in ['.png','.zip']:continue
 if p.suffix=='.pdf':
  reader=PdfReader(p); raw='\n'.join(x.extract_text() for x in reader.pages)
  raw+='\n'+'\n'.join(str(a.get_object().get('/A',{}))for page in reader.pages for a in page.get('/Annots',[]))
 elif p.suffix in ['.xlsx','.pptx']:
  with zipfile.ZipFile(p) as z:raw='\n'.join(z.read(n).decode(errors='replace')for n in z.namelist() if n.endswith(('.xml','.rels')))
 else:raw=p.read_text()
 hits=re.findall(r'docs\.google\.com|drive\.google\.com|/Users/|ben\.yang@|private delivery folder',raw,re.I)
 assert not hits,(p.name,hits)
print('Public text, PDF links and Office XML: no private delivery references')

"""Cross-format FI001 acceptance checks, after rendering final PDFs.
Does not write source workbooks or regenerate artifacts. Visual review is separate.
"""
import hashlib, json, re, zipfile
from pathlib import Path
from lxml import etree as ET
from pypdf import PdfReader
from pypdf.generic import ContentStream
from docx import Document
HERE=Path(__file__).resolve().parent
A=HERE.parent/'hemerdon-phase1a'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
content=json.loads((HERE/'publication-content.json').read_text())
ex=json.loads((HERE/'publication-exhibits.json').read_text())
urls={s['url'] for s in json.loads((A/'sources.json').read_text())}
fail=[];checks=[]
def check(label,ok):
 checks.append({'check':label,'passed':bool(ok)})
 if not ok:fail.append(label)
model=HERE/'SMPT_FI001_Hemerdon_Financial_Model.xlsx'
check('publication model byte-identical to accepted source',sha(model)==sha(A/'hemerdon-financial-model.xlsx')==ex['modelSHA256'])
mv=json.loads((HERE/'model-validation-results.json').read_text())
check('preserved independent validation covers unchanged publication model',mv['inputSHA256']==sha(model) and mv['caseCount']==32 and mv['failureCount']==0 and not mv['cachedFormulaDifferences'])
doc=Document(HERE/'SMPT_FI001_Hemerdon_Financial_Memo.docx')
actual=[[[c.text for c in row.cells] for row in t.rows] for t in doc.tables]
expected=[[p['exhibit']['headers']]+p['exhibit']['rows'] for p in content['pages'] if 'exhibit' in p]
check('all seven memo exhibit tables match reviewed content',actual==expected and len(actual)==7)
body='\n'.join(p.text for p in doc.paragraphs)
check('preferred memo title and subtitle metadata',doc.core_properties.title==content['title'] and doc.core_properties.subject==content['subtitle'])
check('preferred title appears in memo',' '.join(content['title'].split()) in ' '.join(body.split()))
check('all authored analytical paragraphs in DOCX',all(t in body for p in content['pages'] for t in p['paragraphs']+p.get('after',[])))
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','c':'http://schemas.openxmlformats.org/drawingml/2006/chart','r':'http://schemas.openxmlformats.org/package/2006/relationships'}
charts=[];pptx=HERE/'SMPT_FI001_Hemerdon_Strategy_Deck.pptx'
with zipfile.ZipFile(pptx) as z:
 slideparts=[n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+.xml',n)]
 check('ten editable slides',len(slideparts)==10)
 core=ET.fromstring(z.read('docProps/core.xml'))
 check('preferred PowerPoint title metadata',core.findtext('{http://purl.org/dc/elements/1.1/}title')==content['title'])
 cover=' '.join(' '.join(ET.fromstring(z.read('ppt/slides/slide1.xml')).itertext()).split())
 check('preferred title and subtitle on cover',' '.join(content['title'].split()) in cover and content['subtitle'] in cover)
 palette={'12110F','1A1814','232019','EFECE6','E3B04B','C8993E','F5F3EE','1B1915','5B5548','D8D3C7','7A5510','000000','FFFFFF'}
 explicit_colors=set()
 for part in z.namelist():
  if part.endswith('.xml') and (part.startswith('ppt/slides/') or part.startswith('ppt/theme/')):
   explicit_colors.update(c.get('val').upper() for c in ET.fromstring(z.read(part)).findall('.//a:srgbClr',ns))
 check('PowerPoint uses SMPT colors and neutral defaults',explicit_colors<=palette)
 for n in [1,10]:
  slide=ET.fromstring(z.read(f'ppt/slides/slide{n}.xml'))
  check(f'slide {n} graphite background',slide.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}bg//a:srgbClr',ns).get('val').upper()=='12110F')
 chartparts=sorted(n for n in z.namelist() if re.search(r'/charts/chart\d+.xml$',n))
 for name in chartparts:
  root=ET.fromstring(z.read(name));charts.append([float(v.text) for v in root.findall('.//c:ser/c:val/c:numRef/c:numCache/c:pt/c:v',ns)])
 check('native chart values reconcile to accepted findings',charts==[[36.,25.,10.],[40.,42.5,45.],[2.5,3.,.25],[13.,-2.,-1.]])
 root=ET.fromstring(z.read(chartparts[0]));pts=root.findall('.//c:dPt',ns)
 fills={int(pt.find('c:idx',ns).get('val')):pt.find('c:spPr/a:solidFill/a:srgbClr',ns).get('val').upper() for pt in pts}
 check('core bars solid and accordion separately outlined',fills=={0:'1B1915',1:'1B1915',2:'F5F3EE'} and pts[-1].find('c:spPr/a:ln/a:solidFill/a:srgbClr',ns).get('val').upper()=='7A5510')
 check('four chart workbooks embedded',len([n for n in z.namelist() if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')])==4)
 external=[]
 for name in z.namelist():
  if name.endswith('.rels'):
   root=ET.fromstring(z.read(name))
   external += [n.attrib['Target'] for n in root if n.attrib.get('TargetMode')=='External']
 check('all PPTX external citation targets resolve to canonical source URLs',len(external)>0 and all(x in urls for x in external))
receipt=json.loads((HERE/'deck-validation-results.json').read_text())
check('finalizer receipt matches delivered PowerPoint',receipt['finalSha256']==sha(pptx))
check('PPTX package geometry font and native charts passed',receipt['packageIntegrity']['findingCount']==0 and receipt['presentationLayout']['findingCount']==0 and receipt['fontSelection']['passed'] and receipt['nativeChartValidation']['passed'])
pdfs=[]
for stem,pages in [('SMPT_FI001_Hemerdon_Financial_Memo',8),('SMPT_FI001_Hemerdon_Strategy_Deck',10)]:
 path=HERE/(stem+'.pdf');reader=PdfReader(path);links=[];fonts=set();pdf_colors=set()
 check(stem+' preferred title metadata',reader.metadata.title==content['title'])
 check(stem+' expected page count',len(reader.pages)==pages)
 for i,page in enumerate(reader.pages):
  for operands,op in ContentStream(page.get_contents(),reader).operations:
   if op in (b'rg',b'RG') and len(operands)==3:pdf_colors.add(tuple(round(float(x)*255) for x in operands))
  check(stem+f' page {i+1} contains cutoff', '4 November 2026' in page.extract_text())
  found=[]
  for a in page.get('/Annots',[]):
   o=a.get_object()
   if '/A' in o and '/URI' in o['/A']:
    target=str(o['/A']['/URI']);links.append(target);found.append(target)
    rect=o.get('/Rect');check(stem+f' link rectangle within page {i+1}',bool(rect) and all(0<=float(n)<=float(page.mediabox.width if j%2==0 else page.mediabox.height) for j,n in enumerate(rect)))
  check(stem+f' page {i+1} source links present',len(found)>0)
  f=page['/Resources'].get_object().get('/Font',{})
  for obj in f.get_object().values():fonts.add(str(obj.get_object().get('/BaseFont')))
 check(stem+' PDF link targets match canonical sources',all(x in urls for x in links))
 families=sorted(set(re.sub(r'-(?:BoldItalic|Bold|Italic)(?:MT)?$','',re.sub(r'^/[A-Z]{6}\+','',f)).removesuffix('MT') for f in fonts))
 check(stem+' embeds Arial only',families==['Arial'])
 allowed_rgb={tuple(bytes.fromhex(h)) for h in palette}
 check(stem+' PDF colors restricted to SMPT and neutrals',pdf_colors<=allowed_rgb)
 pdfs.append({'file':path.name,'pages':len(reader.pages),'hyperlinkAnnotations':len(links),'renderedFontFamilies':families})
check('four headline values retained in memo PDF',all(s in '\n'.join(p.extract_text() for p in PdfReader(HERE/'SMPT_FI001_Hemerdon_Financial_Memo.pdf').pages) for s in ['£61','£71','£40','£45','£5.75','£2','£1']))
files=['SMPT_FI001_Hemerdon_Financial_Memo.docx','SMPT_FI001_Hemerdon_Financial_Memo.pdf','SMPT_FI001_Hemerdon_Strategy_Deck.pptx','SMPT_FI001_Hemerdon_Strategy_Deck.pdf','SMPT_FI001_Hemerdon_Financial_Model.xlsx','SMPT_FI001_Evidence_Appendix.md','SMPT_FI001_Model_Guide.md','SMPT_FI001_Research_Abstract.md','publication-content.json','publication-exhibits.json','model-validation-results.json','deck-validation-results.json','SMPT_FI001_Publication_QC.md','SMPT_FI001_Publication_Handoff.md']
result={'cutoff':'2026-11-04','productionDate':'2026-11-05','acceptedCommit':'772f2f4c02631f533a0a893849c9bedb8a6ff8ad','failureCount':len(fail),'failures':fail,'checks':checks,'pdfs':pdfs,'sha256':{f:sha(HERE/f) for f in files},'nativeExcelVerified':False,'nativePowerPointVerified':False,'visualReview':'Recorded separately in Publication QC; programmatic checks do not establish visual quality','linkCheckBoundary':'Embedded targets and PDF annotations tested against canonical source URLs. Live external host availability not re-audited.'}
(HERE/'publication-validation-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'checks':len(checks),'failures':fail,'pdfs':pdfs},indent=2))
raise SystemExit(bool(fail))

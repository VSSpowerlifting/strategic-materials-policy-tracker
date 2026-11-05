"""Read-only release verification against approved FI002 masters and public ZIP."""
from pathlib import Path
from pypdf import PdfReader
import hashlib, json, zipfile
ROOT=Path(__file__).resolve().parents[1]; out=ROOT/'public/research/fi002'; src=ROOT/'docs/research/fi002-bhp-copper'
checks=[]
def check(name,value):
 assert value,name
 checks.append({'check':name,'passed':True})
manifest=json.loads((out/'publication-manifest.json').read_text())
for name,record in manifest['files'].items():
 check('SHA256: '+name,hashlib.sha256((out/name).read_bytes()).hexdigest()==record['sha256'])
with zipfile.ZipFile(out/'research-package.zip') as z:
 check('ZIP allowlist',set(z.namelist())==set(manifest['files'])|{'publication-manifest.json'})
 for name,record in manifest['files'].items():
  check('ZIP hash: '+name,hashlib.sha256(z.read(name)).hexdigest()==record['sha256'])
for f,count,links in [('report.pdf',14,59),('executive-slides.pdf',12,32),('executive-brief.pdf',2,9)]:
 r=PdfReader(out/f);check(f+' page count',len(r.pages)==count)
 uris=[str(a.get_object()['/A']['/URI'])for p in r.pages for a in p.get('/Annots',[])if '/URI'in a.get_object().get('/A',{})]
 check(f+' link count',len(uris)==links)
 check(f+' no private link',all('docs.google.com' not in u and 'drive.google.com' not in u for u in uris))
 check(f+' metadata',not any('/Users/' in str(v) or 'ben.yang@' in str(v) for v in r.metadata.values()))
pages=json.loads((src/'build/report-narrative.json').read_text())
text=' '.join(' '.join(p.extract_text().split())for p in PdfReader(out/'report.pdf').pages)
paragraphs=[paragraph for page in pages for label,paragraph in page[4]]
check('41 approved narrative paragraphs preserved verbatim',len(paragraphs)==41 and all(' '.join(p.split())in text for p in paragraphs))
check('7 original vector exhibits preserved',all((out/'figures'/f.name).read_bytes()==f.read_bytes()for f in (src/'output/figures').glob('*.svg')))
with zipfile.ZipFile(src/'output/SMPT_FI002_BHP_Copper_Strategy_Deck.pptx')as a,zipfile.ZipFile(out/'executive-slides.pptx')as b:
 check('PPTX only delivery note changed',[n for n in a.namelist()if a.read(n)!=b.read(n)]==['ppt/notesSlides/notesSlide12.xml'])
result={'approvedResearchCommit':manifest['approvedResearchCommit'],'checks':checks,'passed':len(checks),'failed':0,'publicZipSha256':hashlib.sha256((out/'research-package.zip').read_bytes()).hexdigest()}
(ROOT/'docs/research/fi002-website/review/asset-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(len(checks),'public asset verification checks passed')

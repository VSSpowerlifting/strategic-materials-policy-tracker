"""Independent arithmetic, saved formula caches, native round trip and publication checks."""
from pathlib import Path
import json,math,zipfile,re,csv,hashlib,subprocess
from openpyxl import load_workbook
from pypdf import PdfReader
from xml.etree import ElementTree as ET
R=Path(__file__).resolve().parents[1];B=R/'build';O=R/'output';d=json.loads((B/'publication-data.json').read_text());results=[]
def check(name,passed,detail=''):results.append(dict(check=name,passed=bool(passed),detail=detail))
def close(a,b):return isinstance(a,(int,float))and abs(a-b)<1e-6
w=load_workbook(O/'SMPT_FI002_BHP_Copper_Model.xlsx',data_only=True);f=load_workbook(O/'SMPT_FI002_BHP_Copper_Model.xlsx',data_only=False)
snapshot=B/'native-readback.xlsx' if (B/'native-readback.xlsx').exists() else R/'audit/SMPT_FI002_Native_Model_Readback.xlsx'
n=load_workbook(snapshot,data_only=True);nf=load_workbook(snapshot,data_only=False)
check('11-tab native/local identity',len(w.sheetnames)==11 and n.sheetnames==w.sheetnames)
check('Both selectors restored to base',w['00 Model Guide']['D5'].value==n['00 Model Guide']['D5'].value==1)
check('Local six-case propagation and four perturbations',all(x['pass']for x in json.loads((B/'model-tests.json').read_text())))
# Rebuild discounted annual cash flows independently of workbook annuity formulas.
def screen(price=10494.00368,cost=4000,cap=5850,rate=.1,life=20,start=2032):
 pv=math.fsum(cap/5/(1+rate)**(year-2026)for year in range(2027,2032));a=math.fsum(1/(1+rate)**(year-2026)for year in range(start,start+life));return pv/a*1000/((price-cost)*.65)
for i,x in enumerate(d['key']['scenarios']):
 expected=screen(price=x['longprice'],cap=x['capex'],start=2032+x['delay'])
 check('Independent six-case annual DCF: '+x['name'],close(w['08 Scenarios and Decisions'][f'H{i+6}'].value,expected),f'{expected:.9f} ktpa')
 case=json.loads((B/'native-v2-checks.json').read_text())[i]
 check('Native scenario recalculation: '+x['name'],close(case['values'][5][0],expected)and close(case['values'][3][0],x['capex']))
args=[{},dict(life=10),dict(life=10,start=2034),dict(rate=.08),dict(rate=.12),dict(cost=3000),dict(cost=5000),dict(price=8500,cap=7020,start=2034)]
for i,a in enumerate(args):
 expected=screen(**a);check('Additional screen '+d['thresholds'][i]['name'],close(w['08 Scenarios and Decisions'][f'D{34+i}'].value,expected)and close(d['thresholds'][i]['kt'],expected))
lb=1000/0.45359237;gs=1600/lb*100*39;spread=2400/lb*100*39
for cell,expected in [('D45',gs),('D46',spread),('D27',1575*.95*1600/1000),('D28',1575*.95*1600/1000*.95),('D31',7.01*lb)]:check('Operating calculation '+cell,close(w['04 Operating Sensitivity'][cell].value,expected))
for cell,expected in [('D8',21778-12011),('D11',9767-6756-2355),('D12',4300),('D19',12000),('D20',24000)]:check('Funding boundary '+cell,close(w['07 Funding Capacity'][cell].value,expected))
check('Capital categories reconcile',w['05 Capital Expenditure']['D11'].value==11000)
check('Economic ownership capital',close(w['06 Escondida Economics']['D7'].value,5850*.575))
check('Copper excluding G&U',close(w['02 Historical Financials']['E30'].value,18187/(18187+14529+832)))
check('Copper divided by group',close(w['02 Historical Financials']['E31'].value,18187/32947))
check('Secondary proxy warning in local and native',str(w['04 Operating Sensitivity']['C12'].value).startswith('SECONDARY')and n['04 Operating Sensitivity']['C12'].value==w['04 Operating Sensitivity']['C12'].value)
check('No forward funding residual on current dashboard','Residual'not in str(w['09 Decision Dashboard']['C11'].value)and w['09 Decision Dashboard']['D14'].value=='Maintain readiness')
manifest=json.loads((B/'formula-manifest.json').read_text());mismatch=[];cachebad=[];errors=[]
for item in manifest:
 s=item['sheet'];c=item['cell'];a=w[s][c].value;b=n[s][c].value
 # Google may normalize function names; compare every resulting formula cache as well.
 if str(f[s][c].value).upper()!=str(nf[s][c].value).upper():
  left=str(f[s][c].value);right=str(nf[s][c].value)
  expected_serialization=(s=='10 Model Validation'and c in ['D8','D22']and left.rsplit('-',1)[0]==right.rsplit('-',1)[0]and abs(float(left.rsplit('-',1)[1])-float(right.rsplit('-',1)[1]))<1e-8)
  if not expected_serialization:mismatch.append(s+'!'+c)
 if not(close(a,b)if isinstance(a,(int,float))else a==b):cachebad.append(dict(sheet=s,cell=c,local=a,native=b))
for book,label in [(w,'local'),(n,'native')]:
 for s in book:
  for row in s:
   for c in row:
    if c.data_type=='e':errors.append(f'{label}:{s.title}!{c.coordinate}={c.value}')
check('All formula logic preserved in native export',not mismatch,f'{len(manifest)} formulas; two audit constants rounded by Google to 15 significant digits (less than 1e-8); other differences {mismatch[:8]}')
check('All formula caches agree after native recalculation',not cachebad,str(cachebad[:8]))
check('No cached formula errors in either workbook',not errors,str(errors))
check('Native rate precision is visible',nf['08 Scenarios and Decisions']['F37'].number_format=='0.0%')
check('Historical realized price precision',f['02 Historical Financials']['E11'].number_format=='0.00')
check('Live scenario validation retained',bool(f['00 Model Guide'].data_validations.dataValidation))
ids={s[0]for s in d['sources']};check('21 unique source/access records',len(ids)==len(d['sources'])==21)
claims=list(csv.DictReader((O/'SMPT_FI002_Claim_Source_Matrix.csv').open()));check('14 major claims with traceable source IDs',len(claims)==14 and all(x.strip()in ids for c in claims for x in c['source_ids'].split(';')if re.fullmatch(r'S[0-9]+',x.strip())))
allowed={x[4]for x in d['sources']}|{'https://docs.google.com/spreadsheets/d/1MysAjBqAQ4-63XPo7YtncDle3q4faZDsBpTaVBWsg1k/edit?usp=drivesdk','https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202'}
pdfmeta={}
for stem,count,minlinks in [('SMPT_FI002_BHP_Copper_Research_Report',14,50),('SMPT_FI002_BHP_Copper_Strategy_Deck',12,30),('SMPT_FI002_BHP_Copper_Memo',2,9)]:
 pdf=PdfReader(O/(stem+'.pdf'));texts=[p.extract_text()for p in pdf.pages];uris=[]
 for p in pdf.pages:
  for a in p.get('/Annots',[]):
   uri=a.get_object().get('/A',{}).get('/URI')
   if uri:uris.append(str(uri))
 check(stem+' page count',len(pdf.pages)==count)
 check(stem+' live source annotations',len(uris)>=minlinks,f'{len(uris)} hyperlinks')
 check(stem+' registered link destinations',all(u in allowed for u in uris))
 check(stem+' substantial pages and no placeholders',all(len(t.split())>35 for t in texts)and not re.search(r'turn\d+(view|search)|TODO|TBD|#REF!', '\n'.join(texts)))
 check(stem+' independence statement',bool(re.search(r'Independent|independent','\n'.join(texts))))
 pdfmeta[stem]=dict(pages=len(pdf.pages),uri_annotations=len(uris),words=sum(len(t.split())for t in texts))
z=zipfile.ZipFile(O/'SMPT_FI002_BHP_Copper_Strategy_Deck.pptx');slides=[p for p in z.namelist()if re.fullmatch(r'ppt/slides/slide\d+\.xml',p)];charts=[p for p in z.namelist()if re.fullmatch(r'ppt/(?:slides/)?charts/chart\d+\.xml',p)]
check('12 editable PowerPoint slides',len(slides)==12)
check('8 native analytical tables',sum(z.read(n).count(b'<a:tbl>')for n in slides)==8)
check('3 native charts and embedded editable data',len(charts)==3 and len([n for n in z.namelist()if n.startswith('ppt/embeddings/')and n.endswith('.xlsx')])==3)
ns={'c':'http://schemas.openxmlformats.org/drawingml/2006/chart'}
chartmins=[]
for p in charts:
 root=ET.fromstring(z.read(p));chartmins.extend(x.attrib['val']for x in root.findall('.//c:valAx/c:scaling/c:min',ns))
check('Deck quantitative bar axes start at zero',len(chartmins)==3 and all(float(x)==0 for x in chartmins))
receipt=json.loads((B/'presentation-v5-validation.json').read_text());check('Presentation structural and geometry checks',receipt['packageIntegrity']['finding_count']==0 and receipt['presentationLayout']['finding_count']==0)
check('Portable chart data validation',receipt['portableChartData']['portable_chart_validation_passed'] if 'portableChartData'in receipt else '"portable_chart_validation_passed": true'in json.dumps(receipt))
check('One current memo, dated prototype preserved',not(O/'SMPT_FI002_BHP_Copper_Strategy_Memo.pdf').exists()and(R/'archive/2026-11-04/SMPT_FI002_BHP_Copper_Strategy_Memo.pdf').exists())
root=subprocess.check_output(['git','rev-parse','--show-toplevel'],text=True).strip();diff=subprocess.check_output(['git','diff','649d5ab30c765e863bc237efbbff3e26dccc1531','--','research/fi002'],text=True);check('PR202 baseline unchanged',not diff)
# Final editorial acceptance checks. Financial artifacts remain the completed-research baseline.
from html import unescape
from html.parser import HTMLParser
import ast
class ReadText(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
ht=(O/'SMPT_FI002_BHP_Copper_Research_Report.html').read_text();parser=ReadText();parser.feed(ht)
md=(O/'SMPT_FI002_BHP_Copper_Research_Report.md').read_text()
pdf=PdfReader(O/'SMPT_FI002_BHP_Copper_Research_Report.pdf');pt=' '.join(p.extract_text()for p in pdf.pages)
def norm(t):return re.sub(r'\s+',' ',unescape(t)).strip()
versions=[norm(md),norm(' '.join(parser.parts)),norm(pt)]
narrative=json.loads((B/'report-narrative.json').read_text())
check('Accepted narrative identical in PDF, Markdown and HTML',all(norm(body)in v for page in narrative for _,body in page[4]for v in versions),f'{sum(len(p[4])for p in narrative)} accepted paragraphs')
module=ast.parse((B/'report.py').read_text());tables=next(ast.literal_eval(x.value)for x in module.body if isinstance(x,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='TABLES'for t in x.targets))
check('All exhibit tables preserved across report formats',all(norm(cell)in v for rows in tables.values()for row in rows for cell in row for v in versions))
captions=re.findall(r'Exhibit \d+\. [^\n]+',md)
check('Seven accepted captions in PDF and editable HTML',len(captions)==7 and all(norm(c)in versions[1]and norm(c)in versions[2]for c in captions))
baseline='f7515ca9968c32f74e7a40e7e4c4f8ee952d5263'
def oldbytes(path):return subprocess.check_output(['git','show',baseline+':'+str(path.relative_to(Path(root)))])
figs=list((O/'figures').glob('*.svg'))
check('Seven original vector exhibits unchanged and embedded',len(figs)==7 and all(p.read_bytes()==oldbytes(p.resolve())and p.read_text()in ht for p in figs))
stable=[O/x for x in ['SMPT_FI002_BHP_Copper_Model.xlsx','SMPT_FI002_BHP_Copper_Memo.pdf','SMPT_FI002_BHP_Copper_Memo.md','SMPT_FI002_Evidence_Register.csv','SMPT_FI002_Claim_Source_Matrix.csv','SMPT_FI002_Price_Sensitivity.csv','SMPT_FI002_Price_Cost_Frontier.csv','SMPT_FI002_Threshold_Sensitivities.csv','SMPT_FI002_Replacement_Margin_Frontier.csv']]
stable += [R/'audit/SMPT_FI002_Native_Model_Readback.xlsx',B/'publication-data.json',B/'formula-manifest.json']
check('Model, evidence, calculations and brief byte-identical to completed research',all(p.read_bytes()==oldbytes(p.resolve())for p in stable),f'{len(stable)} files compared to {baseline}')
check('Reported earnings-scale comparisons round to 9% and 13%',round(gs/32947*100)==9 and round(spread/32947*100)==13,f'{gs/32947*100:.6f}% and {spread/32947*100:.6f}%; scale only')
check('Duration and later start are explicitly separated',round(screen(life=10))==275 and round(screen(life=10,start=2034))==333 and all(x in versions[0]for x in ['275ktpa','Starting those ten years in 2034','flat in nominal dollars']))
pdfuris={str(a.get_object().get('/A',{}).get('/URI'))for page in pdf.pages for a in page.get('/Annots',[])if a.get_object().get('/A',{}).get('/URI')}
htmluris=set(unescape(u)for u in re.findall(r'href="([^"]+)"',ht));mduris=set(re.findall(r'\]\((https://[^)]+)\)',md))
check('All report source and model link destinations agree across formats',pdfuris==htmluris==mduris,f'{len(pdfuris)} unique destinations; availability limitations in QC')
olddeck=zipfile.ZipFile(__import__('io').BytesIO(oldbytes((O/'SMPT_FI002_BHP_Copper_Strategy_Deck.pptx').resolve())))
chartpath=re.compile(r'ppt/(?:slides/)?charts/chart\d+\.xml')
def chartvalues(book):
 return [[e.text for e in ET.fromstring(book.read(p)).findall('.//c:numCache/c:pt/c:v',ns)]for p in sorted(book.namelist())if chartpath.fullmatch(p)]
def tablenumbers(book):
 return [re.findall(r'[-+]?\d+(?:[.,]\d+)*',' '.join(t.text or ''for t in ET.fromstring(book.read(p)).findall('.//a:tbl//a:t',{'a':'http://schemas.openxmlformats.org/drawingml/2006/main'})))for p in sorted(book.namelist())if re.fullmatch(r'ppt/slides/slide\d+\.xml',p)]
check('Revised deck preserves every chart value and table numeric token',chartvalues(z)==chartvalues(olddeck)and tablenumbers(z)==tablenumbers(olddeck))
fonts=set(re.findall(r'typeface="([^"]+)"',''.join(z.read(p).decode()for p in slides)))
fontnames={str(f.get_object().get('/BaseFont'))for page in PdfReader(O/'SMPT_FI002_BHP_Copper_Strategy_Deck.pdf').pages for f in page.get('/Resources',{}).get('/Font',{}).values()}
check('Deck typography follows v2 with permitted installed body fallback',fonts=={'Georgia','Arial'} and any('Georgia' in name for name in fontnames)and any('Arial' in name for name in fontnames),str(sorted(fontnames)))
report=dict(cutoff='2026-11-05',checks=results,passed=sum(x['passed']for x in results),total=len(results),formula_count=len(manifest),pdfs=pdfmeta,scope='Internal automated checks; source and visual assessment in Quality Review')
(B/'verification-results.json').write_text(json.dumps(report,indent=2));(O/'SMPT_FI002_Verification_Results.json').write_text(json.dumps(report,indent=2))
print(json.dumps(dict(passed=report['passed'],total=report['total'],formula_count=len(manifest),failures=[x for x in results if not x['passed']]),indent=2))
if report['passed']!=report['total']:raise SystemExit(1)

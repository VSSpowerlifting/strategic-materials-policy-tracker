"""Read-only checks of FI001 v2 against canonical evidence, model and published baseline."""
import hashlib,io,json,re,subprocess,sys,zipfile
from pathlib import Path
from decimal import Decimal as D
from lxml import etree as E
import openpyxl,pdfplumber
from pypdf import PdfReader
from PIL import Image
p=Path(__file__).resolve().parent;phase=p.parent;root=p.parents[3]
checks=[]
def check(name,ok,detail=None):checks.append({'check':name,'passed':bool(ok),**({'detail':detail} if detail is not None else {})})
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
spec=json.loads((p/'slide-specs.json').read_text());accepted=json.loads((phase/'publication-exhibits.json').read_text());sources=json.loads((phase/'../hemerdon-phase1a/sources.json').read_text());facts=json.loads((phase/'../hemerdon-phase1a/evidence.json').read_text())['facts'];F={f['id']:f for f in facts};v=lambda k:D(F[k]['value'])/1000000
ref={k:next(s for s in sources if s['id']==i) for k,i in accepted['sourceAliases'].items()};urls={s['url'] for s in sources};baseline='b688516763447b669b6755d9083726e691753ac7'
model=phase/'SMPT_FI001_Hemerdon_Financial_Model.xlsx';w=openpyxl.load_workbook(model,data_only=True)
check('Accepted model byte identity',sha(model)==accepted['modelSHA256'],sha(model))
check('Phase1A model byte identity',sha(phase/'../hemerdon-phase1a/hemerdon-financial-model.xlsx')==sha(model))
prior=json.loads((phase/'../hemerdon-phase1b/validation-results.json').read_text());check('Preserved independent validation applies to model',prior['inputSHA256']==sha(model) and prior['failureCount']==0 and prior['caseCount']==32 and not prior['cachedFormulaDifferences'])
check('Core financing independently recomputed',v('hfi-nwf-equity')+v('hfi-nwf-loan')==61 and w['Funding']['D10'].value==61000000)
check('Headline including uncommitted reconciles',v('hfi-nwf-equity')+v('hfi-nwf-loan')+v('hfi-nwf-accordion')==71 and w['Funding']['D12'].value==71000000)
check('October range and midpoint',(v('hfi-remaining-low'),v('hfi-remaining-high'))==(40,45) and w['Funding']['D16'].value==42500000)
stress=v('hfi-remaining-high')-D('42.5')+v('hfi-delay-cost')+D('.01')*v('hfi-nwf-loan');check('Independent stress arithmetic',stress==D('5.75'))
case=next(c for c in prior['caseResults'] if c['case']=='downside');check('Stress matches independent workbook case',case['observed']['Funding!D23']==float(stress*1000000))
sourceIds=['hfi-aug-equity','hfi-aug-loan','hfi-aug-cash-open','hfi-aug-ea-recovery','hfi-aug-revenue'];sourcesTotal=sum(v(k) for k in sourceIds)
useGroups=[['hfi-aug-mine-opex','hfi-aug-process-opex','hfi-aug-other-opex','hfi-aug-finance-cost','hfi-aug-wc'],['hfi-aug-mining-capital','hfi-aug-site-capital','hfi-aug-other-capital'],['hfi-aug-bridge-repay','hfi-aug-ea-provision'],['hfi-aug-reserve']];groupValues=[sum(v(k) for k in group) for group in useGroups];detail=sum(groupValues)
check('August grouped sources/uses',sourcesTotal==88 and groupValues==[23,28,23,13] and detail==87)
aggregate=sourcesTotal-v('hfi-aug-revenue')-(v('hfi-aug-total-uses')-v('hfi-aug-reserve'));detailed=sourcesTotal-v('hfi-aug-revenue')-(detail-v('hfi-aug-reserve'))
check('August stated and detail scenarios',(aggregate,detailed)==(-2,-1) and case['observed']['August plan!D35']==-2000000)
check('Slide4 instrument inputs',spec['slides'][3]['data']==[36,25,10,61,71]);check('Slide6 grouped sources/uses',spec['slides'][5]['data']=={'sources':[61,7,5,15],'uses':[23,28,23,13],'statedTotal':88,'detailTotal':87});check('Slide7 range',spec['slides'][6]['data']==[40,42.5,45,25,35]);check('Slide8 stress components',spec['slides'][7]['data']==[2.5,3,.25,5.75]);check('Slide9 receipt scenario',spec['slides'][8]['data']==[13,-2,-1,15,88,75,73,74])
A='http://schemas.openxmlformats.org/drawingml/2006/main';C='http://schemas.openxmlformats.org/drawingml/2006/chart';P='http://schemas.openxmlformats.org/presentationml/2006/main';N={'a':A,'c':C,'p':P};ppt=p/'SMPT_FI001_Hemerdon_Presentation_v2.pptx'
with zipfile.ZipFile(ppt) as z:
 slides=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n)[1]));check('18 slides / hard cap',len(slides)==18)
 tableOwners=[];chartOwners=[];alltext=[]
 for i,file in enumerate(slides,1):
  xml=E.fromstring(z.read(file));text=' '.join(xml.xpath('//a:t/text()',namespaces=N));alltext.append(text)
  check(f'Slide{i:02} cutoff and number', '4 November 2026' in text and str(i).zfill(2) in text)
  check(f'Slide{i:02} source and class specification',bool(spec['slides'][i-1]['sourceKeys']) and bool(spec['slides'][i-1]['mechanism']))
  if xml.findall('.//a:tbl',N):tableOwners.append(i)
  if xml.findall('.//c:chart',N):chartOwners.append(i)
  check(f'Slide{i:02} Archivo only',set(xml.xpath('//a:latin/@typeface',namespaces=N))<={'Georgia','Arial'})
  rel=E.fromstring(z.read(f'ppt/slides/_rels/slide{i}.xml.rels'));targets=[n.get('Target') for n in rel if n.get('Type','').endswith('/hyperlink')];check(f'Slide{i:02} native links match register',bool(targets) and all(t in urls for t in targets))
 check('Native table ownership',tableOwners==[5,13,15,16,17,18],tableOwners);check('Native chart ownership',chartOwners==[8,9],chartOwners)
 charts=[n for n in z.namelist() if re.search(r'/charts/chart\d+\.xml$',n)]
 chartData=[]
 for file in sorted(charts):
  xml=E.fromstring(z.read(file));data=[float(x) for x in xml.xpath('//c:ser/c:val//c:pt/c:v/text()',namespaces=N)];chartData.append(data)
  check(file+' literal values',data in ([2.5,3,.25],[13,-2,-1]),data)
 check('Both chart series exact',sorted(chartData)==sorted([[2.5,3,.25],[13,-2,-1]]))
 embedded=[n for n in z.namelist() if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')];check('Two editable chart workbooks',len(embedded)==2)
 for file in embedded:
  wb=openpyxl.load_workbook(io.BytesIO(z.read(file)),data_only=True);vals=[r[1] for r in list(wb.active.values)[1:] if len(r)>1];check(file+' workbook values',vals in ([2.5,3,.25],[13,-2,-1]),vals)
 xml=E.fromstring(z.read(slides[3]));shapes=xml.findall('.//p:sp',N);bars=[]
 for shape in shapes:
  geom=shape.find('p:spPr/a:prstGeom',N);size=shape.find('p:spPr/a:xfrm/a:ext',N)
  if geom is not None and geom.get('prst')=='rect' and size is not None and int(size.get('cy'))>400000 and shape.find('p:txBody',N) is None:bars.append(shape)
 check('Financing instrument bars editable',len(bars)==3)
 widths=[int(q.find('p:spPr/a:xfrm/a:ext',N).get('cx')) for q in bars];check('Financing widths proportional',widths==[36*12*9525,25*12*9525,10*12*9525],widths)
 check('Accordion has dashed outline',bars[-1].find('.//a:ln/a:prstDash',N).get('val')=='dash')
 check('No flattened slide images',not any(n.startswith('ppt/media/') for n in z.namelist()))
 check('No rhetorical contrast patterns',not re.search(r'not (just|merely)|more than simply|beyond X|critical juncture|unlocking potential',' '.join(alltext),re.I))
 check('Required status caveats visible',all(t in alltext[3].lower() for t in ['uncommitted','not current cash']) and 'historical august counterfactual' in alltext[8].lower() and 'illustrative downside' in alltext[7].lower())
reader=PdfReader(p/'SMPT_FI001_Hemerdon_Presentation_v2.pdf');check('PDF 18 pages',len(reader.pages)==18);linkCount=0;fonts=set()
with pdfplumber.open(p/'SMPT_FI001_Hemerdon_Presentation_v2.pdf') as pdf:
 for i,(page,pp) in enumerate(zip(reader.pages,pdf.pages),1):
  text=page.extract_text();check(f'PDF{i:02} selectable cutoff/title','4 November 2026' in text and len(text)>300)
  rect=page.mediabox;check(f'PDF{i:02} wide aspect',abs(float(rect.width)/float(rect.height)-16/9)<.002)
  for annot in page.get('/Annots',[]):
   a=annot.get_object();action=a.get('/A',{});uri=action.get('/URI')
   if uri:linkCount+=1;check(f'PDF{i:02} link{linkCount}',uri in urls)
  chars=pp.chars;fonts.update(c['fontname'].split('+')[-1] for c in chars)
  check(f'PDF{i:02} glyphs inside page',all(c['x0']>=0 and c['x1']<=pp.width+.5 and c['top']>=0 and c['bottom']<=pp.height+.5 for c in chars))
  check(f'PDF{i:02} render exists',(p/f'.build/rendered/slide-{i:02}.png').is_file())
check('PDF Archivo embedded text',any('Archivo' in f for f in fonts) and all('Archivo' in f for f in fonts),sorted(fonts));check('PDF source-link count',linkCount==sum(len(s['sourceKeys']) for s in spec['slides']),linkCount)
receipt=json.loads((p/'deck-validation-results.json').read_text());check('Finalizer matches delivered bytes',receipt['finalSha256']==sha(ppt));check('Finalizer native import passed',receipt['firstPartyImport']['passed']);check('Finalizer geometry no findings',receipt['presentationLayout']['findingCount']==0)
originals=[]
for folder in ['hemerdon-phase1a','hemerdon-phase1b','hemerdon-phase1c']:
 rel='research/financial-intelligence/'+folder
 for file in subprocess.check_output(['git','ls-tree','-r','--name-only',baseline,'--',rel],cwd=root,text=True).splitlines():
  original=subprocess.check_output(['git','show',baseline+':'+file],cwd=root);current=root/file;oldhash=hashlib.sha256(original).hexdigest();newhash=sha(current);originals.append({'path':file,'sha256':newhash});check('Preserve '+file,oldhash==newhash)
(p/'exhibit-inputs.json').write_text(json.dumps({'researchCutoff':'2026-11-04','modelSHA256':sha(model),'sourceValues':{k:{'value':f['value'],'unit':f['unit'],'sourceIds':f['sourceIds'],'locator':f['locator']} for k,f in F.items() if k in sourceIds or any(k in g for g in useGroups) or k in ['hfi-nwf-equity','hfi-nwf-loan','hfi-nwf-accordion','hfi-remaining-low','hfi-remaining-high','hfi-fy27-low','hfi-fy27-high','hfi-delay-cost','hfi-delay-months','hfi-nwf-tenor','hfi-nwf-margin','hfi-nwf-step']},'analystAssumptions':{'rateIncrement':0.01,'rateYears':1,'constantLoanBalanceGBP':25000000,'accordionAvailabilityGBP':0,'scenarioProbability':None},'derivedGBPmillion':{'core':61,'headline':71,'midpoint':42.5,'stressComponents':[2.5,3,.25],'stressTotal':float(stress),'augustGroupedUses':list(map(float,groupValues)),'augustSources':float(sourcesTotal),'augustRoundedUses':float(detail),'augustDeferralStated':float(aggregate),'augustDeferralDetail':float(detailed)}},indent=2)+'\n')
manifest={f.name:sha(f) for f in p.iterdir() if f.is_file() and f.suffix in ['.pptx','.pdf','.mjs','.py','.md','.png','.json'] and f.name!='validation-results.json'}
result={'baseline':baseline,'researchCutoff':'2026-11-04','slideCount':18,'mainSlides':14,'appendixSlides':4,'checkCount':len(checks),'failureCount':sum(not c['passed'] for c in checks),'checks':checks,'nativePowerPointVerified':False,'nativeExcelVerified':False,'pdfFonts':sorted(fonts),'pdfSourceLinkCount':linkCount,'finalizerWarnings':receipt['presentationLayout']['warnings'],'preservedArtifacts':originals,'artifactSHA256':manifest}
(p/'validation-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'checks':len(checks),'failures':result['failureCount'],'links':linkCount,'fonts':sorted(fonts)},indent=2))
for c in checks:
 if not c['passed']:print('FAIL',c)
sys.exit(bool(result['failureCount']))

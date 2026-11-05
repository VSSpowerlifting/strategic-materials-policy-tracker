"""Flagship FI002 report. Editable narrative master and original vector exhibits."""
from pathlib import Path
import json,html,csv
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor,white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,Spacer,PageBreak,KeepTogether
from reportlab.graphics.shapes import Drawing,String,Line,Rect
from reportlab.graphics.charts.barcharts import HorizontalBarChart,VerticalBarChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics import renderSVG
from pypdf import PdfReader
R=Path(__file__).resolve().parents[1]; O=R/'output'; B=R/'build';D=json.loads((B/'publication-data.json').read_text());K=D['key']
F=Path('/Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/standard_fonts')
for n,f in [('SMPT','LiberationSans-Regular.ttf'),('SMPT-Bold','LiberationSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(n,str(F/f)))
pdfmetrics.registerFontFamily('SMPT',normal='SMPT',bold='SMPT-Bold',italic='SMPT',boldItalic='SMPT-Bold')
INK=HexColor('#252421');GOLD=HexColor('#98752D');PAPER=HexColor('#FBFAF7');BAND=HexColor('#F0EEE8');RULE=HexColor('#D0CCC3');GRAY=HexColor('#817D74')
S={k:ParagraphStyle(k,fontName='SMPT-Bold'if k in ['title','section','th']else'SMPT',fontSize=size,leading=lead,textColor=INK,spaceAfter=after)for k,size,lead,after in [('title',21,25,12),('body',10,14,11),('section',11,15,5),('small',8,10.5,7),('th',9,12,0),('td',9,12,0)]};S['th'].textColor=white
# Canonical editorial narrative; charts and numerical assumptions remain unchanged.
PAGES=json.loads((B/'report-narrative.json').read_text())

def para(t,k='body'):return Paragraph(html.escape(t),S[k])
def chart(kind):
 dr=Drawing(520,205)
 if kind in ['prices','earnings','balances','static','duration','funding']:
  c=HorizontalBarChart();c.x=145;c.y=32;c.width=330;c.height=145
  if kind=='prices': labels=['GS prior 2027 avg','GS revised 2027 avg','World Bank 2027 avg']; vals=[13800,15400,13000];unit='US$/t, calendar 2027 average forecasts';lo=0;hi=16000
  elif kind=='earnings':labels=['Copper FY25','Copper FY26','Iron ore FY25','Iron ore FY26'];vals=[12.326,18.187,14.396,14.529];unit='Underlying EBITDA, US$bn; statutory segments';lo=0;hi=20
  elif kind=='balances':labels=['ICSG global 2026','GS ex-US 2026','ICSG global 2027','GS ex-US 2027'];vals=[104,-950,368,-220];unit='Refined balance kt; distinct geographies and forecast methods';lo=-1000;hi=500
  elif kind=='static':labels=[x['name']for x in D['market_cases']];vals=[x['ebitda']/1000 for x in D['market_cases']];unit='Hypothetical FY26-static EBITDA delta, US$bn vs $13,800/t';lo=-2;hi=3.2
  elif kind=='duration':labels=['20y from 2032','10y from 2032','10y from 2034','8% discount','12% discount'];vals=[x['kt']for x in D['thresholds'][:5]];unit='Required equivalent benefit, ktpa; other base assumptions fixed';lo=0;hi=360
  else:labels=['Operating CF','Investing outflow','Reported FCF','BHP dividends','NCI dividends','After dividends'];vals=[21.778,12.011,9.767,6.756,2.355,.656];unit='FY2026 consolidated cash-use measures, US$bn';lo=0;hi=24
  c.data=[vals];c.categoryAxis.categoryNames=labels;c.categoryAxis.labels.fontName='SMPT';c.categoryAxis.labels.fontSize=8;c.valueAxis.labels.fontName='SMPT';c.valueAxis.labels.fontSize=8;c.valueAxis.valueMin=lo;c.valueAxis.valueMax=hi;c.bars[0].fillColor=GOLD;c.bars[0].strokeColor=None;c.barLabels.nudge=4;c.barLabels.fontName='SMPT';c.barLabels.fontSize=8;c.barLabelFormat='%.1f'if kind in ['earnings','static','funding']else'%.0f'
  if lo<0:c.categoryAxis.labels.dx=lo/(hi-lo)*c.width-5
  dr.add(c);dr.add(String(0,192,unit,fontName='SMPT',fontSize=9,fillColor=INK))
 elif kind=='frontier':
  c=LinePlot();c.x=48;c.y=36;c.width=440;c.height=140;c.data=[[(x['price'],x['kt'])for x in D['frontier']if x['burden']==b]for b in [3000,4000,5000]];c.xValueAxis.valueMin=8500;c.xValueAxis.valueMax=13000;c.xValueAxis.valueSteps=[8500,9500,10494,11500,13000];c.xValueAxis.labelTextFormat=lambda v:f'{v:,.0f}';c.xValueAxis.labels.fontName='SMPT';c.xValueAxis.labels.fontSize=8;c.yValueAxis.valueMin=0;c.yValueAxis.valueMax=450;c.yValueAxis.valueStep=100;c.yValueAxis.labels.fontName='SMPT';c.yValueAxis.labels.fontSize=8
  for i,col in enumerate([GRAY,GOLD,INK]):c.lines[i].strokeColor=col;c.lines[i].strokeWidth=2
  dr.add(c);dr.add(String(0,193,'Required equivalent benefit (ktpa) by long-term copper price (US$/t)',fontName='SMPT',fontSize=9));
  for i,(label,col)in enumerate([('$3,000/t burden',GRAY),('$4,000/t burden',GOLD),('$5,000/t burden',INK)]):dr.add(String(38+i*165,9,label,fontName='SMPT',fontSize=8,fillColor=col))
 else:return None
 return dr

TABLES={
'summary':[['Original finding','Financial significance'],['$2.83bn FY26-static EBITDA differential','Reported GS price revision at disclosed BHP exposure'],['$4.25bn same-scope spread','GS versus World Bank; no FCF conversion'],['199ktpa becomes 333ktpa in a shorter screen','Duration and the no-build baseline can dominate'],['Maintain funded readiness','Construction options need a verified counterfactual']],
'proxy':[['Comparison','Scope / result'],['Issuer FY26 sensitivity','Existing consolidated exposure; $2.830bn EBITDA illustration'],['Illustrative FY27-scale proxy','1.575Mt x95% sales x95% pass-through; $2.274bn'],['Exact reconciliation','Unavailable: contracts, exposed sales and response differ'],['Decision use','Lead with issuer sensitivity; no inferred funding forecast']],
'project':[['Development milestone','Evidence and financial meaning'],['17 March 2026 announcement','$4.4-5.9bn; replacement plan'],['18 August investor estimates','$5.4-6.3bn nominal; 16-18% issuer IRR'],['20 October operating review','$0.8bn gross readiness approval; full FID still ahead'],['4 November filing indexed','Applicant extension request; no inferred approval'],['CY2027-28 / CY2031-32','Target FID / first production, subject to gates']],
'recovery':[['Screen input or result','Base case'],['Gross nominal capital / present value','$5.850bn / $4.435bn'],['Discount / benefit convention','10% nominal / 20 full years from 2032'],['Required annual after-tax benefit','$839m'],['Assumed after-tax contribution','$4,221/t at $10,494 price and $4,000 burden'],['Equivalent benefit / facility midpoint','198.8ktpa / 250ktpa; counterfactual unmeasured']],
'decision':[['Course of action','When financially defensible'],['Maintain readiness','Replacement need credible; preserve permitted engineering path'],['Accelerate selected work','Costed avoided continuity loss exceeds premium; safe and permitted'],['Stage or re-scope','Return/readiness gap persists and alternatives protect output'],['Defer major construction','Complete counterfactual demonstrates option value exceeds lost benefit']],
'methods':[['Research result','Decision boundary'],['Comparable price-exposure calculation','FY26-static EBITDA illustration, not future FCF'],['Reverse appraisal of replacement benefit','No independently measured with/without-build production'],['Historical cash and management projections','Different periods and scopes stay separate'],['Conditional readiness framework','Construction options require a complete counterfactual']],
}
def table(vals):
 t=Table([[para(str(x),'th'if i==0 else'td')for x in row]for i,row in enumerate(vals)],colWidths=[205,315],hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('ROWBACKGROUNDS',(0,1),(-1,-1),[BAND,PAPER]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]));return t
def links(ids):return Paragraph('Evidence: '+' &nbsp; '.join(f'<link href="{html.escape(next(x[4]for x in D["sources"]if x[0]==id))}" color="#775A20"><b><u>{id}</u></b></link>'for id in ids),S['small'])
def running(c,doc):
 c.setFillColor(PAPER);c.rect(0,0,612,792,fill=1,stroke=0);c.setFillColor(GOLD);c.setFont('SMPT-Bold',9);c.drawString(46,760,'SMPT / FINANCIAL INTELLIGENCE 002');c.setStrokeColor(GOLD);c.line(46,749,566,749);c.setFillColor(INK);c.setFont('SMPT',8);c.drawString(46,28,'Independent research / 5 November 2026 / Editorial review copy');c.drawRightString(566,28,str(doc.page))
story=[];md=['# '+D['title'],'\n'+D['subtitle'],'\nResearch cutoff: 5 November 2026. Independent SMPT research. Neither Goldman Sachs nor BHP commissioned, sponsored or endorsed this publication.\n'];html_parts=[]
for i,(title,section,kind,ids,paragraphs)in enumerate(PAGES):
 if i==0:story.extend([para('Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision','title'),para(D['subtitle'],'body'),para(PAGES[0][0]+' / 5 November 2026','small'),para('Independent SMPT research. Neither Goldman Sachs nor BHP commissioned, sponsored or endorsed this publication.','small')])
 else:story.extend([para(section.upper(),'small'),para(title,'title')])
 md.append('\n## '+title);hp=['<section><h2>'+html.escape(title)+'</h2>'];c=chart(kind)
 # Place the exhibit after the opening paragraph, so every page opens with an argument.
 for j,(label,body)in enumerate(paragraphs):
  story.append(Paragraph(('<b>'+html.escape(label)+'.</b> ' if label else '')+html.escape(body),S['body']))
  if label:md.append('\n### '+label)
  md.append('\n'+body);hp.append('<p>'+('<strong>'+html.escape(label)+'.</strong> ' if label else '')+html.escape(body)+'</p>')
  if j==0 and c:
   captions={'prices':'Goldman’s reported annual average is 18.5% above the World Bank’s. BHP long-term planning prices are excluded from this same-horizon chart.','balances':'Global and ex-US balances describe distinct markets. Their difference is not an estimated US surplus.','earnings':'Copper EBITDA rose strongly while iron ore changed little. This is an observed result, not a causal price bridge.','static':'Original calculation using BHP’s disclosed FY26 sensitivity, relative to the older reported $13,800/t forecast. Not a 2027 earnings forecast.','frontier':'Required equivalent benefit changes with both price and the assumed net cash burden. All curves use five equal capital draws, 20 benefit years and a 10% discount rate.','duration':'The disclosed FY34-43 averaging window does not substantiate twenty flat benefit years. All results are hypothetical screens.','funding':'Reported FY26 FCF already includes investing outflows. Cash after dividends is a historical subtotal before other financing, not future project funding.'}
   caption=f'Exhibit {i+1}. '+captions[kind]
   story.extend([c,para(caption,'small')]);(O/'figures').mkdir(exist_ok=True);svg=renderSVG.drawToString(c);(O/'figures'/f'exhibit-{i+1:02}.svg').write_text(svg);hp.extend([svg,'<p class="caption">'+html.escape(caption)+'</p>']);md.extend([f'\n![Exhibit {i+1}](figures/exhibit-{i+1:02}.svg)','\n'+caption])
 if kind in TABLES:
  vals=TABLES[kind];story.extend([Spacer(1,3),table(vals),Spacer(1,9)]);md.extend(['\n'+' | '.join(vals[0]),' | '.join(['---']*len(vals[0]))]+[' | '.join(r)for r in vals[1:]]);hp.append('<table>'+''.join('<tr>'+''.join('<'+('th'if n==0 else'td')+'>'+html.escape(v)+'</'+('th'if n==0 else'td')+'>'for v in row)+'</tr>'for n,row in enumerate(vals))+'</table>')
 story.append(links(ids));md.append('\nEvidence: '+' / '.join(f'[{id}]({next(x[4]for x in D["sources"]if x[0]==id)})'for id in ids));hp.append('<p>Evidence: '+' '.join(f'<a href="{next(x[4]for x in D["sources"]if x[0]==id)}">{id}</a>'for id in ids)+'</p></section>');html_parts+=hp;story.append(PageBreak())
story.extend([para('SOURCE GUIDE AND RESEARCH ACCESS','small'),para('Inspect the evidence and reproduce the analysis','title'),para('The evidence register distinguishes source documents from access attempts. The claim matrix links major conclusions to document locators and separates reported facts, forecasts and original assumptions. Original bank research is not redistributed.','body')]);md.append('\n## Inspect the evidence and reproduce the analysis')
for id in ['S01','S02','S03','S05','S06','S07','S08','S09','S12','S16','S17','S18','S19','S20']:
 s=next(x for x in D['sources']if x[0]==id);story.append(Paragraph(f'<b>{id} / {html.escape(s[1])}.</b> <link href="{html.escape(s[4])}" color="#775A20"><b><u>{html.escape(s[2])}</u></b></link>. {html.escape(s[3])}. {html.escape(s[6])}. {html.escape(s[9])}.',S['small']));md.append(f'- {id} / {s[1]}. [{s[2]}]({s[4]}). {s[3]}. {s[6]}. {s[9]}.')
source_ids=['S01','S02','S03','S05','S06','S07','S08','S09','S12','S16','S17','S18','S19','S20']
source_intro='The evidence register distinguishes source documents from access attempts. The claim matrix links major conclusions to document locators and separates reported facts, forecasts and original assumptions. Original bank research is not redistributed.'
md.insert(md.index('\n## Inspect the evidence and reproduce the analysis')+1,'\n'+source_intro)
html_parts.append('<section><h2>Inspect the evidence and reproduce the analysis</h2><p>'+source_intro+'</p><ul>'+''.join('<li>'+html.escape(x[0]+' / '+x[1])+'. <a href="'+x[4]+'">'+html.escape(x[2])+'</a>. '+html.escape(x[3]+'. '+x[6]+'. '+x[9])+'.</li>'for id in source_ids for x in D['sources']if x[0]==id)+'</ul>')
story.extend([Spacer(1,9),Paragraph('<b>Working model.</b> <link href="https://docs.google.com/spreadsheets/d/1MysAjBqAQ4-63XPo7YtncDle3q4faZDsBpTaVBWsg1k/edit?usp=drivesdk" color="#775A20"><u>Native Google Sheet</u></link>. <b>Research baseline.</b> <link href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202" color="#775A20"><u>PR #202</u></link>. Supporting methods, evidence, calculations and the executive deck are included in the private delivery folder.',S['body']),para('Supporting materials include the methodology, evidence register, claim-source matrix and reproducible calculation files. The source register records access limitations and document locators for further investigation.','body')])
md.extend(['\nWorking model: [Native Google Sheet](https://docs.google.com/spreadsheets/d/1MysAjBqAQ4-63XPo7YtncDle3q4faZDsBpTaVBWsg1k/edit?usp=drivesdk). Research baseline: [PR #202](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202). Supporting methods, evidence, calculations and the executive deck are included in the private delivery folder.','\nSupporting materials include the methodology, evidence register, claim-source matrix and reproducible calculation files. The source register records access limitations and document locators for further investigation.'])
html_parts.append('<p>Working model: <a href="https://docs.google.com/spreadsheets/d/1MysAjBqAQ4-63XPo7YtncDle3q4faZDsBpTaVBWsg1k/edit?usp=drivesdk">Native Google Sheet</a>. Research baseline: <a href="https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/202">PR #202</a>. Supporting methods, evidence, calculations and the executive deck are included in the private delivery folder.</p><p>Supporting materials include the methodology, evidence register, claim-source matrix and reproducible calculation files. The source register records access limitations and document locators for further investigation.</p></section>')
doc=SimpleDocTemplate(str(O/'SMPT_FI002_BHP_Copper_Research_Report.pdf'),pagesize=(612,792),leftMargin=46,rightMargin=46,topMargin=57,bottomMargin=48,title=D['title'],author='Strategic Materials Policy Tracker')
doc.build(story,onFirstPage=running,onLaterPages=running)
(O/'SMPT_FI002_BHP_Copper_Research_Report.md').write_text('\n'.join(md)+'\n')
(O/'SMPT_FI002_BHP_Copper_Research_Report.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+html.escape(D['title'])+'</title><style>body{font:16px/1.6 Arial,sans-serif;color:#252421;background:#FBFAF7;max-width:950px;margin:45px auto;padding:0 25px}h1,h2{line-height:1.2}h2{margin-top:2em;border-bottom:1px solid #98752D;padding-bottom:14px}a{color:#775A20;text-decoration:underline;font-weight:bold}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:10px;text-align:left}th{background:#262523;color:white}tr:nth-child(even){background:#F0EEE8}svg{max-width:100%;height:auto}</style><h1>'+html.escape(D['title'])+'</h1><p>'+html.escape(D['subtitle'])+'</p><p>Independent SMPT research / cutoff 5 November 2026 / Editorial review copy</p><p>Neither Goldman Sachs nor BHP commissioned, sponsored or endorsed this publication.</p>'+''.join(html_parts)+'</html>')
(B/'report-content.json').write_text(json.dumps(PAGES,indent=2,ensure_ascii=False))
pdf=PdfReader(O/'SMPT_FI002_BHP_Copper_Research_Report.pdf');print('Report pages',len(pdf.pages));print('Page word counts',[len(p.extract_text().split())for p in pdf.pages])
if len(pdf.pages)!=len(PAGES)+1:raise RuntimeError('Unexpected section overflow; inspect and repair')

"""Two-page decision brief; the 14-page report remains the flagship."""
from pathlib import Path
import json,html
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,Spacer,PageBreak
from pypdf import PdfReader
R=Path(__file__).resolve().parents[1];O=R/'output';D=json.loads((R/'build/publication-data.json').read_text())
F=Path('/Users/benjaminyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/standard_fonts')
for n,f in [('SMPT','LiberationSans-Regular.ttf'),('SMPT-Bold','LiberationSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(n,str(F/f)))
pdfmetrics.registerFontFamily('SMPT',normal='SMPT',bold='SMPT-Bold',italic='SMPT',boldItalic='SMPT-Bold')
INK=HexColor('#252421');GOLD=HexColor('#98752D');PAPER=HexColor('#FBFAF7');BAND=HexColor('#F0EEE8')
S={k:ParagraphStyle(k,fontName='SMPT-Bold'if k in ['title','sub']else'SMPT',fontSize=z,leading=l,textColor=INK,spaceAfter=10)for k,z,l in [('title',21,25),('sub',12,16),('body',11,15),('small',9,12)]}
PAGES=[('Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision',[
('Judgment',"Maintain funded engineering, permitting and conditional FID readiness for the Escondida New Concentrator. Selectively accelerate preparation that resolves uncertainty or protects a credible replacement timetable. Public disclosures cannot establish whether construction acceleration or deferral has the highest expected value."),
('Why Goldman matters',"The reported October forecast raised Goldman’s calendar-2027 average copper price to $15,400/t from $13,800/t. BHP’s disclosed FY2026 sensitivity of $39m of underlying EBITDA per US cent/lb translates the $1,600/t revision into $2.83bn of hypothetical static EBITDA exposure. The $2,400/t gap to the World Bank’s $13,000/t forecast translates into $4.25bn on the same basis. Neither result is a 2027 earnings forecast or a project funding allowance."),
('The investment is about replacement',"The $5.4–6.3bn nominal gross plant budget replaces Los Colorados. The 230–270ktpa facility range cannot be treated as wholly incremental mine output. BHP guides to a 16–18% IRR at a long-term $4.76/lb copper assumption, approximately $10,494/t. First production targets 2031–32. A bullish 2027 price can improve financing flexibility without proving lifetime investment returns."),
('What the original analysis contributes',"The research compares price expectations at a common disclosed earnings-exposure scale and tests the benefits needed to recover a replacement budget. It finds that a seemingly precise production hurdle is highly sensitive to benefit duration, margin and the unavailable no-build mine plan. That limits the case for a blanket recommendation to accelerate or stage construction."),
],['S01','S03','S12','S16','S18']),
('Decision conditions and evidence that would change the judgment',[
('How to interpret 199ktpa',"Five equal $1.17bn capital draws in 2027–31, a 10% nominal discount rate and 20 full benefit years from 2032 imply $839m of annual after-tax benefit to recover $5.85bn. At an assumed $10,494/t price, $4,000/t all-in net burden and 35% cash-tax wedge, that equals 198.8ktpa of preserved or added benefit. The burden is not C1 cost. The screen estimates neither actual project NPV nor BHP’s IRR."),
('What changes the screen',"Crediting only ten benefit years from 2034 raises the required equivalent to 333ktpa. Combined $8,500/t copper, 20% more capital and two years of benefit delay produces 416ktpa. BHP’s output averaging window is FY2034–43, not a disclosed twenty-year flat schedule. The results demonstrate assumption risk, not project failure or success."),
('Funding discipline',"FY2026 operating cash of $21.778bn less net investing outflow of $12.011bn gives $9.767bn of FCF. After $6.756bn of BHP cash dividends and $2.355bn of NCI dividends, $0.656bn remains before other financing. This is history, not a forecast. BHP’s cumulative attributable Copper FCF scenarios of $12bn in FY2027–31 and $24bn in FY2032–35 already include modeled investment. Do not deduct concentrator capital again."),
('Evidence for a different decision',"Accelerate construction if a permitted, executable plan shows avoided continuity losses worth more than the premium and added risk. Stage or re-scope if returns weaken and alternative processing can preserve production cheaply. The next most valuable inputs are annual with-build and no-build output, alternate circuits, sustaining cost, closure, tax and capital schedules. Near-term bank price targets cannot resolve those unknowns."),
],['S01','S03','S05','S17'])]
story=[];md=['# SMPT FI002 Executive Brief','Cutoff: 5 November 2026. Independent SMPT research. No affiliation, sponsorship or endorsement by Goldman Sachs or BHP.\n']
for i,(title,paras,ids)in enumerate(PAGES):
 if i:story.append(PageBreak())
 story.append(Paragraph(html.escape(title),S['title']));md.append('## '+title)
 if i==0:story.append(Paragraph('Executive decision brief / Independent SMPT research. Neither Goldman Sachs nor BHP commissioned, sponsored or endorsed this publication.',S['small']))
 for label,body in paras:story.append(Paragraph('<b>'+html.escape(label)+'.</b> '+html.escape(body),S['body']));md.extend(['### '+label,body+'\n'])
 a='Evidence: '+' / '.join(f'<link href="{next(s[4]for s in D["sources"]if s[0]==id)}" color="#775A20"><u><b>{id}</b></u></link>'for id in ids)
 story.append(Paragraph(a,S['small']));md.append('Evidence: '+' / '.join(f'[{id}]({next(s[4]for s in D["sources"]if s[0]==id)})'for id in ids))
 if i==1:story.append(Paragraph('<b>READY FOR EDITORIAL REVIEW.</b> Original Goldman annual-average attribution uses corroborated public reporting. Project cash flows and no-build output remain unavailable. Current permit stage is mirror-based. Internal checks are not external assurance. Public release requires separate approval.',S['small']))
def running(c,doc):
 c.saveState();c.setFillColor(PAPER);c.rect(0,0,612,792,fill=1,stroke=0);c.setFont('SMPT-Bold',9);c.setFillColor(GOLD);c.drawString(46,760,'SMPT / FINANCIAL INTELLIGENCE 002 / EXECUTIVE BRIEF');c.setStrokeColor(GOLD);c.line(46,749,566,749);c.setFont('SMPT',8);c.setFillColor(INK);c.drawString(46,28,'Independent research / 5 November 2026 / Editorial review copy');c.drawRightString(566,28,str(doc.page));c.restoreState()
pdf=O/'SMPT_FI002_BHP_Copper_Memo.pdf';SimpleDocTemplate(str(pdf),pagesize=(612,792),leftMargin=46,rightMargin=46,topMargin=61,bottomMargin=48,title='SMPT FI002 Executive Decision Brief',author='Strategic Materials Policy Tracker').build(story,onFirstPage=running,onLaterPages=running)
(O/'SMPT_FI002_BHP_Copper_Memo.md').write_text('\n'.join(md)+'\n')
assert len(PdfReader(pdf).pages)==2
print('Executive brief: two pages')

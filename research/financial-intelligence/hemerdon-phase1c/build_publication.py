"""Build FI001 from the accepted Phase 1B record. No network access or source edits.
Requires python-docx, openpyxl. Render DOCX and finalize PPTX separately; see README.
"""
import json, hashlib, shutil
from decimal import Decimal
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from openpyxl import load_workbook
HERE=Path(__file__).resolve().parent
A=HERE.parent/'hemerdon-phase1a'; B=HERE.parent/'hemerdon-phase1b'
content=json.loads((HERE/'publication-content.json').read_text())
sources=json.loads((A/'sources.json').read_text())
src={x['id']:x for x in sources}
ids=['hfs-tw-ar2026','hfs-tw-oct2026','src-nwf-tungsten-west-2026','hfs-nwf-terms','hfs-bridge-repaid','hfs-processing','hfs-elmet-rns','hfs-group-security-2026','hfs-tw-apr2026','hfs-tw-may2026']
refs={f'S{i+1}':src[s] for i,s in enumerate(ids)}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
wb=load_workbook(A/'hemerdon-financial-model.xlsx',data_only=True)
v=json.loads((B/'validation-results.json').read_text())
assert sha(A/'hemerdon-financial-model.xlsx')==v['inputSHA256']
assert v['failureCount']==0 and v['caseCount']==32
findings={
 'coreGrossGBP':wb['Funding']['D10'].value,
 'headlineGBP':wb['Funding']['D12'].value,
 'remainingMidpointGBP':wb['Funding']['D16'].value,
 'downsideIncrementGBP':float(Decimal('45000000')-Decimal('42500000')+Decimal('3000000')+Decimal('0.01')*Decimal('25000000')),
 'augustNoReceiptsStatedGBP':88000000-15000000-(88000000-13000000),
 'augustNoReceiptsDetailGBP':88000000-15000000-(87000000-13000000),
 'coreCoverageGBPPerMtu':wb['Operating']['D21'].value}
assert findings['coreGrossGBP']==61000000 and findings['headlineGBP']==71000000
assert findings['remainingMidpointGBP']==42500000 and findings['downsideIncrementGBP']==5750000
assert findings['augustNoReceiptsStatedGBP']==-2000000 and findings['augustNoReceiptsDetailGBP']==-1000000
assert abs(findings['coreCoverageGBPPerMtu']-438.149241883924)<1e-9
exhibits={'cutoff':'2026-11-04','acceptedCommit':'772f2f4c02631f533a0a893849c9bedb8a6ff8ad','modelSHA256':v['inputSHA256'],'findings':findings,'sourceAliases':{k:x['id'] for k,x in refs.items()},'units':'GBP unless explicitly GBP million or GBP per mtu','interpretation':'Dated transaction structure and bounded scenarios; not a current cash or funding-gap forecast','workbookCells':{'coreGrossGBP':'Funding!D10','headlineGBP':'Funding!D12','remainingMidpointGBP':'Funding!D16','downsideIncrementGBP':'Funding!D21 (Downside)','augustNoReceiptsStatedGBP':'August plan!D35 (receipts factor 0)','augustNoReceiptsDetailGBP':'August plan detailed uses, independently summed','coreCoverageGBPPerMtu':'Operating!D21 (Base)'}}
(HERE/'publication-exhibits.json').write_text(json.dumps(exhibits,indent=2)+'\n')
shutil.copyfile(A/'hemerdon-financial-model.xlsx',HERE/'SMPT_FI001_Hemerdon_Financial_Model.xlsx')
assert sha(HERE/'SMPT_FI001_Hemerdon_Financial_Model.xlsx')==v['inputSHA256']
(HERE/'SMPT_FI001_Research_Abstract.md').write_text('# '+content['title']+'\n\n'+content['abstract']+'\n\nResearch cutoff: 4 November 2026. Prepared for publication review; release requires separate authorization.\n')

def link(p,label,url):
 h=OxmlElement('w:hyperlink');h.set(qn('r:id'),p.part.relate_to(url,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',is_external=True))
 r=OxmlElement('w:r');pr=OxmlElement('w:rPr')
 for tag,attrs in [('w:rFonts',{'w:ascii':'Arial','w:hAnsi':'Arial'}),('w:color',{'w:val':'73571F'}),('w:b',{}),('w:u',{'w:val':'single'})]:
  e=OxmlElement(tag)
  for k,val in attrs.items():e.set(qn(k),val)
  pr.append(e)
 r.append(pr);t=OxmlElement('w:t');t.text=label;r.append(t);h.append(r);p._p.append(h)

doc=Document();sec=doc.sections[0]
sec.page_width=Inches(8.5);sec.page_height=Inches(11)
sec.top_margin=Inches(.64);sec.bottom_margin=Inches(.62);sec.left_margin=sec.right_margin=Inches(.72)
sec.header_distance=Inches(.27);sec.footer_distance=Inches(.27)
for name in ['Normal','Title','Heading 1','Heading 2','Caption','Header','Footer']:
 st=doc.styles[name];st.font.name='Arial';st.font.color.rgb=RGBColor.from_string('252421')
normal=doc.styles['Normal'];normal.font.size=Pt(10);normal.paragraph_format.line_spacing=1.12;normal.paragraph_format.space_after=Pt(7)
doc.styles['Title'].font.size=Pt(25);doc.styles['Title'].font.bold=True
doc.styles['Heading 1'].font.size=Pt(16);doc.styles['Heading 1'].paragraph_format.space_after=Pt(12)
doc.styles['Heading 2'].font.size=Pt(11);doc.styles['Heading 2'].font.bold=True
doc.styles['Caption'].font.size=Pt(9);doc.styles['Caption'].font.bold=True
doc.core_properties.title=content['title'];doc.core_properties.author='Strategic Materials Policy Tracker';doc.core_properties.subject='Financial Intelligence 001; research cutoff 4 November 2026; review edition'
h=sec.header.paragraphs[0];h.text='STRATEGIC MATERIALS POLICY TRACKER                                         FINANCIAL INTELLIGENCE 001';h.runs[0].font.size=Pt(8)
f=sec.footer.paragraphs[0];f.text='Hemerdon   /   Research cutoff 4 November 2026   /   Publication review'
f.runs[0].font.size=Pt(8);f.add_run(' '*5)
fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');f._p.append(fld)
for i,page in enumerate(content['pages']):
 if i:doc.add_page_break()
 if i==0:
  p=doc.add_paragraph('FINANCIAL DUE DILIGENCE MEMORANDUM');p.runs[0].font.size=Pt(9);p.runs[0].bold=True;p.runs[0].font.color.rgb=RGBColor.from_string('98752D')
  doc.add_paragraph(content['title'],'Title')
  p=doc.add_paragraph(content['subtitle']);p.runs[0].font.size=Pt(11)
  p=doc.add_paragraph('Independent SMPT research   •   Evidence through 4 November 2026');p.runs[0].font.size=Pt(9)
 doc.add_heading(page['heading'],level=1)
 for text in page['paragraphs']:doc.add_paragraph(text)
 if 'exhibit' in page:
  e=page['exhibit'];doc.add_paragraph(e['title'],'Caption')
  t=doc.add_table(rows=1,cols=len(e['headers']));t.autofit=False
  widths=([2.52,4.54] if len(e['headers'])==2 else [2.7,2.1,2.26])
  for c,w in zip(t.columns,widths):c.width=Inches(w)
  for j,text in enumerate(e['headers']):t.rows[0].cells[j].text=text
  for row in e['rows']:
   cells=t.add_row().cells
   for j,text in enumerate(row):cells[j].text=text
  for r,row in enumerate(t.rows):
   trPr=row._tr.get_or_add_trPr();flag=OxmlElement('w:cantSplit');trPr.append(flag)
   for c in row.cells:
    tcPr=c._tc.get_or_add_tcPr();shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'262523' if r==0 else ('F0EEE8' if r%2 else 'FBFAF7'));tcPr.append(shade)
    for p in c.paragraphs:
     p.paragraph_format.space_after=Pt(5);p.paragraph_format.space_before=Pt(5);p.paragraph_format.line_spacing=1.06
     for run in p.runs:run.font.size=Pt(9);run.font.color.rgb=RGBColor.from_string('FFFFFF' if r==0 else '252421');run.bold=r==0
  doc.add_paragraph().paragraph_format.space_after=Pt(0)
 if page.get('sourceGuide'):
  for k,s in refs.items():
   p=doc.add_paragraph();p.paragraph_format.space_after=Pt(5)
   link(p,k+'  '+s['title'],s['url']);p.add_run('  ('+(s['datePublished'] or 'Deed dated 28 August; filed 1 September 2026')+')')
   for run in p.runs:run.font.size=Pt(8)
 for text in page.get('after',[]):doc.add_paragraph(text)
 if not page.get('sourceGuide'):
  p=doc.add_paragraph('Sources: ');p.paragraph_format.space_before=Pt(3)
  for k in page['sources']:link(p,k,refs[k]['url']);p.add_run('  ')
  p.add_run('Locators and full titles on page 8 and in the evidence appendix.')
  for run in p.runs:run.font.size=Pt(8)
# Remove inherited Word theme borders, including the default blue title rule.
for st in doc.styles:
 for border in list(st.element.iter(qn('w:pBdr'))):border.getparent().remove(border)
for border in list(doc.element.iter(qn('w:pBdr'))):border.getparent().remove(border)
for root in [doc.element,doc.styles.element]:
 for fonts in root.iter(qn('w:rFonts')):
  for attr in list(fonts.attrib):
   if 'Theme' in attr:del fonts.attrib[attr]
  fonts.set(qn('w:ascii'),'Arial');fonts.set(qn('w:hAnsi'),'Arial')
doc.save(HERE/'SMPT_FI001_Hemerdon_Financial_Memo.docx')
# Publication-facing evidence appendix draws traceability directly from canonical records.
facts=json.loads((A/'evidence.json').read_text())['facts']
lines=['# FI001 evidence and methodology appendix','', '**Research cutoff: 4 November 2026. Production date: 5 November 2026.** Publication-review edition.','',
 '## Evidence hierarchy and scope','',
 'Audited accounts establish dated consolidated balances. Issuer presentations establish management guidance and claimed milestones. Announcements establish the described transaction status at their date. A filed security deed establishes documentary terms, subject to its scope. Analyst arithmetic and scenarios are explicitly identified. Neither disclosure nor source verification independently validates forecast operating outcomes.','',
 '## Financial classifications','',
 '| Term | Treatment |','|---|---|',
 '| Equity | Gross subscription is transaction financing. Net bank credit requires fees and payment reconciliation. Equity is residual risk capital, with ownership consequences. |',
 '| Core loan | Commitment, effective facility, drawdown and current principal are separate statuses. Full £25m draw disclosed by 2 September does not establish November principal. |',
 '| Accordion | £10m uncommitted additional debt capacity. No default availability or receipt assumed. |',
 '| Restricted cash | £14,912,042 escrow at 31 March is separately restricted and excluded from general-use cash. |',
 '| Receipts | The August £15m is anticipated operating receipts, not financing or collected cash. |',
 '| Remaining spend | October £40–45m project guidance excludes opex. Do not add to overlapping August uses. |',
 '| Non-cash accounting | CLN conversion and fair-value remeasurement do not fund construction or measure cash burn. |','',
 '## Model reconciliation and scenarios','',
 'Exhibits use the publication workbook, an unchanged copy of the Phase 1B accepted model. `publication-exhibits.json` records the controlling workbook hash, output values, cells and source aliases. `build_publication.py` derives and asserts the four principal results using cached workbook values and independent arithmetic. The independent validator recalculates disposable copies.','',
 '| Finding | Derivation | Workbook |','|---|---|---|',
 '| A | £36m equity + £25m core = £61m. Add £10m uncommitted = £71m headline. | Funding D8:D12 |',
 '| B | (£40m + £45m) / 2 = £42.5m reference convention. | Funding D16:D17, Base |',
 '| C | (£45m − £42.5m) + £3m + 1% × £25m × one year = £5.75m. Analyst combined stress. | Funding D18:D21, Downside |',
 '| D | £88m − £15m − (£88m − £13m) = −£2m. Detailed rounded uses £87m instead imply −£1m. | August plan D35:D37, receipts factor 0 |','',
 'The August reserve-target shortfall is £15m. The ending cash deficit on stated totals is £2m. These metrics differ. The rounded £1m difference is retained, not plugged. The original peak date is unspecified. No current deficit is inferred.','',
 'The £5.75m stress and August receipt counterfactual have different bases and must not be added. The rate proxy assumes constant principal and one year. It does not reconstruct contractual pricing or fees. Upside uses £40m project spend, Base £42.5m, Downside £45m. The producer floors incremental stress at zero, so the Upside output is zero rather than negative cash generation. The £2.5m reduction in spending remains visible in the spend comparison.','',
 '## Operating metric definitions','',
 'The FY2028 core cash reference is £70–75m opex/sustaining capex + approximately £6m equipment service + approximately £26m NWF service + £7m Hargreaves = £109–114m. Midpoint is £111.5m. This is a selected annual cash reference, not CFADS or a monthly liquidity forecast.','',
 'Tungsten receipt coefficient = 3,300 tonnes × 100 mtu/tonne × 79.5% payability × (1 − 3% modeled deduction) = 254,479.5. A metric tonne unit (mtu) represents 10 kg of WO3. Output is contained WO3, not tungsten metal. The 3,300-tonne reference is below issuer guidance of more than 3,300 tonnes. At fixed coefficients, a £100/mtu GBP APT-reference change moves annual receipts proxy by £25,447,950.','',
 'Core coverage = core cash reference / receipt coefficient, producing £428.33/£438.15/£447.97 per mtu. Tin and aggregate receipts, restart capex, growth, taxes and working capital are excluded. Missing items work in both directions. This is neither total break-even nor a conservative bound. Contract-specific coefficients require confirmation. No forward commodity price, FX forecast or executed Elmet price is assumed.','',
 '## Unavailable disclosures and publication boundaries','',
 'Current unrestricted cash, current aggregate debt, a complete funding gap, valuation, NPV/IRR, DSCR, covenant headroom, repayment sufficiency and default probability remain unavailable. See the Phase 1B information-request checklist. Priorities are a bank-reconciled post-March cash ledger, an unpaid capex ledger, executed loan terms, equipment-debt reconciliation and monthly production-to-collection forecasts.','',
 'The loan tenor origin differs between announcement and accounts. The security deed does not name NWF or settle maturity, priority or enforceability. April equipment agreement and October current/ordered amounts are not added. Prospective option funding is not treated as bank cash. A £6,104 historical lease-payment presentation difference remains open for any future contractual debt-service bridge.','',
 '## Source rights and review','',
 'This package contains original analysis and limited factual paraphrase, with hyperlinks to underlying sources. It redistributes no source PDFs, AMC tables or proprietary benchmark series. The AMC executive summary is indexed for rights awareness and contributes no restricted tables or model inputs. Public accessibility is not a redistribution licence. Source-specific rights clearance and independent human finance/editorial approval remain release gates. Role-based skeptical review in the QC report is an AI second pass, not an independent human sign-off.','',
 '## Publication source aliases','']
for k,s in refs.items():
 lines.extend([f"- **{k}** — [{s['title']}]({s['url']}). {s['issuer']}. Published {s['datePublished'] or 'date not established'}. Canonical ID `{s['id']}`."])
lines+=['','Locators: S1 printed pp29,33–38,53–57,64 (PDF page = printed +2). S2 slides4,15,20,22–23,33. S3 announcement body. S4 Debt Facility, Relationship Agreement and Sources and Uses appendix. S5 announcement body. S6 processing announcement body. S7 highlights and Further information. S8 PDF pp3–4,7–9,38,42. S9 project funding/equipment update. S10 funding update. Claim-specific locators below control over this summary.','','## Complete source register','']
for s in sources:
 lines += [f"### {s['id']}",f"[{s['title']}]({s['url']})",f"Issuer: {s['issuer']}. Type: {s['documentType']}. Published: {s['datePublished'] or 'unknown / not applicable'}. Accessed: {s.get('dateAccessed','not recorded')}.",s.get('rights','Rights not recorded.'),'']
lines+=['## Claim to source and model input ledger','','The following entries are generated directly from the accepted 158-record evidence register. Values retain original units and nulls. Full qualifiers remain in the canonical JSON; no numerical records are retyped.','']
for f in facts:
 lines += [f"### {f['id']} — {f['label']}",f"Value: `{f['value']}` {f['unit']}. Classification: {f['classification']}. Period: {f['period']}. Scope: {f['scope']}.",f"Source IDs: {', '.join(f['sourceIds']) or 'Analyst convention / missing disclosure'}. Locator: {f['locator']}.",f"Interpretation: {f.get('uncertainty','')}",'']
(HERE/'SMPT_FI001_Evidence_Appendix.md').write_text('\n'.join(line.rstrip() for line in lines).rstrip()+'\n')
print(json.dumps({'modelSHA256':v['inputSHA256'],'findings':findings,'memoPagesAuthored':len(content['pages']),'narrativeWords':sum(len(x.split()) for p in content['pages'] for x in p['paragraphs']+p.get('after',[]))},indent=2))

"""Research-only Hemerdon workbook. All disclosed inputs live in evidence.json.

python model.py --output hemerdon-financial-model.xlsx
Excel recalculates on opening. See verify.mjs for the independently executed engine QA.
"""
import argparse
import csv
import json
import re
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.properties import CalcProperties

HERE = Path(__file__).resolve().parent
MONEY = '#,##0" ";(#,##0)" ";"– "'
DECIMAL = '#,##0.00" ";(#,##0.00)" ";"– "'
BLUE, GREEN, DARK = '2457A6', '267047', '23354A'


def load_data():
    evidence = json.loads((HERE / 'evidence.json').read_text())
    sources = json.loads((HERE / 'sources.json').read_text())
    validate(evidence, sources)
    return evidence, sources


def validate(data, sources):
    """Fail closed on unresolved provenance, periods, classifications and units."""
    cutoff = date.fromisoformat(data['researchCutoff'])
    ids = [s['id'] for s in sources]
    assert len(ids) == len(set(ids)), 'Duplicate source ID'
    by_source = {s['id']: s for s in sources}
    for s in sources:
        if s['datePublished'] is None:
            assert s['documentType'] in {'announcement_index', 'official_filing'}, 'Undated source requires an explicit snapshot/filing type'
            assert date.fromisoformat(s['dateAccessed']) <= cutoff, 'Post-cutoff snapshot'
        else:
            assert date.fromisoformat(s['datePublished']) <= cutoff, 'Post-cutoff source'
        for field in ['documentDate','dateFiled','certificationDate']:
            if s.get(field):
                assert date.fromisoformat(s[field]) <= cutoff, 'Post-cutoff document/filing date'
        assert s['url'].startswith('https://') and s['rights'], 'Missing source access/rights'
    facts = data['facts']
    keys = [f['id'] for f in facts]
    assert len(keys) == len(set(keys)), 'Duplicate input ID'
    for f in facts:
        assert f['classification'] in {'Reported', 'Guidance', 'Derived', 'Assumption', 'Unavailable'}
        assert f['unit'] and f['period'] and f['scope'], 'Missing dimension'
        assert f['companyId'] == data['companyId'] and f['projectId'] == data['projectId']
        if f['classification'] == 'Unavailable':
            assert f['value'] is None and f['uncertainty'], 'Unknown must remain null'
        elif f['classification'] in {'Reported', 'Guidance'}:
            assert f['value'] is not None and f['sourceIds'] and f['locator'], 'Unsupported disclosure'
        for sid in f['sourceIds']:
            assert sid in by_source, 'Unresolved source'
            assert by_source[sid]['verificationStatus'] != 'primary_read_rights_restricted', 'Restricted source used as input'
        assert all(k in keys for k in f['inputIds']), 'Unresolved derived input'
        if f['unit'] == 'GBP':
            assert f['currency'] == 'GBP', 'Currency mismatch'
        if f['value'] is not None and f['unit'] not in {'text', 'date'}:
            assert re.fullmatch(r'-?(0|[1-9][0-9]*)(\.[0-9]+)?', f['value']), 'Noncanonical decimal'
            assert Decimal(f['value']).is_finite()
            if f['unit'] == 'fraction':
                assert 0 <= Decimal(f['value']) <= 1, 'Invalid fraction'


def write_matrix(data):
    fields = ['id', 'label', 'value', 'unit', 'currency', 'classification', 'scope', 'period',
              'sourceIds', 'locator', 'qualifier', 'verificationStatus', 'confidence',
              'extractionNotes', 'uncertainty', 'inputIds', 'companyId', 'projectId']
    with (HERE / 'claim-source-matrix.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator='\n')
        writer.writeheader()
        for f in data['facts']:
            writer.writerow({k: '; '.join(f[k]) if isinstance(f[k], list) else f[k] for k in fields})


def build(output):
    data, sources = load_data()
    write_matrix(data)
    wb = Workbook()
    wb.remove(wb.active)
    wb.properties.creator = 'SMPT Research'
    wb.properties.title = 'Hemerdon financial evidence and sensitivities'
    wb.properties.created = wb.properties.modified = datetime(2026, 11, 4)
    wb.calculation = CalcProperties(calcId=191029, fullCalcOnLoad=True, forceFullCalc=True)
    names = ['Overview', 'Assumptions', 'Funding', 'August plan', 'Operating', 'Historical', 'Evidence', 'Sources', 'Checks']
    for name in names:
        ws = wb.create_sheet(name)
        ws.sheet_view.showGridLines = False
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.sheet_properties.tabColor = DARK if name == 'Overview' else None
        ws.column_dimensions['A'].width = 2
        ws.column_dimensions['B'].width = 2
        ws.column_dimensions['C'].width = 49
        for col in 'DEFGHIJKLM':
            ws.column_dimensions[col].width = 19
        ws.freeze_panes = 'D8' if name in {'Evidence', 'Sources', 'Historical'} else None
        ws.page_setup.orientation = 'landscape'
        ws.page_setup.paperSize = ws.PAPERSIZE_A3
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
    def put(sheet, cell, value, fmt=None):
        c = wb[sheet][cell]
        c.value = value
        if fmt:
            c.number_format = fmt
        return c
    def title(sheet, label, note):
        put(sheet, 'C2', label)
        put(sheet, 'C3', note)
        if sheet != 'Assumptions':
            put(sheet, 'C5', 'Case selected')
            put(sheet, 'D5', "='Assumptions'!D4")
    def headers(sheet, row, vals):
        for i, v in enumerate(vals, 3):
            c = wb[sheet].cell(row, i, v)
            c.fill = PatternFill('solid', fgColor=DARK)
            c.font = Font(name='Arial', size=10, bold=True, color='FFFFFF')
            c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        wb[sheet].row_dimensions[row].height = 30

    title('Evidence', 'Financial evidence and input register', 'Values in original units. Blank value means Unavailable. Printed and PDF pages distinguished.')
    headers('Evidence', 7, ['Input ID', 'Claim / input', 'Value', 'Unit', 'Class', 'Period', 'Scope', 'Source ID', 'Locator', 'Qualifier', 'Extraction and uncertainty'])
    rows = {}
    for r, f in enumerate(data['facts'], 8):
        rows[f['id']] = r
        value = f['value']
        if value is not None and f['unit'] not in {'text', 'date'}:
            value = float(Decimal(value))
        vals = [f['id'], f['label'], value, f['unit'], f['classification'], f['period'], f['scope'],
                '; '.join(f['sourceIds']), f['locator'], f['qualifier'], f['extractionNotes']]
        for c, v in enumerate(vals, 3):
            put('Evidence', f'{chr(64+c)}{r}', v)
        put('Evidence', f'E{r}', value, '0.0%' if f['unit'] == 'fraction' else MONEY)
        if f['sourceIds']:
            source = next(s for s in sources if s['id'] == f['sourceIds'][0])
            wb['Evidence'][f'J{r}'].hyperlink = source['url']
    def ref(short):
        return f"'Evidence'!$E${rows['hfi-'+short]}"
    def link(short):
        return f'=IF(ISNUMBER({ref(short)}),{ref(short)},"Unavailable")'
    def midpoint(low, high):
        return f'=IF(COUNT({ref(low)},{ref(high)})=2,AVERAGE({ref(low)},{ref(high)}),"Unavailable")'
    title('Sources', 'Source register', 'Original documents remain with publishers. Publication rights require separate review.')
    headers('Sources', 7, ['Source ID', 'Title', 'Issuer', 'Type', 'Published', 'Reporting period', 'Original URL', 'Verification', 'Rights / access', 'SHA-256 of downloaded PDF'])
    for r, s in enumerate(sources, 8):
        values = [s['id'], s['title'], s['issuer'], s['documentType'], date.fromisoformat(s['datePublished']) if s['datePublished'] else None,
                  s['reportingPeriod'], s['url'], s['verificationStatus'], s['rights'], s['sha256']]
        for c, v in enumerate(values, 3):
            wb['Sources'].cell(r, c, v)
        wb['Sources'][f'G{r}'].number_format = 'yyyy-mm-dd'
        wb['Sources'][f'I{r}'].hyperlink = s['url']

    title('Assumptions', 'Scenario controls', 'Base is a midpoint convention. Upside/downside are cost stresses, not commodity forecasts.')
    put('Assumptions', 'C4', 'Case selected (editable)')
    put('Assumptions', 'D4', 'Base')
    selector = DataValidation(type='list', formula1='"Base,Upside,Downside"')
    selector.errorTitle, selector.error, selector.showErrorMessage = 'Choose a case', 'Use Base, Upside or Downside.', True
    wb['Assumptions'].add_data_validation(selector)
    selector.add('D4')
    headers('Assumptions', 7, ['Driver', 'Active selection', 'Base', 'Upside', 'Downside', 'Unit', 'Classification', 'Input IDs / method'])
    assumptions = [
        (8, 'Remaining project spend', midpoint('remaining-low','remaining-high'), link('remaining-low'), link('remaining-high'), 'GBP', 'Derived / Guidance', 'hfi-remaining-low; hfi-remaining-high'),
        (9, 'FY2028 cash opex + sustaining capex', midpoint('opex-low','opex-high'), link('opex-low'), link('opex-high'), 'GBP', 'Derived / Guidance', 'hfi-opex-low; hfi-opex-high'),
        (10, 'FY2028 WO3 volume reference', link('wo3-fy28'), link('wo3-fy28'), link('wo3-fy28'), 'tonnes_WO3', 'Assumption from Guidance', 'hfi-wo3-fy28; use 3300 floor of 3300+'),
        (11, 'WO3 payability coefficient', link('payability'), link('payability'), link('payability'), 'fraction', 'Guidance', 'hfi-payability; FS25 coefficient, not Elmet contract'),
        (12, 'Metal royalty / sales cost fraction', link('royalty'), link('royalty'), link('royalty'), 'fraction', 'Assumption from Guidance', 'hfi-royalty; applied to payable receipts'),
        (13, 'Incremental delay cost stress', 0, 0, link('delay-cost'), 'GBP', 'Assumption / Guidance', 'hfi-delay-cost; company three-month scenario, no event forecast'),
        (14, 'One-year incremental interest stress', 0, 0, 0.01, 'fraction', 'Assumption', '100bp constant-balance annual stress; not contractual interest schedule'),
        (15, 'Accordion available for incremental stress', 0, 0, 0, 'GBP', 'Assumption', 'No draw assumed: hfi-nwf-accordion is uncommitted; user may test up to £10m'),
        (16, 'August plan revenue realized by peak date', 1, 1, 0, 'fraction', 'Assumption', 'Full-delay boundary in Downside. Original plan only; no cutoff cash forecast.'),
        (17, 'August plan core loan received by peak date', 1, 1, 1, 'fraction', 'Assumption', 'Default full draw consistent with later disclosure. Optional timing counterfactual only.'),
        (18, 'Illustrative future APT reference price', None, None, None, 'GBP_per_mtu', 'Unavailable / user Assumption', 'Optional blank. Enter independent GBP price explicitly; no forecast supplied.'),
    ]
    for r, label, base, up, down, unit, cls, note in assumptions:
        for c, value in zip('CEFGHIJ', [label, base, up, down, unit, cls, note]):
            put('Assumptions', f'{c}{r}', value)
        missing = '""' if r == 18 else '"Unavailable"'
        put('Assumptions', f'D{r}', f'=IF($D$4="Base",IF(ISNUMBER(E{r}),E{r},{missing}),IF($D$4="Upside",IF(ISNUMBER(F{r}),F{r},{missing}),IF($D$4="Downside",IF(ISNUMBER(G{r}),G{r},{missing}),"Invalid case")))')
        for c in 'DEFG':
            wb['Assumptions'][f'{c}{r}'].number_format = '0.0%' if unit == 'fraction' else MONEY
    for r in [8, 9, 10, 13, 15, 18]:
        rule = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1=0, allow_blank=True)
        rule.showErrorMessage = True
        wb['Assumptions'].add_data_validation(rule)
        rule.add(f'E{r}:G{r}')
    for r in [11, 12, 16, 17]:
        rule = DataValidation(type='decimal', operator='between', formula1=0, formula2=1, allow_blank=False)
        rule.showErrorMessage = True
        wb['Assumptions'].add_data_validation(rule)
        rule.add(f'E{r}:G{r}')
    put('Assumptions', 'C21', 'Blue numbers are editable. Green formulas link to evidence. Empty APT price preserves missing revenue.')
    put('Assumptions', 'C23', 'Cases combine independent cost stresses. Delay stress has no assigned fiscal period and is used only in Funding.')

    title('Funding', 'Funding sources and incremental stresses', 'GBP. Gross funding is not current cash. Incremental stress is not the remaining funding gap.')
    headers('Funding', 7, ['Funding / use', 'GBP', 'Interpretation'])
    funding = {
        8: ('NWF equity subscription gross', link('nwf-equity'), 'Equity, not revenue. Part refinanced the previous bridge.'),
        9: ('NWF core loan drawn by approval', link('nwf-loan'), 'Drawn by 2 Sep 2026, no further draw of same core facility assumed.'),
        10: ('Gross equity plus core loan', '=IF(COUNT(D8:D9)=2,SUM(D8:D9),"Unavailable")', '£61m gross transaction resources; fees and refinancing uses not deducted.'),
        11: ('Uncommitted accordion ceiling', link('nwf-accordion'), 'Excluded from core liquidity and incremental coverage unless user overrides availability.'),
        12: ('Package including uncommitted ceiling', '=IF(COUNT(D10:D11)=2,D10+D11,"Unavailable")', 'Reconciles to headline £71m; parent package never added again.'),
        16: ('Remaining project spend selected', '=IF(AND(ISNUMBER(\'Assumptions\'!D8),\'Assumptions\'!D8>=0),\'Assumptions\'!D8,"Unavailable")', 'October guidance excludes operating costs.'),
        17: ('Reference midpoint remaining spend', midpoint('remaining-low','remaining-high'), 'Fixed disclosed range midpoint, not a financing commitment.'),
        18: ('Change versus reference midpoint', '=IF(COUNT(D16:D17)=2,D16-D17,"Unavailable")', 'Signed change only; no full sources-and-uses balance implied.'),
        19: ('Incremental delay cost', '=IF(AND(ISNUMBER(\'Assumptions\'!D13),\'Assumptions\'!D13>=0),\'Assumptions\'!D13,"Unavailable")', 'Three-month fallback processing scenario; not uniform monthly burn.'),
        20: ('Incremental one-year interest proxy', "=IF(AND(ISNUMBER(D9),ISNUMBER('Assumptions'!D14),'Assumptions'!D14>=0),D9*'Assumptions'!D14,\"Unavailable\")", 'Constant £25m balance; excludes rate steps/day-count. Incremental proxy only.'),
        21: ('Combined incremental requirement', '=IF(COUNT(D18:D20)=3,SUM(D18:D20),"Unavailable")', 'No forecast collection losses, taxes or general delay burn included.'),
        22: ('Assumed accordion available', "='Assumptions'!D15", 'Default zero; use does not establish commitment or receipt.'),
        23: ('Uncovered incremental stress', '=IF(AND(COUNT(D21:D22)=2,ISNUMBER(D11),D22>=0,D22<=D11),MAX(0,D21-D22),"Unavailable")', 'Additional stress above midpoint; NOT the total funding gap.'),
        25: ('Current net project funding gap', 'Unavailable', 'Cutoff cash and complete remaining sources/uses bridge unavailable.'),
        26: ('Cutoff corporate cash', 'Unavailable', 'Do not add March cash and August funding without intervening cash flows.'),
        27: ('FY2028 remaining-spend lower bound', f'=IF(COUNT({ref("remaining-low")},{ref("fy27-high")})=2,{ref("remaining-low")}-{ref("fy27-high")},"Unavailable")', '£5m extreme bound, not a paired company scenario.'),
        28: ('FY2028 remaining-spend upper bound', f'=IF(COUNT({ref("remaining-high")},{ref("fy27-low")})=2,{ref("remaining-high")}-{ref("fy27-low")},"Unavailable")', '£20m extreme bound; excluded from Operating core requirement.'),
        32: ('31 March group cash, opening stock', link('cash-2026'), 'hfi-cash-2026; audited consolidated balance, not project-only.'),
        33: ('April Hargreaves cash payment', f'=IF(ISNUMBER({ref("harg-paid-apr2026")}),-{ref("harg-paid-apr2026")},"Unavailable")', 'hfi-harg-paid-apr2026; accounts note36 confirms paid, not just planned.'),
        34: ('August NWF equity subscription gross', '=D8', 'hfi-nwf-equity; net fees and exact bank credit unavailable.'),
        35: ('NWF draw by 2 September approval', '=D9', 'hfi-nwf-loan; DRL borrower, group scope; no second core draw assumed.'),
        36: ('May-August bridge receipts / repayment', 'Unavailable', 'USD25m facility limit and full repayment disclosed, exact GBP cash movements unavailable.'),
        37: ('Other April-cutoff cash movements', 'Unavailable', 'Operating, capital deposits, financing fees, sales collections and equipment cash flows incomplete.'),
        38: ('4 November closing unrestricted cash', 'Unavailable', 'Bridge cannot close. No partial subtotal is represented as available cash.'),
        39: ('31 March escrow, excluded from bridge', link('escrow-2026'), 'hfi-escrow-2026; non-current restricted funds, not operating liquidity.'),
        40: ('October equipment finance snapshot', link('fleet-current'), 'hfi-fleet-current; debt stock, not a cash receipt in this bridge.'),
    }
    for r, (label, value, note) in funding.items():
        for c, v in [('C', label), ('D', value), ('E', note)]:
            put('Funding', f'{c}{r}', v, MONEY if c == 'D' else None)

    title('August plan', 'August 2026 sources and uses plan', 'Original plan to unspecified peak funding date. This is not current liquidity or an updated forecast.')
    headers('August plan', 7, ['Plan item', 'GBP', 'Input ID / interpretation'])
    aug_rows = [
        (8,'Opening plan cash','aug-cash-open'), (9,'EA provision recovery','aug-ea-recovery'),
        (10,'Interest source','aug-interest'), (11,'NWF equity','aug-equity'),
        (12,'NWF core debt','aug-loan'), (13,'Anticipated revenue receipts','aug-revenue'),
        (16,'Mining opex','aug-mine-opex'), (17,'Processing opex','aug-process-opex'),
        (18,'Other opex','aug-other-opex'), (19,'Financing costs','aug-finance-cost'),
        (20,'Working capital','aug-wc'), (21,'Mining capital','aug-mining-capital'),
        (22,'Site project costs','aug-site-capital'), (23,'Other project costs','aug-other-capital'),
        (24,'Bridge loan repayment','aug-bridge-repay'), (25,'EA financial provision','aug-ea-provision'),
        (26,'Target cash reserve','aug-reserve'),
    ]
    for r,label,key in aug_rows:
        put('August plan',f'C{r}',label)
        put('August plan',f'D{r}',link(key),MONEY)
        put('August plan',f'E{r}','hfi-'+key)
    aug_calcs = {
        14:('Plan source components','=IF(COUNT(D8:D13)=6,SUM(D8:D13),"Unavailable")','Stated source total £88m; includes £15m projected receipts.'),
        27:('Rounded use components','=IF(COUNT(D16:D26)=11,SUM(D16:D26),"Unavailable")','£87m: £1m below issuer stated £88m; rounding note retained.'),
        28:('Stated total uses',link('aug-total-uses'),'Authoritative issuer total for reserve arithmetic; no undisclosed balancing use invented.'),
        29:('Stated uses less target reserve','=IF(COUNT(D26,D28)=2,D28-D26,"Unavailable")','£75m other uses based on stated total, not sum of rounded components.'),
        32:('Revenue realized by peak date',"=IF(AND(ISNUMBER(D13),ISNUMBER('Assumptions'!D16),'Assumptions'!D16>=0,'Assumptions'!D16<=1),D13*'Assumptions'!D16,\"Unavailable\")",'Timing boundary only. Downside assumes entire £15m delayed past peak date.'),
        33:('Core loan received by peak date',"=IF(AND(ISNUMBER(D12),ISNUMBER('Assumptions'!D17),'Assumptions'!D17>=0,'Assumptions'!D17<=1),D12*'Assumptions'!D17,\"Unavailable\")",'Timing counterfactual only. Full historical draw was subsequently disclosed.'),
        34:('Timing-adjusted plan sources','=IF(AND(COUNT(D8:D11)=4,COUNT(D32:D33)=2),SUM(D8:D11)+SUM(D32:D33),"Unavailable")','No accordion or double-counted parent package.'),
        35:('Plan cash after non-reserve uses','=IF(COUNT(D29,D34)=2,D34-D29,"Unavailable")','Base £13m. Full revenue delay gives approximately £2m deficit on stated-total basis; £1m on rounded-detail basis.'),
        36:('Shortfall to target reserve','=IF(ISNUMBER(D35),MAX(0,D26-D35),"Unavailable")','Reserve shortfall is distinct from cash deficit.'),
        37:('Cash deficit before target reserve','=IF(ISNUMBER(D35),MAX(0,-D35),"Unavailable")','Not a current funding gap. Original plan has no dated monthly cash schedule.'),
    }
    for r,(label,value,note) in aug_calcs.items():
        put('August plan',f'C{r}',label)
        put('August plan',f'D{r}',value,MONEY)
        put('August plan',f'E{r}',note)

    title('Operating', 'FY2028 tungsten revenue coverage', 'GBP APT reference per mtu WO3. One-metal gross coverage threshold, not project break-even or CFADS.')
    headers('Operating', 7, ['Driver / calculation', 'Value', 'Unit', 'Basis / omission'])
    operating = {
        8: ('Contained WO3 production reference', "='Assumptions'!D10", 'tonnes_WO3', '3300 floor of 3300+ management guidance; no ramp-up profile.'),
        9: ('Metric tonne units per contained tonne', link('mtu-per-tonne'), 'mtu_per_tonne', 'Definition: mtu = 10kg contained WO3; tonne = 1000kg.'),
        10: ('WO3 payability', "='Assumptions'!D11", 'fraction', 'FS25 coefficient as disclosed on October slide22.'),
        11: ('Payable WO3 equivalent', '=IF(AND(COUNT(D8:D10)=3,D8>0,D10>0,D10<=1),D8*D9*D10,"Unavailable")', 'mtu', 'No conversion from elemental W or concentrate mass.'),
        12: ('Metal royalties and sales costs', "='Assumptions'!D12", 'fraction', 'Applied to payable receipts as an explicit convention.'),
        13: ('Net receipts per GBP1/mtu APT', '=IF(AND(COUNT(D11:D12)=2,D12>=0,D12<1),D11*(1-D12),"Unavailable")', 'mtu_equivalent', 'Realized contract discounts/penalties may differ.'),
        16: ('Cash opex plus sustaining capex', '=IF(AND(ISNUMBER(\'Assumptions\'!D9),\'Assumptions\'!D9>=0),\'Assumptions\'!D9,"Unavailable")', 'GBP', 'Sustaining capital included once.'),
        17: ('Equipment principal and interest', link('fleet-service'), 'GBP', 'Management approximate annual cash guidance.'),
        18: ('NWF principal and interest', link('nwf-service'), 'GBP', 'Management approximate FY2028 guidance; not rebuilt interest schedule.'),
        19: ('Hargreaves termination payment', link('hargreaves'), 'GBP', 'Included once; excluded by issuer from row16.'),
        20: ('Core annual cash requirement', '=IF(COUNT(D16:D19)=4,SUM(D16:D19),"Unavailable")', 'GBP', 'Excludes remaining restart capex, new growth, taxes and working-capital changes.'),
        21: ('Tungsten-only core coverage threshold', '=IF(COUNT(D13,D20)=2,D20/D13,"Unavailable")', 'GBP_per_mtu', 'Excludes tin and aggregates receipts. Does not measure actual profitability.'),
        24: ('Optional illustrative APT price', '=IF(ISNUMBER(\'Assumptions\'!D18),\'Assumptions\'!D18,"")', 'GBP_per_mtu', 'Blank by default. No USD price or FX forecast silently supplied.'),
        25: ('Illustrative net tungsten receipts', '=IF(COUNT(D24,D13)=2,IF(D24<0,"Invalid price",D24*D13),"Unavailable")', 'GBP', 'Revenue proxy only; no actual contract or cash collection forecast.'),
        26: ('Receipts less core cash requirement', '=IF(COUNT(D25,D20)=2,D25-D20,"Unavailable")', 'GBP', 'Excludes tax, working capital, remaining restart capex and other products.'),
        28: ('Independent NPV / IRR / DSCR', 'Unavailable', 'n.a.', 'No updated full project cash-flow schedule or lender CFADS definition.'),
    }
    for r, (label, value, unit, note) in operating.items():
        for c, v in [('C', label), ('D', value), ('E', unit), ('F', note)]:
            put('Operating', f'{c}{r}', v)
        wb['Operating'][f'D{r}'].number_format = '0.0%' if unit == 'fraction' else DECIMAL if unit == 'GBP_per_mtu' else MONEY

    title('Historical', 'Consolidated historical financial data', 'GBP. FY2025 comparatives restated in FY2026 accounts. Group data is not standalone project cash flow.')
    headers('Historical', 7, ['Metric', 'FY:25', 'FY:26', 'Unit', 'FY2025 input ID', 'FY2026 input ID'])
    history_ids = ['revenue', 'operating-loss', 'net-loss', 'cash', 'escrow', 'assets', 'liabilities', 'equity', 'current-assets', 'current-liabilities', 'borrowings-current', 'borrowings-noncurrent', 'operating-cashflow', 'investing-cashflow', 'financing-cashflow', 'cash-change', 'ppe-cash', 'equity-net', 'cln-cash', 'cln-close', 'cln-fair-value', 'cln-conversion', 'interest-paid', 'lease-payment', 'hire-payment']
    for r, key in enumerate(history_ids, 8):
        put('Historical', f'C{r}', key.replace('-', ' ').capitalize())
        for col, year in [('D', 2025), ('E', 2026)]:
            put('Historical', f'{col}{r}', link(f'{key}-{year}'), MONEY)
        put('Historical', f'F{r}', 'GBP')
        put('Historical', f'G{r}', f'hfi-{key}-2025')
        put('Historical', f'H{r}', f'hfi-{key}-2026')
    put('Historical', 'C35', 'Restricted escrow is excluded from general-use cash. CLN conversion and fair-value changes are non-cash.')
    put('Historical', 'C36', 'Current borrowings include leases and hire purchase. NWF financing occurred after the March balance-sheet date.')

    title('Overview', 'Hemerdon financial evidence model', 'Research cutoff 4 November 2026. Research draft; publication approval pending.')
    headers('Overview', 7, ['Measure', 'Value', 'Unit / interpretation'])
    overview = {
        8: ('Gross NWF equity plus core loan', "='Funding'!D10", 'GBP; gross transaction resources, not cash at cutoff'),
        9: ('Uncommitted accordion ceiling', "='Funding'!D11", 'GBP; not committed liquidity'),
        10: ('Remaining project spend selected', "='Funding'!D16", 'GBP; excludes operating costs'),
        11: ('Uncovered incremental cost stress', "='Funding'!D23", 'GBP; change above midpoint only, not total gap'),
        13: ('FY2028 core cash requirement', "='Operating'!D20", 'GBP; exclusions stated in Operating'),
        14: ('Tungsten-only core coverage threshold', "='Operating'!D21", 'GBP per mtu APT reference; excludes other-product receipts'),
        16: ('Corporate cash 31 March 2026', link('cash-2026'), 'GBP; historical, excludes restricted escrow'),
        17: ('Current cash / net funding gap', 'Unavailable', 'Needs same-date complete sources-and-uses bridge'),
        18: ('Independent NPV / IRR / DSCR', 'Unavailable', 'Updated cash-flow timing and lender definitions missing'),
    }
    for r, (label, value, note) in overview.items():
        put('Overview', f'C{r}', label)
        put('Overview', f'D{r}', value, DECIMAL if r == 14 else MONEY)
        put('Overview', f'E{r}', note)
    for r, text in enumerate([
        'Use Assumptions D4 to change case. Base uses midpoints; upside uses low costs; downside adds company delay sensitivity.',
        'Government funding improves access to capital. It does not establish a higher selling price or lower operating costs.',
        'NWF loan has a 366-day tenor and escalating margin. Refinancing or repayment remains exposed to ramp-up performance.',
        'Elmet offtake is APT-linked. Its indicative nominal value is not guaranteed revenue or cash received.',
        'This partial model separates project guidance, corporate financial history, government financing and shareholder exposure.',
        'Scope: funding status, incremental stresses and FY2028 coverage. Missing cash bridge prevents a current liquidity forecast.',
    ], 22):
        put('Overview', f'C{r}', text)

    title('Checks', 'Reconciliations and evidence boundaries', 'Differences should equal zero. Missing-data checks remain Unavailable. No business sheet reads this sheet.')
    headers('Checks', 7, ['Check', 'Difference / status', 'Unit / evidence'])
    checks = [
        ('FY2025 assets minus liabilities and equity', f'={ref("assets-2025")}-{ref("liabilities-2025")}-{ref("equity-2025")}', 'GBP'),
        ('FY2026 assets minus liabilities and equity', f'={ref("assets-2026")}-{ref("liabilities-2026")}-{ref("equity-2026")}', 'GBP'),
        ('FY2025 cash-flow categories less change', f'={ref("operating-cashflow-2025")}+{ref("investing-cashflow-2025")}+{ref("financing-cashflow-2025")}-{ref("cash-change-2025")}', 'GBP'),
        ('FY2026 cash-flow categories less change', f'={ref("operating-cashflow-2026")}+{ref("investing-cashflow-2026")}+{ref("financing-cashflow-2026")}-{ref("cash-change-2026")}', 'GBP'),
        ('FY2025 opening cash plus change less close', f'={ref("cash-open-2025")}+{ref("cash-change-2025")}-{ref("cash-2025")}', 'GBP'),
        ('FY2026 opening cash plus change less close', f'={ref("cash-2025")}+{ref("cash-change-2026")}-{ref("cash-2026")}', 'GBP'),
        ('FY2026 CLN liability rollforward', f'={ref("cln-close-2025")}+{ref("cln-cash-2026")}+{ref("cln-fair-value-2026")}-{ref("cln-conversion-2026")}-{ref("cln-close-2026")}', 'GBP; conversion is non-cash'),
        ('NWF component ceiling less parent', f"='Funding'!D12-{ref('nwf-package')}", 'GBP; envelope counted once'),
        ('October capital forecast components less total', f'={ref("capex-rebuild")}+{ref("capex-mining")}+{ref("capex-property")}+{ref("capex-expansion")}-{ref("capex-total")}', 'GBP'),
        ('Current cash bridge reconciliation', 'Unavailable', 'Missing post-March full cash movements'),
        ('Contractual NWF interest schedule', 'Unavailable', 'Draw date, daily SONIA, fee and compounding terms missing'),
        ('Funding scenario input validity', '=IF(AND(COUNT(\'Assumptions\'!D8,\'Assumptions\'!D13,\'Assumptions\'!D14,\'Assumptions\'!D15)=4,\'Assumptions\'!D8>=0,\'Assumptions\'!D13>=0,\'Assumptions\'!D14>=0,\'Assumptions\'!D15>=0,\'Assumptions\'!D15<=\'Funding\'!D11),"Valid","Invalid input")', 'Nonnegative numeric costs; assumed accordion cannot exceed ceiling'),
        ('Operating input validity', '=IF(AND(COUNT(\'Assumptions\'!D10:D12)=3,\'Assumptions\'!D10>0,\'Assumptions\'!D11>0,\'Assumptions\'!D11<=1,\'Assumptions\'!D12>=0,\'Assumptions\'!D12<1),"Valid","Invalid input")', 'Positive numeric volume and payability; royalty below 100%'),
        ('August rounded uses less stated total', "='August plan'!D27-'August plan'!D28", 'GBP; known negative £1m rounding difference, not zero'),
    ]
    for r, (label, formula, unit) in enumerate(checks, 8):
        if r <= 16 or r == 21:
            refs = re.findall(r"'[^']+'!\$?[A-Z]+\$?[0-9]+", formula)
            formula = f'=IF(COUNT({",".join(refs)})={len(refs)},{formula[1:]},"Unavailable")'
        put('Checks', f'C{r}', label)
        put('Checks', f'D{r}', formula, '#,##0.00" ";(#,##0.00)" ";0.00" "')
        put('Checks', f'E{r}', unit)
    wb['Checks'].conditional_formatting.add('D8:D16', CellIsRule(operator='notBetween', formula=['-0.01', '0.01'], fill=PatternFill('solid', fgColor='FCE2DE'), font=Font(name='Arial', color='A32020', bold=True)))
    # Styles apply only to populated cells; no hidden calculation blocks.
    for ws in wb:
        for row in ws:
            for c in row:
                if c.value is None:
                    continue
                if not c.has_style or c.row != 7:
                    color = DARK
                    if c.data_type == 'f':
                        color = DARK if ws.title in {'Overview', 'Checks'} else GREEN if '!' in c.value else '111111'
                    elif isinstance(c.value, (int, float)):
                        color = BLUE
                    if c.row == 5 and c.column == 4:
                        color = GREEN
                    c.font = Font(name='Arial', size=14 if c.coordinate == 'C2' else 10, color=color, bold=c.coordinate == 'C2')
                    c.alignment = Alignment(vertical='center', horizontal='right' if isinstance(c.value, (int, float)) or c.data_type == 'f' else 'left')
                    if c.coordinate == 'D5':
                        c.alignment = Alignment(vertical='center', horizontal='center')
                ws.row_dimensions[c.row].height = 23
        ws.row_dimensions[2].height = 30
        ws.row_dimensions[7].height = 32
        ws.print_options.horizontalCentered = True
        ws.print_area = f'C1:{ws.cell(ws.max_row, ws.max_column).coordinate}'
    # Wide notes are wrapped deliberately; business values retain normal font size.
    for sheet, widths in {
        'Overview': {'E': 80}, 'Funding': {'E': 85}, 'August plan': {'E': 85}, 'Operating': {'F': 83},
        'Assumptions': {'J': 73, 'I': 28}, 'Historical': {'G': 29, 'H': 29},
        'Evidence': {'C': 32, 'D': 48, 'E': 38, 'F': 20, 'G': 18, 'H': 28, 'I': 24, 'J': 28, 'K': 43, 'M': 75},
        'Sources': {'C': 32, 'D': 60, 'E': 30, 'F': 28, 'H': 45, 'I': 65, 'J': 48, 'K': 85, 'L': 68},
        'Checks': {'E': 73},
    }.items():
        for col, width in widths.items():
            wb[sheet].column_dimensions[col].width = width
    for name, cols in [('Overview', 'E'), ('Funding', 'E'), ('August plan', 'E'), ('Operating', 'F'), ('Assumptions', 'IJ'), ('Evidence', 'DEHIJKLM'), ('Sources', 'DEHIJKL'), ('Checks', 'CE')]:
        ws = wb[name]
        for r in range(8, ws.max_row + 1):
            max_lines = 1
            for col in cols:
                c = ws[f'{col}{r}']
                c.alignment = Alignment(vertical='center', wrap_text=True, indent=1)
                if c.value is not None:
                    width = ws.column_dimensions[col].width
                    max_lines = max(max_lines, (len(str(c.value)) + int(width) - 1) // int(width))
            ws.row_dimensions[r].height = max(24, 15 * max_lines + 8)
    for name in ['Overview', 'Historical', 'Assumptions']:
        ws = wb[name]
        for row in range(21 if name == 'Assumptions' else 22 if name == 'Overview' else 35, ws.max_row+1):
            ws[f'C{row}'].alignment = Alignment(wrap_text=False, vertical='center')
    for col in 'EFG':
        for r in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]:
            wb['Assumptions'][f'{col}{r}'].fill = PatternFill('solid', fgColor='FFF4D6')
    wb['Assumptions']['D4'].fill = PatternFill('solid', fgColor='FFF4D6')
    for name in ['Operating', 'Assumptions']:
        for row in ([10, 12] if name == 'Operating' else [11, 12, 14]):
            for cell in wb[name][row][2:7]:
                cell.font = Font(name='Arial', size=10, color=cell.font.color.rgb if cell.font.color and cell.font.color.type == 'rgb' else DARK, italic=True)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    wb.save(output)
    return wb


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=HERE/'hemerdon-financial-model.xlsx')
    args = parser.parse_args()
    build(args.output)
    print(f'Workbook written: {args.output}')

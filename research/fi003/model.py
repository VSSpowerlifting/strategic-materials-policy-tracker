#!/usr/bin/env python3
"""Controlling FI003 cell/formula specification and independent Python outputs.

No spreadsheet authoring here. build_workbook.mjs translates this specification
with the bundled artifact-tool. Scenario controls never feed historical cells.
"""
import argparse
import hashlib
import json
from datetime import date
from decimal import Decimal as D
from pathlib import Path
import prototype as p

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'outputs' / 'fi003-model-v1'
VERSION = 'FI003 model 1.0 — 2026-11-06'
STATES = ['Pre-COD', 'COD / before milestone', 'From milestone']


def serial(value):
    return (date.fromisoformat(value) - date(1899, 12, 30)).days


def scenario(data, overrides=None):
    """Independent scalar oracle; invalid cases intentionally yield INVALID."""
    c = {k: v['value'] for k, v in data['model_controls'].items()}
    c.update(overrides or {})
    f = {k: D(v['value']) for k, v in data['facts'].items()}
    result = {}
    try:
        draw, sofr, days = (D(str(c[k])) for k in ['draw', 'sofr', 'days'])
        assert sofr <= 1 and days <= 36600 and days == int(days)
        unused, fee, interest = p.rcf_cost(f['revolver'], f['revolver']-f['available_q3']-f['drawn_q3'],
            draw, f['pretrigger_commit_fee'], f['pretrigger_sofr_spread'], sofr, days)
        result.update({'Credit!B20':'VALID', 'Credit!B21':unused, 'Credit!B22':fee,
                       'Credit!B23':interest, 'Credit!B24':fee+interest})
    except (AssertionError, ValueError, TypeError, ArithmeticError):
        result.update({f'Credit!B{r}':'INVALID' for r in [20,21,22,23,24]})
    try:
        minimum, income, dup = (D(str(c[k])) for k in ['minimum','income','duplicate'])
        assert all(v.is_finite() for v in [minimum,income,dup]) and dup >= 0
        addback = p.government_addback(minimum, income)
        result.update({'Credit!B33':'VALID', 'Credit!B34':addback, 'Credit!B35':addback-dup})
    except (AssertionError, ValueError, TypeError, ArithmeticError):
        result.update({f'Credit!B{r}':'INVALID' for r in [33,34,35]})
    try:
        trigger = date.fromisoformat(c['trigger'])
        assert date(2025,8,25) <= trigger <= date(2100,12,31)
        first = p.first_test_quarter(trigger)
        year = int(f['commissioning_year'])
        result.update({'Credit!B42':'VALID', 'Credit!B43':serial(first.isoformat()),
            'Credit!B44':serial(f'{year}-01-01'), 'Credit!B45':serial(f'{year}-12-31'),
            'Credit!B46':(date(year,1,1)-first).days, 'Credit!B47':(date(year,12,31)-first).days})
    except (AssertionError, ValueError, TypeError):
        result.update({f'Credit!B{r}':'INVALID' for r in [42,43,44,45,46,47]})
    state = c['state']
    try:
        year, capacity = D(str(c['year'])), D(str(c['capacity']))
        assert state in STATES and year == int(year) and 2025 <= year <= 2100 and capacity >= 0
        value = p.capacity_threshold(int(year), capacity, f['full_ebitda_base'], f['escalation'],
            state != 'Pre-COD', state == 'From milestone')
        result.update({'Support!B13':'VALID', 'Support!B14':value if value is not None else '',
                       'Support!B15':value/4 if value is not None else ''})
    except (AssertionError, ValueError, TypeError, ArithmeticError):
        result.update({f'Support!B{r}':'INVALID' for r in [13,14,15]})
    try:
        benchmark = D(str(c['benchmark']))
        assert state in STATES
        support, repayment, net = p.ppa_payoff(benchmark, f['ppa_floor'], f['ppa_upside_share'], state == 'From milestone')
        result.update({'Support!B19':'VALID', 'Support!B22':support, 'Support!B23':repayment, 'Support!B24':net})
    except (AssertionError, ValueError, TypeError, ArithmeticError):
        result.update({f'Support!B{r}':'INVALID' for r in [19,22,23,24]})
    return result


def build():
    data = json.loads((ROOT/'inputs.json').read_text())
    sources = json.loads((ROOT/'sources.json').read_text())
    p.validate(data, sources)
    tables = p.build(data, sources)
    f = {k:D(v['value']) for k,v in data['facts'].items()}
    baseline = scenario(data)
    assert all(baseline[k]=='VALID' for k in ['Credit!B20','Credit!B33','Credit!B42','Support!B13','Support!B19']), 'Invalid reviewed baseline controls'
    names = ['Financing','Credit','Liquidity','Support','Guide_Sources','Checks']
    spec = {'version':VERSION, 'cutoff':data['cutoff'], 'reviewed_baseline':'66e42a4b32d65b902dc2eea5f852fc8d944522c2',
        'input_sha256':hashlib.sha256((ROOT/'inputs.json').read_bytes()).hexdigest(),
        'sheets':{n:{'cells':{},'sections':[],'merges':[],'validations':[]} for n in names},
        'controls':{}, 'anchors':[], 'sources':sources}
    ss = spec['sheets']

    def cell(sheet, address, value=None, formula=None, expected=None, kind='text', fmt=None, group=None):
        item = {'kind':kind}
        if formula is not None:
            item.update(formula=formula, expected=expected)
            if sheet != 'Checks':
                spec['anchors'].append({'cell':sheet+'!'+address,'expected':expected,'group':group})
        else:
            item['value'] = value
        if fmt: item['format'] = fmt
        ss[sheet]['cells'][address] = item

    def merged(sheet, address, text, kind='note'):
        ss[sheet]['merges'].append(address)
        cell(sheet, address.split(':')[0], text, kind=kind)

    def section(sheet,row,text):
        ss[sheet]['sections'].append(row)
        merged(sheet,f'A{row}:F{row}',text,'section')

    descriptions = {
        'Financing':'Received equity supplies capital without scheduled repayment; ownership dilution is the economic trade-off.',
        'Credit':'Historical capacity, isolated borrowing economics and the covenant timetable. No actual covenant headroom is calculated.',
        'Liquidity':'Company cash plus short-term investments, reconciled historically. Multi-project resources are not a remaining 10X budget.',
        'Support':'Separate contractual states, normalized price protection and instrument obligations. No forecast or project debt-service measure.',
        'Guide_Sources':'Controlling inputs, source links and instructions. Scenario controls are on Credit and Support; historical facts stay separate.',
        'Checks':'Independent Python baseline anchors, live scenario checks and evidence gaps. Checks do not feed analytical calculations.'}
    for n in names:
        merged(n,'A1:F1',f'FI003 | {n.replace("_"," & ")}', 'title')
        merged(n,'A2:F3',descriptions[n])
        merged(n,'A4:F4',VERSION+' | USD million unless stated | Cutoff 6 Nov 2026 | Benjamin review pending')

    # One hardcoded factual value per input; all analytical tabs reference it.
    refs = {}
    section('Guide_Sources',6,'Use the tabs in order; blue figures are editable inputs, green formulas link across tabs')
    for row,text in [(7,'Change only gold-shaded SCENARIO cells for illustrations. Source facts below require a deliberate research revision.'),
        (8,'Facts: source-reported amounts and terms, including management expectations explicitly labeled. Calculations: formulas. Scenarios: hypothetical.'),
        (9,'No automatic sync after export/import. XLSX and native Sheets begin at the same reviewed model version; manual edits create separate copies.'),
        (10,'No project DCF, WACC, DSCR, debt-service forecast or bank profitability model. Original loan economics and actual certificates are missing.'),
        (11,'Excel formulas use scalar functions common to Google Sheets. Dates are real date serials. Zero is distinct from missing evidence.'),
        (12,'Source dates are publication/filing dates. Input dates are observed balance/transaction dates; flow periods are identified in IDs and locators.'),
        (13,'Financing: economics and comparison. Credit: scenario controls. Liquidity: historical bridge. Support: state controls. Checks: validation.'),
        (14,'Historical precision follows filings, generally $0.001m; displayed financing fees retain extra decimals. Do not annualize one-time fees.')]:
        merged('Guide_Sources',f'A{row}:H{row}',text)
    for col,label in zip('ABCDEFGH',['Input ID','Fact value','Unit / scope','As of','Source ID','Original locator','Class','Original link']):
        cell('Guide_Sources',f'{col}17',label,kind='header')
    for row,(key,item) in enumerate(data['facts'].items(),18):
        refs[key] = f"'Guide_Sources'!B{row}"
        source = next(s for s in sources if s['id']==item['source'])
        fmt = 'percent' if item['unit'].startswith('fraction') else ('year' if key=='commissioning_year' else 'integer' if key.endswith('shares') else 'number')
        vals = [key,float(item['value']),item['unit'],serial(item['as_of']),item['source'],item['locator'],'Reported']
        for col,value in zip('ABCDEFG',vals):
            cell('Guide_Sources',f'{col}{row}',value,kind='fact' if col=='B' else 'text',fmt=fmt if col=='B' else ('date' if col=='D' else None))
        cell('Guide_Sources',f'H{row}',formula=f'=HYPERLINK("{source["url"]}","{item["source"]} original")',expected=item['source']+' original',kind='link')
    first_source = 21+len(data['facts'])
    section('Guide_Sources',first_source,'Original-source register | publication dates through 6 November 2026')
    for row,src in enumerate(sources,first_source+2):
        cell('Guide_Sources',f'A{row}',src['id'])
        cell('Guide_Sources',f'B{row}',src.get('issuer',src.get('publisher','')))
        cell('Guide_Sources',f'C{row}',serial(src['publication_or_filing_date']),fmt='date')
        cell('Guide_Sources',f'D{row}',src.get('title',''))
        ss['Guide_Sources']['merges'].append(f'D{row}:G{row}')
        cell('Guide_Sources',f'H{row}',formula=f'=HYPERLINK("{src["url"]}","{src["id"]} original")',expected=src['id']+' original',kind='link')
    spec['fact_rows'] = [18,17+len(f)]
    spec['source_rows'] = [first_source+2,first_source+1+len(sources)]

    def measure(sheet,row,label,formula,value,unit='USD m',note='',source='',fmt='number',group=None):
        cell(sheet,f'A{row}',label)
        cell(sheet,f'B{row}',formula=formula,expected=value,kind='output',fmt=fmt,group=group)
        cell(sheet,f'C{row}',unit)
        cell(sheet,f'D{row}',note)
        cell(sheet,f'E{row}',source)

    def fact(sheet,row,label,key,note=''):
        fmt = 'percent' if data['facts'][key]['unit'].startswith('fraction') else ('year' if key=='commissioning_year' else 'integer' if key.endswith('shares') else 'number')
        measure(sheet,row,label,'='+refs[key],f[key],data['facts'][key]['unit'],note,data['facts'][key]['source'],fmt)

    section('Financing',6,'Completed equity: ownership and transaction economics')
    for row,label,key in [(7,'Original joint commitment reference minimum','commitment_reference'),(8,'Aggregate commitment / structuring expense','commitment_fees'),
        (9,'Final common shares issued','final_shares'),(10,'Public offering price','public_price'),(11,'Price paid by underwriters','underwriter_price')]:
        fact('Financing',row,label,key)
    gross = f['final_shares']*f['public_price']/1000000
    disc = f['final_shares']*(f['public_price']-f['underwriter_price'])/1000000
    measure('Financing',12,'Gross equity proceeds','=B9*B10/1000000',gross,note='Exact shares × $55; final offering including option',source='S07; S11')
    measure('Financing',13,'Aggregate underwriting discount','=B9*(B10-B11)/1000000',disc,note='All underwriters; no JPMorgan fee/profit allocation',source='S07; S11',fmt='precise')
    measure('Financing',14,'After discount, before other expenses','=B12-B13',gross-disc,note='Distinct from final net proceeds',fmt='precise')
    fact('Financing',15,'Reported final net equity proceeds','final_net','Rounded issuer disclosure; cash raised in 2025')
    measure('Financing',16,'Implied other expenses / rounding','=B14-B15',gross-disc-f['final_net'],note='Residual, not an exact disclosed expense ledger',fmt='precise')
    fact('Financing',18,'July 9 basic shares before offering','preoffering_basic_shares')
    post = f['preoffering_basic_shares']+f['final_shares']
    measure('Financing',19,'Isolated post-offering basic share base','=B18+B9',post,'shares','Offering only; excludes all other dilution',fmt='integer')
    measure('Financing',20,'Share-base growth','=B9/B18',f['final_shares']/f['preoffering_basic_shares'],'percent','Denominator: pre-offering basic shares',fmt='percent')
    measure('Financing',21,'Existing-holder ownership dilution','=B9/B19',f['final_shares']/post,'percent','New shares / isolated post-base; not the 8.31% growth measure',fmt='percent')
    measure('Financing',22,'Existing-holder ownership retained','=1-B21',f['preoffering_basic_shares']/post,'percent','Excludes preferred, warrants, convertibles and other changes',fmt='percent')
    measure('Financing',23,'Underwriting discount / gross proceeds','=B13/B12',disc/gross,'percent','One-time transaction ratio; not annual cost of equity',fmt='percent')
    measure('Financing',24,'Commitment expense / minimum headline','=B8/B7',f['commitment_fees']/f['commitment_reference'],'percent','Different fee basis; not a relative cost-of-capital comparison',fmt='percent')
    section('Financing',26,'Instrument comparison | documented property → commercial implication')
    matrix = [
        ['Dimension','Original construction commitment','Completed equity','Continuing corporate revolver','Evidence','Class'],
        ['Financing certainty','Committed signing/closing route; draw conditions remain; never funded','July capital received; no remaining draw execution risk on proceeds','Conditional availability; $203m at Sep 30, not extra cash','S02 / S11 / S19','Fact / judgment'],
        ['Repayment / dilution','A funded loan would require repayment; full executed terms missing','No scheduled principal/coupon; 7.68% isolated ownership dilution','Draws repayable at floating rates; L-Cs consume capacity','S06 / S07 / S09','Contract / calc'],
        ['Recourse','Project nonrecourse forms permitted; actual executed recourse unknown','Ownership claims absorb exposure; parent cash funds competing uses','MP parent borrower; security and guarantees have exceptions','S02 / S09','Contract'],
        ['Timing and uses','At least $650m dedicated to 10X within joint ≥$1bn commitment','$350m incremental-proceeds threshold within specified multi-project uses; broader prospectus purposes remain subject to S02 §6.01(g)','Executed Aug 25; corporate facility with covenants; no complete 10X allocation','S02 §6.01(g) / S06 / S09','Contract / reported'],
        ['Economic assessment','Replacement right preserved a financeable transaction route','Permanent capital buys flexibility at dilution and disclosed fees','Smaller reserve with compliance, L-C and maturity constraints','S02 / S11 / S19','Judgment'],
        ['Decision','Compare actual terms before claiming least-cost financing','Reconcile received cash with remaining multi-project demands','Diligence covenant certificates, completion spend and cash collection','Analysis','Recommendation']]
    for row,values in enumerate(matrix,27):
        for col,value in zip('ABCDEF',values): cell('Financing',f'{col}{row}',value,kind='header' if row==27 else 'text')
    section('Financing',36,'Technical proceeds comparison | issuer-reported undrawn expiration controls status')
    measure('Financing',38,'Net equity + headline RCF − original reference',f'=B15+{refs["revolver"]}-B7',f['final_net']+f['revolver']-f['commitment_reference'],note='Mixed cash/capacity arithmetic; −$0.8m ledger gap unresolved',source='S09; S11')
    measure('Financing',39,'After-discount equity + RCF − reference',f'=B14+{refs["revolver"]}-B7',gross-disc+f['revolver']-f['commitment_reference'],note='Before other expenses; not exact cancellation calculation',source='S07; S09; S11',fmt='precise')
    merged('Financing','A41:F42','JPMorgan: joint commitment with Goldman Sachs; J.P. Morgan Securities is a representative equity underwriter; JPMorgan Chase is RCF administrative/collateral agent, arranger, lender and L-C issuer. Joint participation does not establish sole design, unique capability or fee allocation.')

    section('Credit',6,'Dated corporate facility snapshots | L-C sublimit is inside $275m')
    for col,label in zip('ABCDEF',['As of','Commitment ($m)','Loans ($m)','Implied L-Cs ($m)','Remaining ($m)','Source / status']): cell('Credit',f'{col}7',label,kind='header')
    for row,r in enumerate(tables['revolver_snapshots.csv'],8):
        cell('Credit',f'A{row}',serial(r['as_of']),fmt='date')
        suffix = ['2025','q2','q3'][row-8]
        for col,key in [('B','revolver'),('C','drawn_'+suffix),('E','available_'+suffix)]:
            cell('Credit',f'{col}{row}',formula='='+refs[key],expected=f[key],fmt='number')
        cell('Credit',f'D{row}',formula=f'=B{row}-C{row}-E{row}',expected=r['lc_exposure_implied_usd_m'],fmt='number')
        cell('Credit',f'F{row}',r['sources']+'; reported compliance')
    merged('Credit','A12:F13','September loans = zero; $128m unused of the $200m L-C sublimit independently implies $72m L-Cs. L-Cs support obligations and consume borrowing capacity without generating loan cash. Future borrowing remains subject to §4.02 and covenant terms.')
    section('Credit',15,'SCENARIO | marginal reserve cost at static September L-C exposure; Level 1 terms')

    def control(sheet,row,key,label,validation,fmt='number'):
        item = data['model_controls'][key]
        address=f'B{row}'
        value=serial(item['value']) if key=='trigger' else item['value']
        cell(sheet,f'A{row}',label)
        cell(sheet,address,value,kind='control',fmt=fmt)
        cell(sheet,f'C{row}',item['unit'])
        cell(sheet,f'D{row}',item['rationale'])
        cell(sheet,f'E{row}','SCENARIO')
        spec['controls'][key]={'cell':sheet+'!'+address, 'baseline':value, 'validation':validation}
        ss[sheet]['validations'].append({'cell':address,**validation})

    control('Credit',16,'draw','Hypothetical loan draw',{'type':'decimal','operator':'between','formula1':0,'formula2':float(f['available_q3'])})
    control('Credit',17,'sofr','Hypothetical SOFR',{'type':'decimal','operator':'between','formula1':0,'formula2':1},'percent')
    control('Credit',18,'days','Elapsed days',{'type':'whole','operator':'between','formula1':0,'formula2':36600},'integer')
    rcf_valid='AND(ISNUMBER(B16),ISNUMBER(B17),ISNUMBER(B18),B16>=0,B16<=E10,B17>=0,B17<=1,B18>=0,B18<=36600,B18=INT(B18))'
    measure('Credit',20,'Scenario validation',f'=IF({rcf_valid},"VALID","INVALID")',baseline['Credit!B20'],'status','Checks remain active even if validation is bypassed',group='rcf')
    formulas={21:'=IF(B20="VALID",B8-D10-B16,"INVALID")',22:f'=IF(B20="VALID",B21*{refs["pretrigger_commit_fee"]}*B18/360,"INVALID")',
        23:f'=IF(B20="VALID",B16*(B17+{refs["pretrigger_sofr_spread"]})*B18/360,"INVALID")',24:'=IF(B20="VALID",B22+B23,"INVALID")'}
    for row,label in [(21,'Unused credit after hypothetical draw'),(22,'Unused commitment fee'),(23,'Loan interest'),(24,'Fee plus loan interest')]:
        measure('Credit',row,label,formulas[row],baseline[f'Credit!B{row}'],note='Excludes L-C, agent, upfront and other charges; no original-loan comparison',source='S09 §§1.01 / 2.09–2.10',fmt='precise',group='rcf')
    section('Credit',27,'SCENARIO | isolated Defense-payment EBITDA adjustment, not a compliance calculation')
    control('Credit',29,'minimum','Applicable Test-Period minimum',{'type':'decimal','operator':'greaterThanOrEqual','formula1':0})
    control('Credit',30,'income','Attributable Consolidated Net Income',{'type':'decimal','operator':'between','formula1':-1e9,'formula2':1e9})
    control('Credit',31,'duplicate','Later cash duplicating prior addback',{'type':'decimal','operator':'greaterThanOrEqual','formula1':0})
    for row,label,formula in [(33,'Adjustment input validation','=IF(AND(ISNUMBER(B29),ISNUMBER(B30),ISNUMBER(B31),B29>=0,B31>=0),"VALID","INVALID")'),
        (34,'Conditional addback','=IF(B33="VALID",MAX(B29-B30,0),"INVALID")'),(35,'Net adjustment after duplicate reversal','=IF(B33="VALID",B34-B31,"INVALID")')]:
        measure('Credit',row,label,formula,baseline[f'Credit!B{row}'],'status' if row==33 else 'USD m',note='S09 §1.01 (a)(xiv); eligibility, borrower estimate and certificate required',source='S09',group='addback')
    merged('Credit','A37:F38','The clause recognizes Defense contracts in credit metrics. It establishes neither actual use nor actual borrowing headroom. Future 10X operating thresholds cannot be assumed applicable pre-COD. Later cash is subtracted only to the extent it duplicates prior addback; no artificial cap on the reversal is imposed here.')
    section('Credit',39,'SCENARIO | first earnings-based test versus the disclosed commissioning YEAR')
    control('Credit',40,'trigger','Illustrative covenant trigger delivery',{'type':'date','operator':'between','formula1':serial('2025-08-25'),'formula2':serial('2100-12-31')},'date')
    fact('Credit',41,'Expected 10X commissioning begins (year)','commissioning_year','Management expectation, not COD; year boundaries below are calendar bounds only')
    timing={42:'=IF(AND(ISNUMBER(B40),B40>=DATE(2025,8,25),B40<=DATE(2100,12,31),B40=INT(B40)),"VALID","INVALID")',
        43:'=IF(B42="VALID",IF(B40<DATE(YEAR(B40),3*INT((MONTH(B40)-1)/3)+4,0),DATE(YEAR(B40),3*INT((MONTH(B40)-1)/3)+4,0),DATE(YEAR(B40),3*INT((MONTH(B40)-1)/3)+7,0)),"INVALID")',
        44:'=IF(B42="VALID",DATE(B41,1,1),"INVALID")',45:'=IF(B42="VALID",DATE(B41,12,31),"INVALID")',
        46:'=IF(B42="VALID",B44-B43,"INVALID")',47:'=IF(B42="VALID",B45-B43,"INVALID")'}
    for row,label in [(42,'Timing input validation'),(43,'First quarter-end strictly after trigger'),(44,'Start of commissioning year (bound)'),(45,'End of commissioning year (bound)'),(46,'Days from first test to earliest year bound'),(47,'Days from first test to latest year bound')]:
        measure('Credit',row,label,timing[row],baseline[f'Credit!B{row}'],'date' if row in [43,44,45] else 'days' if row in [46,47] else 'status',
            'Positive gap = test precedes that year bound. No cash, EBITDA or actual headroom forecast.', 'S09 §7.11; S19',fmt='date' if row in [43,44,45] else 'integer' if row in [46,47] else None,group='timing')
    merged('Credit','A49:F51','Trigger: earlier of ≥$400m covenant-EBITDA certificate delivery or required Q2 2027 statements. §6.01(b) uses the later of 45 days after quarter-end or five days after the SEC reporting period, with a timely Form 12b-25 extension provision. The illustrative date is not a legal deadline. §7.11 tests the first quarter ending AFTER the event. Existing businesses and eligible support must carry the earlier test if 10X is not commissioned.')
    merged('Credit','A53:F55','Before trigger: ≥$500m unrestricted cash and contractual Cash Equivalents. After trigger: leverage ≤4.00× (acquisition step-ups) and cash-interest coverage ≥3.00×. Cash-netting caps differ for financial covenants/pricing versus Article VII. Nominal maturity Aug 25, 2030 can spring 91 days before qualifying debt; exceptions require their own tests. Neither GAAP cash nor Adjusted EBITDA certifies compliance. Sources: S09 §§1.01, 4.02, 7.11; S19 Note 8.')

    section('Liquidity',6,'Company assets | reported balances; no project allocation or eligibility certification')
    for col,label in zip('ABCDEF',['As of','Cash ($m)','ST investments ($m)','Combined assets ($m)','Source','Basis']): cell('Liquidity',f'{col}7',label,kind='header')
    for row,r in enumerate(tables['liquid_assets.csv'],8):
        suffix=['2025','q2','q3'][row-8]
        cell('Liquidity',f'A{row}',serial(r['as_of']),fmt='date')
        for col,key in [('B','cash_'+suffix),('C','investments_'+suffix)]: cell('Liquidity',f'{col}{row}',formula='='+refs[key],expected=f[key],fmt='number')
        cell('Liquidity',f'D{row}',formula=f'=B{row}+C{row}',expected=r['total_usd_m'],fmt='number')
        cell('Liquidity',f'E{row}',r['sources'])
        cell('Liquidity',f'F{row}','Company; reported')
    measure('Liquidity',12,'Nine-month change in combined assets','=D10-D8',D('-492.375'),note='A historical movement, not a 10X funding deficit')
    section('Liquidity',15,'Historical bridge | 1 Jan–30 Sep 2026; internal cash/investment transfers net out')
    measure('Liquidity',16,'Opening company liquid assets','=D8',tables['liquidity_bridge.csv'][0]['usd_m'])
    for row,label,key in [(17,'Operating cash flow','ocf_9m'),(18,'Cash PP&E purchases, all projects','cash_ppe_9m'),(19,'HREE construction-award cash received','construction_awards_9m'),(20,'Financing cash flows','financing_cf_9m'),(21,'Investment accretion','investment_accretion_9m')]: fact('Liquidity',row,label,key)
    measure('Liquidity',22,'Restricted-cash release into measure',f'={refs["restricted_cash_open_current"]}+{refs["restricted_cash_open_noncurrent"]}-{refs["restricted_cash_close"]}',D('.821'),note='Opening current + noncurrent restricted cash less closing',source='S11; S19')
    measure('Liquidity',23,'ST-investment unrealized valuation change',f'={refs["investments_gains_close"]}-{refs["investments_losses_close"]}-{refs["investments_gains_open"]}+{refs["investments_losses_open"]}',D('-1.420'),source='S19 Note 4')
    measure('Liquidity',24,'Calculated closing combined assets','=SUM(B16:B23)',D('1337.911'),note='PPA and 45X receipts are already inside operating cash flow')
    measure('Liquidity',25,'Reported closing combined assets','=D10',D('1337.911'))
    measure('Liquidity',26,'Unexplained residual','=B25-B24',D(0),note='Must be zero at disclosed precision; no plug')
    section('Liquidity',29,'PPA cash conversion | 9m 2026; receipts already included in operating cash flow')
    for row,label,key in [(31,'Opening PPA receivable','ppa_receivable_open'),(32,'PPA income recognized','ppa_income_9m'),(33,'Closing PPA receivable','ppa_receivable_close')]: fact('Liquidity',row,label,key)
    measure('Liquidity',34,'Implied PPA receipts','=B31+B32-B33',D('110.869'),note='Assumes no other receivable movements; agrees with rounded cash disclosure')
    fact('Liquidity',35,'Reported PPA cash receipts, rounded','ppa_receipts_9m_rounded','Issuer reports actual subsequent cash support; not July 2025 equity causality')
    measure('Liquidity',36,'Rounded receipt reconciliation','=ROUND(B34,1)-B35',D(0),note='Rounding tolerance $0.05m; do not add receipts to the bridge again')
    section('Liquidity',39,'September debt | principal and accounting carrying amounts have different bases')
    for row,label,key in [(41,'2030 convertible notes principal','debt_notes_principal'),(42,'Samarium public loan principal','samarium_principal'),(43,'Equipment notes principal','equipment_principal')]: fact('Liquidity',row,label,key)
    measure('Liquidity',44,'Company principal including equipment','=SUM(B41:B43)',D('1043.133'),note='Not covenant debt or ring-fenced project debt')
    fact('Liquidity',45,'Long-term GAAP carrying debt','debt_carrying','Excludes equipment notes; includes discounts and issuance-cost effects')
    merged('Liquidity','A47:F49','Decision implication: public cash support and received equity coexist with substantial multi-project expenditure. Remaining 10X spend, ramp costs, eligible covenant cash and collection dates are not disclosed sufficiently for a project runway or funding-gap forecast. $1,337.911m cannot be assigned in full to 10X or treated as certified covenant liquidity.')

    section('Support',6,'SCENARIO | three offtake states; full-year threshold definition only')
    control('Support',8,'state','Contractual operating state',{'type':'list','values':STATES},'text')
    control('Support',9,'year','Illustrative calendar year',{'type':'whole','operator':'between','formula1':2025,'formula2':2100},'year')
    control('Support',10,'capacity','Production Capacity Estimate / target',{'type':'decimal','operator':'greaterThanOrEqual','formula1':0},'percent')
    control('Support',11,'benchmark','Normalized designated-kg benchmark',{'type':'decimal','operator':'greaterThanOrEqual','formula1':0})
    state_ok='OR(B8="Pre-COD",B8="COD / before milestone",B8="From milestone")'
    support_formulas={13:f'=IF(AND({state_ok},ISNUMBER(B9),B9=INT(B9),B9>=2025,B9<=2100,ISNUMBER(B10),B10>=0),"VALID","INVALID")',
        14:f'=IF(B13<>"VALID","INVALID",IF(B8="Pre-COD","",{refs["full_ebitda_base"]}*(1+{refs["escalation"]})^(B9-2025)*IF(B8="From milestone",1,B10)))',
        15:'=IF(B13<>"VALID","INVALID",IF(B8="Pre-COD","",B14/4))'}
    for row,label in [(13,'Threshold input validation'),(14,'Full-year definition threshold'),(15,'Nominal one-quarter fraction')]:
        measure('Support',row,label,support_formulas[row],baseline[f'Support!B{row}'],'status' if row==13 else 'USD m',note='Blank before COD; capacity scales only before milestone',source='S03 §1.2 / §6.2',group='threshold')
    merged('Support','A17:F18','Legal term starts 9 July 2025 and ends ten years after COD. §6.2 pays on the first day of each quarter AFTER COD; the first payment adds the prorated COD-quarter amount. The nominal /4 illustration excludes this stub and annual true-up. It is not actual payment guidance, covenant EBITDA or CFADS. Pre-COD incremental reimbursements have distinct eligibility and caps.')
    measure('Support',19,'PPA input validation',f'=IF(AND({state_ok},ISNUMBER(B11),B11>=0),"VALID","INVALID")',baseline['Support!B19'],'status',group='ppa')
    fact('Support',20,'NdPr benchmark floor','ppa_floor')
    fact('Support',21,'Government upside share after milestone','ppa_upside_share')
    for row,label,formula in [(22,'Government support per eligible kg','=IF(B19="VALID",MAX(B20-B11,0),"INVALID")'),
        (23,'Payment to government per eligible kg','=IF(B19="VALID",IF(B8="From milestone",B21*MAX(B11-B20,0),0),"INVALID")'),
        (24,'Benchmark plus net support per kg','=IF(B19="VALID",B11+B22-B23,"INVALID")')]:
        measure('Support',row,label,formula,baseline[f'Support!B{row}'],'USD/kg equivalent','One eligible designated kg; not sales revenue, margin or forecast','S04 §§2–3',group='ppa')
    merged('Support','A26:F27','PPA shortfall protection can apply before 10X COD; the upside payment begins only from the production milestone. Eligible quantities/designation and collection timing remain material. A price floor does not cover construction or guarantee bank repayment.')
    section('Support',29,'Reported support by accounting status | amounts cannot be summed as fresh cash')
    support_rows=[(31,'Public preferred cash, July 2025','preferred_cash','Received equity; 7% cumulative preference and dilution rights remain'),
        (32,'Samarium public lending cash, Aug 2025','samarium_cash','Repayable; separate Mountain Pass scope, 5.38% cash interest'),
        (33,'9m 2026 45X cash receipt','tax_credit_receipt','Cash within OCF; not added again in liquidity bridge'),
        (34,'Current 45X receivable, Sep 2026','tax_credit_receivable_current','Accrued government grant receivable; not cash'),
        (35,'Noncurrent 45X receivable, Sep 2026','tax_credit_receivable_noncurrent','Rounded disclosed balance; not cash'),
        (36,'10X reimbursement receivable','dod_cost_receivable','Not evidence of full cash collection'),
        (37,'10X reimbursement contract liability','dod_cost_liability','Matching capitalized fulfillment costs; not an additional cash source'),
        (38,'TSIF manufacturing reimbursement ceiling','tsif_grant_limit','Conditional ceiling, rounded; excludes TEF corporate-operations award'),
        (39,'TSIF noncash award receivable recognition','tsif_recognized_non_cash','Noncash recognition; distinct from HREE construction-award cash'),
        (40,'Initial PPA rights accounting asset','ppa_non_cash_asset','Noncash initial valuation; not funding proceeds')]
    for row,label,key,note in support_rows: fact('Support',row,label,key,note)
    section('Support',43,'Payment and obligation map | payer → beneficiary; condition and timing')
    risk=[['Instrument','Payer → beneficiary','Condition','Timing / retained exposure','Source','Class'],
        ['PPA price support','DoD → MP','Eligible designated quantity; benchmark below floor','PPA receivable → collection; operating cost/yield risk remains','S04 / S19','Contract / actual'],
        ['10X offtake','DoD → 10X SPV','Qualifying output/costs; threshold regime after COD','Quarterly facilitation, first stub and annual true-up; execution remains','S03 §6','Contract'],
        ['Public equity','DoD → MP; equity claims → DoD','Preferred/warrant terms','Cash received 2025; cumulative preference and conversion dilution','S05 / S11','Contract / actual'],
        ['Conditional preferred backstop','DoD → MP if specified shortfall','Incremental net financing below $350m threshold; notice and closing required','July equity exceeded threshold; no backstop cash counted; warrant already issued','S02 §6.01 / S11','Contract / comparison'],
        ['Samarium loan','Government → MP; MP → government','Separate project scope and repayable loan','Cash received 2025; interest and principal obligations survive','S11 / S19','Contract / actual'],
        ['MP guarantee','MP → DoD','Specified SPV payment and performance obligations','Primary obligor, underlying limits; parent exposure, no bank repayment cover','S02 §6.09','Contract'],
        ['TSIF / HREE','Texas / DoD → eligible project beneficiary','Different grant uses, eligible costs and approvals','TSIF noncash receivable differs from HREE cash; no double count','S19 / S20','Reported'],
        ['Corporate revolver','Banks → MP on loan draw; MP → banks','Draw conditions, covenants, guarantees/security exceptions','Corporate repayment; nominal and springing maturity risks','S09 / S19','Contract']]
    for row,values in enumerate(risk,44):
        for col,value in zip('ABCDEF',values): cell('Support',f'{col}{row}',value,kind='header' if row==44 else 'text')
    merged('Support','A54:F56','S02 §6.13 leaves MP a reasonable-best-efforts duty to raise additional capital if project funding is insufficient. §6.04(d) gives no construction-date/capacity guarantee; delay alone need not breach the agreement if efforts meet the standard. HREE pre-production costs have separate reimbursement/no-double-count rules (§6.06(a)). Future appropriations: S03 §6.8. These provisions do not establish sovereign bank repayment cover. No aggregate support-total output is calculated.')

    section('Checks',6,'Baseline reconciliation | independent Decimal/date calculations; scenario cases shown explicitly')
    for col,label in zip('ABCDEF',['Cell / input','Live value','Python baseline','Tolerance','Result','Evidence class / treatment']): cell('Checks',f'{col}7',label,kind='header')
    groups={'rcf':['draw','sofr','days'],'addback':['minimum','income','duplicate'],'timing':['trigger'],
        'threshold':['state','year','capacity'],'ppa':['state','benchmark']}
    anchors = [x for x in spec['anchors'] if not ss[x['cell'].split('!')[0]]['cells'][x['cell'].split('!')[1]].get('kind')=='link']
    # Every numeric output/formula is reconciled; hyperlinks are checked structurally.
    for row,anchor in enumerate(anchors,8):
        target=anchor['cell']; group=anchor['group']; expected=anchor['expected']
        sheet,addr=target.split('!')
        cell('Checks',f'A{row}',target)
        source_format=ss[sheet]['cells'][addr].get('format')
        cell('Checks',f'B{row}',formula=f"='{sheet}'!{addr}",expected=expected,fmt=source_format)
        cell('Checks',f'C{row}',expected,kind='anchor',fmt=source_format)
        numeric=isinstance(expected,(D,int,float))
        cell('Checks',f'D{row}',1e-7 if numeric else 0)
        equality=f'ABS(B{row}-C{row})<=D{row}' if numeric else f'B{row}=C{row}'
        checks=f'IF({equality},"PASS","FAIL")'
        if group:
            differences=[]
            for key in groups[group]:
                ctrl=spec['controls'][key]; sh,ad=ctrl['cell'].split('!'); v=ctrl['baseline']
                lit=json.dumps(v) if isinstance(v,str) else str(v)
                differences.append(f"'{sh}'!{ad}<>{lit}")
            checks=f'IF(OR({",".join(differences)}),"SCENARIO",{checks})'
        cell('Checks',f'E{row}',formula='='+checks,expected='PASS')
        cell('Checks',f'F{row}','Scenario baseline anchor' if group else 'Historical / fixed contractual anchor')
    end=7+len(anchors)
    section('Checks',end+3,'Live integrity and evidence flags | no inferred human approval')
    checks=[('Baseline failures',f'=COUNTIF(E8:E{end},"FAIL")',0,'Must remain zero at baseline; SCENARIO is expected after valid control edits'),
        ('Historical fact count',f'=COUNT(\'Guide_Sources\'!B18:B{17+len(f)})',len(f),'All source facts present; missing numeric input must be investigated'),
        ('Missing factual locators',f'=COUNTBLANK(\'Guide_Sources\'!F18:F{17+len(f)})',0,'Every factual input requires its original locator'),
        ('Sources after cutoff',f'=COUNTIF(\'Guide_Sources\'!C{first_source+2}:C{first_source+1+len(sources)},">"&DATE(2026,11,6))',0,'Frozen research cutoff'),
        ('Liquidity bridge residual',"='Liquidity'!B26",D(0),'Receipts already within OCF; no added support cash'),
        ('Q3 L-C double-count check',f"='Credit'!D10-({refs['lc_sublimit']}-{refs['unused_lc_q3']})",D(0),'Independent unused L-C sublimit disclosure'),
        ('PPA rounded receipts reconciliation',"='Liquidity'!B36",D(0),'Cash disclosure and receivable rollforward agree at reported rounding')]
    for row,(label,formula,value,note) in enumerate(checks,end+5):
        measure('Checks',row,label,formula,value,'check',note)
        ss['Checks']['merges'].append(f'D{row}:F{row}')
    for row,label,note in [(end+14,'MISSING: actual covenant certificate','Blocks actual headroom and proof of clause use; historical compliance remains issuer-reported'),
        (end+15,'MISSING: original loan / cancellation ledger','Blocks loan optimization and exact $0.8m reconciliation; undrawn expiration is documented'),
        (end+16,'MISSING: remaining 10X spend / cash schedule','Blocks project runway, funding gap and debt-service forecast'),
        (end+17,'REVIEW: financial and methodological stance','Benjamin review pending; technical PASS does not supply financial approval')]:
        merged('Checks',f'A{row}:C{row}',label)
        merged('Checks',f'D{row}:F{row}',note)
    spec['check_status_range']=f'E8:E{end}'
    spec['anchors']=anchors
    spec['scenarios']=[{'name':name,'overrides':overrides,'expected':scenario(data,overrides)} for name,overrides in [
        ('zero_draw_low_benchmark_pre_cod',{'draw':0,'sofr':.03,'state':'Pre-COD','benchmark':70}),
        ('full_draw_post_milestone',{'draw':203,'sofr':.05,'state':'From milestone','capacity':.25}),
        ('negative_income_duplicate_reversal',{'minimum':40,'income':-10,'duplicate':20,'trigger':'2027-09-30'}),
        ('quarter_end_trigger_above_target',{'trigger':'2027-06-30','capacity':1.1}),
        ('invalid_draw',{'draw':204}),('missing_rate',{'sofr':None}),('invalid_state',{'state':'Unrecognized'}),
        ('invalid_year',{'year':2024}),('negative_capacity',{'capacity':-.1}),('missing_benchmark',{'benchmark':None})]]
    return spec


def default(obj):
    if isinstance(obj,D): return float(obj)
    raise TypeError(type(obj))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    value=json.dumps(build(),indent=2,default=default)+'\n'
    dest=OUT/'model_spec.json'
    if args.check:
        assert dest.read_text()==value, 'Stale model specification'
        print('PASS: controlling cell/formula specification and Python anchors reproduce')
    else:
        OUT.mkdir(parents=True,exist_ok=True)
        dest.write_text(value)
        print(dest)


if __name__=='__main__': main()

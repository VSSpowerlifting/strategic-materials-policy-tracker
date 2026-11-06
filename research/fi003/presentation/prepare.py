#!/usr/bin/env python3
"""Freeze a draft slide manuscript and numeric lineage from unchanged model 1.0."""
import hashlib
import json
import sys
from pathlib import Path
from decimal import Decimal as D

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import prototype as p
import model


def build():
    data = json.loads((ROOT/'inputs.json').read_text())
    sources = json.loads((ROOT/'sources.json').read_text())
    schedules = p.build(data, sources)
    f = {k: D(v['value']) for k, v in data['facts'].items()}
    econ = {x['measure']: x['value'] for x in schedules['financing_economics.csv']}
    dilution = econ['New shares as share of isolated post-offering base']
    growth = econ['Increase relative to pre-offering basic shares']
    bridge = schedules['liquidity_bridge.csv']
    opening, closing = bridge[0]['usd_m'], bridge[-1]['usd_m']
    receipt = f['ppa_receivable_open']+f['ppa_income_9m']-f['ppa_receivable_close']
    fmt = lambda x, n=1: f'{x:,.{n}f}'
    slides = []

    def slide(kind, title, scope, sources_, claims, model_ref, note, **kw):
        slides.append(dict(number=len(slides)+1, kind=kind, title=title, scope=scope,
            source_refs=sources_, claim_ids=claims, model_ref=model_ref, note=note, **kw))

    slide('cover', 'JPMorgan and MP Materials', 'Financing Through 10X Construction',
        [('S02','§§2.05, 6.01'),('S09','cover, §1.01'),('S11','Notes 3, 18')], ['C01','C05','C11'], '',
        'A replaceable bank commitment, an equity takeout and government-linked corporate credit',
        author='Benjamin Yang', version='Research draft 0.1 · 6 November 2026')
    slide('answer', 'Equity secured cash while MP retained exposure through commissioning',
        'Analyst judgment · comparable industrial sponsor and lender perspective',
        [('S02','§§6.01, 6.13'),('S09','§§1.01, 7.11'),('S11','Notes 3, 18'),('S19','Note 8, MD&A')],
        ['C07','C14','C38','C46','C52'],'Financing!B16:B24; Credit!A7:F10',
        'Assess funding through commissioning using dated cash availability, permitted uses and corporate covenant tests.',
        findings=[
            [f'${fmt(f["final_net"])}m',f'Net common-equity proceeds received in July 2025, with {fmt(dilution,2)}% isolated ownership dilution'],
            [f'${fmt(f["available_q3"],0)}m','Remaining conditional revolver capacity at September 2026, after letters of credit'],
            ['Contractual support','Defense agreements enter the EBITDA definition and a performance covenant. Actual addback use remains unknown']],
        caveat='The evidence supports financing flexibility. Original loan terms and a remaining-cost schedule are insufficient to rank the capital mix or certify completion funding.')
    slide('sequence','Replacement rights connected the closing commitment to later financing',
        'Documented sequence · 2025 · amounts have different financing statuses',
        [('S02','§§2.05–2.07'),('S11','Notes 3, 18'),('S17','Item 8.01'),('S09','cover')],
        ['C03','C04','C05','C07','C35'],'chronology.csv; Financing!B7:B16',
        'The commitment served a closing and contingent-funding function. MP reports that replacement financing reduced it until it expired undrawn.',
        rows=[['Date','Observed financing event'],['9 Jul 2025','Government agreements and replaceable joint commitment of at least $1bn'],
              ['16 Jul 2025',f'Common-equity pricing at $55. July completion ultimately supplied ${fmt(f["final_net"])}m net'],
              ['25 Aug 2025',f'Corporate revolving credit facility executed for ${fmt(f["revolver"],0)}m'],
              ['26 Aug 2025','Original construction commitment expired undrawn']],
        caveat='Apple announced a separate agreement on 15 July, before equity pricing. The sequence alone cannot isolate its influence or that of government support.')
    slide('roles','JPMorgan spans the financing stages alongside substantial partner roles',
        'Documented functions · legal entities and initial underwriting obligations',
        [('S01','Item 1.01'),('S07','Schedule A'),('S09','cover, signatures'),('S15','bank account')],
        ['C02','C08','C09','C11','C12','C33'],'exhibits/underwriting.csv',
        'JPMorgan’s continuing agency role connects the financing stages. Goldman shared the original commitment and the same initial equity allocation.',
        rows=[['Function','JPMorgan entity / role','Other participants / limit'],
              ['Advice','J.P. Morgan: sole financial adviser, per its own account','Bank self-description'],
              ['Construction route','JPMorgan Chase Funding Inc.: joint commitment','Goldman Sachs Bank USA. Individual holds unknown'],
              ['Equity underwriting','J.P. Morgan Securities LLC: ≈40% of initial shares','Goldman ≈40%, Morgan Stanley ≈20%'],
              ['Corporate credit','JPMorgan Chase Bank N.A.: agent, lender and L-C issuer','Joint arrangers Goldman/Morgan Stanley. Citi/BofA roles']],
        caveat='Initial underwriting obligations establish participation, not retained investment, fee allocation or unique capability.')
    slide('alternatives','An available equity takeout best explains the observed transition',
        'Ranked explanations · overlapping mechanisms, rather than causal percentages',
        [('S02','§2.05'),('S11','Notes 3, 18'),('S17','Item 8.01'),('S09','§1.01')],
        ['C04','C05','C35','C37','C38'],'analysis.md: ranked competing explanations',
        'The takeout can be conventional while the combined contractual architecture remains useful to a financing team.',
        rows=[['Explanation','Evidence and implication'],
              ['1. Flexible commitment, then equity','Strong: express replacement rights, completed proceeds and issuer-reported lapse'],
              ['2. Government support improved financeability','Direct mechanisms in public capital and credit terms. Equity-demand effect unisolated'],
              ['3. Debt-cost or leverage aversion drove the choice','Plausible. Missing loan pricing, tenor and management rationale prevent confirmation'],
              ['4. Expiration signaled bank rejection','Weak: completed replacement financing fits the disclosed sequence better']],
        caveat='Apple’s agreement and the available equity market are credible influences. The record does not establish JPMorgan indispensability or financing optimality.')
    slide('economics',f'Equity supplied ${fmt(f["final_net"])}m at {fmt(dilution,2)}% isolated ownership dilution',
        'SMPT calculation · July-9 basic share base plus the completed offering only',
        [('S06','The Offering, S-7'),('S07','Schedule A'),('S11','Notes 3, 18')],
        ['C06','C07','C10','C46'],'Financing!B9:B24; financing_economics.csv',
        'Equity avoids scheduled principal and coupon payments while transferring residual ownership. Unknown original loan terms prevent a lifetime financing-cost ranking.',
        chart={'categories':['Isolated post-offering base'],'series':[{'name':f'Existing holders: {fmt(100-dilution,2)}%','values':[round(float((100-dilution)/100),12)]},{'name':f'New offering shares: {fmt(dilution,2)}%','values':[round(float(dilution/100),12)]}]},
        rows=[['Measure','Controlling calculation / meaning'],['Existing basic shares',fmt(f['preoffering_basic_shares'],0)],
              ['New common shares',fmt(f['final_shares'],0)],['Increase in old share base',fmt(growth,2)+'%'],
              ['Existing holders retain',fmt(100-dilution,2)+'% of isolated post-offering base']],
        caveat='Excludes preferred conversion, warrants, other issuances, options and convertibles. The 3% underwriting discount is a one-time transaction cost, not the cost of equity.')
    slide('capacity',f'Letters of credit leave ${fmt(f["available_q3"],0)}m of the $275m revolver available',
        'Reported snapshots and SMPT decomposition · USD million · zero loan draws',
        [('S11','Note 10'),('S13','Note 8'),('S19','Note 8')],
        ['C13','C14'],'Credit!A7:F10; revolver_snapshots.csv',
        'Letters of credit consume facility capacity without supplying construction cash. Future borrowing remains subject to the credit agreement.',
        chart={'categories':[r['as_of'] for r in schedules['revolver_snapshots.csv']], 'series':[
            {'name':'Implied L-C exposure','values':[float(r['lc_exposure_implied_usd_m']) for r in schedules['revolver_snapshots.csv']]},
            {'name':'Remaining conditional capacity','values':[float(r['remaining_capacity_usd_m']) for r in schedules['revolver_snapshots.csv']]}]},
        caveat='The $200m L-C sublimit sits inside the $275m facility. MP reported compliance at 30 September 2026. This is capacity, separate from cash on hand.')
    slide('covenant','Defense contracts enter both covenant earnings and performance obligations',
        'Executed corporate credit agreement · mechanism plus hypothetical USD-million illustration',
        [('S09','§1.01(a)(xiv), §§4.02, 6.16')],['C38','C53'],
        'Credit!B29:B35; covenant_adjustment.csv',
        'Contractual earnings recognition can precede collection. The certificate calculation and the underlying contract performance both deserve diligence.',
        rows=[['Credit provision','Financial meaning'],['EBITDA adjustment','Applicable Test-Period minimums / guaranteed revenues / fixed-price amounts less attributable net income, floored at zero'],
              ['Certificate and later cash','Borrower supplies the estimate. Later cash duplicating a prior addback is subtracted'],
              ['Performance covenant','MP must perform Defense agreements, subject to a Material Adverse Effect exception'],
              ['New extensions','Specified representations and absence of Default condition new credit extensions']],
        example='Hypothetical clause arithmetic: max($40m applicable amount − $20m attributable income, 0) = $20m addback',
        caveat='Actual adjustment use and headroom are unknown. Future 10X amounts require applicable entitlement. No existing default or automatic loss of availability is inferred.')
    slide('timing','Corporate earnings tests can precede expected 10X commissioning',
        'Contractual timing scenario · calendar-year bounds for management’s expectation',
        [('S09','§1.01 trigger, §§6.01(b), 7.11'),('S19','MD&A: 10X')],['C15','C50'],
        'Credit!B40:B47; model.py:scenario; prototype.py:first_test_quarter',
        'Treasury and lenders need a corporate earnings and eligible-liquidity case during construction, before assuming 10X operating receipts contribute.',
        rows=[['Stage','Test or milestone'],['Before the trigger','At least $500m unrestricted contractual cash / Cash Equivalents'],
              ['Illustrative delivery: 15 Aug 2027','First quarter ending after delivery: 30 Sep 2027'],
              ['From the earnings-test stage','Leverage ≤4.00× and cash-interest coverage ≥3.00×, subject to terms'],
              ['Management expectation: 2028','10X begins commissioning. Commissioning is distinct from contractual COD']],
        caveat='An earlier ≥$400m EBITDA certificate can trigger the switch. Delivery timing is assumed, not a legal deadline. The 93–458 days compare year endpoints, not forecast COD dates.')
    slide('support','Government support covers specified exposures while MP retains funding duties',
        'Contract and reported cash distinctions · each instrument assessed separately',
        [('S02','§§6.01, 6.04(d), 6.09, 6.13'),('S03','§§6.1–6.9'),('S04','§§2–3'),('S11','Note 3')],
        ['C18','C24','C25','C26','C40','C51','C52'],'Support!A44:F56; analysis.md risk map',
        'MP must use reasonable best efforts to raise additional capital if enumerated funding is insufficient. Timing obligations are qualified, and the parent guarantee runs to DoD.',
        rows=[['Instrument','Risk addressed','Exposure or condition retained'],
              ['NdPr price protection','Eligible benchmark shortfall','Designation, quantity, costs and collection timing'],
              ['10X offtake','Qualifying output / defined support','Construction, specifications and payment mechanics'],
              ['$400m initial preferred','Received public equity capital','7% cumulative preference and potential dilution'],
              ['Additional preferred fallback','Shortfall below $350m incremental net financing','Conditional purchase mechanics. July equity exceeded threshold']],
        caveat='Specified source/use restrictions constrain flexibility. The separate $150m samarium loan is repayable and serves another project. No extra backstop cash is counted.')
    threshold = p.capacity_threshold(2029,D('.5'),f['full_ebitda_base'],f['escalation'],True)
    full = p.capacity_threshold(2029,D('.5'),f['full_ebitda_base'],f['escalation'],True,True)
    slide('states','10X threshold protection changes with contractual operating status',
        'Hypothetical full-year CY2029 threshold definition · USD million · 50% capacity illustration',
        [('S03','§§1.2, 2.1, 6.2')],['C20','C21','C22'],'Support!B8:B15; offtake_threshold.csv',
        'Before the production milestone, capacity scales the threshold. From that milestone, the full escalating definition applies. These states change the entitlement used in a financing assessment.',
        rows=[['Contractual state','Threshold definition','2029 illustration'],['Before commercial operation','Operating threshold withheld','—'],
              ['COD to production milestone','Full amount × capacity estimate / target',fmt(threshold,3)],
              ['From production milestone','$140m × 1.02⁴',fmt(full,3)]],
        caveat='The legal term starts at signing and runs to ten years after COD. Full-year amounts exclude first-payment stub and annual true-up. Threshold EBITDA is distinct from cash available for debt service and corporate covenant EBITDA.')
    slide('conversion','Price protection delivered $110.9m of cash during nine-month 2026',
        'Reported receipts and SMPT receivable reconciliation · USD million',
        [('S19','Notes 9, 13, 15, 21; MD&A Cash Flows')],['C41','C42','C43','C44'],
        'Liquidity!B31:B36; Support!B33:B40; support_accounting.csv',
        'Payment evidence matters independently of accounting income, receivables and award ceilings. Reported receipts are already included in operating cash flow.',
        equation=f'{fmt(f["ppa_receivable_open"],3)} + {fmt(f["ppa_income_9m"],3)} − {fmt(f["ppa_receivable_close"],3)} = {fmt(receipt,3)}',
        equation_labels='Opening PPA receivable + nine-month income − closing receivable = implied receipts',
        rows=[['Other support evidence at 30 Sep 2026','Amount / status'],['45X credit cash receipts',f'${fmt(f["tax_credit_receipt"],0)}m received during nine months'],
              ['10X reimbursable-cost receivable',f'${fmt(f["dod_cost_receivable"],3)}m accrued'],
              ['TSIF reimbursement ceiling',f'Up to ${fmt(f["tsif_grant_limit"])}m'],
              ['TSIF award receivable recognition',f'${fmt(f["tsif_recognized_non_cash"],3)}m noncash']],
        caveat='The $110.869m rollforward is consistent with reported rounded receipts of $110.9m. The distinct $6.5m HREE construction-award cash belongs in the company liquidity bridge.')
    slide('bridge',f'Company liquid assets fell ${fmt(opening-closing)}m as expansion continued',
        'Historical cash plus short-term investments · USD million · nine months to 30 Sep 2026',
        [('S19','cash flows, balance sheets, Note 4'),('S11','restricted cash')],['C29','C30','C48'],
        'Liquidity!B16:B26; liquidity_bridge.csv; liquid_assets.csv',
        'The bridge demonstrates continued corporate resource use across multiple projects. A remaining 10X funding requirement needs a separate cost-to-complete and collection schedule.',
        waterfall={'labels':['31 Dec 2025','Operating','Cash PP&E','HREE award','Financing','Accretion','Restricted cash','Valuation','30 Sep 2026'],
            'values':[float(bridge[0]['usd_m'])]+[float(r['usd_m']) for r in bridge[1:-2]]+[float(bridge[-1]['usd_m'])]},
        caveat='All seven components reconcile at unrounded precision. PPA receipts are inside operating cash flow. Company liquid assets are not free 10X cash or certified covenant liquidity.')
    slide('decisions','A dated funding and covenant schedule is the next decision input',
        'Analyst recommendations · comparable sponsor is primary audience',
        [('S02','§§2.05, 6.04(c), 6.13, 7.01(e)'),('S09','§§4.02, 6.16, 7.11')],
        ['C04','C38','C52','C53','C54'],'analysis.md: decisions and conditions through commissioning',
        'The record supports the financing architecture and a diligence sequence. Missing loan terms leave the optimal capital mix open.',
        rows=[['Decision / owner','Action and change-of-action condition'],
              ['Substitute funding / treasury','Confirm settled proceeds, permitted uses and live credit conditions before cancellation. Unfunded replacement requires another committed route'],
              ['Fund through commissioning / CFO and lenders','Reconcile cash, L-Cs, spend, collections and certificates by date. A projected shortfall calls for earlier financing, revised spend or amendment'],
              ['Assess public support / credit team','Test entitlement and performance separately from EBITDA recognition. Delayed collection or a material contract issue requires reassessment']],
        caveat='DoD has contractual cost-to-complete and funding-information rights. Those reports are absent from the public packet. No actual shortfall or automatic default is asserted.')
    slide('methods','Evidence supports the architecture and bounds the financial conclusions',
        'Research cutoff: 6 November 2026 · model 1.0 · agent-assisted independent SMPT analysis',
        [('S02','transaction agreement'),('S09','credit agreement'),('S11','2025 10-K'),('S19','Q3 2026 10-Q')],
        ['C10','C38','C46','C48','C50'],'inputs.json; model.py; VERIFICATION.md; PUBLICATION_PLAN.md',
        'The model separates facts, calculations and scenarios. Human financial and publication review remains pending.',
        rows=[['Evidence gap','Consequence for this publication'],['Original commitment / fee letter','No debt-versus-equity optimality or exact $0.8m cancellation reconciliation'],
              ['Actual compliance certificates','No demonstrated addback use or actual headroom'],['Remaining project spend and collections','No completion-funding certification, runway or project debt-service forecast'],
              ['Bank individual holds and internal decisions','No bank profitability, sole-design or indispensability claim']],
        caveat='No affiliation or endorsement by JPMorgan, MP Materials or the U.S. government. Research links, calculations and model provenance accompany this draft.')

    paths = ['inputs.json','sources.json','prototype.py','model.py','outputs/fi003-model-v1/model_spec.json',
        'outputs/fi003-model-v1/recalculated/FI003_Working_Model_v1.xlsx']
    return {'version':'FI003 presentation draft 0.1','cutoff':'2026-11-06',
        'reviewed_head':'146fa5084cf0492ce1e7f4ef84757c94879e83de',
        'model_version':model.VERSION,'source_hashes':{q:hashlib.sha256((ROOT/q).read_bytes()).hexdigest() for q in paths},
        'baseline_controls':data['model_controls'],'sources':sources,'slides':slides}


if __name__ == '__main__':
    value = json.dumps(build(),indent=2,ensure_ascii=False)+'\n'
    path = Path(__file__).with_name('slide-manifest.json')
    if '--check' in sys.argv:
        assert path.read_text() == value, 'Stale slide manuscript or numerical snapshot'
        print('PASS: 15-slide manuscript and numerical provenance reproduce')
    else:
        path.write_text(value)
        print(path)

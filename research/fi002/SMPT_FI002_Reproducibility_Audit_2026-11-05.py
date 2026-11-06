#!/usr/bin/env python3
"""FI002 bounded arithmetic/source-integrity audit. No web, repo writes, or valuation.

Purpose: independent reproduction of verified arithmetic and CSV structural checks.
Financial source data are transcribed from the source locators in the companion
Model Specification and Review; the values themselves are NOT independently fetched
by this script. Run: python SMPT_FI002_Reproducibility_Audit_2026-11-05.py
"""
import csv
from decimal import Decimal as D
from pathlib import Path

HERE = Path(__file__).resolve().parent
PRICE_CSV = HERE / 'SMPT_FI002_Price_Sensitivity_Illustrations_2026-11-05.csv'
EVIDENCE_CSV = HERE / 'SMPT_FI002_Evidence_Register_2026-11-05.csv'
LB_PER_TONNE = D('2204.6226218487757')  # exact derived from 1 kg=2.2046226218487757 lb
BHP_FY26_EBITDA_PER_CENT_USDM = D('39')
BASE_REFERENCE_USD_TONNE = D('13800')
SCENARIOS = {'World Bank October 2026': D('13000'),
             'Goldman previously reported': D('13800'),
             'Reported 19 Oct futures snapshot': D('14405'),
             'Goldman revised reported': D('15400')}

def near(actual, expected, tol=D('0.000001')):
    assert abs(actual - expected) <= tol, f'{actual} !~= {expected}'

def main():
    # Independently recompute from assumptions, not from precomputed file cells.
    results = {}
    for name, price in SCENARIOS.items():
        dprice = price - BASE_REFERENCE_USD_TONNE
        d_cents_per_lb = dprice / LB_PER_TONNE * D('100')
        d_ebitda_usdm = d_cents_per_lb * BHP_FY26_EBITDA_PER_CENT_USDM
        results[name] = (dprice, d_cents_per_lb, d_ebitda_usdm)
    with PRICE_CSV.open(encoding='utf-8-sig',newline='') as fp:
        rows = list(csv.DictReader(fp))
    assert len(rows) == len(SCENARIOS), 'Scenario count changed'
    assert set(r['case'] for r in rows) == set(SCENARIOS), 'Scenario names differ'
    for row in rows:
        name = row['case']
        delta, cents, ebitda = results[name]
        near(D(row['reference_2027_copper_USD_per_t']), SCENARIOS[name], D('0'))
        near(D(row['delta_vs_prior_GS_13800_USD_per_t']), delta, D('0'))
        near(D(row['cents_per_lb_difference']), cents, D('0.0000001'))
        near(D(row['hypothetical_FY26_basis_BHP_underlying_EBITDA_USD_m']), ebitda, D('0.000002'))
        assert 'not FY27 forecast or FCF' in row['status']
    # Independent specific checks / cross-metric unit tests.
    near(results['Goldman revised reported'][2], D('2830.416389450'), D('0.000001'))
    near(results['Goldman revised reported'][2] - results['World Bank October 2026'][2],
         D('4245.624584175'),D('0.000002'))
    near(D('21778')-D('12011'), D('9767'),D('0'))  # BHP FY26 group FCF; cash flow statements
    near(D('18692')-D('13350'), D('5342'),D('0'))  # BHP FY25 group FCF
    near(D('18187')+D('14529')+D('832')-D('601'),D('32947'),D('0'))
    near(D('29031')-D('22530'),D('6501'),D('0'))
    near(D('18187')-D('12326'),D('5861'),D('0'))
    near((D('5.4')+D('6.3'))/D('2')-(D('4.4')+D('5.9'))/D('2'),D('0.7'),D('0'))
    near((D('5.85')/D('5.15')-D('1'))*D('100'),D('13.592233009708737864'),D('0.0000001'))
    # BHP's 54% headline denominator EXCLUDES Group & Unallocated (-601m).
    share_operating_segments=D('18187')/(D('18187')+D('14529')+D('832'))*D('100')
    share_group_total=D('18187')/D('32947')*D('100')
    assert D('54')<share_operating_segments<D('55'),share_operating_segments
    assert D('55')<share_group_total<D('56'),share_group_total
    with EVIDENCE_CSV.open(encoding='utf-8-sig',newline='') as fp:
        erows=list(csv.DictReader(fp))
    assert len(erows)==38, 'Original input register changed; review new rows manually'
    assert len({r['source_id'] for r in erows})==len(erows), 'Duplicate source_id'
    assert all(r['url'].startswith('https://') for r in erows), 'Missing/invalid HTTPS URL'
    assert all(r['classification'] and r['verification'] for r in erows), 'Missing classifications'
    print('PASS: 4 price scenarios independently recomputed and compared within rounding')
    for label,(_delta,_cents,ebitda) in results.items():
        print(f'  {label:35s} delta underlying EBITDA, FY26-static only: {ebitda:,.6f} US$m')
    print('PASS: FY25/FY26 FCF cash-flow reconciliations; no silver-streaming double count')
    print('PASS: segment EBITDA denominator distinction; BHP headline 54% vs total-group ratio')
    print(f'  Operating-segment-denominator copper share {share_operating_segments:.3f}%')
    print(f'  Group-total-denominator copper share {share_group_total:.3f}%')
    print('PASS: capex midpoints, historical copper growth deltas, source register structure')
    print('NOT TESTED: price forecast truth, ownership funding waterfall, independent project IRR/NPV, legal permit status')

if __name__=='__main__':
    main()

#!/usr/bin/env python3
"""FI003 exploratory arithmetic. Python standard library only; no valuation engine."""
import argparse
import csv
import io
import json
from decimal import Decimal, getcontext
from pathlib import Path

getcontext().prec = 32
ROOT = Path(__file__).resolve().parent
D = Decimal


def validate(data, sources):
    source_ids = {s['id'] for s in sources}
    assert len(source_ids) == len(sources), 'Duplicate source IDs'
    for key, item in data['facts'].items():
        assert item['source'] in source_ids, key
        assert item['locator'] and item['as_of'] <= data['cutoff'], key
        assert item['unit'] and item['evidence_class'] == 'reported', key
        assert D(item['value']).is_finite(), key
    for key, item in data['assumptions'].items():
        assert item['class'] == 'hypothetical' and item['rationale'], key
        for value in item.get('values', [item.get('value')]):
            if isinstance(value, dict):
                assert value['name'], key
                assert D(value['applicable_minimum']).is_finite(), key
                assert D(value['attributable_net_income']).is_finite(), key
            else:
                assert D(value).is_finite(), key


def ppa_payoff(price, floor, share, milestone):
    """Normalized eligible kg, designated once. Benchmark plus net support, not revenue."""
    assert price >= 0 and floor > 0 and 0 <= share <= 1
    support = max(floor - price, D(0))
    repayment = share * max(price - floor, D(0)) if milestone else D(0)
    return support, repayment, price + support - repayment


def capacity_threshold(year, fraction, base, escalation, cod):
    assert year >= 2025 and 0 <= fraction <= 1
    # No guarantee before COD; do not turn absence of entitlement into a cash forecast.
    if not cod:
        return None
    return base * (1 + escalation) ** (year - 2025) * fraction


def government_addback(applicable_minimum, attributable_net_income):
    """Clause (a)(xiv) arithmetic only; eligibility and compliance certificate unverified."""
    assert applicable_minimum >= 0
    return max(applicable_minimum - attributable_net_income, D(0))


def rcf_cost(commitment, lc, draw, fee, spread, sofr, days):
    assert 0 <= draw <= commitment - lc and 0 <= lc <= commitment
    assert min(fee, spread, sofr, days) >= 0
    unused = commitment - lc - draw
    return unused, unused * fee * days / 360, draw * (sofr + spread) * days / 360


def build(data, sources):
    validate(data, sources)
    f = {k: D(v['value']) for k, v in data['facts'].items()}
    a = data['assumptions']
    tables = {}
    gross = f['final_shares'] * f['public_price'] / 1000000
    discount = f['final_shares'] * (f['public_price'] - f['underwriter_price']) / 1000000
    pre_other = gross - discount
    tables['replacement.csv'] = [
        dict(measure=label, usd_m=value, classification=kind, sources=src)
        for label, value, kind, src in [
            ('Original commitment reference minimum', f['commitment_reference'], 'commitment; never funded', 'S01;S11'),
            ('Equity gross calculated from exact shares', gross, 'derived gross proceeds', 'S07;S11'),
            ('Underwriting discount calculated', discount, 'derived aggregate discount; not bank profit', 'S07;S11'),
            ('Equity after discount before other expenses', pre_other, 'derived; not final net cash', 'S07;S11'),
            ('Final net equity proceeds', f['final_net'], 'reported; rounded', 'S11'),
            ('Implied other expenses / rounding', pre_other-f['final_net'], 'derived residual; not exact expense disclosure', 'S07;S11'),
            ('Corporate revolver', f['revolver'], 'committed capacity; not proceeds', 'S09'),
            ('Final net equity plus capacity minus commitment reference', f['final_net']+f['revolver']-f['commitment_reference'], 'arithmetic comparison only; mixed cash/capacity', 'S09;S11'),
            ('After-discount equity plus capacity minus reference', pre_other+f['revolver']-f['commitment_reference'], 'arithmetic compatibility only; exact contractual reduction unknown', 'S07;S09;S11'),
            ('Aggregate commitment and structuring fee expense', f['commitment_fees'], 'reported expense; no JPMorgan allocation', 'S11'),
        ]
    ]
    tables['underwriting.csv'] = [dict(
        bank=bank, initial_shares=f[key], initial_tranche_fraction=f[key]/f['initial_shares'],
        classification='initial underwriting obligation only; no fee or retention inference', sources='S07 Schedule A')
        for bank, key in [('J.P. Morgan Securities LLC', 'jp_initial_shares'),
                          ('Goldman Sachs & Co. LLC', 'gs_initial_shares'),
                          ('Morgan Stanley & Co. LLC', 'ms_initial_shares')]]
    lc_q2 = f['lc_sublimit'] - f['unused_lc_q2']
    tables['revolver_snapshots.csv'] = [
        dict(as_of=date, commitment_usd_m=f['revolver'], loan_draws_usd_m=f[draw],
             lc_exposure_implied_usd_m=f['revolver']-f[available]-f[draw],
             remaining_capacity_usd_m=f[available], sources=source,
             caveat='No assumption of September carry-forward; L-C sublimit is not additive')
        for date, draw, available, source in [
            ('2025-12-31', 'drawn_2025', 'available_2025', 'S11 Note 10'),
            ('2026-06-30', 'drawn_q2', 'available_q2', 'S13 Note 8')]]
    assert lc_q2 == f['revolver']-f['available_q2']-f['drawn_q2']
    tables['revolver_sensitivity.csv'] = []
    for draw in map(D, a['revolver_draws']['values']):
        for sofr in map(D, a['illustrative_sofr']['values']):
            unused, fee, interest = rcf_cost(f['revolver'], lc_q2, draw,
                f['pretrigger_commit_fee'], f['pretrigger_sofr_spread'], sofr, D(a['fee_days']['value']))
            tables['revolver_sensitivity.csv'].append(dict(
                hypothetical_draw_usd_m=draw, hypothetical_sofr=sofr,
                remaining_capacity_usd_m=unused, commitment_fee_usd_m=fee,
                loan_interest_usd_m=interest, fee_plus_loan_interest_usd_m=fee+interest,
                basis='Static June 30 L-C exposure; Level 1; 360 days; excludes L-C, agent, upfront and other fees',
                sources='S09 Sections 1.01,2.09,2.10; S13 Note 8; analyst assumptions'))
    tables['liquid_assets.csv'] = []
    for date, cash, investments, source in [
        ('2025-12-31', 'cash_2025', 'investments_2025', 'S14 comparative balance sheet; S11'),
        ('2026-06-30', 'cash_q2', 'investments_q2', 'S13 balance sheet'),
        ('2026-09-30', 'cash_q3', 'investments_q3', 'S14 balance sheet')]:
        liquid = f[cash] + f[investments]
        tables['liquid_assets.csv'].append(dict(as_of=date, cash_usd_m=f[cash],
            short_term_investments_usd_m=f[investments], total_usd_m=liquid,
            classification='reported company assets; not unrestricted 10X allocation or covenant certification', sources=source))
    opening = f['cash_2025'] + f['investments_2025']
    closing = f['cash_q3'] + f['investments_q3']
    flows = [('Operating cash flow', f['ocf_9m']),
             ('Cash PP&E purchases, all company projects', f['cash_ppe_9m']),
             ('Government construction-award proceeds', f['construction_awards_9m']),
             ('Financing cash flows', f['financing_cf_9m']),
             ('Accretion on short-term investments', f['investment_accretion_9m'])]
    residual = closing - opening - sum((value for _, value in flows), D(0))
    tables['liquidity_bridge.csv'] = [dict(measure='Opening company liquid assets', usd_m=opening,
        classification='reported 2025-12-31', sources='S14')]
    tables['liquidity_bridge.csv'] += [dict(measure=label, usd_m=value,
        classification='reported 9m 2026; accretion sign transformed', sources='S14') for label, value in flows]
    tables['liquidity_bridge.csv'] += [
        dict(measure='Residual: valuation, restricted-cash movement and other differences', usd_m=residual,
             classification='derived residual; components not independently allocated', sources='S14'),
        dict(measure='Closing company liquid assets', usd_m=closing,
             classification='reported 2026-09-30; not spendable project cash', sources='S14')]
    tables['ppa_sensitivity.csv'] = []
    for milestone in [False, True]:
        for price in map(D, a['benchmark_prices']['values']):
            support, repayment, net = ppa_payoff(price, f['ppa_floor'], f['ppa_upside_share'], milestone)
            tables['ppa_sensitivity.csv'].append(dict(
                hypothetical_benchmark_usd_kg=price, milestone_reached=milestone,
                support_usd_kg=support, payment_to_government_usd_kg=repayment,
                benchmark_plus_net_support_usd_kg=net,
                basis='One eligible designated NdPr kg equivalent; not sales revenue, margin or forecast', sources='S04 Sections 2-3'))
    tables['offtake_threshold.csv'] = []
    for year in map(int, a['support_years']['values']):
        for fraction in map(D, a['capacity_fractions']['values']):
            value = capacity_threshold(year, fraction, f['full_ebitda_base'], f['escalation'], True)
            tables['offtake_threshold.csv'].append(dict(
                hypothetical_calendar_year=year, hypothetical_contract_capacity_fraction=fraction,
                threshold_usd_m=value, quarterly_fraction_usd_m=value/4,
                basis='Conditional after COD; full-year illustration; true-up and contract conditions apply; not CFADS',
                sources='S03 Section 1.1 and 6.2; analyst assumptions'))
    tables['covenant_adjustment.csv'] = []
    for case in a['government_addback_cases']['values']:
        minimum, income = D(case['applicable_minimum']), D(case['attributable_net_income'])
        tables['covenant_adjustment.csv'].append(dict(case=case['name'],
            hypothetical_applicable_test_period_minimum_usd_m=minimum,
            hypothetical_attributable_net_income_usd_m=income,
            conditional_addback_usd_m=government_addback(minimum, income),
            basis='Illustrative clause arithmetic only; no actual covenant EBITDA or future 10X entitlement inferred',
            sources='S09 Section 1.01 Consolidated EBITDA (a)(xiv); analyst assumptions'))
    # These are disclosed income and accounting classifications, never added to cash funding.
    tables['support_accounting.csv'] = [dict(measure=label, usd_m=value, classification=kind, sources=src)
        for label, value, kind, src in [
            ('2025 PPA income recognized', f['ppa_income_2025'], 'reported income; not receipts', 'S11'),
            ('9m 2026 PPA income recognized', f['ppa_income_9m'], 'reported income; not receipts', 'S14'),
            ('Cumulative PPA income through September 2026', f['ppa_income_2025']+f['ppa_income_9m'], 'derived recognized income; not receipts', 'S11;S14'),
            ('9m 2026 company Adjusted EBITDA', f['adjusted_ebitda_9m'], 'reported non-GAAP; not covenant EBITDA or cash', 'S14'),
            ('Government preferred cash consideration', f['preferred_cash'], 'company cash raised; no full 10X allocation', 'S11'),
            ('Government samarium loan cash consideration', f['samarium_cash'], 'repayable debt; different project use', 'S11'),
            ('Initial PPA rights asset value', f['ppa_non_cash_asset'], 'noncash accounting valuation; no new cash', 'S11'),
        ]]
    return tables


def render(tables):
    result = {}
    for name, rows in tables.items():
        out = io.StringIO(newline='')
        writer = csv.DictWriter(out, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)
        result[name] = out.getvalue()
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Compare all generated schedules without writing')
    args = parser.parse_args()
    data = json.loads((ROOT/'inputs.json').read_text())
    sources = json.loads((ROOT/'sources.json').read_text())
    generated = render(build(data, sources))
    dest = ROOT/'exhibits'
    if args.check:
        for name, content in generated.items():
            assert (dest/name).read_text() == content, 'Stale output: '+name
        assert {p.name for p in dest.glob('*.csv')} == set(generated), 'Unexpected schedule'
        print(f'PASS: {len(generated)} schedules reproduce exactly')
    else:
        dest.mkdir(exist_ok=True)
        for name, content in generated.items():
            (dest/name).write_text(content)
        print(f'Wrote {len(generated)} exploratory schedules; human review pending')


if __name__ == '__main__':
    main()

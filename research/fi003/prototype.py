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
    assert all(s['publication_or_filing_date'] <= data['cutoff'] for s in sources), 'Source after cutoff'
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
                assert D(value['duplicative_later_cash']).is_finite() and D(value['duplicative_later_cash']) >= 0, key
            else:
                assert D(value).is_finite(), key


def ppa_payoff(price, floor, share, milestone):
    """Normalized eligible kg, designated once. Benchmark plus net support, not revenue."""
    assert price >= 0 and floor > 0 and 0 <= share <= 1
    support = max(floor - price, D(0))
    repayment = share * max(price - floor, D(0)) if milestone else D(0)
    return support, repayment, price + support - repayment


def capacity_threshold(year, fraction, base, escalation, cod, milestone=False):
    assert year >= 2025 and fraction >= 0
    assert not milestone or cod, 'Production milestone requires commercial operation'
    # S03 1.2: capacity scaling ends at the milestone. These are full-year
    # definition illustrations, not first-payment proration or annual true-up.
    # The definition states a ratio without an explicit 100% cap; the listed
    # scenarios use 25%-100%. Capacity notice obligations are a separate issue.
    if not cod:
        return None
    return base * (1 + escalation) ** (year - 2025) * (1 if milestone else fraction)


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
    tables['financing_economics.csv'] = [dict(measure=label, value=value, unit=unit,
        interpretation=note, sources=src) for label, value, unit, note, src in [
        ('Basic shares before offering', f['preoffering_basic_shares'], 'shares', 'July 9 basis; excludes potential shares', 'S06 S-7'),
        ('Basic shares plus final offering only', f['preoffering_basic_shares']+f['final_shares'], 'shares', 'Isolated pro forma; not actual later reported shares', 'S06;S11'),
        ('Increase relative to pre-offering basic shares', 100*f['final_shares']/f['preoffering_basic_shares'], 'percent', 'Denominator is July 9 basic shares', 'S06;S11'),
        ('New shares as share of isolated post-offering base', 100*f['final_shares']/(f['preoffering_basic_shares']+f['final_shares']), 'percent', 'Existing holders retain the remainder; excludes other dilution', 'S06;S11'),
        ('Aggregate underwriting discount / gross equity', 100*discount/gross, 'percent', 'Transaction cost; not bank profit or annual cost of equity', 'S07;S11'),
        ('Commitment expense / minimum headline commitment', 100*f['commitment_fees']/f['commitment_reference'], 'percent', 'Not annualized; no bank-specific allocation', 'S11'),
        ('Debt principal including equipment notes', f['debt_notes_principal']+f['samarium_principal']+f['equipment_principal'], 'USD million', 'September company principal; not covenant debt or project debt', 'S19 Note 8'),
    ]]
    lc_q3 = f['lc_sublimit'] - f['unused_lc_q3']
    tables['revolver_snapshots.csv'] = [
        dict(as_of=date, commitment_usd_m=f['revolver'], loan_draws_usd_m=f[draw],
             lc_exposure_implied_usd_m=f['revolver']-f[available]-f[draw],
             remaining_capacity_usd_m=f[available], sources=source,
             caveat='Dated reported snapshot; L-C sublimit is not additive; no future availability assumed')
        for date, draw, available, source in [
            ('2025-12-31', 'drawn_2025', 'available_2025', 'S11 Note 10'),
            ('2026-06-30', 'drawn_q2', 'available_q2', 'S13 Note 8'),
            ('2026-09-30', 'drawn_q3', 'available_q3', 'S19 Note 8')]]
    assert lc_q3 == f['revolver']-f['available_q3']-f['drawn_q3']
    tables['revolver_sensitivity.csv'] = []
    for draw in map(D, a['revolver_draws']['values']):
        for sofr in map(D, a['illustrative_sofr']['values']):
            unused, fee, interest = rcf_cost(f['revolver'], lc_q3, draw,
                f['pretrigger_commit_fee'], f['pretrigger_sofr_spread'], sofr, D(a['fee_days']['value']))
            tables['revolver_sensitivity.csv'].append(dict(
                hypothetical_draw_usd_m=draw, hypothetical_sofr=sofr,
                remaining_capacity_usd_m=unused, commitment_fee_usd_m=fee,
                loan_interest_usd_m=interest, fee_plus_loan_interest_usd_m=fee+interest,
                basis='Static September 30 L-C exposure; Level 1; 360 days; excludes L-C, agent, upfront and other fees',
                sources='S09 Sections 1.01,2.09,2.10; S19 Note 8; analyst assumptions'))
    tables['liquid_assets.csv'] = []
    for date, cash, investments, source in [
        ('2025-12-31', 'cash_2025', 'investments_2025', 'S19 comparative balance sheet; S11'),
        ('2026-06-30', 'cash_q2', 'investments_q2', 'S13 balance sheet'),
        ('2026-09-30', 'cash_q3', 'investments_q3', 'S19 balance sheet')]:
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
             ('Accretion on short-term investments', f['investment_accretion_9m']),
             ('Release of restricted cash outside liquid-asset measure', f['restricted_cash_open_current']+f['restricted_cash_open_noncurrent']-f['restricted_cash_close']),
             ('Change in short-term investment unrealized valuation', f['investments_gains_close']-f['investments_losses_close']-f['investments_gains_open']+f['investments_losses_open'])]
    residual = closing - opening - sum((value for _, value in flows), D(0))
    tables['liquidity_bridge.csv'] = [dict(measure='Opening company liquid assets', usd_m=opening,
        classification='reported 2025-12-31', sources='S19')]
    tables['liquidity_bridge.csv'] += [dict(measure=label, usd_m=value,
        classification=('derived from reported balances; see inputs locators' if label.startswith(('Release', 'Change'))
            else 'reported 9m 2026; sign reversed for investment accretion only'),
        sources='S19 cash flows and Note 4; S11 restricted cash') for label, value in flows]
    tables['liquidity_bridge.csv'] += [
        dict(measure='Unexplained residual', usd_m=residual,
             classification='derived check; must be zero at disclosed precision', sources='S19'),
        dict(measure='Closing company liquid assets', usd_m=closing,
             classification='reported 2026-09-30; not spendable project cash', sources='S19')]
    assert residual == 0, 'Liquid-asset bridge does not reconcile'
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
        for state, cod, milestone in [('pre-COD', False, False),
                ('COD before production milestone', True, False), ('from production milestone', True, True)]:
            fractions = [D(0)] if not cod else map(D, a['capacity_fractions']['values'])
            for fraction in fractions:
                value = capacity_threshold(year, fraction, f['full_ebitda_base'], f['escalation'], cod, milestone)
                tables['offtake_threshold.csv'].append(dict(
                    hypothetical_calendar_year=year, contractual_state=state,
                    hypothetical_capacity_estimate_fraction=fraction if cod else '',
                    threshold_usd_m=value, nominal_quarter_fraction_usd_m=value/4 if value is not None else None,
                    basis='Full-year definition only; capacity scales only before milestone; blank before COD; excludes first-payment proration and annual true-up; not CFADS',
                    sources='S03 Section 1.2 and 6.2; analyst assumptions'))
    tables['covenant_adjustment.csv'] = []
    for case in a['government_addback_cases']['values']:
        minimum, income = D(case['applicable_minimum']), D(case['attributable_net_income'])
        reversal = D(case['duplicative_later_cash'])
        assert reversal >= 0
        tables['covenant_adjustment.csv'].append(dict(case=case['name'],
            hypothetical_applicable_test_period_minimum_usd_m=minimum,
            hypothetical_attributable_net_income_usd_m=income,
            conditional_addback_usd_m=government_addback(minimum, income),
            reversal_of_prior_duplicative_addback_usd_m=reversal,
            net_clause_adjustment_usd_m=government_addback(minimum, income)-reversal,
            basis='Illustrative clause arithmetic only; no actual covenant EBITDA or future 10X entitlement inferred',
            sources='S09 Section 1.01 Consolidated EBITDA (a)(xiv); analyst assumptions'))
    # These are disclosed income and accounting classifications, never added to cash funding.
    tables['support_accounting.csv'] = [dict(measure=label, usd_m=value, classification=kind, sources=src)
        for label, value, kind, src in [
            ('2025 PPA income recognized', f['ppa_income_2025'], 'reported income; not receipts', 'S11'),
            ('9m 2026 PPA income recognized', f['ppa_income_9m'], 'reported income; not receipts', 'S19'),
            ('Cumulative PPA income through September 2026', f['ppa_income_2025']+f['ppa_income_9m'], 'derived recognized income; not receipts', 'S11;S19'),
            ('9m 2026 PPA cash receipts reported', f['ppa_receipts_9m_rounded'], 'reported cash; rounded; already inside operating cash flow', 'S19 MD&A Cash Flows'),
            ('PPA opening receivable plus income less closing receivable', f['ppa_receivable_open']+f['ppa_income_9m']-f['ppa_receivable_close'], 'derived implied receipts assuming no other movements; reconciles to rounded cash disclosure', 'S19 Note 13; income statement'),
            ('PPA closing receivable', f['ppa_receivable_close'], 'reported accrued income; not cash', 'S19 Note 13'),
            ('9m 2026 45X cash receipts', f['tax_credit_receipt'], 'reported cash; already inside operating cash flow', 'S19 Note 15'),
            ('45X current receivable', f['tax_credit_receivable_current'], 'reported receivable; not cash', 'S19 Note 13'),
            ('45X non-current receivable', f['tax_credit_receivable_noncurrent'], 'reported receivable; rounded; not cash', 'S19 Note 15'),
            ('10X reimbursable-cost receivable', f['dod_cost_receivable'], 'reported receivable; not cash or loan guarantee', 'S19 Note 13'),
            ('10X reimbursement contract liability', f['dod_cost_liability'], 'reported accounting liability; not all cash collected; matching capitalized fulfillment costs', 'S19 Note 9'),
            ('TSIF grant ceiling', f['tsif_grant_limit'], 'conditional reimbursement ceiling; not cash', 'S19 Note 15'),
            ('TSIF award receivable recognized in 9m 2026', f['tsif_recognized_non_cash'], 'reported noncash recognition; not grant cash receipts', 'S19 Notes 15;21'),
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

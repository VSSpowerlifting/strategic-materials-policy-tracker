"""Independent numeric anchors and failure cases for the exploratory schedules."""
import copy
import csv
import io
import json
import unittest
from decimal import Decimal as D
from pathlib import Path
import prototype as p

ROOT = Path(__file__).resolve().parent


class PrototypeTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT/'inputs.json').read_text())
        self.sources = json.loads((ROOT/'sources.json').read_text())
        self.tables = p.build(self.data, self.sources)

    def test_offering_independent_anchors(self):
        values = {r['measure']: r['usd_m'] for r in self.tables['replacement.csv']}
        self.assertEqual(values['Equity gross calculated from exact shares'], D('747.499940'))
        self.assertEqual(values['Underwriting discount calculated'], D('22.4249982'))
        self.assertEqual(values['Equity after discount before other expenses'], D('725.0749418'))
        self.assertEqual(values['Final net equity plus capacity minus commitment reference'], D('-0.8'))
        self.assertEqual(values['After-discount equity plus capacity minus reference'], D('0.0749418'))
        self.assertEqual(values['Aggregate commitment and structuring fee expense'] /
                         values['Original commitment reference minimum'], D('.0074'))

    def test_initial_underwriter_obligations_reconcile(self):
        rows = self.tables['underwriting.csv']
        self.assertEqual(sum(r['initial_shares'] for r in rows), D('11818181'))
        self.assertAlmostEqual(rows[0]['initial_tranche_fraction'], D('0.4'), places=6)

    def test_lc_capacity_not_extra_cash(self):
        rows = self.tables['revolver_snapshots.csv']
        self.assertEqual([r['lc_exposure_implied_usd_m'] for r in rows], [D('40'), D('72'), D('72')])
        self.assertEqual(rows[2]['as_of'], '2026-09-30')
        self.assertEqual(rows[2]['remaining_capacity_usd_m'], D('203'))
        self.assertEqual(rows[2]['loan_draws_usd_m'], 0)

    def test_fee_and_interest_independent_anchors(self):
        unused, fee, interest = p.rcf_cost(D(275), D(72), D(150), D('.0035'), D('.025'), D('.04'), D(360))
        self.assertEqual((unused, fee, interest), (D(53), D('.1855'), D('9.750')))
        self.assertEqual(p.rcf_cost(D(275), D(72), D(0), D('.0035'), D('.025'), D('.04'), D(360))[1], D('.7105'))

    def test_overdraw_rejected(self):
        with self.assertRaises(AssertionError):
            p.rcf_cost(D(275), D(72), D(204), D('.0035'), D('.025'), D('.04'), D(360))

    def test_rate_and_draw_directions(self):
        rows = self.tables['revolver_sensitivity.csv']
        for draw in [D(50), D(150), D(203)]:
            costs = [r['loan_interest_usd_m'] for r in rows if r['hypothetical_draw_usd_m'] == draw]
            self.assertTrue(costs[0] < costs[1] < costs[2])
        fees = [r['commitment_fee_usd_m'] for r in rows if r['hypothetical_sofr'] == D('.04')]
        self.assertTrue(all(x > y for x, y in zip(fees, fees[1:])))

    def test_liquidity_bridge_independent_anchors(self):
        rows = self.tables['liquidity_bridge.csv']
        self.assertEqual(rows[0]['usd_m'], D('1830.286'))
        self.assertEqual(rows[-1]['usd_m'], D('1337.911'))
        self.assertEqual(rows[-2]['usd_m'], 0)
        values = {r['measure']:r['usd_m'] for r in rows}
        self.assertEqual(values['Release of restricted cash outside liquid-asset measure'], D('.821'))
        self.assertEqual(values['Change in short-term investment unrealized valuation'], D('-1.420'))
        self.assertEqual(sum(r['usd_m'] for r in rows[:-1]), rows[-1]['usd_m'])
        self.assertEqual(rows[-1]['usd_m']-rows[0]['usd_m'], D('-492.375'))

    def test_ppa_boundary_and_milestone(self):
        self.assertEqual(p.ppa_payoff(D(70), D(110), D('.3'), False), (D(40), D(0), D(110)))
        self.assertEqual(p.ppa_payoff(D(110), D(110), D('.3'), True), (D(0), D(0), D(110)))
        self.assertEqual(p.ppa_payoff(D(140), D(110), D('.3'), True), (D(0), D(9), D(131)))
        self.assertEqual(p.ppa_payoff(D(140), D(110), D('.3'), False)[2], D(140))

    def test_offtake_capacity_and_no_pre_cod_entitlement(self):
        self.assertIsNone(p.capacity_threshold(2029, D('.5'), D(140), D('.02'), False))
        self.assertEqual(p.capacity_threshold(2029, D('.5'), D(140), D('.02'), True), D('75.7702512'))
        self.assertEqual(p.capacity_threshold(2025, D(1), D(140), D('.02'), True), D(140))
        with self.assertRaises(AssertionError):
            p.capacity_threshold(2029, D('-.1'), D(140), D('.02'), True)
        self.assertEqual(p.capacity_threshold(2029, D('1.1'), D(140), D('.02'), True), D('166.69455264'))

    def test_post_milestone_no_capacity_scaling(self):
        # S03 1.2: full amount from milestone. Old model incorrectly returned
        # 75.7702512 when passed a half-capacity case in this state.
        self.assertEqual(p.capacity_threshold(2029, D('.5'), D(140), D('.02'), True, True), D('151.5405024'))
        self.assertEqual(p.capacity_threshold(2029, D(0), D(140), D('.02'), True, True), D('151.5405024'))
        with self.assertRaises(AssertionError):
            p.capacity_threshold(2029, D(1), D(140), D('.02'), False, True)
        rows = self.tables['offtake_threshold.csv']
        self.assertTrue(all(r['threshold_usd_m'] is None for r in rows if r['contractual_state']=='pre-COD'))

    def test_equity_dilution_denominators_and_debt_principal(self):
        values = {r['measure']:r['value'] for r in self.tables['financing_economics.csv']}
        self.assertEqual(values['Basic shares plus final offering only'], D(177068724))
        self.assertAlmostEqual(values['Increase relative to pre-offering basic shares'], D('8.313610'), places=6)
        self.assertAlmostEqual(values['New shares as share of isolated post-offering base'], D('7.675499'), places=6)
        self.assertEqual(values['Aggregate underwriting discount / gross equity'], D(3))
        self.assertEqual(values['Debt principal including equipment notes'], D('1043.133'))

    def test_government_addback_is_test_period_specific(self):
        self.assertEqual(p.government_addback(D(0), D(20)), 0)
        self.assertEqual(p.government_addback(D(40), D(20)), D(20))
        self.assertEqual(p.government_addback(D(40), D(60)), 0)
        # The clause compares to attributable NET INCOME, not Adjusted EBITDA.
        self.assertEqual(p.government_addback(D(40), D(-10)), D(50))

    def test_cash_and_accounting_not_combined(self):
        rows = self.tables['support_accounting.csv']
        self.assertEqual(rows[2]['usd_m'], D('118.978'))
        values = {r['measure']:r['usd_m'] for r in rows}
        self.assertEqual(values['PPA opening receivable plus income less closing receivable'], D('110.869'))
        self.assertEqual(values['PPA opening receivable plus income less closing receivable'].quantize(D('.1')), values['9m 2026 PPA cash receipts reported'])
        self.assertIn('noncash', rows[-1]['classification'])
        self.assertNotIn('total funding', ' '.join(r['measure'] for r in rows).lower())

    def test_future_duplicate_payment_reverses_prior_addback(self):
        rows = self.tables['covenant_adjustment.csv']
        self.assertEqual(rows[1]['net_clause_adjustment_usd_m'], D(20))
        self.assertEqual(rows[-1]['net_clause_adjustment_usd_m'], D(-20))
        self.assertEqual(rows[1]['net_clause_adjustment_usd_m']+rows[-1]['net_clause_adjustment_usd_m'], 0)

    def test_provenance_and_cutoff_failures(self):
        for field, bad in [('source', 'UNKNOWN'), ('as_of', '2026-11-07'), ('value', 'NaN')]:
            changed = copy.deepcopy(self.data)
            changed['facts']['final_net'][field] = bad
            with self.assertRaises(AssertionError):
                p.build(changed, self.sources)
        changed_sources = copy.deepcopy(self.sources)
        changed_sources[-1]['publication_or_filing_date'] = '2026-11-07'
        with self.assertRaises(AssertionError):
            p.build(self.data, changed_sources)

    def test_assumptions_do_not_change_history(self):
        changed = copy.deepcopy(self.data)
        changed['assumptions']['illustrative_sofr']['values'] = ['0.06']
        result = p.build(changed, self.sources)
        for name in ['replacement.csv', 'liquid_assets.csv', 'liquidity_bridge.csv', 'support_accounting.csv']:
            self.assertEqual(result[name], self.tables[name])

    def test_claim_and_input_source_integrity(self):
        ids = {s['id'] for s in self.sources}
        with (ROOT/'evidence.csv').open() as stream:
            claims = list(csv.DictReader(stream))
        self.assertEqual(len({r['claim_id'] for r in claims}), len(claims))
        for claim in claims:
            self.assertTrue(set(claim['source_ids'].split(';')) <= ids)
            self.assertTrue(claim['locator'] and claim['limitation'])

    def test_render_roundtrip_and_committed_outputs(self):
        for name, text in p.render(self.tables).items():
            self.assertEqual(len(list(csv.DictReader(io.StringIO(text)))), len(self.tables[name]))
            self.assertEqual((ROOT/'exhibits'/name).read_text(), text)


if __name__ == '__main__':
    unittest.main()

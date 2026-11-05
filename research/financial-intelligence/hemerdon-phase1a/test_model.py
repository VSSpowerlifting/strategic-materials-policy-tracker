import copy
import tempfile
import unittest
from decimal import Decimal as D
from pathlib import Path

from openpyxl.formula.tokenizer import Tokenizer
from openpyxl.utils.cell import range_boundaries

from model import build, load_data, validate


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.data, self.sources = load_data()
        self.facts = {f['id']: f for f in self.data['facts']}

    def v(self, key):
        return D(self.facts['hfi-' + key]['value'])

    def test_historical_cash_and_balance_reconcile(self):
        for y in [2025, 2026]:
            v = lambda key: self.v(f'{key}-{y}')
            self.assertEqual(v('assets'), v('liabilities') + v('equity'))
            self.assertEqual(v('cash-change'), sum(v(k) for k in ['operating-cashflow', 'investing-cashflow', 'financing-cashflow']))
        self.assertEqual(self.v('cash-2025')+self.v('cash-change-2026'), self.v('cash-2026'))

    def test_non_cash_conversion_is_not_cash_funding(self):
        self.assertEqual(self.v('cln-close-2025')+self.v('cln-cash-2026')+self.v('cln-fair-value-2026')-self.v('cln-conversion-2026'), 0)
        self.assertEqual(self.v('cln-conversion-2026'), D('197212441'))
        self.assertEqual(self.v('equity-net-2026'), D('41029253'))

    def test_nwf_components_not_parent_plus_children(self):
        self.assertEqual(self.v('nwf-equity')+self.v('nwf-loan'), D('61000000'))
        self.assertEqual(self.v('nwf-equity')+self.v('nwf-loan')+self.v('nwf-accordion'), self.v('nwf-package'))
        self.assertIn('uncommitted', self.facts['hfi-nwf-accordion']['label'])

    def test_original_sources_uses_rounding_and_revenue_dependence(self):
        components = ['aug-mine-opex','aug-process-opex','aug-other-opex','aug-finance-cost','aug-wc','aug-mining-capital','aug-site-capital','aug-other-capital','aug-bridge-repay','aug-ea-provision','aug-reserve']
        self.assertEqual(sum(self.v(k) for k in components)-self.v('aug-total-uses'), -D('1000000'))
        self.assertEqual(self.v('aug-total-sources')-self.v('aug-revenue')-(self.v('aug-total-uses')-self.v('aug-reserve')), -D('2000000'))

    def test_independent_coverage_arithmetic(self):
        coef = self.v('wo3-fy28')*100*self.v('payability')*(1-self.v('royalty'))
        self.assertEqual(coef, D('254479.5'))
        requirement = (self.v('opex-low')+self.v('opex-high'))/2 + self.v('fleet-service')+self.v('nwf-service')+self.v('hargreaves')
        self.assertEqual(requirement, D('111500000'))
        self.assertAlmostEqual(float(requirement/coef), 438.149242, places=5)

    def test_missing_values_and_restricted_source_fail_closed(self):
        for key, value in [('sourceIds', ['missing']), ('currency', 'USD')]:
            bad = copy.deepcopy(self.data)
            bad['facts'][0][key] = value
            with self.assertRaises(AssertionError): validate(bad, self.sources)
        bad = copy.deepcopy(self.data)
        bad['facts'][0]['sourceIds'] = ['hfs-fs2025']
        with self.assertRaises(AssertionError): validate(bad, self.sources)
        missing = next(f for f in self.data['facts'] if f['classification'] == 'Unavailable')
        missing['value'] = '0'
        with self.assertRaises(AssertionError): validate(self.data, self.sources)

    def test_duplicate_and_post_cutoff_sources_rejected(self):
        with self.assertRaises(AssertionError): validate(self.data, self.sources+[self.sources[0]])
        self.sources[0]['datePublished'] = '2026-11-05'
        with self.assertRaises(AssertionError): validate(self.data, self.sources)

    def test_undated_discovery_and_filing_dates_are_explicit(self):
        validate(self.data,self.sources)
        registry = next(s for s in self.sources if s['id']=='hfs-group-security-2026')
        self.assertIsNone(registry['datePublished'])
        registry['dateFiled']='2026-11-05'
        with self.assertRaises(AssertionError): validate(self.data,self.sources)

    def test_formula_references_and_dependency_direction(self):
        with tempfile.TemporaryDirectory() as tmp:
            wb = build(Path(tmp)/'test.xlsx')
        edges = {}
        for ws in wb:
            for row in ws:
                for cell in row:
                    if cell.data_type != 'f': continue
                    key = (ws.title, cell.coordinate)
                    deps = []
                    for token in Tokenizer(cell.value).items:
                        if token.type != 'OPERAND' or token.subtype != 'RANGE': continue
                        target = token.value
                        sheet, coords = target.rsplit('!', 1) if '!' in target else (ws.title, target)
                        sheet = sheet.strip("'")
                        self.assertIn(sheet, wb.sheetnames)
                        if ws.title != 'Checks': self.assertNotEqual(sheet, 'Checks')
                        left, top, right, bottom = range_boundaries(coords)
                        for rowno in range(top, bottom+1):
                            for colno in range(left, right+1):
                                target_cell = wb[sheet].cell(rowno, colno)
                                # Blank optional price cells are intentional.
                                self.assertTrue(target_cell.value is not None or (sheet=='Assumptions' and rowno==18))
                                deps.append((sheet, target_cell.coordinate))
                    edges[key] = deps
        visited, active = set(), set()
        def visit(key):
            self.assertNotIn(key, active, 'Formula cycle')
            if key in visited: return
            active.add(key)
            for dep in edges.get(key, []): visit(dep)
            active.remove(key)
            visited.add(key)
        for key in edges: visit(key)


if __name__ == '__main__':
    unittest.main()

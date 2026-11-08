"""Tests for strategy_calc.py.

Expected values come from published, independently reviewed SMPT work, not
from the code under test:

* FI002 (docs/research/fi002-bhp-copper/output/SMPT_FI002_Methodology.md,
  "Reverse appraisal of replacement capital"): PV capital 4,435.220520;
  annuity factor 5.286253249; annual benefit 839.010224; 198.765665 ktpa;
  copper static EBITDA 72.5747792 c/lb -> US$2,830.416389m for US$1,600/t.
* FI003 (research/fi003, liquidity bridge exhibit): components
  -7.757 -420.250 +6.500 -91.145 +20.876 +0.821 -1.420 = -492.375 (US$m);
  US$7.4m fee / US$1,000m headline = 0.74%.

Run: python3 -B -m unittest test_strategy_calc  (from this directory)
"""

import unittest
from decimal import Decimal

import strategy_calc as sc

Q6 = Decimal("0.000001")


def fi002_capital():
    return [[y, "1170"] for y in range(2027, 2032)]


class FI002ReverseAppraisal(unittest.TestCase):
    def test_pv_capital(self):
        pv = sc.npv("0.10", fi002_capital(), 2026)
        self.assertEqual(pv.quantize(Q6), Decimal("4435.220520"))

    def test_annuity_factor(self):
        f = sc.annuity_factor("0.10", 2032, 2051, 2026)
        self.assertEqual(f.quantize(Decimal("0.000000001")), Decimal("5.286253249"))

    def test_threshold(self):
        price = Decimal("4.76") * sc.LB_PER_TONNE  # $4.76/lb long-term assumption
        self.assertEqual(price.quantize(Decimal("0.00001")), Decimal("10494.00368"))
        r = sc.reverse_threshold(fi002_capital(), "0.10", 2026, 2032, 2051,
                                 price, "4000", "0.35")
        self.assertEqual(r["required_annual_benefit"].quantize(Q6), Decimal("839.010224"))
        self.assertEqual(r["required_volume"].quantize(Q6), Decimal("198.765665"))
        self.assertIn("not predicted output", r["note"])

    def test_threshold_ten_years(self):
        price = Decimal("4.76") * sc.LB_PER_TONNE
        r = sc.reverse_threshold(fi002_capital(), "0.10", 2026, 2032, 2041,
                                 price, "4000", "0.35")
        self.assertEqual(r["required_volume"].quantize(Decimal("0.001")), Decimal("275.398"))

    def test_threshold_na_when_margin_not_positive(self):
        r = sc.reverse_threshold(fi002_capital(), "0.10", 2026, 2032, 2051,
                                 "4000", "4000", "0.35")
        self.assertIsNone(r["required_volume"])
        self.assertTrue(r["note"].startswith("n.a."))

    def test_zero_rate_refused(self):
        with self.assertRaises(ValueError):
            sc.reverse_threshold(fi002_capital(), "0", 2026, 2032, 2051, "10000", "4000", "0.35")

    def test_static_sensitivity(self):
        cents = sc.usd_per_tonne_to_cents_per_lb("1600")
        self.assertEqual(cents.quantize(Decimal("0.0000001")), Decimal("72.5747792"))
        self.assertEqual((cents * 39).quantize(Q6), Decimal("2830.416389"))


class FI003Bridge(unittest.TestCase):
    COMPONENTS = [
        {"label": "operating cash flow", "amount": "-7.757"},
        {"label": "PP&E", "amount": "-420.250"},
        {"label": "awards", "amount": "6.500"},
        {"label": "financing", "amount": "-91.145"},
        {"label": "accretion", "amount": "20.876"},
        {"label": "restricted cash", "amount": "0.821"},
        {"label": "valuation", "amount": "-1.420"},
    ]

    def test_bridge_ties(self):
        r = sc.bridge_change("-492.375", self.COMPONENTS)
        self.assertTrue(r["ties"])
        self.assertEqual(r["residual"], Decimal("0"))

    def test_bridge_reports_residual(self):
        r = sc.bridge_change("-492.375", self.COMPONENTS[:-1])
        self.assertFalse(r["ties"])
        self.assertEqual(r["residual"], Decimal("-1.420"))

    def test_duplicate_component_flagged(self):
        comps = self.COMPONENTS + [{"label": "awards", "amount": "6.500"}]
        r = sc.bridge_change("-492.375", comps)
        self.assertEqual(r["duplicate_labels"], ["awards"])
        self.assertFalse(r["ties"])

    def test_opening_closing_form(self):
        r = sc.bridge("1000", "507.625", self.COMPONENTS)
        self.assertTrue(r["ties"])

    def test_fee_ratio_not_annualized(self):
        ratio = Decimal("7.4") / Decimal("1000")
        self.assertEqual(ratio * 100, Decimal("0.74"))


class Irr(unittest.TestCase):
    def test_simple(self):
        rate, warns = sc.irr([[0, "-100"], [1, "110"]], 0)
        self.assertEqual(rate.quantize(Decimal("0.000001")), Decimal("0.100000"))
        self.assertEqual(warns, [])

    def test_no_sign_change(self):
        rate, warns = sc.irr([[0, "100"], [1, "110"]], 0)
        self.assertIsNone(rate)
        self.assertTrue(warns)

    def test_multiple_sign_changes_warns(self):
        rate, warns = sc.irr([[0, "-100"], [1, "230"], [2, "-132"]], 0)
        self.assertTrue(any("multiple IRRs" in w for w in warns))


class GuardedTotals(unittest.TestCase):
    def test_never_mixes_currency_instrument_status(self):
        items = [
            {"id": "a", "amount": "100", "currency": "USD", "instrument": "loan", "status": "signed"},
            {"id": "b", "amount": "50", "currency": "USD", "instrument": "loan", "status": "signed"},
            {"id": "c", "amount": "70", "currency": "EUR", "instrument": "loan", "status": "signed"},
            {"id": "d", "amount": "40", "currency": "USD", "instrument": "equity", "status": "received"},
            {"id": "e", "amount": "30", "currency": "USD", "instrument": "loan", "status": "drawn"},
        ]
        r = sc.guarded_totals(items)
        self.assertIsNone(r["grand_total"])
        totals = {(g["currency"], g["instrument"], g["status"]): g["total"] for g in r["groups"]}
        self.assertEqual(totals[("USD", "loan", "signed")], Decimal("150"))
        self.assertEqual(len(totals), 4)

    def test_child_of_parent_in_group_excluded(self):
        items = [
            {"id": "pkg", "amount": "1000", "currency": "USD", "instrument": "loan", "status": "signed"},
            {"id": "tr1", "amount": "400", "currency": "USD", "instrument": "loan", "status": "signed",
             "part_of": "pkg"},
        ]
        r = sc.guarded_totals(items)
        self.assertEqual(r["groups"][0]["total"], Decimal("1000"))
        self.assertEqual(r["excluded_overlaps"][0]["id"], "tr1")

    def test_unclassified_item_not_totalled(self):
        r = sc.guarded_totals([{"id": "x", "amount": "5", "currency": "USD", "instrument": "loan"}])
        self.assertEqual(r["groups"], [])
        self.assertEqual(r["unclassified"][0]["missing"], ["status"])


class InputDiscipline(unittest.TestCase):
    def test_float_rejected(self):
        with self.assertRaises(TypeError):
            sc.D(0.1)

    def test_cli_roundtrip(self):
        import io
        import contextlib
        import json
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            sc.main(["annuity", "--json",
                     '{"rate": "0.10", "first_year": 2032, "last_year": 2051, "origin": 2026}'])
        out = json.loads(buf.getvalue())
        self.assertEqual(Decimal(out["annuity_factor"]).quantize(Decimal("0.000000001")),
                         Decimal("5.286253249"))

    def test_flows_accept_mapping_or_pairs(self):
        # Regression: a {year: amount} payload crashed the threshold CLI during
        # the FI002 walkthrough although the docstring described that shape.
        pairs = [["2027", "1170"], ["2028", "1170"], ["2029", "1170"],
                 ["2030", "1170"], ["2031", "1170"]]
        mapping = dict(pairs)
        self.assertEqual(sc.npv("0.10", pairs, 2026), sc.npv("0.10", mapping, 2026))
        self.assertEqual(sc.npv("0.10", mapping, 2026).quantize(Decimal("0.000001")),
                         Decimal("4435.220520"))


if __name__ == "__main__":
    unittest.main()

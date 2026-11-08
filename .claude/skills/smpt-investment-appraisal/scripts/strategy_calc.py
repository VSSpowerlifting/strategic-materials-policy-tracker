#!/usr/bin/env python3
"""Deterministic arithmetic for SMPT Applied Strategy work.

Standard library only (decimal, json, argparse) and Python 3.9 compatible.
Every function takes and returns Decimal (or None / a refusal) so analysts can
quote exact intermediate values and rounding happens only at display time.

The script does arithmetic only. It never decides what an input *is*: whether
an amount is an envelope, a signed commitment, a drawdown or a payment is an
evidence question the analyst settles first (see smpt-evidence-baseline). The
guard functions here enforce the consequences of that classification.

Command line:
    python3 -B strategy_calc.py <subcommand> --json '<payload>'
    python3 -B strategy_calc.py <subcommand> --file payload.json
Subcommands: npv, annuity, threshold, irr, bridge, totals.
Run ``python3 -B strategy_calc.py --help`` for the payload shapes.
"""

import argparse
import json
import sys
from decimal import Decimal, getcontext, ROUND_HALF_EVEN

getcontext().prec = 34

LB_PER_TONNE = Decimal("2204.6226218488")


def D(value):
    """Convert to Decimal without binary-float contamination.

    Floats are rejected: a float has already lost precision, and accepting it
    silently would make the "exact" outputs untrustworthy.
    """
    if isinstance(value, Decimal):
        return value
    if isinstance(value, bool):
        raise TypeError("booleans are not amounts")
    if isinstance(value, float):
        raise TypeError("pass amounts as strings or ints, not floats: %r" % value)
    return Decimal(str(value))


# ---------------------------------------------------------------- discounting

def _pairs(flows):
    """Accept {year: amount} or [[year, amount], ...]; return sorted pairs."""
    if isinstance(flows, dict):
        flows = list(flows.items())
    return sorted(((int(y), a) for y, a in flows), key=lambda pair: pair[0])


def discount_factor(rate, years):
    rate, years = D(rate), D(years)
    if rate <= Decimal("-1"):
        raise ValueError("discount rate must exceed -100%")
    base = Decimal(1) + rate
    if years == years.to_integral_value():
        return Decimal(1) / (base ** int(years))
    return Decimal(1) / (base ** years)


def npv(rate, flows, origin):
    """Present value at ``origin`` of {year: amount} cash flows.

    ``flows`` is {year: amount} or a list of [year, amount] pairs (year-end
    convention). Signs are
    the caller's: outflows negative if you want a net figure, or pass only
    capital to get PV of capital.
    """
    origin = int(origin)
    total = Decimal(0)
    for year, amount in _pairs(flows):
        total += D(amount) * discount_factor(rate, year - origin)
    return total


def annuity_factor(rate, first_year, last_year, origin):
    """Sum of discount factors for equal year-end amounts, first..last inclusive."""
    if int(last_year) < int(first_year):
        raise ValueError("last_year precedes first_year")
    return sum((discount_factor(rate, y - int(origin))
                for y in range(int(first_year), int(last_year) + 1)), Decimal(0))


def reverse_threshold(capital_flows, rate, origin, benefit_first, benefit_last,
                      price, burden, tax_wedge, money_unit_per_volume_unit="1000"):
    """Required levelized benefit and equivalent volume to recover capital.

    This is a *threshold*, not a forecast: it answers "what annual benefit would
    recover the assumed capital at the assumed rate", never "what will the asset
    produce". Returns a dict; ``required_volume`` is None (n.a.) when the margin
    is not positive, because no finite positive volume solves the equation.

    ``money_unit_per_volume_unit`` converts the quotient: with capital in US$m,
    margin in US$/t and volume in kt, US$m * 1000 / (US$/t) = kt -> "1000".
    """
    price, burden, tax_wedge = D(price), D(burden), D(tax_wedge)
    if D(rate) <= 0:
        raise ValueError("closed-form threshold requires a discount rate above zero")
    pv_capital = npv(rate, capital_flows, origin)
    factor = annuity_factor(rate, benefit_first, benefit_last, origin)
    required_benefit = pv_capital / factor
    margin = (price - burden) * (Decimal(1) - tax_wedge)
    result = {
        "pv_capital": pv_capital,
        "annuity_factor": factor,
        "required_annual_benefit": required_benefit,
        "after_tax_unit_margin": margin,
        "required_volume": None,
        "note": "threshold under stated assumptions; not predicted output",
    }
    if margin <= 0:
        result["note"] = "n.a.: price at or below burden has no positive finite solution"
        return result
    result["required_volume"] = required_benefit * D(money_unit_per_volume_unit) / margin
    return result


def sign_changes(flows):
    signs = [1 if D(a) > 0 else -1 for _, a in _pairs(flows) if D(a) != 0]
    return sum(1 for a, b in zip(signs, signs[1:]) if a != b)


def irr(flows, origin, low="-0.99", high="10", tol="1e-12", max_iter=500):
    """IRR by bisection. Returns (rate_or_None, warnings).

    None when NPV does not change sign across [low, high] (no IRR in range, or
    none at all). A warning is raised when the flows change sign more than
    once, because multiple IRRs can then exist and a single figure misleads.
    """
    warnings = []
    changes = sign_changes(flows)
    if changes == 0:
        return None, ["flows never change sign: IRR undefined"]
    if changes > 1:
        warnings.append("flows change sign %d times: multiple IRRs possible; "
                        "report NPV profile instead of a single IRR" % changes)
    lo, hi, tol = D(low), D(high), D(tol)
    f_lo, f_hi = npv(lo, flows, origin), npv(hi, flows, origin)
    if f_lo == 0:
        return lo, warnings
    if f_hi == 0:
        return hi, warnings
    if (f_lo > 0) == (f_hi > 0):
        return None, warnings + ["no sign change in NPV between %s and %s" % (lo, hi)]
    for _ in range(max_iter):
        mid = (lo + hi) / 2
        f_mid = npv(mid, flows, origin)
        if abs(f_mid) < tol or (hi - lo) / 2 < tol:
            return mid, warnings
        if (f_mid > 0) == (f_lo > 0):
            lo, f_lo = mid, f_mid
        else:
            hi = mid
    return (lo + hi) / 2, warnings + ["bisection hit max_iter"]


# ------------------------------------------------------------ reconciliation

def bridge(opening, closing, components, tolerance="0"):
    """Tie out a bridge: opening + sum(components) should equal closing.

    Use ``bridge_change`` when only the published change is known. Returns the residual explicitly so a non-zero gap is never hidden.
    """
    opening, closing = D(opening), D(closing)
    total = sum((D(c["amount"]) for c in components), Decimal(0))
    residual = closing - (opening + total)
    return {
        "opening": opening, "components_sum": total, "closing": closing,
        "residual": residual, "ties": abs(residual) <= D(tolerance),
    }


def bridge_change(expected_change, components, tolerance="0"):
    """Tie out components against a published change (closing minus opening)."""
    total = sum((D(c["amount"]) for c in components), Decimal(0))
    residual = D(expected_change) - total
    labels = [c.get("label") for c in components]
    dupes = sorted({l for l in labels if l and labels.count(l) > 1})
    return {
        "expected_change": D(expected_change), "components_sum": total,
        "residual": residual, "ties": abs(residual) <= D(tolerance),
        "duplicate_labels": dupes,
    }


# ------------------------------------------------------------ aggregation guard

GROUP_KEYS = ("currency", "instrument", "status")


def guarded_totals(items, allow_parent_child=False):
    """Total amounts only within identical (currency, instrument, status) groups.

    Never converts currency, never adds an envelope to a drawdown, never adds a
    loan to equity. Items may carry ``id`` and either or both of ``part_of`` /
    ``drawn_from`` (one parent id each). An item is excluded from a group that
    also holds any ancestor reached through those links, followed across all
    items (the ancestor already contains it), unless ``allow_parent_child`` is
    set; the exclusion is reported. Other links (``replaced_by``,
    ``refinanced_by``, ``backstopped_by``) are not read: the caller must give a
    replaced original its ended status or leave it out. Returns parallel totals
    plus refusals; there is deliberately no grand total.
    """
    by_id = {i.get("id"): i for i in items if i.get("id")}

    def ancestors(item):
        seen, todo = set(), [item]
        while todo:
            cur = todo.pop()
            for link in ("part_of", "drawn_from"):
                pid = cur.get(link)
                if pid and pid not in seen:
                    seen.add(pid)
                    if pid in by_id:
                        todo.append(by_id[pid])
        return seen

    groups, excluded, missing = {}, [], []
    for item in items:
        absent = [k for k in GROUP_KEYS if not item.get(k)]
        if absent:
            missing.append({"id": item.get("id"), "missing": absent})
            continue
        key = tuple(str(item[k]).strip() for k in GROUP_KEYS)
        groups.setdefault(key, []).append(item)
    out = []
    for key, members in sorted(groups.items()):
        ids = {m.get("id") for m in members}
        kept = []
        for m in members:
            inside = sorted(a for a in ancestors(m) if a in ids and a != m.get("id"))
            if inside and not allow_parent_child:
                excluded.append({"id": m.get("id"),
                                 "reason": "ancestor %s in same group" % ", ".join(inside)})
                continue
            kept.append(m)
        out.append({
            "currency": key[0], "instrument": key[1], "status": key[2],
            "total": sum((D(m["amount"]) for m in kept), Decimal(0)),
            "count": len(kept), "ids": [m.get("id") for m in kept],
        })
    return {
        "groups": out,
        "excluded_overlaps": excluded,
        "unclassified": missing,
        "grand_total": None,
        "note": "no grand total: unlike currency, instrument or status is never summed",
    }


# ------------------------------------------------------------------ helpers

def usd_per_tonne_to_cents_per_lb(delta):
    return D(delta) / LB_PER_TONNE * 100


def _encode(obj):
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _encode(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_encode(v) for v in obj]
    return obj


def round_display(value, places=3):
    q = Decimal(1).scaleb(-places)
    return D(value).quantize(q, rounding=ROUND_HALF_EVEN)


PAYLOADS = """payload shapes (amounts and rates as strings; flows as {year: amount} or [[year, amount]]):
  npv        {"rate", "origin", "flows"}
  annuity    {"rate", "origin", "first_year", "last_year"}
  threshold  {"rate", "origin", "capital_flows", "benefit_first", "benefit_last",
              "price", "burden", "tax_wedge", "money_unit_per_volume_unit"?}
  irr        {"origin", "flows"}
  bridge     {"opening", "closing", "components": [{"label", "amount"}], "tolerance"?}
             or {"expected_change", "components", "tolerance"?}
  totals     {"items": [{"id", "amount", "currency", "instrument", "status",
              "part_of"? | "drawn_from"?}], "allow_parent_child"?}
"""


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, epilog=PAYLOADS,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["npv", "annuity", "threshold", "irr", "bridge", "totals"])
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--json", help="payload as a JSON string (numbers as strings)")
    src.add_argument("--file", help="path to a JSON payload")
    args = parser.parse_args(argv)
    raw = args.json if args.json is not None else open(args.file, encoding="utf-8").read()
    p = json.loads(raw, parse_float=lambda s: s)  # keep decimals exact

    if args.command == "npv":
        result = {"npv": npv(p["rate"], p["flows"], p["origin"])}
    elif args.command == "annuity":
        result = {"annuity_factor": annuity_factor(p["rate"], p["first_year"], p["last_year"], p["origin"])}
    elif args.command == "threshold":
        result = reverse_threshold(p["capital_flows"], p["rate"], p["origin"], p["benefit_first"],
                                   p["benefit_last"], p["price"], p["burden"], p["tax_wedge"],
                                   p.get("money_unit_per_volume_unit", "1000"))
    elif args.command == "irr":
        rate, warns = irr(p["flows"], p["origin"])
        result = {"irr": rate, "warnings": warns}
    elif args.command == "bridge":
        if "expected_change" in p:
            result = bridge_change(p["expected_change"], p["components"], p.get("tolerance", "0"))
        else:
            result = bridge(p["opening"], p["closing"], p["components"], p.get("tolerance", "0"))
    else:
        result = guarded_totals(p["items"], p.get("allow_parent_child", False))
    json.dump(_encode(result), sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

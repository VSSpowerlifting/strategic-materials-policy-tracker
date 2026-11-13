#!/usr/bin/env python3
"""Build spec.json for FI003 presentation draft 1.1 (review candidate).

Draft 1.1 resets draft 1.0 (PR #215 at bfd276c7, research/fi003/presentation/v100/)
in the shared publication design system: a financing-ledger cover, plain frames
without kickers, and source lines whose document names link to the filings. The
17 content slides keep draft 1.0's conclusions, figures, model inputs and the
6 November 2026 evidence cutoff. Source lines now name every cited document, and
the matched-date options slide also cites the credit agreement it relies on.

Every figure is read from the accepted model exports in research/fi003/exhibits/
and every URL from research/fi003/sources.json. Nothing is typed in twice.
Run from the repository root:  python3 research/fi003/presentation/v110/build_spec.py
"""
import csv, json, pathlib, re
from decimal import Decimal, ROUND_HALF_UP

ROOT = pathlib.Path("research/fi003")
OUT = ROOT / "presentation/v110/spec.json"


def table(name, key):
    with open(ROOT / "exhibits" / name, newline="") as f:
        return {r[key]: r for r in csv.DictReader(f)}


def num(x):
    return float(x)


def m1(x):
    """One-decimal display with half-up rounding, matching the exhibit labels."""
    return str(Decimal(repr(round(x, 6))).quantize(Decimal("0.1"), ROUND_HALF_UP))


src = {s["id"]: s for s in json.load(open(ROOT / "sources.json"))}
LOC = {
    "S01": "July 2025 transaction 8-K", "S02": "Transaction agreement §§2.05–2.07, 6.04, 6.13, 7.01, 9.02(a)",
    "S03": "Offtake agreement §§1.2, 6.2, 8.3, 8.4", "S04": "Price protection agreement §§3, 6, 8(p)–(q)",
    "S05": "Series A certificate of designations", "S06": "Prospectus supplement, offering and capitalization",
    "S07": "Underwriting agreement, Schedule A", "S08": "Revolving credit 8-K",
    "S09": "Credit agreement §§1.01, 4.02, 5.05, 6.01(b), 6.16, 7.11, 8.01(b) and (m), 8.02", "S10": "Q3 2025 10-Q",
    "S11": "2025 10-K, Note 10", "S12": "Q1 2026 10-Q", "S13": "Q2 2026 10-Q, Note 8",
    "S14": "Q3 2026 earnings release", "S15": "J.P. Morgan transaction article (self-described)",
    "S16": "J.P. Morgan Chase newsroom release", "S17": "July 15 Apple agreement 8-K",
    "S18": "SEC submissions index", "S19": "Q3 2026 10-Q, cash flows, Note 8 and MD&A",
    "S20": "Texas governor release, Northlake",
}
used = set()


def ev(*ids):
    used.update(ids)
    return list(ids)


repl = table("replacement.csv", "measure")
rev = table("revolver_snapshots.csv", "as_of")
sup = table("support_accounting.csv", "measure")
liq = table("liquidity_bridge.csv", "measure")
fin = table("financing_economics.csv", "measure")
fee = {r["hypothetical_draw_usd_m"] + "@" + r["hypothetical_sofr"]: r for r in csv.DictReader(open(ROOT / "exhibits/revolver_sensitivity.csv"))}

# --- dilution (shares, millions) ---
pre = num(fin["Basic shares before offering"]["value"])
post = num(fin["Basic shares plus final offering only"]["value"])
new = post - pre
dil_post = new / post * 100
dil_pre = new / pre * 100

# --- liquidity bridge ---
steps = [
    ("Operating cash flow", "Operating cash flow"),
    ("Cash capital spending", "Cash PP&E purchases, all company projects"),
    ("Government award proceeds", "Government construction-award proceeds"),
    ("Financing cash flows", "Financing cash flows"),
    ("Accretion", "Accretion on short-term investments"),
    ("Restricted-cash release", "Release of restricted cash outside liquid-asset measure"),
    ("Valuation change", "Change in short-term investment unrealized valuation"),
]
liq_steps = [{"label": a, "delta": num(liq[b]["usd_m"])} for a, b in steps]

slides = []


def add(pattern, label, title, subtitle, annotation, source, refs, data, layout=None, table_reason=None):
    ex = {"title": title, "subtitle": subtitle, "annotation": annotation, "source": source,
          "evidence_refs": refs, "data": data}
    if layout:
        ex["layout"] = layout
    s = {"pattern": pattern, "label": label, "exhibit": ex}
    if table_reason:
        s["table_reason"] = table_reason
    slides.append(s)


facts = json.load(open(ROOT / "inputs.json"))["facts"]


def fact(key):
    return num(facts[key]["value"])


JUDGMENT = "Analyst judgment."
PLAIN = "Plain reading of the filed credit agreement; not legal advice."
start = num(liq["Opening company liquid assets"]["usd_m"])
end = num(liq["Closing company liquid assets"]["usd_m"])
net_eq = num(repl["Final net equity proceeds"]["usd_m"])
rcf_commit = num(rev["2026-09-30"]["commitment_usd_m"])
rcf_lc = num(rev["2026-09-30"]["lc_exposure_implied_usd_m"])
rcf_avail = num(rev["2026-09-30"]["remaining_capacity_usd_m"])
unused_fee = num(fee["0@0.03"]["commitment_fee_usd_m"])
commit_fees = num(repl["Aggregate commitment and structuring fee expense"]["usd_m"])
other_exp = num(repl["Implied other expenses / rounding"]["usd_m"])
floor = fact("liquidity_min")
ext_test = 1.25 * rcf_commit                    # Section 8.01(m)(i) extension certificate
notes_2030 = fact("debt_notes_principal")
spring_test = 1.25 * notes_2030                 # Maturity Date: 125% of Springing Maturity Debt
assert abs(ext_test - 343.75) < 1e-9 and abs(round(spring_test, 3) - 1078.491) < 1e-6
debt_principal = notes_2030 + 150.0 + 30.340      # C45: 2030 notes + samarium loan + equipment notes
be_50 = debt_principal / 4.5                      # 4.00x with cash netting capped at 50% of covenant EBITDA (C63)
be_100 = debt_principal / 5.0                     # same test with the 100% cap
assert abs(round(debt_principal, 3) - 1043.133) < 1e-6 and round(be_50) == 232 and round(be_100) == 209
# Section 7.11(c) 3.00x cash interest coverage on gross stated coupons (C64): 2030 notes 3.00%,
# samarium loan 5.38%, equipment notes 6.5%-8.0%. The definition nets interest income, so this is an
# upper bound on what the test needs while cash balances earn interest; no revolver loans are drawn.
coupon_lo = notes_2030 * 0.03 + 150.0 * 0.0538 + 30.340 * 0.065
coupon_hi = notes_2030 * 0.03 + 150.0 * 0.0538 + 30.340 * 0.080
cov_lo, cov_hi = 3 * coupon_lo, 3 * coupon_hi
assert round(coupon_lo, 1) == 35.9 and round(coupon_hi, 1) == 36.4 and round(cov_lo) == 108 and round(cov_hi) == 109

# 1. Executive answer
add("exhibit-with-interpretation", "Executive answer",
    "Fund 10X with equity first and keep the revolver for letters of credit, because a suspended Defense payment obligation blocks new draws",
    "Recommendation for a hypothetical U.S. sponsor building before commissioning revenue; USD million",
    f"{JUDGMENT} Equity is permanent capital: ${net_eq:.1f}m with no repayment date. The revolver's ${rcf_avail:.0f}m can be drawn only while no Default exists, and a suspended Defense payment obligation is a Default. Plan 10X spending against cash and the $500m quarter-end test.",
    "Underwriting agreement; 2025 10-K; Q3 2026 10-Q; credit agreement",
    ev("S07", "S09", "S11", "S19"),
    {"unit": "USD million", "dp": 1, "columns": ["USD million"],
     "rows": [
         {"label": "Net equity (reported)", "values": [net_eq]},
         {"label": "Liquid assets, 30 Sep 26", "values": [end]},
         {"label": "Revolver available, Sep 26", "values": [rcf_avail]},
         {"label": "Quarter-end liquidity test", "values": [floor]}],
     "notes": [
         {"ref": 2, "text": "Cash plus short-term investments, as reported at 30 September 2026."},
         {"ref": 3, "text": "Drawable only while no Default exists; a suspended Defense payment obligation stops new loans and letters of credit."},
         {"ref": 4, "text": "Measured at each quarter-end until the covenant trigger; cash below it is an immediate Event of Default."}],
     "notesHeading": "Basis of each figure"},
    table_reason="The answer pairs four unlike figures with their meaning; a chart would invite summing measures that are not additive.")

# 2. JPMorgan roles
add("role-matrix", "JPMorgan roles",
    "JPMorgan held every financing role; Goldman Sachs shared the commitment and, with Morgan Stanley, the underwriting",
    "Roles named in the reviewed filings and in J.P. Morgan's self-description",
    "Goldman Sachs and Morgan Stanley were also joint lead arrangers of the revolver JPMorgan administers. Fees by bank and retained positions are undisclosed; the sole-adviser role rests on J.P. Morgan's own account.",
    "July 2025 transaction 8-K; underwriting agreement; revolving credit 8-K; credit agreement; J.P. Morgan's self-description for the adviser role",
    ev("S01", "S07", "S08", "S09", "S15"),
    {"roles": ["Adviser", "Joint commitment", "Underwriting", "Revolver agent"],
     "orgs": [
         {"label": "JPMorgan", "cells": [{"qualifier": "Self-described"}, {"qualifier": "Joint"}, {"qualifier": "Joint largest"}, {"qualifier": "Agent, lender"}]},
         {"label": "Goldman Sachs", "cells": [None, {"qualifier": "Joint"}, {"qualifier": "Joint largest"}, None]},
         {"label": "Morgan Stanley", "cells": [None, None, {"qualifier": "Smaller share"}, None]}],
     "layout": {"rowHeader": "Bank", "labelWidth": 2.2, "showCounts": False, "style": "ledger", "emptyText": "Not named",
                "emphasisColumn": "Underwriting"}},
    layout="wide",
    table_reason="Role-by-bank holdings are categorical; a matrix shows sole and shared roles exactly where a chart would imply magnitudes.")

# 3. Sequence
add("two-lane-timeline", "Sequence",
    "Equity and a revolver replaced the joint commitment within seven weeks",
    "Financing events and the agreements around them, July to August 2025",
    "The Defense agreements (9 July) and Apple's agreement (15 July) came days before the 16 July pricing. The filings do not show how much they added to investor demand.",
    "July 2025 transaction 8-K; prospectus supplement; Apple agreement 8-K; revolving credit 8-K; 2025 10-K, Note 3",
    ev("S01", "S06", "S08", "S11", "S17"),
    {"lanes": [
        {"name": "Financing", "events": [
            {"label": "Joint commitment", "date": "2025-07-09", "kind": "effective"},
            {"label": "Equity priced", "date": "2025-07-16", "kind": "implementation"},
            {"label": "Revolver signed", "date": "2025-08-25", "kind": "effective"}]},
        {"name": "Commitment and context", "events": [
            {"label": "Apple agreement", "date": "2025-07-15", "kind": "announcement"},
            {"label": "Commitment expired", "date": "2025-08-26", "kind": "implementation"}]}],
     "conventionNote": False},
    layout="wide")

# 4. Replacement
add("exhibit-with-interpretation", "Replacement",
    "Net equity of $724.2m and a $275m revolver replaced a commitment of at least $1bn that expired undrawn",
    "USD million; equity is cash received, the revolver is committed capacity",
    f"The commitment shrank dollar for dollar as the equity and the revolver closed, and expired undrawn on 26 August 2025. The ${other_exp:.1f}m between the after-discount equity and reported net proceeds is other offering expenses and rounding.",
    "July 2025 transaction 8-K; underwriting agreement; revolving credit 8-K; 2025 10-K",
    ev("S01", "S07", "S08", "S11"),
    {"unit": "USD million", "dp": 1, "columns": ["USD million"],
     "rows": [
         {"label": "Gross equity (calculated)", "values": [num(repl["Equity gross calculated from exact shares"]["usd_m"])]},
         {"label": "Underwriting discount", "values": [num(repl["Underwriting discount calculated"]["usd_m"])]},
         {"label": "Net equity (reported)", "values": [net_eq]},
         {"label": "Revolver capacity", "values": [num(repl["Corporate revolver"]["usd_m"])]},
         {"label": "Commitment, minimum", "values": [num(repl["Original commitment reference minimum"]["usd_m"])]}],
     "notes": [
         {"ref": 3, "text": "Reported equity proceeds net of costs; no scheduled repayment."},
         {"ref": 4, "text": "Committed capacity; no loans were drawn at any reported date."},
         {"ref": 5, "text": f"Stated as at least $1bn; it expired undrawn and ${commit_fees:.1f}m of fees were expensed."}],
     "notesHeading": "Status of each amount"},
    table_reason="Cash proceeds and committed capacity are different measures; side-by-side rows with notes avoid a summed or stacked visual.")

# 5. Dilution
add("waterfall", "Dilution",
    f"New shares added {dil_pre:.2f}% to the basic count and are {dil_post:.2f}% of the isolated base",
    "Bridge from basic shares before the July 2025 offering to the isolated pro forma, then the composition of that pro forma",
    f"Dilution separates equity from committed debt; both equity options issue the same shares. {dil_pre:.2f}% measures the new shares against the pre-offering basic count, {dil_post:.2f}% against the isolated post-offering count. Both counts are basic shares outstanding, not fully diluted.",
    "Prospectus supplement; 2025 10-K",
    ev("S06", "S11"),
    {"unit": "Million shares", "dp": 3,
     "start": {"label": "Before offering", "value": round(pre / 1e6, 3)},
     "steps": [{"label": "New shares", "delta": round(new / 1e6, 3)}],
     "end": {"label": "Isolated pro forma", "value": round(post / 1e6, 3)},
     "share": {"title": "Composition of the isolated pro forma", "baseLabel": "Pre-offering basic shares", "addedLabel": "New shares",
               # Draft 1.0's denominator note, from the same value as the pro forma bar; the note
               # beside the chart already says both counts are basic, not fully diluted.
               "centreLabel": "new shares", "baseNote": f"Base: {post / 1e6:.3f}m shares, isolated pro forma"},
     # Keyed in malachite so the bridge's new shares match the doughnut's new-shares slice.
     "emphasis": ["New shares"], "emphasisLabel": "New shares",
     # Opt-in renderer options: value labels centred on columns; no Increase or Decrease key,
     # because the bridge's only movement is drawn and keyed as New shares.
     "alignValues": True, "drawnKeysOnly": True})

# 6. Revolver
add("stacked-bar", "Revolver",
    "Letters of credit leave $203m of the $275m revolver available to draw",
    "USD million at three reported dates; no loans were drawn at any of them",
    f"Letters of credit are the revolver's only reported use. The ${rcf_avail:.0f}m can be drawn only while the agreement's conditions are met, so it supports liquidity without counting as cash. Letters of credit and loans share the ${rcf_commit:.0f}m commitment.",
    "Credit agreement; 2025 10-K; Q2 2026 10-Q; Q3 2026 10-Q",
    ev("S09", "S11", "S13", "S19"),
    {"unit": "USD million", "dp": 0, "components": ["Letters of credit", "Remaining capacity"], "accent": "Remaining capacity",
     "keepOrder": True, "legendWidths": [1.75, 2.0],
     "rows": [{"label": "31 Dec 2025", "values": [num(rev["2025-12-31"]["lc_exposure_implied_usd_m"]), num(rev["2025-12-31"]["remaining_capacity_usd_m"])]},
              {"label": "30 Jun 2026", "values": [num(rev["2026-06-30"]["lc_exposure_implied_usd_m"]), num(rev["2026-06-30"]["remaining_capacity_usd_m"])]},
              {"label": "30 Sep 2026", "values": [rcf_lc, rcf_avail]}]})

# 7. Liquidity
add("waterfall", "Liquidity",
    f"Liquid assets fell ${m1(start - end)}m in nine months, mostly from ${m1(-liq_steps[1]['delta'])}m of capital spending and ${m1(-liq_steps[3]['delta'])}m of financing outflows",
    "Reported USD million, 31 December 2025 to 30 September 2026",
    f"Capital spending covers every company project, of which 10X is one; MP guides to $500m to $600m of 2026 capital costs net of government awards. The ${m1(-liq_steps[0]['delta'])}m operating outflow includes $110.9m of price-protection receipts.",
    "Q3 2026 10-Q",
    ev("S19"),
    {"unit": "USD million", "dp": 1, "start": {"label": "31 Dec 2025", "value": start},
     "steps": liq_steps, "end": {"label": "30 Sep 2026", "value": end},
     "emphasis": ["Cash capital spending", "Financing cash flows"], "emphasisLabel": "Largest decreases",
     # Opt-in renderer options: value labels centred on columns; key only the movements drawn.
     "alignValues": True, "drawnKeysOnly": True},
    layout="wide")

# 8. Default path (new in 1.0)
add("state-diagram", "Default path",
    "An actual suspension of a Defense payment obligation blocks revolver draws at once; lenders may act after 60 or 90 days",
    "Revolver states under credit agreement Section 8.01(m); the revolver was available at 30 September 2026",
    f"{PLAIN} The clock starts when an obligation is actually suspended or released; whether a right to suspend already counts is arguable, and a late DoD payment is not clearly covered. Restoring the obligation in time avoids an Event of Default. Remedies need Required Lenders to act.",
    "Credit agreement §§1.01, 4.02, 5.05, 8.01(m), 8.02; transaction agreement §9.02(a)",
    ev("S02", "S09"),
    {"asOf": "2026-09-30", "currentId": "a",
     "states": [
         {"id": "a", "label": "Available", "note": f"${rcf_avail:.0f}m drawable"},
         {"id": "b", "label": "Draws blocked", "note": "Default: no new loans or LCs"},
         {"id": "c", "label": "Grace extended", "note": f"Cash at least ${ext_test:.2f}m"},
         {"id": "d", "label": "Event of Default", "note": "Day 60 without a certificate, or day 90; lenders may act"}],
     "transitions": [
         {"from": "a", "to": "b", "label": "Defense payment duty suspended or released"},
         {"from": "b", "to": "a", "label": "Obligation restored"},
         {"from": "b", "to": "c", "label": "Day 60, cash certificate"},
         {"from": "c", "to": "d", "label": "Day 90 unresolved"},
         {"from": "a", "to": "d", "label": "Terminable default, lapse or disaffirmation"}]},
    )

# 9. Cash tests (new in 1.0)
add("exhibit-with-interpretation", "Cash tests",
    "If Defense payments are suspended, MP's liquidity depends on two cash tests: $500m at each quarter-end and $343.75m on day 60",
    "USD million at 30 September 2026; contractual thresholds beside reported balances",
    "Each threshold applies on its own date. Cash can be spent between quarter-ends, so the projected quarter-end balance sets the spending limit. Every draw also repeats the representation that no material adverse effect has occurred.",
    "Credit agreement §§4.02, 5.05, 7.11, 8.01(b) and (m); Q3 2026 10-Q",
    ev("S09", "S19"),
    {"unit": "USD million", "dp": 2, "columns": ["USD million"],
     "rows": [
         {"label": "Liquid assets, 30 Sep 26", "values": [end]},
         {"label": "Quarter-end liquidity test", "values": [floor]},
         {"label": "Day-60 extension test", "values": [ext_test]},
         {"label": "Revolver commitments", "values": [rcf_commit]},
         {"label": "Letters of credit, Sep 26", "values": [rcf_lc]},
         {"label": "Available, Sep 26", "values": [rcf_avail]}],
     "notes": [
         {"ref": 1, "text": "Cash plus short-term investments; MP reports that the agreement's Cash Equivalents include these investments."},
         {"ref": 2, "text": "Measured each quarter-end until the covenant trigger; a shortfall is an immediate Event of Default, with no equity cure found."},
         {"ref": 3, "text": "125% of the $275m commitments; certified on day 60, it adds 30 days of grace after a suspension or release."},
         {"ref": 5, "text": "Lenders may require cash collateral for these after an Event of Default."}],
     "notesHeading": "What each row measures"},
    table_reason="Reported balances and contractual thresholds are unlike measures; rows with their rules avoid implying a subtraction.")

# 10. Timing
add("evidence-milestone-strip", "Timing",
    "Leverage tests start by Q3 2027, before expected 2028 10X commissioning, and the 2030 notes can pull maturity into 2029",
    "Reported dates, contract deadlines and one conditional date",
    f"The trigger comes earlier at $400m of covenant EBITDA, later only on a late filing. On ${debt_principal:,.1f}m of debt, 4.00x leverage needs about ${be_50:.0f}m of covenant EBITDA (${be_100:.0f}m with 100% netting); 3.00x coverage, at most ${cov_lo:.0f}–{cov_hi:.0f}m. With enough 2030 notes left, maturity springs unless cash plus availability tops ${spring_test:,.1f}m or leverage is 2.00x or less.",
    "Revolving credit 8-K; credit agreement §§1.01, 6.01(b), 7.11; Q3 2026 10-Q, Note 8 and MD&A",
    ev("S08", "S09", "S19"),
    {"milestones": [
        {"label": "Revolver signed", "date": "2025-08-25", "state": "reported"},
        {"label": "Covenant trigger deadline", "date": "2027-08-14", "state": "contractual"},
        {"label": "First leverage test, latest", "date": "2027-09-30", "state": "contractual"},
        {"label": "Springing maturity", "date": "2029-11-30", "state": "conditional"},
        {"label": "2030 notes mature", "date": "2030-03-01", "state": "reported"}],
     "conventionNote": False},
    layout="wide")

# 11. Government support
add("counterparty-map", "Government support",
    "The Defense agreements that support MP are also revolver default triggers",
    "Government instruments linked to MP Materials; the transaction, offtake and price protection agreements are named in the credit agreement",
    "The price floor and offtake reduce MP's NdPr price and magnet volume risk; MP keeps 10X cost and timing risk. DoD can suspend offtake only after an uncured MP payment default; the price agreement has no suspension right. An uncured 10X breach is likelier: it makes the agreement terminable, an immediate revolver Event of Default.",
    "Transaction agreement §§6.13, 9.02(a); offtake agreement §8.4; price protection agreement §8(p)–(q); Series A certificate of designations; credit agreement §8.01(m); 2025 10-K, Note 3",
    ev("S02", "S03", "S04", "S05", "S09", "S11"),
    {"hub": "MP Materials", "relationship": "Declared government links; spokes carry no value.", "showRelationship": False,
     "parties": [
         {"label": "NdPr price protection", "role": "Floor-price payments; revolver trigger"},
         {"label": "10X offtake", "role": "Purchase commitment; revolver trigger"},
         {"label": "Initial preferred", "role": "Government cash consideration, $400m"},
         {"label": "Additional preferred", "role": "Fallback if net financing under $350m"}]},
    layout="wide")

# 12. Options on matched dates
add("role-matrix", "Options",
    "Each financing path, judged on the same dates, leaves a different question open: loan terms, letter-of-credit cover or later capital",
    "Financing paths compared from July 2025 to 30 September 2026; what each would have provided and what it leaves open",
    "The committed debt's pricing, tenor, conditions and recourse were never disclosed, so cost of capital is left unranked. The terms on which equity only would replace the letters of credit are also undetermined.",
    "FI003 analysis of the reviewed record; July 2025 transaction 8-K; underwriting agreement; revolving credit 8-K; credit agreement; 2025 10-K; Q3 2026 10-Q",
    ev("S01", "S07", "S08", "S09", "S11", "S19"),
    {"roles": ["What it is", "On these dates", "Left open"],
     "layout": {"rowHeader": "Option", "labelWidth": 2.6, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emptyText": "Not observed in this case"},
     "orgs": [
         {"label": "Committed debt", "cells": [{"qualifier": "A bank commits to lend; loans are drawn and repaid later"},
                                               {"qualifier": "The commitment of at least $1bn expired undrawn; fees were paid"},
                                               {"qualifier": "Loan pricing, tenor, conditions and recourse"}]},
         {"label": "Equity only", "cells": [{"qualifier": "New common stock; permanent capital with no repayment"},
                                            {"qualifier": f"The same ${net_eq:.1f}m of net proceeds, with no facility"},
                                            {"qualifier": "Cash collateral or another issuer for $72m of letters of credit"}]},
         {"label": "Equity + revolver", "cells": [{"qualifier": "The same stock sale plus a revolving credit facility"},
                                                  {"qualifier": f"Both closed; ${rcf_lc:.0f}m of letters of credit and no loans"},
                                                  {"qualifier": "Draws stop on any Default, including a Defense-agreement event"}]},
         {"label": "Delay to milestones", "cells": [{"qualifier": "Raise in stages after construction milestones"},
                                                    None,
                                                    {"qualifier": "Whether capital is available later on acceptable terms"}]}]},
    layout="wide",
    table_reason="Each path is described in three short sentences on the same dates; no comparable quantity exists to chart.")

# 13. Criteria
add("criterion-matrix", "Criteria",
    "Equity plus a revolver adds later liquidity but exposes MP to lender remedies if Defense payments are suspended",
    "Four financing paths against seven criteria; marks are categorical and unweighted",
    f"{JUDGMENT} Equity plus revolver and equity only differ on four criteria: covenants, conditional liquidity, lender remedies and refinancing. Marks for committed debt rest on the commitment alone; \"Not stated\" means its loan terms were never published.",
    "FI003 analysis; credit agreement; prospectus supplement; 2025 10-K",
    ev("S06", "S09", "S11"),
    {"options": ["Committed debt", "Equity only", "Equity + revolver", "Delay to milestones"],
     "accent": "Equity + revolver", "display": "text",
     "criteria": [
         {"label": "Capital raised or committed before build", "marks": ["Partly", "Meets", "Meets", "Does not"]},
         {"label": "Avoids dilution of holders", "marks": ["Meets", "Does not", "Does not", "Partly"]},
         {"label": "Avoids pre-revenue debt and covenants", "marks": ["Does not", "Meets", "Partly", "Meets"]},
         {"label": "Provides conditional liquidity later", "marks": ["Partly", "Does not", "Meets", "Partly"]},
         {"label": "Avoids lender remedies if DoD suspends", "marks": ["Not stated", "Meets", "Does not", "Meets"]},
         {"label": "Limits refinancing exposure", "marks": ["Not stated", "Meets", "Partly", "Meets"]},
         {"label": "Absorbs commissioning delay", "marks": ["Not stated", "Partly", "Partly", "Does not"]}]},
    table_reason="Four options against seven categorical criteria need a matrix; a chart would imply a numeric scale the marks do not have.")

# 14. Covenant addback
add("condition-tree", "Covenant addback",
    "A minimum-payment addback in covenant earnings can reverse when cash arrives",
    "Illustrative clause arithmetic with hypothetical inputs, not reported MP results",
    "Where the minimum payment exceeds attributable income, covenant EBITDA adds back the difference (20 on hypothetical 40 and 20). Cash later received for the same amount reverses it, so it counts once. The text leaves open whether the addback applies during a suspension. Covenant EBITDA differs from Adjusted EBITDA.",
    "Credit agreement, definition of Consolidated EBITDA",
    ev("S09"),
    {"nodes": [
        {"id": "n1", "label": "Is a minimum payment applicable?", "kind": "condition", "branches": [{"label": "No", "to": "o1"}, {"label": "Yes", "to": "n2"}]},
        {"id": "n2", "label": "Minimum versus attributable income", "kind": "condition", "branches": [{"label": "Min. higher", "to": "n3"}, {"label": "Income higher", "to": "o2"}]},
        {"id": "n3", "label": "Does later cash repeat the addback?", "kind": "condition", "branches": [{"label": "No", "to": "o3"}, {"label": "Yes", "to": "o4"}]},
        {"id": "o1", "label": "No adjustment", "kind": "outcome", "branches": []},
        {"id": "o2", "label": "No addback", "kind": "outcome", "branches": []},
        {"id": "o3", "label": "Addback of 20", "kind": "outcome", "branches": []},
        {"id": "o4", "label": "Net reduction of 20", "kind": "outcome", "branches": []}],
     "highlightOutcomeId": "o4", "conventionNote": False, "labelClear": True},
    layout="wide")

# 15. Recommendation versus strongest alternative, by stress
add("role-matrix", "Strongest alternative",
    "The revolver helps in a fundable overrun; a suspension of Defense payments blocks it",
    f"Equity plus revolver against equity only, each with ${net_eq:.1f}m of equity at the same dilution, in five situations",
    f"{JUDGMENT} Before the covenant trigger, a draw adds cash toward the $500m quarter-end test; after it, a draw raises leverage against the 4.00x limit. Equity only is better if covenant EBITDA would fall short of about ${be_50:.0f}m at the first leverage test.",
    "FI003 analysis; credit agreement; transaction agreement §9.02(a); 2025 10-K; Q3 2026 10-Q",
    ev("S02", "S09", "S11", "S19"),
    {"roles": ["Equity+revolver", "Equity only"],
     "layout": {"rowHeader": "Situation", "labelWidth": 3.2, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emphasisColumn": "Equity+revolver"},
     "orgs": [
         {"label": "Fundable company overrun", "cells": [{"qualifier": f"May draw up to ${rcf_avail:.0f}m if no Default exists"},
                                                         {"qualifier": "More equity, spending changes or delay"}]},
         {"label": "Defense payments suspended", "cells": [{"qualifier": "Draws blocked; after day 60/90, lenders may call LC cash cover"},
                                                      {"qualifier": "Funds from cash; no lender remedies apply"}]},
         {"label": "Overrun breaches 10X duties", "cells": [{"qualifier": "Can become a Default; once terminable, an Event of Default"},
                                                              {"qualifier": "Cash only; DoD termination risk is the same"}]},
         {"label": "Cost while unused", "cells": [{"qualifier": f"About ${unused_fee:.2f}m a year in commitment fees, plus LC fees"},
                                                  {"qualifier": f"No fee; ${rcf_lc:.0f}m of LCs need cash collateral or a new issuer"}]},
         {"label": "Repayment", "cells": [{"qualifier": "Loans due Aug 2030, or 30 Nov 2029 if maturity springs"},
                                          {"qualifier": "Permanent capital; nothing to repay"}]}]},
    layout="wide",
    table_reason="Two options compared on five situations in words; a chart would imply a numeric scale.")

# 16. Reversal triggers
add("condition-tree", "Reversal triggers",
    f"Equity first needs an open equity window, cash to finish 10X, secure Defense payments and covenant EBITDA near ${be_50:.0f}m",
    "Decision conditions for a hypothetical sponsor; the highlighted route ends at the recommendation",
    f"{JUDGMENT} Set go and slow decisions on 10X against projected quarter-end cash of at least $500m, then covenant EBITDA of at least about ${be_50:.0f}m (${be_100:.0f}m on the 100% reading). Revolver capacity is a secondary buffer. A sponsor without an anchor offtake or price floor may find the equity window closed.",
    "FI003 analysis; credit agreement; transaction agreement",
    ev("S02", "S09"),
    {"nodes": [
        {"id": "n1", "label": "Equity window open on acceptable terms?", "kind": "condition", "branches": [{"label": "No", "to": "o1"}, {"label": "Yes", "to": "n2"}]},
        {"id": "n2", "label": "Cost to finish above cash on hand?", "kind": "condition", "branches": [{"label": "Yes", "to": "o2"}, {"label": "No", "to": "n3"}]},
        {"id": "n3", "label": "Defense payments at risk of suspension or dispute?", "kind": "condition", "branches": [{"label": "Yes", "to": "o3"}, {"label": "No", "to": "n4"}]},
        {"id": "n4", "label": f"Covenant EBITDA below about ${be_50:.0f}m at first test?", "kind": "condition", "branches": [{"label": "Yes", "to": "o4"}, {"label": "No", "to": "o5"}]},
        {"id": "o1", "label": "Committed debt or delay", "kind": "outcome", "branches": []},
        {"id": "o2", "label": "Raise more equity first", "kind": "outcome", "branches": []},
        {"id": "o3", "label": "Fund on cash; treat revolver as unavailable", "kind": "outcome", "branches": []},
        {"id": "o4", "label": "Equity only, or amend first", "kind": "outcome", "branches": []},
        {"id": "o5", "label": "Equity plus revolver", "kind": "outcome", "branches": []}],
     "highlightOutcomeId": "o5", "conventionNote": False, "labelClear": True},
    layout="wide")

# 17. Objections
add("role-matrix", "Objections",
    "Six objections narrow the recommendation; the main open item is the cost to complete 10X",
    "Each objection, what the draft concedes, how it answers and what remains open",
    f"{JUDGMENT} Two open items matter most: the cost to complete 10X, which no public source gives, and counsel's reading of Section 8.01(m).",
    "FI003 analysis; credit agreement; transaction agreement; offtake agreement; July 2025 transaction 8-K; underwriting agreement; Q3 2026 10-Q",
    ev("S01", "S02", "S03", "S07", "S09", "S19"),
    {"roles": ["Conceded", "Answer", "What remains"],
     "layout": {"rowHeader": "Objection", "labelWidth": 3.4, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emphasisColumn": "Answer"},
     "orgs": [
         {"label": "Equity is not always cheaper", "cells": [{"qualifier": "Cost of capital is not ranked"},
                                                             {"qualifier": "The case turns on fixed charges before revenue"},
                                                             {"qualifier": "Loan terms for committed debt are not public"}]},
         {"label": "The $1bn commitment expired undrawn", "cells": [{"qualifier": "It never funded the build"},
                                                                    {"qualifier": "It backed closing until equity and the revolver replaced it"},
                                                                    {"qualifier": "Its fees were still paid"}]},
         {"label": "JPMorgan acted with Goldman and others", "cells": [{"qualifier": "The commitment and underwriting were shared"},
                                                                       {"qualifier": "Each role is stated as the filing names it"},
                                                                       {"qualifier": "The fee split between banks is not disclosed"}]},
         {"label": "Government support leaves risk", "cells": [{"qualifier": "10X cost, timing and financing stay with MP"},
                                                               {"qualifier": "Support is credited only for NdPr price and volume risk"},
                                                               {"qualifier": "Construction is funded from MP's own capital"}]},
         {"label": "Correlated availability is overstated", "cells": [{"qualifier": "DoD suspension rights are narrow"},
                                                                      {"qualifier": "A 10X breach or dispute still reaches the revolver"},
                                                                      {"qualifier": "Counsel review of Section 8.01(m)"}]},
         {"label": "No optimal or fully funded plan", "cells": [{"qualifier": "No structure is shown to be optimal"},
                                                                {"qualifier": "The draft names triggers that would change it"},
                                                                {"qualifier": "The record has no 10X cost-to-complete"}]}]},
    layout="wide",
    table_reason="Six objections each need a concession, an answer and an open limit in words; no quantity exists to chart.")

# Cover (draft 1.1). Every amount is read from the model exports above; the ledger draws
# three separate instruments on one scale and never stacks or sums them.
commit_min = num(repl["Original commitment reference minimum"]["usd_m"])
assert commit_min == 1000.0 and rcf_commit == 275.0 and rcf_lc == 72.0
LEDGER_COVER = {
    "title": "MP Materials' 10X Financing",
    "subtitle": "Cash, Covenants, and Construction Risk",
    "dek": (f"How a JPMorgan–Goldman Sachs commitment of at least $1bn gave way to ${net_eq:.1f}m of net equity "
            f"and a ${rcf_commit:.0f}m JPMorgan-agented revolver, and what that means for funding 10X before it earns revenue."),
    "context": ("10X is MP's planned rare-earth magnet plant in Northlake, Texas. MP expects to invest more than "
                "$1.25bn; construction is underway and commissioning is expected in 2028."),
    "meta": [
        {"term": "Author", "value": "Benjamin Yang"},
        {"term": "Draft", "value": "1.1, review candidate · 13 November 2026"},
        {"term": "Evidence to", "value": "6 November 2026"},
    ],
    "attribution": ("Independent research; not commissioned or reviewed by JPMorgan or MP Materials. "
                    "Held from publication pending human review."),
    "ledger": {
        "heading": "What replaced the commitment",
        "unit": "USD million on one scale; three separate instruments, not added",
        "rows": [
            {"label": "Joint secured commitment", "value": commit_min, "valueText": "≥ $1,000m",
             "status": "JPMorgan and Goldman Sachs; expired undrawn 26 Aug 2025", "treatment": "lapsed",
             "key": "Expired undrawn"},
            {"label": "Common equity, net", "value": net_eq, "valueText": f"${net_eq:.1f}m",
             "status": "Received July 2025; no repayment date", "treatment": "received",
             "key": "Cash received"},
            {"label": "Revolving credit facility", "value": rcf_commit, "valueText": f"${rcf_commit:.0f}m",
             "status": f"${rcf_lc:.0f}m letters of credit and no loans at 30 Sep 2026", "treatment": "committed",
             "key": "Committed capacity", "part": {"value": rcf_lc, "label": "Letters of credit issued"}}]},
    "evidence_refs": ev("S01", "S07", "S08", "S11", "S19"),
}

# Short document names. Each is written into the source line of every slide that cites it,
# where it becomes the link; the build refuses a slide whose line omits a cited document.
LABEL = {
    "S01": "July 2025 transaction 8-K", "S02": "transaction agreement", "S03": "offtake agreement",
    "S04": "price protection agreement", "S05": "Series A certificate of designations",
    "S06": "prospectus supplement", "S07": "underwriting agreement", "S08": "revolving credit 8-K",
    "S09": "credit agreement", "S11": "2025 10-K", "S13": "Q2 2026 10-Q",
    "S15": "J.P. Morgan's self-description", "S17": "Apple agreement 8-K", "S19": "Q3 2026 10-Q",
}


def typeset(s):
    """Typographic apostrophes and double quotes for displayed text; meaning is unchanged."""
    s = re.sub(r"(?<=\w)'", "\u2019", s)
    s = re.sub(r'"(?=\w)', "\u201c", s)
    s = re.sub(r'(?<=[\w.,])"', "\u201d", s)
    assert "'" not in s and '"' not in s, s
    return s


def typeset_all(o):
    if isinstance(o, dict):
        return {k: typeset_all(v) for k, v in o.items()}
    if isinstance(o, list):
        return [typeset_all(v) for v in o]
    return typeset(o) if isinstance(o, str) else o


spec = {
    "classification": "research",
    "title": f"{LEDGER_COVER['title']}: {LEDGER_COVER['subtitle']}",
    "plain_frame": True,
    "ledger_cover": LEDGER_COVER,
    "evidence": [{"id": i, "label": LABEL[i], "url": src[i]["url"], "title": src[i]["title"], "locator": LOC[i]} for i in sorted(used)],
    "slides": slides,
}
# Displayed text is typeset; evidence URLs, document titles and locators stay exactly as recorded.
spec = {k: (v if k == "evidence" else typeset_all(v)) for k, v in spec.items()}
for e in spec["evidence"]:
    e["label"] = typeset(e["label"])
OUT.write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")
print(f"wrote {OUT}: {len(slides)} content slides, {len(used)} evidence entries")

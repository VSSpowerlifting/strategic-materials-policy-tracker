#!/usr/bin/env python3
"""Build spec.json for FI003 presentation draft 1.0 (candidate).

Draft 1.0 builds on the 0.9.1 review baseline. It adds the credit agreement's
Defense-agreement default clause (Section 8.01(m)), the draw conditions and
remedies around it, three cash tests, the springing maturity and a matched-date
comparison of the financing paths, and narrows the recommendation accordingly.
Draft 0.9.1 and earlier drafts are kept unchanged; model 1.0 inputs are read
unchanged.

Every figure is read from the accepted model exports in research/fi003/exhibits/
and every URL from research/fi003/sources.json. Nothing is typed in twice.
Run from the repository root:  python3 research/fi003/presentation/v100/build_spec.py
"""
import csv, json, pathlib

ROOT = pathlib.Path("research/fi003")
OUT = ROOT / "presentation/v100/spec.json"


def table(name, key):
    with open(ROOT / "exhibits" / name, newline="") as f:
        return {r[key]: r for r in csv.DictReader(f)}


def num(x):
    return float(x)


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


JUDGMENT = "Editorial judgment, draft 1.0 candidate, 11 November 2026; pending human review."
PLAIN = "Plain reading of the filed agreement, not legal advice."
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
    "Raise equity first and keep the revolver for letters of credit; a suspension of Defense payment obligations would block its draws",
    "Recommendation for a hypothetical U.S. sponsor building before commissioning revenue; USD million, figures shown side by side",
    f"{JUDGMENT} The figures are different measures and are not additive. Cost of capital is not ranked because the loan terms of the lapsed commitment are not public.",
    "Underwriting agreement; 2025 10-K; Q3 2026 10-Q; credit agreement",
    ev("S07", "S09", "S11", "S19"),
    {"unit": "USD million", "dp": 1, "columns": ["USD million"],
     "rows": [
         {"label": "Net equity (reported)", "values": [net_eq]},
         {"label": "Liquid assets, 30 Sep 26", "values": [end]},
         {"label": "Revolver available, Sep 26", "values": [rcf_avail]},
         {"label": "Minimum cash floor", "values": [floor]}],
     "notes": [
         {"ref": 2, "text": "Cash plus short-term investments; spending that leaves under $500m at a quarter-end breaches the floor."},
         {"ref": 3, "text": "Drawable only while no Default exists; an actual suspension of a Defense payment obligation blocks new loans and LCs."},
         {"ref": 4, "text": "Tested at each quarter-end until the covenant trigger, not a locked reserve; a breach is an immediate Event of Default."}],
     "notesHeading": "WHAT EACH FIGURE MEANS"},
    table_reason="The answer pairs four unlike figures with their meaning; a chart would invite summing measures that are not additive.")

# 2. JPMorgan roles
add("role-matrix", "JPMorgan roles",
    "JPMorgan held every financing role; Goldman Sachs shared the commitment and, with Morgan Stanley, the underwriting",
    "Roles named in the reviewed filings and in J.P. Morgan's self-description",
    "The case shows a bank group, not a single lender's decision. Goldman Sachs and Morgan Stanley were also joint lead arrangers of the revolver. The sole-adviser role rests on J.P. Morgan's self-description; fees, retention and internal credit decisions are not disclosed.",
    "Company filings; credit agreement; J.P. Morgan's self-description for the adviser role",
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
    "Government agreements (9 July) and Apple's 15 July agreement preceded the 16 July pricing. The record does not isolate their effect on equity demand.",
    "SEC filings, July to August 2025; 2025 10-K, Note 3",
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
    "Net equity of $724.2m and a $275m revolver replaced a $1bn commitment that was never drawn",
    "USD million; cash proceeds and committed capacity shown together, not summed",
    f"The comparison mixes cash and capacity and is arithmetic only. About ${other_exp:.1f}m separates the after-discount equity from reported net proceeds as other expenses and rounding.",
    "Underwriting agreement; 2025 10-K",
    ev("S01", "S07", "S08", "S11"),
    {"unit": "USD million", "dp": 1, "columns": ["USD million"],
     "rows": [
         {"label": "Gross equity (calculated)", "values": [num(repl["Equity gross calculated from exact shares"]["usd_m"])]},
         {"label": "Underwriting discount", "values": [num(repl["Underwriting discount calculated"]["usd_m"])]},
         {"label": "Net equity (reported)", "values": [net_eq]},
         {"label": "Revolver capacity", "values": [num(repl["Corporate revolver"]["usd_m"])]},
         {"label": "Original commitment min.", "values": [num(repl["Original commitment reference minimum"]["usd_m"])]}],
     "notes": [
         {"ref": 3, "text": "Reported equity issuance net of costs; no scheduled principal repayment."},
         {"ref": 4, "text": "Committed capacity, not proceeds; drawn loans are zero in every reported snapshot."},
         {"ref": 5, "text": f"Reference minimum for a commitment that expired undrawn; ${commit_fees:.1f}m of fees were still expensed."}],
     "notesHeading": "WHAT EACH FIGURE MEANS"},
    table_reason="Cash proceeds and committed capacity are different measures; side-by-side rows with notes avoid a summed or stacked visual.")

# 5. Dilution
add("waterfall", "Dilution",
    f"New shares added {dil_pre:.2f}% to the basic count and are {dil_post:.2f}% of the isolated base",
    "Bridge from basic shares before the July 2025 offering to the isolated pro forma, then the composition of that pro forma",
    f"The dilution is identical with or without a revolver, so it does not separate the two equity options. {dil_pre:.2f}% uses the pre-offering basic count; {dil_post:.2f}% the isolated post-offering base. Not fully diluted.",
    "Prospectus supplement; 2025 10-K",
    ev("S06", "S11"),
    {"unit": "Million shares", "dp": 3,
     "start": {"label": "Before offering", "value": round(pre / 1e6, 3)},
     "steps": [{"label": "New shares", "delta": round(new / 1e6, 3)}],
     "end": {"label": "Isolated pro forma", "value": round(post / 1e6, 3)},
     "share": {"title": "Composition of the isolated pro forma", "baseLabel": "Pre-offering basic shares", "addedLabel": "New shares"}})

# 6. Revolver
add("stacked-bar", "Revolver",
    "Letters of credit leave $203m of the $275m revolver available to draw",
    "USD million at three reported dates; no loan draws in any snapshot",
    "The letters of credit are the revolver's one observed use. Availability is conditional on the credit agreement and is not cash; the sublimit is not additive to loans.",
    "Credit agreement; 2025 10-K; Q2 and Q3 2026 10-Qs",
    ev("S09", "S11", "S13", "S19"),
    {"unit": "USD million", "dp": 0, "components": ["Letters of credit", "Remaining capacity"], "accent": "Remaining capacity",
     "keepOrder": True, "legendWidths": [1.75, 2.0],
     "rows": [{"label": "31 Dec 2025", "values": [num(rev["2025-12-31"]["lc_exposure_implied_usd_m"]), num(rev["2025-12-31"]["remaining_capacity_usd_m"])]},
              {"label": "30 Jun 2026", "values": [num(rev["2026-06-30"]["lc_exposure_implied_usd_m"]), num(rev["2026-06-30"]["remaining_capacity_usd_m"])]},
              {"label": "30 Sep 2026", "values": [rcf_lc, rcf_avail]}]})

# 7. Liquidity
add("waterfall", "Liquidity",
    "Company liquid assets fell $492.4m in nine months as expansion continued",
    "USD million, 31 December 2025 to 30 September 2026",
    "Capital spending covers all company projects, not 10X alone; MP guides to $500m to $600m of 2026 capital costs net of awards. Price protection cash of $110.9m is inside operating cash flow. Reported, not forecast.",
    "Q3 2026 10-Q",
    ev("S19"),
    {"unit": "USD million", "dp": 1, "start": {"label": "31 Dec 2025", "value": start},
     "steps": liq_steps, "end": {"label": "30 Sep 2026", "value": end},
     "emphasis": ["Cash capital spending", "Financing cash flows"]},
    layout="wide")

# 8. Default path (new in 1.0)
add("state-diagram", "Default path",
    "An actual suspension of a Defense payment obligation blocks revolver draws at once; lenders may act after 60 or 90 days",
    "Revolver states under credit agreement Section 8.01(m); no such event is reported",
    f"{PLAIN} The clock starts when an obligation is actually suspended or released; a mere right to suspend is arguably not a Default. Restoring it in time avoids an Event of Default. A late DoD payment is not clearly a trigger. Remedies need lender action.",
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
    "In a suspension of Defense payments, liquidity rests on cash tests of $500m at each quarter-end and $343.75m on day 60",
    "USD million at 30 September 2026; contractual thresholds beside reported balances",
    f"Different measures, not additive; gaps between them are not headroom. Every draw also repeats a no-material-adverse-effect representation. {PLAIN}",
    "Credit agreement §§4.02, 5.05, 7.11, 8.01(b) and (m); Q3 2026 10-Q",
    ev("S09", "S19"),
    {"unit": "USD million", "dp": 2, "columns": ["USD million"],
     "rows": [
         {"label": "Liquid assets, 30 Sep 26", "values": [end]},
         {"label": "Minimum cash floor", "values": [floor]},
         {"label": "Grace-extension test", "values": [ext_test]},
         {"label": "Revolver commitments", "values": [rcf_commit]},
         {"label": "Letters of credit, Sep 26", "values": [rcf_lc]},
         {"label": "Revolver available, Sep 26", "values": [rcf_avail]}],
     "notes": [
         {"ref": 1, "text": "Cash plus short-term investments; MP reports that the agreement's Cash Equivalents include these investments."},
         {"ref": 2, "text": "Quarter-end test until the covenant trigger, not held aside; a breach is an immediate Event of Default; no equity cure found."},
         {"ref": 3, "text": "125% of the $275m commitments; certified on day 60, it adds 30 days of grace after a suspension or release."},
         {"ref": 5, "text": "Lenders may require cash collateral for these after an Event of Default."}],
     "notesHeading": "WHAT EACH TEST DOES"},
    table_reason="Reported balances and contractual thresholds are unlike measures; rows with their rules avoid implying a subtraction.")

# 10. Timing
add("evidence-milestone-strip", "Timing",
    "Leverage tests start by Q3 2027, before expected 2028 10X commissioning, and the 2030 notes can pull maturity into 2029",
    "Reported dates, contract deadlines and one conditional date; none is an MP plan",
    f"Trigger: earlier at $400m of covenant EBITDA, later only on a late filing. On ${debt_principal:,.1f}m of debt, 4.00x leverage needs about ${be_50:.0f}m (${be_100:.0f}m with 100% netting); 3.00x coverage, at most ${cov_lo:.0f}–{cov_hi:.0f}m. If enough 2030 notes remain, maturity springs unless cash plus availability tops ${spring_test:,.1f}m or leverage is 2.00x or less.",
    "Credit agreement §§1.01, 6.01(b), 7.11; Q3 2026 10-Q, Note 8 and MD&A",
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
    "Support narrows named price and volume risks; construction cost, timing and financing stay with MP. DoD may suspend offtake performance only after an uncured MP payment default; the filed price agreement has no suspension right. A material 10X breach left uncured past cure and notice periods lets DoD terminate, a revolver Event of Default.",
    "Transaction agreement §§6.13, 9.02(a); offtake §8.4; price protection §8(p)–(q); credit agreement §8.01(m); 2025 10-K, Note 3",
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
    "On the same dates, each path leaves a different gap: loan terms, letters of credit or later capital",
    "Financing paths compared from July 2025 to 30 September 2026; what each would have provided and what it leaves open",
    "Committed debt is judged without its loan pricing, tenor, conditions or recourse, which are not public. Equity only would need another source for the $72m of letters of credit; its terms are not determined.",
    "FI003 analysis of the reviewed record; credit agreement; Q3 2026 10-Q",
    ev("S01", "S07", "S08", "S11", "S19"),
    {"roles": ["What it is", "On these dates", "Left open"],
     "layout": {"rowHeader": "Option", "labelWidth": 2.6, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emptyText": "Not observed in this case"},
     "orgs": [
         {"label": "Committed debt", "cells": [{"qualifier": "A bank commits to lend; loans are drawn and repaid later"},
                                               {"qualifier": "The $1bn commitment expired undrawn after fees were paid"},
                                               {"qualifier": "Loan pricing, tenor and conditions; balance not determined"}]},
         {"label": "Equity only", "cells": [{"qualifier": "New common stock; permanent capital with no repayment"},
                                            {"qualifier": f"Same ${net_eq:.1f}m of net proceeds, no facility"},
                                            {"qualifier": "Cash collateral or another issuer for $72m of letters of credit"}]},
         {"label": "Equity + revolver", "cells": [{"qualifier": "The same stock sale plus a revolving credit facility"},
                                                  {"qualifier": f"Both executed; ${rcf_lc:.0f}m of letters of credit, no loans"},
                                                  {"qualifier": "Draws depend on no Default and the Defense agreements"}]},
         {"label": "Delay to milestones", "cells": [{"qualifier": "Raise in stages after construction milestones"},
                                                    None,
                                                    {"qualifier": "Capital being available later on acceptable terms"}]}]},
    layout="wide",
    table_reason="Each path is described in three short sentences on the same dates; no comparable quantity exists to chart.")

# 13. Criteria
add("criterion-matrix", "Criteria",
    "Equity plus a revolver adds later liquidity but exposes MP to lender remedies if Defense payments are suspended",
    "No option is shown to fully fund 10X; marks are categorical and unweighted",
    f"{JUDGMENT} Marks for committed debt rest on the commitment alone; its loan terms are not public, so cost of capital is left unranked.",
    "FI003 analysis; credit agreement; prospectus supplement; 2025 10-K",
    ev("S06", "S09", "S11"),
    {"options": ["Committed debt", "Equity only", "Equity + revolver", "Delay to milestones"],
     "accent": "Equity + revolver", "display": "text",
     "criteria": [
         {"label": "Capital raised or committed before build", "marks": ["Partly", "Meets", "Meets", "Does not"]},
         {"label": "No dilution of holders", "marks": ["Meets", "Does not", "Does not", "Partly"]},
         {"label": "No debt service or covenants pre-revenue", "marks": ["Does not", "Meets", "Partly", "Meets"]},
         {"label": "Conditional liquidity for later", "marks": ["Partly", "Does not", "Meets", "Partly"]},
         {"label": "No lender remedies on a DoD suspension", "marks": ["Not stated", "Meets", "Does not", "Meets"]},
         {"label": "Low refinancing exposure", "marks": ["Not stated", "Meets", "Partly", "Meets"]},
         {"label": "Absorbs commissioning delay", "marks": ["Not stated", "Partly", "Partly", "Does not"]}]},
    table_reason="Four options against seven categorical criteria need a matrix; a chart would imply a numeric scale the marks do not have.")

# 14. Covenant addback
add("condition-tree", "Covenant addback",
    "A minimum-payment addback in covenant earnings can reverse when cash arrives",
    "Illustrative clause arithmetic with hypothetical inputs, not reported MP results",
    "Hypothetical figures of 40 and 20 show direction only. The text does not settle whether the addback applies while Defense payment obligations are suspended. Covenant EBITDA differs from Adjusted EBITDA.",
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
    f"Both options raise the same ${net_eq:.1f}m of equity at the same dilution; they differ in what happens under stress",
    f"{JUDGMENT} Before the covenant trigger a draw adds cash toward the $500m quarter-end floor; after it, a draw raises leverage. Equity only is better if covenant EBITDA would fall short of about ${be_50:.0f}m at the first leverage test.",
    "FI003 analysis; credit agreement; transaction agreement §9.02(a); 2025 10-K; Q3 2026 10-Q",
    ev("S02", "S09", "S11", "S19"),
    {"roles": ["Equity+revolver", "Equity only"],
     "layout": {"rowHeader": "Situation", "labelWidth": 3.2, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emphasisColumn": "Equity+revolver"},
     "orgs": [
         {"label": "Fundable company overrun", "cells": [{"qualifier": f"May draw up to ${rcf_avail:.0f}m if no Default exists"},
                                                         {"qualifier": "More equity, spending changes or delay"}]},
         {"label": "Defense payments suspended", "cells": [{"qualifier": "Draws blocked; after day 60/90, lenders may call LC cash cover"},
                                                      {"qualifier": "Cash only, with no lender remedies"}]},
         {"label": "Overrun breaches 10X duties", "cells": [{"qualifier": "Can become a Default; once terminable, an Event of Default"},
                                                              {"qualifier": "Cash only; DoD termination risk is the same"}]},
         {"label": "Cost while unused", "cells": [{"qualifier": f"About ${unused_fee:.2f}m a year in commitment fees, plus LC fees"},
                                                  {"qualifier": f"No fee; ${rcf_lc:.0f}m of LCs need cash collateral or a new issuer"}]},
         {"label": "Repayment", "cells": [{"qualifier": "Loans due Aug 2030, or 30 Nov 2029 if maturity springs"},
                                          {"qualifier": "No repayment from this financing option"}]}]},
    layout="wide",
    table_reason="Two options compared on five situations in words; a chart would imply a numeric scale.")

# 16. Reversal triggers
add("condition-tree", "Reversal triggers",
    "Four conditions test whether equity plus a revolver still holds; each failure points to another path",
    "Decision conditions for a hypothetical sponsor; the highlighted route ends at the recommendation",
    f"{JUDGMENT} Go and slow decisions on 10X are set on projected quarter-end cash of at least $500m, then covenant EBITDA of at least about ${be_50:.0f}m (${be_100:.0f}m on the 100% reading); revolver capacity is a secondary buffer. A sponsor without an anchor offtake or price floor may lack the equity window.",
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
    "Six objections narrow the recommendation and name what would still change it",
    "Each objection, what the draft concedes, how it answers and what remains open",
    f"{JUDGMENT} No structure is optimal and no plan is shown as fully funded: the record has no cost-to-complete for 10X.",
    "FI003 analysis; credit, transaction and offtake agreements; filings",
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
         {"label": "Government support leaves risk", "cells": [{"qualifier": "Risk remains with MP"},
                                                               {"qualifier": "Only risks the record names are claimed"},
                                                               {"qualifier": "MP still funds the build"}]},
         {"label": "Correlated availability is overstated", "cells": [{"qualifier": "DoD suspension rights are narrow"},
                                                                      {"qualifier": "A 10X breach or dispute still reaches the revolver"},
                                                                      {"qualifier": "Counsel review of Section 8.01(m)"}]},
         {"label": "No optimal or fully funded plan", "cells": [{"qualifier": "No structure is shown to be optimal"},
                                                                {"qualifier": "The draft names triggers that would change it"},
                                                                {"qualifier": "The record has no 10X cost-to-complete"}]}]},
    layout="wide",
    table_reason="Six objections each need a concession, an answer and an open limit in words; no quantity exists to chart.")

spec = {
    "classification": "research",
    "title": "MP Materials' 10X Financing: Cash, Covenants, and Construction Risk",
    "cover_lines": ["How a lapsed JPMorgan and Goldman Sachs commitment gave way to equity and a JPMorgan-agented revolver",
                    "Benjamin Yang · Research draft 1.0 candidate · 11 November 2026 · Evidence to 6 November 2026",
                    "Independent research; not commissioned or reviewed by JPMorgan or MP Materials. Pending human review; publication hold remains in place."],
    "evidence": [{"id": i, "label": i, "url": src[i]["url"], "title": src[i]["title"], "locator": LOC[i]} for i in sorted(used)],
    "slides": slides,
}
OUT.write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")
print(f"wrote {OUT}: {len(slides)} content slides, {len(used)} evidence entries")

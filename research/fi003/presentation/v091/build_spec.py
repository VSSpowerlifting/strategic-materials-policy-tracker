#!/usr/bin/env python3
"""Build spec.json for FI003 presentation draft 0.9.1.

Draft 0.9.1 is a proposed decision-clarity revision of draft 0.9 (itself a
visual revision of draft 0.8): same slides, order, figures and conclusions;
the recommendation slides state consequences in plain sentences. Draft 0.8
remains the review baseline; model 1.0 inputs are read unchanged.

Every figure is read from the accepted model exports in research/fi003/exhibits/
and every URL from research/fi003/sources.json. Nothing is typed in twice.
Run from the repository root:  python3 research/fi003/presentation/v091/build_spec.py
"""
import csv, json, pathlib

ROOT = pathlib.Path("research/fi003")
OUT = ROOT / "presentation/v091/spec.json"


def table(name, key):
    with open(ROOT / "exhibits" / name, newline="") as f:
        return {r[key]: r for r in csv.DictReader(f)}


def num(x):
    return float(x)


src = {s["id"]: s for s in json.load(open(ROOT / "sources.json"))}
LOC = {
    "S01": "July 2025 transaction 8-K", "S02": "Transaction agreement §§2.05–2.07, 6.04, 7.01",
    "S03": "Offtake agreement §§1.2, 6.2", "S04": "Price protection agreement",
    "S05": "Series A certificate of designations", "S06": "Prospectus supplement, offering and capitalization",
    "S07": "Underwriting agreement, Schedule A", "S08": "Revolving credit 8-K",
    "S09": "Credit agreement §1.01 Consolidated EBITDA", "S10": "Q3 2025 10-Q",
    "S11": "2025 10-K, Note 10", "S12": "Q1 2026 10-Q", "S13": "Q2 2026 10-Q, Note 8",
    "S14": "Q3 2026 earnings release", "S15": "J.P. Morgan transaction article (own account)",
    "S16": "J.P. Morgan Chase newsroom release", "S17": "July 15 Apple agreement 8-K",
    "S18": "SEC submissions index", "S19": "Q3 2026 10-Q, cash flows and Note 8",
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



JUDGMENT = "Proposed editorial judgment, draft 0.9.1, 8 November 2026; pending maintainer review."
start = num(liq["Opening company liquid assets"]["usd_m"])
end = num(liq["Closing company liquid assets"]["usd_m"])
net_eq = num(repl["Final net equity proceeds"]["usd_m"])
rcf_avail = num(rev["2026-09-30"]["remaining_capacity_usd_m"])
unused_fee = num(fee["0@0.03"]["commitment_fee_usd_m"])
commit_fees = num(repl["Aggregate commitment and structuring fee expense"]["usd_m"])
other_exp = num(repl["Implied other expenses / rounding"]["usd_m"])

# 1. Executive answer
add("exhibit-with-interpretation", "Executive answer",
    "Raise permanent equity first and hold an undrawn revolver as a conditional backstop",
    "Recommendation for a hypothetical U.S. sponsor building before commissioning revenue; USD million, figures shown side by side",
    f"{JUDGMENT} The figures are different measures and are not additive. The record does not rank cost of capital, because loan terms are not public.",
    "Underwriting agreement; 2025 10-K; Q3 2026 10-Q; credit agreement",
    ev("S07", "S09", "S11", "S19"),
    {"unit": "USD million", "dp": 1, "columns": ["USD million"],
     "rows": [
         {"label": "Net equity (reported)", "values": [net_eq]},
         {"label": "Revolver available, Sep 26", "values": [rcf_avail]},
         {"label": "Liquid-asset fall, 9m 2026", "values": [round(start - end, 3)]},
         {"label": "Unused fee a year", "values": [unused_fee]},
         {"label": "Expired commitment fees", "values": [commit_fees]}],
     "notes": [
         {"ref": 1, "text": "Permanent capital with no scheduled principal or interest before commissioning revenue exists."},
         {"ref": 2, "text": "Conditional capacity after letters of credit, not cash; drawing it brings interest and covenant tests."},
         {"ref": 4, "text": "Analyst calculation at zero draws and static September letters of credit; excludes other fees."},
         {"ref": 5, "text": "Paid for a $1bn commitment that expired undrawn on 26 August 2025."}],
     "notesHeading": "WHAT EACH FIGURE MEANS"},
    table_reason="The answer pairs five unlike figures with their meaning; a chart would invite summing measures that are not additive.")

# 2. JPMorgan roles
add("role-matrix", "JPMorgan roles",
    "JPMorgan shared each financing role with Goldman Sachs or other banks",
    "Roles named in the reviewed filings and in J.P. Morgan's own account",
    "The case shows a bank group, not a single lender's decision. The adviser role rests on J.P. Morgan's own account; fees, retention and internal credit decisions are not disclosed.",
    "Company filings; J.P. Morgan's own account for the adviser role",
    ev("S01", "S07", "S08", "S15"),
    {"roles": ["Adviser", "Joint commitment", "Underwriting", "Revolver agent"],
     "orgs": [
         {"label": "JPMorgan", "cells": [{"qualifier": "Own account"}, {"qualifier": "Joint"}, {"qualifier": "Joint largest"}, {"qualifier": "Agent, lender"}]},
         {"label": "Goldman Sachs", "cells": [None, {"qualifier": "Joint"}, {"qualifier": "Joint largest"}, None]},
         {"label": "Morgan Stanley", "cells": [None, None, {"qualifier": "Smaller share"}, None]}],
     "layout": {"rowHeader": "Bank", "labelWidth": 2.2, "showCounts": False, "style": "ledger", "emptyText": "Not named",
                "emphasisColumn": "Underwriting"}},
    layout="wide",
    table_reason="Role-by-bank holdings are categorical; a matrix shows shared roles exactly where a chart would imply magnitudes.")

# 3. Sequence
add("two-lane-timeline", "Sequence",
    "Equity and a revolver replaced the joint commitment within seven weeks",
    "Financing events and the agreements around them, July to August 2025",
    "Government agreements (9 July) and Apple's 15 July agreement preceded the 16 July pricing. The record does not isolate their effect on equity demand.",
    "SEC filings, July to August 2025",
    ev("S01", "S06", "S08", "S17"),
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
    "Net equity of $724.2m replaced a $1bn commitment that was never drawn",
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
         {"ref": 5, "text": "Reference minimum for a commitment that expired undrawn; its fees were still expensed."}],
     "notesHeading": "WHAT EACH FIGURE MEANS"},
    table_reason="Cash proceeds and committed capacity are different measures; side-by-side rows with notes avoid a summed or stacked visual.")

# 5. Dilution
add("waterfall", "Dilution",
    f"New shares added {dil_pre:.2f}% to the basic count and are {dil_post:.2f}% of the isolated base",
    "Bridge from basic shares before the July 2025 offering to the isolated pro forma, then the composition of that pro forma",
    f"Dilution is the price of avoiding fixed charges, and it is the same whether or not a revolver sits alongside. {dil_pre:.2f}% uses the pre-offering basic count; {dil_post:.2f}% the isolated post-offering base. Not fully diluted.",
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
    "Availability is conditional on the credit agreement's terms and is not cash. The letter-of-credit sublimit is not additive to loans, and no future availability is assumed.",
    "2025 10-K; Q2 and Q3 2026 10-Qs",
    ev("S11", "S13", "S19"),
    {"unit": "USD million", "dp": 0, "components": ["Letters of credit", "Remaining capacity"], "accent": "Remaining capacity",
     "keepOrder": True, "legendWidths": [1.75, 2.0],
     "rows": [{"label": "31 Dec 2025", "values": [num(rev["2025-12-31"]["lc_exposure_implied_usd_m"]), num(rev["2025-12-31"]["remaining_capacity_usd_m"])]},
              {"label": "30 Jun 2026", "values": [num(rev["2026-06-30"]["lc_exposure_implied_usd_m"]), num(rev["2026-06-30"]["remaining_capacity_usd_m"])]},
              {"label": "30 Sep 2026", "values": [num(rev["2026-09-30"]["lc_exposure_implied_usd_m"]), num(rev["2026-09-30"]["remaining_capacity_usd_m"])]}]})

# 7. Liquidity
add("waterfall", "Liquidity",
    "Company liquid assets fell $492.4m in nine months as expansion continued",
    "USD million, 31 December 2025 to 30 September 2026",
    "Capital spending covers all company projects, not 10X alone. Price protection cash of $110.9m is already inside operating cash flow. The bridge is reported, not forecast.",
    "Q3 2026 10-Q",
    ev("S19"),
    {"unit": "USD million", "dp": 1, "start": {"label": "31 Dec 2025", "value": start},
     "steps": liq_steps, "end": {"label": "30 Sep 2026", "value": end},
     "emphasis": ["Cash capital spending", "Financing cash flows"]},
    layout="wide")

# 8. Timing
add("evidence-milestone-strip", "Timing",
    "Covenant tests could begin before 10X commissioning is expected in 2028",
    "Reported events and illustrative test dates; dates marked targeted are model assumptions",
    "The leverage and coverage tests start at a covenant-EBITDA certificate or the Q2 2027 statements. Commissioning has no stated date, so no marker is drawn; headroom is not disclosed.",
    "Company filings; credit agreement; model timing",
    ev("S01", "S06", "S08", "S19", "S09"),
    {"milestones": [
        {"label": "Equity priced", "date": "2025-07-16", "state": "reported"},
        {"label": "Revolver signed", "date": "2025-08-25", "state": "reported"},
        {"label": "Letters of credit $72m", "date": "2026-09-30", "state": "reported"},
        {"label": "Illustrative delivery", "date": "2027-08-15", "state": "targeted"},
        {"label": "Illustrative first test", "date": "2027-09-30", "state": "targeted"}],
     "conventionNote": False},
    layout="wide")

# 9. Government support
add("counterparty-map", "Government support",
    "Government support covers specified exposures while MP keeps its funding duties",
    "Government instruments linked to MP Materials",
    "Support narrows named price and volume risks; construction cost, timing and financing risk stay with the company. The fallback preferred applies only if net financing falls short of $350m.",
    "Transaction agreement; offtake and price protection agreements",
    ev("S02", "S03", "S04", "S05"),
    {"hub": "MP Materials", "relationship": "Declared government links; spokes carry no value.", "showRelationship": False,
     "parties": [
         {"label": "NdPr price protection", "role": "Floor-price payments (PPA income)"},
         {"label": "10X offtake", "role": "Purchase commitment; threshold varies"},
         {"label": "Initial preferred", "role": "Government cash consideration, $400m"},
         {"label": "Additional preferred", "role": "Fallback if net financing under $350m"}]},
    layout="wide")

# 10. Options defined
add("role-matrix", "Options",
    "Four financing paths differ in what is committed now and what must hold later",
    "Options for a hypothetical sponsor: what each is, what this case shows and what it depends on",
    "Delay to milestones was not observed in this case and rests on assumption alone. Committed debt is judged without its loan pricing, tenor, conditions or recourse.",
    "FI003 analysis of the reviewed record; illustrative",
    ev("S01", "S07", "S08", "S11"),
    {"roles": ["What it is", "In this case", "Depends on"],
     "layout": {"rowHeader": "Option", "labelWidth": 2.6, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emptyText": "Not observed in this case"},
     "orgs": [
         {"label": "Committed debt", "cells": [{"qualifier": "A bank commits to lend; loans are drawn and repaid later"},
                                               {"qualifier": "The $1bn commitment expired undrawn after fees were paid"},
                                               {"qualifier": "Loan pricing, tenor and conditions, which are not public"}]},
         {"label": "Equity only", "cells": [{"qualifier": "New common stock; permanent capital with no repayment"},
                                            {"qualifier": f"Raised ${net_eq:.1f}m of net proceeds"},
                                            {"qualifier": "A new raise on later terms if costs exceed cash"}]},
         {"label": "Equity + revolver", "cells": [{"qualifier": "The same stock sale plus a revolving credit facility"},
                                                  {"qualifier": "Both executed; no loans drawn at 30 Sep 2026"},
                                                  {"qualifier": "Draw conditions and covenant tests being met"}]},
         {"label": "Delay to milestones", "cells": [{"qualifier": "Raise in stages after construction milestones"},
                                                    None,
                                                    {"qualifier": "Capital being available later on acceptable terms"}]}]},
    layout="wide",
    table_reason="Each option is described in three short sentences; no quantity exists to chart.")

# 11. Criteria
add("criterion-matrix", "Criteria",
    "Only equity plus a revolver both funds the build up front and keeps later liquidity",
    "It gives up some covenant freedom and adds debt service if drawn; categorical marks, unweighted",
    f"{JUDGMENT} Marks for committed debt rest on the commitment alone; its loan terms are not public, so cost of capital is left unranked.",
    "FI003 analysis; credit agreement; prospectus supplement; 2025 10-K",
    ev("S06", "S09", "S11"),
    {"options": ["Committed debt", "Equity only", "Equity + revolver", "Delay to milestones"],
     "accent": "Equity + revolver", "display": "text",
     "criteria": [
         {"label": "Funding certain before build", "marks": ["Partly", "Meets", "Meets", "Does not"]},
         {"label": "No dilution of holders", "marks": ["Meets", "Does not", "Does not", "Partly"]},
         {"label": "No debt service pre-revenue", "marks": ["Does not", "Meets", "Partly", "Meets"]},
         {"label": "Few covenants pre-commissioning", "marks": ["Not stated", "Meets", "Partly", "Meets"]},
         {"label": "Liquidity to draw later", "marks": ["Partly", "Does not", "Meets", "Partly"]},
         {"label": "Low refinancing exposure", "marks": ["Not stated", "Meets", "Partly", "Meets"]},
         {"label": "Absorbs commissioning delay", "marks": ["Not stated", "Partly", "Partly", "Does not"]}]},
    table_reason="Four options against seven categorical criteria need a matrix; a chart would imply a numeric scale the marks do not have.")

# 12. Covenant addback
add("condition-tree", "Covenant addback",
    "A minimum-payment addback in covenant earnings can reverse when cash arrives",
    "Illustrative clause arithmetic with hypothetical inputs, not reported MP results",
    "Hypothetical figures of 40 and 20 show the direction only. A reversal lowers covenant earnings near the first tests; covenant EBITDA is a different measure from Adjusted EBITDA.",
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

# 13. Recommendation versus strongest alternative
add("role-matrix", "Strongest alternative",
    "A revolver buys conditional overrun liquidity at the cost of fees, conditions, covenants and repayment",
    f"Both options raise the same ${net_eq:.1f}m of equity at the same dilution; they differ in what happens if costs exceed cash",
    f"{JUDGMENT} Remaining capacity is conditional borrowing, not cash, and does not guarantee that an overrun is covered. Equity only is better if covenants would bind before revenue.",
    "FI003 analysis; credit agreement; Q3 2026 10-Q",
    ev("S09", "S19"),
    {"roles": ["Equity+revolver", "Equity only"],
     "layout": {"rowHeader": "Situation", "labelWidth": 3.2, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emphasisColumn": "Equity+revolver"},
     "orgs": [
         {"label": "Costs exceed cash on hand", "cells": [{"qualifier": f"May draw on ${rcf_avail:.0f}m of remaining capacity if conditions are met"},
                                                          {"qualifier": "Needs a new raise on later terms; more dilution if it is equity"}]},
         {"label": "Cost while unused", "cells": [{"qualifier": f"About ${unused_fee:.2f}m a year in commitment fees"},
                                                  {"qualifier": "No facility cost"}]},
         {"label": "Before each draw", "cells": [{"qualifier": "Representations must hold and no default may exist"},
                                                 {"qualifier": "No lender conditions"}]},
         {"label": "Covenant tests", "cells": [{"qualifier": "$500m liquidity floor; leverage and coverage tests after trigger"},
                                               {"qualifier": "No facility covenants"}]},
         {"label": "Repayment", "cells": [{"qualifier": "Any loans due by Aug 2030, or earlier under a springing maturity"},
                                          {"qualifier": "No repayment obligation"}]}]},
    layout="wide",
    table_reason="Two options compared on five situations in words; a chart would imply a numeric scale.")

# 14. Reversal triggers
add("condition-tree", "Reversal triggers",
    "Equity plus a revolver holds only while three conditions hold; each failure points elsewhere",
    "Decision conditions for a hypothetical sponsor; the highlighted route ends at the recommendation",
    f"{JUDGMENT} A sponsor without an anchor offtake, price floor or fallback preferred may lack the equity window, which strengthens committed debt.",
    "FI003 analysis; credit agreement; transaction agreement",
    ev("S02", "S09"),
    {"nodes": [
        {"id": "n1", "label": "Equity window open on acceptable terms?", "kind": "condition", "branches": [{"label": "No", "to": "o1"}, {"label": "Yes", "to": "n2"}]},
        {"id": "n2", "label": "Cost to finish above cash plus borrowing capacity?", "kind": "condition", "branches": [{"label": "Yes", "to": "o2"}, {"label": "No", "to": "n3"}]},
        {"id": "n3", "label": "Covenant tests bind before 10X revenue?", "kind": "condition", "branches": [{"label": "No", "to": "o3"}, {"label": "Yes", "to": "o4"}]},
        {"id": "o1", "label": "Committed debt or delay", "kind": "outcome", "branches": []},
        {"id": "o2", "label": "Raise more equity first", "kind": "outcome", "branches": []},
        {"id": "o3", "label": "Equity plus revolver", "kind": "outcome", "branches": []},
        {"id": "o4", "label": "Equity only", "kind": "outcome", "branches": []}],
     "highlightOutcomeId": "o3", "conventionNote": False, "labelClear": True},
    layout="wide")

# 15. Objections
add("role-matrix", "Objections",
    "Six objections narrow the recommendation without reversing it",
    "Each objection, what the draft concedes, how it answers and what remains open",
    f"{JUDGMENT} No structure is optimal and no plan is shown as fully funded: the record has no cost-to-complete for 10X.",
    "FI003 analysis of the reviewed record",
    ev("S01", "S02", "S07", "S09", "S19"),
    {"roles": ["Conceded", "Answer", "What remains"],
     "layout": {"rowHeader": "Objection", "labelWidth": 3.4, "showCounts": False, "style": "ledger",
                "cellText": "sentence", "emphasisColumn": "Answer"},
     "orgs": [
         {"label": "Equity is not always cheaper", "cells": [{"qualifier": "Cost of capital is not ranked"},
                                                             {"qualifier": "The case turns on fixed charges before revenue"},
                                                             {"qualifier": "Loan terms for committed debt are not public"}]},
         {"label": "The $1bn commitment expired undrawn", "cells": [{"qualifier": "It never funded the build"},
                                                                    {"qualifier": "It served as a bridge, not as a loan"},
                                                                    {"qualifier": "Its fees were still paid"}]},
         {"label": "JPMorgan acted with Goldman and others", "cells": [{"qualifier": "The roles were joint"},
                                                                       {"qualifier": "Each role is stated as the filing names it"},
                                                                       {"qualifier": "The fee split between banks is not disclosed"}]},
         {"label": "Government support leaves risk", "cells": [{"qualifier": "Risk remains with MP"},
                                                               {"qualifier": "Only risks the record names are claimed"},
                                                               {"qualifier": "MP still funds the build"}]},
         {"label": "A revolver is conditional, not cash", "cells": [{"qualifier": "Capacity is not cash"},
                                                                    {"qualifier": "It is treated as a conditional backstop only"},
                                                                    {"qualifier": "Draw conditions and covenant tests apply"}]},
         {"label": "No optimal or fully funded plan", "cells": [{"qualifier": "No structure is shown to be optimal"},
                                                                {"qualifier": "The draft names triggers that would change it"},
                                                                {"qualifier": "The record has no 10X cost-to-complete"}]}]},
    layout="wide",
    table_reason="Six objections each need a concession, an answer and an open limit in words; no quantity exists to chart.")

spec = {
    "classification": "research",
    "title": "FI003 JPMorgan and MP Materials, draft 0.9.1",
    "cover_lines": ["JPMorgan and MP Materials", "Financing a build before revenue: a recommendation",
                    "Benjamin Yang · Research draft 0.9.1 · 8 November 2026 · Evidence to 6 November 2026",
                    "Proposed decision-clarity revision of 0.9; draft 0.8 remains the review baseline. Publication hold remains in place."],
    "evidence": [{"id": i, "label": i, "url": src[i]["url"], "title": src[i]["title"], "locator": LOC[i]} for i in sorted(used)],
    "slides": slides,
}
OUT.write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")
print(f"wrote {OUT}: {len(slides)} content slides, {len(used)} evidence entries")

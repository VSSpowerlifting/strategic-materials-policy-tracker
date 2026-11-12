#!/usr/bin/env python3
"""Design-validation deck: five slides built from the SMPT starter template's helpers.

Not research. Every number is the synthetic `ranked-bar` fixture (also used by the memo and the
cover), so the deck, the memo and the cover agree with one another and with nothing real.

Slides: cover, executive answer, comparison exhibit, status exhibit, method and evidence.
Objects are native, editable PowerPoint shapes and text; bars are true to scale from zero.

Usage:
    uv run --with python-pptx python docs/design/presentations/validation/build_validation_deck.py out.pptx
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "templates"))

import create_master as cm  # noqa: E402  (importing builds no slides; helpers and tokens only)
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN  # noqa: E402

NOTICE = "Draft. Unpublished design validation. Synthetic example data, not research."
METHOD_URL = "https://strategic-materials-policy-tracker.vercel.app/methodology"
FIXTURE = cm.REPO / "docs" / "design" / "presentations" / "exhibit-system" / "fixtures" / "ranked-bar.json"
MEMO = json.loads((HERE / "specs" / "memo.json").read_text(encoding="utf-8"))
COVER = json.loads((HERE / "specs" / "cover.json").read_text(encoding="utf-8"))

# The memo table is the single statement of these figures; the deck reads it rather than retyping it.
ROWS = [(r[0], int(r[1].replace(",", "").replace("<b>", "").replace("</b>", "")), r[2]) for r in MEMO["sections"][0]["table"]["rows"][:-1]]
TOTAL = sum(v for _, v, _ in ROWS)
assert TOTAL == 1750, "fixture total changed; update memo.json and the slide wording together"


def _check_against_fixture() -> None:
    """The footers cite the fixture, so the figures the deck shows must be the fixture's."""
    items = {i["label"]: i["value"] for i in json.loads(FIXTURE.read_text(encoding="utf-8"))["data"]["items"]}
    named = {name.replace("Programme ", ""): v for name, v, _ in ROWS if name.startswith("Programme ")}
    other = next(v for name, v, _ in ROWS if name.startswith("Other"))
    for key, v in named.items():
        assert items.get(f"Programme {key}") == v, f"{key}: fixture {items.get(f'Programme {key}')} != memo {v}"
    rest = [v for label, v in items.items() if label.replace("Programme ", "") not in named]
    assert len(rest) == 3 and sum(rest) == other, f"'Other' ({other}) is not the fixture's other three {rest}"
    assert sum(items.values()) == TOTAL == 1750 and min(items.values()) == 40 and max(v for k, v in items.items() if k.replace("Programme ", "") != "Gamma") == 410


_check_against_fixture()


def cover_slide() -> None:
    s = cm.prs.slides.add_slide(cm.blank)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = cm.col(cm.PLASTER)
    cm.txt(s, "Strategic Materials Policy Tracker", 0.8, 1.7, 11.73, 0.35, 13, True, cm.ACCENT, align=PP_ALIGN.CENTER, name="cover-kicker")
    cm.txt(s, COVER["title"], 1.4, 2.2, 10.53, 1.7, 40, serif=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, name="cover-title")
    cm.rule(s, 0.8, 4.25, 11.73, cm.BORDER, "cover-rule")
    cm.box(s, 0.8 + 11.73 / 2 - 0.006, 4.2, 0.012, 0.115, fill=cm.BORDER_STRONG, name="cover-rule-tick")
    cm.txt(s, "Design validation deck: five slides built from the SMPT starter template", 1.6, 4.55, 10.13, 0.5, 18, False, cm.SLATE, align=PP_ALIGN.CENTER, name="cover-subtitle")
    cm.txt(s, "Version 3.0 · 11 November 2026 · " + NOTICE, 1.0, 5.2, 11.33, 0.4, 14, False, cm.FAINT, align=PP_ALIGN.CENTER, name="cover-date")


def answer_slide() -> None:
    s = cm.page("State the answer before the evidence", 2, "Executive answer: one governing judgment and three supporting facts", footer=NOTICE)
    cm.txt(s, "Programme Gamma holds the largest committed balance.", 0.62, 2.7, 12.05, 0.9, 30, serif=True, anchor=MSO_ANCHOR.MIDDLE, name="statement-governing")
    facts = [("640", "Gamma committed, CU million"), ("36.6%", "Gamma share of 1,750 total"), ("Not shown", "Drawn amounts and operating status")]
    for i, (large, label) in enumerate(facts):
        x = 0.62 + i * 4.08
        cm.box(s, x, 3.95, 3.80, 2.0, fill=cm.PLATE, outline=cm.BORDER, name="driver-panel")
        cm.txt(s, large, x + 0.22, 4.15, 3.37, 0.7, 32, True, cm.INK, name="driver-value")
        cm.txt(s, label, x + 0.22, 5.0, 3.37, 0.7, 16, False, cm.SLATE, name="driver-label")
        cm.box(s, x, 3.95, 0.06, 2.0, fill=cm.ACCENT if i == 0 else cm.BORDER_STRONG, name="driver-mark")
    cm.txt(s, "Committed balances are one measure at one status; they are not drawn or operating amounts.", 0.62, 6.2, 12.05, 0.5, 14, False, cm.SLATE)


def comparison_slide() -> None:
    s = cm.page("Gamma and Alpha carry 1,050 of 1,750 CU million", 3, "Committed balance by programme, CU million, demonstration cut-off",
                footer="Source: synthetic fixture ranked-bar.json. Shares rounded to one decimal place. " + "Not research.")
    x0, span, vmax = 4.86, 5.6, 640.0
    for i, (name, value, share) in enumerate(ROWS):
        y = 2.6 + i * 0.74
        focus = i == 0
        cm.txt(s, name, 0.77, y, 3.9, 0.5, 18, focus, cm.INK, name="bar-label", anchor=MSO_ANCHOR.MIDDLE)
        cm.box(s, x0, y, span * value / vmax, 0.5, fill=cm.ACCENT if focus else cm.NEUTRAL_MID, name="bar-focus" if focus else "bar")
        cm.txt(s, f"{value:,}  ·  {share}", x0 + span * value / vmax + 0.15, y, 2.4, 0.5, 18, True, cm.INK, name="bar-value", anchor=MSO_ANCHOR.MIDDLE)
    cm.box(s, x0 - 0.006, 2.5, 0.012, 3.75, fill=cm.BORDER_STRONG, name="zero-line")
    cm.txt(s, "Bars start at zero. The aggregate row sums three programmes and is not one programme.", 0.77, 6.4, 11.4, 0.4, 14, False, cm.SLATE, name="exhibit-note")


def status_slide() -> None:
    s = cm.page("A committed balance does not show drawdown or operation", 4, "Status ladder for the package; solid steps are evidenced, outlined steps are not",
                footer="Source: synthetic fixture ranked-bar.json. The fixture reports commitments only. Not research.")
    steps = [("Committed", "1,750 CU million across seven programmes", True), ("Drawn", "Not reported in the fixture", False),
             ("Operating", "Not verified in the fixture", False)]
    for i, (stage, status, solid) in enumerate(steps):
        x = 0.62 + i * 4.08
        cm.box(s, x, 3.17, 3.80, 0.83, fill=cm.INK if solid else cm.PLATE, outline=None if solid else cm.BORDER_STRONG, name="stage" if solid else "stage-open")
        cm.txt(s, stage, x + 0.2, 3.38, 3.4, 0.42, 20, True, cm.PLATE if solid else cm.INK)
        cm.txt(s, status, x + 0.2, 4.2, 3.4, 0.7, 16, False, cm.SLATE)
    cm.rule(s, 0.62, 5.45, 12.05, cm.BORDER, "note-rule")
    cm.txt(s, "The ladder states what is known at each step. It does not claim drawdown or production has occurred.", 0.62, 5.6, 12.0, 0.7, 16, False, cm.INK)


def method_slide() -> None:
    s = cm.page("One measure, one status, one cut-off, one labelled fixture", 5, "Method and evidence for this validation deck", footer=NOTICE)
    rows = [("Measure", "Committed balance, CU million, as stated; never converted or combined with other statuses"),
            ("Data", "Synthetic fixture ranked-bar.json, constructed for the exhibit gallery"),
            ("Treatment", "Shares rounded to one decimal place; aggregate row sums three programmes"),
            ("Limits", "No drawdown, operating status, rationale or causal claim")]
    for j, head in enumerate(("Element", "Treatment in this deck")):
        cm.txt(s, head, (0.62, 3.21)[j], 2.55, 3.5, 0.3, 12, True, cm.SLATE, name="table-head")
    cm.rule(s, 0.62, 2.9, 12.05, cm.BORDER_STRONG, "table-head-rule")
    for i, (k, v) in enumerate(rows):
        y = 3.0 + i * 0.72
        cm.txt(s, k, 0.62, y + 0.12, 2.4, 0.44, 17, True, cm.ACCENT)
        cm.txt(s, v, 3.21, y + 0.12, 9.4, 0.5, 16, False, cm.INK)
        cm.rule(s, 0.62, y + 0.66, 12.05, cm.BORDER, "row-rule")
    cm.txt(s, "Source", 0.62, 6.0, 2.4, 0.4, 16, True, cm.SLATE)
    cm.txt(s, "Strategic Materials Policy Tracker, methodology", 3.21, 6.0, 9.4, 0.4, 16, False, cm.INK, link=METHOD_URL, name="source-link")


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    assert FIXTURE.exists(), FIXTURE
    cm.check_fonts()
    cover_slide()
    answer_slide()
    comparison_slide()
    status_slide()
    method_slide()
    cm.brand_theme(cm.prs)
    cm.prs.core_properties.title = COVER["title"] + " (design validation)"
    cm.prs.core_properties.author = "Strategic Materials Policy Tracker"
    cm.prs.core_properties.subject = NOTICE
    out = Path(argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    cm.prs.save(out)
    print(f"wrote {out} ({len(cm.prs.slides)} slides)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

#!/usr/bin/env python3
"""Original editable SMPT slide-template generator (publication system v3).

Builds a reusable eight-layout starter in the Architectural Research Studio
identity: plaster ground, graphite text and marks, one malachite emphasis,
Spectral on the cover and the executive statement, Archivo everywhere else.
Colours and faces come from docs/design/publication-tokens.json through
scripts/publication/tokens.py; this file hard-codes no hex.

    uv run --with python-pptx python docs/design/presentations/templates/create_master.py [output.pptx]

All text and shapes stay native and editable. Replace the example figures with
the controlling model outputs before any publication. PowerPoint cannot embed
fonts: the PDF export is the canonical form. No font files are included.
The build stops when Spectral or Archivo is not installed; set
SMPT_ALLOW_MISSING_FONTS=1 only for a structure-only run.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "scripts"))

from pptx import Presentation  # noqa: E402
from pptx.dml.color import RGBColor  # noqa: E402
from pptx.enum.shapes import MSO_SHAPE  # noqa: E402
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN  # noqa: E402
from pptx.util import Emu, Inches, Pt  # noqa: E402

from publication.tokens import FONT_EDITORIAL, FONT_TEXT, brand_theme_xml, hex_, neutral_hex, ramp_hex  # noqa: E402

PLASTER, ELEVATED, PLATE = hex_("plaster"), hex_("elevated"), hex_("plate")
INK, SLATE, FAINT = hex_("graphite"), hex_("slate"), hex_("faint")
BORDER, BORDER_STRONG = hex_("border"), hex_("borderStrong")
ACCENT, NEGATIVE = hex_("malachite"), hex_("hematite")
NEUTRAL_MID = neutral_hex("mid")
RAMP = ramp_hex()

SERIF_MIN_PT = 28


def check_fonts() -> None:
    out = subprocess.run(["fc-list", ":", "family"], capture_output=True, text=True).stdout.lower()
    installed = {n.strip() for line in out.splitlines() for n in line.split(",")}
    missing = [f for f in (FONT_EDITORIAL, FONT_TEXT) if f.lower() not in installed]
    if not missing:
        return
    msg = (f"Required publication font(s) not installed: {', '.join(missing)}. Install them locally "
           "(nothing is committed) or set SMPT_ALLOW_MISSING_FONTS=1 for a structure-only run.")
    if os.environ.get("SMPT_ALLOW_MISSING_FONTS") == "1":
        print(f"warning: {msg}", file=sys.stderr)
        return
    raise SystemExit(msg)


prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank = prs.slide_layouts[6]


def col(c: str) -> RGBColor:
    return RGBColor.from_string(c)


def box(sl, x, y, w, h, fill=None, outline=None, name=None):
    s = sl.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill:
        s.fill.solid()
        s.fill.fore_color.rgb = col(fill)
    else:
        s.fill.background()
    if outline:
        s.line.color.rgb = col(outline)
        s.line.width = Pt(0.75)
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    # python-pptx attaches a theme style whose effectRef draws a shadow in some renderers; fill and line are explicit.
    style = s._element.find("{http://schemas.openxmlformats.org/presentationml/2006/main}style")
    if style is not None:
        s._element.remove(style)
    if name:
        s.name = name
    return s


def rule(sl, x, y, w, color=BORDER, name="rule"):
    return box(sl, x, y, w, 0.012, fill=color, name=name)


def txt(sl, value, x, y, w, h, pt=18, bold=False, ink=INK, serif=False, align=PP_ALIGN.LEFT,
        anchor=MSO_ANCHOR.TOP, name=None, link=None):
    if serif and pt < SERIF_MIN_PT:
        raise ValueError(f"{FONT_EDITORIAL} is not used below {SERIF_MIN_PT} pt ({value!r})")
    s = sl.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    if name:
        s.name = name
    tf = s.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.02)
    tf.margin_top = tf.margin_bottom = Inches(0.02)
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = value
    f = run.font
    f.name = FONT_EDITORIAL if serif else FONT_TEXT
    f.size = Pt(pt)
    f.bold = False if serif else bold
    f.color.rgb = col(ACCENT if link else ink)
    if link:
        f.underline = True
        run.hyperlink.address = link
    return s


def page(title: str, number: int, subtitle: str = "", footer: str = "Original SMPT template. Replace all example inputs before publication."):
    s = prs.slides.add_slide(blank)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = col(PLASTER)
    txt(s, "Strategic Materials Policy Tracker", 0.62, 0.35, 8, 0.33, 12, True, ACCENT, name="running-head")
    txt(s, str(number).zfill(2), 12.0, 0.35, 0.7, 0.33, 12, False, FAINT, align=PP_ALIGN.RIGHT, name="page-number")
    txt(s, title, 0.62, 0.84, 12.05, 0.8, 26, True, INK, name="title")
    if subtitle:
        txt(s, subtitle, 0.62, 1.7, 12.05, 0.42, 14, False, SLATE, name="measure-subtitle")
    rule(s, 0.62, 2.2, 12.05, BORDER_STRONG, "title-rule")
    rule(s, 0.62, 6.91, 12.05, BORDER, "footer-rule")
    txt(s, footer, 0.62, 7.0, 11.25, 0.24, 10, False, FAINT, name="source-footer")
    return s


def build_master_slides() -> None:
    """Add the eight starter slides (cover, answer, exhibits, matrix, status, scenario, actors, conclusion)."""
    # 1: Cover. Centred block as on the site: kicker, Spectral title, hairline rule with a registration tick.
    s = prs.slides.add_slide(blank)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = col(PLASTER)
    txt(s, "Strategic Materials Policy Tracker", 0.8, 1.85, 11.73, 0.35, 13, True, ACCENT, align=PP_ALIGN.CENTER, name="cover-kicker")
    txt(s, "Industrial capital and commercial execution", 0.8, 2.35, 11.73, 1.5, 44, serif=True, align=PP_ALIGN.CENTER,
        anchor=MSO_ANCHOR.MIDDLE, name="cover-title")
    rule(s, 0.8, 4.12, 11.73, BORDER, "cover-rule")
    box(s, 0.8 + 11.73 / 2 - 0.006, 4.07, 0.012, 0.115, fill=BORDER_STRONG, name="cover-rule-tick")
    txt(s, "Reusable 16:9 research presentation system", 1.6, 4.45, 10.13, 0.5, 18, False, SLATE, align=PP_ALIGN.CENTER, name="cover-subtitle")
    txt(s, "Version 3.0 · 11 November 2026", 1.6, 5.05, 10.13, 0.4, 14, False, FAINT, align=PP_ALIGN.CENTER, name="cover-date")

    # 2: Executive answer. One governing sentence in Spectral, three drivers beneath.
    s = page("State the answer before the evidence", 2, "Executive findings: one governing judgment and three drivers")
    txt(s, "Core financing is committed; the remaining question is timing.", 0.62, 2.7, 12.05, 0.9, 30, serif=True,
        anchor=MSO_ANCHOR.MIDDLE, name="statement-governing")
    for i, (large, label) in enumerate([("£61m", "Core financing"), ("£40–45m", "Project spend guidance"), ("Timing", "Commercial dependency")]):
        x = 0.62 + i * 4.08
        box(s, x, 3.95, 3.80, 2.0, fill=PLATE, outline=BORDER, name="driver-panel")
        txt(s, large, x + 0.22, 4.15, 3.37, 0.7, 32, True, INK, name="driver-value")
        txt(s, label, x + 0.22, 5.0, 3.37, 0.45, 16, False, SLATE, name="driver-label")
        box(s, x, 3.95, 0.06, 2.0, fill=ACCENT if i == 0 else BORDER_STRONG, name="driver-mark")
    txt(s, "The analysis must explain the mechanism connecting these facts.", 0.62, 6.2, 12.05, 0.5, 14, False, SLATE)

    # 3: Dominant original exhibit. Solid components; the uncommitted item is outlined, not filled.
    s = page("Core financing and uncommitted capacity are different", 3, "Financial instruments · reported amounts (£m)")
    box(s, 0.73, 3.07, 5.1, 1.05, fill=INK, name="bar-equity")
    box(s, 5.83, 3.07, 3.54, 1.05, fill=ACCENT, name="bar-core-loan")
    txt(s, "£36m equity", 0.95, 3.43, 4.6, 0.46, 20, True, PLATE)
    txt(s, "£25m core loan", 6.05, 3.43, 3.12, 0.46, 20, True, PLATE)
    txt(s, "£61m gross core", 9.68, 3.37, 2.8, 0.6, 22, True, INK)
    box(s, 0.73, 4.78, 3.40, 0.65, fill=PLATE, outline=ACCENT, name="bar-accordion-outline")
    txt(s, "£10m uncommitted", 0.92, 4.96, 3.10, 0.37, 16, True, ACCENT)
    txt(s, "Separate legal status; not available cash.", 4.47, 4.97, 7.55, 0.5, 16, False, INK)

    # 4: Financial mechanism matrix. Hairline rows, no zebra fill.
    s = page("Compare like-for-like contractual terms", 4, "Decision matrix: edit categories and source values")
    rows = [("Equity", "Residual financial risk", "No principal maturity"),
            ("Loan", "Interest and repayment", "Full core draw reported"),
            ("Accordion", "Conditional borrowing", "Not committed")]
    for j, head in enumerate(("Instrument", "Mechanism", "Status")):
        xs = (0.74, 3.33, 8.13)
        txt(s, head, xs[j], 2.62, 3.5, 0.3, 12, True, SLATE, name="table-head")
    rule(s, 0.74, 2.95, 11.8, BORDER_STRONG, "table-head-rule")
    for i, (kind, mechanism, status) in enumerate(rows):
        y = 3.05 + i * 0.95
        txt(s, kind, 0.74, y + 0.15, 2.3, 0.44, 18, True, ACCENT)
        txt(s, mechanism, 3.33, y + 0.15, 4.4, 0.5, 17, False, INK)
        txt(s, status, 8.13, y + 0.15, 4.2, 0.5, 17, False, INK)
        rule(s, 0.74, y + 0.8, 11.8, BORDER, "row-rule")

    # 5: Milestone-to-cash conversion. Verified stages are solid; open stages are outlined.
    s = page("Show reporting status at each commercial milestone", 5, "Source date, activity date and verification status stay distinct")
    for i, (stage, status) in enumerate([("Processing", "Issuer-reported"), ("Offtake", "Contract signed"),
                                          ("Deliveries", "Verification open"), ("Collections", "Verification open")]):
        x = 0.74 + i * 3.10
        solid = i < 2
        box(s, x, 3.17, 2.79, 0.83, fill=INK if solid else PLATE, outline=None if solid else BORDER_STRONG, name="stage")
        txt(s, stage, x + 0.15, 3.38, 2.45, 0.42, 18, True, PLATE if solid else INK)
        txt(s, status, x + 0.1, 4.2, 2.59, 0.5, 15, False, SLATE)
    rule(s, 0.74, 5.45, 11.75, BORDER, "note-rule")
    txt(s, "Sequence shows information needs, not a claim of achieved production or cash receipts.", 0.74, 5.6, 11.3, 0.4, 16, False, INK)

    # 6: Scenario drivers. Bars start at zero and are true to scale; one emphasised mark.
    s = page("Label each sensitivity driver and its source", 6, "Illustrative £m increments; not a current cash shortage")
    scale = 3.96 / 3.0  # inches per £m
    for i, (name, amount) in enumerate([("Capex increment", 2.5), ("Delay proxy", 3.0), ("Rate proxy", 0.25)]):
        y = 3.02 + i * 0.94
        txt(s, name, 0.77, y, 3.9, 0.47, 18, False, INK)
        box(s, 4.86, y - 0.02, amount * scale, 0.53, fill=[INK, ACCENT, NEUTRAL_MID][i], name="driver-bar")
        txt(s, f"£{amount:.2f}m", 5.0 + amount * scale, y - 0.02, 1.6, 0.49, 18, True, INK)
    box(s, 4.86 - 0.006, 2.85, 0.012, 2.9, fill=BORDER_STRONG, name="zero-line")
    txt(s, "Total incremental stress: £5.75m", 0.79, 6.1, 11.4, 0.43, 20, True, ACCENT)

    # 7: Stakeholder decisions.
    s = page("Different users require different supporting disclosures", 7, "Investment research should identify who needs which evidence")
    for i, (actor, needs) in enumerate([("Investors", "Cash headroom and funding or dilution risks"),
                                        ("Lenders", "Maturity, security and refinancing terms"),
                                        ("Public capital", "Use of proceeds and realized industrial results")]):
        y = 2.94 + i * 1.07
        box(s, 0.74, y, 3.08, 0.83, fill=INK, name="actor")
        txt(s, actor, 0.96, y + 0.18, 2.65, 0.48, 18, True, PLATE)
        box(s, 3.82, y, 8.67, 0.83, fill=PLATE, outline=BORDER, name="need")
        txt(s, needs, 4.06, y + 0.18, 8.11, 0.48, 17, False, INK)

    # 8: Conclusion. Light ground like every slide; the two findings are labelled and ruled.
    s = page("Finish with the evidence that could change the judgment", 8, "Specific monitoring indicators; preserve analytical uncertainty")
    txt(s, "Established", 0.77, 2.85, 2.7, 0.4, 16, True, ACCENT)
    txt(s, "Government-backed instruments, disclosed project spending and operating progress", 0.78, 3.3, 11.7, 0.9, 22, False, INK)
    rule(s, 0.76, 4.6, 11.78, BORDER_STRONG, "divider-rule")
    txt(s, "Unresolved", 0.77, 4.85, 2.7, 0.4, 16, True, NEGATIVE)
    txt(s, "Current cash, full debt position, collections and refinancing arrangements", 0.78, 5.3, 11.7, 0.9, 22, False, INK)


def brand_theme(presentation) -> None:
    """Point the Office theme at the SMPT faces and palette.

    python-pptx ships the Office theme (Calibri, blue and orange accents). Anything a person adds in
    PowerPoint without an explicit font or colour would inherit it, so the theme itself is rewritten:
    Spectral as the major (heading) face, Archivo as the minor (body) face, SMPT tokens as colours.
    """
    from pptx.opc.constants import RELATIONSHIP_TYPE as RT
    import re
    for master in presentation.slide_masters:
        part = master.part.part_related_by(RT.THEME)
        xml = part.blob.decode("utf-8")
        xml = re.sub(r'(<a:majorFont><a:latin typeface=")[^"]*"', rf'\g<1>{FONT_EDITORIAL}"', xml, count=1)
        xml = re.sub(r'(<a:minorFont><a:latin typeface=")[^"]*"', rf'\g<1>{FONT_TEXT}"', xml, count=1)
        xml = re.sub(r'<a:fontScheme name="[^"]*"', '<a:fontScheme name="SMPT Studio"', xml, count=1)
        part._blob = brand_theme_xml(xml).encode("utf-8")


if __name__ == "__main__":
    check_fonts()
    build_master_slides()
    brand_theme(prs)
    dest = Path(sys.argv[1] if len(sys.argv) > 1 else "SMPT_Research_Master_v3.pptx")
    dest.parent.mkdir(parents=True, exist_ok=True)
    prs.save(dest)
    print(f"Created {dest} ({len(prs.slides)} editable slides)")

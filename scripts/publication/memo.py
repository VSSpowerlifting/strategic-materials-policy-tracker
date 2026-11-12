#!/usr/bin/env python3
"""SMPT executive memo and report-page generator (Architectural Research Studio, v3).

Builds a font-embedded, selectable-text PDF from a small JSON spec. Colours, faces and
page geometry come from docs/design/publication-tokens.json through scripts/publication/tokens.py;
nothing here hard-codes a hex. No font binary is bundled: faces are located with `fc-match`
and a missing Spectral or Archivo stops the build (set SMPT_ALLOW_MISSING_FONTS=1 only for a
structure-only run; the output is then not a deliverable).

Page: US Letter, 0.9 in margins, plaster ground (`ground: "white"` for a print copy).
Title in Spectral (editorial role, >= 28 pt); everything else Archivo. Hairline rules only,
square corners, no fills except an optional plate for a table. Sources are live hyperlinks.

Usage (reportlab is not a repository dependency; run it ephemerally):
    uv run --with reportlab python scripts/publication/memo.py spec.json out.pdf

Spec (JSON):
{
  "title": "...", "kicker": "Executive memo", "classification": "Draft. Unpublished. Not research.",
  "meta": [["Prepared", "11 November 2026"], ...],
  "answer": "One governing sentence or short paragraph.",
  "sections": [
    {"heading": "...", "paragraphs": ["..."], "bullets": ["..."],
     "table": {"caption": "...", "head": ["A", "B"], "rows": [["x", "1"]], "align": ["l", "r"], "source": "..."}}
  ],
  "sources": [{"label": "...", "url": "https://...", "note": "..."}],
  "ground": "plaster"
}
Inline markup allowed in text: <b>, <i>, <a href="...">...</a>.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokens import FONT_EDITORIAL, FONT_TEXT, contrast, hex_  # noqa: E402

from reportlab.lib.colors import HexColor  # noqa: E402
from reportlab.lib.enums import TA_LEFT, TA_RIGHT  # noqa: E402
from reportlab.lib.pagesizes import letter  # noqa: E402
from reportlab.lib.styles import ParagraphStyle  # noqa: E402
from reportlab.lib.units import inch  # noqa: E402
from reportlab.pdfbase import pdfmetrics  # noqa: E402
from reportlab.pdfbase.ttfonts import TTFont  # noqa: E402
from reportlab.platypus import (  # noqa: E402
    BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

MARGIN = 0.9 * inch
PAGE_W, PAGE_H = letter
CONTENT_W = PAGE_W - 2 * MARGIN
TITLE_PT = 28  # Spectral floor from the type policy


def _c(name: str) -> HexColor:
    return HexColor("#" + hex_(name))


def _find(family: str, style: str) -> str | None:
    out = subprocess.run(
        ["fc-match", "-f", "%{file}|%{family}|%{style}", f"{family}:style={style}"],
        capture_output=True, text=True,
    ).stdout
    path, fam, _ = (out.split("|") + ["", "", ""])[:3]
    if not path.lower().endswith(".ttf"):
        return None
    if family.lower() not in fam.lower():
        return None
    return path


def register_fonts() -> dict[str, str]:
    """Register TrueType faces; return logical-name -> registered font name."""
    wanted = {
        "text": (FONT_TEXT, "Regular"), "text-medium": (FONT_TEXT, "Medium"),
        "text-semibold": (FONT_TEXT, "SemiBold"), "text-bold": (FONT_TEXT, "Bold"),
        "editorial": (FONT_EDITORIAL, "Regular"), "editorial-light": (FONT_EDITORIAL, "Light"),
    }
    names, missing = {}, []
    for key, (family, style) in wanted.items():
        path = _find(family, style)
        if path is None:
            missing.append(f"{family} {style}")
            continue
        reg = f"{family}-{style}"
        pdfmetrics.registerFont(TTFont(reg, path))
        names[key] = reg
    if missing and os.environ.get("SMPT_ALLOW_MISSING_FONTS") != "1":
        raise SystemExit(
            "Required publication font(s) not installed as TrueType: " + ", ".join(missing)
            + ". Install locally (nothing is committed) or set SMPT_ALLOW_MISSING_FONTS=1 for a structure-only run."
        )
    for key in wanted:  # structure-only fallback; never a deliverable
        names.setdefault(key, "Helvetica")
    from reportlab import rl_config
    rl_config.canvas_basefontname = names["text"]  # no unembedded Helvetica default in the PDF
    pdfmetrics.registerFontFamily(
        names["text"], normal=names["text"], bold=names["text-semibold"],
        italic=names["text"], boldItalic=names["text-semibold"],
    )
    return names


def _styles(f: dict[str, str]) -> dict[str, ParagraphStyle]:
    ink, slate, faint, accent = _c("graphite"), _c("slate"), _c("faint"), _c("malachite")
    base = dict(fontName=f["text"], textColor=ink, alignment=TA_LEFT)
    return {
        "kicker": ParagraphStyle("kicker", fontName=f["text-medium"], fontSize=9.5, leading=13, textColor=accent),
        "title": ParagraphStyle("title", fontName=f["editorial"], fontSize=TITLE_PT, leading=33,
                                textColor=ink, spaceAfter=10),
        "meta_k": ParagraphStyle("meta_k", fontName=f["text-medium"], fontSize=8.5, leading=12, textColor=slate),
        "meta_v": ParagraphStyle("meta_v", fontName=f["text"], fontSize=9, leading=12, textColor=ink),
        "answer": ParagraphStyle("answer", fontName=f["text-medium"], fontSize=12.5, leading=18.5, textColor=ink),
        "h2": ParagraphStyle("h2", fontName=f["text-semibold"], fontSize=11.5, leading=15,
                             spaceBefore=12, spaceAfter=3, textColor=ink, keepWithNext=1),
        "body": ParagraphStyle("body", fontSize=10, leading=14.8, spaceAfter=6, **base),
        "bullet": ParagraphStyle("bullet", fontSize=10, leading=14.8, leftIndent=14, bulletIndent=2, bulletFontName=f["text"],
                                 spaceAfter=3, **base),
        "caption": ParagraphStyle("caption", fontName=f["text-medium"], fontSize=9, leading=12.5,
                                  spaceBefore=6, spaceAfter=4, textColor=ink),
        "th": ParagraphStyle("th", fontName=f["text-semibold"], fontSize=8.5, leading=11.5, textColor=ink),
        "td": ParagraphStyle("td", fontName=f["text"], fontSize=9, leading=12.5, textColor=ink),
        "src": ParagraphStyle("src", fontName=f["text"], fontSize=8.5, leading=12, textColor=faint, spaceAfter=2),
        "notice": ParagraphStyle("notice", fontName=f["text-medium"], fontSize=8.5, leading=12, textColor=slate),
        "foot": ParagraphStyle("foot", fontName=f["text"], fontSize=8, leading=10, textColor=faint),
    }


_ANCHOR = re.compile(r'<a href="([^"]+)">(.*?)</a>', re.S)


def _links(text: str) -> str:
    """Give every plain <a href> the malachite link colour (token, not a literal in the spec)."""
    return _ANCHOR.sub(lambda m: f'<a href="{m.group(1)}" color="#{hex_("malachite")}">{m.group(2)}</a>', text)


def P(text: str, style: ParagraphStyle, **kw) -> Paragraph:
    return Paragraph(_links(text), style, **kw)


def _table(spec: dict, st: dict[str, ParagraphStyle], width: float, font: str) -> list:
    align = spec.get("align") or ["l"] * len(spec["head"])
    cols = len(spec["head"])

    def cell(text, style, a):
        s = ParagraphStyle("c", parent=st[style], alignment=TA_RIGHT if a == "r" else TA_LEFT)
        return P(str(text), s)

    data = [[cell(h, "th", align[i]) for i, h in enumerate(spec["head"])]]
    data += [[cell(v, "td", align[i]) for i, v in enumerate(row)] for row in spec["rows"]]
    first = width * (0.38 if cols > 2 else 0.6)
    rest = (width - first) / max(cols - 1, 1)
    t = Table(data, colWidths=[first] + [rest] * (cols - 1), repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), font), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LINEABOVE", (0, 0), (-1, 0), 0.75, _c("graphite")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.75, _c("graphite")),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, _c("border")),
        ("LINEBELOW", (0, -1), (-1, -1), 0.75, _c("borderStrong")),
    ]))
    out: list = []
    if spec.get("caption"):
        out.append(Paragraph(spec["caption"], st["caption"]))
    out.append(t)
    if spec.get("source"):
        out.append(Spacer(1, 3))
        out.append(P(spec["source"], st["src"]))
    return [KeepTogether(out)]


def build_memo(spec: dict, out: Path, fonts: dict[str, str] | None = None) -> None:
    f = fonts or register_fonts()
    st = _styles(f)
    ground = _c("plaster") if spec.get("ground", "plaster") == "plaster" else HexColor("#FFFFFF")
    classification = spec.get("classification", "")

    def page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(ground)
        canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        canvas.setStrokeColor(_c("borderStrong"))
        canvas.setLineWidth(0.75)
        canvas.line(MARGIN, PAGE_H - MARGIN + 14, PAGE_W - MARGIN, PAGE_H - MARGIN + 14)
        canvas.setFillColor(_c("graphite"))
        canvas.setFont(f["text-medium"], 8.5)
        canvas.drawString(MARGIN, PAGE_H - MARGIN + 21, "Strategic Materials Policy Tracker")
        canvas.setFillColor(_c("slate"))
        canvas.setFont(f["text"], 8.5)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN + 21, spec.get("kicker", "Executive memo"))
        canvas.setStrokeColor(_c("border"))
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, MARGIN - 14, PAGE_W - MARGIN, MARGIN - 14)
        canvas.setFillColor(_c("faint"))
        canvas.setFont(f["text"], 8)
        if classification:
            canvas.drawString(MARGIN, MARGIN - 26, classification)
        canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 26, f"Page {doc.page}")
        canvas.restoreState()

    doc = BaseDocTemplate(
        str(out), pagesize=letter, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=MARGIN,
        title=spec["title"], author="Strategic Materials Policy Tracker", subject=spec.get("kicker", "Executive memo"),
        creator="SMPT publication system v3", initialFontName=f["text"],
    )
    doc.addPageTemplates([PageTemplate(id="memo", frames=[Frame(MARGIN, MARGIN, CONTENT_W, PAGE_H - 2 * MARGIN, 0, 0, 0, 0)], onPage=page)])

    flow: list = [Spacer(1, 14), Paragraph(spec["title"], st["title"])]
    if spec.get("meta"):
        rows = [[Paragraph(k, st["meta_k"]), Paragraph(v, st["meta_v"])] for k, v in spec["meta"]]
        mt = Table(rows, colWidths=[1.05 * inch, CONTENT_W - 1.05 * inch])
        mt.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), f["text"]), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LINEABOVE", (0, 0), (-1, 0), 0.5, _c("border")), ("LINEBELOW", (0, -1), (-1, -1), 0.5, _c("border")),
        ]))
        flow += [Spacer(1, 4), mt]
    if spec.get("answer"):
        bar = Table([[Paragraph(spec["answer"], st["answer"])]], colWidths=[CONTENT_W])
        bar.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), f["text"]), ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LINEBEFORE", (0, 0), (0, -1), 2.5, _c("malachite")),
        ]))
        flow += [Spacer(1, 16), bar, Spacer(1, 4)]
    for sec in spec.get("sections", []):
        flow.append(Paragraph(sec["heading"], st["h2"]))
        for p in sec.get("paragraphs", []):
            flow.append(P(p, st["body"]))
        for b in sec.get("bullets", []):
            flow.append(P(b, st["bullet"], bulletText="–"))
        if sec.get("table"):
            flow.append(Spacer(1, 2))
            flow += _table(sec["table"], st, CONTENT_W, f["text"])
    if spec.get("sources"):
        flow.append(Paragraph("Sources", st["h2"]))
        for s in spec["sources"]:
            note = f" {s['note']}" if s.get("note") else ""
            flow.append(P(
                f'{s["label"]}. <a href="{s["url"]}">{s["url"]}</a>.{note}', st["src"]))
    doc.build(flow)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    spec = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    # contrast guard: link and body colours on the chosen ground
    ground = hex_("plaster") if spec.get("ground", "plaster") == "plaster" else "FFFFFF"
    for name in ("graphite", "slate", "faint", "malachite"):
        assert contrast(hex_(name), ground) >= 4.5, f"{name} fails AA on the memo ground"
    out = Path(argv[2])
    out.parent.mkdir(parents=True, exist_ok=True)
    build_memo(spec, out)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

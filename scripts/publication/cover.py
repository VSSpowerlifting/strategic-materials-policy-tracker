#!/usr/bin/env python3
"""SMPT publication cover and social-image generator (Architectural Research Studio, v3).

Two outputs from one spec, both typographic (no stock imagery, no gradients, no shadows):
  * report cover: US Letter PDF, vector text with Spectral and Archivo embedded, selectable;
  * social image: 1200 x 630 PNG (Open Graph / social edition), flattened, so it carries an
    explicit alt text in the spec for the page that uses it.

Composition mirrors the site's title block: kicker, centred Spectral title, standfirst, a hairline
`sheet-rule` with a registration tick, then a definition grid of facts. Colours and faces come from
docs/design/publication-tokens.json; a missing Spectral or Archivo stops the build.

Usage:
    uv run --with reportlab python scripts/publication/cover.py spec.json out_dir
    -> out_dir/<slug>-cover.pdf and out_dir/<slug>-social.png

Spec (JSON):
{
  "slug": "example", "kicker": "Research note", "title": "...", "standfirst": "...",
  "facts": [["Edition", "..."], ["Status", "..."]],
  "notice": "Draft. Unpublished design validation. Not research.",
  "social_alt": "Text alternative for the social image."
}
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from memo import _c, _find, register_fonts  # noqa: E402
from tokens import FONT_EDITORIAL, FONT_TEXT, contrast, hex_, rgb  # noqa: E402

from PIL import Image, ImageDraw, ImageFont  # noqa: E402
from reportlab.lib.pagesizes import letter  # noqa: E402
from reportlab.lib.units import inch  # noqa: E402
from reportlab.pdfbase.pdfmetrics import stringWidth  # noqa: E402
from reportlab.pdfgen import canvas as rl_canvas  # noqa: E402

W, H = letter
MARGIN = 0.9 * inch


def _wrap_pdf(text: str, font: str, size: float, width: float) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if stringWidth(trial, font, size) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def report_cover(spec: dict, out: Path) -> None:
    f = register_fonts()
    c = rl_canvas.Canvas(str(out), pagesize=letter)
    c.setTitle(spec["title"])
    c.setAuthor("Strategic Materials Policy Tracker")
    c.setSubject(spec.get("kicker", "Research publication"))
    c.setFillColor(_c("plaster"))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    # masthead
    c.setFillColor(_c("graphite"))
    c.setFont(f["text-medium"], 9.5)
    c.drawString(MARGIN, H - MARGIN, "Strategic Materials Policy Tracker")
    c.setStrokeColor(_c("borderStrong"))
    c.setLineWidth(0.75)
    c.line(MARGIN, H - MARGIN - 9, W - MARGIN, H - MARGIN - 9)

    # centred title block
    cx, y = W / 2, H - 3.05 * inch
    c.setFillColor(_c("malachite"))
    c.setFont(f["text-medium"], 11)
    c.drawCentredString(cx, y, spec.get("kicker", "Research"))
    y -= 0.62 * inch
    for size in (40, 36, 32, 30):  # largest Spectral size that sets the title in three lines or fewer
        lines = _wrap_pdf(spec["title"], f["editorial"], size, W - 2 * MARGIN - 0.6 * inch)
        if len(lines) <= 3:
            break
    lead = round(size * 1.15)
    c.setFillColor(_c("graphite"))
    c.setFont(f["editorial"], size)
    for line in lines:
        c.drawCentredString(cx, y, line)
        y -= lead
    y -= 0.12 * inch
    c.setFillColor(_c("slate"))
    c.setFont(f["text"], 12.5)
    for line in _wrap_pdf(spec.get("standfirst", ""), f["text"], 12.5, 4.6 * inch):
        c.drawCentredString(cx, y, line)
        y -= 18
    y -= 0.3 * inch

    # sheet rule with registration tick
    c.setStrokeColor(_c("borderStrong"))
    c.setLineWidth(0.75)
    c.line(MARGIN, y, W - MARGIN, y)
    c.setStrokeColor(_c("graphite"))
    c.line(cx, y, cx, y + 7)

    # definition grid, anchored to the foot of the page
    facts = spec.get("facts", [])
    gy = MARGIN + 0.55 * inch + 22 * len(facts)
    c.setStrokeColor(_c("border"))
    c.setLineWidth(0.5)
    for i, (k, v) in enumerate(facts):
        row_y = gy - 22 * i
        c.line(MARGIN, row_y + 15, W - MARGIN, row_y + 15)
        c.setFillColor(_c("slate"))
        c.setFont(f["text-medium"], 9)
        c.drawString(MARGIN, row_y, k)
        c.setFillColor(_c("graphite"))
        c.setFont(f["text"], 9.5)
        c.drawString(MARGIN + 1.5 * inch, row_y, v)
    if facts:
        c.line(MARGIN, gy - 22 * len(facts) + 15, W - MARGIN, gy - 22 * len(facts) + 15)

    # notice
    c.setFillColor(_c("faint"))
    c.setFont(f["text"], 8.5)
    c.drawString(MARGIN, MARGIN - 4, spec.get("notice", ""))
    c.showPage()
    c.save()


def _pil_font(family: str, style: str, px: int) -> ImageFont.FreeTypeFont:
    path = _find(family, style)
    if path is None:
        if os.environ.get("SMPT_ALLOW_MISSING_FONTS") == "1":
            return ImageFont.load_default()
        raise SystemExit(f"Required publication font not installed as TrueType: {family} {style}")
    return ImageFont.truetype(path, px)


def _wrap_px(draw: ImageDraw.ImageDraw, text: str, font, width: int) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def social_image(spec: dict, out: Path) -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), rgb("plaster"))
    d = ImageDraw.Draw(img)
    border, strong, ink = rgb("border"), rgb("borderStrong"), rgb("graphite")
    d.rectangle([40, 40, w - 41, h - 41], outline=border, width=1)

    mast = _pil_font(FONT_TEXT, "Medium", 22)
    d.text((72, 66), "Strategic Materials Policy Tracker", font=mast, fill=ink)
    d.line([(72, 104), (w - 72, 104)], fill=strong, width=1)

    kicker = _pil_font(FONT_TEXT, "Medium", 24)
    kw = d.textlength(spec.get("kicker", "Research"), font=kicker)
    d.text(((w - kw) / 2, 150), spec.get("kicker", "Research"), font=kicker, fill=rgb("malachite"))

    # largest Spectral size that fits the title in at most three lines
    maxw, title = w - 240, spec["title"]
    for max_lines in (2, 3):  # prefer two lines; accept three at a smaller size
        for px in (64, 58, 54, 50, 46):
            tf = _pil_font(FONT_EDITORIAL, "Regular", px)
            lines = _wrap_px(d, title, tf, maxw)
            if len(lines) <= max_lines:
                break
        else:
            continue
        break
    lead = int(px * 1.16)
    y = 200 + (3 - len(lines)) * 30
    for line in lines:
        lw = d.textlength(line, font=tf)
        d.text(((w - lw) / 2, y), line, font=tf, fill=ink)
        y += lead
    rule_y = max(y + 36, 470)
    d.line([(72, rule_y), (w - 72, rule_y)], fill=strong, width=1)
    d.line([(w // 2, rule_y - 9), (w // 2, rule_y)], fill=ink, width=1)

    foot = _pil_font(FONT_TEXT, "Regular", 20)
    d.text((72, rule_y + 26), spec.get("notice", ""), font=foot, fill=rgb("slate"))
    d.rectangle([40, 40, w - 41, h - 41], outline=border, width=1)
    img.save(out, optimize=True, dpi=(144, 144))


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    spec = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    for name in ("graphite", "slate", "faint", "malachite"):
        assert contrast(hex_(name), hex_("plaster")) >= 4.5, f"{name} fails AA on plaster"
    outdir = Path(argv[2])
    outdir.mkdir(parents=True, exist_ok=True)
    slug = spec.get("slug", "publication")
    report_cover(spec, outdir / f"{slug}-cover.pdf")
    social_image(spec, outdir / f"{slug}-social.png")
    print(f"wrote {outdir}/{slug}-cover.pdf and {slug}-social.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

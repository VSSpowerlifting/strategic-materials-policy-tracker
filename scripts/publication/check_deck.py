#!/usr/bin/env python3
"""Palette and type check for SMPT decks (`.pptx`), against docs/design/publication-tokens.json.

Read-only; standard library only. For each file it inspects every slide, layout and master and reports:
  * colour: any literal sRGB colour that is not a palette token, a chart-series colour, a functional
    neutral, a ramp step (or a tone interpolated between adjacent ramp steps), or plate white (the text colour on graphite and malachite fills);
  * theme: the colour scheme and the heading/body faces a newly inserted shape would inherit;
  * type: any typeface other than Spectral, Archivo and the mono face (theme font references such as
    +mn-lt are resolved against the theme's declared fonts, which must also be token faces);
  * Spectral below its 28 pt floor, where a run declares its size;
  * effects: gradient fills, shadows and large-radius rounded rectangles (small radii are allowed as a node-type encoding in diagrams).

Text contrast over shape fills is not resolved here: the token file records the ratios and the
rendered-slide review covers the rest. It does not replace `exhibits:verify` (editable objects, geometry) or the rendered-slide review.

Usage:
    python3 scripts/publication/check_deck.py deck.pptx [more.pptx ...]
    python3 scripts/publication/check_deck.py --strict deck.pptx   # warnings also fail
Exit status: 0 clean, 1 violations, 2 usage or unreadable file.
"""
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokens import FONT_EDITORIAL, FONT_MONO, FONT_TEXT, TOKENS, ramp_hex  # noqa: E402

ALLOWED_FONTS = {FONT_EDITORIAL, FONT_TEXT, FONT_MONO}
SPECTRAL_MIN = 2800  # hundredths of a point

PARTS = re.compile(r"^ppt/(slides|slideLayouts|slideMasters)/[^/]+\.xml$")
THEME = re.compile(r"^ppt/theme/theme\d+\.xml$")
RUN = re.compile(r"<a:r>(.*?)</a:r>", re.S)


def allowed_colours() -> set[str]:
    out = {v["hex"] for v in TOKENS["palette"].values()}
    out |= {v["hex"] for v in TOKENS["series"].values()}
    out |= {v for k, v in TOKENS["neutrals"].items() if not k.startswith("$")}
    out |= set(TOKENS["sequentialRamp"]["steps"])
    return {c.lstrip("#").upper() for c in out if isinstance(c, str) and c.startswith("#")}


def on_ramp(colour: str, tol: int = 3) -> bool:
    """True when `colour` lies on a straight RGB segment between two adjacent ramp steps.

    The sensitivity grid interpolates along the sequential ramp to encode a continuous magnitude;
    those intermediate tones are the ramp, not new colours.
    """
    steps = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in ramp_hex()]
    c = tuple(int(colour[i:i + 2], 16) for i in (0, 2, 4))
    for a, b in zip(steps, steps[1:]):
        d = [y - x for x, y in zip(a, b)]
        denom = sum(v * v for v in d)
        t = max(0.0, min(1.0, sum((c[i] - a[i]) * d[i] for i in range(3)) / denom)) if denom else 0.0
        if all(abs(a[i] + t * d[i] - c[i]) <= tol for i in range(3)):
            return True
    return False


def theme_fonts(xml: str) -> dict[str, str]:
    fonts = {}
    for tag, key in (("majorFont", "+mj-lt"), ("minorFont", "+mn-lt")):
        m = re.search(rf"<a:{tag}>.*?<a:latin typeface=\"([^\"]*)\"", xml, re.S)
        if m:
            fonts[key] = m.group(1)
    return fonts


def check(path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    ok_colours = allowed_colours()
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        resolved: dict[str, str] = {}
        for n in filter(THEME.match, names):
            xml = z.read(n).decode("utf8")
            resolved.update(theme_fonts(xml))
            scheme = re.search(r"<a:clrScheme[\s\S]*?</a:clrScheme>", xml)
            if scheme:
                for c in sorted({c.upper() for c in re.findall(r'<a:srgbClr val="([0-9A-Fa-f]{6})"', scheme.group(0))} - ok_colours):
                    errors.append(f"{n}: theme colour #{c} is not a publication token (new shapes would start from it)")
                if "<a:sysClr" in scheme.group(0):
                    errors.append(f"{n}: theme uses system colours (dk1/lt1); set them to graphite and plate")
            for key, face in theme_fonts(xml).items():
                if face and face not in ALLOWED_FONTS:
                    errors.append(f"{n}: theme font {key} is '{face}', not a token face")
        for n in sorted(filter(PARTS.match, names)):
            xml = z.read(n).decode("utf8")
            used = {c.upper() for c in re.findall(r'<a:srgbClr val="([0-9A-Fa-f]{6})"', xml)}
            bad = sorted(c for c in used - ok_colours - {"FFFFFF"} if not on_ramp(c))
            for c in bad:
                errors.append(f"{n}: colour #{c} is not a publication token")
            if "FFFFFF" in xml.upper() and re.search(r'srgbClr val="FFFFFF"', xml, re.I):
                warnings.append(f"{n}: pure white (#FFFFFF) used; tokens define plate #FDFDFB for light text and exhibit ground")
            for face in sorted(set(re.findall(r'<a:(?:latin|ea|cs) typeface="([^"]*)"', xml))):
                real = resolved.get(face, face)
                if real and real not in ALLOWED_FONTS and not real.startswith("+"):
                    errors.append(f"{n}: typeface '{face}' is not Spectral, Archivo or the mono face")
            for run in RUN.findall(xml):
                face = re.search(r'<a:latin typeface="([^"]*)"', run)
                size = re.search(r'<a:rPr[^>]* sz="(\d+)"', run)
                if face and resolved.get(face.group(1), face.group(1)) == FONT_EDITORIAL and size and int(size.group(1)) < SPECTRAL_MIN:
                    text = re.sub(r"<[^>]+>", "", run)[:40]
                    errors.append(f"{n}: Spectral at {int(size.group(1)) / 100:g} pt (floor 28 pt): '{text}'")
            if "<a:gradFill" in xml:
                errors.append(f"{n}: gradient fill (the system has no gradients)")
            if "<a:outerShdw" in xml or "<a:innerShdw" in xml:
                errors.append(f"{n}: shadow effect (the system has no shadows)")
            for adj in re.findall(r'prst="roundRect"><a:avLst><a:gd name="adj" fmla="val (\d+)"', xml):
                if int(adj) > 20000:  # small radii mark node types in diagrams; large ones are decoration
                    warnings.append(f"{n}: large corner radius (adj {adj}); the system uses square or near-square corners")
                    break
    # internal consistency of the token file itself
    for key, ratio in TOKENS["contrast"]["vsPlaster"].items():
        if key in ("graphite", "slate", "faint", "malachite", "hematite") and ratio < 4.5:
            errors.append(f"token {key} is below 4.5:1 on plaster")
    return errors, warnings


def main(argv: list[str]) -> int:
    strict = "--strict" in argv
    files = [Path(a) for a in argv[1:] if not a.startswith("--")]
    if not files:
        print(__doc__)
        return 2
    status = 0
    for f in files:
        try:
            errors, warnings = check(f)
        except (OSError, zipfile.BadZipFile) as exc:
            print(f"{f}: cannot read ({exc})")
            return 2
        print(f"{f}: {len(errors)} violation(s), {len(warnings)} warning(s)")
        for line in errors:
            print(f"  violation  {line}")
        for line in warnings:
            print(f"  warning    {line}")
        if errors or (strict and warnings):
            status = 1
    return status


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

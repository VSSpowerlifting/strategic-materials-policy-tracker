#!/usr/bin/env python3
"""Render gallery preview PNGs from exhibit-gallery.pptx.

    npm run exhibits:previews

Converts the gallery deck to PDF with headless LibreOffice, rasterises each
page with pdftoppm at 72 dpi (960 x 540 px for a 13.333 x 7.5 in slide) and
writes gallery/previews/<pattern-id>.png, using element-manifest.json to map
each slide to its pattern. The cover slide is skipped.

Previews are LibreOffice renders. PowerPoint can differ in font metrics,
label placement and bubble scaling, so a preview is a review aid, not proof of
how the PPTX looks in PowerPoint.

Archivo must be visible to fontconfig for faithful previews. Point
FONTCONFIG_FILE at a config that includes the Archivo font directory (the
fonts are not committed). Without it the script still runs and warns.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SYSTEM = REPO / "docs" / "design" / "presentations" / "exhibit-system"
GALLERY = SYSTEM / "exhibit-gallery.pptx"
MANIFEST = SYSTEM / "element-manifest.json"
PREVIEWS = SYSTEM / "gallery" / "previews"
RUNTIME_BIN = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override"
DPI = "72"


def find_tool(name: str) -> str | None:
    found = shutil.which(name)
    if found:
        return found
    rt = RUNTIME_BIN / name
    return str(rt) if rt.exists() else None


def slide_patterns() -> list[tuple[int, str]]:
    manifest = json.loads(MANIFEST.read_text())
    rel = str(GALLERY.relative_to(REPO))
    deck = next((d for d in manifest["decks"] if d["file"] == rel), None)
    if deck is None:
        sys.exit(f"render_previews: {rel} not in element-manifest.json; run npm run exhibits:build first")
    return [(s["slide"], s["pattern"]) for s in deck["slides"] if s["pattern"] != "cover"]


def main() -> int:
    soffice, pdftoppm = find_tool("soffice"), find_tool("pdftoppm")
    if not soffice or not pdftoppm:
        print("render_previews: soffice and pdftoppm are required; previews not rendered", file=sys.stderr)
        return 1
    if not os.environ.get("FONTCONFIG_FILE"):
        print("render_previews: FONTCONFIG_FILE not set; Archivo may fall back to another face", file=sys.stderr)
    slides = slide_patterns()
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        prof = f"-env:UserInstallation=file://{t / 'profile'}"
        subprocess.run(
            [soffice, "--headless", prof, "--convert-to", "pdf", "--outdir", str(t), str(GALLERY)],
            check=True, capture_output=True, timeout=600,
        )
        pdf = t / (GALLERY.stem + ".pdf")
        subprocess.run([pdftoppm, "-r", DPI, "-png", str(pdf), str(t / "page")], check=True, timeout=600)
        pages = sorted(t.glob("page-*.png"))
        by_number = {int(p.stem.split("-")[-1]): p for p in pages}
        expected = {f"{pid}.png" for _, pid in slides}
        for stale in PREVIEWS.glob("*.png"):
            if stale.name not in expected:
                stale.unlink()
        missing = []
        for slide, pid in slides:
            src = by_number.get(slide)
            if src is None:
                missing.append(pid)
                continue
            shutil.copyfile(src, PREVIEWS / f"{pid}.png")
    if missing:
        print(f"render_previews: no page rendered for {', '.join(missing)}", file=sys.stderr)
        return 1
    print(f"previews: {len(slides)} PNGs -> {PREVIEWS.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

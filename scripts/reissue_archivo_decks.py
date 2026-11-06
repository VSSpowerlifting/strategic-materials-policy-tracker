#!/usr/bin/env python3
"""Restyle current editable SMPT research decks to Archivo and export checked PDFs.

Design-only successor. Inputs are committed, source-verified PPTX masters.
Never downloads/stores fonts in Git; typography binaries live in runner cache.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import urllib.request
from zipfile import ZipFile
from PIL import Image, ImageOps, ImageDraw
import fitz
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
FI1 = ROOT / "research/financial-intelligence/hemerdon-phase1c/presentation-v2"
FI2 = ROOT / "docs/research/fi002-bhp-copper/output"
PUBLIC1 = ROOT / "public/research/fi001"
PUBLIC2 = ROOT / "public/research/fi002"
REVIEW = ROOT / "docs/design/presentations/reviews"
FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf"
XML_FONT = re.compile(rb'(typeface=")(Georgia|Arial|Source Sans 3|Liberation Sans|Helvetica|Cambria)(")')
FORBIDDEN_FONT = re.compile(rb'typeface="(?:Georgia|Arial|Source Sans 3|Liberation Sans|Helvetica|Cambria)"')
CHECKED = []

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def install_archivo() -> None:
    fontdir = Path.home() / ".local/share/fonts/smpt-archivo"
    fontdir.mkdir(parents=True, exist_ok=True)
    raw = fontdir / "Archivo-variable-source.ttf"
    urllib.request.urlretrieve(FONT_URL, raw)
    if raw.stat().st_size < 25000:
        raise RuntimeError("Downloaded Archivo font is unexpectedly small")
    for weight, style in [(400, "Regular"), (500, "Medium"), (600, "SemiBold"), (700, "Bold")]:
        font = TTFont(raw)
        instantiateVariableFont(font, {"wdth": 100, "wght": weight}, inplace=True)
        # The upstream variable font ships with a SemiBold naming default.
        # Give every static instance its correct family/style/weight so LO
        # renders Archivo Regular as Regular, not as the SemiBold default.
        font["OS/2"].usWeightClass = weight
        font["OS/2"].fsSelection &= ~((1 << 5) | (1 << 6))
        if weight == 400:
            font["OS/2"].fsSelection |= 1 << 6
        elif weight >= 700:
            font["OS/2"].fsSelection |= 1 << 5
        font["head"].macStyle = 1 if weight >= 700 else 0
        for record in font["name"].names:
            name = {
                1: "Archivo", 2: style, 4: "Archivo " + style,
                6: "Archivo-" + style, 16: "Archivo", 17: style
            }.get(record.nameID)
            if name is None:
                continue
            record.string = name.encode("utf-16-be" if record.platformID == 3 else "mac_roman")
        font.save(fontdir / ("Archivo-" + style + ".ttf"))
        font.close()
    raw.unlink()
    subprocess.run(["fc-cache", "-f", str(fontdir)], check=True)
    match = subprocess.check_output(["fc-match", "-f", "%{family}", "Archivo"], text=True).strip()
    if "Archivo" not in match:
        raise RuntimeError("Fontconfig did not register Archivo: " + match)
    print("Archivo installed temporarily for rendering:", match)

def rewrite_pptx(pptx: Path) -> dict:
    original = pptx.read_bytes()
    output = io.BytesIO()
    replaced = 0
    already_archivo = False
    with ZipFile(io.BytesIO(original), "r") as zi, ZipFile(output, "w") as zo:
        names = zi.namelist()
        if len(names) != len(set(names)):
            raise RuntimeError("Duplicate package entries: " + str(pptx))
        for info in zi.infolist():
            contents = zi.read(info.filename)
            if info.filename.startswith("ppt/") and info.filename.endswith((".xml", ".rels")):
                already_archivo |= b'typeface="Archivo"' in contents
                contents, count = XML_FONT.subn(rb'\1Archivo\3', contents)
                replaced += count
                if FORBIDDEN_FONT.search(contents):
                    raise RuntimeError("Legacy typeface remains in " + info.filename)
            zo.writestr(info, contents)
    if replaced < 1 and not already_archivo:
        raise RuntimeError("No Archivo face or restylable legacy font references in " + str(pptx))
    restyled = output.getvalue()
    with ZipFile(io.BytesIO(original)) as old, ZipFile(io.BytesIO(restyled)) as new:
        if old.namelist() != new.namelist():
            raise RuntimeError("Package part list changed")
        for name in old.namelist():
            before, after = old.read(name), new.read(name)
            if before == after:
                continue
            if not name.startswith("ppt/") or not name.endswith((".xml", ".rels")):
                raise RuntimeError("Non-typography package part changed: " + name)
            norm = lambda b: re.sub(rb'typeface="[^"]+"', b'typeface="FONT"', b)
            if norm(before) != norm(after):
                raise RuntimeError("Non-font XML was modified: " + name)
    pptx.write_bytes(restyled)
    return {"replacements": replaced, "old_sha256": sha(original), "new_sha256": sha(restyled)}

def render_pdf(pptx: Path, expected_pages: int) -> Path:
    with tempfile.TemporaryDirectory(prefix="smpt-lo-") as profile:
        tmp = Path(profile)
        cmd = [
            "libreoffice", "-env:UserInstallation=" + (tmp / "profile").as_uri(),
            "--headless", "--convert-to", "pdf:impress_pdf_Export",
            "--outdir", str(tmp), str(pptx),
        ]
        subprocess.run(cmd, check=True, timeout=180)
        converted = tmp / (pptx.stem + ".pdf")
        if not converted.is_file():
            raise RuntimeError("No PDF exported: " + str(pptx))
        if fitz.open(converted).page_count != expected_pages:
            raise RuntimeError("Unexpected slide count: " + str(converted))
        target = pptx.with_suffix(".pdf")
        shutil.copy2(converted, target)
    return target

def audit_pdf(before_pdf: bytes, output: Path, expected_pages: int) -> dict:
    before = fitz.open(stream=before_pdf, filetype="pdf")
    after = fitz.open(output)
    if before.page_count != expected_pages or after.page_count != expected_pages:
        raise RuntimeError("PDF page count mismatch")
    fonts = sorted({f[3] for pg in after for f in pg.get_fonts(full=True)})
    if not any("Archivo" in name for name in fonts):
        raise RuntimeError("Archivo was not embedded in exported PDF: " + repr(fonts))
    if all("SemiBold" in name for name in fonts):
        raise RuntimeError("Regular type is incorrectly exported as SemiBold: " + repr(fonts))
    # Exports may vary in whitespace/line breaks but must preserve almost all text.
    old_text = [re.sub(r"\s+", "", pg.get_text()) for pg in before]
    new_text = [re.sub(r"\s+", "", pg.get_text()) for pg in after]
    if any(len(n) < len(o) * .90 for o, n in zip(old_text, new_text) if len(o) > 70):
        raise RuntimeError("Substantial PDF text loss detected")
    old_links = [set(l.get("uri", "") for l in pg.get_links() if l.get("uri")) for pg in before]
    new_links = [set(l.get("uri", "") for l in pg.get_links() if l.get("uri")) for pg in after]
    missing = [(i + 1, sorted(o - n)) for i, (o, n) in enumerate(zip(old_links, new_links)) if o - n]
    if missing:
        raise RuntimeError("Missing source links after PDF export: " + repr(missing)[:800])
    return {
        "pages": expected_pages, "embedded_fonts": fonts,
        "links_before": sum(len(x) for x in old_links),
        "links_after": sum(len(x) for x in new_links),
        "minimum_text_retention": round(min(len(n) / max(len(o), 1) for o, n in zip(old_text, new_text)), 3),
        "pdf_sha256": sha(output.read_bytes()),
    }

def contact_sheet(pdf: Path, path: Path, columns: int = 4) -> None:
    document = fitz.open(pdf)
    images = []
    for page in document:
        pix = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5), alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        images.append(im)
    w = max(x.width for x in images)
    h = max(x.height for x in images)
    rows = (len(images) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * (w + 16) + 16, rows * (h + 36) + 16), "#eeeae3")
    d = ImageDraw.Draw(sheet)
    for idx, im in enumerate(images):
        x = 16 + (idx % columns) * (w + 16)
        y = 16 + (idx // columns) * (h + 36)
        sheet.paste(im, (x, y))
        d.text((x, y + h + 5), "Slide " + str(idx + 1), fill="#252421")
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, quality=89, optimize=True)

def restyle(name: str, pptx: Path, expected_pages: int, public_pptx: Path, public_pdf: Path) -> None:
    if not pptx.is_file() or not pptx.with_suffix(".pdf").is_file():
        raise RuntimeError("Current master or matching PDF missing: " + str(pptx))
    before_pdf = pptx.with_suffix(".pdf").read_bytes()
    pptx_audit = rewrite_pptx(pptx)
    pdf = render_pdf(pptx, expected_pages)
    pdf_audit = audit_pdf(before_pdf, pdf, expected_pages)
    public_pptx.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(pptx, public_pptx)
    shutil.copy2(pdf, public_pdf)
    contact_sheet(pdf, REVIEW / (name + "-archivo-contact.jpg"))
    CHECKED.append({"name": name, "pptx": str(pptx.relative_to(ROOT)),
                    "public_pptx": str(public_pptx.relative_to(ROOT)),
                    "public_pdf": str(public_pdf.relative_to(ROOT)),
                    **pptx_audit, **pdf_audit})

def repackage_fi002() -> None:
    manifest_file = PUBLIC2 / "publication-manifest.json"
    manifest = json.loads(manifest_file.read_text())
    for name in ("executive-slides.pptx", "executive-slides.pdf"):
        path = PUBLIC2 / name
        if name not in manifest["files"]:
            raise RuntimeError("Published file not in manifest: " + name)
        manifest["files"][name] = {"sha256": sha(path.read_bytes()), "bytes": path.stat().st_size}
    manifest_file.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    zip_path = PUBLIC2 / "research-package.zip"
    with ZipFile(zip_path, "r") as old:
        old_items = [(info, old.read(info.filename)) for info in old.infolist()]
    replacements = 0
    with tempfile.TemporaryDirectory(prefix="smpt-package-") as td:
        tempzip = Path(td) / "package.zip"
        with ZipFile(tempzip, "w") as new:
            for info, payload in old_items:
                short = Path(info.filename).name
                if short in ("executive-slides.pptx", "SMPT_FI002_BHP_Copper_Strategy_Deck.pptx"):
                    payload = (PUBLIC2 / "executive-slides.pptx").read_bytes()
                    replacements += 1
                elif short in ("executive-slides.pdf", "SMPT_FI002_BHP_Copper_Strategy_Deck.pdf"):
                    payload = (PUBLIC2 / "executive-slides.pdf").read_bytes()
                    replacements += 1
                elif short == "publication-manifest.json":
                    payload = manifest_file.read_bytes()
                    replacements += 1
                new.writestr(info, payload)
        shutil.copy2(tempzip, zip_path)
    print("FI002 package updated deck references:", replacements)

def main() -> None:
    install_archivo()
    REVIEW.mkdir(parents=True, exist_ok=True)
    restyle("fi001", FI1 / "SMPT_FI001_Hemerdon_Presentation_v2.pptx", 18,
            PUBLIC1 / "presentation-v2-archivo.pptx",
            PUBLIC1 / "presentation-v2-archivo.pdf")
    restyle("fi002", FI2 / "SMPT_FI002_BHP_Copper_Strategy_Deck.pptx", 12,
            PUBLIC2 / "executive-slides.pptx", PUBLIC2 / "executive-slides.pdf")
    repackage_fi002()
    lines = ["# Archivo slide-deck republication quality check",
             "", "6 November 2026 · typography-only, no source/cutoff change",
             "", "Original legacy/archived decks remain available at their original revisions.",
             "Existing PDF-only R001 tungsten and Applied Strategy 001 antimony slides",
             "remain unchanged pending editable-source reconstruction and QA.",
             ""]
    for x in CHECKED:
        lines += ["## " + x["name"].upper(),
                  "- Editable master: `" + x["pptx"] + "`",
                  "- Live presentation candidates: `" + x["public_pptx"] + "`, `" + x["public_pdf"] + "`",
                  "- Slides: " + str(x["pages"]) + "; replaced font references: " + str(x["replacements"]),
                  "- Embedded PDF fonts: " + ", ".join(x["embedded_fonts"]),
                  "- Preserved source link targets: " + str(x["links_after"]) + " (baseline " + str(x["links_before"]) + ")",
                  "- Minimum extracted slide-text retention: " + str(x["minimum_text_retention"]),
                  "- New PDF SHA-256: `" + x["pdf_sha256"] + "`",
                  "- New PPTX SHA-256: `" + x["new_sha256"] + "`",
                  ""]
    lines += ["## Release gate",
              "Programmatic source links, editable PPTX parts, embedded font and page-count checks passed.",
              "Contact sheets are review aids. Review every rendered slide at full resolution",
              "for clipping, footnotes, charts and line wrapping before merging/deploying.",
              "The original research calculations and figures were not edited.",
              "Google Drive copies are NOT updated by this GitHub-only workflow.",
              ""]
    (REVIEW / "ARCHIVO_REISSUE_QA_20261106.md").write_text("\n".join(lines))
    print(json.dumps(CHECKED, indent=2))

if __name__ == "__main__":
    main()

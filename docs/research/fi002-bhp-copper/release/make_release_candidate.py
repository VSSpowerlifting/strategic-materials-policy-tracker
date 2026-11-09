#!/usr/bin/env python3
"""Derive an FI002 public-release candidate from a review copy.

RC1 derives from revision 4 and RC2 and RC3 from revision 5 (select with
--candidate; the default is rc1). The source revision stays untouched as the review
archive. RC3 builds the same PPTX as RC2 and adds clickable source links to the PDF
(see SOURCE_LINKS); it changes no text, figure or layout.
The candidate is a byte-level derivative:
it removes the draft badge, the cover review notice and the internal editorial
labels in speaker notes, and maps the master's Arial bullet font to Archivo.
Every other package part and XML byte must be identical to the source; the
script proves that before it writes anything. It then exports the PDF with
LibreOffice using the installed Archivo faces, audits it against the source
PDF, renders each slide and builds the contact sheet.

The renderer is not used: its research contract keeps the draft badge on every
slide (tests/exhibit-research.test.ts). Removing it is a human-gated release
step, and this script only prepares the candidate for that review.

Run from the repository root with a Python that has PyMuPDF, Pillow and fontTools:
    python3 docs/research/fi002-bhp-copper/release/make_release_candidate.py [--candidate rc1|rc2|rc3]
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from zipfile import ZipFile

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "scripts"))
from reissue_archivo_decks import XML_FONT, FORBIDDEN_FONT, contact_sheet  # noqa: E402

REVIEW = ROOT / "docs/research/fi002-bhp-copper/output/review"
# Each candidate names its source revision and pins both source hashes.
CANDIDATES = {
    "rc1": {"source": "revision-4", "source_stem": "SMPT_FI002_BHP_Copper_Strategy_Deck_rev4",
            "pptx_sha": "04a2cc279c77d44dc5a8c81b54c721cae7f4c375f1f79438ab6b737d72009939",
            "pdf_sha": "78343271ebfd548276d5eb54e1460fed705aa8b5a9fadbec9a09e6227b8ac1bd",
            "out": "release-candidate-1", "stem": "SMPT_FI002_BHP_Copper_Strategy_Deck_RC1",
            "sheet": "SMPT_FI002_RC1_contact_sheet.png"},
    "rc2": {"source": "revision-5", "source_stem": "SMPT_FI002_BHP_Copper_Strategy_Deck_rev5",
            "pptx_sha": "071a67e82a2fcb3b0031ad18ce1c2ec93127d8e8d77496e70cd31e6c3ca483b6",
            "pdf_sha": "2e449d0c86262d7036b4b516846d041cb3674a215d7e5e7cb4441936c6623109",
            "out": "release-candidate-2", "stem": "SMPT_FI002_BHP_Copper_Strategy_Deck_RC2",
            "sheet": "SMPT_FI002_RC2_contact_sheet.png"},
    # RC3: the RC2 deck plus source hyperlinks in the PDF. The PPTX is byte-identical to RC2.
    "rc3": {"source": "revision-5", "source_stem": "SMPT_FI002_BHP_Copper_Strategy_Deck_rev5",
            "pptx_sha": "071a67e82a2fcb3b0031ad18ce1c2ec93127d8e8d77496e70cd31e6c3ca483b6",
            "pdf_sha": "2e449d0c86262d7036b4b516846d041cb3674a215d7e5e7cb4441936c6623109",
            "out": "release-candidate-3", "stem": "SMPT_FI002_BHP_Copper_Strategy_Deck_RC3",
            "sheet": "SMPT_FI002_RC3_contact_sheet.png", "links": True},
}

# Source-line phrases that become hyperlinks in the RC3 PDF, per 1-based page. Each phrase is
# text that already appears in that slide's "Source:" footer; each id is an entry of the
# revision-5 spec's evidence list, whose URL is used. A phrase must match exactly once inside
# the footer band. Pages and phrases are the only places a link can appear.
SOURCE_LINKS = {
    2: [("BHP FY2026 results presentation", "S01"), ("Annual Report 2026", "S03"),
        ("World Bank CMO October 2026", "S12"), ("Goldman Sachs revision as publicly reported", "S18"),
        ("SMPT calculations", "SMPT")],
    3: [("World Bank CMO October 2026, Table 1", "S12"), ("FinancialJuice", "S18"),
        ("Reuters via Business Recorder", "S20"), ("Goldman Sachs Exchanges, 23 October 2026", "S16")],
    4: [("BHP FY2026 results presentation", "S01"), ("exchange release", "S02"),
        ("BHP Annual Report 2026", "S03")],
    5: [("BHP FY2026 results presentation", "S01"), ("BHP Q1 FY2027 operational review", "S05"),
        ("SMPT Price_Sensitivity calculations", "SMPT")],
    6: [("BHP Q1 FY2027 operational review guidance", "S05"), ("SMPT methodology proxy calculation", "SMPT")],
    7: [("BHP FY2026 results presentation", "S01"), ("BHP Escondida permit submission, March 2026", "S07"),
        ("SEIA index, retrieved 5 November 2026", "S17")],
    8: [("BHP FY2026 results presentation", "S01"),
        ("SMPT methodology and Threshold_Sensitivities calculations", "SMPT")],
    9: [("SMPT Threshold_Sensitivities calculations", "SMPT"), ("BHP FY2026 results presentation", "S01")],
    10: [("BHP Annual Report 2026", "S03"), ("BHP FY2026 results presentation", "S01")],
    11: [("BHP FY2026 results presentation", "S01"), ("Annual Report 2026", "S03"), ("SMPT methodology", "SMPT")],
}
FOOTER_BAND = (0, 500, 960, 522)  # the source line sits at y 505-516 on every content page


def select(key: str) -> None:
    global SRC_PPTX, SRC_PDF, SRC_SHA, SRC_PDF_SHA, OUT, STEM, SHEET, WITH_LINKS
    c = CANDIDATES[key]
    WITH_LINKS = bool(c.get("links"))
    src = REVIEW / c["source"]
    SRC_PPTX, SRC_PDF = src / (c["source_stem"] + ".pptx"), src / (c["source_stem"] + ".pdf")
    SRC_SHA, SRC_PDF_SHA = c["pptx_sha"], c["pdf_sha"]
    OUT, STEM, SHEET = REVIEW / c["out"], c["stem"], c["sheet"]


select("rc1")
SLIDES = 11

DRAFT = "DRAFT · REVIEW GATES PENDING"
REMOVED_SHAPES = {"frame:draft-badge", "frame:cover-notice"}
# Internal labels in speaker notes, removed verbatim. Evidence titles, URLs and
# locators are kept.
NOTE_LABELS = [
    re.compile(r"^Pattern: [a-z-]+\. "),
    re.compile(r"Classification: research\. "),
    re.compile(re.escape(DRAFT + ". ")),
    re.compile(re.escape("Publication authorization is not granted by this tool. ")),
    re.compile(re.escape(" Review gates A–E pending.") + r"$"),
    re.compile(re.escape(" No QC record attached; review gates A–E are pending.") + r"$"),
]
LEFTOVER = re.compile(r"DRAFT|REVIEW GATES|Review gates|Classification:|Pattern:|authorization|QC record")
SP = re.compile(rb"<p:sp>(?:(?!<p:sp>).)*?</p:sp>", re.S)
SHAPE_NAME = re.compile(rb'<p:cNvPr id="\d+" name="([^"]*)"')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def strip_shapes(xml: bytes) -> tuple[bytes, list[str]]:
    removed: list[str] = []

    def drop(m: re.Match) -> bytes:
        name = SHAPE_NAME.search(m.group(0))
        if name and name.group(1).decode() in REMOVED_SHAPES:
            removed.append(name.group(1).decode())
            return b""
        return m.group(0)

    return SP.sub(drop, xml), removed


def strip_notes(xml: bytes) -> tuple[bytes, int]:
    texts = re.findall(rb"<a:t>([^<]*)</a:t>", xml)
    body = texts[0].decode()
    cleaned = body
    hits = 0
    for label in NOTE_LABELS:
        cleaned, n = label.subn("", cleaned)
        hits += n
    if cleaned.startswith("Cover. "):
        cleaned = "Cover."
    if LEFTOVER.search(cleaned):
        raise RuntimeError("Internal label left in notes: " + cleaned[:200])
    out = xml.replace(b"<a:t>" + texts[0] + b"</a:t>", b"<a:t>" + cleaned.encode() + b"</a:t>", 1)
    return out, hits


def build_pptx() -> tuple[bytes, dict]:
    original = SRC_PPTX.read_bytes()
    if sha(original) != SRC_SHA:
        raise RuntimeError(f"{SRC_PPTX.name} hash changed; refusing to derive {STEM}")
    if sha(SRC_PDF.read_bytes()) != SRC_PDF_SHA:
        raise RuntimeError(f"{SRC_PDF.name} hash changed; refusing to derive {STEM}")
    output = io.BytesIO()
    log = {"shapes_removed": {}, "note_labels_removed": 0, "font_replacements": {}}
    with ZipFile(io.BytesIO(original)) as zi, ZipFile(output, "w") as zo:
        for info in zi.infolist():
            data = zi.read(info.filename)
            name = info.filename
            if re.fullmatch(r"ppt/slides/slide\d+\.xml", name):
                data, removed = strip_shapes(data)
                if len(removed) != 1:
                    raise RuntimeError(f"{name}: expected one review shape, removed {removed}")
                log["shapes_removed"][name] = removed[0]
            elif re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name):
                data, hits = strip_notes(data)
                log["note_labels_removed"] += hits
            if name.startswith("ppt/") and name.endswith((".xml", ".rels")):
                data, n = XML_FONT.subn(rb"\1Archivo\3", data)
                if n:
                    log["font_replacements"][name] = n
                if FORBIDDEN_FONT.search(data):
                    raise RuntimeError("Legacy typeface remains in " + name)
            zo.writestr(info, data)
    rc = output.getvalue()
    verify_diff(original, rc)
    return rc, log


def normalise(name: str, data: bytes) -> bytes:
    data = re.sub(rb'typeface="[^"]+"', b'typeface="FONT"', data)
    if re.fullmatch(r"ppt/slides/slide\d+\.xml", name):
        data, _ = strip_shapes(data)
    if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name):
        data = re.sub(rb"(<a:t>)[^<]*(</a:t>)", rb"\1TEXT\2", data, count=1)
    return data


def verify_diff(before: bytes, after: bytes) -> None:
    with ZipFile(io.BytesIO(before)) as old, ZipFile(io.BytesIO(after)) as new:
        if old.namelist() != new.namelist():
            raise RuntimeError("Package part list changed")
        for name in old.namelist():
            a, b = old.read(name), new.read(name)
            if a == b:
                continue
            if not name.endswith((".xml", ".rels")):
                raise RuntimeError("Binary part changed: " + name)
            if normalise(name, a) != normalise(name, b):
                raise RuntimeError("Unexpected XML change in " + name)
            if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name):
                ta = re.findall(rb"<a:t>([^<]*)</a:t>", a)[0].decode()
                tb = re.findall(rb"<a:t>([^<]*)</a:t>", b)[0].decode()
                for url in re.findall(r"https?://\S+", ta):
                    if url not in tb:
                        raise RuntimeError(f"{name}: evidence URL lost: {url}")
        for name in new.namelist():
            if name.endswith(".xml") and re.search(rb"DRAFT|REVIEW GATES", new.read(name)):
                raise RuntimeError("Draft text remains in " + name)
        if b"RCA pending" not in new.read("ppt/slides/slide7.xml"):
            raise RuntimeError("Research text 'RCA pending' was lost on slide 7")


def soffice() -> str:
    for c in ("soffice", "libreoffice", "/Applications/LibreOffice.app/Contents/MacOS/soffice"):
        p = shutil.which(c) or (c if Path(c).is_file() else None)
        if p:
            return p
    raise RuntimeError("LibreOffice not found")


ARCHIVO_DIR = Path.home() / "Library/Fonts/smpt-archivo"
ARCHIVO_FACES = ("Archivo-Regular.ttf", "Archivo-Medium.ttf", "Archivo-SemiBold.ttf", "Archivo-Bold.ttf")


def export_pdf(pptx: Path) -> Path:
    # LibreOffice on macOS resolves fonts through CoreText, which does not see faces in a
    # subfolder of ~/Library/Fonts. Installing them in the temporary profile's user/fonts
    # folder makes LibreOffice register them for this export only.
    with tempfile.TemporaryDirectory(prefix="smpt-lo-") as tmp:
        t = Path(tmp)
        fonts = t / "profile/user/fonts"
        fonts.mkdir(parents=True)
        for face in ARCHIVO_FACES:
            if not (ARCHIVO_DIR / face).is_file():
                raise RuntimeError(f"Archivo face missing: {ARCHIVO_DIR / face}")
            shutil.copy2(ARCHIVO_DIR / face, fonts / face)
        subprocess.run([soffice(), "-env:UserInstallation=" + (t / "profile").as_uri(), "--headless",
                        "--convert-to", 'pdf:impress_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}',
                        "--outdir", str(t), str(pptx)], check=True, timeout=240, capture_output=True)
        pdf = t / (pptx.stem + ".pdf")
        if fitz.open(pdf).page_count != SLIDES:
            raise RuntimeError("Unexpected PDF page count")
        target = pptx.with_suffix(".pdf")
        shutil.copy2(pdf, target)
    return target


def expected_links() -> dict[int, list[tuple[str, str, str]]]:
    spec = json.loads((REVIEW / "revision-5/SMPT_FI002_BHP_Copper_Strategy_Deck_rev5.spec.json").read_text())
    url = {e["id"]: e["url"] for e in spec["evidence"]}
    return {pg: [(text, ev, url[ev]) for text, ev in items] for pg, items in SOURCE_LINKS.items()}


def add_source_links(pdf: Path) -> list[dict]:
    """Add URI link annotations over source-line phrases. Incremental save: every byte of the
    LibreOffice export, including the tagged structure, stays; only annotations are appended."""
    doc = fitz.open(pdf)
    added = []
    for pg, items in expected_links().items():
        page = doc[pg - 1]
        band = fitz.Rect(*FOOTER_BAND)
        for text, ev, uri in items:
            hits = [r for r in page.search_for(text, clip=band)]
            if len(hits) != 1:
                raise RuntimeError(f"Page {pg}: {text!r} matched {len(hits)} times in the source line")
            page.insert_link({"kind": fitz.LINK_URI, "from": hits[0], "uri": uri})
            added.append({"page": pg, "text": text, "evidence_id": ev, "uri": uri,
                          "rect": [round(v, 1) for v in hits[0]]})
    doc.saveIncr()
    doc.close()
    return added


def audit_links(pdf: Path) -> list[dict]:
    """Every link annotation must be one we expect, over exactly its phrase, and none may be missing."""
    doc = fitz.open(pdf)
    expected = expected_links()
    found = []
    for i, page in enumerate(doc, 1):
        got = [l for l in page.get_links() if l["kind"] == fitz.LINK_URI]
        want = expected.get(i, [])
        if len(got) != len(want):
            raise RuntimeError(f"Page {i}: {len(got)} links, expected {len(want)}")
        by_text = {t: (ev, u) for t, ev, u in want}
        for link in got:
            covered = re.sub(r"\s+", " ", page.get_textbox(link["from"])).strip()
            match = [t for t in by_text if t == covered or t in covered]
            if not match:
                raise RuntimeError(f"Page {i}: link rect covers {covered!r}, not a source phrase")
            if by_text[max(match, key=len)][1] != link["uri"]:
                raise RuntimeError(f"Page {i}: {covered!r} links to {link['uri']}")
            found.append({"page": i, "text": covered, "uri": link["uri"]})
    return found


def audit_pdf(pdf: Path) -> dict:
    """Stricter than reissue_archivo_decks.audit_pdf: page text must equal the source exactly,
    ignoring whitespace, once the removed badge string is taken out."""
    before, after = fitz.open(SRC_PDF), fitz.open(pdf)
    if before.page_count != SLIDES or after.page_count != SLIDES:
        raise RuntimeError("PDF page count mismatch")
    fonts = sorted({f[3] for pg in after for f in pg.get_fonts(full=True)})
    if not fonts or not all("Archivo" in f for f in fonts):
        raise RuntimeError("Non-Archivo font embedded: " + repr(fonts))
    squash = lambda t: re.sub(r"\s+", "", t)
    for i, (o, n) in enumerate(zip(before, after), 1):
        expected = squash(o.get_text()).replace(squash(DRAFT), "", 1)
        if squash(n.get_text()) != expected:
            raise RuntimeError(f"Page {i}: text differs from the source beyond the removed badge")
        if re.search(r"DRAFT|REVIEW GATES", n.get_text()):
            raise RuntimeError(f"Page {i}: draft text remains")
    links = lambda d: [sorted({l["uri"] for l in pg.get_links() if l.get("uri")}) for pg in d]
    if WITH_LINKS:
        if sum(map(len, links(before))):
            raise RuntimeError("Source PDF unexpectedly already has links")
        audit_links(pdf)
    elif links(before) != links(after):
        raise RuntimeError("PDF link set differs from the source")
    return {"pages": SLIDES, "embedded_fonts": fonts, "links": sum(len(l) for l in links(after)),
            "text_check": f"each page equals {SRC_PDF.name} minus the badge (whitespace ignored)",
            "tagged": bool(after.pdf_catalog() and "StructTreeRoot" in after.xref_object(after.pdf_catalog())),
            "title": after.metadata.get("title"), "pdf_sha256": sha(pdf.read_bytes())}


def renders(pdf: Path) -> list[str]:
    folder = OUT / "renders"
    folder.mkdir(exist_ok=True)
    names = []
    for i, page in enumerate(fitz.open(pdf), 1):
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        path = folder / f"slide-{i:02d}.png"
        Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(path, optimize=True)
        names.append(path.name)
    return names


def main() -> None:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--candidate", choices=sorted(CANDIDATES), default="rc1")
    select(ap.parse_args().candidate)
    if OUT.exists() and any(OUT.glob("*.pptx")):
        raise RuntimeError(f"{OUT} already holds a candidate; use a new RC number instead of overwriting")
    rc, log = build_pptx()
    OUT.mkdir(parents=True, exist_ok=True)
    pptx = OUT / (STEM + ".pptx")
    pptx.write_bytes(rc)
    pdf = export_pdf(pptx)
    link_log = add_source_links(pdf) if WITH_LINKS else None
    pdf_audit = audit_pdf(pdf)
    sheet = OUT / SHEET
    contact_sheet(pdf, sheet)
    manifest = {
        "deck": pptx.name,
        "derived_from": {"path": str(SRC_PPTX.relative_to(ROOT)), "sha256": SRC_SHA,
                         "pdf": str(SRC_PDF.relative_to(ROOT)), "pdf_sha256": SRC_PDF_SHA},
        "pptx_sha256": sha(rc),
        "pdf": pdf.name,
        **{k: v for k, v in pdf_audit.items() if k != "pdf_sha256"},
        "pdf_sha256": pdf_audit["pdf_sha256"],
        "contact_sheet": sheet.name,
        "contact_sheet_sha256": sha(sheet.read_bytes()),
        "renders": renders(pdf),
        **({"source_links": link_log,
            "source_links_note": "URI annotations over source-line text; no visual change. Annotations are not "
                                 "tagged in the PDF structure tree. The PPTX source lines are not hyperlinked."}
           if link_log is not None else {}),
        "changes": log,
        "unchanged": f"all other package parts and XML bytes are identical to {SRC_PPTX.name} (verified)",
        "research_cutoff": "2026-11-05",
        "review_gates": "agent QC recorded; human approval pending",
        "publication_authorization": "pending human approval",
        "tools": {"libreoffice": subprocess.run([soffice(), "--version"], capture_output=True, text=True).stdout.strip(),
                  "pymupdf": fitz.VersionBind},
    }
    (OUT / (STEM + ".manifest.json")).write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

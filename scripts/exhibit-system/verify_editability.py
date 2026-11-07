#!/usr/bin/env python3
"""Editability verification for the SMPT exhibit-system decks.

    npm run exhibits:verify            # structural + LibreOffice tiers
    python3 scripts/exhibit-system/verify_editability.py --structural-only
    python3 scripts/exhibit-system/verify_editability.py --deck out.pptx --manifest out.manifest.json
        (research mode: structural tier only, prints results, writes nothing;
         the synthetic notice must be absent and visual_text comes from the manifest)

Three tiers, reported separately and never merged:

1. structural   - OOXML inspection (stdlib only). For every slide: every named
                  object in element-manifest.json exists in the slide XML and
                  nothing unnamed was added; zero p:pic (raster) elements; every
                  chart graphicFrame resolves to a chart part whose
                  c:externalData points at an embedded .xlsx that opens and has a
                  worksheet; every helper series (name starts "helper") is
                  a:noFill with deleted labels; every table element is an a:tbl;
                  every fixture `visual_text` string appears verbatim in a:t or
                  c:v text; every non-cover slide carries the synthetic notice;
                  every explicit latin typeface is Archivo.
2. libreoffice  - headless soffice converts each deck to PDF (page count must
                  equal slide count) and re-saves it as PPTX; the re-saved file
                  must still contain the same number of chart parts and no
                  p:pic. Skipped (and reported as skipped) if soffice is absent.
3. powerpoint   - manual open / Edit Data / save in Microsoft PowerPoint.
                  NOT PERFORMED by this script. Recorded as "not-performed".

Writes docs/design/presentations/exhibit-system/editability-report.json.
The report holds no timestamps or machine paths so it is reproducible.
Exit code 1 if any structural or LibreOffice check fails.
"""
from __future__ import annotations

import hashlib
import argparse
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from tools import find_tool

REPO = Path(__file__).resolve().parents[2]
SYSTEM = REPO / "docs" / "design" / "presentations" / "exhibit-system"
MANIFEST = SYSTEM / "element-manifest.json"
FIXTURES = SYSTEM / "fixtures"
REPORT = SYSTEM / "editability-report.json"

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
R_ID = f"{{{NS['r']}}}id"
SYNTHETIC_NOTICE = "Synthetic demonstration data"
FONT = "Archivo"
CHART_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"
PACKAGE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package"


def rels_of(z: zipfile.ZipFile, part: str) -> dict[str, tuple[str, str]]:
    """Relationship id -> (type, resolved part name) for an OOXML part."""
    d, f = os.path.split(part)
    rp = f"{d}/_rels/{f}.rels"
    if rp not in z.namelist():
        return {}
    out: dict[str, tuple[str, str]] = {}
    for r in ET.fromstring(z.read(rp)).findall("rel:Relationship", NS):
        tgt = r.get("Target", "")
        if tgt.startswith("/"):
            resolved = tgt.lstrip("/")
        else:
            resolved = os.path.normpath(os.path.join(d, tgt)).replace(os.sep, "/")
        out[r.get("Id", "")] = (r.get("Type", ""), resolved)
    return out


def slide_parts(z: zipfile.ZipFile) -> list[str]:
    names = [n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]
    return sorted(names, key=lambda n: int(re.search(r"(\d+)", n.rsplit("/", 1)[1]).group(1)))


def texts(root: ET.Element) -> str:
    return "\n".join((t.text or "") for t in root.iter(f"{{{NS['a']}}}t"))


def chart_values(root: ET.Element) -> list[str]:
    return [(v.text or "") for v in root.iter(f"{{{NS['c']}}}v")]


def fmt_number_variants(s: str) -> set[str]:
    """A c:v cache stores raw numbers; accept '1250' for a visual_text of '1,250'."""
    return {s, s.replace(",", "")}


def check_chart(z: zipfile.ZipFile, part: str, issues: list[str]) -> dict:
    root = ET.fromstring(z.read(part))
    info = {"part": part, "embedded_workbook": False, "series": 0, "helper_series": 0}
    ext = root.find("c:externalData", NS)
    rels = rels_of(z, part)
    if ext is None or ext.get(R_ID) not in rels:
        issues.append(f"{part}: no c:externalData link (Edit Data would fail)")
    else:
        typ, target = rels[ext.get(R_ID, "")]
        if target not in z.namelist():
            issues.append(f"{part}: embedded workbook {target} missing")
        else:
            try:
                inner = zipfile.ZipFile(io.BytesIO(z.read(target)))
                if not any(n.startswith("xl/worksheets/") for n in inner.namelist()):
                    issues.append(f"{part}: embedded workbook has no worksheet")
                else:
                    info["embedded_workbook"] = True
            except zipfile.BadZipFile:
                issues.append(f"{part}: embedded workbook is not a valid zip")
    for ser in root.iter(f"{{{NS['c']}}}ser"):
        info["series"] += 1
        name_el = ser.find("c:tx//c:v", NS)
        name = name_el.text if name_el is not None and name_el.text else ""
        if not name.startswith("helper"):
            continue
        info["helper_series"] += 1
        sppr = ser.find("c:spPr", NS)
        if sppr is None or sppr.find("a:noFill", NS) is None:
            issues.append(f"{part}: helper series '{name}' is filled (must be noFill)")
        dl = ser.find("c:dLbls", NS)
        if dl is None or dl.find("c:delete", NS) is None or dl.find("c:delete", NS).get("val") != "1":
            issues.append(f"{part}: helper series '{name}' has visible data labels")
    for lat in root.iter(f"{{{NS['a']}}}latin"):
        tf = lat.get("typeface", "")
        if tf and tf != FONT and not tf.startswith("+"):
            issues.append(f"{part}: chart typeface {tf}")
    return info


def structural(deck: Path, manifest_slides: list[dict], mode: str = "synthetic") -> dict:
    """mode "synthetic": gallery/demo decks; visual_text comes from FIXTURES and the
    synthetic notice must be present. mode "research": visual_text comes from each
    manifest slide entry and the synthetic notice must be ABSENT."""
    z = zipfile.ZipFile(deck)
    parts = slide_parts(z)
    deck_issues: list[str] = []
    if len(parts) != len(manifest_slides):
        deck_issues.append(f"{len(parts)} slides in file, {len(manifest_slides)} in manifest")
    slides_out = []
    for idx, part in enumerate(parts):
        issues: list[str] = []
        man = manifest_slides[idx] if idx < len(manifest_slides) else {"pattern": "?", "elements": []}
        root = ET.fromstring(z.read(part))
        tree = root.find("p:cSld/p:spTree", NS)
        rels = rels_of(z, part)

        named: dict[str, str] = {}
        for el in tree if tree is not None else []:
            tag = el.tag.split("}")[1]
            if tag in ("nvGrpSpPr", "grpSpPr"):
                continue
            c = el.find(".//p:cNvPr", NS)
            nm = c.get("name", "") if c is not None else ""
            if not nm:
                issues.append(f"unnamed top-level <{tag}>")
                continue
            named[nm] = tag

        expected = {e["name"]: e for e in man["elements"]}
        missing = sorted(set(expected) - set(named))
        extra = sorted(set(named) - set(expected))
        if missing:
            issues.append(f"manifest elements missing from slide: {', '.join(missing)}")
        if extra:
            issues.append(f"slide objects not in manifest: {', '.join(extra)}")

        pics = len(list(root.iter(f"{{{NS['p']}}}pic")))
        if pics:
            issues.append(f"{pics} raster p:pic element(s)")

        charts = []
        chart_text: list[str] = []
        for gf in root.iter(f"{{{NS['p']}}}graphicFrame"):
            nm = gf.find(".//p:cNvPr", NS).get("name", "")
            gd = gf.find("a:graphic/a:graphicData", NS)
            uri = gd.get("uri", "") if gd is not None else ""
            exp = expected.get(nm)
            if uri.endswith("/chart"):
                cref = gd.find("c:chart", NS)
                rid = cref.get(R_ID, "") if cref is not None else ""
                if rid not in rels or rels[rid][0] != CHART_REL:
                    issues.append(f"{nm}: chart relationship does not resolve")
                    continue
                info = check_chart(z, rels[rid][1], issues)
                info["name"] = nm
                charts.append(info)
                chart_text += chart_values(ET.fromstring(z.read(rels[rid][1])))
                if exp and exp["kind"] != "chart":
                    issues.append(f"{nm}: manifest says {exp['kind']}, file has a chart")
                if exp and exp["tier"] == "native-chart-with-helper-series" and info["helper_series"] == 0:
                    issues.append(f"{nm}: manifest declares helper series, none found")
                if exp and exp["tier"] == "native-chart" and info["helper_series"] > 0:
                    issues.append(f"{nm}: helper series present but tier is native-chart")
            elif uri.endswith("/table"):
                if gd.find("a:tbl", NS) is None:
                    issues.append(f"{nm}: table frame without a:tbl")
                if exp and exp["kind"] != "table":
                    issues.append(f"{nm}: manifest says {exp['kind']}, file has a table")
            else:
                issues.append(f"{nm}: unexpected graphicFrame {uri}")

        for lat in root.iter(f"{{{NS['a']}}}latin"):
            tf = lat.get("typeface", "")
            if tf and tf != FONT and not tf.startswith("+"):
                issues.append(f"typeface {tf}")

        slide_text = texts(root)
        haystack = slide_text + "\n" + "\n".join(chart_text)
        if mode == "research" and "DRAFT · REVIEW GATES PENDING" not in slide_text:
            issues.append("research draft badge absent; technical QC cannot authorize publication")
        pattern = man.get("pattern", "?")
        visual_checked = 0
        if pattern != "cover":
            wanted: list[str] | None = None
            if mode == "research":
                if SYNTHETIC_NOTICE in slide_text:
                    issues.append("synthetic-data notice present on a research slide")
                if not man.get("evidence_refs"):
                    issues.append("research slide has no evidence_refs in its manifest entry")
                wanted = man.get("visual_text")
                if wanted is None:
                    issues.append("research slide has no visual_text in its manifest entry")
            else:
                if SYNTHETIC_NOTICE not in slide_text:
                    issues.append("synthetic-data notice absent")
                fx = FIXTURES / f"{pattern}.json"
                if not fx.exists():
                    issues.append(f"fixture {fx.name} not found")
                else:
                    wanted = json.loads(fx.read_text())["visual_text"]
            for s in wanted or []:
                visual_checked += 1
                if not any(v in haystack for v in fmt_number_variants(s)):
                    issues.append(f"visual_text not found: {s!r}")

        tiers: dict[str, int] = {}
        for e in man["elements"]:
            tiers[e["tier"]] = tiers.get(e["tier"], 0) + 1
        slides_out.append({
            "slide": idx + 1,
            "pattern": pattern,
            "elements": len(named),
            "tiers": dict(sorted(tiers.items())),
            "charts": [{k: c[k] for k in ("name", "series", "helper_series", "embedded_workbook")} for c in charts],
            "raster_elements": pics,
            "visual_text_checked": visual_checked,
            "status": "fail" if issues else "pass",
            "issues": issues,
        })
    failed = bool(deck_issues) or any(s["status"] == "fail" for s in slides_out)
    return {"status": "fail" if failed else "pass", "issues": deck_issues, "slides": slides_out}


def find_soffice() -> str | None:
    return find_tool("soffice")


def pdf_pages(pdf: Path) -> int:
    data = pdf.read_bytes()
    return len(re.findall(rb"/Type\s*/Page(?![s\w])", data))


def libreoffice(deck: Path, slide_count: int, chart_count: int) -> dict:
    soffice = find_soffice()
    if not soffice:
        return {"status": "skipped", "reason": "soffice not found via SOFFICE, PATH or standard install locations"}
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        env = dict(os.environ)
        prof = f"-env:UserInstallation=file://{t / 'profile'}"
        issues: list[str] = []
        try:
            for fmt, outdir in (("pdf", t / "pdf"), ("pptx", t / "resave")):
                outdir.mkdir()
                subprocess.run(
                    [soffice, "--headless", prof, "--convert-to", fmt, "--outdir", str(outdir), str(deck)],
                    check=True, capture_output=True, timeout=300, env=env,
                )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            return {"status": "fail", "issues": [f"soffice failed: {type(e).__name__}"]}
        pdf = t / "pdf" / (deck.stem + ".pdf")
        pages = pdf_pages(pdf) if pdf.exists() else 0
        if pages != slide_count:
            issues.append(f"PDF has {pages} pages, deck has {slide_count} slides")
        resaved = t / "resave" / deck.name
        re_charts = re_pics = 0
        if not resaved.exists():
            issues.append("re-saved PPTX not produced")
        else:
            rz = zipfile.ZipFile(resaved)
            re_charts = len([n for n in rz.namelist() if re.fullmatch(r"ppt/charts/chart\d+\.xml", n)])
            for p in slide_parts(rz):
                re_pics += len(list(ET.fromstring(rz.read(p)).iter(f"{{{NS['p']}}}pic")))
            if re_charts != chart_count:
                issues.append(f"re-saved PPTX has {re_charts} chart parts, original {chart_count}")
            if re_pics:
                issues.append(f"re-saved PPTX contains {re_pics} raster p:pic element(s)")
        return {
            "status": "fail" if issues else "pass",
            "pdf_pages": pages,
            "resaved_chart_parts": re_charts,
            "resaved_raster_elements": re_pics,
            "issues": issues,
        }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--structural-only", action="store_true")
    ap.add_argument("--check", action="store_true", help="verify only; do not write the report")
    ap.add_argument("--deck", type=Path, help="research mode: a deck built by research-deck.ts")
    ap.add_argument("--manifest", type=Path, help="research mode: the deck's <out>.manifest.json")
    args = ap.parse_args()

    if args.deck or args.manifest:
        if not (args.deck and args.manifest):
            print("--deck and --manifest must be given together", file=sys.stderr)
            return 2
        man = json.loads(args.manifest.read_text())
        if man.get("classification") != "research":
            print(f"{args.manifest}: classification is not research", file=sys.stderr)
            return 2
        actual = hashlib.sha256(args.deck.read_bytes()).hexdigest()
        if man.get("sha256") != actual:
            print("research manifest hash does not match deck", file=sys.stderr)
            return 1
        s = structural(args.deck, man["slides"], mode="research")
        print(f"{args.deck}: structural {s['status']} (research mode; LibreOffice and PowerPoint tiers not run)")
        for sl in s["slides"]:
            for i in sl["issues"]:
                print(f"  slide {sl['slide']} ({sl['pattern']}): {i}")
        for i in s["issues"]:
            print(f"  {i}")
        return 0 if s["status"] == "pass" else 1

    manifest = json.loads(MANIFEST.read_text())
    decks = []
    ok = True
    for d in manifest["decks"]:
        path = REPO / d["file"]
        s = structural(path, d["slides"])
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if d["sha256"] != actual:
            s["status"] = "fail"
            s["issues"].append("manifest hash does not match deck")
        chart_count = sum(len(x["charts"]) for x in s["slides"])
        lo = {"status": "skipped", "reason": "--structural-only"} if args.structural_only else libreoffice(
            path, len(d["slides"]), chart_count
        )
        ok = ok and s["status"] == "pass" and lo["status"] in ("pass", "skipped")
        tiers: dict[str, int] = {}
        for sl in s["slides"]:
            for k, v in sl["tiers"].items():
                tiers[k] = tiers.get(k, 0) + v
        decks.append({
            "file": d["file"],
            "sha256": actual,
            "slides": len(d["slides"]),
            "element_tiers": dict(sorted(tiers.items())),
            "structural": s,
            "libreoffice": lo,
            "powerpoint": {
                "status": "not-performed",
                "reason": "Microsoft PowerPoint was not available to this verifier. Open, Edit Data, "
                          "edit-text and save in PowerPoint must be tested manually before any claim "
                          "of PowerPoint editability beyond the structural tier.",
            },
        })
    report = {
        "note": "Generated by scripts/exhibit-system/verify_editability.py. Structural and LibreOffice "
                "tiers are automated; the PowerPoint tier is manual and has not been performed.",
        "tiers": {
            "structural": "OOXML inspection: names, zero raster, chart workbooks, helper series, tables, text, font.",
            "libreoffice": "Headless LibreOffice render to PDF and re-save to PPTX.",
            "powerpoint": "Manual open / Edit Data / save in Microsoft PowerPoint.",
        },
        "decks": decks,
    }
    for d in decks:
        print(f"{d['file']}: structural {d['structural']['status']}, libreoffice {d['libreoffice']['status']}, "
              f"powerpoint {d['powerpoint']['status']}")
        for sl in d["structural"]["slides"]:
            for i in sl["issues"]:
                print(f"  slide {sl['slide']} ({sl['pattern']}): {i}")
        for i in d["structural"]["issues"] + d["libreoffice"].get("issues", []):
            print(f"  {i}")
    if not args.check:
        REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

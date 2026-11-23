#!/usr/bin/env python3
"""Build the FI003 designed research report (PDF) and the Google Doc paste copy (HTML).

Single source: the manuscript at ../output/SMPT_FI003_MP_Materials_Research_Report.md.
Every body paragraph comes from that file. This script adds layout and a small set of
report furniture, all declared in source/README.md: the opening lede, exhibit titles,
captions, axis and status labels, the plain-language dilution example, the "What the
reviewed filings leave open" panel and table group headings. Exhibit
figures are read from the FI003 model exhibits pinned at EXHIBIT_COMMIT, the same commit
the manuscript's model links cite.

Rendering: the HTML is printed by headless Google Chrome. Fonts are Archivo (text) and
Spectral Regular (titles), located with fc-match and embedded in the HTML as data URIs;
a missing face stops the build. No font binary is stored in the repository.

Usage (from the repository root):
    python3 docs/research/fi003-mp-materials/source/build_report.py
    python3 docs/research/fi003-mp-materials/source/build_report.py --doc-html /tmp/fi003-doc.html

Environment: CHROME overrides the Chrome binary path.
"""
from __future__ import annotations

import argparse
import base64
import csv
import html
import io
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent
REPO = PACKAGE.parents[2]
MANUSCRIPT = PACKAGE / "output" / "SMPT_FI003_MP_Materials_Research_Report.md"
PDF_OUT = PACKAGE / "output" / "SMPT_FI003_MP_Materials_Research_Report.pdf"
CSS = HERE / "report.css"

sys.path.insert(0, str(REPO / "scripts" / "publication"))
from tokens import FONT_EDITORIAL, FONT_TEXT, TOKENS, hex_, neutral_hex  # noqa: E402

EXHIBIT_COMMIT = "bfd276c7e64e9c1fa91b00b08457018136201a0d"
EXHIBIT_DIR = "research/fi003/exhibits"
GITHUB_BLOB = "https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/blob"
REVIEW_DATE = "21 November 2026"  # fixed for reproducible output; change on a new review draft
CHROME_DEFAULT = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

C = {name: "#" + hex_(name) for name in TOKENS["palette"]}
C.update({f"n-{k}": "#" + neutral_hex(k) for k in ("dark", "mid", "light")})
C["s-malachite"] = TOKENS["series"]["malachite"]["hex"]


# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------

FACES = [
    (FONT_TEXT, "Regular", 400), (FONT_TEXT, "Medium", 500),
    (FONT_TEXT, "SemiBold", 600), (FONT_TEXT, "Bold", 700),
    (FONT_EDITORIAL, "Regular", 400),
]


def font_faces() -> str:
    rules = []
    for family, style, weight in FACES:
        out = subprocess.run(
            ["fc-match", "-f", "%{file}|%{family}|%{style}", f"{family}:style={style}"],
            capture_output=True, text=True, check=False,
        ).stdout
        path, fam, sty = (out.split("|") + ["", "", ""])[:3]
        if family.lower() not in fam.lower() or style.lower() not in sty.lower().replace(" ", ""):
            sys.exit(f"Missing font {family} {style} (fc-match returned {fam} {sty}). "
                     "Install it; the build does not substitute faces.")
        data = base64.b64encode(Path(path).read_bytes()).decode("ascii")
        rules.append(
            f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:normal;"
            f"src:url(data:font/ttf;base64,{data}) format('truetype');}}"
        )
    return "\n".join(rules)


# ---------------------------------------------------------------------------
# Manuscript parsing
# ---------------------------------------------------------------------------

REF_DEF = re.compile(r"^\[([a-z0-9]+)\]:\s+(\S+)\s*$")
LINK = re.compile(r"\[([^\]]+)\]\[([a-z0-9]+)\]")
CITE_TAIL = re.compile(r"\s+((?:\[[^\]]+\]\[[a-z0-9]+\](?:\s*·\s*)?)+)$")


class Manuscript:
    def __init__(self, text: str):
        self.refs: dict[str, str] = {}
        self.title = ""
        self.meta: list[str] = []
        self.blocks: list[tuple[str, object]] = []
        lines = text.split("\n")
        body: list[str] = []
        for line in lines:
            m = REF_DEF.match(line)
            if m:
                self.refs[m.group(1)] = m.group(2)
            else:
                body.append(line)
        i = 0
        while i < len(body):
            line = body[i]
            if not line.strip():
                i += 1
                continue
            if line.startswith("# "):
                self.title = line[2:].strip()
            elif line.startswith("## "):
                self.blocks.append(("h2", line[3:].strip()))
            elif line.startswith("|"):
                rows = []
                while i < len(body) and body[i].startswith("|"):
                    rows.append([c.strip() for c in body[i].strip()[1:-1].split("|")])
                    i += 1
                self.blocks.append(("table", [rows[0]] + rows[2:]))
                continue
            elif line.strip() == "---":
                self.blocks.append(("hr", None))
            elif not self.title or (line.startswith("**") and line.endswith("**") and not self.blocks):
                self.meta.append(line.strip("*").strip())
            else:
                self.blocks.append(("p", line.strip()))
            i += 1
        for _, value in self.blocks:
            if isinstance(value, str):
                for _, ref in LINK.findall(value):
                    if ref not in self.refs:
                        sys.exit(f"Undefined link reference [{ref}]")

    @property
    def paragraphs(self) -> list[str]:
        return [v for k, v in self.blocks if k == "p"]

    @property
    def headings(self) -> list[str]:
        return [v for k, v in self.blocks if k == "h2"]

    @property
    def table(self) -> list[list[str]]:
        return next(v for k, v in self.blocks if k == "table")


def split_cites(text: str) -> tuple[str, list[tuple[str, str]]]:
    m = CITE_TAIL.search(text)
    if not m:
        return text, []
    return text[: m.start()], LINK.findall(m.group(1))


def inline(text: str, refs: dict[str, str]) -> str:
    out = html.escape(text, quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)
    return LINK.sub(lambda m: f'<a href="{html.escape(refs[m.group(2)])}">{m.group(1)}</a>', out)


def cite_html(cites: list[tuple[str, str]], refs: dict[str, str]) -> str:
    return "".join(
        f'<span class="cite"><a href="{html.escape(refs[r])}">{html.escape(label, quote=False)}</a></span>'
        for label, r in cites
    )


# ---------------------------------------------------------------------------
# Exhibit data (pinned commit)
# ---------------------------------------------------------------------------

def exhibit_csv(name: str) -> list[dict[str, str]]:
    raw = subprocess.run(
        ["git", "-C", str(REPO), "show", f"{EXHIBIT_COMMIT}:{EXHIBIT_DIR}/{name}.csv"],
        capture_output=True, text=True, check=True,
    ).stdout
    return list(csv.DictReader(io.StringIO(raw)))


def exhibit_url(name: str) -> str:
    return f"{GITHUB_BLOB}/{EXHIBIT_COMMIT}/{EXHIBIT_DIR}/{name}.csv"


def by(rows: list[dict[str, str]], key: str) -> dict[str, dict[str, str]]:
    return {r[key]: r for r in rows}


def fmt(value: float, places: int = 1) -> str:
    return f"{value:,.{places}f}".replace("-", "−")


# ---------------------------------------------------------------------------
# SVG helpers
# ---------------------------------------------------------------------------

def t(x, y, s, size=10.5, weight=400, fill=None, anchor="start", family=None, extra=""):
    fill = fill or C["graphite"]
    fam = family or FONT_TEXT
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>'
            f'{html.escape(s, quote=False)}</text>')


def svg(width, height, body, label):
    return (f'<svg class="chart" viewBox="0 0 {width} {height}" role="img" '
            f'aria-label="{html.escape(label)}" xmlns="http://www.w3.org/2000/svg">'
            '<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" '
            'patternTransform="rotate(45)"><rect width="5" height="5" fill="' + C["plate"] + '"/>'
            '<line x1="0" y1="0" x2="0" y2="5" stroke="' + C["n-dark"] + '" stroke-width="1.6"/></pattern>'
            '<pattern id="hatch-red" width="6" height="6" patternUnits="userSpaceOnUse" '
            'patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="'
            + C["hematite"] + '" stroke-width="0.8" opacity="0.45"/></pattern></defs>'
            + body + "</svg>")


# ---------------------------------------------------------------------------
# Exhibits
# ---------------------------------------------------------------------------

def exhibit(num: int, title: str, inner: str, caption: str, sources: list[tuple[str, str]],
            cls: str = "") -> str:
    src = " · ".join(f'<a href="{html.escape(u)}">{html.escape(l, quote=False)}</a>' for l, u in sources)
    return (f'<figure class="exhibit {cls}"><figcaption class="ex-title">'
            f'<span class="ex-num">Exhibit {num}</span>{html.escape(title, quote=False)}</figcaption>'
            f'{inner}<p class="ex-caption">{caption}</p>'
            f'<p class="ex-source">Sources: {src}</p></figure>')


def ex_sequence(refs) -> str:
    """Exhibit 1: three instruments on one scale, never stacked or summed."""
    W, RH = 640, 128
    x0, x1 = 250, 612
    scale = (x1 - x0) / 1000
    axis_y = 14 + RH * 3 - 6
    H = axis_y + 34
    b = []
    for v in (0, 250, 500, 750, 1000):
        x = x0 + v * scale
        b.append(f'<line x1="{x:.1f}" y1="{axis_y - 6}" x2="{x:.1f}" y2="{axis_y}" stroke="{C["borderStrong"]}" stroke-width="0.8"/>')
        b.append(t(x, axis_y + 14, f"{v:,}", 11, fill=C["faint"], anchor="middle"))
    b.append(t(x1, axis_y + 29, "USD million, one scale for all three rows", 11, fill=C["faint"], anchor="end"))
    rows = [
        dict(name="Joint construction commitment", lines=["JPMorgan Chase Funding Inc. and", "Goldman Sachs Bank USA, with affiliates", "Required: executed by 9 July and", "binding by the 11 July closing"],
             status=["Expired undrawn, 26 August 2025.", "No cash received."], tone="ended"),
        dict(name="Common stock offering", lines=["Priced 16 July 2025 at $55 a share", "13,590,908 shares, including the", "underwriters’ option"],
             status=["Cash received, July 2025."], tone="cash"),
        dict(name="Corporate revolving credit facility", lines=["Signed 25 August 2025", "MP is parent borrower; JPMorgan", "Chase Bank is administrative agent"],
             status=["Committed capacity.", "Zero loans drawn at 30 September 2026."], tone="credit"),
    ]
    y = 14
    for r in rows:
        b.append(t(0, y + 13, r["name"], 13, 600))
        for k, line in enumerate(r["lines"]):
            b.append(t(0, y + 31 + k * 15, line, 11.5, fill=C["slate"]))
        by_ = y + 2
        bh = 36
        if r["tone"] == "ended":
            w = 1000 * scale
            b.append(f'<rect x="{x0}" y="{by_}" width="{w:.1f}" height="{bh}" fill="url(#hatch-red)" stroke="{C["hematite"]}" stroke-width="1.4" stroke-dasharray="6 3"/>')
            b.append(t(x0 + 9, by_ + 23, "At least 1,000 before reductions", 12, 600, C["hematite"]))
            sc = C["hematite"]
        elif r["tone"] == "cash":
            w = 724.2 * scale
            b.append(f'<rect x="{x0}" y="{by_}" width="{w:.1f}" height="{bh}" fill="{C["malachite"]}"/>')
            b.append(t(x0 + 9, by_ + 23, "724.2 net equity proceeds", 12, 600, C["plate"]))
            b.append(t(x0 + w + 6, by_ + 23, "747.5 gross", 11.5, fill=C["slate"]))
            sc = C["malachite"]
        else:
            lc, avail = 72 * scale, 203 * scale
            b.append(f'<rect x="{x0}" y="{by_}" width="{lc:.1f}" height="{bh}" fill="url(#hatch)" stroke="{C["graphite"]}" stroke-width="1"/>')
            b.append(f'<rect x="{x0 + lc:.1f}" y="{by_}" width="{avail:.1f}" height="{bh}" fill="{C["plate"]}" stroke="{C["graphite"]}" stroke-width="1"/>')
            tx = x0 + lc + avail + 8
            b.append(t(tx, by_ + 11, "275 commitment, 30 Sep 2026", 11.5, 600))
            b.append(t(tx, by_ + 25, "72 letters of credit, implied (hatched)", 11.5, fill=C["slate"]))
            b.append(t(tx, by_ + 39, "203 available to borrow", 11.5, fill=C["slate"]))
            sc = C["graphite"]
        sy = by_ + bh + 12
        b.append(f'<rect x="{x0}" y="{sy}" width="3" height="{13 + 15 * (len(r["status"]) - 1)}" fill="{sc}"/>')
        for k, line in enumerate(r["status"]):
            b.append(t(x0 + 9, sy + 11 + 15 * k, line, 12, 500, sc if r["tone"] != "credit" else C["graphite"]))
        y += RH
        if r is not rows[-1]:
            b.append(f'<line x1="0" y1="{y - 10}" x2="{W}" y2="{y - 10}" stroke="{C["border"]}" stroke-width="0.8"/>')
    inner = svg(W, H, "".join(b), "Financing sequence: a commitment of at least 1,000 million that expired undrawn, "
                "724.2 million of net equity proceeds received, and a 275 million revolver with 72 million of letters of credit and 203 million available.")
    caption = ("The three instruments are separate. Adding net equity proceeds to the revolver limit gives "
               "999.2, which mixes cash with borrowing capacity; the filings report that the offering and revolver "
               "reduced the commitment dollar for dollar but leave the exact cancellation calculation open.")
    return exhibit(1, "The financing sequence: one commitment lapsed, equity delivered cash, the revolver added capacity",
                   inner, caption,
                   [("Transaction agreement §§2.05–2.07", refs["s02"]), ("Underwriting agreement, Schedule B", refs["s07"]),
                    ("Credit agreement", refs["s09"]), ("2025 Form 10-K, Notes 3, 10 and 18", refs["s11"]),
                    ("September 2026 Form 10-Q, Note 8", refs["s19"]), ("Model 1.0, replacement schedule", exhibit_url("replacement"))])


def ex_banks(refs) -> str:
    uw = exhibit_csv("underwriting")
    shares = {r["bank"]: int(r["initial_shares"]) for r in uw}
    pct = {r["bank"]: float(r["initial_tranche_fraction"]) * 100 for r in uw}
    def u(bank):
        return f"{shares[bank]:,} initial shares (about {pct[bank]:.0f}%)"
    rows = [
        ("JPMorgan", "Joint provider (JPMorgan Chase Funding Inc.). J.P. Morgan says it was sole financial adviser and led the arrangement.",
         f"J.P. Morgan Securities: joint lead bookrunner; {u('J.P. Morgan Securities LLC')}",
         "JPMorgan Chase Bank: administrative and collateral agent; lead arranger and bookrunner; lender and letter-of-credit issuer"),
        ("Goldman Sachs", "Joint provider (Goldman Sachs Bank USA)",
         f"Goldman Sachs &amp; Co.: joint lead bookrunner; {u('Goldman Sachs & Co. LLC')}",
         "Goldman Sachs Bank USA: lead arranger and bookrunner; lender and letter-of-credit issuer"),
        ("Morgan Stanley", "—", f"Bookrunner; {u('Morgan Stanley & Co. LLC')}",
         "Morgan Stanley Senior Funding: lead arranger and bookrunner; lender and letter-of-credit issuer"),
        ("Citibank", "—", "—", "Co-syndication agent; lender and letter-of-credit issuer"),
        ("Bank of America", "—", "—", "BofA Securities: co-syndication agent. Bank of America, N.A.: lender and letter-of-credit issuer"),
    ]
    body = "".join(f"<tr><th scope=\"row\">{a}</th><td>{b}</td><td>{c}</td><td>{d}</td></tr>" for a, b, c, d in rows)
    inner = ('<table class="grid roles"><colgroup><col style="width:15%"><col style="width:27%"><col style="width:27%"><col style="width:31%"></colgroup>'
             '<thead><tr><th scope="col">Bank</th><th scope="col">Construction commitment, July 2025</th>'
             '<th scope="col">Stock offering, July 2025</th><th scope="col">Corporate revolver, August 2025</th></tr></thead>'
             f"<tbody>{body}</tbody></table>")
    caption = ("A dash means the bank is not named in that role in the reviewed filings. Share quantities are "
               "underwriting obligations for the initial tranche; retained positions and bank-by-bank fees are undisclosed.")
    return exhibit(2, "JPMorgan held a role in all three transactions", inner, caption,
                   [("J.P. Morgan’s transaction account", refs["s15"]), ("Prospectus supplement", refs["s06"]),
                    ("Underwriting agreement, Schedule A", refs["s07"]), ("Credit agreement, cover and signature pages", refs["s09"]),
                    ("Model 1.0, underwriting", exhibit_url("underwriting"))])


def ex_ownership(refs) -> str:
    fe = by(exhibit_csv("financing_economics"), "measure")
    before = int(fe["Basic shares before offering"]["value"])
    after = int(fe["Basic shares plus final offering only"]["value"])
    new = after - before
    share_new = float(fe["New shares as share of isolated post-offering base"]["value"])
    increase = float(fe["Increase relative to pre-offering basic shares"]["value"])
    assert new == 13_590_908, new
    W, H = 640, 150
    x0, x1 = 0, 640
    w_old = (x1 - x0) * before / after
    b = [
        f'<rect x="{x0}" y="26" width="{w_old:.1f}" height="34" fill="{C["n-dark"]}"/>',
        f'<rect x="{x0 + w_old:.1f}" y="26" width="{x1 - x0 - w_old:.1f}" height="34" fill="{C["malachite"]}"/>',
        t(x0, 18, "Basic shares on the isolated post-offering base: 177,068,724", 10.5, 600),
        t(x0 + 10, 47.5, f"Shares held before the offering: {before:,} = {100 - share_new:.2f}%", 10.5, 600, C["plate"]),
        t(x0 + w_old - 6, 76, f"Offering shares: {new:,} = {share_new:.2f}%", 10.5, 600, C["malachite"], anchor="end"),
        f'<line x1="{x0 + w_old:.1f}" y1="61" x2="{x0 + w_old:.1f}" y2="77" stroke="{C["malachite"]}" stroke-width="1"/>',
    ]
    y = 104
    b.append(t(0, y, "Ownership measure", 10, 600, C["faint"]))
    b.append(t(300, y, "Share-count measure", 10, 600, C["faint"]))
    b.append(t(0, y + 16, f"{new:,} ÷ {after:,} = {share_new:.2f}%", 11.5, 500))
    b.append(t(300, y + 16, f"{new:,} ÷ {before:,} = {increase:.2f}% more shares", 11.5, 500))
    b.append(t(0, y + 31, "of the enlarged total belongs to the new shares", 10, fill=C["slate"]))
    b.append(t(300, y + 31, "relative to the 9 July share count", 10, fill=C["slate"]))
    inner = svg(W, H, "".join(b), f"Ownership arithmetic: {before:,} prior shares and {new:,} offering shares; new shares are {share_new:.2f}% of the enlarged base.")
    inner += ('<p class="plain"><strong>In plain terms.</strong> A holder who owned 1.00% of MP before the offering and '
              'bought none of the new shares owned about 0.92% afterward on this isolated basis. The measure leaves out '
              'other issuances, government preferred conversion, warrants, convertible debt and options.</p>')
    caption = "Basic shares at 9 July 2025 plus the final offering only. Prior shareholdings are held fixed."
    return exhibit(3, "The offering diluted a nonparticipating holder by 7.68%", inner, caption,
                   [("Prospectus supplement, p. S-7", refs["s06"]), ("2025 Form 10-K, Note 18", refs["s11"]),
                    ("Model 1.0, financing economics", refs["economics"])], cls="ownership")


def panel_terms() -> str:
    loan = ["Interest rate", "Fees beyond the disclosed $7.4 million of commitment and structuring fees",
            "Maturity", "Principal repayment schedule", "Draw and completion conditions",
            "Security", "Parent guarantees, and whether lenders had recourse to MP"]
    project = ["Dated construction and ramp costs", "Shipment and collection dates",
               "Qualifying contract volumes and costs", "Working capital needed through ramp-up",
               "Timing of offtake payments under a delayed ramp"]
    li = lambda xs: "".join(f"<li>{x}</li>" for x in xs)
    return ('<aside class="panel"><p class="panel-title">What the reviewed filings leave open</p>'
            '<div class="panel-cols"><div><p class="panel-head">Loan terms</p>'
            f'<ul>{li(loan)}</ul></div><div><p class="panel-head">Project cash-flow inputs</p><ul>{li(project)}</ul></div></div>'
            '<p class="panel-note">Any one of these can change whether retained construction debt would have beaten the equity raise.</p></aside>')


def ex_bridge(refs) -> str:
    rows = exhibit_csv("liquidity_bridge")
    la = by(exhibit_csv("liquid_assets"), "as_of")
    vals = [(r["measure"], float(r["usd_m"])) for r in rows]
    opening, closing = vals[0][1], vals[-1][1]
    moves = [(m, v) for m, v in vals[1:-1] if m != "Unexplained residual"]
    residual = next(v for m, v in vals if m == "Unexplained residual")
    assert abs(opening + sum(v for _, v in moves) - closing) < 0.0005 and residual == 0
    W = 640
    x0, x1 = 262, 560
    scale = (x1 - x0) / 2000
    rh = 22
    labels = {
        "Opening company liquid assets": "Cash and short-term investments, 31 Dec 2025",
        "Operating cash flow": "Operating cash flow",
        "Cash PP&E purchases, all company projects": "Cash purchases of property, plant and equipment",
        "Government construction-award proceeds": "Government construction-award proceeds",
        "Financing cash flows": "Financing cash flows",
        "Accretion on short-term investments": "Accretion on short-term investments",
        "Release of restricted cash outside liquid-asset measure": "Release of restricted cash",
        "Change in short-term investment unrealized valuation": "Unrealized valuation change, short-term investments",
        "Closing company liquid assets": "Cash and short-term investments, 30 Sep 2026",
    }
    seq = [vals[0]] + moves + [vals[-1]]
    H = 28 + rh * len(seq) + 40
    b = []
    for v in (0, 500, 1000, 1500, 2000):
        x = x0 + v * scale
        b.append(f'<line x1="{x:.1f}" y1="8" x2="{x:.1f}" y2="{20 + rh * len(seq)}" stroke="{C["border"]}" stroke-width="0.8"/>')
        b.append(t(x, 34 + rh * len(seq), f"{v:,}", 10, fill=C["faint"], anchor="middle"))
    b.append(t(x1, 48 + rh * len(seq), "USD million", 10, fill=C["faint"], anchor="end"))
    run = 0.0
    y = 12
    for i, (m, v) in enumerate(seq):
        lab = labels[m]
        endpoint = i in (0, len(seq) - 1)
        b.append(t(x0 - 8, y + 14, lab, 10, 600 if endpoint else 400, anchor="end"))
        if endpoint:
            d = la["2025-12-31" if i == 0 else "2026-09-30"]
            cash, sti = float(d["cash_usd_m"]), float(d["short_term_investments_usd_m"])
            assert abs(cash + sti - v) < 0.0005
            b.append(f'<rect x="{x0}" y="{y + 2}" width="{cash * scale:.1f}" height="{rh - 6}" fill="{C["n-dark"]}"/>')
            b.append(f'<rect x="{x0 + cash * scale:.1f}" y="{y + 2}" width="{sti * scale:.1f}" height="{rh - 6}" fill="url(#hatch)" stroke="{C["n-dark"]}" stroke-width="0.8"/>')
            b.append(t(x0 + v * scale + 6, y + 14, fmt(v, 3), 10.5, 600))
            run = v
        else:
            start, end = run, run + v
            lo, hi = min(start, end), max(start, end)
            fill = C["malachite"] if v > 0 else C["n-mid"]
            b.append(f'<rect x="{x0 + lo * scale:.1f}" y="{y + 4}" width="{max((hi - lo) * scale, 1.2):.1f}" height="{rh - 10}" fill="{fill}"/>')
            sign = "+" if v > 0 else ""
            b.append(t(x0 + hi * scale + 6, y + 14, sign + fmt(v, 3), 10, 500, C["malachite"] if v > 0 else C["graphite"]))
            run = end
        y += rh
    b.append(f'<rect x="{x1 - 178}" y="{H - 14}" width="9" height="8" fill="{C["n-dark"]}"/>')
    b.append(t(x1 - 165, H - 6.5, "Cash", 10, fill=C["slate"]))
    b.append(f'<rect x="{x1 - 128}" y="{H - 14}" width="9" height="8" fill="url(#hatch)" stroke="{C["n-dark"]}" stroke-width="0.8"/>')
    b.append(t(x1 - 115, H - 6.5, "Short-term investments", 10, fill=C["slate"]))
    b.append(t(0, H - 6.5, "Grey bars reduce liquid assets; green bars add to them.", 10, fill=C["slate"]))
    inner = svg(W, H, "".join(b), f"Company liquid assets fell from {opening:,.3f} to {closing:,.3f} million between 31 December 2025 and 30 September 2026.")
    caption = ("Company-wide figures, nine months to 30 September 2026. Operating cash flow already includes "
               "$110.9 million of Defense price-protection receipts. The balances are not a 10X allocation or a "
               "covenant calculation; the reconciling residual is zero at disclosed precision. The $6.5 million of "
               "government construction-award proceeds is cash the filing nets against property purchases; the FI003 analysis "
               "attributes it to a separate heavy-rare-earth grant, not to the Texas grant’s $10.075 million noncash receivable.")
    return exhibit(4, "Liquid assets fell by $492.375 million as MP funded construction across the company", inner, caption,
                   [("September 2026 Form 10-Q, cash-flow statement, balance sheet and Note 4", refs["s19"]),
                    ("2025 Form 10-K", refs["s11"]), ("Model 1.0, liquidity bridge", refs["liquidity"]),
                    ("Model 1.0, liquid assets", exhibit_url("liquid_assets"))])


def mini_revolver(highlight: str) -> str:
    w = 120
    lc = w * 72 / 275
    a = C["graphite"]
    return (f'<svg class="mini" viewBox="0 0 {w + 2} 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
            '<defs><pattern id="mh" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
            f'<rect width="4" height="4" fill="{C["plate"]}"/><line x1="0" y1="0" x2="0" y2="4" stroke="{C["n-dark"]}" stroke-width="1.4"/></pattern></defs>'
            f'<rect x="1" y="1" width="{lc:.1f}" height="10" fill="url(#mh)" stroke="{a}" stroke-width="{1.6 if highlight == "lc" else 0.8}"/>'
            f'<rect x="{1 + lc:.1f}" y="1" width="{w - lc:.1f}" height="10" fill="{C["plate"] if highlight != "avail" else C["elevated"]}" stroke="{a}" stroke-width="{1.6 if highlight == "avail" else 0.8}"/></svg>')


TABLE_GROUPS = [
    ("Cash already received. Historical inflows, not additive; only retained amounts remain in later company balances", 3),
    ("Commitment that produced no cash", 1),
    ("Position at 30 September 2026. One $275 million revolver carries both letters of credit and borrowing capacity", 3),
    ("Conditional future payments", 1),
]


def bold_lead(cell: str) -> str:
    """Presentation only: set the leading figure of each conditional amount in bold."""
    return re.sub(r"(^|(?<=\. ))((?:Up to )?\d[\d.,]*)", r"\1<strong>\2</strong>", cell)


def ex_liquidity_table(ms: Manuscript) -> str:
    rows = ms.table
    head, data = rows[0], rows[1:]
    assert head[2].startswith("Cash received") and len(data) == sum(n for _, n in TABLE_GROUPS), head
    out = ['<table class="grid liquidity"><colgroup><col style="width:19%"><col style="width:15%">'
           '<col style="width:12.5%"><col style="width:16.5%"><col style="width:37%"></colgroup><thead><tr>']
    labels = ["Date and item", "Cash received<br>or held (USD&nbsp;m)", "Borrowing<br>capacity (USD&nbsp;m)",
              "Conditional or<br>future (USD&nbsp;m)", "Treatment"]
    for k, lab in enumerate(labels):
        cls = ' class="num"' if k in (1, 2) else ""
        out.append(f'<th scope="col"{cls}>{lab}</th>')
    out.append('</tr></thead><tbody>')
    i = 0
    for label, n in TABLE_GROUPS:
        out.append(f'<tr class="band"><th colspan="5" scope="rowgroup">{html.escape(label)}</th></tr>')
        for _ in range(n):
            date, item, cash, credit, cond, treat = data[i]
            text, cites = split_cites(treat)
            extra = ""
            if item.startswith("Remaining revolver"):
                extra = mini_revolver("avail")
            elif item.startswith("Letters of credit"):
                extra = mini_revolver("lc")
            ended = ' class="ended"' if "Expired undrawn" in text else ""
            out.append(
                f'<tr{ended}><td><span class="date">{inline(date, ms.refs)}</span>{inline(item, ms.refs)}</td>'
                f'<td class="num">{inline(cash, ms.refs)}</td>'
                f'<td class="num">{inline(credit, ms.refs)}{extra}</td>'
                f'<td class="cond">{bold_lead(inline(cond, ms.refs))}</td>'
                f'<td class="treat">{inline(text, ms.refs)} <span class="cites">{cite_html(cites, ms.refs)}</span></td></tr>')
            i += 1
    out.append("</tbody></table>")
    caption = ("The columns separate cash, borrowing capacity and conditional payments at different dates, so no column "
               "is totalled. Hatching marks the letters of credit inside the same $275 million commitment.")
    return (f'<figure class="exhibit table-exhibit"><figcaption class="ex-title"><span class="ex-num">Exhibit 6</span>'
            'What MP had, what it could borrow and what depended on future events</figcaption>'
            + "".join(out) + f'<p class="ex-caption">{caption}</p></figure>')


def ex_revolver(refs) -> str:
    snaps = [r for r in exhibit_csv("revolver_snapshots") if r["as_of"] in ("2025-12-31", "2026-09-30")]
    W, rh = 640, 54
    x0, x1 = 150, 430
    H = 18 + rh * len(snaps) + 14
    scale = (x1 - x0) / 275
    b = []
    y = 10
    for r in snaps:
        lc, rem, com, draws = (float(r[k]) for k in ("lc_exposure_implied_usd_m", "remaining_capacity_usd_m", "commitment_usd_m", "loan_draws_usd_m"))
        assert lc + rem + draws == com
        date = {"2025-12-31": "31 December 2025", "2026-09-30": "30 September 2026"}[r["as_of"]]
        b.append(t(0, y + 22, date, 12.5, 600))
        b.append(f'<rect x="{x0}" y="{y + 4}" width="{lc * scale:.1f}" height="28" fill="url(#hatch)" stroke="{C["graphite"]}" stroke-width="1"/>')
        b.append(f'<rect x="{x0 + lc * scale:.1f}" y="{y + 4}" width="{rem * scale:.1f}" height="28" fill="{C["plate"]}" stroke="{C["graphite"]}" stroke-width="1"/>')
        b.append(t(x0 + 6, y + 17, f"{lc:.0f} letters of credit", 10, 600, C["graphite"]) if lc * scale > 120 else "")
        b.append(t(x1 + 10, y + 15, f"{lc:.0f} letters of credit (implied)", 12, 500))
        b.append(t(x1 + 10, y + 31, f"{rem:.0f} available · {draws:.0f} loans drawn", 11.5, fill=C["slate"]))
        y += rh
    b.append(t(x0, H - 2, "0", 11, fill=C["faint"], anchor="middle"))
    b.append(t(x1, H - 2, "275", 11, fill=C["faint"], anchor="middle"))
    inner = svg(W, H + 4, "".join(b), "Revolver use: 40 million of letters of credit and 235 million available at 31 December 2025; 72 million and 203 million at 30 September 2026.")
    caption = ("Letters of credit are implied as the 275 commitment less reported remaining capacity. The 200 "
               "letter-of-credit sublimit sits inside the 275 commitment and is not additional.")
    return exhibit(5, "Letters of credit rose from 40 to 72 million inside the same facility", inner, caption,
                   [("2025 Form 10-K, Note 10", refs["s11"]), ("September 2026 Form 10-Q, Note 8", refs["s19"]),
                    ("Model 1.0, revolver snapshots", refs["revolver"])], cls="compact")


def ex_conditions(refs) -> str:
    rows = [
        ("Unrestricted cash and qualifying cash equivalents fall below $500 million at a quarter-end test before the covenant trigger",
         "Credit §§7.11(a), 8.01(b), 4.02(b), 1.01, 8.02",
         "Event of Default under §8.01(b). Credit extensions, including new, extended, renewed or increased letters of credit, require the absence of a Default. During a continuing Event of Default, §8.02 allows the agent, acting at the required lenders’ request, to terminate commitments, accelerate loans and require cash collateral for letters of credit.",
         "A scenario consequence. MP reported compliance at 30 September 2026."),
        ("Defense payments are actually suspended or released under an agreement named in §8.01(m)(i)(2). Example: offtake §8.4.1(a) allows suspension after a project-company payment default stays uncured 45 days after written notice, or longer if §8.3 provides a longer period; the §8.3.1 default needs an undisputed amount unpaid 60 days after it is due",
         "Offtake §§8.3.1, 8.4.1(a); credit §§1.01, 4.02(b), 8.01(m)(i)(2)",
         "On the report’s reading, can block new credit immediately as a Default. A continuing condition becomes an Event of Default after 60 days, extended by 30 days if MP delivers the officer certificate on day 60 with qualifying cash of at least 125% of commitments ($343.75 million at $275 million). The extension delays remedies while the Default continues to block new credit.",
         "A late receipt, an appropriation shortfall or a missed commissioning date establishes none of those triggers by itself. Whether an unexercised right to suspend matters remains open to interpretation. Timing and application warrant counsel review."),
        ("A default, after applicable cure periods, gives Defense a right to terminate a Defense agreement",
         "Credit §8.01(m)(ii); transaction agreement §9.02(a)(ii)",
         "Defense can terminate the offtake or price protection agreement, or both, for a qualifying uncured material breach of MP’s 10X development, construction or commissioning and start-up obligations. Cure period of at least 120 days for a breach other than failure to pay; at least 90 days’ prior written notice to declare a company default.",
         "The credit provision turns on the termination right. Credit extensions also require specified representations to hold, including on a material adverse effect (§§4.02(a), 5.05(b))."),
        ("Financial tests begin on the earlier delivery of a certificate showing at least $400 million of covenant EBITDA, or statements for the quarter ending 30 June 2027",
         "Credit §§1.01, 6.01(b), 6.02(a), 7.11",
         "From the first fiscal quarter-end after delivery: net debt at most 4.00 times covenant EBITDA, subject to the specified acquisition adjustments, and covenant EBITDA at least 3.00 times contractual cash interest expense. On ordinary filing timing, tests would begin by the September 2027 quarter-end.",
         "Deck screen: leverage break-even near $232 million of covenant EBITDA (50% cash netting) or $209 million (100%), using $1,043.133 million of September principal as a proxy; assumes enough eligible cash to reach the cap and trigger-date EBITDA no higher than test-period EBITDA. $232 million is a conservative screen pending interpretation of which cap applies. Actual compliance certificates are unavailable."),
    ]
    body = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td><td class=\"qual\">{d}</td></tr>" for a, b, c, d in rows)
    inner = ('<table class="grid conditions"><colgroup><col style="width:27%"><col style="width:15%"><col style="width:33%"><col style="width:25%"></colgroup>'
             '<thead><tr><th scope="col">Event</th><th scope="col">Provisions</th><th scope="col">What the agreement provides</th>'
             f'<th scope="col">Qualification</th></tr></thead><tbody>{body}</tbody></table>')
    caption = "Section numbers refer to the credit agreement unless marked. The readings are conditional and for review."
    return exhibit(7, "Four credit conditions to plan for before 10X collects operating cash", inner, caption,
                   [("Credit agreement", refs["s09"]), ("Offtake agreement", refs["s03"]), ("Transaction agreement", refs["s02"]),
                    ("September 2026 Form 10-Q, Note 8", refs["s19"]), ("Draft 1.1, default and cash-test arithmetic", refs["deck"])], cls="breakable")


# ---------------------------------------------------------------------------
# Page assembly
# ---------------------------------------------------------------------------

SOURCE_NAMES = [
    ("s01", "S01", "MP Materials, Form 8-K, July 2025 (transaction announcement)"),
    ("s02", "S02", "Transaction agreement with the U.S. Department of Defense, Exhibit 10.1"),
    ("s03", "S03", "Offtake agreement, Exhibit 10.5"),
    ("s04", "S04", "Price protection agreement, Exhibit 10.6"),
    ("s06", "S06", "Prospectus supplement for the July 2025 common stock offering"),
    ("s07", "S07", "Underwriting agreement, Exhibit 1.1"),
    ("s09", "S09", "Credit agreement, August 2025, Exhibit 10.1"),
    ("s11", "S11", "MP Materials, 2025 Form 10-K"),
    ("s15", "S15", "J.P. Morgan, MP Materials transaction account"),
    ("s17", "S17", "MP Materials, Form 8-K on the Apple agreement, July 2025"),
    ("s19", "S19", "MP Materials, Form 10-Q for the quarter ended 30 September 2026"),
]
MODEL_NAMES = [
    ("claims", "Claim register (evidence.csv)"), ("model", "FI003 Model 1.0 outputs"),
    ("economics", "Model 1.0, financing economics"), ("replacement", "Model 1.0, replacement schedule"),
    ("liquidity", "Model 1.0, liquidity bridge"), ("revolver", "Model 1.0, revolver snapshots"),
    ("deck", "Draft 1.1 deck, accessible PDF"), ("hold", "Publication plan (hold conditions)"),
]


def para(text: str, refs, cls: str = "") -> str:
    body, cites = split_cites(text)
    note = f'<div class="side">{cite_html(cites, refs)}</div>' if cites else '<div class="side"></div>'
    c = f' class="{cls}"' if cls else ""
    return f'<div class="row"><p{c}>{inline(body, refs)}</p>{note}</div>'


def expect(text: str, start: str) -> str:
    if not text.startswith(start):
        sys.exit(f"Manuscript structure changed: expected paragraph starting {start!r}, found {text[:60]!r}")
    return text


def build_html(ms: Manuscript) -> str:
    P, R = ms.paragraphs, ms.refs
    H = ms.headings
    assert len(P) == 24 and len(H) == 4, (len(P), len(H))
    E = [
        "MP Materials, a U.S.", "MP secured a joint", "For a CFO planning", "The transaction agreement required",
        "The government agreement", "MP priced the offering", "MP was the issuer", "For the corporate facility",
        "**The ownership calculation.**", "Debt could have preserved", "The decision turns on",
        "**What MP could know", "**What happened afterward.**", "A letter of credit is", "**The first loss is time.**",
        "**The next loss can be", "A separate risk arises", "A separate provision, §8.01(m)(ii)", "MP must also plan",
        "The deck’s screening calculation", "A defensible completion-funding", "Take the equity while",
        "**Question for Jiho.**", "Reported results and forecasts",
    ]
    for p, e in zip(P, E):
        expect(p, e)
    title_main, _, title_sub = ms.title.partition(": ")
    series_line, hold_line = ms.meta
    pr = lambda i, cls="": para(P[i], R, cls)
    hold = hold_line.split(" · ")
    sources = "".join(
        f'<li><span class="sid">{sid}</span><span class="sname">{html.escape(name, quote=False)}</span>'
        f'<a class="surl" href="{html.escape(R[k])}">{html.escape(R[k], quote=False)}</a></li>' for k, sid, name in SOURCE_NAMES)
    def repo_label(u: str) -> str:
        # Full link stays in href; the printed label names the repository path and pinned commit.
        m = re.match(r"https://github\.com/VSSpowerlifting/strategic-materials-policy-tracker/(?:blob|tree)/([0-9a-f]{40})/(.+)$", u)
        return f"{m.group(2)} · commit {m.group(1)[:7]}" if m else u
    model_rows = [(name, R[k]) for k, name in MODEL_NAMES]
    model_rows += [("Model 1.0, underwriting", exhibit_url("underwriting")), ("Model 1.0, liquid assets", exhibit_url("liquid_assets"))]
    models = "".join(
        f'<li><span class="sid"></span><span class="sname">{html.escape(n, quote=False)}</span>'
        f'<a class="surl" href="{html.escape(u)}">{html.escape(repo_label(u), quote=False)}</a></li>' for n, u in model_rows)
    jiho_body = P[22].replace("**Question for Jiho.** ", "")

    pages = f"""
<section class="cover">
  <p class="cover-series">{html.escape(series_line.split(" · ")[0])}</p>
  <div class="cover-title">
    <h1>{html.escape(title_main, quote=False)}</h1>
    <p class="cover-sub">{html.escape(title_sub, quote=False)}</p>
  </div>
  <div class="cover-meta">
    <p>{html.escape(series_line, quote=False)}</p>
    <p>{html.escape(hold[0], quote=False)}</p>
    <p class="hold"><span class="hold-mark"></span>{html.escape(hold[1], quote=False)} · Review draft, {REVIEW_DATE}</p>
  </div>
</section>

<section class="opening" id="opening">
  <p class="kicker">The financing decision</p>
  <p class="lede">MP needed cash for 10X before the plant could earn operating receipts, so it chose equity over a construction loan.</p>
  {pr(0, "first")}
  {pr(1)}
  {pr(2)}
</section>
<section class="opening-2" id="sequence">
  {ex_sequence(R)}
</section>

<section class="chapter flow-on" id="s1">
  <h2><span class="num">1</span>{html.escape(H[0].split(". ", 1)[1], quote=False)}</h2>
  {pr(3)}{pr(4)}{pr(5)}
</section>
<section class="flow">
  {pr(6)}{pr(7)}
  {ex_banks(R)}
</section>

<section class="spread-left" id="decision-left">
  <p class="kicker">The shareholder decision</p>
  {ex_ownership(R)}
  {pr(8)}
</section>
<section class="spread-right" id="decision-right">
  <h2><span class="num">2</span>{html.escape(H[1].split(". ", 1)[1], quote=False)}</h2>
  {pr(9)}{pr(10)}
  {panel_terms()}
</section>
<section class="flow" id="s2-after">
  {pr(11)}{pr(12)}
  {ex_bridge(R)}
</section>

<section class="chapter" id="s3">
  <h2><span class="num">3</span>{html.escape(H[2].split(". ", 1)[1], quote=False)}</h2>
  {pr(13)}
  {ex_revolver(R)}
</section>
<section class="table-page">
  {ex_liquidity_table(ms)}
</section>
<section class="flow">
  {pr(14)}{pr(15)}{pr(16)}{pr(17)}
  {ex_conditions(R)}
  {pr(18)}{pr(19)}{pr(20)}
</section>

<section class="chapter judgment" id="judgment">
  <h2>{html.escape(H[3], quote=False)}</h2>
  {pr(21, "judgment-text")}
  <div class="jiho"><p class="jiho-label">Question for Jiho</p><p class="jiho-q">{inline(jiho_body, R)}</p></div>
  <hr>
  {pr(23, "closing-note")}
</section>

<section class="chapter sources" id="sources">
  <h2>Sources</h2>
  <p class="src-intro">Primary filings and agreements cited in the text, with the FI003 model, deck and review records pinned to fixed commits.</p>
  <ol class="srclist">{sources}</ol>
  <p class="src-sub">FI003 model, deck and review records, github.com/VSSpowerlifting/strategic-materials-policy-tracker</p>
  <ol class="srclist">{models}</ol>
</section>
"""
    css = CSS.read_text(encoding="utf-8")
    for k, v in C.items():
        css = css.replace(f"var(--{k})", v)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>{html.escape(ms.title)}</title>
<meta name="author" content="Strategic Materials Policy Tracker">
<style>
{font_faces()}
{css}
</style></head>
<body>{pages}</body></html>"""


# ---------------------------------------------------------------------------
# Google Doc paste copy
# ---------------------------------------------------------------------------

def build_doc_html(ms: Manuscript) -> str:
    R = ms.refs
    out = [f"<h1>{html.escape(ms.title, quote=False)}</h1>"]
    out += [f"<p><strong>{html.escape(m, quote=False)}</strong></p>" for m in ms.meta]
    for kind, value in ms.blocks:
        if kind == "h2":
            out.append(f"<h2>{html.escape(value, quote=False)}</h2>")
        elif kind == "p":
            out.append(f"<p>{inline(value, R)}</p>")
        elif kind == "hr":
            out.append("<hr>")
        elif kind == "table":
            rows = value
            cells = "".join(f"<th>{html.escape(c, quote=False)}</th>" for c in rows[0])
            body = [f"<tr>{cells}</tr>"]
            i = 1
            for label, n in TABLE_GROUPS:
                body.append(f'<tr><td colspan="6"><strong>{html.escape(label)}</strong></td></tr>')
                for _ in range(n):
                    body.append("<tr>" + "".join(f"<td>{inline(c, R)}</td>" for c in rows[i]) + "</tr>")
                    i += 1
            out.append('<table border="1" cellpadding="4">' + "".join(body) + "</table>")
    return ("<!doctype html><html><head><meta charset='utf-8'><title>FI003 Doc copy</title><style>body{color:#000000;font-family:Arial;} h1,h2,p,td,th,strong,span{color:#000000;text-decoration:none;} a{color:#1155cc;text-decoration:underline;}</style></head><body>"
            + "\n".join(out) + "</body></html>")


# ---------------------------------------------------------------------------

def print_pdf(html_path: Path, pdf_path: Path) -> None:
    chrome = os.environ.get("CHROME", CHROME_DEFAULT)
    if not Path(chrome).exists():
        sys.exit(f"Chrome not found at {chrome}; set CHROME.")
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run(
            [chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--no-first-run",
             f"--user-data-dir={profile}", "--virtual-time-budget=15000",
             f"--print-to-pdf={pdf_path}", html_path.as_uri()],
            check=True, capture_output=True,
        )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--html", type=Path, help="also keep the print HTML at this path")
    ap.add_argument("--doc-html", type=Path, help="write the Google Doc paste copy here")
    ap.add_argument("--pdf", type=Path, default=PDF_OUT)
    args = ap.parse_args()
    ms = Manuscript(MANUSCRIPT.read_text(encoding="utf-8"))
    page = build_html(ms)
    with tempfile.TemporaryDirectory() as tmp:
        html_path = Path(tmp) / "report.html"
        html_path.write_text(page, encoding="utf-8")
        if args.html:
            args.html.write_text(page, encoding="utf-8")
        print_pdf(html_path, args.pdf)
    if args.doc_html:
        args.doc_html.write_text(build_doc_html(ms), encoding="utf-8")
    print(f"Wrote {args.pdf.relative_to(REPO) if args.pdf.is_relative_to(REPO) else args.pdf}")


if __name__ == "__main__":
    main()

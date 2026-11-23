# FI003 designed report: source

`build_report.py` turns the FI003 manuscript into the designed review PDF and the HTML used
to format the Google Doc. It uses the Python standard library, `git` and headless Google Chrome.

```bash
python3 docs/research/fi003-mp-materials/source/build_report.py
python3 docs/research/fi003-mp-materials/source/build_report.py --html /tmp/fi003.html --doc-html /tmp/fi003-doc.html
```

Run from the repository root. The default writes
`docs/research/fi003-mp-materials/output/SMPT_FI003_MP_Materials_Research_Report.pdf`.
`CHROME` overrides the Chrome binary path.

## Inputs

- **Text:** `../output/SMPT_FI003_MP_Materials_Research_Report.md`. The build asserts the
  opening words of all 24 paragraphs and the four section headings, so a manuscript edit that
  changes structure stops the build instead of silently dropping text.
- **Figures:** FI003 model exhibits read with `git show` from commit
  `bfd276c7e64e9c1fa91b00b08457018136201a0d` (`research/fi003/exhibits/*.csv`), the commit
  the manuscript's model links cite. That commit must be reachable in the local clone
  (`git fetch origin bfd276c7e64e9c1fa91b00b08457018136201a0d` if it is not). Exhibit
  builders assert their own arithmetic (the liquidity bridge closes; letters of credit plus
  remaining capacity plus draws equal the commitment).
- **Design tokens:** `docs/design/publication-tokens.json`. `report.css` uses `var(--name)`
  placeholders that the build replaces with token hex values.

## Fonts

Archivo (Regular, Medium, SemiBold) and Spectral Regular, both SIL Open Font License, are
located with `fc-match` and embedded as data URIs. A missing face stops the build; no font
binary is stored in the repository. Spectral Regular was installed locally from the Google
Fonts release for this report.

## Additions beyond the manuscript text

The PDF adds report furniture that is not in the manuscript. Each item restates a figure or
qualification already in the manuscript or the pinned model exhibits:

- Opening lede: "MP needed cash for 10X before the plant could earn operating receipts, so it
  chose equity over a construction loan."
- Exhibit titles, captions, axis and status labels for Exhibits 1–7.
- The plain-language dilution example in Exhibit 3 (a 1.00% holder falls to about 0.92%).
- Exhibit 2, the bank-roles table, from `underwriting.csv` and the manuscript's bank paragraphs.
- The "What the reviewed filings leave open" panel and its closing note.
- The 31 December 2025 revolver position in Exhibit 5 (40 million of implied letters of
  credit, 235 million available, 0 loans drawn), from `revolver_snapshots.csv`.
- Exhibit 7, the four credit conditions. Each row summarizes, in the manuscript's own terms,
  the covenant paragraphs that begin "The next loss can be access to credit", "A separate
  risk arises", "A separate provision, §8.01(m)(ii)", "MP must also plan" and "The deck's
  screening calculation", and keeps their qualifiers (the report's reading, counsel review,
  open interpretation and the screening assumptions).
- In Exhibit 4's caption, the attribution of the $6.5 million of government
  construction-award proceeds to a separate heavy-rare-earth grant, from the pinned
  `research/fi003/analysis.md` and claim C62.
- Links to `underwriting.csv` and `liquid_assets.csv` in the source list.
- Group headings in the liquidity table (Exhibit 6), the "Date and item" column that joins
  the manuscript's Date and Item columns, and bold type on the leading conditional figures.
- Cover series line and "Review draft" date stamp; running heads ("SMPT Strategy & Finance
  003", "MP Materials' 10X financing · Review draft, publication hold") and feet ("Evidence
  through 6 November 2026", page number).
- Section kickers ("The financing decision", "The shareholder decision") and the "Question
  for Jiho" label set apart from the question.
- Sources furniture: the heading, its one-line introduction, the subhead for model, deck and
  review records, and the short names given to S01–S19.

Body paragraph order follows the manuscript. The liquidity table takes its own page, so the
page before it ends short.

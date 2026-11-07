# R001 / Applied Strategy 001: Archivo presentation candidates

Issue [#219](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/219) — **review-only source**, pending human visual/source approval. No public URLs or publication manifests change in this branch.

## Source and scope

The published eight-page PDF presentations have no authoritatively editable PowerPoint masters in this repository. `build_decks.js` reconstructs both as **native editable PowerPoint elements** (text, bars, comparison tables, timeline points and labels) using the signed-off research, not raster PDF conversion:

- R001: [Tungsten Supply Security](https://strategic-materials-policy-tracker.vercel.app/research/tungsten-supply-security); full original source dossier and [publication receipt](../../../docs/research/r001-tungsten-publication-2026-11-04.md). Research cutoff: **3 November 2026**.
- Applied Strategy 001: [U.S. Antimony Supply Resilience](https://strategic-materials-policy-tracker.vercel.app/research/antimony-supply-resilience); [public evidence and assumption register](../../../public/research/applied-001/antimony-evidence-and-assumptions.md), with model-backed 2030 severe-case results. Research cutoff: **4 November 2026**.

These new presentations retain the decision logic but reorganize editorial sentences and exhibits. They are **not** typography-only binary replacements. Original research dates, underlying model assumptions and live PDFs remain unchanged.

## Build and review workflow

The opt-in GitHub Actions workflow `archivo-reissue-candidates.yml` runs on this branch / relevant PR changes and stores outputs as an **Actions artifact**, not a public commit:

1. Install exact `pptxgenjs` version and use SMPT's existing `scripts/reissue_archivo_decks.py` installer to fetch and instantiate Archivo. Font files remain in the ephemeral runner and are never committed.
2. Generate two eight-slide editable `.pptx` files with `node research/reissues/archivo-remaining/build_decks.js`, using `OUT_DIR` for output.
3. Export matching PDF using LibreOffice. Verify the export actually embeds Archivo.
4. Run `verify_candidates.py` against the original published PDF references, checking slide count, editability, hyperlinks, critical figures, embedded fonts, clipping and source-versus-candidate numeric token differences. Produce contact sheets, SHA-256 values and review receipt.
5. Upload **candidate** PPTX, PDF, contact sheets and QA results to GitHub Actions. Never modify `public/research/` in this workflow.

The generator builds an entire slide using native text and shapes; no slide is an imported bitmap. Each core source reference appears as a clickable hyperlink. The final deck permits professional users to edit every chart label, bar and block in PowerPoint.

## Independent signoff still required

- Compare all 16 rendered candidate slides side-by-side against the published eight-page PDFs, including exact numerical scope, dates and the meaning of each source. The numeric token difference report highlights candidates for review but is not proof of equivalence.
- Verify archive fidelity, complete source URLs (the original PDFs may contain more links), source note visibility, numerical calculations against the XLSX, and any transcription/rephrasing changes.
- Confirm native PowerPoint editing in desktop Microsoft PowerPoint. Automated package inspection is evidence of editability but not an application-level editing test.
- Confirm Archivo Regular/Medium/Semibold visually and Archivo embedding in the PDFs; ensure no substituted font appears for major copy.
- Approve candidate editorial changes, then in a **separate publication phase** preserve historical PDFs in an archive and update public PDF/PPTX routes and any manifests. Do not rewrite the historical research cutoff.

Original source PDFs remain publication authority until these gates are approved. Google Drive presentations are outside this GitHub-only scope.
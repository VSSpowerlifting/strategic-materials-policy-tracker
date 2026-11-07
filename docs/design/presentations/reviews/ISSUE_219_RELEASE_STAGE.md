# Issue 219: Alternate Archivo presentation publication

**Draft release staging only. No public PDF route is replaced.**

The merged candidate builders in PR #221 generated two editable eight-slide Archivo decks. The revised exact candidate workflow [run 42313061887](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/42313061887) passed. This branch pins the four reviewed PPTX/PDF hashes, copies them to four **new** download paths and writes a manifest. The original R001 portrait social PDF and A001 source-rich presentation PDF retain their existing URLs.

The alternate editions are editorially condensed executive re-layouts, not pixel-identical reissues. R001 research cutoff remains November 3; A001 November 4. No model data, legal status or financial research is refreshed.

## Release gates

- [ ] Four binaries staged on this draft PR branch with pinned SHA-256 hashes.
- [ ] Add clearly labeled alternate PDF and editable PPTX links to R001 and Applied Strategy 001 research pages; preserve all original links.
- [ ] Exact-head CI and browser link/response tests pass, including original-file SHA check.
- [ ] Native Microsoft PowerPoint open/edit/save/reopen on representative quantitative slides.
- [ ] Editorial review of all 16 full-resolution pages, phone-size footnotes and condensed source-link detail.
- [ ] Explicit publication approval, then merge and verify the four files/URLs on the live site.

Do not conflate candidate generator integration with published asset release. Issue #219 stays open until production verification.

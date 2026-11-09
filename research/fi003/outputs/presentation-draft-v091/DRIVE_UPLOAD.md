# Draft 0.9.1: files for the private FI003 Drive folder

Upload these two files to the existing private FI003 folder in Benjamin's Google Workspace account (the folder that holds the native model sheet and the draft 0.5 Slides copy). Keep the folder's current permissions. Do not share or convert the files.

| Upload as | Local file | What it is | SHA-256 |
|---|---|---|---|
| `FI003 draft 0.9.1 (original editable PowerPoint).pptx` | `fi003-jpmorgan-mp-materials-draft-0.9.1.pptx` | The original deck. Its native charts have embedded workbooks (Edit Data). Reviewers edit or comment here. | `6d92e49690c5cd627a9fdea720a97fa1961b47f0371b37d3f19e51794e4445df` |
| `FI003 draft 0.9.1 (accessible PDF).pdf` | `fi003-jpmorgan-mp-materials-draft-0.9.1-accessible.pdf` | A tagged, remediated export for reading and screen readers. It is a derived file: edits go in the PowerPoint. | `dd0541d2b91eb3a176f113aac90262bacb7122107a5d1b62d7b4d918e631d54e` |

Upload each file with conversion to Google formats turned off. A converted Google Slides copy would drop the embedded chart workbooks, and a converted PDF would lose its tags.

## Why these are staged and not uploaded

On 8 November 2026 the Claude session's Drive connector was working: it listed recent files. It could not reach the FI003 folder, though. A title search for "FI003" found nothing, and both known FI003 file IDs, the draft 0.5 Slides deck and the native model sheet, returned "not found". The likely cause is that the connector uses an account without access to the folder, but this was not confirmed. A new folder would split the record, so nothing was uploaded.

## Not on this list

- The LibreOffice PDF (`fi003-jpmorgan-mp-materials-draft-0.9.1.pdf`) is an intermediate. The accessible PDF replaces it.
- The manifest, receipt and contact sheet stay in the repository as evidence.
- Leave any earlier drafts already in the folder as they are. They are version history.

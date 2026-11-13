# FI003 draft 1.1: build

Draft 1.1 is a review candidate under the publication HOLD. Its quality-control record is [../QUALITY_REVIEW_V110.md](../QUALITY_REVIEW_V110.md). Run every command from the repository root.

## Inputs

- `research/fi003/exhibits/*.csv`, `research/fi003/inputs.json` and `research/fi003/sources.json`: byte-identical copies of draft 1.0's model exports and source register (PR #215 at `bfd276c7`). The model scripts live on that branch.
- `build_spec.py`: builds `spec.json` from those files, asserting the clause arithmetic and the cover amounts.
- The exhibit system in `scripts/exhibit-system/`, including the opt-in `ledger_cover` (`ledger-cover.ts`).

## Fonts

No font file is committed. The PDF export loads both families through a throwaway LibreOffice profile:

| Family | Location | SHA-256 |
| --- | --- | --- |
| Archivo Regular and Bold | `ARCHIVO_DIR`, default `.claude/skills/strategic-materials-live-design/fonts` (local, git-ignored) | Regular `36ce8e83756505d014a7353ae332abc19740448fba9a67007b54923ed2899bfd`; Bold `fb0d3a7cf205466ed1147911f81dc80788b8e42b8b3b7602f25937a9224654f6` |
| Spectral Regular (SIL OFL 1.1) | `SPECTRAL_DIR`: a folder holding `Spectral-Regular.ttf` from google/fonts (git blob `25a6c47f8050e4ea3c9713a02a4843a8d6c503d5`, 261,088 bytes) | `c89021dc20720c8d0dcf40b0b2f6e00c13665fa8041717f581396f51b8c78f5d` |

The render step's font gate (`scripts/publication/fonts.ts`) stops the build unless both families resolve in `fc-list`. It does not measure text, and the PPTX names the families without embedding them. If Spectral is not installed, set `FONTCONFIG_FILE` to a fontconfig file that includes the system configuration and adds `SPECTRAL_DIR` as a `<dir>`.

The embedded faces in the reviewed PDF match the skill-folder files: the same `head` modified timestamp and unique IDs "Archivo-Regular" and "Archivo-Bold". A differently built Archivo elsewhere on the machine does not change the export, because the script loads `ARCHIVO_DIR` into its own profile.

## Commands

Each output step refuses to overwrite an existing file. To rebuild, move the old output aside first.

1. Rebuild the deck source:

   ```bash
   python3 research/fi003/presentation/v110/build_spec.py
   ```

2. Render the PPTX and manifest (byte-reproducible). Drop `FONTCONFIG_FILE` if Spectral is installed.

   ```bash
   FONTCONFIG_FILE=/path/to/fonts.conf npm run -s exhibits:render -- research/fi003/presentation/v110/spec.json research/fi003/outputs/presentation-draft-v110/fi003-mp-materials-10x-financing-draft-1.1.pptx --qc-record research/fi003/presentation/QUALITY_REVIEW_V110.md
   ```

3. Export the PDF, the per-slide PNGs and the contact sheet:

   ```bash
   SPECTRAL_DIR=/path/to/spectral PNG_DIR=/path/to/png bash research/fi003/presentation/v110/export_pdf.sh
   ```

4. Build the tagged PDF and its receipt. The script pins the export's SHA-256 in `SOURCE_SHA256`, so a fresh export needs that constant updated after review.

   ```bash
   python3 research/fi003/presentation/v110/remediate_pdf_v110.py
   ```

5. Check the deck:

   ```bash
   python3 scripts/publication/check_deck.py --strict research/fi003/outputs/presentation-draft-v110/fi003-mp-materials-10x-financing-draft-1.1.pptx
   ```

   ```bash
   python3 scripts/exhibit-system/verify_editability.py --check --deck research/fi003/outputs/presentation-draft-v110/fi003-mp-materials-10x-financing-draft-1.1.pptx --manifest research/fi003/outputs/presentation-draft-v110/fi003-mp-materials-10x-financing-draft-1.1.manifest.json
   ```

## Reproducibility

- The PPTX and manifest are byte-identical across renders from the same `spec.json`, including to a different output folder. The manifest records the absolute `spec` path, as the FI002 manifests do, so it matches only when rendered from the same checkout path.
- The PDF is not byte-identical, because LibreOffice writes a CreationDate. Page renders (`pdftoppm -r 150`), extracted text and the contact sheet are identical across exports.
- Given the same export, the tagged PDF and receipt are deterministic.
- Tooling used for the reviewed outputs:
  - LibreOffice 26.8.2.2;
  - poppler 26.11.0;
  - pypdf 6.14.2;
  - Pillow (for the contact sheet).

#!/usr/bin/env bash
# Export the draft 1.0 PPTX to PDF with Archivo embedded, then build per-slide PNGs and the contact sheet.
# Archivo is taken from the repo's design-skill fonts via a throwaway LibreOffice profile;
# nothing is installed system-wide. Run from the repo root. Set PNG_DIR to keep the per-slide PNGs.
set -euo pipefail
OUT=research/fi003/outputs/presentation-draft-v100
NAME=fi003-mp-materials-10x-financing-draft-1.0
TMP=$(mktemp -d)
mkdir -p "$TMP/lo/user/fonts" "$TMP/png"
cp .claude/skills/strategic-materials-live-design/fonts/Archivo-*.ttf "$TMP/lo/user/fonts/"
soffice -env:UserInstallation="file://$TMP/lo" --headless --convert-to pdf --outdir "$OUT" "$OUT/$NAME.pptx" >/dev/null 2>&1
pdffonts "$OUT/$NAME.pdf" | grep -q Archivo || { echo "Archivo not embedded" >&2; exit 1; }
pdftoppm -r 150 -png "$OUT/$NAME.pdf" "$TMP/png/s"
python3 research/fi003/presentation/v100/contact_sheet.py "$TMP/png" "$OUT/fi003-draft-1.0-contact-sheet.png" 3
if [ -n "${PNG_DIR:-}" ]; then mkdir -p "$PNG_DIR" && cp "$TMP"/png/*.png "$PNG_DIR"/; fi
rm -rf "$TMP"
echo "pdf + contact sheet written to $OUT"

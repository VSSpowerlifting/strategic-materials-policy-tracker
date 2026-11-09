#!/usr/bin/env bash
# Export the v0.9 PPTX to PDF with Archivo embedded, then build per-slide PNGs and the contact sheet.
# Archivo is taken from the repo's design-skill fonts via a throwaway LibreOffice profile;
# nothing is installed system-wide. Run from the repo root.
set -euo pipefail
OUT=research/fi003/outputs/presentation-draft-v09
NAME=fi003-jpmorgan-mp-materials-draft-0.9
TMP=$(mktemp -d)
mkdir -p "$TMP/lo/user/fonts" "$TMP/png"
cp .claude/skills/strategic-materials-live-design/fonts/Archivo-*.ttf "$TMP/lo/user/fonts/"
soffice -env:UserInstallation="file://$TMP/lo" --headless --convert-to pdf --outdir "$OUT" "$OUT/$NAME.pptx" >/dev/null 2>&1
pdffonts "$OUT/$NAME.pdf" | grep -q Archivo || { echo "Archivo not embedded" >&2; exit 1; }
pdftoppm -r 150 -png "$OUT/$NAME.pdf" "$TMP/png/s"
python3 research/fi003/presentation/v09/contact_sheet.py "$TMP/png" "$OUT/fi003-draft-0.9-contact-sheet.png" 3
mkdir -p /tmp/fi003-v09-png && cp "$TMP"/png/*.png /tmp/fi003-v09-png/ 2>/dev/null || true
echo "pdf + contact sheet written to $OUT"

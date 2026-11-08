#!/usr/bin/env bash
# Export the v0.8 PPTX to PDF with Archivo embedded, then build per-slide PNGs and the contact sheet.
# Archivo is taken from the repo's design-skill fonts via a throwaway LibreOffice profile;
# nothing is installed system-wide. Run from the repo root.
set -euo pipefail
OUT=research/fi003/outputs/presentation-draft-v08
NAME=fi003-jpmorgan-mp-materials-draft-0.8
TMP=$(mktemp -d)
mkdir -p "$TMP/lo/user/fonts" "$TMP/png"
cp .claude/skills/strategic-materials-live-design/fonts/Archivo-*.ttf "$TMP/lo/user/fonts/"
soffice -env:UserInstallation="file://$TMP/lo" --headless --convert-to pdf --outdir "$OUT" "$OUT/$NAME.pptx" >/dev/null 2>&1
pdffonts "$OUT/$NAME.pdf" | grep -q Archivo || { echo "Archivo not embedded" >&2; exit 1; }
pdftoppm -r 80 -png "$OUT/$NAME.pdf" "$TMP/png/s"
python3 research/fi003/presentation/v08/contact_sheet.py "$TMP/png" "$OUT/fi003-draft-0.8-contact-sheet.png" 3
mkdir -p /tmp/fi003-v08-png && cp "$TMP"/png/*.png /tmp/fi003-v08-png/ 2>/dev/null || true
echo "pdf + contact sheet written to $OUT"

#!/usr/bin/env bash
# Export the Studio v1 design-candidate PPTX to PDF with Archivo and Spectral embedded, then build
# per-slide PNGs and the contact sheet. Both families are loaded into a throwaway LibreOffice profile;
# nothing is installed system-wide and no font binary is committed.
#   ARCHIVO_DIR   directory holding Archivo-*.ttf   (default: the repo design-skill fonts)
#   SPECTRAL_DIR  directory holding Spectral-*.ttf  (required; no default, Spectral is not in the repo)
#   PNG_DIR       keep the per-slide PNG previews there (optional)
# Run from the repo root. Writes only to research/fi003/outputs/presentation-studio-v1/.
set -euo pipefail
OUT=research/fi003/outputs/presentation-studio-v1
NAME=fi003-mp-materials-10x-financing-studio-v1
ARCHIVO_DIR=${ARCHIVO_DIR:-.claude/skills/strategic-materials-live-design/fonts}
: "${SPECTRAL_DIR:?set SPECTRAL_DIR to a directory containing Spectral-*.ttf}"
ls "$SPECTRAL_DIR"/Spectral-*.ttf >/dev/null 2>&1 || { echo "No Spectral-*.ttf in $SPECTRAL_DIR" >&2; exit 1; }
TMP=$(mktemp -d)
mkdir -p "$TMP/lo/user/fonts" "$TMP/png"
cp "$ARCHIVO_DIR"/Archivo-*.ttf "$SPECTRAL_DIR"/Spectral-*.ttf "$TMP/lo/user/fonts/"
soffice -env:UserInstallation="file://$TMP/lo" --headless --convert-to pdf --outdir "$OUT" "$OUT/$NAME.pptx" >/dev/null 2>&1
FONTS=$(pdffonts "$OUT/$NAME.pdf")
echo "$FONTS" | grep -q Archivo || { echo "Archivo not embedded" >&2; exit 1; }
echo "$FONTS" | grep -q Spectral || { echo "Spectral not embedded" >&2; exit 1; }
echo "$FONTS" | awk 'NR>2 && $(NF-4)!="yes" {bad=1} END {exit bad}' || { echo "A font is not embedded" >&2; exit 1; }
pdftoppm -r 150 -png "$OUT/$NAME.pdf" "$TMP/png/s"
python3 research/fi003/presentation/studio-v1/contact_sheet.py "$TMP/png" "$OUT/fi003-studio-v1-contact-sheet.png" 3
if [ -n "${PNG_DIR:-}" ]; then mkdir -p "$PNG_DIR" && cp "$TMP"/png/*.png "$PNG_DIR"/; fi
rm -rf "$TMP"
echo "pdf + contact sheet written to $OUT"

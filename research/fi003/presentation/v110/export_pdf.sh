#!/usr/bin/env bash
# Export the draft 1.1 PPTX to PDF with Archivo and Spectral embedded, then build per-slide PNGs
# and the contact sheet. Archivo comes from ARCHIVO_DIR (default: the local, git-ignored
# design-skill fonts folder) and Spectral (SIL OFL 1.1) from SPECTRAL_DIR, a local folder holding
# Spectral-Regular.ttf from google/fonts. README.md lists the reviewed files' SHA-256 values.
# Both load through a throwaway LibreOffice profile: nothing is installed system-wide and no
# font file is committed. Run from the repo root. Set PNG_DIR to keep the per-slide PNGs.
set -euo pipefail
: "${SPECTRAL_DIR:?set SPECTRAL_DIR to a folder containing Spectral-Regular.ttf}"
ARCHIVO_DIR=${ARCHIVO_DIR:-.claude/skills/strategic-materials-live-design/fonts}
[ -e "$ARCHIVO_DIR/Archivo-Regular.ttf" ] || { echo "no Archivo-Regular.ttf in $ARCHIVO_DIR" >&2; exit 1; }
OUT=research/fi003/outputs/presentation-draft-v110
NAME=fi003-mp-materials-10x-financing-draft-1.1
if [ -e "$OUT/$NAME.pdf" ]; then echo "refusing to overwrite $OUT/$NAME.pdf" >&2; exit 1; fi
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/lo/user/fonts" "$TMP/png"
cp "$ARCHIVO_DIR"/Archivo-*.ttf "$TMP/lo/user/fonts/"
cp "$SPECTRAL_DIR"/Spectral-Regular.ttf "$TMP/lo/user/fonts/"
soffice -env:UserInstallation="file://$TMP/lo" --headless --convert-to pdf --outdir "$OUT" "$OUT/$NAME.pptx" >/dev/null 2>&1
# Every font must be embedded, and only the two publication families may appear.
FONTS=$(pdffonts "$OUT/$NAME.pdf" | tail -n +3)
echo "$FONTS" | grep -q Archivo || { echo "Archivo not embedded" >&2; exit 1; }
echo "$FONTS" | grep -q Spectral || { echo "Spectral not embedded" >&2; exit 1; }
if echo "$FONTS" | awk '$(NF-4) != "yes"' | grep -q .; then echo "a font is not embedded" >&2; exit 1; fi
if echo "$FONTS" | awk '{print $1}' | grep -v -E '^[A-Z]{6}\+(Archivo|Spectral)' | grep -q .; then
  echo "unexpected font family in PDF:" >&2; echo "$FONTS" >&2; exit 1
fi
pdftoppm -r 150 -png "$OUT/$NAME.pdf" "$TMP/png/s"
python3 research/fi003/presentation/v110/contact_sheet.py "$TMP/png" "$OUT/fi003-draft-1.1-contact-sheet.png" 3
if [ -n "${PNG_DIR:-}" ]; then mkdir -p "$PNG_DIR" && cp "$TMP"/png/*.png "$PNG_DIR"/; fi
echo "pdf + contact sheet written to $OUT"

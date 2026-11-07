"""Locate the external command-line tools used by the exhibit scripts.

soffice (LibreOffice) and pdftoppm (Poppler) are system tools, not npm
dependencies. Lookup order, first match wins:

1. an explicit environment variable (SOFFICE, PDFTOPPM)
2. PATH
3. standard install locations (LibreOffice.app on macOS, Homebrew, /usr/bin)
No private runtime paths are searched.

Install on macOS:  brew install --cask libreoffice && brew install poppler
Install on Debian/Ubuntu:  apt-get install libreoffice-impress poppler-utils
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

_ENV = {"soffice": "SOFFICE", "pdftoppm": "PDFTOPPM"}

_STANDARD = {
    "soffice": [
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "/opt/homebrew/bin/soffice",
        "/usr/local/bin/soffice",
        "/usr/bin/soffice",
        "/usr/lib/libreoffice/program/soffice",
    ],
    "pdftoppm": [
        "/opt/homebrew/bin/pdftoppm",
        "/usr/local/bin/pdftoppm",
        "/usr/bin/pdftoppm",
    ],
}

def find_tool(name: str, *, quiet: bool = False) -> str | None:
    """Return a path to `name`, or None if it is not installed anywhere known."""
    env = os.environ.get(_ENV.get(name, ""), "")
    if env:
        if Path(env).exists():
            return env
        print(f"{name}: {_ENV[name]}={env} does not exist; continuing lookup", file=sys.stderr)
    found = shutil.which(name)
    if found:
        return found
    for candidate in _STANDARD.get(name, []):
        if Path(candidate).exists():
            return candidate
    return None

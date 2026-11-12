"""Python loader for the single publication token source, docs/design/publication-tokens.json.

Memo, cover and social generators import from here so no script hard-codes a hex.
`hex_()` returns six uppercase digits without '#'; `rgb()` returns an (r, g, b) tuple.
"""
from __future__ import annotations
import json
from pathlib import Path

TOKENS_PATH = Path(__file__).resolve().parents[2] / "docs" / "design" / "publication-tokens.json"
TOKENS = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))

FONT_EDITORIAL = TOKENS["type"]["editorial"]["family"]
FONT_TEXT = TOKENS["type"]["text"]["family"]
FONT_MONO = TOKENS["type"]["mono"]["family"]


def hex_(name: str) -> str:
    return TOKENS["palette"][name]["hex"].lstrip("#").upper()


def series_hex(name: str) -> str:
    return TOKENS["series"][name]["hex"].lstrip("#").upper()


def neutral_hex(name: str) -> str:
    """Functional grey ('dark', 'mid', 'light'): marks and fills only, never text."""
    return TOKENS["neutrals"][name].lstrip("#").upper()


def ramp_hex() -> list[str]:
    return [v.lstrip("#").upper() for v in TOKENS["sequentialRamp"]["steps"]]


def rgb(name: str) -> tuple[int, int, int]:
    value = hex_(name)
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def _lum(value: str) -> float:
    value = value.lstrip("#")
    out = []
    for i in (0, 2, 4):
        v = int(value[i:i + 2], 16) / 255
        out.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * out[0] + 0.7152 * out[1] + 0.0722 * out[2]


def contrast(a: str, b: str) -> float:
    hi, lo = sorted((_lum(a), _lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def theme_colour_scheme() -> str:
    """Office `<a:clrScheme>` built from the tokens (mirror of themeColourScheme() in tokens.ts)."""
    def c(tag: str, value: str) -> str:
        return f'<a:{tag}><a:srgbClr val="{value}"/></a:{tag}>'
    return (
        '<a:clrScheme name="SMPT Studio">'
        + c("dk1", hex_("graphite")) + c("lt1", hex_("plate")) + c("dk2", hex_("slate")) + c("lt2", hex_("plaster"))
        + c("accent1", hex_("malachite")) + c("accent2", hex_("hematite")) + c("accent3", hex_("ochre"))
        + c("accent4", series_hex("lapis")) + c("accent5", series_hex("plum")) + c("accent6", neutral_hex("mid"))
        + c("hlink", hex_("malachite")) + c("folHlink", hex_("slate"))
        + "</a:clrScheme>"
    )


def brand_theme_xml(xml: str) -> str:
    import re
    return re.sub(r"<a:clrScheme[\s\S]*?</a:clrScheme>", theme_colour_scheme(), xml, count=1)

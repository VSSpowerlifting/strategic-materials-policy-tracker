#!/usr/bin/env python3
"""Deterministic conceptual cover artwork for the cover_hero_split pattern.

    uv run --with numpy --with matplotlib --with pillow python scripts/exhibit-system/cover_art.py \
        --seed 2026 --width-in 5.933 --height-in 7.5 --out <dir>/cover-hero.png

Draws contour lines of a synthetic heightfield: a low-frequency surface with
one terraced depression, in SMPT gold on graphite. The result suggests benched
open-pit terrain without depicting any real place. It is artwork, not a map:
no coordinates, scale, north arrow or real elevation data go into it, and every
deck that uses it must label it as conceptual.

The same seed, size and library versions give a byte-identical PNG. The script
writes `<out>.provenance.json` with the parameters, library versions and the
PNG's SHA-256 so a reviewer can rebuild and compare it.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

GRAPHITE = "#12110F"   # deck cover field (primitives.ts C.dark)
GOLD_DIM = "#98752D"   # house-style gold, used for the fine contours
GOLD = "#C8993E"       # deck gold (C.gold), every fifth contour
DPI = 300


def heightfield(seed: int, nx: int, ny: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    x = np.linspace(0.0, 1.0, nx)
    y = np.linspace(0.0, ny / nx, ny)
    X, Y = np.meshgrid(x, y)
    z = np.zeros_like(X)
    # Low-frequency surface: a fixed sum of random-phase plane waves.
    for _ in range(10):
        k = rng.uniform(0.8, 2.6)
        th = rng.uniform(0, np.pi)
        ph = rng.uniform(0, 2 * np.pi)
        z += rng.uniform(0.015, 0.04) / k * np.sin(2 * np.pi * k * (X * np.cos(th) + Y * np.sin(th)) + ph)
    # One elongated depression, offset low and right of centre, with stepped
    # walls so the contours bunch into benches.
    cx, cy = 0.56, 0.58 * (ny / nx)
    ang = np.deg2rad(28)
    u = (X - cx) * np.cos(ang) + (Y - cy) * np.sin(ang)
    v = -(X - cx) * np.sin(ang) + (Y - cy) * np.cos(ang)
    r = np.sqrt((u / 0.46) ** 2 + (v / 0.30) ** 2)
    depth = np.exp(-(r ** 2) * 1.4)
    steps = 16
    t = depth * steps
    # Continuous benches: flat treads, steep risers, no discontinuity at a step.
    terraced = (np.floor(t) + (t % 1) ** 5) / steps
    z -= terraced
    return z


def render(seed: int, width_in: float, height_in: float, out: Path) -> dict:
    nx = 960
    ny = int(round(nx * height_in / width_in))
    z = heightfield(seed, nx, ny)
    levels = np.linspace(z.min(), z.max(), 72)
    fig = plt.figure(figsize=(width_in, height_in), dpi=DPI, facecolor=GRAPHITE)
    ax = fig.add_axes((0, 0, 1, 1))
    ax.set_facecolor(GRAPHITE)
    ax.set_axis_off()
    solid = {"linestyles": "solid", "negative_linestyles": "solid", "antialiased": True}
    ax.contour(z, levels=levels, colors=GOLD_DIM, linewidths=0.5, alpha=0.6, **solid)
    ax.contour(z, levels=levels[::6], colors=GOLD, linewidths=1.0, alpha=0.8, **solid)
    ax.set_xlim(0, nx - 1)
    ax.set_ylim(0, ny - 1)
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=DPI, facecolor=GRAPHITE, metadata={"Software": None})
    plt.close(fig)
    # Flatten to RGB: the field is opaque, and an alpha channel only adds bytes.
    Image.open(out).convert("RGB").save(out, optimize=True)
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    return {
        "generator": "scripts/exhibit-system/cover_art.py",
        "seed": seed,
        "width_in": width_in,
        "height_in": height_in,
        "dpi": DPI,
        "pixels": [int(round(width_in * DPI)), int(round(height_in * DPI))],
        "palette": {"field": GRAPHITE, "fine_contours": GOLD_DIM, "index_contours": GOLD},
        "libraries": {"numpy": np.__version__, "matplotlib": matplotlib.__version__, "pillow": Image.__version__},
        "sha256": digest,
        "nature": "Procedurally generated conceptual artwork. Not a map, photograph or depiction of any real site; contains no real elevation or location data.",
        "rights": "Created for SMPT by this script; no third-party image, map data or model output is used.",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, required=True)
    ap.add_argument("--width-in", type=float, required=True)
    ap.add_argument("--height-in", type=float, required=True)
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    if a.out.exists():
        raise SystemExit(f"refusing to overwrite {a.out}")
    prov = render(a.seed, a.width_in, a.height_in, a.out)
    Path(str(a.out) + ".provenance.json").write_text(json.dumps(prov, indent=2) + "\n")
    print(json.dumps(prov, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

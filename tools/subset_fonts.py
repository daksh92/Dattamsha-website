"""Prepare the self-hosted fonts in assets/fonts/.

    .venv/bin/python tools/subset_fonts.py

The sources in tools/fonts-src/google/ are the exact files Google Fonts served to the
approved design artifact (captured from the user's export; SIL OFL, see
tools/fonts-src/OFL.txt). Using the same binaries is what makes the site render
pixel-identically to the artifact: a re-cut of the same family from another build
rasterises slightly differently.

* DM Sans, Fraunces and the Latin part of Noto Serif Devanagari are copied unchanged.
  Their @font-face rules in src/css/01-fonts.css carry Google's unicode-range, so a
  character outside it (→, ₹, ✓) falls back exactly as it does in the artifact.
* The Devanagari part of Noto Serif Devanagari (127 KB) is cut down to the characters the
  site uses. Only glyphs are dropped: outlines, variations and shaping rules of the glyphs
  kept are untouched, so they render the same. Re-run after adding new Devanagari copy.

Needs fonttools and brotli (tools/requirements.txt).
"""

import pathlib
import re
import shutil

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "fonts-src" / "google"
OUT = ROOT / "assets" / "fonts"

COPY = {
    "dm-sans-latin.woff2": "dm-sans.woff2",
    "fraunces-latin.woff2": "fraunces.woff2",
    "noto-serif-devanagari-latin.woff2": "noto-serif-devanagari-latin.woff2",
}


def devanagari_text():
    """Every Devanagari character that appears in the page sources and partials."""
    chars = set()
    for path in (ROOT / "src").rglob("*.html"):
        chars.update(re.findall(r"[ऀ-ॿ]", path.read_text(encoding="utf-8")))
    # Joiners and the dotted circle keep conjunct shaping intact.
    return "".join(sorted(chars)) + "‌‍◌"


def report(path):
    print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1024:.1f} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for src, dest in COPY.items():
        shutil.copyfile(SRC / src, OUT / dest)
        report(OUT / dest)

    font = TTFont(SRC / "noto-serif-devanagari-devanagari.woff2")
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.hinting = True
    sub = subset.Subsetter(opts)
    sub.populate(text=devanagari_text())
    sub.subset(font)
    font.flavor = "woff2"
    out = OUT / "noto-serif-devanagari.woff2"
    font.save(out)
    report(out)


if __name__ == "__main__":
    main()

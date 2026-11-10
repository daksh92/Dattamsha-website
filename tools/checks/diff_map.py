"""Where does each page differ from its reference? Prints the worst 200px bands at 1440.

    python3 -I tools/checks/diff_map.py [Name ...]

Each band of the reference is matched to the best vertical offset (±80px) in our render,
so a small shift higher up does not make everything below look wrong.
"""
import os
import pathlib
import sys

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
# The handoff pack (design references); set DATTAMSHA_HANDOFF if it is not in ~/dattamsha-handoff.
REF = pathlib.Path(os.environ.get("DATTAMSHA_HANDOFF", pathlib.Path.home() / "dattamsha-handoff")).expanduser() / "reference"
NAMES = sys.argv[1:] or ["Main", "HowWeWork", "Platform", "Clients", "Trust", "About", "Book", "Privacy"]

for name in NAMES:
    ref = np.asarray(Image.open(REF / f"{name}.jpg").convert("L"), dtype=np.int16)
    ours = np.asarray(Image.open(ROOT / "_review" / f"{name}-1440.png").convert("L"), dtype=np.int16)
    bands = []
    for y in range(0, ref.shape[0] - 200, 200):
        win = ref[y:y + 200]
        best = None
        for d in range(-80, 81, 2):
            if 0 <= y + d and y + d + 200 <= ours.shape[0]:
                score = np.abs(win - ours[y + d:y + d + 200]).mean()
                if best is None or score < best[0]:
                    best = (score, d)
        if best:
            bands.append((round(float(best[0]), 1), y, best[1]))
    worst = sorted(bands, reverse=True)[:4]
    print(f"{name:10} overall {np.mean([b[0] for b in bands]):.1f}  worst bands (diff, y, offset): {worst}")

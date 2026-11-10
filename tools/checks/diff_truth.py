"""Compare each built page with its artifact-exact design render (_review/truth/).

    python3 -I tools/checks/diff_truth.py [Name ...]

For each 150px band of the design render, finds the best vertical offset (±150px) in our
1440 render and prints offset/diff for bands that are not an exact match (diff > 0.5 or
offset != 0). Make the truth renders first: node tools/checks/render_design.mjs
"""
import pathlib
import sys

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
NAMES = sys.argv[1:] or ["Main", "HowWeWork", "Platform", "Clients", "Trust", "About", "Book", "Privacy", "MondayBrief"]

for name in NAMES:
    width = 820 if name == "MondayBrief" else 1440
    truth = np.asarray(Image.open(ROOT / f"_review/truth/{name}-{width}.png").convert("L"), dtype=np.int16)
    ours = np.asarray(Image.open(ROOT / f"_review/{name}-1440.png").convert("L"), dtype=np.int16)
    if name == "MondayBrief":
        # Our brief sits centred inside the site chrome; find it and compare that column.
        x0 = (ours.shape[1] - 820) // 2
        ours = ours[:, x0:x0 + 820]
        top = min(range(0, 800), key=lambda y: float(np.abs(truth[:150] - ours[y:y + 150]).mean()))
        ours = ours[top:]
        print(f"   (brief document found at y={top} inside the page)")
    bad, diffs = [], []
    for y in range(0, truth.shape[0] - 150, 150):
        win = truth[y:y + 150]
        cands = [(float(np.abs(win - ours[y + d:y + d + 150]).mean()), d)
                 for d in range(-150, 151, 2) if 0 <= y + d and y + d + 150 <= ours.shape[0]]
        if not cands:
            bad.append(f"{y}:no-match")
            continue
        best = min(cands)
        diffs.append(best[0])
        if best[0] > 0.5 or best[1] != 0:
            bad.append(f"{y}:{best[1]:+d}/{best[0]:.1f}")
    print(f"{name:11} truth {truth.shape[0]} ours {ours.shape[0]} ({ours.shape[0]-truth.shape[0]:+d})  mean {np.mean(diffs):.2f}")
    print("   ", " ".join(bad) if bad else "exact")

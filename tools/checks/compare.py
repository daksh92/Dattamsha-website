"""Put a page screenshot next to its reference image for eyeballing.

    python3 -I tools/checks/compare.py Main [y_start y_end]

Writes _review/compare-<Name>.png: reference on the left, our 1440 render on the right,
optionally cropped to a vertical band so details stay legible.
"""
import os
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
# The handoff pack (design references); set DATTAMSHA_HANDOFF if it is not in ~/dattamsha-handoff.
REF = pathlib.Path(os.environ.get("DATTAMSHA_HANDOFF", pathlib.Path.home() / "dattamsha-handoff")).expanduser() / "reference"

name = sys.argv[1]
ref = Image.open(REF / f"{name}.jpg").convert("RGB")
ours = Image.open(ROOT / "_review" / f"{name}-1440.png").convert("RGB")
if len(sys.argv) >= 4:
    y0, y1 = int(sys.argv[2]), int(sys.argv[3])
    ref = ref.crop((0, y0, ref.width, min(y1, ref.height)))
    ours = ours.crop((0, y0, ours.width, min(y1, ours.height)))
h = max(ref.height, ours.height)
out = Image.new("RGB", (ref.width + ours.width + 20, h), "white")
out.paste(ref, (0, 0))
out.paste(ours, (ref.width + 20, 0))
scale = min(1.0, 1800 / out.width)
if scale < 1:
    out = out.resize((int(out.width * scale), int(out.height * scale)))
dest = ROOT / "_review" / f"compare-{name}.png"
out.save(dest)
print(dest, f"ref height {ref.height}, ours {ours.height}")

"""Side-by-side of a target render (left) and our render (right), cropped to a band.

    python3 -I tools/checks/compare_target.py TARGET.png OURS.png y0 y1 OUT.png
"""
import sys
from PIL import Image

target, ours, y0, y1, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
a = Image.open(target).convert("RGB")
b = Image.open(ours).convert("RGB")
a = a.crop((0, y0, a.width, min(y1, a.height)))
b = b.crop((0, y0, b.width, min(y1, b.height)))
img = Image.new("RGB", (a.width + b.width + 20, max(a.height, b.height)), "white")
img.paste(a, (0, 0))
img.paste(b, (a.width + 20, 0))
if img.width > 1800:
    img = img.resize((1800, int(img.height * 1800 / img.width)))
img.save(out)

"""Make the favicon, touch icons and header logo from the Dattamsha owl mark.

    python3 -I tools/icons/make_icons.py     (needs Pillow: tools/requirements-dev.txt)

Source: tools/icons/dattamsha-owl.png, the owl mark from the Dattamsha design system
(single ink in logo-cyan #25abce, transparent). Each icon is the owl in white on a
logo-cyan square: the same mark as in the official lockup (dattamsha-lockup.png). At
favicon sizes it reads far better than the thin cyan line art on cream.
"""
import pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "tools" / "icons" / "dattamsha-owl.png"
CYAN = (37, 171, 206, 255)  # logo-cyan


def icon(size, padding, radius):
    """The owl in white, centred on a logo-cyan square with rounded corners."""
    scale = 4  # draw large, then downsample, for clean edges at 16 and 32 px
    big = size * scale
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=radius * scale, fill=255)
    canvas.paste(Image.new("RGBA", (big, big), CYAN), (0, 0), mask)
    shape = Image.open(SRC).convert("RGBA").getchannel("A")
    owl = Image.new("RGBA", shape.size, (255, 255, 255, 255))
    owl.putalpha(shape)
    box = big - 2 * padding * scale
    owl.thumbnail((box, box), Image.LANCZOS)
    canvas.alpha_composite(owl, ((big - owl.width) // 2, (big - owl.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    out = ROOT / "assets" / "img"
    out.mkdir(parents=True, exist_ok=True)
    # favicon.ico at the site root: 16, 32 and 48 px; small sizes use tighter padding.
    sizes = {16: icon(16, 1, 3), 32: icon(32, 2, 6), 48: icon(48, 3, 9)}
    sizes[48].save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
                   append_images=[sizes[16], sizes[32]])
    icon(192, 18, 36).save(out / "icon-192.png", optimize=True)
    # Header logo: shown at 40 x 40 CSS px next to the wordmark; 120 px for sharp 3x screens.
    icon(120, 11, 22).save(out / "owl-mark.png", optimize=True)
    # iOS rounds the corners itself and wants an opaque square.
    touch = icon(180, 18, 0)
    flat = Image.new("RGB", touch.size, CYAN[:3])
    flat.paste(touch, (0, 0), touch)
    flat.save(out / "apple-touch-icon.png", optimize=True)
    for p in (ROOT / "favicon.ico", out / "icon-192.png", out / "apple-touch-icon.png", out / "owl-mark.png"):
        print(f"{p.relative_to(ROOT)}  {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()

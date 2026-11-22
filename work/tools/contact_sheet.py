"""Contact sheet QA: every cutout over navy #0F2557 and ice #EAF2FF."""
import os
import glob
from PIL import Image

NAVY = (15, 37, 87)
ICE = (234, 242, 255)
CELL = 240
PAD = 10
COLS = 6
DST = "work/qa"


def sheet(assets, bg, out):
    rows = (len(assets) + COLS - 1) // COLS
    W = COLS * (CELL + PAD) + PAD
    H = rows * (CELL + PAD) + PAD
    canvas = Image.new("RGB", (W, H), bg)
    for i, path in enumerate(assets):
        im = Image.open(path).convert("RGBA")
        im.thumbnail((CELL, CELL), Image.LANCZOS)
        x = PAD + (i % COLS) * (CELL + PAD) + (CELL - im.width) // 2
        y = PAD + (i // COLS) * (CELL + PAD) + (CELL - im.height) // 2
        canvas.paste(im, (x, y), im)
    canvas.save(out)
    print(out, canvas.size)


def main():
    assets = sorted(glob.glob("work/site/assets/3d/*.webp"))
    os.makedirs(DST, exist_ok=True)
    sheet(assets, NAVY, os.path.join(DST, "cut-navy.png"))
    sheet(assets, ICE, os.path.join(DST, "cut-ice.png"))
    # stacked proof sheet: navy on top, ice underneath
    top = Image.open(os.path.join(DST, "cut-navy.png"))
    bot = Image.open(os.path.join(DST, "cut-ice.png"))
    out = Image.new("RGB", (top.width, top.height + bot.height + 8), (255, 255, 255))
    out.paste(top, (0, 0))
    out.paste(bot, (0, top.height + 8))
    out.save(os.path.join(DST, "cut-proof.png"))
    print("work/qa/cut-proof.png", out.size)


if __name__ == "__main__":
    main()

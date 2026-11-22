#!/usr/bin/env python3
"""Contact sheets of every 3D asset over navy + ice, with ASCII index labels."""
from pathlib import Path
from PIL import Image, ImageDraw

ART = Path("work/site/assets/3d")
files = sorted(ART.glob("*.webp"))
COLS, TILE, PAD, LAB = 6, 250, 18, 26


def sheet(bg, out):
    rows = (len(files) + COLS - 1) // COLS
    W = COLS * (TILE + PAD) + PAD
    H = rows * (TILE + LAB + PAD) + PAD
    canvas = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(canvas)
    fg = (234, 242, 255) if sum(bg) < 380 else (15, 37, 87)
    for i, f in enumerate(files):
        im = Image.open(f).convert("RGBA")
        im.thumbnail((TILE, TILE), Image.LANCZOS)
        cx = PAD + (i % COLS) * (TILE + PAD) + (TILE - im.width) // 2
        cy = PAD + (i // COLS) * (TILE + LAB + PAD) + (TILE - im.height) // 2
        canvas.paste(im, (cx, cy), im)
        label = f"{i+1:02d} {f.stem.replace('03d-', '')}"
        d.text((PAD + (i % COLS) * (TILE + PAD), PAD + (i // COLS) * (TILE + LAB + PAD) + TILE + 4),
               label, fill=fg)
    canvas.save(out, optimize=True)
    print(out, canvas.size)


Path("work/qa").mkdir(exist_ok=True)
sheet((15, 37, 87), "work/qa/rest-all-navy.png")
sheet((234, 242, 255), "work/qa/rest-all-ice.png")

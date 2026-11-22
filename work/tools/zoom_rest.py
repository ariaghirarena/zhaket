import sys
from pathlib import Path
from PIL import Image
ART = Path("work/site/assets/3d")
names = sys.argv[1:]
tiles = []
for n in names:
    im = Image.open(ART / f"{n}.webp").convert("RGBA")
    s = min(3, 900 // max(im.width, im.height) or 1)
    im = im.resize((im.width * s, im.height * s), Image.LANCZOS)
    tiles.append((n, im))
W = sum(t.width for _, t in tiles) + 20 * (len(tiles) + 1)
H = max(t.height for _, t in tiles) + 40
canvas = Image.new("RGB", (W, H), (15, 37, 87))
x = 20
for n, t in tiles:
    canvas.paste(t, (x, 20), t)
    x += t.width + 20
out = "work/qa/zoom-" + "-".join(n.split('-')[1] for n in names) + ".png"
canvas.save(out, optimize=True)
print(out, canvas.size)

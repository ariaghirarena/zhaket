"""Run the canonical cutout_white_floodfill over every prop render.

The Drive function's default thresh=242 / soft=224 assumes a *near-white*
studio background (lum >= 242). Several of our renders came back on a
light-grey backdrop (border lum ~210-238), so the flood never starts and the
whole frame stays opaque. The algorithm itself is imported unchanged from
work/tools/cutout_white_floodfill.py -- we only feed it a thresh/soft pair
measured from each image's own border ring.
"""
import os
import sys
import glob
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout_white_floodfill import cutout_white_floodfill  # noqa: E402
from ghost_filter import filter_ghosts  # noqa: E402

SRC = "work/3d/named"
DST = "work/site/assets/3d"
SKIP = {"03d-17-bg-dark", "03d-18-bg-light"}  # full-bleed backgrounds, no cut


def border_lum(path):
    rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.int32)
    lum = (rgb[..., 0] * 299 + rgb[..., 1] * 587 + rgb[..., 2] * 114) // 1000
    ring = np.concatenate([lum[0], lum[-1], lum[:, 0], lum[:, -1]])
    return int(np.median(ring))


def main():
    only = set(sys.argv[1:])
    for src in sorted(glob.glob(os.path.join(SRC, "*"))):
        name = os.path.splitext(os.path.basename(src))[0]
        if name in SKIP:
            continue
        if only and name not in only:
            continue
        lo = border_lum(src)
        thresh = min(242, lo - 3)
        soft = max(150, thresh - 18)
        # a grey (non-white) backdrop needs a slightly wider despill window
        chroma_max = 16 if thresh >= 236 else 20
        dst = os.path.join(DST, name + ".webp")
        cutout_white_floodfill(src, dst, thresh=thresh, soft=soft,
                               chroma_max=chroma_max)
        filter_ghosts(dst)
        a = np.asarray(Image.open(dst).convert("RGBA").getchannel("A"), dtype=np.float32)
        print(f"{name:24s} thresh={thresh:3d} soft={soft:3d} "
              f"clear={(a < 8).mean() * 100:5.1f}%")


if __name__ == "__main__":
    main()

"""Ghost filter: drop soft white debris left by the render itself.

The flood-fill removes everything connected to the frame border. What survives
is (a) the subject and (b) disconnected leftovers baked into the render -- white
paint smears and soft floor shadows. Those read as ugly white blobs on a navy
background, so we label the remaining opaque islands and keep only

  * the largest island (the subject), and
  * small islands that carry real colour (chroma >= 30: blue glints, sparkles).

Whitish islands (floor shadow / smear) are dropped. This is NOT a luminance
key: it never touches pixels inside the subject island.
"""
import os
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

CHROMA_KEEP = 30


def filter_ghosts(path, verbose=True):
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).copy()
    a = arr[..., 3]
    rgb = arr[..., :3].astype(np.int32)
    lum = (rgb[..., 0] * 299 + rgb[..., 1] * 587 + rgb[..., 2] * 114) // 1000
    chroma = rgb.max(2) - rgb.min(2)

    op = a > 8
    lab, n = ndi.label(op, structure=np.ones((3, 3)))
    if n <= 1:
        return 0
    areas = ndi.sum(op, lab, range(1, n + 1))
    main = int(np.argmax(areas)) + 1
    objs = ndi.find_objects(lab)
    main_area = areas[main - 1]
    dropped = 0
    for i in range(1, n + 1):
        if i == main:
            continue
        m = lab == i
        ar = int(m.sum())
        if ar < 40:                      # dust
            keep = False
        else:
            sl = objs[i - 1]
            h = sl[0].stop - sl[0].start
            w = sl[1].stop - sl[1].start
            flatness = max(w, h) / max(1, min(w, h))
            whitish = float(lum[m].mean()) >= 200 and \
                float(chroma[m].mean()) <= 26
            # keep real art: colour glints, and compact white parts that are
            # a meaningful share of the subject (cards, sparkles)
            keep = (not whitish) or \
                (flatness < 1.8 and ar >= 0.03 * main_area)
        if not keep:
            a[m] = 0
            dropped += ar

    # re-crop to the alpha bbox, keep a small breathing pad
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        return dropped
    y0, y1 = max(0, ys.min() - 6), min(a.shape[0], ys.max() + 7)
    x0, x1 = max(0, xs.min() - 6), min(a.shape[1], xs.max() + 7)
    arr = arr[y0:y1, x0:x1]

    out = Image.fromarray(arr, "RGBA")
    if max(out.size) > 900:
        out.thumbnail((900, 900), Image.LANCZOS)
    out.save(path, "WEBP", quality=92, method=6)
    if verbose:
        print(f"  ghosts -{dropped}px -> {out.size[0]}x{out.size[1]}")
    return dropped


if __name__ == "__main__":
    import glob
    for f in sorted(glob.glob("work/site/assets/3d/*.webp")):
        print(os.path.basename(f))
        filter_ghosts(f)

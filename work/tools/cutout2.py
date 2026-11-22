"""White-studio -> transparent RGBA WebP.

Strategy that survives pale ceramic subjects:
  background = near-white / low-chroma pixels that are CONNECTED TO THE BORDER
  (flood via connected-component labelling, so interior whites and chrome stay solid).
Luminance math is int32 (int16 overflows on 255*1000 and leaves the white alive).
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

BG_LUM = 140        # lighter than this *and* neutral counts as studio background
BG_CHROMA = 26      # coloured light (cyan glow) is never background
FEATHER = 1.1


def cut(src, dst, pad=10, max_side=1100):
    im0 = Image.open(src)
    if im0.mode in ("RGBA", "LA"):
        im = im0.convert("RGBA")
        a = np.asarray(im)
        if a[:, :, 3].min() < 250:                     # already cut out, keep it
            return _save_bbox(im, dst, pad, max_side)

    im = im0.convert("RGB")
    a = np.asarray(im).astype(np.int32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    lum = (r * 299 + g * 587 + b * 114) // 1000
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)

    bg_like = (lum > BG_LUM) & (chroma <= BG_CHROMA)

    # keep only background-like components that touch the frame edge
    lab, n = ndimage.label(bg_like)
    edge = np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]])
    keep = np.unique(edge[(edge > 0) & (edge <= n)])
    bg = np.isin(lab, keep)

    # solid alpha everywhere else, feathered at the boundary for clean glass edges
    alpha = np.where(bg, 0, 255).astype(np.float32)
    alpha = ndimage.gaussian_filter(alpha, FEATHER)
    alpha = np.clip(alpha, 0, 255)
    alpha[bg & (alpha < 96)] = 0                        # never keep ghost halos

    out = Image.fromarray(np.dstack([a[:, :, 0], a[:, :, 1], a[:, :, 2],
                                     alpha.astype(np.uint8)]).astype(np.uint8), "RGBA")
    return _save_bbox(out, dst, pad, max_side)


def _save_bbox(im, dst, pad, max_side):
    alpha = np.asarray(im)[:, :, 3]
    ys, xs = np.where(alpha > 16)
    if len(ys) == 0:
        raise SystemExit("empty after cutout: " + dst)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, im.height)
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, im.width)
    out = im.crop((x0, y0, x1, y1))
    w, h = out.size
    if max(w, h) > max_side:
        k = max_side / max(w, h)
        out = out.resize((int(w * k), int(h * k)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, "WEBP", quality=92, method=6)
    return out.size


if __name__ == "__main__":
    for src in sys.argv[1:]:
        name = os.path.splitext(os.path.basename(src))[0]
        print(name, cut(src, os.path.join("work/site/assets/3d", name + ".webp")))

"""White-background -> transparent RGBA WebP, safe for frosted-glass UI.

alpha  = 0   where the pixel is near-white *and* neutral (low chroma)
         255 where it is clearly darker or clearly coloured (glow stays)
The luminance math runs in int32 on purpose: int16 overflows on 255*1000
and leaves the white background alive (see LEARNINGS).
"""
import sys, os
import numpy as np
from PIL import Image

THRESH = 246      # above this -> fully transparent
SOFT = 232        # below this -> fully opaque
CHROMA_MAX = 16   # colored pixels (glow, cyan cast) always survive


def cut(src, dst, pad=8, max_side=1100):
    src_im = Image.open(src)
    has_alpha = src_im.mode in ("RGBA", "LA") or (src_im.mode == "P" and "transparency" in src_im.info)
    if has_alpha:
        im = src_im.convert("RGBA")
        a = np.asarray(im)
        alpha = a[:, :, 3].astype(np.int32)
        ys, xs = np.where(alpha > 20)
        if len(ys) == 0:
            raise SystemExit("empty alpha: " + src)
        y0, y1 = max(ys.min()-pad, 0), min(ys.max()+pad, im.height)
        x0, x1 = max(xs.min()-pad, 0), min(xs.max()+pad, im.width)
        out = im.crop((x0, y0, x1, y1))
        w, h = out.size
        if max(w, h) > max_side:
            k = max_side/max(w, h)
            out = out.resize((int(w*k), int(h*k)), Image.LANCZOS)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        out.save(dst, "WEBP", quality=92, method=6)
        return out.size

    im = src_im.convert("RGB")
    a = np.asarray(im).astype(np.int32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    lum = (r * 299 + g * 587 + b * 114) // 1000
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)

    ramp = np.clip((THRESH - lum) * 255.0 / (THRESH - SOFT), 0, 255)
    neutral = chroma <= CHROMA_MAX
    alpha = np.where(neutral, ramp, np.where(chroma > CHROMA_MAX, np.maximum(ramp, 255), ramp))

    # keep only the connected blob: drop faint dust far from the subject
    mask = alpha > 46
    ys, xs = np.where(mask)
    if len(ys) == 0:
        raise SystemExit("nothing left after cutout: " + src)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, im.height)
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, im.width)

    out = Image.fromarray(np.dstack([a[:, :, 0].astype(np.uint8),
                                     a[:, :, 1].astype(np.uint8),
                                     a[:, :, 2].astype(np.uint8),
                                     alpha.astype(np.uint8)]), "RGBA").crop((x0, y0, x1, y1))

    w, h = out.size
    if max(w, h) > max_side:
        k = max_side / max(w, h)
        out = out.resize((int(w * k), int(h * k)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, "WEBP", quality=92, method=6)
    return out.size


if __name__ == "__main__":
    for src in sys.argv[1:]:
        dst = os.path.join("work/site/assets/3d",
                           os.path.splitext(os.path.basename(src))[0] + ".webp")
        print(src, "->", dst, cut(src, dst))

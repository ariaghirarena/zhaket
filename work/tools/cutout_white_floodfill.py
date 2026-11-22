import numpy as np
from PIL import Image
from collections import deque
from scipy.ndimage import binary_dilation

def cutout_white_floodfill(in_path: str, out_webp: str, thresh: int = 242, soft: int = 224,
                           chroma_max: int = 16, cut_below_y: float = 0.96, max_dim: int = 900):
    """
    برش شفاف پس‌زمینهٔ سفید با BFS از لبه‌ها و محاسبه int32 (بدون سرریز int16 و بدون سوراخ کردن بدنهٔ سفید!).
    """
    im = Image.open(in_path).convert("RGBA")
    arr = np.array(im, dtype=np.int32)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # حتماً int32 باشد تا (255*1000) سرریز نکند!
    lum = (r * 299 + g * 587 + b * 114) // 1000
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    y_grid = np.broadcast_to(np.arange(h)[:, None], (h, w))

    # کاندید پس‌زمینه: سفید/خاکستری بسیار روشن با اشباع رنگ پایین (یا سایهٔ کف پایین تصویر)
    is_bg = ((lum >= thresh) & (chroma <= chroma_max)) | ((y_grid >= int(h * cut_below_y)) & (lum >= 205) & (chroma <= 18))

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_bg[0, x]: visited[0, x] = True; q.append((0, x))
        if is_bg[h - 1, x]: visited[h - 1, x] = True; q.append((h - 1, x))
    for y in range(h):
        if is_bg[y, 0] and not visited[y, 0]: visited[y, 0] = True; q.append((y, 0))
        if is_bg[y, w - 1] and not visited[y, w - 1]: visited[y, w - 1] = True; q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    alpha = np.where(visited, 0, 255).astype(np.int32)

    # Anti-aliasing نرم فقط در حاشیهٔ ۲ پیکسلی متصل به پس‌زمینه (داخل کاراکتر دست‌نخورده می‌ماند!)
    edge_ring = binary_dilation(visited, iterations=2) & (~visited)
    ramp = np.clip((thresh - lum) / max(1, (thresh - soft)), 0.0, 1.0)
    alpha = np.where(edge_ring & (chroma <= chroma_max + 4) & (lum > soft), (255 * ramp).astype(np.int32), alpha)

    out = np.stack([r, g, b, np.clip(alpha, 0, 255)], axis=-1).astype(np.uint8)
    out_im = Image.fromarray(out, "RGBA")
    bbox = out_im.split()[3].point(lambda p: 255 if p > 12 else 0).getbbox()
    if bbox:
        pad = 6
        out_im = out_im.crop((max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(w, bbox[2]+pad), min(h, bbox[3]+pad)))
    if max(out_im.size) > max_dim:
        out_im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    out_im.save(out_webp, "WEBP", quality=92, method=6)


if __name__ == "__main__":
    import os, sys, time
    for src in sys.argv[1:]:
        name = os.path.splitext(os.path.basename(src))[0]
        dst = os.path.join("work/site/assets/3d", name + ".webp")
        t0 = time.time()
        cutout_white_floodfill(src, dst)
        print(f"{name}  {time.time()-t0:.1f}s")

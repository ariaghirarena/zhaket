import numpy as np
from PIL import Image
from collections import deque

def cutout_chroma_green(in_path: str, out_webp: str, max_dim: int = 900):
    """
    برش ۱۰۰٪ بدون آسیب به بدنهٔ سفید سرامیکی و شیشهٔ آبی برای پس‌زمینهٔ سبز کروماکی (#00FF00).
    از Flood-Fill متصل به لبه‌ها + Despill لبه استفاده می‌کند.
    """
    im = Image.open(in_path).convert("RGBA")
    arr = np.array(im, dtype=np.int32)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # میزان غالب بودن رنگ سبز نسبت به قرمز و آبی
    green_excess = g - np.maximum(r, b)
    is_bg_cand = (green_excess > 28) & (g > 85)

    # Flood-Fill فقط از ۴ لبهٔ تصویر (هرگز داخل کاراکتر را نمی‌خورد!)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_bg_cand[0, x]: visited[0, x] = True; q.append((0, x))
        if is_bg_cand[h - 1, x]: visited[h - 1, x] = True; q.append((h - 1, x))
    for y in range(h):
        if is_bg_cand[y, 0] and not visited[y, 0]: visited[y, 0] = True; q.append((y, 0))
        if is_bg_cand[y, w - 1] and not visited[y, w - 1]: visited[y, w - 1] = True; q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    alpha = np.where(visited, 0, 255).astype(np.int32)

    # نرم‌سازی لبه‌های نیمه‌سبز مجاور پس‌زمینه + Despill (حذف ته‌رنگ سبز از لبه)
    from scipy.ndimage import binary_dilation
    near_bg = binary_dilation(visited, iterations=3) & (~visited)
    soft_green = np.clip((green_excess - 8) / 30.0, 0.0, 1.0)
    alpha = np.where(near_bg & (green_excess > 8), (255 * (1.0 - soft_green)).astype(np.int32), alpha)

    # Despill: در پیکسل‌های لبه‌ای، سبز را از max(r, b) بالاتر نگذار
    max_rb = np.maximum(r, b)
    g_clean = np.where(near_bg & (g > max_rb), max_rb, g)

    out = np.stack([r, g_clean, b, np.clip(alpha, 0, 255)], axis=-1).astype(np.uint8)
    out_im = Image.fromarray(out, "RGBA")
    bbox = out_im.split()[3].point(lambda p: 255 if p > 12 else 0).getbbox()
    if bbox:
        pad = 6
        out_im = out_im.crop((max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(w, bbox[2]+pad), min(h, bbox[3]+pad)))
    if max(out_im.size) > max_dim:
        out_im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    out_im.save(out_webp, "WEBP", quality=92, method=6)

# رفرنس ۳ — فرمول ضدخطای پرامپت سه‌بعدی + کد آمادهٔ برش پس‌زمینهٔ شفاف (بدون خراب کردن کاراکتر سفید!)

> **⚠️ قانون حیاتی (هرگز نقض نکن!):**
> 1. **هرگز** برای برش پس‌زمینه از فیلتر سرتاسری روشنایی (`alpha = 255 if lum < 234`) استفاده نکن! آن روش وسط بدنهٔ سفید سرامیکی ربات و شیشهٔ مات را سوراخ و شفاف می‌کند!
> 2. **هرگز** به‌خاطر شکست در برش، تنبلی نکنی و `mix-blend-mode: multiply` روی عکس با پس‌زمینهٔ سفید نگذاری! `multiply` بدنهٔ سفید سرامیکی کاراکتر را روی شیشهٔ مات و پس‌زمینهٔ آبی تیره **شبح‌وار، کدر و شفاف** می‌کند و ظاهر کار را خراب می‌کند!
> 3. **راه‌حل قطعی دو لایه دارد:** (الف) نوشتن **پرامپت با پس‌زمینهٔ کروماکی سبز یا سرخابی خالص** چون در پالت آبی-سفید ما اصلاً سبز/سرخابی وجود ندارد؛ (ب) اگر تصویر از قبل پس‌زمینهٔ سفید داشت، استفاده از **Flood-Fill متصل به لبه‌های تصویر (Border-Connected BFS)** با `dtype=np.int32`.

---

## بخش ۱ — فرمول طلایی نوشتن پرامپت سه‌بعدی برای کاربر (پس‌زمینهٔ کروماکی بدون خطا!)

چون تم گرافیکی کاربر **منحصراً آبی، فیروزه‌ای، سفید سرامیکی، شیشه مات و کروم** است، هیچ رنگ **سبز فسفری (`#00FF00`)** یا **سرخابی خالص (`#FF00FF`)** داخل خود کاراکترها و آیکون‌ها وجود ندارد!

### قالب اجباری انتهای هر پرامپت سه‌بعدی (برای آیکون‌ها و کاراکترها)
به‌جای `pure white background` (که لبه‌های کاراکتر سفید سرامیکی را با پس‌زمینه قاطی می‌کند!)، **همیشه** این بلوک دقیق را در انتهای پرامپت قرار بده:

```text
isolated floating object centered with generous empty margin, on a completely flat uniform solid chroma-key bright green background (#00FF00), zero green color bounce or green spill on the object, crisp clean silhouette edges, NO ground shadow, NO floor, NO drop shadow, NO reflection on floor, matte white ceramic and frosted sapphire-blue glass (#1D4ED8, #38BDF8) with polished chrome trim, Pixar-grade studio lighting, octane render, 8k, no text, no letters, no watermark, no logo, no orange
```

**پرامپت منفی (Negative Prompt) اجباری:**
```text
text, letters, words, numbers, watermark, logo, orange, yellow, red, ground shadow, cast shadow, floor, pedestal, green reflection on object, green tint on glass, blurry edges, cropped, low poly, flat 2d
```

### کی پس‌زمینهٔ کروماکی ننویسیم؟
- فقط برای **بک‌گراندهای تمام‌صفحهٔ ۱۶:۹** (مثلاً بک‌گراند سینمایی هیرو) که قرار نیست برش بخورند؛ برای تمام کاراکترها، ربات‌ها، ماسکوت‌ها و آیکون‌های شناور **حتماً** کروماکی `#00FF00` بنویس!
- اگر هوش مصنوعی کاربر نتوانست سبز کروماکی یکدست بدهد و پس‌زمینهٔ سفید داد، **باز هم جای نگرانی نیست**: از اسکریپت ۲ (Flood-Fill از لبه) استفاده کن — و هرگز سراغ `mix-blend-mode: multiply` نرو!

---

## بخش ۲ — اسکریپت ۱: برش فوق‌تمیز پس‌زمینهٔ کروماکی سبز `#00FF00` + حذف هالهٔ سبز (Despill)

```python
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
```

---

## بخش ۳ — اسکریپت ۲: برش دقیق پس‌زمینهٔ سفید با Border-Connected Flood-Fill (وقتی تصویر از قبل پس‌زمینهٔ سفید دارد)

> **چرا این روش بدنهٔ سفید ربات را خراب نمی‌کند؟**
> چون Flood-Fill فقط از لبه‌های بیرونی عکس شروع می‌شود و به‌محض برخورد با لبه/کانتور کاراکتر متوقف می‌شود؛ بنابراین پیکسل‌های سفیدِ داخل صورت و بدنهٔ ربات **اصلاً لمس نمی‌شوند**!

```python
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
```

---

## بخش ۴ — QA اجباری برش‌ها (تست دوگانه روی سرمه‌ای و یخی)
بعد از برش هر مجموعه آیکون، **همیشه** یک Contact Sheet بساز که هر فایل `.webp` را یک بار روی **پس‌زمینهٔ سرمه‌ای `#0F2557`** و یک بار روی **پس‌زمینهٔ آبی یخی `#EAF2FF`** قرار دهد و با `read_file` ببین:
- آیا هیچ هالهٔ سفید یا سبز دور کاراکتر مانده؟
- آیا داخل بدنهٔ سفید سرامیکی ربات ۱۰۰٪ پر و غیرشفاف مانده؟
- آیا هیچ لکهٔ خاکستری سایهٔ زمین پایین کاراکتر جامانده؟
تا وقتی هر سه تیک نخورده، به مرحلهٔ ساخت دمو یا کاور نرو!

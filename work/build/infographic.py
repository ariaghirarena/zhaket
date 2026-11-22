"""Vertical infographic banner (1200 x ~4500) + smart, text-safe slicing."""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (AMBER, DEEP, MINT, ROYAL, SKY, WHITE, backdrop, bar_chart,
                    kpi_card, out_path, to_fa)
from design import Design

W = 1200


def section_head(d, y, kicker, title, sub=None, color=SKY):
    d.text(kicker, 17, W - 90, y, color, "bold", align="right", lh=1.2)
    d.text(title, 40, W - 90, y + 30, WHITE, "black", align="right", maxw=900, lh=1.35)
    yy = y + 30 + 40 * 1.45
    if sub:
        d.text(sub, 18, W - 90, yy, (0.72, 0.81, 0.96), "regular", align="right",
               maxw=860, lh=1.7)
        yy += 18 * 1.7
    return yy + 26


def card(d, x, y, w, h, r=22, alpha=0.07):
    d.glass(x, y, w, h, r, alpha=alpha, blur=16, border=0.18)


def build():
    H = 4560
    d = Design(W, H, ss=2, bg=DEEP)
    backdrop(d, intensity=1.0, bottom=(0.05, 0.14, 0.34))

    # ------------------------------------------------ 1. hero
    d.glow(600, 120, 700, ROYAL, 0.35)
    d.logo(600, 120, 470)
    d.text("نویسنده هوشمند سئو", 84, 600, 214, WHITE, "black", align="center", maxw=1100, lh=1.3)
    d.text("یک افزونهٔ وردپرس که تحلیل سایت، تولید مقاله، ساخت تصویر، سئو و انتشار را "
           "به‌صورت خودکار انجام می‌دهد.", 24, 600, 330,
           (0.80, 0.88, 1.0), "medium", align="center", maxw=900, lh=1.75)

    stats = [("۵۰۰", "قابلیت پیاده‌شده"), ("۲۴", "تب مدیریتی"),
             ("۲۱", "پرووایدر هوش مصنوعی"), ("۱۰", "زبان خروجی")]
    bw = (W - 180 - 3 * 18) / 4
    for i, (v, l) in enumerate(stats):
        x = 90 + i * (bw + 18)
        card(d, x, 450, bw, 128)
        d.text(v, 46, x + bw / 2, 466, SKY, "black", align="center", lh=1.15)
        d.text(l, 17, x + bw / 2, 528, (0.74, 0.83, 0.97), "medium", align="center",
               maxw=bw - 20, lh=1.3)

    # ------------------------------------------------ 2. workflow
    y = 636
    y = section_head(d, y, "چرخهٔ کامل محتوا", "از تحلیل سایت تا انتشار، بدون دخالت دستی",
                     "چهار مرحله‌ای که افزونه به‌جای شما انجام می‌دهد.")
    steps = [
        ("trend", "۱. تحلیل هوشمند", "خزش سایت، محصولات و رقبا؛ ساخت استراتژی محتوا با کلمات کلیدی"),
        ("list", "۲. موضوعات و صف", "موضوعات اولویت‌دار، پرامپت اختصاصی و لحن و زبان دلخواه"),
        ("cpu", "۳. تولید محتوا", "مقالهٔ ساختاریافته با متا، اسکیما، فهرست مطالب و تصویر شاخص"),
        ("check", "۴. بازبینی و انتشار", "صف تأیید، اصلاح خودکار، زمان‌بندی و انتشار در وردپرس"),
    ]
    cw = (W - 180 - 3 * 18) / 4
    for i, (ic, t, s) in enumerate(steps):
        x = 90 + i * (cw + 18)
        card(d, x, y, cw, 248)
        d.rrect(x + cw / 2 - 30, y + 26, 60, 60, 18, fill=SKY, alpha=0.14, stroke=SKY, sw=1.0)
        d.icon(ic, x + cw / 2, y + 56, 30, SKY, 2.0)
        d.text(t, 21, x + cw / 2, y + 100, WHITE, "bold", align="center", maxw=cw - 24, lh=1.35)
        d.text(s, 15, x + cw / 2, y + 136, (0.70, 0.79, 0.94), "regular", align="center",
               maxw=cw - 34, lh=1.8)
        if i < 3:
            ax = x + cw + 9
            d.line(ax - 3, y + 118, ax + 3, y + 118, 2.0, (0.55, 0.70, 0.95), 0.8)
            d.polyline([(ax + 1, y + 114), (ax + 5, y + 118), (ax + 1, y + 122)], 1.6,
                       (0.55, 0.70, 0.95), 0.8)
    y += 248 + 70

    # ------------------------------------------------ 3. feature groups
    y = section_head(d, y, "۵۰۰ قابلیت", "هر چیزی که برای تولید محتوای سئو لازم دارید",
                     "۴۴۴ قابلیت در ۱۷ گروه + ۲۱ پرووایدر + ۱۵ متغیر پرامپت + ۱۰ زبان + ۱۰ لحن.")
    groups = [
        ("cpu", "پرووایدرهای هوش مصنوعی", 49),
        ("cloud", "کلادفلر و زیرساخت", 49),
        ("shield", "امنیت", 22),
        ("spark", "پرامپت و تولید محتوا", 48),
        ("doc", "ساختار مقاله", 29),
        ("check", "ویرایش خودکار فارسی", 13),
        ("chart", "سئو", 42),
        ("layers", "لینک‌سازی", 12),
        ("image", "تصویر شاخص", 16),
        ("bolt", "انتشار در وردپرس", 19),
        ("list", "مدیریت موضوعات", 46),
        ("user", "صف بازبینی و تأیید", 14),
        ("clock", "زمان‌بندی و اجرا", 22),
        ("bell", "اعلان‌ها", 12),
        ("activity", "داشبورد و گزارش‌ها", 23),
        ("settings", "رابط کاربری", 19),
        ("wrench", "ابزارها و نگهداری", 9),
    ]
    cols = 3
    tw = (W - 180 - (cols - 1) * 18) / cols
    th = 84
    for i, (ic, name, n) in enumerate(groups):
        x = 90 + (i % cols) * (tw + 18)
        yy = y + (i // cols) * (th + 14)
        card(d, x, yy, tw, th, r=18, alpha=0.06)
        d.icon(ic, x + tw - 44, yy + th / 2, 24, SKY, 1.9)
        d.text(name, 19, x + tw - 72, yy + 18, WHITE, "semi", align="right", maxw=tw - 100, lh=1.35)
        d.text(f"{to_fa(n)} قابلیت", 14, x + tw - 72, yy + 46, (0.62, 0.74, 0.92), "medium",
               align="right", lh=1.3)
    rows = (len(groups) + cols - 1) // cols
    y += rows * (th + 14) + 62

    # ------------------------------------------------ 4. providers
    y = section_head(d, y, "بدون قفل شدن به یک سرویس", "۲۱ پرووایدر آماده + پرووایدر شخصی نامحدود",
                     "کلید API خودتان، اکانت اشتراکی Claude/ChatGPT، یا مدل محلی روی سرور خودتان.")
    provs = ["OpenAI", "Anthropic Claude", "Google Gemini", "OpenRouter", "Groq", "Mistral",
             "DeepSeek", "xAI Grok", "Together AI", "Fireworks", "Perplexity", "Cohere",
             "Cerebras", "DeepInfra", "Moonshot Kimi", "Alibaba Qwen", "Zhipu GLM",
             "AvalAI", "GapGPT", "Cloudflare Workers AI", "Claude Pro"]
    pw = (W - 180 - 3 * 14) / 4
    ph = 54
    for i, name in enumerate(provs):
        x = 90 + (i % 4) * (pw + 14)
        yy = y + (i // 4) * (ph + 12)
        d.rrect(x, yy, pw, ph, ph / 2, fill=WHITE, alpha=0.055, stroke=WHITE, sw=0.8)
        d.circle(x + pw - 26, yy + ph / 2, 5, SKY, 0.85)
        d.text(name, 16, x + pw - 40, yy + 15, (0.86, 0.91, 1.0), "medium",
               align="right", maxw=pw - 60, lh=1.3)
    y += 6 * (ph + 12) + 56

    # ------------------------------------------------ 5. outputs / SEO
    y = section_head(d, y, "خروجی سئوشده", "مقاله‌ای که آمادهٔ انتشار است",
                     "هر مقاله با ساختار سئویی کامل ساخته و در پیش‌نویس ذخیره می‌شود.")
    outs = [
        ("chart", "متا تایتل و توضیحات", "طول و تراکم کلمه کلیدی کنترل می‌شود"),
        ("layers", "اسکیما و FAQ", "JSON-LD معتبر برای گوگل"),
        ("list", "فهرست مطالب", "لینک‌های داخلی و ساختار H2/H3"),
        ("image", "تصویر شاخص", "ساخت و جای‌گذاری خودکار تصویر"),
        ("check", "سازگاری کامل", "Yoast · Rank Math · AIOSEO · SEOPress"),
        ("trend", "سرچ کنسول", "اتصال و ادغام مقالات موجود"),
    ]
    ow = (W - 180 - 2 * 18) / 3
    oh = 118
    for i, (ic, t, s) in enumerate(outs):
        x = 90 + (i % 3) * (ow + 18)
        yy = y + (i // 3) * (oh + 16)
        card(d, x, yy, ow, oh, r=20, alpha=0.065)
        d.rrect(x + ow - 66, yy + 22, 44, 44, 14, fill=MINT, alpha=0.14, stroke=MINT, sw=0.9)
        d.icon(ic, x + ow - 44, yy + 44, 22, MINT, 1.9)
        d.text(t, 19, x + ow - 82, yy + 22, WHITE, "bold", align="right", maxw=ow - 110, lh=1.3)
        d.text(s, 14.5, x + ow - 82, yy + 54, (0.70, 0.79, 0.94), "regular",
               align="right", maxw=ow - 110, lh=1.5)
    y += 2 * (oh + 16) + 56

    # ------------------------------------------------ 6. run modes
    y = section_head(d, y, "سه روش اجرا", "هر هاستی که دارید، کار می‌کند",
                     "روش اجرا را خودتان انتخاب می‌کنید؛ افزونه با همهٔ آن‌ها سازگار است.")
    modes = [
        ("cloud", "کلادفلر رایگان", "استقرار یک‌کلیکی ورکر و اجرای زمان‌بندی‌شده روی پلن رایگان"),
        ("layers", "GitHub Actions", "اجرا از طریق مخزن گیت‌هاب بدون نیاز به سرور اختصاصی"),
        ("cpu", "مستقیم روی سرور", "نصب یک‌کلیکی Codex یا Claude Code روی هاست خودتان"),
    ]
    mw = (W - 180 - 2 * 18) / 3
    for i, (ic, t, s) in enumerate(modes):
        x = 90 + i * (mw + 18)
        card(d, x, y, mw, 168, r=22, alpha=0.07)
        d.icon(ic, x + mw / 2, y + 42, 32, SKY, 2.0)
        d.text(t, 21, x + mw / 2, y + 74, WHITE, "bold", align="center", maxw=mw - 30, lh=1.3)
        d.text(s, 15, x + mw / 2, y + 112, (0.70, 0.79, 0.94), "regular", align="center",
               maxw=mw - 44, lh=1.75)
    y += 168 + 66

    # ------------------------------------------------ 7. requirements
    y = section_head(d, y, "نیازمندی‌ها", "روی هر هاست وردپرسی نصب می‌شود")
    reqs = [("وردپرس", "۵.۸ یا بالاتر — تست‌شده تا ۶.۸"), ("PHP", "۷.۴ یا بالاتر"),
            ("ووکامرس", "اختیاری — تحلیل محصولات"),
            ("المنتور", "اختیاری — ساخت صفحات")]
    rw = (W - 180 - 18) / 2
    for i, (k, v) in enumerate(reqs):
        x = 90 + (i % 2) * (rw + 18)
        yy = y + (i // 2) * 74
        d.rrect(x, yy, rw, 62, 16, fill=WHITE, alpha=0.05, stroke=WHITE, sw=0.8)
        d.text(k, 18, x + rw - 24, yy + 17, SKY, "bold", align="right")
        kw = d.text_width(k, 18, "bold") / 1.0
        d.text(v, 15.5, x + rw - 44 - kw, yy + 19, (0.78, 0.86, 1.0), "regular",
               align="right", maxw=rw - 90 - kw, lh=1.4)
    y += 2 * 74 + 60

    # ------------------------------------------------ 8. footer CTA
    cta_y = y
    d.glass(90, y, W - 180, 132, 26, alpha=0.10, blur=18, border=0.22)
    d.text("ARIAGH.AIWRITER", 34, W / 2, y + 22, WHITE, "black", align="center", maxw=700, lh=1.2)
    d.text("نسخه ۱.۹.۲  ·  GPLv2  ·  پشتیبانی فارسی  ·  نصب زیر ۵ دقیقه", 16,
           W / 2, y + 74, (0.78, 0.86, 1.0), "medium", align="center", maxw=900, lh=1.4)

    d.crop_to(cta_y + 132 + 90)
    img = d.save(out_path("03-infographic", "aria-aiwriter-infographic.png"))
    return img


def ink_profile(path):
    im = Image.open(path).convert("L")
    a = np.asarray(im, dtype=np.float32)
    # local contrast = ink; background gradient is smooth so high-pass it
    row = a.mean(axis=1)
    return np.abs(np.diff(row, prepend=row[0]))


def smart_slices(path, out_dir, min_h=900, max_h=1250):
    """Cut the banner at rows with the least ink so no text line is split."""
    im = Image.open(path).convert("RGB")
    arr = np.asarray(im.convert("L"), dtype=np.float32)
    # ink = deviation from a smoothed background
    bg = np.apply_along_axis(lambda r: r, 1, arr)
    from PIL import ImageFilter
    bg_img = im.convert("L").filter(ImageFilter.GaussianBlur(6))
    ink = np.abs(arr - np.asarray(bg_img, dtype=np.float32)).mean(axis=1)
    H = arr.shape[0]
    cuts = [0]
    pos = 0
    while pos + min_h < H:
        lo = pos + min_h
        hi = min(H, pos + max_h)
        if hi - lo < 40:
            break
        # rolling 41px window so the cut never lands next to a text line
        k = 41
        padded = np.pad(ink, (k // 2, k // 2), mode="edge")
        rolling = np.convolve(padded, np.ones(k) / k, mode="valid")[lo:hi]
        window = ink[lo:hi] + rolling * 3.0
        best = int(np.argmin(window)) + lo
        cuts.append(best)
        pos = best
    cuts.append(H)
    # never emit a sliver as the last part
    while len(cuts) > 2 and cuts[-1] - cuts[-2] < 260:
        cuts.pop(-2)
    os.makedirs(out_dir, exist_ok=True)
    files = []
    for i in range(len(cuts) - 1):
        a, b = cuts[i], cuts[i + 1]
        part = im.crop((0, a, im.width, b))
        f = os.path.join(out_dir, f"aria-aiwriter-infographic-part-{i + 1:02d}.png")
        part.save(f)
        files.append((f, part.size))
    return files


if __name__ == "__main__":
    p = build()
    print(p)
    for f, s in smart_slices(p, os.path.join(os.path.dirname(p))):
        print(f, s)

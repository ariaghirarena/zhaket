"""Two 700x700 zhaket covers."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (DEEP, MINT, ROYAL, SKY, WHITE, backdrop, bar_chart,
                    chip_row, feature_tile, kpi_card, out_path)
from design import Design


def cover_one():
    d = Design(700, 700, ss=3, bg=DEEP)
    backdrop(d, bottom=(0.06, 0.17, 0.40))

    d.logo(350, 96, 400)

    d.text("نویسنده هوشمند سئو", 52, 350, 150, WHITE, "black", align="center", maxw=600, lh=1.32)
    d.text("تولید خودکار مقاله و تصویر، تحلیل رقبا و انتشار سئوشده — "
           "همه از پیشخوان وردپرس، بدون یک خط کد.", 19, 350, 214,
           (0.82, 0.89, 1.0), "medium", align="center", maxw=600, lh=1.7)

    chip_row(d, [("۵۰۰", "قابلیت پیاده‌شده"), ("۲۱", "پرووایدر هوش مصنوعی"),
                 ("۲۴", "تب مدیریتی")], 292, height=62, center=350)

    # mini dashboard mock
    px, py, pw, ph = 60, 392, 580, 250
    d.glass(px, py, pw, ph, 26, alpha=0.085, blur=20, border=0.22, shadow=True)
    d.rrect(px + 24, py + 22, 132, 26, 13, fill=SKY, alpha=0.16, stroke=SKY, sw=0.8)
    d.text("داشبورد زنده", 12.5, px + 90, py + 27, SKY, "bold", align="center", lh=1.0)
    d.circle(px + pw - 34, py + 35, 6, MINT, 0.9)
    d.circle(px + pw - 52, py + 35, 6, SKY, 0.55)
    d.circle(px + pw - 70, py + 35, 6, WHITE, 0.25)

    cw = (pw - 48 - 24) / 3
    for i, (v, l, ic) in enumerate([("۱۲۴", "مقاله منتشرشده", "doc"),
                                    ("۳۸", "در صف بازبینی", "list"),
                                    ("۹۶٪", "امتیاز سئو", "chart")]):
        kpi_card(d, px + 24 + i * (cw + 12), py + 66, cw, 74, v, l, ic)

    bar_chart(d, px + 24, py + 166, pw * 0.46, 58,
              [0.35, 0.5, 0.42, 0.66, 0.55, 0.78, 0.62, 0.9, 0.72, 1.0], SKY)
    # side status list
    lx = px + pw * 0.52
    lw = pw * 0.44
    for i, (label, col) in enumerate([("منتشر شد", MINT), ("در حال تولید", SKY),
                                      ("در صف بازبینی", (0.98, 0.75, 0.29))]):
        yy = py + 164 + i * 29
        d.rrect(lx, yy, lw, 22, 11, fill=WHITE, alpha=0.065)
        d.circle(lx + lw - 15, yy + 11, 3.4, col, 0.95)
        d.text(label, 11, lx + lw - 26, yy + 5.2, (0.80, 0.88, 1.0), "medium", align="right")
    return d.save(out_path("02-cover-700", "aria-aiwriter-cover-700-1.png"))


def cover_two():
    d = Design(700, 700, ss=3, bg=DEEP)
    backdrop(d, bottom=(0.05, 0.15, 0.37), grid=False)
    d.grid(step=50, alpha=0.025)

    d.text("یک افزونه، تمام چرخهٔ محتوا", 42, 350, 54, WHITE, "black", align="center", maxw=600, lh=1.3)
    d.text("از تحلیل سایت تا انتشار سئوشده", 19, 350, 106, (0.78, 0.86, 1.0), "medium",
           align="center", maxw=520, lh=1.5)

    tiles = [
        ("trend", "تحلیل هوشمند سایت", "استراتژی محتوا از محصولات و رقبا"),
        ("cpu", "۲۱ پرووایدر هوش مصنوعی", "یا اکانت اشتراکی، بدون کلید"),
        ("chart", "سئوی کامل", "متا، اسکیما، فهرست و لینک داخلی"),
        ("image", "تصویر شاخص خودکار", "ساخت و جای‌گذاری تصویر مقاله"),
        ("clock", "زمان‌بندی و صف بازبینی", "تولید روی کلادفلر و تأیید شما"),
        ("bell", "اعلان تلگرام و ایمیل", "از تولید تا انتشار، باخبر شوید"),
    ]
    tw, th, gx, gy = 300, 132, 20, 16
    x0, y0 = 350 - (tw * 2 + gx) / 2, 158
    for i, (ic, title, desc) in enumerate(tiles):
        cx = x0 + (i % 2) * (tw + gx)
        cy = y0 + (i // 2) * (th + gy)
        feature_tile(d, cx, cy, tw, th, ic, title, desc, icon_size=26, title_size=19, desc_size=13)

    # footer band
    d.glass(46, 620, 608, 54, 18, alpha=0.09, blur=14, border=0.22)
    d.text("۵۰۰ قابلیت  ·  ۲۱ پرووایدر هوش مصنوعی  ·  پشتیبانی فارسی", 14.5, 350, 637,
           (0.88, 0.93, 1.0), "semi", align="center", lh=1.2)
    return d.save(out_path("02-cover-700", "aria-aiwriter-cover-700-2.png"))


if __name__ == "__main__":
    print(cover_one())
    print(cover_two())

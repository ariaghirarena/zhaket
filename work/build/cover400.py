"""400x400 zhaket cover (top-left 70x70 safe zone kept empty)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import DEEP, SKY, WHITE, backdrop, out_path
from design import Design


def build():
    d = Design(400, 400, ss=4, bg=DEEP)
    backdrop(d, intensity=1.0, bottom=(0.07, 0.19, 0.44))

    d.glass(24, 78, 352, 288, 30, tint=(1, 1, 1), alpha=0.08, blur=24, border=0.20)

    d.logo(200, 130, 238)

    d.text("نویسنده هوشمند سئو", 31, 200, 170, WHITE, "black", align="center", maxw=330, lh=1.35)
    d.text("تولید خودکار محتوای سئوشده با هوش مصنوعی", 14, 200, 214,
           (0.84, 0.90, 1.0), "medium", align="center", maxw=340, lh=1.6)

    d.line(160, 250, 240, 250, 1.1, SKY, 0.45)

    chips = [("۵۰۰", "قابلیت"), ("۲۱", "پرووایدر"), ("۲۴", "تب مدیریتی")]
    for i, (val, label) in enumerate(chips):
        x = 44 + i * 108
        d.rrect(x, 264, 100, 58, 17, fill=WHITE, alpha=0.075, stroke=WHITE, sw=0.9)
        d.text(val, 20, x + 50, 272, SKY, "xbold", align="center", lh=1.15)
        d.text(label, 11.5, x + 50, 297, (0.76, 0.84, 0.97), "medium", align="center", lh=1.15)

    d.text("پشتیبانی فارسی  ·  نصب زیر ۵ دقیقه", 11, 200, 344, (0.62, 0.72, 0.90), "semi", align="center", lh=1.2)
    return d.save(out_path("01-cover-400x400", "aria-aiwriter-cover-400x400.png"))


if __name__ == "__main__":
    print(build())

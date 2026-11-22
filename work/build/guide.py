"""Persian installation guide:
   * page images (visually reviewed) -> help.pdf (lost-free via img2pdf)
   * documents/aria-aiwriter-guide.html (self-contained, printable)
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import out_path
from design import (AMBER, ICE, MINT, NAVY, ROYAL, SKY, SLATE, WHITE, Design)

PW, PH = 1240, 1754          # A4 @150dpi
SS = 2
MARGIN = 96
CONTENT_W = PW - 2 * MARGIN

INK = (0.043, 0.106, 0.247)
BODY = (0.196, 0.247, 0.345)
SOFT = (0.42, 0.49, 0.60)
LINE = (0.85, 0.90, 0.97)


class Page:
    def __init__(self, number, total):
        self.d = Design(PW, PH, ss=SS, bg=WHITE)
        d = self.d
        d.vgradient([(0, (1, 1, 1)), (0.6, (0.985, 0.992, 1.0)), (1, (0.955, 0.973, 1.0))])
        # header band
        d.rrect(0, 0, PW, 132, 0, fill=(0.969, 0.980, 1.0))
        d.line(0, 132, PW, 132, 1.2, LINE)
        d.logo(MARGIN + 96, 66, 192, on_dark=False)
        d.text(f"{number} / {total}", 15, PW - MARGIN, 40, SOFT, "semi", align="right")
        d.text("راهنمای نصب و راه‌اندازی", 15, PW - MARGIN, 66, SOFT, "medium", align="right")
        # footer
        d.line(MARGIN, PH - 96, PW - MARGIN, PH - 96, 1.0, LINE)
        d.text("ARIAGH.AIWRITER", 14, MARGIN, PH - 78, SOFT, "medium", align="left")
        d.text("ariagh · پشتیبانی فارسی", 14, PW - MARGIN, PH - 78, SOFT, "medium", align="right")
        self.y = 190

    # -- blocks -----------------------------------------------------------
    def title(self, text, sub=""):
        d = self.d
        d.text(text, 40, PW - MARGIN, self.y, INK, "black", align="right", maxw=CONTENT_W, lh=1.4)
        self.y += 40 * 1.4 + 10
        if sub:
            n = d.text_lines(sub, 17, PW - MARGIN, self.y, SOFT, "regular", align="right",
                             maxw=CONTENT_W, lh=1.75)
            self.y += 17 * 1.75 * max(1, n)
        self.y += 16
        return self

    def h2(self, text, icon_dot=True):
        d = self.d
        d.rrect(PW - MARGIN - 6, self.y + 6, 6, 26, 3, fill=ROYAL)
        d.text(text, 24, PW - MARGIN - 20, self.y, INK, "bold", align="right",
               maxw=CONTENT_W - 24, lh=1.4)
        self.y += 24 * 1.55 + 8
        return self

    def para(self, text, size=16.5, color=BODY):
        d = self.d
        n = d.text_lines(text, size, PW - MARGIN, self.y, color, "regular", align="right",
                         maxw=CONTENT_W, lh=1.95)
        self.y += size * 1.95 * max(1, n) + 6
        return self

    def steps(self, items, start=1):
        d = self.d
        import design
        from fa import wrap

        for i, (head, body) in enumerate(items, start):
            lines = wrap(design.font("regular"), body, 16, CONTENT_W - 110, True)
            box_h = 56 + len(lines) * 16 * 1.9
            d.rrect(MARGIN, self.y, CONTENT_W, box_h, 20, fill=(0.976, 0.986, 1.0),
                    stroke=(0.88, 0.92, 0.98), sw=1.0)
            d.circle(PW - MARGIN - 40, self.y + 34, 19, fill=ROYAL)
            d.text(str(i), 17, PW - MARGIN - 40, self.y + 22, WHITE, "bold", align="center", lh=1.2)
            d.text(head, 18.5, PW - MARGIN - 74, self.y + 20, INK, "bold", align="right",
                   maxw=CONTENT_W - 110, lh=1.4)
            ny = self.y + 56
            n = d.text_lines(body, 16, PW - MARGIN - 74, ny, BODY, "regular", align="right",
                             maxw=CONTENT_W - 110, lh=1.9)
            self.y += box_h + 12
        self.y += 4
        return self

    def bullets(self, items, size=16.5):
        d = self.d
        for it in items:
            d.circle(PW - MARGIN - 5, self.y + 13, 3.4, fill=SKY)
            n = d.text_lines(it, size, PW - MARGIN - 22, self.y, BODY, "regular",
                             align="right", maxw=CONTENT_W - 26, lh=1.9)
            self.y += size * 1.9 * max(1, n) + 3
        self.y += 8
        return self

    def callout(self, kind, text, size=16):
        d = self.d
        color = {"tip": MINT, "warn": AMBER, "info": SKY}[kind]
        label = {"tip": "نکته", "warn": "هشدار", "info": "راهنمایی"}[kind]
        from fa import wrap
        import design

        lines = wrap(design.font("regular"), text, size, CONTENT_W - 130, True)
        h = 34 + len(lines) * size * 1.85 + 20
        d.rrect(MARGIN, self.y, CONTENT_W, h, 18, fill=color + (0.0,) if False else
                (color[0] * 0.06 + 0.94, color[1] * 0.06 + 0.94, color[2] * 0.06 + 0.94))
        d.rrect(MARGIN + CONTENT_W - 6, self.y, 6, h, 3, fill=color)
        d.text(label, 15, PW - MARGIN - 26, self.y + 14, color, "bold", align="right")
        d.text_lines(text, size, PW - MARGIN - 26, self.y + 42, BODY, "regular",
                     align="right", maxw=CONTENT_W - 60, lh=1.85)
        self.y += h + 14
        return self

    def code(self, text, size=15):
        d = self.d
        w = d.text_width(text, size, "medium")
        h = size * 2.4
        d.rrect(MARGIN, self.y, CONTENT_W, h, 12, fill=(0.10, 0.16, 0.28))
        d.text(text, size, MARGIN + CONTENT_W - 20, self.y + h / 2 - size * 0.72,
               (0.78, 0.90, 1.0), "medium", align="right", base_rtl=False)
        self.y += h + 12
        return self

    def table(self, rows, head=("مورد", "توضیح")):
        d = self.d
        rh = 46
        d.rrect(MARGIN, self.y, CONTENT_W, rh, 12, fill=(0.94, 0.96, 1.0))
        d.text(head[0], 15.5, PW - MARGIN - 20, self.y + 13, NAVY, "bold", align="right")
        d.text(head[1], 15.5, MARGIN + 24, self.y + 13, NAVY, "bold", align="left")
        self.y += rh
        for i, (a, b) in enumerate(rows):
            if i % 2 == 0:
                d.rrect(MARGIN, self.y, CONTENT_W, rh, 0, fill=(0.975, 0.983, 1.0))
            d.line(MARGIN, self.y + rh, PW - MARGIN, self.y + rh, 0.8, LINE)
            d.text(a, 15.5, PW - MARGIN - 20, self.y + 13, INK, "semi", align="right", maxw=280)
            d.text(b, 15, MARGIN + 24, self.y + 14, BODY, "regular", align="left",
                   maxw=CONTENT_W - 330, lh=1.4)
            self.y += rh
        self.y += 16
        return self


    # -- figures ----------------------------------------------------------
    def ui_mock(self, title, caption=""):
        d = self.d
        w, h = CONTENT_W, 300
        x = MARGIN
        d.rrect(x, self.y, w, h, 20, fill=(0.976, 0.985, 1.0), stroke=(0.85, 0.90, 0.97), sw=1.2)
        d.rrect(x, self.y, w, 46, 20, fill=(0.93, 0.95, 0.99))
        d.rrect(x, self.y + 30, w, 16, 0, fill=(0.93, 0.95, 0.99))
        for i, c in enumerate(((0.98, 0.45, 0.42), (0.98, 0.75, 0.30), (0.30, 0.78, 0.55))):
            d.circle(x + 26 + i * 18, self.y + 23, 5, c)
        d.text(title, 15, x + w - 22, self.y + 13, SLATE, "semi", align="right",
               maxw=w - 140, lh=1.2)

        # drop zone
        dz_y = self.y + 66
        d.rrect(x + 28, dz_y, w - 56, 96, 14, fill=(1, 1, 1), stroke=(0.82, 0.88, 0.97),
                sw=1.4)
        d.text("فایل نصب افزونه را انتخاب کنید", 15, x + w / 2 - 20, dz_y + 22, SLATE,
               "medium", align="center", maxw=w - 120, lh=1.2)
        d.rrect(x + w / 2 - 30, dz_y + 56, 100, 30, 15, fill=ROYAL)
        d.text("انتخاب فایل", 13, x + w / 2 + 20, dz_y + 63, WHITE, "semi", align="center", lh=1.2)

        # buttons row
        by = dz_y + 112
        d.rrect(x + w - 178, by, 150, 36, 18, fill=ROYAL)
        d.text("هم‌اکنون نصب کن", 13.5, x + w - 103, by + 8, WHITE, "semi", align="center", lh=1.2)
        d.rrect(x + w - 344, by, 150, 36, 18, fill=(0.92, 0.94, 0.98))
        d.text("انصراف", 13.5, x + w - 269, by + 8, SLATE, "medium", align="center", lh=1.2)

        # progress + success
        py = by + 50
        d.rrect(x + 28, py, w - 56, 10, 5, fill=(0.90, 0.93, 0.98))
        d.rrect(x + 28, py, (w - 56) * 0.72, 10, 5, fill=(0.18, 0.62, 0.96))
        d.circle(x + 28 + (w - 56) * 0.72, py + 5, 8, WHITE)
        d.circle(x + 28 + (w - 56) * 0.72, py + 5, 5, ROYAL)
        d.text("نصب افزونه: ۷۲٪", 13, x + w - 28, py + 22, SOFT, "medium", align="right")
        d.text("پس از پایان نصب، «فعال‌سازی افزونه» را بزنید.", 13, x + 28, py + 22,
               SOFT, "regular", align="left", maxw=w - 220)
        self.y += h + 20
        if caption:
            d.text(caption, 13.5, PW / 2, self.y - 12, SOFT, "medium", align="center", maxw=CONTENT_W)
            self.y += 8
        return self

    def tree_mock(self):
        d = self.d
        rows = [
            ("wp-content/", 0, False),
            ("plugins/", 1, False),
            ("aria-aiwriter/", 2, True),
            ("aria-ai-writer.php", 3, True),
            ("includes/", 3, False),
            ("admin/  assets/  languages/", 3, False),
        ]
        w = CONTENT_W
        h = 60 + len(rows) * 40
        d.rrect(MARGIN, self.y, w, h, 18, fill=(0.10, 0.16, 0.28))
        d.text("ساختار صحیح پوشه‌ها روی هاست", 14, MARGIN + w - 24, self.y + 18,
               (0.72, 0.84, 1.0), "semi", align="right")
        for i, (name, depth, hot) in enumerate(rows):
            yy = self.y + 52 + i * 40
            x = MARGIN + 26 + depth * 26
            if hot:
                d.rrect(x - 8, yy - 6, d.text_width(name, 15, "medium") + 16, 30, 8,
                        fill=(0.16, 0.42, 0.90), alpha=0.35)
            d.text(name, 15, x, yy,
                   (0.96, 0.99, 1.0) if hot else (0.66, 0.78, 0.96), "medium",
                   align="left", base_rtl=False)
        self.y += h + 16
        return self

    def checklist(self, items, title="چک‌لیست پایان راه‌اندازی"):
        d = self.d
        w = CONTENT_W
        h = 64 + len(items) * 40
        d.rrect(MARGIN, self.y, w, h, 18, fill=(0.96, 0.995, 0.98), stroke=(0.80, 0.94, 0.88),
                sw=1.2)
        d.text(title, 16, PW - MARGIN - 24, self.y + 18, (0.10, 0.45, 0.35), "bold",
               align="right")
        for i, it in enumerate(items):
            yy = self.y + 56 + i * 40
            d.rrect(MARGIN + 30, yy + 2, 22, 22, 7, fill=MINT, alpha=0.9)
            d.polyline([(MARGIN + 35, yy + 13), (MARGIN + 40, yy + 18), (MARGIN + 48, yy + 7)],
                       2.2, WHITE, 1.0)
            d.text(it, 14.5, PW - MARGIN - 62, yy + 3, BODY, "regular", align="right",
                   maxw=w - 130, lh=1.5)
        self.y += h + 14
        return self

    def save(self, path):
        self.d.save(path, size=(PW, PH))
        im = Image.open(path).convert("RGB")   # flatten alpha for the PDF
        im.save(path, dpi=(150, 150), optimize=True)
        return path


TOTAL = 8


def page1():
    p = Page(1, TOTAL)
    d = p.d
    d.glow(980, 250, 420, SKY, 0.10, "normal")
    d.text("راهنمای نصب و راه‌اندازی", 46, PW - MARGIN, 320, INK, "black", align="right",
           maxw=CONTENT_W, lh=1.4)
    d.text("افزونهٔ وردپرس ARIAGH.AIWRITER — نویسنده هوشمند سئو", 20, PW - MARGIN, 400,
           SOFT, "medium", align="right", maxw=CONTENT_W, lh=1.6)
    d.line(PW - MARGIN - 120, 452, PW - MARGIN, 452, 3, SKY)

    items = [
        ("۱", "پیش‌نیازها", "وردپرس، PHP و دسترسی‌های لازم"),
        ("۲", "نصب از پیشخوان وردپرس", "سریع‌ترین روش؛ بدون FTP"),
        ("۳", "نصب با FileZilla — روش FTP", "وقتی بارگذاری از پیشخوان ممکن نیست"),
        ("۴", "به‌روزرسانی افزونه", "سه روش امن به‌روزرسانی"),
        ("۵", "دسترسی کاربران", "نقش‌ها، مجوزها و منوی افزونه"),
        ("۶", "راه‌اندازی اولیه", "از لایسنس تا اولین مقاله"),
        ("۷", "پرسش‌های متداول", "خطاهای رایج و راه‌حل"),
    ]
    y = 500
    for n, t, s in items:
        d.rrect(MARGIN + 40, y, CONTENT_W - 40, 92, 18, fill=(0.978, 0.987, 1.0),
                stroke=LINE, sw=1.0)
        d.rrect(MARGIN + 40, y, 6, 92, 3, fill=ROYAL)
        d.text(t, 21, PW - MARGIN - 34, y + 20, INK, "bold", align="right", maxw=CONTENT_W - 120)
        d.text(s, 15, PW - MARGIN - 34, y + 56, SOFT, "regular", align="right", maxw=CONTENT_W - 160)
        y += 104
    p.d.text("این راهنما برای خریداران محصول در ژاکت تهیه شده است.", AUTHOR_NOTE_SIZE,
             PW - MARGIN, y + 16, SOFT, "medium", align="right")
    return p


AUTHOR_NOTE_SIZE = 14


def page2():
    p = Page(2, TOTAL)
    p.title("۱. پیش‌نیازها", "پیش از نصب، مطمئن شوید هاست شما شرایط زیر را دارد.")
    p.table([
        ("وردپرس", "نسخهٔ به‌روز و پشتیبانی‌شده"),
        ("PHP", "نسخهٔ به‌روز — با «سلامت سایت» بررسی کنید"),
        ("دسترسی مدیر", "نقش Administrator در پیشخوان وردپرس"),
        ("توابع سرور", "اجازهٔ اتصال خروجی به اینترنت برای API پرووایدرها"),
        ("اختیاری", "ووکامرس برای تحلیل محصولات و المنتور برای ساخت صفحات"),
    ], head=("مورد", "حداقل لازم"))
    p.h2("چه چیزی داخل بسته است؟")
    p.bullets([
        "فایل نصب افزونه با نام aria-aiwriter.zip در پوشهٔ plugin.",
        "این راهنما در قالب PDF و نسخهٔ HTML آن.",
        "دموی پیشخوان و صفحهٔ پیش‌نمایش محصول، بدون نیاز به نصب.",
    ])
    p.callout("tip", "اگر نمی‌دانید نسخهٔ PHP هاست‌تان چند است، در پیشخوان وردپرس به "
                     "«ابزارها ← سلامت سایت ← اطلاعات ← سرور» بروید.")
    p.h2("قبل از شروع، پشتیبان بگیرید")
    p.para("از فایل‌ها و دیتابیس سایت یک نسخهٔ پشتیبان تهیه کنید. نصب افزونه معمولاً بدون "
           "خطر است، اما داشتن نسخهٔ پشتیبان همیشه بهترین کار ممکن است.")
    p.callout("warn", "افزونه را روی سایت اصلی نصب نکنید مگر پس از تست روی یک نسخهٔ "
                      "آزمایشی؛ به‌ویژه اگر از افزونه‌های سئو و کش استفاده می‌کنید.")
    return p


def page3():
    p = Page(3, TOTAL)
    p.title("۲. نصب از پیشخوان وردپرس", "کمتر از دو دقیقه، بدون نیاز به FTP.")
    p.steps([
        ("ورود به پیشخوان", "با نقش مدیر وارد پیشخوان وردپرس شوید و از منوی کنار به "
                             "«افزونه‌ها ← افزودن افزونهٔ جدید» بروید."),
        ("انتخاب بارگذاری", "روی دکمهٔ «بارگذاری افزونه» در بالای صفحه کلیک کنید."),
        ("انتخاب فایل ZIP", "روی «انتخاب فایل» بزنید و فایل aria-aiwriter.zip را از "
                              "بستهٔ خریداری‌شده انتخاب کنید. فایل را از حالت فشرده خارج نکنید."),
        ("نصب", "روی «هم‌اکنون نصب کن» کلیک کنید و تا پایان نصب صبر کنید."),
        ("فعال‌سازی", "پس از پیام موفقیت، روی «فعال‌سازی افزونه» کلیک کنید."),
        ("ورود به افزونه", "در منوی پیشخوان، گزینهٔ «AIWRITER» اضافه می‌شود؛ روی آن بزنید."),
    ])
    p.callout("info", "اگر پیام «فایل بارگذاری‌شده از حداکثر اندازهٔ مجاز بیشتر است» دیدید، "
                      "حداکثر اندازهٔ بارگذاری هاست کم است؛ از روش FTP در صفحهٔ بعد استفاده کنید.")
    p.callout("warn", "اگر پیام «پیوند شما منقضی شده است» دیدید، صفحه را دوباره بارگذاری کنید "
                      "و سریع‌تر مراحل را انجام دهید؛ این پیام مربوط به محدودیت زمانی وردپرس است.")
    p.ui_mock("افزونه‌ها  ›  افزودن افزونهٔ جدید  ›  بارگذاری افزونه",
              "نمای شماتیک صفحهٔ بارگذاری افزونه در پیشخوان وردپرس")
    return p


def page4():
    p = Page(4, TOTAL)
    p.title("۳. نصب با FileZilla — روش FTP", "برای هاست‌هایی که بارگذاری ZIP در پیشخوان "
                                             "محدود است.")
    p.steps([
        ("اتصال", "FileZilla را باز کنید و با میزبان، نام کاربری، رمز و پورت FTP "
                  "به هاست وصل شوید؛ پورت معمولاً ۲۱ است."),
        ("مسیر افزونه‌ها", "به پوشهٔ wp-content و سپس plugins بروید."),
        ("بارگذاری فایل ZIP", "فایل aria-aiwriter.zip را از پنجرهٔ سمت چپ بکشید و در پوشهٔ "
                               "plugins رها کنید."),
        ("استخراج", "روی فایل بارگذاری‌شده راست‌کلیک کنید و گزینهٔ Extract را بزنید."),
        ("بررسی پوشه", "مطمئن شوید پوشه‌ای با نام aria-aiwriter ساخته شده و فایل "
                        "aria-ai-writer.php درست داخل همان پوشه است."),
        ("فعال‌سازی", "به پیشخوان وردپرس برگردید، «افزونه‌ها» را باز کنید و افزونه را فعال کنید."),
    ])
    p.code("wp-content/plugins/aria-ai-writer/aria-ai-writer.php")
    p.tree_mock()
    p.callout("warn", "اگر پوشهٔ اضافه‌ای مثل aria-aiwriter یا aria-ai-writer-1.9.1 ساخته شد، "
                      "فایل اصلی در عمق اشتباهی است و افزونه در فهرست دیده نمی‌شود؛ پوشهٔ تودرتو "
                      "را جابه‌جا کنید تا مسیر دقیقاً مطابق بالا شود.")
    return p


def page5():
    p = Page(5, TOTAL)
    p.title("۴. به‌روزرسانی افزونه", "سه روش امن؛ تنظیمات و مقالات شما حفظ می‌شود.")
    p.h2("روش اول — بارگذاری نسخهٔ جدید، پیشنهادی")
    p.steps([
        ("پشتیبان", "از دیتابیس سایت پشتیبان بگیرید."),
        ("بارگذاری", "در «افزونه‌ها ← افزودن افزونهٔ جدید ← بارگذاری افزونه»، فایل ZIP نسخهٔ "
                      "جدید را انتخاب کنید."),
        ("جایگزینی", "وردپرس پیام «نسخهٔ جدیدتری نصب شده است» را نشان می‌دهد؛ روی "
                      "«جایگزینی نسخهٔ فعلی» کلیک کنید."),
    ])
    p.h2("روش دوم — حذف و نصب مجدد از FTP")
    p.bullets([
        "ابتدا افزونه را از پیشخوان غیرفعال کنید.",
        "پوشهٔ aria-aiwriter را از wp-content/plugins تغییر نام دهید، حذف نکنید.",
        "نسخهٔ جدید را استخراج و افزونه را دوباره فعال کنید.",
    ])
    p.callout("tip", "تنظیمات افزونه در دیتابیس ذخیره می‌شود و با حذف پوشه از بین نمی‌رود؛ "
                     "با این حال تهیهٔ پشتیبان دیتابیس همیشه توصیه می‌شود.")
    p.h2("روش سوم — به‌روزرسانی از داخل افزونه")
    p.para("اگر سایت شما به سرور به‌روزرسانی محصول متصل باشد، نسخهٔ جدید در صفحهٔ «افزونه‌ها» "
           "نمایش داده می‌شود و می‌توانید از همان‌جا به‌روزرسانی کنید.")
    p.callout("warn", "پس از هر به‌روزرسانی، یک‌بار تب «لایسنس و حساب» و تب «کلادفلر» را باز "
                      "کنید تا وضعیت اتصال و نسخهٔ ورکر بررسی شود.")
    return p


def page6():
    p = Page(6, TOTAL)
    p.title("۵. دسترسی کاربران", "چه کسی چه کاری می‌تواند انجام دهد؟")
    p.para("منوی AIWRITER برای نقش «مدیر» یعنی Administrator نمایش داده می‌شود؛ زیرا تنظیمات "
           "افزونه شامل کلیدهای API و لایسنس است.")
    p.table([
        ("مدیر سایت", "دسترسی کامل به همهٔ ۲۴ تب، تنظیمات، لایسنس و انتشار"),
        ("ویرایشگر", "دسترسی به مقالات تولیدشده از مسیر «نوشته‌ها»"),
        ("نویسنده", "مشاهده و ویرایش پیش‌نویس‌های خودش"),
        ("مشترک", "بدون دسترسی به بخش هوش مصنوعی"),
    ], head=("نقش", "دسترسی"))
    p.h2("دادن دسترسی به کاربر دیگر")
    p.steps([
        ("ایجاد کاربر", "در «کاربران ← افزودن کاربر جدید» یک حساب با نقش مدیر بسازید."),
        ("ورود", "با همان حساب وارد شوید؛ منوی AIWRITER در دسترس خواهد بود."),
        ("محدودسازی اختیاری", "با یک افزونهٔ مدیریت نقش می‌توانید مجوز aaw_manage را به "
                                 "نقش دلخواه بدهید بدون دادن دسترسی کامل مدیر."),
    ])
    p.callout("warn", "کلیدهای API و لایسنس را در اختیار کاربران غیرمدیر قرار ندهید؛ این "
                      "اطلاعات در تب‌های «کلیدهای API و مدل‌ها» و «لایسنس و حساب» است.")
    return p


def page7():
    p = Page(7, TOTAL)
    p.title("۶. راه‌اندازی اولیه", "از نصب تا اولین مقاله، گام‌به‌گام.")
    p.steps([
        ("لایسنس و حساب", "در تب «لایسنس و حساب» وضعیت فعال‌سازی و دامنه را بررسی کنید."),
        ("کلادفلر", "در تب «کلادفلر»، API Token را وارد کنید و «استقرار ورکر» را بزنید "
                     "پلن رایگان کافی است."),
        ("موتور هوش مصنوعی", "در تب «هوش مصنوعی تولید محتوا» یک پرووایدر انتخاب و تست اتصال "
                              "کنید؛ یا در «اکانت اشتراکی» روش اجرا را مشخص کنید."),
        ("تحلیل هوشمند سایت", "در داشبورد، «تحلیل هوشمند سایت» را بزنید تا موضوعات و "
                               "استراتژی محتوا ساخته شود."),
        ("موضوعات و پرامپت", "در تب «موضوعات» اولویت‌ها را ببینید و در تب «پرامپت» لحن، "
                              "زبان و ساختار مقاله را تنظیم کنید."),
        ("زمان‌بندی", "در تب «زمان‌بندی»، تعداد مقاله در روز و ساعت اجرا را مشخص کنید."),
        ("صف بازبینی", "مقالات در «صف بازبینی» برای تأیید شما قرار می‌گیرند؛ پس از تأیید "
                        "منتشر می‌شوند."),
    ])
    p.callout("tip", "برای اولین اجرا، «اجرای دستی» را بزنید تا بدون انتظار برای زمان‌بندی، "
                     "کل مسیر را یک‌بار ببینید.")
    p.checklist([
        "لایسنس در تب «لایسنس و حساب» تأیید شده است.",
        "کلادفلر متصل و ورکر مستقر شده است.",
        "تست اتصال پرووایدر فعال با پیام موفقیت انجام شده است.",
        "تحلیل هوشمند سایت اجرا و موضوعات ساخته شده‌اند.",
        "زمان‌بندی فعال و صف بازبینی بررسی شده است.",
    ])
    return p


def page8():
    p = Page(8, TOTAL)
    p.title("۷. پرسش‌های متداول و عیب‌یابی")
    p.h2("افزونه در فهرست افزونه‌ها دیده نمی‌شود")
    p.para("مسیر پوشه اشتباه است. فایل aria-aiwriter.php باید دقیقاً در "
           "wp-content/plugins/aria-ai-writer/ باشد.")
    p.h2("بارگذاری ZIP با خطا متوقف می‌شود")
    p.para("محدودیت حجم یا محدودیت مجوز فایل روی هاست را بررسی کنید؛ در این حالت از روش "
           "FTP استفاده کنید.")
    p.h2("تولید مقاله اجرا نمی‌شود")
    p.bullets([
        "در تب پرووایدر، «تست اتصال» را بزنید و پیام خطا را بخوانید.",
        "وضعیت ورکر در تب «کلادفلر» و وجود Cron را بررسی کنید.",
        "در تب «گزارش‌ها» آخرین خطاها و در «فعالیت زنده» وضعیت اجرا را ببینید.",
    ])
    p.h2("تصویر شاخص ساخته نمی‌شود")
    p.para("در تب «هوش مصنوعی تولید تصویر» موتور تصویر را تنظیم و تست کنید؛ اگر مدل انتخابی "
           "تصویر تولید نمی‌کند، مدل دیگری انتخاب کنید.")
    p.h2("حافظهٔ هاست کافی نیست")
    p.para("در حالت اجرای مستقیم روی سرور، افزونه مقدار واقعی سقف حافظه را گزارش می‌کند؛ "
           "از هاست بخواهید سقف Memory Limit را افزایش دهد یا از روش کلادفلر استفاده کنید.")
    p.callout("tip", "اگر مشکل حل نشد، از تب «گزارش‌ها» خروجی را کپی کنید و همراه آدرس سایت "
                     "و نسخهٔ افزونه برای پشتیبانی بفرستید.")
    return p


HTML_TEMPLATE = """<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>راهنمای نصب ARIAGH.AIWRITER</title>
<style>
@font-face{{font-family:Vazirmatn;src:url("assets/fonts/Vazirmatn-Variable.woff2") format("woff2-variations");font-weight:100 900;font-display:swap}}
:root{{--ink:#0B1B3F;--body:#324057;--soft:#6B7A90;--line:#DDE7F8;--royal:#1D4ED8;--sky:#38BDF8;--ice:#F1F6FF}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--ice);color:var(--body);font-family:Vazirmatn,Tahoma,sans-serif;
  line-height:2;font-size:16px}}
.page{{max-width:820px;margin:0 auto;background:#fff;padding:48px 56px 64px;
  box-shadow:0 20px 60px -40px rgba(11,27,63,.45);border-radius:18px;margin-block:28px}}
header{{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);
  padding-bottom:18px;margin-bottom:28px}}
header b{{font-size:1.05rem;color:var(--ink)}}
header span{{font-size:.8rem;color:var(--soft)}}
h1{{color:var(--ink);font-size:1.9rem;line-height:1.5;margin:0 0 6px}}
h2{{color:var(--ink);font-size:1.18rem;margin:30px 0 8px;padding-inline-start:12px;
  border-inline-start:4px solid var(--royal);line-height:1.6}}
h3{{color:var(--ink);font-size:1rem;margin:20px 0 6px}}
p{{margin:0 0 10px}}
ul,ol{{margin:0 0 12px;padding-inline-start:1.4rem}}
li{{margin-bottom:6px}}
.lead{{color:var(--soft);font-size:1rem;margin-bottom:22px}}
.step{{background:#F7FAFF;border:1px solid var(--line);border-radius:14px;padding:14px 18px;margin-bottom:10px}}
.step b{{color:var(--ink);display:block;margin-bottom:2px}}
code,.code{{direction:ltr;text-align:left;display:block;background:#101A2C;color:#CFE1FF;
  border-radius:10px;padding:10px 14px;font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:.86rem;margin:8px 0 12px;unicode-bidi:embed}}
table{{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:.94rem}}
th,td{{border-bottom:1px solid var(--line);padding:10px 8px;text-align:start}}
th{{background:#F2F7FF;color:var(--ink);font-size:.86rem}}
.note{{border-radius:12px;padding:12px 16px;margin:12px 0;font-size:.94rem;border-inline-start:5px solid}}
.tip{{background:#EDFBF6;border-color:#2ECE9F}}
.warn{{background:#FFF8E8;border-color:#E2A106}}
.info{{background:#EFF7FF;border-color:#38BDF8}}
footer{{border-top:1px solid var(--line);margin-top:32px;padding-top:16px;font-size:.8rem;
  color:var(--soft);display:flex;justify-content:space-between}}
@media print{{body{{background:#fff}}.page{{box-shadow:none;margin:0;max-width:none;border-radius:0}}}}
</style>
</head>
<body>
<div class="page">
<header><b>ARIAGH.AIWRITER</b><span>راهنمای نصب و راه‌اندازی</span></header>
<h1>راهنمای نصب و راه‌اندازی</h1>
<p class="lead">افزونه وردپرس ARIAGH.AIWRITER — نویسنده هوشمند سئو. این راهنما نصب از پیشخوان،
نصب با FileZilla، به‌روزرسانی، دسترسی کاربران و راه‌اندازی اولیه را پوشش می‌دهد.</p>

<h2>۱. پیش‌نیازها</h2>
<table>
<tr><th>مورد</th><th>حداقل لازم</th></tr>
<tr><td>وردپرس</td><td>نسخهٔ به‌روز و پشتیبانی‌شده</td></tr>
<tr><td>PHP</td><td>نسخهٔ به‌روز (با «سلامت سایت» بررسی کنید)</td></tr>
<tr><td>دسترسی مدیر</td><td>نقش Administrator در پیشخوان وردپرس</td></tr>
<tr><td>توابع سرور</td><td>اجازه اتصال خروجی (Outbound) برای API پرووایدرها</td></tr>
<tr><td>اختیاری</td><td>ووکامرس (تحلیل محصولات) و المنتور (ساخت صفحات)</td></tr>
</table>
<div class="note tip">اگر نمی‌دانید نسخه PHP هاست چند است، در پیشخوان به «ابزارها ← سلامت سایت ←
اطلاعات ← سرور» بروید.</div>

<h2>۲. نصب از پیشخوان وردپرس</h2>
<div class="step"><b>ورود به پیشخوان</b>با نقش مدیر وارد شوید و به «افزونه‌ها ← افزودن افزونهٔ جدید» بروید.</div>
<div class="step"><b>انتخاب بارگذاری</b>روی «بارگذاری افزونه» کلیک کنید.</div>
<div class="step"><b>انتخاب فایل ZIP</b>فایل aria-aiwriter.zip را انتخاب کنید (آن را از حالت فشرده خارج نکنید).</div>
<div class="step"><b>نصب</b>روی «هم‌اکنون نصب کن» بزنید و منتظر پایان نصب بمانید.</div>
<div class="step"><b>فعال‌سازی</b>روی «فعال‌سازی افزونه» کلیک کنید.</div>
<div class="step"><b>ورود به افزونه</b>از منوی پیشخوان گزینه «AIWRITER» را باز کنید.</div>
<div class="note warn">اگر پیام «فایل بارگذاری‌شده از حداکثر اندازهٔ مجاز بیشتر است» دیدید،
از روش FTP استفاده کنید.</div>

<h2>۳. نصب با FileZilla (FTP)</h2>
<div class="step"><b>اتصال</b>با میزبان، نام کاربری، رمز و پورت FTP (معمولاً ۲۱) وصل شوید.</div>
<div class="step"><b>مسیر</b>به پوشه wp-content و سپس plugins بروید.</div>
<div class="step"><b>بارگذاری</b>فایل ZIP را در پوشه plugins آپلود کنید.</div>
<div class="step"><b>استخراج</b>روی فایل راست‌کلیک و Extract بزنید.</div>
<div class="step"><b>بررسی مسیر</b>مطمئن شوید فایل اصلی در مسیر زیر است:</div>
<div class="code">wp-content/plugins/aria-ai-writer/aria-ai-writer.php</div>
<div class="step"><b>فعال‌سازی</b>در «افزونه‌ها» افزونه را فعال کنید.</div>
<div class="note warn">اگر پوشه‌ای تودرتو ساخته شد، فایل اصلی در عمق اشتباهی است و افزونه دیده نمی‌شود.</div>

<h2>۴. به‌روزرسانی افزونه</h2>
<h3>روش اول — بارگذاری نسخه جدید (پیشنهادی)</h3>
<p>از دیتابیس پشتیبان بگیرید، در «افزونه‌ها ← افزودن ← بارگذاری» فایل ZIP جدید را انتخاب کنید و
روی «جایگزینی نسخهٔ فعلی» بزنید.</p>
<h3>روش دوم — حذف و نصب مجدد از FTP</h3>
<ul><li>افزونه را غیرفعال کنید.</li><li>پوشه aria-aiwriter را تغییر نام دهید (حذف نکنید).</li>
<li>نسخه جدید را استخراج و افزونه را فعال کنید.</li></ul>
<div class="note tip">تنظیمات در دیتابیس ذخیره می‌شود و با حذف پوشه از بین نمی‌رود؛ با این حال
پشتیبان دیتابیس توصیه می‌شود.</div>
<h3>روش سوم — به‌روزرسانی از داخل افزونه</h3>
<p>اگر سایت به سرور به‌روزرسانی محصول متصل باشد، نسخه جدید در صفحه «افزونه‌ها» نمایش داده می‌شود.</p>

<h2>۵. دسترسی کاربران</h2>
<table>
<tr><th>نقش</th><th>دسترسی</th></tr>
<tr><td>مدیر سایت</td><td>دسترسی کامل به ۲۴ تب، تنظیمات، لایسنس و انتشار</td></tr>
<tr><td>ویرایشگر</td><td>دسترسی به مقالات تولیدشده از مسیر «نوشته‌ها»</td></tr>
<tr><td>نویسنده</td><td>مشاهده و ویرایش پیش‌نویس‌های خودش</td></tr>
<tr><td>مشترک</td><td>بدون دسترسی به بخش هوش مصنوعی</td></tr>
</table>
<p>برای دادن دسترسی به کاربر دیگر، حسابی با نقش مدیر بسازید؛ یا با افزونه مدیریت نقش، مجوز
<code style="direction:ltr;display:inline-block;padding:2px 6px">aaw_manage</code> را به نقش دلخواه بدهید.</p>

<h2>۶. راه‌اندازی اولیه</h2>
<div class="step"><b>لایسنس و حساب</b>وضعیت فعال‌سازی و دامنه را بررسی کنید.</div>
<div class="step"><b>کلادفلر</b>API Token را وارد و «استقرار ورکر» را بزنید (پلن رایگان کافی است).</div>
<div class="step"><b>موتور هوش مصنوعی</b>یک پرووایدر انتخاب و «تست اتصال» را بزنید.</div>
<div class="step"><b>تحلیل هوشمند سایت</b>در داشبورد «تحلیل هوشمند سایت» را اجرا کنید.</div>
<div class="step"><b>موضوعات و پرامپت</b>اولویت موضوعات، لحن، زبان و ساختار مقاله را تنظیم کنید.</div>
<div class="step"><b>زمان‌بندی</b>تعداد مقاله در روز و ساعت اجرا را مشخص کنید.</div>
<div class="step"><b>صف بازبینی</b>مقالات را تأیید و منتشر کنید.</div>

<h2>۷. پرسش‌های متداول</h2>
<h3>افزونه در فهرست افزونه‌ها دیده نمی‌شود</h3>
<p>مسیر پوشه اشتباه است؛ فایل اصلی باید دقیقاً در wp-content/plugins/aria-ai-writer/ باشد.</p>
<h3>بارگذاری ZIP با خطا متوقف می‌شود</h3>
<p>محدودیت حجم یا مجوز فایل را بررسی کنید؛ از روش FTP استفاده کنید.</p>
<h3>تولید مقاله اجرا نمی‌شود</h3>
<ul><li>در تب پرووایدر «تست اتصال» را بزنید.</li><li>وضعیت ورکر و Cron را در تب «کلادفلر» بررسی کنید.</li>
<li>در تب «گزارش‌ها» آخرین خطاها را ببینید.</li></ul>
<h3>حافظه هاست کافی نیست</h3>
<p>در حالت اجرای مستقیم، افزونه مقدار واقعی سقف حافظه را گزارش می‌کند؛ از هاست افزایش Memory Limit
را بخواهید یا از روش کلادفلر استفاده کنید.</p>

<footer><span>ARIAGH.AIWRITER</span><span>ariagh · پشتیبانی فارسی</span></footer>
</div>
</body>
</html>
"""


def build():
    pages = [page1(), page2(), page3(), page4(), page5(), page6(), page7(), page8()]
    out_dir = os.path.join(out_path("06-guide", "pages"))
    os.makedirs(os.path.dirname(out_dir), exist_ok=True)
    files = []
    for i, p in enumerate(pages, 1):
        f = os.path.join(out_dir, f"guide-page-{i:02d}.png")
        p.save(f)
        files.append(f)
    return files


if __name__ == "__main__":
    print("\n".join(build()))

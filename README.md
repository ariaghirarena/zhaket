# ARIAGH.AIWRITER — بستهٔ انتشار در ژاکت

بستهٔ کامل فروش افزونهٔ وردپرس **ARIAGH.AIWRITER** (نویسنده هوشمند سئو) در بازار ژاکت:
۷ خروجی استاندارد مهارت `zhaket` + بستهٔ نهایی آپلود + کپی آگهی.

| مورد | مسیر |
|---|---|
| بستهٔ نهایی آپلود | `deliverables/08-package/aria-aiwriter-zhaket-package.zip` |
| فهرست کامل فایل‌ها و ترتیب آپلود | `deliverables/README.md` |
| کپی آگهی ژاکت | `deliverables/07-listing/ZHAKET_PRODUCT_LISTING_ARIA_AIWRITER.md` |

## فایل‌های ورودی

- `ARIAGH-AIWRITER-1.9.1-OWNER-Unlimited.zip` — سورس افزونه (نسخهٔ OWNER)
- `ariagh-aiwriter-github-backup.zip` — بکاپ شامل سرور لایسنس

## آنچه در این جلسه ساخته شد

1. **آیکون ۸۰×۸۰** با نام محصول زیر لوگو (رندر ۴× سپس LANCZOS)
2. **کاور ۴۰۰×۴۰۰** با ناحیهٔ امن بالا-چپ خالی
3. **دو کاور ۷۰۰×۷۰۰** (معرفی + شبکهٔ قابلیت‌ها)
4. **اینفوگرافیک عمودی ۱۲۰۰×۳۸۸۰** + ۴ برش بدون قطع متن
5. **سایت دمو** (صفحهٔ پیش‌نمایش + پیشخوان تعاملی ۲۴ تب) به‌صورت ZIP آمادهٔ cPanel
6. **توضیحات سئویی HTML** (کامل + snippet آمادهٔ درج)
7. **راهنمای فارسی نصب** — ۸ صفحه، هم `help.pdf` و هم HTML
8. **بستهٔ استاندارد ژاکت**: `plugin/aria-ai-writer.zip` + `documents/` + `help.pdf`

## تغییر کد افزونه (نسخه ۱.۹.۱ ← ۱.۹.۲)

| تغییر | دلیل |
|---|---|
| فونت Vazirmatn به `assets/fonts/` منتقل شد و `assets/css/fonts.css` اضافه شد | حذف درخواست به `fonts.googleapis.com`؛ ژاکت هر asset خارجی را رد می‌کند و این CDN در ایران بلاک است |
| `wp_enqueue_style( 'aaw-font', … )` از CDN به فایل محلی تغییر کرد | همان دلیل |
| بنر نسخه و `readme.txt` به ۱.۹.۲ به‌روزرسانی شد | تفکیک نسخهٔ منتشرشده در بازار از نسخهٔ قبلی |

## بازسازی خروجی‌ها

```bash
python3 -m venv .venv && .venv/bin/pip install pillow numpy uharfbuzz arabic-reshaper python-bidi img2pdf pypdf
unzip -q ARIAGH-AIWRITER-1.9.1-OWNER-Unlimited.zip -d work/          # → work/aria-ai-writer/
npm pack vazirmatn && tar -xzf vazirmatn-*.tgz -C /tmp/vz && \
  cp /tmp/vz/package/fonts/ttf/Vazirmatn-*.ttf work/fonts/            # فونت‌های رندر
.venv/bin/python work/build/icon.py
.venv/bin/python work/build/cover400.py
.venv/bin/python work/build/covers700.py
.venv/bin/python work/build/infographic.py
.venv/bin/python work/build/demo.py
.venv/bin/python work/build/guide.py && (img2pdf work/../deliverables/06-guide/pages/*.png -o deliverables/06-guide/help.pdf)
.venv/bin/python work/build/package.py
```

## ابزارها

- `work/lib/fa.py` — رندر متن فارسی بدون مرورگر (HarfBuzz + fontTools + رستر even-odd)
- `work/lib/design.py` — شیشه مات، سایه، گرادیان، آیکون، لوگوی برداری واقعی
- `work/lib/svgdraw.py` — رستر SVG برای لوگو/مارک
- `work/tools/zoom.py` — بزرگ‌نمایی ناحیهٔ تصویر برای بازبینی

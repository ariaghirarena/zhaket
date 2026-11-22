# فهرست خروجی‌ها — بستهٔ ژاکت ARIAGH.AIWRITER

نسخهٔ محصول: **۱.۹.۲** · تاریخ ساخت: ۲۰۲۶‑۱۱‑۲۲

---

## ۱. ترتیب آپلود در ژاکت

| گام | فیلد ژاکت | فایل |
|---|---|---|
| ۱ | آیکون محصول | `00-icon/aria-aiwriter-icon-80x80.png` |
| ۲ | کاور محصول | `01-cover-400x400/aria-aiwriter-cover-400x400.png` |
| ۳ | تصاویر گالری | `02-cover-700/*.png` سپس `03-infographic/aria-aiwriter-infographic-part-01..04.png` |
| ۴ | توضیحات | `05-description/aria-aiwriter-description-snippet.html` |
| ۵ | فایل محصول | `08-package/aria-aiwriter-zhaket-package.zip` |
| ۶ | آدرس پیش‌نمایش | دمو را هاست کنید (بخش ۳) و لینک را وارد کنید |
| ۷ | نام/اسلاگ/برچسب/نیازمندی | `07-listing/ZHAKET_PRODUCT_LISTING_ARIA_AIWRITER.md` |

---

## ۲. ساختار پوشه‌ها

```
deliverables/
├── 00-icon/            aria-aiwriter-icon-80x80.png  (+ سورس ۳۲۰×۳۲۰)
├── 01-cover-400x400/   کاور ۴۰۰×۴۰۰ با ناحیهٔ امن بالا-چپ
├── 02-cover-700/       دو کاور ۷۰۰×۷۰۰
├── 03-infographic/     اینفوگرافیک کامل ۱۲۰۰×۳۸۸۰ + ۴ برش
├── 04-demo/            aria-aiwriter-demo.zip (صفحهٔ پیش‌نمایش + پیشخوان تعاملی)
├── 05-description/     توضیحات HTML (کامل + snippet آمادهٔ درج)
├── 06-guide/           help.pdf (۸ صفحه) + pages/ (تصاویر صفحه‌ها)
├── 07-listing/         کپی کامل آگهی ژاکت
└── 08-package/         aria-aiwriter-zhaket-package.zip  ← فایل نهایی آپلود
```

## ۳. هاست کردن دمو (اقدام باقی‌مانده برای شما)

1. `04-demo/aria-aiwriter-demo.zip` را در `public_html` یا زیرپوشهٔ `aiwriter` آپلود کنید.
2. Extract بزنید؛ ساختار حاصل: `index.html` + `demo/` + `assets/`.
3. تست کنید: `https://دامنه/aiwriter/` و `https://دامنه/aiwriter/demo/`.
4. همان لینک اول را در فیلد «آدرس پیش‌نمایش» ژاکت بگذارید.

> دمو ۱۰۰٪ استاتیک است: نه PHP لازم دارد، نه دیتابیس، نه درخواست بیرونی (فونت داخل بسته است).

## ۴. بستهٔ نهایی — چه چیزی داخلش است؟

```
aria-aiwriter-zhaket-package.zip
├── plugin/aria-ai-writer.zip           ۸۵۳ KB · ۱۱۲ فایل · ریشه: aria-ai-writer/aria-ai-writer.php
├── documents/aria-ai-writer-guide.html  نسخهٔ HTML راهنما
└── help.pdf                             ۱٫۸ MB · ۸ صفحه A4
```

بررسی‌های انجام‌شده: `unzip -t` سالم · `zipfile.testzip()` سالم · هیچ مسیر غیر‑ASCII نیست ·
هیچ فایل زباله (`.DS_Store` / `__MACOSX` / `.git`) نیست · فونت داخل افزونه است (بدون CDN).

## ۵. کارهای باقی‌مانده برای شما

| # | کار | چرا مهم است |
|---|---|---|
| ۱ | هاست کردن دمو و گذاشتن لینک پیش‌نمایش | فیلد اجباری ژاکت؛ لینک خراب = رد شدن |
| ۲ | تصمیم دربارهٔ لایسنس | ZIP فعلی نسخهٔ **OWNER** است و کنترل لایسنس ندارد (بخش ۶) |
| ۳ | تست نصب روی یک وردپرس آزمایشی | تایید نهایی نصب از پیشخوان و از FTP |
| ۴ | تعیین قیمت و دسته‌بندی | در فایل آگهی جای خالی گذاشته شده |
| ۵ | آپلود و بازبینی توسط ژاکت | پس از تأیید، فایل محصول جایگزین ZIP فعلی می‌شود |

## ۶. هشدار لایسنس

فایل ورودی `ARIAGH-AIWRITER-1.9.1-OWNER-Unlimited.zip` نسخهٔ مالک است:
`license-config.php` مقدار `edition = owner` و `api`/`public_key` خالی دارد و کامنت فایل صریحاً
می‌گوید «فقط برای مالک محصول، توزیع نکنید». یعنی خریدار هیچ کلید لایسنسی وارد نمی‌کند.

برای انتشار با کنترل لایسنس، ZIP مشتری را از افزونهٔ **ARIAGH License Server** بسازید و بعد:

```bash
.venv/bin/python work/build/package.py --plugin /path/to/aria-ai-writer-customer.zip
```

## ۷. یادداشت فنی رندر

چون در این محیط مرورگر/Chromium در دسترس نبود، گرافیک‌ها و PDF با یک خط تولید اختصاصی
(HarfBuzz برای شکل‌دهی حروف + رستر even-odd روی numpy) ساخته شده‌اند؛ همین مسیر امکان بازبینی
چشمی هر خروجی و بازتولید یکسان را می‌دهد. فونت: Vazirmatn (جایگزین Morabba/Peyda که در دسترس
نبودند) — اگر فونت‌های برند را دارید، فقط `work/fonts/` را جایگزین و اسکریپت‌ها را اجرا کنید.

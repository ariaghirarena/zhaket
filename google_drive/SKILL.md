---
name: zhaket
description: >
  End-to-end Zhaket marketplace product launch factory for WordPress plugins & themes with
  strict phased stop-gates, zero-version-number rule, Morabba+Peyda fonts directly from
  Google Drive, exact Seolity frosted-glass CSS blueprint, 1-click self-contained chroma-key
  3D prompt formula + border flood-fill cutouts (NEVER multiply or global threshold), offline
  HTML/CSS graphics with 1-click PNG export (NEVER PIL/HarfBuzz), cPanel preview+demo, SEO
  HTML description, mandatory help.pdf (WP Admin + FileZilla install & update), and ASCII ZIP.
---

# Zhaket Product Launch Factory — اسکیل جامع و ضدخطای فروش محصول در ژاکت (v2.1)

> **⛔ قبل از انجام هر کاری این فایل + `LEARNINGS.md` + هر ۴ رفرنس زیر را کامل بخوان!**

| فایل مرجع | شناسهٔ درایو (`file_id`) | کی بخوانی |
|---|---|---|
| `LEARNINGS.md` | `1oDDFujJvnjNKlAoGhkEMjs-j_mRKBd8d` | **اجباری در شروع کار** — همهٔ باگ‌ها، ریجکت‌های واقعی و اشتباهات چت‌های قبلی |
| `references/01-visual-taste-and-assets.md` | `1XI7cy4UYzjWenFtxyOOzueFWEbKHBhUm` | سلیقهٔ بصری کاربر، فونت‌ها، شناسه‌های فایل درایو |
| `references/02-zhaket-official-rules-and-packaging.md` | `1abpRqJGJ1ntNVJ-AmKkbBnrs0lHhJFso` | ۱۶ قانون رسمی ژاکت، ساختار ZIP، `help.pdf` و رفع خطای کد ۱۹ |
| `references/03-cutout-and-3d-prompts.md` | `1JMiDfofW6D9mSFi3Nbn8-YtKIw6AGG0K` | فرمول برش کروماکی سبز (`#00FF00`) + کد آمادهٔ `cutout_chroma_green()` و `cutout_white_floodfill()` |
| `references/04-demo-design-blueprint.md` | `1dvSG8-kynxgzbAehFfUhiZ5QjURHu116` | **الگوی واقعی CSS و ساختار دموی سئولیتی (شیشه مات روشن + آیکون محو پشت شیشه) + نمونهٔ پرامپت‌های ۱۰/۱۰ تک‌کلیکی!** |

## ⚡ دانلود فوری دارایی‌های آماده از گوگل درایو (ثانیهٔ اول هر پروژه!)
- **بستهٔ فونت‌های مربع و پیدا (`fonts-morabba-peyda.zip` — ۱۷۴ KB):** `17x_S3AU5jEB6H8a9x7tt00_4-Jd4LuQB`
- **لوگوی رسمی شفاف ژاکت (`zhaket_logo.png`):** `1hb1mHZEi99ZM9drIGE8UCnfaSDDnOYkb`

---

## 🚨 ۷ قانون قرمز (تخلف = خطای فاحش!)

1. **ممنوعیت مطلق شمارهٔ نسخه و بج `WP / PHP`:** هرگز در کاورها، آیکون، اینفوگرافی، دمو، اسکرین‌شات‌ها یا راهنما شمارهٔ نسخه (`1.9.1`, `1.20.0`) یا `WordPress ≥ / PHP ≥` ننویس! با `grep` قبل از تحویل تست کن.
2. **ممنوعیت مطلق ساخت کاور/اینفوگرافی با PIL یا HarfBuzz:** همیشه HTML/CSS خودکفا با فونت Base64 و دکمهٔ داخلی دانلود PNG (`SVG foreignObject` + `<![CDATA[...]]>`) بساز.
3. **ممنوعیت مطلق اجرای همهٔ خروجی‌ها در یک پیام (Stop-Gate Workflow):** فاز ۱ (دمو + پرامپت سه‌بعدی) ← تأیید ← فاز ۲ (آیکون ۸۰ و کاور ۴۰۰/۷۰۰) ← تأیید ← فاز ۳ (اینفوگرافی) ← تأیید ← فاز ۴ (توضیحات HTML + راهنما و `help.pdf`) ← فاز ۵ (زیپ نهایی).
4. **قانون پرامپت‌نویسی ۱۰/۱۰ برای سه‌بعدی:**
   - **هر پرامپت باید ۱۰۰٪ کامل، مستقل و آمادهٔ کپی تک‌کلیکی داخل کدبلاک جداگانه باشد!** (هرگز ننویس «مشترک برای همه: ...»!).
   - طبق الگوی `04-demo-design-blueprint.md` پرجزئیات، با سبک Pixar/Octane، پالت آبی-سفید-شیشه‌ای و پس‌زمینهٔ **کروماکی سبز خالص `#00FF00` بدون سایه زمین، بدون کف و بدون هالهٔ سفید پشت سوژه** بنویس.
5. **قانون برش شفاف واقعی:** هرگز از `mix-blend-mode: multiply` و هرگز از فیلتر سرتاسری روشنایی (`lum < 234`) استفاده نکن! فقط `cutout_chroma_green()` یا `cutout_white_floodfill()` (BFS متصل به لبه در `int32`) + QA روی هر دو پس‌زمینهٔ `#0F2557` و `#EAF2FF`.
6. **الگوی بصری دمو دقیقاً مطابق `04-demo-design-blueprint.md`:** پس‌زمینهٔ روشن یخی-آسمانی با گرید معماری ظریف، کارت‌های شیشه مات (`rgba(255,255,255,0.72)` + `blur(18px)`), آیکون‌های سه‌بعدی محو پشت شیشه (`.bg-3d`), هدر شیشه‌ای شناور با دکمهٔ کشویی «منوی بخش‌ها» + Scroll-Spy، و دموی تعاملی وفادار به پنل واقعی افزونه (نه قالب سیاه تکراری SaaS!).
7. **حفظ فضای گوگل درایو:** فایل‌های زیپ سنگین نهایی محصول و PDFهای حجیم را بدون درخواست صریح کاربر روی درایو آپلود نکن!

---

## 📋 خلاصهٔ فازهای ۵گانه
- **فاز ۱ (توقف تا تأیید):** پرامپت‌های ۱۰/۱۰ مستقل کروماکی سبز → دریافت و برش شفاف واقعی → ساخت سایت پیش‌نمایش شیشه مات روشن (عین سئولیتی) + دموی تعاملی وفادار به پنل واقعی افزونه + بسته‌بندی استاتیک سی‌پنل (`./demo/`, `.htaccess`).
- **فاز ۲ (توقف تا تأیید):** آیکون `80×80` (نام محصول زیر لوگو، رندر ۴× + `LANCZOS`) + کاور `400×400` (بالا-چپ `70×70` خالی، بدون stroke روی کشیده) + دو کاور `700×700` (کاراکتر کمر به بالا).
- **فاز ۳ (توقف تا تأیید):** اینفوگرافی عمودی شیشه‌ای (لوگوی ژاکت فقط گوشهٔ بالا، `.group-head` شیشه آبی مات بدون نوار راست، همپوشانی صفر با مرکز اسکرین‌شات‌ها، برش هوشمند ۶/۱۰/۱۵/۲۰ تکه).
- **فاز ۴:** HTML معنایی سئوشده (`<h2>`/`<h3>` بدون لینک به سایت شخصی) + راهنمای آفلاین شیشه مات + `help.pdf` اجباری (نصب وردپرس + نصب دستی **FileZilla** + هر دو روش **بروزرسانی** + دسترسی).
- **فاز ۵:** بستهٔ نهایی `<slug>-zhaket-package.zip` با ساختار `plugin/<slug>.zip`، `documents/<slug>-guide.html` و `help.pdf` (نام‌های ۱۰۰٪ ASCII، `zip -rq` Info-ZIP، تست سه‌مرحله‌ای `unzip -t` + `zipfile.testzip()` + استخراج واقعی).

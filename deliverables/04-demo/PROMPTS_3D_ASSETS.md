# پرامپت‌های دارایی سه‌بعدی — دموی ARIAGH.AIWRITER

> **قانون طلایی:** من هیچ تصویر سه‌بعدی نمی‌سازم. شما با این پرامپت‌ها می‌سازید، تکه‌تکه آپلود می‌کنید، من با برش شفاف (RGBA WebP + کنترل `int32` و بازبینی چشمی) داخل دمو می‌گذارم.

## مشخصات مشترک همهٔ تصاویر (خیلی مهم)

| مورد | مقدار |
|---|---|
| نسبت تصویر | **۱:۱ (مربع)** — ۱۰۲۴×۱۰۲۴ یا بزرگ‌تر |
| پس‌زمینه | **سفید یکدست `#FFFFFF`**، بدون سایه روی زمین، بدون وینیت (برای برش تمیز) |
| پالت | فقط آبی و سفید: `#0B1B3F`، `#1D4ED8`، `#2563EB`، `#3B82F6`، `#38BDF8`، شیشهٔ سفید شیری |
| ممنوع | هیچ متنی داخل تصویر، هیچ لوگو، هیچ نارنجی/قرمز/سبز، بدون واترمارک |
| رندر | Blender / Octane / C4D، سینمایی، subsurface + frosted glass + chrome، نور رینگی نرم |
| نام فایل هنگام آپلود | دقیقاً همان `03d-…` که پایین هر پرامپت نوشته شده |

## پرامپت منفی مشترک (اگر ابزارتان پشتیبانی می‌کند)

```text
text, letters, words, watermark, logo, orange, red, green, warm colors, harsh shadows,
ground shadow, cluttered background, low poly, cartoon flat, 2d illustration, noise, grain
```

---

## ۰۱ — کاراکتر اصلی دمو (قهرمان صفحه)

**کاربرد:** سمت راست هیروی صفحهٔ پیش‌نمایش (نسخهٔ واضح) و پشت پنل‌های شیشه‌ای (نسخهٔ محو).
**فایل:** `03d-hero-writer.png`

```text
Ultra-detailed 3D render of a friendly futuristic AI writing companion: a small rounded
white ceramic and frosted-glass robot character, floating, holding an oversized glowing
pen made of translucent blue crystal. Its head is a soft rounded cube with a single wide
friendly glowing cyan visor eye. Around it float translucent glass cards and abstract
glowing glyph shapes (no readable letters). Materials: matte white ceramic, frosted glass,
polished chrome trim, blue emissive light #2563EB. Pixar-grade lighting, soft rim light,
subtle volumetric glow, centered composition, generous empty margin around the character,
pure white seamless background, no ground shadow, no text, octane render, 8k
```

## ۰۲ — پنل شیشه‌ای اپلیکیشن (کارت شناور UI)

**کاربرد:** بج کنار عنوان «۲۴ تب مدیریتی» و کارت‌های امکانات.
**فایل:** `03d-glass-panel.png`

```text
3D render of a floating frosted-glass application window, rounded corners, thin white
border glow, deep blue glass interior showing blurred abstract UI blocks and a soft blue
glowing progress ring (absolutely no readable text). Slight perspective tilt, floating in
empty white space, soft blue ambient occlusion, chrome corner accents, blue emissive edges
#38BDF8, studio lighting, pure white background, no shadow on floor, no text, octane render, 8k
```

## ۰۳ — قلم سئو (آیکون سه‌بعدی)

**کاربرد:** بخش «تولید محتوا» و دکمهٔ اصلی دمو.
**فایل:** `03d-pen.png`

```text
3D icon of an elegant fountain pen sculpted from frosted glass and polished chrome,
with a glowing blue ink tip dripping a single luminous droplet, standing upright at a
slight angle, floating, subtle caustics, blue emissive light #2563EB, clean studio lighting,
centered, pure white background, no text, no logo, octane render, 8k
```

## ۰۴ — گوی پرووایدرها (۲۱ پرووایدر)

**کاربرد:** بخش «۲۱ پرووایدر هوش مصنوعی».
**فایل:** `03d-provider-orb.png`

```text
3D render of a glowing translucent blue sphere hub in the center, connected by thin
luminous arcs to smaller floating frosted-glass orbs and cubes around it, representing a
network of AI providers. Deep navy core, cyan energy lines, chrome nodes, soft bloom,
holographic depth, floating in empty space, pure white background, no shadow, no text,
no logos, octane render, 8k
```

## ۰۵ — نمودار رشد سئو

**کاربرد:** بخش «سئوی کامل» و کارت امتیاز سئو.
**فایل:** `03d-seo-chart.png`

```text
3D render of a rising bar chart made of translucent blue glass bars with a curved luminous
arrow sweeping upward, small floating spheres marking data points, frosted glass pill
containers, chrome base plate, blue gradient from #1D4ED8 to #38BDF8, soft glow, isometric
three-quarter view, pure white background, no text, no numbers, octane render, 8k
```

## ۰۶ — تصویر شاخص (قاب عکس)

**کاربرد:** بخش «تصویر شاخص خودکار».
**فایل:** `03d-image-frame.png`

```text
3D render of a floating rounded picture frame made of frosted white glass with a thin
chrome edge; inside the frame an abstract glowing blue landscape gradient with soft
bokeh circles (no photo, no faces, no text). Two small floating glass layers behind it
suggest stacked variants. Soft studio lighting, pure white background, no shadow,
no text, octane render, 8k
```

## ۰۷ — زمان‌بندی انتشار

**کاربرد:** بخش «زمان‌بندی و صف انتشار».
**فایل:** `03d-scheduler.png`

```text
3D render of a frosted glass calendar tile with a chrome ring binding, three soft glowing
blue dots on its surface, and a floating luminous clock ring beside it, deep blue glass
depth, subtle reflections, soft rim light, isometric view, pure white background,
no numbers, no text, octane render, 8k
```

## ۰۸ — سپر امنیت

**کاربرد:** بخش «امنیت و کلیدهای API».
**فایل:** `03d-shield.png`

```text
3D render of a shield sculpted from frosted glass with a polished chrome border and a
glowing blue keyhole-shaped light in the center, floating with a soft cyan glow halo,
translucent depth, minimal studio lighting, pure white background, no text, no logo,
octane render, 8k
```

## ۰۹ — اجرای ابری (Cloudflare / GitHub Actions)

**کاربرد:** بخش «سه روش اجرا — بدون قفل شدن روی یک سرویس».
**فایل:** `03d-cloud-runner.png`

```text
3D render of a translucent blue glass cloud shape with two small chrome gears and a
glowing circuit path running through it, tiny floating particles of light, frosted depth,
soft bloom, floating in empty white space, no ground shadow, no text, no logo,
octane render, 8k
```

## ۱۰ — انتشار در وردپرس

**کاربرد:** بخش «انتشار مستقیم» و کارت نهایی CTA.
**فایل:** `03d-publish.png`

```text
3D render of a glossy dark-navy rounded cube with a glowing blue upward arrow emerging
from its top, surrounded by small floating frosted-glass code brackets and a thin ring of
light, chrome accents, blue emissive glow #2563EB, floating, pure white background,
no text, no logo, octane render, 8k
```

## ۱۱ — ماسکوت کوچک (اختیاری، برای حباب راهنما)

**کاربرد:** حباب راهنمای دمو و صفحهٔ پایان.
**فایل:** `03d-mascot-small.png`

```text
Cute 3D mascot: a small round white ceramic robot head with a friendly cyan glowing visor,
wearing a tiny frosted-glass headset with a blue microphone, slight three-quarter angle,
soft subsurface scattering, floating, pure white background, no shadow, no text,
Pixar style, octane render, 8k
```

---

## بعد از ساخت، چه چیزی بفرستید؟

1. فایل PNG اصلی (همان پس‌زمینهٔ سفید) با نام دقیق `03d-…png` — همه را یک‌جا در یک پیام یا زیپ بفرستید.
2. اگر ابزارتان خروجی شفاف (transparent PNG) می‌دهد، همان بهتر است.
3. من بعد از دریافت: برش شفاف می‌زنم، هالهٔ آبی نرم اضافه می‌کنم، به WebP با کیفیت بهینه تبدیل می‌کنم و در دمو جاگذاری می‌کنم — با بازبینی چشمی روی پس‌زمینهٔ آبی/شیشه‌ای تا لبه‌ها تمیز بمانند.

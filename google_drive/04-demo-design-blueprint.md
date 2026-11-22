# رفرنس ۴ — الگوی دقیق طراحی دمو و پیش‌نمایش (سبک تأییدشدهٔ سئولیتی) + نمونهٔ پرامپت‌های ۱۰/۱۰ آمادهٔ کپی

> **این فایل الگوی واقعی و تأییدشدهٔ کاربر از پروژهٔ سئولیتی است.**
> هر صفحهٔ پیش‌نمایش و دمویی که برای محصولات بعدی ژاکت می‌سازی **باید** همین زبان بصری، همین توکن‌های CSS، همین کیفیت پرامپت‌های سه‌بعدی و همین ساختار مشتری‌محور را داشته باشد — نه قالب‌های تیرهٔ تکراری SaaS و نه پرامپت‌های نصفه‌نیمه!

---

## بخش ۱ — سیستم طراحی دقیق و تأییدشده (کپی مستقیم برای CSS صفحهٔ پیش‌نمایش)

### ویژگی‌های کلیدی که کاربر عاشقش بود:
1. **پس‌زمینهٔ روشن یخی-آسمانی با گرید معماری بسیار ظریف** (نه پس‌زمینهٔ سیاه/تیرهٔ دلگیر!)
2. **کارت‌های شیشه مات (`Frosted Glass`)** با پس‌زمینهٔ `rgba(255, 255, 255, 0.72)`، حاشیهٔ سفید درخشان `1.5px solid rgba(255, 255, 255, 0.92)` و `backdrop-filter: blur(18px)`
3. **آیکون‌های سه‌بعدی محوشده پشت شیشه (`.bg-3d`)** که با `filter: blur(3.5px) saturate(1.18); opacity: 0.56;` نرم پشت کارت‌های شیشه‌ای قرار می‌گیرند و حس عمق سه‌بعدی واقعی می‌دهند
4. **رگه‌های نوری کینتیک (`.beam`)** برای حس حرکت و پرمیوم
5. **نوار ناوبری شیشه‌ای شناور (`.navbar`)** با دکمهٔ **«منوی بخش‌ها»** (دراپ‌داون پرش سریع شیشه‌ای + Scroll-Spy روی همهٔ ابعاد صفحه)
6. **تضاد شیک سرمه‌ای سلطنتی (`#0B1B3F -> #1D4ED8`)** فقط برای تیترها، دکمه‌های CTA اصلی و باکس‌های ویژه در کنار کارت‌های سفید شیشه‌ای
7. **فقط لوگوی تمیز محصول** (بدون بخش اضافی پالت رنگ/برندکیت) + **صفر شماره نسخه و صفر بج WP/PHP**!

### کد دقیق توکن‌ها و پایه‌های CSS (عین سئولیتی):
```css
@font-face { font-family: 'Morabba'; src: url('./assets/fonts/Morabba-Black.ttf') format('truetype'); font-weight: 900; font-display: swap; }
@font-face { font-family: 'Morabba'; src: url('./assets/fonts/Morabba-Medium.ttf') format('truetype'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'Peyda';   src: url('./assets/fonts/Peyda-Black.ttf') format('truetype');   font-weight: 900; font-display: swap; }
@font-face { font-family: 'Peyda';   src: url('./assets/fonts/Peyda-Bold.ttf') format('truetype');    font-weight: 700; font-display: swap; }
@font-face { font-family: 'Peyda';   src: url('./assets/fonts/Peyda-Medium.ttf') format('truetype');  font-weight: 500; font-display: swap; }

:root {
  --navy: #0B1B3F;
  --navy-mid: #102A63;
  --royal: #1D4ED8;
  --blue: #2563EB;
  --sky: #0EA5E9;
  --cyan: #38BDF8;
  --ink: #0F172A;
  --muted: #475569;
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-strong: rgba(255, 255, 255, 0.86);
  --glass-border: rgba(255, 255, 255, 0.92);
  --blue-border: rgba(147, 197, 253, 0.55);
  --shadow-soft: 0 18px 46px rgba(15, 23, 42, 0.08);
  --shadow-blue: 0 22px 54px rgba(37, 99, 235, 0.16);
  --radius-xl: 30px;
  --radius-lg: 22px;
  --radius-md: 16px;
}

body {
  font-family: 'Peyda', system-ui, sans-serif;
  direction: rtl;
  color: var(--ink);
  line-height: 1.75;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 88% 4%, rgba(37, 99, 235, 0.24) 0%, rgba(56, 189, 248, 0.10) 24%, transparent 46%),
    radial-gradient(circle at 8% 22%, rgba(14, 165, 233, 0.20) 0%, transparent 42%),
    radial-gradient(circle at 85% 56%, rgba(37, 99, 235, 0.16) 0%, transparent 44%),
    radial-gradient(circle at 14% 86%, rgba(56, 189, 248, 0.18) 0%, transparent 46%),
    linear-gradient(180deg, #F4F9FF 0%, #EAF3FF 36%, #F5FAFF 68%, #E6F0FF 100%);
}

/* گرید معماری ظریف سراسری */
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.045) 1px, transparent 1px);
  background-size: 36px 36px;
  pointer-events: none; z-index: 0;
}

/* آیکون‌های سه‌بعدی تار و محو پشت پنل‌های شیشه‌ای */
.bg-3d {
  position: absolute; pointer-events: none; z-index: 1;
  opacity: 0.56; filter: blur(3.5px) saturate(1.18);
}
.bg-3d.softer { opacity: 0.40; filter: blur(5.5px) saturate(1.12); }

/* کارت شیشه‌ای استاندارد */
.glass-card {
  position: relative; z-index: 5;
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft), inset 0 1px 0 #ffffff;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
```

---

## بخش ۲ — معماری صفحهٔ پیش‌نمایش و دموی تعاملی (دقیقاً مثل سئولیتی)

### ساختار صفحهٔ اصلی (`index.html`):
1. **هدر شیشه‌ای شناور (`.navbar`)**: لوگوی محصول + لینک‌های بخش‌ها + دکمهٔ کشویی **«منوی بخش‌ها»** (با Scroll-Spy) + دکمهٔ آبی درخشان **«ورود به دموی زندهٔ پیشخوان»** (`./demo/`).
2. **هیرو (Hero Section)**:
   - سمت راست: تیتر درشت **مربع Black** + توضیح ارزشی شفاف برای خریدار (نه حرف‌های فنی توسعه‌دهنده!) + ۲ دکمهٔ CTA («تجربهٔ دموی زنده» + «مشاهدهٔ امکانات») + ۳–۴ آمار واقعی محصول (مثلاً تعداد ماژول‌ها، پرووایدرها، زبان‌ها).
   - سمت چپ: **کاراکتر سه‌بعدی قهرمان (برش شفاف واقعی، بدون کادر سفید)** در کنار پیش‌نمایش واقعی شیشه‌ای از محیط افزونه + کارت‌های شناور کوچک شیشه‌ای.
   - پشت پنل هیرو: ۲ آیکون سه‌بعدی محو (`.bg-3d`) + رگهٔ نوری `.beam`.
3. **بخش «جایگزین چندین ابزار» / ارزش کلیدی** (کارت‌های شیشه‌ای با آیکون‌های سه‌بعدی تمیز در گوشه یا بالای کارت — با سایهٔ طبیعی `drop-shadow`، **هرگز** `mix-blend-mode: multiply`!).
4. **گالری تعاملی تب‌های واقعی افزونه (Interactive Screenshot / Preview Gallery)**: تب‌های قابل کلیک با نمای واقعی و تمیزِ بخش‌های کلیدی افزونه (کاملاً فارسی، بدون شماره نسخه).
5. **دایرکتوری کامل و فیلترپذیر همهٔ ماژول‌ها/تب‌ها** (دسته‌بندی‌شده با دکمه‌های فیلتر شیشه‌ای تا خریدار ببیند واقعاً با چه محصول کاملی طرف است).
6. **روش‌های اجرا / اتصال و مزیت برای هاست ایران** + **پرسش‌های متداول آکاردئونی** + **بنر CTA نهایی** با لینک مستقیم به `./demo/`.

### ساختار دموی تعاملی (`/demo/index.html`):
- باید **ظاهر و ساختار واقعی پیشخوان وردپرس + پنل واقعی خود افزونه** را شبیه‌سازی کند (اگر افزونه فایل‌های CSS/JS واقعی ادمین دارد مثل سئولیتی، خود فایل‌های واقعی ادمین را روی یک لایهٔ `mock-api.js` اجرا کن!).
- نوار بالای دمو (`.demo-bar`) حتماً `position: relative` باشد تا روی هدر چسبان افزونه نیفتد و دکمهٔ بازگشت به صفحهٔ معرفی (`../`) داشته باشد.
- همهٔ تب‌ها قابل کلیک باشند و تب‌های اصلی **تعامل واقعی** داشته باشند (تولید زنده، افزودن قانون/آیتم، فعال‌سازی پرووایدر، تأیید در صف و...).
- **بسته‌بندی cPanel:** ۱۰۰٪ استاتیک، مسیرهای نسبی (`./assets/`, `./demo/`), فایل `.htaccess` استاندارد، آماده برای Extract در هر ساب‌فولدر مثل `demo.ariagh.ir/<slug>/` بدون هیچ تداخلی با وردپرس سایت اصلی.

---

## بخش ۳ — قوانین سخت‌گیرانهٔ نوشتن پرامپت سه‌بعدی برای کاربر (چطور پرامپت ۱۰/۱۰ بنویسی!)

### ⛔ ۴ خطای ممنوعه در پرامپت‌دهی (که چت قبلی مرتکب شد!):
1. **هرگز** پرامپت را دو تکه نکن («قسمت مشترک برای همه» + ۱ خط کوتاه)! **هر پرامپت باید ۱۰۰٪ کامل، مستقل و آمادهٔ کپی تک‌کلیکی داخل کدبلاک خودش باشد!**
2. **هرگز** پرامپت خشک و ۲خطی نده — صحنه، جنس متریال (سرامیک سفید مات، شیشهٔ مات یاقوتی، فلز کروم براق، نورپردازی استودیویی Pixar/Octane)، زاویهٔ دوربین، ژست بانمک کاراکتر و جزئیات نوری را دقیق بنویس!
3. **هرگز** پس‌زمینهٔ سفید (`pure white background`) برای کاراکتر یا آیکون سفید سرامیکی ننویس! **همیشه** پس‌زمینهٔ **کروماکی سبز یکدست (`#00FF00`)** با قید `ZERO ground shadow, ZERO floor, ZERO white splash or halo behind object, ZERO green color spill` بنویس تا برش شفاف ۱۰۰٪ بی‌نقص درآید!
4. همیشه به کاربر بگو دقیقاً کدام فایل را با چه نام/شماره‌ای بسازد و اگر بیش از ۱۶–۲۰ تصویر شد، بگو می‌تواند در دو نوبت ارسال کند.

### ✅ ۲ نمونهٔ استاندارد طلایی پرامپت (دقیقاً با همین سطح کیفیت بنویس!):

**نمونهٔ ۱ — کاراکتر قهرمان (Hero Character):**
```text
Ultra-detailed 3D Pixar-style character render of a charming futuristic AI assistant robot floating mid-air in a friendly three-quarter hero pose: smooth glossy white ceramic rounded body with polished chrome trim and translucent sapphire-blue glass shoulder accents (#1D4ED8), big expressive glowing cyan eyes (#38BDF8) inside a sleek dark-navy curved glass visor with a warm smile, holding a luminous royal-blue crystal fountain pen radiating tiny sparkling cyan light particles, with two miniature tilted frosted-glass UI cards orbiting beside it (abstract glowing bars only, strictly no readable letters). Crisp studio rim lighting, clean sharp outer silhouette, centered with generous empty margin, isolated on a completely flat uniform solid chroma-key bright green background (#00FF00), zero green spill or green reflection on the robot, zero ground shadow, zero floor, zero white splash or glow halo behind the subject, Octane render, Blender 3D, 8k, no text, no letters, no logo, no orange
```

**نمونهٔ ۲ — آیکون شیشه‌ای سه‌بعدی (3D Glass Icon):**
```text
Ultra-detailed 3D Blender Octane icon of a translucent frosted sapphire-blue glass shield (#1D4ED8 to #38BDF8) framed with a thick beveled polished silver-chrome rim and a glowing luminous cyan keyhole crystal floating inside the center, angled in a dynamic isometric three-quarter view with soft internal refractions and specular highlights. Clean crisp outer edges, centered with generous empty margin, isolated on a completely flat uniform solid chroma-key bright green background (#00FF00), zero green tint or green bounce light on the glass, zero ground shadow, zero floor reflection, zero white paint smear or halo behind the object, studio lighting, 8k, no text, no letters, no watermark, no logo, no orange
```

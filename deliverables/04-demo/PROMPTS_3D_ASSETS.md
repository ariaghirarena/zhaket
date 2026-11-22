# ۲۴ پرامپت دارایی تصویری — دموی ARIAGH.AIWRITER

> من هیچ تصویری نمی‌سازم. این پرامپت‌ها را کپی می‌کنی، تصویرها را می‌سازی و می‌فرستی؛
> من با برش شفاف (RGBA WebP، آستانه روی `int32`، بازبینی چشمی) داخل دمو می‌گذارم.

## مشخصات مشترک (برای همه، مگر جایی که خلافش نوشته شده)

| مورد | مقدار |
|---|---|
| نسبت | ۱:۱ مربع، ۱۰۲۴×۱۰۲۴ یا بزرگ‌تر |
| پس‌زمینه | **سفید یکدست `#FFFFFF`**، بدون سایه روی زمین (برای برش تمیز) |
| پالت | فقط آبی/سفید: `#0B1B3F` `#1D4ED8` `#2563EB` `#3B82F6` `#38BDF8` + شیشهٔ سفید شیری |
| ممنوع | متن، لوگو، نارنجی/قرمز/سبز، واترمارک |
| رندر | Blender / Octane / C4D، نور رینگی نرم، subsurface + frosted glass + chrome |
| نام فایل | همان `03d-NN-name.png` |

**پرامپت منفی مشترک:**
```text
text, letters, words, watermark, logo, orange, red, green, warm colors, harsh shadow,
ground shadow, cluttered background, low poly, flat cartoon, 2d illustration, noise, grain
```

---

## A — هیرو و کاراکتر

**۰۱ · `03d-01-hero-writer.png`** — کاراکتر اصلی، راست هیرو (و نسخهٔ محو پشت پنل‌ها)
```text
Ultra-detailed 3D render of a friendly futuristic AI writing companion: a small rounded
white ceramic and frosted-glass robot, floating, holding an oversized pen made of glowing
blue crystal, its head a soft rounded cube with one wide friendly cyan visor eye, surrounded
by translucent floating glass cards and abstract glowing glyph shapes (no readable letters).
Matte white ceramic, frosted glass, chrome trim, blue emissive light #2563EB. Pixar-grade
lighting, soft rim light, subtle volumetric glow, centered with generous empty margin,
pure white seamless background, no ground shadow, no text, octane render, 8k
```

**۰۲ · `03d-02-glass-panel.png`** — پنجرهٔ شیشه‌ای اپلیکیشن
```text
3D render of a floating frosted-glass application window with rounded corners, thin white
glowing border, deep blue glass interior showing blurred abstract UI blocks and a soft blue
progress ring, absolutely no readable text. Slight perspective tilt, floating in empty white
space, chrome corner accents, cyan emissive edges #38BDF8, studio lighting, pure white
background, no floor shadow, no text, octane render, 8k
```

**۰۳ · `03d-03-mascot.png`** — ماسکوت کوچک (حباب راهنما، فوتر)
```text
Cute 3D mascot: small round white ceramic robot head with a friendly cyan glowing visor,
wearing a tiny frosted-glass headset with a blue microphone, three-quarter angle, soft
subsurface scattering, floating, pure white background, no shadow, no text, Pixar style,
octane render, 8k
```

## B — دارایی‌های بخش‌ها

**۰۴ · `03d-04-pen.png`** — قلم سئو (دکمهٔ تولید)
```text
3D icon of an elegant fountain pen sculpted from frosted glass and polished chrome with a
glowing blue ink tip and a single luminous droplet, standing at a slight angle, floating,
subtle caustics, blue emissive light #2563EB, clean studio light, centered, pure white
background, no text, no logo, octane render, 8k
```

**۰۵ · `03d-05-provider-orb.png`** — گوی شبکهٔ پرووایدرها
```text
3D render of a glowing translucent blue sphere hub in the center connected by thin luminous
arcs to smaller floating frosted-glass orbs and cubes, representing a network of AI providers.
Deep navy core, cyan energy lines, chrome nodes, soft bloom, holographic depth, floating in
empty space, pure white background, no shadow, no text, no logos, octane render, 8k
```

**۰۶ · `03d-06-seo-chart.png`** — نمودار رشد سئو
```text
3D render of a rising bar chart made of translucent blue glass bars with a curved luminous
arrow sweeping upward and small floating spheres as data points, frosted glass pill
containers, chrome base plate, gradient #1D4ED8 to #38BDF8, soft glow, isometric three-quarter
view, pure white background, no text, no numbers, octane render, 8k
```

**۰۷ · `03d-07-image-frame.png`** — تصویر شاخص
```text
3D render of a floating rounded picture frame of frosted white glass with a thin chrome edge;
inside, an abstract glowing blue landscape gradient with soft bokeh circles (no photo, no
faces, no text). Two offset glass layers behind suggest stacked variants. Soft studio light,
pure white background, no shadow, no text, octane render, 8k
```

**۰۸ · `03d-08-scheduler.png`** — زمان‌بندی
```text
3D render of a frosted glass calendar tile with chrome ring binding and three soft glowing
blue dots on its surface, plus a floating luminous clock ring beside it, deep blue glass
depth, subtle reflections, soft rim light, isometric view, pure white background, no numbers,
no text, octane render, 8k
```

**۰۹ · `03d-09-shield.png`** — امنیت و کلیدها
```text
3D render of a shield sculpted from frosted glass with a polished chrome border and a glowing
blue keyhole of light in the center, floating with a soft cyan halo, translucent depth,
minimal studio lighting, pure white background, no text, no logo, octane render, 8k
```

**۱۰ · `03d-10-cloud-runner.png`** — اجرای ابری
```text
3D render of a translucent blue glass cloud shape with two small chrome gears and a glowing
circuit path running through it, tiny floating particles of light, frosted depth, soft bloom,
floating in empty white space, no ground shadow, no text, no logo, octane render, 8k
```

**۱۱ · `03d-11-publish-cube.png`** — انتشار در وردپرس
```text
3D render of a glossy dark-navy rounded cube with a glowing blue upward arrow emerging from
its top, surrounded by small floating frosted-glass code brackets and a thin ring of light,
chrome accents, blue emissive glow #2563EB, floating, pure white background, no text,
no logo, octane render, 8k
```

**۱۲ · `03d-12-globe.png`** — ۱۰ زبان خروجی
```text
3D render of a globe built from frosted glass meridians over a translucent blue core, three
small chrome city pins floating around it with thin light trails, no country borders, no
labels, soft cyan glow, studio lighting, pure white background, no shadow, no text,
octane render, 8k
```

**۱۳ · `03d-13-tone-equalizer.png`** — ۱۰ لحن
```text
3D render of a row of five vertical frosted-glass sliders with chrome caps at different
heights on a translucent blue glass base, one slider glowing cyan, floating, isometric view,
soft rim light, pure white background, no numbers, no text, octane render, 8k
```

**۱۴ · `03d-14-review-magnifier.png`** — صف بازبینی
```text
3D render of a magnifying glass with a frosted glass lens and chrome handle hovering over a
floating stack of translucent white document cards, one card with a glowing blue check mark
(no words). Soft depth of field, pure white background, no text, octane render, 8k
```

**۱۵ · `03d-15-topic-stack.png`** — ۴۴۶ موضوع
```text
3D render of a neat stack of translucent white glass cards slightly fanned out, the top card
glowing blue, tiny floating tags and thin light lines around the stack suggesting categories
(no readable text). Floating, isometric, soft studio light, pure white background,
no shadow, octane render, 8k
```

**۱۶ · `03d-16-usage-gauge.png`** — مصرف و هزینه
```text
3D render of a semicircular gauge made of frosted glass with a chrome needle pointing to the
right, small floating translucent tokens and a thin cyan arc, blue emissive accents, floating,
pure white background, no numbers, no text, octane render, 8k
```

## C — پس‌زمینه و بافت (این‌ها تمام‌قاب هستند)

**۱۷ · `03d-17-hero-bg.jpg`** — پس‌زمینهٔ هیرو، **تمام‌قاب و تیره** (نسبت ۱۶:۹)
```text
Abstract cinematic background: deep navy #0B1B3F space with soft volumetric blue light rays
entering from the top left, a subtle grid of thin cyan lines fading into darkness, floating
frosted-glass shards and a faint blurred 3D character silhouette far in the distance, heavy
bokeh, film grain, very low contrast so text stays readable, no text, no logo, 16:9
```

**۱۸ · `03d-18-section-glow.jpg`** — هالهٔ بخش‌ها، **تمام‌قاب روشن** (۱۶:۹)
```text
Abstract soft blue gradient background, ice white #F7FAFF base with large blurred cyan and
royal-blue light orbs, delicate frosted glass shards floating out of focus, extremely subtle
so Persian text on top stays crisp, no text, no logo, 16:9
```

**۱۹ · `03d-19-mesh-ribbon.png`** — ریبون شیشه‌ای (جداکنندهٔ بخش‌ها)
```text
3D render of an elegant twisted ribbon of frosted glass with a soft blue gradient flowing
through it, chrome edge highlight, floating on pure white, no shadow, no text, octane render,
wide composition, 8k
```

**۲۰ · `03d-20-constellation.png`** — صورت فلکی پرووایدرها (عرض ۳:۲)
```text
3D render of a constellation of small frosted glass spheres connected by luminous cyan lines,
one larger navy sphere at the center, depth of field, floating in white space, soft bloom,
no text, no logos, octane render, 8k
```

## D — آیکون‌های کوچک (شیشه‌ای، یکدست)

**۲۱ · `03d-21-icon-doc.png`** — مقاله و پیش‌نویس
```text
Minimal 3D icon: a rounded white glass document sheet with a chrome corner fold and three
glowing blue text lines, floating, soft shadowless lighting, pure white background,
no text, octane render, 8k
```

**۲۲ · `03d-22-icon-key.png`** — کلید API
```text
Minimal 3D icon: a frosted glass key with a chrome shaft and a glowing cyan core, floating at
a slight angle, soft studio light, pure white background, no text, octane render, 8k
```

**۲۳ · `03d-23-icon-bell.png`** — اعلان‌ها
```text
Minimal 3D icon: a rounded frosted glass bell with a chrome clapper and a tiny cyan glow at
its rim, floating, soft studio light, pure white background, no text, octane render, 8k
```

**۲۴ · `03d-24-icon-spark.png`** — هوش مصنوعی
```text
Minimal 3D icon: a four-pointed star of translucent blue glass with a chrome center and a
soft cyan glow, floating, clean studio light, pure white background, no text, octane render, 8k
```

---

## چطور بفرستی

1. همه را یک‌جا (یا چند پیام) بفرست؛ نام فایل مهم نیست، فقط شمارهٔ پرامپت را بنویس یا همان ترتیب را نگه دار.
2. اگر خروجی شفاف (PNG با آلفا) گرفتی، بهتر است؛ اگر سفید بود خودم برش می‌زنم.
3. برای ۱۷ و ۱۸ نسبت ۱۶:۹ بده، بقیه ۱:۱.

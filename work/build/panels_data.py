#!/usr/bin/env python3
"""Panel bodies for the 24 real admin tabs (structure from the plugin, data is sample)."""
from panelkit import (
    TABS_ORDER, LABEL, GROUPS, ICON, card, kpis, field, prov, table, kv, note,
    steps, opts, swrow, svg,
)


def p_text_ai():
    prio = "".join([
        prov("۱", "Claude Pro / Max", "اشتراکی · اجرا روی GitHub Actions", True, '<span class="tag ok">آماده</span>'),
        prov("۲", "OpenAI GPT-5.1", "API · کلید در Secrets کلادفلر", True, '<span class="tag ok">آماده</span>'),
        prov("۳", "Google Gemini 2.5 Pro", "API · رایگان با سهمیهٔ روزانه", True, '<span class="tag ok">آماده</span>'),
        prov("۴", "Cloudflare Workers AI", "رایگان · بدون کلید", True, '<span class="tag ok">آماده</span>'),
        prov("۵", "AvalAI", "API · واسط ایران", False, '<span class="tag err">کلید ندارد</span>'),
    ])
    prio += ('<div class="row2" style="align-items:center;margin-top:10px">'
             '<small style="font-size:11.5px;color:#64748b">موارد خاموش هرگز استفاده نمی‌شوند. اکانت‌های اشتراکی از طریق GitHub Actions اجرا می‌شوند؛ بقیه روی ورکر کلادفلر.</small>'
             '<div style="justify-self:end"><button class="btn-a" data-toast="ترتیب و روشن/خاموش ذخیره شد">ذخیره ترتیب</button></div></div>')

    subs = ('<div class="row2" style="align-items:center;padding:8px 0"><b style="font-size:13px">Claude Pro / Max</b>'
            '<span style="justify-self:end"><span class="tag ok">محتوا: اولویت ۱</span></span></div>'
            '<div class="row2" style="align-items:center;padding:8px 0"><b style="font-size:13px">ChatGPT Plus / Pro</b>'
            '<span style="justify-self:end"><span class="tag mute">محتوا: خاموش</span> <span class="tag ok">تصویر: اولویت ۱</span></span></div>'
            + note("هر دو اکانت می‌توانند وصل بمانند. مثلاً Claude را فقط اینجا (محتوا) و ChatGPT را فقط در تب «هوش مصنوعی تولید تصویر» روشن کنید تا هر کدام فقط کار خودش را انجام دهد.")
            + '<a class="btn-a ghost sm" style="margin-top:10px" href="#/subscription" data-tab="subscription">اتصال و راهنمای اکانت اشتراکی</a>')

    db = (kv([("مقالات", "۲۴۸"), ("محصولات", "۹۶"), ("به‌روزرسانی", "۲ ساعت پیش")])
          + '<a class="btn-a ghost sm" style="margin-top:10px" href="#/strategy" data-tab="strategy">تحلیل سایت</a>')

    body = ('<div class="grid2">'
            f'<div>{card("اولویت هوش مصنوعی‌ها", "بکشید و رها کنید تا ترتیب عوض شود؛ با کلید کنار هر مورد آن را روشن یا خاموش کنید", prio)}</div>'
            f'<div>{card("اکانت‌های اشتراکی", "Claude و ChatGPT بدون کلید API", subs)}'
            f'{card("دیتابیس سایت در GitHub", "هوش مصنوعی لینک محصولات، دسته‌ها و مقالات قبلی را از اینجا می‌بیند", db)}</div>'
            '</div>')
    return body


def p_image_ai():
    prio = "".join([
        prov("۱", "Cloudflare Workers AI (رایگان، پیش‌فرض)", "بدون کلید · FLUX.1 schnell / SDXL", True, '<span class="tag ok">آماده</span>'),
        prov("۲", "OpenAI (gpt-image-1)", "تا ۱۶ تصویر مرجع · همان کلید OpenAI", True, '<span class="tag ok">آماده</span>'),
        prov("۳", "Google Gemini Image (Nano Banana)", "تا ۳ مرجع · کلید Gemini", True, '<span class="tag ok">آماده</span>'),
        prov("۴", "Higgsfield", "تا ۱۶ مرجع · اعتبار جدا", False, '<span class="tag err">کلید ندارد</span>'),
        prov("۵", "fal.ai", "Nano Banana / FLUX · تا ۶ مرجع", False, '<span class="tag mute">خاموش</span>'),
        prov("۶", "تصویر با اکانت ChatGPT", "بدون API · اشتراکی", False, '<span class="tag mute">خاموش</span>'),
        prov("۷", "موتور سفارشی", "Base URL دلخواه", False, '<span class="tag mute">خاموش</span>'),
    ])
    prio += '<div style="margin-top:10px"><button class="btn-a" data-toast="ترتیب موتورهای تصویر ذخیره شد">ذخیره ترتیب</button></div>'

    keys = (field("کلید OpenAI", "sk-proj-••••••••••••••••", kind="text") +
            field("کلید Google AI Studio", "AIza••••••••••••••••") +
            field("Higgsfield (KEY_ID:KEY_SECRET)", "", "در Secrets ذخیره می‌شود") +
            note("همهٔ کلیدها مستقیم در Secrets ورکر کلادفلر نوشته می‌شوند و در دیتابیس وردپرس ذخیره نمی‌شوند.") +
            '<button class="btn-a ghost sm" data-toast="کلیدها در Secrets کلادفلر ذخیره شد">ذخیرهٔ کلیدها</button>')

    chatgpt = (swrow("ساخت تصویر با اکانت ChatGPT", "مثل یک کاربر عادی، همراه عکس محصولات") +
               note("این موتور با همان اکانت اشتراکی تب «اکانت اشتراکی» کار می‌کند و کلید API نمی‌خواهد.") +
               '<a class="btn-a ghost sm" href="#/subscription" data-tab="subscription">تنظیم اکانت اشتراکی</a>')

    return ('<div class="grid2">'
            f'<div>{card("اولویت موتورهای تصویر", "بکشید و رها کنید؛ با کلید کنار هر مورد روشن یا خاموشش کنید", prio)}</div>'
            f'<div>{card("کلید موتورهای تصویر", "مستقیم در Secrets کلادفلر ذخیره می‌شود", keys)}'
            f'{card("تصویر با اکانت ChatGPT (بدون API)", "برای کسانی که ChatGPT Plus/Pro دارند", chatgpt)}</div>'
            '</div>')


def p_dashboard():
    stats = kpis([
        ("۱۴", "در انتظار تایید شما", "۳ مقاله امروز آماده شد", False, "kpiReview"),
        ("۲۳", "موضوعات در صف", "۲ فوری", False, None),
        ("۱۲۸", "مقالات تولیدشده", "↑ ۲۴ در ۷ روز", False, None),
        ("۸۶٪", "نرخ موفقیت ۳۰ روز", "۴ خطا", True, None),
    ])
    cta = ('<a class="note ok" style="text-decoration:none;margin-bottom:14px" href="#/strategy" data-tab="strategy">'
           '<b>تحلیل هوشمند سایت و ساخت برنامه محتوا</b> — مقالات، محصولات، دسته‌ها و رقبا بررسی می‌شوند و بهترین موضوعات جدید پیشنهاد می‌شود.'
           ' <span class="tag">مشاهده / تحلیل دوباره</span></a>')

    chart = ('<div class="bars">' + "".join(
        f'<i style="height:{h}%"></i>' for h in (38, 56, 44, 72, 60, 88, 52, 68, 80, 46, 74, 92, 64, 84)) + '</div>'
        '<div class="note" style="margin-top:14px">مجموع توکن: ۱۲۴٬۸۰۰ ورودی · ۳۱۸٬۲۰۰ خروجی — میانگین زمان تولید: ۳ دقیقه و ۲۴ ثانیه</div>')

    tl = ('<div class="steps-live">'
          '<div class="sl done"><span class="b">✓</span> راهنمای خرید روغن زیتون اصل — منتشر شد</div>'
          '<div class="sl done"><span class="b">✓</span> خواص دارچین برای سلامت — پیش‌نویس</div>'
          '<div class="sl run"><span class="b">…</span> نگهداری زعفران در خانه — در حال نگارش</div>'
          '<div class="sl"><span class="b">۴</span> تفاوت پستهٔ اکبری و فندقی — امروز ۱۶:۰۰</div>'
          '<div class="sl"><span class="b">۵</span> صبحانهٔ سالم برای کودکان — فردا ۰۹:۰۰</div>'
          '</div>')

    nextrun = (kv([("اجرای بعدی", "امروز ۱۶:۰۰"), ("فاصله", "هر ۶ ساعت"), ("Cron", "۰ */۶ * * *")])
               + note("موتور فعال: Cloudflare Workers AI — پاسخ ۴۱۲ میلی‌ثانیه"))

    setup = ('<div class="prog" style="margin-bottom:12px"><i style="width:80%"></i></div>'
             + steps([
                 ("done", "✓", "اتصال به حساب کلادفلر"),
                 ("done", "✓", "استقرار ورکر و فعال‌سازی Cron"),
                 ("done", "✓", "ثبت کلید API هوش مصنوعی در Secrets"),
                 ("done", "✓", "تعریف موضوع و حوزه سایت"),
                 ("run", "…", "افزودن موضوعات یا فعال‌سازی ایده‌پردازی خودکار"),
             ]))

    engine = (kv([("موتور فعال", "Cloudflare Workers AI"), ("مدل", "FLUX.1 schnell"),
                  ("مسیر اجرا", "ورکر کلادفلر"), ("پاسخ", "۴۱۲ میلی‌ثانیه")])
              + note("ترتیب و روشن/خاموش کردن موتورها در تب «هوش مصنوعی تولید محتوا» است."))
    return (stats + cta + '<div class="grid2">'
            f'{card("فعالیت ۱۴ روز اخیر", "تعداد مقالات موفق و خطاها در هر روز", chart)}'
            f'<div>{card("خط زمانی", "برنامهٔ پیش‌رو و آخرین مقالات تولیدشده", tl)}'
            f'{card("اجرای بعدی", "", nextrun)}{card("موتور فعال", "", engine)}'
            f'{card("راه‌اندازی", "۴ از ۵", setup)}</div>'
            '</div>')


def p_review():
    rows = [
        ("راهنمای خرید روغن زیتون اصل", "روغن زیتون", "۹۴", "زیتون طلایی", '<span class="tag wait">پیش‌نویس</span>',
         '<button class="btn-a sm" data-approve>انتشار</button> <button class="btn-a ghost sm" data-schedule>زمان‌بندی</button> <button class="btn-a ghost sm" data-toast="پیش‌نمایش مقاله">پیش‌نمایش</button>'),
        ("تفاوت پستهٔ اکبری و فندقی", "پستهٔ اکبری", "۹۱", "آجیل سرا", '<span class="tag wait">پیش‌نویس</span>',
         '<button class="btn-a sm" data-approve>انتشار</button> <button class="btn-a ghost sm" data-schedule>زمان‌بندی</button> <button class="btn-a ghost sm" data-toast="پیش‌نمایش مقاله">پیش‌نمایش</button>'),
        ("نگهداری زعفران در خانه", "نگهداری زعفران", "۸۸", "زعفران قائنات", '<span class="tag wait">پیش‌نویس</span>',
         '<button class="btn-a sm" data-approve>انتشار</button> <button class="btn-a ghost sm" data-schedule>زمان‌بندی</button> <button class="btn-a ghost sm" data-toast="پیش‌نمایش مقاله">پیش‌نمایش</button>'),
    ]
    body = (f'<div style="margin-bottom:12px"><span class="tag warn" id="kpiReview2">۳ مقاله در انتظار</span> '
            '<span class="tag mute">آخرین به‌روزرسانی: ۱۲ دقیقه پیش</span></div>'
            + card("در انتظار تایید شما", "پیش‌نویس، ویرایش، انتشار یا زمان‌بندی",
                   table(["عنوان", "کلمهٔ کلیدی", "امتیاز سئو", "دسته", "وضعیت", "اقدام"], rows))
            + '<div class="grid2" style="margin-top:14px">'
            + card("پیش‌نمایش نتیجهٔ گوگل", "به‌روزرسانی خودکار",
                   '<div style="border:1px solid rgba(37,99,235,.16);border-radius:12px;padding:12px">'
                   '<div style="font-size:12px;color:#15803d">benlifood.ir › blog › olive-oil</div>'
                   '<div style="font-size:15px;color:#1a0dab;font-weight:600;margin:4px 0">راهنمای خرید روغن زیتون اصل</div>'
                   '<div style="font-size:12.5px;color:#4b5563">چطور روغن زیتون اصل را از تقلبی تشخیص دهیم؟ ۷ نشانه، آزمون خانگی و نکات نگهداری…</div></div>')
            + card("چک‌لیست پیش از انتشار", "خودکار",
                   '<ul class="list-clean"><li>تصویر شاخص ساخته شده</li><li>Alt همهٔ تصاویر پر شده</li>'
                   '<li>اسکیما Article و FAQ ثبت می‌شود</li><li>لینک داخلی به ۳ مقالهٔ مرتبط</li>'
                   '<li>تراکم کلمهٔ کلیدی ۱.۲٪ — سالم</li></ul>')
            + '</div>')
    return body


def p_strategy():
    start = (field("سایت رقبا (اختیاری، حداکثر ۵ آدرس، هر خط یکی)", "", "example.com · shop.com", "area") +
             '<div class="row2">' + field("تعداد موضوع پیشنهادی", '<option>۲۴ موضوع</option><option>۱۲ موضوع</option><option>۵۰ موضوع</option>', kind="select")
             + field("تمرکز ویژه (اختیاری)", "", "مثلاً خواص مواد غذایی") + '</div>'
             + f'<div id="strategySteps" style="margin:14px 0">{steps([("", "۱", "خواندن مقالات، محصولات و دسته‌ها"), ("", "۲", "بررسی رقبا و شکاف محتوایی"), ("", "۳", "ساخت کلمات کلیدی و نیت جستجو"), ("", "۴", "اولویت‌بندی و ساخت برنامه")])}</div>'
             + '<button class="btn-a" id="runStrategy">شروع تحلیل</button>')
    backup = (kv([("آخرین نسخه", "۲ ساعت پیش"), ("مقالات", "۲۴۸"), ("محصولات", "۹۶"), ("دسته‌ها", "۱۸")])
              + note("دیتابیس هوش مصنوعی برای لینک‌دهی و جلوگیری از مقالهٔ تکراری روی مخزن خصوصی GitHub نگه داشته می‌شود.")
              + '<button class="btn-a ghost sm" data-toast="نسخهٔ پشتیبان تازه ساخته شد">ساخت نسخهٔ پشتیبان</button>')
    plan = card("برنامهٔ پیشنهادی آخرین تحلیل", "۲ روز پیش · ۲۴ موضوع",
                table(["موضوع پیشنهادی", "کلمهٔ کلیدی", "نیت جستجو", "اولویت"],
                      [("خواص دارچین برای سلامت", "دارچین", "آموزشی", '<span class="tag err">فوری</span>'),
                       ("راهنمای نگهداری زعفران", "نگهداری زعفران", "آموزشی", '<span class="tag wait">بالا</span>'),
                       ("تفاوت پستهٔ اکبری و فندقی", "پستهٔ اکبری", "خرید", '<span class="tag">عادی</span>')]))
    return ('<div class="grid2">'
            f'<div>{card("شروع تحلیل جدید", "", start)}</div>'
            f'<div>{card("نسخه پشتیبان سایت در GitHub", "دیتابیس هوش مصنوعی برای لینک‌دهی و جلوگیری از مقاله تکراری", backup)}</div>'
            f'</div><div style="margin-top:14px">{plan}</div>')


def p_timeline():
    past = card("گذشته", "۲۴ مقالهٔ منتشرشده",
                table(["تاریخ", "مقاله", "موتور", "وضعیت"],
                      [("۱۴۰۵/۰۳/۰۱ ۰۹:۰۰", "راهنمای خرید روغن زیتون اصل", "Claude Pro", '<span class="tag ok">منتشر شد</span>'),
                       ("۱۴۰۵/۰۲/۳۱ ۱۶:۰۰", "خواص دارچین برای سلامت", "Gemini 2.5", '<span class="tag ok">منتشر شد</span>'),
                       ("۱۴۰۵/۰۲/۳۰ ۰۹:۰۰", "چای سبز و کاهش وزن", "Workers AI", '<span class="tag ok">منتشر شد</span>')]))
    future = card("برنامهٔ آینده", "۶ اجرای بعدی",
                  table(["زمان", "موضوع", "اولویت"],
                        [("امروز ۱۶:۰۰", "نگهداری زعفران در خانه", "بالا"),
                         ("فردا ۰۹:۰۰", "تفاوت پستهٔ اکبری و فندقی", "عادی"),
                         ("فردا ۱۶:۰۰", "صبحانهٔ سالم برای کودکان", "عادی")]))
    return f'<div class="grid2">{past}{future}</div>'


def p_activity():
    running = (steps([("done", "✓", "انتخاب موضوع از صف"), ("done", "✓", "ساخت پرامپت با دانش سئو"),
                      ("run", "…", "نگارش مقاله با Claude Pro"), ("", "۴", "ویرایش فارسی و ساختار"),
                      ("", "۵", "تصویر شاخص و پیش‌نویس")])
               + '<div class="prog" style="margin:12px 0"><i id="actProg" style="width:62%"></i></div>'
               + '<div class="row2" style="align-items:center"><small style="color:#64748b;font-size:12px">زمان سپری‌شده: ۰۱:۲۴ — توکن: ۸٬۴۰۰</small>'
               '<div style="justify-self:end"><button class="btn-a danger sm" id="cancelJob">لغو اجرا</button></div></div>')
    feed = card("گزارش لحظه‌ای", "امروز",
                table(["زمان", "رویداد", "مدل", "مدت", "وضعیت"],
                      [("۱۲:۴۱", "تست اتصال", "Workers AI", "۰.۴s", '<span class="tag ok">موفق</span>'),
                       ("۱۲:۳۰", "ساخت تصویر شاخص", "Workers AI", "۸s", '<span class="tag ok">موفق</span>'),
                       ("۱۲:۲۴", "نگارش مقاله", "Claude Pro", "۳m ۲۴s", '<span class="tag ok">موفق</span>'),
                       ("۱۱:۵۸", "تحلیل سایت", "Gemini 2.5", "۴۲s", '<span class="tag ok">موفق</span>'),
                       ("۱۱:۰۲", "ادغام مقالات", "Claude Pro", "—", '<span class="tag err">خطا</span>')]))
    return f'<div class="grid2">{card("در حال اجرا", "۱ کار", running)}{feed}</div>'


def p_topics():
    add = ('<div class="grid2">' + field("عنوان یا موضوع مقاله", "", "مثلاً خواص دارچین برای سلامت", extra='id="tTitle"')
           + field("کلمات کلیدی (با کاما جدا کنید)", "", "دارچین، خواص دارچین", extra='id="tKey"') + '</div>'
           + '<div class="row3">' + field("دسته‌بندی", '<option>سلامت</option><option>آشپزی</option><option>خرید</option>', kind="select")
           + field("تعداد کلمات", '<option>۱۲۰۰–۱۸۰۰</option><option>۸۰۰–۱۲۰۰</option>', kind="select")
           + field("لحن", '<option>آموزشی</option><option>صمیمی</option><option>فروشگاهی</option>', kind="select") + '</div>'
           + '<div class="row2">' + field("اولویت", '<option>عادی</option><option>بالا</option><option>فوری</option>', kind="select", extra='id="tPrio"')
           + field("توضیحات اختصاصی برای AI (اختیاری)", "", "نکته‌ای که فقط در این مقاله باشد", "area") + '</div>'
           + '<button class="btn-a" id="addTopic">افزودن به صف</button> '
           '<button class="btn-a ghost" id="aiSuggest">پیشنهاد موضوع با AI</button>')
    bulk = (field("هر خط یک موضوع · فرمت اختیاری: عنوان | کلمات کلیدی | دسته | تعداد کلمات", "",
                  "خواص دارچین | دارچین | سلامت | ۱۴۰۰", "area", 'rows="6"')
            + '<button class="btn-a ghost" data-toast="۲ موضوع از متن خوانده و به صف اضافه شد">افزودن گروهی</button>')
    rows = [
        ("راهنمای خرید روغن زیتون اصل", "روغن زیتون", '<span class="tag err">فوری</span>', '<span class="tag ok">تولید شد</span>'),
        ("تفاوت پستهٔ اکبری و فندقی", "پستهٔ اکبری", '<span class="tag wait">بالا</span>', '<span class="tag">در صف</span>'),
        ("نگهداری زعفران در خانه", "نگهداری زعفران", '<span class="tag">عادی</span>', '<span class="tag">در صف</span>'),
    ]
    trs = "".join(f'<tr><td>{i + 1}</td><td class="name">{t}</td><td>{k}</td><td>{p}</td><td>{s}</td>'
                  f'<td><button class="btn-a sm" data-generate>تولید فوری</button></td></tr>'
                  for i, (t, k, p, s) in enumerate(rows))
    queue = card("صف موضوعات", f'<span id="cntQueue">۲۳</span> موضوع',
                 f'<table class="tbl" id="topicTable"><thead><tr><th>#</th><th>موضوع</th><th>کلمهٔ کلیدی</th>'
                 f'<th>اولویت</th><th>وضعیت</th><th>اقدام</th></tr></thead><tbody>{trs}</tbody></table>')
    return (f'<div class="grid2"><div>{card("افزودن موضوع", "یک موضوع با جزئیات کامل", add)}</div>'
            f'<div>{card("افزودن گروهی", "هر خط یک موضوع", bulk)}</div></div>'
            f'<div style="margin-top:14px">{queue}</div>')


def p_prompt():
    master = ('<div class="chipsrow" id="varChips" style="margin-bottom:10px">'
              + "".join(f'<button type="button" class="opt">{t}</button>' for t in
                        ("{site_name}", "{niche}", "{audience}", "{topic}", "{keywords}", "{tone}", "{language}", "{word_min}", "{word_max}", "{year}"))
              + '</div>'
              + '<div class="field"><label>پرامپت اصلی</label><textarea class="input" id="promptBox" rows="9">تو یک نویسندهٔ حرفه‌ای سئو هستی. برای سایت {site_name} در حوزهٔ {niche} و مخاطب {audience} یک مقالهٔ کامل دربارهٔ {topic} بنویس.'
                ' کلمهٔ کلیدی اصلی {keywords} است. لحن {tone} و زبان {language}. طول مقاله بین {word_min} تا {word_max} کلمه باشد. ساختار هدینگ، جدول و FAQ را رعایت کن.</textarea></div>')
    vars_ = card("متغیرها", "برای درج در محل نشانگر کلیک کنید",
                 '<ul class="list-clean"><li>{site_name} نام سایت · {niche} حوزهٔ فعالیت</li>'
                 '<li>{topic} موضوع مقاله · {keywords} کلمات کلیدی</li>'
                 '<li>{tone} لحن · {language} زبان · {year} سال جاری</li></ul>')
    prev = card("پیش‌نمایش و تست", "پرامپت نهایی را ببینید یا یک مقاله آزمایشی بسازید",
                '<div class="note" style="white-space:pre-wrap;font-size:12px;line-height:1.9" id="promptPreview"></div>'
                '<div class="grid2" style="margin-top:12px">' + field("موضوع آزمایشی", "", "خواص دارچین برای سلامت")
                + field("کلمات کلیدی", "", "دارچین") + '</div>'
                + '<button class="btn-a ghost" data-toast="مقالهٔ آزمایشی ساخته شد (ذخیره نشد)">ساخت مقالهٔ آزمایشی</button>')
    extra = card("دستورالعمل تکمیلی", "قوانین سئو و ساختار خودکار اضافه می‌شوند",
                 field("", "", "مثلاً همیشه از مثال ایرانی استفاده کن و از کلمات تبلیغاتی پرهیز کن", "area"))
    return (f'<div class="grid2"><div>{card("پرامپت اصلی (Master Prompt)", "از متغیرها برای شخصی‌سازی پویا استفاده کنید", master)}</div>'
            f'<div>{vars_}{extra}</div></div><div style="margin-top:14px">{prev}</div>')


def p_content():
    ident = (field("نام سایت", "بن‌لی‌فود") + field("حوزهٔ فعالیت", "فروشگاه مواد غذایی طبیعی") +
             field("مخاطب", "خریدار خانگی") + field("برند و نکات کلیدی", "", "بدون شعار تبلیغاتی؛ تأکید بر اصالت کالا", "area"))
    tone = opts(["آموزشی", "صمیمی", "فروشگاهی", "تخصصی", "روایی"], 0) + '<div style="margin-top:12px">' \
        + field("لحن دلخواه (اختیاری)", "", "مثلاً آرام و مطمئن") + '</div>'
    edit = (swrow("ویرایش خودکار فارسی", "نیم‌فاصله، اعداد فارسی، علائم نگارشی", True) +
            swrow("حذف جمله‌های تبلیغاتی", "بدون «بهترین» و «بی‌نظیر»", True) +
            swrow("تبدیل به فارسی روان", "اصطلاحات لاتین فقط در صورت نیاز", False))
    structure = ('<div class="row2">' + field("حداقل کلمات", "۱۲۰۰") + field("حداکثر کلمات", "۱۸۰۰") + '</div>'
                 + '<div class="row2">' + field("تراکم کلمهٔ کلیدی", "۱.۲٪") + field("تعداد هدینگ H2", "۵") + '</div>'
                 + field("ساختار", '<option>مقدمه · H2 · جدول · FAQ · جمع‌بندی</option>', kind="select"))
    parts = (opts(["باکس نکات", "جدول", "FAQ", "CTA", "لیست مزایا", "نتیجه‌گیری"], 0)
             + '<div style="margin-top:12px">' + swrow("فهرست مطالب خودکار", "برای مقاله‌های بلند", True) + '</div>')
    return ('<div class="grid2"><div>'
            + card("هویت سایت", "هوش مصنوعی بر اساس این اطلاعات می‌نویسد", ident)
            + card("طول و ساختار", "", structure) + '</div><div>'
            + card("لحن و سبک", "", tone)
            + card("ویرایش خودکار فارسی", "پس‌پردازش متن پس از تولید", edit)
            + card("اجزای مقاله", "بخش‌هایی که در هر مقاله گنجانده می‌شوند", parts) + '</div></div>')


def p_seo():
    plugin = (kv([("افزونه شناسایی‌شده", "Rank Math SEO"), ("نسخه", "۱.۰.۲۲۰"), ("وضعیت", '<span class="tag ok">سازگار</span>')])
              + note("Yoast، Rank Math، AIOSEO و SEOPress همه پشتیبانی می‌شوند؛ متا و اسکیما مستقیم در همین افزونه نوشته می‌شود."))
    slug = (swrow("نامک از کلمهٔ کلیدی", "کوتاه، لاتین یا فارسی بر اساس تنظیمات", True)
            + field("پیشوند نامک", "/blog/"))
    links = (swrow("لینک داخلی خودکار", "به مقالات مرتبط موجود", True)
             + swrow("لینک به محصولات", "مقالات فروش‌محور", True))
    toc = (swrow("فهرست مطالب (TOC)", "", True) + swrow("اسکیما Article", "", True)
           + swrow("اسکیما FAQ", "از بخش پرسش‌های متداول مقاله", True)
           + swrow("اسکیما Product", "وقتی محصولات در مقاله لینک شده‌اند", False))
    save = (field("وضعیت پیش‌فرض", '<option>پیش‌نویس</option><option>منتشرشده</option><option>زمان‌بندی</option>', kind="select")
            + note("مقالات به‌صورت پیش‌فرض پیش‌نویس می‌مانند تا شما تایید کنید."))
    tax = (field("دستهٔ پیش‌فرض", '<option>خواندنی</option><option>سلامت</option><option>آشپزی</option>', kind="select")
           + swrow("برچسب خودکار", "سه برچسب مرتبط", True))
    imgs = note("موتور تصویر، عکس محصولات و تم سایت در تب «تنظیمات تصاویر» تنظیم می‌شود.")
    prod = (swrow("لینک به محصولات فروشگاه", "با نام و آدرس واقعی", True)
            + field("حداکثر محصول در هر مقاله", "۳"))
    dedupe = (swrow("جلوگیری از مقالهٔ تکراری", "مقایسه با مقالات قبلی و صف", True)
              + field("آستانهٔ شباهت", "۷۵٪"))
    return ('<div class="grid2"><div>'
            + card("افزونه سئو", "افزونه شناسایی‌شده: Rank Math", plugin)
            + card("نامک (Slug)", "", slug)
            + card("لینک‌سازی", "", links)
            + card("فهرست مطالب و اسکیما", "", toc)
            + card("جلوگیری از تکرار", "", dedupe) + '</div><div>'
            + card("ذخیره در وردپرس", "مقالات به‌صورت پیش‌فرض پیش‌نویس می‌مانند تا شما تایید کنید", save)
            + card("دسته و برچسب", "", tax)
            + card("تصاویر مقاله", "تنظیمات کامل در تب «تصاویر»", imgs)
            + card("لینک به محصولات فروشگاه", "مقالات فروش‌محور با لینک واقعی به صفحه محصول", prod)
            + '</div></div>')


def p_images():
    engine = (kv([("موتور پیش‌فرض", "Cloudflare Workers AI (رایگان)"), ("ابعاد", "۱۲۰۰×۶۳۰ و ۱۰۲۴×۱۰۲۴"), ("فرمت", "WebP با کیفیت ۸۲")])
              + '<a class="btn-a ghost sm" href="#/image_ai" data-tab="image_ai">انتخاب و ترتیب موتورها</a>')
    refs = (swrow("عکس محصولات مقاله", "همان بسته‌بندی واقعی", True)
            + swrow("نمونه تصاویر سایت", "تم رنگی و نور", True)
            + field("حداکثر تصویر مرجع", "۶") + note("تعداد و حجم مرجع‌ها خودکار با محدودیت هر موتور تنظیم می‌شود."))
    theme = (field("تم تصویری سایت", "", "روشن، مینیمال، پس‌زمینهٔ سفید و نور نرم", "area")
             + '<button class="btn-a ghost sm" data-toast="تم از ۱۲ تصویر سایت یاد گرفته شد">یادگیری تم از تصاویر سایت</button>')
    msg = (field("پیام ساخت تصویر", "", "متغیرها: {title} {keyword} {description} {article} {products} {style} {refs}", "area")
           + '<div class="chipsrow">' + "".join(f'<button class="opt">{t}</button>' for t in
                                               ("{title}", "{keyword}", "{description}", "{products}", "{style}", "{refs}")) + '</div>')
    test = (field("عنوان آزمایشی", "راهنمای خرید روغن زیتون اصل") +
            '<button class="btn-a" id="imgTest" data-toast="تصویر آزمایشی ساخته شد و در رسانه ذخیره شد">ساخت تصویر</button>')
    return ('<div class="grid2"><div>'
            + card("موتور ساخت تصویر", "انتخاب و ترتیب موتورها در تب «هوش مصنوعی تولید تصویر»", engine)
            + card("مرجع‌ها: محصولات و تم سایت", "", refs)
            + card("تم تصویری سایت", "یک‌بار یاد گرفته می‌شود و برای همه تصاویر استفاده می‌شود (صرفه‌جویی در توکن)", theme) + '</div><div>'
            + card("پیام ساخت تصویر به ChatGPT", "وقتی تصویر با اکانت ChatGPT ساخته می‌شود", msg)
            + card("تست تصویر", "با همان تنظیمات و مرجع‌های واقعی", test) + '</div></div>')


def p_knowledge():
    status = (kv([("آخرین یادگیری", "۳ روز پیش"), ("منابع خوانده‌شده", "۱۲ منبع"), ("موتور", "Gemini 2.5 Pro")])
              + '<button class="btn-a" data-toast="یادگیری شروع شد — از GitHub Actions اجرا می‌شود">یادگیری / به‌روزرسانی الان</button>')
    settings = (field("منابع", '<option>راهنمای رسمی گوگل + مقالات برتر فارسی و انگلیسی</option>', kind="select")
                + swrow("جستجوی زندهٔ وب", "برای منابع تازه", True)
                + field("دورهٔ به‌روزرسانی", "هر ۳۰ روز"))
    guide = (note("دیتابیس سئو روی GitHub: پوشهٔ seo/ شاخهٔ aaw-data در مخزن خصوصی شما؛ نسخهٔ قبلی جایگزین می‌شود.")
             + '<div class="note" style="white-space:pre-wrap;line-height:1.9;margin-top:10px">۱) عنوان‌ها کلمهٔ کلیدی را در ابتدا داشته باشند. ۲) هر H2 یک سؤال واقعی کاربر را پاسخ دهد. ۳) پاراگراف اول پاسخ مستقیم باشد. ۴) جدول مقایسه برای مقالات خرید. ۵) FAQ حداقل ۳ پرسش. ۶) لینک داخلی به ۲ مقالهٔ مرتبط…</div>'
             + '<button class="btn-a ghost sm" data-toast="دستورالعمل در پوشهٔ seo/ مخزن ذخیره شد">ذخیره در GitHub</button>')
    return ('<div class="grid2"><div>' + card("وضعیت", "", status)
            + card("تنظیمات یادگیری", "", settings) + '</div><div>'
            + card("دستورالعمل فعلی", "نسخه ۴ · ۲٬۱۴۰ توکن", guide) + '</div></div>')


def p_gsc():
    opp = card("فرصت‌های سرچ کنسول", "property: benlifood.ir",
               table(["کوئری", "کلیک", "نمایش", "CTR", "جایگاه"],
                     [("روغن زیتون اصل", "۱۲۴", "۳٬۲۰۰", "۳.۹٪", "۸.۲"),
                      ("خواص دارچین", "۸۸", "۲٬۱۰۰", "۴.۲٪", "۹.۱"),
                      ("زعفران قرمز", "۶۲", "۱٬۹۰۰", "۳.۳٪", "۱۱.۴")]))
    dup = card("مقاله‌های تکراری و رقیب (همپوشانی)", "مقاله‌هایی که برای یک جستجو با هم رقابت می‌کنند",
               table(["مقاله ۱", "مقاله ۲", "شباهت", "پیشنهاد"],
                     [("راهنمای روغن زیتون", "روغن زیتون فرابکر چیست", "۸۲٪", '<span class="tag wait">ادغام با ۳۰۱</span>'),
                      ("خواص دارچین", "دارچین برای لاغری", "۷۶٪", '<span class="tag">بازبینی دستی</span>')]))
    merged = card("ادغام‌های انجام‌شده و ریدایرکت‌ها", "",
                  table(["از", "به", "نوع", "وضعیت"],
                        [("/blog/olive-oil-guide-2", "/blog/olive-oil", "۳۰۱", '<span class="tag ok">انجام شد</span>'),
                         ("/blog/cinnamon-2", "/blog/cinnamon", "۳۰۱", '<span class="tag ok">انجام شد</span>')]))
    conn = (field("Client ID", "••••.apps.googleusercontent.com") + field("Client secret", "GOCSPX-••••••••") +
            field("Property سرچ کنسول", "sc-domain:benlifood.ir") +
            '<div style="display:flex;gap:8px"><button class="btn-a" data-test>تست اتصال</button>'
            '<button class="btn-a ghost" data-toast="کوئری‌های ۲۸ روز گذشته دریافت شد">دریافت داده</button></div>')
    return ('<div class="grid2"><div>' + opp + '<div style="margin-top:14px">' + merged + '</div></div>'
            '<div>' + dup + '<div style="margin-top:14px">' + card("اتصال به گوگل سرچ کنسول", "", conn) + '</div></div></div>')


def p_ai():
    form = ('<div class="grid2">' + field("نام نمایشی", "OpenAI GPT-5.1") + field("فرمت API", '<option>openai</option><option>anthropic</option><option>gemini</option><option>custom</option>', kind="select") + '</div>'
            + '<div class="grid2">' + field("Base URL", "https://api.openai.com/v1") + field("مسیر Endpoint", "/chat/completions") + '</div>'
            + '<div class="grid2">' + field("Query string (اختیاری)", "", "api-version=2024-10") + field("مدل پیش‌فرض", "gpt-5.1") + '</div>'
            + '<div class="grid2">' + field("نوع احراز هویت", '<option>Bearer</option><option>x-api-key</option><option>Query param</option>', kind="select")
            + field("کلید API (در Secrets کلادفلر ذخیره می‌شود)", "sk-proj-••••••••••••") + '</div>'
            + field("هدرهای اضافه (هر خط Name: Value)", "OpenAI-Beta: assistants=v2", kind="area")
            + '<div style="display:flex;gap:8px"><button class="btn-a" data-toast="تنظیمات مدل ذخیره و در Secrets نوشته شد">ذخیره</button>'
            '<button class="btn-a ghost" data-test>تست اتصال</button>'
            '<button class="btn-a ghost" data-toast="۲۳ مدل از این کلید دریافت شد">دریافت لیست مدل‌ها</button></div>')
    side = (card("انتخاب هوش مصنوعی", "به تب اصلی منتقل شد",
                 note("انتخاب و ترتیب هوش مصنوعی‌ها به تب اصلی «هوش مصنوعی تولید محتوا» منتقل شد.")
                 + '<a class="btn-a ghost sm" href="#/text_ai" data-tab="text_ai">هوش مصنوعی تولید محتوا</a>'))
    return ('<div class="grid2"><div>' + card("تنظیمات مدل‌های متنی", "انتخاب و ترتیب هوش مصنوعی‌ها به تب اصلی «هوش مصنوعی تولید محتوا» منتقل شد", form)
            + '</div><div>' + side + '</div></div>')


def p_subscription():
    table_plans = card("پلن‌های اشتراک", "وضعیت هر مسیر اجرا",
                       table(["وضعیت", "نوع", "مدت", "نوشتن مقاله", "GitHub Actions", "کلادفلر", "پیشنهاد", "تمدید"],
                             [('<span class="tag ok">فعال</span>', "Claude Pro", "ماهانه", "✓", "✓", "—", "مناسب حجم بالا", "۱۴۰۵/۰۴/۱۲"),
                              ('<span class="tag wait">تست</span>', "ChatGPT Plus", "ماهانه", "—", "✓", "—", "برای تصویر", "—")]))
    limits = (kv([("هزینهٔ API", "صفر"), ("محدودیت", "سهمیهٔ پلن اشتراکی"), ("سرعت", "صف GitHub Actions")])
              + note("هزینه و محدودیت‌ها به پلن خودتان بستگی دارد؛ افزونه هزینهٔ اضافی ندارد."))
    github = (field("توکن GitHub", "ghp_••••••••••••") + field("نام مخزن خصوصی", "aaw-data") +
              '<button class="btn-a ghost sm" data-toast="GitHub وصل شد">اتصال GitHub</button>')
    claude = (field("توکن اشتراک Claude", "sk-ant-oat01-••••••••") + field("مدل", "", "خالی = پیش‌فرض پلن شما") +
              '<button class="btn-a ghost sm" id="deviceBtn">گرفتن کد یک‌بارمصرف</button>'
              '<div id="deviceOut" class="note ok" style="display:none;margin-top:10px">کد یک‌بارمصرف: XXXX-XXXX — در claude.ai وارد کنید.</div>')
    codex = (field("محتوای کامل auth.json", "", "{\"tokens\": …}", "area") +
             field("مدل", "", "خالی = پیش‌فرض پلن شما"))
    runner = (field("نام ورکر Runner", "aaw-runner") + field("مدل جایگزین", "gpt-5.1-mini") +
              '<button class="btn-a ghost sm" data-toast="ورکر Runner مستقر شد">استقرار</button>')
    faq = card("سؤالات متداول", "",
               '<ul class="list-clean"><li>آیا به کلید API نیاز دارم؟ نه، با اکانت اشتراکی هم کار می‌کند.</li>'
               '<li>آیا اطلاعات حساب من جایی ذخیره می‌شود؟ رمزنگاری‌شده روی مخزن خصوصی خودتان.</li>'
               '<li>GitHub رایگان است؟ برای این حجم، بله.</li></ul>')
    return ('<div class="grid2"><div>' + table_plans + '<div style="margin-top:14px">' + card("هزینه و محدودیت‌ها", "", limits) + '</div>'
            + '<div style="margin-top:14px">' + faq + '</div></div>'
            '<div>' + card("ورکر کلادفلر (زمان‌بند رایگان)", "", runner)
            + card("اتصال GitHub (سرور رایگان اجرای کار)", "", github)
            + card("اتصال اکانت اشتراکی شما", "", claude)
            + card("تست، فعال‌سازی و اجراها", "", codex) + '</div></div>')


def p_engines():
    jobs = card("آخرین کارهای اجراشده روی سرور", "مقاله، تصویر، اصلاح، تحلیل و تست",
                table(["زمان", "کار", "برنامه", "مدت", "وضعیت"],
                      [("۱۲:۲۴", "نگارش مقاله", "Claude Code", "۲m ۵۱s", '<span class="tag ok">موفق</span>'),
                       ("۱۱:۰۸", "ساخت تصویر", "Codex", "۹s", '<span class="tag ok">موفق</span>'),
                       ("۱۰:۴۰", "تست اتصال", "Claude Code", "۰.۹s", '<span class="tag ok">موفق</span>')]))
    checks = (swrow("Node.js", "v20.11.1 — مسیر /usr/bin/node", True)
              + swrow("proc_open", "فعال", True)
              + swrow("Claude Code", "نسخهٔ ۲.۰ نصب و لاگین", True)
              + swrow("Codex CLI", "نصب نشده", False))
    how = ('<div class="row3">' + field("مسیر Node.js (خالی = خودکار)", "", "/usr/bin/node")
           + field("مسیر برنامه Codex (خالی = خودکار)", "", "/usr/local/bin/codex")
           + field("مسیر برنامه Claude Code (خالی = خودکار)", "", "/usr/local/bin/claude") + '</div>'
           + field("حداکثر زمان هر درخواست (دقیقه)", "۲۰")
           + note("وقتی روش اجرای یک اکانت «مستقیم از همین سرور» باشد، هیچ کاری به GitHub یا کلادفلر نمی‌رود.")
           + '<button class="btn-a" data-toast="مسیرها ذخیره شد">ذخیره</button>')
    return ('<div class="grid2"><div>' + jobs + '</div><div>' + card("بررسی‌های سرور", "از داخل خود PHP", checks)
            + card("این روش چطور کار می‌کند؟", "", how) + '</div></div>')


def p_schedule():
    status = (kv([("وضعیت Cron", '<span class="tag ok">فعال</span>'), ("آخرین اجرا", "۱۲:۰۰"), ("اجرای بعدی", "۱۶:۰۰")])
              + '<button class="btn-a ghost sm" data-toast="Cron دستی اجرا شد">اجرای دستی الان</button>')
    interval = (field("هر چند ساعت یک‌بار", '<option>۶</option><option>۱</option><option>۳</option><option>۱۲</option><option>۲۴</option>', kind="select", extra='id="interval"')
                + '<div class="note">عبارت Cron فعلی: <b id="cronNow">۰ */۶ * * *</b></div>'
                + note("زمان‌ها بر اساس UTC در کلادفلر ثبت می‌شوند."))
    behaviour = (swrow("ادامهٔ صف تا پایان", "تا وقتی موضوع هست اجرا می‌شود", True)
                 + swrow("توقف پس از خطا", "سه خطای پیاپی", True)
                 + field("سقف روزانه", "۸ مقاله"))
    upcoming = table(["زمان", "موضوع", "اولویت"],
                     [("امروز ۱۶:۰۰", "نگهداری زعفران در خانه", "بالا"),
                      ("فردا ۰۹:۰۰", "تفاوت پستهٔ اکبری و فندقی", "عادی"),
                      ("فردا ۱۶:۰۰", "صبحانهٔ سالم برای کودکان", "عادی")])
    return ('<div class="grid2"><div>' + card("وضعیت", "", status) + card("فاصله اجرا", "", interval) + '</div>'
            '<div>' + card("رفتار اجرا", "", behaviour) + card("اجراهای بعدی", "به وقت سایت شما", upcoming) + '</div></div>')


def p_cloudflare():
    account = (field("API Token", "••••••••••••••••") + field("Account ID", "1a2b3c4d5e6f7a8b9c0d") +
               field("نام ورکر", "aaw-worker") + field("کلید امضای مشترک (AAW_SHARED_SECRET)", "••••••••••••") +
               note("توکن رمزنگاری‌شده (AES-256-GCM) ذخیره می‌شود.") +
               '<div style="display:flex;gap:8px"><button class="btn-a" data-test>تست اتصال</button>'
               '<button class="btn-a ghost" data-toast="توکن ذخیره شد">ذخیره</button></div>')
    guide = ('<ol class="list-clean"><li>داشبورد کلادفلر → My Profile → API Tokens</li>'
             '<li>Create Token → قالب «Edit Cloudflare Workers»</li>'
             '<li>توکن را اینجا بچسبانید؛ Account ID در ستون راست همان صفحه است.</li></ol>')
    worker = (kv([("وضعیت", '<span id="workerState" class="tag wait">مستقر نشده</span>'), ("KV", "aaw_kv · ساخته شده"), ("Cron", "۰ */۶ * * *")])
              + '<button class="btn-a" id="deployBtn">استقرار ورکر</button>')
    mode = opts(["ورکر کلادفلر", "اجرا روی هاست", "GitHub Actions"], 0)
    diag = (note("اگر خطای <b>error code: 1016</b> دیدید، علت دقیق اینجاست.", "warn")
            + '<div class="row2" style="padding:6px 0"><span>وردپرس → ورکر</span><span style="justify-self:end"><span class="tag ok">۲۰۰ OK</span></span></div>'
            + '<div class="row2" style="padding:6px 0"><span>ورکر → وردپرس</span><span style="justify-self:end"><span class="tag ok">۲۰۰ OK</span></span></div>'
            + '<button class="btn-a ghost sm" data-toast="عیب‌یابی اجرا شد — همه‌چیز سالم است">اجرای عیب‌یابی</button>')
    manual = (field("آدرس ورکر دستی", "https://aaw.example.workers.dev") +
              note("اگر ترجیح می‌دهید با Wrangler مستقر کنید، از این آدرس استفاده می‌شود."))
    return ('<div class="grid2"><div>' + card("اطلاعات حساب کلادفلر", "توکن رمزنگاری‌شده (AES-256-GCM) ذخیره می‌شود", account)
            + card("راهنمای ساخت توکن", "", guide) + card("استقرار دستی (اختیاری)", "اگر ترجیح می‌دهید با Wrangler مستقر کنید", manual) + '</div>'
            '<div>' + card("ورکر", "مستقر شده در", worker) + card("حالت اتصال", "نحوه ارتباط ورکر کلادفلر با سایت", mode)
            + card("عیب‌یابی اتصال ورکر ↔ وردپرس", "اگر خطایی مثل error code: 1016 دیدید، اینجا علت دقیق را پیدا کنید", diag) + '</div></div>')


def p_notify():
    email = (field("ایمیل مدیر", "admin@benlifood.ir") + swrow("مقالهٔ آمادهٔ تایید", "", True)
             + swrow("خطای اجرا", "", True))
    tg = (field("توکن ربات", "123456:AA••••••••") + field("Chat ID", "123456789")
          + '<button class="btn-a ghost sm" data-toast="پیام تست به تلگرام ارسال شد">ارسال تست</button>')
    hook = (field("آدرس وب‌هوک", "https://hooks.slack.com/services/…") + swrow("رویداد: مقاله ساخته شد", "", True)
            + swrow("رویداد: خطا", "", True))
    inner = (swrow("ویجت پیشخوان", "کارت وضعیت در داشبورد وردپرس", True)
             + swrow("حباب تعداد در منو", "مقالات در انتظار تایید", True))
    return ('<div class="grid2"><div>' + card("ایمیل", "", email) + card("وب‌هوک", "ارسال رویدادها به Slack، Discord، n8n، Zapier و…", hook)
            + '</div><div>' + card("تلگرام", "ارسال پیام از طریق ربات شخصی", tg)
            + card("داخل وردپرس", "", inner) + '</div></div>')


def p_logs():
    rows = [("۱۲:۴۱", '<span class="tag ok">موفق</span>', "تست اتصال", "پاسخ ۲۰۰ از Workers AI", "Workers AI", "۰.۴s", "۱٬۲۰۰"),
            ("۱۲:۳۰", '<span class="tag ok">موفق</span>', "ساخت تصویر", "تصویر شاخص ساخته شد", "Workers AI", "۸s", "—"),
            ("۱۲:۲۴", '<span class="tag ok">موفق</span>', "نگارش مقاله", "پیش‌نویس ساخته شد", "Claude Pro", "۳m ۲۴s", "۸٬۴۰۰"),
            ("۱۱:۵۸", '<span class="tag ok">موفق</span>', "تحلیل سایت", "۲۴ موضوع پیشنهاد شد", "Gemini 2.5", "۴۲s", "۱۲٬۹۰۰"),
            ("۱۱:۰۲", '<span class="tag err">خطا</span>', "ادغام مقالات", "سهمیه تمام شد، موتور بعدی امتحان شد", "Claude Pro", "—", "—")]
    body = (table(["زمان", "وضعیت", "رویداد", "پیام", "مدل", "مدت", "توکن"], rows)
            + '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn-a ghost sm" data-toast="خروجی CSV ساخته شد">خروجی CSV</button>'
            '<button class="btn-a ghost sm" data-toast="فیلترها بازنشانی شد">بازنشانی فیلتر</button></div>')
    return card("همه رویدادها", "تولید، استقرار، خطاها و مصرف توکن", body)


def p_tools():
    backup = (note("بدون کلیدها و اطلاعات محرمانه.") +
              '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn-a ghost sm" data-toast="فایل پشتیبان ساخته شد">دریافت پشتیبان</button>'
              '<button class="btn-a ghost sm" data-toast="فایل بارگذاری شد">بازیابی</button></div>')
    adv = (swrow("حالت دیباگ", "لاگ کامل درخواست‌ها", False)
           + swrow("حذف تنظیمات هنگام حذف افزونه", "", False)
           + field("نگهداری گزارش‌ها (روز)", "۳۰"))
    sysinfo = kv([("وردپرس", "6.7"), ("PHP", "8.2"), ("حافظه", "۵۱۲M"), ("Cron", "فعال")])
    keys = ('<ul class="list-clean"><li><b>?</b> راهنمای میان‌برها</li><li><b>Ctrl+1…9</b> جابه‌جایی بین تب‌ها</li>'
            '<li><b>Ctrl+S</b> ذخیرهٔ تنظیمات تب فعلی</li></ul>')
    return ('<div class="grid2"><div>' + card("پشتیبان تنظیمات", "بدون کلیدها و اطلاعات محرمانه", backup)
            + card("پیشرفته", "", adv) + '</div><div>' + card("اطلاعات سیستم", "", sysinfo)
            + card("میان‌برهای صفحه‌کلید", "", keys) + '</div></div>')


def p_features():
    grid = ('<div id="featGrid" class="grid2">'
            + "".join(f'<div class="note">{t}</div>' for t in (
                "۲۳ موتور متنی و ۷ موتور تصویری با زنجیرهٔ پشتیبان",
                "۵ جستجوگر تصویر و تولید تصویر شاخص خودکار",
                "۴ افزونهٔ سئو: Yoast، Rank Math، AIOSEO، SEOPress",
                "۲ یادگیری دانش سئو از منابع رسمی گوگل",
                "۳ روش اجرا: ورکر، هاست، GitHub Actions",
                "۲۲ تب مدیریتی با ۵۰۰ قابلیت قابل جستجو",
            )) + '</div>')
    return (field("", "", "جستجو در ۵۰۰ قابلیت…", extra='id="featSearch"')
            + note("فهرست کامل و جستجوپذیر داخل خود افزونه است؛ نیازی به سایت ما نیست.")
            + '<div style="margin-top:12px">' + grid + '</div>')


def p_license():
    plans = table(["پلن", "مدت", "دامنه", "قیمت"],
                  [("شروع", "۱ ماه", "نامحدود", "۴۹۵٬۰۰۰ تومان"),
                   ("حرفه‌ای", "۶ ماه", "نامحدود", "۱٬۴۹۵٬۰۰۰ تومان"),
                   ("سالانه", "۱۲ ماه", "نامحدود", "۱٬۹۹۹٬۰۰۰ تومان"),
                   ("مادام‌العمر", "همیشگی", "نامحدود", "۴٬۴۹۵٬۰۰۰ تومان")])
    ups = (swrow("به‌روزرسانی خودکار", "مثل افزونه‌های مخزن وردپرس", True)
           + kv([("نسخهٔ نصب‌شده", "1.9.1"), ("آخرین نسخه", "1.9.1")]))
    support = ('<ul class="list-clean"><li>راهنمای نصب و راه‌اندازی</li><li>پشتیبانی تیکت</li>'
               '<li>مستندات ورکر و GitHub</li></ul>')
    status = (field("کلید لایسنس", "XXXX-XXXX-XXXX-XXXX") +
              '<button class="btn-a" data-toast="کلید بررسی شد و روی این دامنه فعال شد">فعال‌سازی</button>'
              + '<div style="margin-top:12px">' + kv([("وضعیت", '<span class="tag ok">فعال</span>'),
                                                     ("دامنه", "benlifood.ir"), ("انقضا", "۱۴۰۶/۰۲/۱۲")]) + '</div>')
    return ('<div class="grid2"><div>' + card("پلن‌ها", "قیمت‌ها مستقیم از فروشگاه رسمی خوانده می‌شود", plans)
            + '</div><div>' + card("فعال‌سازی لایسنس", "", status)
            + card("به‌روزرسانی خودکار", "نسخه‌های جدید مثل افزونه‌های مخزن وردپرس در صفحه افزونه‌ها نمایش داده می‌شوند", ups)
            + card("پشتیبانی و راهنما", "", support) + '</div></div>')


PANELS = [
    ("text_ai", p_text_ai, True), ("image_ai", p_image_ai, False),
    ("dashboard", p_dashboard, True), ("review", p_review, False),
    ("strategy", p_strategy, False), ("timeline", p_timeline, False), ("activity", p_activity, False),
    ("topics", p_topics, False), ("prompt", p_prompt, False), ("content", p_content, False),
    ("seo", p_seo, False), ("images", p_images, False), ("knowledge", p_knowledge, False),
    ("gsc", p_gsc, False),
    ("ai", p_ai, False), ("subscription", p_subscription, False), ("engines", p_engines, False),
    ("schedule", p_schedule, False), ("cloudflare", p_cloudflare, False),
    ("notify", p_notify, False), ("logs", p_logs, False), ("tools", p_tools, False),
    ("features", p_features, False),
    ("license", p_license, False),
]

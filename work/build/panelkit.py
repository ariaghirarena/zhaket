#!/usr/bin/env python3
"""Build the demo shell (sidebar + 24 panels) straight from the real plugin structure.

Source of truth: includes/class-aaw-admin.php::tabs() (24 tabs, 6 groups) and the
AAW_Admin::head()/card_open() calls in admin/views/*.php. Head titles, head
subtitles, card titles and card subtitles below are copied verbatim from the PHP;
the bodies are sample data (this is a demo).

Output: work/build/shell.html, spliced into work/site/demo/index.html between the
SHELL:START / SHELL:END markers by work/build/demo_shell.py.
"""
TABS_ORDER = [
    "text_ai", "image_ai",
    "dashboard", "review", "strategy", "timeline", "activity",
    "topics", "prompt", "content", "seo", "images", "knowledge", "gsc",
    "ai", "subscription", "engines", "schedule", "cloudflare",
    "notify", "logs", "tools", "features",
    "license",
]

# tabs()[$slug][0] — the sidebar/submenu label
LABEL = {
    "text_ai": "هوش مصنوعی تولید محتوا",
    "image_ai": "هوش مصنوعی تولید تصویر",
    "dashboard": "داشبورد",
    "review": "صف بازبینی",
    "strategy": "تحلیل هوشمند سایت",
    "timeline": "خط زمانی",
    "activity": "فعالیت زنده",
    "topics": "موضوعات",
    "prompt": "پرامپت",
    "content": "ساختار محتوا",
    "seo": "سئو و انتشار",
    "images": "تنظیمات تصاویر",
    "knowledge": "دانش سئو",
    "gsc": "سرچ کنسول و ادغام مقالات",
    "ai": "کلیدهای API و مدل‌ها",
    "subscription": "اکانت اشتراکی",
    "engines": "موتور هوش مصنوعی روی سرور",
    "schedule": "زمان‌بندی",
    "cloudflare": "کلادفлер",
    "notify": "اعلان‌ها",
    "logs": "گزارش‌ها",
    "tools": "ابزارها",
    "features": "قابلیت‌ها",
    "license": "لایسنس و حساب",
}
LABEL["cloudflare"] = "کلادفلر"

# tabs()[$slug][2] — group heading
GROUPS = [
    ("اصلی", ["text_ai", "image_ai"]),
    ("نمای کلی", ["dashboard", "review", "strategy", "timeline", "activity"]),
    ("محتوا", ["topics", "prompt", "content", "seo", "images", "knowledge", "gsc"]),
    ("زیرساخت", ["ai", "subscription", "engines", "schedule", "cloudflare"]),
    ("سیستم", ["notify", "logs", "tools", "features"]),
    ("حساب کاربری", ["license"]),
]

ICON = {
    "text_ai": "content", "image_ai": "image", "dashboard": "dashboard", "review": "review",
    "strategy": "wand", "timeline": "calendar", "activity": "activity", "topics": "list",
    "prompt": "prompt", "content": "content", "seo": "seo", "images": "image",
    "knowledge": "book", "gsc": "trending", "ai": "key", "subscription": "user",
    "engines": "cpu", "schedule": "clock", "cloudflare": "cloud", "notify": "bell",
    "logs": "logs", "tools": "wrench", "features": "layers", "license": "key2",
}

SVG = {
    "content": '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    "image": '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-6 6"/>',
    "dashboard": '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>',
    "review": '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8"/>',
    "wand": '<path d="M12 3l2.2 5.6L20 10l-5.8 1.4L12 17l-2.2-5.6L4 10l5.8-1.4z"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    "activity": '<path d="M3 12h4l3-9 4 18 3-9h4"/>',
    "list": '<path d="M4 7h16M4 12h10M4 17h7"/>',
    "prompt": '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/>',
    "seo": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "book": '<path d="M4 5h7v15H4zM13 5h7v15h-7z"/>',
    "trending": '<path d="M3 17l5-6 4 4 5-8 4 5"/>',
    "key": '<circle cx="8" cy="12" r="3"/><path d="M14 12h7M17 9v6"/>',
    "user": '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.6-3.4 4-5 7-5s5.4 1.6 7 5"/>',
    "cpu": '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    "cloud": '<path d="M7 18h10a4 4 0 000-8 6 6 0 00-11.6 2A3.5 3.5 0 007 18z"/>',
    "bell": '<path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20h4"/>',
    "logs": '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h4"/>',
    "wrench": '<path d="M14 6l4 4-8 8H6v-4z"/><path d="M15 4l5 5"/>',
    "layers": '<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
    "key2": '<circle cx="8.5" cy="12" r="4.5"/><path d="M13 12h8M18 12v4M21 12v3"/>',
}


def svg(name):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
            + SVG[name] + '</svg>')


# ---------------------------------------------------------------- components
def card(title, sub="", body="", cls=""):
    head = title + (f' <span class="sub">{sub}</span>' if sub else "")
    return (f'<div class="card{(" " + cls) if cls else ""}"><div class="card-h">{head}</div>'
            f'<div class="card-b">{body}</div></div>')


def kpis(items):
    cells = []
    for v, l, t, d, i in items:
        idattr = ' id="%s"' % i if i else ""
        trend = ""
        if t:
            cls = "tr down" if d else "tr"
            trend = '<span class="%s">%s</span>' % (cls, t)
        cells.append(
            '<div class="card"><div class="card-b"><div class="kpi"><b%s>%s</b><span>%s</span>%s'
            '</div></div></div>' % (idattr, v, l, trend))
    return '<div class="grid4" style="margin-bottom:14px">%s</div>' % "".join(cells)


def field(label, value="", ph="", kind="text", extra=""):
    hold = f' value="{value}"' if value else (f' placeholder="{ph}"' if ph else "")
    if kind == "area":
        return f'<div class="field"><label>{label}</label><textarea class="input" rows="3"{(" " + extra) if extra else ""}{hold}></textarea></div>'
    if kind == "select":
        return f'<div class="field"><label>{label}</label><select class="input"{(" " + extra) if extra else ""}>{value}</select></div>'
    return f'<div class="field"><label>{label}</label><input class="input" type="{kind}"{hold}{(" " + extra) if extra else ""}></div>'


def prov(rank, name, desc, on=True, chip=""):
    state = "true" if on else "false"
    sw = '<span class="switch" role="switch" aria-checked="%s"></span>' % state
    return ('<div class="prov"><span class="av" style="background:linear-gradient(140deg,#1D4ED8,#38BDF8)">%s</span>'
            '<div><div class="nm">%s</div><div class="ds">%s</div></div>'
            '<div class="end">%s%s</div></div>' % (rank, name, desc, chip, sw))


def table(headers, rows, id=""):
    th = "".join("<th>%s</th>" % h for h in headers)
    body = []
    for r in rows:
        tds = []
        for i, c in enumerate(r):
            cls = ' class="name"' if i == 1 else ""
            tds.append("<td%s>%s</td>" % (cls, c))
        body.append("<tr>" + "".join(tds) + "</tr>")
    idattr = ' id="%s"' % id if id else ""
    return '<table class="tbl"%s><thead><tr>%s</tr></thead><tbody>%s</tbody></table>' % (idattr, th, "".join(body))


def kv(pairs):
    body = "".join(f'<div class="row2" style="padding:7px 0"><span class="sub" style="font-size:12px;color:#64748b">{k}</span>'
                   f'<b style="color:var(--navy);font-size:13px">{v}</b></div>' for k, v in pairs)
    return f'<div>{body}</div>'


def note(text, kind=""):
    return f'<div class="note {kind}">{text}</div>'


def steps(items):
    return '<div class="steps-live">' + "".join(
        f'<div class="sl {c}"><span class="b">{b}</span>{t}</div>' for c, b, t in items) + "</div>"


def opts(labels, on=0):
    return '<div class="chipsrow">' + "".join(
        f'<button type="button" class="opt{(" on" if i == on else "")}">{l}</button>' for i, l in enumerate(labels)) + "</div>"


def swrow(label, desc, on=True):
    state = "true" if on else "false"
    return ('<div class="row2" style="align-items:center;padding:8px 0">'
            '<div><div style="font-size:13px;color:#334155;font-weight:600">%s</div>'
            '<div style="font-size:11.5px;color:#64748b">%s</div></div>'
            '<div style="justify-self:end"><span class="switch" role="switch" aria-checked="%s"></span></div></div>'
            % (label, desc, state))


def panel(tab, body, head_extra=""):
    title, sub = HEADS[tab]
    actions = f'<div class="panel-actions">{head_extra}</div>' if head_extra else ""
    return (f'<section class="panel" id="p-{tab}">\n'
            f'      <h1 class="panel-title">{title}</h1>\n'
            f'      <p class="panel-sub">{sub}</p>\n'
            f'{actions}\n{body}\n    </section>')


# AAW_Admin::head() — title + subtitle, verbatim
HEADS = {
    "text_ai": ("هوش مصنوعی تولید محتوا", "هوش مصنوعی‌هایی که مقاله می‌نویسند و ترتیب استفاده از آن‌ها. اولی همیشه اول امتحان می‌شود؛ اگر خطا داد یا سهمیه‌اش تمام شد، بعدی."),
    "image_ai": ("هوش مصنوعی تولید تصویر", "موتورهایی که تصویر شاخص و تصاویر داخل مقاله را می‌سازند و ترتیب استفاده از آن‌ها. اگر اولی خطا بدهد، بعدی امتحان می‌شود."),
    "dashboard": ("داشبورد", "وضعیت کلی تولید محتوای خودکار سایت شما"),
    "review": ("صف بازبینی", "مقالات تولیدشده در پیش‌نویس منتظر تایید شما هستند؛ پیش‌نمایش، ویرایش، انتشار یا زمان‌بندی کنید."),
    "strategy": ("تحلیل هوشمند سایت", "هوش مصنوعی کل سایت، محصولات، دسته‌ها و رقبا را بررسی می‌کند و یک برنامه محتوای کامل با بهترین موضوعات و کلمات کلیدی می‌سازد."),
    "timeline": ("خط زمانی تولید محتوا", "ببینید هوش مصنوعی تا امروز چه مقالاتی نوشته، الان چه می‌کند و در آینده چه موضوعی را در چه زمانی خواهد نوشت."),
    "activity": ("فعالیت زنده", "هر کاری که افزونه و هوش مصنوعی انجام می‌دهند (تست اتصال، نوشتن مقاله، ساخت تصویر، تحلیل، اصلاح، یادگیری) همین‌جا با مرحله فعلی و زمان سپری‌شده نمایش داده می‌شود."),
    "topics": ("موضوعات مقالات", "لیست موضوعات را بسازید، با کشیدن جابجا کنید؛ هر موضوعی که تولید شود تیک می‌خورد."),
    "prompt": ("پرامپت هوش مصنوعی", "دستورالعمل اصلی که در هر اجرا برای تولید محتوا به هوش مصنوعی داده می‌شود. قوانین سئو و ساختار به‌صورت خودکار به آن اضافه می‌شوند."),
    "content": ("ساختار و سبک محتوا", "موضوع سایت، لحن، طول و اجزای مقالات را تعریف کنید."),
    "seo": ("سئو و انتشار", "بهینه‌سازی خودکار برای موتورهای جستجو و نحوه ذخیره مقاله در وردپرس."),
    "images": ("تنظیمات تصاویر", "سبک، مرجع‌ها و تم تصویری. تصویر شاخص و تصاویر داخل متن، هماهنگ با تم سایت و با عکس واقعی محصولاتی که در مقاله آمده‌اند."),
    "knowledge": ("دانش به‌روز سئو", "هوش مصنوعی یک‌بار از راهنماهای رسمی گوگل و مقالات برتر ایرانی و بین‌المللی یاد می‌گیرد و همان دستورالعمل را برای همه مقالات استفاده می‌کند."),
    "gsc": ("سرچ کنسول و ادغام مقالات", "کلمات و جستجوهای واقعی سایت از گوگل سرچ کنسول برای پیشنهاد بهترین مقاله‌ها، و پیدا کردن مقاله‌های تکراری/رقیب و ادغام خودکار آن‌ها با ریدایرکت ۳۰۱."),
    "ai": ("کلیدهای API و تنظیمات مدل", "کلیدها و تنظیمات فنی مدل‌های متنی. کلیدهای API مستقیماً در Secrets ورکر کلادفلر ذخیره می‌شوند و هرگز در دیتابیس وردپرس نگهداری نمی‌شوند."),
    "subscription": ("اکانت اشتراکی (بدون API)", "برای کسانی که اکانت چت هوش مصنوعی (Claude Pro/Max یا ChatGPT Plus/Pro) خریده‌اند ولی API پولی ندارند."),
    "engines": ("موتور هوش مصنوعی روی سرور", "نصب، ورود، تست و عیب‌یابی Claude Code و OpenAI Codex روی همین سرور. وقتی روش اجرای یک اکانت «مستقیم از همین سرور» باشد، افزونه مثل یک کاربر عادی برای همان هوش مصنوعی پیام (و برای ChatGPT عکس‌های مرجع) می‌فرستد و هیچ کاری به GitHub یا کلادفلر نمی‌رود."),
    "schedule": ("زمان‌بندی اجرا", "ورکر کلادفلر طبق این زمان‌بندی اجرا می‌شود. با ذخیره، Cron Trigger کلادفلر به‌صورت خودکار به‌روز می‌شود."),
    "cloudflare": ("اتصال کلادفلر", "ورکر، زمان‌بندی Cron، Secrets و فضای KV مستقیماً از همین صفحه روی حساب کلادفلر شما ساخته و مدیریت می‌شوند."),
    "notify": ("اعلان‌ها", "وقتی مقاله جدید آماده تایید شد یا خطایی رخ داد باخبر شوید."),
    "logs": ("گزارش‌ها", "همه رویدادهای تولید، استقرار، خطاها و مصرف توکن."),
    "tools": ("ابزارها", "پشتیبان‌گیری، بازیابی، تنظیمات پیشرفته و اطلاعات سیستم."),
    "features": ("قابلیت‌ها", "۵۰۰ قابلیت پیاده‌سازی‌شده در افزونه و ورکر"),
    "license": ("لایسنس و حساب", "فعال‌سازی لایسنس رسمی، مشاهده وضعیت اشتراک، به‌روزرسانی خودکار و پشتیبانی."),
}

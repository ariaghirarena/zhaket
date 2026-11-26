# ARIAGH.BECHARKHOON — معماری فنی

## نمای کلی

```
becharkhoon.php          ← هدر افزونه، ثابت‌ها، autoloader، HPOS، بارگذاری Plugin
src/
  Plugin.php             ← کانتینر سرویس‌ها و ثبت هوک‌ها
  Core/                  ← Installer, Settings, Crypto, Lang, Helpers, Lock, RateLimit, Logger, Http, Cron, Capabilities
  Wheels/                ← Schema (اسکیمای کامل تنظیمات), Repository (CRUD + موجودی), Templates (۳۶ تم + ۱۲ الگو)
  Engine/                ← Context, Conditions (۵۱ شرط), Limits, Eligibility, Picker, Leads, SpinService
  Credits/               ← Ledger (دفتر شانس‌ها), Rules (قوانین کسب شانس)
  Prizes/                ← Coupons, Gifts (محصول هدیه تصادفی + خط رایگان سبد), CodePool, Integrations (کیف پول/امتیاز), Fulfiller
  Notify/                ← Notifier (ایمیل/بله/تلگرام/وب‌هوک)، Sms (ارسال مرکزی + گزارش)، SmsEvents (پیامک‌ها و متغیرها)، SmsGateways + sms-drivers.php (۲۶ پنل)، Bulk (کمپین‌های زمان‌بندی‌شده پیامک گروهی + هدیه شانس + گزارش هر نفر)
  Front/                 ← Frontend (کانفیگ امن برای کش), Ajax, Guard (توکن/OTP/کپچا), CouponBar (وضعیت واقعی نوار کد), Shortcodes, Account, Login (ورود به سایت با کد پیامکی)
  Admin/                 ← Admin (منو و assets), Rest (همه endpointهای پنل)
  Stats/ Privacy/ Integrations/ (Elementor) Cli/
assets/
  front/wheel.js|css     ← رندر SVG گردونه، پاپ‌آپ، تریگرها، افکت‌ها، صدا (بدون وابستگی)
  admin/*.js|css         ← پنل SPA: ui, charts, fields, editor, pages, app
  data/themes.json       ← ۳۶ تم مشترک بین PHP و JS
  blocks/block.js        ← بلاک گوتنبرگ
```

## جداول

| جدول | کاربرد |
|---|---|
| `bch_wheels` | گردونه‌ها (config به‌صورت JSON طبق `Schema`) |
| `bch_spins` | هر چرخش: نتیجه، جایزه، کد، وضعیت، شخص، منبع، درآمد |
| `bch_leads` | مخاطبان (یکتا بر اساس موبایل/ایمیل) |
| `bch_credits` | دفتر شانس‌ها: qty/used، دلیل، قانون، مرجع، `uniq` برای جلوگیری از تکرار، انقضا |
| `bch_stats` | شمارنده‌های روزانه (نمایش، بازشدن، فرم، چرخش، برد، استفاده، فروش) |
| `bch_codes` | استخر کدهای آماده |
| `bch_stock` | موجودی جوایز (کاهش اتمیک) |
| `bch_log` | لاگ سیستم، ایمیل، پیام‌رسان و وب‌هوک |
| `bch_orders` | آینه سفارش‌های ووکامرس که کد/هدیه گردونه دارند: وضعیت، تاریخ‌ها، مبلغ، تخفیف واقعی، ارزش هدیه، مرجوعی (`Stats/Orders.php`) |
| `bch_sms` | گزارش پیامک‌ها: موبایل، نوع، متن، پنل، وضعیت، پاسخ سامانه |

## جریان یک چرخش

1. صفحه (حتی کش‌شده) فقط کانفیگ ثابت دارد. مرورگر درخواست `bch_boot` (بدون کش) می‌فرستد و توکن HMAC متصل به شناسه دستگاه + گردونه‌های مجاز همان صفحه را می‌گیرد.
2. کاربر فرم را پر می‌کند (در صورت نیاز OTP → توکن جلسه تایید موبایل).
3. `bch_spin` → اعتبارسنجی توکن، کپچا، honeypot، زمان پرکردن، فهرست سیاه، ایمیل موقت، نرخ درخواست.
4. `SpinService::spin`:
   - قفل برای همه شناسه‌های شخص (حساب/موبایل/ایمیل/دستگاه/IP) → جلوگیری از چرخش موازی
   - `Eligibility::check` (زمان‌بندی، مسدودی، شانس اضافه، ورود، نقش، شرط‌ها، cooldown، سقف برد، سهمیه‌ها، شانس‌ها)
   - مصرف اتمیک شانس (`UPDATE … WHERE used < qty`)
   - `Picker::candidates` (وزن، موجودی، سقف روزانه/نفر، شرط هر جایزه، پشتیبانی نوع، سقف بودجه، اولین‌برد/Pity/VIP)
   - قرعه با `random_int` + کاهش اتمیک موجودی
   - ثبت چرخش → صدور جایزه (`Fulfiller`) → در صورت خطا بازگرداندن موجودی و شانس
   - مخاطب، آمار، هوک `becharkhoon_spin`، اعلان‌ها (بعد از ارسال پاسخ)
5. مرورگر گردونه را دقیقاً روی بخش انتخاب‌شده سرور متوقف می‌کند.

## قوانین کسب شانس

`Rules` روی `woocommerce_order_status_changed`، ثبت‌نام، دیدگاه، لید، تولد (کران) و دعوت گوش می‌دهد.
هر اعطا یک کلید `uniq` دارد (مثلاً `r:{rule}:o:{order}`) پس تغییر وضعیت تکراری دوبار شانس نمی‌دهد.
مرجوعی/لغو → `revoke_ref` بخش استفاده‌نشده را باطل می‌کند. شانس مهمان با شماره موبایل ثبت می‌شود و فقط بعد از تایید OTP همان شماره قابل استفاده است.

## پیامک (مثل ARIAGH.VISITOR)

- `SmsEvents` فهرست پیامک‌های خودکار (جایزه، پوچ، کد تایید، شانس جدید، یادآوری، استفاده از جایزه، برنده جدید و درخواست تحویل به مدیر) و همه متغیرها را با عنوان، توضیح و مثال نگه می‌دارد. ویرایشگر، راهنمای متغیرها، پیش‌نمایش و ارسال همه از همین منبع استفاده می‌کنند.
- تنظیم هر پیامک در `sms_tpl[event] = {on, mode: text|pattern, text, code, params}` ذخیره می‌شود.
- `Sms::send_event()` → ساخت متن یا الگو، مقدار پارامتر خالی = «-» → `Sms::send_many()`: پیامک‌های متنی دسته‌ای (به اندازه پنل) و الگوها تک‌به‌تک ارسال می‌شوند. در حالت تست یا خاموش، چیزی ارسال نمی‌شود ولی در `bch_sms` ثبت می‌شود.
- هر گردونه فقط تعیین می‌کند کدام پیامک‌ها را بفرستد؛ با «متن اختصاصی برای همین گردونه» می‌توان متن مشترک را برای آن گردونه عوض کرد.

## نوار چسبان کد تخفیف

1. بعد از برد، مرورگر `{w, sid, code, exp, st}` را در localStorage نگه می‌دارد.
2. هر صفحه، درخواست boot (بدون کش) کد را می‌فرستد و `CouponBar::state()` وضعیت واقعی را برمی‌گرداند:
   `active` (نمایش تا انقضا) · `applied` (در سبد خرید است → پنهان، اگر حذف شود برمی‌گردد) · `used` (سفارش ثبت شده/سهمیه کوپن تمام شده → حذف دائمی) · `expired` · `gone` · `off`.
3. پاسخ، تنظیمات ظاهری نوار (`display.coupon_bar_*`) را هم دارد؛ پس نوار روی صفحاتی که گردونه در آن‌ها هدف‌گیری نشده هم ظاهر می‌شود.
4. اگر چیزی ذخیره نشده باشد و کاربر وارد شده (یا شماره تاییدشده دارد)، آخرین کد زنده‌اش برگردانده می‌شود (نوار روی دستگاه دیگر).
5. رویدادهای ووکامرس `applied_coupon` / `removed_coupon` در سبد و تسویه کلاسیک بلافاصله نوار را پنهان/بررسی مجدد می‌کنند (اکشن `bar`).
6. هوک `becharkhoon_coupon_bar_state` برای تغییر پاسخ.

## طراحی واکنش‌گرا و جایگاه بخش‌ها

- `layout` (پایه/دسکتاپ): `{ button: {x, y, mt, mb, w, align, hide}, wheel: {...} … }` — فهرست بخش‌ها در `Schema::layout_elements()` و `LAYOUT_MAP` در wheel.js.
- `responsive.tablet|mobile`: مسیر نقطه‌ای ← مقدار، مثلاً `"form.button_radius": 30` یا `"layout.button.x": -20`. فقط تنظیمات ظاهری (`Schema::responsive_ok()`)؛ با همان قوانین پایه اعتبارسنجی و مقادیر برابر با دسکتاپ حذف می‌شوند.
- مرورگر: `resolveCfg(base, device)` (موبایل < ۶۴۰، تبلت < ۱۰۲۵) و با عبور از مرز اندازه، پاپ‌آپ دوباره ساخته می‌شود. جابه‌جایی با ویژگی CSS `translate` (متغیرهای `--bch-tx/--bch-ty`) روی `[data-bch-el]`.
- ضد تداخل قالب: همه قوانین wheel.css پسوند `:not(#bchz)` (وزن ID) دارند و یک reset با `:where()` پیش‌فرض‌های قالب را خنثی می‌کند. بعد از ویرایش CSS: `python3 tests/harden-css.py assets/front/wheel.css assets/front/wheel.css`.
- نمایش سریع (`fast_boot`): اسکریپت async در head، `window.BCH_PAGE` درون‌خطی، درخواست boot بلافاصله و رندر در DOMContentLoaded.

## گزارش‌ها و شانس‌های کاربران

- `Stats/Orders.php`: همگام‌سازی زنده با هوک‌های وضعیت/پرداخت/مرجوعی/حذف سفارش + backfill دسته‌ای (پیمایش `woocommerce_order_items` نوع coupon، سازگار با HPOS) که با ارتقای DB به v5 در WP-Cron شروع می‌شود و از صفحه گزارش‌ها هم اجرا می‌شود.
- `Stats/Reports.php`: بازه دقیق (`Y-m-d` یا `Y-m-d H:i` به وقت سایت)، فعالیت از جدول spins، پول از `bch_orders`، سری روزانه/ساعتی.
- `Stats/People.php`: افراد = UNION چرخش‌ها و شانس‌ها (کاربر ← موبایل ← ایمیل ← دستگاه)، تاریخچه، خروجی مخاطبان یکتا.

## امنیت

- پنل: REST با nonce `wp_rest` و capability اختصاصی (`bch_manage` / `bch_view`).
- فرانت: بدون nonce (سازگار با کش)؛ توکن HMAC با عمر محدود و متصل به دستگاه.
- رمزهای پنل پیامک با libsodium (یا OpenSSL) رمز می‌شوند و در پنل ماسک‌شده نمایش داده می‌شوند.
- همه ورودی‌ها از `Schema::sanitize` / `Settings::sanitize` عبور می‌کنند.

## نقاط توسعه (هوک‌ها)

`becharkhoon_loaded`، `becharkhoon_spin`، `becharkhoon_spin_payload`، `becharkhoon_lead`، `becharkhoon_lead_created`، `becharkhoon_credit_granted`، `becharkhoon_prize_redeemed`، `becharkhoon_coupon_bar_state`، `becharkhoon_gift_pool`، `becharkhoon_gift_note`، `becharkhoon_wheels_changed`، `becharkhoon_condition_{type}`، `becharkhoon_sms_drivers`، `becharkhoon_wallet_credit`، `becharkhoon_points_credit`، `becharkhoon_load_on_page`، `becharkhoon_string`.

## تست‌ها (خارج از بسته فروش)

`tests/test-engine.php` با یک محیط وردپرس شبیه‌سازی‌شده روی SQLite اجرا می‌شود (۱۲۹ تست: اسکیما، قرعه، شرط‌ها، سهمیه، شانس‌ها، قوانین اولین خرید/بالای ۲ میلیون/هر ۵۰۰ هزار/مرجوعی، موجودی هم‌زمان، شانس مجدد، Pity، استخر کد، OTP، توکن، رمزنگاری، درایورهای پیامک، مرکز پیامک: متن/الگو، حالت تست، خاموش، پیامک مدیر، متن اختصاصی گردونه، گزارش و مهاجرت تنظیمات).
`tests/devserver.php` همان محیط را به‌صورت سرور مرورگر بالا می‌آورد تا پنل و گردونه در مرورگر تست شوند.

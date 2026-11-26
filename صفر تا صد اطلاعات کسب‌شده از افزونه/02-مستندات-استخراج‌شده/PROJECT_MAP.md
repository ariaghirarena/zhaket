# PROJECT_MAP — ARIAGH.BECHARKHOON («افزونه بچرخون»)

> نقشه کامل پروژه برای ادامه کار در چت جدید Claude. **اول همین فایل را کامل بخوان؛ فایل‌های کد را فقط وقتی لازم شد و فقط خطوط لازم.**
> آخرین به‌روزرسانی: ۱۴۰۵/۰۸/۱۸ (2026-11-09) — نسخه **1.8.0**، DB v6، ۲۵۳ تست پاس.
> فایل‌های همراه: `docs/HANDOFF/LESSONS.md` (اشتباهات/باگ‌ها — قبل از هر تغییر بخوان)، `docs/HANDOFF/HISTORY.md` (تاریخچه چت‌ها و نسخه‌ها)، `docs/HANDOFF/DIAGRAMS.md` (نمودارها)، `docs/ARCHITECTURE.md`، `docs/FEATURES.md`.

---

## ۱. هدف پروژه
- افزونه وردپرس/ووکامرس **گردونه شانس** حرفه‌ای برای فروش، نام نمایشی «افزونه بچرخون»، برند ARIAGH.
- پنل مدیریت SPA فارسی + انگلیسی (RTL) با ظاهر هم‌خانواده افزونه SEOLITY کاربر؛ **بدون سیستم لایسنس**.
- بخش پیامک مثل افزونه دیگر کاربر **ARIAGH.VISITOR** (پنل‌ها، الگو/پترن، متن هر پیامک، راهنمای متغیرها).
- Stack: PHP 7.4+ (namespace `Becharkhoon\`، PSR-4)، WP 5.8+، WooCommerce 6+ اختیاری (HPOS سازگار)، JS خالص بدون فریم‌ورک.

## ۲. وضعیت فعلی (1.8.0)
- کار می‌کند (در محیط شبیه‌سازی‌شده تست شده): ۳ حالت دسترسی، قوانین کسب شانس، ۵۱ شرط، ۱۴ نوع جایزه، ۳۶ تم، ۱۲ الگوی آماده، پاپ‌آپ ۶ حالته + inline، ۲۶ پنل پیامک، ویرایش زنده جداگانه دسکتاپ/تبلت/موبایل، نوار کد هوشمند، هدیه تصادفی، گزارش‌های پول واقعی ووکامرس، شانس‌های کاربران، **کمپین‌های زمان‌بندی‌شده پیامک گروهی + گزارش هر نفر**، **ورود به سایت با کد پیامکی**.
- `docs/FEATURES.md` باید **دقیقاً ۵۰۰** آیتم بماند (اضافه نکن؛ جایگزین/ادغام کن).
- روی سایت واقعی تست نشده: WP-Cron واقعی، پنل پیامک واقعی، ورود OTP همراه افزونه‌هایی مثل Digits و کش صفحه، المنتور واقعی، کیف پول/امتیاز واقعی.
- ابزارهای کاهش توکن روی ویندوز کاربر: rtk 1.1.0 ✓، code-review-graph 2.3.9 ✓ (`C:\tools\crg-venv`)، token-savior ✗ (timeout pypi؛ اسکریپت با retry آماده است).

## ۳. نقشه فایل‌ها
نقطه ورود: **`becharkhoon.php`** (ثابت‌ها `BCH_VERSION='1.8.0'`، `BCH_DB_VERSION=6`) → `src/Autoloader.php` → `src/Plugin.php::boot()` (ثبت همه سرویس‌ها و هوک‌ها).

### src/Core — زیرساخت
| فایل | کار | نمادهای کلیدی (خط) |
|---|---|---|
| Installer.php (340) | جداول، ارتقای DB | tables:17 install:33 maybe_upgrade:53 create_tables:91 (bch_bulk/bch_bulk_items انتهای فایل) drop_all:328 |
| Settings.php (291) | تنظیمات سراسری `bch_settings` (~۹۰ کلید) | defaults:20 secret_keys:117 get:129 update:167 sanitize:184 |
| Helpers.php (299) | ابزارها | phone:58 latin_digits:37 now:129 (UTC، قابل جابه‌جایی در تست) period_start:144 g2j:190 money:261 **lines:273 (روی کاما هم می‌شکند!)** token:288 |
| Cron.php (53) | کران روزانه `becharkhoon_daily` | run:32 |
| Lang.php | t(fa,en):52 is_fa:17 | |
| Crypto / Lock / RateLimit / Logger / Http / Capabilities | رمز libsodium، قفل، محدودیت نرخ، لاگ، HTTP، caps `bch_manage`/`bch_view` | |

### src/Wheels — داده گردونه
| فایل | کار | نمادها |
|---|---|---|
| Schema.php (1044) | **اسکیمای کامل config گردونه** + sanitize | prize_types:23 slice_defaults:36 default_slices:96 defaults:130 (بخش‌ها: design:136 popup:207 form:305 display:341 targeting:414 access:419 engine:441 coupon:452 messages:476 notify:510 schedule:538 advanced:545 layout:557 responsive:559) layout_elements:564 responsive_ok:608 sanitize:731 sanitize_slice:920 |
| Repository.php (223) | CRUD جدول bch_wheels + موجودی + کش | get:40 active:57 create:86 update:113 stock:199 take_stock:209 |
| Templates.php (196) | ۳۶ تم (از assets/data/themes.json) + ۱۲ الگوی آماده | catalog:53 create:148 money_factor:186 (ریال ×۱۰) |

### src/Engine — منطق چرخش
| فایل | کار | نمادها |
|---|---|---|
| SpinService.php (346) | **چرخش کامل** با قفل | spin:30 locked_spin:57 payload:235 public_state:302 reason_message:319 |
| Eligibility.php (295) | آیا الان می‌تواند بچرخاند؟ | check:23 (free: سهمیه رایگان بعد شانس هدیه؛ credits: سقف فقط با cap_credits؛ hybrid) may_have_phone_credits:173 add_bonus:280 |
| Context.php (319) | هویت شخص (user/phone/email/device/IP) | current:39 (billing_phone + کلیدهای Digits) clean_client:74 |
| Picker.php (184) | کاندیدها و قرعه | type_supported:25 candidates:54 draw:132 |
| Conditions.php (338) | ۵۱ شرط | catalog:27 check:154 |
| Limits.php / Leads.php | سهمیه‌ها / مخاطبان | |

### src/Credits — شانس‌ها
| Ledger.php (228) | دفتر شانس (bch_credits) | **t():21 (public)** grant:31 (uniq → جلوگیری از تکرار) owner_where:82 balance:111 consume:123 revoke_ref:148 query:178 |
|---|---|---|
| Rules.php (420) | قوانین کسب شانس (سفارش، ثبت‌نام، دیدگاه، تولد، دعوت) | on_order_status:130 give:187 referral_order:356 |

### src/Prizes — جوایز
Fulfiller.php (154) fulfill:27 value_text:137 · Coupons.php (306) create:60 cap_discount:152 apply_from_url:198 · Gifts.php (348) هدیه تصادفی pick:116 add_line:205 · CodePool.php · Integrations.php (کیف پول/امتیاز).

### src/Notify — پیامک و اعلان
| فایل | کار | نمادها |
|---|---|---|
| Sms.php (323) | ارسال مرکزی + لاگ bch_sms | mode:25 render:57 send_event:100 **send_many:132 (خروجی items: نتیجه هر شماره)** |
| SmsEvents.php (284) | پیامک‌های خودکار و متغیرها | variables:21 general_vars:244 parse_params:255 |
| SmsGateways.php + sms-drivers.php (1369) | ۲۶ درایور پنل ایرانی | driver:63 send:154 pattern:175 |
| Notifier.php (422) | ایمیل/بله/تلگرام/وب‌هوک/OTP | after_spin:76 credit_granted:225 otp:388 |
| **Bulk.php (635)** | پیامک گروهی + هدیه شانس + کمپین | clean:30 audience:76 vars:153 message:174 preview:202 more_filters:215 HOOK:272 start:310 run:364 batch:386 counts:461 campaigns:504 items:527 item_where:538 action:577 step:625 (سازگاری) |

### src/Front — سمت سایت
| فایل | کار | نمادها |
|---|---|---|
| Ajax.php (464) | endpointهای فرانت (admin-ajax یا REST) ACTIONS:24 = boot,spin,otp_send,otp_verify,track,claim,state,bar | ctx:129 boot:147 spin:194 otp_verify:378 (+ Login::after_otp) |
| Frontend.php (452) | کانفیگ امن، visible_wheels، assets | js_config:78 visible_wheels:263 boot_wheel:390 **wheel_url:436** |
| Guard.php (205) | توکن HMAC، OTP، لینک شخصی، کپچا | otp_send:47 otp_verify:81 (توکن ۷ روز) link_token:111 personal_link:121 verified_phone:130 |
| **Login.php (135)** | ورود به سایت بعد از OTP | variants:24 user_by_phone:33 is_staff:57 after_otp:64 |
| Shortcodes.php (198) | `[becharkhoon]` `[becharkhoon_button]` `[becharkhoon_spins]` `[becharkhoon_my_prizes]` `[becharkhoon_winners]` `[becharkhoon_referral]` + بلاک | wheel:52 |
| CouponBar.php / Account.php | نوار کد هوشمند / تب «جوایز من» | |

### src/Admin, Stats, سایر
- Admin/Admin.php (304): منو، routes:24 (slugهای صفحات SPA)، assets:82، **export:196** (CSV: spins/leads/credits/bulk/contacts).
- Admin/Rest.php (1112): همه endpointهای پنل، NS `becharkhoon/v1`، routes:69 (فهرست در بخش ۴).
- Stats/Orders.php (همگام‌سازی سفارش‌ها → bch_orders)، Reports.php (build:238)، People.php (union:21 contacts:199)، Stats.php.
- Privacy/, Integrations/Elementor*.php (ویجت المنتور)، Cli/Command.php (WP-CLI)، uninstall.php.

### assets
| فایل | کار | نمادها |
|---|---|---|
| front/wheel.js (1678) | رندر SVG، پاپ‌آپ، فرم، OTP، تریگرها | store:52 **otpStore:59** api:172 Wheel:316 LAYOUT_MAP:624 Instance:658 build:708 fit:781 otpBlock:923 verifyOtp:959 formView:978 onSpinClick:1099 resultView:1171 open:1242 boot (~1520: bch_v، otpStore) |
| front/wheel.css (457) | استایل؛ **همه قوانین `:not(#bchz)`** | بخش‌ها: Dialog:18 Modes:82 Form:127 Result:193 SVG:232 Launcher:264 Bar:350 Gift:423 Fit:437 **Inline scroll fix:455** |
| admin/ui.js (533) | کیت BC: h, api, modal, table, pager(null اگر ۱ صفحه!), kpi, badge, tabs, toast | |
| admin/fields.js (600) | فرم‌ساز `F.render` | F.cur:141 F.valueUnit:145 F.field:162 (number+unit) F.render:318 F.conditions:447 |
| admin/editor.js (2073) | ویرایشگر گردونه + پیش‌نمایش زنده | تب‌ها: slicesTab:1103 designTab:1225 popupTab:1318 formTab:1469 displayTab:1510 targetingTab:1633 accessTab:1701 couponTab:1751 messagesTab:1794 notifyTab:1841 scheduleTab:1886 advancedTab:1912 E.render:1970 |
| admin/pages.js (2493) | همه صفحات | P.dashboard:68 P.wheels:141 P.rules:223 P.spins:337 P.leads:395 rangeBar:530 **bulkCenter:597** **P.campaigns:810 campaignDetail:851** exportContacts:972 P.credits:1036 P.reports:1218 P.sms:1403 bulkPanel:2131 otpPanel:2148 P.settings:2285 P.tools:2385 P.guide:2448 |
| admin/app.js (270) | شل SPA، ناوبری، router | ICONS/LABELS/GROUPS:18-50 route:203 |
| admin/app.css, charts.js, blocks/block.js, data/themes.json, img/ | | |

### tests (خارج از بسته فروش)
- `tests/test-engine.php` (795) — ۲۵۳ تست روی SQLite؛ بخش‌ها با `echo "عنوان\n"`؛ **`done()` باید آخرین خط باشد** (exit می‌کند).
- `tests/wp-stubs.php` (stub وردپرس؛ `$GLOBALS['__http_responder']` برای شبیه‌سازی پنل)، `bootstrap.php`، `devserver.php` (سرور مرورگر؛ `?sc=ID` شورت‌کد واقعی)، `harden-css.py`، `fakewp/`.

### ابزار و مستندات handoff (داخل ریپو، خارج از بسته فروش)
- `CLAUDE.md` (دستور شروع چت جدید)، `PROJECT_MAP.md` (همین فایل)، `docs/HANDOFF/` (LESSONS, HISTORY, DIAGRAMS, GITHUB)، `tools/` (setup-token-saver.bat/.ps1، push-to-github.bat)، `.gitignore`.

### آرشیو و فایل‌های خارج از ریپو (روی دسکتاپ کاربر `C:\Users\PARDAZESH SHOP\Desktop\ariagh claud\`)
- `ARIAGH-BECHARKHOON-1.3.0 … 1.8.0.zip` (نسخه‌های تحویلی)، `ariagh-becharkhoon-source.zip` (سورس 1.7.0)، `setup-token-saver.bat/.ps1` (کپی در `tools/`)، `.mcp.json` و `CLAUDE.md` ساخته‌شده توسط code-review-graph.

## ۴. معماری و جریان داده (نمودارها در `docs/HANDOFF/DIAGRAMS.md`)
```
مرورگر (wheel.js) ──bch_boot──▶ Ajax::boot → Frontend::visible_wheels → توکن HMAC
   └─(OTP)─ otp_send/otp_verify → Guard (توکن تایید ۷ روز) → Login::after_otp (ورود به سایت)
   └─bch_spin─▶ Ajax::spin → SpinService::spin → Lock → Eligibility::check → Ledger::consume
                 → Picker::candidates/draw → Repository::take_stock → insert bch_spins
                 → Fulfiller::fulfill (Coupons/Gifts/CodePool/…) → Notifier (بعد از پاسخ)
پنل (pages.js/editor.js) ──REST becharkhoon/v1 (nonce wp_rest + cap)──▶ Admin/Rest.php
ووکامرس: woocommerce_order_status_changed → Rules (شانس) + Stats/Orders (گزارش پول)
کمپین: Bulk::start → bch_bulk + bch_bulk_items → WP-Cron becharkhoon_bulk_tick (هر دقیقه) / bulk/tick از صفحه باز
       → Bulk::run → batch (Ledger::grant uniq bulk:c<id>:<phone> + Sms::send_many) → وضعیت هر نفر
```
- جداول (prefix `wp_`): bch_wheels, bch_spins, bch_leads, bch_credits, bch_stats, bch_codes, bch_stock, bch_log, bch_sms, bch_orders, **bch_bulk, bch_bulk_items**.
- Options: `bch_settings`, `bch_rules`, `bch_db_version`, `bch_secret`, `bch_orders_sync`.
- Cron hooks: `becharkhoon_daily`, `becharkhoon_orders_sync`, `becharkhoon_bulk_tick` (schedule `bch_minute`).
- REST پنل: /bootstrap /dashboard /wheels[/id, /duplicate, /status, /reset-stock, /simulate, /export, /codes, /import] /spins /leads /leads/sms /bulk/{preview,start,step,campaigns,tick} /bulk/{id}[/items,/action] /credits[/bulk,/id/revoke] /people[/events] /contacts/count /reports[/orders,/sync] /rules[/backfill] /settings /test/{what} /sms/log /sms/preview /logs /search/{what} /tools/* /users/{id}/block.
- صفحات SPA (`#/slug`): dashboard, wheels, edit, rules, spins, leads, credits, **campaigns**, reports, sms (تب‌ها: connect, templates, bulk, vars, otp, email, messenger, webhooks, log, system), settings, tools, guide.
- پارامتر باز کردن: پیش‌فرض `bch_open` (در devserver: `bch-open`)؛ لینک شخصی `bch_v=l<exp10><09…11><hmac24>`.

## ۵. تصمیم‌های کلیدی
- قرعه و اعتبار فقط سمت سرور؛ صفحه کش‌شده فقط کانفیگ ثابت دارد، boot بدون کش → سازگار با کش.
- شانس هدیه گروهی روی **شماره** (user_id=0) ثبت می‌شود تا حساب با همان billing_phone، مهمان OTP شده و لینک شخصی همه آن را ببینند. (رد شد: ثبت روی user_id چون مهمان تاییدشده آن را نمی‌دید.)
- گردونه free: اول سهمیه رایگان، بعد شانس‌های داده‌شده؛ credits: سقف دفعات فقط با سوییچ `access.cap_credits`.
- پیامک گروهی = کمپین ذخیره‌شده با وضعیت هر نفر (رد شد: حلقه JS با transient که با اولین خطا/timeout متوقف می‌شد).
- هر درخواست فقط یک دسته (≤۵۰۰) → بدون timeout؛ زمان‌بندی با WP-Cron + tick صفحه باز ادمین.
- ورود OTP: حساب موجود با شماره یا ساخت customer؛ **حساب مدیر/کارمند هرگز**.
- CSS ضد قالب با وزن ID (`:not(#bchz)`) به‌جای !important همه‌جا.
- واحد پول از ووکامرس (`BC.boot.currency`)؛ مبالغ الگوها به تومان + money_factor.
- Admin API در حالت پیش‌فرض admin-ajax (کوکی کاربر کار می‌کند)؛ REST فرانت بدون nonce.

## ۶. راه‌های امتحان‌شده و شکست‌خورده (تکرار نکن) — جزئیات: `docs/HANDOFF/LESSONS.md`
- نصب rtk/code-review-graph/token-savior **داخل sandbox ابری**: پروکسی pypi/github/npm/crates را می‌بندد.
- تایپ در PowerShell با computer-use: ترمینال‌ها فقط click هستند → اسکریپت `.bat/.ps1` بساز و کاربر اجرا کند.
- `Get-Command python` در ویندوز: میان‌بر Microsoft Store را برمی‌گرداند (WindowsApps) → باید رد شود.
- `Set-Content -Encoding UTF8` در PS5 → BOM؛ JSON تنظیمات Claude خراب می‌شود → `[IO.File]::WriteAllText` با UTF8 بدون BOM. اسکریپت ps1 فقط ASCII.
- Playwright `Input.synthesizeScrollGesture` اسکرول نمی‌کند → `Input.dispatchTouchEvent` (start/move/end).
- `do_shortcode` در stub متن خام برمی‌گرداند → در devserver مستقیم `Shortcodes::wheel()`.
- `Helpers::lines()` برای «شماره، نام» → روی کاما هم می‌شکند؛ split اختصاصی بنویس.

## ۷. قوانین و ترجیحات کاربر
- پاسخ نهایی **فارسی، کوتاه، صادق درباره آنچه تست نشده**.
- هر نسخه: bump `BCH_VERSION` (+ `BCH_DB_VERSION` اگر جدول عوض شد) در becharkhoon.php، changelog در readme.txt (+ Stable tag)، نسخه در README.md خط ۳، FEATURES دقیقاً ۵۰۰، ARCHITECTURE.
- بسته‌بندی: کپی ریپو **بدون** `tests/`، `tools/`، `docs/HANDOFF/`، `PROJECT_MAP.md`، `CLAUDE.md`، `.git*` به `build/ariagh-becharkhoon`، `index.php` («Silence is golden») در هر پوشه، zip با پوشه ریشه `ariagh-becharkhoon` → `ARIAGH-BECHARKHOON-x.y.z.zip`.
- تحویل: فایل در پوشه دسکتاپ کاربر `ariagh claud` + به‌روزرسانی سند پروژه `claude/ariagh-becharkhoon-status.md` در Claude Project «ariaghasemi».
- بعد از ویرایش wheel.css: `python3 tests/harden-css.py assets/front/wheel.css assets/front/wheel.css`.
- همه متن‌های UI دوزبانه `t('فارسی','English')` / `Lang::t()`. ارقام فارسی در UI فارسی (`BC.num`).
- واحد پول پیش‌فرض تومان. کاربر روی ویندوز کار می‌کند؛ گاهی فارسی را با کیبورد انگلیسی تایپ می‌کند.
- هیچ سیستم لایسنس اضافه نشود.

## ۸. باگ‌های حل‌شده که ممکن است برگردند
| باگ | علت | محل رفع |
|---|---|---|
| مدیر شانس داد، کاربر «شانسی نداری» دید | free شانس ledger را نمی‌دید؛ credits سقف ۱/روز روی شانس | Eligibility::check |
| فیلدهای عددی با واحد → null ذخیره (1.7.0) | listener بعد از wrap شدن `ctrl.value` را از div می‌خواند | fields.js F.field (متغیر `numIn`) |
| اسکرول صفحه روی گردونه inline (موبایل) قفل | dialog overflow:auto + overscroll contain + ۴۲px سرریز | wheel.css خط 455+ |
| پیامک گروهی بعد از ~۱۰۰ نفر قطع شد | حلقه JS با اولین خطا/timeout می‌ایستاد | Bulk کمپین ذخیره‌شده |
| شانس دوم دوباره پیامک می‌خواست | توکن OTP در sessionStorage و ۳ ساعت | otpStore (localStorage ۷ روز) + Login |
| اسکرول افقی صفحه | honeypot با left:-9999px | wheel.css .bchw-hp → clip-path |
| `BC.pager` null → appendChild خطا | pager برای ۱ صفحه null می‌دهد | همیشه `if (pg)` |
| مبالغ الگو در فروشگاه ریالی ۱۰ برابر کم | مبالغ تومانی | Templates::money_factor |

## ۹. مشکلات باز و قدم‌های بعدی (به ترتیب)
1. کاربر `setup-token-saver.bat` را دوباره اجرا کند (token-savior با retry) → Claude دسکتاپ restart → بررسی `get_device_info().localMcpServers`.
2. تست روی سایت واقعی 1.8.0: ارسال گروهی ۲۰ نفره با پنل واقعی و فاصله ۱–۲ دقیقه؛ گزارش و ارسال دوباره؛ ورود OTP روی موبایل؛ اسکرول در المنتور.
3. پیشنهاد کران‌جاب هاست برای `wp-cron.php` در سایت‌های کم‌بازدید (در UI صفحه کمپین توضیح داده شده).
4. سازگاری ورود OTP با افزونه‌های Digits/ورود پیامکی (کلیدهای meta در Login::META_KEYS).
5. ایده‌های باز: کپی کمپین، زمان شروع آینده برای کمپین، گزارش تحویل (delivery report) پنل‌ها.

## ۱۰. راهنمای کار با این نقشه (برای چت بعدی)
- اول این نقشه و `docs/HANDOFF/LESSONS.md` را بخوان؛ فایل‌های کد را فقط هنگام نیاز و فقط خطوط لازم (از شماره خط‌های بالا یا grep نماد).
- کاری که زیر «شکست‌خورده» آمده تکرار نشود.
- بعد از هر تغییر مهم (نسخه، فایل، تصمیم، باگ): بخش مربوط در همین فایل را با Edit کوچک همان نوبت به‌روز کن.
- قبل از تحویل: `php tests/test-engine.php` (همه پاس)، `php -l` همه فایل‌ها، `node -e "new Function(...)"` برای JSها، smoke با Playwright روی devserver.
- devserver: `cd <repo> && BCH_ORIGIN=http://127.0.0.1:8899 BCH_STATE=/tmp/bchdev setsid nohup php -S 127.0.0.1:8899 tests/devserver.php > /tmp/devserver.log 2>&1 < /dev/null &` → پنل: `/wp-admin/admin.php?page=becharkhoon#/dashboard`، سایت: `/shop/?sc=2`.
- وقتی چت طولانی شد، دوباره project-handoff اجرا کن و این نقشه را به‌روز کن.

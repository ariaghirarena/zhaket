# CLAUDE.md — دستور شروع برای Claude

پروژه: افزونه وردپرس/ووکامرس ARIAGH.BECHARKHOON («افزونه بچرخون») — نسخه 1.8.0.

1. اول `PROJECT_MAP.md` را کامل بخوان (نقشه فایل‌ها با شماره خط، معماری، تصمیم‌ها، قوانین کاربر).
2. بعد `docs/HANDOFF/LESSONS.md` (باگ‌ها و اشتباهاتی که نباید تکرار شوند).
3. کد را فقط هنگام نیاز و فقط خطوط لازم بخوان (grep نماد → Read با offset/limit).
4. قبل از تحویل: `php tests/test-engine.php` باید همه پاس شود؛ تست جدید را قبل از `done();` آخر فایل اضافه کن.
5. بعد از ویرایش `assets/front/wheel.css`: `python3 tests/harden-css.py assets/front/wheel.css assets/front/wheel.css`.
6. پاسخ به کاربر: فارسی، کوتاه، صادق درباره آنچه تست نشده.
7. بعد از هر تغییر مهم، بخش مربوط در `PROJECT_MAP.md` را به‌روز کن.

نمودارها: `docs/HANDOFF/DIAGRAMS.md` · تاریخچه: `docs/HANDOFF/HISTORY.md` · معماری: `docs/ARCHITECTURE.md`.

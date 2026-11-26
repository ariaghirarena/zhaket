# GITHUB — قرار دادن پروژه روی گیت‌هاب (بکاپ)

> مخزن را **Private** بسازید (افزونه تجاری است؛ کد کامل و تست‌ها داخلش هست).
> هیچ کلید API، رمز پنل پیامک یا فایل `.env` در مخزن نیست و `.gitignore` جلوی zipها، کش ابزارها و فایل‌های محرمانه را می‌گیرد.

## راه ۱ — یک کلیک (پیشنهادی)
1. یک‌بار نصب: `winget install Git.Git` و `winget install GitHub.cli` (در PowerShell).
2. در پوشه پروژه روی `tools\push-to-github.bat` دوبار کلیک کنید.
3. بار اول از شما ورود به گیت‌هاب را می‌خواهد (مرورگر باز می‌شود)، بعد مخزن خصوصی `ariagh-becharkhoon` را می‌سازد و همه فایل‌ها را push می‌کند.
4. دفعات بعد همان فایل را اجرا کنید؛ فقط تغییرات جدید commit و push می‌شود.

## راه ۲ — GitHub Desktop
File → Add local repository → پوشه `ariagh-becharkhoon` → «create a repository» → Publish repository (تیک Keep this code private).

## بعد از هر نسخه جدید
```
git add -A
git commit -m "ARIAGH.BECHARKHOON x.y.z: <خلاصه>"
git tag vx.y.z
git push --follow-tags
```

## شروع چت جدید Claude از روی بکاپ
پوشه پروژه را به چت وصل کنید و این را بفرستید:
```
ادامه پروژه ARIAGH.BECHARKHOON. اول فایل PROJECT_MAP.md و docs/HANDOFF/LESSONS.md را بخوان و طبق بخش «راهنمای کار با این نقشه» کار کن.
کار بعدی: <کار بعدی>
```

# DIAGRAMS — نمودارهای ساختار و جریان (Mermaid؛ گیت‌هاب خودکار رسم می‌کند)

## ۱. نقشه ماژول‌ها — «برای هر بخش کجا بروم»

```mermaid
flowchart LR
  EP["becharkhoon.php<br/>BCH_VERSION / DB_VERSION"] --> PL["src/Plugin.php<br/>boot(): همه هوک‌ها"]

  subgraph CORE["src/Core — زیرساخت"]
    INS["Installer<br/>جداول + ارتقا"]
    SET["Settings<br/>bch_settings"]
    HLP["Helpers<br/>phone, now, money"]
    CRON["Cron<br/>becharkhoon_daily"]
  end

  subgraph WHEEL["src/Wheels — داده گردونه"]
    SCH["Schema<br/>config + sanitize"]
    REP["Repository<br/>bch_wheels + stock"]
    TPL["Templates<br/>۳۶ تم / ۱۲ الگو"]
  end

  subgraph ENG["src/Engine — منطق چرخش"]
    SPIN["SpinService"]
    ELI["Eligibility"]
    CTX["Context"]
    PICK["Picker"]
    COND["Conditions ۵۱"]
  end

  subgraph CRED["src/Credits"]
    LED["Ledger<br/>bch_credits"]
    RUL["Rules<br/>کسب شانس"]
  end

  subgraph PRZ["src/Prizes"]
    FUL["Fulfiller"] --> CPN["Coupons"]
    FUL --> GFT["Gifts"]
    FUL --> POOL["CodePool"]
  end

  subgraph NOT["src/Notify"]
    SMS["Sms<br/>send_many + bch_sms"]
    GW["SmsGateways + sms-drivers<br/>۲۶ پنل"]
    EVT["SmsEvents"]
    NTF["Notifier"]
    BULK["Bulk<br/>کمپین‌ها"]
  end

  subgraph FRONT["src/Front"]
    AJX["Ajax<br/>boot/spin/otp"]
    FE["Frontend"]
    GRD["Guard<br/>توکن/OTP/لینک"]
    LOG["Login<br/>ورود با OTP"]
    SC["Shortcodes"]
    BAR["CouponBar"]
  end

  subgraph ADM["src/Admin + assets/admin"]
    REST["Rest.php<br/>becharkhoon/v1"]
    ADMN["Admin.php<br/>منو + CSV"]
    PG["pages.js"]
    ED["editor.js"]
    FL["fields.js"]
    UI["ui.js"]
  end

  subgraph ST["src/Stats"]
    ORD["Orders<br/>bch_orders"]
    PPL["People"]
    RPT["Reports"]
  end

  JS["assets/front/wheel.js + wheel.css"] --> AJX
  PL --> CORE & FRONT & ADM & RUL & ORD & BULK
  AJX --> SPIN & GRD & LOG & FE
  SPIN --> ELI & PICK & LED & FUL & NTF & REP
  ELI --> CTX & COND & LED
  NTF --> SMS
  BULK --> SMS & LED
  SMS --> GW & EVT
  PG & ED --> REST
  ED & PG --> FL --> UI
  REST --> REP & LED & BULK & RPT & PPL & SET & SMS
  REP --> SCH
  TPL --> REP
```

## ۲. جریان یک چرخش

```mermaid
sequenceDiagram
  participant B as مرورگر (wheel.js)
  participant A as Front/Ajax
  participant G as Guard
  participant L as Login
  participant S as SpinService
  participant E as Eligibility
  participant D as Ledger / Picker / Repository
  participant F as Fulfiller
  participant N as Notifier/Sms
  B->>A: boot (بدون کش)
  A-->>B: گردونه‌های مجاز + توکن HMAC
  opt تایید موبایل
    B->>A: otp_send / otp_verify
    A->>G: otp_verify → توکن ۷ روزه
    A->>L: after_otp → ورود به سایت (غیر مدیر)
    A-->>B: otp_token + state (+logged_in)
  end
  B->>A: spin (توکن، فیلدها، otp_token)
  A->>S: spin(wheel, ctx)
  S->>E: check (سهمیه رایگان ← شانس هدیه)
  S->>D: consume شانس، قرعه random_int، take_stock
  S->>F: fulfill (کوپن/هدیه/کد/…)
  S-->>B: نتیجه (slice_id, code, …)
  S->>N: پیامک/ایمیل بعد از پاسخ
```

## ۳. کمپین پیامک گروهی (1.8.0)

```mermaid
flowchart TD
  UI["pages.js bulkCenter()<br/>فیلترها + متن/الگو + هدیه + زمان‌بندی"] -->|bulk/preview| PV["Bulk::preview<br/>audience + more_filters"]
  UI -->|bulk/start| ST["Bulk::start<br/>bch_bulk + bch_bulk_items (pending)"]
  ST --> CR["WP-Cron becharkhoon_bulk_tick<br/>هر دقیقه"]
  PAGE["صفحه #/campaigns باز<br/>bulk/tick هر ۱۰ ثانیه"] --> RUN
  CR --> RUN["Bulk::run<br/>قفل bch_bulk_lock، کمپین‌های سررسید"]
  RUN --> BT["Bulk::batch<br/>batch_size نفر بعدی"]
  BT --> GR["Ledger::grant<br/>uniq bulk:c{id}:{phone}"]
  BT --> SM["Sms::send_many<br/>items: نتیجه هر شماره"]
  GR & SM --> UP["به‌روزرسانی هر نفر:<br/>sent / failed / grant_status / response"]
  UP --> NX{"pending باقی است؟"}
  NX -->|بله| NR["next_run = now + interval_min"]
  NX -->|خیر| DN["status = done"]
  REP["گزارش هر نفر + retry<br/>Bulk::items / Bulk::action"] -->|retry| RUN
```

## ۴. جداول دیتابیس

```mermaid
erDiagram
  bch_wheels ||--o{ bch_spins : "wheel_id"
  bch_wheels ||--o{ bch_stock : "wheel_id"
  bch_wheels ||--o{ bch_codes : "wheel_id"
  bch_wheels ||--o{ bch_credits : "wheel_id (0=همه)"
  bch_spins ||--o{ bch_orders : "spin_id / کد"
  bch_bulk ||--o{ bch_bulk_items : "bulk_id"
  bch_bulk_items }o--o| bch_credits : "credit_id"
  bch_leads }o--o{ bch_spins : "phone/email"
  bch_sms }o--o| bch_wheels : "wheel_id"
```

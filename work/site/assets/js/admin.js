/* ARIAGH.AIWRITER — interactive admin demo (no backend, no external requests) */
(function () {
  'use strict';

  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(n) { return String(n).replace(/\d/g, function (c) { return FA[+c]; }); }

  var I = {
    dash: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z',
    pen: 'M4 20h4l10-10-4-4L4 16z',
    list: 'M4 7h16M4 12h10M4 17h7',
    check: 'M9 11l3 3 8-8M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8',
    clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    hub: 'M12 3v6m0 6v6M3 12h6m6 0h6M12 12a2 2 0 100 4 2 2 0 000-4z',
    cpu: 'M9 9h6v6H9zM4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2',
    key: 'M14 7a4 4 0 11-3.5 1.9L4 15v3h3v-2h2v-2h2l2.5-2.5',
    globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21',
    chat: 'M4 5h16v11H9l-5 4z',
    layout: 'M4 5h16v14H4zM4 10h16M10 10v9',
    chart: 'M4 19V9m5 10V5m5 14v-7m5 7V8',
    link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 10-5.7-5.7L11 7M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 105.7 5.7L13 17',
    image: 'M4 5h16v14H4zM4 16l5-4 4 3 3-2 4 3M9 9a1 1 0 100 2 1 1 0 000-2z',
    send: 'M4 12l16-8-6 16-3-6z',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 3H4zM9 21h6',
    cloud: 'M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.4A3.5 3.5 0 0117 18z',
    git: 'M12 3v6m0 6v6M6 12h12M9 6a3 3 0 100 6 3 3 0 000-6zm6 6a3 3 0 100 6 3 3 0 000-6z',
    tool: 'M14 7a4 4 0 11-3.5 1.9L4 15v3h3v-2h2v-2h2l2.5-2.5',
    report: 'M6 3h9l4 4v14H6zM9 12h6M9 16h4',
    lock: 'M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z',
    gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM4 12h2m12 0h2M12 4v2m0 12v2',
    db: 'M12 3c4 0 7 1.3 7 3s-3 3-7 3-7-1.3-7-3 3-3 7-3zM5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6',
    help: 'M12 17h.01M9.5 9a2.5 2.5 0 114 2c-.9.7-1.5 1.2-1.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  var TABS = [
    { id: 'dashboard', label: 'داشبورد', icon: I.dash },
    { id: 'generate', label: 'تولید محتوا', icon: I.pen },
    { id: 'topics', label: 'موضوعات', icon: I.list, cnt: '۴۴۶' },
    { id: 'review', label: 'صف بازبینی', icon: I.check, cnt: '۱۴' },
    { id: 'schedule', label: 'زمان‌بندی', icon: I.clock },
    { id: 'providers', label: 'پرووایدرها', icon: I.hub, cnt: '۲۳' },
    {
      id: 'models', label: 'مدل‌ها', icon: I.cpu,
      desc: 'برای هر پرووایدر، مدل پیش‌فرض و مدل جایگزین را انتخاب کنید؛ افزونه اگر مدل در دسترس نبود خودش به جایگزین سوییچ می‌کند.',
      list: ['انتخاب مدل پیش‌فرض برای هر وظیفه', 'مدل ارزان برای پیش‌نویس، مدل قوی برای بازنویسی',
        'کنترل حداکثر توکن و دما', 'تست پاسخ مدل بدون خروج از پیشخوان',
        'نمایش مصرف توکن هر مدل', 'جایگزینی خودکار در قطعی سرویس']
    },
    {
      id: 'keys', label: 'کلیدهای API', icon: I.key,
      desc: 'کلیدها رمزنگاری‌شده در دیتابیس خودتان ذخیره می‌شوند و هیچ‌جا ارسال نمی‌شوند.',
      list: ['ذخیرهٔ رمزنگاری‌شدهٔ کلید', 'چند کلید برای یک پرووایدر', 'تست اتصال تک‌کلیکی',
        'مشخص‌کردن سهمیهٔ ماهانه', 'کلید جدا برای ورکر کلادفلر', 'حذف و بازتولید کلید']
    },
    {
      id: 'tone', label: 'لحن و زبان', icon: I.globe,
      desc: 'ده زبان خروجی و ده لحن آماده، به‌همراه امکان ساخت لحن اختصاصی برای برند شما.',
      list: ['۱۰ زبان خروجی', '۱۰ لحن آماده', 'لحن اختصاصی با نمونهٔ متن',
        'قواعد نگارش فارسی', 'کنترل اعداد فارسی/لاتین', 'سطح رسمی‌بودن متن']
    },
    {
      id: 'prompts', label: 'پرامپت‌ها', icon: I.chat, cnt: '۱۵',
      desc: 'پرامپت هر بخش قابل ویرایش است؛ متغیرها با داده‌های واقعی مقاله جایگزین می‌شوند.',
      list: ['۱۵ متغیر آماده در پرامپت', 'ویرایش پرامپت هر بخش', 'بازگردانی به پیش‌فرض',
        'پیش‌نمایش خروجی قبل از ذخیره', 'پرامپت جدا برای بازنویسی', 'پرامپت تصویر شاخص']
    },
    {
      id: 'structure', label: 'ساختار مقاله', icon: I.layout, cnt: '۲۹',
      desc: 'قالب مقاله را یک بار بسازید؛ همهٔ مقالات بعدی با همین ساختار نوشته می‌شوند.',
      list: ['قالب هدینگ H1 تا H4', 'فهرست مطالب خودکار', 'جدول و لیست بولت',
        'بخش سؤالات متداول', 'بخش جمع‌بندی', 'حداقل/حداکثر طول هر بخش', '۲۹ قابلیت ساختار']
    },
    {
      id: 'seo', label: 'سئو', icon: I.chart, cnt: '۴۲',
      desc: 'امتیاز سئو برای هر مقاله، با فهرست اصلاح‌های مشخص — نه عدد مبهم.',
      list: ['تحلیل کلمهٔ کلیدی اصلی و فرعی', 'کنترل چگالی و تکرار', 'متا تایتل و توضیحات',
        'اسکیمای Article و FAQ', 'بررسی طول عنوان و توضیحات', '۴۲ قابلیت سئو', 'پیشنهاد اصلاح تک‌کلیکی']
    },
    {
      id: 'links', label: 'لینک داخلی', icon: I.link, cnt: '۱۲',
      desc: 'مقالات مرتبط خودتان را پیدا می‌کند و لینک را در جای طبیعی متن می‌گذارد.',
      list: ['یافتن خودکار مقالات مرتبط', 'حداکثر تعداد لینک در مقاله', 'کنترل کلمهٔ لنگر',
        'بدون لینک به برگه‌های بی‌ربط', 'گزارش لینک‌های ساخته‌شده', '۱۲ قابلیت لینک']
    },
    {
      id: 'image', label: 'تصویر شاخص', icon: I.image, cnt: '۱۶',
      desc: 'برای هر مقاله یک تصویر شاخص ساخته می‌شود؛ بهینه، با متن جایگزین فارسی و در اندازهٔ درست.',
      list: ['تولید تصویر اختصاصی هر مقاله', 'متن جایگزین فارسی خودکار', 'برش و تغییر اندازه',
        'ذخیره در کتابخانهٔ رسانه', 'انتخاب تصویر پیش‌فرض', '۱۶ قابلیت تصویر']
    },
    {
      id: 'publish', label: 'انتشار', icon: I.send, cnt: '۱۹',
      desc: 'انتشار مستقیم، پیش‌نویس یا زمان‌بندی — با انتخاب دسته، برچسب و نویسنده.',
      list: ['انتشار مستقیم یا پیش‌نویس', 'انتخاب دسته و برچسب', 'تعیین نویسنده',
        'وضعیت دیدگاه', 'متای سئوی وردپرس', '۱۹ قابلیت انتشار']
    },
    {
      id: 'notify', label: 'اعلان‌ها', icon: I.bell, cnt: '۱۲',
      desc: 'از پایان تولید، خطای پرووایدر و انتشار موفق باخبر شوید.',
      list: ['ایمیل پایان تولید', 'اعلان خطای پرووایدر', 'اعلان تلگرام اختیاری',
        'خلاصهٔ روزانه', '۱۲ قابلیت اعلان']
    },
    {
      id: 'cloudflare', label: 'کلادفلر', icon: I.cloud,
      desc: 'اگر هاست محدودیت زمان اجرا دارد، ورکر کلادفلر کار تولید را انجام می‌دهد — پلن رایگان کافی است.',
      list: ['راه‌اندازی ورکر با چند کلیک', 'تست اتصال ورکر', 'کلید جدا برای ورکر',
        'نمایش وضعیت و آخرین اجرا', 'اجرا روی دامنهٔ اختصاصی']
    },
    {
      id: 'actions', label: 'GitHub Actions', icon: I.git,
      desc: 'تولید را به گیت‌هاب بسپارید؛ مناسب هاست‌هایی که اجازهٔ اجرای طولانی نمی‌دهند.',
      list: ['اتصال ریپازیتوری خصوصی', 'زمان‌بندی با cron گیت‌هاب', 'دریافت نتیجه در وردپرس',
        'لاگ آخرین اجرا', 'توکن دسترسی محدود']
    },
    {
      id: 'tools', label: 'ابزارها', icon: I.tool, cnt: '۹',
      desc: 'ابزارهای کوچک روزمره برای کار با محتوا.',
      list: ['بازنویسی متن موجود', 'خلاصه‌سازی', 'ساخت عنوان جایگزین', 'تولید متا',
        'بررسی تکراری‌بودن', '۹ ابزار']
    },
    {
      id: 'reports', label: 'گزارش‌ها', icon: I.report, cnt: '۲۳',
      desc: 'چه چیزی، با چه هزینه‌ای و با چه کیفیتی تولید شده است.',
      list: ['مصرف توکن و هزینهٔ هر مقاله', 'میانگین امتیاز سئو', 'گزارش پرووایدرها',
        'گزارش خطاها', 'خروجی CSV']
    },
    {
      id: 'license', label: 'لایسنس', icon: I.lock,
      desc: 'وضعیت فعال‌سازی، دامنه و به‌روزرسانی خودکار محصول.',
      list: ['نمایش دامنهٔ فعال‌شده', 'بررسی وضعیت لایسنس', 'به‌روزرسانی خودکار',
        'انتقال لایسنس بین دامنه']
    },
    {
      id: 'settings', label: 'تنظیمات', icon: I.gear,
      desc: 'تنظیمات عمومی افزونه: پیش‌فرض‌ها، دسترسی نقش‌ها و پاک‌سازی داده.',
      list: ['دسترسی نقش‌های کاربری', 'پیش‌فرض دسته و نویسنده', 'پاک‌سازی داده هنگام حذف',
        'حالت نمایش پیشخوان', 'پشتیبان‌گیری از تنظیمات']
    },
    {
      id: 'backup', label: 'پشتیبان‌گیری', icon: I.db,
      desc: 'از موضوعات، پرامپت‌ها و تنظیمات خروجی بگیرید و هر وقت خواستید برگردانید.',
      list: ['خروجی JSON از تنظیمات', 'بازگردانی فایل پشتیبان', 'پشتیبان‌گیری خودکار هفتگی']
    },
    {
      id: 'help', label: 'راهنما', icon: I.help,
      desc: 'راهنمای فارسی داخل افزونه و لینک مستقیم به مستندات نصب.',
      list: ['راهنمای گام‌به‌گام داخل افزونه', 'ویدئوی کوتاه هر بخش', 'درخواست پشتیبانی فارسی']
    }
  ];

  var PROVIDERS = [
    ['OpenAI', 'GPT · o-series', 1], ['Anthropic Claude', 'Claude 3.x / 4', 1], ['Google Gemini', 'Gemini Pro / Flash', 1],
    ['OpenRouter', 'aggregator', 0], ['Groq', 'fast inference', 1], ['Mistral AI', 'Mistral / Codestral', 0],
    ['DeepSeek', 'chat / reasoner', 1], ['xAI Grok', 'Grok', 0], ['Together AI', 'open models', 0],
    ['Fireworks AI', 'open models', 0], ['Perplexity', 'search + answer', 0], ['Cohere', 'command', 0],
    ['Cerebras', 'ultra fast', 0], ['DeepInfra', 'open models', 0], ['Moonshot Kimi', 'Kimi', 0],
    ['Alibaba Qwen', 'Qwen', 0], ['Zhipu GLM', 'GLM', 0], ['AvalAI', 'Iran-friendly', 1],
    ['GapGPT', 'Iran-friendly', 0], ['Cloudflare Workers AI', 'edge models', 1], ['Claude Pro', 'subscription', 0]
  ];

  var TOPICS = [
    ['راهنمای سئو برای مبتدیان', 'سئو', 'seo for beginners', 'wait'],
    ['۱۰ اشتباه رایج در تولید محتوا', 'تولید محتوا', 'content mistakes', 'done'],
    ['چطور کلمهٔ کلیدی انتخاب کنیم؟', 'کلمات کلیدی', 'keyword research', 'done'],
    ['ساختار مقالهٔ سئوشده', 'ساختار', 'article structure', 'run'],
    ['لینک داخلی بدون آسیب به سئو', 'لینک‌سازی', 'internal linking', 'done'],
    ['اسکیما چیست و چرا مهم است؟', 'سئوی فنی', 'schema markup', '—'],
    ['تصویر شاخص و تاثیرش بر کلیک', 'تصویر', 'featured image', '—']
  ];

  var REVIEW = [
    ['راهنمای سئو برای مبتدیان', 92, 'ساخته شد'],
    ['۱۰ اشتباه رایج در تولید محتوا', 88, 'ساخته شد'],
    ['ساختار مقالهٔ سئوشده', 84, 'در صف'],
    ['لینک داخلی بدون آسیب به سئو', 90, 'ساخته شد']
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- tabs ---------------- */
  function renderTabs() {
    var wrap = $('#tabs');
    wrap.innerHTML = TABS.map(function (t) {
      return '<button class="tab" type="button" data-tab="' + t.id + '">' +
        '<svg viewBox="0 0 24 24"><path d="' + t.icon + '"/></svg>' + t.label +
        (t.cnt ? ' <span class="cnt">' + t.cnt + '</span>' : '') + '</button>';
    }).join('');
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (b) go(b.dataset.tab);
    });
  }

  function ensurePanel(id) {
    var el = document.getElementById('p-' + id);
    if (el) return el;
    var spec = TABS.filter(function (t) { return t.id === id; })[0];
    el = document.createElement('section');
    el.className = 'panel';
    el.id = 'p-' + id;
    el.innerHTML =
      '<div class="grid g2e">' +
        '<div class="box"><h4>' + spec.label + '</h4>' +
          '<p class="sub" style="font-size:13.5px;line-height:2;color:#3B4F76">' + (spec.desc || '') + '</p>' +
          '<ul class="flist" style="margin-top:14px">' +
            (spec.list || []).map(function (x) { return '<li>' + x + '</li>'; }).join('') +
          '</ul>' +
        '</div>' +
        '<div class="box tint"><h4>در این دمو</h4>' +
          '<p class="sub" style="font-size:13px;line-height:2">این تب در پیشخوان واقعی همین‌جا باز می‌شود. ' +
          'دمو فقط بخش‌های اصلی را تعاملی نشان می‌دهد؛ بقیهٔ تب‌ها با همین چیدمان و همین داده‌ها کار می‌کنند.</p>' +
          '<div class="kpi" style="margin-top:16px"><b>' + fa(TABS.length) + '</b><span>تب مدیریتی در افزونه</span></div>' +
        '</div>' +
      '</div>';
    $('.panels').appendChild(el);
    return el;
  }

  function go(id, silent) {
    if (!id) id = 'dashboard';
    if (!TABS.some(function (t) { return t.id === id; })) id = 'dashboard';
    var panel = ensurePanel(id);
    $$('.panel').forEach(function (p) { p.classList.remove('on'); });
    panel.classList.add('on');
    $$('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === id); });
    if (!silent) {
      history.replaceState(null, '', '#' + id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ---------------- toast ---------------- */
  function toast(msg) {
    var w = $('#toasts');
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<i class="dot"></i>' + msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }

  /* ---------------- generate simulation ---------------- */
  var running = false;
  function runGeneration() {
    if (running) return;
    running = true;
    var btn = $('#gRun');
    btn.disabled = true;
    btn.textContent = 'در حال تولید…';
    $('#gOut').innerHTML = '';
    var steps = $$('#gSteps .sl');
    steps.forEach(function (s) { s.className = 'sl'; s.querySelector('.b').textContent = '✓'; });

    var i = 0;
    (function next() {
      if (i >= steps.length) {
        finish();
        return;
      }
      steps[i].classList.add('run');
      setTimeout(function () {
        steps[i].classList.remove('run');
        steps[i].classList.add('done');
        i++;
        next();
      }, 900 + Math.random() * 500);
    })();
  }

  function finish() {
    var topic = ($('#gTopic') && $('#gTopic').value) || 'راهنمای سئو برای مبتدیان';
    var prov = ($('#gProv') && $('#gProv').value) || 'Anthropic Claude';
    var out = $('#gOut');
    out.innerHTML =
      '<div class="box" style="padding:16px">' +
        '<span class="tagline">پیش‌نمایش خروجی</span>' +
        '<h4 style="margin-bottom:8px">' + topic + '</h4>' +
        '<p class="sub" style="margin-bottom:10px">پرووایدر: ' + prov + ' · ۱٬۲۰۰ کلمه · لحن آموزشی</p>' +
        '<div class="article">' +
          '<p><strong>مقدمه:</strong> سئو مجموعه‌ای از کارهای فنی و محتوایی است که باعث می‌شود صفحهٔ شما ' +
          'برای جست‌وجوی درست در جای درست دیده شود. در این راهنما از صفر شروع می‌کنیم…</p>' +
          '<p><strong>گام ۱ — کلمهٔ کلیدی:</strong> پیش از نوشتن، نیت جست‌وجو را مشخص کنید…</p>' +
        '</div>' +
        '<div class="score" style="margin-top:14px">' +
          ring(92) +
          '<ul class="checks">' +
            '<li><i>✓</i> عنوان و توضیحات متا نوشته شد</li>' +
            '<li><i>✓</i> ساختار هدینگ کامل است</li>' +
            '<li><i>✓</i> ۳ لینک داخلی مرتبط اضافه شد</li>' +
            '<li><i>✓</i> اسکیما و تصویر شاخص ساخته شد</li>' +
          '</ul>' +
        '</div>' +
        '<button class="btn-line" style="margin-top:14px" type="button" id="gSend">ارسال به صف بازبینی</button>' +
      '</div>';
    btn.textContent = 'تولید دوباره';
    btn.disabled = false;
    running = false;
    toast('مقاله تولید شد — امتیاز سئو ۹۲');
    var send = $('#gSend');
    if (send) send.addEventListener('click', function () {
      toast('به صف بازبینی اضافه شد');
      send.disabled = true;
      send.textContent = 'در صف بازبینی';
    });
  }

  function ring(score) {
    var r = 38, c = 2 * Math.PI * r, off = c - (score / 100) * c;
    return '<div class="ring"><svg width="92" height="92" viewBox="0 0 92 92">' +
      '<circle cx="46" cy="46" r="' + r + '" stroke="#E7EEFA" stroke-width="9" fill="none"/>' +
      '<circle cx="46" cy="46" r="' + r + '" stroke="url(#gr)" stroke-width="9" fill="none" ' +
      'stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/>' +
      '<defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient></defs>' +
      '</svg><div class="val">' + fa(score) + '</div></div>';
  }

  /* ---------------- data lists ---------------- */
  function renderTopics() {
    $('#topicRows').innerHTML = TOPICS.map(function (t) {
      var st = t[3] === 'done' ? '<span class="badge ok">تولید شد</span>'
        : t[3] === 'wait' ? '<span class="badge wait">در انتظار</span>'
          : t[3] === 'run' ? '<span class="badge blue">در حال تولید</span>'
            : '<span class="badge off">بدون تولید</span>';
      return '<tr><td class="name">' + t[0] + '</td><td>' + t[1] + '</td><td>' + t[2] + '</td><td>' + st + '</td></tr>';
    }).join('');
  }

  function renderReview() {
    $('#reviewRows').innerHTML = REVIEW.map(function (r, i) {
      return '<tr><td class="name">' + r[0] + '</td><td>' + fa(r[1]) + '</td>' +
        '<td><span class="badge ' + (r[2] === 'ساخته شد' ? 'ok' : 'wait') + '">' + r[2] + '</span></td>' +
        '<td><button class="btn-line" data-approve="' + i + '">تأیید و انتشار</button></td></tr>';
    }).join('');
  }

  function renderProviders() {
    $('#provGrid').innerHTML = PROVIDERS.map(function (p, i) {
      return '<div class="prov' + (p[2] ? ' on' : '') + '" data-prov="' + i + '">' +
        '<span class="av">' + p[0].charAt(0) + '</span>' +
        '<span><b>' + p[0] + '</b><span>' + p[1] + '</span></span></div>';
    }).join('');
    var chips = PROVIDERS.filter(function (p) { return p[2]; })
      .map(function (p) { return '<span class="opt on">' + p[0] + '</span>'; }).join('');
    $('#provChips').innerHTML = chips + '<span class="opt">+ پرووایدر شخصی</span>';
  }

  /* ---------------- init ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderTabs();
    renderTopics();
    renderReview();
    renderProviders();
    go((location.hash || '#dashboard').slice(1), true);

    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-goto]');
      if (g) { e.preventDefault(); go(g.dataset.goto); return; }

      var ap = e.target.closest('[data-approve]');
      if (ap) {
        var row = ap.closest('tr');
        row.cells[3].innerHTML = '<span class="badge ok">منتشر شد</span>';
        toast('مقاله منتشر شد');
        return;
      }

      var pr = e.target.closest('.prov');
      if (pr) {
        pr.classList.toggle('on');
        var name = pr.querySelector('b').textContent;
        toast(pr.classList.contains('on') ? name + ' فعال شد' : name + ' غیرفعال شد');
      }
    });

    // option chips (tone / length / days)
    document.addEventListener('click', function (e) {
      var o = e.target.closest('.opt');
      if (o && o.parentElement && o.parentElement.classList.contains('chipsrow') && o.parentElement.id !== 'provChips') {
        o.parentElement.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('on'); });
        o.classList.add('on');
      }
    });

    var run = $('#gRun');
    if (run) run.addEventListener('click', runGeneration);

    var save = $('#sSave');
    if (save) save.addEventListener('click', function () { toast('زمان‌بندی ذخیره شد'); });

    window.addEventListener('hashchange', function () { go(location.hash.slice(1), true); });
  });
})();

/* ==========================================================================
   موشن اسکرول — بخش‌های پایین صفحه
   محتوا همان است؛ فقط باکس‌ها با حرکت وارد می‌شوند: بالا آمدن، مقیاس،
   ستون‌های متوالی، شمارندهٔ اعداد، کشویی شدن قیمت‌ها، و نوار پیشرفت اسکرول.
   همه‌چیز با IntersectionObserver و یک rAF مشترک؛ بدون کتابخانه.
   با prefers-reduced-motion و بدون JS هم صفحه کامل و خوانا می‌ماند.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var stage = doc.querySelector('.hero-stage');
  if (!stage) { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supported = 'IntersectionObserver' in window;

  /* ------------------------------------------------------- نوار پیشرفت */
  var bar = doc.createElement('div');
  bar.className = 'scroll-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i></i>';
  doc.body.appendChild(bar);
  var barFill = bar.firstChild;

  var ticking = false;
  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    requestAnimationFrame(function () {
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      barFill.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';

      /* وقتی از هیرو رد شدی، محتوای هیرو کمی پایین‌تر می‌نشیند.
         مهم: اینجا هیچ transform/opacity روی خودِ .hs-slide نمی‌گذاریم.
         scale کردن اسلایدها آن‌ها را به لایهٔ کامپوزیتور جدا می‌برد و بعد از
         برگشتن به بالا مرورگر آن لایه را رها نمی‌کند؛ نتیجه افت نرخ فریم به
         حدود ۱۵ و «پرده با موشن نمی‌آید». به‌جایش یک متغیر CSS می‌دهیم و
         CSS با کلاس is-exiting فقط UI را کمی جابه‌جا می‌کند. */
      var y = window.scrollY;
      var heroH = stage.offsetHeight;
      if (reduce) {
        ticking = false;
        return;
      }
      var k = Math.max(0, Math.min(1, y / heroH));
      stage.style.setProperty('--hero-exit', k.toFixed(3));
      stage.classList.toggle('is-exiting', k > 0.02);

      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------- شمارندهٔ اعداد آماری */
  var FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function fa(n) { return String(Math.round(n)).replace(/\d/g, function (d) { return FA[+d]; }); }

  function countUp(el) {
    var raw = el.textContent.trim();
    /* فقط اعداد فارسی/لاتین ساده؛ اگر چیز دیگری بود دست نزن */
    var m = raw.match(/^([۰-۹0-9]+)$/);
    if (!m) { return; }
    var latin = raw.replace(/[۰-۹]/g, function (d) { return String(FA.indexOf(d)); });
    var to = parseInt(latin, 10);
    if (!to || to < 4) { return; }
    var dur = 900, t0 = null;
    function step(now) {
      if (t0 === null) { t0 = now; }
      var t = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = fa(to * e);
      if (t < 1) { requestAnimationFrame(step); }
      else { el.textContent = raw; }
    }
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------- ثبت عناصر ورودی */
  var io = null;
  if (supported) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var el = e.target;
        el.classList.add('in');

        /* شمارنده‌ها */
        if (el.classList.contains('stat')) {
          var n = el.querySelector('.n');
          if (n) { countUp(n); }
        }
        /* هر چیزی که ستون‌بندی می‌خواهد: ستون‌ها را یکی‌یکی تأخیر می‌دهیم */
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  }

  /* --- ۱) ستون‌های متوالی داخل گریدها ------------------------------- */
  var GROUPS = '.stats, .bento, .modes, .grid-4, .prizes, .themes, .gallery, ' +
               '.steps, .sms-drivers, .conditions';
  doc.querySelectorAll(GROUPS).forEach(function (g) {
    var kids = g.querySelectorAll('.rv');
    kids.forEach(function (k, i) {
      k.style.setProperty('--d', Math.min(i, 7) * 70 + 'ms');
    });
  });

  /* --- ۲) هیرو کارت‌ها: مقیاس + چرخش ملایم ------------------------- */
  doc.querySelectorAll('.card.rv, .prize.rv, .theme.rv, .shot.rv').forEach(function (el) {
    el.classList.add('mv-card');
  });

  /* --- ۳) سطرهای جدول‌مانند: از کنار بیایند ----------------------- */
  doc.querySelectorAll('.rule.rv, .cond.rv, .qa.rv').forEach(function (el) {
    el.classList.add('mv-slide');
  });

  /* --- ۴) هر عکسی که اسکرول می‌شود، آرام زوم می‌کند ---------------- */
  doc.querySelectorAll('.shot.rv img, .theme.rv img').forEach(function (img) {
    img.classList.add('mv-zoom');
  });

  /* --- ۵) عنوان بخش‌ها: کلمه‌به‌کلمه بالا بیاید --------------------- */
  if (!reduce) {
    doc.querySelectorAll('.sec-head h2').forEach(function (h) {
      var words = h.textContent.trim().split(/\s+/);
      if (words.length > 14) { h.classList.add('mv-title'); return; }  /* عنوان‌های خیلی بلند */
      h.innerHTML = words.map(function (w, i) {
        return '<span class="mv-w" style="--i:' + i + '">' + w + '</span>';
      }).join(' ');
      h.classList.add('mv-title');
    });
  }

  /* --- ثبت همه ---------------------------------------------------- */
  var all = doc.querySelectorAll('.rv');
  if (io) {
    all.forEach(function (el) { io.observe(el); });
  } else {
    all.forEach(function (el) { el.classList.add('in'); });
  }
  doc.querySelectorAll('.sec-head h2.mv-title').forEach(function (h) {
    if (io) { io.observe(h); } else { h.classList.add('in'); }
  });
  /* نوار پیشرفت اسکرول با اولین تکان به‌روز می‌شود */
  window.dispatchEvent(new Event('scroll'));
})();

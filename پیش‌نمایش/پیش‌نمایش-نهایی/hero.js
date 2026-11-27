/* ==========================================================================
   هیرو موشن‌دار — کنترلر
   یک پردهٔ اندازه‌گیری‌شده بین چهار «جایزه». اسلاید فعلی از لبهٔ راست پوشیده
   می‌شود، محتوایش به چپ می‌رود، و جایزهٔ بعد با پارالاکس از راست می‌آید.
   هیچ کتابخانه‌ای لازم نیست.
   ========================================================================== */
(function () {
  'use strict';

  var stage = document.querySelector('.hero-stage');
  if (!stage) { return; }

  var slides = Array.prototype.slice.call(stage.querySelectorAll('.hs-slide'));
  var arrows = stage.querySelectorAll('.hs-arrow');
  var dots = Array.prototype.slice.call(stage.querySelectorAll('.hs-dot'));
  var counter = stage.querySelector('.hs-count');
  if (slides.length < 2) { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAYERS = ['word', 'shadow', 'wheel', 'prize', 'corner'];
  /* پارالاکس: میوه/جایزه بیشتر از واژه سفر می‌کند */
  var FACTOR = { word: 0.42, shadow: 0.32, wheel: 0.16, prize: 0.60, corner: 0.82 };

  var FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function faNum(n) { return String(n).replace(/\d/g, function (d) { return FA[+d]; }); }

  var cur = 0, busy = false, lastUser = 0, autoplayTimer = null;

  /* ------------------------------------------------------------------
     حرکت تزئینی: بوب جایزه‌ها و سوسوی ستاره‌ها
     قبلاً با @keyframes بی‌پایان اجرا می‌شد؛ همان چیزی که باعث می‌شد بعد از
     اسکرول، هر فریم کل صحنه نقاشی شود و گذار پرده به ۲-۳ فریم بیفتد.
     حالا فقط یک transform/opacity با transition جابه‌جا می‌شود: کامپوزیتوری،
     بدون نقاشی مجدد. یک تایمر یکی‌درمیان وضعیت را عوض می‌کند و در گذار
     متوقف می‌شود.
     ------------------------------------------------------------------ */
  var bobs = Array.prototype.slice.call(stage.querySelectorAll('.hs-prize__bob'));
  var sparks = Array.prototype.slice.call(stage.querySelectorAll('.hs-spark'));
  var decorOn = true, decorTimer = null;

  bobs.forEach(function (el, i) {
    var half = 1.6 + ((i * 0.37) % 1.5);
    el.style.setProperty('--half', half.toFixed(2) + 's');
    el.dataset.phase = '0';
  });
  sparks.forEach(function (el, i) {
    el.style.setProperty('--half', (1.5 + ((i * 0.29) % 1.2)).toFixed(2) + 's');
  });

  function decorStep() {
    if (!decorOn) { return; }
    bobs.forEach(function (el) {
      var up = el.dataset.phase === '1';
      el.dataset.phase = up ? '0' : '1';
      var r0 = el.style.getPropertyValue('--rot-from') || '-3deg';
      var r1 = el.style.getPropertyValue('--rot-to') || '3deg';
      el.style.transform = up
        ? 'translateY(calc(-7 * var(--u))) rotate(' + r0 + ')'
        : 'translateY(calc(7 * var(--u))) rotate(' + r1 + ')';
    });
    sparks.forEach(function (el) { el.classList.toggle('on'); });
    decorTimer = setTimeout(decorStep, 1900);
  }

  function stopDecor() { decorOn = false; clearTimeout(decorTimer); }
  function startDecor() { if (!reduce && !decorOn) { decorOn = true; decorStep(); } }

  if (!reduce) { decorStep(); }
  else { bobs.forEach(function (el) { el.style.transform = 'none'; }); }
  /* هر گذار یک شناسه دارد. اگر گذار تازه‌ای شروع شود، حلقهٔ قبلی با
     شناسهٔ کهنه خودش را متوقف می‌کند و نمی‌تواند مقدار کهنه بنویسد. */
  var gen = 0;
  /* گذارِ در جریان، برای این‌که شود فوراً بسته‌اش کرد */
  var inflight = null;

  /* بستن فوری یک گذار بدون انیمیشن */
  function snapFinish(from, to, idx) {
    [from, to].forEach(function (s) {
      s.style.transition = 'none';
      s.style.clipPath = '';
      s.style.clipPath = 'inset(0 0% 0 0)';
      LAYERS.forEach(function (n) {
        var el = layer(s, n);
        if (el) { el.style.transition = 'none'; el.style.transform = ''; }
      });
    });
    from.classList.remove('is-current', 'is-spinning');
    from.classList.add('is-hidden');
    from.setAttribute('aria-hidden', 'true');
    to.classList.remove('is-under');
    to.classList.add('is-current');
    to.classList.remove('is-spinning');
    cur = idx; busy = false; inflight = null;
    gen++;
    syncUI();
  }
  /* اگر کاربر وسط گذار کلید بزند، درخواستش دور ریخته نمی‌شود؛ صف می‌شود. */
  var pending = null;

  /* ---------------------------------------------------------- مقیاس‌ها */
  var frameW = 1440, frameH = 900;

  function setUnits() {
    var W = window.innerWidth, H = window.innerHeight;
    var mobile = W <= 820 || H > W;
    /* موبایل: فریم طراحی ۶۴۰ واحد عرض دارد و با عرض صفحه مقیاس می‌شود.
       دسکتاپ: فریم ۱۴۴۰×۹۰۰ طوری جا می‌شود که کامل دیده شود. */
    var u = mobile
      ? W / 640
      : Math.min(W / frameW, H / frameH);
    var n = mobile ? 1 : Math.max(0.5, Math.min(W / 1440, H / 900, 1.3));
    stage.style.setProperty('--u', u + 'px');
    stage.style.setProperty('--n', n + 'px');
    layoutWords(mobile, u);
  }

  /* ------------------------------------------------- اندازهٔ واژهٔ غول */
  /* اندازه‌گیری با DOM انجام می‌شود، نه canvas:
     canvas فونت وب را رندر نمی‌کند و اندازهٔ اشتباه می‌دهد. */
  function layoutWords(mobile, u) {
    var designW = mobile ? 640 : frameW;
    var visibleDesignW = Math.min(designW, window.innerWidth / u);
    var maxInk = mobile ? visibleDesignW * 0.99 : 1460;
    var base = mobile ? 260 : 560;
    var track = mobile ? '-0.03em' : '-0.01em';

    /* همهٔ واژه‌ها یک اندازهٔ مشترک می‌گیرند تا هنگام تعویض، مقیاس نپرد.
       اندازه = کوچک‌ترین اندازه‌ای که بلندترین واژه را در فریم جا می‌دهد. */
    var common = base;
    slides.forEach(function (s) {
      var el = s.querySelector('.hs-word');
      var span = el && el.querySelector('span');
      if (!span) { return; }
      span.style.letterSpacing = track;
      span.style.fontSize = 'calc(' + base + ' * var(--u))';
      var ink = span.getBoundingClientRect().width / u;
      if (ink > maxInk) { common = Math.min(common, base * maxInk / ink); }
    });
    common = common * 0.995;

    slides.forEach(function (s) {
      var el = s.querySelector('.hs-word');
      var span = el && el.querySelector('span');
      if (!span) { return; }
      span.style.letterSpacing = track;
      span.style.fontSize = 'calc(' + common.toFixed(1) + ' * var(--u))';
      el.style.setProperty('--wordfs', 'calc(' + common.toFixed(1) + ' * var(--u))');
      el.style.fontSize = 'calc(' + common.toFixed(1) + ' * var(--u))';
      el.dataset.size = common.toFixed(0);
    });
  }

  /* ------------------------------------------------ پردهٔ گذار (منحنی) */
  /* جدول قبلی دو «مکث» و یک پرش ۱۳px/ms داشت؛ همان چیزی که به چشم
     «پرده آرام نمی‌آید» دیده می‌شد. حالا یک منحنی یکنوا و بی‌مکث است:
     شروعِ نرم، شتاب گرفتن در میانه، نشستنِ نرم. سرعت هیچ‌جا صفر نمی‌شود
     و هیچ‌جا هم نمی‌پرد. جدول را با عدد واقعی نگه داشته‌ام تا قابل تنظیم باشد. */
  var COVER_T = [0, .06, .14, .22, .30, .38, .46, .54, .62, .70, .78, .86, .93, 1];
  var COVER_C = [0, .004, .017, .043, .081, .133, .199, .279, .372, .477, .593, .718, .848, 1];

  function smooth(k) { return k * k * (3 - 2 * k); }

  function cover(t) {
    if (t <= 0) { return 0; }
    if (t >= 1) { return 1; }
    for (var i = 1; i < COVER_T.length; i++) {
      if (t <= COVER_T[i]) {
        var t0 = COVER_T[i - 1], t1 = COVER_T[i];
        var k = (t - t0) / (t1 - t0);
        return COVER_C[i - 1] + (COVER_C[i] - COVER_C[i - 1]) * smooth(k);
      }
    }
    return 1;
  }

  function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }

  function layer(slide, name) { return slide.querySelector('.hs-layer--' + name); }

  /* ------------------------------------------------------------- تعویض */
  function show(i, dir) {
    if (i === cur) { return; }

    /* اگر گذاری در جریان است، اول همان را فوراً تمام کن. وگرنه دو گذار
       روی هم می‌افتند و پرده یک‌باره می‌پرد (همان چیزی که با پخش خودکار
       دیده می‌شد). */
    if (busy && inflight) {
      clearTimeout(inflight.timer);
      var f0 = slides[inflight.from], t0s = slides[inflight.to];
      snapFinish(f0, t0s, inflight.to);
    }

    var from = slides[cur], to = slides[i];
    var W = window.innerWidth;
    var DUR = reduce ? 0 : 1080;

    hideOthers(i, cur);
    /* حالت را از صفر بچین. اگر گذار قبلی نیمه‌کاره مانده باشد (تب عوض شده،
       مرورگر فریم را متوقف کرده) استایل کهنه‌اش اینجا پاک می‌شود. */
    slides.forEach(function (s) {
      s.style.clipPath = '';
      s.style.zIndex = '';
      s.classList.remove('is-spinning');
    });
    to.classList.remove('is-hidden');
    to.classList.add('is-under');
    to.removeAttribute('aria-hidden');
    /* هیچ z-index اینلاین نوشته نمی‌شود. اگر اینجا استایل اینلاین بنویسیم،
       پاک نمی‌شود و بعد از چند تعویض هر دو اسلاید z-index=2 می‌گیرند؛ آن‌وقت
       ترتیب DOM تصمیم می‌گیرد و به‌جای پرده، یک «برش فوری» دیده می‌شود.
       کلاس‌های .is-current و .is-under خودشان لایه‌بندی را تعیین می‌کنند. */
    from.classList.remove('is-under');
    from.classList.add('is-current');

    /* چرخ کوتاه گردونه، به‌عنوان طعمِ شانس */
    from.classList.add('is-spinning');
    to.classList.add('is-spinning');

    if (reduce) {
      finish(from, to, i);
      return;
    }

    busy = true;
    stopDecor();
    var myGen = ++gen;
    var DUR = 1080;

    /* ------------------------------------------------------------------
       گذار با ساعتِ خود مرورگر
       قبلاً این حلقه با requestAnimationFrame اجرا می‌شد؛ ولی بعد از
       اسکرول، مرورگر rAF را تا ~۱۰ بار در ثانیه کم می‌کند و پرده ۲-۳ فریم
       درمی‌آید. حالا مقدار شروع و پایان یک‌بار ست می‌شود و مرورگر خودش
       در ۱۰۸۰ms درونه‌یابی می‌کند؛ این مسیر کامپوزیتوری است و به rAF
       وابسته نیست.
       ------------------------------------------------------------------ */
    var shift = dir > 0 ? 1 : -1;

    /* ۱) مقدار شروع: پوشش صفر + پارالاکس اسلاید ورودی */
    from.style.transition = 'none';
    from.style.clipPath = 'inset(0 0% 0 0)';
    LAYERS.forEach(function (n) {
      var a = layer(from, n), b = layer(to, n);
      if (a) { a.style.transition = 'none'; a.style.transform = 'translate3d(0,0,0)'; }
      if (b) {
        b.style.transition = 'none';
        b.style.transform = 'translate3d(' + (shift * FACTOR[n] * 100).toFixed(2) + '%,0,0)';
      }
    });

    /* ۲) مرورگر باید مقدار شروع را ثبت کند، بعد پایان را بدهیم */
    void from.offsetWidth;
    void to.offsetWidth;

    /* ۳) مقدار پایان + transition */
    var EASE = 'cubic-bezier(.45,.06,.25,1)';
    from.style.transition = 'clip-path ' + DUR + 'ms ' + EASE;
    from.style.clipPath = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    LAYERS.forEach(function (n) {
      var b = layer(to, n);
      if (b) {
        b.style.transition = 'transform ' + DUR + 'ms cubic-bezier(.22,.8,.3,1)';
        b.style.transform = 'translate3d(0,0,0)';
      }
    });

    var fallback = setTimeout(function () {
      if (myGen === gen && busy) { finish(from, to, i, myGen); }
    }, DUR + 300);
    inflight = { from: cur, to: i, timer: fallback };

    function onEnd(e) {
      if (e.target !== from) { return; }
      if (e.propertyName !== 'clip-path') { return; }
      from.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      finish(from, to, i, myGen);
    }
    from.addEventListener('transitionend', onEnd);
  }

  function finish(from, to, i, myGen) {
    if (myGen !== undefined && myGen !== gen) { return; }
    /* پاک‌سازی کامل: هر استایل اینلاینی که در گذار ست کرده‌ایم برمی‌گردد،
       وگرنه بعد از چند دور، اسلایدها استایل کهنه با خودشان حمل می‌کنند. */
    [from, to].forEach(function (s) {
      s.style.clipPath = '';
      s.style.zIndex = '';
      s.style.transform = '';
      s.style.opacity = '';
      s.style.transition = '';
      LAYERS.forEach(function (n) {
        var el = layer(s, n);
        if (el) { el.style.transform = ''; el.style.transition = ''; }
      });
    });
    from.classList.remove('is-current', 'is-spinning',
                          'is-wiping-r', 'is-wiping-l', 'is-animating');
    to.classList.remove('is-incoming-r', 'is-incoming-l', 'is-animating');
    from.classList.add('is-hidden');
    from.setAttribute('aria-hidden', 'true');
    LAYERS.forEach(function (n) {
      var a = layer(from, n), b = layer(to, n);
      if (a) { a.style.transform = ''; }
      if (b) { b.style.transform = ''; }
    });
    to.classList.remove('is-under');
    to.classList.add('is-current');
    to.classList.remove('is-spinning');
    cur = i;
    busy = false;
    inflight = null;
    decorOn = true;
    decorStep();
    syncUI();
    flushPending();
  }

  function hideOthers(keep, alsoKeep) {
    slides.forEach(function (s, i) {
      if (i === keep || i === alsoKeep) { return; }
      s.classList.add('is-hidden');
      s.classList.remove('is-current', 'is-under');
      s.setAttribute('aria-hidden', 'true');
    });
  }

  /* --------------------------------------------------------------- UI */
  function syncUI() {
    dots.forEach(function (d, i) {
      d.classList.toggle('is-on', i === cur);
      d.classList.toggle('is-past', i < cur);
    });
    if (counter) { counter.textContent = faNum(cur + 1) + ' / ' + faNum(slides.length); }
  }

  function goTo(i, dir, auto) {
    var n = slides.length;
    i = ((i % n) + n) % n;
    if (i === cur) { return; }
    var d = dir !== undefined ? dir : (i > cur ? 1 : -1);
    /* پخش خودکار نباید خودش را «تعامل کاربر» حساب کند، وگرنه هر بار
       ۶ ثانیه مکث می‌خورد و اسلایدر می‌خوابد. */
    if (!auto) { pauseAuto(); }
    /* اگر گذاری در جریان است، درخواست را نگه می‌داریم و بلافاصله بعد از
       تمام شدنش اجرا می‌کنیم؛ این‌طور نه کلید گم می‌شود و نه دو گذار روی
       هم می‌افتند. */
    if (busy) { pending = { i: i, d: d }; return; }
    show(i, d);
  }

  function flushPending() {
    if (!pending) { return; }
    var p = pending; pending = null;
    goTo(p.i, p.d);
  }

  /* --------------------------------------------------------- کنترل‌ها */
  arrows.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fwd = btn.classList.contains('hs-arrow--next');
      goTo(cur + (fwd ? 1 : -1), fwd ? 1 : -1);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
    /* وقتی هیرو دیده نمی‌شود، کلیدها به صفحه دست نزنند */
    var box = stage.getBoundingClientRect();
    if (box.bottom < 120 || box.top > window.innerHeight - 120) { return; }
    e.preventDefault();
    if (e.key === 'ArrowLeft') { goTo(cur + 1, 1); }
    else { goTo(cur - 1, -1); }
  });

  /* سوایپ / درگ */
  var down = null;
  stage.addEventListener('pointerdown', function (e) {
    down = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', function (e) {
    if (!down) { return; }
    var dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      goTo(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  });

  /* ------------------------------------------------------------ پخش */
  /* هر تعامل کاربر: گذارِ خودکارِ در جریان فوراً بسته می‌شود تا کلید/کلیک
     کاربر روی یک گذار نیمه‌کاره نیفتد و پرده نپرد. */
  function pauseAuto() { lastUser = Date.now(); }

  function startAuto() {
    if (autoplayTimer) { return; }
    autoplayTimer = setInterval(function () {
      if (document.hidden) { return; }
      if (Date.now() - lastUser < 6000) { return; }
      if (busy) { return; }
      if (document.querySelector('.hs-slide.is-under')) { return; }
      goTo(cur + 1, 1, true);
    }, 2600);
  }

  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () { lastUser = Date.now(); }, { passive: true });
  });

  /* ------------------------------------------------------ ورود اولیه */
  function reveal() {
    stage.classList.add('hs-stage-ready');
    /* فالبک ۳ ثانیه‌ای: اگر چیزی گیر کرد، همه‌چیز را نشان بده */
    setTimeout(function () {
      stage.classList.add('hs-stage-ready');
      stage.querySelectorAll('.hs-rise').forEach(function (el) { el.style.opacity = '1'; });
    }, 3000);
  }

  /* وقتی هیرو از دید خارج شد، حرکت تزئینی هم متوقف می‌شود */
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { startDecor(); }
        else { stopDecor(); }
      });
    }, { threshold: 0.02 }).observe(stage);
  }

  /* ------------------------------------------------------------ اجرا */
  setUnits();
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { setUnits(); });
    ro.observe(stage);
  }
  window.addEventListener('resize', setUnits);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setUnits();
      syncUI();
      reveal();
      startAuto();
    });
  } else {
    syncUI(); reveal(); startAuto();
  }

  /* اگر فونت‌ها دیر شدند، منتظر نمان */
  setTimeout(function () {
    if (!stage.classList.contains('hs-stage-ready')) {
      syncUI(); reveal(); startAuto();
    }
  }, 1200);

  syncUI();
})();

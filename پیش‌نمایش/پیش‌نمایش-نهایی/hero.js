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
  var tabs = Array.prototype.slice.call(stage.querySelectorAll('.hs-tab'));
  var underline = stage.querySelector('.hs-underline');
  var arrows = stage.querySelectorAll('.hs-arrow');
  var dots = Array.prototype.slice.call(stage.querySelectorAll('.hs-dot'));
  var counter = stage.querySelector('.hs-count');
  if (slides.length < 2) { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAYERS = ['word', 'shadow', 'wheel', 'prize', 'corner'];
  /* پارالاکس: میوه/جایزه بیشتر از واژه سفر می‌کند */
  var FACTOR = { word: 0.40, shadow: 0.30, wheel: 0.15, prize: 0.55, corner: 0.75 };

  var FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function faNum(n) { return String(n).replace(/\d/g, function (d) { return FA[+d]; }); }

  var cur = 0, busy = false, lastUser = 0, autoplayTimer = null;
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

  /* ---------------------------------------------- پردهٔ اندازه‌گیری‌شده */
  var COVER_T = [0, 0.031, 0.134, 0.206, 0.278, 0.34, 0.412, 0.485, 0.546, 0.583, 0.62, 0.69, 0.79, 0.85, 0.93, 1];
  var COVER_C = [0, 0.006, 0.012, 0.023, 0.047, 0.07, 0.105, 0.158, 0.246, 0.55, 0.825, 0.9, 0.94, 0.956, 0.975, 1];

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
    if (busy || i === cur) { return; }
    var from = slides[cur], to = slides[i];
    var W = window.innerWidth;
    var DUR = reduce ? 0 : 970;

    hideOthers(i, cur);
    to.classList.remove('is-hidden');
    to.classList.add('is-under');
    to.removeAttribute('aria-hidden');
    from.classList.add('is-current');
    from.style.zIndex = 2;

    /* چرخ کوتاه گردونه، به‌عنوان طعمِ شانس */
    from.classList.add('is-spinning');
    to.classList.add('is-spinning');

    if (reduce) {
      finish(from, to, i);
      return;
    }

    busy = true;
    var t0 = performance.now();

    function step(now) {
      var t = (now - t0) / DUR;
      var c = cover(Math.min(t, 1));
      var pct = c * 100;

      /* ۳) پوشاندن اسلاید فعلی */
      from.style.clipPath = dir > 0
        ? 'inset(0 ' + pct.toFixed(2) + '% 0 0)'
        : 'inset(0 0 0 ' + pct.toFixed(2) + '%)';

      /* ۴) drift اسلاید فعلی */
      var drift = -dir * c * 0.14 * W;
      LAYERS.forEach(function (n) {
        var el = layer(from, n);
        if (el) { el.style.transform = 'translate3d(' + drift.toFixed(1) + 'px,0,0)'; }
      });

      /* ۵) ورود اسلاید بعدی با پارالاکس */
      var k = easeOutQuad(Math.max(0, Math.min(1, (t - 0.5) / 0.42)));
      var remain = 1 - k;
      LAYERS.forEach(function (n) {
        var el = layer(to, n);
        if (el) {
          el.style.transform = 'translate3d(' + (dir * remain * FACTOR[n] * W).toFixed(1) + 'px,0,0)';
        }
      });

      if (t < 1.62) {
        requestAnimationFrame(step);
      } else {
        finish(from, to, i);
      }
    }
    requestAnimationFrame(step);
  }

  function finish(from, to, i) {
    from.style.clipPath = '';
    from.classList.remove('is-current', 'is-spinning');
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
    tabs.forEach(function (t, i) {
      if (i === cur) { t.setAttribute('aria-current', 'true'); }
      else { t.removeAttribute('aria-current'); }
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-on', i === cur);
      d.classList.toggle('is-past', i < cur);
    });
    if (counter) { counter.textContent = faNum(cur + 1) + ' / ' + faNum(slides.length); }
    moveUnderline();
  }

  function moveUnderline() {
    var t = tabs[cur];
    if (!t || !underline) { return; }
    underline.style.width = t.offsetWidth + 'px';
    underline.style.transform = 'translateX(' + t.offsetLeft + 'px)';
  }

  function goTo(i, dir, auto) {
    var n = slides.length;
    i = ((i % n) + n) % n;
    if (i === cur) { return; }
    var d = dir !== undefined ? dir : (i > cur ? 1 : -1);
    /* پخش خودکار نباید خودش را «تعامل کاربر» حساب کند، وگرنه هر بار
       ۶ ثانیه مکث می‌خورد و اسلایدر می‌خوابد. */
    if (!auto) { pauseAuto(); }
    if (busy) { pending = { i: i, d: d }; return; }
    show(i, d);
  }

  function flushPending() {
    if (!pending) { return; }
    var p = pending; pending = null;
    goTo(p.i, p.d);
  }

  /* --------------------------------------------------------- کنترل‌ها */
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      var dir = i > cur ? 1 : -1;
      if (i === 0 && cur === slides.length - 1) { dir = 1; }
      if (i === slides.length - 1 && cur === 0) { dir = -1; }
      goTo(i, dir);
    });
  });

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
  function pauseAuto() { lastUser = Date.now(); }

  function startAuto() {
    if (autoplayTimer) { return; }
    autoplayTimer = setInterval(function () {
      if (document.hidden) { return; }
      if (Date.now() - lastUser < 6000) { return; }
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
      moveUnderline();
    }, 3000);
  }

  /* ------------------------------------------------------------ اجرا */
  setUnits();
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { setUnits(); moveUnderline(); });
    ro.observe(stage);
  }
  window.addEventListener('resize', function () { setUnits(); moveUnderline(); });

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

/* ARIAGH.AIWRITER — preview site behaviour */
(function () {
  'use strict';

  /* ---------- slide-down "منوی بخش‌ها" ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- scroll-spy on the fixed nav ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var targets = links.map(function (a) {
    var id = a.getAttribute('href').slice(1);
    return document.getElementById(id);
  });
  function spy() {
    var y = window.scrollY + 140;
    var current = -1;
    targets.forEach(function (t, i) {
      if (t && t.offsetTop <= y) current = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('on', i === current); });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* ---------- live admin preview (real demo page in an iframe) ---------- */
  var liveTabs = Array.prototype.slice.call(document.querySelectorAll('[data-live-tab]'));
  var liveFrame = document.getElementById('livePreview');
  var liveBox = document.getElementById('liveBox');
  var liveLabel = document.getElementById('liveLabel');
  var liveOpen = document.getElementById('liveOpen');
  var LIVE_W = 1440;
  var LIVE_H = 980;

  function scaleLive() {
    if (!liveFrame || !liveBox) return;
    var w = liveBox.clientWidth;
    if (!w) return;
    var s = w / LIVE_W;
    liveFrame.style.transform = 'scale(' + s + ')';
    liveBox.style.height = Math.round(LIVE_H * s) + 'px';
  }

  function setLive(id, label) {
    if (!liveFrame) return;
    liveFrame.src = 'demo/?embed=1#/' + id;
    if (liveLabel) liveLabel.textContent = label;
    if (liveOpen) liveOpen.href = 'demo/#/' + id;
  }

  liveTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      liveTabs.forEach(function (t) {
        t.classList.remove('on');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('on');
      tab.setAttribute('aria-selected', 'true');
      setLive(tab.getAttribute('data-live-tab'), tab.textContent.trim());
    });
  });

  if (liveFrame) {
    scaleLive();
    window.addEventListener('resize', scaleLive, { passive: true });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { scaleLive(); }
        });
      }, { threshold: 0.1 });
      io.observe(liveBox);
    }
  }

  /* ---------- module cards open the matching demo route ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.mod'), function (card) {
    var link = card.querySelector('.mod-open');
    if (!link) return;
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      link.click();
    });
  });

  /* ---------- modules filter ---------- */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.fbtn'));
  var mods = Array.prototype.slice.call(document.querySelectorAll('.mod'));
  fbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      fbtns.forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.getAttribute('data-f');
      mods.forEach(function (m) {
        m.hidden = !(f === 'all' || m.getAttribute('data-g') === f);
      });
    });
  });

  /* ---------- reveal on scroll ---------- */
  var reveal = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- smooth anchor scroll with fixed header offset ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    var top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
})();

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

  /* ---------- gallery tabs ---------- */
  var gtabs = Array.prototype.slice.call(document.querySelectorAll('.g-tab'));
  gtabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      gtabs.forEach(function (t) { t.classList.remove('on'); });
      tab.classList.add('on');
      var id = tab.getAttribute('data-g');
      Array.prototype.forEach.call(document.querySelectorAll('.g-panel'), function (p) {
        p.classList.toggle('on', p.id === id);
      });
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

/* ==========================================================================
   بچرخون — interaction for the static preview (site.js)
   No dependencies, no network calls.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- reveal on scroll ---------- */
  var items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 6, 5) * 45) + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- soft hero wheel rotation (respects reduced motion) ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var g = document.querySelector('.hero-art .wheel .spin');
  if (g && !reduce) {
    /* centre comes from the SVG viewBox, so the disc can never drift out of its box */
    var svg = g.ownerSVGElement;
    var vb = (svg.getAttribute('viewBox') || '0 0 430 430').split(/\s+/).map(Number);
    var ccx = vb[0] + vb[2] / 2, ccy = vb[1] + vb[3] / 2;
    var BASE = -12;              /* resting angle */
    var DEG_PER_MS = 9 / 1000;   /* 9°/s — a calm idle turn, one lap every 40s */
    var cur = BASE, t0 = performance.now();
    (function loop(now) {
      var target = BASE + (now - t0) * DEG_PER_MS;
      cur += (target - cur) * 0.08;      /* ease so it starts gently, never jumps */
      g.setAttribute('transform', 'rotate(' + cur.toFixed(2) + ' ' + ccx + ' ' + ccy + ')');
      requestAnimationFrame(loop);
    })(t0);
  }

  /* ---------- nav: mark the active section + show the bar after the hero ---------- */
  var snav = document.getElementById('snav');
  var links = Array.prototype.slice.call(document.querySelectorAll('.snav-links a[href^="#"]'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var hero = document.getElementById('hero');

  function onScroll() {
    var y = window.scrollY + 150, active = -1;
    targets.forEach(function (t, i) {
      if (t && t.offsetTop <= y) active = i;
    });
    links.forEach(function (a, i) {
      if (i === active) { a.setAttribute('aria-current', 'true'); }
      else { a.removeAttribute('aria-current'); }
    });
    if (snav && hero) {
      var past = window.scrollY > hero.offsetHeight - 120;
      snav.classList.toggle('is-in', past);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- smooth anchor offset for the sticky header ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    var top = t.getBoundingClientRect().top + window.scrollY - 74;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- FAQ: keep a single panel open ---------- */
  var qas = document.querySelectorAll('.qa');
  qas.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      qas.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();

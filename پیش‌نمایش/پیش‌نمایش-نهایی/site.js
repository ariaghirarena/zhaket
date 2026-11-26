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
    /* centre of rotation comes from the SVG viewBox, so the wheel never drifts */
    var svg = g.ownerSVGElement;
    var vb = (svg.getAttribute('viewBox') || '0 0 430 430').split(/\s+/).map(Number);
    var ccx = vb[0] + vb[2] / 2, ccy = vb[1] + vb[3] / 2;
    var base = -14, cur = base, t0 = performance.now();
    (function loop(now) {
      var target = base + (now - t0) * 0.0055;   /* ~0.31°/s: calm, not a slot machine */
      cur += (target - cur) * 0.06;
      g.setAttribute('transform', 'rotate(' + cur.toFixed(2) + ' ' + ccx + ' ' + ccy + ')');
      requestAnimationFrame(loop);
    })(t0);
  }

  /* ---------- nav: mark the active section ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var y = window.scrollY + 120, active = -1;
    targets.forEach(function (t, i) {
      if (t && t.offsetTop <= y) active = i;
    });
    links.forEach(function (a, i) {
      a.style.background = i === active ? 'rgba(242,240,230,.09)' : '';
      a.style.color = i === active ? '#fff' : '';
    });
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
    var top = t.getBoundingClientRect().top + window.scrollY - 86;
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

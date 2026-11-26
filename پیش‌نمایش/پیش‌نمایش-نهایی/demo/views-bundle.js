/* ==========================================================================
   بچرخون — منطق دموی پنل (demo/views-bundle.js)
   مسیریابی hash، تغییر صفحه بدون reload، تعامل‌های نمایشی.
   بدون وابستگی، بدون درخواست شبکه.
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULT = 'dashboard';
  var views = {};
  var navs, crumb, toastEl, toastTimer;

  function init() {
    document.querySelectorAll('.view').forEach(function (v) {
      views[v.id.replace('view-', '')] = v;
    });
    navs = Array.prototype.slice.call(document.querySelectorAll('.nav-i'));
    crumb = document.getElementById('crumb');
    toastEl = document.getElementById('toast');

    window.addEventListener('hashchange', route);
    route();
    bindDemo();
  }

  function route() {
    var key = (location.hash || '').replace('#', '') || DEFAULT;
    if (!views[key]) key = DEFAULT;
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== key); });
    navs.forEach(function (a) { a.classList.toggle('on', a.dataset.page === key); });

    var active = navs.filter(function (a) { return a.dataset.page === key; })[0];
    if (active && crumb) crumb.textContent = active.textContent.trim();
    document.title = (active ? active.textContent.trim() + ' — ' : '') + 'پنل مدیریت بچرخون';

    document.getElementById('page').scrollTop = 0;
    window.scrollTo(0, 0);
    var side = document.getElementById('side');
    if (side && side.classList.contains('open')) side.classList.remove('open');
  }

  function toast(msg) {
    if (!toastEl) return;
    toastEl.querySelector('span').textContent = msg || 'انجام شد (نمایشی)';
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }

  /* ---------------------------------------------------------------- demo interactions */
  function bindDemo() {
    /* segmented controls */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.seg button');
      if (b) {
        b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        toast('بازهٔ نمایش تغییر کرد (نمایشی)');
      }
    });

    /* generic "do something" buttons */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.btn');
      if (!b) return;
      if (b.id === 'spinBtn') return;            /* handled below */
      if (b.classList.contains('del')) return;
      if (b.textContent.indexOf('ذخیره') > -1) { toast('تغییرات ذخیره شد (نمایشی)'); }
    });

    /* mobile drawer */
    var mob = document.getElementById('mobBtn');
    var side = document.getElementById('side');
    if (mob && side) {
      mob.addEventListener('click', function () { side.classList.toggle('open'); });
    }

    /* theme picker */
    document.querySelectorAll('.th').forEach(function (t) {
      t.addEventListener('click', function () {
        document.querySelectorAll('.th').forEach(function (o) { o.classList.remove('on'); });
        t.classList.add('on');
        toast('تم «' + t.querySelector('.nm').textContent + '» انتخاب شد (نمایشی)');
      });
    });

    /* segment rows: delete + live total */
    var segList = document.getElementById('segList');
    if (segList) {
      segList.addEventListener('click', function (e) {
        var del = e.target.closest('.del');
        if (del) {
          var row = del.closest('.seg-row');
          row.style.transition = 'opacity .15s';
          row.style.opacity = '0';
          setTimeout(function () { row.remove(); recount(); }, 150);
        }
      });
      segList.addEventListener('input', recount);
      recount();
    }

    /* spin animation */
    var spin = document.getElementById('spinBtn');
    var stage = document.getElementById('stage');
    if (spin && stage) {
      spin.addEventListener('click', function () {
        if (stage.classList.contains('spinning')) return;
        stage.classList.add('spinning');
        setTimeout(function () {
          stage.classList.remove('spinning');
          toast('نتیجه در دمو ذخیره نمی‌شود — در افزونه، جایزه صادر می‌شد.');
        }, 3500);
      });
    }
  }

  function recount() {
    var list = document.getElementById('segList');
    if (!list) return;
    var sum = 0, n = 0;
    list.querySelectorAll('input[type=number]').forEach(function (i) {
      sum += Math.max(0, parseInt(i.value, 10) || 0);
      n++;
    });
    var note = list.parentNode.querySelector('.total-note');
    if (note) {
      note.innerHTML = 'جمع شانس‌ها: <b class="num">' + sum + '٪</b> — ' +
        (sum === 100 ? 'درست است' : 'باید ۱۰۰٪ باشد') + ' · سگمنت‌ها: <b class="num">' + n + '</b>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

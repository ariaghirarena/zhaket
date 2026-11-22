/* ARIAGH.AIWRITER — interactive admin demo (mock data, real behaviour) */
(function () {
  'use strict';

  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(n) {
    return String(n).replace(/[0-9]/g, function (d) { return FA[+d]; });
  }

  /* ---------------- toast ---------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------------- tabs ---------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var ids = panels.map(function (p) { return p.id.replace('p-', ''); });

  function routeOf(id) { return '#/' + id; }

  function show(id, push) {
    if (ids.indexOf(id) === -1) id = 'dashboard';
    panels.forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + id); });
    links.forEach(function (a) {
      var on = a.getAttribute('data-tab') === id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (push !== false) {
      var target = routeOf(id);
      if (location.hash !== target) {
        try { history.pushState(null, '', target); } catch (e) { location.hash = target; }
      }
    }
    var h1 = document.querySelector('.panel.on .panel-title, .page-head h1, .head h1');
    if (h1) document.title = h1.textContent.trim() + ' — دموی ARIAGH.AIWRITER';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fromHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    show(h || 'dashboard', false);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tab]');
    if (!el) return;
    e.preventDefault();
    show(el.getAttribute('data-tab'));
  });

  fromHash();
  window.addEventListener('popstate', fromHash);
  window.addEventListener('hashchange', fromHash);

  /* inside the landing previews: hide the demo bar */
  try {
    if (new URLSearchParams(location.search).get('embed') === '1') {
      document.body.classList.add('embed');
    }
  } catch (e) { /* old browser */ }

  /* ---------------- switches ---------------- */
  document.addEventListener('click', function (e) {
    var sw = e.target.closest('.switch');
    if (!sw) return;
    var on = sw.getAttribute('aria-checked') === 'true';
    sw.setAttribute('aria-checked', on ? 'false' : 'true');
  });

  /* ---------------- generic toast actions ---------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-toast]');
    if (el) toast(el.getAttribute('data-toast'));
  });

  /* ---------------- provider test ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-test]');
    if (!b) return;
    var ms = 180 + Math.floor(Math.random() * 700);
    b.textContent = 'در حال تست…';
    b.disabled = true;
    setTimeout(function () {
      b.textContent = 'تست اتصال';
      b.disabled = false;
      toast('اتصال سالم — ' + fa(ms) + ' میلی‌ثانیه');
    }, 900);
  });

  /* ---------------- topics: add + AI suggest ---------------- */
  var tbody = document.querySelector('#topicTable tbody');
  var cntQueue = document.getElementById('cntQueue');
  var rows = tbody ? Array.prototype.slice.call(tbody.querySelectorAll('tr')) : [];

  function renumber() {
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr, i) {
      tr.firstElementChild.textContent = fa(i + 1);
    });
    if (cntQueue) cntQueue.textContent = fa(tbody.querySelectorAll('tr').length + 19);
  }

  var addBtn = document.getElementById('addTopic');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var title = (document.getElementById('tTitle') || {}).value || '';
      var key = (document.getElementById('tKey') || {}).value || '';
      var prio = (document.getElementById('tPrio') || {}).value || 'عادی';
      if (!title.trim()) { toast('عنوان موضوع را بنویس'); return; }
      var prioTag = prio === 'فوری' ? '<span class="tag err">فوری</span>'
        : prio === 'بالا' ? '<span class="tag wait">بالا</span>' : '<span class="tag">عادی</span>';
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>۰</td><td class="name">' + title.replace(/[<>]/g, '') +
        '</td><td>' + (key || '—') + '</td><td>' + prioTag +
        '</td><td><span class="tag">در صف</span></td>' +
        '<td><button class="btn-a sm" data-generate>تولید فوری</button></td>';
      tbody.insertBefore(tr, tbody.firstElementChild);
      document.getElementById('tTitle').value = '';
      document.getElementById('tKey').value = '';
      renumber();
      toast('موضوع به ابتدای صف اضافه شد');
    });
  }

  var aiBtn = document.getElementById('aiSuggest');
  if (aiBtn) {
    aiBtn.addEventListener('click', function () {
      aiBtn.textContent = 'در حال پیشنهاد…';
      aiBtn.disabled = true;
      var ideas = [
        ['خواص دارچین برای سلامت', 'دارچین'],
        ['راهنمای نگهداری زعفران', 'نگهداری زعفران'],
        ['تفاوت پستهٔ اکبری و فندقی', 'پستهٔ اکبری']
      ];
      setTimeout(function () {
        ideas.forEach(function (it) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>۰</td><td class="name">' + it[0] + '</td><td>' + it[1] +
            '</td><td><span class="tag">عادی</span></td><td><span class="tag">در صف</span></td>' +
            '<td><button class="btn-a sm" data-generate>تولید فوری</button></td>';
          tbody.appendChild(tr);
        });
        renumber();
        aiBtn.textContent = 'پیشنهاد موضوع با AI';
        aiBtn.disabled = false;
        toast('۳ موضوع پیشنهادی اضافه شد');
      }, 1100);
    });
  }

  /* ---------------- generate instantly ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-generate]');
    if (!b) return;
    var tr = b.closest('tr');
    var cell = tr.children[4];
    if (cell) cell.innerHTML = '<span class="tag wait">در حال تولید</span>';
    b.disabled = true;
    b.textContent = 'صف…';
    toast('تولید شروع شد — در «فعالیت زنده» ببین');
    setTimeout(function () {
      if (cell) cell.innerHTML = '<span class="tag ok">تولید شد</span>';
      b.textContent = 'مشاهده';
      b.disabled = false;
      toast('پیش‌نویس ساخته شد و به صف بازبینی رفت');
    }, 2200);
  });

  /* ---------------- review approve ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-approve]');
    var s = e.target.closest('[data-schedule]');
    if (!b && !s) return;
    var tr = (b || s).closest('tr');
    tr.classList.add('dim');
    Array.prototype.forEach.call(tr.querySelectorAll('button'), function (x) { x.disabled = true; });
    tr.children[0].innerHTML += ' <span class="tag ok">منتشر شد</span>';
    var n1 = document.getElementById('kpiReview');
    var n2 = document.getElementById('kpiReview2');
    var cnt = document.getElementById('reviewCnt');
    [n1, n2, cnt].forEach(function (el) {
      if (!el) return;
      var v = parseInt(el.textContent.replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }), 10);
      if (!isNaN(v) && v > 0) el.textContent = fa(v - 1);
    });
    toast(b ? 'مقاله منتشر شد' : 'برای فردا ۰۹:۰۰ زمان‌بندی شد');
  });

  /* ---------------- strategy run ---------------- */
  var runBtn = document.getElementById('runStrategy');
  if (runBtn) {
    runBtn.addEventListener('click', function () {
      runBtn.disabled = true;
      runBtn.textContent = 'در حال تحلیل…';
      var steps = document.querySelectorAll('#strategySteps .sl');
      var i = 0;
      var t = setInterval(function () {
        if (i < steps.length) {
          steps[i].className = 'sl done';
          steps[i].querySelector('.b').textContent = '✓';
          i++;
        } else {
          clearInterval(t);
          runBtn.disabled = false;
          runBtn.textContent = 'شروع تحلیل';
          toast('تحلیل تمام شد — ۲۴ موضوع اولویت‌دار آماده است');
        }
      }, 700);
    });
  }

  /* ---------------- activity progress ---------------- */
  var actProg = document.getElementById('actProg');
  if (actProg) {
    var w = 62;
    setInterval(function () {
      w = w >= 96 ? 62 : w + 1;
      actProg.style.width = w + '%';
    }, 1400);
  }
  var cancelJob = document.getElementById('cancelJob');
  if (cancelJob) {
    cancelJob.addEventListener('click', function () {
      cancelJob.disabled = true;
      cancelJob.textContent = 'لغو شد';
      toast('اجرا لغو شد و موضوع به صف برگشت');
    });
  }

  /* ---------------- subscription device code ---------------- */
  var dBtn = document.getElementById('deviceBtn');
  if (dBtn) {
    dBtn.addEventListener('click', function () {
      dBtn.disabled = true;
      dBtn.textContent = 'در حال گرفتن کد…';
      setTimeout(function () {
        document.getElementById('deviceOut').style.display = 'block';
        dBtn.textContent = 'کد گرفته شد';
        toast('کد یک‌بارمصرف ساخته شد');
      }, 900);
    });
  }

  /* ---------------- cloudflare deploy ---------------- */
  var deployBtn = document.getElementById('deployBtn');
  if (deployBtn) {
    deployBtn.addEventListener('click', function () {
      deployBtn.disabled = true;
      deployBtn.textContent = 'در حال استقرار…';
      setTimeout(function () {
        deployBtn.textContent = 'مستقر شد';
        var st = document.getElementById('workerState');
        if (st) { st.className = 'tag ok'; st.textContent = 'مستقر'; }
        toast('ورکر، KV و Cron با موفقیت ساخته شد');
      }, 1600);
    });
  }

  /* ---------------- schedule interval ---------------- */
  var interval = document.getElementById('interval');
  if (interval) {
    interval.addEventListener('change', function () {
      var v = interval.value;
      var cron = document.getElementById('cronNow');
      if (cron) cron.textContent = '۰ */' + fa(v) + ' * * *';
      toast('زمان‌بندی به هر ' + fa(v) + ' ساعت تغییر کرد');
    });
  }

  /* ---------------- prompt variables ---------------- */
  var box = document.getElementById('promptBox');
  var preview = document.getElementById('promptPreview');
  var chips = document.getElementById('varChips');
  if (chips && box) {
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var token = b.textContent.trim();
      var s = box.selectionStart || box.value.length;
      box.value = box.value.slice(0, s) + token + box.value.slice(box.selectionEnd || s);
      box.focus();
      box.selectionStart = box.selectionEnd = s + token.length;
      toast(token + ' در محل نشانگر درج شد');
    });
  }
  if (box && preview) {
    var sample = {
      '{site_name}': 'بن‌لی‌فود', '{niche}': 'فروشگاه مواد غذایی طبیعی',
      '{audience}': 'خریدار خانگی', '{topic}': 'راهنمای خرید روغن زیتون اصل',
      '{keywords}': 'روغن زیتون', '{tone}': 'آموزشی', '{language}': 'فارسی',
      '{word_min}': '۱۲۰۰', '{word_max}': '۱۸۰۰', '{year}': '۱۴۰۵ / 2026'
    };
    function renderPreview() {
      var out = box.value;
      Object.keys(sample).forEach(function (k) {
        out = out.split(k).join(sample[k]);
      });
      preview.textContent = out;
    }
    box.addEventListener('input', renderPreview);
    renderPreview();
  }

  /* ---------------- features search ---------------- */
  var fs = document.getElementById('featSearch');
  if (fs) {
    var blocks = Array.prototype.slice.call(document.querySelectorAll('#featGrid .note'));
    fs.addEventListener('input', function () {
      var q = fs.value.trim();
      blocks.forEach(function (b) {
        b.style.display = !q || b.textContent.indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }
})();

/* screenshot studio: show one tab at 1440px and export a crisp PNG */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var tab = params.get('tab') || 'dashboard';
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var ids = panels.map(function (p) { return p.id.replace('p-', ''); });

  function show(id) {
    if (ids.indexOf(id) === -1) id = 'dashboard';
    panels.forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + id); });
    document.querySelectorAll('[data-tab]').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('data-tab') === id);
    });
    var sel = document.getElementById('shotTab');
    if (sel) sel.value = id;
    tab = id;
    try { history.replaceState(null, '', '?tab=' + id); } catch (e) {}
    window.scrollTo({ top: 0 });
  }

  show(tab);

  var root = document.getElementById('shotRoot');
  var sel = document.getElementById('shotTab');
  if (sel) {
    document.querySelectorAll('[data-tab]').forEach(function (a) {
      var id = a.getAttribute('data-tab');
      if (!ids.length || ids.indexOf(id) === -1) return;
      if (sel.querySelector('option[value="' + id + '"]')) return;
      var clone = a.cloneNode(true);
      var cnt = clone.querySelector('.cnt');
      if (cnt) cnt.remove();
      var opt = document.createElement('option');
      opt.value = id;
      opt.textContent = clone.textContent.trim();
      sel.appendChild(opt);
    });
    sel.value = tab;
  }
  var btnOne = document.getElementById('shotOne');
  var btnAll = document.getElementById('shotAll');

  function nextFrame() {
    return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  }

  function download(dataUrl, name) {
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'aiwriter-' + name + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function shoot(name) {
    await document.fonts.ready;
    await nextFrame();
    var url = await window.htmlToImage.toPng(root, {
      pixelRatio: 2,
      backgroundColor: '#F4F7FC',
      width: 1440,
      height: root.offsetHeight,
      skipFonts: false
    });
    download(url, name);
  }

  if (btnOne) {
    btnOne.addEventListener('click', async function () {
      btnOne.disabled = true;
      var old = btnOne.textContent;
      btnOne.textContent = 'در حال ساخت PNG…';
      try { await shoot(tab); } catch (e) { alert('خطا در ساخت تصویر: ' + e.message); }
      btnOne.textContent = old;
      btnOne.disabled = false;
    });
  }

  if (btnAll) {
    btnAll.addEventListener('click', async function () {
      btnAll.disabled = true;
      var old = btnAll.textContent;
      for (var i = 0; i < ids.length; i++) {
        btnAll.textContent = 'در حال ساخت ' + (i + 1) + ' از ' + ids.length + '…';
        show(ids[i]);
        try { await shoot(ids[i]); } catch (e) { /* keep going */ }
        await new Promise(function (r) { setTimeout(r, 600); });
      }
      show(tab);
      btnAll.textContent = old;
      btnAll.disabled = false;
    });
  }

  if (sel) {
    sel.addEventListener('change', function () { show(sel.value); });
  }
})();

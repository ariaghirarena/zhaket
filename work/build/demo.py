"""Builds the static demo site (landing + interactive admin replica) and zips it.

Everything is local: relative URLs, embedded Vazirmatn woff2, data inlined in JS,
so it runs from any cPanel public_html without a build step or network access.
"""
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import out_path

WORK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(WORK, "demo")
PLUGIN_IMG = os.path.join(WORK, "aria-ai-writer", "assets", "img")

TABS = [
    ("text_ai", "هوش مصنوعی تولید محتوا", "content"),
    ("image_ai", "هوش مصنوعی تولید تصویر", "image"),
    ("dashboard", "داشبورد", "dashboard", "نمای کلی"),
    ("review", "صف بازبینی", "review", "نمای کلی"),
    ("strategy", "تحلیل هوشمند سایت", "wand", "نمای کلی"),
    ("timeline", "خط زمانی", "calendar", "نمای کلی"),
    ("activity", "فعالیت زنده", "activity", "نمای کلی"),
    ("topics", "موضوعات", "list", "محتوا"),
    ("prompt", "پرامپت", "prompt", "محتوا"),
    ("content", "ساختار محتوا", "content", "محتوا"),
    ("seo", "سئو و انتشار", "seo", "محتوا"),
    ("images", "تنظیمات تصاویر", "image", "محتوا"),
    ("knowledge", "دانش سئو", "book", "محتوا"),
    ("gsc", "سرچ کنسول و ادغام مقالات", "trending", "محتوا"),
    ("ai", "کلیدهای API و مدل‌ها", "key", "زیرساخت"),
    ("subscription", "اکانت اشتراکی", "user", "زیرساخت"),
    ("engines", "موتور هوش مصنوعی روی سرور", "cpu", "زیرساخت"),
    ("schedule", "زمان‌بندی", "clock", "زیرساخت"),
    ("cloudflare", "کلادفلر", "cloud", "زیرساخت"),
    ("notify", "اعلان‌ها", "bell", "سیستم"),
    ("logs", "گزارش‌ها", "activity", "سیستم"),
    ("tools", "ابزارها", "wrench", "سیستم"),
    ("features", "قابلیت‌ها", "layers", "سیستم"),
    ("license", "لایسنس و حساب", "key", "حساب کاربری"),
]

PROVIDERS = ["OpenAI", "Anthropic Claude", "Google Gemini", "OpenRouter", "Groq", "Mistral",
             "DeepSeek", "xAI Grok", "Together AI", "Fireworks AI", "Perplexity", "Cohere",
             "Cerebras", "DeepInfra", "Moonshot Kimi", "Alibaba Qwen", "Zhipu GLM",
             "AvalAI", "GapGPT", "Cloudflare Workers AI", "Claude Pro"]

CSS = """/* ARIAGH.AIWRITER — demo/site styles (self-contained, RTL) */
@font-face{font-family:Vazirmatn;src:url("ASSETPREFIXfonts/Vazirmatn-Variable.woff2") format("woff2-variations");font-weight:100 900;font-display:swap}
:root{
  --navy:#0B1B3F;--deep:#060E25;--royal:#1D4ED8;--sky:#38BDF8;--ice:#EEF5FF;
  --muted:#8AA3CC;--text:#E8F0FF;--line:rgba(255,255,255,.10);--card:rgba(255,255,255,.055);
  --mint:#2ECE9F;--amber:#FAC049;--radius:18px;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:Vazirmatn,system-ui,Tahoma,sans-serif;background:var(--deep);color:var(--text);
  line-height:1.8;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
h1,h2,h3,h4{margin:0;line-height:1.5;font-weight:800}
p{margin:0}
.wrap{width:min(1120px,92vw);margin-inline:auto}
.bg{position:fixed;inset:0;z-index:-2;background:
  radial-gradient(900px 500px at 85% -8%,rgba(56,189,248,.22),transparent 65%),
  radial-gradient(900px 600px at 5% 105%,rgba(29,78,216,.35),transparent 60%),
  linear-gradient(180deg,#060E25 0%,#0B1B3F 55%,#0A234F 100%)}
.bg:after{content:"";position:absolute;inset:0;opacity:.5;background-image:
  linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:56px 56px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.muted{color:var(--muted)}
.sky{color:var(--sky)}
.center{text-align:center}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.8rem 1.5rem;border-radius:999px;
  font-weight:700;border:1px solid transparent;cursor:pointer;font-size:.98rem;font-family:inherit}
.btn-primary{background:linear-gradient(180deg,#2E63F0,#1D4ED8);color:#fff;
  box-shadow:0 14px 30px -12px rgba(29,78,216,.9)}
.btn-ghost{background:rgba(255,255,255,.07);border-color:var(--line);color:var(--text)}
.chips{display:flex;flex-wrap:wrap;gap:.5rem}
.chip{display:inline-flex;align-items:center;gap:.45rem;padding:.4rem .85rem;border-radius:999px;
  background:rgba(255,255,255,.06);border:1px solid var(--line);font-size:.86rem;color:#D7E4FF}
.dot{width:8px;height:8px;border-radius:50%;background:var(--sky);box-shadow:0 0 12px var(--sky)}
/* ---------- landing ---------- */
header.site{display:flex;align-items:center;justify-content:space-between;padding:1.6rem 0}
header.site img{height:34px}
nav.site a{font-size:.92rem;color:#C8D8F6;margin-inline-start:1.4rem}
.hero{padding:3.2rem 0 4rem;text-align:center}
.hero h1{font-size:clamp(2rem,4.6vw,3.4rem);font-weight:900}
.hero .lead{margin:1rem auto 0;max-width:44rem;font-size:clamp(1rem,1.6vw,1.15rem);color:#CBD9F5}
.hero .cta{display:flex;gap:.8rem;justify-content:center;margin-top:2rem;flex-wrap:wrap}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:3rem}
.stat{padding:1.2rem;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.stat b{display:block;font-size:1.9rem;color:var(--sky);font-weight:900}
.stat span{font-size:.85rem;color:var(--muted)}
section{padding:3rem 0}
section h2{font-size:clamp(1.4rem,2.6vw,2rem);margin-bottom:.6rem}
section .sub{color:var(--muted);font-size:.98rem;margin-bottom:1.8rem}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
.tile{padding:1.3rem;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.tile h3{font-size:1.05rem;margin-bottom:.35rem}
.tile p{font-size:.88rem;color:var(--muted);line-height:1.9}
.tile .num{display:inline-flex;width:34px;height:34px;border-radius:11px;align-items:center;
  justify-content:center;background:rgba(56,189,248,.14);color:var(--sky);font-weight:800;
  font-size:.9rem;margin-bottom:.7rem}
.fgroup{display:flex;justify-content:space-between;gap:.5rem;padding:.7rem .95rem;border-radius:12px;
  background:rgba(255,255,255,.045);border:1px solid var(--line);font-size:.9rem}
.fgroup span{color:var(--muted);font-size:.82rem}
footer.site{padding:2.4rem 0 3rem;border-top:1px solid var(--line);margin-top:2rem;
  color:var(--muted);font-size:.86rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
@media(max-width:860px){.stats,.grid4,.grid3,.grid2{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.stats,.grid4,.grid3,.grid2{grid-template-columns:1fr}
  nav.site{display:none}}
"""

DEMO_CSS = """/* admin replica */
body.demo{overflow:hidden}
.app{display:grid;grid-template-columns:262px 1fr;height:100vh}
.side{background:rgba(6,14,37,.72);border-inline-start:1px solid var(--line);
  display:flex;flex-direction:column;overflow:hidden}
.side .brand{display:flex;align-items:center;gap:.6rem;padding:1.1rem 1.1rem;border-bottom:1px solid var(--line)}
.side .brand img{height:26px}
.side .brand small{font-size:.68rem;color:var(--muted);display:block}
.side nav{overflow-y:auto;padding:.7rem .6rem 1.5rem;flex:1;scrollbar-width:thin}
.side .grp{font-size:.68rem;color:#6E86AE;letter-spacing:.04em;margin:1rem .7rem .4rem}
.side button{display:flex;align-items:center;gap:.55rem;width:100%;text-align:start;
  background:transparent;border:0;color:#CBD9F5;font-family:inherit;font-size:.86rem;
  padding:.55rem .7rem;border-radius:10px;cursor:pointer;transition:.15s}
.side button:hover{background:rgba(255,255,255,.06);color:#fff}
.side button.on{background:linear-gradient(90deg,rgba(29,78,216,.55),rgba(56,189,248,.18));
  color:#fff;box-shadow:inset 0 0 0 1px rgba(56,189,248,.35)}
.side button i{width:16px;height:16px;opacity:.85;flex:0 0 16px}
.main{overflow-y:auto;padding:1.4rem 1.6rem 3rem}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;
  padding-bottom:1rem;border-bottom:1px solid var(--line);margin-bottom:1.4rem}
.topbar h1{font-size:1.25rem}
.topbar .crumbs{font-size:.78rem;color:var(--muted)}
.pillbadge{display:inline-flex;align-items:center;gap:.4rem;padding:.3rem .8rem;border-radius:999px;
  background:rgba(46,206,159,.14);border:1px solid rgba(46,206,159,.35);color:#8BF0CE;font-size:.76rem}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.9rem;margin-bottom:1.2rem}
.kpi{padding:1rem 1.1rem;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.kpi b{display:block;font-size:1.55rem;font-weight:900}
.kpi span{font-size:.78rem;color:var(--muted)}
.kpi small{float:left;font-size:.72rem;color:var(--mint)}
.panel{padding:1.1rem;border-radius:16px;background:var(--card);border:1px solid var(--line);margin-bottom:1.1rem}
.panel h2{font-size:.98rem;margin-bottom:.9rem}
.bars{display:flex;align-items:flex-end;gap:.5rem;height:130px}
.bars i{flex:1;border-radius:8px 8px 4px 4px;
  background:linear-gradient(180deg,var(--sky),rgba(29,78,216,.55));min-height:6px}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th,td{text-align:start;padding:.6rem .4rem;border-bottom:1px solid var(--line)}
th{color:var(--muted);font-weight:600;font-size:.78rem}
.tag{font-size:.72rem;padding:.2rem .55rem;border-radius:8px;background:rgba(56,189,248,.14);color:var(--sky)}
.tag.ok{background:rgba(46,206,159,.16);color:#8BF0CE}
.tag.warn{background:rgba(250,192,73,.16);color:#FFD98A}
.search{display:flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.06);
  border:1px solid var(--line);border-radius:12px;padding:.6rem .9rem;margin-bottom:1rem}
.search input{background:transparent;border:0;outline:0;color:var(--text);font-family:inherit;
  font-size:.9rem;width:100%}
.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.9rem}
.fcard{padding:1rem;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid var(--line)}
.fcard h3{font-size:.92rem;margin-bottom:.2rem;display:flex;justify-content:space-between;gap:.5rem}
.fcard h3 span{font-size:.72rem;color:var(--sky);font-weight:600}
.fcard ol{margin:.6rem 0 0;padding-inline-start:1.1rem;font-size:.8rem;color:#C6D5F2;line-height:1.95}
.providers{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.7rem}
.prov{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.6rem .85rem;
  border-radius:12px;background:rgba(255,255,255,.045);border:1px solid var(--line);font-size:.84rem}
.view{display:none}
.view.on{display:block;animation:fade .25s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.notice{font-size:.78rem;color:var(--muted);margin-top:.4rem}
@media(max-width:900px){.app{grid-template-columns:1fr}.side{display:none}}
"""

JS = """(function(){
  var data = __FEATURES__;
  var tabs = document.querySelectorAll('.side button[data-view]');
  var views = document.querySelectorAll('.view');
  var title = document.getElementById('view-title');
  var crumb = document.getElementById('view-crumb');
  function show(id, name, group){
    views.forEach(function(v){ v.classList.toggle('on', v.id === 'v-' + id); });
    tabs.forEach(function(b){ b.classList.toggle('on', b.dataset.view === id); });
    if (name) { title.textContent = name; crumb.textContent = group || ''; }
    document.querySelector('.main').scrollTop = 0;
  }
  tabs.forEach(function(b){
    b.addEventListener('click', function(){
      show(b.dataset.view, b.dataset.name, b.dataset.group);
      if (location.hash !== '#' + b.dataset.view) history.replaceState(null, '', '#' + b.dataset.view);
    });
  });
  // deep link
  var h = location.hash.replace('#','');
  if (h) { var b = document.querySelector('.side button[data-view="'+h+'"]');
    if (b) show(h, b.dataset.name, b.dataset.group); } else { show('dashboard'); }

  // feature catalogue
  var host = document.getElementById('feature-host');
  var count = document.getElementById('feature-count');
  function render(q){
    var needle = (q || '').trim();
    var html = '', total = 0;
    data.forEach(function(g){
      var items = g.items.filter(function(it){ return !needle || it.indexOf(needle) > -1; });
      if (!items.length) return;
      total += items.length;
      html += '<div class="fcard"><h3>' + g.title + '<span>' + items.length + ' مورد</span></h3><ol>';
      items.slice(0, 24).forEach(function(it){ html += '<li>' + it + '</li>'; });
      if (items.length > 24) html += '<li class="muted">و ' + (items.length - 24) + ' مورد دیگر…</li>';
      html += '</ol></div>';
    });
    host.innerHTML = html || '<p class="muted">موردی پیدا نشد.</p>';
    if (count) count.textContent = total + ' قابلیت';
  }
  var input = document.getElementById('feature-search');
  if (input) { input.addEventListener('input', function(){ render(input.value); }); render(''); }

  // queue rows: approve button
  document.querySelectorAll('[data-approve]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var row = btn.closest('tr');
      row.querySelector('.state').innerHTML = '<span class="tag ok">تأیید شد</span>';
      btn.remove();
    });
  });
  // provider chips
  var pv = document.getElementById('provider-host');
  if (pv) { pv.innerHTML = __PROVIDERS__.map(function(n){
      return '<div class="prov"><span>' + n + '</span><span class="dot"></span></div>'; }).join(''); }
  // bars
  document.querySelectorAll('.bars').forEach(function(bar){
    var vals = (bar.dataset.values || '').split(',').map(Number);
    bar.innerHTML = vals.map(function(v){ return '<i style="height:' + v + '%"></i>'; }).join('');
  });
})();
"""

ICONS = {
    "content": '<path d="M4 3h10l4 4v14H4z"/><path d="M7 9h8M7 13h8M7 17h5"/>',
    "image": '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    "dashboard": '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
    "review": '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
    "wand": '<path d="M15 4l1.5 3L20 8.5 16.5 10 15 13l-1.5-3L10 8.5 13.5 7z"/><path d="M6 14l2 2"/><path d="M4 20l8-8"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "activity": '<path d="M3 12h4l2 5 3-10 2 5h5"/>',
    "list": '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    "prompt": '<path d="M4 6h16M4 6v12h16V6"/><path d="M8 11h8M8 14h5"/>',
    "seo": '<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/>',
    "book": '<path d="M4 4h7v16H4zM13 4h7v16h-7z"/>',
    "trending": '<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
    "key": '<circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>',
    "cpu": '<rect x="7" y="7" width="10" height="10" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "cloud": '<path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11-1 3.5 3.5 0 0 0 1 9z"/>',
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    "wrench": '<path d="M15 6a4 4 0 1 0 3 6l-9 9-3-3 9-9a4 4 0 0 1 0-3z"/>',
    "layers": '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
}


def icon(name, size=18):
    body = ICONS.get(name, ICONS["dashboard"])
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            f'stroke-linejoin="round">{body}</svg>')


def landing(groups):
    total = sum(len(g["items"]) for g in groups)
    steps = [("۱", "تحلیل هوشمند سایت", "خزش سایت، محصولات و رقبا و ساخت استراتژی محتوا بر پایه کلمات کلیدی."),
             ("۲", "تولید مقاله", "مقاله ساختاریافته با متا، اسکیما، فهرست مطالب، لینک داخلی و تصویر شاخص."),
             ("۳", "سئو و انتشار", "کنترل سئو، صف بازبینی، اصلاح خودکار و انتشار زمان‌بندی‌شده در وردپرس.")]
    providers_html = "".join(
        f'<div class="prov"><span>{p}</span><span class="dot"></span></div>' for p in PROVIDERS)
    groups_html = "".join(
        f'<div class="fgroup"><b>{g["title"]}</b><span>{len(g["items"])} قابلیت</span></div>'
        for g in groups)
    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ARIAGH.AIWRITER — نویسنده هوشمند سئو برای وردپرس</title>
<meta name="description" content="افزونه وردپرس ARIAGH.AIWRITER: تحلیل هوشمند سایت، تولید خودکار مقاله سئوشده با ۲۱ پرووایدر هوش مصنوعی، ساخت تصویر شاخص، صف بازبینی و انتشار زمان‌بندی‌شده.">
<link rel="icon" href="assets/img/mark.svg">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<div class="bg"></div>
<div class="wrap">
  <header class="site">
    <img src="assets/img/logo-white.svg" alt="ARIAGH.AIWRITER">
    <nav class="site">
      <a href="#features">قابلیت‌ها</a>
      <a href="#providers">پرووایدرها</a>
      <a href="#how">چطور کار می‌کند</a>
      <a href="demo/">دموی پیشخوان</a>
    </nav>
  </header>

  <div class="hero">
    <h1>نویسنده هوشمند سئو برای وردپرس</h1>
    <p class="lead">از تحلیل سایت و رقبا تا تولید مقاله، ساخت تصویر شاخص، کنترل سئو و انتشار
      زمان‌بندی‌شده — همه از پیشخوان وردپرس، بدون یک خط کد.</p>
    <div class="cta">
      <a class="btn btn-primary" href="demo/">ورود به دموی پیشخوان</a>
      <a class="btn btn-ghost" href="#features">مشاهده {total} قابلیت</a>
    </div>
    <div class="stats">
      <div class="stat"><b>۵۰۰</b><span>قابلیت پیاده‌شده</span></div>
      <div class="stat"><b>۲۱</b><span>پرووایدر هوش مصنوعی</span></div>
      <div class="stat"><b>۲۴</b><span>تب مدیریتی</span></div>
      <div class="stat"><b>۱۰</b><span>زبان خروجی</span></div>
    </div>
  </div>

  <section id="how">
    <h2>چرخهٔ کامل محتوا در چهار گام</h2>
    <p class="sub">افزونه کارهایی را که معمولاً به تیم محتوا سپرده می‌شود، خودکار انجام می‌دهد.</p>
    <div class="grid3">
      {"".join(f'<div class="tile"><span class="num">{n}</span><h3>{t}</h3><p>{d}</p></div>' for n, t, d in steps)}
    </div>
  </section>

  <section id="features">
    <h2>{total} قابلیت در ۱۷ گروه</h2>
    <p class="sub">همراه با ۲۱ پرووایدر آماده، ۱۵ متغیر پرامپت، ۱۰ زبان و ۱۰ لحن نگارش.</p>
    <div class="grid3">{groups_html}</div>
  </section>

  <section id="providers">
    <h2>پرووایدر دلخواه شما</h2>
    <p class="sub">کلید API خودتان، اکانت اشتراکی Claude یا ChatGPT، یا مدل محلی روی سرور خودتان.</p>
    <div class="providers">{providers_html}</div>
  </section>

  <section>
    <h2>چه چیزی لازم دارید؟</h2>
    <p class="sub">وردپرس ۵.۸ یا بالاتر و PHP ۷.۴ یا بالاتر. ووکامرس و المنتور اختیاری هستند.</p>
    <div class="grid3">
      <div class="tile"><h3>کلادفلر رایگان</h3><p>استقرار یک‌کلیکی ورکر و اجرای زمان‌بندی‌شده روی پلن رایگان کلادفلر.</p></div>
      <div class="tile"><h3>GitHub Actions</h3><p>اجرای کارها از طریق مخزن گیت‌هاب، بدون نیاز به سرور اختصاصی.</p></div>
      <div class="tile"><h3>مستقیم روی سرور</h3><p>نصب یک‌کلیکی Codex یا Claude Code روی همان هاست وردپرس شما.</p></div>
    </div>
  </section>

  <footer class="site">
    <span>ARIAGH.AIWRITER — نسخه ۱.۹.۲ · GPLv2 · پشتیبانی فارسی</span>
    <span>این صفحه یک پیش‌نمایش استاتیک است؛ هیچ درخواستی به سرور ارسال نمی‌شود.</span>
  </footer>
</div>
</body>
</html>
"""


def demo_page(groups, total):
    side = ""
    last_group = None
    for t in TABS:
        tid, name, ic = t[0], t[1], t[2]
        grp = t[3] if len(t) > 3 else ""
        if grp != last_group and grp:
            side += f'<div class="grp">{grp}</div>'
            last_group = grp
        side += (f'<button data-view="{tid}" data-name="{name}" data-group="{grp}">'
                 f'<i>{icon(ic, 16)}</i>{name}</button>')

    kpis = [("۱۲۴", "مقاله منتشرشده", "+۹ امروز"), ("۳۸", "در صف بازبینی", "۵ جدید"),
            ("۹۶٪", "میانگین امتیاز سئو", "+۲"), ("۲٫۴M", "کلمات تولیدشده", "این ماه")]

    rows = [("راهنمای خرید لپ‌تاپ گیمینگ", "مقایسه و راهنما", "در انتظار تأیید", "warn"),
            ("بهترین هاست وردپرس ۲۰۲۶", "میزبانی", "در انتظار تأیید", "warn"),
            ("چطور سرعت سایت را بالا ببریم", "سرعت", "آماده انتشار", "")]
    queue = "".join(
        f'<tr><td>{t}</td><td><span class="tag">{c}</span></td>'
        f'<td class="state"><span class="tag {cls}">{s}</span></td>'
        f'<td><button class="btn btn-ghost" data-approve style="padding:.25rem .8rem;font-size:.76rem">تأیید</button></td></tr>'
        for t, c, s, cls in rows)

    logs = [("۱۰:۴۲", "استراتژی محتوا با ۲۴ موضوع ساخته شد", "ok"),
            ("۱۰:۳۸", "مقاله «راهنمای خرید لپ‌تاپ» تولید شد", "ok"),
            ("۱۰:۳۵", "تصویر شاخص از طریق Workers AI ساخته شد", "ok"),
            ("۱۰:۳۱", "اجرای زمان‌بندی‌شده روی کلادفلر آغاز شد", ""),
            ("۱۰:۲۹", "پرووایدر پشتیبان به‌صورت خودکار فعال شد", "warn")]
    logs_html = "".join(f'<tr><td>{t}</td><td>{m}</td><td><span class="tag {c}">'
                        f'{"موفق" if c == "ok" else ("هشدار" if c == "warn" else "در حال اجرا")}</span></td></tr>'
                        for t, m, c in logs)
    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>دموی پیشخوان — ARIAGH.AIWRITER</title>
<link rel="icon" href="../assets/img/mark.svg">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/demo.css">
</head>
<body class="demo">
<div class="bg"></div>
<div class="app">
  <aside class="side">
    <div class="brand">
      <img src="../assets/img/logo-white.svg" alt="ARIAGH.AIWRITER">
      <div><small>نسخه ۱.۹.۲</small></div>
    </div>
    <nav>{side}</nav>
  </aside>
  <main class="main">
    <div class="topbar">
      <div>
        <h1 id="view-title">داشبورد</h1>
        <div class="crumbs">AIWRITER / <span id="view-crumb">نمای کلی</span></div>
      </div>
      <div style="display:flex;gap:.6rem;align-items:center">
        <span class="pillbadge">لایسنس فعال · نامحدود</span>
        <span class="chip"><span class="dot"></span>کلادفلر متصل</span>
      </div>
    </div>

    <section class="view on" id="v-dashboard">
      <div class="kpis">
        {"".join(f'<div class="kpi"><small>{d}</small><b class="sky">{v}</b><span>{l}</span></div>' for v, l, d in kpis)}
      </div>
      <div class="panel">
        <h2>تولید محتوا در ۱۰ روز گذشته</h2>
        <div class="bars" data-values="22,35,28,48,40,62,55,78,68,92,74,100"></div>
      </div>
      <div class="panel">
        <h2>صف بازبینی</h2>
        <table><thead><tr><th>عنوان</th><th>دسته</th><th>وضعیت</th><th></th></tr></thead>
        <tbody>{queue}</tbody></table>
      </div>
    </section>

    <section class="view" id="v-features">
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input id="feature-search" placeholder="جستجو در {total} قابلیت…">
      </div>
      <p class="notice" id="feature-count"></p>
      <div class="fgrid" id="feature-host"></div>
    </section>

    <section class="view" id="v-ai">
      <h2 style="font-size:1rem;margin-bottom:.8rem">پرووایدرهای آماده</h2>
      <p class="sub" style="margin-bottom:1rem">۲۱ پرووایدر داخلی + پرووایدر شخصی با Base URL دلخواه.</p>
      <div class="providers" id="provider-host"></div>
    </section>

    <section class="view" id="v-review">
      <div class="panel">
        <h2>۳ مقاله در انتظار تأیید</h2>
        <table><thead><tr><th>عنوان</th><th>دسته</th><th>وضعیت</th><th></th></tr></thead>
        <tbody>{queue}</tbody></table>
        <p class="notice">در نسخهٔ واقعی، هر ردیف به ویرایشگر مقاله، امتیاز سئو و پیش‌نمایش تصویر شاخص لینک دارد.</p>
      </div>
    </section>

    <section class="view" id="v-logs">
      <div class="panel">
        <h2>آخرین رویدادها</h2>
        <table><thead><tr><th>زمان</th><th>رویداد</th><th>وضعیت</th></tr></thead>
        <tbody>{logs_html}</tbody></table>
      </div>
    </section>

    <section class="view" id="v-license">
      <div class="panel">
        <h2>لایسنس و حساب</h2>
        <p style="font-size:.9rem;color:#C6D5F2">وضعیت: <span class="tag ok">فعال</span></p>
        <p class="notice">این بخش در دمو غیرفعال است؛ در نسخهٔ واقعی کلید لایسنس و دامنهٔ فعال‌شده اینجا نمایش داده می‌شود.</p>
      </div>
    </section>

    <section class="view" id="v-more">
      <div class="panel">
        <h2>این تب در دمو موجود نیست</h2>
        <p class="notice">بقیهٔ ۲۴ تب پیشخوان (تحلیل هوشمند، زمان‌بندی، کلادفلر، اعلان‌ها، ابزارها و…) در نسخهٔ کامل افزونه فعال هستند.</p>
      </div>
    </section>
  </main>
</div>
<script src="../assets/demo.js"></script>
</body>
</html>
"""


def extract_features():
    import re
    src = open(os.path.join(WORK, "aria-ai-writer", "includes", "class-aaw-features.php"),
               encoding="utf-8").read()
    marks = [(m.start(), m.group(1)) for m in re.finditer(r"'title' => '([^']+)'", src)]
    marks.append((len(src), "END"))
    groups = []
    for i in range(len(marks) - 1):
        chunk = src[marks[i][0]:marks[i + 1][0]]
        items = [re.sub(r"^'(.*)',\s*$", r"\1", l).replace("\\'", "'")
                 for l in re.findall(r"^\t+'(?:[^'\\]|\\.)*',\s*$", chunk, re.M)]
        groups.append({"title": marks[i][1], "items": items})
    json.dump(groups, open(os.path.join(SRC, "features.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=0)
    return groups


def build():
    os.makedirs(os.path.join(SRC, "assets", "img"), exist_ok=True)
    os.makedirs(os.path.join(SRC, "demo"), exist_ok=True)
    for f in ("logo-white.svg", "logo.svg", "mark.svg"):
        shutil.copy(os.path.join(PLUGIN_IMG, f), os.path.join(SRC, "assets", "img", f))

    groups = extract_features()
    total = sum(len(g["items"]) for g in groups)

    open(os.path.join(SRC, "assets", "site.css"), "w", encoding="utf-8").write(
        CSS.replace("ASSETPREFIX", ""))
    open(os.path.join(SRC, "assets", "demo.css"), "w", encoding="utf-8").write(DEMO_CSS)
    open(os.path.join(SRC, "index.html"), "w", encoding="utf-8").write(landing(groups))
    open(os.path.join(SRC, "demo", "index.html"), "w", encoding="utf-8").write(
        demo_page(groups, total))

    js = (JS.replace("__FEATURES__", json.dumps(groups, ensure_ascii=False))
            .replace("__PROVIDERS__", json.dumps(PROVIDERS, ensure_ascii=False)))
    open(os.path.join(SRC, "assets", "demo.js"), "w", encoding="utf-8").write(js)

    # unknown tabs fall back to the "more" view
    js2 = js.replace("var views = document.querySelectorAll('.view');",
                     "var views = document.querySelectorAll('.view');\n"
                     "  var known = new Set([].map.call(views, function(v){return v.id.replace('v-','');}));")
    js2 = js2.replace("views.forEach(function(v){ v.classList.toggle('on', v.id === 'v-' + id); });",
                      "var target = known.has(id) ? id : 'more';\n"
                      "    views.forEach(function(v){ v.classList.toggle('on', v.id === 'v-' + target); });")
    open(os.path.join(SRC, "assets", "demo.js"), "w", encoding="utf-8").write(js2)

    out_zip = out_path("04-demo", "aria-aiwriter-demo.zip")
    if os.path.exists(out_zip):
        os.remove(out_zip)
    subprocess.run(["zip", "-rq", out_zip, "index.html", "demo", "assets"],
                   cwd=SRC, check=True)
    return out_zip


if __name__ == "__main__":
    print(build())

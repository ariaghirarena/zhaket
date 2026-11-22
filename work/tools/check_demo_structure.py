#!/usr/bin/env python3
"""Assert the demo's 24 panels match class-aaw-admin.php::tabs() and the view cards."""
import json, re, sys, pathlib

html = pathlib.Path("work/site/demo/index.html").read_text(encoding="utf-8")
real = json.loads(pathlib.Path("work/qa/views.json").read_text())

ORDER = ["text_ai", "image_ai", "dashboard", "review", "strategy", "timeline", "activity",
         "topics", "prompt", "content", "seo", "images", "knowledge", "gsc", "ai",
         "subscription", "engines", "schedule", "cloudflare", "notify", "logs", "tools",
         "features", "license"]
LABEL = {"text_ai": "هوش مصنوعی تولید محتوا", "image_ai": "هوش مصنوعی تولید تصویر"}

body = html[html.index("<!-- SHELL:START -->"):html.index("<!-- SHELL:END -->")]
nav = body[body.index('<nav class="wpmenu"'):body.index("</nav>")]
links = re.findall(r'data-tab="([a-z_]+)"[^>]*>(?:<svg.*?</svg>)?([^<]+)', nav, flags=re.S)

panels = {}
for p in re.split(r'<section class="panel', body)[1:]:
    pid = re.search(r'id="p-([a-z_]+)"', p).group(1)
    t = re.search(r'<h1 class="panel-title">(.*?)</h1>', p).group(1)
    sub = re.search(r'<p class="panel-sub">(.*?)</p>', p).group(1)
    cards = [re.sub(r"\s+", " ", re.sub("<[^>]+>", "", re.sub(r'<span class="sub">.*?</span>', "", h, flags=re.S))).strip()
             for h in re.findall(r'<div class="card-h">(.*?)</div>', p, flags=re.S)]
    panels[pid] = (t, sub, cards)

errs = []
if [p for p, _ in links] != ORDER:
    errs.append(f"sidebar order: {[p for p, _ in links]}")
for tab in ORDER:
    if tab not in panels:
        errs.append(f"missing panel {tab}")
        continue
    t, sub, cards = panels[tab]
    rh, rsub = (real[tab]["head"] or [None, None])[:2]
    if t != rh:
        errs.append(f"{tab}: title '{t}' != '{rh}'")
    if tab == "features":
        if not (sub or "").endswith("قابلیت پیاده‌سازی‌شده در افزونه و ورکر"):
            errs.append(f"{tab}: subtitle differs")
    elif (sub or "").strip() != (rsub or "").strip():
        errs.append(f"{tab}: subtitle differs ({sub!r} != {rsub!r})")
    rcards = [c[0] for c in real[tab]["cards"]]
    missing = [c for c in rcards if c not in cards]
    extra = [c for c in cards if c not in rcards]
    if missing:
        errs.append(f"{tab}: missing cards {missing}")
    if extra:
        print(f"  note {tab}: extra (demo-only) cards {extra}")

print(f"panels: {len(panels)} | sidebar links: {len(links)}")
if errs:
    print("FAIL")
    for e in errs:
        print("  -", e)
    sys.exit(1)
print("PASS — titles, subtitles and every source card title match the plugin")

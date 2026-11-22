#!/usr/bin/env python3
"""Build work/site/shots/index.html — a 1440px screenshot studio derived from the demo page.

The page is generated (never hand-edited) from work/site/demo/index.html so the
captures always match the shipped demo 1:1.
"""
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"
SRC = SITE / "demo" / "index.html"
OUT_DIR = SITE / "shots"
OUT = OUT_DIR / "index.html"

TOOLBAR = """<div class="toolbar">
  <b>استودیوی اسکرین‌شات</b>
  <span class="hint">۱۴۴۰px · PNG با کیفیت ۲×</span>
  <span class="sp"></span>
  <select id="shotTab" aria-label="انتخاب تب"></select>
  <button type="button" id="shotOne" class="primary">دانلود این تب</button>
  <button type="button" id="shotAll">دانلود هر ۲۲ تب</button>
  <a class="back" href="../demo/">بازگشت به دمو</a>
</div>

"""


def die(msg: str) -> None:
    print("FAIL:", msg)
    sys.exit(1)


html = SRC.read_text(encoding="utf-8")

# 1) stylesheet + title
if '<link rel="stylesheet" href="../assets/css/admin.css">' not in html:
    die("admin.css link not found")
html = html.replace(
    '<link rel="stylesheet" href="../assets/css/admin.css">',
    '<link rel="stylesheet" href="../assets/css/admin.css">\n'
    '<link rel="stylesheet" href="../assets/css/shots.css">',
    1,
)
html = re.sub(r"<title>.*?</title>",
              "<title>استودیوی اسکرین‌شات پیشخوان — ARIAGH.AIWRITER</title>",
              html, count=1, flags=re.S)

# 2) body class
html = html.replace('<body class="admin">', '<body class="admin shots">', 1)

# 3) drop the demo bar (not part of the admin UI)
html, n = re.subn(r"\n<div class=\"demo-bar\">.*?</div>\n", "\n", html, count=1, flags=re.S)
if n != 1:
    die("demo-bar block not found")

# 4) toolbar outside the capture root, then open the capture root
html = html.replace('<div class="wpbar">', TOOLBAR + '<div id="shotRoot">\n<div class="wpbar">', 1)

# 5) close the capture root just before the toast
if '<div class="toast" id="toast"></div>' not in html:
    die("toast anchor not found")
html = html.replace('<div class="toast" id="toast"></div>',
                    '</div>\n<!--/shotRoot-->\n\n<div class="toast" id="toast"></div>', 1)

# 6) scripts
if '<script src="../assets/js/admin.js"></script>' not in html:
    die("admin.js script not found")
html = html.replace(
    '<script src="../assets/js/admin.js"></script>',
    '<script src="../assets/js/admin.js"></script>\n'
    '<script src="../assets/js/vendor-html-to-image.js"></script>\n'
    '<script src="../assets/js/shots.js"></script>',
    1,
)

# --- assertions -------------------------------------------------------------
checks = [
    ('shots.css', "shots.css" in html),
    ('body shots', '<body class="admin shots">' in html),
    ('no demo-bar', 'demo-bar' not in html),
    ('shotRoot open/close', html.count('<div id="shotRoot">') == 1 and '<!--/shotRoot-->' in html),
    ('vendor script', 'vendor-html-to-image.js' in html),
    ('shots script', 'shots.js' in html),
    ('panels', html.count('class="panel') >= 22),
    ('tabs', len(set(re.findall(r'data-tab="([a-z-]+)"', html))) == 22),
]
for name, ok in checks:
    if not ok:
        die(f"assertion {name}")

# tag balance on div/section/main/nav (cheap sanity)
for tag in ("div", "section", "main", "nav", "aside"):
    o = len(re.findall(rf"<{tag}[\s>]", html))
    c = html.count(f"</{tag}>")
    if o != c:
        die(f"unbalanced <{tag}>: {o} open / {c} close")
    print(f"  <{tag}> {o}/{c}")

OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT.relative_to(SITE.parent.parent)} ({len(html):,} bytes)")

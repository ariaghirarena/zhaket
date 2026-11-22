#!/usr/bin/env python3
"""Pack work/site into the cPanel-ready static demo zip.

Excludes the owner-only screenshot studio (shots/) and any build leftovers.
Uses zipfile in UTF-8 so Persian filenames survive.
"""
import os
import sys
import zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"
DEST = Path(__file__).resolve().parent.parent.parent / "deliverables" / "04-demo" / "aria-aiwriter-demo.zip"
SKIP_DIRS = {"shots", "__pycache__"}
SKIP_FILES = {
    ".DS_Store",
    "vendor-html-to-image.js",   # owner-only screenshot studio
    "shots.js",
    "shots.css",
}
SKIP_EXT = {".map"}

# only ship the 3D art the pages actually reference
used3d = set()
for page in SITE.rglob("*.html"):
    used3d |= set(__import__("re").findall(r"assets/3d/([A-Za-z0-9._-]+\.webp)", page.read_text(encoding="utf-8")))
print("referenced 3D assets:", len(used3d))

sources = []
for root, dirs, files in os.walk(SITE):
    dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
    for f in sorted(files):
        if f in SKIP_FILES or Path(f).suffix in SKIP_EXT:
            continue
        p = Path(root) / f
        if p.parent.name == "3d" and f not in used3d:
            continue
        sources.append(p)

required = [
    SITE / "index.html",
    SITE / "demo" / "index.html",
    SITE / ".htaccess",
    SITE / "README.txt",
    SITE / "assets" / "css" / "base.css",
    SITE / "assets" / "css" / "site.css",
    SITE / "assets" / "css" / "admin.css",
    SITE / "assets" / "js" / "site.js",
    SITE / "assets" / "js" / "admin.js",
]
missing = [str(p.relative_to(SITE)) for p in required if not p.exists()]
if missing:
    print("FAIL missing:", missing)
    sys.exit(1)

DEST.parent.mkdir(parents=True, exist_ok=True)
if DEST.exists():
    DEST.unlink()

with zipfile.ZipFile(DEST, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in sources:
        z.write(p, p.relative_to(SITE).as_posix())

size_kb = DEST.stat().st_size / 1024
with zipfile.ZipFile(DEST) as z:
    names = z.namelist()
print(f"{DEST.relative_to(DEST.parents[2])}: {len(names)} files, {size_kb:,.0f} KB")
for must in (".htaccess", "README.txt", "index.html", "demo/index.html"):
    print(("  ok   " if must in names else "  MISS ") + must)
print("  shots/ excluded:", not any(n.startswith("shots/") for n in names))

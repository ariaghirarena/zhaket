"""Builds the final Zhaket upload package and validates every rule we can test.

    python build/package.py [--plugin /path/to/customer.zip]

Layout (per the official Zhaket rules):
    plugin/aria-ai-writer.zip
    documents/aria-ai-writer-guide.html
    help.pdf
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

WORK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(WORK)
DEL = os.path.join(ROOT, "deliverables")
SRC_PLUGIN = os.path.join(WORK, "aria-ai-writer")
SLUG = "aria-ai-writer"

JUNK = ("__MACOSX", ".DS_Store", ".git", "New Folder", "Thumbs.db", "desktop.ini")


def is_ascii(s: str) -> bool:
    try:
        s.encode("ascii")
        return True
    except UnicodeEncodeError:
        return False


def build_plugin_zip(out_path: str, src: str = SRC_PLUGIN) -> str:
    stage = tempfile.mkdtemp()
    dst = os.path.join(stage, SLUG)
    shutil.copytree(src, dst)
    # strip junk
    for base, dirs, files in os.walk(dst, topdown=True):
        for d in list(dirs):
            if d in JUNK:
                shutil.rmtree(os.path.join(base, d), ignore_errors=True)
                dirs.remove(d)
        for f in files:
            if f in JUNK:
                os.remove(os.path.join(base, f))
    if os.path.exists(out_path):
        os.remove(out_path)
    subprocess.run(["zip", "-rq", "-X", out_path, SLUG], cwd=stage, check=True)
    shutil.rmtree(stage, ignore_errors=True)
    return out_path


def validate_zip(path: str, expect_plugin_root: str | None = None, label=""):
    problems = []
    with zipfile.ZipFile(path) as z:
        bad = z.testzip()
        if bad:
            problems.append(f"{label}: corrupt entry {bad}")
        names = z.namelist()
        for n in names:
            if not is_ascii(n):
                problems.append(f"{label}: non-ASCII path {n!r}")
            if any(j in n for j in JUNK):
                problems.append(f"{label}: junk entry {n!r}")
        if expect_plugin_root:
            if not any(n == f"{expect_plugin_root}/{expect_plugin_root}.php" for n in names):
                problems.append(f"{label}: missing {expect_plugin_root}/{expect_plugin_root}.php")
        return names, problems


def write_guide_html(out_path: str):
    sys.path.insert(0, os.path.join(WORK, "build"))
    import guide as g

    html = g.HTML_TEMPLATE
    # the packaged document must not depend on any external file
    html = html.replace(
        '@font-face{font-family:Vazirmatn;src:url("assets/fonts/Vazirmatn-Variable.woff2") '
        'format("woff2-variations");font-weight:100 900;font-display:swap}', "")
    html = html.replace("font-family:Vazirmatn,Tahoma,sans-serif",
                        "font-family:Vazirmatn,Tahoma,'Segoe UI',sans-serif")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf-8").write(html)
    return out_path


def build(plugin_source: str | None = None) -> dict:
    pkg_dir = os.path.join(DEL, "08-package")
    os.makedirs(pkg_dir, exist_ok=True)

    plugin_zip = os.path.join(pkg_dir, f"{SLUG}.zip")
    if plugin_source:
        shutil.copy(plugin_source, plugin_zip)
    else:
        build_plugin_zip(plugin_zip)

    guide_html = write_guide_html(os.path.join(pkg_dir, "documents", f"{SLUG}-guide.html"))
    help_pdf = os.path.join(DEL, "06-guide", "help.pdf")

    stage = tempfile.mkdtemp()
    os.makedirs(os.path.join(stage, "plugin"))
    os.makedirs(os.path.join(stage, "documents"))
    shutil.copy(plugin_zip, os.path.join(stage, "plugin", f"{SLUG}.zip"))
    shutil.copy(guide_html, os.path.join(stage, "documents", f"{SLUG}-guide.html"))
    shutil.copy(help_pdf, os.path.join(stage, "help.pdf"))

    final = os.path.join(pkg_dir, "aria-aiwriter-zhaket-package.zip")
    if os.path.exists(final):
        os.remove(final)
    subprocess.run(["zip", "-rq", "-X", final, "plugin", "documents", "help.pdf"],
                   cwd=stage, check=True)
    shutil.rmtree(stage, ignore_errors=True)

    # ---- validation
    names, problems = validate_zip(final, label="package")
    inner = os.path.join(pkg_dir, f"{SLUG}.zip")
    inames, iproblems = validate_zip(inner, expect_plugin_root=SLUG, label="plugin")
    problems += iproblems

    report = {
        "package": final,
        "package_size": os.path.getsize(final),
        "plugin": inner,
        "plugin_size": os.path.getsize(inner),
        "entries": len(names),
        "plugin_entries": len(inames),
        "problems": problems,
        "zip_test": subprocess.run(["unzip", "-t", final], capture_output=True, text=True),
    }
    return report


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--plugin", help="use this plugin ZIP instead of building one from work/aria-ai-writer")
    args = ap.parse_args()
    r = build(args.plugin)
    print("package:", r["package"], round(r["package_size"] / 1024), "KB")
    print("plugin :", r["plugin"], round(r["plugin_size"] / 1024), "KB", r["plugin_entries"], "entries")
    print("entries:", r["entries"])
    print("unzip -t:", r["zip_test"].stdout.strip().splitlines()[-1])
    print("problems:", r["problems"] or "none")

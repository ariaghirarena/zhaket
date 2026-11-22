#!/usr/bin/env python3
"""Dump the structural skeleton (head + cards + labels + buttons) of each admin view."""
import re, json, pathlib

V = pathlib.Path("work/backup/extracted/ariagh-aiwriter/plugin/aria-ai-writer/admin/views")

def strip_php(s):
    s = re.sub(r"<\?php.*?\?>", "", s, flags=re.S)
    s = re.sub(r"<\?=.*?\?>", "", s, flags=re.S)
    return s

def args(raw):
    """split a PHP argument list into quoted strings (top level)."""
    out, i, n = [], 0, len(raw)
    while i < n:
        ch = raw[i]
        if ch in "'\"":
            q, j, buf = ch, i + 1, []
            while j < n:
                if raw[j] == "\\":
                    buf.append(raw[j+1]); j += 2; continue
                if raw[j] == q:
                    break
                buf.append(raw[j]); j += 1
            out.append("".join(buf)); i = j + 1
        else:
            i += 1
    return out

views = {}
for f in sorted(V.glob("*.php")):
    src = f.read_text(encoding="utf-8")
    heads = [args(m) for m in re.findall(r"AAW_Admin::head\((.*?)\);", src, flags=re.S)]
    cards = [args(m) for m in re.findall(r"AAW_Admin::card_open\((.*?)\);", src, flags=re.S)]
    html = strip_php(src)
    labels = [t.strip() for t in re.findall(r"<label[^>]*>(.*?)</label>", html, flags=re.S)]
    ths = [t.strip() for t in re.findall(r"<th[^>]*>(.*?)</th>", html, flags=re.S)]
    h3 = [t.strip() for t in re.findall(r"<h3[^>]*>(.*?)</h3>", html, flags=re.S)]
    btns = [t.strip() for t in re.findall(r"<button[^>]*>(.*?)</button>", html, flags=re.S)]
    clean = lambda xs: [re.sub(r"\s+", " ", x) for x in xs if x and not x.startswith("<")]
    views[f.stem] = dict(
        head=heads[0][:2] if heads else None,
        cards=[(c[0], c[1] if len(c) > 1 else "") for c in cards],
        labels=clean(labels), th=clean(ths), h3=clean(h3), buttons=clean(btns)[:8],
    )

pathlib.Path("work/qa").mkdir(exist_ok=True)
pathlib.Path("work/qa/views.json").write_text(json.dumps(views, ensure_ascii=False, indent=1))

for name, v in views.items():
    print(f"\n=== {name} — {v['head']}")
    for c in v['cards']:
        print("   •", c[0], "|", c[1][:80])
    if v['labels']:
        print("   labels:", " · ".join(v['labels'][:12]))

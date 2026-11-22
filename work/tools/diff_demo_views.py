import json, re, pathlib
html = pathlib.Path("work/site/demo/index.html").read_text(encoding="utf-8")
real = json.loads(pathlib.Path("work/qa/views.json").read_text())

panels = re.split(r'<section class="panel', html)[1:]
demo = {}
for p in panels:
    pid = re.search(r'id="p-([a-z_]+)"', p).group(1)
    t = re.search(r'<h1 class="panel-title">(.*?)</h1>', p)
    sub = re.search(r'<p class="panel-sub">(.*?)</p>', p)
    heads = [re.sub(r"\s+", " ", re.sub("<[^>]+>", "", h)).strip()
             for h in re.findall(r'<div class="card-h">(.*?)</div>', p, flags=re.S)]
    heads = [h.split("  ")[0].strip() for h in heads]
    demo[pid] = dict(title=t.group(1) if t else None, sub=sub.group(1) if sub else None, cards=heads)

print("demo panels:", len(demo), "| real tabs: 24")
print("\n== missing tabs in demo:", [k for k in real if k not in demo and k not in ("index","partials-codex-login")])
for k, d in demo.items():
    r = real.get(k, {})
    rcards = [c[0] for c in r.get("cards", [])]
    rt = (r.get("head") or [None])[0]
    mark = "" if (rt == d["title"]) else "  <-- TITLE"
    print(f"\n[{k}] demo='{d['title']}' real='{rt}'{mark}")
    if rcards:
        print("   real cards:", " | ".join(rcards))
    print("   demo cards:", " | ".join(d["cards"]))

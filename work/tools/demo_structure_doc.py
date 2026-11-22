#!/usr/bin/env python3
"""Write work/docs/DEMO-STRUCTURE.md — the demo's tab/card map straight from the source."""
import json, pathlib

FA = "۰۱۲۳۴۵۶۷۸۹"
fa = lambda n: "".join(FA[int(d)] for d in str(n))
from panelkit import TABS_ORDER, LABEL, GROUPS  # noqa

real = json.loads(pathlib.Path("work/qa/views.json").read_text())
out = ["# ساختار دموی پیشخوان — برگرفته از کد واقعی", "",
       "منبع: `includes/class-aaw-admin.php::tabs()` و فراخوانی‌های `AAW_Admin::head()` /",
       "`AAW_Admin::card_open()` در `admin/views/*.php`. عنوان‌ها، زیرعنوان‌ها و کارت‌ها",
       "کلمه‌به‌کلمه از PHP آمده‌اند؛ محتوای داخل کارت‌ها دادهٔ نمونه است.", ""]
for group, tabs in GROUPS:
    out.append(f"## {group} ({fa(len(tabs))} تب)")
    out.append("")
    for t in tabs:
        head, sub = (real[t]["head"] or ["", ""])[:2]
        out.append(f"### `{t}` — {head}")
        out.append(f"> {sub}")
        cards = real[t]["cards"]
        if cards:
            out.append("")
            for c, cs in cards:
                out.append(f"- **{c}**" + (f" — {cs}" if cs else ""))
        else:
            out.append("")
            out.append("- (بدون کارت؛ فهرست/جدول تمام‌عرض)")
        out.append("")
pathlib.Path("work/docs/DEMO-STRUCTURE.md").write_text("\n".join(out), encoding="utf-8")
print("wrote work/docs/DEMO-STRUCTURE.md", len(out), "lines")

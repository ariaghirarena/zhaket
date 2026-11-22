#!/usr/bin/env python3
"""Emit the demo shell (sidebar + 24 panels) and splice it into demo/index.html."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from panelkit import TABS_ORDER, LABEL, GROUPS, ICON, svg, panel  # noqa: E402
import panels_data  # noqa: E402

PAGE = Path(__file__).resolve().parent.parent / "site" / "demo" / "index.html"
START = "<!-- SHELL:START -->"
END = "<!-- SHELL:END -->"


def sidebar() -> str:
    out = ['<nav class="wpmenu" aria-label="منوی افزونه">']
    for group, tabs in GROUPS:
        out.append(f'    <div class="brandline">{group}</div>')
        for tab in tabs:
            cnt = '<span class="cnt" id="reviewCnt">۱۴</span>' if tab == "review" else ""
            out.append(
                f'    <a href="#/{tab}" data-tab="{tab}">{svg(ICON[tab])}{LABEL[tab]}{cnt}</a>')
    out.append("  </nav>")
    return "\n".join(out)


APP_HEAD = """  <main class="app">
    <div class="app-head">
      <div class="app-logo">
        <span class="mark">A</span> ARIAGH. <span class="chip">AIWRITER</span>
      </div>
      <div class="status">
        <span class="pill-x"><i></i> اتصال موتور سالم</span>
        <span class="pill-x" id="queuePill"><i class="b"></i> ۱۴ مقاله در صف</span>
        <span class="pill-x"><i class="a"></i> ۹۱ میانگین سئو</span>
      </div>
    </div>"""


def main() -> str:
    blocks = []
    for tab, fn, _ in panels_data.PANELS:
        html = panel(tab, fn())
        if tab == "dashboard":
            html = html.replace('<section class="panel" id="p-dashboard">',
                                '<section class="panel on" id="p-dashboard">')
        blocks.append(html)
    return APP_HEAD + "\n\n" + "\n\n".join(blocks) + "\n  </main>"


def build() -> str:
    return ('<div class="shell">\n\n'
            '  <!-- ======================= sidebar ======================= -->\n'
            + sidebar() + '\n\n  <!-- ======================= app ======================= -->\n'
            + main() + '\n</div>')


def splice(shell: str) -> None:
    page = PAGE.read_text(encoding="utf-8")
    a = page.index(START)
    b = page.index(END)
    new = page[:a + len(START)] + "\n" + shell + "\n" + page[b:]
    PAGE.write_text(new, encoding="utf-8")


def verify() -> None:
    page = PAGE.read_text(encoding="utf-8")
    body = page[page.index(START):page.index(END)]
    nav = body[body.index('<nav class="wpmenu"'):body.index("</nav>")]
    tabs = re.findall(r'data-tab="([a-z_]+)"', nav)
    panels = re.findall(r'<section class="panel[^"]*" id="p-([a-z_]+)"', body)
    assert len(tabs) == 24, f"sidebar links: {len(tabs)}"
    assert len(panels) == 24, f"panels: {len(panels)}"
    assert tabs == TABS_ORDER, f"order mismatch: {tabs}"
    assert panels == TABS_ORDER, f"panel order: {panels}"
    assert body.count('<section class="panel on"') == 1, "exactly one active panel"
    hooks = ["kpiReview", "reviewCnt", "topicTable", "cntQueue", "addTopic", "tTitle", "tKey",
             "tPrio", "aiSuggest", "promptBox", "promptPreview", "varChips", "runStrategy",
             "strategySteps", "actProg", "cancelJob", "deviceBtn", "deviceOut", "deployBtn",
             "workerState", "interval", "cronNow", "featSearch", "featGrid"]
    missing = [h for h in hooks if f'id="{h}"' not in body]
    assert not missing, f"missing hooks: {missing}"
    for tag in ("div", "section", "table", "nav", "main", "ul", "ol", "tbody", "thead", "tr"):
        o = len(re.findall(rf"<{tag}[\s>]", body))
        c = body.count(f"</{tag}>")
        assert o == c, f"unbalanced <{tag}>: {o}/{c}"
    print(f"ok: {len(tabs)} tabs, {len(panels)} panels, hooks present, tags balanced")
    print("panels:", ", ".join(panels))


if __name__ == "__main__":
    splice(build())
    verify()

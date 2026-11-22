#!/usr/bin/env python3
"""Audit every 3D asset for baked backgrounds / green spill / plate alpha.

For each file measure: alpha coverage, corner alpha (a plate means a fully
opaque rectangle), pixels with green excess >10 while visible, and the
fraction of the frame occupied by near-white opaque pixels (white halo-paint).
"""
import json
import sys
from pathlib import Path

from PIL import Image
import numpy as np

ART = Path("work/site/assets/3d")
FRESH = {"03d-01-hero", "03d-02-panel", "03d-03-mascot", "03d-04-pen",
         "03d-09-shield-glass", "03d-15-stack", "03d-24-star"}

rows = []
for f in sorted(ART.glob("*.webp")):
    im = Image.open(f).convert("RGBA")
    a = np.asarray(im).astype(np.int32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    vis = al > 8
    total = al.size
    cov = vis.sum() / total
    corners = [al[0, 0], al[0, -1], al[-1, 0], al[-1, -1]]
    h, w = al.shape
    k = max(6, min(h, w) // 40)
    edge_alpha = float(np.mean([al[:k].mean(), al[-k:].mean(), al[:, :k].mean(), al[:, -k:].mean()]))
    green = int(((g - np.maximum(r, b)) > 10 & vis).sum()) if False else int((((g - np.maximum(r, b)) > 10) & vis).sum())
    white = int(((r > 245) & (g > 245) & (b > 245) & (al > 240)).sum())
    rows.append(dict(
        name=f.stem, w=w, h=h,
        coverage=round(float(cov), 3),
        corners=[int(c) for c in corners],
        edge_alpha=round(edge_alpha, 1),
        green_px=green,
        white_px=white,
        white_frac=round(white / max(1, vis.sum()), 3),
        fresh=f.stem in FRESH,
    ))

for r in rows:
    flags = []
    if min(r["corners"]) > 12:
        flags.append("PLATE(corners opaque)")
    if r["green_px"] > 400:
        flags.append(f"green spill {r['green_px']}px")
    if r["white_frac"] > 0.55 and r["coverage"] > 0.5:
        flags.append(f"white halo {int(r['white_frac']*100)}%")
    if r["coverage"] < 0.05:
        flags.append("nearly empty")
    r["flags"] = flags

print(f"{'file':26} {'size':11} {'cov':>5} {'corner':>13} {'edgeA':>6} {'green':>6} {'white%':>6}  flags")
for r in rows:
    print(f"{r['name']:26} {r['w']:4}x{r['h']:<6} {r['coverage']:5.2f} "
          f"{str(min(r['corners'])):>13} {r['edge_alpha']:6.1f} {r['green_px']:6d} "
          f"{r['white_frac']*100:6.1f}  {', '.join(r['flags']) or 'clean'}")

Path("work/qa").mkdir(exist_ok=True)
Path("work/qa/audit-rest.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
print("\nflagged:", [r["name"] for r in rows if r["flags"]])

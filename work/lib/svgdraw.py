"""Tiny SVG subset renderer (fills only) on top of the same even-odd scanline
rasteriser used for text.  Enough for the ARIAGH vector assets."""
from __future__ import annotations

import re

import numpy as np

from fa import Font  # noqa: F401  (kept for type parity)


# ------------------------------------------------------------------ path data
def _flatten_quad(p0, p1, p2, out, steps=12):
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        out.append(
            (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
             u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])
        )


def _flatten_cubic(p0, p1, p2, p3, out, steps=16):
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        a, b, c, d = u**3, 3 * u * u * t, 3 * u * t * t, t**3
        out.append(
            (a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
             a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1])
        )


def _arc_to(p0, rx, ry, phi, large, sweep, p1, out, steps=24):
    import math

    if rx == 0 or ry == 0:
        out.append(p1)
        return
    phi = math.radians(phi)
    cosp, sinp = math.cos(phi), math.sin(phi)
    dx2, dy2 = (p0[0] - p1[0]) / 2, (p0[1] - p1[1]) / 2
    x1 = cosp * dx2 + sinp * dy2
    y1 = -sinp * dx2 + cosp * dy2
    rx, ry = abs(rx), abs(ry)
    lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    den = rx * rx * y1 * y1 + ry * ry * x1 * x1
    co = math.sqrt(max(0.0, num / den)) if den else 0.0
    if large == sweep:
        co = -co
    cxp = co * rx * y1 / ry
    cyp = -co * ry * x1 / rx
    cx = cosp * cxp - sinp * cyp + (p0[0] + p1[0]) / 2
    cy = sinp * cxp + cosp * cyp + (p0[1] + p1[1]) / 2

    def ang(ux, uy, vx, vy):
        d = (ux * vx + uy * vy) / (math.hypot(ux, uy) * math.hypot(vx, vy))
        d = max(-1.0, min(1.0, d))
        a = math.acos(d)
        if ux * vy - uy * vx < 0:
            a = -a
        return a

    th1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry)
    dth = ang((x1 - cxp) / rx, (y1 - cyp) / ry,
              (-x1 - cxp) / rx, (-y1 - cyp) / ry)
    if not sweep and dth > 0:
        dth -= 2 * math.pi
    elif sweep and dth < 0:
        dth += 2 * math.pi
    for i in range(1, steps + 1):
        t = th1 + dth * i / steps
        x = rx * math.cos(t)
        y = ry * math.sin(t)
        out.append((cosp * x - sinp * y + cx, sinp * x + cosp * y + cy))


_TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?")


def parse_path(d: str) -> list[list[tuple[float, float]]]:
    toks = _TOKEN.findall(d)
    i = 0
    contours: list[list[tuple[float, float]]] = []
    cur: list[tuple[float, float]] = []
    x = y = 0.0
    sx = sy = 0.0
    cmd = None
    prev_ctrl = None

    def num():
        nonlocal i
        v = float(toks[i])
        i += 1
        return v

    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            if cur:
                contours.append(cur)
                cur = []
            x, y = nx, ny
            sx, sy = x, y
            cur = [(x, y)]
            cmd = "l" if rel else "L"
        elif c == "L":
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            x, y = nx, ny
            cur.append((x, y))
        elif c == "H":
            nx = num()
            x = x + nx if rel else nx
            cur.append((x, y))
        elif c == "V":
            ny = num()
            y = y + ny if rel else ny
            cur.append((x, y))
        elif c == "C":
            x1, y1, x2, y2, nx, ny = (num() for _ in range(6))
            if rel:
                x1, y1, x2, y2, nx, ny = x + x1, y + y1, x + x2, y + y2, x + nx, y + ny
            _flatten_cubic((x, y), (x1, y1), (x2, y2), (nx, ny), cur)
            prev_ctrl = (x2, y2)
            x, y = nx, ny
        elif c == "S":
            x2, y2, nx, ny = (num() for _ in range(4))
            if rel:
                x2, y2, nx, ny = x + x2, y + y2, x + nx, y + ny
            x1, y1 = (2 * x - prev_ctrl[0], 2 * y - prev_ctrl[1]) if prev_ctrl else (x, y)
            _flatten_cubic((x, y), (x1, y1), (x2, y2), (nx, ny), cur)
            prev_ctrl = (x2, y2)
            x, y = nx, ny
        elif c == "Q":
            x1, y1, nx, ny = (num() for _ in range(4))
            if rel:
                x1, y1, nx, ny = x + x1, y + y1, x + nx, y + ny
            _flatten_quad((x, y), (x1, y1), (nx, ny), cur)
            prev_ctrl = (x1, y1)
            x, y = nx, ny
        elif c == "T":
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            x1, y1 = (2 * x - prev_ctrl[0], 2 * y - prev_ctrl[1]) if prev_ctrl else (x, y)
            _flatten_quad((x, y), (x1, y1), (nx, ny), cur)
            prev_ctrl = (x1, y1)
            x, y = nx, ny
        elif c == "A":
            rx, ry, phi, la, sw, nx, ny = (num() for _ in range(7))
            if rel:
                nx, ny = x + nx, y + ny
            _arc_to((x, y), rx, ry, phi, int(la), int(sw), (nx, ny), cur)
            x, y = nx, ny
        elif c == "Z":
            if cur and cur[0] != cur[-1]:
                cur.append(cur[0])
            if cur:
                contours.append(cur)
                cur = []
            x, y = sx, sy
        else:
            i += 1
    if cur:
        if cur[0] != cur[-1]:
            cur.append(cur[0])
        contours.append(cur)
    return [c for c in contours if len(c) > 2]


# ------------------------------------------------------------------ svg file
_ATTR = re.compile(r'([a-zA-Z\-:]+)="([^"]*)"')
_SHAPE = re.compile(r"<(rect|circle|ellipse|path|polygon|polyline|line|g)\b([^>]*)/?>")
_TRANSFORM = re.compile(r"(matrix|translate|scale|rotate)\(([^)]*)\)")


def _color(v: str):
    v = v.strip()
    if v.startswith("#"):
        h = v[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return (tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)))
    return (0.0, 0.0, 0.0)


def _parse_transform(s: str):
    m = np.eye(3)
    for kind, args in _TRANSFORM.findall(s or ""):
        nums = [float(x) for x in re.split(r"[,\s]+", args.strip()) if x]
        t = np.eye(3)
        if kind == "translate":
            t[0, 2] = nums[0]
            t[1, 2] = nums[1] if len(nums) > 1 else 0
        elif kind == "scale":
            t[0, 0] = nums[0]
            t[1, 1] = nums[1] if len(nums) > 1 else nums[0]
        elif kind == "matrix":
            a, b, c, d, e, f = nums
            t = np.array([[a, c, e], [b, d, f], [0, 0, 1]])
        elif kind == "rotate":
            import math

            a = math.radians(nums[0])
            t = np.array([[math.cos(a), -math.sin(a), 0],
                          [math.sin(a), math.cos(a), 0], [0, 0, 1]])
        m = m @ t
    return m


def parse_svg(text: str):
    """Return (width, height, shapes) where each shape is (contours, colour, opacity)."""
    vb = None
    m = re.search(r'viewBox="([^"]+)"', text)
    if m:
        vb = [float(x) for x in re.split(r"[,\s]+", m.group(1).strip())]
    w = float(re.search(r'width="([\d.]+)', text).group(1)) if 'width="' in text else (vb[2] if vb else 64)
    h = float(re.search(r'height="([\d.]+)', text).group(1)) if 'height="' in text else (vb[3] if vb else 64)
    if vb:
        w, h = vb[2], vb[3]
    shapes = []
    stack = [np.eye(3)]
    for tag, attrs in _SHAPE.findall(text):
        a = dict(_ATTR.findall(attrs))
        if tag == "g":
            stack.append(stack[-1] @ _parse_transform(a.get("transform", "")))
            continue
        mat = stack[-1] @ _parse_transform(a.get("transform", ""))
        fill = _color(a.get("fill", "#000")) if a.get("fill", "#000") not in ("none", "") else None
        if fill is None:
            continue
        op = float(a.get("fill-opacity", a.get("opacity", 1)) or 1)
        contours = []
        if tag == "path":
            contours = parse_path(a.get("d", ""))
        elif tag == "rect":
            x, y = float(a.get("x", 0)), float(a.get("y", 0))
            rw, rh = float(a.get("width", 0)), float(a.get("height", 0))
            rx = float(a.get("rx", a.get("ry", 0)) or 0)
            contours = [_rounded_rect(x, y, rw, rh, rx)]
        elif tag in ("circle", "ellipse"):
            cx, cy = float(a.get("cx", 0)), float(a.get("cy", 0))
            rx = float(a.get("r", a.get("rx", 0)))
            ry = float(a.get("r", a.get("ry", 0)))
            import math

            contours = [[(cx + rx * math.cos(t / 64 * 6.283185), cy + ry * math.sin(t / 64 * 6.283185))
                         for t in range(64)]]
        elif tag in ("polygon", "polyline"):
            pts = [float(v) for v in re.split(r"[,\s]+", a.get("points", "").strip()) if v]
            contours = [[(pts[i], pts[i + 1]) for i in range(0, len(pts) - 1, 2)]]
        elif tag == "line":
            x1, y1 = float(a.get("x1", 0)), float(a.get("y1", 0))
            x2, y2 = float(a.get("x2", 0)), float(a.get("y2", 0))
            contours = [[(x1, y1), (x2, y2), (x2, y2 + 1), (x1, y1 + 1)]]
        out = []
        for c in contours:
            out.append([tuple(mat @ np.array([px, py, 1.0]))[:2] for px, py in c])
        shapes.append((out, fill, op))
    return w, h, shapes


def _rounded_rect(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    import math

    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0),
                       (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for k in range(9):
            a = math.radians(a0 + k * 90 / 8)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

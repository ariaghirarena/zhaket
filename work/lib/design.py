"""Design kit: frosted glass, gradients, shadows, strokes, icons, brand assets.

All public methods take design-pixel coordinates; the canvas is internally
oversampled by `ss` and downscaled with LANCZOS at save().
"""
from __future__ import annotations

import math
import os

import numpy as np
from PIL import Image, ImageFilter

from fa import _blit_text, canvas_to_image, load_font, measure, wrap
from svgdraw import parse_svg

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fonts")

# ---------------------------------------------------------------- palette
NAVY = (0.043, 0.106, 0.247)      # #0B1B3F
DEEP = (0.024, 0.055, 0.145)      # #060E25
ROYAL = (0.114, 0.306, 0.847)     # #1D4ED8
SKY = (0.220, 0.741, 0.973)       # #38BDF8
ICE = (0.933, 0.961, 1.0)         # #EEF5FF
WHITE = (1.0, 1.0, 1.0)
MUTED = (0.541, 0.639, 0.800)     # #8AA3CC
SLATE = (0.357, 0.420, 0.541)     # #5B6B8A
MINT = (0.184, 0.808, 0.635)
AMBER = (0.980, 0.749, 0.286)

FONT_FILES = {
    "black": "Vazirmatn-Black.ttf",
    "xbold": "Vazirmatn-ExtraBold.ttf",
    "bold": "Vazirmatn-Bold.ttf",
    "semi": "Vazirmatn-SemiBold.ttf",
    "medium": "Vazirmatn-Medium.ttf",
    "regular": "Vazirmatn-Regular.ttf",
}


def font(weight: str = "regular"):
    return load_font(os.path.join(FONT_DIR, FONT_FILES[weight]))


# ---------------------------------------------------------------- helpers
def _blur(arr: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return arr
    h, w = arr.shape[:2]
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(sigma))
    return np.asarray(img, dtype=np.float32) / 255.0


def rrect_mask(w: int, h: int, r: float, ss: int = 1) -> np.ndarray:
    """Anti-aliased rounded-rect coverage mask (float 0..1)."""
    r = max(0.0, min(r * ss, w / 2, h / 2))
    x = np.arange(w, dtype=np.float32) + 0.5
    y = np.arange(h, dtype=np.float32) + 0.5
    outside = np.zeros((h, w), dtype=np.float32)
    if r <= 0:
        return np.ones((h, w), dtype=np.float32)
    cx = np.clip(x, r, w - r)
    cy = np.clip(y, r, h - r)
    dx = x[None, :] - cx[None, :]
    dy = y[:, None] - cy[:, None]
    dist = np.sqrt(dx * dx + dy * dy)
    mask = np.clip(r - dist + 0.5, 0, 1)
    inner = ((x[None, :] >= r) & (x[None, :] <= w - r)
             & (y[:, None] >= r) & (y[:, None] <= h - r))
    mask = np.where(inner, 1.0, mask)
    del outside
    return mask.astype(np.float32)


def _inset_ring(W: int, H: int, iw: int, r: float, ss: int) -> np.ndarray:
    """Coverage mask of the inset rounded rect placed back on the outer grid."""
    out = np.zeros((H, W), dtype=np.float32)
    if W - 2 * iw <= 0 or H - 2 * iw <= 0:
        return out
    out[iw:H - iw, iw:W - iw] = rrect_mask(W - 2 * iw, H - 2 * iw, r, ss)
    return out


def fill_polygons(canvas: np.ndarray, polys, color, alpha: float = 1.0,
                  bbox=None):
    """Even-odd fill of a list of polygons into an RGBA float canvas."""
    if not polys:
        return
    h, w = canvas.shape[:2]
    minx = min(min(p[0] for p in poly) for poly in polys)
    maxx = max(max(p[0] for p in poly) for poly in polys)
    miny = min(min(p[1] for p in poly) for poly in polys)
    maxy = max(max(p[1] for p in poly) for poly in polys)
    x0 = max(0, int(math.floor(minx)) - 1)
    x1 = min(w, int(math.ceil(maxx)) + 2)
    y0 = max(0, int(math.floor(miny)) - 1)
    y1 = min(h, int(math.ceil(maxy)) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    W, H = x1 - x0, y1 - y0
    toggle = np.zeros((H, W), dtype=np.int32)
    rows = np.arange(H, dtype=np.float64) + y0 + 0.5
    for poly in polys:
        n = len(poly)
        for i in range(n):
            ax, ay = poly[i]
            bx, by = poly[(i + 1) % n]
            if ay == by:
                continue
            if ay > by:
                ax, ay, bx, by = bx, by, ax, ay
            m0 = int(np.searchsorted(rows, ay, side="left"))
            m1 = int(np.searchsorted(rows, by, side="left"))
            if m1 <= m0:
                continue
            seg = rows[m0:m1]
            t = (seg - ay) / (by - ay)
            xs = ax + t * (bx - ax)
            xi = np.floor(xs).astype(np.int64) - x0
            np.clip(xi, 0, W - 1, out=xi)
            np.add.at(toggle, (np.arange(m0, m1), xi), 1)
    mask = (np.cumsum(toggle, axis=1) & 1).astype(np.float32)
    composite(canvas[y0:y1, x0:x1], mask, color, alpha)


def composite(region: np.ndarray, mask: np.ndarray, color, alpha: float = 1.0,
              mode: str = "normal"):
    src_a = np.clip(mask, 0, 1) * alpha
    col = np.array(color[:3], dtype=np.float32)
    if mode == "normal":
        dst_a = region[:, :, 3]
        out_a = src_a + dst_a * (1 - src_a)
        safe = np.where(out_a > 0, out_a, 1)
        region[:, :, :3] = (
            col[None, None, :] * src_a[:, :, None]
            + region[:, :, :3] * (dst_a * (1 - src_a))[:, :, None]
        ) / safe[:, :, None]
        region[:, :, 3] = out_a
    elif mode == "multiply":
        region[:, :, :3] *= 1 - (1 - col[None, None, :]) * src_a[:, :, None]
    elif mode == "screen":
        region[:, :, :3] = 1 - (1 - region[:, :, :3]) * (1 - col[None, None, :] * src_a[:, :, None])
    elif mode == "overlay-white":
        region[:, :, :3] = region[:, :, :3] * (1 - src_a[:, :, None]) + src_a[:, :, None]


class Design:
    def __init__(self, w: int, h: int, ss: int = 3, bg=None):
        self.w, self.h, self.ss = w, h, ss
        self.W, self.H = w * ss, h * ss
        self.cv = np.zeros((self.H, self.W, 4), dtype=np.float32)
        if bg is not None:
            self.cv[:, :, :3] = np.array(bg[:3], dtype=np.float32)
            self.cv[:, :, 3] = 1.0

    # -- coordinate helpers
    def s(self, v: float) -> float:
        return v * self.ss

    def box(self, x, y, w, h):
        s = self.ss
        return int(round(x * s)), int(round(y * s)), max(1, int(round(w * s))), max(1, int(round(h * s)))

    # -- backgrounds
    def vgradient(self, stops, y0=0, y1=None):
        """stops: [(pos, (r,g,b)), ...] positions 0..1"""
        y1 = self.h if y1 is None else y1
        a, b = int(y0 * self.ss), int(y1 * self.ss)
        rows = np.linspace(0, 1, b - a)
        pos = np.array([s[0] for s in stops])
        cols = np.array([s[1] for s in stops], dtype=np.float32)
        out = np.zeros((b - a, 3), dtype=np.float32)
        for c in range(3):
            out[:, c] = np.interp(rows, pos, cols[:, c])
        self.cv[a:b, :, :3] = out[:, None, :]
        self.cv[a:b, :, 3] = 1.0

    def hgradient(self, stops, x0=0, x1=None):
        x1 = self.w if x1 is None else x1
        a, b = int(x0 * self.ss), int(x1 * self.ss)
        cols_x = np.linspace(0, 1, b - a)
        pos = np.array([s[0] for s in stops])
        cols = np.array([s[1] for s in stops], dtype=np.float32)
        out = np.zeros((b - a, 3), dtype=np.float32)
        for c in range(3):
            out[:, c] = np.interp(cols_x, pos, cols[:, c])
        self.cv[:, a:b, :3] = out[None, :, :]
        self.cv[:, a:b, 3] = 1.0

    def glow(self, cx, cy, r, color, alpha=0.5, mode="screen"):
        """Soft radial glow."""
        s = self.ss
        x0, y0 = int((cx - r) * s), int((cy - r) * s)
        x1, y1 = int((cx + r) * s), int((cy + r) * s)
        x0c, y0c = max(0, x0), max(0, y0)
        x1c, y1c = min(self.W, x1), min(self.H, y1)
        if x1c <= x0c or y1c <= y0c:
            return
        ys = (np.arange(y0c, y1c) + 0.5) / s - cy
        xs = (np.arange(x0c, x1c) + 0.5) / s - cx
        d = np.sqrt((ys[:, None] ** 2 + xs[None, :] ** 2)) / r
        mask = np.clip(1 - d, 0, 1) ** 2.2
        composite(self.cv[y0c:y1c, x0c:x1c], mask, color, alpha, mode)

    def grid(self, step=40, color=WHITE, alpha=0.03, width=1.0):
        s = self.ss
        mask = np.zeros((self.H, self.W), dtype=np.float32)
        for x in range(0, self.w + 1, step):
            a = int(x * s)
            if 0 <= a < self.W:
                mask[:, a:a + max(1, int(width * s))] = 1
        for y in range(0, self.h + 1, step):
            b = int(y * s)
            if 0 <= b < self.H:
                mask[b:b + max(1, int(width * s)), :] = 1
        composite(self.cv, mask, color, alpha, "screen")

    def dots(self, step=26, r=1.0, color=WHITE, alpha=0.06):
        s = self.ss
        mask = np.zeros((self.H, self.W), dtype=np.float32)
        rr = r * s
        for y in range(step // 2, self.h, step):
            for x in range(step // 2, self.w, step):
                cy, cx = y * s, x * s
                y0, y1 = int(cy - rr - 1), int(cy + rr + 2)
                x0, x1 = int(cx - rr - 1), int(cx + rr + 2)
                if y0 < 0 or x0 < 0 or y1 >= self.H or x1 >= self.W:
                    continue
                ys = np.arange(y0, y1) + 0.5 - cy
                xs = np.arange(x0, x1) + 0.5 - cx
                d = np.sqrt(ys[:, None] ** 2 + xs[None, :] ** 2)
                mask[y0:y1, x0:x1] = np.maximum(mask[y0:y1, x0:x1], np.clip(rr - d + 0.5, 0, 1))
        composite(self.cv, mask, color, alpha, "screen")

    def noise(self, amount=0.02, seed=7):
        rng = np.random.default_rng(seed)
        n = rng.normal(0, amount, (self.H, self.W, 1)).astype(np.float32)
        self.cv[:, :, :3] = np.clip(self.cv[:, :, :3] + n, 0, 1)

    # -- shapes
    def rrect(self, x, y, w, h, r, fill=None, alpha=1.0, stroke=None,
              sw=1.0, grad=None, mode="normal"):
        X, Y, W, H = self.box(x, y, w, h)
        full = rrect_mask(W, H, r, self.ss)
        # clip to canvas
        x0c, y0c = max(0, X), max(0, Y)
        x1c, y1c = min(self.W, X + W), min(self.H, Y + H)
        mask = full[y0c - Y:y1c - Y, x0c - X:x1c - X]
        X, Y, W, H = x0c, y0c, x1c - x0c, y1c - y0c
        if W <= 0 or H <= 0:
            return
        if grad is not None:
            g = np.zeros((H, W, 3), dtype=np.float32)
            pos = np.array([s[0] for s in grad])
            cols = np.array([s[1] for s in grad], dtype=np.float32)
            t = np.linspace(0, 1, H)
            for c in range(3):
                g[:, :, c] = np.interp(t, pos, cols[:, c])[:, None]
            region = self.cv[Y:Y + H, X:X + W]
            a = (mask * alpha)[:, :, None]
            dst_a = region[:, :, 3]
            out_a = (mask * alpha) + dst_a * (1 - mask * alpha)
            safe = np.where(out_a > 0, out_a, 1)
            region[:, :, :3] = (g * a + region[:, :, :3] * (dst_a * (1 - mask * alpha))[:, :, None]) / safe[:, :, None]
            region[:, :, 3] = out_a
        elif fill is not None:
            composite(self.cv[Y:Y + H, X:X + W], mask, fill, alpha, mode)
        if stroke is not None:
            inner_w = max(1, int(sw * self.ss))
            ring = rrect_mask(W, H, r, self.ss) - _inset_ring(W, H, inner_w, max(0.0, r - sw), self.ss)
            composite(self.cv[Y:Y + H, X:X + W], np.clip(ring, 0, 1), stroke, alpha)

    def circle(self, cx, cy, r, fill=None, alpha=1.0, stroke=None, sw=1.0):
        self.rrect(cx - r, cy - r, 2 * r, 2 * r, r, fill, alpha, stroke, sw)

    def line(self, x1, y1, x2, y2, width=1.0, color=WHITE, alpha=1.0, dash=None):
        if dash:
            total = math.hypot(x2 - x1, y2 - y1)
            if total == 0:
                return
            ux, uy = (x2 - x1) / total, (y2 - y1) / total
            pos = 0.0
            on = True
            for seg in dash:
                if pos > total:
                    break
                end = min(total, pos + seg)
                if on:
                    self.line(x1 + ux * pos, y1 + uy * pos, x1 + ux * end, y1 + uy * end,
                              width, color, alpha)
                pos = end
                on = not on
            return
        dx, dy = x2 - x1, y2 - y1
        d = math.hypot(dx, dy)
        if d == 0:
            return
        nx, ny = -dy / d * width / 2, dx / d * width / 2
        poly = [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]
        s = self.ss
        fill_polygons(self.cv, [[(px * s, py * s) for px, py in poly]], color, alpha)
        if width > 2:
            self.circle(x1, y1, width / 2, color, alpha)
            self.circle(x2, y2, width / 2, color, alpha)

    def polyline(self, pts, width=2.0, color=WHITE, alpha=1.0, closed=False):
        n = len(pts)
        for i in range(n - 1 if not closed else n):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % n]
            self.line(x1, y1, x2, y2, width, color, alpha)

    # -- shadow / glass
    def shadow(self, x, y, w, h, r, blur=24, alpha=0.35, dy=14, color=(0, 0, 0)):
        s = self.ss
        pad = int(blur * s * 2)
        X, Y, W, H = self.box(x, y + dy, w, h)
        m = rrect_mask(W, H, r, s)
        canvas = np.zeros((H + 2 * pad, W + 2 * pad), dtype=np.float32)
        canvas[pad:pad + H, pad:pad + W] = m
        canvas = _blur(canvas, blur * s / 2.2)
        X0, Y0 = X - pad, Y - pad
        x0, y0 = max(0, X0), max(0, Y0)
        x1, y1 = min(self.W, X0 + canvas.shape[1]), min(self.H, Y0 + canvas.shape[0])
        if x1 <= x0 or y1 <= y0:
            return
        sub = canvas[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0]
        composite(self.cv[y0:y1, x0:x1], sub, color, alpha)

    def glass(self, x, y, w, h, r, tint=(1, 1, 1), alpha=0.10, blur=18,
              border=0.28, shadow=False):
        s = self.ss
        X, Y, W, H = self.box(x, y, w, h)
        X, Y = max(0, X), max(0, Y)
        W = min(W, self.W - X)
        H = min(H, self.H - Y)
        if W <= 0 or H <= 0:
            return
        if shadow:
            self.shadow(x, y, w, h, r, blur=26, alpha=0.30, dy=16)
        region = self.cv[Y:Y + H, X:X + W]
        if blur > 0:
            blurred = _blur(region[:, :, :3], blur * s / 6.0)
            # mix a bit of the original to keep it from looking muddy
            for c in range(3):
                region[:, :, c] = blurred[:, :, c] * 0.72 + region[:, :, c] * 0.28
        mask = rrect_mask(W, H, r, s)
        composite(region, mask, tint, alpha)
        # top highlight
        hi = rrect_mask(W, max(2, H), r, s)
        hl = np.copy(mask)
        band = int(min(H * 0.45, 90 * s))
        hl[:] = 0
        hl[0:band, :] = mask[0:band, :] * np.linspace(0.55, 0.0, band)[:, None] * 0.5
        composite(self.cv[Y:Y + H, X:X + W], hl, (1, 1, 1), 0.5)
        if border:
            ring = mask.copy()
            iw = max(1, int(1.0 * s))
            inner = rrect_mask(max(1, W - 2 * iw), max(1, H - 2 * iw), max(0, r - 1), s)
            ring[iw:H - iw, iw:W - iw] -= inner
            composite(self.cv[Y:Y + H, X:X + W], np.clip(ring, 0, 1), (1, 1, 1), border)

    # -- text
    def text(self, txt, size, x, y, color=NAVY, weight="regular", align="right",
             maxw=None, lh=1.6, alpha=1.0, base_rtl=True, mode="normal",
             letter_spacing=0.0):
        return _blit_text(
            self.cv, font(weight), txt, self.s(size), self.s(x), self.s(y),
            color, mode=mode, max_width=self.s(maxw) if maxw else 0,
            align=align, base_rtl=base_rtl, line_height=lh, alpha=alpha,
            letter_spacing=self.s(letter_spacing),
        )

    def text_lines(self, txt, size, x, y, color=NAVY, weight="regular",
                   align="right", maxw=None, lh=1.6, alpha=1.0):
        return self.text(txt, size, x, y, color, weight, align, maxw, lh, alpha)

    def measure(self, txt, size, weight="regular"):
        return measure(font(weight), txt, size) / self.ss * self.ss / self.ss

    def text_width(self, txt, size, weight="regular"):
        return measure(font(weight), txt, size)

    # -- assets
    def logo(self, cx, cy, width, on_dark=True, alpha=1.0):
        """Draw the real ARIAGH.AIWRITER lockup centred on (cx, cy)."""
        path = os.path.join(ROOT, "work", "aria-ai-writer", "assets", "img", "logo.svg")
        w, h, shapes = parse_svg(open(path, encoding="utf-8").read())
        sc = width / w
        s = self.ss
        x0 = s * cx - (w * sc * s) / 2
        y0 = s * cy - (h * sc * s) / 2
        allc = []
        for contours, col, op in shapes:
            pts = [[(x0 + px * sc * s, y0 + py * sc * s) for px, py in c] for c in contours]
            allc.extend(pts)
        # draw dark geometry as white when on a dark background; keep the blue chip
        for contours, col, op in shapes:
            pts = [[(x0 + px * sc * s, y0 + py * sc * s) for px, py in c] for c in contours]
            lum = 0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2]
            # only the navy ink is inverted; the royal-blue chip keeps its colour
            # (its white letters are "light" and stay white)
            use = (1, 1, 1) if (on_dark and lum < 0.20) else col
            fill_polygons(self.cv, pts, use, alpha * op)

    def mark(self, cx, cy, size, bg=ROYAL, fg=WHITE, radius_ratio=0.2):
        path = os.path.join(ROOT, "work", "aria-ai-writer", "assets", "img", "mark.svg")
        w, h, shapes = parse_svg(open(path, encoding="utf-8").read())
        sc = size / w
        s = self.ss
        x0 = s * cx - size * s / 2
        y0 = s * cy - size * s / 2
        self.rrect(cx - size / 2, cy - size / 2, size, size, size * radius_ratio, bg)
        for contours, col, op in shapes:
            if 0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2] > 0.9 or sum(col) > 2.7:
                pts = [[(x0 + px * sc * s, y0 + py * sc * s) for px, py in c] for c in contours]
                fill_polygons(self.cv, pts, fg, op)

    def icon(self, name, cx, cy, size, color=WHITE, sw=2.0, alpha=1.0):
        """Line icons on a 24x24 grid."""
        u = size / 24.0
        P = lambda pts: [(cx + (x - 12) * u, cy + (y - 12) * u) for x, y in pts]
        w = sw * u * 0.85
        if name == "cpu":
            self.rrect(cx - 7 * u, cy - 7 * u, 14 * u, 14 * u, 2.5 * u, stroke=color, sw=w / 1.0, alpha=alpha)
            self.rrect(cx - 3 * u, cy - 3 * u, 6 * u, 6 * u, 1.2 * u, fill=color, alpha=alpha)
            for d in (-4, 0, 4):
                self.line(cx + d * u, cy - 7 * u, cx + d * u, cy - 9.6 * u, w, color, alpha)
                self.line(cx + d * u, cy + 7 * u, cx + d * u, cy + 9.6 * u, w, color, alpha)
                self.line(cx - 7 * u, cy + d * u, cx - 9.6 * u, cy + d * u, w, color, alpha)
                self.line(cx + 7 * u, cy + d * u, cx + 9.6 * u, cy + d * u, w, color, alpha)
        elif name == "cloud":
            self.circle(cx - 4 * u, cy + 2 * u, 4 * u, stroke=color, sw=w, alpha=alpha)
            self.circle(cx + 1.5 * u, cy - 2.5 * u, 5.5 * u, stroke=color, sw=w, alpha=alpha)
            self.circle(cx + 6.5 * u, cy + 2.5 * u, 3.5 * u, stroke=color, sw=w, alpha=alpha)
            self.line(cx - 4 * u, cy + 6 * u, cx + 6.5 * u, cy + 6 * u, w, color, alpha)
        elif name == "spark":
            pts = [(12, 2), (14.2, 9.8), (22, 12), (14.2, 14.2), (12, 22), (9.8, 14.2), (2, 12), (9.8, 9.8)]
            self.polyline(P(pts), w, color, alpha, closed=True)
        elif name == "chart":
            self.line(cx - 8 * u, cy + 8 * u, cx + 8 * u, cy + 8 * u, w, color, alpha)
            self.line(cx - 8 * u, cy + 8 * u, cx - 8 * u, cy - 8 * u, w, color, alpha)
            self.polyline([(cx - 5 * u, cy + 3 * u), (cx - 1 * u, cy - 2 * u), (cx + 2.5 * u, cy + 1.5 * u), (cx + 7 * u, cy - 6 * u)], w, color, alpha)
        elif name == "image":
            self.rrect(cx - 8 * u, cy - 7 * u, 16 * u, 14 * u, 2.5 * u, stroke=color, sw=w, alpha=alpha)
            self.circle(cx - 3.5 * u, cy - 3 * u, 1.6 * u, fill=color, alpha=alpha)
            self.polyline([(cx - 7.5 * u, cy + 5.5 * u), (cx - 2 * u, cy - 0.5 * u), (cx + 2 * u, cy + 3 * u), (cx + 5 * u, cy + 0.5 * u), (cx + 7.5 * u, cy + 3.5 * u)], w, color, alpha)
        elif name == "clock":
            self.circle(cx, cy, 8 * u, stroke=color, sw=w, alpha=alpha)
            self.line(cx, cy - 4.5 * u, cx, cy, w, color, alpha)
            self.line(cx, cy, cx + 3.5 * u, cy + 2 * u, w, color, alpha)
        elif name == "bell":
            self.polyline([(cx - 6 * u, cy + 4 * u), (cx - 5 * u, cy - 1 * u), (cx - 2.5 * u, cy - 5.5 * u), (cx + 2.5 * u, cy - 5.5 * u), (cx + 5 * u, cy - 1 * u), (cx + 6 * u, cy + 4 * u)], w, color, alpha)
            self.line(cx - 8 * u, cy + 4 * u, cx + 8 * u, cy + 4 * u, w, color, alpha)
            self.circle(cx, cy + 7 * u, 1.8 * u, fill=color, alpha=alpha)
        elif name == "key":
            self.circle(cx - 4 * u, cy - 3 * u, 4 * u, stroke=color, sw=w, alpha=alpha)
            self.line(cx - 1 * u, cy, cx + 7 * u, cy + 8 * u, w, color, alpha)
            self.line(cx + 3 * u, cy + 4 * u, cx + 5.5 * u, cy + 1.5 * u, w, color, alpha)
        elif name == "list":
            for i, dy in enumerate((-5, 0, 5)):
                self.circle(cx - 6 * u, cy + dy * u, 1.3 * u, fill=color, alpha=alpha)
                self.line(cx - 2.5 * u, cy + dy * u, cx + 7 * u, cy + dy * u, w, color, alpha)
        elif name == "book":
            self.polyline([(cx - 7 * u, cy - 6 * u), (cx - 1 * u, cy - 6 * u), (cx - 1 * u, cy + 6 * u), (cx - 7 * u, cy + 6 * u)], w, color, alpha, closed=True)
            self.polyline([(cx + 1 * u, cy - 6 * u), (cx + 7 * u, cy - 6 * u), (cx + 7 * u, cy + 6 * u), (cx + 1 * u, cy + 6 * u)], w, color, alpha, closed=True)
        elif name == "shield":
            self.polyline([(cx, cy - 8 * u), (cx + 7 * u, cy - 5 * u), (cx + 7 * u, cy + 1 * u), (cx, cy + 8 * u), (cx - 7 * u, cy + 1 * u), (cx - 7 * u, cy - 5 * u)], w, color, alpha, closed=True)
        elif name == "layers":
            self.polyline([(cx, cy - 7 * u), (cx + 7.5 * u, cy - 3 * u), (cx, cy + 1 * u), (cx - 7.5 * u, cy - 3 * u)], w, color, alpha, closed=True)
            self.polyline([(cx - 7.5 * u, cy + 2 * u), (cx, cy + 6 * u), (cx + 7.5 * u, cy + 2 * u)], w, color, alpha)
        elif name == "user":
            self.circle(cx, cy - 4 * u, 3.6 * u, stroke=color, sw=w, alpha=alpha)
            self.polyline([(cx - 7 * u, cy + 8 * u), (cx - 6 * u, cy + 2.5 * u), (cx + 6 * u, cy + 2.5 * u), (cx + 7 * u, cy + 8 * u)], w, color, alpha)
        elif name == "trend":
            self.polyline([(cx - 8 * u, cy + 5 * u), (cx - 2 * u, cy - 2 * u), (cx + 2 * u, cy + 1.5 * u), (cx + 8 * u, cy - 6 * u)], w, color, alpha)
            self.polyline([(cx + 2.5 * u, cy - 6 * u), (cx + 8 * u, cy - 6 * u), (cx + 8 * u, cy - 0.5 * u)], w, color, alpha)
        elif name == "wrench":
            self.circle(cx + 3.5 * u, cy - 3.5 * u, 4.2 * u, stroke=color, sw=w, alpha=alpha)
            self.line(cx + 0.5 * u, cy - 0.5 * u, cx - 7 * u, cy + 7 * u, w * 1.25, color, alpha)
        elif name == "calendar":
            self.rrect(cx - 8 * u, cy - 6 * u, 16 * u, 14 * u, 2.4 * u, stroke=color, sw=w, alpha=alpha)
            self.line(cx - 8 * u, cy - 1.5 * u, cx + 8 * u, cy - 1.5 * u, w, color, alpha)
            self.line(cx - 4 * u, cy - 8.5 * u, cx - 4 * u, cy - 4.5 * u, w, color, alpha)
            self.line(cx + 4 * u, cy - 8.5 * u, cx + 4 * u, cy - 4.5 * u, w, color, alpha)
        elif name == "search":
            self.circle(cx - 2 * u, cy - 2 * u, 5.6 * u, stroke=color, sw=w, alpha=alpha)
            self.line(cx + 2 * u, cy + 2 * u, cx + 8 * u, cy + 8 * u, w, color, alpha)
        elif name == "check":
            self.polyline([(cx - 7 * u, cy), (cx - 2 * u, cy + 5 * u), (cx + 7 * u, cy - 5 * u)], w, color, alpha)
        elif name == "bolt":
            self.polyline([(cx + 1 * u, cy - 9 * u), (cx - 6 * u, cy + 1.5 * u), (cx - 0.5 * u, cy + 1.5 * u), (cx - 1 * u, cy + 9 * u), (cx + 6 * u, cy - 1.5 * u), (cx + 0.5 * u, cy - 1.5 * u)], w, color, alpha, closed=True)
        elif name == "doc":
            self.polyline([(cx - 5.5 * u, cy - 8 * u), (cx + 2.5 * u, cy - 8 * u), (cx + 6 * u, cy - 4 * u), (cx + 6 * u, cy + 8 * u), (cx - 5.5 * u, cy + 8 * u)], w, color, alpha, closed=True)
            for dy in (-1, 2, 5):
                self.line(cx - 2.5 * u, cy + dy * u, cx + 3 * u, cy + dy * u, w * 0.85, color, alpha)
        elif name == "settings":
            self.circle(cx, cy, 3 * u, stroke=color, sw=w, alpha=alpha)
            self.circle(cx, cy, 7.5 * u, stroke=color, sw=w * 0.7, alpha=alpha * 0.6)
        elif name == "sun":
            self.circle(cx, cy, 4.5 * u, stroke=color, sw=w, alpha=alpha)
            for k in range(8):
                a = k * math.pi / 4
                self.line(cx + math.cos(a) * 6.5 * u, cy + math.sin(a) * 6.5 * u,
                          cx + math.cos(a) * 9 * u, cy + math.sin(a) * 9 * u, w, color, alpha)
        else:
            self.circle(cx, cy, 7 * u, stroke=color, sw=w, alpha=alpha)

    # -- composite widgets
    def pill(self, x, y, txt, size=18, weight="semi", padx=22, h=42,
             fill=WHITE, fill_alpha=0.12, color=WHITE, border=0.25, icon=None,
             align="center"):
        tw = measure(font(weight), txt, size)
        icon_w = (size * 1.35) if icon else 0
        w = tw + padx * 2 + icon_w
        self.rrect(x, y, w, h, h / 2, fill=fill, alpha=fill_alpha, stroke=WHITE, sw=1, )
        if border > 0.3:
            pass
        cy = y + h / 2
        if icon:
            self.icon(icon, x + padx + size * 0.55, cy, size * 1.1, color, 1.9)
        self.text(txt, size, x + padx + icon_w - (2 if icon else 0) + (0 if icon else 0),
                  cy - size * 0.74, color, weight, align="right", lh=1.0)
        return w

    def content_bottom(self, pad=60, threshold=0.006):
        """Last row that holds real ink (text/cards) rather than the smooth
        background gradient, plus padding."""
        arr = np.clip(self.cv[:, :, :3], 0, 1)
        img = Image.fromarray((arr * 255).astype(np.uint8))
        small = img.resize((max(1, self.W // 4), max(1, self.H // 4)), Image.BILINEAR)
        lum = np.asarray(small.convert("L"), dtype=np.float32)
        blur = np.asarray(small.convert("L").filter(ImageFilter.GaussianBlur(6)),
                          dtype=np.float32)
        ink = np.abs(lum - blur).mean(axis=1) / 255.0
        idx = np.where(ink > threshold)[0]
        if len(idx) == 0:
            return self.h
        last = int(idx[-1] * 4 / self.ss) + pad
        return min(self.h, last)

    def crop_to(self, height):
        """Hard-crop the canvas to the given design height (for banners)."""
        height = max(1, min(self.h, int(height)))
        cut = int(height * self.ss)
        self.cv = self.cv[:cut]
        self.H, self.h = cut, height
        return height

    def trim_bottom(self, pad=60, threshold=0.006):
        keep = self.content_bottom(pad, threshold)
        if keep < self.h:
            cut = int(keep * self.ss)
            self.cv = self.cv[:cut]
            self.H = cut
            self.h = keep
        return self.h

    def save(self, path, size=None):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img = canvas_to_image(self.cv, (self.W, self.H))
        out = img.resize(size or (self.w, self.h), Image.LANCZOS)
        out.save(path)
        return path

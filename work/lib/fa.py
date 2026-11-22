"""Persian/Arabic text rendering without a browser.

Pipeline: split into script runs -> python-bidi display order per run ->
HarfBuzz shaping -> glyph outlines from fontTools -> even-odd scanline
rasterisation with numpy.  Everything is drawn on an oversampled canvas and
downscaled with LANCZOS, so output is crisp at 4x.

Only what this project needs: single colour text, left/center/right alignment,
wrapping, additive/multiplicative blending modes.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache

import numpy as np
import uharfbuzz as hb
from bidi.algorithm import get_display
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

ARABIC_RANGES = (
    (0x0600, 0x06FF),  # Arabic
    (0x0750, 0x077F),  # Arabic Supplement
    (0x08A0, 0x08FF),  # Arabic Extended-A
    (0xFB50, 0xFDFF),  # Presentation Forms-A
    (0xFE70, 0xFEFF),  # Presentation Forms-B
    (0x200C, 0x200D),  # ZWNJ / ZWJ
)


def _is_arabic(ch: str) -> bool:
    o = ord(ch)
    return any(lo <= o <= hi for lo, hi in ARABIC_RANGES)


def _is_ltr(ch: str) -> bool:
    """Latin letters, ASCII/latin digits and neutral punctuation that should
    stay embedded inside an LTR run."""
    # any digit (ASCII, Persian, Arabic-Indic) forms its own LTR run so that
    # HarfBuzz never reverses the digit order inside an RTL run.
    if unicodedata.category(ch) == "Nd":
        return True
    if "LATIN" in unicodedata.name(ch, ""):
        return True
    return False


_NEUTRAL = " \t.,:;!?()[]{}«»\"'’،؛٪%+×/\\-–—_|=*#@&$€£…\u200f\u200e"


@dataclass
class Run:
    text: str
    rtl: bool


def split_runs(text: str) -> list[Run]:
    runs: list[Run] = []
    cur = ""
    cur_kind = None
    for ch in text:
        # digits win over the Arabic-block test: Persian/Indic digits live in the
        # Arabic range but must be shaped as their own LTR run, otherwise
        # HarfBuzz reverses them inside an RTL run.
        if unicodedata.category(ch) == "Nd":
            kind = "ltr"
        elif _is_arabic(ch):
            kind = "rtl"
        elif _is_ltr(ch):
            kind = "ltr"
        else:
            kind = None  # neutral: attach to current run
        if kind and cur and cur_kind and kind != cur_kind:
            runs.append(Run(cur, cur_kind == "rtl"))
            cur = ch
            cur_kind = kind
        else:
            cur += ch
            if kind:
                cur_kind = kind
    if cur:
        runs.append(Run(cur, cur_kind == "rtl"))
    return runs


SPACES = " \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000"


MIRROR = {
    "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{",
    "\u003c": "\u003e", "\u003e": "\u003c", "\u00ab": "\u00bb", "\u00bb": "\u00ab",
    "\u2039": "\u203a", "\u203a": "\u2039",
}


def tokenize(text: str) -> list[tuple[str, str, bool]]:
    """Split into ("w", text, rtl) segments and ("sp", " ", False) whitespace.

    Words of the same script that are separated only by spaces are merged into
    one segment, so an LTR phrase such as "Cloudflare Workers AI" keeps its word
    order when the segments are reordered for an RTL line.  Whitespace between
    different scripts stays its own segment so it lands on the correct visual
    side after reordering.
    """
    raw: list[tuple[str, str, bool]] = []
    buf, sp = "", ""
    for ch in text:
        if ch in SPACES:
            if buf:
                for r in split_runs(buf):
                    raw.append(("w", r.text, r.rtl))
                buf = ""
            sp += ch
        else:
            if sp:
                raw.append(("sp", sp, False))
                sp = ""
            buf += ch
    if buf:
        for r in split_runs(buf):
            raw.append(("w", r.text, r.rtl))
    if sp:
        raw.append(("sp", sp, False))

    # merge  w(sp w)*  where all words share the same direction
    out: list[tuple[str, str, bool]] = []
    i = 0
    while i < len(raw):
        kind, chunk, rtl = raw[i]
        if kind == "w":
            text_acc = chunk
            j = i + 1
            while (j + 1 < len(raw) and raw[j][0] == "sp" and raw[j + 1][0] == "w"
                   and raw[j + 1][2] == rtl):
                text_acc += raw[j][1] + raw[j + 1][1]
                j += 2
            out.append(("w", text_acc, rtl))
            i = j
        else:
            out.append(("sp", chunk, False))
            i += 1
    return out


# ---------------------------------------------------------------- outlines
class _FlattenPen(BasePen):
    def __init__(self, glyphset, steps: int = 10):
        super().__init__(glyphset)
        self.steps = steps
        self.contours: list[list[tuple[float, float]]] = []
        self._cur: list[tuple[float, float]] | None = None

    def _moveTo(self, p):
        self._cur = [p]
        self.contours.append(self._cur)

    def _lineTo(self, p):
        if self._cur is not None:
            self._cur.append(p)

    def _quad(self, p0, p1, p2):
        n = self.steps
        for i in range(1, n + 1):
            t = i / n
            u = 1 - t
            self._cur.append(
                (
                    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
                )
            )

    def _qCurveToOne(self, p1, p2):
        self._quad(self._getCurrentPoint(), p1, p2)

    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        n = max(self.steps, 14)
        for i in range(1, n + 1):
            t = i / n
            u = 1 - t
            a, b, c, d = u**3, 3 * u * u * t, 3 * u * t * t, t**3
            self._cur.append(
                (
                    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
                    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
                )
            )


@dataclass
class Font:
    path: str
    tt: TTFont
    hbfont: hb.Font
    upem: int
    glyphset: object
    glyph_order: list[str]
    cmap: dict

    @property
    def gid_to_name(self) -> dict[int, str]:
        return {i: n for i, n in enumerate(self.glyph_order)}


@lru_cache(maxsize=32)
def load_font(path: str) -> Font:
    tt = TTFont(path, fontNumber=0, lazy=True)
    blob = hb.Blob.from_file_path(path)
    face = hb.Face(blob)
    hbfont = hb.Font(face)
    return Font(
        path=path,
        tt=tt,
        hbfont=hbfont,
        upem=tt["head"].unitsPerEm,
        glyphset=tt.getGlyphSet(),
        glyph_order=tt.getGlyphOrder(),
        cmap=tt.getBestCmap(),
    )


@lru_cache(maxsize=8192)
def _contours(font_path: str, gid: int, steps: int = 10):
    f = load_font(font_path)
    name = f.glyph_order[gid] if gid < len(f.glyph_order) else None
    if name is None:
        return ()
    pen = _FlattenPen(f.glyphset, steps)
    f.glyphset[name].draw(pen)
    return tuple(tuple(c) for c in pen.contours if len(c) > 1)


def _shape_run(font: Font, text: str, rtl: bool, features: dict | None = None):
    buf = hb.Buffer()
    if rtl:
        text = "".join(MIRROR.get(c, c) for c in text)
    buf.add_str(text)
    buf.direction = "rtl" if rtl else "ltr"
    buf.script = "arab" if rtl else "latn"
    buf.language = "fa" if rtl else "en"
    buf.cluster_level = 0
    hb.shape(font.hbfont, buf, features or {})
    return list(zip(buf.glyph_infos, buf.glyph_positions))


def _glyph_advance(font: Font, gid: int) -> int:
    return font.hbfont.get_glyph_h_advance(gid)


@dataclass
class Placed:
    gid: int
    x: float  # in px, relative to line start
    y: float


def layout_line(font: Font, text: str, size: float, base_rtl: bool = True,
                features: dict | None = None) -> tuple[list[Placed], float]:
    """Return glyphs placed left-to-right plus the line advance width."""
    scale = size / font.upem
    toks = tokenize(text)
    if base_rtl:
        toks = list(reversed(toks))
    glyphs: list[Placed] = []
    x = 0.0
    space_adv = _space_advance(font) * scale
    for kind, chunk, rtl in toks:
        if kind == "sp":
            x += space_adv * len(chunk)
            continue
        # HarfBuzz already returns glyphs in visual (left-to-right) order for
        # direction=rtl, so the logical string is the correct input.
        shaped = _shape_run(font, chunk, rtl, features)
        for info, pos in shaped:
            glyphs.append(Placed(info.codepoint, x + pos.x_offset * scale,
                                 -pos.y_offset * scale))
            x += pos.x_advance * scale
    return glyphs, x


_SPACE_CACHE: dict[str, float] = {}


def _space_advance(font: Font) -> float:
    key = font.path
    if key not in _SPACE_CACHE:
        _SPACE_CACHE[key] = float(
            font.hbfont.get_glyph_h_advance(_shape_run(font, " ", False)[0][0].codepoint)
        )
    return _SPACE_CACHE[key]


def measure(font: Font, text: str, size: float, base_rtl: bool = True) -> float:
    return layout_line(font, text, size, base_rtl)[1]


def wrap(font: Font, text: str, size: float, max_width: float,
         base_rtl: bool = True) -> list[str]:
    if max_width <= 0:
        return [text]
    words = text.split(" ")
    lines: list[str] = []
    cur = ""
    for w in words:
        cand = (cur + " " + w) if cur else w
        if measure(font, cand, size, base_rtl) <= max_width or not cur:
            cur = cand
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# --------------------------------------------------------------- rasterise
def _blit_text(canvas: np.ndarray, font: Font, text: str, size: float,
               x: float, y: float, color, mode: str = "normal",
               max_width: float = 0, align: str = "right",
               base_rtl: bool = True, line_height: float = 1.55,
               alpha: float = 1.0, letter_spacing: float = 0.0):
    """Draw text into an RGBA float canvas (H, W, 4) at 0..1 scale-free values."""
    h, w = canvas.shape[:2]
    lines = wrap(font, text, size, max_width, base_rtl) if max_width else [text]
    asc = size * 0.80
    step = size * line_height
    for i, line in enumerate(lines):
        glyphs, width = layout_line(font, line, size, base_rtl)
        if letter_spacing and glyphs:
            for k, g in enumerate(glyphs):
                g.x += k * letter_spacing
            width += letter_spacing * (len(glyphs) - 1)
        if align == "right":
            start = x - width
        elif align == "center":
            start = x - width / 2
        else:
            start = x
        baseline = y + asc + i * step
        _raster_glyphs(canvas, font, glyphs, size, start, baseline, color, mode, alpha)
    return len(lines)


def _raster_glyphs(canvas, font, glyphs, size, start_x, baseline, color,
                   mode="normal", alpha=1.0):
    h, w = canvas.shape[:2]
    scale = size / font.upem
    # bounding box of the ink (in px)
    minx = 1e18
    maxx = -1e18
    miny = 1e18
    maxy = -1e18
    pieces = []
    for g in glyphs:
        for c in _contours(font.path, g.gid):
            pts = [((start_x + g.x + px * scale), (baseline + g.y - py * scale)) for px, py in c]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            minx = min(minx, min(xs))
            maxx = max(maxx, max(xs))
            miny = min(miny, min(ys))
            maxy = max(maxy, max(ys))
            pieces.append(pts)
    if not pieces:
        return
    x0 = max(0, int(np.floor(minx)) - 2)
    x1 = min(w, int(np.ceil(maxx)) + 2)
    y0 = max(0, int(np.floor(miny)) - 2)
    y1 = min(h, int(np.ceil(maxy)) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    W = x1 - x0
    H = y1 - y0
    toggle = np.zeros((H, W), dtype=np.int32)
    rows = np.arange(H, dtype=np.float64) + y0 + 0.5
    for pts in pieces:
        n = len(pts)
        for i in range(n):
            ax, ay = pts[i]
            bx, by = pts[(i + 1) % n]
            if ay == by:
                continue
            if ay > by:
                ax, ay, bx, by = bx, by, ax, ay
            m0 = np.searchsorted(rows, ay, side="left")
            m1 = np.searchsorted(rows, by, side="left")
            if m1 <= m0:
                continue
            seg = rows[m0:m1]
            t = (seg - ay) / (by - ay)
            xs = ax + t * (bx - ax)
            xi = np.floor(xs).astype(np.int64) - x0
            np.clip(xi, 0, W - 1, out=xi)
            np.add.at(toggle, (np.arange(m0, m1), xi), 1)
    mask = (np.cumsum(toggle, axis=1) & 1).astype(np.float32)
    if mask.max() <= 0:
        return
    col = np.array(color[:3], dtype=np.float32)
    a = alpha * (color[3] if len(color) > 3 else 1.0)
    region = canvas[y0:y1, x0:x1]
    if mode == "normal":
        src_a = mask * a
        dst_a = region[:, :, 3]
        out_a = src_a + dst_a * (1 - src_a)
        safe = np.where(out_a > 0, out_a, 1)
        region[:, :, :3] = (
            col * src_a[:, :, None] + region[:, :, :3] * (dst_a * (1 - src_a))[:, :, None]
        ) / safe[:, :, None]
        region[:, :, 3] = out_a
    elif mode == "multiply":
        # keep alpha, multiply colour where ink is
        region[:, :, :3] *= 1 - (1 - col) * (mask * a)[:, :, None]
    else:  # 'screen'
        region[:, :, :3] = 1 - (1 - region[:, :, :3]) * (1 - col * (mask * a)[:, :, None])


def new_canvas(w: int, h: int, ss: int = 4):
    return np.zeros((h * ss, w * ss, 4), dtype=np.float32), ss


def canvas_to_image(canvas: np.ndarray, size):
    from PIL import Image

    arr = np.clip(canvas, 0, 1)
    img = Image.fromarray((arr * 255).round().astype(np.uint8), "RGBA")
    if img.size != size:
        img = img.resize(size, Image.LANCZOS)
    return img

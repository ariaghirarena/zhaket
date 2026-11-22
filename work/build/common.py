"""Shared visual language for all ARIAGH.AIWRITER zhaket artwork."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lib"))

from design import (AMBER, DEEP, ICE, MINT, MUTED, NAVY, ROYAL, SKY, WHITE,
                    Design)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "deliverables")

PRODUCT = "ARIAGH.AIWRITER"
VERSION = "1.9.1"
FEATURES = "۵۰۰"
PROVIDERS = "۲۱"
WP_MIN = "۵.۸"
PHP_MIN = "۷.۴"


def out_path(*parts):
    p = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def backdrop(d, intensity=1.0, top=(0.016, 0.043, 0.11), bottom=(0.055, 0.15, 0.36),
             grid=True):
    d.vgradient([(0, top), (0.5, NAVY), (1, bottom)])
    d.glow(d.w * 0.88, d.h * 0.02, d.w * 0.62, SKY, 0.26 * intensity)
    d.glow(d.w * 0.02, d.h * 0.95, d.w * 0.72, ROYAL, 0.42 * intensity)
    d.glow(d.w * 0.5, d.h * 0.55, d.w * 0.5, ROYAL, 0.18 * intensity)
    if grid:
        d.grid(step=max(28, d.w // 14), alpha=0.03)
    d.dots(step=max(18, d.w // 26), r=max(0.7, d.w / 520), alpha=0.045)
    d.noise(0.012)


def chip_row(d, items, y, height=56, gap=10, center=200, fill=0.07):
    """items: [(value, label)] drawn as small glass stat chips, centred."""
    widths = []
    for val, label in items:
        widths.append(max(d.text_width(val, height * 0.34), d.text_width(label, height * 0.21)) + 34)
    total = sum(widths) + gap * (len(items) - 1)
    x = center - total / 2
    for (val, label), w in zip(items, widths):
        d.rrect(x, y, w, height, height * 0.28, fill=WHITE, alpha=fill, stroke=WHITE, sw=0.9)
        d.text(val, height * 0.34, x + w / 2, y + height * 0.15, SKY, "xbold", align="center", lh=1.15)
        d.text(label, height * 0.21, x + w / 2, y + height * 0.60, (0.74, 0.82, 0.96),
               "medium", align="center", lh=1.15)
        x += w + gap
    return total


def feature_tile(d, x, y, w, h, icon, title, desc, icon_size=30, title_size=21,
                 desc_size=14, accent=SKY):
    d.glass(x, y, w, h, 22, alpha=0.075, blur=14, border=0.20)
    d.rrect(x + 20, y + 20, icon_size + 22, icon_size + 22, 14, fill=accent, alpha=0.16,
            stroke=accent, sw=1.0)
    d.icon(icon, x + 20 + (icon_size + 22) / 2, y + 20 + (icon_size + 22) / 2, icon_size, accent, 2.0)
    d.text(title, title_size, x + w - 20, y + 22, WHITE, "bold", align="right", maxw=w - 90, lh=1.3)
    d.text(desc, desc_size, x + w - 20, y + 22 + title_size * 1.45, (0.72, 0.81, 0.95),
           "regular", align="right", maxw=w - 44, lh=1.75)


def kpi_card(d, x, y, w, h, value, label, icon, accent=SKY):
    d.rrect(x, y, w, h, 16, fill=WHITE, alpha=0.06, stroke=WHITE, sw=0.8)
    d.icon(icon, x + 26, y + 24, 18, accent, 1.8)
    d.text(value, h * 0.36, x + w - 18, y + 16, WHITE, "xbold", align="right", lh=1.15)
    d.text(label, h * 0.20, x + w - 18, y + 16 + h * 0.44, (0.68, 0.78, 0.94), "medium",
           align="right", lh=1.2)


def bar_chart(d, x, y, w, h, values, color=SKY, bg=0.10, radius=5, gap_ratio=0.42):
    n = len(values)
    bw = w / (n * (1 + gap_ratio))
    gap = bw * gap_ratio
    for i, v in enumerate(values):
        bx = x + i * (bw + gap)
        d.rrect(bx, y, bw, h, radius, fill=WHITE, alpha=bg)
        bh = h * v
        d.rrect(bx, y + h - bh, bw, bh, radius, fill=color, alpha=0.55 + 0.35 * v)


FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def to_fa(value) -> str:
    return str(value).translate(FA_DIGITS)

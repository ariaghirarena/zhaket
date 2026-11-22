"""80x80 zhaket product icon (rendered at 320px, then LANCZOS to 80px)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image

from common import NAVY, ROYAL, SKY, WHITE, out_path
from design import Design


def build_icon():
    d = Design(80, 80, ss=4, bg=WHITE)
    # icy white plate with a soft blue wash
    d.vgradient([(0, (1, 1, 1)), (0.62, (0.965, 0.980, 1.0)), (1, (0.918, 0.949, 1.0))])
    d.glow(40, 30, 46, SKY, 0.16, "normal")
    d.glow(8, 74, 40, ROYAL, 0.10, "normal")

    # brand mark
    d.shadow(40 - 23, 9, 46, 46, 11, blur=7, alpha=0.22, dy=3, color=(0.04, 0.12, 0.30))
    d.mark(40, 32, 46, bg=ROYAL, fg=WHITE, radius_ratio=0.235)

    # product name underneath the logo (zhaket rule)
    d.text("AIWRITER", 10.4, 40, 57.5, NAVY, "black", align="center", lh=1.0)
    d.text("ARIAGH", 5.6, 40, 68.0, (0.30, 0.42, 0.62), "bold", align="center", lh=1.0,
           letter_spacing=0.7)

    master = out_path("00-icon", "aria-aiwriter-icon-320x320.png")
    d.save(master)
    img = Image.open(master).convert("RGBA")
    final = img.resize((80, 80), Image.LANCZOS)
    final.save(out_path("00-icon", "aria-aiwriter-icon-80x80.png"))
    return master


if __name__ == "__main__":
    print(build_icon())

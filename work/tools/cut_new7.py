import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout_chroma_green import cutout_chroma_green

MAP = {
    'r1': '03d-03-mascot',
    'r2': '03d-01-hero',
    'r3': '03d-02-panel',
    'r4': '03d-04-pen',
    'r5': '03d-09-shield-glass',
    'r6': '03d-24-star',
    'r7': '03d-15-stack',
}
SRC = 'work/3d/incoming2'
DST = 'work/site/assets/3d'

for k, slot in MAP.items():
    src = [f for f in os.listdir(SRC) if f.startswith(k + '.')][0]
    out = os.path.join(DST, slot + '.webp')
    cutout_chroma_green(os.path.join(SRC, src), out)
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(out).convert('RGBA').getchannel('A'))
    print(f'{slot:22s} <- {src:12s} {Image.open(out).size}  clear={(a<8).mean()*100:5.1f}%')

# --- pass 2: global chroma despill on the opaque area (removes baked green
# reflections on chrome/glass that are not near the cut edge) ---
import numpy as np
from PIL import Image

def despill(path):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mx = np.maximum(r, b)
    excess = g - mx
    kill = (al > 8) & (excess > 10)
    g2 = np.where(kill, mx, g)
    a[..., 1] = g2
    Image.fromarray(a.astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=92, method=6)
    return int(kill.sum())

"""CP3-fix 11: procedural monster sprites, one silhouette per body type (bird, bug, beast, undead, mech, dragon, humanoid, spirit).
Original art drawn with PIL primitives; no external assets. Output: public/assets/pixel/frames/m-<shape>-<action>-f<i>.png and manifest entries."""
import json, math, os
from PIL import Image, ImageDraw
ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'pixel')
S = 64  # logical pixels, upscaled x2 (nearest)
OUT = 'frames'
K = (20, 14, 24, 255)  # outline

def P(d, pts, fill): d.polygon(pts, fill=fill, outline=K)
def E(d, box, fill): d.ellipse(box, fill=fill, outline=K)
def R(d, box, fill): d.rectangle(box, fill=fill, outline=K)
def L(d, a, b, fill, w=2): d.line([a, b], fill=fill, width=w)

# Every shape faces left (towards the hero). t in [0,1) animates; lunge shifts the body left.
def bird(d, t):
    flap = math.sin(t * 2 * math.pi) * 10
    E(d, (22, 26, 46, 42), (230, 90, 40, 255))           # body
    P(d, [(30, 30), (44, 18 - flap), (50, 30)], (255, 170, 50, 255))  # wing
    E(d, (12, 20, 26, 32), (240, 110, 50, 255))          # head
    P(d, [(12, 25), (4, 28), (12, 29)], (250, 210, 60, 255))  # beak
    d.point((16, 24), fill=K)
    P(d, [(46, 32), (60, 26 + flap / 2), (60, 40), (46, 38)], (255, 200, 60, 255))  # tail
    L(d, (30, 42), (28, 54), (240, 200, 60, 255)); L(d, (38, 42), (38, 54), (240, 200, 60, 255))

def bug(d, t):
    k = math.sin(t * 2 * math.pi) * 2
    for i, x in enumerate((20, 30, 40)):
        L(d, (x, 40), (x - 6, 54 + (k if i % 2 else -k)), K, 2)
    E(d, (30, 26, 58, 46), (110, 160, 50, 255))          # abdomen
    E(d, (18, 28, 34, 42), (90, 140, 40, 255))           # thorax
    E(d, (8, 28, 20, 40), (70, 120, 30, 255))            # head
    L(d, (10, 30), (2, 18 + k), K); L(d, (14, 29), (10, 16 - k), K)
    d.point((11, 33), fill=(255, 60, 60, 255))
    for x in (36, 44, 52): L(d, (x, 28), (x, 44), (60, 90, 20, 255), 1)

def beast(d, t):
    k = math.sin(t * 2 * math.pi) * 2
    E(d, (18, 26, 54, 44), (150, 100, 60, 255))          # body
    for x, o in ((22, k), (30, -k), (44, -k), (50, k)): R(d, (x, 40, x + 4, 54 + o), (130, 85, 50, 255))
    E(d, (6, 20, 24, 36), (160, 110, 65, 255))           # head
    P(d, [(10, 22), (12, 12), (16, 21)], (130, 85, 50, 255))  # ear
    P(d, [(6, 30), (0, 34), (8, 35)], (230, 230, 220, 255))   # snout/teeth
    d.point((11, 26), fill=(255, 220, 40, 255))
    L(d, (54, 32), (62, 24 + k), (130, 85, 50, 255), 3)  # tail

def undead(d, t):
    k = math.sin(t * 2 * math.pi) * 1.5
    bone = (225, 220, 200, 255)
    E(d, (22, 6, 38, 22), bone)                          # skull
    R(d, (25, 12, 28, 15), K); R(d, (32, 12, 35, 15), K)
    for y in (26, 30, 34): L(d, (24, y), (36, y), bone, 2)  # ribs
    L(d, (30, 22), (30, 42), bone, 2)
    L(d, (30, 26), (16, 34 + k), bone, 2); L(d, (30, 26), (44, 34 - k), bone, 2)  # arms
    L(d, (16, 34 + k), (8, 20 + k), (150, 150, 160, 255), 2)  # rusty blade
    L(d, (30, 42), (24, 58), bone, 2); L(d, (30, 42), (36, 58), bone, 2)
    d.point((26, 13), fill=(120, 255, 140, 255)); d.point((33, 13), fill=(120, 255, 140, 255))

def mech(d, t):
    k = 2 if t < 0.5 else 0
    steel, dark = (150, 165, 185, 255), (90, 100, 120, 255)
    R(d, (20, 20, 44, 44), steel)                        # chassis
    R(d, (24, 8, 40, 20), dark)                          # head
    R(d, (26, 12, 38, 15), (255, 60, 50, 255))           # visor
    L(d, (32, 8), (32, 2), K); d.point((32, 1), fill=(255, 220, 60, 255))
    R(d, (8, 22 - k, 20, 30 - k), dark); R(d, (2, 24 - k, 8, 28 - k), (255, 200, 60, 255))  # cannon arm
    R(d, (44, 22, 52, 38), dark)
    R(d, (22, 44, 28, 58), dark); R(d, (36, 44, 42, 58), dark)
    for x in (26, 32, 38): d.point((x, 32), fill=(80, 220, 255, 255))

def dragon(d, t):
    flap = math.sin(t * 2 * math.pi) * 6
    scale = (60, 140, 90, 255)
    P(d, [(30, 24), (46, 4 - flap), (58, 22), (44, 26)], (90, 180, 110, 255))  # wing
    E(d, (22, 26, 52, 46), scale)                        # body
    P(d, [(26, 30), (16, 16), (24, 14), (32, 28)], scale)  # neck
    E(d, (4, 8, 22, 20), (70, 160, 100, 255))            # head
    P(d, [(14, 9), (18, 2), (19, 9)], (230, 220, 180, 255))  # horn
    P(d, [(4, 14), (0, 18), (8, 18)], (255, 120, 40, 255))   # fire breath tongue
    d.point((10, 12), fill=(255, 230, 60, 255))
    P(d, [(50, 38), (62, 46), (60, 50), (48, 44)], scale)  # tail
    R(d, (26, 44, 30, 56), scale); R(d, (42, 44, 46, 56), scale)

def humanoid(d, t):
    k = math.sin(t * 2 * math.pi) * 2
    skin, cloth = (230, 180, 140, 255), (120, 70, 150, 255)
    E(d, (24, 4, 36, 16), skin)
    d.point((27, 9), fill=K)
    R(d, (22, 16, 38, 38), cloth)
    L(d, (22, 20), (12, 30 + k), skin, 3)                # arm with club
    L(d, (12, 30 + k), (6, 14 + k), (140, 100, 60, 255), 4)
    L(d, (38, 20), (44, 34), skin, 3)
    R(d, (24, 38, 29, 58), (70, 50, 40, 255)); R(d, (31, 38, 36, 58), (70, 50, 40, 255))

def spirit(d, t):
    k = math.sin(t * 2 * math.pi) * 3
    E(d, (18, 14 + k, 46, 42 + k), (120, 220, 255, 220))   # core
    E(d, (24, 20 + k, 40, 36 + k), (230, 250, 255, 255))
    for a in range(6):
        ang = a * math.pi / 3 + t * 2 * math.pi / 6
        x, y = 32 + math.cos(ang) * 22, 28 + k + math.sin(ang) * 22
        E(d, (x - 3, y - 3, x + 3, y + 3), (255, 240, 120, 255))
    d.point((28, 26 + k), fill=K); d.point((35, 26 + k), fill=K)

SHAPES = dict(bird=bird, bug=bug, beast=beast, undead=undead, mech=mech, dragon=dragon, humanoid=humanoid, spirit=spirit)

def frame(fn, t, lunge=0, hurt=False):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    fn(ImageDraw.Draw(im), t)
    if hurt:
        px = im.load()
        for y in range(S):
            for x in range(S):
                r, g, b, a = px[x, y]
                if a: px[x, y] = (min(255, r + 90), g // 2, b // 2, a)
    if lunge: im = im.transform(im.size, Image.AFFINE, (1, 0, lunge, 0, 1, 0))
    return im.resize((S * 2, S * 2), Image.NEAREST)

man_path = os.path.join(ROOT, 'manifest.json')
man = json.load(open(man_path))
for name, fn in SHAPES.items():
    acts = {}
    for act in ('attack', 'hurt'):
        files = []
        for i in range(4):
            t = i / 4
            im = frame(fn, t, lunge=(6 if act == 'attack' and i == 2 else 0), hurt=(act == 'hurt' and i in (0, 1)))
            if act == 'hurt': im = im.transform(im.size, Image.AFFINE, (1, 0, -4 * (1 - i / 3), 0, 1, 0))
            f = f'{OUT}/m-{name}-{act}-f{i}.png'
            im.save(os.path.join(ROOT, f))
            files.append(f)
        acts[act] = {'w': S * 2, 'h': S * 2, 'anchor': S, 'files': files}
    man['chars'][f'm-{name}'] = {'scale': 2, 'actions': acts}
json.dump(man, open(man_path, 'w'))
# overview sheet
sheet = Image.new('RGBA', (S * 2 * 4, S * 2 * 2), (40, 30, 50, 255))
for i, (name, fn) in enumerate(SHAPES.items()):
    sheet.alpha_composite(frame(fn, 0), ((i % 4) * S * 2, (i // 4) * S * 2))
os.makedirs(os.path.join(os.path.dirname(__file__), '..', '.scratch', 'hv-v3', 'art-trial', 'poc'), exist_ok=True)
sheet.save(os.path.join(os.path.dirname(__file__), '..', '.scratch', 'hv-v3', 'art-trial', 'poc', 'monsters.png'))
print('ok', list(SHAPES))

# 原創像素素材產生器（CP3-D）：所有角色與背景都由本程式以幾何圖元逐格繪製，不讀入任何外部圖片。
# 風格：16 色左右的自訂調色盤、2×2 粗像素、1px 深色描邊；主角為藍銀短劍騎士、亡靈為紫色鬼火骷髏、野獸為橘色獠牙狼。
# 輸出：public/assets/pixel/frames/*.png + manifest.json（格式與 src/game/stage.ts 的 Manifest 相同），
#       並在 .scratch/hv-v3/art-trial/poc/pixel/ 產生每個動作的四格 sheet 供美術檢視。
# 用法：python3 -I scripts/gen-pixel-art.py
import json, math, random, shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'assets' / 'pixel'
SHEETS = ROOT / '.scratch' / 'hv-v3' / 'art-trial' / 'poc' / 'pixel'
PX = 2          # 每個「邏輯像素」的實際像素
ZOOM = 2        # manifest zoom（舞台以整數倍顯示）
OUTLINE = (24, 18, 32, 255)

PAL = {
  'skin': (240, 196, 150), 'steel': (176, 190, 214), 'steelD': (104, 118, 150), 'blue': (58, 96, 196), 'blueD': (34, 54, 120),
  'gold': (236, 190, 70), 'hair': (120, 64, 40), 'blade': (226, 236, 246), 'magic': (120, 230, 255),
  'bone': (226, 220, 196), 'boneD': (150, 140, 120), 'purple': (128, 64, 180), 'purpleD': (70, 30, 110), 'wisp': (170, 255, 140),
  'fur': (220, 120, 50), 'furD': (150, 70, 30), 'belly': (246, 212, 160), 'fang': (255, 255, 240), 'eye': (255, 60, 60),
}

def C(k, a=255): return PAL[k] + (a,)

class Canvas:
  def __init__(s, w, h): s.w, s.h = w, h; s.im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im)
  def rect(s, x, y, w, h, c): s.d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
  def ell(s, x, y, w, h, c): s.d.ellipse([x, y, x + w - 1, y + h - 1], fill=c)
  def poly(s, pts, c): s.d.polygon(pts, fill=c)
  def line(s, a, b, c, w=1): s.d.line([a, b], fill=c, width=w)
  def done(s):
    # 1px 描邊：透明格若鄰接不透明格即塗深色
    src = s.im.load(); out = s.im.copy(); o = out.load()
    for y in range(s.h):
      for x in range(s.w):
        if src[x, y][3] == 0 and any(0 <= x + dx < s.w and 0 <= y + dy < s.h and src[x + dx, y + dy][3] > 0 and src[x + dx, y + dy][:3] != OUTLINE[:3]
                                     for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
          o[x, y] = OUTLINE
    return out.resize((s.w * PX, s.h * PX), Image.NEAREST)

# ---------- 主角：藍銀騎士 ----------
def hero(act, f):
  W, H = {'idle': (52, 56), 'attack': (76, 58), 'hurt': (64, 68), 'cast': (56, 56)}[act]
  c = Canvas(W, H); bx = 14 if act != 'hurt' else 22
  bob = [0, 1, 1, 0][f] if act == 'idle' else 0
  lean = {'attack': [0, -2, 3, 1][f], 'hurt': [0, -3, -4, -2][f]}.get(act, 0)
  top = H - 46 + bob
  x = bx + lean
  # 腿
  c.rect(x + 4, H - 12, 5, 12, C('blueD')); c.rect(x + 13, H - 12, 5, 12, C('blueD'))
  c.rect(x + 3, H - 3, 7, 3, C('steelD')); c.rect(x + 12, H - 3, 7, 3, C('steelD'))
  # 披風
  c.poly([(x + 1, top + 18), (x - 4 - f % 2, H - 8), (x + 8, H - 10)], C('blue'))
  # 軀幹（胸甲）
  c.rect(x + 2, top + 18, 18, 18, C('steel')); c.rect(x + 2, top + 30, 18, 4, C('gold')); c.rect(x + 9, top + 20, 4, 9, C('steelD'))
  # 頭
  c.ell(x + 3, top, 16, 17, C('skin')); c.rect(x + 3, top, 16, 6, C('hair')); c.rect(x + 2, top - 2, 18, 4, C('steel'))
  c.rect(x + 13, top + 8, 2, 3, OUTLINE)
  if act == 'hurt': c.rect(x + 12, top + 12, 4, 1, OUTLINE)
  # 手與劍
  if act == 'attack':
    ang = [-60, -110, 10, 30][f]; hx, hy = x + 20, top + 22
    c.rect(hx - 2, hy - 2, 6, 6, C('skin'))
    ex, ey = hx + 30 * math.cos(math.radians(ang)), hy + 30 * math.sin(math.radians(ang))
    c.line((hx, hy), (ex, ey), C('blade'), 4); c.line((hx, hy), (hx + 6 * math.cos(math.radians(ang)), hy + 6 * math.sin(math.radians(ang))), C('gold'), 4)
    if f == 2:
      for i in range(5): c.rect(int(hx + 14 + i * 3), int(hy - 10 + i * 5), 2, 2, C('blade', 160))
  elif act == 'cast':
    hx, hy = x + 20, top + 16 - f
    c.rect(hx, hy, 5, 5, C('skin')); r = 3 + f * 2
    c.ell(hx + 8 - r // 2, hy - r // 2, r + 4, r + 4, C('magic', 200)); c.ell(hx + 10 - r // 4, hy, r // 2 + 2, r // 2 + 2, C('blade'))
    c.line((x + 1, top + 22), (x - 2, top + 40), C('steelD'), 3)
  else:
    c.rect(x + 20, top + 22, 5, 5, C('skin')); c.line((x + 22, top + 24), (x + 26, top + 4 + bob), C('blade'), 3)
  if act == 'hurt' and f in (1, 2):
    for i in range(4): c.rect(W - 8 - i * 3, 6 + i * 4, 3, 2, C('eye'))
  return c

# ---------- 亡靈：紫色鬼火骷髏 ----------
def undead(act, f):
  W, H = {'attack': (90, 74), 'hurt': (68, 66)}[act]
  c = Canvas(W, H); x = 30 if act == 'attack' else 18
  sh = {'attack': [0, 3, -6, -2][f], 'hurt': [0, 4, 6, 3][f]}[act]; x += sh
  # 長袍
  c.poly([(x, 24), (x + 26, 24), (x + 32, H - 2), (x - 6, H - 2)], C('purple'))
  c.poly([(x + 6, 30), (x + 20, 30), (x + 22, H - 2), (x + 4, H - 2)], C('purpleD'))
  for i in range(5): c.rect(x - 6 + i * 8, H - 4, 4, 3, C('purpleD'))
  # 頭骨
  c.ell(x + 3, 2, 20, 20, C('bone')); c.rect(x + 7, 16, 12, 7, C('bone'))
  c.rect(x + 7, 9, 4, 5, OUTLINE); c.rect(x + 15, 9, 4, 5, OUTLINE); c.rect(x + 8, 10, 2, 2, C('wisp')); c.rect(x + 16, 10, 2, 2, C('wisp'))
  for i in range(3): c.rect(x + 9 + i * 3, 19, 2, 3, C('boneD'))
  # 手臂與鐮刀
  if act == 'attack':
    ang = [200, 160, 260, 290][f]; hx, hy = x + 4, 32
    ex, ey = hx + 34 * math.cos(math.radians(ang)), hy + 34 * math.sin(math.radians(ang))
    c.line((x + 10, 30), (hx, hy), C('bone'), 3); c.line((hx, hy), (ex, ey), C('boneD'), 3)
    c.poly([(ex, ey), (ex + 14, ey - 6), (ex + 4, ey + 4)], C('blade'))
    if f == 2:
      for i in range(6): c.rect(int(4 + i * 4), int(44 + (i % 2) * 3), 3, 2, C('wisp', 180))
  else:
    c.line((x + 6, 30), (x - 4, 40), C('bone'), 3); c.line((x + 20, 30), (x + 30, 40), C('bone'), 3)
  # 鬼火
  for i in range(3): c.ell(x + 30 + i * 4, 10 + ((f + i) % 4) * 3, 4, 5, C('wisp', 200))
  if act == 'hurt' and f in (1, 2): c.rect(x + 2, 2, 24, 2, (255, 255, 255, 220))
  return c

# ---------- 野獸：橘色獠牙狼 ----------
def beast(act, f):
  W, H = {'attack': (95, 48), 'hurt': (65, 57)}[act]
  c = Canvas(W, H)
  if act == 'attack': x, y = 40 - [0, -4, 18, 8][f], H - 34 + [0, 2, -6, 0][f]
  else: x, y = 14 + [0, 4, 6, 3][f], H - 34 + [0, -4, -6, -2][f]
  # 尾
  c.poly([(x + 44, y + 10), (x + 54, y + 2 - f), (x + 50, y + 14)], C('fur'))
  # 身體
  c.ell(x + 8, y + 4, 40, 22, C('fur')); c.ell(x + 14, y + 14, 26, 10, C('belly'))
  # 腿
  for lx in (x + 12, x + 20, x + 34, x + 42): c.rect(lx, y + 22, 5, 12 - (2 if act == 'hurt' else 0), C('furD'))
  # 頭
  c.ell(x - 4, y - 2, 20, 18, C('fur')); c.poly([(x - 2, y + 2), (x + 2, y - 8), (x + 6, y)], C('furD')); c.poly([(x + 6, y), (x + 10, y - 8), (x + 13, y + 1)], C('furD'))
  c.rect(x - 12, y + 6, 12, 8, C('fur')); c.rect(x - 13, y + 6, 3, 3, OUTLINE)
  c.rect(x + 1, y + 4, 3, 3, C('eye'))
  jaw = 4 if (act == 'attack' and f == 2) else 0
  c.rect(x - 12, y + 13 + jaw, 10, 3, C('furD')); c.rect(x - 10, y + 12, 2, 3 + jaw, C('fang')); c.rect(x - 5, y + 12, 2, 3 + jaw, C('fang'))
  if act == 'attack' and f == 2:
    for i in range(3): c.line((4 + i * 4, 4), (i * 4, 24), C('blade', 200), 2)
  if act == 'hurt' and f in (1, 2): c.rect(x + 8, y + 4, 30, 2, (255, 255, 255, 220))
  return c

# ---------- 背景：塔內石室 ----------
def background():
  W, H = 550, 310; rnd = random.Random(20261025)
  im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
  for y in range(H):
    t = y / H; d.line([(0, y), (W, y)], fill=(int(28 + 30 * t), int(24 + 20 * t), int(52 + 10 * t)))
  floor = 220
  for row in range(0, floor, 16):
    off = 0 if (row // 16) % 2 else 14
    for col in range(-28 + off, W, 28):
      g = rnd.randint(-8, 8); d.rectangle([col + 1, row + 1, col + 26, row + 14], fill=(58 + g, 54 + g, 82 + g))
  for x in (90, 275, 460):
    d.rectangle([x - 22, 30, x + 22, 150], fill=(20, 16, 34)); d.ellipse([x - 22, 10, x + 22, 54], fill=(20, 16, 34))
    d.rectangle([x - 2, 30, x + 1, 150], fill=(40, 34, 60))
  for x in (180, 370):
    d.rectangle([x - 3, 110, x + 3, 130], fill=(90, 60, 40))
    for r, col in ((14, (255, 120, 40)), (9, (255, 200, 80)), (4, (255, 250, 200))): d.ellipse([x - r // 2 - 2, 104 - r, x + r // 2 + 2, 110], fill=col)
  for y in range(floor, H):
    t = (y - floor) / (H - floor); d.line([(0, y), (W, y)], fill=(int(70 - 30 * t), int(56 - 24 * t), int(60 - 20 * t)))
  for i in range(0, W, 36): d.line([(i, floor), (i - 60 + (i % 3) * 10, H)], fill=(44, 34, 42))
  d.line([(0, floor), (W, floor)], fill=(96, 82, 92), width=2)
  for _ in range(140):
    x, y = rnd.randrange(W), rnd.randrange(floor); im.putpixel((x, y), (80, 72, 110))
  return im

SPECS = {'hero': (hero, ['idle', 'attack', 'hurt', 'cast'], 0.45), 'undead': (undead, ['attack', 'hurt'], 0.42), 'beast': (beast, ['attack', 'hurt'], 0.4)}

def main():
  if OUT.exists(): shutil.rmtree(OUT)
  fr = OUT / 'frames'; fr.mkdir(parents=True)
  if SHEETS.exists(): shutil.rmtree(SHEETS)
  SHEETS.mkdir(parents=True)
  bg = background(); bg.save(fr / 'bg.png'); bg.save(SHEETS / 'bg.png')
  man = {'zoom': ZOOM, 'bg': 'frames/bg.png', 'chars': {}}
  for name, (fn, acts, anc) in SPECS.items():
    actions = {}
    for a in acts:
      ims = [fn(a, i).done() for i in range(4)]
      w, h = ims[0].size; files = []
      sheet = Image.new('RGBA', (w * 4, h))
      for i, im in enumerate(ims):
        p = f'frames/{name}-{a}-f{i}.png'; im.save(OUT / p); files.append(p); sheet.paste(im, (i * w, 0))
      sheet.save(SHEETS / f'{name}-{a}.png')
      actions[a] = {'w': w, 'h': h, 'anchor': round(w * anc), 'files': files}
    man['chars'][name] = {'scale': ZOOM, 'actions': actions}
  (OUT / 'manifest.json').write_text(json.dumps(man, indent=2, ensure_ascii=False) + '\n')
  print('ok', sum(len(a['files']) for c in man['chars'].values() for a in c['actions'].values()), 'frames')

main()

# 原創圖示產生器（CP3-fix 7）：裝備與法術圖示全部由本程式以幾何圖元繪製，不讀入任何外部圖片。
# 16×16 邏輯像素、×2 粗像素、1px 深色描邊（與 gen-pixel-art.py 同風格）。
# 裝備：武器依底材（劍／斧／棍／短劍／鐮刀／雙節劍刃／法杖／盾），防具依部位 × 布／輕／重三種配色。
# 法術：每個元素一個形狀不同、顏色不同的符號（火焰、雪花、閃電、旋風、聖光、骷髏），色盲時靠形狀也能分辨。
# 輸出：public/assets/icons/*.png + index.json；檢視用總覽 .scratch/hv-v3/art-trial/poc/icons.png
# 用法：python3 -I scripts/gen-icons.py
import json, math, shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'assets' / 'icons'
SHEET = ROOT / '.scratch' / 'hv-v3' / 'art-trial' / 'poc' / 'icons.png'
N, PX = 16, 2
OUTLINE = (24, 18, 32, 255)
def rgb(h, a=255): return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)

class Cv:
  def __init__(s): s.im = Image.new('RGBA', (N, N), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im)
  def r(s, x, y, w, h, c): s.d.rectangle([x, y, x + w - 1, y + h - 1], fill=rgb(c))
  def p(s, pts, c): s.d.polygon(pts, fill=rgb(c))
  def l(s, a, b, c, w=1): s.d.line([a, b], fill=rgb(c), width=w)
  def e(s, x, y, w, h, c): s.d.ellipse([x, y, x + w - 1, y + h - 1], fill=rgb(c))
  def px(s, x, y, c): s.im.putpixel((x, y), rgb(c))
  def done(s):
    src = s.im.load(); out = s.im.copy(); o = out.load()
    for y in range(N):
      for x in range(N):
        if src[x, y][3] == 0 and any(0 <= x + dx < N and 0 <= y + dy < N and src[x + dx, y + dy][3] > 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
          o[x, y] = OUTLINE
    return out.resize((N * PX, N * PX), Image.NEAREST)

STEEL, STEEL_D, WOOD, WOOD_D, GOLD = '#d8e2f0', '#8090b0', '#a06a3a', '#6a4020', '#ecbe46'

def sword(c, long=False):
  t = 1 if long else 3
  c.l((t, 14 - t), (11, 4), STEEL, 2); c.l((t + 1, 14 - t), (11, 5), STEEL_D)
  c.px(12, 3, STEEL); c.l((2, 10), (6, 14), GOLD, 2); c.l((1, 15), (3, 13), WOOD, 2)
def rapier(c): c.l((3, 12), (14, 1), STEEL); c.l((2, 10), (5, 13), GOLD); c.e(1, 11, 4, 4, GOLD); c.px(2, 14, WOOD)
def dagger(c): c.p([(5, 10), (12, 3), (13, 4), (6, 11)], STEEL); c.l((4, 9), (7, 12), GOLD, 2); c.l((2, 14), (5, 11), WOOD, 2)
def axe(c): c.l((3, 14), (11, 3), WOOD, 2); c.p([(8, 2), (14, 1), (15, 8), (11, 7)], STEEL); c.l((14, 1), (15, 8), STEEL_D)
def club(c): c.l((2, 14), (8, 8), WOOD, 2); c.e(7, 2, 7, 8, WOOD_D); c.px(9, 4, STEEL); c.px(12, 6, STEEL); c.px(10, 8, STEEL)
def mace(c): c.l((2, 14), (9, 7), WOOD, 2); c.e(8, 2, 7, 7, STEEL_D); c.e(9, 3, 5, 5, STEEL); [c.px(x, y, STEEL) for x, y in ((11, 1), (15, 5), (7, 5), (11, 9))]
def scythe(c): c.l((3, 15), (10, 1), WOOD, 2); c.p([(9, 1), (2, 3), (1, 6), (6, 4), (10, 3)], STEEL)
def chucks(c): c.l((2, 13), (6, 9), STEEL, 2); c.l((9, 6), (14, 2), STEEL, 2); c.l((6, 9), (9, 6), STEEL_D); c.r(5, 9, 2, 2, GOLD); c.r(9, 5, 2, 2, GOLD)
def staff(c): c.l((3, 15), (11, 5), WOOD, 2); c.e(9, 1, 6, 6, '#78e6ff'); c.px(11, 2, '#ffffff')
def shield(c, kind):
  if kind == 'buckler': c.e(2, 2, 12, 12, STEEL_D); c.e(4, 4, 8, 8, STEEL); c.e(7, 7, 2, 2, GOLD)
  elif kind == 'tower': c.r(3, 1, 10, 14, '#3a60c4'); c.r(4, 2, 8, 12, '#5a80e0'); c.r(7, 2, 2, 12, GOLD)
  elif kind == 'force': c.e(1, 1, 14, 14, '#78e6ff'); c.e(3, 3, 10, 10, '#b8f4ff'); c.e(6, 6, 4, 4, '#ffffff')
  else: c.p([(2, 2), (13, 2), (13, 8), (8, 15), (2, 8)], '#c04040'); c.p([(4, 4), (11, 4), (11, 8), (8, 12), (4, 8)], '#e06060'); c.r(7, 3, 2, 9, GOLD)

ARMOR = {'cloth': ('#9a7ad0', '#6a4ca0'), 'light': ('#b07840', '#784a20'), 'heavy': ('#b8c4d8', '#7080a0')}
def armor(c, slot, fam):
  a, b = ARMOR[fam]
  if slot == 'head':
    if fam == 'cloth': c.p([(3, 12), (8, 1), (13, 12)], a); c.r(2, 12, 12, 2, b)
    else: c.e(3, 3, 10, 10, a); c.r(3, 8, 10, 5, a); c.r(5, 9, 6, 2, b if fam == 'light' else '#303848')
  elif slot == 'body': c.p([(2, 3), (6, 2), (10, 2), (14, 3), (14, 7), (12, 7), (12, 14), (4, 14), (4, 7), (2, 7)], a); c.r(7, 3, 2, 11, b)
  elif slot == 'hands': c.r(4, 3, 8, 9, a); c.r(2, 6, 3, 4, a); c.r(4, 12, 8, 3, b); [c.l((x, 3), (x, 6), b) for x in (6, 8, 10)]
  elif slot == 'legs': c.r(3, 2, 10, 4, b); c.r(3, 5, 4, 10, a); c.r(9, 5, 4, 10, a)
  else: c.r(4, 2, 5, 9, a); c.r(4, 10, 10, 4, a); c.r(4, 13, 10, 2, b)

WEAPON = {'axe': axe, 'club': club, 'rapier': rapier, 'shortsword': sword, 'wakizashi': sword, 'dagger': dagger,
          'longsword': lambda c: sword(c, True), 'estoc': rapier, 'katana': lambda c: sword(c, True), 'scythe': scythe, 'mace': mace, 'swordchucks': chucks}

def flame(c): c.p([(8, 1), (13, 9), (11, 14), (5, 14), (3, 9)], '#ff6a2a'); c.p([(8, 6), (11, 11), (8, 14), (5, 11)], '#ffd04a')
def snow(c):
  for a in range(3):
    t = a * math.pi / 3; dx, dy = 7 * math.cos(t), 7 * math.sin(t)
    c.l((round(8 - dx), round(8 - dy)), (round(8 + dx), round(8 + dy)), '#7fd8ff', 2)
  c.r(7, 7, 2, 2, '#ffffff')
def bolt(c): c.p([(10, 0), (3, 9), (8, 9), (5, 15), (13, 6), (8, 6)], '#fff04a'); c.l((10, 0), (8, 6), '#c0a000')
def gust(c):
  for i, (y, w) in enumerate([(3, 11), (7, 13), (11, 9)]): c.l((1 + i, y), (w, y), '#8affb0', 2); c.e(w - 1, y - 2, 4, 4, '#4ad080')
def holy(c): c.e(2, 2, 12, 12, '#fff8c8'); c.r(7, 1, 2, 14, '#ecbe46'); c.r(2, 6, 12, 2, '#ecbe46')
def dark(c): c.e(2, 1, 12, 11, '#b060ff'); c.r(5, 11, 6, 4, '#b060ff'); c.r(4, 5, 3, 3, '#200830'); c.r(9, 5, 3, 3, '#200830'); c.px(8, 9, '#200830'); [c.px(x, 14, '#200830') for x in (6, 8, 10)]
# CP3-fix 12: command / skill / potion glyphs for the battle bar.
def c_attack(c): sword(c)
def c_defend(c): shield(c, 'kite')
def c_focus(c): c.e(1, 4, 14, 8, '#e8f0ff'); c.e(5, 4, 6, 8, '#4aa0ff'); c.e(7, 6, 2, 4, '#102040')
def c_spirit(c): c.e(1, 1, 14, 14, '#7a40c0'); c.p([(8, 2), (12, 8), (8, 14), (4, 8)], '#e0b0ff'); c.e(6, 6, 4, 4, '#ffffff')
def k_bash(c): shield(c, 'buckler'); [c.px(x, y, '#fff04a') for x, y in ((13, 1), (14, 2), (12, 2), (13, 3), (1, 13), (2, 12))]
def k_vital(c): dagger(c); c.e(11, 10, 4, 5, '#e02030'); c.px(12, 9, '#e02030')
def k_merciful(c): axe(c); c.e(1, 9, 6, 6, '#e8e0d0'); c.px(2, 11, '#200810'); c.px(5, 11, '#200810')
def bottle(col):
  def f(c): c.r(6, 1, 4, 3, '#a06a3a'); c.r(5, 4, 6, 2, '#d8e2f0'); c.e(2, 5, 12, 10, '#d8e2f0'); c.e(3, 7, 10, 8, col); c.px(5, 8, '#ffffff')
  return f
CMDS = {'c-attack': c_attack, 'c-defend': c_defend, 'c-focus': c_focus, 'c-spirit': c_spirit,
        'k-shieldBash': k_bash, 'k-vitalStrike': k_vital, 'k-mercifulBlow': k_merciful,
        'p-health': bottle('#e03040'), 'p-mana': bottle('#3070f0'), 'p-spirit': bottle('#40d080')}
SPELLS = {'fiery': flame, 'freeze': snow, 'shock': bolt, 'gale': gust, 'smite': holy, 'corruption': dark}

def main():
  if OUT.exists(): shutil.rmtree(OUT)
  OUT.mkdir(parents=True)
  icons = {}
  def save(key, fn):
    c = Cv(); fn(c); c.done().save(OUT / f'{key}.png'); icons[key] = f'{key}.png'
  for k, f in WEAPON.items(): save(f'w-{k}', f)
  save('w-staff', staff)
  for k in ('buckler', 'kite', 'tower', 'force'): save(f's-{k}', lambda c, k=k: shield(c, k))
  for fam in ARMOR:
    for sl in ('head', 'body', 'hands', 'legs', 'feet'): save(f'a-{fam}-{sl}', lambda c, s=sl, f=fam: armor(c, s, f))
  for k, f in SPELLS.items(): save(f'sp-{k}', f)
  for k, f in CMDS.items(): save(k, f)
  (OUT / 'index.json').write_text(json.dumps(icons, indent=1) + '\n')
  ims = [Image.open(OUT / v) for v in icons.values()]
  cols = 10; S = N * PX * 2 + 8
  sheet = Image.new('RGBA', (cols * S, math.ceil(len(ims) / cols) * S), (40, 36, 52, 255))
  for i, im in enumerate(ims):
    big = im.resize((N * PX * 2,) * 2, Image.NEAREST); sheet.paste(big, ((i % cols) * S + 4, (i // cols) * S + 4), big)
  SHEET.parent.mkdir(parents=True, exist_ok=True); sheet.save(SHEET)
  print('ok', len(icons), 'icons')

main()

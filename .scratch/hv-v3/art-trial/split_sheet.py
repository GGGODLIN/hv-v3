# 把 AI 畫的 N 格 sheet 依連通區塊切開：格距不均、劍會伸進隔壁格，等寬切會切斷。
# 水平以腳底中心對齊；垂直保留原圖高度（以整張 sheet 最低點當地面），否則跳躍、撲咬的騰空會被壓回地面。
# 用法：python3 -I split_sheet.py <sheet.png> <輸出前綴> <格數>
import sys
from collections import deque
from PIL import Image


def components(im):
  w, h = im.size
  a = im.getchannel('A').load()
  lab = [[0] * w for _ in range(h)]
  comps = []
  for y in range(h):
    for x in range(w):
      if a[x, y] > 16 and not lab[y][x]:
        cid = len(comps) + 1
        q = deque([(x, y)])
        lab[y][x] = cid
        px = []
        while q:
          cx, cy = q.popleft()
          px.append((cx, cy))
          for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and not lab[ny][nx] and a[nx, ny] > 16:
              lab[ny][nx] = cid
              q.append((nx, ny))
        comps.append(px)
  return comps


def split(src, out_prefix, n):
  im = Image.open(src).convert('RGBA')
  comps = sorted(components(im), key=len, reverse=True)
  # 兩格相黏（劍尖碰到隔壁披風）時，在相連最細的那一欄切開
  while len([c for c in comps if len(c) > len(comps[0]) * 0.2]) < n:
    big = comps.pop(0)
    xs = [p[0] for p in big]
    x0, x1 = min(xs), max(xs)
    col = {}
    for x, _ in big:
      col[x] = col.get(x, 0) + 1
    lo, hi = x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4
    cut = min(range(lo, hi + 1), key=lambda x: col.get(x, 0))
    comps += [[p for p in big if p[0] < cut], [p for p in big if p[0] >= cut]]
    comps.sort(key=len, reverse=True)
  bodies = sorted(comps[:n], key=lambda c: sum(p[0] for p in c) / len(c))
  groups = [list(b) for b in bodies]
  centers = [sum(p[0] for p in b) / len(b) for b in bodies]
  for c in comps[n:]:
    cx = sum(p[0] for p in c) / len(c)
    groups[min(range(n), key=lambda i: abs(centers[i] - cx))].extend(c)
  ground = max(p[1] for g in groups for p in g)
  frames = []
  for g in groups:
    ys = [p[1] for p in g]
    top, bot = min(ys), max(ys)
    feet = [p[0] for p in g if p[1] > bot - (bot - top) * 0.12]
    frames.append((g, sum(feet) / len(feet)))
  L = max(fx - min(p[0] for p in g) for g, fx in frames)
  R = max(max(p[0] for p in g) - fx for g, fx in frames)
  T = max(ground - min(p[1] for p in g) for g, _ in frames)
  W, H = int(L + R) + 4, int(T) + 4
  src_px = im.load()
  files = []
  for i, (g, fx) in enumerate(frames):
    o = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    op = o.load()
    for x, y in g:
      op[int(x - fx + L) + 2, int(y - ground + T) + 2] = src_px[x, y]
    f = f'{out_prefix}{i}.png'
    o.save(f)
    files.append(f)
  # anchor：腳底中心在格子裡的 x；格子底邊就是地面
  return {'w': W, 'h': H, 'anchor': int(L) + 2, 'files': files}


if __name__ == '__main__':
  print(split(sys.argv[1], sys.argv[2], int(sys.argv[3])))

# 像素素材建置（可重跑）：POC 的切格、固定比例尺、腳底錨點與像素化流程，輸出到 Vite 會直接服務的 public/assets/pixel/。
# 來源是美術 POC 的四格 sheet（唯讀，不改動）；輸出是單格 PNG 加 manifest.json（每格尺寸、錨點、每個角色的比例尺）。
# 用法：python3 -I scripts/build-assets.py
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / '.scratch' / 'hv-v3' / 'art-trial'
SRC = ART / 'poc' / 'pixel'
OUT = ROOT / 'public' / 'assets' / 'pixel'

sys.path.insert(0, str(ART))
from split_sheet import split  # noqa: E402

# 角色站姿的目標高度（邏輯像素）；同一角色的所有動作共用一個比例尺，換動作才不會忽大忽小
CHARS = {
  'hero':   {'height': 220, 'actions': ['idle', 'attack', 'hurt', 'cast']},
  'undead': {'height': 230, 'actions': ['attack', 'hurt']},
  'beast':  {'height': 170, 'actions': ['attack', 'hurt']},
}
# 以整數倍放大顯示，像素格才會大小一致；主角約 110px 高、2 倍放大、48 色（POC 實測定案）
PIXEL_ZOOM = 2
PIXEL_COLORS = 48
STAGE_WIDTH = 1100  # 舞台邏輯寬度，背景縮到 STAGE_WIDTH / PIXEL_ZOOM


def pixelize(path, factor):
  im = Image.open(path).convert('RGBA')
  w, h = max(1, round(im.width * factor)), max(1, round(im.height * factor))
  small = im.resize((w, h), Image.BOX)
  alpha = small.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
  rgb = small.convert('RGB').quantize(colors=PIXEL_COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
  rgb.putalpha(alpha)
  rgb.save(path)


def main():
  if OUT.exists():
    shutil.rmtree(OUT)
  frames = OUT / 'frames'
  frames.mkdir(parents=True)

  bg = Image.open(SRC / 'bg.png').convert('RGB')
  f = STAGE_WIDTH / PIXEL_ZOOM / bg.width
  bg = bg.resize((round(bg.width * f), round(bg.height * f)), Image.BOX)
  bg.quantize(colors=PIXEL_COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB').save(frames / 'bg.png')

  manifest = {'zoom': PIXEL_ZOOM, 'bg': 'frames/bg.png', 'chars': {}}
  for name, spec in CHARS.items():
    actions = {}
    for act in spec['actions']:
      sheet = SRC / f'{name}-{act}.png'
      if not sheet.exists():
        raise SystemExit(f'missing source sheet: {sheet}')
      actions[act] = split(str(sheet), str(frames / f'{name}-{act}-f'), 4)
    first = next(iter(actions.values()))
    box = Image.open(first['files'][0]).getchannel('A').getbbox()
    stand = box[3] - box[1]
    factor = spec['height'] / stand / PIXEL_ZOOM
    for a in actions.values():
      for path in a['files']:
        pixelize(path, factor)
      a['w'], a['h'], a['anchor'] = round(a['w'] * factor), round(a['h'] * factor), round(a['anchor'] * factor)
      a['files'] = [Path(p).relative_to(OUT).as_posix() for p in a['files']]
    manifest['chars'][name] = {'scale': PIXEL_ZOOM, 'actions': actions}
    print(name, 'stand px', stand, 'actions', list(actions), 'frames', sum(len(a['files']) for a in actions.values()))

  (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
  print('wrote', (OUT / 'manifest.json').relative_to(ROOT))


main()

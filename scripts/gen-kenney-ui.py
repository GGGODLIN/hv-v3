# rc17: tint Kenney UI Pack 2.0 (CC0, kenney.nl/assets/ui-pack, downloaded 2026-10-27) into the game palette.
# Usage: python3 scripts/gen-kenney-ui.py <unzipped kenney_ui-pack dir>
import sys; from PIL import Image, ImageOps
src, out = sys.argv[1] + '/PNG', 'public/assets/kenney/'
def tint(f, dark, light, name, alpha=1.0):
    im = Image.open(f'{src}/{f}').convert('RGBA'); a = im.getchannel('A')
    g = ImageOps.colorize(ImageOps.grayscale(im), dark, light).convert('RGBA')
    g.putalpha(a.point(lambda v: int(v * alpha))); g.save(out + name)
tint('Grey/Default/button_square_depth_flat.png', '#120e1a', '#3a3150', 'btn.png')
tint('Grey/Default/button_square_depth_flat.png', '#1a1426', '#57497a', 'btn-hover.png')
tint('Yellow/Default/button_square_depth_gradient.png', '#3a2208', '#e8b04a', 'btn-main.png')
tint('Red/Default/button_square_depth_gradient.png', '#2a0806', '#d9443c', 'btn-danger.png')
tint('Grey/Default/button_square_border.png', '#0e0b14', '#4a4060', 'panel.png', 0.97)
tint('Grey/Default/button_square_flat.png', '#0c0a10', '#2a2436', 'bar.png')
tint('Extra/Default/divider.png', '#000', '#e8b04a', 'divider.png')
tint('Yellow/Default/star.png', '#5a3a08', '#ffd27a', 'star.png')
print('ok')

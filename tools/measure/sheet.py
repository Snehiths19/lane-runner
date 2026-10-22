# Tiles frames into a labeled contact sheet: sheet.py <frames_dir> <out.png> <t_ref> <step> <crop x0,y0,x1,y1> <start_s> <end_s>
import sys, os
from PIL import Image, ImageDraw, ImageFont
FONT = ImageFont.load_default(size=20)
d, out, t_ref, step = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
crop = tuple(int(v) for v in sys.argv[5].split(','))
t0, t1 = float(sys.argv[6]), float(sys.argv[7])
files = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
picked = [f for f in files if t0 <= float(f[:-4]) - t_ref <= t1][::step]
tiles = []
for f in picked:
    im = Image.open(os.path.join(d, f)).crop(crop)
    im.thumbnail((240, 240))
    dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 92, 26), fill=(0, 0, 0)); dr.text((4, 2), f"{float(f[:-4]) - t_ref:+.3f}", fill=(255, 255, 0), font=FONT)
    tiles.append(im)
cols = 6
w, h = tiles[0].size
sheet = Image.new('RGB', (cols * w, ((len(tiles) + cols - 1) // cols) * h), 'white')
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * w, (i // cols) * h))
sheet.save(out)
print(len(tiles), 'tiles', sheet.size)

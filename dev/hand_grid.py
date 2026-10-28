import sys
from PIL import Image
tag = sys.argv[1]
names = ['rest', 'up', 'wave', 'umb']
g = Image.new('RGB', (1600, 840), 'white')
for i, n in enumerate(names):
    g.paste(Image.open(f'shots/hand-{tag}-{n}-body.png'), (i * 400, 0))
    g.paste(Image.open(f'shots/hand-{tag}-{n}-close.png'), (i * 400, 420))
g.save(f'shots/hand-{tag}.png')

"""Re-encode the textures inside a VRM/GLB (smaller sizes for phones) and rebuild the binary chunk."""
import io, json, struct, sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read()
jlen, _ = struct.unpack('<II', b[12:20])
j = json.loads(b[20:20 + jlen])
blen, _ = struct.unpack('<II', b[20 + jlen:28 + jlen])
bin_ = b[28 + jlen:28 + jlen + blen]

views = [bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in j['bufferViews']]

def limit(name):
    if name == 'Thumbnail': return 256
    if name.endswith('_nml'): return 512
    return 1024

for im in j['images']:
    i = im['bufferView']
    pi = Image.open(io.BytesIO(views[i]))
    m = limit(im.get('name', ''))
    if max(pi.size) > m:
        s = m / max(pi.size)
        pi = pi.resize((max(1, round(pi.size[0] * s)), max(1, round(pi.size[1] * s))), Image.LANCZOS)
    out = io.BytesIO(); pi.save(out, 'PNG', optimize=True)
    if len(out.getvalue()) < len(views[i]):
        views[i] = out.getvalue()

new = bytearray()
for v, data in zip(j['bufferViews'], views):
    while len(new) % 4: new.append(0)
    v['byteOffset'] = len(new); v['byteLength'] = len(data)
    new += data
while len(new) % 4: new.append(0)
j['buffers'][0]['byteLength'] = len(new)

js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode('utf8')
while len(js) % 4: js += b' '
total = 12 + 8 + len(js) + 8 + len(new)
out = struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(new), 0x004E4942) + bytes(new)
open(dst, 'wb').write(out)
print(len(b), '->', len(out))

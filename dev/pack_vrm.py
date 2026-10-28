"""配信用にVRMを小さくする:テクスチャをWebP(透明度つき)に変換し、gzipで圧縮したファイルも作る。

使い方: python3 -I pack_vrm.py 入力.vrm 出力.vrm [品質(既定85)]
出力.vrm と 出力.vrm.gz を書き出す。見た目に関わる形状・表情データはそのまま。
"""
import gzip
import io
import json
import struct
import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
quality = int(sys.argv[3]) if len(sys.argv) > 3 else 85
b = open(src, 'rb').read()
jlen, _ = struct.unpack('<II', b[12:20])
j = json.loads(b[20:20 + jlen])
blen, _ = struct.unpack('<II', b[20 + jlen:28 + jlen])
bin_ = b[28 + jlen:28 + jlen + blen]
views = [bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in j['bufferViews']]

saved = 0
for im in j.get('images', []):
    i = im['bufferView']
    data = views[i]
    try:
        pi = Image.open(io.BytesIO(data))
        pi.load()
    except Exception:
        continue
    has_alpha = pi.mode in ('RGBA', 'LA') or (pi.mode == 'P' and 'transparency' in pi.info)
    pi = pi.convert('RGBA' if has_alpha else 'RGB')
    out = io.BytesIO()
    # normal maps keep more detail
    q = 92 if (im.get('name') or '').endswith('_nml') else quality
    pi.save(out, 'WEBP', quality=q, method=6, exact=True)
    if len(out.getvalue()) < len(data) * 0.9:
        saved += len(data) - len(out.getvalue())
        views[i] = out.getvalue()
        im['mimeType'] = 'image/webp'

new = bytearray()
for v, data in zip(j['bufferViews'], views):
    while len(new) % 4:
        new.append(0)
    v['byteOffset'] = len(new)
    v['byteLength'] = len(data)
    new += data
while len(new) % 4:
    new.append(0)
j['buffers'][0]['byteLength'] = len(new)
js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode('utf8')
while len(js) % 4:
    js += b' '
total = 12 + 8 + len(js) + 8 + len(new)
out = struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(new), 0x004E4942) + bytes(new)
open(dst, 'wb').write(out)
gz = gzip.compress(out, compresslevel=9, mtime=0)
open(dst + '.gz', 'wb').write(gz)
print(f'{len(b)//1024}KB -> {len(out)//1024}KB (webp, saved {saved//1024}KB) -> gzip {len(gz)//1024}KB')

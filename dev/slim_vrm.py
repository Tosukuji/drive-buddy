"""VRM(glb)を軽くする。見た目に関わるデータは残す。

- 表情(モーフターゲット)の位置・法線データを「0でない頂点だけ」を記録するスパース形式に変える
  (顔以外の頂点は変化しないため、ほとんどが0)
- three.js が使わないモーフの接線(TANGENT)データを捨てる
- テクスチャは shrink_vrm.py と同じ上限で縮小する(--tex を付けたとき)
- 使われていないバッファ領域を詰めて書き出す

使い方: python3 -I slim_vrm.py 入力.vrm 出力.vrm [--tex]
"""
import io
import json
import struct
import sys

import numpy as np

src, dst = sys.argv[1], sys.argv[2]
do_tex = '--tex' in sys.argv

b = open(src, 'rb').read()
jlen, _ = struct.unpack('<II', b[12:20])
j = json.loads(b[20:20 + jlen])
blen, _ = struct.unpack('<II', b[20 + jlen:28 + jlen])
bin_ = b[28 + jlen:28 + jlen + blen]

COMP = {5120: ('i1', 1), 5121: ('u1', 1), 5122: ('i2', 2), 5123: ('u2', 2), 5125: ('u4', 4), 5126: ('f4', 4)}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}


def view_bytes(i):
    v = j['bufferViews'][i]
    o = v.get('byteOffset', 0)
    return bin_[o:o + v['byteLength']]


def accessor_array(a):
    """アクセサのデータを (count, ncomp) の配列で返す(スパースは展開しない前提)。"""
    acc = j['accessors'][a]
    assert 'sparse' not in acc, 'already sparse'
    dt, size = COMP[acc['componentType']]
    n = NCOMP[acc['type']]
    v = j['bufferViews'][acc['bufferView']]
    stride = v.get('byteStride') or size * n
    raw = view_bytes(acc['bufferView'])
    off = acc.get('byteOffset', 0)
    if stride == size * n:
        arr = np.frombuffer(raw, dtype='<' + dt, count=acc['count'] * n, offset=off).reshape(acc['count'], n)
    else:
        arr = np.stack([np.frombuffer(raw, dtype='<' + dt, count=n, offset=off + k * stride) for k in range(acc['count'])])
    return arr


# ---- 新しいバッファを組み立てる ----
out = bytearray()
new_views = []


def add_view(data, target=None):
    while len(out) % 4:
        out.append(0)
    v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}
    if target:
        v['target'] = target
    out.extend(data)
    new_views.append(v)
    return len(new_views) - 1


# モーフで使われているアクセサを集める(接線は捨てる)
morph_acc = set()
for m in j['meshes']:
    for p in m['primitives']:
        for t in p.get('targets', []):
            t.pop('TANGENT', None)
            for a in t.values():
                morph_acc.add(a)

# 参照されているアクセサ
used_acc = set()
for m in j['meshes']:
    for p in m['primitives']:
        used_acc.update(p['attributes'].values())
        if 'indices' in p:
            used_acc.add(p['indices'])
        for t in p.get('targets', []):
            used_acc.update(t.values())
for s in j.get('skins', []):
    if 'inverseBindMatrices' in s:
        used_acc.add(s['inverseBindMatrices'])
for an in j.get('animations', []):
    for s in an['samplers']:
        used_acc.update([s['input'], s['output']])

saved_sparse = 0
for ai, acc in enumerate(j['accessors']):
    if 'sparse' in acc:
        # すでにスパース形式のもの:参照先のデータをそのまま新しいバッファへ移す
        sp = acc['sparse']
        for part in ('indices', 'values'):
            d = view_bytes(sp[part]['bufferView'])
            o = sp[part].get('byteOffset', 0)
            ln = sp['count'] * (COMP[sp['indices']['componentType']][1] if part == 'indices' else COMP[acc['componentType']][1] * NCOMP[acc['type']])
            sp[part]['bufferView'] = add_view(d[o:o + ln]); sp[part]['byteOffset'] = 0
        if 'bufferView' in acc:
            base = view_bytes(acc['bufferView'])
            o = acc.get('byteOffset', 0); ln = acc['count'] * COMP[acc['componentType']][1] * NCOMP[acc['type']]
            acc['bufferView'] = add_view(base[o:o + ln]); acc['byteOffset'] = 0
        continue
    if ai not in used_acc or 'bufferView' not in acc:
        continue
    if ai in morph_acc and acc['componentType'] == 5126 and acc['type'] == 'VEC3':
        arr = accessor_array(ai).astype('<f4')
        nz = np.nonzero(np.any(np.abs(arr) > 0, axis=1))[0]
        dense = arr.nbytes
        idx_type = 5123 if acc['count'] < 65536 else 5125
        idx = nz.astype('<u2' if idx_type == 5123 else '<u4')
        if len(nz) == 0:  # 仕様上、少なくとも1つは必要
            nz = np.array([0]); idx = nz.astype('<u2' if idx_type == 5123 else '<u4')
        vals = arr[nz].astype('<f4')
        if idx.nbytes + vals.nbytes < dense:
            iv = add_view(idx.tobytes())
            vv = add_view(vals.tobytes())
            acc.pop('bufferView'); acc.pop('byteOffset', None)
            acc['sparse'] = {'count': int(len(nz)), 'indices': {'bufferView': iv, 'componentType': idx_type}, 'values': {'bufferView': vv}}
            acc['min'] = [float(x) for x in arr.min(axis=0)]
            acc['max'] = [float(x) for x in arr.max(axis=0)]
            saved_sparse += dense - idx.nbytes - vals.nbytes
            continue
    # そのまま詰め直す(ストライドは解消)
    arr = accessor_array(ai)
    old_view = j['bufferViews'][acc['bufferView']]
    acc['bufferView'] = add_view(np.ascontiguousarray(arr).tobytes(), old_view.get('target'))
    acc['byteOffset'] = 0

# テクスチャ
def limit(name):
    if name == 'Thumbnail':
        return 256
    if name and name.endswith('_nml'):
        return 512
    return 1024

for im in j.get('images', []):
    data = view_bytes(im['bufferView'])
    if do_tex:
        from PIL import Image
        pi = Image.open(io.BytesIO(data))
        m = limit(im.get('name', ''))
        if max(pi.size) > m:
            s = m / max(pi.size)
            pi = pi.resize((max(1, round(pi.size[0] * s)), max(1, round(pi.size[1] * s))), Image.LANCZOS)
        o = io.BytesIO(); pi.save(o, 'PNG', optimize=True)
        if len(o.getvalue()) < len(data):
            data = o.getvalue(); im['mimeType'] = 'image/png'
    im['bufferView'] = add_view(data)

# 参照されていないアクセサは中身を空にできないので、そのまま残す(どこからも使われない)
for ai, acc in enumerate(j['accessors']):
    if ai not in used_acc and 'bufferView' in acc and 'sparse' not in acc and acc['bufferView'] < len(j['bufferViews']) and not acc.get('_done'):
        arr = accessor_array(ai)
        acc['bufferView'] = add_view(np.ascontiguousarray(arr).tobytes())
        acc['byteOffset'] = 0

j['bufferViews'] = new_views
while len(out) % 4:
    out.append(0)
j['buffers'] = [{'byteLength': len(out)}]

js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode('utf8')
while len(js) % 4:
    js += b' '
total = 12 + 8 + len(js) + 8 + len(out)
res = struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(res)
print(f'{len(b):,} -> {len(res):,} bytes (sparse morphs saved {saved_sparse:,})')
